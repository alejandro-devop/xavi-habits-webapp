import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useVidaPatterns } from '@/features/vida/hooks/useVidaPatterns'
import {
  VIDA_DEVICE_NOTES_STORAGE_KEY,
  useVidaDeviceNotesStore,
} from '@/features/vida/store/vida-device-notes.store'
import type { ActivityDayPlanItem } from '@/features/vida/types/activity-day-plan.types'
import type { ActivityFollowUp } from '@/features/vida/types/activity-followup.types'
import type { VidaItem } from '@/features/vida/types/vida-item.types'
import { calculateEndTime } from '@/features/vida/utils/vida-time.utils'

/**
 * **El pegamento de las tres pantallas** (FEAT-007, tajada 2): que «Dejarlo»
 * se guarde **en la clave que ya existe** (criterio 82), que la regla de las
 * cuatro semanas se aplique **una sola vez y aquí** (83) y que el puente de
 * FEAT-006 y estas sugerencias **no pregunten dos veces** (punto 5 del plan).
 *
 * La ventana y la plantilla se mockean: sus consultas tienen su propio test
 * (`useVidaHistoryWindow.test.tsx`, donde vive la medida del criterio 103).
 * Lo que aquí se prueba es el cruce con el aparato, con el reloj inyectado.
 */

type HistoryDay = {
  date: string
  planItems: ActivityDayPlanItem[]
  followUps: ActivityFollowUp[]
  isPending: boolean
  isError: boolean
}

let historyDays: HistoryDay[] = []
const historyRefetch = vi.fn()

vi.mock('@/features/vida/hooks/useVidaHistoryWindow', () => ({
  VIDA_HISTORY_WEEKS: 6,
  useVidaHistoryWindow: () => ({
    dates: historyDays.map((day) => day.date),
    from: historyDays[0]?.date ?? '',
    to: historyDays[historyDays.length - 1]?.date ?? '',
    days: historyDays,
    byDate: Object.fromEntries(historyDays.map((day) => [day.date, day])),
    isPending: false,
    hasError: false,
    refetch: historyRefetch,
  }),
}))

let templateItems: VidaItem[] = []
vi.mock('@/features/vida/hooks/useVidaItems', () => ({
  useVidaItemsQuery: () => ({
    data: templateItems,
    isPending: false,
    isError: false,
    fetchStatus: 'idle',
    refetch: vi.fn(),
  }),
}))

const DAY_HOURS = { startTime: '06:30', endTime: '23:00' }
/** Lunes 21 de septiembre de 2026. */
const TODAY = '2026-09-21'
const DATES = ['2026-09-07', '2026-09-09', '2026-09-11', '2026-09-14', '2026-09-16']

const ITEM: VidaItem = {
  id: 'i1',
  userId: 1,
  activityId: 'a1',
  days: ['monday', 'wednesday', 'friday'],
  startTime: '19:00',
  durationMinutes: 30,
  notes: null,
  isActive: true,
  orderIndex: 0,
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
  activity: { id: 'a1', title: 'Pasear a las mascotas', category: null },
}

function dayWith(date: string, realStart: string): HistoryDay {
  return {
    date,
    planItems: [
      {
        id: `b-${date}`,
        userId: 1,
        activityId: 'a1',
        date,
        startTime: '19:00',
        endTime: calculateEndTime('19:00', 30),
        orderIndex: 0,
        completedAt: null,
        createdAt: `${date}T00:00:00.000Z`,
        updatedAt: `${date}T00:00:00.000Z`,
      },
    ],
    followUps: [
      {
        id: `s-${date}`,
        activityId: 'a1',
        date,
        startTime: realStart,
        durationMinutes: 32,
        endTime: calculateEndTime(realStart, 32),
        endDate: date,
        endDateTime: null,
        notes: null,
      },
    ],
    isPending: false,
    isError: false,
  }
}

function mount() {
  return renderHook(() =>
    useVidaPatterns({ enabled: true, today: TODAY, nowMinutes: null, dayHours: DAY_HOURS }),
  )
}

