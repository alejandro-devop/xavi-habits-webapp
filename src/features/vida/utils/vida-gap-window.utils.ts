/**
 * La ventana **real** de un hueco: los bordes de lo que pasó de verdad, no los
 * del plan (FEAT-011, criterios 233–237).
 *
 * El plan dice «Libre de 9:30 a 11:30» porque «Desayunar» estaba planeado hasta
 * las 9:30. Pero el desayuno **acabó a las 9:28**, así que a las 9:28 ya había
 * sitio; y si acabó a las 9:40, a las 9:35 no lo había. Lo mismo por el otro
 * lado con el bloque que cierra el hueco. Eso es lo que se calcula aquí.
 *
 * **Tres cosas que sostienen este archivo, y conviene no deshacerlas:**
 *
 * 1. **No importa nada de `vida-execution.utils.ts`, ni siquiera tipos.** Los
 *    vecinos entran como `GapNeighbour`, que es forma plana: así no hay ciclo
 *    (execution → gap-window → execution) y el test son objetos literales.
 * 2. **`RealGapWindow` extiende `GapWindow`**, el tipo estructural suelto de
 *    `vida-gap-form.utils.ts`. Por eso `validatePlacement`, `describeLeftovers`,
 *    `describeWindow` y `getMaxDurationForStartTime` se la tragan **sin
 *    tocarlos**: esto es un **tercer constructor** de ventana —al lado de
 *    `gapToWindow` y `getBlockEditWindow`—, no una modificación de los otros
 *    dos. Con eso el criterio 236 (el camino de planear no cambia de
 *    comportamiento) es verdadero **por construcción**.
 * 3. **`describePlacementBlocker` envuelve, no sustituye.** Llama a
 *    `validatePlacement` y **añade** la cláusula que nombra al vecino. Meter esa
 *    cláusula dentro de `validatePlacement` cambiaría el texto del camino de
 *    planear, que el criterio 236 congela.
 *
 * Y la regla de producto de Vida manda también aquí: **nada de culpa**. Se dice
 * dónde sí cabe y quién ocupa el borde; nunca que sobró tiempo ni que se
 * desperdició nada.
 */

import type { GapWindow, PlacementValidation } from '@/features/vida/utils/vida-gap-form.utils'
import { validatePlacement } from '@/features/vida/utils/vida-gap-form.utils'
import {
  formatTimeForDisplay,
  minutesToTime,
  parseTimeToMinutes,
} from '@/features/vida/utils/vida-time.utils'

/**
 * El vecino de un lado del hueco, en forma plana: puede ser un **bloque del
 * plan** (con o sin sesión) o una **sesión ya registrada** —incluida la que
 * está corriendo—, que para esto es un vecino más: se lee, no se toca (D4 de
 * FEAT-004 es de **empezar**, no de registrar; criterio 235).
 */
export type GapNeighbour = {
  /** Cómo se llama, para poder nombrarlo en el aviso. `null` si no tiene nombre. */
  title: string | null
  /** Lo que decía el plan: fin del de antes, inicio del de después. */
  plannedMinutes: number
  /** Lo que pasó de verdad: fin/inicio de **su** sesión. `null` si no tuvo. */
  realMinutes: number | null
  /** Su sesión sigue abierta. */
  isRunning: boolean
}

/**
 * Un `GapWindow` que además recuerda **de dónde salió cada borde**: quién está
 * a cada lado y cuánto se movió respecto al plan. Lo segundo es lo que deja
 * explicar por qué la hoja acepta algo que el renglón no parece ofrecer
 * (criterio 234).
 */
export type RealGapWindow = GapWindow & {
  /** El vecino de la izquierda; `GapWindow` solo nombra al de la derecha. */
  previousBlockTitle: string | null
  /** El borde del plan, para poder contar la diferencia. */
  plannedStartMinutes: number
  plannedEndMinutes: number
  /** Real − plan. Negativo: el hueco empieza **antes**. Positivo: **más tarde**. */
  startShiftMinutes: number
  /** Real − plan. Negativo: el hueco acaba **antes**. Positivo: **más tarde**. */
  endShiftMinutes: number
  /** El vecino de la izquierda sigue en marcha. */
  previousIsRunning: boolean
  /** El vecino de la derecha sigue en marcha. */
  nextIsRunning: boolean
  /**
   * El vecino de la derecha empieza **justo** donde acaba la ventana. Cuando es
   * `false` —un hueco partido por «ahora», por ejemplo— `nextBlockTitle` sigue
   * diciendo quién cierra el hueco (lo usa `describeLeftovers`), pero **no se
   * puede afirmar que entre a esa hora**: ahí el aviso se calla en vez de
   * inventarse un reloj.
   */
  nextTouchesEnd: boolean
  /** Lo mismo por la izquierda. */
  previousTouchesStart: boolean
}

