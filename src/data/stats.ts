import { DB, Student, Mark, Assessment, AttendanceRecord } from './types'
import { parseISO, addDays, todayISO, daysBetween, formatMonthYear } from '../utils/date'

export const pct = (score: number, max: number) => (max > 0 ? (score / max) * 100 : 0)

export function gradeFor(p: number): { grade: string; points: number } {
  if (p >= 90) return { grade: 'A+', points: 10 }
  if (p >= 80) return { grade: 'A', points: 9 }
  if (p >= 70) return { grade: 'B+', points: 8 }
  if (p >= 60) return { grade: 'B', points: 7 }
  if (p >= 50) return { grade: 'C+', points: 6 }
  if (p >= 40) return { grade: 'C', points: 5 }
  if (p >= 33) return { grade: 'D', points: 4 }
  return { grade: 'E', points: 3 }
}

export function userOf(db: DB, userId: string) {
  return db.users.find((u) => u.id === userId)
}

export function studentOf(db: DB, studentId: string): Student | undefined {
  return db.students.find((s) => s.id === studentId)
}

export function studentByUser(db: DB, userId: string): Student | undefined {
  const u = userOf(db, userId)
  if (!u || u.role !== 'student') return undefined
  return db.students.find((s) => s.userId === userId)
}

export function teacherOf(db: DB, userId: string) {
  return db.teachers.find((t) => t.userId === userId)
}

export function parentOf(db: DB, userId: string) {
  return db.parents.find((p) => p.userId === userId)
}

export function linkedChildren(db: DB, parentId: string): Student[] {
  const links = db.parentLinks.filter((l) => l.parentId === parentId)
  return links
    .map((l) => db.students.find((s) => s.id === l.studentId))
    .filter((s): s is Student => !!s)
}

export function studentName(db: DB, studentId: string): string {
  const s = studentOf(db, studentId)
  return s ? (userOf(db, s.userId)?.name ?? 'Student') : 'Student'
}

export function className(db: DB, classId: string): string {
  const c = db.classes.find((c) => c.id === classId)
  return c ? `${c.name} ${c.section}` : '—'
}

export function classOf(db: DB, studentId: string) {
  const s = studentOf(db, studentId)
  return s ? db.classes.find((c) => c.id === s.classId) : undefined
}

// ---------------- Marks & performance ----------------

export function marksFor(db: DB, studentId: string, subjectId?: string): Mark[] {
  return db.marks.filter((m) => {
    if (m.studentId !== studentId) return false
    if (subjectId) {
      const a = db.assessments.find((x) => x.id === m.assessmentId)
      if (!a || a.subjectId !== subjectId) return false
    }
    return true
  })
}

export function assessmentOf(db: DB, mark: Mark): Assessment | undefined {
  return db.assessments.find((a) => a.id === mark.assessmentId)
}

/** chronological series of {date, pct, title} */
export function subjectSeries(db: DB, studentId: string, subjectId: string) {
  return marksFor(db, studentId, subjectId)
    .map((m) => ({ mark: m, asm: assessmentOf(db, m)! }))
    .filter((x) => x.asm)
    .sort((a, b) => a.asm.date.localeCompare(b.asm.date))
    .map((x) => ({ date: x.asm.date, title: x.asm.title, pct: Math.round(pct(x.mark.score, x.asm.maxMarks)), max: x.asm.maxMarks, score: x.mark.score }))
}

/** overall average % across all marked assessments */
export function overallAvg(db: DB, studentId: string, sinceDays?: number): number | null {
  const list = marksFor(db, studentId)
    .map((m) => ({ mark: m, asm: assessmentOf(db, m)! }))
    .filter((x) => x.asm)
    .filter((x) => !sinceDays || daysBetween(x.asm.date, todayISO()) <= sinceDays)
  if (!list.length) return null
  const total = list.reduce((acc, x) => acc + pct(x.mark.score, x.asm.maxMarks), 0)
  return total / list.length
}

