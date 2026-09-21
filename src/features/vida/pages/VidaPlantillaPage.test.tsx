import { fireEvent, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { UserSettings } from '@/features/settings/types/user-settings.types'
import { VidaPlantillaPage } from '@/features/vida/pages/VidaPlantillaPage'
import type { ActivitiesResponse } from '@/features/vida/types/activity.types'
import type { VidaDayOfWeek, VidaItem } from '@/features/vida/types/vida-item.types'
import { renderWithProviders } from '@/test/render'

/**
 * La plantilla se ve (FEAT-005, tajada 1): criterios 1, 2, 3, 6, 7, 8, 9, 10,
 * 11, 12 y 13.
 *
 * Se mockean **las consultas**, no los componentes: lo que hay que comprobar es
 * lo que acaba en pantalla. El reloj se fija en **viernes 18 de septiembre de
 * 2026** para que «al entrar se abre el día de hoy» (criterio 2) sea una
 * afirmación y no una casualidad.
 *
 * Lo que **no** se prueba aquí y queda dicho: nada de esto pasa por el API de
 * verdad —todo `/app/*` está detrás del login y los agentes no entran—.
 */

type Query<T> = {
  data?: T
  isPending: boolean
  isError: boolean
  fetchStatus: 'fetching' | 'idle' | 'paused'
  refetch: () => void
}

let itemsQuery: Query<VidaItem[]>
let settingsQuery: Query<UserSettings>
let activitiesQuery: Query<ActivitiesResponse>
let lastIncludeInactive: boolean | undefined

vi.mock('@/features/vida/hooks/useVidaItems', () => ({
  useVidaItemsQuery: (includeInactive?: boolean) => {
    lastIncludeInactive = includeInactive
    return itemsQuery
  },
}))
vi.mock('@/features/settings/hooks/useUserSettings', () => ({
  useUserSettingsQuery: () => settingsQuery,
  useUpdateUserSettingsMutation: () => ({ mutate: vi.fn(), isPending: false, isError: false }),
}))
vi.mock('@/features/vida/hooks/useActivities', () => ({
  useActivitiesQuery: () => activitiesQuery,
}))

function ready<T>(data: T): Query<T> {
  return { data, isPending: false, isError: false, fetchStatus: 'idle', refetch: vi.fn() }
}

function item(
  id: string,
  {
    days = ['friday'] as VidaDayOfWeek[],
    startTime = null as string | null,
    durationMinutes = null as number | null,
    title = 'Algo',
    isActive = true,
  } = {},
): VidaItem {
  return {
    id,
    userId: 1,
    activityId: `a-${id}`,
    days,
    startTime,
    durationMinutes,
    notes: null,
    isActive,
    orderIndex: 0,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    activity: {
      id: `a-${id}`,
      title,
      status: 'pending',
      category: { id: 'c-1', name: 'Casa', color: '#10B981', icon: 'house' },
    },
  }
}

const SETTINGS = {
  id: 1,
  userId: 1,
  vidaDayStartTime: '06:30',
  vidaDayEndTime: '23:00',
} as unknown as UserSettings

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 8, 18, 9, 24, 0))
  lastIncludeInactive = undefined
  itemsQuery = ready<VidaItem[]>([])
  settingsQuery = ready(SETTINGS)
  activitiesQuery = ready<ActivitiesResponse>({ activities: [], page: 1, limit: 200, total: 0 })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('la cabecera y las pestañas (criterios 1, 2 y 3)', () => {
  beforeEach(() => {
    itemsQuery = ready([
      item('1', { startTime: '07:00', durationMinutes: 15, title: 'Bañarme' }),
      item('2', {
        days: ['monday', 'wednesday'],
        startTime: '09:00',
        durationMinutes: 45,
        title: 'Organizar la casa',
      }),
    ])
  })

  it('deja de ser un cascarón: título y línea de la pantalla', () => {
    renderWithProviders(<VidaPlantillaPage />)
    expect(screen.getByRole('heading', { name: 'Tu plantilla', level: 1 })).toBeInTheDocument()
    expect(
      screen.getByText('Cómo quieres que sea tu semana. Hoy la sigue — o no.'),
    ).toBeInTheDocument()
  })

  it('pide la plantilla **con los desactivados**: se pintan (criterio 8)', () => {
    renderWithProviders(<VidaPlantillaPage />)
    expect(lastIncludeInactive).toBe(true)
  })

  it('siete pestañas, con su cuenta, y **al entrar se abre el día de hoy**', () => {
    renderWithProviders(<VidaPlantillaPage />)
    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(7)
    expect(tabs[4]).toHaveAccessibleName(/viernes, hoy · 1 cosa/)
    expect(tabs[4]).toHaveAttribute('aria-selected', 'true')
    expect(tabs[0]).toHaveAccessibleName(/lunes · 1 cosa/)
    expect(tabs[3]).toHaveAccessibleName(/jueves · nada puesto todavía/)
  })

  it('se cambia de día **con el teclado**, que es lo que pide el criterio 2', () => {
    renderWithProviders(<VidaPlantillaPage />)
    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowRight' })
    expect(screen.getByRole('tab', { selected: true })).toHaveAccessibleName(/sábado/)
    expect(screen.getByRole('heading', { name: 'sábado', level: 2 })).toBeInTheDocument()
  })

  it('la pestaña activa se distingue por **algo más que el color**', () => {
    renderWithProviders(<VidaPlantillaPage />)
    // `aria-selected` + el subrayado de `@/shared/ui/Tabs`: la distinción no
    // depende de un tono, y por eso también se oye.
    expect(screen.getAllByRole('tab', { selected: true })).toHaveLength(1)
  })
})