export type BuildGapRealWindowInput = {
  /** El hueco **ya partido** tal y como se pinta: de él salen los bordes del plan. */
  gap: { startMinutes: number; endMinutes: number; nextBlockTitle: string | null }
  before: GapNeighbour | null
  after: GapNeighbour | null
  /** Minutos desde medianoche, o `null` si el día mostrado no es hoy. */
  nowMinutes?: number | null
  /** Recortar el final a «ahora» (la mitad de delante del hueco, criterio 242). */
  clampToNow?: boolean
}

/**
 * Los bordes reales del hueco.
 *
 * - **Vecino con sesión:** manda su borde real. Acabó antes → el hueco empieza
 *   antes; acabó después → empieza después. Igual por la derecha.
 * - **Vecino sin sesión, o sin vecino** (el hueco lo cierra el fin del día):
 *   manda el plan. No se inventa nada de lo que no hay dato.
 * - La ventana **nunca se da la vuelta**: si los dos bordes se cruzan —un
 *   vecino que se comió el hueco entero— queda vacía y la validación de
 *   siempre dice que ahí no cabe nada.
 *
 * El hueco **no se mueve de sitio**: esto acompaña al hueco, no lo redefine.
 * `gap.startMinutes` / `gap.endMinutes` siguen siendo los del plan porque el
 * presupuesto y la leyenda (criterio 14 de FEAT-003) reparten la barra desde
 * ahí.
 */
export function buildGapRealWindow({
  gap,
  before,
  after,
  nowMinutes = null,
  clampToNow = false,
}: BuildGapRealWindowInput): RealGapWindow {
  const plannedStartMinutes = gap.startMinutes
  const plannedEndMinutes = gap.endMinutes

  // **Solo manda el borde real del vecino que está PEGADO al hueco.** Un hueco
  // partido por «ahora» (lo hace `buildDayAgenda`) tiene delante un bloque que
  // acabó dos horas antes: su hora real no dice nada de este rato, y tomarla
  // abriría la ventana hacia atrás por encima de lo que hay en medio. La
  // comprobación es `plannedMinutes`, que es justo para lo que está.
  const previous = before !== null && before.plannedMinutes === plannedStartMinutes ? before : null
  const next = after !== null && after.plannedMinutes === plannedEndMinutes ? after : null

  const rawStart = previous?.realMinutes ?? plannedStartMinutes
  const neighbourEnd = next?.realMinutes ?? plannedEndMinutes
  // **Recortar a «ahora» despega al vecino del final.** Si no, el aviso diría
  // «A las 9:30 entra Daily meeting» de una reunión que empieza a las 11:30:
  // la misma hora inventada que `nextTouchesEnd` está para evitar. Quien cierra
  // el rato por ese lado pasa a ser el reloj, y el reloj no tiene nombre.
  const clipEnd =
    clampToNow && nowMinutes !== null && nowMinutes < neighbourEnd ? nowMinutes : null
  const clipped = clipEnd !== null
  const rawEnd = clipEnd ?? neighbourEnd

  // Los dos bordes pueden cruzarse (un vecino que se alargó por encima del
  // otro): la ventana se queda vacía en el borde de la izquierda, nunca al
  // revés. Una ventana con el final antes del principio haría que
  // `getMaxDurationForStartTime` devolviera números negativos.
  const startMinutes = rawStart
  const endMinutes = Math.max(rawStart, rawEnd)

  return {
    startMinutes,
    endMinutes,
    nextBlockTitle: next?.title ?? gap.nextBlockTitle,
    previousBlockTitle: previous?.title ?? null,
    plannedStartMinutes,
    plannedEndMinutes,
    startShiftMinutes: startMinutes - plannedStartMinutes,
    endShiftMinutes: endMinutes - plannedEndMinutes,
    previousIsRunning: previous?.isRunning ?? false,
    nextIsRunning: next?.isRunning ?? false,
    nextTouchesEnd: next !== null && !clipped,
    previousTouchesStart: previous !== null,
  }
}

/**
 * **Por qué este rato no es el del renglón** (criterio 234): «Desayunar acabó a
 * las 9:28, así que aquí empieza antes».
 *
 * El renglón del hueco sigue diciendo las horas del **plan** —para que la barra
 * y su leyenda cuadren— y la hoja explica la diferencia. Sin diferencia,
 * `null`: no se dice nada que no aporte.
 */
