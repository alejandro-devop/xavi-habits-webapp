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
 * La suma «hora + duración» **con las dos lecturas a la vez**: la del reloj de
 * pared (`endTime`, que sí da la vuelta al día) y la que viaja al API
 * (`cappedEndTime`, recortada a `23:59`).
 *
 * Existe porque la pantalla y el dato piden cosas distintas y **no pueden ser
 * dos cuentas separadas** (FEAT-008, criterio 125): enseñar «acaba a las 0:50»
 * es honrado, y meter un bloque de madrugada en el plan del día no lo es. Aquí
 * se calcula una vez y cada quien lee el campo que le toca.
 */
export type ResolvedEndTime = {
  /** Los minutos **sin recortar** desde la medianoche del día de inicio: 23:30 + 1 h 20 = 1490. */
  endMinutes: number
  /** La hora de reloj de verdad, dando la vuelta al día: `00:50`. */
  endTime: string
  /** `true` cuando la suma se pasa de las 24 h. */
  crossesMidnight: boolean
  /** Lo que el plan del día guarda: recortado a `23:59`, sin `% 24`. */
  cappedEndTime: string
}

export function resolveEndTime(startTime: string, durationMinutes: number): ResolvedEndTime {
  const endMinutes = parseTimeToMinutes(startTime) + Math.max(0, durationMinutes)
  return {
    endMinutes,
    endTime: minutesToTime(endMinutes % MINUTES_PER_DAY),
    crossesMidnight: endMinutes >= MINUTES_PER_DAY,
    cappedEndTime: minutesToTime(endMinutes),
  }
}

/**
 * «Hora + duración» → el `endTime` que pide el plan del día. Sin `% 24`: si algo
 * se pasa de medianoche se queda pegado a `23:59`, que es un dato visiblemente
 * raro en vez de un bloque que aparece de madrugada.
 *
 * **No cambia de salida para ninguna entrada** (criterio 126): delega en
 * `resolveEndTime` para que la cuenta esté escrita una sola vez, y sigue
 * devolviendo exactamente lo recortado, que es lo que viaja al API
 * (`vida-gap-form.utils.ts`, `toDayPlanTimes`).
 */
export function calculateEndTime(startTime: string, durationMinutes: number): string {
  return resolveEndTime(startTime, durationMinutes).cappedEndTime
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
 * El tope de una duración escrita a mano: **23 h 59 min**. No es una regla del
 * API —ahí `durationMinutes` es un entero positivo y punto—, es lo que cabe en
 * un día, y por eso se dice con el mismo número que `minutesToTime` ya usa para
 * no cruzar medianoche.
 */
export const MAX_DURATION_MINUTES = MINUTES_PER_DAY - 1

/**
 * Minutos → `(horas, minutos)`, para escribir «Cuánto» en dos campos: `95` es
 * `{ 1, 35 }` y `45` es `{ 0, 45 }`. **Sin duración devuelve los dos nulos**, no
 * `{ 0, 0 }`: un ítem sin duración abre con los dos campos vacíos y ninguna
 * píldora encendida (criterio 109).
 *
 * No formatea nada: para texto siguen estando `formatDurationMinutes` («1 h 35
 * min») y `formatDurationFromMinutes` («1h 35»), que no se tocan.
 */
export function splitDurationMinutes(total: number | null): {
  hours: number | null
  minutes: number | null
} {
  if (total === null || !Number.isFinite(total)) return { hours: null, minutes: null }
  const safe = Math.max(0, Math.round(total))
  if (safe === 0) return { hours: null, minutes: null }
  return { hours: Math.floor(safe / 60), minutes: safe % 60 }
}

/**
 * La vuelta: `(horas, minutos)` → los minutos que viajan al API. Lo que hace
 * que escribir solo minutos funcione sin trabajo extra —`(null, 90)` **es** 90,
 * no 90 h—, que cero no exista —`(0, 0)` es `null`, nunca `0` (criterio 111)—
 * y que nada imposible se guarde a escondidas: por encima de
 * `MAX_DURATION_MINUTES` se queda ahí (criterio 113).
 */
export function joinDurationMinutes(
  hours: number | null,
  minutes: number | null,
): number | null {
  const h = hours === null || !Number.isFinite(hours) ? 0 : Math.max(0, Math.trunc(hours))
  const m = minutes === null || !Number.isFinite(minutes) ? 0 : Math.max(0, Math.trunc(minutes))
  const total = h * 60 + m
  if (total <= 0) return null
  return Math.min(total, MAX_DURATION_MINUTES)
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

/**
 * **Lo más corto que se puede *poner*: la píldora más pequeña** (criterio 17).
 *
 * Por debajo de esto un hueco no enseña fichas de plantilla ni «+ otra cosa»;
 * se pinta, pero fino (`isSliver`). La razón es la escala de planear: la
 * píldora más corta de `DURATION_PILLS` es de 15 minutos, así que en un hueco
 * de 13 **no cabe nada que planear**.
 *
 * **Se llamaba `MIN_GAP_MINUTES`** (FEAT-014, criterio 400). El nombre viejo
 * decía *un hueco*, en general, y por eso acabó haciendo dos trabajos: este y
 * el de decidir qué era demasiado pequeño para **contarlo**. Ese segundo
 * trabajo se fue a `MIN_LOG_MINUTES`, que vive aquí al lado y vale otra cosa.
 * Los criterios ya entregados que lo nombran por el nombre viejo —FEAT-003
 * criterio 17, FEAT-009 criterio 143, FEAT-011 criterio 221— siguen hablando
 * de esta constante.
 *
 * **Y tenía un gemelo, `MIN_PLACEMENT_MINUTES`** (`vida-gap-form.utils.ts`,
 * mismo valor y misma frase), que hacía este mismo trabajo en las horas que se
 * ofrecen en «cuándo». Se fundió aquí en FEAT-014, tajada 2 (criterio 412): un
 * solo umbral de planear, un solo sitio donde cambiarlo. **El umbral de contar
 * es otro y vive aparte**: `MIN_LOG_MINUTES`, justo debajo.
 */
export const MIN_PLANNING_MINUTES = 15

/**
 * **Lo más corto que se ofrece *contar*; lo ya vivido no tiene suelo**
 * (FEAT-014, criterio 400).
 *
 * Un hueco que ya pasó de 5 minutos o más trae «Registrar lo que hice»: lo que
 * hiciste duró lo que duró y no hay píldora mínima que respetar, porque ahí no
 * se planea nada —se cuenta—. La comparación es `>=`, así que **los 5 exactos
 * entran** (D1); entre 1 y 4 el hueco sigue siendo la línea fina de siempre
 * (criterio 402) y en 0 no hay hueco que pintar.
 *
 * **No es el umbral de planear**: ese es `MIN_PLANNING_MINUTES` y vale 15.
 */
export const MIN_LOG_MINUTES = 5

/**
 * Lo que usa el cliente mientras `vidaDayStartTime` / `vidaDayEndTime` sean
 * nulos (D2, criterio 9). **Valor por defecto, no elección del usuario**: quien
 * los pinte tiene que decirlo.
 */
export const VIDA_DAY_START_FALLBACK = '06:30'
export const VIDA_DAY_END_FALLBACK = '23:00'
