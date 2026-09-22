import { useId, useState } from 'react'
import {
  DURATION_PILLS,
  MAX_DURATION_MINUTES,
  formatDurationMinutes,
  joinDurationMinutes,
  splitDurationMinutes,
} from '@/features/vida/utils/vida-time.utils'
import styles from './VidaDurationPills.module.scss'

/**
 * Lo que hay tecleado en los dos campos, **tal cual se teclea**: cadenas, no
 * números. Es estado de pantalla y muere con el control; el dato sigue siendo
 * minutos de punta a punta.
 */
type DurationDraft = { hours: string; minutes: string }

function toDraft(total: number | null): DurationDraft {
  const { hours, minutes } = splitDurationMinutes(total)
  return {
    hours: hours === null ? '' : String(hours),
    minutes: minutes === null ? '' : String(minutes),
  }
}

function readField(raw: string): number | null {
  return raw === '' ? null : Number.parseInt(raw, 10)
}

/** Lo tecleado, tal cual, sin topar: es lo que decide si hay que avisar del tope. */
function rawTotal(draft: DurationDraft): number {
  return (readField(draft.hours) ?? 0) * 60 + (readField(draft.minutes) ?? 0)
}

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
  /**
   * Cómo se escribe «libre»: **un campo de minutos** (lo de siempre) o **dos
   * campos, horas y minutos**. Es aditiva y el defecto es `'minutes'` a
   * propósito: las pantallas que no lo piden no se enteran de esta prop
   * (criterio 118 de FEAT-008), y si alguien invirtiera el defecto, los tres
   * casos de arriba que buscan `spinbutton` fallarían en voz alta.
   */
  freeInput?: 'minutes' | 'hoursAndMinutes'
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
 * Lo único que es suyo es si «libre» está abierto y cómo está repartido lo que
 * se teclea, que es estado de pantalla y no dato: al elegir una píldora fija se
 * cierra.
 *
 * Con `freeInput="hoursAndMinutes"` (FEAT-008, tajada 1) «libre» abre **dos
 * campos**, horas y minutos, en vez de uno de minutos. Hacia fuera no cambia
 * nada: sigue recibiendo y emitiendo **minutos**.
 */
export function VidaDurationPills({
  value,
  onChange,
  disabled = false,
  label = 'Cuánto',
  maxMinutes,
  freeInput = 'minutes',
}: VidaDurationPillsProps) {
  const freeId = useId()
  // «Libre» empieza abierto si lo que hay puesto no es ninguna de las píldoras
  // (un ítem guardado con 50 min, por ejemplo): si no, la duración se vería en
  // ninguna parte.
  const [freeOpen, setFreeOpen] = useState(value !== null && !DURATION_PILLS.includes(value))
  const isFree = freeOpen || (value !== null && !DURATION_PILLS.includes(value))

  // El reparto en (h, m) es **estado de pantalla**, no dato. Se vuelve a
  // repartir cuando `value` llega distinto de lo último que emitimos —una
  // píldora, la sugerencia de FEAT-007, o una precarga de FEAT-009—, y no
  // cuando somos nosotros los que acabamos de emitirlo: así, tecleando `9` en
  // minutos no salta a «0 h 9» mientras se escribe (criterio 112).
  const [draft, setDraft] = useState<DurationDraft>(() => toDraft(value))
  // `emitted` es **estado**, no un `useRef`: leer o escribir una `ref` en render
  // es justo lo que prohíbe el compilador de React (`Cannot access refs during
  // render`), y esto es el patrón de «ajustar estado cuando cambia una prop».
  const [emitted, setEmitted] = useState<number | null>(value)
  if (value !== emitted) {
    setEmitted(value)
    setDraft(toDraft(value))
  }

  const overMax = rawTotal(draft) > MAX_DURATION_MINUTES

  const handleDraftChange = (field: 'hours' | 'minutes', raw: string) => {
    // Lo que no es un número se ignora, en vez de dejar el campo en un estado
    // raro (criterio 113). Los ceros de delante tampoco se quedan pegados.
    const digits = raw
      .replace(/\D/g, '')
      .slice(0, field === 'hours' ? 2 : 4)
      .replace(/^0+(?=\d)/, '')
    const next: DurationDraft = { ...draft, [field]: digits }
    setDraft(next)
    // Se emite ya, sin esperar al blur: guardar sin salir del campo guarda lo
    // mismo que se está viendo (criterio 112).
    const total = joinDurationMinutes(readField(next.hours), readField(next.minutes))
    setEmitted(total)
    onChange(total)
  }

  // Al salir del campo se acomoda lo escrito (90 → 1 h 30). Es **presentación**:
  // no emite nada, porque el dato ya era el mismo. Sin aviso y sin color.
  const handleDraftBlur = () => {
    setDraft(toDraft(joinDurationMinutes(readField(draft.hours), readField(draft.minutes))))
  }

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

      {isFree && freeInput === 'hoursAndMinutes' ? (
        <div className={styles.duo} id={freeId}>
          <span className={styles.duoField}>
            <input
              className={styles.duoInput}
              // `text` y no `number`: el `number` cambia de valor con la rueda
              // del ratón (criterio 114) y no deja teclear un borrador.
              type="text"
              inputMode="numeric"
              autoComplete="off"
              // Nombre propio para cada campo, no uno compartido (criterio 114).
              aria-label="horas"
              value={draft.hours}
              disabled={disabled}
              placeholder="1"
              onChange={(event) => handleDraftChange('hours', event.target.value)}
              onBlur={handleDraftBlur}
            />
            <span className={styles.duoUnit} aria-hidden="true">
              h
            </span>
          </span>
          <span className={styles.duoField}>
            <input
              className={styles.duoInput}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              aria-label="minutos"
              value={draft.minutes}
              disabled={disabled}
              placeholder="30"
              onChange={(event) => handleDraftChange('minutes', event.target.value)}
              onBlur={handleDraftBlur}
            />
            <span className={styles.duoUnit} aria-hidden="true">
              min
            </span>
          </span>
        </div>
      ) : null}

      {/* El tope se dice en una línea llana, sin color y sin reproche. */}
      {isFree && freeInput === 'hoursAndMinutes' && overMax ? (
        <p className={styles.hint}>Como mucho {formatDurationMinutes(MAX_DURATION_MINUTES)}.</p>
      ) : null}

      {isFree && freeInput === 'minutes' ? (
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
