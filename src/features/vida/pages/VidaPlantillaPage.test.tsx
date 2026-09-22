import { act, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { UserSettings } from '@/features/settings/types/user-settings.types'
import { VidaPlantillaPage } from '@/features/vida/pages/VidaPlantillaPage'
import type {
  ActivitiesResponse,
  Activity,
  ActivityStatus,
} from '@/features/vida/types/activity.types'
import * as vidaItemsApi from '@/features/vida/api/vida-items.api'
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

/**
 * **Cada vez que un hook de consulta se monta o se vuelve a llamar**, por su
 * nombre. Es el espía del criterio 147: entrar en la plantilla —y pulsar un
 * hueco— no puede estrenar ninguna consulta que no estuviera ya.
 */
let queryHooks: string[]

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
    queryHooks.push('vidaItems')
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
  useActivityCategoriesQuery: () => {
    queryHooks.push('activityCategories')
    return {
      data: [],
      isPending: false,
      isError: false,
      fetchStatus: 'idle',
      refetch: vi.fn(),
    }
  },
  useCreateActivityCategoryMutation: () => ({ mutate: vi.fn(), isPending: false, isError: false }),
}))
// El lote de «Copiar este día a otros» orquesta sobre `api/`, como su molde
// (`useBuildWeekFromTemplate`): se mockea la capa de API y **no el hook**, para
// que lo que se afirme sea el cuerpo que viajaría.
vi.mock('@/features/vida/api/vida-items.api')
vi.mock('@/features/settings/hooks/useUserSettings', () => ({
  useUserSettingsQuery: () => {
    queryHooks.push('userSettings')
    return settingsQuery
  },
  useUpdateUserSettingsMutation: () => ({ mutate: vi.fn(), isPending: false, isError: false }),
}))
/* La ventana de seis semanas (FEAT-007, tajada 4). Se mockea el hook —como en
 * `VidaHoyPage.test.tsx`— porque lo que esta página tiene que hacer bien es
 * **cablearlo diferido**: se anota cada `enabled` que pide para afirmar que
 * **antes de abrir una hoja no se monta nada** (criterio 103). */
let patternsEnabled: boolean[]
let patternsResult: {
  patterns: unknown[]
  answerSuggestion: ReturnType<typeof vi.fn>
}
vi.mock('@/features/vida/hooks/useVidaPatterns', () => ({
  useVidaPatterns: (input: { enabled: boolean }) => {
    queryHooks.push('vidaPatterns')
    patternsEnabled.push(input.enabled)
    return patternsResult
  },
}))
vi.mock('@/features/vida/hooks/useActivities', () => ({
  useActivitiesQuery: () => {
    queryHooks.push('activities')
    return activitiesQuery
  },
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

/**
 * El texto de **las tarjetas** de la agenda, sin las filas que FEAT-009
 * intercala entre ellas (el hueco y la línea del ítem sin duración). Lo que
 * separa a unas de otras es lo mismo que las separa en pantalla: el hueco
 * empieza por «Libre» y la línea por «No sabemos».
 */
function itemRowsOf(agenda: HTMLElement): string[] {
  return within(agenda)
    .getAllByRole('listitem')
    .map((row) => row.textContent ?? '')
    .filter((text) => !text.startsWith('Libre ') && !text.startsWith('No sabemos '))
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 8, 18, 9, 24, 0))
  lastIncludeInactive = undefined
  updateItem = { mutate: vi.fn(), isPending: false, isError: false }
  deleteItem = { mutate: vi.fn(), isPending: false, isError: false }
  createItem = { mutate: vi.fn(), isPending: false, isError: false }
  itemsQuery = ready<VidaItem[]>([])
  queryHooks = []
  patternsEnabled = []
  patternsResult = { patterns: [], answerSuggestion: vi.fn() }
  settingsQuery = ready(SETTINGS)
  activitiesQuery = ready<ActivitiesResponse>({ activities: [], page: 1, limit: 100, total: 0 })
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
    // **Acotado en FEAT-009, no debilitado**: desde que la lista lleva huecos,
    // entre las tarjetas hay filas que no son ítems. La afirmación sigue
    // siendo la misma —una tarjeta por ítem y el orden de la hora— hecha sobre
    // las tarjetas.
    const names = itemRowsOf(agenda)
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
    // **Acotado en la tajada 4, no debilitado**: desde que existe la
    // cuadrícula, el mismo nombre se pinta dos veces —en la agenda del día y en
    // su bloque de la semana—, así que la afirmación se hace sobre la agenda,
    // que es de lo que hablaba el criterio 8.
    const agenda = screen.getByRole('list', { name: /viernes, ordenado por hora/i })
    expect(within(agenda).getByText('Salir a correr')).toBeInTheDocument()
    expect(within(agenda).getByText('desactivada')).toBeInTheDocument()
    // La leyenda de la cuadrícula dice lo mismo («trazo punteado = desactivada
    // · no sale en Hoy»), así que también aquí se mira la agenda.
    expect(within(agenda).getByText(/no sale en Hoy/)).toBeInTheDocument()
  })

  it('**ningún botón muerto**: los dos atajos del día existen y hacen algo', () => {
    renderWithProviders(<VidaPlantillaPage />)
    // La afirmación de la tajada 1 era «cero botones» y quedó derogada por los
    // criterios 16, 25 y 26; la de la tajada 3, que la 4 no se pintaba,
    // **queda derogada aquí por los criterios 48 y 49**: «Ver la semana
    // entera» y «Copiar este día a otros» ya funcionan. Lo que sigue valiendo
    // es la regla de fondo: **no se pinta nada que no haga nada**.
    expect(screen.getAllByRole('tab')).toHaveLength(7)
    expect(screen.getByRole('button', { name: /ver la semana entera/i })).toBeEnabled()

    fireEvent.click(screen.getByRole('button', { name: /copiar este día a otros/i }))
    expect(screen.getByRole('dialog', { name: /copiar tu viernes a otros días/i })).toBeInTheDocument()
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
    // Acotado a la agenda: la cuadrícula de la tajada 4 pinta el mismo nombre
    // en su bloque.
    const agenda = screen.getByRole('list', { name: /viernes, ordenado por hora/i })
    expect(within(agenda).getByText(largo)).toBeInTheDocument()
  })
})