export function describeGapWindowShift(space: GapWindow & Partial<RealGapWindow>): string | null {
  // Acepta también una ventana **del plan** (la de `gapToWindow`, sin los
  // campos de más): ahí no hay diferencia que contar y sale `null`. Así la hoja
  // no necesita distinguir de qué constructor vino su ventana.
  const startShiftMinutes = space.startShiftMinutes ?? 0
  const endShiftMinutes = space.endShiftMinutes ?? 0
  const parts: string[] = []

  if (startShiftMinutes !== 0) {
    const when = formatTimeForDisplay(minutesToTime(space.startMinutes))
    const name = space.previousBlockTitle ?? null
    const tail = startShiftMinutes < 0 ? 'así que aquí empieza antes' : 'así que aquí empieza más tarde'
    parts.push(
      name
        ? `${name} ${space.previousIsRunning ? 'lleva ocupado hasta las' : 'acabó a las'} ${when}, ${tail}`
        : `Este rato empieza de verdad a las ${when}`,
    )
  }

  if (endShiftMinutes !== 0) {
    const when = formatTimeForDisplay(minutesToTime(space.endMinutes))
    const name = space.nextTouchesEnd === false ? null : space.nextBlockTitle
    const tail = endShiftMinutes < 0 ? 'así que aquí acaba antes' : 'así que aquí acaba más tarde'
    parts.push(name ? `${name} empezó a las ${when}, ${tail}` : `Este rato acaba de verdad a las ${when}`)
  }

  if (parts.length === 0) return null
  return `${parts.join('. ')}.`
}

/**
 * El aviso de que no cabe, **nombrando al vecino del otro lado** (criterios 225,
 * 233 y 235): «Desde las 10:45 caben 45 min. Elige menos tiempo o empieza
 * antes. A las 11:30 entra Daily meeting.»
 *
 * Envuelve a `validatePlacement`: las palabras de siempre primero —las mismas
 * que ve quien planea— y la cláusula del vecino detrás. Devuelve `null` cuando
 * sí cabe.
 */
export function describePlacementBlocker(
  input: { startTime: string; durationMinutes: number | null },
  space: GapWindow & Partial<RealGapWindow>,
): string | null {
  const validation: PlacementValidation = validatePlacement(input, space)
  if (validation.valid || validation.message === null) return null

  // **La ventana que se quedó sin sitio** (hallazgo 1 de la revisión de la
  // tajada 2). Un vecino que se comió el hueco entero deja `startMinutes ===
  // endMinutes`, y entonces la frase de siempre dice la misma hora dos veces:
  // «Aquí cabe algo entre las 11:40 y las 11:40». Bloquea bien, pero no se
  // entiende. Aquí se dice lo que pasa, sin culpa y sin llamar «vacío» a nada.
  // Va **antes** de la salida por duración: con la ventana sin sitio, la hora
  // ya está fuera y da igual cuánto dure.
  if (space.endMinutes <= space.startMinutes) {
    const clause = beforeClause(space) ?? afterClause(space)
    return clause === null
      ? `${NO_ROOM_LEFT} Lo de al lado ocupó todo este rato.`
      : `${NO_ROOM_LEFT} ${clause}`
  }

  // «Dile cuánto dura» no habla de ningún borde: nombrar ahí al vecino sería
  // ruido sobre una frase que ya dice qué hacer.
  if (input.durationMinutes === null || input.durationMinutes < 1) return validation.message

  const start = parseTimeToMinutes(input.startTime)
  const clause = start < space.startMinutes ? beforeClause(space) : afterClause(space)
  return clause === null ? validation.message : `${validation.message} ${clause}`
}

/** El principio de la frase cuando la ventana se quedó sin un minuto dentro. */
const NO_ROOM_LEFT = 'Aquí ya no queda rato libre.'

function beforeClause(space: GapWindow & Partial<RealGapWindow>): string | null {
  const when = formatTimeForDisplay(minutesToTime(space.startMinutes))
  const name = space.previousTouchesStart === false ? null : (space.previousBlockTitle ?? null)
  if (name === null) return null
  return space.previousIsRunning
    ? `${name} lleva ocupado hasta las ${when}.`
    : `${name} acabó a las ${when}.`
}

function afterClause(space: GapWindow & Partial<RealGapWindow>): string | null {
  const when = formatTimeForDisplay(minutesToTime(space.endMinutes))
  // Sin vecino pegado al final no se dice a qué hora entra nadie: el hueco lo
  // cierra «ahora», o un trozo, y esa frase sería un dato falso.
  if (space.nextTouchesEnd === false) return null
  return space.nextBlockTitle === null ? null : `A las ${when} entra ${space.nextBlockTitle}.`
}
