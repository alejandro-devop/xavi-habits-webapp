import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import {
  getIdentitySuggestions,
  type IdentitySuggestion,
} from '@/features/habits/data/identity-suggestions'
import type { Habit } from '@/features/habits/types/habit.types'
import {
  composeIdentityLine,
  composeMomentAsk,
  composeMomentHeadline,
  HABIT_MILESTONE_HEADINGS,
  lowerFirst,
  MOMENT_DONE_BODY,
  MOMENT_HEADLINE_TAIL,
  MOMENT_MICRO,
  MOMENT_QUESTION,
  MOMENT_WRITE_PLACEHOLDER,
  type HabitMilestoneKind,
} from '@/features/habits/utils/habit-identity.utils'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Button } from '@/shared/ui/Button'
import { Drawer } from '@/shared/ui/Drawer'
import { Input } from '@/shared/ui/Input'
import styles from './HabitIdentityMoment.module.scss'

export interface HabitIdentityMomentProps {
  habit: Habit
  milestone: HabitMilestoneKind
  /** Nombre de la categoría del hábito, si se conoce: afina la propuesta. */
  categoryName?: string | null
  /** Ids ya descartados con «no me suena» para este hábito. */
  dismissedSuggestionIds?: string[]
  /** Un toque: crea el propósito y lo enlaza. */
  onChoose: (choice: { name: string; icon: string | null }) => void
  /** «Ahora no»: cierra sin penalizar. */
  onDismiss: () => void
  isSaving?: boolean
  /** Cuando ya se guardó, la tarjeta se sustituye en el sitio por el acuse. */
  savedName?: string | null
  savedIcon?: string | null
  /**
   * `inline` en escritorio, justo bajo la fila del hábito. `sheet` en móvil:
   * hoja inferior que se descarta deslizando. Nunca un modal bloqueante.
   */
  presentation?: 'inline' | 'sheet'
}

/** Cuánto hay que arrastrar la hoja hacia abajo para descartarla. */
const SWIPE_DISMISS_PX = 64

export function HabitIdentityMoment({
  habit,
  milestone,
  categoryName,
  dismissedSuggestionIds,
  onChoose,
  onDismiss,
  isSaving = false,
  savedName = null,
  savedIcon = null,
  presentation = 'inline',
}: HabitIdentityMomentProps) {
  const [isWriting, setIsWriting] = useState(false)
  const [customName, setCustomName] = useState(MOMENT_WRITE_PLACEHOLDER.replace('…', ' '))

  const heading = HABIT_MILESTONE_HEADINGS[milestone]

  const suggestions = getIdentitySuggestions({
    habitName: habit.name,
    categoryName,
    shouldAvoid: habit.shouldAvoid,
    excludeIds: dismissedSuggestionIds,
  })

  function choose(suggestion: IdentitySuggestion) {
    onChoose({ name: suggestion.name, icon: suggestion.icon })
  }

  function chooseCustom() {
    const name = customName.trim()
    if (!name) return
    onChoose({ name, icon: habit.icon })
  }

  const body = savedName ? (
    <div className={styles.done}>
      <h3 className={styles.doneTitle}>
        <AppIcon name="check" size="xs" decorative /> Guardado: {lowerFirst(savedName)}
      </h3>
      <p className={styles.doneBody}>{MOMENT_DONE_BODY}</p>
      <p className={styles.preview}>
        {savedIcon ? <AppIcon name={savedIcon} size="xs" decorative /> : null}
        <span>{composeIdentityLine(savedName, 'done')}</span>
      </p>
    </div>
  ) : (
    <>
      {presentation === 'inline' ? <p className={styles.eyebrow}>{heading}</p> : null}
      <h3 className={styles.headline}>
        {composeMomentHeadline(milestone, habit)}
        <br />
        {MOMENT_HEADLINE_TAIL}
      </h3>
      <p className={styles.ask}>
        {composeMomentAsk(milestone)} <strong>{MOMENT_QUESTION}</strong>
      </p>

      <div className={styles.options} role="group" aria-label="Identidades propuestas">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.id}
            type="button"
            className={styles.option}
            onClick={() => choose(suggestion)}
            disabled={isSaving}
          >
            {suggestion.name}
          </button>
        ))}
      </div>

      {isWriting ? (
        <div className={styles.writeRow}>
          <label className={styles.writeLabel} htmlFor={`identity-custom-${habit.id}`}>
            Escribe la tuya
          </label>
          <Input
            id={`identity-custom-${habit.id}`}
            value={customName}
            onChange={(event) => setCustomName(event.target.value)}
            placeholder={MOMENT_WRITE_PLACEHOLDER}
            disabled={isSaving}
            autoFocus
          />
          <Button
            type="button"
            size="sm"
            onClick={chooseCustom}
            isLoading={isSaving}
            disabled={customName.trim().length === 0}
          >
            Guardar
          </Button>
        </div>
      ) : null}

      <div className={styles.escape}>
        {!isWriting ? (
          <button
            type="button"
            className={styles.escapeLink}
            onClick={() => setIsWriting(true)}
            disabled={isSaving}
          >
            <AppIcon name="pen" size="2xs" decorative /> Escribir la mía
          </button>
        ) : null}
        <button
          type="button"
          className={styles.escapeLink}
          onClick={onDismiss}
          disabled={isSaving}
        >
          Ahora no
        </button>
      </div>

      <p className={styles.micro}>{MOMENT_MICRO}</p>
    </>
  )

  if (presentation === 'sheet') {
    return (
      <Drawer
        open
        onClose={onDismiss}
        side="bottom"
        ds="aura"
        title={savedName ? 'Guardado' : heading}
      >
        <SwipeToDismiss onDismiss={onDismiss} />
        <div className={styles.sheetBody}>{body}</div>
      </Drawer>
    )
  }

  return (
    <section
      className={styles.moment}
      aria-live="polite"
      aria-label={savedName ? 'Identidad guardada' : heading}
    >
      <span className={styles.spark} aria-hidden="true" />
      {body}
    </section>
  )
}

/**
 * El asa de la hoja. Arrastrar hacia abajo es la salida más barata que existe
 * en móvil, y esta fase vive de que salir salga gratis.
 */
function SwipeToDismiss({ onDismiss }: { onDismiss: () => void }) {
  const startY = useRef<number | null>(null)

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    startY.current = event.clientY
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const from = startY.current
    startY.current = null
    if (from !== null && event.clientY - from > SWIPE_DISMISS_PX) onDismiss()
  }

  return (
    <div
      className={styles.grabArea}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => { startY.current = null }}
      aria-hidden="true"
    >
      <span className={styles.grab} />
    </div>
  )
}
