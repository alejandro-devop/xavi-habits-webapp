import { useEffect, useState } from 'react'
import type { ActivityFollowUp } from '@/features/activities/types/activity-followup.types'
import type { EditFollowUpFormValues } from '@/features/activities/types/activity-followup.types'
import {
  editFormToInput,
  followUpToEditFormValues,
  validateEditFollowUpForm,
} from '@/features/activities/utils/activity-followup-form'
import { DurationHoursMinutesFields } from '@/features/activities/components/DurationHoursMinutesFields'
import { calculateEndTime } from '@/features/activities/utils/activity-time.utils'
import { Button } from '@/shared/ui/Button'
import { FormField } from '@/shared/ui/FormField'
import { Input } from '@/shared/ui/Input'
import { Modal } from '@/shared/ui/Modal'
import { Textarea } from '@/shared/ui/Textarea'
import styles from './EditFollowUpModal.module.scss'

type EditFollowUpModalProps = {
  open: boolean
  followUp: ActivityFollowUp | null
  saving?: boolean
  deleting?: boolean
  onClose: () => void
  onSave: (input: ReturnType<typeof editFormToInput>) => void
  onDelete: (followUp: ActivityFollowUp) => void
}

export function EditFollowUpModal({
  open,
  followUp,
  saving = false,
  deleting = false,
  onClose,
  onSave,
  onDelete,
}: EditFollowUpModalProps) {
  const [values, setValues] = useState<EditFollowUpFormValues>(
    followUp ? followUpToEditFormValues(followUp) : { activityId: null, notes: '', date: '', startTime: '', durationMinutes: 30 },
  )
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && followUp) {
      setValues(followUpToEditFormValues(followUp))
      setError(null)
    }
  }, [open, followUp])

  const endTime = calculateEndTime(values.date, values.startTime, values.durationMinutes)
  const busy = saving || deleting

  const handleSubmit = () => {
    if (!followUp) return
    const validationError = validateEditFollowUpForm(values)
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    onSave(editFormToInput(followUp.id, values))
  }

  if (!followUp) return null

  return (
    <Modal
      open={open}
      onClose={() => !busy && onClose()}
      title="Editar registro"
      description="Modifica el seguimiento de tiempo o elimínalo."
      footer={
        <div className={styles.footerBar}>
          <Button variant="danger" onClick={() => onDelete(followUp)} disabled={busy}>
            {deleting ? 'Eliminando…' : 'Eliminar'}
          </Button>
          <div className={styles.footerEnd}>
            <Button variant="ghost" onClick={onClose} disabled={busy}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={busy}>
              {saving ? 'Guardando…' : 'Guardar'}
            </Button>
          </div>
        </div>
      }
    >
      <div className={styles.form}>
        <p className={styles.activityReadonly}>
          <strong>Actividad:</strong>{' '}
          {followUp.activity?.title ?? '—'}
        </p>

        <FormField id="edit-notes" label="Notas">
          <Textarea
            id="edit-notes"
            value={values.notes}
            onChange={(e) => setValues((prev) => ({ ...prev, notes: e.target.value }))}
            rows={3}
            disabled={busy}
          />
        </FormField>

        <div className={styles.row}>
          <FormField id="edit-date" label="Fecha">
            <Input
              id="edit-date"
              type="date"
              value={values.date}
              onChange={(e) => setValues((prev) => ({ ...prev, date: e.target.value }))}
              disabled={busy}
            />
          </FormField>
          <FormField id="edit-start" label="Hora inicio">
            <Input
              id="edit-start"
              type="time"
              value={values.startTime.length > 5 ? values.startTime.slice(0, 5) : values.startTime}
              onChange={(e) => setValues((prev) => ({ ...prev, startTime: e.target.value }))}
              disabled={busy}
            />
          </FormField>
        </div>

        <DurationHoursMinutesFields
          idPrefix="edit-duration"
          totalMinutes={values.durationMinutes}
          onChange={(durationMinutes) =>
            setValues((prev) => ({ ...prev, durationMinutes }))
          }
          disabled={busy}
          error={error?.includes('duración') ? error : undefined}
        />

        <FormField id="edit-end" label="Hora fin (calculada)">
          <Input id="edit-end" type="text" value={endTime} readOnly disabled />
        </FormField>

        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </Modal>
  )
}
