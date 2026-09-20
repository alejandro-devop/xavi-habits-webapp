import { useId, useState } from 'react'
import {
  DURATION_PILLS,
  formatDurationMinutes,
} from '@/features/vida/utils/vida-time.utils'
import styles from './VidaDurationPills.module.scss'

type VidaDurationPillsProps = {
  /** Minutos elegidos, o `null` si todavía no hay duración. */
  value: number | null
  onChange: (minutes: number | null) => void
  disabled?: boolean
  /** Etiqueta accesible del grupo. */
  label?: string
  /**
   * Tope de minutos. Las píldoras que no caben se **apagan** y se dice por qué;
   * no desaparecen, para que se vea que existen. La tajada 3 lo usa con el
   * tamaño del hueco (criterio 26); en la hoja del catálogo no hay tope.
   */
  maxMinutes?: number
}

/**
 * «Cuánto»: **15 · 30 · 45 · 1h · libre**. Son las palabras del usuario al
 * resolver D1 —«al momento de iniciarla indico con selectores pre-diseñados el
 * tiempo (15, 30, 45, 1h u opción libre)»—, así que las cuatro fijas y la
 * quinta abriendo un campo en minutos.
 *
 * Sale a componente desde el primer día porque la tajada 3 lo reutiliza con
 * `maxMinutes`: ahí las píldoras que no caben en el hueco se apagan.
 *
 * **No guarda nada ni conoce el API**: recibe `value` y avisa con `onChange`.
 * Lo único que es suyo es si «libre» está abierto, que es estado de pantalla y
 * no dato: al elegir una píldora fija se cierra.
 */
export function VidaDurationPills({
  value,
  onChange,
  disabled = false,
  label = 'Cuánto',
  maxMinutes,
}: VidaDurationPillsProps) {
  const freeId = useId()
  // «Libre» empieza abierto si lo que hay puesto no es ninguna de las píldoras
  // (un ítem guardado con 50 min, por ejemplo): si no, la duración se vería en
  // ninguna parte.
  const [freeOpen, setFreeOpen] = useState(value !== null && !DURATION_PILLS.includes(value))
  const isFree = freeOpen || (value !== null && !DURATION_PILLS.includes(value))

  return (
    <div className={styles.root}>
      <div className={styles.pills} role="group" aria-label={label}>
        {DURATION_PILLS.map((minutes) => {
          const fits = maxMinutes === undefined || minutes <= maxMinutes
          const isOn = !isFree && value === minutes
          return (
            <button
              key={minutes}
              type="button"
              className={[styles.pill, isOn ? styles.pillOn : ''].filter(Boolean).join(' ')}
              aria-pressed={isOn}
              disabled={disabled || !fits}
              onClick={() => {
                setFreeOpen(false)
                // Volver a tocar la elegida la quita: la duración es opcional.
                onChange(isOn ? null : minutes)
              }}
            >
              {minutes === 60 ? '1h' : minutes}
            </button>
          )
        })}

        <button
          type="button"
          className={[styles.pill, isFree ? styles.pillOn : ''].filter(Boolean).join(' ')}
          aria-pressed={isFree}
          aria-controls={freeId}
          aria-expanded={isFree}
          disabled={disabled}
          onClick={() => {
            const next = !isFree
            setFreeOpen(next)
            // Al cerrar «libre» se quita lo que hubiera a mano: quedaría un
            // número puesto sin ninguna píldora encendida que lo explicara.
            if (!next && value !== null && !DURATION_PILLS.includes(value)) onChange(null)
          }}
        >
          libre
        </button>
      </div>

      {isFree ? (
        <label className={styles.free} htmlFor={freeId}>
          <input
            id={freeId}
            className={styles.freeInput}
            type="number"
            inputMode="numeric"
            min={1}
            max={maxMinutes}
            step={5}
            value={value ?? ''}
            disabled={disabled}
            placeholder="50"
            onChange={(event) => {
              const raw = event.target.value.trim()
              if (!raw) {
                onChange(null)
                return
              }
              const parsed = Number.parseInt(raw, 10)
              onChange(Number.isNaN(parsed) || parsed <= 0 ? null : parsed)
            }}
          />
          <span className={styles.freeUnit}>minutos</span>
        </label>
      ) : null}

      {maxMinutes !== undefined ? (
        <p className={styles.hint}>
          Aquí caben {formatDurationMinutes(maxMinutes)}.
        </p>
      ) : null}
    </div>
  )
}
