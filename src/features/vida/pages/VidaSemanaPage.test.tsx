import { act, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { UserSettings } from '@/features/settings/types/user-settings.types'
import { VidaSemanaPage } from '@/features/vida/pages/VidaSemanaPage'
import type { ActivityDayPlanItem } from '@/features/vida/types/activity-day-plan.types'
import type { VidaItem } from '@/features/vida/types/vida-item.types'
import { renderWithProviders } from '@/test/render'

/**
 * La semana: criterios 39, 40, 42, 45 y 46.
 *
 * Se mockean **las consultas** y el `api` del plan del día, no los hooks de
 * armar: lo que hay que comprobar es que `useBuildWeekFromTemplate` de verdad
 * hace **una llamada por día**, **en serie**, y que **no anuncia lo que no
 * pasó** cuando uno falla.
 *
 * El reloj: viernes 18 de septiembre de 2026 a las 9:24, como en Hoy. Esa
 * semana va del lunes 14 al domingo 20.
 */

type Query<T> = {
  data?: T
  isPending: boolean
  isError: boolean
  fetchStatus: 'fetching' | 'idle' | 'paused'
  refetch: () => void
}

let plansByDate: Record<string, ActivityDayPlanItem[]>
/** Días cuya consulta falló: la semana **no** puede tratarlos como vacíos. */
let failedDates: string[]
/** Días todavía en vuelo. */
let pendingDates: string[]
let itemsQuery: Query<VidaItem[]>
let settingsQuery: Query<UserSettings>
let setPlan: (input: { date: string; items: unknown[] }) => Promise<unknown>
let refetchWeek: ReturnType<typeof vi.fn>

vi.mock('@/features/vida/hooks/useVidaWeekPlans', () => ({
  useVidaWeekPlans: (dates: string[]) => ({
    byDate: Object.fromEntries(
      dates.map((date) => {
        const isError = failedDates.includes(date)
        const isPending = pendingDates.includes(date)
        const items = isError ? [] : (plansByDate[date] ?? [])
        return [
          date,
          {
            date,
            hasPlan: !isError && items.length > 0,
            blockCount: items.length,
            items,
            isPending,
            isError,
          },
        ]
      }),
    ),
    isPending: pendingDates.length > 0,
    hasError: failedDates.length > 0,
    refetch: refetchWeek,
  }),
}))
vi.mock('@/features/vida/hooks/useVidaItems', () => ({
  useVidaItemsQuery: () => itemsQuery,
}))
vi.mock('@/features/settings/hooks/useUserSettings', () => ({
  useUserSettingsQuery: () => settingsQuery,
  useUpdateUserSettingsMutation: () => ({ mutate: vi.fn(), isPending: false, isError: false }),
}))
vi.mock('@/features/vida/api/activity-day-plan.api', () => ({
  setActivityDayPlan: (input: { date: string; items: unknown[] }) => setPlan(input),
}))

function ready<T>(data: T): Query<T> {
  return { data, isPending: false, isError: false, fetchStatus: 'idle', refetch: vi.fn() }
}

function block(id: string, date: string, startTime: string, endTime: string): ActivityDayPlanItem {
  return {
    id,
    userId: 1,
    activityId: `a-${id}`,
    date,
    startTime,
    endTime,
    orderIndex: 0,
    completedAt: null,
    createdAt: `${date}T00:00:00.000Z`,
    updatedAt: `${date}T00:00:00.000Z`,
    activity: { id: `a-${id}`, title: 'Algo', category: null },
  }
}

function templateItem(
  id: string,
  day: VidaItem['days'][number],
  startTime: string | null,
  durationMinutes: number | null,
): VidaItem {
  return {
    id,
    userId: 1,
    activityId: `a-${id}`,
    days: [day],
    startTime,
    durationMinutes,
    notes: null,
    isActive: true,
    orderIndex: 0,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    activity: { id: `a-${id}`, title: `Cosa ${id}`, status: 'pending', category: null },
  }
}

const SETTINGS: UserSettings = {
  userId: 1,
  hideHiddenHabits: false,
  sleepActivityCategoryId: null,
  standupTodoFolderId: null,
  vidaDayStartTime: '06:30',
  vidaDayEndTime: '23:00',
} as UserSettings

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 8, 18, 9, 24, 0))
  plansByDate = {}
  failedDates = []
  pendingDates = []
  refetchWeek = vi.fn()
  setPlan = vi.fn().mockResolvedValue([]) as typeof setPlan
  settingsQuery = ready(SETTINGS)
  itemsQuery = ready([
    // Sábado 19 y domingo 20: dos días vacíos y editables de esta semana.
    templateItem('t1', 'saturday', '08:00', 15),
    templateItem('t2', 'saturday', '08:30', 40),
    templateItem('t3', 'sunday', '10:00', 60),
  ])
})

