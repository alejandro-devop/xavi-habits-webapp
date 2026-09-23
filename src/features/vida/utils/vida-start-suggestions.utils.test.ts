import { describe, expect, it } from 'vitest'
import type { VidaItem, VidaSuggestion } from '@/features/vida/types/vida-item.types'
import {
  VIDA_START_SUGGESTIONS_MAX,
  topStartSuggestions,
} from '@/features/vida/utils/vida-start-suggestions.utils'

/**
 * La regla de los cinco de «Empezar algo» (FEAT-023, tajada 1), sin pintar
 * nada. Un caso por fila de la tabla de «dónde se rompe» de la sección 2.
 */

function suggestion(
  id: string,
  startTime: string | null,
  overrides: Partial<VidaItem> = {},
): VidaSuggestion {
  const activityId = overrides.activityId ?? `a-${id}`
  const item: VidaItem = {
    id,
    userId: 1,
    activityId,
    days: ['friday'],
    startTime,
    durationMinutes: 30,
    notes: null,
    isActive: true,
    orderIndex: 0,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    activity: { id: activityId, title: `Cosa ${id}`, category: null },
    ...overrides,
  }
  return { item, takenToday: false }
}

const ids = (list: VidaSuggestion[]) => list.map((entry) => entry.item.id)
const activityIds = (list: VidaSuggestion[]) => list.map((entry) => entry.item.activityId)

const at = (hours: number, minutes = 0) => hours * 60 + minutes