describe('la agenda del día (criterios 6, 7, 8, 9 y 13)', () => {
  beforeEach(() => {
    itemsQuery = ready([
      item('paseo', { startTime: '19:00', durationMinutes: 30, title: 'Pasear a las mascotas' }),
      item('banar', {
        startTime: '07:00',
        durationMinutes: 15,
        title: 'Bañarme',
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      }),
      item('correr', {
        startTime: '06:45',
        durationMinutes: 40,
        title: 'Salir a correr',
        isActive: false,
      }),
      item('sin-duracion', { startTime: '13:00', title: 'Cocinar y almorzar' }),
      item('lavadora', { title: 'Poner una lavadora', durationMinutes: 20 }),
    ])
  })

  it('una tarjeta por ítem, **ordenada por hora ascendente**', () => {
    renderWithProviders(<VidaPlantillaPage />)
    const agenda = screen.getByRole('list', { name: /viernes, ordenado por hora/i })
    const names = within(agenda)
      .getAllByRole('listitem')
      .map((row) => row.textContent ?? '')
    expect(names[0]).toContain('Salir a correr')
    expect(names[1]).toContain('Bañarme')
    expect(names[2]).toContain('Cocinar y almorzar')
    expect(names[3]).toContain('Pasear a las mascotas')
    expect(names).toHaveLength(4)
  })

  it('la meta dice «15 min · L M X J V» con los días del propio ítem', () => {
    renderWithProviders(<VidaPlantillaPage />)
    expect(screen.getByText(/15 min ·/)).toBeInTheDocument()
    expect(screen.getByText('L M X J V')).toBeInTheDocument()
  })

  it('sin duración se lee «sin duración», nunca «0 min» (criterio 7)', () => {
    renderWithProviders(<VidaPlantillaPage />)
    expect(screen.getByText(/sin duración/)).toBeInTheDocument()
    // «0 min» a secas: `/0 min/` a pelo casaría con «30 min» y no probaría nada.
    expect(screen.queryByText(/(?<!\d)0 min/)).not.toBeInTheDocument()
  })

  it('un desactivado **no desaparece**: se queda en su hora, con su etiqueta', () => {
    renderWithProviders(<VidaPlantillaPage />)
    expect(screen.getByText('Salir a correr')).toBeInTheDocument()
    expect(screen.getByText('desactivada')).toBeInTheDocument()
    expect(screen.getByText(/no sale en Hoy/)).toBeInTheDocument()
  })

  it('**no se pinta ni un botón muerto**: en la tajada 1 la pantalla solo lee', () => {
    renderWithProviders(<VidaPlantillaPage />)
    // **Cero botones**: las siete pestañas son `role="tab"`, y no hay nada más
    // que pulsar — ni «Activar», ni «···», ni «+», ni «Ponerle hora».
    expect(screen.queryAllByRole('button')).toHaveLength(0)
    expect(screen.getAllByRole('tab')).toHaveLength(7)
    expect(screen.queryByRole('button', { name: /activar/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /ponerle hora/i })).not.toBeInTheDocument()
  })

  it('el cajón «Sin hora» va al final, con su cuenta y su explicación literal', () => {
    renderWithProviders(<VidaPlantillaPage />)
    const drawer = screen.getByRole('region', { name: /sin hora/i })
    expect(within(drawer).getByText('Poner una lavadora')).toBeInTheDocument()
    expect(within(drawer).getByText('1')).toBeInTheDocument()
    // El texto va partido por el `<b>`: se lee el párrafo entero, que es lo que
    // acaba en pantalla.
    expect(drawer.textContent).toContain(
      'Hoy las pone al final del día, una detrás de otra. Con hora quedan en su sitio.',
    )
  })

  it('un día sin nada sin hora **no pinta el cajón vacío**', () => {
    itemsQuery = ready([item('1', { days: ['monday'], startTime: '08:00', durationMinutes: 30 })])
    renderWithProviders(<VidaPlantillaPage />)
    fireEvent.click(screen.getAllByRole('tab')[0]!)
    expect(screen.queryByRole('region', { name: /sin hora/i })).not.toBeInTheDocument()
  })

  it('un nombre de 60 caracteres se pinta entero en el DOM y no rompe la tarjeta', () => {
    const largo = 'Pasear a las mascotas por el parque grande de la ciudad hoy!'
    expect(largo).toHaveLength(60)
    itemsQuery = ready([item('1', { startTime: '08:00', durationMinutes: 30, title: largo })])
    renderWithProviders(<VidaPlantillaPage />)
    expect(screen.getByText(largo)).toBeInTheDocument()
  })
})