beforeEach(() => {
  localStorage.clear()
  useVidaDeviceNotesStore.setState({
    blockNotes: {},
    dismissedNoData: [],
    dismissedBridges: [],
    patternAnswers: {},
  })
  historyDays = DATES.map((date) => dayWith(date, '19:28'))
  templateItems = [ITEM]
})

describe('useVidaPatterns (criterios 82, 83 y el cruce con el puente)', () => {
  it('con datos suficientes hay una pregunta viva, con su número dentro', () => {
    const { result } = mount()

    expect(result.current.liveSuggestions).toHaveLength(1)
    expect(result.current.liveSuggestions[0]?.affirmativeLabel).toBe('Moverlo a las 19:30')
    expect(result.current.patternsLabel).toBe('1 con algo que proponer')
  })

  it('«Dejarlo» calla la pregunta y **no estrena ninguna clave** de `localStorage` (82)', () => {
    const { result } = mount()
    const suggestion = result.current.liveSuggestions[0]!

    act(() => result.current.answerSuggestion(suggestion))

    expect(result.current.liveSuggestions).toEqual([])
    expect(result.current.patterns[0]?.suggestion).toBeNull()
    // La fecha de vuelta está a la vista **desde que se contesta** (D1, 99).
    expect(result.current.patterns[0]?.answerNote).toBe(
      'Lo dejaste el 21 de septiembre. Vuelve el 19 de octubre si el patrón sigue igual.',
    )
    expect(result.current.answered).toHaveLength(1)
    // **Ninguna clave nueva**: la que hay es la que ya existía desde FEAT-004.
    expect(Object.keys(localStorage)).toEqual([VIDA_DEVICE_NOTES_STORAGE_KEY])
    const saved = JSON.parse(localStorage.getItem(VIDA_DEVICE_NOTES_STORAGE_KEY) ?? '{}')
    expect(saved.state.patternAnswers['start-time|i1']).toEqual({
      answeredOn: TODAY,
      offsetMinutes: 28,
      dayOfWeek: null,
    })
  })

  it('si el desfase se mueve 10 min o más, **vuelve antes de plazo** (83)', () => {
    const first = mount()
    act(() => first.result.current.answerSuggestion(first.result.current.liveSuggestions[0]!))

    expect(first.result.current.liveSuggestions).toEqual([])

    // Las mismas cinco veces, pero ahora sale una hora más tarde.
    historyDays = DATES.map((date) => dayWith(date, '20:15'))
    const second = mount()
    expect(second.result.current.liveSuggestions).toHaveLength(1)
  })

  it('la respuesta dada en el puente **también aparece en «Contestadas»** (99)', () => {
    act(() => useVidaDeviceNotesStore.getState().dismissBridge('2026-09-21', 'i1'))

    const { result } = mount()
    // Calla la pregunta **y se ve**: una respuesta invisible no puede ser.
    expect(result.current.liveSuggestions).toEqual([])
    expect(result.current.answered).toHaveLength(1)
    expect(result.current.answered[0]).toMatchObject({ source: 'bridge', answer: null })
    expect(result.current.answered[0]?.note).toBe(
      'Lo dejaste como estaba en la semana del 21 de septiembre. Vuelve el 28 de septiembre si el patrón sigue igual.',
    )
    // Y la tarjeta dice lo mismo, no se queda callada sin explicación.
    expect(result.current.patterns[0]?.answerNote).toContain('Vuelve el 28 de septiembre')
  })

  it('el puente de esta semana ya contestado **no se vuelve a preguntar aquí**', () => {
    act(() => useVidaDeviceNotesStore.getState().dismissBridge('2026-09-21', 'i1'))

    const { result } = mount()
    expect(result.current.liveSuggestions).toEqual([])
    // La tarjeta sigue contando lo que pasa: lo que se calla es la pregunta.
    expect(result.current.patterns).toHaveLength(1)
    expect(result.current.patterns[0]?.durationLine).not.toBeNull()
  })
})
