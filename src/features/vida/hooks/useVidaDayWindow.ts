import { useVidaDayHours, type VidaDayHours } from '@/features/vida/hooks/useVidaDayHours'
import { useVidaNight, type VidaNightState } from '@/features/vida/hooks/useVidaNight'
import type { VidaDayOfWeek } from '@/features/vida/types/vida-item.types'
import { getNightLog, useVidaDeviceNotesStore } from '@/features/vida/store/vida-device-notes.store'
import { getCurrentLocalDate, getVidaDayOfWeek } from '@/features/vida/utils/vida-date.utils'
import type {
  VidaNight,
  VidaNightLog,
  VidaRealDayStartReason,
} from '@/features/vida/utils/vida-night.utils'
import {
  VIDA_REAL_START_NOTE,
  formatNightDuration,
  nightBandsForWeekday,
  nightDurationMinutes,
  nightLogDurationMinutes,
  resolveRealDayStart,
} from '@/features/vida/utils/vida-night.utils'
import { isEndAfterStart } from '@/features/vida/utils/vida-time.utils'

/**
 * De dónde sale cada borde de la ventana. `night-real` es la hora **que
 * ocurrió** (criterio 300); `night`, la que tu noche planea.
 */
export type VidaDayWindowSource = 'night' | 'night-real' | 'settings' | 'fallback'

export type VidaDayWindow = VidaDayHours & {
  /** La noche planeada tal cual, o `null` si no hay o no se puede usar todavía. */
  night: VidaNight | null
  /** La noche que **termina** ese día: la franja de arriba (`dawn`). */
  nightEnding: VidaNight | null
  /** La noche que **empieza** ese día y cruza: la franja de abajo (`dusk`). */
  nightStarting: VidaNight | null
  startSource: VidaDayWindowSource
  endSource: VidaDayWindowSource
  /** «duermes 6 h» para la línea «Tu día …» (criterio 277). `null` sin noche. */
  sleepLabel: string | null
  /**
   * Cómo llamar a lo que es respaldo del cliente, cuando lo hay (criterios 280
   * y 283). `null` cuando los dos bordes son una elección — de la noche o de
   * «Tu día»—. `isDefault` es exactamente `defaultScheduleNote !== null`.
   */
  defaultScheduleNote: string | null
  /**
   * **Qué pasó con la hora real de levantarse** (FEAT-012, tajada 4). Manda
   * cuando la hay (`real`, criterio 300); sin respuesta o sin dato, manda lo
   * planeado (criterios 302 y 304).
   */
  realStartReason: VidaRealDayStartReason
  /**
   * **Que la ventana es lo planeado y no un dato real**, dicho con palabras
   * (criterio 304). `null` cuando no hay nada que aclarar.
   */
  plannedStartNote: string | null
}

