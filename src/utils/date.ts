export const DAY_MS = 86400000

export function todayISO(): string {
  return toISO(new Date())
}

export function toISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(iso: string, n: number): string {
  const d = parseISO(iso)
  d.setDate(d.getDate() + n)
  return toISO(d)
}

export function daysBetween(a: string, b: string): number {
  return Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / DAY_MS)
}

export function weekday(iso: string): number {
  return parseISO(iso).getDay() // 0 Sun..6 Sat
}

export function isWeekend(iso: string): boolean {
  const w = weekday(iso)
  return w === 0 || w === 6
}

export function schoolDaysBetween(a: string, b: string, inclusive = true): string[] {
  const out: string[] = []
  let cur = parseISO(a)
  const end = parseISO(b)
  while (cur <= end) {
    const iso = toISO(cur)
    if (!isWeekend(iso)) out.push(iso)
    cur.setDate(cur.getDate() + 1)
  }
  return inclusive ? out : out.slice(0, out.length - 1)
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function formatHuman(iso: string, opts: { year?: boolean; weekday?: boolean } = {}): string {
  const d = parseISO(iso)
  const base = `${MONTHS[d.getMonth()]} ${d.getDate()}${opts.year ? `, ${d.getFullYear()}` : ''}`
  return opts.weekday ? `${DAYS[d.getDay()]}, ${base}` : base
}

export function formatShort(iso: string): string {
  const d = parseISO(iso)
  return `${MONTHS[d.getMonth()].toUpperCase()} ${d.getDate()}`
}

export function formatMonthYear(iso: string): string {
  const d = parseISO(iso)
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

export function weekdayName(day: number): string {
  return DAYS[(day + 1) % 7]
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - parseISO(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return formatHuman(iso)
}

export function relativeDayLabel(iso: string): string {
  const diff = daysBetween(todayISO(), iso)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  return formatHuman(iso, { weekday: true })
}