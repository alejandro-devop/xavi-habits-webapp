import { useEffect, useState } from 'react'
import { ActivityPickerField } from '@/features/activities/components/ActivityPickerField'
import { CreateActivityStep } from '@/features/activities/components/CreateActivityStep'
import * as activitiesApi from '@/features/activities/api/activities.api'
import type { Activity } from '@/features/activities/types/activity.types'
import type {
  RunningActivitySessionLinkedTodo,
  StartActivityFormValues,
} from '@/features/activities/types/activity-followup.types'
import {
  emptyStartActivityFormValues,
  validateStartActivityForm,
} from '@/features/activities/utils/activity-followup-form'
import { getCurrentLocalTime } from '@/features/activities/utils/activity-time.utils'
import { Button } from '@/shared/ui/Button'
import { FormField } from '@/shared/ui/FormField'
import { Input } from '@/shared/ui/Input'
import { SteppedModal, useModalStep } from '@/shared/ui/SteppedModal'
import { Textarea } from '@/shared/ui/Textarea'
import styles from './StartActivityModal.module.scss'

// ─── Types ────────────────────────────────────────────────────────────────────

type PendingTodoOption = { id: string; title: string }

export type StartActivityModalProps = {
  open: boolean
  sessionDate: string
  initialStartTime?: string | null
  activities: Activity[]
  loading?: boolean
  onClose: () => void
  onStart: (values: StartActivityFormValues, linkedTodo?: RunningActivitySessionLinkedTodo) => void
}

// ─── Step: pick a linked todo ─────────────────────────────────────────────────

type TodoPickerStepProps = {
  todos: PendingTodoOption[]
  onConfirm: (linked: RunningActivitySessionLinkedTodo | undefined) => void
}

function TodoPickerStep({ todos, onConfirm }: TodoPickerStepProps) {
  const { pop } = useModalStep()
  const [selectedId, setSelectedId] = useState<string | null>(todos[0]?.id ?? null)

  return (
    <div className={styles.form}>
      <ul className={styles.todoList} role="listbox" aria-label="Tareas pendientes">
        {todos.map((todo) => (
          <li key={todo.id}>
            <button
              type="button"
              role="option"
              aria-selected={selectedId === todo.id}
              className={[
                styles.todoOption,
                selectedId === todo.id ? styles.todoOptionSelected : '',
              ].join(' ')}
              onClick={() => setSelectedId(todo.id)}
            >
              {todo.title}
            </button>
          </li>
        ))}
      </ul>
      <div className={styles.stepActions}>
        <Button variant="ghost" onClick={pop}>
          Atrás
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            const todo = todos.find((t) => t.id === selectedId)
            onConfirm(todo ? { id: todo.id, title: todo.title } : undefined)
          }}
        >
          Iniciar
        </Button>
      </div>
    </div>
  )
}

// ─── Root step (inside SteppedModal so it can call useModalStep) ──────────────

type RootStepProps = {
  values: StartActivityFormValues
  setValues: React.Dispatch<React.SetStateAction<StartActivityFormValues>>
  activities: Activity[]
  isBusy: boolean
  sessionDate: string
  onClose: () => void
  onStart: StartActivityModalProps['onStart']
  setCheckingTodos: React.Dispatch<React.SetStateAction<boolean>>
}

function StartActivityRootStep({
  values,
  setValues,
  activities,
  isBusy,
  sessionDate,
  onClose,
  onStart,
  setCheckingTodos,
}: RootStepProps) {
  const { push, pop } = useModalStep()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    const validationError = validateStartActivityForm(values, sessionDate)
    if (validationError) {
      setError(validationError)
      return
    }
    if (!values.activityId) return

    setCheckingTodos(true)
    setError(null)
    try {
      const pending = await activitiesApi.getActivityPendingTodos(values.activityId)
      if (pending.length > 0) {
        push({
          title: 'Elegir tarea',
          description:
            'Hay tareas pendientes en las carpetas de esta actividad. Elige una para esta sesión.',
          content: (
            <TodoPickerStep
              todos={pending.map((t) => ({ id: t.id, title: t.title }))}
              onConfirm={(linked) => onStart(values, linked)}
            />
          ),
        })
        return
      }
      onStart(values)
    } catch {
      setError('No se pudieron cargar las tareas pendientes.')
    } finally {
      setCheckingTodos(false)
    }
  }

  return (
    <div className={styles.form}>
      <FormField
        id="start-activity"
        label="Actividad"
        error={error && !values.activityId ? error : undefined}
      >
        <ActivityPickerField
          idPrefix="start-activity"
          value={values.activityId}
          activities={activities}
          onChange={(activityId) => {
            setValues((prev) => ({ ...prev, activityId }))
            setError(null)
          }}
          disabled={isBusy}
          error={error && !values.activityId ? error : undefined}
          onCreateNew={() =>
            push({
              title: 'Nueva actividad',
              content: (
                <CreateActivityStep
                  onCreated={(id) => {
                    setValues((prev) => ({ ...prev, activityId: id }))
                    pop()
                  }}
                />
              ),
            })
          }
        />
      </FormField>

      <FormField
        id="start-time"
        label="Hora de inicio"
        error={error?.includes('hora') ? error : undefined}
      >
        <Input
          id="start-time"
          type="time"
          value={values.startTime}
          onChange={(e) => setValues((prev) => ({ ...prev, startTime: e.target.value }))}
          disabled={isBusy}
        />
      </FormField>

      <FormField id="start-notes" label="Descripción (opcional)">
        <Textarea
          id="start-notes"
          value={values.notes}
          onChange={(e) => setValues((prev) => ({ ...prev, notes: e.target.value }))}
          placeholder="¿Qué vas a hacer?"
          rows={3}
          disabled={isBusy}
        />
      </FormField>

      {error && values.activityId && !error.includes('hora') ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      <div className={styles.stepActions}>
        <Button variant="ghost" onClick={onClose} disabled={isBusy}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          onClick={() => void handleSubmit()}
          isLoading={isBusy}
          disabled={isBusy}
        >
          Iniciar
        </Button>
      </div>
    </div>
  )
}

// ─── Public component ─────────────────────────────────────────────────────────

export function StartActivityModal({
  open,
  sessionDate,
  initialStartTime = null,
  activities,
  loading = false,
  onClose,
  onStart,
}: StartActivityModalProps) {
  const [values, setValues] = useState<StartActivityFormValues>(
    emptyStartActivityFormValues(getCurrentLocalTime()),
  )
  const [checkingTodos, setCheckingTodos] = useState(false)

  useEffect(() => {
    if (open) {
      setValues(emptyStartActivityFormValues(initialStartTime ?? getCurrentLocalTime()))
      setCheckingTodos(false)
    }
  }, [open, initialStartTime])

  const isBusy = loading || checkingTodos

  return (
    <SteppedModal
      open={open}
      onClose={() => { if (!isBusy) onClose() }}
      title="Iniciar actividad"
      description="Indica la hora de inicio. El tiempo se guardará al finalizar."
    >
      <StartActivityRootStep
        values={values}
        setValues={setValues}
        activities={activities}
        isBusy={isBusy}
        sessionDate={sessionDate}
        onClose={onClose}
        onStart={onStart}
        setCheckingTodos={setCheckingTodos}
      />
    </SteppedModal>
  )
}
