import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { UserSettings } from '@/features/settings/types/user-settings.types'
import { VidaRevisionPage } from '@/features/vida/pages/VidaRevisionPage'
import { useVidaDeviceNotesStore } from '@/features/vida/store/vida-device-notes.store'
import type { ActivityDayPlanItem } from '@/features/vida/types/activity-day-plan.types'
import type { ActivityFollowUp } from '@/features/vida/types/activity-followup.types'
import type { VidaItem, VidaSuggestion } from '@/features/vida/types/vida-item.types'
import { renderWithProviders } from '@/test/render'

/**
 * **La revisión de un día** (FEAT-006, tajadas 1, 2 y 3): criterios 1, 2, 3, 4,
 * 5, 6, 9, 10, 11, 13, 14, 15, 16, 18, 19, 20, 21, 22, 23, 26–34 y 35–44.
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

/**
 * **El espía de los criterios 35 y 41.** Las cuatro mutaciones del plan del día
 * se sustituyen por espías: si algún control de la revisión tocara el plan,
 * alguno de estos `mutate` se llamaría. Ninguno lo hace.
 */
const planSpies = {
  set: vi.fn(),
  add: vi.fn(),
  edit: vi.fn(),
  remove: vi.fn(),
}

function planMutationsCalled(): number {
  return Object.values(planSpies).reduce((total, spy) => total + spy.mock.calls.length, 0)
}

vi.mock('@/features/vida/hooks/useActivityDayPlan', () => ({
  useActivityDayPlanQuery: (date: string) => {
    askedDates.push(date)
    return planQuery
  },
  useSetActivityDayPlanMutation: () => ({ mutate: planSpies.set, isPending: false }),
  useAddDayPlanItemMutation: () => ({ mutate: planSpies.add, isPending: false }),
  useEditDayPlanItemMutation: () => ({ mutate: planSpies.edit, isPending: false }),
  useRemoveDayPlanItemMutation: () => ({ mutate: planSpies.remove, isPending: false }),
}))
/** La plantilla y su única escritura: **el puente** (tajada 4, criterio 57). */
let templateItems: VidaItem[]
const updateVidaItem = vi.fn()

vi.mock('@/features/vida/hooks/useVidaItems', () => ({
  useVidaSuggestionsForDateQuery: () => suggestionsQuery,
  useVidaItemsQuery: () => ({
    data: templateItems,
    isPending: false,
    isError: false,
    fetchStatus: 'idle',
    refetch: vi.fn(),
  }),
  useUpdateVidaItemMutation: () => ({
    mutate: updateVidaItem,
    mutateAsync: updateVidaItem,
    isPending: false,
    isError: false,
    isSuccess: false,
  }),
}))
/** Lo **único** que la revisión escribe: una sesión (`activityFollowUpAdd`). */
const createFollowUp = vi.fn()
let createFollowUpState = { isPending: false, isError: false }

/** Las sesiones de los 14 días del puente: **una** consulta de rango (A5). */
let bridgeSessions: { date: string; followUps: ActivityFollowUp[] }[]
/** Con qué rango se pidió, para comprobar que en la vista de día **no** se pide. */
let askedRanges: string[]

vi.mock('@/features/vida/hooks/useActivityFollowUps', () => ({
  useActivityDayFollowUpsQuery: () => dayFollowUpsQuery,
  useActivityFollowUpsInDatesQuery: (from: string, to: string) => {
    askedRanges.push(`${from}|${to}`)
    return {
      data: from ? bridgeSessions : undefined,
      isPending: false,
      isError: false,
      fetchStatus: from ? 'idle' : 'idle',
      refetch: vi.fn(),
    }
  },
  useCreateActivityFollowUpMutation: () => ({
    mutate: createFollowUp,
    mutateAsync: createFollowUp,
    ...createFollowUpState,
  }),
  // Las monta `VidaLogSessionSheet`, que se reutiliza tal cual.
  useUpdateActivityFollowUpMutation: () => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
  }),
}))
// Los puntos de la tira y los planes de la semana: el hook tiene su propio
// test con `useQueries` de verdad; aquí importa a dónde llevan los enlaces y
// qué plan ve cada día.
let weekPlanItems: Record<string, ActivityDayPlanItem[]>
let failingWeekDates: string[]
/** Con qué fechas se pidieron planes: es la cuenta de consultas del criterio 53. */
let askedPlanDates: string[][]

vi.mock('@/features/vida/hooks/useVidaWeekPlans', () => ({
  useVidaWeekPlans: (dates: string[]) => {
    askedPlanDates.push(dates)
    return {
      byDate: Object.fromEntries(
        dates.map((date) => {
          const items = weekPlanItems[date] ?? []
          return [
            date,
            {
              date,
              hasPlan: items.length > 0,
              blockCount: items.length,
              items,
              isPending: false,
              isError: failingWeekDates.includes(date),
            },
          ]
        }),
      ),
      isPending: false,
      hasError: dates.some((date) => failingWeekDates.includes(date)),
      refetch: vi.fn(),
    }
  },
}))
/** Las sesiones de los siete días de la semana vista (A4). */
let weekSessions: Record<string, ActivityFollowUp[]>
let askedWeekFollowUpDates: string[][]

vi.mock('@/features/vida/hooks/useVidaWeekFollowUps', () => ({
  useVidaWeekFollowUps: (dates: string[]) => {
    askedWeekFollowUpDates.push(dates)
    return {
      byDate: Object.fromEntries(
        dates.map((date) => [
          date,
          {
            date,
            followUps: weekSessions[date] ?? [],
            isPending: false,
            isError: false,
          },
        ]),
      ),
      isPending: false,
      hasError: false,
      refetch: vi.fn(),
    }
  },
}))
/**
 * **La ventana de seis semanas** de FEAT-007. Igual que los dos hooks de
 * arriba: sus consultas tienen su propio test (`useVidaHistoryWindow.test.tsx`,
 * que es donde se mide el coste del criterio 103) y aquí lo que importa es
 * **cuándo se monta** y qué se pinta con lo que devuelve.
 */
type HistoryDay = {
  date: string
  planItems: ActivityDayPlanItem[]
  followUps: ActivityFollowUp[]
  isPending?: boolean
  isError?: boolean
}
let historyDays: HistoryDay[]
let historyPending: boolean
let historyError: boolean
const historyRefetch = vi.fn()
/** Cada vez que la ventana se monta. **Vacío en «Un día» y en «La semana».** */
let historyMounts: { enabled: boolean; today: string }[]

vi.mock('@/features/vida/hooks/useVidaHistoryWindow', () => ({
  useVidaHistoryWindow: ({ enabled, today }: { enabled: boolean; today: string }) => {
    historyMounts.push({ enabled, today })
    const days = historyDays.map((day) => ({
      isPending: false,
      isError: false,
      ...day,
    }))
    return {
      dates: days.map((day) => day.date),
      from: days[0]?.date ?? '',
      to: days[days.length - 1]?.date ?? '',
      days,
      byDate: Object.fromEntries(days.map((day) => [day.date, day])),
      isPending: historyPending,
      hasError: historyError,
      refetch: historyRefetch,
    }
  },
}))
// El «qué» de la hoja: el catálogo tiene su propio test y aquí solo estorba
// (monta `useVidaQueryGuard`, que pide el proveedor de arranque de sesión).
vi.mock('@/features/vida/hooks/useActivities', () => ({
  useActivitiesQuery: () => ({ data: [], isPending: false, isError: false }),
}))
vi.mock('@/features/settings/hooks/useUserSettings', () => ({
  useUserSettingsQuery: () => settingsQuery,
  useUpdateUserSettingsMutation: () => ({ mutate: vi.fn(), isPending: false, isError: false }),
}))

