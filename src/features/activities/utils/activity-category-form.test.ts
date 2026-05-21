import { describe, expect, it } from 'vitest'
import {
  emptyCategoryFormValues,
  formValuesToInput,
  validateCategoryForm,
} from '@/features/activities/utils/activity-category-form'

describe('validateCategoryForm', () => {
  it('requires name', () => {
    const result = validateCategoryForm(emptyCategoryFormValues())
    expect(result).toBe('El nombre es obligatorio.')
  })

  it('accepts valid values', () => {
    const result = validateCategoryForm({
      name: 'Trabajo',
      description: '',
      icon: 'bell',
      color: '#6366f1',
      orderIndex: '0',
    })
    expect(result).toBeNull()
  })
})

describe('formValuesToInput', () => {
  it('maps form values to API input with normalized icon', () => {
    const input = formValuesToInput({
      name: '  Trabajo  ',
      description: 'Notas',
      icon: 'fa-bell',
      color: '#ff0000',
      orderIndex: '2',
    })
    expect(input).toEqual({
      name: 'Trabajo',
      description: 'Notas',
      icon: 'bell',
      color: '#ff0000',
      orderIndex: 2,
    })
  })
})