/**
 * **La ventana del día, con la noche puesta** (FEAT-012, tajada 2).
 *
 * Qué resuelve y por qué está aquí y no dentro de `useVidaDayHours`: la ventana
 * del día deja de ser una propiedad de los ajustes y pasa a depender **del
 * día**. `useVidaDayHours` lo llaman siete sitios y dos no tienen fecha
 * (`VidaTomorrowAside` —antes `VidaTemplateAside`— y la cuadrícula de la
 * semana), así que sigue siendo el lector crudo de los ajustes y **no se
 * toca**; esto lo compone encima.
 *
 * La regla, que es la decisión D1 y la respuesta del usuario del 2026-09-24:
 *
 * - **El día empieza a la hora de levantarse** de la noche que termina ese día.
 * - **El día acaba a la hora de acostarse** de la noche que empieza ese día.
 * - Lo que la noche no diga lo sigue diciendo `vidaDayStartTime` /
 *   `vidaDayEndTime`, con su respaldo 06:30 / 23:00 **dicho como respaldo**
 *   (criterios 280 y 283). Esos dos ajustes **no se borran ni se tocan**.
 *
 * Consecuencia que hay que tener presente al leer cualquier cifra: **el día se
 * encoge**. Con una noche de 23:00 a 5:00 el presupuesto se mide sobre 18 horas
 * y no sobre 24, así que «puestas de 16h 30» pasa a decir otro número. Es lo
 * que el usuario pidió —«sí, sale del presupuesto del día»—: lo que planeas se
 * mide contra el tiempo que de verdad tienes despierto. Los minutos de sueño
 * **no** se cuentan como tiempo puesto en ningún sitio (criterio 284); lo único
 * que cambia es contra qué se miden.
 *
 * Tres guardas que no son adorno:
 *
 * 1. **Cargando o con error no hay noche.** La noche viaja en `mySettings`, la
 *    misma consulta que las horas del día: mientras está en vuelo la ventana es
 *    la de siempre y no salta después (criterio 286). Es la misma guarda que ya
 *    escribió la plantilla en la tajada 1.
 * 2. **Una ventana que no avanza no es una ventana.** Configuraciones raras
 *    —levantarse a las 23:30 con «Tu día» acabando a las 23:00— darían un
 *    inicio posterior al fin y dejarían la agenda sin geometría. En ese caso se
 *    cae entera a los ajustes, igual que `useVidaDayHours` hace con un dato
 *    roto, y se dice que es el respaldo.
 * 3. **La ventana sale de las mismas dos franjas que se pintan**
 *    (`nightBandsForWeekday`), no de una segunda lectura de la noche. Si la
 *    franja de abajo no existe porque la noche no cruza la medianoche, tampoco
 *    existe la hora de acostarse que cierra ese día (criterio 283).
 */
export function resolveVidaDayWindow(
  hours: VidaDayHours,
  nightState: VidaNightState,
  day: VidaDayOfWeek | null,
  /**
   * **Lo que se durmió de verdad esa noche** (tajada 4), o `null`. Solo lo
   * tienen los días **con fecha y con pasado**: la plantilla es una semana tipo
   * y un día futuro no tiene noche que contar (criterio 309), así que ahí llega
   * siempre `null` y esta función se comporta **exactamente** como en la
   * tajada 2.
   */
  log: VidaNightLog | null = null,
): VidaDayWindow {
  // Guarda 1: en vuelo o caído, la noche no existe para nadie (criterio 286).
  const usableNight =
    nightState.isPending || nightState.isError || day === null ? null : nightState.night
  const bands = day === null ? { dawn: null, dusk: null } : nightBandsForWeekday(usableNight, day)

  const candidateStart = bands.dawn ? bands.dawn.wakeTime : hours.startTime
  const candidateEnd = bands.dusk ? bands.dusk.bedTime : hours.endTime
  // Guarda 2: si la noche dejara el día del revés, manda lo de siempre.
  const coherent = isEndAfterStart(candidateStart, candidateEnd)

  const dawn = coherent ? bands.dawn : null
  const dusk = coherent ? bands.dusk : null
  const settingsSource: VidaDayWindowSource = hours.isDefault ? 'fallback' : 'settings'
  const endSource: VidaDayWindowSource = dusk ? 'night' : settingsSource
  const endTime = dusk ? dusk.bedTime : hours.endTime

  /**
   * **Lo real manda sobre lo planeado** (tajada 4, criterios 300 a 304).
   *
   * Solo se mira si esa noche **termina aquí**: lo guardado cuenta la noche que
   * abre este día, y si este día no tiene franja de arriba no hay hora real de
   * levantarse que ponga. La regla completa —incluido qué se hace con una hora
   * que no dejaría día— vive en `resolveRealDayStart`, con su porqué.
   */
  const realStart = dawn
    ? resolveRealDayStart(log, endTime)
    : ({ startTime: null, reason: 'unconfirmed' } as const)
  const startTime = realStart.startTime ?? (dawn ? dawn.wakeTime : hours.startTime)
  const startSource: VidaDayWindowSource = realStart.startTime
    ? 'night-real'
    : dawn
      ? 'night'
      : settingsSource

  // La duración que se enseña es la de la noche que **manda** en este día: la
  // que lo abre si la hay, y si no la que lo cierra. Nunca una suma de las dos:
  // con una noche que cruza son la misma noche, y sumarla sería contarla doble.
  //
  // Y con la hora real puesta, la cifra también es la real: decir «duermes 6 h»
  // al lado de un día que empieza a las 6:40 sería enseñar dos datos que no
  // casan (criterio 317). Si de lo real solo quedó una hora, no hay duración
  // que decir y manda otra vez lo planeado (criterio 305).
  const leading = dawn ?? dusk
  const realMinutes = realStart.reason === 'real' ? nightLogDurationMinutes(log) : null
  const sleepLabel =
    realMinutes !== null
      ? `dormiste ${formatNightDuration(realMinutes)}`
      : leading
        ? `duermes ${formatNightDuration(nightDurationMinutes(leading.bedTime, leading.wakeTime))}`
        : null

  const defaultScheduleNote =
    startSource === 'fallback' && endSource === 'fallback'
      ? 'el horario por defecto'
      : endSource === 'fallback'
        ? 'el final es el horario por defecto'
        : startSource === 'fallback'
          ? 'el comienzo es el horario por defecto'
          : null

  return {
    ...hours,
    startTime,
    endTime,
    isDefault: defaultScheduleNote !== null,
    realStartReason: realStart.reason,
    plannedStartNote: VIDA_REAL_START_NOTE[realStart.reason],
    night: usableNight,
    nightEnding: dawn,
    nightStarting: dusk,
    startSource,
    endSource,
    sleepLabel,
    defaultScheduleNote,
    isPending: hours.isPending || nightState.isPending,
    isError: hours.isError || nightState.isError,
    isDisabled: hours.isDisabled && nightState.isDisabled,
  }
}

