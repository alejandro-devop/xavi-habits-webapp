/**
 * Fechas locales del módulo Vida. Extraído de
 * `79bece0:src/features/activities/utils/activity-time.utils.ts` (líneas 20-46
 * y 119-131): solo lo que la capa de datos necesita. El resto de aquel archivo
 * (línea de tiempo, huecos libres, formateo) es de F2/F3 y llega con su
 * pantalla; cuando llegue, re-exporta desde aquí en vez de volver a copiar.
 */

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export function formatDateToYmd(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

/** YYYY-MM-DD en zona local */
export function getCurrentLocalDate(): string {
  return formatDateToYmd(new Date())
}

/** Lunes = 0 … Domingo = 6 */
export function getMondayOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

/** La semana (lunes a domingo) que contiene hoy, en fechas locales. */
export function getCurrentWeekRange(): { from: string; to: string } {
  const monday = getMondayOfWeek(new Date())
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return { from: formatDateToYmd(monday), to: formatDateToYmd(sunday) }
}

export function isFutureDate(date: string): boolean {
  return date > getCurrentLocalDate()
}

export function isToday(date: string): boolean {
  return date === getCurrentLocalDate()
}
