import { act, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { UserSettings } from '@/features/settings/types/user-settings.types'
import { VidaHoyPage } from '@/features/vida/pages/VidaHoyPage'
import type { ActivityDayPlanItem } from '@/features/vida/types/activity-day-plan.types'
import type { ActivityFollowUp } from '@/features/vida/types/activity-followup.types'
import type { VidaItem, VidaSuggestion } from '@/features/vida/types/vida-item.types'
import { renderWithProviders } from '@/test/render'

/**
 * La agenda de hoy, en solo lectura: criterios 11, 12, 14, 16, 20, 21, 22 y los
 * estados 50, 51, 52 y 56.
 *
 * Se mockean **las consultas**, no `useVidaDayData`: lo que hay que comprobar
 * aquí es que la pantalla cruza de verdad plan + plantilla + ajustes, incluidos
 * los respaldos 06:30 / 23:00 de `useVidaDayHours`.
 *
 * El reloj se inyecta con `vi.setSystemTime`: viernes 18 de septiembre de 2026
 * a las 9:24, que es la hora del render aprobado.
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
/** La plantilla entera: de ahí sale «Mañana, \<día\>» del lateral (tajada 5). */
let itemsQuery: Query<VidaItem[]>
let settingsQuery: Query<UserSettings>
let addMutation: { mutate: ReturnType<typeof vi.fn>; isPending: boolean; isError: boolean }
let editMutation: { mutate: ReturnType<typeof vi.fn>; isPending: boolean; isError: boolean }
let removeMutation: { mutate: ReturnType<typeof vi.fn>; isPending: boolean; isError: boolean }
let setMutation: { mutate: ReturnType<typeof vi.fn>; isPending: boolean; isError: boolean }
/** Planes de **otros** días: la tira y «Copiar del <día> pasado» los leen. */
let plansByDate: Record<string, ActivityDayPlanItem[]>
/** El día que la página está mirando; las demás fechas salen de `plansByDate`. */
let viewedDate: string

// Las tres mutaciones del plan del día entran en el mock desde la tajada 3: la
// página coloca desde una ficha, la hoja pone y edita, y el «···» del bloque
// quita. Sin ellas, montar la página revienta en el primer hook.
vi.mock('@/features/vida/hooks/useActivityDayPlan', () => ({
  // Por fecha desde la tajada 4: la página pide el día visto y `VidaDayActions`
  // pide el mismo día de la semana pasada, y no pueden responder lo mismo.
  useActivityDayPlanQuery: (date: string) =>
    date === viewedDate ? planQuery : ready(plansByDate[date] ?? []),
  useAddDayPlanItemMutation: () => addMutation,
  useEditDayPlanItemMutation: () => editMutation,
  useRemoveDayPlanItemMutation: () => removeMutation,
  useSetActivityDayPlanMutation: () => setMutation,
}))
// Los puntos de la tira: el hook tiene su propio test con `useQueries` de
// verdad (`useVidaWeekPlans.test.tsx`); aquí importa lo que la tira pinta.
vi.mock('@/features/vida/hooks/useVidaWeekPlans', () => ({
  useVidaWeekPlans: (dates: string[]) => ({
    byDate: Object.fromEntries(
      dates.map((date) => {
        const items = date === viewedDate ? (planQuery.data ?? []) : (plansByDate[date] ?? [])
        return [date, { date, hasPlan: items.length > 0, blockCount: items.length, isPending: false }]
      }),
    ),
    isPending: false,
  }),
}))
vi.mock('@/features/vida/hooks/useActivities', () => ({
  useActivitiesQuery: () => ({
    data: { activities: [], total: 0 },
    isPending: false,
    fetchStatus: 'idle',
    isError: false,
  }),
}))
vi.mock('@/features/vida/hooks/useVidaItems', () => ({
  useVidaSuggestionsForDateQuery: () => suggestionsQuery,
  // Desde la tajada 5: el bloque «Mañana» del lateral lee la plantilla entera
  // (`vidaItems`) para saber qué trae **mañana**, que no es el día visto.
  useVidaItemsQuery: () => itemsQuery,
}))
vi.mock('@/features/settings/hooks/useUserSettings', () => ({
  useUserSettingsQuery: () => settingsQuery,
  useUpdateUserSettingsMutation: () => ({ mutate: vi.fn(), isPending: false, isError: false }),
}))

/* ── La sesión viva (FEAT-004, tajada 1) ──────────────────────────────────
 *
 * Se mockean los **dos hooks de sesión** y no la consulta: lo que esta pantalla
 * tiene que hacer bien es **cablear** la sesión a los bloques (quién enseña
 * «▶ Empezar», quién está en marcha y con qué `activityId` se llama a `start`).
 * La orquestación de verdad —cerrar la anterior antes de empezar, el fallo que
 * aborta— tiene su propio test en `useVidaSessionActions.test.tsx`.
 */
let openSession: {
  session: ActivityFollowUp | null
  startInstant: Date | null
  isFromAnotherDay: boolean
  isDisabled: boolean
  isPending: boolean
}
let startSession: ReturnType<typeof vi.fn>
let finishSession: ReturnType<typeof vi.fn>

vi.mock('@/features/vida/hooks/useVidaOpenSession', () => ({
  useVidaOpenSession: () => openSession,
  useVidaSessionPlannedMinutes: () => null,
}))
vi.mock('@/features/vida/hooks/useVidaSessionActions', () => ({
  useVidaSessionActions: () => ({
    session: openSession.session,
    isFromAnotherDay: openSession.isFromAnotherDay,
    isBusy: false,
    start: startSession,
    finishNow: finishSession,
    finishWith: vi.fn(),
    discard: vi.fn(),
    resolveStale: vi.fn(),
  }),
}))

/** Una sesión abierta sobre el bloque `b2` («Leer un rato»), empezada a las 9:00. */
function openFollowUp(activityId: string, startTime = '09:00'): ActivityFollowUp {
  return {
    id: 'f1',
    activityId,
    date: '2026-09-18',
    startTime,
    durationMinutes: null,
    isOpen: true,
    endTime: null,
    endDate: null,
    endDateTime: null,
    notes: null,
    activity: {
      id: activityId,
      title: 'Leer un rato',
      category: { id: 'c1', name: 'Cuidado', color: '#10B981', icon: 'heart' },
    },
  }
}

function ready<T>(data: T): Query<T> {
  return { data, isPending: false, isError: false, fetchStatus: 'idle', refetch: vi.fn() }
}

function block(
  id: string,
  title: string,
  startTime: string,
  endTime: string,
  activityId = `a-${id}`,
): ActivityDayPlanItem {
  return {
    id,
    userId: 1,
    activityId,
    date: '2026-09-18',
    startTime,
    endTime,
    orderIndex: 0,
    completedAt: null,
    createdAt: '2026-09-18T00:00:00.000Z',
    updatedAt: '2026-09-18T00:00:00.000Z',
    activity: {
      id: activityId,
      title,
      category: { id: 'c1', name: 'Cuidado', color: '#10B981', icon: 'heart' },
    },
  }
}

function suggestion(
  id: string,
  title: string,
  durationMinutes: number | null,
  overrides: Partial<VidaItem> = {},
): VidaSuggestion {
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
    ...overrides,
  }
  return { item, takenToday: false }
}