/** chronological overall % series across all subjects (weighted by max marks per assessment) */
export function overallTrend(db: DB, studentId: string) {
  const marks = marksFor(db, studentId)
    .map((m) => ({ mark: m, asm: assessmentOf(db, m)! }))
    .filter((x) => x.asm)
    .sort((a, b) => a.asm.date.localeCompare(b.asm.date))
  const byDate = new Map<string, { total: number; max: number }>()
  for (const { mark, asm } of marks) {
    const cur = byDate.get(asm.date) ?? { total: 0, max: 0 }
    cur.total += mark.score
    cur.max += asm.maxMarks
    byDate.set(asm.date, cur)
  }
  const series = [...byDate.entries()]
    .map(([date, v]) => ({
      date,
      title: date.slice(5),
      pct: v.max ? Math.round((v.total / v.max) * 100) : 0,
      value: v.max ? Math.round((v.total / v.max) * 100) : 0,
      shortLabel: date.slice(5, 7) + '/' + date.slice(8, 10),
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
  const delta = series.length >= 2 ? series[series.length - 1].pct - series[0].pct : 0
  const dir = delta > 3 ? 'improving' : delta < -3 ? 'declining' : 'stable'
  return { series, dir, delta, latest: series.length ? series[series.length - 1].pct : null }
}

export function subjectAvg(db: DB, studentId: string, subjectId: string, sinceDays?: number): number | null {
  const series = subjectSeries(db, studentId, subjectId)
    .filter((x) => !sinceDays || daysBetween(x.date, todayISO()) <= sinceDays)
  if (!series.length) return null
  return series.reduce((a, x) => a + x.pct, 0) / series.length
}

/** direction from recent vs earlier halves; returns 'improving' | 'declining' | 'stable' + delta */
export function subjectTrend(db: DB, studentId: string, subjectId: string) {
  const series = subjectSeries(db, studentId, subjectId)
  if (series.length < 2) return { dir: 'stable' as const, delta: 0, recent: null, prev: null }
  const half = Math.floor(series.length / 2)
  const prev = series.slice(0, half)
  const recent = series.slice(half)
  const avg = (l: typeof series) => l.reduce((a, x) => a + x.pct, 0) / l.length
  const prevAvg = avg(prev)
  const recentAvg = avg(recent)
  const delta = Math.round((recentAvg - prevAvg) * 10) / 10
  const dir = delta > 3 ? 'improving' : delta < -3 ? 'declining' : 'stable'
  return { dir, delta, recent: Math.round(recentAvg), prev: Math.round(prevAvg) }
}

export function strengthMap(db: DB, studentId: string): { subjectId: string; name: string; color: string; avg: number; dir: string; delta: number }[] {
  const s = studentOf(db, studentId)
  if (!s) return []
  const cls = classOf(db, studentId)!
  return cls.subjectIds
    .map((sid) => {
      const subj = db.subjects.find((x) => x.id === sid)!
      const avg = subjectAvg(db, studentId, sid)
      const t = subjectTrend(db, studentId, sid)
      return { subjectId: sid, name: subj.name, color: subj.color, avg: avg ?? 0, dir: t.dir, delta: t.delta }
    })
    .sort((a, b) => b.avg - a.avg)
}

// ---------------- Attendance ----------------

export function attendanceStats(db: DB, studentId: string, subjectId?: string, sinceDays?: number) {
  const recs = db.attendance.filter((r) => {
    if (r.studentId !== studentId) return false
    if (subjectId && r.subjectId !== subjectId) return false
    if (sinceDays && daysBetween(r.date, todayISO()) > sinceDays) return false
    return true
  })
  const present = recs.filter((r) => r.status === 'present').length
  const absent = recs.filter((r) => r.status === 'absent').length
  const late = recs.filter((r) => r.status === 'late').length
  const total = recs.length
  const p = total ? ((present + late) / total) * 100 : 100
  return { present, absent, late, total, pct: Math.round(p) }
}

export function attendanceBySubject(db: DB, studentId: string) {
  const s = studentOf(db, studentId)
  if (!s) return []
  const cls = classOf(db, studentId)!
  return cls.subjectIds.map((sid) => {
    const subj = db.subjects.find((x) => x.id === sid)!
    return { subjectId: sid, name: subj.name, color: subj.color, ...attendanceStats(db, studentId, sid) }
  })
}

export function monthlyAttendance(db: DB, studentId: string) {
  const map = new Map<string, AttendanceRecord[]>()
  for (const r of db.attendance.filter((r) => r.studentId === studentId)) {
    const key = r.date.slice(0, 7)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(r)
  }
  return [...map.entries()].sort().map(([key, recs]) => {
    const present = recs.filter((r) => r.status !== 'absent').length
    return { month: formatMonthYear(key), pct: Math.round((present / recs.length) * 100) }
  })
}

// ---------------- Assignments ----------------

export function assignmentStats(db: DB, studentId: string) {
  const subs = db.submissions.filter((s) => s.studentId === studentId)
  const submitted = subs.filter((s) => s.status === 'submitted').length
  const missing = subs.filter((s) => s.status === 'missing').length
  const pending = subs.filter((s) => s.status === 'pending').length
  const total = subs.length
  const overdue = subs.filter((s) => {
    const a = db.assignments.find((x) => x.id === s.assignmentId)!
    return a && s.status !== 'submitted' && a.dueDate < todayISO()
  }).length
  return { total, submitted, missing, pending, overdue, completion: total ? Math.round((submitted / total) * 100) : 100 }
}

export function studentAssignments(db: DB, studentId: string) {
  return db.submissions
    .filter((s) => s.studentId === studentId)
    .map((s) => {
      const a = db.assignments.find((x) => x.id === s.assignmentId)!
      const subj = db.subjects.find((x) => x.id === a.subjectId)!
      return { ...s, assignment: a, subject: subj }
    })
    .sort((a, b) => a.assignment.dueDate.localeCompare(b.assignment.dueDate))
}

// ---------------- Class analytics ----------------

export function classAverage(db: DB, classId: string, subjectId?: string): number | null {
  const students = db.students.filter((s) => s.classId === classId)
  const avgs = students
    .map((s) => (subjectId ? subjectAvg(db, s.id, subjectId) : overallAvg(db, s.id)))
    .filter((v): v is number => v !== null)
  if (!avgs.length) return null
  return Math.round((avgs.reduce((a, b) => a + b, 0) / avgs.length) * 10) / 10
}

export function assessmentClassStats(db: DB, assessmentId: string) {
  const marks = db.marks.filter((m) => m.assessmentId === assessmentId)
  const asm = db.assessments.find((a) => a.id === assessmentId)!
  const pcts = marks.map((m) => pct(m.score, asm.maxMarks)).sort((a, b) => a - b)
  if (!pcts.length) return null
  const sum = pcts.reduce((a, b) => a + b, 0)
  const avg = sum / pcts.length
  const median = pcts.length % 2 ? pcts[Math.floor(pcts.length / 2)] : (pcts[pcts.length / 2 - 1] + pcts[pcts.length / 2]) / 2
  const buckets = [0, 0, 0, 0, 0]
  for (const p of pcts) {
    if (p < 40) buckets[0]++
    else if (p < 55) buckets[1]++
    else if (p < 70) buckets[2]++
    else if (p < 85) buckets[3]++
    else buckets[4]++
  }
  return {
    avg: Math.round(avg * 10) / 10,
    median: Math.round(median * 10) / 10,
    min: Math.round(pcts[0]),
    max: Math.round(pcts[pcts.length - 1]),
    count: pcts.length,
    buckets, // <40, <55, <70, <85, 85+
    pcts,
  }
}

export function classPulse(db: DB, classId: string) {
  const students = db.students.filter((s) => s.classId === classId)
  const result = { improving: 0, stable: 0, declining: 0, avg: classAverage(db, classId) ?? 0 }
  for (const s of students) {
    const overall = overallAvg(db, s.id)
    if (overall === null) continue
    const subj = strengthMap(db, s.id)[0]
    const dir = subj ? subj.dir : 'stable'
    if (dir === 'improving') result.improving++
    else if (dir === 'declining') result.declining++
    else result.stable++
  }
  return result
}

export function classSubjectAverage(db: DB, classId: string) {
  const cls = db.classes.find((c) => c.id === classId)!
  return cls.subjectIds
    .map((sid) => {
      const subj = db.subjects.find((x) => x.id === sid)!
      const avg = classAverage(db, classId, sid)
      const prev = classAverageBefore(db, classId, sid)
      return { subjectId: sid, name: subj.name, color: subj.color, avg: avg ?? 0, delta: Math.round(((avg ?? 0) - (prev ?? avg ?? 0)) * 10) / 10 }
    })
    .sort((a, b) => b.avg - a.avg)
}

function classAverageBefore(db: DB, classId: string, subjectId: string, days = 14): number | null {
  const students = db.students.filter((s) => s.classId === classId)
  const avgs = students
    .map((s) => {
      const series = subjectSeries(db, s.id, subjectId).filter((x) => daysBetween(x.date, todayISO()) > days)
      if (!series.length) return null
      return series.reduce((a, x) => a + x.pct, 0) / series.length
    })
    .filter((v): v is number => v !== null)
  return avgs.length ? avgs.reduce((a, b) => a + b, 0) / avgs.length : null
}

// ---------------- "What changed?" detection ----------------

export interface Change {
  subjectId: string
  subjectName: string
  color: string
  prev: number
  recent: number
  delta: number
  significant: boolean
  attendanceDelta: number
}

export function detectStudentChanges(db: DB, studentId: string): Change[] {
  const s = studentOf(db, studentId)
  if (!s) return []
  const cls = classOf(db, studentId)!
  const out: Change[] = []
  for (const sid of cls.subjectIds) {
    const t = subjectTrend(db, studentId, sid)
    if (!t.recent || !t.prev) continue
    const subj = db.subjects.find((x) => x.id === sid)!
    const attCur = attendanceStats(db, studentId, sid, 14).pct
    const attPrev = attendanceStats(db, studentId, sid, 28).pct
    out.push({
      subjectId: sid, subjectName: subj.name, color: subj.color,
      prev: t.prev, recent: t.recent, delta: t.delta,
      significant: Math.abs(t.delta) >= 6,
      attendanceDelta: attCur - attPrev,
    })
  }
  return out.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
}

export function whatChangedClass(db: DB, classId: string) {
  const cls = db.classes.find((c) => c.id === classId)!
  return cls.subjectIds.map((sid) => {
    const subj = db.subjects.find((x) => x.id === sid)!
    const cur = classAverage(db, classId, sid) ?? 0
    const prev = classAverageBefore(db, classId, sid)
    const delta = prev === null ? 0 : Math.round((cur - prev) * 10) / 10
    return { subjectId: sid, name: subj.name, color: subj.color, avg: cur, delta, dir: delta > 2 ? 'improving' : delta < -2 ? 'declining' : 'stable' }
  })
}

export function whatChangedSchool(db: DB) {
  return db.classes.map((cls) => {
    const cur = classAverage(db, cls.id) ?? 0
    const prev = classAverageBefore(db, cls.id, cls.subjectIds[0])
    const delta = prev === null ? 0 : Math.round((cur - prev) * 10) / 10
    return { classId: cls.id, className: `${cls.name} ${cls.section}`, avg: cur, delta, dir: delta > 2 ? 'improving' : delta < -2 ? 'declining' : 'stable' }
  })
}

// ---------------- Early warning flags (deterministic rules) ----------------

export interface WarningFlag {
  studentId: string
  level: 'attention' | 'urgent'
  reasons: string[]
  score: number
  suggestion: string
}

export function earlyWarningFlags(db: DB, classId?: string): WarningFlag[] {
  const students = db.students.filter((s) => !classId || s.classId === classId)
  const flags: WarningFlag[] = []
  for (const s of students) {
    const reasons: string[] = []
    let score = 0
    for (const ch of detectStudentChanges(db, s.id)) {
      if (ch.delta <= -8) { reasons.push(`${ch.subjectName} declined ${Math.abs(ch.delta)} points`); score += 2 }
      else if (ch.delta <= -5) { reasons.push(`${ch.subjectName} declined ${Math.abs(ch.delta)} points`); score += 1 }
    }
    const overall = overallAvg(db, s.id)
    if (overall !== null && overall < 50) { reasons.push(`Overall average ${Math.round(overall)}%`); score += 1 }
    const att = attendanceStats(db, s.id)
    if (att.pct < 80) { reasons.push(`Attendance ${att.pct}%`); score += 2 }
    else if (att.pct < 88) { reasons.push(`Attendance ${att.pct}%`); score += 1 }
    const asg = assignmentStats(db, s.id)
    if (asg.missing >= 3) { reasons.push(`${asg.missing} assignments missed`); score += 2 }
    else if (asg.missing >= 1) { reasons.push(`${asg.missing} assignment missed`); score += 1 }
    if (score >= 3) {
      flags.push({
        studentId: s.id,
        level: score >= 5 ? 'urgent' : 'attention',
        reasons, score,
        suggestion: pickSuggestion(reasons, db, s),
      })
    }
  }
  return flags.sort((a, b) => b.score - a.score)
}

function pickSuggestion(reasons: string[], db: DB, s: Student): string {
  const hasAtt = reasons.some((r) => r.includes('Attendance'))
  const hasDecline = reasons.some((r) => r.includes('declined'))
  const hasMissing = reasons.some((r) => r.includes('assignment'))
  if (hasDecline && hasAtt) return 'Review recent attendance and create a short revision intervention for the declining subject.'
  if (hasDecline) return 'Create a focused revision intervention and schedule a short follow-up assessment.'
  if (hasMissing) return 'Follow up on missed assignments and check for scheduling conflicts.'
  if (hasAtt) return 'Discuss attendance with the student and guardian; monitor over the next two weeks.'
  return 'Schedule a check-in with the student and review recent academic activity.'
}

// ---------------- Timeline ----------------

export interface TimelineEvent {
  id: string
  date: string
  title: string
  detail: string
  kind: 'assessment' | 'assignment' | 'attendance' | 'intervention' | 'shift' | 'result' | 'notification'
}

export function academicTimeline(db: DB, studentId: string, limit = 30): TimelineEvent[] {
  const events: TimelineEvent[] = []
  for (const m of marksFor(db, studentId)) {
    const asm = assessmentOf(db, m)!
    const subj = db.subjects.find((x) => x.id === asm.subjectId)
    events.push({ id: m.id, date: asm.date, title: `${subj?.name ?? ''} ${asm.title}`.trim(), detail: `${Math.round(pct(m.score, asm.maxMarks))}% (${m.score}/${asm.maxMarks})`, kind: 'assessment' })
  }
  for (const s of db.submissions.filter((s) => s.studentId === studentId && s.status === 'submitted')) {
    const a = db.assignments.find((x) => x.id === s.assignmentId)!
    const subj = db.subjects.find((x) => x.id === a.subjectId)!
    events.push({ id: s.id, date: s.submittedAt ?? a.dueDate, title: `${subj.name} assignment submitted`, detail: a.title, kind: 'assignment' })
  }
  for (const ch of detectStudentChanges(db, studentId)) {
    if (ch.significant) {
      const date = addDays(todayISO(), -1)
      events.push({ id: `shift_${ch.subjectId}`, date, title: `Performance shift detected — ${ch.subjectName}`, detail: ch.delta > 0 ? `+${ch.delta} points` : `${ch.delta} points`, kind: 'shift' })
    }
  }
  for (const iv of db.interventions.filter((i) => i.studentId === studentId || i.classId === studentOf(db, studentId)?.classId)) {
    events.push({ id: iv.id, date: iv.startDate, title: `Intervention: ${iv.title}`, detail: iv.problem, kind: 'intervention' })
    const res = db.interventionResults.find((r) => r.interventionId === iv.id)
    if (res) events.push({ id: `res_${iv.id}`, date: res.measuredAt, title: 'Follow-up measured', detail: `${res.beforeScore}% → ${res.afterScore}% (${res.afterScore - res.beforeScore >= 0 ? '+' : ''}${res.afterScore - res.beforeScore} points)`, kind: 'result' })
  }
  const attByDay = new Map<string, { present: number; total: number }>()
  for (const r of db.attendance.filter((r) => r.studentId === studentId)) {
    const cur = attByDay.get(r.date) ?? { present: 0, total: 0 }
    cur.total++
    if (r.status !== 'absent') cur.present++
    attByDay.set(r.date, cur)
  }
  for (const [date, v] of [...attByDay.entries()].sort()) {
    if (v.present < v.total) {
      events.push({ id: `att_${date}`, date, title: 'Absent / late recorded', detail: `${v.total - v.present} of ${v.total} periods`, kind: 'attendance' })
    }
  }
  return events.sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit)
}

// ---------------- Intervention impact ----------------

export function interventionImpact(db: DB, interventionId: string) {
  const iv = db.interventions.find((i) => i.id === interventionId)
  const res = db.interventionResults.filter((r) => r.interventionId === interventionId)
  if (!iv || !res.length) return null
  const deltas = res.map((r) => r.afterScore - r.beforeScore)
  const avgDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length
  return {
    intervention: iv,
    results: res,
    avgDelta: Math.round(avgDelta * 10) / 10,
    improved: res.filter((r) => r.afterScore > r.beforeScore).length,
    count: res.length,
  }
}

export function allInterventionImpact(db: DB) {
  return db.interventions
    .map((iv) => interventionImpact(db, iv.id))
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => b.avgDelta - a.avgDelta)
}

export function weeklySummaryData(db: DB, studentId: string) {
  const changes = detectStudentChanges(db, studentId)
  const att = attendanceStats(db, studentId)
  const asg = assignmentStats(db, studentId)
  const strengths = strengthMap(db, studentId)
  return {
    changes: changes.map((c) => ({ subject: c.subjectName, delta: c.delta })),
    attendance: `${att.pct}%`,
    assignments: { completion: asg.completion, missing: asg.missing, pending: asg.pending },
    strongest: strengths[0] ? { subject: strengths[0].name, avg: strengths[0].avg } : null,
    weakest: strengths[strengths.length - 1] ? { subject: strengths[strengths.length - 1].name, avg: strengths[strengths.length - 1].avg } : null,
  }
}

// ---------------- Misc ----------------

export function upcomingAssessments(db: DB, classId: string, subjectId?: string) {
  return db.assessments
    .filter((a) => a.classId === classId && a.status === 'scheduled' && (!subjectId || a.subjectId === subjectId))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function recentAssessments(db: DB, classId: string, subjectId?: string, limit = 6) {
  return db.assessments
    .filter((a) => a.classId === classId && a.status !== 'scheduled' && (!subjectId || a.subjectId === subjectId))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit)
}

export function teacherStudents(db: DB, teacherId: string): Student[] {
  const t = db.teachers.find((x) => x.id === teacherId)!
  return db.students.filter((s) => t.classIds.includes(s.classId))
}

export function teacherSubjects(db: DB, teacherId: string) {
  const t = db.teachers.find((x) => x.id === teacherId)!
  return t.subjectIds.map((sid) => db.subjects.find((x) => x.id === sid)!).filter(Boolean)
}

export function subjectName(db: DB, subjectId: string) {
  return db.subjects.find((x) => x.id === subjectId)?.name ?? 'Subject'
}

export function teacherName(db: DB, teacherId: string) {
  const t = db.teachers.find((x) => x.id === teacherId)
  return t ? (userOf(db, t.userId)?.name ?? '') : ''
}

export function subjectAvgLastN(db: DB, studentId: string, subjectId: string, n: number) {
  const series = subjectSeries(db, studentId, subjectId).slice(-n)
  if (!series.length) return null
  return series.reduce((a, x) => a + x.pct, 0) / series.length
}

/** school-wide aggregate stats for admin */
export function schoolStats(db: DB) {
  const students = db.students
  const attAvgs = students.map((s) => attendanceStats(db, s.id).pct)
  const perfAvgs = students.map((s) => overallAvg(db, s.id)).filter((v): v is number => v !== null)
  const assignmentPct = students.map((s) => assignmentStats(db, s.id).completion)
  return {
    students: students.length,
    teachers: db.teachers.length,
    parents: db.parents.length,
    classes: db.classes.length,
    avgAttendance: attAvgs.length ? Math.round(attAvgs.reduce((a, b) => a + b, 0) / attAvgs.length) : 0,
    avgPerformance: perfAvgs.length ? Math.round(perfAvgs.reduce((a, b) => a + b, 0) / perfAvgs.length) : 0,
    avgAssignmentCompletion: assignmentPct.length ? Math.round(assignmentPct.reduce((a, b) => a + b, 0) / assignmentPct.length) : 0,
    activeAssessments: db.assessments.filter((a) => a.status !== 'scheduled').length,
    flaggedStudents: earlyWarningFlags(db).length,
    interventions: db.interventions.length,
  }
}

export function subjectPerformanceSchool(db: DB) {
  return db.subjects.map((subj) => {
    const avgs = db.students.map((s) => subjectAvg(db, s.id, subj.id)).filter((v): v is number => v !== null)
    return { subjectId: subj.id, name: subj.name, color: subj.color, avg: avgs.length ? Math.round(avgs.reduce((a, b) => a + b, 0) / avgs.length) : 0 }
  })
}

export function teacherWorkload(db: DB) {
  return db.teachers.map((t) => {
    const u = userOf(db, t.userId)!
    const students = teacherStudents(db, t.id)
    const pendingMarks = db.assessments.filter((a) => a.teacherId === t.id && a.status === 'scheduled' && a.date < todayISO()).length
    return { teacherId: t.id, name: u.name, subjects: t.subjectIds.length, classes: t.classIds.length, students: students.length, workload: t.workload, pendingMarks }
  })
}

export function conflictCheck(db: DB) {
  const conflicts: { type: 'teacher' | 'class'; entry: DB['timetable'][number]; with: DB['timetable'][number] }[] = []
  const entries = db.timetable
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const a = entries[i]; const b = entries[j]
      if (a.day !== b.day || a.period !== b.period) continue
      if (a.teacherId === b.teacherId) conflicts.push({ type: 'teacher', entry: a, with: b })
      if (a.classId === b.classId) conflicts.push({ type: 'class', entry: a, with: b })
    }
  }
  return conflicts
}

export function schoolWideTrend(db: DB, weeks = 8) {
  const out: { week: string; pct: number }[] = []
  const start = addDays(todayISO(), -weeks * 7)
  for (let w = 0; w < weeks; w++) {
    const from = addDays(start, w * 7)
    const to = addDays(start, (w + 1) * 7)
    const vals: number[] = []
    for (const s of db.students) {
      for (const m of marksFor(db, s.id)) {
        const asm = assessmentOf(db, m)!
        if (asm.date >= from && asm.date < to) vals.push(pct(m.score, asm.maxMarks))
      }
    }
    out.push({ week: from.slice(5), pct: vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0 })
  }
  return out
}

export function assessmentSubjectTrend(db: DB, classId: string, subjectId: string) {
  const asms = recentAssessments(db, classId, subjectId, 6).reverse()
  return asms.map((a) => {
    const s = assessmentClassStats(db, a.id)
    return { date: a.date, title: a.title, avg: s?.avg ?? 0, max: a.maxMarks }
  })
}