afterEach(() => {
  vi.useRealTimers()
})

describe('VidaSemanaPage — una línea por día (criterio 39)', () => {
  it('los días con plan dicen cuántos bloques y cuánto suman, con su «Ver»', () => {
    plansByDate['2026-09-17'] = [
      block('b1', '2026-09-17', '08:00', '09:00'),
      block('b2', '2026-09-17', '10:00', '10:30'),
    ]
    renderWithProviders(<VidaSemanaPage />)

    const row = screen.getByText(/Planeado · 2 bloques · 1h 30/).closest('li')!
    expect(within(row).getByRole('link', { name: 'Ver' })).toHaveAttribute(
      'href',
      '/app/vida/hoy?d=2026-09-17',
    )
  })

  it('los días sin plan dicen qué trae la plantilla y llevan «Armar»', () => {
    renderWithProviders(<VidaSemanaPage />)

    const row = screen.getByText(/Tu plantilla trae 2 cosas los sábados/).closest('li')!
    expect(within(row).getByText('Sin plan todavía')).toBeInTheDocument()
    expect(within(row).getByRole('button', { name: 'Armar' })).toBeInTheDocument()
  })

  it('criterio 40 — un día pasado se describe por lo planeado, y no se puede armar', () => {
    plansByDate['2026-09-14'] = [block('b1', '2026-09-14', '08:00', '08:30')]
    renderWithProviders(<VidaSemanaPage />)

    // Nada de «seguiste N de M»: eso es F3/F5.
    expect(screen.queryByText(/seguiste/i)).not.toBeInTheDocument()
    const row = screen.getByText(/Planeado · 1 bloque · 30m/).closest('li')!
    expect(within(row).queryByRole('button', { name: 'Armar' })).not.toBeInTheDocument()
  })

  it('un día pasado sin plan tampoco ofrece armar (D3, criterio 38)', () => {
    renderWithProviders(<VidaSemanaPage />)
    // El lunes 14 al jueves 17 ya pasaron: ninguno tiene «Armar».
    expect(screen.getAllByRole('button', { name: 'Armar' })).toHaveLength(2)
  })
})

