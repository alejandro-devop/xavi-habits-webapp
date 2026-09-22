import { describeEndTime } from '@/features/vida/utils/vida-template.utils'
import styles from './VidaEndTimeLine.module.scss'

type VidaEndTimeLineProps = {
  /** El `id` con el que los campos de «Cuánto» la enlazan (`aria-describedby`). */
  id: string
  /** `HH:mm`, `''` o `null`: lo que hay escrito ahora, no lo guardado. */
  startTime: string | null
  durationMinutes: number | null
}

/**
 * **«→ Acaba a las 20:20»** (FEAT-008, tajada 2): la consecuencia en el reloj
 * de lo que estás escribiendo, debajo de «Cuánto».
 *
 * **Un solo componente para todas las pantallas que lo enseñan**, que es lo que
 * hace literal el criterio 120 —«la misma línea, con las mismas palabras»—: la
 * hoja del ítem, el panel «Añadir a mi Vida» y la modal de registrar tiempo
 * pasado montan este mismo, no tres parecidos. No decide nada y no calcula
 * nada: `describeEndTime` (`vida-template.utils.ts`) escribe las frases y
 * `resolveEndTime` (`vida-time.utils.ts`) hace la única suma del módulo.
 *
 * **No es la caja violeta de FEAT-007 y no le roba el acento** (criterio 124):
 * aquello es historia —lo que dicen tus semanas— y esto es el dato de lo que
 * estás escribiendo ahora. Texto llano, y por eso va **antes**.
 *
 * El contenedor se pinta **siempre**, vacío incluido (`:empty` lo apaga), para
 * que el `aria-describedby` de los campos apunte a algo estable y la región
 * viva no se inserte de golpe. `aria-live="polite"` y no `assertive`: el lector
 * lo cuenta cuando hay un hueco, no una vez por tecla (criterio 128).
 */
export function VidaEndTimeLine({ id, startTime, durationMinutes }: VidaEndTimeLineProps) {
  const end = describeEndTime({ startTime, durationMinutes })

  return (
    <div className={styles.root} id={id} aria-live="polite">
      {end ? (
        <p className={[styles.line, end.waiting ? styles.waiting : ''].filter(Boolean).join(' ')}>
          <span className={styles.arrow} aria-hidden="true">
            →
          </span>
          <span className={styles.body}>
            {end.lead}
            {end.time ? (
              <>
                {' '}
                <b className={styles.time}>{end.time}</b>
              </>
            ) : null}
            {end.afterText ? <span className={styles.after}>{end.afterText}</span> : null}
          </span>
        </p>
      ) : null}
      {/* Las dos frases van juntas y ninguna se calla: arriba lo que pediste,
          aquí lo que la app hará de verdad al armar el día (criterio 123). */}
      {end?.nextDayText ? <p className={styles.capped}>{end.nextDayText}</p> : null}
    </div>
  )
}