const FRIDAY = '2026-09-18'

function ready<T>(data: T): Query<T> {
  return { data, isPending: false, isError: false, fetchStatus: 'idle', refetch: vi.fn() }
}

type CategoryRef = { id: string; name: string; color: string | null; icon: string | null }

function block(
  id: string,
  activityId: string,
  title: string,
  startTime: string,
  endTime: string,
  category: CategoryRef | null = null,
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
    activity: { id: activityId, title, category },
  }
}

function session(
  id: string,
  activityId: string,
  title: string,
  startTime: string,
  durationMinutes: number | null,
  category: CategoryRef | null = null,
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
    activity: { id: activityId, title, category },
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

/** Un bloque de cualquier día (los de arriba son del viernes del render). */
function blockOn(
  date: string,
  id: string,
  activityId: string,
  title: string,
  startTime: string,
  endTime: string,
): ActivityDayPlanItem {
  return { ...block(id, activityId, title, startTime, endTime), date, id: `${id}-${date}` }
}

function sessionOn(
  date: string,
  id: string,
  activityId: string,
  title: string,
  startTime: string,
  durationMinutes: number,
): ActivityFollowUp {
  return { ...session(id, activityId, title, startTime, durationMinutes), date, id: `${id}-${date}` }
}

/** «Leer un rato» a las 21:30 en la plantilla, de lunes a viernes. */
const LEER_ITEM: VidaItem = {
  id: 'i1',
  userId: 1,
  activityId: 'a5',
  days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  startTime: '21:30',
  durationMinutes: 30,
  notes: null,
  isActive: true,
  orderIndex: 0,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
  activity: { id: 'a5', title: 'Leer un rato', category: null },
}

/** Los cuatro días en que «Leer» estuvo puesto a las 21:30. */
const LEER_DATES = ['2026-09-15', '2026-09-16', '2026-09-17', '2026-09-18']

function bridgeData() {
  weekPlanItems = Object.fromEntries(
    LEER_DATES.map((date) => [
      date,
      [blockOn(date, 'bl', 'a5', 'Leer un rato', '21:30', '22:00')],
    ]),
  )
  // Solo una de las cuatro noches tuvo sesión, y fue a las 20:30: de ahí
  // sale la hora que se propone (criterio 56).
  bridgeSessions = LEER_DATES.map((date) => ({
    date,
    followUps:
      date === '2026-09-15' ? [sessionOn(date, 'sl', 'a5', 'Leer un rato', '20:30', 30)] : [],
  }))
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
  createFollowUp.mockReset()
  createFollowUpState = { isPending: false, isError: false }
  for (const spy of Object.values(planSpies)) spy.mockReset()
  useVidaDeviceNotesStore.setState({
    blockNotes: {},
    dismissedNoData: [],
    dismissedBridges: [],
    // FEAT-007: sin esto, un «Dejarlo» de un test calla la pregunta del
    // siguiente y el fallo parece de otra cosa.
    patternAnswers: {},
    // FEAT-012 tajada 4: lo mismo con la noche. Una noche confirmada en una
    // prueba le movería la ventana del día a la siguiente.
    nightLogs: {},
  })
  templateItems = []
  bridgeSessions = []
  askedRanges = []
  weekPlanItems = {}
  weekSessions = {}
  failingWeekDates = []
  askedPlanDates = []
  askedWeekFollowUpDates = []
  updateVidaItem.mockReset()
  historyDays = []
  historyPending = false
  historyError = false
  historyMounts = []
  historyRefetch.mockReset()
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

  it('«Ver el día en la agenda» sigue siendo **el enlace a Hoy** (criterio 18)', () => {
    renderPage()

    const agenda = screen.getByRole('link', { name: 'Ver el día en la agenda' })
    expect(agenda).toHaveAttribute('href', `/app/vida/hoy?d=${FRIDAY}`)
    // **Derogado por el criterio 37**: en la tajada 1 «Registrar tiempo pasado»
    // era un enlace a Hoy y la pantalla no tenía **ni un botón**. Desde la
    // tajada 3 registra **aquí mismo**, así que ahora se afirma lo contrario:
    // es un botón y ya no lleva a ninguna parte.
    expect(screen.queryByRole('link', { name: 'Registrar tiempo pasado' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Registrar tiempo pasado' }).length).toBe(2)
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

  it('sin razones **y sin nada que dejar así**, la línea del aparato no se pinta', () => {
    // Un día entero registrado: ni «no se pudo» ni tramos que preguntar, así
    // que no se dice lo que no toca. (En un día con tramos **sí** se dice,
    // porque «Dejarlo así» también vive en el aparato: criterio 15.)
    planQuery = ready([block('b1', 'a1', 'Vivir el día', '06:30', '23:00')])
    dayFollowUpsQuery = ready([session('s1', 'a1', 'Vivir el día', '06:30', 990)])
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
    // **Derogado por el criterio 36**: en la tajada 1 la lista fantasma no
    // tenía botones. Ahora cada bloque estrena su «Lo hice», que es la forma
    // más barata de rellenar un día a posteriori.
    expect(screen.getAllByRole('button', { name: 'Lo hice' })).toHaveLength(5)
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

describe('en qué se repartió el día (criterios 26, 27, 28, 29, 32 y 33)', () => {
  const CASA = { id: 'c-casa', name: 'Casa', color: '#7C3AED', icon: 'house' }
  const COMIDA = { id: 'c-comida', name: 'Comida', color: '#10B981', icon: 'utensils' }

  function withCategories() {
    planQuery = ready([
      block('b1', 'a1', 'Organizar la casa', '09:00', '09:45', CASA),
      block('b2', 'a2', 'Desayunar con calma', '08:30', '09:00', COMIDA),
      block('b3', 'a3', 'Leer un rato', '21:30', '22:00'),
    ])
    dayFollowUpsQuery = ready([
      session('s1', 'a1', 'Organizar la casa', '09:05', 63, CASA),
      session('s2', 'a9', 'Recoger la cocina', '16:00', 120, CASA),
    ])
  }

  it('dos barras por categoría, con su cabecera de dos magnitudes (criterio 26)', () => {
    withCategories()
    renderPage()

    expect(screen.getByRole('heading', { name: 'Minutos por categoría' })).toBeInTheDocument()
    const categorias = screen.getByRole('region', { name: 'Minutos por categoría' })
    expect(within(categorias).getByText('Casa')).toBeInTheDocument()
    // Planeado → registrado: 45m de plan, 3h 3 registradas (63 + 120 de fuera).
    expect(within(categorias).getByText(/45m →/)).toBeInTheDocument()
    expect(within(categorias).getByText('3h 3')).toBeInTheDocument()
    expect(within(categorias).getAllByText('planeado').length).toBe(3)
    expect(within(categorias).getAllByText('registrado').length).toBe(3)
  })

  it('«Sin categoría» tiene **su propia fila** (criterio 27)', () => {
    withCategories()
    renderPage()

    expect(screen.getByText('Sin categoría')).toBeInTheDocument()
  })

  it('«Sin registrar» es una fila más, con su frase literal (criterio 28)', () => {
    withCategories()
    renderPage()

    expect(
      screen.getByText(
        /No se reparte entre categorías ni se adivina: si quieres, se rellena registrando/,
      ),
    ).toBeInTheDocument()
    expect(screen.getByText(/de las 16h 30 de tu día\./)).toBeInTheDocument()
  })

  /**
   * **Criterio 285** (FEAT-012, tajada 2): la revisión usa **la misma ventana**
   * que Hoy. Con noche puesta, «de las Xh de tu día» deja de meter dentro las
   * horas de sueño: la cifra baja, se sigue llamando igual y sigue sin una
   * palabra de reproche. Si no, la revisión llamaría «sin registrar» a un rato
   * en el que estabas durmiendo, que es una mentira nueva.
   */
  it('con noche puesta, «de tu día» ya no incluye las horas de sueño (criterio 285)', () => {
    withCategories()
    settingsQuery = ready({
      ...SETTINGS,
      vidaNightBedTime: '23:00',
      vidaNightWakeTime: '05:00',
      vidaNightDays: [
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday',
      ],
    } as unknown as UserSettings)
    renderPage()

    // 5:00 → 23:00 son 18 h, no las 16h 30 de «Tu día»… ni las 24 del reloj.
    expect(screen.getByText(/de las 18h de tu día\./)).toBeInTheDocument()
    expect(screen.queryByText(/de las 16h 30 de tu día\./)).not.toBeInTheDocument()
    // Y la frase sigue siendo la misma, sin una palabra de más.
    expect(
      screen.getByText(
        /No se reparte entre categorías ni se adivina: si quieres, se rellena registrando/,
      ),
    ).toBeInTheDocument()
  })

  /**
   * **Criterio 308** (tajada 4): confirmar un día pasado recalcula **su**
   * revisión, igual que si se hubiera confirmado ese día. La ventana de la
   * revisión sale del mismo sitio que la de Hoy, así que basta con que lo real
   * esté guardado: no hay ninguna segunda cuenta que actualizar.
   */
  it('con la noche confirmada, «de tu día» sale de la hora real de levantarse (308)', () => {
    withCategories()
    settingsQuery = ready({
      ...SETTINGS,
      vidaNightBedTime: '23:00',
      vidaNightWakeTime: '05:00',
      vidaNightDays: [
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday',
      ],
    } as unknown as UserSettings)
    // El viernes 18 te levantaste a las 7:00, no a las 5:00 que dice tu noche.
    useVidaDeviceNotesStore.getState().setNightLog('2026-09-18', {
      bedTime: '23:00',
      wakeTime: '07:00',
      confirmedAt: '2026-09-19T08:00:00.000Z',
    })
    renderPage()

    // 7:00 → 23:00 son 16 h: dos menos que con la noche planeada (18 h).
    expect(screen.getByText(/de las 16h de tu día\./)).toBeInTheDocument()
    expect(screen.queryByText(/de las 18h de tu día\./)).not.toBeInTheDocument()
  })


  it('ni un porcentaje, ni la palabra «cumplimiento» en toda la pantalla (criterio 29)', () => {
    withCategories()
    const { container } = renderPage()

    expect(container.textContent).not.toMatch(/%/)
    expect(container.textContent).not.toMatch(/cumplimiento/i)
  })

  it('los tramos más largos sin registrar, con su franja y su tamaño (criterio 31)', () => {
    withCategories()
    renderPage()

    expect(
      screen.getByRole('heading', { name: 'Los cuatro tramos más largos sin registrar' }),
    ).toBeInTheDocument()
    expect(screen.getByText('6:30 – 8:30')).toBeInTheDocument()
    // **Derogado por el criterio 38**: cada tramo estrena sus dos salidas.
    expect(screen.getAllByRole('button', { name: '¿Qué pasó?' }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: 'Dejarlo así' }).length).toBeGreaterThan(0)
  })

  it('sin tramos por encima del umbral, **la sección no se pinta** (criterio 32)', () => {
    planQuery = ready([block('b1', 'a1', 'Vivir el día', '06:30', '23:00', CASA)])
    dayFollowUpsQuery = ready([session('s1', 'a1', 'Vivir el día', '06:30', 990, CASA)])
    renderPage()

    expect(screen.queryByRole('heading', { name: /tramos más largos sin registrar/ })).not.toBeInTheDocument()
    expect(screen.queryByText(/no hay tramos/i)).not.toBeInTheDocument()
  })

  it('cargando no se afirma ningún reparto (criterio 34)', () => {
    planQuery = { isPending: true, isError: false, fetchStatus: 'fetching', refetch: vi.fn() }
    renderPage()

    expect(screen.queryByRole('heading', { name: 'Minutos por categoría' })).not.toBeInTheDocument()
  })

  it('con **lo vivido caído** tampoco se reparte nada, y el error manda (criterio 34)', () => {
    withCategories()
    dayFollowUpsQuery = { isPending: false, isError: true, fetchStatus: 'idle', refetch: vi.fn() }
    renderPage()

    expect(screen.getByText('No pudimos leer lo que viviste ese día')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Minutos por categoría' })).not.toBeInTheDocument()
  })
})

/**
 * **La revisión rellena el día** (tajada 3): criterios 35, 36, 37, 38, 39, 40,
 * 41, 42, 43 y 44.
 *
 * Lo que se vigila aquí es **qué se escribe**: una sesión y nada más. Las cuatro
 * mutaciones del plan del día están espiadas arriba (`planSpies`), así que si
 * cualquiera de estos controles tocara el plan, se vería.
 */
describe('la revisión rellena el día (criterios 35–44)', () => {
  it('**«Lo hice»** en un bloque no hecho escribe la sesión planeada (criterio 35)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderPage()

    // El primer bloque sin sesión del viernes: «Desayunar con calma», 8:30, 30 min.
    const [primero] = screen.getAllByRole('button', { name: 'Lo hice' })
    await user.click(primero!)

    expect(createFollowUp).toHaveBeenCalledTimes(1)
    expect(createFollowUp).toHaveBeenCalledWith({
      activityId: 'a3',
      date: FRIDAY,
      startTime: '08:30',
      durationMinutes: 30,
      notes: null,
    })
    // **Y el plan no se tocó** (criterios 35 y 41).
    expect(planMutationsCalled()).toBe(0)
  })

  it('«Lo hice» **recorta a ahora** en el día de hoy, igual que en Hoy (criterio 35)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    // Sábado 19 a las 9:24, con un bloque de 9:00 a 10:00 ya empezado: la
    // sesión nace de 36 min, no de 60 — es `plannedSessionMinutes`, la misma
    // función de Hoy, no una copia.
    planQuery = ready([
      { ...block('b9', 'a9', 'Organizar la casa', '09:00', '10:00'), date: '2026-09-19' },
    ])
    dayFollowUpsQuery = ready([])
    renderPage('?d=2026-09-19')

    const [primero] = screen.getAllByRole('button', { name: 'Lo hice' })
    await user.click(primero!)

    expect(createFollowUp).toHaveBeenCalledWith(
      expect.objectContaining({ startTime: '09:00', durationMinutes: 24 }),
    )
    expect(planMutationsCalled()).toBe(0)
  })

  it('la **lista fantasma** de un día sin registros estrena su «Lo hice» (criterio 36)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    dayFollowUpsQuery = ready([])
    renderPage()

    const botones = screen.getAllByRole('button', { name: 'Lo hice' })
    expect(botones).toHaveLength(5)
    await user.click(botones[0]!)

    expect(createFollowUp).toHaveBeenCalledWith(
      expect.objectContaining({ activityId: 'a1', startTime: '07:00', durationMinutes: 15 }),
    )
    expect(planMutationsCalled()).toBe(0)
  })

  it('**«Registrar tiempo pasado»** abre la hoja **sin salir** de la revisión (criterio 37)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderPage()

    await user.click(screen.getAllByRole('button', { name: 'Registrar tiempo pasado' })[0]!)

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    // Sigue siendo la revisión: la cabecera no se movió.
    expect(screen.getByRole('heading', { level: 1, name: 'Revisión' })).toBeInTheDocument()
    expect(planMutationsCalled()).toBe(0)
  })

  it('**«¿Qué pasó?»** de un tramo abre la hoja con **su hora ya puesta** (criterio 38)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderPage()

    const [primero] = screen.getAllByRole('button', { name: '¿Qué pasó?' })
    await user.click(primero!)

    const hoja = await screen.findByRole('dialog')
    // La hora con la que abre la hoja es **la del tramo**, no la de ahora ni la
    // de «media hora antes»: se lee de la propia franja que se tocó.
    const franja = primero!.closest('li')!.textContent ?? ''
    const [hora, minuto] = franja.match(/(\d{1,2}):(\d{2})/)!.slice(1)
    const esperada = `${hora!.padStart(2, '0')}:${minuto}`
    expect(within(hoja).getByLabelText('Hora a la que empezó')).toHaveValue(esperada)
    expect(planMutationsCalled()).toBe(0)
  })

  it('**«Dejarlo así»** usa el store del aparato y **no vuelve a preguntar** (criterio 38)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const { unmount } = renderPage()

    const antes = screen.getAllByRole('button', { name: 'Dejarlo así' }).length
    await user.click(screen.getAllByRole('button', { name: 'Dejarlo así' })[0]!)

    expect(screen.getAllByRole('button', { name: 'Dejarlo así' })).toHaveLength(antes - 1)
    expect(screen.getByText('Lo dejaste así.')).toBeInTheDocument()
    // Ni una escritura: esto vive en el aparato, no en el API.
    expect(createFollowUp).not.toHaveBeenCalled()
    expect(planMutationsCalled()).toBe(0)

    // Y al volver a montar la pantalla **sigue dejado así**.
    unmount()
    renderPage()
    expect(screen.getByText('Lo dejaste así.')).toBeInTheDocument()
  })

  it('el marco E trae **las tres salidas con el mismo peso visual** (criterio 39)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    dayFollowUpsQuery = ready([])
    renderPage()

    const registrar = screen.getAllByRole('button', { name: 'Registrar tiempo pasado' })[0]!
    const quePaso = screen.getByRole('button', { name: '¿Qué pasó?' })
    const dejarlo = screen.getByRole('button', { name: 'Dejarlo así' })
    // **Misma `className`**: ninguna destacada sobre las otras.
    expect(registrar.className).toBe(quePaso.className)
    expect(quePaso.className).toBe(dejarlo.className)

    // «Dejarlo así» cierra el asunto **del día entero**.
    await user.click(dejarlo)
    expect(screen.queryByRole('button', { name: '¿Qué pasó?' })).not.toBeInTheDocument()
    expect(screen.getByText('Lo dejaste así.')).toBeInTheDocument()
    expect(createFollowUp).not.toHaveBeenCalled()
    expect(planMutationsCalled()).toBe(0)
  })

  it('lo registrado **se recalcula sin recargar** (criterio 40)', () => {
    const { unmount } = renderPage()
    const figures = screen.getByRole('region', { name: 'Las cifras del día' })
    expect(within(figures).getByText('3')).toBeInTheDocument()

    // Lo que la invalidación de `followUps.day(date)` trae de vuelta: una
    // sesión más para el bloque que faltaba. La pantalla la cuenta sola.
    unmount()
    dayFollowUpsQuery = ready([...SESSIONS, session('s5', 'a3', 'Desayunar con calma', '08:30', 30)])
    renderPage()

    const despues = screen.getByRole('region', { name: 'Las cifras del día' })
    expect(within(despues).getByText('4')).toBeInTheDocument()
    expect(screen.getByText(/^Seguiste 4 de 5 bloques/)).toBeInTheDocument()
  })

  it('un **día futuro** no ofrece ninguna de estas salidas (criterio 42)', () => {
    planQuery = ready([])
    dayFollowUpsQuery = ready([])
    renderPage('?d=2026-09-25')

    expect(screen.queryByRole('button', { name: 'Lo hice' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Registrar tiempo pasado' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '¿Qué pasó?' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Dejarlo así' })).not.toBeInTheDocument()
  })

  it('un **día pasado** sí las ofrece, como en Hoy (criterio 42)', () => {
    renderPage('?d=2026-09-16')

    expect(screen.getAllByRole('button', { name: 'Registrar tiempo pasado' }).length).toBeGreaterThan(0)
  })

  it('si la escritura **falla**, se dice y sin reprochar (criterio 43)', () => {
    createFollowUpState = { isPending: false, isError: true }
    renderPage()

    expect(screen.getByText('No pudimos guardar eso')).toBeInTheDocument()
    expect(screen.getByText(/Se quedó sin apuntar/)).toBeInTheDocument()
    // Lo elegido no se pierde: la pantalla sigue entera y el plan sigue intacto.
    expect(screen.getByRole('heading', { name: /^Plan frente a real/ })).toBeInTheDocument()
    expect(planMutationsCalled()).toBe(0)
  })

  it('**toda cifra de lo que no salió lleva su salida al lado** (criterio 44)', () => {
    renderPage()

    // «Sin registrar», dentro de la propia tarjeta de las cifras.
    const figures = screen.getByRole('region', { name: 'Las cifras del día' })
    expect(within(figures).getByRole('button', { name: 'Registrar tiempo pasado' })).toBeInTheDocument()
    // Y cada bloque que no salió, con el suyo en su fila.
    expect(screen.getAllByRole('button', { name: 'Lo hice' }).length).toBe(2)
  })

  it('en toda la pantalla **no se toca el plan**, haga lo que haga (criterio 41)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderPage()

    await user.click(screen.getAllByRole('button', { name: 'Lo hice' })[0]!)
    await user.click(screen.getAllByRole('button', { name: 'Dejarlo así' })[0]!)
    await user.click(screen.getAllByRole('button', { name: 'Registrar tiempo pasado' })[0]!)
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())

    expect(planMutationsCalled()).toBe(0)
  })
})