/**
 * La ventana de **una fecha** (`YYYY-MM-DD`). La usan Hoy y la revisión.
 *
 * No estrena consulta: `useVidaDayHours` y `useVidaNight` son dos envoltorios de
 * lectura sobre la **misma** `useUserSettingsQuery`, que React Query deduplica
 * (criterio 318).
 */
export function useVidaDayWindow(date: string | null): VidaDayWindow {
  const hours = useVidaDayHours()
  const night = useVidaNight()
  /**
   * **Lo real vive en el aparato** (tajada 4): un selector del store, ni una
   * consulta más (criterio 318). Se lee **aquí** y no en cada pantalla para que
   * confirmar una noche recalcule de una vez la ventana de Hoy **y** la de su
   * revisión (criterios 300, 301 y 308): una regla, no dos copias que un día
   * dirán cosas distintas.
   */
  const nightLogs = useVidaDeviceNotesStore((state) => state.nightLogs)
  /**
   * **Un día futuro no tiene sueño** (criterio 309). No se puede guardar desde
   * la pantalla, y aquí tampoco se lee: si algún aparato tuviera una entrada
   * con fecha de mañana —otra sesión, el reloj movido—, su franja seguiría
   * contando lo planeado y no movería ninguna ventana.
   */
  const usableLog =
    date !== null && date <= getCurrentLocalDate() ? getNightLog(nightLogs, date) : null
  return resolveVidaDayWindow(
    hours,
    night,
    date === null ? null : getVidaDayOfWeek(date),
    usableLog,
  )
}

/**
 * La ventana de **un día de la semana**. La usa la plantilla, que es una semana
 * tipo y no tiene fechas.
 *
 * **Aquí no entra lo real**, y no es un olvido: en una semana tipo no existe
 * «la noche del martes pasado», existe «los martes». La plantilla es lo que
 * planeas, y lo que dormiste una noche concreta no puede moverla.
 */
export function useVidaWeekdayWindow(day: VidaDayOfWeek | null): VidaDayWindow {
  const hours = useVidaDayHours()
  const night = useVidaNight()
  return resolveVidaDayWindow(hours, night, day)
}
