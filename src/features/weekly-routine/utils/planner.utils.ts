import type { DayOfWeek, TimeBlock, WeeklyRoutineActivity } from '../types/weekly-routine.types'

export const BLOCK_HEIGHT_PX = 20
export const BLOCK_MINUTES = 15
export const TIME_COL_WIDTH = 68
/** Duración máxima de un evento en el planner (4 h). */
export const MAX_ROUTINE_EVENT_DURATION_MINUTES = 4 * 60

export const ALL_DAYS: DayOfWeek[] = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
]

export const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Lun',
  tuesday: 'Mar',
  wednesday: 'Mié',
  thursday: 'Jue',
  friday: 'Vie',
  saturday: 'Sáb',
  sunday: 'Dom',
}

export const DAY_LABELS_FULL: Record<DayOfWeek, string> = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo',
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function snapTo15(minutes: number): number {
  return Math.round(minutes / BLOCK_MINUTES) * BLOCK_MINUTES
}

export function snapTimeTo15(time: string): string {
  return minutesToTime(snapTo15(timeToMinutes(time)))
}

export function getOrderedDays(startDay: DayOfWeek): DayOfWeek[] {
  const idx = ALL_DAYS.indexOf(startDay)
  return [...ALL_DAYS.slice(idx), ...ALL_DAYS.slice(0, idx)]
}

export function generateTimeBlocks(startTime: string, endTime: string): TimeBlock[] {
  const start = timeToMinutes(startTime)
  const end = timeToMinutes(endTime)
  const blocks: TimeBlock[] = []

  for (let t = start; t < end; t += BLOCK_MINUTES) {
    const time = minutesToTime(t)
    const m = t % 60
    const h = Math.floor(t / 60)
    const hourIndex = Math.floor((t - timeToMinutes(startTime)) / 60)
    const hh = String(h).padStart(2, '0')
    const label = `${hh}:${String(m).padStart(2, '0')}`
    blocks.push({
      time,
      label,
      isHour: m === 0,
      isQuarter: m !== 0,
      isEvenHour: hourIndex % 2 === 0,
    })
  }
  return blocks
}

export function getBlockIndex(time: string, startTime: string): number {
  return (timeToMinutes(time) - timeToMinutes(startTime)) / BLOCK_MINUTES
}

export function getRowStart(time: string, startTime: string): number {
  return getBlockIndex(time, startTime) + 2 // +1 for header row, +1 for CSS grid 1-based
}

export function getRowSpan(durationMinutes: number): number {
  return Math.ceil(durationMinutes / BLOCK_MINUTES)
}

export function isTimeInRange(time: string, startTime: string, endTime: string): boolean {
  const t = timeToMinutes(time)
  return t >= timeToMinutes(startTime) && t < timeToMinutes(endTime)
}

export function hasConflict(
  activities: WeeklyRoutineActivity[],
  day: DayOfWeek,
  startTime: string,
  durationMinutes: number,
  excludeId?: string,
): boolean {
  const newStart = timeToMinutes(startTime)
  const newEnd = newStart + durationMinutes

  return activities
    .filter((a) => a.dayOfWeek === day && a.id !== excludeId)
    .some((a) => {
      const aStart = timeToMinutes(a.startTime)
      const aEnd = aStart + a.durationMinutes
      return newStart < aEnd && newEnd > aStart
    })
}

export function formatBlockTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const ampm = h < 12 ? 'am' : 'pm'
  const displayH = h % 12 === 0 ? 12 : h % 12
  return m === 0 ? `${displayH}${ampm}` : `${displayH}:${String(m).padStart(2, '0')}${ampm}`
}

export function formatEventTime(startTime: string, durationMinutes: number): string {
  const endMinutes = timeToMinutes(startTime) + durationMinutes
  return `${formatBlockTime(startTime)} – ${formatBlockTime(minutesToTime(endMinutes))}`
}

export function getEventEndTime(startTime: string, durationMinutes: number): string {
  return minutesToTime(timeToMinutes(startTime) + durationMinutes)
}

export function formatEventEndTime(startTime: string, durationMinutes: number): string {
  return formatBlockTime(getEventEndTime(startTime, durationMinutes))
}

export function buildDurationOptions(
  startTime: string,
  endTime: string,
  maxDurationMinutes: number = MAX_ROUTINE_EVENT_DURATION_MINUTES,
): { label: string; value: number }[] {
  const untilDayEnd = timeToMinutes(endTime) - timeToMinutes(startTime)
  const maxMinutes = Math.min(untilDayEnd, maxDurationMinutes)
  if (maxMinutes < BLOCK_MINUTES) return []

  const options: { label: string; value: number }[] = []
  for (let m = BLOCK_MINUTES; m <= maxMinutes; m += BLOCK_MINUTES) {
    const h = Math.floor(m / 60)
    const min = m % 60
    let label = ''
    if (h > 0) label += `${h}h`
    if (min > 0) label += ` ${min}min`
    options.push({ label: label.trim(), value: m })
  }
  return options
}

export function clampEventDuration(
  startTime: string,
  dayEndTime: string,
  durationMinutes: number,
): number {
  const options = buildDurationOptions(startTime, dayEndTime)
  if (options.length === 0) return BLOCK_MINUTES
  const allowed = new Set(options.map((o) => o.value))
  if (allowed.has(durationMinutes)) return durationMinutes
  const next = options.find((o) => o.value >= durationMinutes)
  return next?.value ?? options[options.length - 1]!.value
}

export function buildStartTimeOptions(
  dayStartTime: string,
  dayEndTime: string,
): { label: string; value: string }[] {
  const start = timeToMinutes(dayStartTime)
  const end = timeToMinutes(dayEndTime)
  const options: { label: string; value: string }[] = []
  for (let t = start; t < end; t += BLOCK_MINUTES) {
    const time = minutesToTime(t)
    options.push({ label: formatBlockTime(time), value: time })
  }
  return options
}

export function groupActivitiesByBlock(
  activities: WeeklyRoutineActivity[],
  startTime: string,
): Map<number, WeeklyRoutineActivity[]> {
  const map = new Map<number, WeeklyRoutineActivity[]>()
  for (const a of activities) {
    const blockIdx = getBlockIndex(a.startTime, startTime)
    const existing = map.get(blockIdx) ?? []
    existing.push(a)
    map.set(blockIdx, existing)
  }
  return map
}