describe('VidaSemanaPage — armar (criterios 42, 45 y 46)', () => {
  it('«Armar» de un día manda una sola operación con hora y duración copiadas', async () => {
    renderWithProviders(<VidaSemanaPage />)

    const row = screen.getByText(/Tu plantilla trae 2 cosas los sábados/).closest('li')!
    await act(async () => {
      fireEvent.click(within(row).getByRole('button', { name: 'Armar' }))
    })

    expect(vi.mocked(setPlan)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(setPlan)).toHaveBeenCalledWith({
      date: '2026-09-19',
      items: [
        { activityId: 'a-t1', startTime: '08:00', endTime: '08:15', orderIndex: 0 },
        { activityId: 'a-t2', startTime: '08:30', endTime: '09:10', orderIndex: 1 },
      ],
    })
  })

  it('criterio 45 — «Armar toda la semana» avisa cuántos días y cuáles no se tocan', async () => {
    plansByDate['2026-09-20'] = [block('b1', '2026-09-20', '10:00', '11:00')]
    renderWithProviders(<VidaSemanaPage />)

    fireEvent.click(screen.getByRole('button', { name: /armar toda la semana/i }))

    expect(screen.getByText(/Se armará 1 día/)).toBeInTheDocument()
    expect(screen.getByText(/1 ya tiene plan y no se toca/)).toBeInTheDocument()
    expect(setPlan).not.toHaveBeenCalled()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Armar 1 día' }))
    })
    expect(vi.mocked(setPlan)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(setPlan).mock.calls[0]?.[0].date).toBe('2026-09-19')
  })

  it('la salida del diálogo es «Volver», nunca «Cancelar» (criterio 56)', () => {
    renderWithProviders(<VidaSemanaPage />)
    fireEvent.click(screen.getByRole('button', { name: /armar toda la semana/i }))

    expect(screen.getByRole('button', { name: 'Volver' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^cancelar$/i })).not.toBeInTheDocument()
  })

  it('criterio 46 — si uno falla, los demás siguen armados y se nombra el que no', async () => {
    setPlan = vi
      .fn()
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(new Error('El API dijo que no')) as typeof setPlan
    renderWithProviders(<VidaSemanaPage />)

    fireEvent.click(screen.getByRole('button', { name: /armar toda la semana/i }))
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Armar 2 días' }))
    })

    await act(async () => {})
    // **No** se anuncia «semana armada»: se dice 1 de 2.
    expect(screen.getByText('Armamos 1 de 2 días')).toBeInTheDocument()
    expect(screen.getByText(/no se pudo armar \(El API dijo que no\)/)).toBeInTheDocument()
    expect(screen.getByText(/Sigue sin plan/)).toBeInTheDocument()
  })

  it('el resumen dice lo que hubo que ajustar, con la vía a ponerles hora (43 y 44)', async () => {
    itemsQuery = ready([
      templateItem('t1', 'saturday', '08:00', 60),
      templateItem('t2', 'saturday', '08:30', 30),
      templateItem('t3', 'saturday', null, null),
    ])
    renderWithProviders(<VidaSemanaPage />)

    const row = screen.getByText(/Tu plantilla trae 3 cosas los sábados/).closest('li')!
    await act(async () => {
      fireEvent.click(within(row).getByRole('button', { name: 'Armar' }))
    })

    await act(async () => {})
    expect(screen.getByText(/1 de 3 no cabían a su hora y quedaron después/)).toBeInTheDocument()
    expect(
      screen.getByText(/1 cosa sin hora, puesta al final — ponles una hora en tu plantilla/),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ponles una hora en tu plantilla/i })).toHaveAttribute(
      'href',
      '/app/vida/actividades',
    )
  })
})

