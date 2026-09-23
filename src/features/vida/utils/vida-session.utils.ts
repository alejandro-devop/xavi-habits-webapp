/**
 * La sesión viva del módulo Vida: instantes, cronómetro y las entradas del API.
 *
 * Archivo **hermano** de `vida-time.utils.ts` (que es `HH:mm` y minutos, sin
 * fechas) y de `vida-date.utils.ts` (que es `YYYY-MM-DD`, sin horas). Aquí vive
 * lo único que necesita **las dos a la vez**: el instante en que empezó una
 * sesión. Nada de React, nada del API: funciones puras y sus constantes, con
 * `now` **siempre inyectado** — ni un `new Date()` escondido.
 *
 * Rescatado función por función de
 * `git show 79bece0:src/features/activities/utils/activity-time.utils.ts`:
 * `formatElapsedHHMMSS` y `formatElapsedCompact` (líneas 186-201) literales,
 * `localDateTimeToIso` (237-251) como `sessionStartInstant` —devolviendo `Date`
 * en vez de una cadena ISO que habría que volver a parsear— y
 * `calculateDurationMinutes` (262-267) como `elapsedMinutes`. Lo que **no**
 * volvió: el respaldo `new Date().toISOString()` cuando la fecha no se entiende
 * (una fecha rota disfrazada de «ahora» es peor que un `null`) y
 * `normalizeTimeToSeconds` (el API acepta `HH:mm`).
 *
 * **La trampa de medianoche (criterio 63).** La duración de una sesión abierta
 * *no* se puede calcular como «minutos de ahora desde medianoche − minutos de
 * inicio»: una que empezó a las 23:50 daría −1420 a las 00:10. Se calcula
 * **entre instantes**, desde `date + startTime` local, y por eso existe
 * `sessionStartInstant`.
 */

import type { ActivityFollowUp } from '@/features/vida/types/activity-followup.types'
import type {
  ActivityFollowUpEditInput,
  ActivityFollowUpInput,
  ActivityFollowUpStartInput,
} from '@/features/vida/types/activity-followup.types'
import { formatDateToYmd } from '@/features/vida/utils/vida-date.utils'
import { VIDA_MOVED_THRESHOLD_MINUTES } from '@/features/vida/utils/vida-execution.utils'
import {
  DEFAULT_BLOCK_MINUTES,
  formatTimeForDisplay,
  isValidHhMm,
  minutesToTime,
  normalizeTimeForApi,
  normalizeTimeForDisplay,
  parseTimeToMinutes,
} from '@/features/vida/utils/vida-time.utils'

const MS_PER_SECOND = 1000
const MS_PER_MINUTE = 60 * MS_PER_SECOND
const MINUTES_PER_DAY = 24 * 60

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/* ── El instante ────────────────────────────────────────────────────────── */

/**
 * `YYYY-MM-DD` + `HH:mm` (o `HH:mm:ss`, que es lo que a veces devuelve el API)
 * → el `Date` **local** de ese momento. `null` si la fecha no se entiende: sin
 * instante no hay cronómetro, y eso se dice, no se inventa.
 */
export function sessionStartInstant(date: string, startTime: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim())
  if (!match) return null
  const [hours, minutes] = normalizeTimeForDisplay(startTime).split(':').map(Number)
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null
  const instant = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    hours,
    minutes,
    0,
    0,
  )
  return Number.isNaN(instant.getTime()) ? null : instant
}

/** El instante en que empezó una sesión, o `null` si sus datos no dan para uno. */
export function followUpStartInstant(session: ActivityFollowUp | null | undefined): Date | null {
  if (!session) return null
  return sessionStartInstant(session.date, session.startTime)
}

/**
 * Los minutos que lleva (o duró) una sesión, entre dos instantes.
 *
 * **Nunca menos de 1**: el API rechaza duraciones de cero (`Duration must be at
 * least 1 minute`), así que «lo empecé y lo terminé sin querer» se registra
 * como un minuto en vez de fallar.
 */
export function elapsedMinutes(start: Date, now: Date): number {
  const diff = now.getTime() - start.getTime()
  if (Number.isNaN(diff)) return 1
  return Math.max(1, Math.round(diff / MS_PER_MINUTE))
}

/** Una sesión que empezó **otro día** (criterio 16). `today` es `YYYY-MM-DD` local. */
export function isSessionFromAnotherDay(
  session: ActivityFollowUp | null | undefined,
  today: string,
): boolean {
  if (!session) return false
  return session.date < today
}

