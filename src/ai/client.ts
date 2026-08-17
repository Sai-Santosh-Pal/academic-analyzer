import { DB } from '../data/types'
import { AIResult, aiResultFrom } from './fallback'
import { aiContext } from './context'
import { aiKey } from './key'
import { fetchWithTimeout } from './net'

export { aiKey }
export { THINKING_MODEL } from './timetable'

export interface AIRequest {
  kind: string
  params: Record<string, string | number | boolean>
  role: 'student' | 'teacher' | 'parent' | 'admin'
}

const HACK_CLUB_AI_URL = 'https://ai.hackclub.com/proxy/v1/chat/completions'
const DEFAULT_MODEL = 'qwen/qwen3-32b'

export async function aiHealth(): Promise<{ reachable: boolean; aiConfigured: boolean }> {
  const key = aiKey()
  if (!key) return { reachable: false, aiConfigured: false }
  try {
    const res = await fetchWithTimeout(HACK_CLUB_AI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 1,
      }),
    }, 10000)
    return { reachable: res.ok, aiConfigured: true }
  } catch {
    return { reachable: false, aiConfigured: true }
  }
}

const SYSTEM_PROMPT = `You are the AI academic analyst for "ARC (Academic Risk & Change) School Dashboard System", a school academic-management and early-intervention platform.

RULES — STRICT:
1. ALL numbers (percentages, averages, scores, attendance, deltas) MUST be taken verbatim from the structured data provided by the user. NEVER calculate, estimate or invent any academic statistic.
2. Never diagnose mental-health conditions or make sensitive personal judgments about students.
3. Anything about future improvement is an ESTIMATE. If you mention possible improvement, add the caveat: "Estimated scenario — not a guaranteed outcome."
4. Output ONLY a single JSON object with exactly this shape:
{
  "title": string,
  "summary": string (1-3 sentences, plain language),
  "sections": [{ "heading": string, "points": [string] }],
  "recommendations": [string],
  "stats": [{ "label": string, "value": string }],
  "plan": [{ "label": string, "items": [{ "subject": string, "minutes": number, "activity": string }] }] // optional, only for study plans
}
5. stats values must be copied verbatim from the provided data.
6. Keep everything factual and grounded in the provided data.
7. Never mention school names, email addresses, phone numbers, staff names, chapter/topic details, or any other information that is not present in the provided data. If something is not in the data, omit it entirely.`

const KIND_NAMES: Record<string, string> = {
  student_investigation: 'Investigate why this student\'s performance changed',
  study_plan: 'Generate a daily study plan',
  what_if: 'Generate a what-if study allocation scenario',
  copilot: 'Answer an academic copilot action',
  weekly_summary: 'Generate a weekly academic summary for parents',
  parent_report: 'Generate a parent-friendly academic report',
  parent_update: 'Draft a concise message a teacher can send to a parent',
  class_analysis: 'Analyse the whole class',
  intervention: 'Generate an intervention plan',
  lesson_plan: 'Generate a lesson plan',
  assessment_analysis: 'Analyse assessment results',
  school_intelligence: 'Generate a school-wide intelligence report',
  report: 'Generate an academic report',
}

function extractJSON(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const candidate = fenced ? fenced[1] : text
  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('No JSON object found in response')
  return JSON.parse(candidate.slice(start, end + 1))
}

async function tryHackClubAI(req: AIRequest, contextJson: string): Promise<AIResult | null> {
  const key = aiKey()
  if (!key) return null
  const prompt = `Academic context (all statistics are pre-computed by the application and are authoritative — quote them exactly, never recompute):\n${contextJson}\n\nTask: ${KIND_NAMES[req.kind] ?? 'Provide academic analysis'}.\nReturn the JSON result now.`
  const res = await fetchWithTimeout(HACK_CLUB_AI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
      max_tokens: 3000,
    }),
  }, 45000)
  if (!res.ok) return null
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
  const content = data?.choices?.[0]?.message?.content
  if (!content) return null
  const r = extractJSON(content) as Partial<AIResult>
  if (!r.title || !r.summary) return null
  return {
    title: String(r.title).slice(0, 160),
    summary: String(r.summary).slice(0, 600),
    sections: Array.isArray(r.sections) ? r.sections.slice(0, 6).map((s) => ({ heading: String(s.heading ?? '').slice(0, 80), points: (Array.isArray(s.points) ? s.points : []).slice(0, 8).map((p) => String(p).slice(0, 240)) })) : [],
    recommendations: (Array.isArray(r.recommendations) ? r.recommendations : []).slice(0, 6).map((x) => String(x).slice(0, 240)),
    stats: (Array.isArray(r.stats) ? r.stats : []).slice(0, 6).map((s) => ({ label: String(s.label ?? '').slice(0, 40), value: String(s.value ?? '').slice(0, 60) })),
    plan: Array.isArray(r.plan) ? r.plan.slice(0, 14).map((d) => ({ label: String(d.label ?? '').slice(0, 40), items: (Array.isArray(d.items) ? d.items : []).slice(0, 8).map((i) => ({ subject: String(i.subject ?? '').slice(0, 60), minutes: Math.max(5, Math.min(480, Number(i.minutes) || 30)), activity: String(i.activity ?? '').slice(0, 200) })) })) : undefined,
    estimate: true,
  }
}

/** Ask the AI. Returns structured results; degrades gracefully to the local analytics engine when the backend is unreachable. */
export async function askAI(db: DB, req: AIRequest): Promise<{ result: AIResult; source: 'ai' | 'local'; error?: string }> {
  const contextJson = aiContext(db, req)
  try {
    const result = await tryHackClubAI(req, contextJson)
    if (result) return { result, source: 'ai' }
  } catch {
    // fall through to local engine
  }
  const local = aiResultFrom(db, req.kind, req.params)
  return { result: local, source: 'local', error: 'AI service unreachable — using the built-in analytics engine.' }
}

export { aiResultFrom }