import { screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { VidaModuleLayout } from '@/features/vida/routes/VidaModuleLayout'
import type { ActivityFollowUp } from '@/features/vida/types/activity-followup.types'
import { renderWithProviders } from '@/test/render'

/**
 * El elemento de ruta del módulo: criterios 7 (la barra se ve en todas las
 * pantallas de Vida), 8 (una sola consulta), 16 y 54 (la sesión de otro día se
 * pregunta y **no** se pinta un cronómetro de catorce horas) y 64 (sin sesión de
 * usuario no hay spinner eterno).
 *
 * Se mockean los hooks de sesión, no la consulta: lo que este componente decide
 * es **qué se pinta** con cada estado.
 */

let openSession: {
  session: ActivityFollowUp | null
  startInstant: Date | null
  isFromAnotherDay: boolean
  isDisabled: boolean
  isPending: boolean
  isError: boolean
  refetch: () => void
}

vi.mock('@/features/vida/hooks/useVidaOpenSession', () => ({
  useVidaOpenSession: () => openSession,
  useVidaSessionPlannedMinutes: () => 45,
}))
vi.mock('@/features/vida/hooks/useVidaSessionActions', () => ({
  useVidaSessionActions: () => ({
    session: openSession.session,
    isFromAnotherDay: openSession.isFromAnotherDay,
    isBusy: false,
    start: vi.fn(),
    finishNow: vi.fn(),
    finishWith: vi.fn(),
    discard: vi.fn(),
    resolveStale: vi.fn(),
  }),
}))
vi.mock('@/features/vida/hooks/useVidaDayHours', () => ({
  useVidaDayHours: () => ({
    startTime: '06:30',
    endTime: '23:00',
    isDefault: true,
    saved: { startTime: null, endTime: null },
    isPending: false,
    isError: false,
    isDisabled: false,
    refetch: vi.fn(),
  }),
}))

function followUp(overrides: Partial<ActivityFollowUp> = {}): ActivityFollowUp {
  return {
    id: 'f1',
    activityId: 'a-casa',
    date: '2026-09-18',
    startTime: '09:00',
    durationMinutes: null,
    isOpen: true,
    endTime: null,
    endDate: null,
    endDateTime: null,
    notes: null,
    activity: {
      id: 'a-casa',
      title: 'Organizar la casa',
      category: { id: 'c1', name: 'Casa', color: '#7C3AED', icon: 'broom' },
    },
    ...overrides,
  }
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 8, 18, 9, 24, 0))
  openSession = {
    session: null,
    startInstant: null,
    isFromAnotherDay: false,
    isDisabled: false,
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  }
})

afterEach(() => {
  vi.useRealTimers()
})

