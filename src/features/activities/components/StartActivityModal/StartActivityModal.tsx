import { useEffect, useState } from 'react'
import { ActivityPickerField } from '@/features/activities/components/ActivityPickerField'
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
import { Modal } from '@/shared/ui/Modal'
import { Textarea } from '@/shared/ui/Textarea'
import styles from './StartActivityModal.module.scss'

type PendingTodoOption = {
  id: string
  title: string
}

type StartActivityModalProps = {
  open: boolean
  sessionDate: string
  /** HH:mm al abrir desde timeline; si no se pasa, hora actual. */
  initialStartTime?: string | null
  activities: Activity[]
  loading?: boolean
  onClose: () => void
  onStart: (values: StartActivityFormValues, linkedTodo?: RunningActivitySessionLinkedTodo) => void
}

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
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'form' | 'pick-todo'>('form')
  const [pendingTodos, setPendingTodos] = useState<PendingTodoOption[]>([])
  const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null)
  const [checkingTodos, setCheckingTodos] = useState(false)

  useEffect(() => {
    if (open) {
      setValues(emptyStartActivityFormValues(initialStartTime ?? getCurrentLocalTime()))
      setError(null)
      setStep('form')
      setPendingTodos([])
      setSelectedTodoId(null)
      setCheckingTodos(false)
    }
  }, [open, initialStartTime])

  const resetAndClose = () => {
    if (loading || checkingTodos) return
    setValues(emptyStartActivityFormValues(getCurrentLocalTime()))
    setError(null)
    setStep('form')
    setPendingTodos([])
    setSelectedTodoId(null)
    onClose()
  }

  const linkedTodoFromSelection = (): RunningActivitySessionLinkedTodo | undefined => {
    const todo = pendingTodos.find((t) => t.id === selectedTodoId)
    if (!todo) return undefined
    return { id: todo.id, title: todo.title }
  }

  const handleSubmit = async () => {
    const validationError = validateStartActivityForm(values, sessionDate)
    if (validationError) {
      setError(validationError)
      return
    }

    if (step === 'pick-todo') {
      if (!selectedTodoId) {
        setError('Selecciona una tarea para vincular a esta sesión.')
        return
      }
      const linked = linkedTodoFromSelection()
      if (linked) onStart(values, linked)
      return
    }

    if (!values.activityId) return

    setCheckingTodos(true)
    setError(null)
    try {
      const pending = await activitiesApi.getActivityPendingTodos(values.activityId)
      if (pending.length > 0) {
        setPendingTodos(pending.map((t) => ({ id: t.id, title: t.title })))
        setSelectedTodoId(pending[0]?.id ?? null)
        setStep('pick-todo')
        return
      }
      onStart(values)
    } catch {
      setError('No se pudieron cargar las tareas pendientes.')
    } finally {
      setCheckingTodos(false)
    }
  }

  const isBusy = loading || checkingTodos

  return (
    <Modal
      open={open}
      onClose={resetAndClose}
      title={step === 'pick-todo' ? 'Elegir tarea' : 'Iniciar nueva actividad'}
      description={
        step === 'pick-todo'
          ? 'Hay tareas pendientes en las carpetas de esta actividad. Elige una para esta sesión.'
          : 'Indica la hora de inicio. El tiempo se guardará al finalizar.'
      }
      footer={
        <>
          {step === 'pick-todo' ? (
            <Button
              variant="ghost"
              onClick={() => {
                setStep('form')
                setError(null)
                setSelectedTodoId(null)
              }}
              disabled={isBusy}
            >
              Atrás
            </Button>
          ) : (
            <Button variant="ghost" onClick={resetAndClose} disabled={isBusy}>
              Cancelar
            </Button>
          )}
          <Button variant="primary" onClick={() => void handleSubmit()} disabled={isBusy} isLoading={isBusy}>
            Iniciar
          </Button>
        </>
      }
    >
      {step === 'form' ? (
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
              onChange={(activityId) => setValues((prev) => ({ ...prev, activityId }))}
              disabled={isBusy}
              error={error && !values.activityId ? error : undefined}
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
        </div>
      ) : (
        <div className={styles.form}>
          <ul className={styles.todoList} role="listbox" aria-label="Tareas pendientes">
            {pendingTodos.map((todo) => (
              <li key={todo.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selectedTodoId === todo.id}
                  className={[
                    styles.todoOption,
                    selectedTodoId === todo.id ? styles.todoOptionSelected : '',
                  ].join(' ')}
                  onClick={() => {
                    setSelectedTodoId(todo.id)
                    setError(null)
                  }}
                >
                  {todo.title}
                </button>
              </li>
            ))}
          </ul>
          {error ? (
            <p className={styles.error} role="alert">
              {error}
            </p>
          ) : null}
        </div>
      )}
    </Modal>
  )
}