/* ── Cómo se lee el cronómetro ──────────────────────────────────────────── */

/** `00:24:11`. Rescatado literal de `79bece0` (líneas 186-193). */
export function formatElapsedHHMMSS(elapsedMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(elapsedMs / MS_PER_SECOND))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`
}

/** `24m`, `1h`, `1h 24m`. Rescatado literal de `79bece0` (líneas 195-201). */
export function formatElapsedCompact(elapsedMs: number): string {
  const totalMinutes = Math.max(0, Math.floor(elapsedMs / MS_PER_MINUTE))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${minutes}m`
  if (minutes === 0) return `${hours}h`
  return `${hours}h ${minutes}m`
}

/**
 * «llevas 52 min · planeado 45» (criterio 9). Sin color de alarma y sin
 * reproche: es un dato, no un aviso. Cuando no hay nada planeado, solo el
 * «llevas».
 */
export function describeOverPlan(
  elapsedMinutesCount: number,
  plannedMinutes: number | null,
): string | null {
  if (plannedMinutes === null || plannedMinutes <= 0) return null
  if (elapsedMinutesCount <= plannedMinutes) return null
  return `llevas ${elapsedMinutesCount} min · planeado ${plannedMinutes}`
}

/* ── Lo que se le manda al API ──────────────────────────────────────────── */

/**
 * Empezar: la fecha sale **siempre** del reloj —solo se empieza hoy (criterio
 * 335)— y la hora, del reloj también salvo que se diga otra (criterio 331).
 *
 * - `startSessionInput(id, now)` es **exactamente** lo de antes: la hora del
 *   reloj, que es lo que hace el ▶ de un bloque (criterios 2, 17 y 332).
 * - `startSessionInput(id, now, '08:07')` deja la sesión **abierta y contando
 *   desde las 8:07**: una sola escritura, una sola sesión (criterio 331b).
 *
 * `startTime` que no se entienda cae al reloj en vez de mandar basura al API;
 * quien pregunta por pantalla valida antes con `validateStartTime`.
 */
export function startSessionInput(
  activityId: string,
  now: Date,
  startTime?: string | null,
): ActivityFollowUpStartInput {
  const clock = `${pad2(now.getHours())}:${pad2(now.getMinutes())}`
  const chosen = startTime ? readHhMm(startTime) : null
  return {
    activityId,
    date: formatDateToYmd(now),
    startTime: normalizeTimeForApi(chosen ?? clock),
  }
}

/**
 * Cerrar una sesión abierta **a esta hora**: `activityFollowUpEdit` con los
 * minutos entre su inicio y `at`. Sin instante de inicio no se adivina: un
 * minuto, que es el mínimo del API y un número visiblemente raro.
 */
export function closeSessionInput(session: ActivityFollowUp, at: Date): ActivityFollowUpEditInput {
  const start = followUpStartInstant(session)
  return {
    id: session.id,
    durationMinutes: start ? elapsedMinutes(start, at) : 1,
  }
}

/* ── La sesión que quedó abierta de otro día (D3, criterio 16) ──────────── */

/**
 * Lo que registra el «No sé» cuando el bloque de aquel día no dice nada.
 * Es `DEFAULT_BLOCK_MINUTES`, y **se dice en pantalla**.
 */
export const VIDA_UNKNOWN_SESSION_MINUTES = DEFAULT_BLOCK_MINUTES

export type UnknownEndReason = 'planned' | 'default'

export type UnknownEndResult = {
  minutes: number
  reason: UnknownEndReason
  /** Si hubo que recortar para no pasarse de la hora de fin de aquel día. */
  clamped: boolean
}

/**
 * «No sé hasta qué hora la hice»: **la duración planeada de ese bloque y, si no
 * la hay, 30 minutos. Nunca hasta el fin del día.**
 *
 * Una sesión abierta ayer a las 21:00 con el día acabando a las 23:00 daría 120
 * minutos que nadie vivió; una abierta a las 9:00 daría catorce horas. Ese
 * número no es «algo razonable»: es tiempo inventado que entra en el
 * presupuesto y se queda ahí. La duración planeada, en cambio, la escribió el
 * propio usuario.
 *
 * `plannedMinutes` llega **de fuera** (en la tajada 1, el único bloque de aquel
 * día con el mismo `activityId`; si hay varios, `null`, que no se adivina).
 * Cuando la tajada 2 traiga el cruce de D1, esta función no cambia.
 */
