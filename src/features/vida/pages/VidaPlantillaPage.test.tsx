import { fireEvent, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { UserSettings } from '@/features/settings/types/user-settings.types'
import { VidaPlantillaPage } from '@/features/vida/pages/VidaPlantillaPage'
import type {
  ActivitiesResponse,
  Activity,
  ActivityStatus,
} from '@/features/vida/types/activity.types'
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
let updateItem: { mutate: ReturnType<typeof vi.fn>; isPending: boolean; isError: boolean }
let deleteItem: { mutate: ReturnType<typeof vi.fn>; isPending: boolean; isError: boolean }
let createItem: { mutate: ReturnType<typeof vi.fn>; isPending: boolean; isError: boolean }

vi.mock('@/features/vida/hooks/useVidaItems', () => ({
  useVidaItemsQuery: (includeInactive?: boolean) => {
    lastIncludeInactive = includeInactive
    return itemsQuery
  },
  // Las que estrena la tajada 2: «Activar», restarle un día y quitarlo; la de
  // crear la monta la hoja por dentro (`useSaveVidaItemForActivity`).
  useUpdateVidaItemMutation: () => updateItem,
  useDeleteVidaItemMutation: () => deleteItem,
  useCreateVidaItemMutation: () => createItem,
}))
// La hoja pide las categorías al montarse; sin `AuthBootstrapProvider` el
// guard de Vida **lanza**, así que se mockean aquí igual que en el test de la
// propia hoja. Es el aviso que dejó escrito la tajada 1.
vi.mock('@/features/vida/hooks/useActivityCategories', () => ({
  useActivityCategoriesQuery: () => ({
    data: [],
    isPending: false,
    isError: false,
    fetchStatus: 'idle',
    refetch: vi.fn(),
  }),
  useCreateActivityCategoryMutation: () => ({ mutate: vi.fn(), isPending: false, isError: false }),
}))
vi.mock('@/features/settings/hooks/useUserSettings', () => ({
  useUserSettingsQuery: () => settingsQuery,
  useUpdateUserSettingsMutation: () => ({ mutate: vi.fn(), isPending: false, isError: false }),
}))
vi.mock('@/features/vida/hooks/useActivities', () => ({
  useActivitiesQuery: () => activitiesQuery,
  useCreateActivityMutation: () => ({ mutate: vi.fn(), isPending: false, isError: false }),
  useUpdateActivityMutation: () => ({ mutate: vi.fn(), isPending: false, isError: false }),
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
  updateItem = { mutate: vi.fn(), isPending: false, isError: false }
  deleteItem = { mutate: vi.fn(), isPending: false, isError: false }
  createItem = { mutate: vi.fn(), isPending: false, isError: false }
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

  it('**sigue sin haber botones muertos**: lo de las tajadas 3 y 4 no se pinta', () => {
    renderWithProviders(<VidaPlantillaPage />)
    // La afirmación de la tajada 1 era «cero botones» y **queda derogada por
    // los criterios 16, 25 y 26**: abrir la hoja, «Ponerle hora» y «Activar»
    // son de esta tajada. Lo que sigue valiendo es que **no se pinta nada que
    // no funcione todavía**: ni «+» (criterio 29, tajada 3), ni «Ver la semana
    // entera» ni «Copiar este día a otros» (tajada 4).
    expect(screen.getAllByRole('tab')).toHaveLength(7)
    // **Derogado en la tajada 3**: el «+» y el panel de añadir son el criterio
    // 29 y ya funcionan. Lo que sigue valiendo es la tajada 4.
    expect(screen.queryByRole('button', { name: /ver la semana entera/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /copiar este día/i })).not.toBeInTheDocument()
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
    // **Derogado en la tajada 3**: la salida ya no manda al catálogo, abre el
    // panel de añadir sin salir de la pantalla (criterio 29).
    expect(
      screen.getAllByRole('button', { name: 'Añadir a mi Vida' }).length,
    ).toBeGreaterThan(0)
    expect(
      screen.queryByRole('link', { name: 'Traer de tus actividades' }),
    ).not.toBeInTheDocument()
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

/**
 * La plantilla se edita desde aquí (FEAT-005, tajada 2): criterios 16, 17, 21,
 * 22, 24, 25, 26 y 27.
 *
 * Todo lo que se comprueba aquí es **el cableado**: qué hoja se abre, con qué
 * ítem, qué mutación sale y con qué. Lo que pasa dentro de la hoja tiene su
 * propio test (`VidaActivitySheet.test.tsx`) y lo puro, el suyo
 * (`vida-template.utils.test.ts`). **Nada de esto pasa por el API de verdad.**
 */
describe('la hoja del ítem y lo que escribe (criterios 16-27)', () => {
  beforeEach(() => {
    itemsQuery = ready([
      // La misma actividad **dos veces**, que es el caso del criterio 17.
      { ...item('m', { startTime: '07:30', durationMinutes: 40, title: 'Pasear a las mascotas' }),
        activityId: 'a-pasear' },
      { ...item('t', { startTime: '19:00', durationMinutes: 40, title: 'Pasear a las mascotas' }),
        activityId: 'a-pasear' },
      item('casa', {
        days: ['monday', 'wednesday', 'friday'],
        startTime: '09:00',
        durationMinutes: 45,
        title: 'Organizar la casa',
      }),
      item('off', { startTime: '06:45', durationMinutes: 30, title: 'Salir a correr', isActive: false }),
      item('lavadora', { title: 'Poner una lavadora' }),
    ])
  })

  it('tocar una tarjeta abre la hoja **de ese ítem, por su id** (criterios 16 y 17)', () => {
    renderWithProviders(<VidaPlantillaPage />)

    fireEvent.click(screen.getAllByRole('button', { name: 'Abrir Pasear a las mascotas' })[0]!)

    const sheet = screen.getByRole('dialog')
    // Es **la hoja del catálogo**: los mismos campos, y la cabecera enseña el
    // nombre sin pedirlo.
    expect(within(sheet).getByText('Pasear a las mascotas')).toBeInTheDocument()
    expect(within(sheet).queryByLabelText(/Cómo la llamas/)).not.toBeInTheDocument()
    // El de las **7:30**, que es el que se tocó: no «el ítem de esa actividad».
    expect(within(sheet).getByLabelText(/A qué hora/)).toHaveValue('07:30')
  })

  it('abrir el de las 19:00 y guardar actualiza ESE id, no el de las 7:30 (criterio 17)', () => {
    renderWithProviders(<VidaPlantillaPage />)

    const cards = screen.getAllByRole('button', { name: 'Abrir Pasear a las mascotas' })
    fireEvent.click(cards[1]!)

    const sheet = screen.getByRole('dialog')
    expect(within(sheet).getByLabelText(/A qué hora/)).toHaveValue('19:00')
    fireEvent.change(within(sheet).getByLabelText(/A qué hora/), { target: { value: '19:30' } })
    fireEvent.click(within(sheet).getByRole('button', { name: 'Guardar' }))

    // **Sin mutación de actividad de por medio** (decisión A4): con la
    // actividad bloqueada se guarda directo la plantilla.
    expect(createItem.mutate).not.toHaveBeenCalled()
    expect(updateItem.mutate).toHaveBeenCalledTimes(1)
    expect(updateItem.mutate.mock.calls[0]![0]).toMatchObject({ id: 't', startTime: '19:30' })
  })

  it('«Ponerle hora» en el cajón abre **la misma hoja** (criterio 25)', () => {
    renderWithProviders(<VidaPlantillaPage />)

    const drawer = screen.getByRole('region', { name: /sin hora/i })
    fireEvent.click(within(drawer).getByRole('button', { name: 'Ponerle hora' }))

    const sheet = screen.getByRole('dialog')
    expect(within(sheet).getByText('Poner una lavadora')).toBeInTheDocument()
    // Lista para escribirse: vacía, no con una hora inventada.
    expect(within(sheet).getByLabelText(/A qué hora/)).toHaveValue('')
  })

  it('«Activar» reactiva de un toque, **sin abrir la hoja** (criterio 26)', () => {
    renderWithProviders(<VidaPlantillaPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Activar' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    // Solo `isActive`: sus días, su hora y su nota se quedan como están,
    // porque omitir un campo en `vidaItemUpdate` lo deja igual.
    expect(updateItem.mutate.mock.calls[0]![0]).toEqual({ id: 'off', isActive: true })
  })

  it('«Quitar de la plantilla» avisa de los otros días y **«Volver» no llama a nadie** (criterios 21 y 22)', () => {
    renderWithProviders(<VidaPlantillaPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Abrir Organizar la casa' }))
    fireEvent.click(screen.getByRole('button', { name: 'Quitar de la plantilla' }))

    // Dos diálogos en el árbol: la hoja, que se queda montada para su
    // animación de salida, y la confirmación. Se elige por su nombre.
    const dialog = screen.getByRole('dialog', { name: /¿Quitar «Organizar la casa»/ })
    expect(dialog.textContent).toContain('también está los lunes y los miércoles')
    expect(dialog.textContent).toContain('La actividad se queda en tu catálogo')
    // Las dos salidas afirmativas del criterio 22, más «Volver».
    expect(within(dialog).getByRole('button', { name: 'Quitarlo solo del viernes' })).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Quitarlo de los 3 días' })).toBeInTheDocument()

    fireEvent.click(within(dialog).getByRole('button', { name: 'Volver' }))
    expect(deleteItem.mutate).not.toHaveBeenCalled()
    expect(updateItem.mutate).not.toHaveBeenCalled()
  })

  it('«Quitarlo solo del viernes» le resta el día; «de los 3 días» borra el ítem (criterios 21 y 22)', () => {
    renderWithProviders(<VidaPlantillaPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Abrir Organizar la casa' }))
    fireEvent.click(screen.getByRole('button', { name: 'Quitar de la plantilla' }))
    fireEvent.click(screen.getByRole('button', { name: 'Quitarlo solo del viernes' }))

    expect(deleteItem.mutate).not.toHaveBeenCalled()
    expect(updateItem.mutate.mock.calls[0]![0]).toEqual({
      id: 'casa',
      days: ['monday', 'wednesday'],
    })

    // Y la otra salida, la que sí borra: `vidaItemDelete` por su id.
    fireEvent.click(screen.getByRole('button', { name: 'Abrir Organizar la casa' }))
    fireEvent.click(screen.getByRole('button', { name: 'Quitar de la plantilla' }))
    fireEvent.click(screen.getByRole('button', { name: 'Quitarlo de los 3 días' }))
    expect(deleteItem.mutate.mock.calls[0]![0]).toEqual({ id: 'casa' })
  })

  it('con un solo día la confirmación tiene **una sola salida** afirmativa (criterio 22)', () => {
    renderWithProviders(<VidaPlantillaPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Abrir Poner una lavadora' }))
    fireEvent.click(screen.getByRole('button', { name: 'Quitar de la plantilla' }))

    const dialog = screen.getByRole('dialog', { name: /¿Quitar «Poner una lavadora»/ })
    expect(within(dialog).queryByRole('button', { name: /Quitarlo solo/ })).not.toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Quitarlo' })).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Volver' })).toBeInTheDocument()
    expect(dialog.textContent).not.toContain('también está')
  })

  it('la pantalla se dibuja **de la consulta**: cambiar la hora reordena y vaciarla manda al cajón (criterio 24)', () => {
    const { rerender } = renderWithProviders(<VidaPlantillaPage />)
    const names = () =>
      within(screen.getByRole('list', { name: /viernes, ordenado por hora/i }))
        .getAllByRole('listitem')
        .map((row) => row.textContent ?? '')

    expect(names()[0]).toContain('Salir a correr')
    expect(names()[2]).toContain('Organizar la casa')

    // Lo que devolvería la consulta ya invalidada tras guardar: la casa a las
    // 21:00 y el paseo de la mañana **sin hora**.
    itemsQuery = ready([
      { ...item('m', { title: 'Pasear a las mascotas' }), activityId: 'a-pasear' },
      item('casa', {
        days: ['monday', 'wednesday', 'friday'],
        startTime: '21:00',
        durationMinutes: 45,
        title: 'Organizar la casa',
      }),
    ])
    rerender(<VidaPlantillaPage />)

    expect(names()).toHaveLength(1)
    expect(names()[0]).toContain('Organizar la casa')
    const drawer = screen.getByRole('region', { name: /sin hora/i })
    expect(within(drawer).getByText('Pasear a las mascotas')).toBeInTheDocument()
  })
})

// ─── Tajada 3: «Añadir a mi Vida» y el primer minuto (criterios 29-40) ───────

function catalogActivity(
  id: string,
  title: string,
  status: ActivityStatus = 'pending',
): Activity {
  return {
    id,
    userId: 1,
    title,
    description: null,
    status,
    priority: 'medium' as const,
    categoryId: 'c-1',
    scheduledDate: null,
    completedAt: null,
    spentTimeMinutes: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }
}

describe('«Añadir a mi Vida» (criterios 29-34 y 40)', () => {
  beforeEach(() => {
    itemsQuery = ready([
      item('1', { startTime: '07:30', durationMinutes: 40, title: 'Pasear a las mascotas' }),
    ])
    activitiesQuery = ready<ActivitiesResponse>({
      activities: [
        catalogActivity('a-1', 'Pasear a las mascotas'),
        catalogActivity('a-2', 'Bañarme'),
        catalogActivity('a-3', 'Salir a correr', 'cancelled'),
      ],
      page: 1,
      limit: 200,
      total: 3,
    })
  })

  it('el «+» y el panel existen y **ninguno navega al catálogo** (criterio 29)', () => {
    renderWithProviders(<VidaPlantillaPage />)

    const fab = screen.getByRole('button', { name: 'Añadir a mi Vida' })
    expect(fab).not.toHaveAttribute('href')
    expect(
      screen.getByRole('heading', { name: 'Añadir a mi Vida', level: 3 }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Tus actividades. Eliges una y le pones días, hora y cuánto — aquí mismo.'),
    ).toBeInTheDocument()
  })

  it('busca sin tildes y no enseña las archivadas (criterio 30)', () => {
    renderWithProviders(<VidaPlantillaPage />)
    // Dentro del panel: «Pasear a las mascotas» también está en la agenda del
    // día, y lo que se mide aquí es la lista del buscador.
    const panel = screen.getByRole('region', { name: 'Añadir a mi Vida' })

    expect(within(panel).queryByText('Salir a correr')).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Buscar en tus actividades'), {
      target: { value: 'banar' },
    })
    expect(within(panel).getByText('Bañarme')).toBeInTheDocument()
    expect(within(panel).queryByText('Pasear a las mascotas')).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Buscar en tus actividades'), {
      target: { value: 'zzz' },
    })
    expect(screen.getByText('Nada con ese nombre. Prueba con otra palabra.')).toBeInTheDocument()
  })

  it('cada una dice en qué estado está (criterio 31)', () => {
    renderWithProviders(<VidaPlantillaPage />)

    expect(screen.getByText('aún no está')).toBeInTheDocument()
    expect(screen.getByText('en tu plantilla · V · 7:30')).toBeInTheDocument()
  })

  it('añade **otra hora** a la que ya está, lo avisa antes y crea un segundo ítem (criterios 32, 33 y 34)', () => {
    renderWithProviders(<VidaPlantillaPage />)
    const panel = screen.getByRole('region', { name: 'Añadir a mi Vida' })

    fireEvent.click(within(panel).getByRole('button', { name: '+ Otra hora' }))
    expect(
      screen.getByText('Pasear a las mascotas ya está a las 7:30 · esto le añade otra hora.'),
    ).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/A qué hora/), { target: { value: '19:00' } })
    // Criterio 33: dice qué hay a esa hora y **no bloquea**.
    expect(screen.getByText('Cabe: a las 19:00 no tienes nada')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(/A qué hora/), { target: { value: '07:45' } })
    expect(
      screen.getByText('Cabe: a las 7:45 ya tienes Pasear a las mascotas'),
    ).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/A qué hora/), { target: { value: '19:00' } })
    fireEvent.click(screen.getByRole('button', { name: '30' }))
    fireEvent.click(within(panel).getByRole('button', { name: 'Añadir a mi Vida' }))

    // **`create`, no `update`**: la de las 7:30 no se toca (criterio 34, A3).
    expect(createItem.mutate).toHaveBeenCalledTimes(1)
    expect(updateItem.mutate).not.toHaveBeenCalled()
    const input = createItem.mutate.mock.calls[0]![0]
    expect(input).toEqual({
      activityId: 'a-1',
      days: ['friday'],
      startTime: '19:00',
      durationMinutes: 30,
    })
    expect(JSON.stringify(input)).not.toContain('"id"')
  })

  it('distingue cargando, catálogo vacío y error (criterio 40)', () => {
    activitiesQuery = {
      data: undefined,
      isPending: true,
      isError: false,
      fetchStatus: 'fetching',
      refetch: vi.fn(),
    }
    const { unmount } = renderWithProviders(<VidaPlantillaPage />)
    expect(screen.getByText('Cargando tus actividades…')).toBeInTheDocument()
    unmount()

    activitiesQuery = {
      data: undefined,
      isPending: false,
      isError: true,
      fetchStatus: 'idle',
      refetch: vi.fn(),
    }
    const second = renderWithProviders(<VidaPlantillaPage />)
    expect(screen.getByText('No pudimos cargar tus actividades')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
    expect(screen.queryByText('Todavía no tienes actividades')).not.toBeInTheDocument()
    second.unmount()

    activitiesQuery = ready<ActivitiesResponse>({
      activities: [],
      page: 1,
      limit: 200,
      total: 0,
    })
    renderWithProviders(<VidaPlantillaPage />)
    expect(screen.getByText('Todavía no tienes actividades')).toBeInTheDocument()
  })
})

describe('el primer minuto, con la plantilla vacía (criterio 36)', () => {
  it('enseña los seis puntos con su hora, tres marcados y el contador', () => {
    itemsQuery = ready<VidaItem[]>([])
    renderWithProviders(<VidaPlantillaPage />)

    expect(screen.getByRole('button', { name: /7:00.*Bañarme.*15 min/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(
      screen.getByRole('button', { name: /21:30.*Leer un rato.*30 min/ }),
    ).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText('3 elegidas · de lunes a viernes')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Ponerlas en mi plantilla' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Horas de partida · las ajustas en un toque después'),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Traer de tus actividades' })).toBeInTheDocument()
    expect(
      screen.getByText('Un día sin plantilla se vive igual: se registra sobre la marcha.'),
    ).toBeInTheDocument()
  })
})
