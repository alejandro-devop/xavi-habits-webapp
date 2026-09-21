import { screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { UserSettings } from '@/features/settings/types/user-settings.types'
import { VidaRevisionPage } from '@/features/vida/pages/VidaRevisionPage'
import { useVidaDeviceNotesStore } from '@/features/vida/store/vida-device-notes.store'
import type { ActivityDayPlanItem } from '@/features/vida/types/activity-day-plan.types'
import type { ActivityFollowUp } from '@/features/vida/types/activity-followup.types'
import type { VidaSuggestion } from '@/features/vida/types/vida-item.types'
import { renderWithProviders } from '@/test/render'

/**
 * **La revisión de un día** (FEAT-006, tajada 1): criterios 1, 2, 3, 4, 5, 6,
 * 9, 10, 11, 13, 14, 15, 16, 18, 19, 20, 21, 22 y 23.
 *
 * Se mockean **las consultas**, no `useVidaDayData` ni la derivación: lo que
 * hay que comprobar aquí es que la pantalla cruza de verdad plan + sesiones +
 * ajustes y que **cada estado se distingue**. La aritmética y las frases tienen
 * su propio test puro en `utils/vida-review.utils.test.ts`.
 *
 * El reloj se fija en **sábado 19 de septiembre de 2026 a las 9:24**, así que
 * «al entrar sin `?d=` se abre el último día cerrado» es el viernes 18, que es
 * el día del render aprobado.
 *
 * Lo que **no** se prueba aquí y queda dicho: ninguna de estas consultas ha
 * pasado nunca por el API de verdad. `/app/*` está detrás del login y los
 * agentes no entran con credenciales.
 */

type Query<T> = {
  data?: T
  isPending: boolean
  isError: boolean
  fetchStatus: 'fetching' | 'idle' | 'paused'
  refetch: () => void
}

let planQuery: Query<ActivityDayPlanItem[]>
let suggestionsQuery: Query<VidaSuggestion[]>
let settingsQuery: Query<UserSettings>
let dayFollowUpsQuery: Query<ActivityFollowUp[]>
/** El día que la pantalla pidió: así se comprueba que el `?d=` manda. */
let askedDates: string[]

vi.mock('@/features/vida/hooks/useActivityDayPlan', () => ({
  useActivityDayPlanQuery: (date: string) => {
    askedDates.push(date)
    return planQuery
  },
}))
vi.mock('@/features/vida/hooks/useVidaItems', () => ({
  useVidaSuggestionsForDateQuery: () => suggestionsQuery,
}))
vi.mock('@/features/vida/hooks/useActivityFollowUps', () => ({
  useActivityDayFollowUpsQuery: () => dayFollowUpsQuery,
}))
// Los puntos de la tira: el hook tiene su propio test con `useQueries` de
// verdad; aquí importa a dónde llevan los siete enlaces.
vi.mock('@/features/vida/hooks/useVidaWeekPlans', () => ({
  useVidaWeekPlans: (dates: string[]) => ({
    byDate: Object.fromEntries(
      dates.map((date) => [
        date,
        { date, hasPlan: false, blockCount: 0, items: [], isPending: false, isError: false },
      ]),
    ),
    isPending: false,
    hasError: false,
    refetch: vi.fn(),
  }),
}))
vi.mock('@/features/settings/hooks/useUserSettings', () => ({
  useUserSettingsQuery: () => settingsQuery,
  useUpdateUserSettingsMutation: () => ({ mutate: vi.fn(), isPending: false, isError: false }),
}))

const FRIDAY = '2026-09-18'

function ready<T>(data: T): Query<T> {
  return { data, isPending: false, isError: false, fetchStatus: 'idle', refetch: vi.fn() }
}

function block(
  id: string,
  activityId: string,
  title: string,
  startTime: string,
  endTime: string,
): ActivityDayPlanItem {
  return {
    id,
    userId: 1,
    activityId,
    date: FRIDAY,
    startTime,
    endTime,
    orderIndex: 0,
    completedAt: null,
    createdAt: `${FRIDAY}T00:00:00.000Z`,
    updatedAt: `${FRIDAY}T00:00:00.000Z`,
    activity: { id: activityId, title, category: null },
  }
}

function session(
  id: string,
  activityId: string,
  title: string,
  startTime: string,
  durationMinutes: number | null,
): ActivityFollowUp {
  return {
    id,
    activityId,
    date: FRIDAY,
    startTime,
    durationMinutes,
    isOpen: durationMinutes === null,
    endTime: null,
    endDate: null,
    endDateTime: null,
    notes: null,
    activity: { id: activityId, title, category: null },
  }
}

/** El viernes del render: seis bloques, uno no hecho y dos cosas fuera del plan. */
const PLAN = [
  block('b1', 'a1', 'Bañarme', '07:00', '07:15'),
  block('b2', 'a2', 'Pasear a las mascotas', '07:30', '08:00'),
  block('b3', 'a3', 'Desayunar con calma', '08:30', '09:00'),
  block('b4', 'a4', 'Organizar la casa', '09:00', '09:45'),
  block('b5', 'a5', 'Leer un rato', '21:30', '22:00'),
]
const SESSIONS = [
  session('s1', 'a1', 'Bañarme', '07:04', 14),
  session('s2', 'a2', 'Pasear a las mascotas', '07:31', 41),
  session('s3', 'a7', 'Llamada con el banco', '08:15', 25),
  session('s4', 'a4', 'Organizar la casa', '09:05', 63),
]

const SETTINGS = {
  vidaDayStartTime: '06:30',
  vidaDayEndTime: '23:00',
} as unknown as UserSettings

function renderPage(search = '') {
  return renderWithProviders(<VidaRevisionPage />, {
    routerProps: { initialEntries: [`/app/vida/revision${search}`] },
  })
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  // Sábado 19 a las 9:24: el viernes 18 ya está cerrado.
  vi.setSystemTime(new Date(2026, 8, 19, 9, 24, 0))
  askedDates = []
  planQuery = ready(PLAN)
  suggestionsQuery = ready([])
  settingsQuery = ready(SETTINGS)
  dayFollowUpsQuery = ready(SESSIONS)
  useVidaDeviceNotesStore.setState({ blockNotes: {}, dismissedNoData: [] })
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

describe('la cabecera, la tira y el día que se abre (criterios 1, 2 y 3)', () => {
  it('deja de ser un cascarón: título «Revisión», la fecha y el estado del día', () => {
    renderPage()

    expect(screen.getByRole('heading', { level: 1, name: 'Revisión' })).toBeInTheDocument()
    expect(screen.getByText('Viernes 18 de septiembre · día cerrado')).toBeInTheDocument()
  })

  it('al entrar **sin `?d=`** se abre el último día cerrado (criterio 3)', () => {
    renderPage()

    expect(askedDates[0]).toBe(FRIDAY)
  })

  it('el `?d=` manda y es el que se pide (criterio 2)', () => {
    renderPage('?d=2026-09-16')

    expect(askedDates[0]).toBe('2026-09-16')
    expect(screen.getByText(/Miércoles 16 de septiembre/)).toBeInTheDocument()
  })

  it('la tira lleva a **la revisión** de cada día, no a Hoy (criterio 2)', () => {
    renderPage()

    const strip = screen.getByRole('navigation', { name: 'Elige el día' })
    const links = within(strip).getAllByRole('link')
    expect(links).toHaveLength(7)
    for (const link of links) {
      expect(link.getAttribute('href')).toMatch(/^\/app\/vida\/revision\?d=\d{4}-\d{2}-\d{2}$/)
    }
  })
})

describe('el día contado (criterios 6, 9, 10, 11, 13, 14, 16 y 18)', () => {
  it('la historia, la cifra grande y los minutos', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'La historia del día' })).toBeInTheDocument()
    expect(screen.getByText(/^Seguiste 3 de 5 bloques/)).toBeInTheDocument()
    const figures = screen.getByRole('region', { name: 'Las cifras del día' })
    expect(within(figures).getByText('3')).toBeInTheDocument()
    expect(within(figures).getByText('/ 5')).toBeInTheDocument()
    expect(within(figures).getByText('planeado')).toBeInTheDocument()
    // 15 + 30 + 30 + 45 + 30 = 150 min planeados; 14 + 41 + 25 + 63 = 143 registrados.
    expect(within(figures).getByText('2h 30')).toBeInTheDocument()
    expect(within(figures).getByText('2h 23')).toBeInTheDocument()
    expect(within(figures).getByText(/no hay dato, no se adivina/)).toBeInTheDocument()
    expect(within(figures).getByText('Sin registrar')).toBeInTheDocument()
  })

  it('plan frente a real, bloque a bloque y con el vocabulario de Hoy', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'Plan frente a real · 5 bloques' })).toBeInTheDocument()
    expect(screen.getByText('✓ calcado')).toBeInTheDocument()
    expect(screen.getByText('+11 min')).toBeInTheDocument()
    expect(screen.getByText('+18 min')).toBeInTheDocument()
    // El bloque que no tuvo sesión, con el día cerrado: «no hecho · sin razón».
    expect(screen.getAllByText('no hecho').length).toBeGreaterThan(0)
    expect(screen.getAllByText('sin razón').length).toBeGreaterThan(0)
  })

  it('«Fuera del plan» con su cuenta y sus minutos (criterio 16)', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'Fuera del plan · 1 · 25m' })).toBeInTheDocument()
    expect(screen.getByText('Llamada con el banco')).toBeInTheDocument()
    expect(screen.getByText('fuera del plan')).toBeInTheDocument()
  })

  it('las dos salidas son **enlaces a Hoy** de ese día, y no hay botón muerto (criterio 18)', () => {
    renderPage()

    const agenda = screen.getByRole('link', { name: 'Ver el día en la agenda' })
    const log = screen.getByRole('link', { name: 'Registrar tiempo pasado' })
    expect(agenda).toHaveAttribute('href', `/app/vida/hoy?d=${FRIDAY}`)
    expect(log).toHaveAttribute('href', `/app/vida/hoy?d=${FRIDAY}`)
    // **La revisión no escribe nada en esta tajada**: ni un botón en toda la
    // pantalla fuera de los enlaces (criterios 18 y 41).
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('un «no se pudo» trae su razón y dice que **vive en este aparato** (criterios 14 y 15)', () => {
    useVidaDeviceNotesStore
      .getState()
      .markBlockCouldNot(FRIDAY, 'b3', 'me fui directo a la llamada')
    renderPage()

    expect(screen.getByText('no se pudo')).toBeInTheDocument()
    expect(screen.getByText('«me fui directo a la llamada»')).toBeInTheDocument()
    expect(screen.getByText(/se guardan en este aparato: en otro no estarán/)).toBeInTheDocument()
  })

  it('sin ninguna razón, la línea del aparato **no se pinta**: no se dice lo que no toca', () => {
    renderPage()

    expect(screen.queryByText(/se guardan en este aparato/)).not.toBeInTheDocument()
  })
})