export function resolveUnknownEndMinutes(params: {
  startTime: string
  plannedMinutes: number | null
  dayEndTime: string
}): UnknownEndResult {
  const { startTime, plannedMinutes, dayEndTime } = params
  const wanted =
    plannedMinutes !== null && plannedMinutes > 0 ? plannedMinutes : VIDA_UNKNOWN_SESSION_MINUTES
  const reason: UnknownEndReason =
    plannedMinutes !== null && plannedMinutes > 0 ? 'planned' : 'default'

  const startMinutes = parseTimeToMinutes(startTime)
  const endMinutes = parseTimeToMinutes(dayEndTime)
  // Un día que acaba antes de que empezara la sesión (empezó a las 23:30 con el
  // día cerrando a las 23:00) no recorta nada: recortaría a cero.
  const room = endMinutes > startMinutes ? endMinutes - startMinutes : null

  if (room !== null && wanted > room) {
    return { minutes: Math.max(1, room), reason, clamped: true }
  }
  return { minutes: Math.max(1, wanted), reason, clamped: false }
}

/**
 * Los minutos entre la hora de inicio de la sesión y la hora de fin que la
 * persona escribe a mano. Si la hora de fin es anterior o igual, se entiende
 * que cruzó medianoche (criterio 63: nunca una duración negativa).
 */
export function minutesUntilEndTime(startTime: string, endTime: string): number {
  const start = parseTimeToMinutes(startTime)
  const end = parseTimeToMinutes(endTime)
  // La misma hora no es «un día entero»: es un rato corto que se queda en el
  // mínimo del API. Cruzar medianoche es que la de fin sea **anterior**.
  if (end === start) return 1
  const diff = end > start ? end - start : end + MINUTES_PER_DAY - start
  return Math.max(1, diff)
}

/* ── Registrar lo que se sale (tajada 3, criterios 31, 32 y 36) ─────────── */

/**
 * `YYYY-MM-DD` + `HH:mm` que **todavía no han llegado**, mirando el reloj.
 *
 * Rescatado de `79bece0:…/activity-time.utils.ts:253` (`isFutureDateTime`), con
 * `now` inyectado. Lo usa «Registrar tiempo pasado»: no se registra lo que aún
 * no ha pasado (criterio 32).
 */
export function isFutureDateTime(date: string, time: string, now: Date): boolean {
  const instant = sessionStartInstant(date, time)
  if (!instant) return false
  return instant.getTime() > now.getTime()
}

export type LogPastValidation = { valid: boolean; message: string | null }

/**
 * Las frases de la hora de inicio, **escritas una sola vez** (criterio 333):
 * las dicen igual «Registrar tiempo pasado» y «Empezar algo». Si alguna vez se
 * cambian, cambian en los dos sitios porque son el mismo texto, no dos copias.
 */
const START_TIME_MISSING = 'Dinos a qué hora empezó, con horas y minutos.'
const START_TIME_FUTURE = 'Esa hora todavía no ha llegado.'
const START_DAY_FUTURE = 'Ese día todavía no ha llegado.'

/**
 * La hora tal como se escribe en un campo → `HH:mm`, o `null` si eso no es una
 * hora. Sobre el crudo, no sobre lo normalizado: `normalizeTimeForDisplay('')`
 * devuelve `00:00`, y una hora vacía se colaría como medianoche.
 */
function readHhMm(startTime: string): string | null {
  const looksLikeTime = /^\d{1,2}:\d{2}(:\d{2})?$/.test(startTime.trim())
  const time = looksLikeTime ? normalizeTimeForDisplay(startTime) : ''
  return isValidHhMm(time) ? time : null
}

/**
 * **La hora a la que empezó, sin duración** (criterios 333 y 334): la hoja
 * tiene que ser `HH:mm`, del día que se mira, y **no del futuro** —igual a este
 * minuto **sí** vale, que eso es «ahora»—.
 *
 * Es la mitad de `validateLogPast` que no habla de duración, porque una sesión
 * abierta no la tiene (criterio 30). **Comparten las frases**, no las copian.
 */