const SETTINGS: UserSettings = {
  userId: 1,
  hideHiddenHabits: false,
  sleepActivityCategoryId: null,
  standupTodoFolderId: null,
  vidaDayStartTime: null,
  vidaDayEndTime: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const PLAN = [
  block('b1', 'Bañarme', '08:00', '08:45'),
  block('b2', 'Leer un rato', '10:00', '10:30'),
  block('b3', 'Cocinar y almorzar', '13:00', '14:00'),
]

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 8, 18, 9, 24, 0))
  // jsdom no implementa `scrollIntoView`; lo que se comprueba es que se llama.
  Element.prototype.scrollIntoView = vi.fn()
  addMutation = { mutate: vi.fn(), isPending: false, isError: false }
  setMutation = { mutate: vi.fn(), isPending: false, isError: false }
  plansByDate = {}
  viewedDate = '2026-09-18'
  editMutation = { mutate: vi.fn(), isPending: false, isError: false }
  removeMutation = { mutate: vi.fn(), isPending: false, isError: false }
  planQuery = ready(PLAN)
  suggestionsQuery = ready([
    suggestion('s1', 'Poner lavadora', 20),
    suggestion('s2', 'Compra de la semana', 240),
  ])
  settingsQuery = ready(SETTINGS)
  // La plantilla entera, para «Mañana»: vacía por defecto, así el bloque del
  // lateral no mete ruido en las comprobaciones del día que se mira.
  itemsQuery = ready([])
  openSession = {
    session: null,
    startInstant: null,
    isFromAnotherDay: false,
    isDisabled: false,
    isPending: false,
  }
  startSession = vi.fn().mockResolvedValue({ ok: true })
  finishSession = vi.fn().mockResolvedValue({ ok: true })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('VidaHoyPage — el día con plan', () => {
  it('pinta el presupuesto y los bloques ordenados por hora (criterios 11 y 16)', () => {
    renderWithProviders(<VidaHoyPage />)

    expect(screen.getByText('Viernes 18')).toBeInTheDocument()
    const nombres = screen
      .getAllByRole('listitem')
      .map((node) => node.textContent ?? '')
      .filter((texto) => texto.includes('Bañarme') || texto.includes('Cocinar'))
    expect(nombres[0]).toContain('Bañarme')

    // Icono, color y duración de cada bloque.
    expect(screen.getByText('45 min')).toBeInTheDocument()
    expect(screen.getByText('1 h')).toBeInTheDocument()
  })

  it('«te quedan» cuenta hasta el fin del día y se actualiza sin recargar (criterio 12)', async () => {
    renderWithProviders(<VidaHoyPage />)

    // «9:24» sale en varios sitios desde que la marca de «ahora» parte el hueco
    // (el encabezado, la marca y la canaleta del tramo), así que se busca en el
    // encabezado del presupuesto y no en toda la página.
    expect(document.getElementById('vida-budget-heading')).toHaveTextContent('Viernes 18 · 9:24')
    expect(screen.getByText('13h 36')).toBeInTheDocument()

    // Avanzar el temporizador mueve también el reloj del sistema: 9:24 → 9:25.
    await act(async () => {
      vi.advanceTimersByTime(60_000)
    })

    expect(screen.getByText('13h 35')).toBeInTheDocument()
  })

  it('la leyenda da los minutos de cada tramo como texto (criterio 14)', () => {
    renderWithProviders(<VidaHoyPage />)

    // 45 + 30 + 60 = 135 min planeados; 990 − 135 = 855 libres.
    expect(screen.getByText('planeado 2h 15')).toBeInTheDocument()
    expect(screen.getByText('libre 14h 15')).toBeInTheDocument()
  })

  it('el primero que no ha empezado dice «en N min» (criterio 16)', () => {
    renderWithProviders(<VidaHoyPage />)

    expect(screen.getByText('· en 36 min')).toBeInTheDocument()
  })

  it('los huecos traen sus horas, su tamaño y solo lo que cabe (criterios 17 y 18)', () => {
    renderWithProviders(<VidaHoyPage />)

    const hueco = screen.getByLabelText('Libre de 10:30 – 13:00')
    expect(within(hueco).getByText('2h 30')).toBeInTheDocument()
    expect(within(hueco).getByText('Poner lavadora')).toBeInTheDocument()
    // «Compra de la semana» dura 4 h: no cabe en 2 h 30.
    expect(within(hueco).queryByText('Compra de la semana')).not.toBeInTheDocument()
  })

  it('una sugerencia sin duración se lee «sin duración» y no se filtra (criterio 19)', () => {
    suggestionsQuery = ready([suggestion('s3', 'Descansar', null)])
    renderWithProviders(<VidaHoyPage />)

    expect(screen.getAllByText('sin duración').length).toBeGreaterThan(0)
  })

  it('abre a la altura de «Ahora» sin que lo anterior desaparezca (criterio 20)', () => {
    renderWithProviders(<VidaHoyPage />)

    expect(screen.getByText('Ahora')).toBeInTheDocument()
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ block: 'center' })
    // Lo de antes de la marca sigue en el documento: no se pliega ni se oculta.
    expect(screen.getByText('Bañarme')).toBeInTheDocument()
  })

  /**
   * **Derogado por FEAT-004, tajada 1.** El criterio 22 de FEAT-003 decía que en
   * esta pantalla no había nada de vivir el día —ni «Empezar», ni cronómetro, ni
   * «Terminar»— porque eso era F3. F3 llegó: los criterios 1, 2, 3 y 5 de
   * FEAT-004 piden exactamente lo contrario, y están probados abajo. Lo que
   * **sigue** sin existir aquí es lo de la tajada 2: las etiquetas de ejecutado.
   */
  it('todavía no hay etiquetas de ejecutado: eso es la tajada 2 (FEAT-003, criterio 22)', () => {
    renderWithProviders(<VidaHoyPage />)

    for (const palabra of [/fuera del plan/i, /calcado/i, /sin dato/i]) {
      expect(screen.queryByText(palabra)).not.toBeInTheDocument()
    }
  })

  it('el lateral de escritorio marca lo que ya está en el plan (criterio 48)', () => {
    suggestionsQuery = ready([
      suggestion('s1', 'Poner lavadora', 20),
      suggestion('b1', 'Bañarme', 45, { activityId: 'a-b1' }),
    ])
    renderWithProviders(<VidaHoyPage />)

    const lateral = screen.getByLabelText('Tu plantilla de viernes')
    expect(within(lateral).getAllByText('en el plan')).toHaveLength(1)
  })

  it('no reprocha nada en ninguna parte de la pantalla (criterio 56)', () => {
    renderWithProviders(<VidaHoyPage />)

    expect(document.body.textContent ?? '').not.toMatch(
      /desperdici|perdiste|fallaste|cancelar|eliminar/i,
    )
  })
})