/* ── Tajada 4: la semana y el puente (criterios 45–60) ──────────────────── */

async function openWeek(user: ReturnType<typeof userEvent.setup>) {
  // La sección se abre desde el control de tres pestañas que estrena
  // FEAT-007 (criterio 64); antes era un botón suelto que decía lo mismo.
  await user.click(screen.getByRole('tab', { name: 'La semana' }))
}

/** Las siete filas de la semana, **no** los siete enlaces de la tira. */
function weekList(): HTMLElement {
  return screen.getByRole('list', { name: 'Día a día' })
}

describe('la semana (criterios 45, 46, 47, 48, 49, 51 y 53)', () => {
  it('**no se pide nada de la semana en la vista de día**: es un estado, no otra pantalla', () => {
    renderPage()

    // La lista de sesiones de la semana entra **vacía**: `useQueries` no monta
    // ninguna consulta hasta que la semana se abre (A4, criterio 53).
    expect(askedWeekFollowUpDates.at(-1)).toEqual([])
    // Y el rango del puente tampoco se pide: no hay sección montada.
    expect(askedRanges).toEqual([])
  })

  it('«La semana» enseña **siete filas** y se vuelve sin salir de la pantalla (45, 46)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    weekPlanItems = { [FRIDAY]: PLAN }
    weekSessions = { [FRIDAY]: SESSIONS }
    renderPage()

    await openWeek(user)

    expect(screen.getByRole('heading', { name: 'Tu semana' })).toBeInTheDocument()
    expect(screen.getByText('14 – 20 de septiembre')).toBeInTheDocument()
    expect(within(weekList()).getAllByRole('link')).toHaveLength(7)
    // La cabecera sigue siendo «Revisión»: ni ruta nueva ni píldora nueva.
    expect(screen.getByRole('heading', { level: 1, name: 'Revisión' })).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Un día' }))
    expect(screen.getByText('Viernes 18 de septiembre · día cerrado')).toBeInTheDocument()
  })

  it('cada fila lleva su titular, su barrita y «registrado de planeado», y **enlaza a ese día** (47, 49)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    weekPlanItems = { [FRIDAY]: PLAN }
    weekSessions = { [FRIDAY]: SESSIONS }
    renderPage()
    await openWeek(user)

    const friday = within(weekList()).getByRole('link', { name: /^viernes 18 ·/ })
    expect(within(friday).getByText('3 de 5')).toBeInTheDocument()
    expect(friday).toHaveAttribute('href', `/app/vida/revision?d=${FRIDAY}`)
    // Un día sin dato dice «—», nunca «0».
    const monday = within(weekList()).getByRole('link', { name: /^lunes 14 ·/ })
    expect(within(monday).getByText('—')).toBeInTheDocument()
    expect(within(monday).getByText('Sin plan')).toBeInTheDocument()
  })

  it('la **leyenda de los cuatro colores** y la frase de la semana (48, 50)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    weekPlanItems = { [FRIDAY]: PLAN }
    weekSessions = { [FRIDAY]: SESSIONS }
    renderPage()
    await openWeek(user)

    for (const label of ['seguido', 'de más', 'fuera del plan', 'sin registrar']) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
    expect(screen.getByText(/^Seguiste 3 de 5 bloques esta semana\.$/)).toBeInTheDocument()
  })

  it('**un día que no cargó lo dice** y la semana ofrece «Reintentar» (52, 60)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    failingWeekDates = ['2026-09-16']
    renderPage()
    await openWeek(user)

    const broken = within(weekList()).getByRole('link', { name: /^miércoles 16 ·/ })
    expect(within(broken).getByText('No pudimos cargar este día')).toBeInTheDocument()
    expect(within(broken).queryByText('Sin plan')).not.toBeInTheDocument()
    expect(screen.getByText('Falta algún día de la semana')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Reintentar' }).length).toBeGreaterThan(0)
  })

  it('con la semana cargada **la tira estrena el punto de tres estados** (51)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    weekPlanItems = {
      [FRIDAY]: PLAN,
      '2026-09-17': [blockOn('2026-09-17', 'b9', 'a1', 'Bañarme', '07:00', '07:15')],
    }
    weekSessions = {
      [FRIDAY]: SESSIONS,
      '2026-09-17': [sessionOn('2026-09-17', 's9', 'a1', 'Bañarme', '07:02', 15)],
    }
    renderPage()

    // Antes de abrir la semana, el punto es el de Hoy.
    expect(screen.getByRole('link', { name: /viernes 18.*con plan/ })).toBeInTheDocument()

    await openWeek(user)

    expect(screen.getByRole('link', { name: /jueves 17.*seguido entero/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /viernes 18.*seguido a medias/ })).toBeInTheDocument()
  })
})

