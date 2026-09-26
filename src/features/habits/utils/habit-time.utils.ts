import { getTodayString } from '@/features/habits/utils/habit-type.utils'

/**
 * La hora de reloj de un seguimiento (`timeOfDay`), como cadena local «HH:mm».
 *
 * Esto **no es aritmética de lectura** (esa vive en `habit-panel.utils.ts`): es
 * el sello de la hora en el momento de escribir. Está aparte porque la regla que
 * más importa —**un día que no es hoy no lleva hora inventada**— tiene que poder
 * probarse sola, sin montar ningún componente ni ningún hook.
 *
 * Ojo con el falso amigo: el campo `time` del seguimiento es **duración en
 * minutos** de un hábito de tipo `time`. Aquí no se toca.
 */

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/** `true` solo para «HH:mm» de 24 h entre `00:00` y `23:59`. */
export function isValidHHmm(value: string | null | undefined): boolean {
  return typeof value === 'string' && HHMM.test(value)
}

/**
 * La hora del reloj local en el instante de llamarla, «HH:mm».
 *
 * Se llama **al pulsar** (dentro del `mutationFn`), nunca al montar un
 * formulario: si la hoja del día se queda abierta diez minutos, la hora que se
 * guarda es la del botón.
 */
export function nowHHmm(now: Date = new Date()): string {
  return `${pad2(now.getHours())}:${pad2(now.getMinutes())}`
}

/**
 * Normaliza lo que llega del API a «HH:mm», o `null` si no es una hora leíble.
 * El API ya devuelve «HH:mm», pero una columna `TIME` de Postgres puede asomar
 * como «HH:mm:ss»: recortar aquí es más barato que descubrirlo en pantalla.
 * `null` es legítimo y significa **sin hora**, nunca medianoche.
 */
export function toHHmm(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim().slice(0, 5)
  return isValidHHmm(trimmed) ? trimmed : null
}

/**
 * Qué hora se sella al registrar el día `date`.
 *
 * Solo el día de hoy tiene una hora que alguien pueda saber. Registrar un día
 * pasado desde el calendario devuelve `null`: la hora del reloj de hoy no es la
 * hora en que ocurrió aquel día, y fabricarla envenenaría la única métrica que
 * esta feature quiere construir.
 *
 * `date` ausente significa «hoy» (el API lo resuelve así), así que lleva hora.
 */
export function timeOfDayForDate(
  date: string | undefined,
  today: string = getTodayString(),
  now: Date = new Date(),
): string | null {
  if (date !== undefined && date !== today) return null
  return nowHHmm(now)
}