describe('el resumen del día (criterios 4 y 5)', () => {
  beforeEach(() => {
    itemsQuery = ready([
      item('1', { startTime: '07:00', durationMinutes: 15 }),
      item('2', { startTime: '07:30', durationMinutes: 40 }),
      item('3', { startTime: '09:00', durationMinutes: 45 }),
      item('4', { startTime: '10:00', durationMinutes: 60 }),
      item('5', { startTime: '13:00', durationMinutes: 60 }),
      item('6', { startTime: '19:00', durationMinutes: 30 }),
      item('7', {}),
    ])
  })

  it('«4h 10 puestas de 16h 30», con los minutos como texto real', () => {
    renderWithProviders(<VidaPlantillaPage />)
    expect(screen.getByText('4h 10')).toBeInTheDocument()
    expect(screen.getByText(/puestas de 16h 30/)).toBeInTheDocument()
    // La leyenda y el titular dicen **el mismo número**: salen de la misma cuenta.
    expect(screen.getByText(/puesto 4h 10/)).toBeInTheDocument()
    expect(screen.getByText(/libre 12h 20/)).toBeInTheDocument()
  })

  it('la frase se compone con reglas y nombra el hueco de verdad', () => {
    renderWithProviders(<VidaPlantillaPage />)
    expect(
      screen.getByText(
        'Seis cosas con hora y una sin ella. Tu viernes está lleno por la mañana y libre de 14:00 a 19:00.',
      ),
    ).toBeInTheDocument()
  })
})

