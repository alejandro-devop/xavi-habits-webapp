import { useState } from 'react'
import { useConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { useAddHabitFollowUpMutation } from '@/features/habits/hooks/useHabitFollowUps'
import { HabitDifficultyPicker } from '@/features/habits/components/HabitDifficultyPicker'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import type { Habit, HabitFollowUp } from '@/features/habits/types/habit.types'
import styles from './HabitFollowUpForm.module.scss'

type Props = {
  habit: Habit
  date: string
  existingFollowUp?: HabitFollowUp
  onSuccess?: () => void
}

export function HabitFollowUpForm({ habit, date, existingFollowUp, onSuccess }: Props) {
  const { confirm } = useConfirmDialog()
  const mutation = useAddHabitFollowUpMutation()

  const [count, setCount] = useState<string>(existingFollowUp?.count?.toString() ?? '')
  const [time, setTime] = useState<string>(existingFollowUp?.time?.toString() ?? '')
  const [difficulty, setDifficulty] = useState<number | null>(existingFollowUp?.difficulty ?? null)
  const [notes, setNotes] = useState<string>(existingFollowUp?.notes ?? '')

  function buildBaseInput() {
    return {
      habitId: habit.id,
      date,
      difficulty: difficulty ?? null,
      notes: notes.trim() || null,
    }
  }

  async function handleAccomplish() {
    const extra: Record<string, unknown> = { isAccomplished: true }
    if (habit.habitType === 'count' && count !== '') extra.count = Number(count)
    if (habit.habitType === 'time' && time !== '') extra.time = Number(time)

    mutation.mutate({ ...buildBaseInput(), ...extra }, { onSuccess })
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
    mutation.mutate({ ...buildBaseInput(), isFailed: true }, { onSuccess })
  }

  const measureLabel = habit.measure?.name ?? 'veces'

  return (
    <div className={styles.root}>
      {habit.habitType === 'count' && (
        <div className={styles.field}>
          <label className={styles.label}>{measureLabel}</label>
          <Input
            type="number"
            min={0}
            value={count}
            onChange={(e) => setCount(e.target.value)}
            placeholder="0"
          />
        </div>
      )}

      {habit.habitType === 'time' && (
        <div className={styles.field}>
          <label className={styles.label}>Tiempo (minutos)</label>
          <Input
            type="number"
            min={0}
            value={time}
            onChange={(e) => setTime(e.target.value)}
            placeholder="0"
          />
        </div>
      )}

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
        />
      </div>

      <div className={styles.actions}>
        {habit.habitType !== 'boolean' ? (
          <Button
            variant="primary"
            onClick={handleAccomplish}
            isLoading={mutation.isPending}
            disabled={mutation.isPending}
          >
            Logrado
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={handleAccomplish}
            isLoading={mutation.isPending}
            disabled={mutation.isPending}
          >
            Logrado
          </Button>
        )}
        <Button
          variant="danger"
          onClick={handleFail}
          disabled={mutation.isPending}
        >
          Fallido
        </Button>
      </div>
    </div>
  )
}
