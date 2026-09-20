import { act, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { VidaLogSessionSheet } from '@/features/vida/components/VidaLogSessionSheet'
import type { ActivityFollowUp } from '@/features/vida/types/activity-followup.types'
import type { VidaItem, VidaSuggestion } from '@/features/vida/types/vida-item.types'
import { renderWithProviders } from '@/test/render'

/**
 * La hoja de registrar: criterios 30, 31, 32, 35 y **36**.
 *
 * El que más importa es el **36**: con la mutación fallando, la hoja **no se
 * cierra**, no pierde lo elegido y **no deja una sesión fantasma** —lo que aquí
 * se comprueba viendo que `onClose` no se llama, que lo elegido sigue marcado y
 * que el `mutate` salió **una sola vez**: no hay escritura optimista, así que
 * la agenda no puede enseñar nada que el servidor no tenga—.
 *
 * Molde: `VidaPlaceInGapSheet.test.tsx`; los hooks de datos se mockean.
 */

type MutationStub = {
  mutate: ReturnType<typeof vi.fn>
  isPending: boolean
  isError: boolean
}

let createMutation: MutationStub
let editMutation: MutationStub

vi.mock('@/features/vida/hooks/useActivityFollowUps', () => ({
  useCreateActivityFollowUpMutation: () => createMutation,
  useUpdateActivityFollowUpMutation: () => editMutation,
}))
vi.mock('@/features/vida/hooks/useActivities', () => ({
  useActivitiesQuery: () => ({
    data: { activities: [], total: 0 },
    isPending: false,
    fetchStatus: 'idle',
    isError: false,
  }),
}))

function suggestion(id: string, title: string, durationMinutes: number | null): VidaSuggestion {
  const item: VidaItem = {
    id,
    userId: 1,
    activityId: `a-${id}`,
    days: ['friday'],
    startTime: null,
    durationMinutes,
    notes: null,
    isActive: true,
    orderIndex: 0,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    activity: { id: `a-${id}`, title, category: null },
  }
  return { item, takenToday: false }
}

const SUGGESTIONS = [suggestion('s1', 'Poner lavadora', 20)]

const SESSION: ActivityFollowUp = {
  id: 'f9',
  activityId: 'otra',
  date: '2026-09-18',
  startTime: '08:10',
  durationMinutes: 32,
  isOpen: false,
  endTime: null,
  endDate: null,
  endDateTime: null,
  notes: 'lo de siempre',
  activity: { id: 'otra', title: 'Llamada con el banco', category: null },
}

function renderSheet(props: Partial<Parameters<typeof VidaLogSessionSheet>[0]> = {}) {
  const onClose = vi.fn()
  renderWithProviders(
    <VidaLogSessionSheet
      open
      onClose={onClose}
      mode="log"
      date="2026-09-18"
      dayLabel="viernes"
      suggestions={SUGGESTIONS}
      defaultStartTime="08:54"
      {...props}
    />,
  )
  return onClose
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 8, 18, 9, 24, 0))
  createMutation = { mutate: vi.fn(), isPending: false, isError: false }
  editMutation = { mutate: vi.fn(), isPending: false, isError: false }
})

afterEach(() => {
  vi.useRealTimers()
})