describe('los días raros (criterios 4, 5, 19, 20 y 21)', () => {
  it('un día **futuro** no se revisa: cero cifras y la salida a Hoy (criterio 4)', () => {
    planQuery = ready([])
    dayFollowUpsQuery = ready([])
    renderPage('?d=2026-09-25')

    expect(screen.getByText('Este día todavía no ha pasado')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Planearlo en Hoy' })).toHaveAttribute(
      'href',
      '/app/vida/hoy?d=2026-09-25',
    )
    expect(screen.queryByRole('region', { name: 'Las cifras del día' })).not.toBeInTheDocument()
    expect(screen.queryByText(/Seguiste/)).not.toBeInTheDocument()
  })

  it('**hoy, aún abierto**, se mira y no habla en pasado cerrado (criterio 5)', () => {
    planQuery = ready(PLAN)
    // Las sesiones son **de hoy**: `buildDayExecution` deja fuera las de otro
    // día, así que un sábado no se cuelan las del viernes.
    dayFollowUpsQuery = ready(
      SESSIONS.map((item) => ({ ...item, date: '2026-09-19' })),
    )
    renderPage('?d=2026-09-19')

    expect(screen.getByText(/Sábado 19 de septiembre · aún abierto/)).toBeInTheDocument()
    expect(screen.getByText(/^Hasta ahora llevas/)).toBeInTheDocument()
    expect(screen.queryByText(/Seguiste/)).not.toBeInTheDocument()
    expect(screen.getByText('Las cifras van hasta ahora.')).toBeInTheDocument()
  })

  it('un día **con plan y sin un solo registro**: el marco E, sin «Lo hice» (criterio 19)', () => {
    dayFollowUpsQuery = ready([])
    renderPage()

    expect(screen.getByText('De este día no quedó nada apuntado')).toBeInTheDocument()
    expect(
      screen.getByText(/Tenías 5 bloques planeados y no hay registros/),
    ).toBeInTheDocument()
    expect(screen.getByText('Si quieres, se rellena ahora — o se queda así.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Lo que tenías planeado' })).toBeInTheDocument()
    // Los «Lo hice» por bloque son de la tajada 3: no se pintan muertos.
    expect(screen.queryByText('Lo hice')).not.toBeInTheDocument()
    // Sin cifra grande, porque no hay nada que contar.
    expect(screen.queryByRole('region', { name: 'Las cifras del día' })).not.toBeInTheDocument()
  })

  it('un día **sin plan y con sesiones**: sin lista fantasma y sin «N de M» (criterio 20)', () => {
    planQuery = ready([])
    dayFollowUpsQuery = ready([
      session('s1', 'a1', 'Leer', '10:00', 60),
      session('s2', 'a2', 'Pasear', '12:00', 40),
    ])
    renderPage()

    expect(screen.getByText('Este día no tenía plan; registraste 2 cosas y 1h 40.')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Lo que tenías planeado' })).not.toBeInTheDocument()
    const figures = screen.getByRole('region', { name: 'Las cifras del día' })
    expect(within(figures).queryByText(/^\/ /)).not.toBeInTheDocument()
    expect(screen.getByText('Leer')).toBeInTheDocument()
  })

  it('un día **sin plan y sin nada**: una frase sin reproche (criterio 21)', () => {
    planQuery = ready([])
    dayFollowUpsQuery = ready([])
    renderPage()

    expect(screen.getByText('De este día no quedó nada apuntado')).toBeInTheDocument()
    expect(screen.getByText(/también es un día/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver el día en la agenda' })).toBeInTheDocument()
  })
})

describe('los estados (criterio 23)', () => {
  it('sin sesión: la vía para entrar, no un esqueleto girando', () => {
    planQuery = { isPending: true, isError: false, fetchStatus: 'idle', refetch: vi.fn() }
    suggestionsQuery = { isPending: true, isError: false, fetchStatus: 'idle', refetch: vi.fn() }
    settingsQuery = { isPending: true, isError: false, fetchStatus: 'idle', refetch: vi.fn() }
    dayFollowUpsQuery = { isPending: true, isError: false, fetchStatus: 'idle', refetch: vi.fn() }
    renderPage()

    expect(screen.getByText('Entra para ver cómo te fue')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toBeInTheDocument()
  })

  it('cargando: esqueletos, y **nada afirmado** todavía', () => {
    planQuery = { isPending: true, isError: false, fetchStatus: 'fetching', refetch: vi.fn() }
    renderPage()

    expect(screen.getByText('Cargando cómo fue tu día…')).toBeInTheDocument()
    expect(screen.queryByText(/no quedó nada apuntado/)).not.toBeInTheDocument()
  })

  it('**el plan** no cargó: su mensaje, con «Reintentar»', () => {
    planQuery = { isPending: false, isError: true, fetchStatus: 'idle', refetch: vi.fn() }
    renderPage()

    expect(screen.getByText('No pudimos cargar tu plan de ese día')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
    expect(screen.queryByText(/no quedó nada apuntado/)).not.toBeInTheDocument()
  })

  it('**lo vivido** no cargó: otro mensaje, y nunca «no quedó nada apuntado»', () => {
    dayFollowUpsQuery = { isPending: false, isError: true, fetchStatus: 'idle', refetch: vi.fn() }
    renderPage()

    expect(screen.getByText('No pudimos leer lo que viviste ese día')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
    expect(screen.queryByText(/no quedó nada apuntado/)).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Las cifras del día' })).not.toBeInTheDocument()
    // El plan sí se enseña, y sin afirmar «no hecho» de ninguno.
    expect(screen.getByRole('heading', { name: 'Lo que tenías planeado' })).toBeInTheDocument()
    expect(screen.queryByText('no hecho')).not.toBeInTheDocument()
  })
})

describe('el escritorio: los dos carriles (criterio 22)', () => {
  it('con ancho, **los carriles**; sin él, la lista compacta — nunca las dos', () => {
    const desktop = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('min-width'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
    const original = window.matchMedia
    window.matchMedia = desktop as unknown as typeof window.matchMedia
    try {
      renderPage()

      // Las cabeceras de los dos carriles y el panel de la izquierda.
      expect(screen.getByText('Planeado')).toBeInTheDocument()
      expect(screen.getByText('Real')).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Lo que no se hizo' })).toBeInTheDocument()
      // Lo de fuera del plan va **dentro** del carril real, sin sección aparte.
      expect(screen.queryByRole('heading', { name: /^Fuera del plan/ })).not.toBeInTheDocument()
      // Un tramo sin registrar ocupa su sitio en el carril real.
      expect(screen.getAllByText(/sin registrar/).length).toBeGreaterThan(0)
    } finally {
      window.matchMedia = original
    }
  })
})