describe('el puente a la plantilla (criterios 54, 57, 58 y 59)', () => {
  it('**sin plantilla no se pinta nada** (59)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderPage()
    await openWeek(user)

    expect(screen.queryByText('Lo que esto sugiere para tu plantilla')).not.toBeInTheDocument()
    // Y ni siquiera se pregunta al API por los 14 días.
    expect(askedRanges.every((range) => range === '|')).toBe(true)
  })

  it('con base, **pregunta** con su porqué y su consecuencia antes de confirmar (54, 57)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    templateItems = [LEER_ITEM]
    bridgeData()
    renderPage()
    await openWeek(user)

    expect(screen.getByText('Lo que esto sugiere para tu plantilla')).toBeInTheDocument()
    expect(screen.getByText('Leer un rato · 21:30')).toBeInTheDocument()
    expect(
      screen.getByText('3 de las últimas 4 noches no llegó a esa hora'),
    ).toBeInTheDocument()
    expect(screen.getByText(/¿Lo movemos a las/)).toHaveTextContent(
      '¿Lo movemos a las 20:30 en tu plantilla?',
    )
    expect(screen.getByText(/se mueve en todos/)).toBeInTheDocument()
    // Los 14 días se piden **en una sola consulta de rango** (A5).
    expect(askedRanges.at(-1)).toBe('2026-09-05|2026-09-18')
  })

  it('«Moverlo» escribe **solo en la plantilla**: `{ id, startTime }` y **cero** mutaciones del plan (57)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    templateItems = [LEER_ITEM]
    bridgeData()
    renderPage()
    await openWeek(user)

    await user.click(screen.getByRole('button', { name: 'Moverlo a las 20:30' }))

    expect(updateVidaItem).toHaveBeenCalledTimes(1)
    expect(updateVidaItem.mock.calls[0]![0]).toEqual({ id: 'i1', startTime: '20:30' })
    expect(planMutationsCalled()).toBe(0)
    expect(createFollowUp).not.toHaveBeenCalled()
  })

  it('«Dejarlo como está» cierra el aviso y **no vuelve esa semana** (58)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    templateItems = [LEER_ITEM]
    bridgeData()
    const first = renderPage()
    await openWeek(user)

    await user.click(screen.getByRole('button', { name: 'Dejarlo como está' }))

    expect(screen.queryByText('Lo que esto sugiere para tu plantilla')).not.toBeInTheDocument()
    expect(updateVidaItem).not.toHaveBeenCalled()
    expect(planMutationsCalled()).toBe(0)

    // Y sigue dejado así tras desmontar y volver a montar: es el aparato.
    first.unmount()
    renderPage()
    await openWeek(user)
    expect(screen.queryByText('Lo que esto sugiere para tu plantilla')).not.toBeInTheDocument()
  })

  it('contestada ya en «Lo que se repite», **el puente no la vuelve a hacer** (83)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    templateItems = [LEER_ITEM]
    bridgeData()
    // El puente propone 21:30 → 20:30, es decir −60 min. La respuesta guardada
    // hablaba de −55: **es la misma pregunta**, y ya está contestada.
    useVidaDeviceNotesStore.setState({
      patternAnswers: {
        'start-time|i1': { answeredOn: '2026-09-19', offsetMinutes: -55, dayOfWeek: null },
      },
    })
    renderPage()
    await openWeek(user)

    expect(screen.queryByText('Lo que esto sugiere para tu plantilla')).not.toBeInTheDocument()
  })

  it('…pero si el desfase se movió 10 min o más, **el puente vuelve** (D1)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    templateItems = [LEER_ITEM]
    bridgeData()
    // Contestó a un −5; ahora la propuesta es −60: pregunta nueva.
    useVidaDeviceNotesStore.setState({
      patternAnswers: {
        'start-time|i1': { answeredOn: '2026-09-19', offsetMinutes: -5, dayOfWeek: null },
      },
    })
    renderPage()
    await openWeek(user)

    expect(screen.getByText('Lo que esto sugiere para tu plantilla')).toBeInTheDocument()
  })

  it('ni el puente ni la semana traen un botón con palabra de culpa', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    templateItems = [LEER_ITEM]
    bridgeData()
    const { container } = renderPage()
    await openWeek(user)

    const text = (container.textContent ?? '').toLowerCase()
    for (const word of ['desperdici', 'fallaste', 'perdiste', 'deberías', 'cumplimiento', '%']) {
      expect(text).not.toContain(word)
    }
  })
})