/**
 * Los tres casos que el revisor midió con 0 marcas y 0 `scrollIntoView`, más el
 * borde que él pidió definir: fuera del horario del día **no** hay marca.
 */
describe('VidaHoyPage — la marca de «Ahora» aguanta todo el día (criterio 20)', () => {
  function renderAt(hour: number, minute = 0) {
    vi.setSystemTime(new Date(2026, 8, 18, hour, minute, 0))
    renderWithProviders(<VidaHoyPage />)
  }

  it('a las 20:00, con el último bloque a las 13:00, sigue habiendo marca y scroll', () => {
    renderAt(20)

    expect(screen.getByText('Ahora')).toBeInTheDocument()
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ block: 'center' })
  })

  it('con un solo bloque por la mañana y ahora a las 12:00, también', () => {
    planQuery = ready([block('b1', 'Bañarme', '08:00', '08:45')])
    renderAt(12)

    expect(screen.getByText('Ahora')).toBeInTheDocument()
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ block: 'center' })
  })

  it('hoy SIN PLAN: la marca está y la pantalla abre en ella', () => {
    planQuery = ready([])
    renderAt(9, 24)

    expect(screen.getByText('Ahora')).toBeInTheDocument()
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ block: 'center' })
  })

  it('en medio del hueco entre bloques, el hueco se parte y lo de antes no ofrece fichas', () => {
    renderAt(11, 30)

    expect(screen.getByText('Ahora')).toBeInTheDocument()
    // 10:30–13:00 partido: lo que pasó se lee, pero sin fichas.
    expect(screen.getByText('Libre 10:30 – 11:30 · 1h')).toBeInTheDocument()
    const queda = screen.getByLabelText('Libre de 11:30 – 13:00')
    expect(within(queda).getByText('1h 30')).toBeInTheDocument()
  })

  it('FUERA del horario del día no hay marca: a las 5:00 y a las 23:30', () => {
    renderAt(5)
    expect(screen.queryByText('Ahora')).not.toBeInTheDocument()

    screen.getByText('Viernes 18') // la pantalla sigue entera, no rota
  })

  it('a las 23:30 no hay marca, no se lee «te quedan 0m» y el día se dice cerrado', () => {
    renderAt(23, 30)

    expect(screen.queryByText('Ahora')).not.toBeInTheDocument()
    expect(screen.queryByText(/te quedan/)).not.toBeInTheDocument()
    expect(screen.getByText(/Tu día se cerró a las 23:00/)).toBeInTheDocument()
    // En su lugar, el resumen de lo planeado, en el encabezado.
    expect(screen.getAllByText(/^planeado /)[0]).toBeInTheDocument()
  })

  it('un bloque lejano se lee «en 15 h 20 min», no «en 920 min»', () => {
    planQuery = ready([block('b9', 'Cena tarde', '21:00', '22:00')])
    renderAt(5, 40)

    expect(screen.getByText('· en 15 h 20 min')).toBeInTheDocument()
  })
})

