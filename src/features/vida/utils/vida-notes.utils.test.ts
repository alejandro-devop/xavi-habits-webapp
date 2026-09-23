import { describe, expect, it } from 'vitest'
import {
  recentNoteSuggestions,
  VIDA_NOTE_ADD_LABEL,
  VIDA_NOTE_QUESTION_DONE,
  VIDA_NOTE_QUESTION_RUNNING,
} from '@/features/vida/utils/vida-notes.utils'

/**
 * «Lo de otras veces» (FEAT-018, criterios 546 y 547) y las palabras del
 * módulo (criterio 532). Aritmética pura: nada de React ni de red.
 */

function session(id: string, notes: string | null) {
  return { id, notes }
}

describe('recentNoteSuggestions', () => {
  it('criterio 546 — devuelve las últimas notas, en el orden en que llegan', () => {
    expect(
      recentNoteSuggestions([
        session('f3', 'Soporte y tickets'),
        session('f2', 'Daily + planning'),
        session('f1', 'Revisando MRs'),
      ]),
    ).toEqual(['Soporte y tickets', 'Daily + planning', 'Revisando MRs'])
  })

  it('las sesiones sin nota no son una píldora en blanco', () => {
    expect(
      recentNoteSuggestions([
        session('f4', null),
        session('f3', '   '),
        session('f2', 'Revisando MRs'),
      ]),
    ).toEqual(['Revisando MRs'])
  })

  it('deduplica ignorando mayúsculas y espacios, y conserva la redacción más reciente', () => {
    expect(
      recentNoteSuggestions([
        session('f3', 'Revisando MRs'),
        session('f2', 'revisando   mrs'),
        session('f1', 'REVISANDO MRS'),
        session('f0', 'Daily'),
      ]),
    ).toEqual(['Revisando MRs', 'Daily'])
  })

  it('recorta los espacios de los lados sin tocar el texto', () => {
    expect(recentNoteSuggestions([session('f1', '  Bug del carrito  ')])).toEqual([
      'Bug del carrito',
    ])
  })

  it('tres como mucho, salvo que se pida otra cosa', () => {
    const many = ['a', 'b', 'c', 'd', 'e'].map((text, index) => session(`f${index}`, text))

    expect(recentNoteSuggestions(many)).toEqual(['a', 'b', 'c'])
    expect(recentNoteSuggestions(many, { max: 2 })).toEqual(['a', 'b'])
  })

  it('la sesión que se está editando no se ofrece a sí misma', () => {
    expect(
      recentNoteSuggestions([session('f9', 'Lo de ahora'), session('f1', 'Revisando MRs')], {
        excludeId: 'f9',
      }),
    ).toEqual(['Revisando MRs'])
  })

  it('criterio 547 — sin nada devuelve una lista vacía, no un hueco que explicar', () => {
    expect(recentNoteSuggestions([])).toEqual([])
    expect(recentNoteSuggestions(undefined)).toEqual([])
    expect(recentNoteSuggestions([session('f1', null)])).toEqual([])
  })
})

describe('las palabras (criterio 532)', () => {
  it('son preguntas, y en ninguna aparece «nota» ni «descripción»', () => {
    for (const text of [
      VIDA_NOTE_ADD_LABEL,
      VIDA_NOTE_QUESTION_DONE,
      VIDA_NOTE_QUESTION_RUNNING,
    ]) {
      expect(text).not.toMatch(/nota|descripci/i)
    }
    expect(VIDA_NOTE_QUESTION_RUNNING).toBe('¿Qué estás haciendo?')
    expect(VIDA_NOTE_QUESTION_DONE).toBe('¿Qué hiciste?')
  })
})