export function validateStartTime(params: {
  date: string
  startTime: string
  now: Date
}): LogPastValidation {
  const { date, startTime, now } = params
  const time = readHhMm(startTime)
  if (!time) return { valid: false, message: START_TIME_MISSING }
  const today = formatDateToYmd(now)
  if (date > today) return { valid: false, message: START_DAY_FUTURE }
  if (date === today && isFutureDateTime(date, time, now)) {
    return { valid: false, message: START_TIME_FUTURE }
  }
  return { valid: true, message: null }
}

export type ValidateLogPastInput = {
  /** `YYYY-MM-DD` del día en el que se registra. */
  date: string
  /** `HH:mm` a la que empezó, tal como está escrito en la hoja. */
  startTime: string
  /** Minutos, o `null` si todavía no se ha elegido cuánto. */
  durationMinutes: number | null
  /** El reloj de este momento: ni un `new Date()` aquí dentro. */
  now: Date
}

/**
 * «Registrar tiempo pasado», comprobado **antes** de llamar al API.
 *
 * Rescatada la forma de `79bece0:…/activity-followup-form.ts:58`
 * (`validateLogPastActivityForm`) con otros mensajes —allí eran horas y minutos
 * sueltos; aquí manda `VidaDurationPills`— y con dos reglas que son de esta
 * feature:
 *
 * 1. **La hora tiene que ser `HH:mm`** y del día que se está mirando.
 * 2. **Nada del futuro** (criterio 32): ni una hora que aún no ha llegado, ni un
 *    rato que se acabaría después de ahora. Lo segundo no lo pide el criterio
 *    con esas palabras, pero registrar «de 15:00 a 16:00» a las 15:30 pintaría
 *    en la agenda media hora que nadie ha vivido todavía, y el presupuesto la
 *    contaría. Queda dicho en la sección 3, no escondido.
 *
 * El mínimo de un minuto es del API (`Duration must be at least 1 minute`).
 * Un **día pasado** no tiene ninguna de las dos restricciones de futuro: ahí
 * cualquier hora ya ocurrió.
 */
export function validateLogPast({
  date,
  startTime,
  durationMinutes,
  now,
}: ValidateLogPastInput): LogPastValidation {
  const time = readHhMm(startTime)
  if (!time) {
    return { valid: false, message: START_TIME_MISSING }
  }
  if (durationMinutes === null) {
    return { valid: false, message: 'Elige cuánto duró.' }
  }
  if (durationMinutes < 1) {
    return { valid: false, message: 'Un rato dura como mínimo un minuto.' }
  }
  const today = formatDateToYmd(now)
  if (date > today) {
    return { valid: false, message: START_DAY_FUTURE }
  }
  if (date === today) {
    if (isFutureDateTime(date, time, now)) {
      return { valid: false, message: START_TIME_FUTURE }
    }
    const start = sessionStartInstant(date, time)
    if (start && start.getTime() + durationMinutes * MS_PER_MINUTE > now.getTime()) {
      return {
        valid: false,
        message: 'Ese rato no ha pasado entero todavía. Ajusta cuánto duró.',
      }
    }
  }
  return { valid: true, message: null }
}

/**
 * Lo que se le manda a `activityFollowUpAdd` al registrar un rato que ya pasó
 * (criterio 31). **No toca el plan**: `activityDayPlan` no se nombra aquí ni en
 * la hoja que la llama (criterio 37).
 */
export function logSessionInput(params: {
  date: string
  activityId: string
  startTime: string
  durationMinutes: number
  notes?: string | null
}): ActivityFollowUpInput {
  return {
    activityId: params.activityId,
    date: params.date,
    startTime: normalizeTimeForApi(params.startTime),
    durationMinutes: Math.max(1, Math.round(params.durationMinutes)),
    notes: params.notes?.trim() ? params.notes.trim() : null,
  }
}

/**
 * Corregir una sesión ya registrada (criterio 35): hora, duración y notas.
 * `activityFollowUpEdit` acepta cada campo por separado; se mandan los tres
 * porque la hoja los enseña los tres.
 */
export function editSessionInput(params: {
  id: string
  startTime: string
  durationMinutes: number
  notes?: string | null
}): ActivityFollowUpEditInput {
  return {
    id: params.id,
    startTime: normalizeTimeForApi(params.startTime),
    durationMinutes: Math.max(1, Math.round(params.durationMinutes)),
    notes: params.notes?.trim() ? params.notes.trim() : null,
  }
}

