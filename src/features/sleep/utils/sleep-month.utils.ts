import type { SleepLog, SleepQuality } from '@/features/sleep/types/sleep.types'

export const QUALITY_COLORS: Record<string, string> = {
  excellent: '#34c759',
  good: '#007aff',
  fair: '#ff9500',
  poor: '#ff3b30',
}

export const QUALITY_LABELS: Record<string, string> = {
  excellent: 'Excelente',
  good: 'Buena',
  fair: 'Regular',
  poor: 'Mala',
}

export const MOOD_LABELS: Record<string, string> = {
  energized: 'Energizado',
  refreshed: 'Descansado',
  groggy: 'Aturdido',
  tired: 'Cansado',
}

export function getQualityColor(quality: SleepQuality | null): string {
  return quality ? (QUALITY_COLORS[quality] ?? '#aeaeb2') : '#aeaeb2'
}

export function getMonthRange(year: number, month: number): { startDate: string; endDate: string } {
  const mm = String(month + 1).padStart(2, '0')
  const lastDay = new Date(year, month + 1, 0).getDate()
  return {
    startDate: `${year}-${mm}-01`,
    endDate: `${year}-${mm}-${String(lastDay).padStart(2, '0')}`,
  }
}

export function getDayFromSleepDate(sleepDate: string): number {
  return parseInt(sleepDate.slice(8, 10), 10)
}

export function buildLogsByDay(logs: SleepLog[]): Map<number, SleepLog> {
  const map = new Map<number, SleepLog>()
  for (const log of logs) {
    map.set(getDayFromSleepDate(log.sleepDate), log)
  }
  return map
}

export function computeStreak(logs: SleepLog[], year: number, month: number): number {
  const today = new Date()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const lastDay = isCurrentMonth ? today.getDate() : daysInMonth

  const loggedDays = new Set(logs.map((l) => getDayFromSleepDate(l.sleepDate)))
  let streak = 0
  for (let d = lastDay; d >= 1; d--) {
    if (loggedDays.has(d)) streak++
    else break
  }
  return streak
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h} h`
  return `${h} h ${m} min`
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export function getMonthName(month: number): string {
  return MONTH_NAMES[month]
}
