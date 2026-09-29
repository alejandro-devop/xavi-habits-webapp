import { describe, expect, it } from 'vitest'
import type { HabitCategory } from '@/features/habits/types/habit.types'
import {
  buildCategoryCreatePayload,
  buildCategoryEditPayload,
  categoryToFormValues,
  defaultCategoryFormValues,
  validateCategoryForm,
} from './habit-category-form.utils'

function buildCategory(overrides: Partial<HabitCategory> = {}): HabitCategory {
  return {
    id: '7',
    userId: 1,
    name: 'Salud',
    description: null,
    icon: null,
    color: '#10b981',
    orderIndex: 2,
    ...overrides,
  }
}

describe('defaultCategoryFormValues', () => {
  it('ya no inventa #6366f1: sin color de quien llama, nace sin color', () => {
    expect(defaultCategoryFormValues(3).color).toBeNull()
  })

  it('usa el color que le pasa quien sortea', () => {
    expect(defaultCategoryFormValues(3, '#f59e0b')).toMatchObject({
      color: '#f59e0b',
      orderIndex: '3',
    })
  })
})

describe('categoryToFormValues + buildCategoryEditPayload', () => {
  it('un color de fuera de la paleta llega intacto al guardar (criterio 7)', () => {
    const category = buildCategory({ color: '#6366F1' })
    const payload = buildCategoryEditPayload(categoryToFormValues(category), category)
    expect(payload.color).toBe('#6366F1')
  })

  it('una categoría sin color sigue sin color al guardar (criterio 8)', () => {
    const category = buildCategory({ color: null })
    const values = categoryToFormValues(category)
    expect(values.color).toBeNull()
    expect(buildCategoryEditPayload(values, category).color).toBeNull()
  })

  it('un color del núcleo se mantiene (criterio 9)', () => {
    const category = buildCategory({ color: '#8b5cf6' })
    expect(buildCategoryEditPayload(categoryToFormValues(category), category).color).toBe(
      '#8b5cf6',
    )
  })
})

describe('buildCategoryCreatePayload', () => {
  it('envía el color con el que se abrió el formulario', () => {
    const values = { ...defaultCategoryFormValues(0, '#0284c7'), name: 'Mente' }
    expect(buildCategoryCreatePayload(values).color).toBe('#0284c7')
  })
})

describe('validateCategoryForm', () => {
  it('no bloquea el guardado por un color que ya venía guardado', () => {
    // Editar el nombre no obliga a cambiar el color: lo que la categoría traía
    // se guarda tal cual, aunque no sea un hex de seis cifras.
    const values = { ...categoryToFormValues(buildCategory({ color: '#fff' })), name: 'Otra' }
    expect(validateCategoryForm(values)).toBeNull()
  })

  it('sigue pidiendo el nombre', () => {
    expect(validateCategoryForm(defaultCategoryFormValues(0, '#10b981'))).toBe(
      'El nombre es obligatorio.',
    )
  })
})
