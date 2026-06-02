import { useState, useEffect } from 'react'
import { Modal } from '@/shared/ui/Modal'
import { Button } from '@/shared/ui'
import { FormField } from '@/shared/ui/FormField'
import { useCreateQuarterMutation, useUpdateQuarterMutation } from '@/features/quarters/hooks/useQuarters'
import type { Quarter } from '@/features/quarters/types/quarter.types'
import styles from './QuarterFormModal.module.scss'

type Props = {
  open: boolean
  onClose: () => void
  quarter?: Quarter | null
}

export function QuarterFormModal({ open, onClose, quarter }: Props) {
  const isEdit = Boolean(quarter)
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const createMutation = useCreateQuarterMutation()
  const updateMutation = useUpdateQuarterMutation()
  const isPending = createMutation.isPending || updateMutation.isPending

  useEffect(() => {
    if (open) {
      setName(quarter?.name ?? '')
      setStartDate(quarter?.startDate ?? '')
      setEndDate(quarter?.endDate ?? '')
    }
  }, [open, quarter])

  const isValid = name.trim() && startDate && endDate

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return

    if (isEdit && quarter) {
      updateMutation.mutate(
        { id: quarter.id, name: name.trim(), startDate, endDate },
        { onSuccess: onClose },
      )
    } else {
      createMutation.mutate(
        { name: name.trim(), startDate, endDate },
        { onSuccess: onClose },
      )
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar quarter' : 'Nuevo quarter'}
      size="sm"
      footer={
        <div className={styles.footer}>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" type="submit" form="quarter-form" disabled={!isValid || isPending}>
            {isPending ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear quarter'}
          </Button>
        </div>
      }
    >
      <form id="quarter-form" onSubmit={handleSubmit} className={styles.form}>
        <FormField
          id="quarter-name"
          label="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Q3 2026"
          required
          autoFocus
        />
        <div className={styles.dates}>
          <FormField
            id="quarter-start"
            label="Inicio"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
          <FormField
            id="quarter-end"
            label="Fin"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>
      </form>
    </Modal>
  )
}
