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
  getCurrentProgressValue,
  getHabitDailyGoal,
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

const DEFAULT_INCREMENT = 1

export function HabitFollowUpForm({ habit, date, existingFollowUp, onSuccess }: Props) {
  const { confirm } = useConfirmDialog()
  const addMutation = useAddHabitFollowUpMutation()
  const updateMutation = useUpdateHabitFollowUpMutation()

  const isQuantified = habit.habitType === 'count' || habit.habitType === 'time'
  const isEditing = Boolean(existingFollowUp)
  const isAccomplished = existingFollowUp?.isAccomplished ?? false
  const isPartial = existingFollowUp ? isPartialFollowUp(habit, existingFollowUp) : false

  const [increment, setIncrement] = useState(String(DEFAULT_INCREMENT))
  const [difficulty, setDifficulty] = useState<number | null>(existingFollowUp?.difficulty ?? 2)
  const [notes, setNotes] = useState<string>(existingFollowUp?.notes ?? '')
  const [incrementError, setIncrementError] = useState<string | null>(null)

  const isMutating = addMutation.isPending || updateMutation.isPending
  const measureLabel = formatMeasureDisplay(habit.measure)
  const incrementUnitLabel = habit.habitType === 'time' ? 'minutos' : measureLabel
  const goal = getHabitDailyGoal(habit)
  const hasDailyGoal = goal > 0
  const remaining = getRemainingToGoal(habit, existingFollowUp)
  const currentValue = getCurrentProgressValue(habit, existingFollowUp)

  function parseIncrement(): number | null {
    const trimmed = increment.trim()
    if (!trimmed) return null
    const value = Number(trimmed)
    if (!Number.isFinite(value) || value <= 0) return null
    return value
  }

  function setIncrementValue(next: number) {
    const clamped = Math.max(1, Math.floor(next))
    setIncrement(String(clamped))
    if (incrementError) setIncrementError(null)
  }

  function adjustIncrement(delta: number) {
    const current = parseIncrement() ?? DEFAULT_INCREMENT
    setIncrementValue(current + delta)
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
          setIncrement(String(DEFAULT_INCREMENT))
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

  const parsedIncrement = parseIncrement()
  const amountPreview = parsedIncrement ?? 0
  const projectedValue = currentValue + amountPreview
  const currentRatio = hasDailyGoal ? Math.min(currentValue / goal, 1) : 0
  const projectedRatio = hasDailyGoal ? Math.min(projectedValue / goal, 1) : 0
  const unitShort = habit.habitType === 'time' ? 'min' : measureLabel

  const progressLabel = existingFollowUp
    ? formatProgressLabel(habit, existingFollowUp, measureLabel)
    : `0 / ${goal} ${unitShort}`

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

  const canAdjustDown = (parseIncrement() ?? DEFAULT_INCREMENT) > 1
  const stepperDisabled = !hasDailyGoal || isMutating

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

      {isQuantified && hasDailyGoal ? (
        <div className={styles.progressBanner}>
          <div className={styles.progressHeader}>
            <span className={styles.progressLabel}>Progreso de hoy</span>
            <span className={styles.progressValue}>{progressLabel}</span>
          </div>
          <div
            className={styles.progressBar}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={goal}
            aria-valuenow={currentValue}
            aria-valuetext={`${currentValue} de ${goal} ${unitShort}`}
            aria-label="Progreso hacia la meta diaria"
          >
            <div
              className={styles.progressFillProjected}
              style={{ width: `${projectedRatio * 100}%` }}
              aria-hidden
            />
            <div
              className={styles.progressFill}
              style={{ width: `${currentRatio * 100}%` }}
              aria-hidden
            />
          </div>
          {!isAccomplished && amountPreview > 0 ? (
            <p className={styles.progressPreview} aria-live="polite">
              Al sumar: <strong>{projectedValue} / {goal} {unitShort}</strong>
              {wouldCompleteWithIncrement ? ' · Meta completada' : null}
            </p>
          ) : null}
        </div>
      ) : null}

      {isQuantified && !isAccomplished ? (
        <div className={styles.field}>
          <label className={styles.label} htmlFor="habit-follow-up-increment">
            {incrementFieldLabel}
          </label>
          <div className={styles.stepper}>
            <button
              type="button"
              className={styles.stepBtn}
              onClick={() => adjustIncrement(-1)}
              disabled={stepperDisabled || !canAdjustDown}
              aria-label={`Restar 1 ${incrementUnitLabel}`}
            >
              −
            </button>
            <div className={styles.stepperField}>
              <Input
                id="habit-follow-up-increment"
                type="number"
                min={1}
                inputMode="numeric"
                value={increment}
                onChange={(e) => {
                  setIncrement(e.target.value)
                  if (incrementError) setIncrementError(null)
                }}
                className={styles.stepperInput}
                hasError={Boolean(incrementError)}
                disabled={stepperDisabled}
                aria-describedby={incrementError ? 'habit-follow-up-increment-error' : undefined}
              />
            </div>
            <button
              type="button"
              className={styles.stepBtn}
              onClick={() => adjustIncrement(1)}
              disabled={stepperDisabled}
              aria-label={`Sumar 1 ${incrementUnitLabel}`}
            >
              +
            </button>
          </div>
          {incrementError ? (
            <p id="habit-follow-up-increment-error" className={styles.fieldError} role="alert">
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
