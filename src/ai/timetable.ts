import { DB } from '../data/types'
import { aiKey } from './key'
import { fetchWithTimeout } from './net'

export const THINKING_MODEL = 'openai/gpt-4o'
export const TIMETABLE_FALLBACK_MODEL = 'openai/gpt-4o-mini'
const HACK_CLUB_AI_URL = 'https://ai.hackclub.com/proxy/v1/chat/completions'

export interface TimetableGenOptions {
  classId: string
  days: number            // school days per week: 5, 6 or 7
  periodsPerDay: number
  periodMinutes: number
  startTime: string       // "HH:MM"
  breakAfter: number      // break after this period; 0 = no break
  breakMinutes: number
  lunchAfter: number      // lunch after this period; 0 = no lunch
  lunchMinutes: number
  zeroPeriod?: boolean    // period 0 homeroom: class teacher sits in the class
  extraInfo: string       // free-form extra requirements
}

export interface GeneratedSlot {
  day: number
  period: number
  subjectId: string
  teacherId: string
}

export interface TimetableConflict {
  day: number
  period: number
  subjectId: string
  subjectName: string
  reason: string
  candidates: { id: string; name: string }[]
}

export interface TimetableGenResult {
  slots: GeneratedSlot[]
  issues: string[]
  conflicts: TimetableConflict[]
  source: 'ai' | 'local'
  error?: string
}

const hhmm = (mins: number) => `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`

/** Wall-clock times per period, honouring the zero period and break/lunch after the chosen periods. */
export function timesFor(opts: TimetableGenOptions): { periodStart: number; periodEnd: number }[] {
  const [h0, m0] = opts.startTime.split(':').map(Number)
  let cursor = (h0 || 9) * 60 + (m0 || 0)
  if (opts.zeroPeriod) cursor += opts.periodMinutes
  const out: { periodStart: number; periodEnd: number }[] = []
  for (let p = 1; p <= opts.periodsPerDay; p++) {
    const start = cursor
    cursor += opts.periodMinutes
    const end = cursor
    if (opts.breakAfter === p && opts.breakMinutes > 0) cursor += opts.breakMinutes
    if (opts.lunchAfter === p && opts.lunchMinutes > 0) cursor += opts.lunchMinutes
    out.push({ periodStart: start, periodEnd: end })
  }
  return out
}

function extractJSON(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const candidate = fenced ? fenced[1] : text
  const start = candidate.indexOf('{')
  if (start === -1) throw new Error('No JSON object found in response')
  for (let i = candidate.length - 1; i >= start; i--) {
    if (candidate[i] !== '}') continue
    try {
      return JSON.parse(candidate.slice(start, i + 1))
    } catch {
      // trailing garbage — try the next earlier '}'
    }
  }
  throw new Error('JSON object is malformed')
}

interface GenContext {
  classSubjects: DB['subjects']
  teachers: { id: string; name: string; teaches: string[] }[]
  busy: Map<string, boolean>   // key `${day}|${period}|${teacherId}` — teacher already in another class
  maxPerDay: number            // max periods per teacher per day
  days: number
  periodsPerDay: number
}

/** Resolve raw AI rows to slots, dropping garbage rows and reporting problems. */
function normalizeRows(rows: unknown, ctx: GenContext, notes: string[]): GeneratedSlot[] {
  if (!Array.isArray(rows)) {
    notes.push('AI output was not a list of periods — rebuilding from the local planner.')
    return []
  }
  const valid = new Set(ctx.classSubjects.map((s) => s.id))
  const nameToSubject = new Map(ctx.classSubjects.map((s) => [s.name, s.id]))
  const nameToTeacher = new Map(ctx.teachers.map((t) => [t.name, t.id]))
  const slots: GeneratedSlot[] = []
  const seen = new Set<string>()

  for (const r of rows as Record<string, unknown>[]) {
    const day = Number(r.day)
    const period = Number(r.period)
    const subject = nameToSubject.get(String(r.subject ?? '')) ?? String(r.subjectId ?? '')
    const teacherId = nameToTeacher.get(String(r.teacher ?? '')) ?? String(r.teacherId ?? '')
    if (!Number.isInteger(day) || day < 0 || day >= ctx.days) continue
    if (!Number.isInteger(period) || period < 1 || period > ctx.periodsPerDay) continue
    if (!valid.has(subject)) continue
    const key = `${day}|${period}`
    if (seen.has(key)) {
      notes.push(`Duplicate slot day ${day} period ${period} — kept the first.`)
      continue
    }
    seen.add(key)
    slots.push({ day, period, subjectId: subject, teacherId })
  }
  return slots
}

