import { useState } from 'react'
import { useConfirmDialog } from '@/shared/ui/ConfirmDialog'
import {
  useAddHabitFollowUpMutation,
  useUpdateHabitFollowUpMutation,
} from '@/features/habits/hooks/useHabitFollowUps'
import { HabitDifficultyPicker } from '@/features/habits/components/HabitDifficultyPicker'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import type { Habit, HabitFollowUp } from '@/features/habits/types/habit.types'
import { formatMeasureDisplay } from '@/features/habits/utils/habit-measure-form.utils'
import {
  formatProgressLabel,
  getHabitDailyGoal,
  getProgressRatio,
  getRemainingToGoal,
  isGoalMet,
  isPartialFollowUp,
} from '@/features/habits/utils/habit-progress.utils'
import styles from './HabitFollowUpForm.module.scss'

type Props = {
  habit: Habit
  date: string
  existingFollowUp?: HabitFollowUp
  onSuccess?: () => void
}

export function HabitFollowUpForm({ habit, date, existingFollowUp, onSuccess }: Props) {
  const { confirm } = useConfirmDialog()
  const addMutation = useAddHabitFollowUpMutation()
  const updateMutation = useUpdateHabitFollowUpMutation()

  const isQuantified = habit.habitType === 'count' || habit.habitType === 'time'
  const isEditing = Boolean(existingFollowUp)
  const isAccomplished = existingFollowUp?.isAccomplished ?? false
  const isPartial = existingFollowUp ? isPartialFollowUp(habit, existingFollowUp) : false

  const [increment, setIncrement] = useState('')
  const [difficulty, setDifficulty] = useState<number | null>(existingFollowUp?.difficulty ?? 2)
  const [notes, setNotes] = useState<string>(existingFollowUp?.notes ?? '')
  const [incrementError, setIncrementError] = useState<string | null>(null)

  const isMutating = addMutation.isPending || updateMutation.isPending
  const measureLabel = formatMeasureDisplay(habit.measure)
  const incrementUnitLabel = habit.habitType === 'time' ? 'minutos' : measureLabel
  const goal = getHabitDailyGoal(habit)
  const hasDailyGoal = goal > 0
  const remaining = getRemainingToGoal(habit, existingFollowUp)

  function parseIncrement(): number | null {
    const trimmed = increment.trim()
    if (!trimmed) return null
    const value = Number(trimmed)
    if (!Number.isFinite(value) || value <= 0) return null
    return value
  }

  function buildQuantifiedFields(amount: number): Record<string, unknown> {
    return habit.habitType === 'count' ? { count: amount } : { time: amount }
  }

  function addFollowUp(fields: Record<string, unknown>, options?: { closeOnAccomplish?: boolean }) {
    addMutation.mutate(
      {
        habitId: habit.id,
        date,
        difficulty: difficulty ?? null,
        notes: notes.trim() || null,
        ...fields,
      },
      {
        onSuccess: (data) => {
          setIncrement('')
          if (options?.closeOnAccomplish === false && !data.isAccomplished) return
          onSuccess?.()
        },
      },
    )
  }

  function updateFollowUp(fields: Record<string, unknown>) {
    if (!existingFollowUp) return
    updateMutation.mutate(
      {
        input: {
          id: existingFollowUp.id,
          difficulty: difficulty ?? null,
          notes: notes.trim() || null,
          ...fields,
        },
        context: { habitId: habit.id, date },
      },
      { onSuccess },
    )
  }

  function handleAddPartial() {
    const amount = parseIncrement()
    if (amount === null) {
      setIncrementError(`Indica cuántos ${incrementUnitLabel} quieres sumar (mínimo 1).`)
      return
    }

    if (!hasDailyGoal) {
      setIncrementError('Este hábito no tiene meta diaria. Edítalo y define una meta para registrar progreso.')
      return
    }

    setIncrementError(null)
    addFollowUp(buildQuantifiedFields(amount), { closeOnAccomplish: false })
  }

  function handleBooleanComplete() {
    addFollowUp({ isAccomplished: true })
  }

  async function handleFail() {
    const ok = await confirm({
      title: '¿Registrar como fallido?',
      description: 'Se marcará este día como falla y la racha se reiniciará.',
      confirmLabel: 'Registrar falla',
      cancelLabel: 'Cancelar',
      variant: 'danger',
    })
    if (!ok) return

    if (isEditing && existingFollowUp) {
      updateFollowUp({ isFailed: true })
      return
    }

    addFollowUp({ isFailed: true })
  }

  const currentProgress =
    existingFollowUp && isQuantified
      ? formatProgressLabel(habit, existingFollowUp, measureLabel)
      : null
  const progressRatio =
    existingFollowUp && isQuantified ? getProgressRatio(habit, existingFollowUp) : null

  const parsedIncrement = parseIncrement()
  const wouldCompleteWithIncrement =
    parsedIncrement !== null && isGoalMet(habit, existingFollowUp, parsedIncrement)

  const addButtonLabel = (() => {
    if (parsedIncrement !== null) {
      return wouldCompleteWithIncrement
        ? `Sumar ${parsedIncrement} y completar meta`
        : `Sumar ${parsedIncrement} ${incrementUnitLabel}`
    }
    return 'Sumar al progreso'
  })()

  const incrementFieldLabel = isPartial
    ? `Sumar ahora (${incrementUnitLabel})`
    : `Cuánto registras (${incrementUnitLabel})`

  return (
    <div className={styles.root}>
      {isQuantified && hasDailyGoal ? (
        <p className={styles.goalHint}>
          Meta diaria: <strong>{goal} {incrementUnitLabel}</strong>
          {remaining !== null && remaining > 0
            ? <> · Te faltan <strong>{remaining}</strong></>
            : isAccomplished
              ? ' · Meta cumplida'
              : null}
        </p>
      ) : null}

      {isQuantified && !hasDailyGoal ? (
        <p className={styles.goalWarning} role="status">
          Sin meta diaria no puedes registrar progreso parcial. Edita el hábito y define una meta.
        </p>
      ) : null}

      {isQuantified && currentProgress ? (
        <div className={styles.progressBanner}>
          <span className={styles.progressLabel}>Progreso de hoy</span>
          <span className={styles.progressValue}>{currentProgress}</span>
          {progressRatio !== null && goal > 0 ? (
            <div className={styles.progressBar} aria-hidden>
              <div className={styles.progressFill} style={{ width: `${progressRatio * 100}%` }} />
            </div>
          ) : null}
        </div>
      ) : null}

      {isQuantified && !isAccomplished ? (
        <div className={styles.field}>
          <label className={styles.label} htmlFor="habit-follow-up-increment">
            {incrementFieldLabel}
          </label>
          <Input
            id="habit-follow-up-increment"
            type="number"
            min={1}
            value={increment}
            onChange={(e) => {
              setIncrement(e.target.value)
              if (incrementError) setIncrementError(null)
            }}
            placeholder={remaining !== null && remaining > 0 ? `Ej. ${Math.min(remaining, 10)}` : 'Ej. 20'}
            hasError={Boolean(incrementError)}
            disabled={!hasDailyGoal || isMutating}
          />
          {incrementError ? (
            <p className={styles.fieldError} role="alert">
              {incrementError}
            </p>
          ) : null}
          {hasDailyGoal && isPartial ? (
            <p className={styles.hint}>
              Cada suma se acumula en el día. Al llegar a {goal} {incrementUnitLabel} se marca como
              logrado automáticamente.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className={styles.field}>
        <label className={styles.label}>Dificultad (opcional)</label>
        <HabitDifficultyPicker value={difficulty} onChange={setDifficulty} />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Notas (opcional)</label>
        <textarea
          className={styles.textarea}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="¿Cómo fue?"
          disabled={isMutating}
        />
      </div>

      <div className={styles.actions}>
        {isQuantified ? (
          !isAccomplished ? (
            <Button
              variant="primary"
              onClick={handleAddPartial}
              isLoading={addMutation.isPending}
              disabled={isMutating || !hasDailyGoal || parsedIncrement === null}
              fullWidth
            >
              {addButtonLabel}
            </Button>
          ) : (
            <>
              <p className={styles.accomplishedNotice}>Meta del día cumplida.</p>
              <Button
                variant="secondary"
                onClick={() => updateFollowUp({})}
                isLoading={updateMutation.isPending}
                disabled={isMutating}
                fullWidth
              >
                Guardar notas y dificultad
              </Button>
            </>
          )
        ) : (
          <Button
            variant="primary"
            onClick={handleBooleanComplete}
            isLoading={isMutating}
            disabled={isMutating}
            fullWidth
          >
            Completé el hábito hoy
          </Button>
        )}

        {!isAccomplished ? (
          <Button
            variant="ghost"
            onClick={handleFail}
            disabled={isMutating}
            fullWidth
            className={styles.failButton}
          >
            Registrar falla del día
          </Button>
        ) : null}
      </div>
    </div>
  )
}
