import { useEffect, useState } from 'react'
import { minutesToTime } from '@/features/vida/utils/vida-time.utils'

export type VidaNowMinute = {
  /** Minutos desde medianoche. `null` cuando el día mostrado no es hoy. */
  minutes: number | null
  /** «9:24». `null` cuando `minutes` lo es. */
  label: string | null
}

function readNowMinutes(): number {
  const now = new Date()
  return now.getHours() * 60 + now.getMinutes()
}

/** «9:24»: sin cero a la izquierda, como el resto del módulo. */
function formatNowLabel(minutes: number): string {
  const [hours, mins] = minutesToTime(minutes).split(':')
  return `${Number(hours)}:${mins}`
}

/**
 * «Ahora», en minutos desde medianoche, actualizado **una vez por minuto**.
 *
 * Rescate de `79bece0:src/features/activities/hooks/useCurrentTimeMarker.ts`,
 * que ya tictaqueaba cada 60 s —justo lo que pide el criterio 12—. Tres
 * cambios: devuelve también el número, porque la barra y la marca lo necesitan
 * como número y no como etiqueta; **no tictaquea** cuando `enabled` es `false`,
 * que es como el día futuro de la tajada 4 apagará la marca (criterio 33); y el
 * refresco de entrada va por un `setTimeout(0)` en vez de una llamada directa,
 * porque poner estado en el cuerpo de un efecto encadena renders y el linter de
 * este repo lo marca (`react-hooks/set-state-in-effect`).
 *
 * Lo que **no** vuelve es `useRemainingDayTimer`: tictaqueaba cada segundo (era
 * un cronómetro) y traía `DAY_END_TIME = '23:00:00'` dentro del código. Aquí el
 * fin del día sale de los ajustes, y para «te quedan» el minuto sobra.
 */
export function useVidaNowMinute(enabled = true): VidaNowMinute {
  const [minutes, setMinutes] = useState(readNowMinutes)

  useEffect(() => {
    if (!enabled) return
    const tick = () => setMinutes(readNowMinutes())
    // El `0` deja el primer refresco fuera del cuerpo del efecto y además cubre
    // el caso de volver a un día que sí es hoy tras un rato apagado.
    const timeoutId = window.setTimeout(tick, 0)
    const intervalId = window.setInterval(tick, 60_000)
    return () => {
      window.clearTimeout(timeoutId)
      window.clearInterval(intervalId)
    }
  }, [enabled])

  if (!enabled) return { minutes: null, label: null }
  return { minutes, label: formatNowLabel(minutes) }
}
