import { useState, useEffect } from 'react'
import { Modal } from '@/shared/ui/Modal'
import { Button } from '@/shared/ui'
import { FormField } from '@/shared/ui/FormField'
import { Select } from '@/shared/ui/Select'
import { Input } from '@/shared/ui/Input'
import {
  useCreateWeekScheduleSlotMutation,
  useUpdateWeekScheduleSlotMutation,
} from '@/features/quarters/hooks/useQuarters'
import type { DayOfWeek, Quarter, WeekScheduleSlot } from '@/features/quarters/types/quarter.types'

const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo',
}

type Props = {
  open: boolean
  onClose: () => void
  quarter: Quarter
  dayOfWeek: DayOfWeek
  slot?: WeekScheduleSlot | null
}

export function WeekScheduleSlotModal({ open, onClose, quarter, dayOfWeek, slot }: Props) {
  const isEdit = Boolean(slot)

  const [projectId, setProjectId] = useState('')
  const [hours, setHours] = useState('1')
  const [startTime, setStartTime] = useState('')
  const [notes, setNotes] = useState('')

  const createMutation = useCreateWeekScheduleSlotMutation(quarter.id)
  const updateMutation = useUpdateWeekScheduleSlotMutation(quarter.id)
  const isPending = createMutation.isPending || updateMutation.isPending

  useEffect(() => {
    if (open) {
      if (slot) {
        setProjectId(slot.projectId)
        setHours(String(slot.hours))
        setStartTime(slot.startTime ?? '')
        setNotes(slot.notes ?? '')
      } else {
        setProjectId(quarter.projects[0]?.projectId ?? '')
        setHours('1')
        setStartTime('')
        setNotes('')
      }
    }
  }, [open, slot, quarter.projects])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const parsedHours = parseFloat(hours)
    if (!projectId || isNaN(parsedHours) || parsedHours <= 0) return

    if (isEdit && slot) {
      await updateMutation.mutateAsync({
        id: slot.id,
        hours: parsedHours,
        startTime: startTime || null,
        notes: notes || null,
      })
    } else {
      await createMutation.mutateAsync({
        quarterId: quarter.id,
        projectId,
        dayOfWeek,
        hours: parsedHours,
        startTime: startTime || undefined,
        notes: notes || undefined,
      })
    }
    onClose()
  }

  const projectOptions = quarter.projects.map((qp) => ({
    value: qp.projectId,
    label: qp.project.name,
  }))

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Editar slot — ${DAY_LABELS[dayOfWeek]}` : `Añadir al ${DAY_LABELS[dayOfWeek]}`}
    >
      <form onSubmit={(e) => void handleSubmit(e)}>
        {!isEdit && (
          <FormField label="Proyecto">
            <Select
              id="slot-project"
              options={projectOptions}
              value={projectId}
              onChange={setProjectId}
              placeholder="Selecciona un proyecto"
            />
          </FormField>
        )}

        <FormField label="Horas planificadas">
          <Input
            id="slot-hours"
            type="number"
            min="0.5"
            max="24"
            step="0.5"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            required
          />
        </FormField>

        <FormField label="Hora de inicio (opcional)">
          <Input
            id="slot-time"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </FormField>

        <FormField label="Notas (opcional)">
          <Input
            id="slot-notes"
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ej. Sesión de diseño, revisión, etc."
            maxLength={500}
          />
        </FormField>

        <Button type="submit" variant="primary" disabled={isPending} style={{ width: '100%', marginTop: 8 }}>
          {isPending ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Añadir slot'}
        </Button>
      </form>
    </Modal>
  )
}