/**
 * **Corregir la hora de inicio de una sesión que sigue en marcha** (FEAT-013,
 * criterio 343): `activityFollowUpEdit` con **`id` y `startTime`, nada más**.
 *
 * Que no viaje `durationMinutes` no es un descuido: el backend arma el `UPDATE`
 * **solo con las columnas presentes**
 * (`xavi-platform-node/src/services/activity-follow-up.service.ts:347-389`), y
 * `isOpen` es `duration_minutes === null`. Mandar la duración aquí cerraría la
 * sesión, que es justo lo contrario de lo que se viene a hacer. Las notas
 * tampoco viajan: quien corrige la hora no está escribiendo una nota.
 */
export function correctStartInput(params: { id: string; startTime: string }): ActivityFollowUpEditInput {
  return {
    id: params.id,
    startTime: normalizeTimeForApi(params.startTime),
  }
}

/**
 * **La sesión ya registrada que se lleva ese minuto**, si la hay (FEAT-013,
 * tajada 2). Sirve para no correr el inicio de lo que está en marcha hasta
 * dentro de un rato que ya tiene dueño: el día contaría dos veces el mismo
 * minuto, que es lo que evita el criterio 26 de FEAT-004.
 *
 * Se mira **solo el instante de inicio**: empezar justo cuando la otra acaba
 * (`8:30` con una que va de 8:00 a 8:30) **sí** vale — son consecutivas, no
 * solapadas. Las sesiones abiertas no cuentan: la que corre es la que se está
 * corrigiendo, y dos abiertas no puede haberlas.
 */
export function findSessionCovering(params: {
  startTime: string
  date: string
  sessions: ActivityFollowUp[]
  exceptId: string
}): ActivityFollowUp | null {
  const time = readHhMm(params.startTime)
  if (!time) return null
  const instant = sessionStartInstant(params.date, time)
  if (!instant) return null
  for (const other of params.sessions) {
    if (other.id === params.exceptId) continue
    if (other.durationMinutes === null || other.durationMinutes === undefined) continue
    const start = followUpStartInstant(other)
    if (!start) continue
    const end = new Date(start.getTime() + other.durationMinutes * MS_PER_MINUTE)
    if (instant.getTime() >= start.getTime() && instant.getTime() < end.getTime()) return other
  }
  return null
}

/**
 * **La hora nueva de una sesión en marcha, comprobada antes de llamar al API**
 * (criterio 346 y el encargo de esta tajada).
 *
 * Tres cosas pueden hacerla imposible, y las tres se dicen aquí y no en el 400
 * del servidor —que además **no comprueba ninguna**: el `UPDATE` de
 * `activity-follow-up.service.ts` acepta lo que le llegue—:
 *
 * 1. **No es una hora**, o es del futuro: las frases de siempre, compartidas con
 *    `validateLogPast` y con `validateStartTime` (criterio 333). La fecha es
 *    **la de la sesión**: corregir la hora no cambia de día.
 * 2. **Cae dentro de un rato ya registrado**: se nombra el vecino y hasta qué
 *    hora llega. Es una descripción, no un reproche (criterio 359).
 * 3. **Antes del comienzo de tu día**: eso **se admite** —hay gente que empieza
 *    antes (criterio 336)— y por eso no está en esta lista.
 */
export function validateCorrectedStart(params: {
  session: ActivityFollowUp
  startTime: string
  now: Date
  /** Las del día de la sesión, para no pisar un rato que ya tiene dueño. */
  daySessions?: ActivityFollowUp[]
}): LogPastValidation {
  const { session, startTime, now, daySessions = [] } = params
  const basic = validateStartTime({ date: session.date, startTime, now })
  if (!basic.valid) return basic
  const taken = findSessionCovering({
    startTime,
    date: session.date,
    sessions: daySessions,
    exceptId: session.id,
  })
  if (taken) {
    const title = taken.activity?.title ?? 'otro rato'
    const start = followUpStartInstant(taken)!
    const end = new Date(start.getTime() + (taken.durationMinutes ?? 0) * MS_PER_MINUTE)
    const endLabel = formatTimeForDisplay(`${pad2(end.getHours())}:${pad2(end.getMinutes())}`)
    return {
      valid: false,
      message: `Ese rato ya lo tiene «${title}», hasta las ${endLabel}. Elige una hora desde esa.`,
    }
  }
  return { valid: true, message: null }
}

/* ── Lo que dice el API cuando algo sale mal ────────────────────────────── */

