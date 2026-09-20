import { useEffect, useState } from 'react'
import {
  formatElapsedCompact,
  formatElapsedHHMMSS,
} from '@/features/vida/utils/vida-session.utils'

/**
 * El cronómetro de la sesión abierta.
 *
 * Rescatado de `git show 79bece0:src/features/activities/hooks/useElapsedTimer.ts`,
 * con dos cambios: recibe el **instante** (`Date`) que da `sessionStartInstant`
 * en vez de una cadena ISO —el API no manda ISO de inicio: manda `date` y
 * `startTime` por separado— y devuelve además los minutos, que es lo que
 * necesita el «llevas 52 min · planeado 45» del criterio 9.
 *
 * Lo que ya hacía bien y por eso se rescata en vez de reescribirse:
 *
 * - **No acumula tics** (criterio 3): cada tic es `Date.now() − inicio`, así que
 *   recargar la página o volver de otra pestaña enseña el tiempo **real**
 *   transcurrido y no el que el componente estuvo montado.
 * - **Limpia el intervalo al desmontar** (criterio 4): sin eso, cambiar de
 *   pantalla dentro del módulo dejaría un tic vivo por visita.
 *
 * Tictaquea **en el cliente y no pide nada**: la sesión abierta vive en
 * `vidaKeys.followUps.open()` con `refetchOnWindowFocus`, sin `refetchInterval`
 * (decisión 1 del arquitecto). Un sondeo por minuto serían ~60 peticiones/hora
 * contra una instancia que se duerme, para leer un dato que acabamos de
 * escribir.
 */

type ElapsedFormat = 'hhmmss' | 'compact'

export type VidaElapsed = {
  /** `00:24:11` o `24m`, según el formato. */
  label: string
  /** Minutos enteros transcurridos (truncados, no redondeados). */
  minutes: number
  /** Milisegundos transcurridos, por si alguien quiere otro formato. */
  elapsedMs: number
}

export function useVidaElapsed(
  startInstant: Date | null | undefined,
  format: ElapsedFormat = 'hhmmss',
): VidaElapsed {
  const startMs = startInstant ? startInstant.getTime() : null
  const [ticked, setTicked] = useState(() =>
    startMs === null ? 0 : Math.max(0, Date.now() - startMs),
  )
  // Sin sesión el valor se **deriva**, no se guarda: poner el estado a cero
  // dentro del efecto sería un `setState` síncrono ahí dentro, que en este
  // repositorio es error de linter y además un repintado de más.
  const elapsedMs = startMs === null ? 0 : ticked

  useEffect(() => {
    if (startMs === null) return

    const tick = () => setTicked(Math.max(0, Date.now() - startMs))
    // El primer tic es **inmediato**: montarse 40 min después del inicio marca
    // 40:00 y no 00:00 hasta el segundo siguiente (criterio 3).
    tick()
    const intervalId = window.setInterval(tick, format === 'compact' ? 60_000 : 1000)
    return () => window.clearInterval(intervalId)
  }, [startMs, format])

  return {
    label: format === 'compact' ? formatElapsedCompact(elapsedMs) : formatElapsedHHMMSS(elapsedMs),
    minutes: Math.floor(elapsedMs / 60_000),
    elapsedMs,
  }
}