/**
 * **«Lo que se repite»** (FEAT-007, tajada 1): criterios 64, 65, 66, 67, 68,
 * 69, 71, 72 y 73.
 *
 * La aritmética tiene su test puro en `utils/vida-adherence.utils.test.ts` y
 * el coste de la ventana, el suyo en `hooks/useVidaHistoryWindow.test.tsx`.
 * Aquí se comprueba lo que solo se ve montando la pantalla: que el control
 * tiene tres secciones, que **la ventana no se monta hasta abrir la suya**, y
 * que lo que se lee no lleva ni un porcentaje suelto ni una palabra de bronca.
 */
describe('Revisión · Lo que se repite (FEAT-007, tajada 1)', () => {
  function pad(n: number): string {
    return String(n).padStart(2, '0')
  }

  /** Un día con `planned` bloques, de los que `followed` se siguieron. */
  function historyDay(date: string, planned: number, followed: number): HistoryDay {
    return {
      date,
      planItems: Array.from({ length: planned }, (_, index) =>
        blockOn(date, `hp${index}`, `ad${index}`, `Cosa ${index}`, `${pad(8 + index)}:00`, `${pad(8 + index)}:30`),
      ),
      followUps: Array.from({ length: followed }, (_, index) =>
        sessionOn(date, `hs${index}`, `ad${index}`, `Cosa ${index}`, `${pad(8 + index)}:00`, 30),
      ),
    }
  }

  /** Cuatro días de cinco bloques desde el lunes, con `followed` seguidos. */
  function historyWeek(monday: string, followed: number): HistoryDay[] {
    const day = Number(monday.slice(8))
    return Array.from({ length: 4 }, (_, index) =>
      historyDay(`${monday.slice(0, 8)}${pad(day + index)}`, 5, followed),
    )
  }

  async function openPatterns(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole('tab', { name: 'Lo que se repite' }))
  }

  it('la pantalla tiene **tres** secciones y cambiar de una a otra no mueve la URL (64)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderPage('?d=2026-09-18')

    const tabs = screen.getAllByRole('tab')
    expect(tabs.map((tab) => tab.textContent)).toEqual(['Un día', 'La semana', 'Lo que se repite'])

    await openPatterns(user)
    expect(screen.getByRole('heading', { name: 'Lo que se repite' })).toBeInTheDocument()
    // Ni ruta nueva, ni `?d=` tocado, ni píldora nueva: la cabecera es la
    // misma y el día visto sigue siendo el de la URL —el enrutador es de
    // memoria, así que lo que se comprueba es qué fecha se pide y que volver
    // a «Un día» devuelve exactamente el mismo día, sin recargar nada.
    expect(screen.getByRole('heading', { level: 1, name: 'Revisión' })).toBeInTheDocument()
    expect(new Set(askedDates)).toEqual(new Set(['2026-09-18']))

    await user.click(screen.getByRole('tab', { name: 'Un día' }))
    expect(screen.getByText('Viernes 18 de septiembre · día cerrado')).toBeInTheDocument()
    expect(new Set(askedDates)).toEqual(new Set(['2026-09-18']))
  })

  it('la ventana de seis semanas **no se monta** hasta abrir su sección (A5, 103)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    weekPlanItems = { [FRIDAY]: PLAN }
    weekSessions = { [FRIDAY]: SESSIONS }
    renderPage()

    expect(historyMounts).toHaveLength(0)

    // Tampoco con «La semana» abierta: esa sección cuesta lo de ayer.
    await user.click(screen.getByRole('tab', { name: 'La semana' }))
    expect(historyMounts).toHaveLength(0)

    await openPatterns(user)
    expect(historyMounts.length).toBeGreaterThan(0)
    expect(historyMounts[0]).toEqual({ enabled: true, today: '2026-09-19' })
  })

  it('con dos semanas cuenta la adherencia en fracción, y el porcentaje va al lado (65, 66, 67)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    historyDays = [...historyWeek('2026-08-31', 4), ...historyWeek('2026-09-07', 4)]
    const { container } = renderPage()

    await openPatterns(user)

    expect(screen.getByText('De cada 10 bloques que planeas, sigues 8.')).toBeInTheDocument()
    expect(
      screen.getByText(/Con 2 semanas de datos\. Las semanas con menos de 3 días planeados/),
    ).toBeInTheDocument()
    expect(screen.getAllByText('16/20')).toHaveLength(2)

    // **Ningún porcentaje sin su fracción**: cada nodo con «%» convive con una
    // fracción en su misma caja.
    const conPorcentaje = [...container.querySelectorAll('*')].filter(
      (node) => node.children.length === 0 && /%/.test(node.textContent ?? ''),
    )
    expect(conPorcentaje).toHaveLength(2)
    for (const node of conPorcentaje) {
      expect(node.parentElement?.textContent ?? '').toMatch(/\d+\/\d+/)
    }
  })

  it('un día de la semana con menos de tres semanas dice cuántas lleva, no «0/0» (69)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    historyDays = [...historyWeek('2026-08-31', 4), ...historyWeek('2026-09-07', 4)]
    const { container } = renderPage()

    await openPatterns(user)

    const rejilla = screen.getByRole('list', { name: 'Por día de la semana' })
    expect(within(rejilla).getAllByText('2 sem')).toHaveLength(4)
    expect(within(rejilla).getAllByText('0 sem')).toHaveLength(3)
    expect(container.textContent).not.toContain('0/0')
    expect(container.textContent).toContain('a partir de 3 se puede hablar de')
  })

  it('con una sola semana no hay barras a cero: hay espera con fechas de verdad (71)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    historyDays = historyWeek('2026-09-07', 4)
    const { container } = renderPage()

    await openPatterns(user)

    expect(screen.getByText('Llevas 4 días con plan.')).toBeInTheDocument()
    expect(screen.getByText('Lo que llega después')).toBeInTheDocument()
    expect(
      screen.getByText('A partir de 2 semanas completas · te falta 1, la del 14 al 20 de septiembre'),
    ).toBeInTheDocument()
    expect(screen.getByText('A partir de 3 semanas · llevas 4 días de 21')).toBeInTheDocument()
    expect(screen.queryByRole('list', { name: 'Semana a semana' })).not.toBeInTheDocument()
    expect(container.textContent).not.toContain('%')
  })

  it('mientras no llega nada hay esqueletos, no cifras a cero (72)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    historyPending = true
    historyDays = [
      { date: '2026-09-14', planItems: [], followUps: [], isPending: true },
      { date: '2026-09-15', planItems: [], followUps: [], isPending: true },
    ]
    renderPage()

    await openPatterns(user)

    expect(screen.getByText('Mirando tus últimas semanas…')).toBeInTheDocument()
    expect(screen.queryByText(/De cada 10 bloques/)).not.toBeInTheDocument()
  })

  it('una consulta caída se dice con «Reintentar» y **no afirma que no hay datos** (72)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    historyError = true
    historyDays = [
      ...historyWeek('2026-08-31', 4),
      ...historyWeek('2026-09-07', 4),
      { date: '2026-09-14', planItems: [], followUps: [], isError: true },
    ]
    const { container } = renderPage()

    await openPatterns(user)

    expect(screen.getByText('Falta algún día de estas semanas')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(historyRefetch).toHaveBeenCalledTimes(1)
    // Lo que sí llegó se sigue contando: la sección no se apaga entera.
    expect(screen.getByText('De cada 10 bloques que planeas, sigues 8.')).toBeInTheDocument()
    expect(container.textContent).not.toContain('no tienes datos')
  })

  it('no hay una sola palabra de reproche en toda la sección (73)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    historyDays = [...historyWeek('2026-08-31', 1), ...historyWeek('2026-09-07', 0)]
    const { container } = renderPage()

    await openPatterns(user)

    const texto = (container.textContent ?? '').toLowerCase()
    for (const palabra of [
      'desperdicio',
      'fallaste',
      'incumpliste',
      'deberías',
      'perdiste',
      'racha',
      'cumplimiento',
      'objetivo incumplido',
    ]) {
      expect(texto).not.toContain(palabra)
    }
    expect(texto).not.toMatch(/\bmal\b/)
  })
})

