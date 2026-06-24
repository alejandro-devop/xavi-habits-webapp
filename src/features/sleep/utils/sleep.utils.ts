export function timeToIso(date: string, time: string): string {
  const local = new Date(`${date}T${time}:00`)
  const offsetMinutes = -local.getTimezoneOffset()
  const sign = offsetMinutes >= 0 ? '+' : '-'
  const abs = Math.abs(offsetMinutes)
  const oh = String(Math.floor(abs / 60)).padStart(2, '0')
  const om = String(abs % 60).padStart(2, '0')
  return `${date}T${time}:00${sign}${oh}:${om}`
}

export function isoToTime(iso: string): string {
  const d = new Date(iso)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

export function calcDurationMinutes(bedtime: string, wakeTime: string): number {
  const bed = new Date(bedtime).getTime()
  let wake = new Date(wakeTime).getTime()
  if (wake <= bed) {
    wake += 24 * 60 * 60 * 1000
  }
  return Math.round((wake - bed) / 60000)
}

export function formatSleepDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h} h`
  return `${h} h ${m} min`
}

export function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10)
}

export function sleepDateToInputValue(sleepDate: string): string {
  return sleepDate.slice(0, 10)
}

const SLEEP_QUALITY_LABELS: Record<string, string> = {
  poor: 'Mala',
  fair: 'Regular',
  good: 'Buena',
  excellent: 'Excelente',
}

const MOOD_ON_WAKING_LABELS: Record<string, string> = {
  tired: 'Cansado',
  groggy: 'Aturdido',
  refreshed: 'Descansado',
  energized: 'Energizado',
}

export function formatSleepQuality(quality: string | null): string | null {
  if (!quality) return null
  return SLEEP_QUALITY_LABELS[quality] ?? quality
}

export function formatMoodOnWaking(mood: string | null): string | null {
  if (!mood) return null
  return MOOD_ON_WAKING_LABELS[mood] ?? mood
}

export const SLEEP_QUALITY_OPTIONS = [
  { value: 'poor', label: 'Mala' },
  { value: 'fair', label: 'Regular' },
  { value: 'good', label: 'Buena' },
  { value: 'excellent', label: 'Excelente' },
] as const

export const MOOD_ON_WAKING_OPTIONS = [
  { value: 'tired', label: 'Cansado' },
  { value: 'groggy', label: 'Aturdido' },
  { value: 'refreshed', label: 'Descansado' },
  { value: 'energized', label: 'Energizado' },
] as const
