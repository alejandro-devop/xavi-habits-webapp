import { useRef, useState } from 'react'
import { INTENTION_ANCHORS, type HabitIntention } from '@/features/habits/utils/habit-form.utils'
import { useClickOutside } from '@/shared/hooks/useClickOutside'
import styles from './HabitCreateWizard.module.scss'

type Props = {
  intention: HabitIntention
  onChange: (partial: Partial<HabitIntention>) => void
  disabled?: boolean
}

/** Ancho aproximado al contenido, para que el hueco no baile. */
function slotWidth(text: string, placeholder: string): string {
  const length = Math.max(text.length, placeholder.length) + 2
  return `${Math.min(Math.max(length, 8), 34)}ch`
}

type AnchorSlotProps = {
  value: string
  onChange: (anchor: string) => void
  disabled?: boolean
}

/**
 * El hueco que más importa. Desplegable con las anclas frecuentes y «Otro…»
 * para escribir la tuya.
 */
function AnchorSlot({ value, onChange, disabled }: AnchorSlotProps) {
  const rootRef = useRef<HTMLSpanElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [writing, setWriting] = useState(false)

  useClickOutside(rootRef, () => setMenuOpen(false), menuOpen)

  if (writing) {
    return (
      <input
        className={styles.slotInput}
        style={{ width: slotWidth(value, 'me levante') }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="¿cuándo?"
        aria-label="Cuándo: el momento que sirve de ancla"
        disabled={disabled}
        autoFocus
      />
    )
  }

  return (
    <span className={styles.slotWrap} ref={rootRef}>
      <button
        type="button"
        className={[styles.slot, value ? '' : styles.slotEmpty].join(' ')}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        disabled={disabled}
        onClick={() => setMenuOpen((open) => !open)}
      >
        {value || '¿cuándo?'}
      </button>
      {menuOpen ? (
        <span className={styles.anchorMenu} role="menu" aria-label="Anclas frecuentes">
          {INTENTION_ANCHORS.map((anchor) => (
            <button
              key={anchor}
              type="button"
              role="menuitem"
              className={styles.anchorOption}
              onClick={() => {
                onChange(anchor)
                setMenuOpen(false)
              }}
            >
              {anchor}
            </button>
          ))}
          <button
            type="button"
            role="menuitem"
            className={styles.anchorOption}
            onClick={() => {
              setWriting(true)
              setMenuOpen(false)
            }}
          >
            Otro…
          </button>
        </span>
      ) : null}
    </span>
  )
}

/**
 * «Cuando [ancla], haré [acción] en [lugar]». Los tres huecos son opcionales:
 * ninguno bloquea la creación del hábito.
 */
export function HabitIntentionSentence({ intention, onChange, disabled }: Props) {
  return (
    <p className={styles.sentence}>
      Cuando{' '}
      <AnchorSlot
        value={intention.anchor}
        onChange={(anchor) => onChange({ anchor })}
        disabled={disabled}
      />
      , haré{' '}
      <input
        className={styles.slotInput}
        style={{ width: slotWidth(intention.action, '15 minutos de meditación') }}
        value={intention.action}
        onChange={(e) => onChange({ action: e.target.value })}
        placeholder="¿qué?"
        aria-label="Qué haré"
        disabled={disabled}
      />{' '}
      en{' '}
      <input
        className={[styles.slotInput, intention.place ? '' : styles.slotEmpty].join(' ')}
        style={{ width: slotWidth(intention.place, '¿dónde?') }}
        value={intention.place}
        onChange={(e) => onChange({ place: e.target.value })}
        placeholder="¿dónde?"
        aria-label="Dónde (opcional)"
        disabled={disabled}
      />
    </p>
  )
}
