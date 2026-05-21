import { describe, expect, it } from 'vitest'
import {
  emptyActivityFormValues,
  formValuesToInput,
  validateActivityForm,
} from '@/features/activities/utils/activity-form'

describe('validateActivityForm', () => {
  it('requires title', () => {
    expect(validateActivityForm(emptyActivityFormValues())).toBe('El título es obligatorio.')
  })

  it('accepts valid title', () => {
    const result = validateActivityForm({
      ...emptyActivityFormValues(),
      title: 'Revisar informe',
    })
    expect(result).toBeNull()
  })
})

describe('formValuesToInput', () => {
  it('maps form to API input', () => {
    const input = formValuesToInput({
      title: '  Tarea  ',
      description: 'Notas',
      status: 'pending',
      priority: 'high',
      categoryId: 'cat-1',
      scheduledDate: '2026-05-20T10:00',
    })
    expect(input.title).toBe('Tarea')
    expect(input.description).toBe('Notas')
    expect(input.status).toBe('pending')
    expect(input.priority).toBe('high')
    expect(input.categoryId).toBe('cat-1')
    expect(input.scheduledDate).toMatch(/2026-05-20/)
  })
})