describe('VidaHoyPage — hoy sin plan', () => {
  it('el día entero es un hueco y se dice qué trae la plantilla (criterio 21)', () => {
    planQuery = ready([])
    renderWithProviders(<VidaHoyPage />)

    expect(screen.getByText(/Aún no hay plan para hoy/)).toBeInTheDocument()
    expect(screen.getByText(/Tu plantilla trae 2 cosas los viernes/)).toBeInTheDocument()
    // El día entero es un hueco, partido por la marca de «ahora»: lo que ya pasó
    // y lo que queda por delante.
    expect(screen.getByLabelText('Libre de 9:24 – 23:00')).toBeInTheDocument()
    expect(screen.getByText('Libre 6:30 – 9:24 · 2h 54')).toBeInTheDocument()
  })

  // **Deroga** la afirmación de la tajada 2 («"Armar desde la plantilla" NO se
  // pinta todavía: llegaría muerto»). Desde la tajada 5 el botón existe y
  // funciona: es la mitad del criterio 21 que faltaba.
  it('«Armar desde la plantilla» se ofrece diciendo cuántas cosas trae (criterio 21)', () => {
    planQuery = ready([])
    renderWithProviders(<VidaHoyPage />)

    expect(
      screen.getByRole('button', { name: /armar desde la plantilla \(2 cosas\)/i }),
    ).toBeInTheDocument()
  })

  it('armar manda una sola `activityDayPlanSet` con la hora y la duración de cada ítem (41, 42)', () => {
    planQuery = ready([])
    suggestionsQuery = ready([
      suggestion('v1', 'Bañarme', 15, { startTime: '08:00' }),
      suggestion('v2', 'Pasear', 40, { startTime: '08:30' }),
    ])
    renderWithProviders(<VidaHoyPage />)

    fireEvent.click(screen.getByRole('button', { name: /armar desde la plantilla/i }))

    expect(setMutation.mutate).toHaveBeenCalledTimes(1)
    expect(setMutation.mutate.mock.calls[0]?.[0]).toEqual({
      date: '2026-09-18',
      items: [
        { activityId: 'a-v1', startTime: '08:00', endTime: '08:15', orderIndex: 0 },
        { activityId: 'a-v2', startTime: '08:30', endTime: '09:10', orderIndex: 1 },
      ],
    })
  })

  it('al armar, el aviso de lo ajustado se lee en la agenda con la vía al catálogo (43 y 44)', async () => {
    planQuery = ready([])
    suggestionsQuery = ready([
      suggestion('v1', 'Bañarme', 60, { startTime: '08:00' }),
      suggestion('v2', 'Pasear', 30, { startTime: '08:30' }),
      suggestion('v3', 'Leer', null),
    ])
    renderWithProviders(<VidaHoyPage />)

    fireEvent.click(screen.getByRole('button', { name: /armar desde la plantilla/i }))

    // El hook enseña el resumen **cuando la mutación sale bien**, no antes.
    expect(screen.queryByText(/no cabían a su hora/)).not.toBeInTheDocument()
    const options = setMutation.mutate.mock.calls[0]?.[1] as { onSuccess: () => void }
    await act(async () => {
      options.onSuccess()
    })

    expect(screen.getByText(/1 de 3 no cabían a su hora y quedaron después/)).toBeInTheDocument()
    expect(
      screen.getByText(/1 cosa sin hora, puesta al final — ponles una hora en tu plantilla/),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Ver tus actividades' })[0]).toHaveAttribute(
      'href',
      '/app/vida/actividades',
    )
  })

  it('un día que YA tiene plan no ofrece armar: `Set` lo reemplazaría entero', () => {
    planQuery = ready([block('b1', 'Bañarme', '08:00', '08:15')])
    renderWithProviders(<VidaHoyPage />)

    expect(
      screen.queryByRole('button', { name: /armar desde la plantilla/i }),
    ).not.toBeInTheDocument()
  })

  it('sin plantilla y sin plan: no hay fichas vacías, hay enlace al catálogo (criterio 21)', () => {
    planQuery = ready([])
    suggestionsQuery = ready([])
    renderWithProviders(<VidaHoyPage />)

    expect(screen.getByText(/Tu plantilla todavía no trae nada/)).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Ver tus actividades' })[0]).toHaveAttribute(
      'href',
      '/app/vida/actividades',
    )
  })
})

