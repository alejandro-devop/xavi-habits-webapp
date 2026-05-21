import type { ActivityFollowUp, WeekDay } from '@/features/activities/types/activity-followup.types'

const MS_PER_MINUTE = 60_000
const MS_PER_SECOND = 1_000

/** YYYY-MM-DD en zona local */
export function getCurrentLocalDate(): string {
  return formatDateToYmd(new Date())
}

/** HH:mm en zona local */
export function getCurrentLocalTime(): string {
  const now = new Date()
  return `${pad2(now.getHours())}:${pad2(now.getMinutes())}`
}

export function formatDateToYmd(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/** Lunes = 0 … Domingo = 6 */
export function getMondayOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

export function getWeekDaysForDate(anchor: Date, selectedDate: string): WeekDay[] {
  const monday = getMondayOfWeek(anchor)
  const today = getCurrentLocalDate()
  const weekdayLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday)
    day.setDate(monday.getDate() + index)
    const date = formatDateToYmd(day)
    return {
      date,
      label: weekdayLabels[index] ?? '',
      dayNumber: day.getDate(),
      isToday: date === today,
      isFuture: isFutureDate(date),
      isSelected: date === selectedDate,
    }
  })
}

export function getCurrentWeekRange(): { from: string; to: string } {
  const today = new Date()
  const days = getWeekDaysForDate(today, getCurrentLocalDate())
  return { from: days[0]!.date, to: days[6]!.date }
}

export function isFutureDate(date: string): boolean {
  return date > getCurrentLocalDate()
}

export function isToday(date: string): boolean {
  return date === getCurrentLocalDate()
}

export function parseTimeToMinutes(time: string): number {
  const normalized = normalizeTimeForDisplay(time)
  const [h, m] = normalized.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return 0
  return h * 60 + m
}

/** HH:mm para API / inputs */
export function normalizeTimeForApi(time: string): string {
  const parts = time.trim().split(':')
  const h = Number(parts[0])
  const m = Number(parts[1] ?? 0)
  if (Number.isNaN(h) || Number.isNaN(m)) return '00:00'
  return `${pad2(h)}:${pad2(m)}`
}

/** HH:mm:ss → HH:mm */
export function normalizeTimeForDisplay(time: string): string {
  const parts = time.trim().split(':')
  if (parts.length < 2) return '00:00'
  return `${pad2(Number(parts[0]) || 0)}:${pad2(Number(parts[1]) || 0)}`
}

export function isoToLocalDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return getCurrentLocalDate()
  return formatDateToYmd(date)
}

export function isoToLocalTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return getCurrentLocalTime()
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

export function formatElapsedHHMMSS(elapsedMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(elapsedMs / MS_PER_SECOND))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`
}

export function formatDurationMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h} h ${m} min` : `${h} h`
}

export function minutesToHoursMinutes(totalMinutes: number): { hours: number; minutes: number } {
  const safe = Math.max(0, Math.round(totalMinutes))
  return {
    hours: Math.floor(safe / 60),
    minutes: safe % 60,
  }
}

export function hoursMinutesToTotalMinutes(hours: number, minutes: number): number {
  const h = Math.max(0, Math.floor(hours) || 0)
  const m = Math.max(0, Math.min(59, Math.floor(minutes) || 0))
  return h * 60 + m
}

/** Texto auxiliar bajo inputs de duración: "90 minutos (1 h 30 min)" */
export function formatDurationConversionHint(totalMinutes: number): string {
  const total = Math.max(0, Math.round(totalMinutes))
  if (total === 0) return '0 minutos'
  const { hours, minutes } = minutesToHoursMinutes(total)
  const parts = [`${total} minuto${total === 1 ? '' : 's'}`]
  if (hours > 0) {
    parts.push(`(${hours} h${minutes > 0 ? ` ${minutes} min` : ''})`)
  }
  return parts.join(' ')
}

/** ISO desde fecha y hora locales (YYYY-MM-DD + HH:mm) */
export function localDateTimeToIso(date: string, time: string): string {
  const [year, month, day] = date.split('-').map(Number)
  const normalized = normalizeTimeForDisplay(time)
  const [hours, minutes] = normalized.split(':').map(Number)
  if (
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day) ||
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
  ) {
    return new Date().toISOString()
  }
  return new Date(year, month - 1, day, hours, minutes, 0, 0).toISOString()
}

export function isFutureDateTime(date: string, time: string): boolean {
  const iso = localDateTimeToIso(date, time)
  return new Date(iso).getTime() > Date.now()
}

export function formatTimeRange(startTime: string, endTime: string): string {
  return `${normalizeTimeForDisplay(startTime)} – ${normalizeTimeForDisplay(endTime)}`
}

export function calculateDurationMinutes(startedAtIso: string, endedAtIso: string): number {
  const start = new Date(startedAtIso).getTime()
  const end = new Date(endedAtIso).getTime()
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 1
  return Math.max(1, Math.round((end - start) / MS_PER_MINUTE))
}

export function calculateEndTime(_date: string, startTime: string, durationMinutes: number): string {
  const startMinutes = parseTimeToMinutes(startTime)
  const total = startMinutes + durationMinutes
  const hours = Math.floor(total / 60) % 24
  const minutes = total % 60
  return `${pad2(hours)}:${pad2(minutes)}`
}

export function sortFollowUpsByStartTimeDesc(followUps: ActivityFollowUp[]): ActivityFollowUp[] {
  return [...followUps].sort(
    (a, b) => parseTimeToMinutes(b.startTime) - parseTimeToMinutes(a.startTime),
  )
}

/** Orden cronológico ascendente (primero el más temprano del día). */
export function sortFollowUpsByStartTimeAsc(followUps: ActivityFollowUp[]): ActivityFollowUp[] {
  return [...followUps].sort(
    (a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime),
  )
}

export function formatFollowUpTimeLabel(startTime: string, endTime: string): {
  startLabel: string
  endLabel: string
} {
  return {
    startLabel: normalizeTimeForDisplay(startTime),
    endLabel: normalizeTimeForDisplay(endTime),
  }
}