describe('VidaModuleLayout — la sesión visible en todo el módulo (criterio 7)', () => {
  it('sin nada en marcha no pinta barra ni reserva hueco', () => {
    const { container } = renderWithProviders(<VidaModuleLayout />)

    expect(screen.queryByRole('button', { name: 'Terminar' })).not.toBeInTheDocument()
    expect(container.querySelector('[data-session-bar="on"]')).toBeNull()
  })

  it('con una sesión abierta pinta la barra con nombre, cronómetro y «Terminar»', () => {
    openSession = {
      session: followUp(),
      startInstant: new Date(2026, 8, 18, 9, 0, 0),
      isFromAnotherDay: false,
      isDisabled: false,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    }
    const { container } = renderWithProviders(<VidaModuleLayout />)

    expect(screen.getByText('Organizar la casa')).toBeInTheDocument()
    expect(screen.getByText('00:24:00')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Terminar' })).toBeInTheDocument()
    // El hueco reservado abajo: la barra es fija y si no, taparía el último
    // bloque de la agenda (criterio 60).
    expect(container.querySelector('[data-session-bar="on"]')).not.toBeNull()
  })

  it('un toque en el nombre lleva a Hoy, al día de la sesión', () => {
    openSession = {
      session: followUp(),
      startInstant: new Date(2026, 8, 18, 9, 0, 0),
      isFromAnotherDay: false,
      isDisabled: false,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    }
    renderWithProviders(<VidaModuleLayout />)

    expect(screen.getByRole('link', { name: /Organizar la casa/ })).toHaveAttribute(
      'href',
      '/app/vida/hoy?d=2026-09-18',
    )
  })

  it('criterio 9 — pasarse del plan se lee en la barra, sin interrumpir', () => {
    openSession = {
      session: followUp({ startTime: '08:00' }),
      startInstant: new Date(2026, 8, 18, 8, 0, 0),
      isFromAnotherDay: false,
      isDisabled: false,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    }
    renderWithProviders(<VidaModuleLayout />)

    // 84 minutos sobre 45 planeados.
    expect(screen.getByText('llevas 84 min · planeado 45')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('en la barra **no** hay «Cancelar» (criterios 14 y 59)', () => {
    openSession = {
      session: followUp(),
      startInstant: new Date(2026, 8, 18, 9, 0, 0),
      isFromAnotherDay: false,
      isDisabled: false,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    }
    renderWithProviders(<VidaModuleLayout />)

    expect(screen.queryByRole('button', { name: /cancelar/i })).not.toBeInTheDocument()
  })

  it('criterio 64 — sin sesión de usuario no se pinta nada ni se queda cargando', () => {
    openSession = {
      session: null,
      startInstant: null,
      isFromAnotherDay: false,
      isDisabled: true,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    }
    const { container } = renderWithProviders(<VidaModuleLayout />)

    expect(container.querySelector('[aria-busy="true"]')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Terminar' })).not.toBeInTheDocument()
  })
})

describe('VidaModuleLayout — la que quedó abierta de otro día (criterios 16 y 54)', () => {
  beforeEach(() => {
    openSession = {
      session: followUp({ date: '2026-09-17', startTime: '21:00' }),
      startInstant: new Date(2026, 8, 17, 21, 0, 0),
      isFromAnotherDay: true,
      isDisabled: false,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    }
  })

  it('pregunta hasta qué hora, y **no** pinta un cronómetro corriendo desde ayer', () => {
    renderWithProviders(<VidaModuleLayout />)

    expect(
      screen.getByText(/Dejaste «Organizar la casa» en marcha ayer a las 21:00/),
    ).toBeInTheDocument()
    expect(screen.getByText('¿Hasta qué hora la hiciste?')).toBeInTheDocument()
    // 12 horas y pico en marcha no se enseñan como si fueran normales.
    expect(screen.queryByText(/^\d\d:\d\d:\d\d$/)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Terminar' })).not.toBeInTheDocument()
  })

  it('el «No sé» dice **antes** lo que va a anotar, y no es hasta el fin del día', () => {
    renderWithProviders(<VidaModuleLayout />)

    expect(screen.getByRole('button', { name: 'No sé' })).toBeInTheDocument()
    // 45 min es lo planeado de ese bloque; hasta las 23:00 habrían sido 120.
    expect(screen.getByText(/anotamos 45 min/)).toBeInTheDocument()
    expect(screen.getByText(/lo que tenías planeado/)).toBeInTheDocument()
  })

  it('explica que solo bloquea empezar otra cosa, y nunca dice «cancelar»', () => {
    const { container } = renderWithProviders(<VidaModuleLayout />)

    expect(screen.getByText(/no se puede empezar otra cosa/)).toBeInTheDocument()
    expect(container.textContent ?? '').not.toMatch(/cancelar/i)
    // No es un modal: no atrapa el foco ni tapa la pantalla (criterio 54).
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

/* ── El error de la consulta de la sesión (hallazgo 1 de la tajada 1) ────── */

describe('VidaModuleLayout — si no se pudo saber qué hay en marcha', () => {
  it('lo dice y ofrece reintentar, en vez de callar y parecer que no hay nada', () => {
    const refetch = vi.fn()
    openSession = {
      session: null,
      startInstant: null,
      isFromAnotherDay: false,
      isDisabled: false,
      isPending: false,
      isError: true,
      refetch,
    }
    renderWithProviders(<VidaModuleLayout />)

    expect(screen.getByText('No pudimos saber si tienes algo en marcha')).toBeInTheDocument()
    screen.getByRole('button', { name: 'Reintentar' }).click()
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('sin sesión de usuario no se pinta ese aviso (criterio 64)', () => {
    openSession = {
      session: null,
      startInstant: null,
      isFromAnotherDay: false,
      isDisabled: true,
      isPending: false,
      isError: true,
      refetch: vi.fn(),
    }
    renderWithProviders(<VidaModuleLayout />)

    expect(
      screen.queryByText('No pudimos saber si tienes algo en marcha'),
    ).not.toBeInTheDocument()
  })
})