/** Find slots with no assignable teacher and offer who could take them. */
function collectConflicts(slots: GeneratedSlot[], ctx: GenContext): TimetableConflict[] {
  const out: TimetableConflict[] = []
  for (const s of slots) {
    if (s.teacherId) continue
    const subject = ctx.classSubjects.find((x) => x.id === s.subjectId)
    const candidates = ctx.teachers
      .filter((t) => subject && t.teaches.includes(subject.name))
      .filter((t) => !ctx.busy.get(`${s.day}|${s.period}|${t.id}`))
      .map((t) => ({ id: t.id, name: t.name }))
    out.push({
      day: s.day, period: s.period,
      subjectId: s.subjectId, subjectName: subject?.name ?? s.subjectId,
      reason: candidates.length
        ? 'No teacher is free for this subject at this time — its teachers are already teaching other classes.'
        : 'No teacher teaches this subject yet — assign one below or add a teacher first.',
      candidates,
    })
  }
  return out
}

/** Pick the best teacher for a subject at a given slot, honouring busy + per-day caps. Returns '' if none free. */
function pickTeacher(subjectId: string, day: number, period: number, ctx: GenContext, used: Map<string, number>): string {
  const subject = ctx.classSubjects.find((s) => s.id === subjectId)
  if (!subject) return ''
  const candidates = ctx.teachers.filter((t) => t.teaches.includes(subject.name))
  const free = candidates.filter((t) => !ctx.busy.get(`${day}|${period}|${t.id}`))
  if (!free.length) return ''
  const byLoad = [...free].sort((a, b) => (used.get(a.id) ?? 0) - (used.get(b.id) ?? 0))
  return byLoad[0].id
}

/** Fix teacher conflicts/unknowns on an existing grid; return the repaired slots. */
function repairTeachers(slots: GeneratedSlot[], ctx: GenContext, notes: string[]): GeneratedSlot[] {
  const used = new Map<string, number>() // teacherId -> periods assigned this run
  const perDay = new Map<string, Map<number, number>>() // teacherId -> day -> count
  const out: GeneratedSlot[] = []
  for (const s of slots) {
    let teacherId = s.teacherId
    const known = ctx.teachers.some((t) => t.id === teacherId)
    if (!teacherId || !known) {
      notes.push(`Day ${s.day} period ${s.period}: no valid teacher for ${ctx.classSubjects.find((x) => x.id === s.subjectId)?.name ?? s.subjectId} — assigning one.`)
      teacherId = pickTeacher(s.subjectId, s.day, s.period, ctx, used)
    } else if (ctx.busy.get(`${s.day}|${s.period}|${teacherId}`)) {
      notes.push(`Day ${s.day} period ${s.period}: teacher busy in another class — reassigned.`)
      teacherId = pickTeacher(s.subjectId, s.day, s.period, ctx, used)
    } else if ((perDay.get(teacherId)?.get(s.day) ?? 0) >= ctx.maxPerDay) {
      notes.push(`Day ${s.day} period ${s.period}: teacher already has ${ctx.maxPerDay} periods that day — reassigned.`)
      teacherId = pickTeacher(s.subjectId, s.day, s.period, ctx, used)
    }
    if (teacherId) {
      const dayCounts = perDay.get(teacherId) ?? new Map<number, number>()
      dayCounts.set(s.day, (dayCounts.get(s.day) ?? 0) + 1)
      perDay.set(teacherId, dayCounts)
      used.set(teacherId, (used.get(teacherId) ?? 0) + 1)
    }
    out.push({ ...s, teacherId })
  }
  return out
}

/** Fill every missing day×period cell from the local planner so the grid is always complete. */
function completeGrid(slots: GeneratedSlot[], ctx: GenContext, opts: TimetableGenOptions, notes: string[]): GeneratedSlot[] {
  const grid = new Map<string, GeneratedSlot>()
  for (const s of slots) grid.set(`${s.day}|${s.period}`, s)
  const filled: GeneratedSlot[] = []
  for (let d = 0; d < opts.days; d++) {
    for (let p = 1; p <= opts.periodsPerDay; p++) {
      const existing = grid.get(`${d}|${p}`)
      if (existing) {
        filled.push(existing)
        continue
      }
      notes.push(`Day ${d} period ${p} was missing — filled from the local planner.`)
      const sid = ctx.classSubjects[(p - 1) % ctx.classSubjects.length]?.id ?? ctx.classSubjects[0]?.id ?? ''
      if (!sid) continue
      filled.push({ day: d, period: p, subjectId: sid, teacherId: pickTeacher(sid, d, p, ctx, new Map()) })
    }
  }
  return repairTeachers(filled, ctx, notes)
}