describe('los estados (criterios 10, 11 y 12)', () => {
  it('cargando: esqueletos, **sin fingir una plantilla vacía**', () => {
    itemsQuery = { isPending: true, isError: false, fetchStatus: 'fetching', refetch: vi.fn() }
    const { container } = renderWithProviders(<VidaPlantillaPage />)
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
    expect(screen.getByText('Cargando tu plantilla…')).toBeInTheDocument()
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
    expect(screen.queryByText(/Empieza por tu mañana/)).not.toBeInTheDocument()
  })

  it('sin sesión: se distingue de «cargando» y ofrece entrar', () => {
    itemsQuery = { isPending: true, isError: false, fetchStatus: 'idle', refetch: vi.fn() }
    settingsQuery = { isPending: true, isError: false, fetchStatus: 'idle', refetch: vi.fn() }
    renderWithProviders(<VidaPlantillaPage />)
    expect(screen.getByText('Entra para ver tu plantilla')).toBeInTheDocument()
    expect(screen.queryByText('Cargando tu plantilla…')).not.toBeInTheDocument()
  })

  it('si falla: «No pudimos cargar tu plantilla», «Reintentar» y **nada de afirmar que no hay nada**', () => {
    const refetch = vi.fn()
    itemsQuery = { isPending: false, isError: true, fetchStatus: 'idle', refetch }
    renderWithProviders(<VidaPlantillaPage />)
    expect(screen.getByText(/No pudimos cargar tu plantilla/)).toBeInTheDocument()
    expect(screen.queryByText(/Empieza por tu mañana/)).not.toBeInTheDocument()
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('plantilla vacía del todo: el texto del primer minuto y la cuenta real del catálogo', () => {
    activitiesQuery = ready<ActivitiesResponse>({
      activities: [
        { id: 'a-1', title: 'Bañarme', status: 'pending' },
        { id: 'a-2', title: 'Leer', status: 'pending' },
        { id: 'a-3', title: 'Vieja', status: 'cancelled' },
      ] as unknown as ActivitiesResponse['activities'],
      page: 1,
      limit: 200,
      total: 3,
    })
    renderWithProviders(<VidaPlantillaPage />)
    expect(screen.getByText(/Tu plantilla es tu semana contada por horas/)).toBeInTheDocument()
    expect(screen.getByText(/Empieza por tu mañana/)).toBeInTheDocument()
    // Las archivadas no cuentan: 2 de 3.
    expect(screen.getByText('2 actividades en tu catálogo')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Traer de tus actividades' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Un día sin plantilla se vive igual: se registra sobre la marcha.'),
    ).toBeInTheDocument()
  })

  it('un día concreto vacío con otros llenos: se dice sin reproche y con salida', () => {
    itemsQuery = ready([item('1', { days: ['monday'], startTime: '08:00', durationMinutes: 30 })])
    renderWithProviders(<VidaPlantillaPage />)
    // La frase sin reproche la dice el resumen (criterios 5 y 11); la tarjeta
    // de debajo solo pone la salida, sin repetirla.
    expect(screen.getByText('El viernes no tienes nada puesto.')).toBeInTheDocument()
    expect(screen.getByText('Ponle algo cuando quieras')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Traer de tus actividades' })).toBeInTheDocument()
    // Y sigue habiendo pestañas: el lunes está lleno y se alcanza de un toque.
    expect(screen.getAllByRole('tab')).toHaveLength(7)
  })

  it('una actividad archivada no se pinta ni cuenta en su pestaña (A8)', () => {
    const archivada = item('vieja', { startTime: '08:00', durationMinutes: 30, title: 'Vieja' })
    archivada.activity = { id: 'a-vieja', title: 'Vieja', status: 'cancelled', category: null }
    itemsQuery = ready([
      archivada,
      item('viva', { startTime: '09:00', durationMinutes: 30, title: 'Viva' }),
    ])
    renderWithProviders(<VidaPlantillaPage />)
    expect(screen.queryByText('Vieja')).not.toBeInTheDocument()
    expect(screen.getAllByRole('tab')[4]).toHaveAccessibleName(/viernes, hoy · 1 cosa/)
  })
})
