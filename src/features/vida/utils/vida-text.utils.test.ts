import { describe, expect, it } from 'vitest'
import { compareVidaNames, normalizeVidaText } from '@/features/vida/utils/vida-text.utils'

describe('normalizeVidaText', () => {
  it('quita tildes, la eñe y las mayúsculas', () => {
    expect(normalizeVidaText('Bañarme')).toBe('banarme')
    expect(normalizeVidaText('  Compra de la SEMANA ')).toBe('compra de la semana')
    expect(normalizeVidaText('Revisión')).toBe('revision')
  })

  it('deja el texto vacío en vacío', () => {
    expect(normalizeVidaText('   ')).toBe('')
  })
})

describe('compareVidaNames', () => {
  it('ordena en español, ignorando tildes y mayúsculas', () => {
    const names = ['Ánimo', 'zapatos', 'Bañarme', 'banana']
    expect([...names].sort(compareVidaNames)).toEqual(['Ánimo', 'banana', 'Bañarme', 'zapatos'])
  })
})
