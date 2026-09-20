/**
 * Fechas locales del módulo Vida. Extraído de
 * `79bece0:src/features/activities/utils/activity-time.utils.ts` (líneas 20-46
 * y 119-131): solo lo que la capa de datos necesita. El resto de aquel archivo
 * (línea de tiempo, huecos libres, formateo) es de F2/F3 y llega con su
 * pantalla; cuando llegue, re-exporta desde aquí en vez de volver a copiar.
 */

import type { VidaDayOfWeek } from '@/features/vida/types/vida-item.types'

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

/* ── Los días de la semana de la plantilla ──────────────────────────────────
 *
 * `VidaDayOfWeek` no traía ni orden ni etiquetas en ningún archivo. Viven aquí
 * y no en la tarjeta porque la plantilla (F4) y el día (F2/F3) los van a pintar
 * igual: una sola fila de siete, siempre de lunes a domingo.
 */

/** Lunes → domingo. El orden en que se pintan las siete casillas. */
export const VIDA_DAY_ORDER: readonly VidaDayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const

/** La letra de cada casilla: L M X J V S D. */
export const VIDA_DAY_SHORT_LABELS: Record<VidaDayOfWeek, string> = {
  monday: 'L',
  tuesday: 'M',
  wednesday: 'X',
  thursday: 'J',
  friday: 'V',
  saturday: 'S',
  sunday: 'D',
}

/** Lo que se lee en voz alta: una letra suelta no dice nada. */
export const VIDA_DAY_LABELS: Record<VidaDayOfWeek, string> = {
  monday: 'lunes',
  tuesday: 'martes',
  wednesday: 'miércoles',
  thursday: 'jueves',
  friday: 'viernes',
  saturday: 'sábado',
  sunday: 'domingo',
}

/* ── De un `YYYY-MM-DD` al día de la semana y a lo que se lee ───────────────
 *
 * Lo añade la tajada 2 de FEAT-003: el encabezado del presupuesto dice
 * «Viernes 18» y el lateral dice «Tu plantilla de viernes», y los dos parten de
 * la misma cadena local. Va aquí, con el resto de lo de fechas, y no en
 * `vida-agenda.utils.ts`, que es geometría.
 *
 * `new Date('2026-09-18')` se interpreta **en UTC** y a partir de UTC-1 cae en
 * el día anterior: por eso se parte la cadena a mano (criterio 49).
 */

/** `YYYY-MM-DD` → `Date` local a medianoche. Lo que no se entiende cae en hoy. */
export function parseYmdToLocalDate(date: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim())
  if (!match) return new Date()
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
}

/** El día de la semana de una fecha local, en el vocabulario de la plantilla. */
export function getVidaDayOfWeek(date: string): VidaDayOfWeek {
  const index = parseYmdToLocalDate(date).getDay()
  // `getDay()` es domingo = 0; `VIDA_DAY_ORDER` empieza en lunes.
  return VIDA_DAY_ORDER[(index + 6) % 7]!
}

/**
 * El día de la semana **en plural**, para lo que se dice como costumbre: «los
 * sábados», «los lunes».
 *
 * En español los días de lunes a viernes son invariables (ya acaban en `s`) y
 * solo sábado y domingo pluralizan. Existe porque media docena de sitios
 * escriben «los \<día\>» y `VIDA_DAY_LABELS` está en singular: decían «los
 * sábado».
 */
export function pluralDayLabel(label: string): string {
  return label.endsWith('s') ? label : `${label}s`
}

/** «Viernes 18»: el día de la semana en mayúscula inicial y el número. */
export function formatDayHeading(date: string): string {
  const label = VIDA_DAY_LABELS[getVidaDayOfWeek(date)]
  return `${label.charAt(0).toUpperCase()}${label.slice(1)} ${parseYmdToLocalDate(date).getDate()}`
}
