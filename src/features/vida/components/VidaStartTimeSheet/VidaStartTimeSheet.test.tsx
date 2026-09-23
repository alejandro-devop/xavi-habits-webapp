import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as followUpsApi from '@/features/vida/api/activity-followups.api'
import { VidaStartTimeSheet } from '@/features/vida/components/VidaStartTimeSheet'
import type { ActivityFollowUp } from '@/features/vida/types/activity-followup.types'
import { renderWithProviders } from '@/test/render'

/**
 * «Empecé antes» (FEAT-013, tajada 2). Criterios 342, 343, 346, 348 y 359.
 *
 * La hoja **no escribe**: recibe `onSave`, como `VidaNoteSheet`. Lo único que
 * consulta es el día de la sesión —para no meter el inicio dentro de un rato que
 * ya tiene dueño—, y por eso aquí se moquea el API de verdad en vez del hook:
 * así el camino que corre en la pantalla es el que se prueba.
 */
vi.mock('@/features/vida/api/activity-followups.api')
vi.mock('@/features/auth/providers/useAuthBootstrap', () => ({
  useAuthBootstrap: () => ({ status: 'ready' }),
}))
vi.mock('@/features/auth/store/auth.store', () => ({
  useAuthStore: (selector: (s: { accessToken: string | null }) => unknown) =>
    selector({ accessToken: 'token' }),
}))
vi.mock('@/features/auth/store/auth.selectors', () => ({
  selectIsAuthenticated: (s: { accessToken: string | null }) => Boolean(s.accessToken),
}))

const HOY = '2026-09-18'

function followUp(overrides: Partial<ActivityFollowUp> = {}): ActivityFollowUp {
  return {
    id: 'f1',
    activityId: 'a-trabajo',
    date: HOY,
    startTime: '09:00',
    durationMinutes: null,
    isOpen: true,
    endTime: null,
    endDate: null,
    endDateTime: null,
    notes: null,
    activity: { id: 'a-trabajo', title: 'Trabajar' },
    ...overrides,
  }
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  // Viernes 18 de septiembre de 2026, 10:08.
  vi.setSystemTime(new Date(2026, 8, 18, 10, 8, 0))
  vi.mocked(followUpsApi.getActivityDayFollowUps).mockResolvedValue([])
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

function renderSheet(
  overrides: Partial<Parameters<typeof VidaStartTimeSheet>[0]> = {},
  onSave = vi.fn(async () => ({ ok: true })),
  onClose = vi.fn(),
) {
  renderWithProviders(
    <VidaStartTimeSheet
      open
      onClose={onClose}
      session={followUp()}
      onSave={onSave}
      {...overrides}
    />,
  )
  return { onSave, onClose }
}

describe('VidaStartTimeSheet', () => {
  it('criterio 342 — pregunta la hora y recuerda desde cuándo cuenta ahora', () => {
    renderSheet()

    expect(screen.getByRole('heading', { name: '¿A qué hora empezaste?' })).toBeInTheDocument()
    expect(screen.getByText('Trabajar · en marcha desde las 9:00')).toBeInTheDocument()
    expect(screen.getByLabelText('Hora a la que empezaste')).toHaveValue('09:00')
  })

  it('criterio 343 — guardar manda **la hora y nada más**, y dice que sigue en marcha', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const { onSave, onClose } = renderSheet()

    await user.clear(screen.getByLabelText('Hora a la que empezaste'))
    await user.type(screen.getByLabelText('Hora a la que empezaste'), '08:07')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(onSave).toHaveBeenCalledWith('08:07')
    expect(onSave).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  it('criterio 346 — una hora que no ha llegado no se guarda, con la frase de siempre', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const { onSave } = renderSheet()

    await user.clear(screen.getByLabelText('Hora a la que empezaste'))
    await user.type(screen.getByLabelText('Hora a la que empezaste'), '23:30')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Esa hora todavía no ha llegado.')
    expect(onSave).not.toHaveBeenCalled()
  })

  it('un rato que ya tiene dueño no se pisa, y se dice de quién es', async () => {
    vi.mocked(followUpsApi.getActivityDayFollowUps).mockResolvedValue([
      followUp({
        id: 'f2',
        startTime: '08:00',
        durationMinutes: 30,
        isOpen: false,
        activity: { id: 'a-desayuno', title: 'Desayunar' },
      }),
    ])
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const { onSave } = renderSheet()
    await waitFor(() => expect(followUpsApi.getActivityDayFollowUps).toHaveBeenCalled())

    await user.clear(screen.getByLabelText('Hora a la que empezaste'))
    await user.type(screen.getByLabelText('Hora a la que empezaste'), '08:10')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Ese rato ya lo tiene «Desayunar», hasta las 8:30. Elige una hora desde esa.',
      ),
    )
    expect(onSave).not.toHaveBeenCalled()
  })

  it('con los ratos del día **todavía en vuelo**, la comprobación espera en vez de saltársela', async () => {
    // El caso que abre el revisor: desde otra pantalla del módulo la consulta
    // no está cacheada, y guardar antes de que vuelva se saltaría el solape.
    let resolveDay: (value: ActivityFollowUp[]) => void = () => {}
    vi.mocked(followUpsApi.getActivityDayFollowUps).mockReturnValue(
      new Promise((resolve) => {
        resolveDay = resolve
      }),
    )
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const { onSave } = renderSheet()

    await user.clear(screen.getByLabelText('Hora a la que empezaste'))
    await user.type(screen.getByLabelText('Hora a la que empezaste'), '08:10')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    // Todavía no se ha guardado nada: se está esperando al día.
    expect(onSave).not.toHaveBeenCalled()

    resolveDay([
      followUp({
        id: 'f2',
        startTime: '08:00',
        durationMinutes: 30,
        isOpen: false,
        activity: { id: 'a-desayuno', title: 'Desayunar' },
      }),
    ])

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Ese rato ya lo tiene «Desayunar», hasta las 8:30.',
      ),
    )
    expect(onSave).not.toHaveBeenCalled()
  })

  it('criterio 348 — si falla, la hoja no se cierra y la hora escrita sigue aquí', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const { onClose } = renderSheet({}, vi.fn(async () => ({ ok: false, message: 'No pudimos cambiar la hora. Sigue en marcha como estaba; inténtalo otra vez.' })))

    await user.clear(screen.getByLabelText('Hora a la que empezaste'))
    await user.type(screen.getByLabelText('Hora a la que empezaste'), '08:07')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Sigue en marcha'))
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Hora a la que empezaste')).toHaveValue('08:07')
  })

  it('criterio 359 — ni una palabra de reproche, y se dice lo que va a contar', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderSheet()

    await user.clear(screen.getByLabelText('Hora a la que empezaste'))
    await user.type(screen.getByLabelText('Hora a la que empezaste'), '08:07')

    // 8:07 → 10:08 son 2 h 1 min: lo que llevaría contado si se guarda.
    expect(screen.getByText('Sigue en marcha y llevarías 2 h 1 min.')).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/olvid|tarde|deberías|fallaste|error/i)
  })

  it('«Volver» no guarda nada', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const { onSave, onClose } = renderSheet()

    await user.clear(screen.getByLabelText('Hora a la que empezaste'))
    await user.type(screen.getByLabelText('Hora a la que empezaste'), '08:07')
    await user.click(screen.getByRole('button', { name: 'Volver' }))

    expect(onSave).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })
})