// ─── FEAT-009 · tajada 1: los huecos se ven ──────────────────────────────────

/**
 * Lo que hay **entre** las cosas (criterios 140-152). En esta tajada nada de
 * esto se pulsa: la lista gana filas, no salidas.
 */
describe('los huecos de la plantilla (criterios 140-149)', () => {
  const agenda = () => screen.getByRole('list', { name: /viernes, ordenado por hora/i })

  it('entre ítem e ítem, una fila con su rango y su tamaño (criterio 140)', () => {
    itemsQuery = ready([
      item('uno', { startTime: '08:00', durationMinutes: 40, title: 'Bañarme' }),
      item('dos', { startTime: '09:00', durationMinutes: 30, title: 'Desayunar' }),
    ])
    renderWithProviders(<VidaPlantillaPage />)

    // El rango va dentro de un `<b>`, así que la frase se lee entera del
    // elemento, no del nodo de texto suelto.
    const libres = within(agenda())
      .getAllByText(/^Libre /)
      .map((row) => row.textContent)
    expect(libres).toContain('Libre 8:40 → 9:00 · 20m')
  })

  it('los bordes del día también llevan hueco: dos, y solo dos (criterio 141)', () => {
    itemsQuery = ready([item('uno', { startTime: '08:00', durationMinutes: 60 })])
    renderWithProviders(<VidaPlantillaPage />)

    const libres = within(agenda())
      .getAllByText(/^Libre /)
      .map((row) => row.textContent)
    expect(libres).toEqual(['Libre 6:30 → 8:00 · 1h 30', 'Libre 9:00 → 23:00 · 14h'])
  })

  it('el de menos de 15 min se ve, y **no hay nada que pulsar** (criterios 143 y 161)', () => {
    itemsQuery = ready([
      item('uno', { startTime: '08:00', durationMinutes: 55, title: 'Bañarme' }),
      item('dos', { startTime: '09:00', durationMinutes: 30, title: 'Desayunar' }),
    ])
    renderWithProviders(<VidaPlantillaPage />)

    const fino = within(agenda()).getByText('Libre 8:55 → 9:00 · 5m')
    expect(fino).toBeInTheDocument()
    // **El resto de 5 min no se pulsa** ni desde la tajada 2, que es cuando
    // los huecos de 15 min o más se volvieron botones: el fino sigue siendo un
    // `<p>` y no hay ningún rótulo que hable de las 8:55.
    expect(fino.tagName).toBe('P')
    expect(fino.closest('button')).toBeNull()
    const rotulos = within(agenda())
      .getAllByRole('button')
      .map((button) => button.getAttribute('aria-label') ?? button.textContent)
    expect(rotulos.filter((texto) => texto?.includes('8:55'))).toHaveLength(0)
    expect(rotulos).toContain('Abrir Bañarme')
    expect(rotulos).toContain('Abrir Desayunar')
  })

  it('en un solape no aparece ningún hueco entre los dos (criterio 144)', () => {
    itemsQuery = ready([
      item('largo', { startTime: '08:00', durationMinutes: 120, title: 'Trabajar' }),
      item('dentro', { startTime: '09:00', durationMinutes: 30, title: 'Daily' }),
    ])
    renderWithProviders(<VidaPlantillaPage />)

    const libres = within(agenda())
      .getAllByText(/^Libre /)
      .map((row) => row.textContent)
    expect(libres).toEqual(['Libre 6:30 → 8:00 · 1h 30', 'Libre 10:00 → 23:00 · 13h'])
  })

  it('un ítem sin duración pone una línea que dice la verdad, no un hueco (criterio 145)', () => {
    itemsQuery = ready([
      item('sin', { startTime: '10:00', title: 'Working at lululemon' }),
      item('luego', { startTime: '14:00', durationMinutes: 45, title: 'Pasear' }),
    ])
    renderWithProviders(<VidaPlantillaPage />)

    const linea = within(agenda()).getByText(/^No sabemos cuánto dura/)
    expect(linea.textContent).toBe(
      'No sabemos cuánto dura Working at lululemon, así que no podemos decir qué queda libre hasta las 14:00.',
    )
    expect(within(agenda()).queryByText(/^Libre 10:00/)).not.toBeInTheDocument()
  })

  // La línea dice **la hora** también cuando el corte es el fin del día: el
  // criterio 146 escribe su ejemplo con el número («…hasta las 22:00») y el
  // módulo dice los números en todas partes. El día del test acaba a las 23:00.
  it('si es el último, la línea dice **la hora** del fin del día (criterio 146)', () => {
    itemsQuery = ready([item('sin', { startTime: '10:00', title: 'Working at lululemon' })])
    renderWithProviders(<VidaPlantillaPage />)

    expect(within(agenda()).getByText(/^No sabemos cuánto dura/).textContent).toBe(
      'No sabemos cuánto dura Working at lululemon, así que no podemos decir qué queda libre hasta las 23:00.',
    )
  })

  it('un día sin ítems con hora no pinta ningún hueco (criterio 149)', () => {
    itemsQuery = ready([item('lavadora', { title: 'Poner una lavadora', durationMinutes: 20 })])
    renderWithProviders(<VidaPlantillaPage />)

    expect(screen.queryByRole('list', { name: /viernes, ordenado por hora/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/^Libre /)).not.toBeInTheDocument()
  })

  it('solo en la vista de día: ni la semana entera ni el cajón pintan huecos (criterio 148)', () => {
    itemsQuery = ready([...WEEK, item('lavadora', { title: 'Poner una lavadora' })])
    renderWithProviders(<VidaPlantillaPage />)

    const week = screen.getByRole('region', { name: 'Tu semana entera' })
    expect(within(week).queryByText(/^Libre /)).not.toBeInTheDocument()
    expect(within(week).queryByText(/^No sabemos cuánto dura/)).not.toBeInTheDocument()

    const drawer = screen.getByRole('region', { name: /sin hora/i })
    expect(within(drawer).queryByText(/^Libre /)).not.toBeInTheDocument()
  })

  it('ni una palabra de reproche en lo nuevo: un rato sin nada es **libre** (criterio 166)', () => {
    itemsQuery = ready([
      item('uno', { startTime: '08:00', durationMinutes: 40, title: 'Bañarme' }),
      item('sin', { startTime: '10:00', title: 'Working at lululemon' }),
    ])
    renderWithProviders(<VidaPlantillaPage />)

    const texto = agenda().textContent ?? ''
    expect(texto).toContain('Libre')
    for (const palabra of ['vacío', 'desperdicio', 'perdido', 'sin aprovechar', 'deberías']) {
      expect(texto).not.toContain(palabra)
    }
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
      limit: 100,
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

  /**
   * **La ventana de seis semanas, diferida** (FEAT-007, tajada 4, criterio
   * 103). Entrar en Plantilla no puede costar 43 consultas: la ventana solo
   * sirve dentro de la hoja, así que no se monta hasta que se abre una.
   */
  it('la ventana de patrones **no se monta** hasta abrir una hoja (103)', () => {
    renderWithProviders(<VidaPlantillaPage />)

    expect(patternsEnabled.length).toBeGreaterThan(0)
    expect(patternsEnabled.every((enabled) => enabled === false)).toBe(true)

    fireEvent.click(screen.getAllByRole('button', { name: 'Abrir Pasear a las mascotas' })[0]!)
    expect(patternsEnabled.at(-1)).toBe(true)
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
    // Las tarjetas, sin las filas de hueco que FEAT-009 intercala entre ellas.
    const names = () =>
      itemRowsOf(screen.getByRole('list', { name: /viernes, ordenado por hora/i }))

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
      limit: 100,
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
      limit: 100,
      total: 0,
    })
    renderWithProviders(<VidaPlantillaPage />)
    expect(screen.getByText('Todavía no tienes actividades')).toBeInTheDocument()
  })
})

/**
 * **El toque precarga** (FEAT-009, tajada 2, criterios 153-162 y 170).
 *
 * El día del test va de **6:30 a 23:00** y tiene dos cosas puestas, así que la
 * lista trae tres huecos: **6:30 → 8:00** (90 min), **8:40 → 9:00** (20 min) y
 * **9:30 → 23:00**.
 *
 * `window.matchMedia` del arnés devuelve `false` para todo, así que **el caso
 * por defecto de este bloque es móvil**: el panel se abre dentro de la hoja. El
 * de escritorio se monta a mano, como en `VidaRevisionPage.test.tsx:649`.
 */
describe('pulsar un hueco precarga la hora y la duración (criterios 153-162 y 170)', () => {
  const agenda = () => screen.getByRole('list', { name: /viernes, ordenado por hora/i })
  /** El hueco, por lo que se oye: es el `aria-label` del criterio 162. */
  const gap = (name: string | RegExp) => within(agenda()).getByRole('button', { name })
  const panels = () => screen.getAllByRole('region', { name: 'Añadir a mi Vida' })
  /** El último montado: en móvil la hoja; en escritorio, el aside. */
  const panel = () => panels()[panels().length - 1]!

  function desktop(): () => void {
    const original = window.matchMedia
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('min-width'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as unknown as typeof window.matchMedia
    return () => {
      window.matchMedia = original
    }
  }

  beforeEach(() => {
    itemsQuery = ready([
      item('1', { startTime: '08:00', durationMinutes: 40, title: 'Pasear a las mascotas' }),
      item('2', { startTime: '09:00', durationMinutes: 30, title: 'Bañarme' }),
    ])
    // «Leer» **no está** en la plantilla, así que su botón es «+ Añadir» y no
    // «+ Otra hora»: es el camino del criterio 153, elegir del catálogo.
    activitiesQuery = ready<ActivitiesResponse>({
      activities: [catalogActivity('a-9', 'Leer')],
      page: 1,
      limit: 100,
      total: 1,
    })
  })

  it('el hueco es un botón alcanzable con su hora y su tamaño (criterio 162)', () => {
    renderWithProviders(<VidaPlantillaPage />)

    const nombres = within(agenda())
      .getAllByRole('button')
      .map((button) => button.getAttribute('aria-label'))
    expect(nombres).toContain('Poner algo a las 6:30, 1 h 30 min libres')
    expect(nombres).toContain('Poner algo a las 8:40, 20 min libres')
  })

  it('pulsarlo abre «Añadir a mi Vida» y **no la hoja del ítem** (criterio 153)', () => {
    renderWithProviders(<VidaPlantillaPage />)
    fireEvent.click(gap('Poner algo a las 8:40, 20 min libres'))

    // En móvil el panel vive en la hoja: aparece un segundo montaje.
    expect(panels()).toHaveLength(2)
    expect(
      within(panel()).getByText(/^Viene del hueco que pulsaste/).textContent,
    ).toBe('Viene del hueco que pulsaste · para las 8:40 · 20m libres')
    // La hoja del ítem se monta con `sheetSession`, que es quien enciende la
    // ventana de patrones: si no se enciende, no se ha abierto.
    expect(patternsEnabled.some(Boolean)).toBe(false)
  })

  it('**elegir la actividad conserva** la hora y la duración del hueco (criterios 154 y 155)', () => {
    renderWithProviders(<VidaPlantillaPage />)
    fireEvent.click(gap('Poner algo a las 8:40, 20 min libres'))
    fireEvent.click(within(panel()).getByRole('button', { name: '+ Añadir' }))

    expect(within(panel()).getByLabelText(/A qué hora/)).toHaveValue('08:40')
    // Los dos campos de FEAT-008, ya repartidos: 20 min son «0» y «20».
    expect(within(panel()).getByLabelText('horas')).toHaveValue('0')
    expect(within(panel()).getByLabelText('minutos')).toHaveValue('20')
    // Y el día visible sigue marcado.
    expect(within(panel()).getByRole('button', { name: 'viernes' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('un hueco de 90 min se lee «1» y «30», nunca «90» (criterios 155 y 170)', () => {
    renderWithProviders(<VidaPlantillaPage />)
    fireEvent.click(gap('Poner algo a las 6:30, 1 h 30 min libres'))
    fireEvent.click(within(panel()).getByRole('button', { name: '+ Añadir' }))

    expect(within(panel()).getByLabelText(/A qué hora/)).toHaveValue('06:30')
    expect(within(panel()).getByLabelText('horas')).toHaveValue('1')
    expect(within(panel()).getByLabelText('minutos')).toHaveValue('30')
  })

  it('por el «+» flotante **se sigue vaciando** como siempre (criterio 154)', () => {
    renderWithProviders(<VidaPlantillaPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Añadir a mi Vida' }))
    fireEvent.click(within(panel()).getByRole('button', { name: '+ Añadir' }))

    expect(within(panel()).queryByText(/^Viene del hueco/)).not.toBeInTheDocument()
    expect(within(panel()).getByLabelText(/A qué hora/)).toHaveValue('')
    // Sin duración no hay campos de «libre» abiertos: ninguna píldora encendida.
    expect(within(panel()).queryByLabelText('horas')).not.toBeInTheDocument()
  })

  it('pulsar tres huecos y cerrar **no guarda nada ni pide nada nuevo** (criterios 156 y 147)', () => {
    renderWithProviders(<VidaPlantillaPage />)
    const antes = [...new Set(queryHooks)].sort()

    fireEvent.click(gap('Poner algo a las 8:40, 20 min libres'))
    fireEvent.click(gap('Poner algo a las 6:30, 1 h 30 min libres'))
    fireEvent.click(gap('Poner algo a las 9:30, 13 h 30 min libres'))
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }))

    // **Cero mutaciones**: un hueco pulsado es una propuesta, no un guardado.
    expect(createItem.mutate).not.toHaveBeenCalled()
    expect(updateItem.mutate).not.toHaveBeenCalled()
    expect(deleteItem.mutate).not.toHaveBeenCalled()
    // Y **ni una consulta nueva**: los mismos hooks que ya había, y la ventana
    // de patrones sigue apagada. La capa de API tampoco se toca.
    expect([...new Set(queryHooks)].sort()).toEqual(antes)
    expect(patternsEnabled.some(Boolean)).toBe(false)
    for (const spy of Object.values(vidaItemsApi)) {
      if (typeof spy === 'function' && 'mock' in spy) expect(spy).not.toHaveBeenCalled()
    }
  })

  it('guardar desde el hueco manda **el mismo cuerpo** que escribirlo a mano (criterio 157)', () => {
    renderWithProviders(<VidaPlantillaPage />)
    fireEvent.click(gap('Poner algo a las 8:40, 20 min libres'))
    fireEvent.click(within(panel()).getByRole('button', { name: '+ Añadir' }))
    fireEvent.click(within(panel()).getByRole('button', { name: 'Añadir a mi Vida' }))

    expect(createItem.mutate).toHaveBeenCalledTimes(1)
    const input = createItem.mutate.mock.calls[0]![0]
    expect(input).toEqual({
      activityId: 'a-9',
      days: ['friday'],
      startTime: '08:40',
      durationMinutes: 20,
    })
  })

  it('la lista se recoloca sola: guardar 20 min en un hueco de 60 deja el resto (criterio 158)', () => {
    // La lista sale de `items`, así que esto es lo que se ve cuando la mutación
    // invalida y la consulta vuelve con el ítem nuevo dentro.
    itemsQuery = ready([
      item('1', { startTime: '08:00', durationMinutes: 40, title: 'Pasear a las mascotas' }),
      item('nuevo', { startTime: '08:40', durationMinutes: 20, title: 'Leer' }),
      item('2', { startTime: '09:40', durationMinutes: 30, title: 'Bañarme' }),
    ])
    renderWithProviders(<VidaPlantillaPage />)

    const libres = within(agenda())
      .getAllByText(/^Libre /)
      .map((row) => row.textContent)
    expect(libres).not.toContain('Libre 8:40 → 9:00 · 20m')
    expect(libres).toContain('Libre 9:00 → 9:40 · 40m')
  })

  it('**otro hueco sustituye la hora y la duración** y no toca lo elegido (criterio 160)', () => {
    renderWithProviders(<VidaPlantillaPage />)
    fireEvent.click(gap('Poner algo a las 8:40, 20 min libres'))
    fireEvent.click(within(panel()).getByRole('button', { name: '+ Añadir' }))
    // Se marca un día más a mano: pulsar otro hueco no puede deshacerlo.
    fireEvent.click(within(panel()).getByRole('button', { name: 'lunes' }))

    fireEvent.click(gap('Poner algo a las 6:30, 1 h 30 min libres'))

    expect(within(panel()).getByLabelText(/A qué hora/)).toHaveValue('06:30')
    expect(within(panel()).getByLabelText('horas')).toHaveValue('1')
    expect(within(panel()).getByLabelText('minutos')).toHaveValue('30')
    // La actividad elegida sigue elegida —el mini-formulario no se ha ido— y
    // los días siguen como los dejó el usuario.
    expect(within(panel()).getByText('Leer')).toBeInTheDocument()
    expect(within(panel()).getByRole('button', { name: 'lunes' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(within(panel()).getByRole('button', { name: 'viernes' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('lo que no se pulsa sigue sin pulsarse: el fino y la línea de «no sabemos» (criterio 161)', () => {
    itemsQuery = ready([
      item('1', { startTime: '08:00', durationMinutes: 40, title: 'Pasear a las mascotas' }),
      item('2', { startTime: '08:50', durationMinutes: 30, title: 'Bañarme' }),
      item('sin', { startTime: '12:00', title: 'Working at lululemon' }),
    ])
    renderWithProviders(<VidaPlantillaPage />)

    const fino = within(agenda()).getByText('Libre 8:40 → 8:50 · 10m')
    expect(fino.tagName).toBe('P')
    expect(fino.closest('button')).toBeNull()
    const linea = within(agenda()).getByText(/^No sabemos cuánto dura/)
    expect(linea.tagName).toBe('P')
    expect(linea.closest('button')).toBeNull()
    expect(linea).not.toHaveAttribute('role')
    const rotulos = within(agenda())
      .getAllByRole('button')
      .map((button) => button.getAttribute('aria-label') ?? button.textContent)
    expect(rotulos.filter((texto) => texto?.includes('12:00'))).toHaveLength(0)
  })

  it('en escritorio no se abre ninguna hoja encima y el foco va al buscador (criterio 159)', () => {
    const restore = desktop()
    try {
      renderWithProviders(<VidaPlantillaPage />)
      fireEvent.click(gap('Poner algo a las 8:40, 20 min libres'))

      // El panel ya estaba a la vista: **no** hay un segundo montaje ni diálogo.
      expect(panels()).toHaveLength(1)
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(within(panel()).getByText(/^Viene del hueco que pulsaste/).textContent).toBe(
        'Viene del hueco que pulsaste · para las 8:40 · 20m libres',
      )
      expect(document.activeElement).toBe(screen.getByLabelText('Buscar en tus actividades'))
    } finally {
      restore()
    }
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

/* ── La semana entera y copiar un día (tajada 4, criterios 42–54) ──────────── */

/**
 * El reloj de este archivo está congelado (`vi.useFakeTimers`) para que «se abre
 * el día de hoy» sea una afirmación, y con temporizadores falsos `waitFor` no
 * avanza solo: el lote de copiar se espera empujando los timers a mano.
 */
async function flush() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(20)
  })
}

const WEEK = [
  item('1', {
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    startTime: '07:00',
    durationMinutes: 15,
    title: 'Bañarme',
  }),
  item('2', {
    days: ['monday'],
    startTime: '13:00',
    durationMinutes: 60,
    title: 'Cocinar y almorzar',
  }),
  item('3', { days: ['saturday'], title: 'Poner una lavadora' }),
  item('4', {
    days: ['friday'],
    startTime: '06:45',
    title: 'Salir a correr',
    isActive: false,
  }),
]

describe('la cuadrícula de la semana (criterios 42–47)', () => {
  beforeEach(() => {
    itemsQuery = ready(WEEK)
  })

  it('enseña **siete columnas** con su cuenta, su tiempo y **hoy marcado**', () => {
    renderWithProviders(<VidaPlantillaPage />)
    const week = screen.getByRole('region', { name: 'Tu semana entera' })

    expect(within(week).getByRole('region', { name: /^lunes · 2 cosas · 1h 15$/ })).toBeInTheDocument()
    // Hoy es viernes: la columna lo dice en lo que se lee, no solo en el color.
    expect(within(week).getByRole('region', { name: /^viernes, hoy ·/ })).toBeInTheDocument()
    expect(within(week).getByRole('region', { name: /^domingo · 0 cosas · 0m$/ })).toBeInTheDocument()
  })

  it('cada bloque es **un botón con su rótulo completo**: qué, qué día, a qué hora y cuánto', () => {
    renderWithProviders(<VidaPlantillaPage />)
    const week = screen.getByRole('region', { name: 'Tu semana entera' })

    expect(
      within(week).getByRole('button', { name: 'Abrir Bañarme · lunes a las 7:00 · 15 min' }),
    ).toBeInTheDocument()
    expect(
      within(week).getByRole('button', {
        name: 'Abrir Salir a correr · viernes a las 6:45 · sin duración · desactivada · no sale en Hoy',
      }),
    ).toBeInTheDocument()
  })

  it('tocar un bloque abre **la misma hoja** del ítem (criterio 16)', () => {
    renderWithProviders(<VidaPlantillaPage />)
    const week = screen.getByRole('region', { name: 'Tu semana entera' })

    fireEvent.click(
      within(week).getByRole('button', { name: /^Abrir Cocinar y almorzar/ }),
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('los **sin hora** van debajo de su columna, y una columna sin ellos no pinta nada', () => {
    renderWithProviders(<VidaPlantillaPage />)
    const week = screen.getByRole('region', { name: 'Tu semana entera' })

    expect(
      within(week).getByRole('button', { name: 'Poner una lavadora · sábado · sin hora' }),
    ).toBeInTheDocument()
    expect(
      within(week).queryByRole('button', { name: /· lunes · sin hora$/ }),
    ).not.toBeInTheDocument()
  })

  it('la leyenda trae **las categorías que aparecen** y lo que significa el punteado', () => {
    renderWithProviders(<VidaPlantillaPage />)
    const week = screen.getByRole('region', { name: 'Tu semana entera' })

    expect(within(week).getByText('Casa')).toBeInTheDocument()
    expect(
      within(week).getByText('trazo punteado = desactivada · no sale en Hoy'),
    ).toBeInTheDocument()
  })

  it('el total de la semana sale con los números de verdad (criterio 46)', () => {
    renderWithProviders(<VidaPlantillaPage />)

    expect(
      screen.getByText('8 cosas puestas · 2h 15 a la semana de 115h 30 · tu día va de 6:30 a 23:00'),
    ).toBeInTheDocument()
  })

  it('**dos que se pisan se ven los dos**, cada uno en su carril (criterio 47)', () => {
    itemsQuery = ready([
      item('a', { days: ['monday'], startTime: '09:00', durationMinutes: 60, title: 'Leer' }),
      item('b', { days: ['monday'], startTime: '09:30', durationMinutes: 60, title: 'Llamar' }),
    ])
    renderWithProviders(<VidaPlantillaPage />)
    const week = screen.getByRole('region', { name: 'Tu semana entera' })

    const uno = within(week).getByRole('button', { name: /^Abrir Leer/ })
    const dos = within(week).getByRole('button', { name: /^Abrir Llamar/ })
    // Ninguno se oculta ni se recorta hasta desaparecer: los dos con alto y en
    // mitades distintas de la columna.
    expect(uno.style.width).toBe('calc(50% - 0.3rem)')
    expect(dos.style.left).toBe('calc(50% + 0.15rem)')
    expect(uno.style.height).not.toBe('0%')
    expect(dos.style.height).not.toBe('0%')
    // Y **no se bloquea nada**: ni error ni aviso.
    expect(within(week).queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('«Ver la semana entera» en móvil (criterio 48)', () => {
  beforeEach(() => {
    itemsQuery = ready(WEEK)
  })

  it('es **un estado de la misma página**, con vuelta al día y sin cambiar de ruta', () => {
    renderWithProviders(<VidaPlantillaPage />)
    const before = window.location.pathname
    const week = () => screen.getByRole('region', { name: 'Tu semana entera' })
    // En móvil quien enseña y esconde es el CSS —`display` por `data-open`—, y
    // en jsdom los módulos de estilo no se aplican: lo que se afirma aquí es
    // **el estado**, y que la cuadrícula se ve a 375 px está medido en el
    // navegador, no aquí.
    expect(week().dataset.open).toBe('false')

    fireEvent.click(screen.getByRole('button', { name: /ver la semana entera/i }))
    expect(week().dataset.open).toBe('true')
    // **Sin ruta nueva**: la URL no se ha movido (criterio 48).
    expect(window.location.pathname).toBe(before)

    fireEvent.click(screen.getByRole('button', { name: 'Volver al día' }))
    expect(week().dataset.open).toBe('false')
    // El día sigue donde estaba: las pestañas no se han tocado.
    expect(screen.getAllByRole('tab')).toHaveLength(7)
  })
})

describe('«Copiar este día a otros» (criterios 49–53)', () => {
  beforeEach(() => {
    itemsQuery = ready(WEEK)
    vi.mocked(vidaItemsApi.updateVidaItem).mockResolvedValue(WEEK[0]!)
  })

  it('parte del día que se está viendo, cuenta los días y copia **con un update**', async () => {
    renderWithProviders(<VidaPlantillaPage />)
    fireEvent.click(screen.getByRole('button', { name: /copiar este día a otros/i }))
    const dialog = screen.getByRole('dialog', { name: /copiar tu viernes a otros días/i })

    // Sin días marcados no se puede copiar, y el día de partida no se ofrece.
    expect(within(dialog).getByRole('button', { name: 'Elige los días' })).toBeDisabled()
    expect(within(dialog).queryByRole('checkbox', { name: 'viernes' })).not.toBeInTheDocument()
    // La salida es **«Volver»**.
    expect(within(dialog).getByRole('button', { name: 'Volver' })).toBeInTheDocument()

    fireEvent.click(within(dialog).getByRole('checkbox', { name: 'sábado' }))
    fireEvent.click(within(dialog).getByRole('checkbox', { name: 'domingo' }))
    fireEvent.click(within(dialog).getByRole('button', { name: 'Copiar a 2 días' }))

    await flush()
    expect(vidaItemsApi.updateVidaItem).toHaveBeenCalledTimes(1)
    // **Le añade días al ítem que ya existe** (A7): ni un create, ni un delete.
    expect(vidaItemsApi.updateVidaItem).toHaveBeenCalledWith({
      id: '1',
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    })
    expect(vidaItemsApi.createVidaItem).not.toHaveBeenCalled()
    expect(vidaItemsApi.deleteVidaItem).not.toHaveBeenCalled()
    // El desactivado del viernes **no se copia** (criterio 52).
    expect(vi.mocked(vidaItemsApi.updateVidaItem).mock.calls.map((call) => call[0]!.id)).not.toContain(
      '4',
    )
  })

  it('dice **antes** lo que se queda como está, y la consecuencia de compartir ítem', () => {
    renderWithProviders(<VidaPlantillaPage />)
    fireEvent.click(screen.getByRole('button', { name: /copiar este día a otros/i }))
    const dialog = screen.getByRole('dialog', { name: /copiar tu viernes a otros días/i })

    fireEvent.click(within(dialog).getByRole('checkbox', { name: 'lunes' }))

    expect(
      within(dialog).getByText('Bañarme ya estaba el lunes, se quedó como estaba'),
    ).toBeInTheDocument()
    expect(dialog.textContent).toContain('comparte el mismo ítem')
    expect(dialog.textContent).toContain('lo que ya tienes a esa hora se queda como está')
  })

  it('después de copiar, el resumen dice **cuántas y a cuántos días**', async () => {
    renderWithProviders(<VidaPlantillaPage />)
    fireEvent.click(screen.getByRole('button', { name: /copiar este día a otros/i }))
    const dialog = screen.getByRole('dialog', { name: /copiar tu viernes a otros días/i })

    fireEvent.click(within(dialog).getByRole('checkbox', { name: 'sábado' }))
    fireEvent.click(within(dialog).getByRole('button', { name: 'Copiar a 1 día' }))

    await flush()
    expect(within(dialog).getByText('Copiamos 1 cosa a 1 día.')).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Listo' })).toBeInTheDocument()
  })
})

/**
 * **El ítem sin duración deja de tapar el hueco** (FEAT-009, tajada 3).
 *
 * La línea del criterio 145 dice la verdad pero deja al usuario sin salida: la
 * tajada 3 le pone una, y **una sola** —la hoja de ese ítem, la de siempre,
 * abierta mirando a «Cuánto»—. Nada de esto estrena sitios donde poner
 * duración ni guarda nada por su cuenta.
 */
describe('la línea del ítem sin duración tiene salida (criterios 163-165)', () => {
  const agenda = () => screen.getByRole('list', { name: /viernes, ordenado por hora/i })
  /** La fila entera de «no sabemos», para mirar **qué se puede pulsar dentro**. */
  const unknownRow = () =>
    within(agenda()).getByText(/^No sabemos cuánto dura/).closest('li') as HTMLElement

  beforeEach(() => {
    itemsQuery = ready([
      item('sin', { startTime: '10:00', title: 'Working at lululemon' }),
      item('luego', { startTime: '14:00', durationMinutes: 45, title: 'Pasear' }),
    ])
  })

  it('trae **una sola salida** y abre la hoja de ESE ítem con el foco en «Cuánto» (criterio 163)', () => {
    renderWithProviders(<VidaPlantillaPage />)

    const salidas = within(unknownRow()).getAllByRole('button')
    expect(salidas.map((boton) => boton.textContent)).toEqual(['Ponerle duración'])

    fireEvent.click(salidas[0]!)

    const sheet = screen.getByRole('dialog')
    // **La hoja que ya existe** (la de FEAT-005), no un segundo formulario: se
    // reconoce porque trae dentro la hora que el ítem ya tenía.
    expect(within(sheet).getByText('Working at lululemon')).toBeInTheDocument()
    expect(within(sheet).getByLabelText(/A qué hora/)).toHaveValue('10:00')
    // Y el foco está **dentro de «Cuánto»**: la persona venía a escribir ahí.
    const cuanto = within(sheet).getByRole('group', { name: 'Cuánto dura' })
    expect(cuanto.contains(document.activeElement)).toBe(true)
  })

  it('abrir la hoja por la tarjeta **no** mueve el foco a «Cuánto» (la prop es aditiva)', () => {
    renderWithProviders(<VidaPlantillaPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Abrir Pasear' }))

    const sheet = screen.getByRole('dialog')
    const cuanto = within(sheet).getByRole('group', { name: 'Cuánto dura' })
    expect(cuanto.contains(document.activeElement)).toBe(false)
  })

  it('al guardar la duración aparece el hueco y la línea se va (criterio 164)', () => {
    const view = renderWithProviders(<VidaPlantillaPage />)

    fireEvent.click(within(unknownRow()).getByRole('button', { name: 'Ponerle duración' }))
    const sheet = screen.getByRole('dialog')
    fireEvent.click(within(sheet).getByRole('button', { name: '30' }))
    fireEvent.click(within(sheet).getByRole('button', { name: 'Guardar' }))

    // Se guarda por **la puerta de siempre**, sobre ese id y sin campos nuevos.
    expect(updateItem.mutate).toHaveBeenCalledTimes(1)
    expect(updateItem.mutate.mock.calls[0]![0]).toMatchObject({
      id: 'sin',
      durationMinutes: 30,
    })

    // La lista sale de `items`: esto es lo que se ve cuando la mutación
    // invalida y la consulta vuelve con la duración puesta. **Sin recargar.**
    itemsQuery = ready([
      item('sin', { startTime: '10:00', durationMinutes: 30, title: 'Working at lululemon' }),
      item('luego', { startTime: '14:00', durationMinutes: 45, title: 'Pasear' }),
    ])
    view.rerender(<VidaPlantillaPage />)

    expect(within(agenda()).queryByText(/^No sabemos cuánto dura/)).not.toBeInTheDocument()
    expect(
      within(agenda())
        .getAllByText(/^Libre /)
        .map((fila) => fila.textContent),
    ).toContain('Libre 10:30 → 14:00 · 3h 30')
  })

  it('cerrar sin guardar deja la línea donde estaba y no toca el ítem (criterio 165)', () => {
    renderWithProviders(<VidaPlantillaPage />)

    fireEvent.click(within(unknownRow()).getByRole('button', { name: 'Ponerle duración' }))
    const sheet = screen.getByRole('dialog')
    fireEvent.click(within(sheet).getByRole('button', { name: '30' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }))

    expect(updateItem.mutate).not.toHaveBeenCalled()
    expect(createItem.mutate).not.toHaveBeenCalled()
    expect(within(agenda()).getByText(/^No sabemos cuánto dura/).textContent).toBe(
      'No sabemos cuánto dura Working at lululemon, así que no podemos decir qué queda libre hasta las 14:00.',
    )
    // Y donde no se puede afirmar nada **sigue sin pintarse** un hueco.
    expect(within(agenda()).queryByText(/^Libre 10:00/)).not.toBeInTheDocument()
  })
})