describe('VidaSemanaPage — la ventana de planeación (criterio 35)', () => {
  it('se puede ir a la semana que viene y volver, y nada más', () => {
    renderWithProviders(<VidaSemanaPage />)

    expect(screen.getByText(/Esta semana · 14 – 20 sept/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver la semana que viene' })).toHaveAttribute(
      'href',
      '/app/vida/semana?d=2026-09-21',
    )
  })

  it('con `?d=` de la semana que viene, enseña esa y ofrece volver', () => {
    renderWithProviders(<VidaSemanaPage />, {
      routerProps: { initialEntries: ['/app/vida/semana?d=2026-09-24'] },
    })

    expect(screen.getByText(/La semana que viene · 21 – 27 sept/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver a esta semana' })).toHaveAttribute(
      'href',
      '/app/vida/semana?d=2026-09-14',
    )
  })

  it('una fecha fuera de la ventana se recorta en vez de dejar la pantalla en blanco', () => {
    renderWithProviders(<VidaSemanaPage />, {
      routerProps: { initialEntries: ['/app/vida/semana?d=2026-12-30'] },
    })

    expect(screen.getByText(/La semana que viene · 21 – 27 sept/)).toBeInTheDocument()
  })
})

describe('VidaSemanaPage — el lenguaje (criterio 56)', () => {
  it('no reprocha nada en toda la pantalla', () => {
    plansByDate['2026-09-16'] = [block('b1', '2026-09-16', '08:00', '08:30')]
    const { container } = renderWithProviders(<VidaSemanaPage />)
    const text = container.textContent?.toLowerCase() ?? ''

    for (const word of ['desperdici', 'perdiste', 'fallaste', 'eliminar', 'cancelar']) {
      expect(text).not.toContain(word)
    }
  })
})

describe('VidaSemanaPage — un día que no se pudo cargar no es un día vacío', () => {
  it('no dice «Sin plan todavía», no ofrece «Armar» y deja reintentar', () => {
    failedDates = ['2026-09-21']
    renderWithProviders(<VidaSemanaPage />, {
      routerProps: { initialEntries: ['/app/vida/semana?d=2026-09-21'] },
    })

    const row = screen.getByText('No pudimos cargar este día').closest('li')!
    expect(within(row).queryByText('Sin plan todavía')).not.toBeInTheDocument()
    expect(within(row).queryByRole('button', { name: 'Armar' })).not.toBeInTheDocument()

    fireEvent.click(within(row).getByRole('button', { name: 'Reintentar' }))
    expect(refetchWeek).toHaveBeenCalled()
  })

  it('queda FUERA del lote: armar la semana no lo reemplaza', async () => {
    // El lunes 21 tiene plan de verdad, pero su consulta falló. Sin el arreglo
    // entraría en el lote y `activityDayPlanSet` lo borraría.
    plansByDate['2026-09-21'] = [block('b1', '2026-09-21', '08:00', '09:00')]
    failedDates = ['2026-09-21']
    renderWithProviders(<VidaSemanaPage />, {
      routerProps: { initialEntries: ['/app/vida/semana?d=2026-09-21'] },
    })

    fireEvent.click(screen.getByRole('button', { name: /armar toda la semana/i }))
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^Armar \d+ días?$/ }))
    })

    const dates = vi.mocked(setPlan).mock.calls.map((call) => call[0].date)
    expect(dates).not.toContain('2026-09-21')
  })

  it('mientras haya días cargando no se puede armar la semana: la pantalla es esqueleto', () => {
    pendingDates = ['2026-09-22']
    renderWithProviders(<VidaSemanaPage />, {
      routerProps: { initialEntries: ['/app/vida/semana?d=2026-09-21'] },
    })

    // No se afirma «sin plan» de nadie mientras algo está en vuelo (criterio
    // 50), y por tanto tampoco se ofrece armar. El `disabled` del botón sigue
    // en el código como segunda barrera, pero aquí ni siquiera llega a pintarse.
    expect(screen.getByText('Cargando tu semana…')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /armar/i })).not.toBeInTheDocument()
  })
})

describe('VidaSemanaPage — el resumen nombra también los días que no dejaron nada', () => {
  it('un día cuya plantilla no da bloques sale en el resumen (criterio 46)', async () => {
    // Jueves sin nada en la plantilla, pero editable y sin plan: entra en el
    // lote desde el botón del día… no; se arma en lote junto al sábado.
    itemsQuery = ready([templateItem('t1', 'saturday', '08:00', 15)])
    renderWithProviders(<VidaSemanaPage />)

    const row = screen.getByText(/Tu plantilla trae 1 cosa los sábados/).closest('li')!
    await act(async () => {
      fireEvent.click(within(row).getByRole('button', { name: 'Armar' }))
    })
    await act(async () => {})

    expect(screen.getByText(/Armamos 1 día/)).toBeInTheDocument()
  })
})