describe('topStartSuggestions', () => {
  it('ofrece cinco como mucho, y el cinco está escrito en un solo sitio', () => {
    const list = topStartSuggestions({
      suggestions: [
        suggestion('a', '16:00'),
        suggestion('b', '17:00'),
        suggestion('c', '18:00'),
        suggestion('d', '19:00'),
        suggestion('e', '20:00'),
        suggestion('f', '21:00'),
        suggestion('g', '22:00'),
      ],
      nowMinutes: at(15, 40),
    })

    expect(VIDA_START_SUGGESTIONS_MAX).toBe(5)
    expect(list).toHaveLength(VIDA_START_SUGGESTIONS_MAX)
    expect(ids(list)).toEqual(['a', 'b', 'c', 'd', 'e'])
  })

  it('el tope se puede sobreescribir (solo para los tests)', () => {
    const list = topStartSuggestions({
      suggestions: [suggestion('a', '16:00'), suggestion('b', '17:00'), suggestion('c', '18:00')],
      nowMinutes: at(15, 40),
      max: 2,
    })

    expect(ids(list)).toEqual(['a', 'b'])
  })

  it('una sola ficha por actividad aunque la plantilla tenga tres bloques', () => {
    const list = topStartSuggestions({
      suggestions: [
        suggestion('lulu-1', '09:00', { activityId: 'a-lulu' }),
        suggestion('lulu-2', '16:00', { activityId: 'a-lulu' }),
        suggestion('lulu-3', '20:00', { activityId: 'a-lulu' }),
        suggestion('otra', '17:00'),
      ],
      nowMinutes: at(15, 40),
    })

    expect(activityIds(list)).toEqual(['a-lulu', 'a-otra'])
    // Gana el más cercano a ahora hacia delante, no el primero del día.
    expect(ids(list)).toEqual(['lulu-2', 'otra'])
  })

  it('si todos los bloques de una actividad ya pasaron, manda el más reciente', () => {
    const list = topStartSuggestions({
      suggestions: [
        suggestion('temprano', '07:00', { activityId: 'a-lulu' }),
        suggestion('mediodia', '13:00', { activityId: 'a-lulu' }),
      ],
      nowMinutes: at(15, 40),
    })

    expect(ids(list)).toEqual(['mediodia'])
  })

  it('primero lo que viene, después lo que pasó del más reciente al más antiguo', () => {
    const list = topStartSuggestions({
      suggestions: [
        suggestion('manana', '08:00'),
        suggestion('mediodia', '13:00'),
        suggestion('pronto', '16:00'),
        suggestion('tarde', '20:00'),
      ],
      nowMinutes: at(15, 40),
    })

    expect(ids(list)).toEqual(['pronto', 'tarde', 'mediodia', 'manana'])
  })

  it('lo que empieza justo ahora cuenta como lo que viene, no como pasado', () => {
    const list = topStartSuggestions({
      suggestions: [suggestion('justo', '15:40'), suggestion('antes', '15:39')],
      nowMinutes: at(15, 40),
    })

    expect(ids(list)).toEqual(['justo', 'antes'])
  })

  it('lo que no tiene hora va al final', () => {
    const list = topStartSuggestions({
      suggestions: [
        suggestion('sin-hora', null),
        suggestion('pasado', '07:00'),
        suggestion('futuro', '18:00'),
      ],
      nowMinutes: at(15, 40),
    })

    expect(ids(list)).toEqual(['futuro', 'pasado', 'sin-hora'])
  })

  it('a las 23:40, con todo pasado, la lista no queda vacía', () => {
    const list = topStartSuggestions({
      suggestions: [suggestion('siete', '07:00'), suggestion('diez', '22:00')],
      nowMinutes: at(23, 40),
    })

    expect(ids(list)).toEqual(['diez', 'siete'])
  })

  it('el empate se rompe por título y luego por actividad: dos corridas, la misma lista', () => {
    const suggestions = [
      suggestion('z', '16:00', { activityId: 'a-2', activity: { id: 'a-2', title: 'Bañarme', category: null } }),
      suggestion('y', '16:00', { activityId: 'a-1', activity: { id: 'a-1', title: 'Almorzar', category: null } }),
      suggestion('x', '16:00', { activityId: 'a-3', activity: { id: 'a-3', title: 'Almorzar', category: null } }),
    ]
    const nowMinutes = at(15, 40)

    const first = topStartSuggestions({ suggestions, nowMinutes })
    const second = topStartSuggestions({ suggestions: [...suggestions].reverse(), nowMinutes })

    expect(activityIds(first)).toEqual(['a-1', 'a-3', 'a-2'])
    expect(activityIds(second)).toEqual(activityIds(first))
  })

  it('no ofrece lo inactivo ni lo excluido', () => {
    const list = topStartSuggestions({
      suggestions: [
        suggestion('apagada', '16:00', { isActive: false }),
        suggestion('puesta', '17:00'),
        suggestion('libre', '18:00'),
      ],
      nowMinutes: at(15, 40),
      excludeActivityIds: ['a-puesta'],
    })

    expect(ids(list)).toEqual(['libre'])
  })

  it('sin plantilla —o con todo apagado— devuelve vacío, y no lo rellena con nada', () => {
    expect(topStartSuggestions({ suggestions: [], nowMinutes: at(15, 40) })).toEqual([])
    expect(topStartSuggestions({ suggestions: undefined, nowMinutes: at(15, 40) })).toEqual([])
    expect(
      topStartSuggestions({
        suggestions: [suggestion('apagada', '16:00', { isActive: false })],
        nowMinutes: at(15, 40),
      }),
    ).toEqual([])
  })

  it('con menos de cinco enseña las que haya', () => {
    const list = topStartSuggestions({
      suggestions: [suggestion('una', '16:00'), suggestion('dos', '17:00')],
      nowMinutes: at(15, 40),
    })

    expect(ids(list)).toEqual(['una', 'dos'])
  })

  it('sin «ahora» —el día que se mira no es hoy— manda el orden del día', () => {
    const list = topStartSuggestions({
      suggestions: [
        suggestion('tarde', '20:00'),
        suggestion('manana', '08:00'),
        suggestion('sin-hora', null),
      ],
      nowMinutes: null,
    })

    expect(ids(list)).toEqual(['manana', 'tarde', 'sin-hora'])
  })

  it('no toca el array que recibe', () => {
    const suggestions = [suggestion('tarde', '20:00'), suggestion('pronto', '16:00')]
    topStartSuggestions({ suggestions, nowMinutes: at(15, 40) })

    expect(ids(suggestions)).toEqual(['tarde', 'pronto'])
  })
})