describe('VidaLogSessionSheet — «Empezar algo» (criterio 30)', () => {
  it('pregunta solo qué y no pide duración', () => {
    renderSheet({ mode: 'start', onStart: vi.fn().mockResolvedValue({ ok: true }) })

    expect(screen.getByRole('heading', { name: 'Qué' })).toBeInTheDocument()
    expect(screen.queryByText('Cuánto duró')).not.toBeInTheDocument()
    expect(screen.queryByText('A qué hora empezó')).not.toBeInTheDocument()
    expect(screen.getByText('Arranca ahora mismo. Cuando termines nos dices cuánto duró.'))
      .toBeInTheDocument()
  })

  it('si no se puede empezar, la hoja se queda abierta con lo elegido y lo dice', async () => {
    const onStart = vi.fn().mockResolvedValue({ ok: false, message: 'Ya tenías algo en marcha.' })
    const onClose = renderSheet({ mode: 'start', onStart })

    fireEvent.click(screen.getByRole('button', { name: /Poner lavadora/ }))
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Empezar' }))
    })

    expect(onStart).toHaveBeenCalledWith('a-s1')
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('Ya tenías algo en marcha.')
    expect(screen.getByRole('button', { name: /Poner lavadora/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })
})

describe('VidaLogSessionSheet — «Registrar tiempo pasado» (criterios 31, 32 y 36)', () => {
  it('parte de la hora que le dan y de la duración de la plantilla', () => {
    renderSheet()

    expect(screen.getByLabelText('Hora a la que empezó')).toHaveValue('08:54')
    fireEvent.click(screen.getByRole('button', { name: /Poner lavadora/ }))
    // Lo que la plantilla decía viene puesto y se puede cambiar.
    expect(screen.getByRole('button', { name: '30' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText(/Poner lavadora · 8:54 · 20m/)).toBeInTheDocument()
  })

  it('una hora que todavía no ha llegado no se registra (criterio 32)', () => {
    const onClose = renderSheet()

    fireEvent.click(screen.getByRole('button', { name: /Poner lavadora/ }))
    fireEvent.change(screen.getByLabelText('Hora a la que empezó'), {
      target: { value: '10:00' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Registrar' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Esa hora todavía no ha llegado.')
    expect(createMutation.mutate).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('criterio 36 — si la mutación falla, la hoja no se cierra ni pierde lo elegido', () => {
    // `mutate` que no llama a su `onSuccess`: es lo que pasa cuando el servidor
    // responde mal. El error se pinta porque el hook deja `isError`.
    createMutation = { mutate: vi.fn(), isPending: false, isError: true }
    const onClose = renderSheet()

    fireEvent.click(screen.getByRole('button', { name: /Poner lavadora/ }))
    // 15 y no 45: a las 9:24, un rato de 45 min empezado a las 8:54 todavía no
    // habría acabado, y la hoja lo pararía antes de llamar a nadie.
    fireEvent.click(screen.getByRole('button', { name: '15' }))
    fireEvent.click(screen.getByRole('button', { name: 'Registrar' }))

    expect(createMutation.mutate).toHaveBeenCalledTimes(1)
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /Poner lavadora/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: '15' })).toHaveAttribute('aria-pressed', 'true')
    expect(
      screen.getByText('No pudimos registrarlo. Vuelve a intentarlo; lo que elegiste sigue aquí.'),
    ).toBeInTheDocument()
  })

  it('se cierra sola cuando el servidor dice que sí', () => {
    createMutation = {
      mutate: vi.fn((_input, options) => options?.onSuccess?.()),
      isPending: false,
      isError: false,
    }
    const onClose = renderSheet()

    fireEvent.click(screen.getByRole('button', { name: /Poner lavadora/ }))
    fireEvent.click(screen.getByRole('button', { name: '15' }))
    fireEvent.click(screen.getByRole('button', { name: 'Registrar' }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('la salida es «Volver», nunca «Cancelar» (criterio 59)', () => {
    renderSheet()

    expect(screen.getByRole('button', { name: 'Volver' })).toBeInTheDocument()
    const sheet = screen.getByRole('dialog')
    expect(within(sheet).queryByRole('button', { name: /cancelar|eliminar/i })).toBeNull()
  })
})

describe('VidaLogSessionSheet — corregir lo registrado (criterio 35)', () => {
  it('el «qué» no se pregunta: se recuerda, y se corrigen hora, duración y notas', () => {
    renderSheet({ mode: 'edit', session: SESSION })

    expect(screen.queryByRole('heading', { name: 'Qué' })).not.toBeInTheDocument()
    expect(screen.getByText('Llamada con el banco')).toBeInTheDocument()
    expect(screen.getByLabelText('Hora a la que empezó')).toHaveValue('08:10')
    expect(screen.getByLabelText('Notas de esta sesión')).toHaveValue('lo de siempre')
  })

  it('guardar manda el `id` con los tres campos', () => {
    renderSheet({ mode: 'edit', session: SESSION })

    fireEvent.change(screen.getByLabelText('Notas de esta sesión'), {
      target: { value: 'se alargó' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(editMutation.mutate.mock.calls[0][0]).toEqual({
      id: 'f9',
      startTime: '08:10',
      durationMinutes: 32,
      notes: 'se alargó',
    })
  })
})