/**
 * **Los patrones por actividad y sus dos salidas** (FEAT-007, tajada 2):
 * criterios 74, 77, 78, 79, 80, 82, 83 y el trozo de 72 que la tajada 1 no
 * pudo cobrar (el nombre largo).
 */
describe('Revisión · los patrones por actividad (FEAT-007, tajada 2)', () => {
  /** Lunes, miércoles y viernes de las dos últimas semanas cerradas. */
  const CASA_DATES = ['2026-09-07', '2026-09-09', '2026-09-11', '2026-09-14', '2026-09-16']

  function casaItem(overrides: Partial<VidaItem> = {}): VidaItem {
    return {
      id: 'i9',
      userId: 1,
      activityId: 'a9',
      days: ['monday', 'wednesday', 'friday'],
      startTime: '09:00',
      durationMinutes: 45,
      notes: null,
      isActive: true,
      orderIndex: 0,
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
      activity: { id: 'a9', title: 'Organizar la casa', category: null },
      ...overrides,
    }
  }

  /** Cinco veces planeada a las 9:00 durante 45 min, y vivida como se diga. */
  function casaDays(realStart: string, realMinutes: number): HistoryDay[] {
    return CASA_DATES.map((date) => ({
      date,
      planItems: [blockOn(date, 'bc', 'a9', 'Organizar la casa', '09:00', '09:45')],
      followUps: [sessionOn(date, 'sc', 'a9', 'Organizar la casa', realStart, realMinutes)],
    }))
  }

  async function openPatterns(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole('tab', { name: 'Lo que se repite' }))
  }

  it('la tarjeta dice la plantilla, lo que sueles hacer y la fracción del pie (74)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    templateItems = [casaItem()]
    historyDays = casaDays('09:06', 70)
    const { container } = renderPage()

    await openPatterns(user)

    expect(screen.getByText('Organizar la casa')).toBeInTheDocument()
    expect(screen.getByText('En tu plantilla: L X V · 9:00 · 45m')).toBeInTheDocument()
    expect(screen.getByText('Sueles empezar')).toBeInTheDocument()
    expect(screen.getByText('Suele llevarte')).toBeInTheDocument()
    expect(screen.getByText('1h 10')).toBeInTheDocument()
    expect(container.textContent).toContain('se siguió 5 de 5 veces')
    // La mini-fila: siete casillas, y las que no están en la plantilla, «·».
    expect(screen.getAllByText('·').length).toBeGreaterThanOrEqual(4)
  })

  it('la pregunta lleva el número dentro y **dos salidas**, con la consecuencia antes (78, 80)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    templateItems = [casaItem()]
    historyDays = casaDays('09:06', 70)
    renderPage()

    await openPatterns(user)

    expect(screen.getByText('¿Le damos 1h 10 en tu plantilla?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ponerlo en 1h 10' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Dejarlo' })).toBeInTheDocument()
    expect(
      screen.getByText(/En tu plantilla está 3 días \(L X V\): se cambia en todos/),
    ).toBeInTheDocument()
  })

  it('la salida afirmativa manda **un** `vidaItemUpdate` y **cero** mutaciones del plan (79)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    templateItems = [casaItem()]
    historyDays = casaDays('09:06', 70)
    renderPage()

    await openPatterns(user)
    await user.click(screen.getByRole('button', { name: 'Ponerlo en 1h 10' }))

    expect(updateVidaItem).toHaveBeenCalledTimes(1)
    expect(updateVidaItem.mock.calls[0]![0]).toEqual({ id: 'i9', durationMinutes: 70 })
    // **Los días ya armados no se mueven**: ni una de las cuatro del plan.
    expect(planMutationsCalled()).toBe(0)
    expect(createFollowUp).not.toHaveBeenCalled()
  })

  it('«Dejarlo» no llama a nadie y deja a la vista **cuándo vuelve** (82, 83)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    templateItems = [casaItem()]
    historyDays = casaDays('09:06', 70)
    renderPage()

    await openPatterns(user)
    await user.click(screen.getByRole('button', { name: 'Dejarlo' }))

    expect(updateVidaItem).not.toHaveBeenCalled()
    expect(planMutationsCalled()).toBe(0)
    expect(screen.queryByRole('button', { name: 'Ponerlo en 1h 10' })).not.toBeInTheDocument()
    expect(screen.getByText(/Vuelve el 17 de octubre si el patrón sigue igual/)).toBeInTheDocument()
    // **Ninguna clave nueva de `localStorage`**: de Vida solo la del aparato,
    // la que ya existía desde FEAT-004 (`xavi-theme` es del tema y es de antes).
    expect(Object.keys(localStorage).filter((key) => key.includes('vida'))).toEqual([
      'xavi.vida.deviceNotes',
    ])
  })

  it('una actividad que va como se planeó **no pinta ningún botón** y lo dice (77)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    templateItems = [casaItem()]
    historyDays = casaDays('09:03', 44)
    renderPage()

    await openPatterns(user)

    expect(
      screen.getByText('Esto pasa como lo planeaste. Aquí no hay nada que proponer.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Ponerlo en/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Dejarlo' })).not.toBeInTheDocument()
  })

  it('un nombre de 60 caracteres se pinta entero y sin `nowrap` (72)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const nombre = 'Organizar la casa entera, incluido el trastero del fondo'.padEnd(60, '·')
    templateItems = [
      casaItem({ activity: { id: 'a9', title: nombre, category: null } }),
    ]
    historyDays = casaDays('09:06', 70)
    const { container } = renderPage()

    await openPatterns(user)

    expect(nombre).toHaveLength(60)
    expect(screen.getByText(nombre)).toBeInTheDocument()
    // Nada de la tarjeta fuerza una línea que no se pueda partir.
    expect(container.innerHTML).not.toContain('white-space: nowrap')
  })

  it('con las tarjetas puestas **sigue sin haber una palabra de reproche** (73)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    templateItems = [casaItem()]
    historyDays = casaDays('09:06', 70)
    const { container } = renderPage()

    await openPatterns(user)

    const texto = (container.textContent ?? '').toLowerCase()
    for (const palabra of [
      'desperdicio',
      'fallaste',
      'incumpliste',
      'deberías',
      'perdiste',
      'racha',
      'cumplimiento',
    ]) {
      expect(texto).not.toContain(palabra)
    }
    expect(texto).not.toMatch(/\bmal\b/)
    // Y ni un porcentaje suelto en las tarjetas: todo va en fracción (67).
    expect(texto).toContain('se siguió 5 de 5 veces')
  })

  it('con pocos datos se dice **lo que ya se sabe** y debajo lo que llega después (84)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    templateItems = [casaItem()]
    // Una sola semana computable: es el marco F.
    historyDays = casaDays('09:06', 70)
    const { container } = renderPage()

    await openPatterns(user)

    const texto = container.textContent ?? ''
    expect(screen.getByRole('heading', { name: 'Lo que ya se sabe' })).toBeInTheDocument()
    // La tarjeta entera, **con sus dos salidas**, antes de lo que falta.
    expect(texto.indexOf('Organizar la casa')).toBeLessThan(texto.indexOf('Lo que llega después'))
    expect(screen.getByRole('button', { name: 'Ponerlo en 1h 10' })).toBeInTheDocument()
    expect(screen.getByText(/A partir de 2 semanas completas/)).toBeInTheDocument()
    expect(texto).toContain('sale de los días que vives')
  })

  it('planeada 5 veces y **nunca registrada**: se dice, no se finge que va clavado (74, 77)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    templateItems = [casaItem()]
    // Cinco veces en el plan y **ni una sesión**: el caso más común del módulo.
    historyDays = CASA_DATES.map((date) => ({
      date,
      planItems: [blockOn(date, 'bc', 'a9', 'Organizar la casa', '09:00', '09:45')],
      followUps: [],
    }))
    const { container } = renderPage()

    await openPatterns(user)

    const texto = container.textContent ?? ''
    expect(texto).toContain('se siguió 0 de 5 veces')
    // Las dos líneas que el criterio 74 pide en **todas** las tarjetas.
    expect(screen.getByText('Sueles empezar')).toBeInTheDocument()
    expect(screen.getByText('Suele llevarte')).toBeInTheDocument()
    expect(screen.getAllByText('sin dato').length).toBe(2)
    // Y **no** la frase del criterio 77, que habla de un patrón que aquí no hay.
    expect(texto).not.toContain('Esto pasa como lo planeaste')
    expect(texto).toContain('De estas 5 veces no hay ninguna registrada')
    expect(screen.queryByRole('button', { name: /Ponerlo en/ })).not.toBeInTheDocument()
    // Sigue sin haber reproche: «sin dato» es el pasado que no se sabe.
    const bajo = texto.toLowerCase()
    for (const palabra of ['fallaste', 'incumpl', 'deberías', 'perdiste', 'desperdicio']) {
      expect(bajo).not.toContain(palabra)
    }
  })

  it('por debajo de cuatro apariciones se dice cuántas lleva y se espera (75)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    templateItems = [casaItem()]
    historyDays = casaDays('09:06', 70).slice(0, 2)
    renderPage()

    await openPatterns(user)

    expect(screen.getByText('llevas 2 de 4')).toBeInTheDocument()
    expect(screen.queryByText('1h 10')).not.toBeInTheDocument()
  })

  /* ── El escritorio (FEAT-007, tajada 4): criterios 98, 99 y 100 ───────── */

  async function withDesktop(run: () => Promise<void>): Promise<void> {
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
      // **Con `await`**: sin él, el `finally` devuelve el `matchMedia` de
      // móvil antes de que el primer `await` de dentro se resuelva, y lo que
      // se acaba probando es el móvil creyendo que es el escritorio.
      await run()
    } finally {
      window.matchMedia = original
    }
  }

  it('en escritorio hay lateral con las tres cosas, y en móvil no (98, 100)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    templateItems = [casaItem()]
    historyDays = casaDays('09:06', 70)

    await withDesktop(async () => {
      renderPage()
      await openPatterns(user)

      expect(screen.getByRole('heading', { name: 'Sin contestar' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Contestadas' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'De dónde sale todo esto' })).toBeInTheDocument()
      // «Sin contestar» lleva **las mismas dos salidas** que su tarjeta: con
      // la tarjeta y el lateral, la pregunta sale dos veces y cada una con su
      // par de botones.
      expect(screen.getAllByRole('button', { name: 'Ponerlo en 1h 10' })).toHaveLength(2)
      expect(screen.getAllByRole('button', { name: 'Dejarlo' })).toHaveLength(2)
      expect(screen.getByText(/no caduca ninguna y no cambian nada solas/)).toBeInTheDocument()
    })
  })

  it('en móvil no hay lateral, pero **sí** de dónde sale todo esto (98, 100)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    templateItems = [casaItem()]
    historyDays = casaDays('09:06', 70)
    renderPage()

    await openPatterns(user)

    expect(screen.queryByRole('heading', { name: 'Sin contestar' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'De dónde sale todo esto' })).toBeInTheDocument()
    // La pregunta, **una sola vez**: el lateral duplicaría la tarjeta.
    expect(screen.getAllByRole('button', { name: 'Ponerlo en 1h 10' })).toHaveLength(1)
  })

  it('«Contestadas» dice qué se contestó y **cuándo vuelve** (99)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    templateItems = [casaItem()]
    historyDays = casaDays('09:06', 70)

    await withDesktop(async () => {
      renderPage()
      await openPatterns(user)

      expect(screen.getByText('Todavía no has contestado ninguna.')).toBeInTheDocument()
      await user.click(screen.getAllByRole('button', { name: 'Dejarlo' })[0]!)

      // La fecha de vuelta, **a la vista desde el momento en que se contesta**.
      expect(screen.getAllByText(/Vuelve el 17 de octubre si el patrón sigue igual/).length)
        .toBeGreaterThan(0)
      expect(screen.queryByText('Todavía no has contestado ninguna.')).not.toBeInTheDocument()
      // Y la pregunta deja de estar en «Sin contestar».
      expect(screen.queryByRole('button', { name: 'Ponerlo en 1h 10' })).not.toBeInTheDocument()
    })
  })

  it('lo aplicado se cuenta en «Contestadas»: qué cambió y cuándo (99)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    templateItems = [casaItem()]
    historyDays = casaDays('09:06', 70)

    await withDesktop(async () => {
      renderPage()
      await openPatterns(user)
      await user.click(screen.getAllByRole('button', { name: 'Ponerlo en 1h 10' })[0]!)
      // El `mutate` del módulo está espiado y no ejecuta su `onSuccess`: se
      // dispara a mano, que es el momento en que el API confirma el cambio.
      const options = updateVidaItem.mock.calls[0]![1] as { onSuccess?: () => void }
      act(() => options.onSuccess?.())

      expect(
        screen.getByText(/«Ponerlo en 1h 10», hecho el 19 de septiembre/),
      ).toBeInTheDocument()
    })
  })
})