/**
 * El API responde **en inglés** (`You already have an activity in progress.
 * Finish or cancel it before starting another.`, `Duration must be at least 1
 * minute`): si eso llega a pantalla, se lee horrible y encima usa «cancel», que
 * en Vida está prohibido. Se traduce aquí, que es puro y se prueba.
 */
export function translateSessionError(error: unknown, fallback: string): string {
  const raw = error instanceof Error ? error.message.trim() : ''
  if (!raw) return fallback
  if (/already have an activity in progress/i.test(raw)) {
    return 'Ya tenías algo en marcha. Termínalo y vuelve a empezar.'
  }
  if (/duration must be at least/i.test(raw)) {
    return 'Una sesión dura como mínimo un minuto.'
  }
  if (/not found/i.test(raw)) {
    return 'No encontramos esa sesión. Vuelve a cargar la pantalla.'
  }
  // Cualquier otro mensaje del servidor se queda fuera de la pantalla: está en
  // inglés y puede traer «cancel». Se dice lo nuestro, que sí está en el
  // vocabulario del módulo. El mensaje crudo sigue en la consola del error.
  return fallback
}

/**
 * **Cuánto proponer para lo que se registra en un hueco** (criterios 238 y 239).
 *
 * En este orden: lo que **sueles tardar** en esa actividad, lo que dice la
 * **plantilla**, y `DEFAULT_BLOCK_MINUTES`. Lo que salga se recorta a lo que
 * quepa desde la hora elegida — nunca se propone el hueco entero como duración,
 * solo se usa como techo.
 *
 * Devuelve además **si el número que se ve es la costumbre, entera**: recortado
 * ya no lo es, y decir «sueles tardar 45» encima de un 20 sería presentar como
 * dato algo que no lo es (criterio 240). Molde: `preselectedDuration` de
 * `VidaPlaceInGapSheet`.
 */
export function proposeLogDuration({
  usualMinutes,
  templateMinutes,
  maxMinutes,
}: {
  usualMinutes: number | null
  templateMinutes: number | null
  maxMinutes: number
}): { durationMinutes: number | null; fromUsual: number | null } {
  // Un hueco sin un minuto dentro no propone nada: ahí lo que hay que decir es
  // que no cabe, no un número apagado.
  if (maxMinutes < 1) return { durationMinutes: null, fromUsual: null }
  const candidate = usualMinutes ?? templateMinutes ?? DEFAULT_BLOCK_MINUTES
  const minutes = Math.min(candidate, maxMinutes)
  return {
    durationMinutes: minutes,
    fromUsual: usualMinutes !== null && minutes === usualMinutes ? usualMinutes : null,
  }
}

/**
 * **Empezar desde la hora planeada** (FEAT-013, tajada 3, criterios 350 a 354).
 *
 * Devuelve el `HH:mm` **planeado** cuando tiene sentido ofrecer el atajo, y
 * `null` cuando no. No decide nada más: quien llama pinta la puerta y llama a
 * `start(activityId, startTime)`, **la misma** función de la tajada 1 — aquí no
 * se copia ni un gramo de la aritmética del arranque (criterio 352).
 *
 * Las tres puertas, y las tres son el criterio escrito:
 *
 * 1. **Sin reloj no hay atajo** (`nowMinutes === null`): un día pasado o futuro
 *    no tiene «ya pasó».
 * 2. **Nada del futuro** (criterio 353): la hora planeada tiene que haber
 *    pasado de verdad. Igual al minuto de ahora **no** cuenta: eso es «ahora»,
 *    y para eso está el ▶ de siempre.
 * 3. **La ventana es `VIDA_MOVED_THRESHOLD_MINUTES`** (60 min), la de FEAT-004
 *    criterio 20, **no una segunda constante** (criterio 354): más allá de ahí
 *    la sesión ya no sería «este bloque, algo tarde» sino un bloque movido, y
 *    un plan de hace cuatro horas no ofrece registrar cuatro horas de un toque.
 */
export function plannedStartShortcut({
  blockStartMinutes,
  nowMinutes,
}: {
  blockStartMinutes: number
  nowMinutes: number | null
}): string | null {
  if (nowMinutes === null) return null
  const late = nowMinutes - blockStartMinutes
  if (late <= 0) return null
  if (late > VIDA_MOVED_THRESHOLD_MINUTES) return null
  return minutesToTime(blockStartMinutes)
}