/** Build a complete local grid (used when the AI is unreachable). */
function buildLocal(ctx: GenContext, opts: TimetableGenOptions): GeneratedSlot[] {
  return completeGrid([], ctx, opts, [])
}

/** Ask the model to build a weekly timetable for one class. */
export async function generateClassTimetable(db: DB, opts: TimetableGenOptions): Promise<TimetableGenResult> {
  const key = aiKey()
  const cls = db.classes.find((c) => c.id === opts.classId)
  const classSubjects = (cls?.subjectIds ?? [])
    .map((sid) => db.subjects.find((s) => s.id === sid))
    .filter(Boolean) as DB['subjects']
  const teachers = db.teachers.map((t) => ({
    id: t.id,
    name: db.users.find((u) => u.id === t.userId)?.name ?? t.id,
    teaches: t.subjectIds.map((sid) => db.subjects.find((s) => s.id === sid)?.name ?? ''),
  }))
  const otherClassesBusy = db.timetable
    .filter((e) => e.classId !== opts.classId)
    .map((e) => {
      const c = db.classes.find((x) => x.id === e.classId)
      return { day: e.day, period: e.period, teacherId: e.teacherId, className: c ? `${c.name} ${c.section}` : '?' }
    })
  const busy = new Map<string, boolean>()
  for (const e of otherClassesBusy) busy.set(`${e.day}|${e.period}|${e.teacherId}`, true)

  const ctx: GenContext = { classSubjects, teachers, busy, maxPerDay: Math.max(1, opts.periodsPerDay - 2), days: opts.days, periodsPerDay: opts.periodsPerDay }

  const classTeacher = cls ? db.teachers.find((t) => t.classTeacherOfIds.includes(cls.id) || t.id === cls.classTeacherId) : undefined
  const classTeacherName = classTeacher ? db.users.find((u) => u.id === classTeacher.userId)?.name ?? classTeacher.id : null

  const context = JSON.stringify({
    task: `Build the weekly timetable for class ${cls ? `${cls.name} ${cls.section}` : opts.classId}.`,
    class_subjects: classSubjects.map((s) => ({ id: s.id, name: s.name })),
    teachers: teachers.map((t) => ({ id: t.id, name: t.name, teaches: t.teaches })),
    schedule: {
      school_days_per_week: opts.days,
      days_of_week: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].slice(0, opts.days),
      zero_period: opts.zeroPeriod
        ? { enabled: true, minutes: opts.periodMinutes, starts_at: opts.startTime, class_teacher_name: classTeacherName }
        : { enabled: false },
      periods_per_day: opts.periodsPerDay,
      period_minutes: opts.periodMinutes,
      start_time: opts.startTime,
      break_after_period: opts.breakAfter || null,
      break_minutes: opts.breakMinutes,
      lunch_after_period: opts.lunchAfter || null,
      lunch_minutes: opts.lunchMinutes,
    },
    teachers_already_busy_in_other_classes: otherClassesBusy,
    extra_requirements: opts.extraInfo || '(none)',
  }, null, 1)

  const system = 'You are a meticulous school timetable planner. You reason through constraints step by step and output strict JSON. Never invent subjects or teachers that are not in the provided context.'

  const user = `Below is the exact context. Build a conflict-free weekly timetable for the class.

RULES — STRICT:
1. Every school day (day 0..days_of_week-1) must have exactly periods_per_day periods numbered 1..periods_per_day. No gaps, no missing periods.
2. Every period must use one of the class_subjects and a teacher whose teaches list contains that subject name.
3. A teacher must NEVER teach two classes at the same day+period (check teachers_already_busy_in_other_classes). Within the class itself a teacher may teach at most ${Math.max(1, opts.periodsPerDay - 2)} periods in one day (periods_per_day minus 2), so every teacher keeps at least 2 free periods each day. Spread assigned periods out.
4. Keep subjects balanced: no subject more than 2 periods a day; spread subjects evenly across the week (a core subject roughly 4-5 times a week when there are 6+ periods a day, less for minor subjects).
5. Honour extra_requirements exactly — they override the balance rules (e.g. "EVS every day first period").
6. ZERO PERIOD: when schedule.zero_period.enabled is true, every day starts with a period 0 (homeroom) where the class teacher (schedule.zero_period.class_teacher_name) sits in the class with the students. Do NOT include period 0 in the timetable array — it is not scheduled and the class teacher is NOT double-booked by it. Period 1 is the first scheduled period and starts after the zero period ends.
7. Think carefully — reason step by step about every constraint before outputting.
8. Output ONLY a single JSON object with exactly this shape:
{"timetable":[{"day":0,"period":1,"subject":"Mathematics","teacher":"Rajesh Mehta"}],"notes":["optional short notes"]}
day is 0-based (0=Monday). subject and teacher must use the exact names from the context.

Context:\n${context}`

  const ask = (messages: { role: string; content: string }[], model: string, temp: number, maxTokens: number) =>
    fetchWithTimeout(HACK_CLUB_AI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model, messages, temperature: temp, max_tokens: maxTokens, response_format: { type: 'json_object' } }),
    }, 150000)

  if (key) {
    const issues: string[] = []
    try {
      let res = await ask([{ role: 'system', content: system }, { role: 'user', content: user }], THINKING_MODEL, 0.3, 6000)
      if (!res.ok) {
        const errText = (await res.text()).slice(0, 200)
        console.warn('Timetable AI primary model failed:', errText)
        res = await ask([{ role: 'system', content: system }, { role: 'user', content: user }], TIMETABLE_FALLBACK_MODEL, 0.3, 6000)
      }
      if (res.ok) {
        const data = (await res.json()) as { choices?: { message?: { content?: string }; finish_reason?: string }[] }
        const content = data?.choices?.[0]?.message?.content
        const truncated = data?.choices?.[0]?.finish_reason === 'length'
        if (content) {
          try {
            const parsed = extractJSON(content) as { timetable?: unknown; notes?: unknown }
            const notes = Array.isArray(parsed.notes) ? parsed.notes.map((n) => String(n).slice(0, 200)) : []
            const rows = normalizeRows(parsed.timetable, ctx, notes)
            const repaired = completeGrid(rows, ctx, opts, notes)
            issues.push(...notes)
            if (repaired.length) return { slots: repaired, issues, conflicts: collectConflicts(repaired, ctx), source: 'ai' }
          } catch (e) {
            issues.push(truncated
              ? 'AI response was cut off (output limit) — asking for a more compact answer.'
              : `AI response could not be parsed (${String(e).slice(0, 100)}) — trying a self-correction.`)
            let lastContent = content
            for (let attempt = 0; attempt < 2; attempt++) {
              try {
                const retry = await ask([
                  { role: 'system', content: system },
                  { role: 'user', content: user },
                  { role: 'assistant', content: lastContent.slice(0, 12000) },
                  { role: 'user', content: (truncated
                    ? 'Your previous response was cut off before it was complete.'
                    : `That response was invalid (${String(e).slice(0, 120)}).`) + ' Re-check every constraint and output ONLY the JSON object again, complete for all ' + `${opts.days} days x ${opts.periodsPerDay} periods, keeping it compact (no extra prose).` },
                ], THINKING_MODEL, 0.2, 6000)
                if (!retry.ok) break
                const data2 = (await retry.json()) as { choices?: { message?: { content?: string } }[] }
                const content2 = data2?.choices?.[0]?.message?.content
                if (!content2) break
                lastContent = content2
                const parsed2 = extractJSON(content2) as { timetable?: unknown; notes?: unknown }
                const notes2 = Array.isArray(parsed2.notes) ? parsed2.notes.map((n) => String(n).slice(0, 200)) : []
                const rows2 = normalizeRows(parsed2.timetable, ctx, notes2)
                const repaired2 = completeGrid(rows2, ctx, opts, notes2)
                issues.push(...notes2)
                if (repaired2.length) return { slots: repaired2, issues, conflicts: collectConflicts(repaired2, ctx), source: 'ai' }
              } catch {
                break
              }
            }
          }
        }
      }
    } catch (e) {
      issues.push(`AI service error: ${String(e).slice(0, 100)}`)
    }
    // AI never produced a usable grid — repair any rows we kept, else use the local planner.
    const fallback = buildLocal(ctx, opts)
    return {
      slots: fallback,
      issues,
      conflicts: collectConflicts(fallback, ctx),
      source: 'local',
      error: 'AI timetable service unavailable — showing a basic fallback timetable.',
    }
  }

  const fallback = buildLocal(ctx, opts)
  return {
    slots: fallback,
    issues: [],
    conflicts: collectConflicts(fallback, ctx),
    source: 'local',
    error: 'Set EXPO_PUBLIC_HACK_CLUB_AI_KEY to use AI timetable generation.',
  }
}

/** Convert generated slots into full timetable entries with wall-clock times. */
export function slotsToEntries(slots: GeneratedSlot[], opts: TimetableGenOptions): Omit<import('../data/types').TimetableEntry, 'id'>[] {
  const times = timesFor(opts)
  return slots.map((s) => ({
    classId: opts.classId,
    subjectId: s.subjectId,
    teacherId: s.teacherId,
    day: s.day,
    period: s.period,
    startTime: hhmm(times[s.period - 1]?.periodStart ?? 0),
    endTime: hhmm(times[s.period - 1]?.periodEnd ?? 0),
  }))
}
