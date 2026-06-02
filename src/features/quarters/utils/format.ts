const SHORT_DATE = new Intl.DateTimeFormat('es', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

const WEEK_START_PART = new Intl.DateTimeFormat('es', {
  weekday: 'short',
  day: 'numeric',
  timeZone: 'UTC',
})

const WEEK_END_PART = new Intl.DateTimeFormat('es', {
  weekday: 'short',
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
})

const MONTH_YEAR = new Intl.DateTimeFormat('es', {
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

function parseDate(str: string): Date | null {
  if (!str) return null
  // Handle both YYYY-MM-DD and full ISO timestamps
  const d = new Date(str.length === 10 ? `${str}T00:00:00Z` : str)
  return Number.isNaN(d.getTime()) ? null : d
}

export function formatShortDate(str: string): string {
  const d = parseDate(str)
  if (!d) return str
  return SHORT_DATE.format(d)
}

export function getCurrentWeekStart(): string {
  const now = new Date()
  const day = now.getUTCDay() // 0=Sun, 1=Mon...
  const diff = day === 0 ? 6 : day - 1
  const monday = new Date(now)
  monday.setUTCDate(now.getUTCDate() - diff)
  return monday.toISOString().slice(0, 10)
}

export function formatWeekRange(weekStart: string): string {
  const start = new Date(`${weekStart}T00:00:00Z`)
  const end = new Date(start)
  end.setUTCDate(start.getUTCDate() + 6)
  return `${WEEK_START_PART.format(start)} – ${WEEK_END_PART.format(end)}`
}

export function formatDateRange(start: string, end: string): string {
  const s = parseDate(start)
  const e = parseDate(end)
  if (!s || !e) return `${start} → ${end}`
  const sStr = MONTH_YEAR.format(s)
  const eStr = MONTH_YEAR.format(e)
  // Same year: "ene – mar 2024", different year: "dic 2023 – feb 2024"
  if (s.getUTCFullYear() === e.getUTCFullYear()) {
    const sMonth = new Intl.DateTimeFormat('es', { month: 'short', timeZone: 'UTC' }).format(s)
    return `${sMonth} – ${eStr}`
  }
  return `${sStr} – ${eStr}`
}
