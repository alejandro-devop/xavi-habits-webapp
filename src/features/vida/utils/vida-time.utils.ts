/**
 * La hora del día en el módulo Vida: `HH:mm` y minutos, nada más.
 *
 * Archivo **hermano** de `vida-date.utils.ts`, no parte de él: aquél lo importa
 * la capa de datos entera (hooks, invalidaciones, la hoja, la tarjeta) y meterle
 * la aritmética de la agenda lo convertiría en un cajón. Aquí no se importa
 * nada de React ni del API: son funciones puras y sus constantes.
 *
 * El grueso está **rescatado función por función** de
 * `git show 79bece0:src/features/activities/utils/activity-time.utils.ts`, el
 * módulo de actividades que se borró en la fase 11. Lo que no volvió y por qué:
 * `normalizeTimeToSeconds` (el plan del día habla `HH:mm`, no `HH:mm:ss`), el
 * `% 24` de `calculateEndTime` (aquí nada cruza medianoche: el día acaba en
 * `vidaDayEndTime`) y todo lo de alturas en píxeles, que era una cuadrícula de
 * horas y está descartada.
 */

const MINUTES_PER_DAY = 24 * 60

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/** `HH:mm` o `HH:mm:ss` → `HH:mm`. Lo que no se entiende cae en `00:00`. */
export function normalizeTimeForDisplay(time: string): string {
  const parts = time.trim().split(':')
  if (parts.length < 2) return '00:00'
  return `${pad2(Number(parts[0]) || 0)}:${pad2(Number(parts[1]) || 0)}`
}

/** Lo que se le manda al API: siempre `HH:mm`. */
export function normalizeTimeForApi(time: string): string {
  const parts = time.trim().split(':')
  const h = Number(parts[0])
  const m = Number(parts[1] ?? 0)
  if (Number.isNaN(h) || Number.isNaN(m)) return '00:00'
  return `${pad2(h)}:${pad2(m)}`
}

/** `HH:mm` → minutos desde medianoche. */
export function parseTimeToMinutes(time: string): number {
  const normalized = normalizeTimeForDisplay(time)
  const [h, m] = normalized.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return 0
  return h * 60 + m
}

/** Minutos desde medianoche → `HH:mm`, recortado al día. */
export function minutesToTime(minutes: number): string {
  const safe = Math.max(0, Math.min(MINUTES_PER_DAY - 1, Math.floor(minutes)))
  return `${pad2(Math.floor(safe / 60))}:${pad2(safe % 60)}`
}

/**
 * `HH:mm` de verdad: 24 h, dos dígitos, hora 0–23 y minuto 0–59. Un `Input
 * type="time"` ya lo garantiza cuando el navegador lo soporta, pero lo que
 * llega del API o de un formulario tecleado no.
 */
export function isValidHhMm(time: string | null | undefined): boolean {
  if (!time) return false
  const match = /^(\d{2}):(\d{2})$/.exec(time.trim())
  if (!match) return false
  const h = Number(match[1])
  const m = Number(match[2])
  return h >= 0 && h <= 23 && m >= 0 && m <= 59
}

/** Fin **posterior** al inicio. Igual no vale: un día de cero minutos no es un día. */
export function isEndAfterStart(startTime: string, endTime: string): boolean {
  if (!isValidHhMm(startTime) || !isValidHhMm(endTime)) return false
  return parseTimeToMinutes(endTime) > parseTimeToMinutes(startTime)
}

/**
 * «Hora + duración» → el `endTime` que pide el plan del día. Sin `% 24`: si algo
 * se pasa de medianoche se queda pegado a `23:59`, que es un dato visiblemente
 * raro en vez de un bloque que aparece de madrugada.
 */
export function calculateEndTime(startTime: string, durationMinutes: number): string {
  return minutesToTime(parseTimeToMinutes(startTime) + Math.max(0, durationMinutes))
}

/** Etiqueta corta, la del render: «2h 30», «45m», «0m». */
export function formatDurationFromMinutes(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes))
  if (safe === 0) return '0m'
  const h = Math.floor(safe / 60)
  const m = safe % 60
  if (h === 0) return `${m}m`
  return m > 0 ? `${h}h ${m}` : `${h}h`
}

/**
 * Etiqueta larga: «40 min», «1 h», «2 h 30 min». Es la que pide el criterio 6
 * para la tarjeta del catálogo («8:00 · 40 min · L M X J V»), donde hay sitio y
 * se lee de corrido.
 */
export function formatDurationMinutes(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes))
  if (safe < 60) return `${safe} min`
  const h = Math.floor(safe / 60)
  const m = safe % 60
  return m > 0 ? `${h} h ${m} min` : `${h} h`
}

/**
 * La hora como se lee en el módulo: sin cero a la izquierda («8:00», no
 * «08:00»), que es lo que dibujan los renders de Vida.
 */
export function formatTimeForDisplay(time: string): string {
  const [h, m] = normalizeTimeForDisplay(time).split(':')
  return `${Number(h)}:${m}`
}

/** Las píldoras de «cuánto»: 15 · 30 · 45 · 1h, y «libre» aparte (D1). */
export const DURATION_PILLS: readonly number[] = [15, 30, 45, 60]

/** Lo que dura un bloque cuando su ítem de plantilla no lo dice (criterio 44). */
export const DEFAULT_BLOCK_MINUTES = 30

/** Por debajo de esto un hueco no enseña fichas; se pinta, pero fino (criterio 17). */
export const MIN_GAP_MINUTES = 15

/**
 * Lo que usa el cliente mientras `vidaDayStartTime` / `vidaDayEndTime` sean
 * nulos (D2, criterio 9). **Valor por defecto, no elección del usuario**: quien
 * los pinte tiene que decirlo.
 */
export const VIDA_DAY_START_FALLBACK = '06:30'
export const VIDA_DAY_END_FALLBACK = '23:00'