describe('VidaHoyPage — los estados', () => {
  it('cargando: esqueleto y NUNCA «no tienes plan» (criterio 50)', () => {
    planQuery = { isPending: true, isError: false, fetchStatus: 'fetching', refetch: vi.fn() }
    renderWithProviders(<VidaHoyPage />)

    expect(screen.getByText('Cargando tu día…')).toBeInTheDocument()
    expect(screen.queryByText(/Aún no hay plan/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Libre/)).not.toBeInTheDocument()
  })

  it('con los ajustes en vuelo tampoco se pinta un presupuesto que luego salte (criterio 50)', () => {
    settingsQuery = { isPending: true, isError: false, fetchStatus: 'fetching', refetch: vi.fn() }
    renderWithProviders(<VidaHoyPage />)

    expect(screen.getByText('Cargando tu día…')).toBeInTheDocument()
    expect(screen.queryByText(/te quedan/)).not.toBeInTheDocument()
  })

  it('sin sesión: mensaje con la vía para entrar, no un spinner eterno (criterio 51)', () => {
    const disabled = { isPending: true, isError: false, fetchStatus: 'idle' as const, refetch: vi.fn() }
    planQuery = disabled
    suggestionsQuery = disabled
    settingsQuery = disabled
    renderWithProviders(<VidaHoyPage />)

    expect(screen.getByText('Entra para ver tu día')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toBeInTheDocument()
    expect(screen.queryByText('Cargando tu día…')).not.toBeInTheDocument()
  })

  it('error del plan: mensaje humano y botón que vuelve a pedirlo (criterio 52)', () => {
    const refetch = vi.fn()
    planQuery = { isPending: false, isError: true, fetchStatus: 'idle', refetch }
    renderWithProviders(<VidaHoyPage />)

    expect(screen.getByText('No pudimos cargar tu día')).toBeInTheDocument()
    screen.getByRole('button', { name: 'Reintentar' }).click()
    expect(refetch).toHaveBeenCalled()
  })

  it('si falla solo una consulta, se dice qué falta (criterio 52)', () => {
    suggestionsQuery = { isPending: false, isError: true, fetchStatus: 'idle', refetch: vi.fn() }
    renderWithProviders(<VidaHoyPage />)

    expect(screen.getByText(/No pudimos cargar lo que trae tu plantilla/)).toBeInTheDocument()
    // Y la agenda se pinta igual: el plan sí cargó.
    expect(screen.getByText('Bañarme')).toBeInTheDocument()
  })
})

describe('VidaHoyPage — poner algo en un hueco (tajada 3)', () => {
  it('criterio 23 — un toque en una ficha la coloca al principio del hueco', () => {
    renderWithProviders(<VidaHoyPage />)

    // El hueco de 10:30 a 13:00 ofrece «Poner lavadora» (20 min, cabe).
    fireEvent.click(screen.getByRole('button', { name: /Poner Poner lavadora a las 10:30/ }))

    expect(addMutation.mutate).toHaveBeenCalledTimes(1)
    expect(addMutation.mutate.mock.calls[0][0]).toEqual({
      date: '2026-09-18',
      activityId: 'a-s1',
      startTime: '10:30',
      endTime: '10:50',
    })
  })

  it('criterio 23 — el hueco que ya empezó coloca desde ahora, no desde antes', () => {
    // Entre el bloque de las 8:45 y el de las 10:00 hay hueco, y el reloj (9:24)
    // cae dentro: `buildDayAgenda` lo parte y la mitad de después empieza en el
    // reloj. Colocar ahí no puede llevar la hora al pasado.
    renderWithProviders(<VidaHoyPage />)
    fireEvent.click(screen.getByRole('button', { name: /Poner Poner lavadora a las 9:24/ }))

    expect(addMutation.mutate.mock.calls[0][0]).toMatchObject({
      startTime: '09:24',
      endTime: '09:44',
    })
  })

  it('criterio 19 — una ficha sin duración no coloca nada: abre la hoja', () => {
    suggestionsQuery = ready([suggestion('s3', 'Estirar la espalda', null)])
    renderWithProviders(<VidaHoyPage />)

    fireEvent.click(
      screen.getAllByRole('button', {
        name: /Poner Estirar la espalda aquí, eligiendo cuánto dura/,
      })[0],
    )

    expect(addMutation.mutate).not.toHaveBeenCalled()
    expect(screen.getByRole('heading', { name: 'Cuánto' })).toBeInTheDocument()
  })

  it('criterio 24 — «+ otra cosa» abre la hoja con el subtítulo del hueco', () => {
    renderWithProviders(<VidaHoyPage />)

    fireEvent.click(screen.getAllByRole('button', { name: /Poner otra cosa a las 10:30/ })[0])

    expect(screen.getByText('Poner algo a las 10:30')).toBeInTheDocument()
    expect(
      screen.getByText('Hueco de 2h 30 · hasta las 13:00 «Cocinar y almorzar»'),
    ).toBeInTheDocument()
  })

  it('criterio 30 — el «···» de un bloque ofrece quitar del plan y cambiar la hora', () => {
    renderWithProviders(<VidaHoyPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Más opciones de Bañarme' }))

    expect(screen.getByRole('button', { name: 'Quitar del plan' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cambiar hora o duración' })).toBeInTheDocument()
    // Nunca «cancelar» ni «eliminar» (criterios 30 y 56).
    expect(screen.queryByRole('button', { name: /eliminar|cancelar/i })).not.toBeInTheDocument()
  })

  it('criterio 30 — quitar pide confirmación antes de tocar nada', () => {
    renderWithProviders(<VidaHoyPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Más opciones de Bañarme' }))
    fireEvent.click(screen.getByRole('button', { name: 'Quitar del plan' }))

    // El diálogo aparece y la mutación **todavía no** ha salido.
    expect(screen.getByText('¿Quitar «Bañarme» de tu plan?')).toBeInTheDocument()
    expect(removeMutation.mutate).not.toHaveBeenCalled()
  })

  it('criterio 30 — «Cambiar hora o duración» abre la hoja con el bloque puesto', () => {
    renderWithProviders(<VidaHoyPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Más opciones de Bañarme' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar hora o duración' }))

    expect(screen.getByRole('heading', { name: 'Cambiar hora o duración' })).toBeInTheDocument()
    // «Qué» no se pregunta: el bloque ya es esa actividad.
    expect(screen.queryByRole('heading', { name: 'Qué' })).not.toBeInTheDocument()
    // La ventana es el bloque más lo libre de al lado: de las 6:30 a las 10:00.
    expect(screen.getByText(/hasta las 10:00 «Leer un rato»/)).toBeInTheDocument()
  })
})

/**
 * Tajada 4 — cualquier día, no solo hoy (criterios 31–38).
 *
 * El reloj sigue clavado en el **viernes 18 de septiembre de 2026 a las 9:24**,
 * así que la ventana de D5 va del lunes 14 al domingo 27.
 */
describe('VidaHoyPage — cualquier día (tajada 4)', () => {
  function block19(id: string, title: string, startTime: string, endTime: string) {
    return { ...block(id, title, startTime, endTime), date: '2026-09-19' }
  }

  it('criterio 31 — la tira trae siete días, con su día de la semana y su número', () => {
    renderWithProviders(<VidaHoyPage />)

    const strip = screen.getByRole('navigation', { name: 'Elige el día' })
    const days = within(strip).getAllByRole('link')
    expect(days).toHaveLength(7)
    // Dos antes del que se mira: miércoles 16 … martes 22.
    expect(days[0]).toHaveAccessibleName(/miércoles 16/)
    expect(days[6]).toHaveAccessibleName(/martes 22/)
    // Hoy va marcado.
    expect(within(strip).getByText('Hoy')).toBeInTheDocument()
    expect(days[2]).toHaveAttribute('aria-current', 'page')
  })

  it('criterio 32 — bajo cada día hay un punto: rayado con plan, vacío sin él', () => {
    plansByDate = { '2026-09-19': [block19('p1', 'Leer', '09:00', '09:30')] }
    const { container } = renderWithProviders(<VidaHoyPage />)

    const strip = screen.getByRole('navigation', { name: 'Elige el día' })
    // El punto es decorativo; lo que se oye es el nombre del enlace.
    expect(within(strip).getByRole('link', { name: /sábado 19/ })).toHaveAccessibleName(
      /con plan, 1 bloque/,
    )
    expect(within(strip).getByRole('link', { name: /lunes 21/ })).toHaveAccessibleName(
      /sin plan todavía/,
    )
    const dots = container.querySelectorAll('[data-state]')
    expect(Array.from(dots).filter((dot) => dot.getAttribute('data-state') === 'plan')).toHaveLength(
      2, // el sábado 19 y el propio viernes 18, que sí tiene plan
    )
  })

  it('criterio 34 — el día visto sale de la URL: `?d=YYYY-MM-DD`', () => {
    plansByDate = { '2026-09-19': [block19('p1', 'Leer un rato', '09:00', '09:30')] }
    renderWithProviders(<VidaHoyPage />, {
      routerProps: { initialEntries: ['/app/vida/hoy?d=2026-09-19'] },
    })

    expect(screen.getByText('Sábado 19')).toBeInTheDocument()
    expect(screen.getByText('Leer un rato')).toBeInTheDocument()
  })

  it('criterio 31 — un toque en otro día cambia lo que muestra la agenda', () => {
    plansByDate = { '2026-09-19': [block19('p1', 'Leer un rato', '09:00', '09:30')] }
    renderWithProviders(<VidaHoyPage />)

    const strip = screen.getByRole('navigation', { name: 'Elige el día' })
    fireEvent.click(within(strip).getByRole('link', { name: /sábado 19/ }))

    expect(screen.getByText('Sábado 19')).toBeInTheDocument()
    expect(screen.getByText('Leer un rato')).toBeInTheDocument()
  })

  it('criterio 33 — un día futuro cuenta planeado frente a libre, sin «ahora» ni «te quedan»', () => {
    plansByDate = { '2026-09-19': [block19('p1', 'Leer un rato', '09:00', '09:30')] }
    renderWithProviders(<VidaHoyPage />, {
      routerProps: { initialEntries: ['/app/vida/hoy?d=2026-09-19'] },
    })

    const budget = document.getElementById('vida-budget-heading')?.closest('section')
    expect(budget).toHaveTextContent('planeado 30m de 16h 30')
    expect(screen.queryByText(/te quedan/i)).not.toBeInTheDocument()
    expect(screen.queryByText('Ahora')).not.toBeInTheDocument()
    expect(screen.queryByText(/en \d+ min/)).not.toBeInTheDocument()
    expect(document.getElementById('vida-budget-heading')).not.toHaveTextContent('9:24')
  })

  it('criterio 35 — fuera de la ventana no se navega: se recorta y se explica', () => {
    renderWithProviders(<VidaHoyPage />, {
      routerProps: { initialEntries: ['/app/vida/hoy?d=2026-11-30'] },
    })

    // Recortado al domingo 27, que es el último día alcanzable.
    expect(screen.getByText('Domingo 27')).toBeInTheDocument()
    expect(
      screen.getByText('Se planea esta semana y la que viene: hasta el domingo 27.'),
    ).toBeInTheDocument()
    // Y no hay ningún botón de «semana siguiente» que no lleve a ninguna parte.
    expect(screen.queryByRole('button', { name: /siguiente|anterior/i })).not.toBeInTheDocument()
  })

  it('criterio 36 — «Copiar del <día> pasado» dice cuántos bloques trae y los trae', () => {
    plansByDate = {
      '2026-09-12': [
        { ...block('v1', 'Compra de la semana', '10:00', '11:00'), date: '2026-09-12' },
        { ...block('v2', 'Leer un rato', '18:00', '18:30'), date: '2026-09-12' },
      ],
    }
    renderWithProviders(<VidaHoyPage />, {
      routerProps: { initialEntries: ['/app/vida/hoy?d=2026-09-19'] },
    })

    expect(screen.getByText('Trae 2 bloques, con sus horas.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Copiar del sábado pasado' }))

    expect(setMutation.mutate).toHaveBeenCalledWith({
      date: '2026-09-19',
      items: [
        { activityId: 'a-v1', startTime: '10:00', endTime: '11:00', orderIndex: 0 },
        { activityId: 'a-v2', startTime: '18:00', endTime: '18:30', orderIndex: 1 },
      ],
    })
  })

  it('criterio 36 — si aquel día no tuvo plan, el botón está apagado y dice por qué', () => {
    renderWithProviders(<VidaHoyPage />, {
      routerProps: { initialEntries: ['/app/vida/hoy?d=2026-09-19'] },
    })

    expect(screen.getByRole('button', { name: 'Copiar del sábado pasado' })).toBeDisabled()
    expect(
      screen.getByText('Ese sábado no tuviste plan, así que no hay nada que traer.'),
    ).toBeInTheDocument()
  })

  it('criterio 36 — en un día que ya tiene plan, copiar no se ofrece (D7)', () => {
    plansByDate = {
      '2026-09-19': [block19('p1', 'Leer un rato', '09:00', '09:30')],
      '2026-09-12': [{ ...block('v1', 'Compra', '10:00', '11:00'), date: '2026-09-12' }],
    }
    renderWithProviders(<VidaHoyPage />, {
      routerProps: { initialEntries: ['/app/vida/hoy?d=2026-09-19'] },
    })

    expect(screen.queryByRole('button', { name: /copiar del/i })).not.toBeInTheDocument()
  })

  it('criterio 37 — «Vaciar y rehacer» pide confirmación nombrando cuántos bloques', async () => {
    renderWithProviders(<VidaHoyPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Vaciar y rehacer' }))

    expect(screen.getByText('¿Vaciar el plan de este día?')).toBeInTheDocument()
    expect(screen.getByText(/Se van 3 bloques/)).toBeInTheDocument()
    expect(setMutation.mutate).not.toHaveBeenCalled()

    // Confirmar deja el día sin plan con **una sola** operación.
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Vaciar el día' }))
    })
    expect(setMutation.mutate).toHaveBeenCalledWith({ date: '2026-09-18', items: [] })
  })

  it('criterio 37 — la salida del diálogo es «Volver», nunca «Cancelar» (criterio 56)', () => {
    renderWithProviders(<VidaHoyPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Vaciar y rehacer' }))

    expect(screen.getByRole('button', { name: 'Volver' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /cancelar|eliminar/i })).not.toBeInTheDocument()
  })

  it('criterio 38 — un día pasado es solo lectura: ni fichas, ni «+ otra cosa», ni «···»', () => {
    plansByDate = {
      '2026-09-17': [{ ...block('x1', 'Leer un rato', '09:00', '09:30'), date: '2026-09-17' }],
    }
    renderWithProviders(<VidaHoyPage />, {
      routerProps: { initialEntries: ['/app/vida/hoy?d=2026-09-17'] },
    })

    expect(screen.getByText('Jueves 17')).toBeInTheDocument()
    // Ni fichas —ni siquiera como texto— ni «+ otra cosa» en la agenda
    // (criterio 38). El lateral «Tu plantilla de jueves» sigue siendo lectura y
    // por eso se mira **dentro** de la agenda, no en toda la página.
    const agendaList = document.querySelector('ol[data-tone]')
    expect(agendaList).not.toBeNull()
    expect(within(agendaList as HTMLElement).queryByText('Poner lavadora')).toBeNull()
    expect(within(agendaList as HTMLElement).queryByText('+ otra cosa')).toBeNull()
    expect(screen.queryByRole('button', { name: /^poner /i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /más opciones/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /copiar del/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Vaciar y rehacer' })).not.toBeInTheDocument()
  })

  it('criterio 38 — y lo dice sin reprochar nada (criterio 56)', () => {
    renderWithProviders(<VidaHoyPage />, {
      routerProps: { initialEntries: ['/app/vida/hoy?d=2026-09-17'] },
    })

    expect(
      screen.getByText(/Este día ya pasó: aquí queda como lo planeaste, para mirarlo/),
    ).toBeInTheDocument()
    expect(document.body.textContent ?? '').not.toMatch(
      /desperdici|perdiste|fallaste|no cumpliste/i,
    )
  })
})

describe('VidaHoyPage — el lateral pone en el primer hueco donde cabe (criterio 48)', () => {
  it('coloca con `activityDayPlanItemAdd` al principio del primer hueco que la admite', () => {
    // 9:24. El plan deja libre 6:30–8:00, 9:00–13:00 y 13:30–23:00; la primera
    // mitad ya pasó, así que el primer hueco vivo empieza **en ahora**.
    planQuery = ready([
      block('b1', 'Bañarme', '08:00', '09:00'),
      block('b2', 'Cocinar', '13:00', '13:30'),
    ])
    suggestionsQuery = ready([suggestion('s1', 'Poner lavadora', 20)])
    renderWithProviders(<VidaHoyPage />)

    const aside = screen.getByRole('complementary', { name: /tu plantilla de/i })
    fireEvent.click(
      within(aside).getByRole('button', { name: /en el primer hueco donde cabe/i }),
    )

    expect(addMutation.mutate).toHaveBeenCalledTimes(1)
    expect(addMutation.mutate).toHaveBeenCalledWith({
      date: '2026-09-18',
      activityId: 'a-s1',
      startTime: '09:24',
      endTime: '09:44',
    })
  })

  it('sin duración en la plantilla, la pone con la de por defecto (30 min)', () => {
    planQuery = ready([])
    suggestionsQuery = ready([suggestion('s1', 'Leer', null)])
    renderWithProviders(<VidaHoyPage />)

    const aside = screen.getByRole('complementary', { name: /tu plantilla de/i })
    fireEvent.click(
      within(aside).getByRole('button', { name: /en el primer hueco donde cabe/i }),
    )

    const call = addMutation.mutate.mock.calls[0]?.[0] as { startTime: string; endTime: string }
    expect(call.endTime).toBe(minutesLater(call.startTime, 30))
  })

  it('lo que ya está en el plan no ofrece el botón: se marca «en el plan»', () => {
    planQuery = ready([block('b1', 'Poner lavadora', '10:00', '10:20', 'a-s1')])
    suggestionsQuery = ready([suggestion('s1', 'Poner lavadora', 20)])
    renderWithProviders(<VidaHoyPage />)

    const aside = screen.getByRole('complementary', { name: /tu plantilla de/i })
    expect(within(aside).getByText('en el plan')).toBeInTheDocument()
    expect(
      within(aside).queryByRole('button', { name: /en el primer hueco donde cabe/i }),
    ).not.toBeInTheDocument()
  })

  it('si no cabe en ningún hueco, el botón queda apagado y dice por qué', () => {
    // El día entero ocupado: 6:30 → 23:00 de un tirón.
    planQuery = ready([block('b1', 'Todo el día', '06:30', '23:00')])
    suggestionsQuery = ready([suggestion('s1', 'Poner lavadora', 20)])
    renderWithProviders(<VidaHoyPage />)

    const aside = screen.getByRole('complementary', { name: /tu plantilla de/i })
    const button = within(aside).getByRole('button', { name: /no cabe hoy en ningún rato libre/i })
    expect(button).toBeDisabled()
    expect(within(aside).getByText(/No queda un rato de 20m en este día/)).toBeInTheDocument()
    expect(addMutation.mutate).not.toHaveBeenCalled()
  })

  it('en un día pasado no hay lateral, así que tampoco hay dónde poner (criterio 38)', () => {
    viewedDate = '2026-09-17'
    renderWithProviders(<VidaHoyPage />, {
      routerProps: { initialEntries: ['/app/vida/hoy?d=2026-09-17'] },
    })

    expect(screen.queryByRole('complementary', { name: /tu plantilla de/i })).not.toBeInTheDocument()
  })
})

/** `08:00` + 30 → `08:30`. Solo para leer la aserción de arriba. */
function minutesLater(time: string, minutes: number): string {
  const [h = '0', m = '0'] = time.split(':')
  const total = Number(h) * 60 + Number(m) + minutes
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

describe('VidaHoyPage — empezar y terminar un bloque (FEAT-004, tajada 1)', () => {
  it('criterio 1 — en hoy cada bloque trae «▶ Empezar»', () => {
    renderWithProviders(<VidaHoyPage />)

    expect(screen.getAllByRole('button', { name: '▶ Empezar' })).toHaveLength(PLAN.length)
  })

  it('criterio 1 — en un día futuro no se empieza nada', () => {
    viewedDate = '2026-09-19'
    plansByDate['2026-09-19'] = [block('c1', 'Leer un rato', '10:00', '10:30')]
    planQuery = ready(plansByDate['2026-09-19']!)
    renderWithProviders(<VidaHoyPage />, {
      routerProps: { initialEntries: ['/app/vida/hoy?d=2026-09-19'] },
    })

    expect(screen.queryByRole('button', { name: '▶ Empezar' })).not.toBeInTheDocument()
  })

  it('criterio 1 — en un día pasado tampoco: ahí se registra', () => {
    viewedDate = '2026-09-17'
    plansByDate['2026-09-17'] = [block('p1', 'Leer un rato', '10:00', '10:30')]
    planQuery = ready(plansByDate['2026-09-17']!)
    renderWithProviders(<VidaHoyPage />, {
      routerProps: { initialEntries: ['/app/vida/hoy?d=2026-09-17'] },
    })

    expect(screen.queryByRole('button', { name: '▶ Empezar' })).not.toBeInTheDocument()
  })

  it('criterio 2 y 17 — «Empezar» manda el `activityId` del bloque y la pantalla no recarga', () => {
    renderWithProviders(<VidaHoyPage />)

    fireEvent.click(screen.getAllByRole('button', { name: '▶ Empezar' })[1]!)

    // El segundo bloque del plan es «Leer un rato» (`a-b2`). La hora la pone
    // `startSessionInput` con el reloj, no el bloque: eso se prueba en el test
    // puro del `utils`.
    expect(startSession).toHaveBeenCalledWith('a-b2')
  })

  it('criterio 3 — el bloque en marcha se lee «planeado … · en marcha» con el cronómetro', () => {
    openSession = {
      session: openFollowUp('a-b2'),
      // Empezó a las 9:00 y el reloj del test son las 9:24: el cronómetro tiene
      // que marcar 24 minutos, no cero (no cuenta desde que se montó).
      startInstant: new Date(2026, 8, 18, 9, 0, 0),
      isFromAnotherDay: false,
      isDisabled: false,
      isPending: false,
    }
    renderWithProviders(<VidaHoyPage />)

    expect(screen.getByText('en marcha')).toBeInTheDocument()
    expect(screen.getByText('00:24:00')).toBeInTheDocument()
    // Y ese bloque ya no ofrece empezar: los otros dos sí.
    expect(screen.getAllByRole('button', { name: '▶ Empezar' })).toHaveLength(PLAN.length - 1)
  })

  it('criterio 5 — «Terminar» es un solo toque y no pregunta nada', () => {
    openSession = {
      session: openFollowUp('a-b2'),
      startInstant: new Date(2026, 8, 18, 9, 0, 0),
      isFromAnotherDay: false,
      isDisabled: false,
      isPending: false,
    }
    renderWithProviders(<VidaHoyPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Terminar' }))

    expect(finishSession).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('criterio 9 — pasarse del plan se dice y no interrumpe', () => {
    // «Leer un rato» tiene 30 min planeados y lleva 84: 9:00 → 9:24 no basta,
    // así que la sesión empieza a las 8:00.
    openSession = {
      session: openFollowUp('a-b2', '08:00'),
      startInstant: new Date(2026, 8, 18, 8, 0, 0),
      isFromAnotherDay: false,
      isDisabled: false,
      isPending: false,
    }
    renderWithProviders(<VidaHoyPage />)

    expect(screen.getByText('llevas 84 min · planeado 30')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('criterio 16 — con una sesión de otro día sin responder no se ofrece empezar', () => {
    openSession = {
      session: { ...openFollowUp('a-otra'), date: '2026-09-17' },
      startInstant: new Date(2026, 8, 17, 21, 0, 0),
      isFromAnotherDay: true,
      isDisabled: false,
      isPending: false,
    }
    renderWithProviders(<VidaHoyPage />)

    expect(screen.queryByRole('button', { name: '▶ Empezar' })).not.toBeInTheDocument()
  })
})
