import { act, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { UserSettings } from '@/features/settings/types/user-settings.types'
import { VidaSessionUiContext } from '@/features/vida/hooks/useVidaSessionUi'
import type { VidaStartNoteRequest } from '@/features/vida/hooks/useVidaSessionUi'
import { VidaHoyPage } from '@/features/vida/pages/VidaHoyPage'
import { useVidaDeviceNotesStore } from '@/features/vida/store/vida-device-notes.store'
import type { ActivityCategory } from '@/features/vida/types/activity-category.types'
import type { VidaGoal } from '@/features/vida/types/vida-goal.types'
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
/** Lo que se vivió ese día (FEAT-004, tajada 2). */
let dayFollowUpsQuery: Query<ActivityFollowUp[]>
/** El catálogo, de donde salen las metas del arco (FEAT-016, tajada 2). */
let categoriesQuery: Query<ActivityCategory[]>
let addMutation: { mutate: ReturnType<typeof vi.fn>; isPending: boolean; isError: boolean }
let editMutation: { mutate: ReturnType<typeof vi.fn>; isPending: boolean; isError: boolean }
let removeMutation: { mutate: ReturnType<typeof vi.fn>; isPending: boolean; isError: boolean }
let setMutation: { mutate: ReturnType<typeof vi.fn>; isPending: boolean; isError: boolean }
/** Las de sesión (FEAT-004, tajada 3): registrar, corregir y quitar. */
let createFollowUpMutation: { mutate: ReturnType<typeof vi.fn>; isPending: boolean; isError: boolean }
let updateFollowUpMutation: { mutate: ReturnType<typeof vi.fn>; isPending: boolean; isError: boolean }
let deleteFollowUpMutation: { mutate: ReturnType<typeof vi.fn>; isPending: boolean; isError: boolean }
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
  useActivityDayPlanQuery: (date: string) => {
    countCall('dayPlan')
    return date === viewedDate ? planQuery : ready(plansByDate[date] ?? [])
  },
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
  useVidaSuggestionsForDateQuery: () => {
    countCall('suggestions')
    return suggestionsQuery
  },
  // Desde la tajada 5: el bloque «Mañana» del lateral lee la plantilla entera
  // (`vidaItems`) para saber qué trae **mañana**, que no es el día visto.
  useVidaItemsQuery: () => itemsQuery,
  // **Espía de la plantilla** (FEAT-007, criterio 89): en Hoy, aceptar un aviso
  // cambia **el día**, nunca la plantilla. Hoy la página ni siquiera importa
  // esta mutación; el espía está para que se entere alguien si algún día sí.
  useUpdateVidaItemMutation: () => updateItemMutation,
}))
// Lo vivido del día visto (FEAT-004, tajada 2). Se mockea **la consulta**, no
// `useVidaDayData`: lo que hay que comprobar es que la pantalla cruza de verdad
// el plan con las sesiones.
// Las tres mutaciones de sesión entran desde la tajada 3: la hoja de registrar
// crea y corrige, y el «···» de una sesión la quita del registro.
vi.mock('@/features/vida/hooks/useActivityFollowUps', () => ({
  useActivityDayFollowUpsQuery: () => {
    countCall('dayFollowUps')
    return dayFollowUpsQuery
  },
  useCreateActivityFollowUpMutation: () => createFollowUpMutation,
  useUpdateActivityFollowUpMutation: () => updateFollowUpMutation,
  useDeleteActivityFollowUpMutation: () => deleteFollowUpMutation,
}))
/**
 * **El catálogo de categorías** (FEAT-016, tajada 2): de ahí salen las metas
 * del arco. Se mockea **el módulo entero y no solo la consulta** aunque hoy la
 * página use una sola cosa de él: un mock a medias es la trampa que
 * `ENVIRONMENT.md` ya documentó en esta misma feature —la suite sigue verde por
 * casualidad hasta que alguien recorre el camino que falta—.
 */
vi.mock('@/features/vida/hooks/useActivityCategories', () => ({
  useActivityCategoriesQuery: () => {
    countCall('categories')
    return categoriesQuery
  },
  useActivityCategoryQuery: () => ready(undefined),
  useCreateActivityCategoryMutation: () => categoryMutation,
  useUpdateActivityCategoryMutation: () => categoryMutation,
  useDeleteActivityCategoryMutation: () => categoryMutation,
  useSetActivityCategoryGoalMutation: () => categoryMutation,
}))
let categoryMutation: {
  mutate: ReturnType<typeof vi.fn>
  mutateAsync: ReturnType<typeof vi.fn>
  isPending: boolean
  isError: boolean
}
/**
 * **Los patrones de las últimas seis semanas** (FEAT-007, tajada 3). Se mockea
 * **el hook**, que es el único punto de entrada de las tres pantallas y tiene
 * su propio test; lo que esta pantalla tiene que hacer bien es **elegir** dos
 * avisos, pegarlos a su bloque y no tocar la plantilla al aceptarlos — y eso
 * pasa por `pickBlockHints` de verdad, que se ejecuta aquí sin mockear.
 *
 * Por defecto **vacío**: así, salvo que un caso diga lo contrario, Hoy es
 * exactamente el Hoy de FEAT-003/004 (criterio 92).
 */
let patternsResult: {
  patterns: unknown[]
  answerSuggestion: ReturnType<typeof vi.fn>
}
let patternsEnabled: boolean[]
/**
 * **Cuántas veces se pide cada cosa** (FEAT-010, criterio 204). «Lo que viene»
 * se deriva de lo que la pantalla ya tiene: si alguna vez estrena una consulta
 * o un hook, estos números lo dicen.
 */
let queryCalls: Record<string, number>
function countCall(name: string) {
  queryCalls[name] = (queryCalls[name] ?? 0) + 1
}
let updateItemMutation: { mutate: ReturnType<typeof vi.fn>; isPending: boolean; isError: boolean }
vi.mock('@/features/vida/hooks/useVidaPatterns', () => ({
  useVidaPatterns: (input: { enabled: boolean }) => {
    countCall('patterns')
    patternsEnabled.push(input.enabled)
    return patternsResult
  },
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
  useVidaOpenSession: () => {
    countCall('openSession')
    return openSession
  },
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

/**
 * **La fila del plan, no la tarjeta de «Lo que viene»** (FEAT-010). Desde que
 * la tarjeta existe, el nombre de lo propuesto se lee **dos veces** en la
 * pantalla **a propósito**: el bloque se queda en la lista, en su hora y con su
 * «▶ Empezar», y la tarjeta es una segunda entrada al mismo gesto (criterio
 * 211). Buscar el nombre a secas encuentra los dos; esto se queda con el del
 * plan.
 */
function planRow(title: string): HTMLElement {
  const row = screen
    .getAllByText(title)
    .map((node) => node.closest('li'))
    .find(
      (li): li is HTMLLIElement =>
        li !== null && li.querySelector('[aria-label="Lo que viene"]') === null,
    )
  if (!row) throw new Error(`No hay fila del plan para «${title}»`)
  return row
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
  vidaNightBedTime: null,
  vidaNightWakeTime: null,
  vidaNightDays: null,
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
  createFollowUpMutation = { mutate: vi.fn(), isPending: false, isError: false }
  updateFollowUpMutation = { mutate: vi.fn(), isPending: false, isError: false }
  deleteFollowUpMutation = { mutate: vi.fn(), isPending: false, isError: false }
  planQuery = ready(PLAN)
  suggestionsQuery = ready([
    suggestion('s1', 'Poner lavadora', 20),
    suggestion('s2', 'Compra de la semana', 240),
  ])
  settingsQuery = ready(SETTINGS)
  dayFollowUpsQuery = ready([])
  categoriesQuery = ready([])
  categoryMutation = {
    mutate: vi.fn(),
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
    isError: false,
  }
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
  patternsResult = { patterns: [], answerSuggestion: vi.fn() }
  updateItemMutation = { mutate: vi.fn(), isPending: false, isError: false }
  patternsEnabled = []
  queryCalls = {}
  // Las notas de aparato viven fuera de React y **no se limpian solas**.
  // Devolverlas aquí y no al final de cada prueba: una limpieza al final solo
  // corre si la prueba pasa, y una asercion caída dejaría a las siguientes un
  // día con bloques «no se pudo» —el fallo en cascada que esconde la causa.
  // Lo mismo vale para lo que dormiste (FEAT-012, tajada 3): una noche
  // confirmada en una prueba haría que la siguiente no viera la pregunta.
  useVidaDeviceNotesStore.setState({ blockNotes: {}, nightLogs: {} })
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

    // Icono, color y duración de cada bloque. Desde la tajada 4 la duración de
    // un bloque **cuya hora ya pasó** se lee dentro de «planeado 45 min ·
    // pendiente» (criterio 39), así que se busca en su fila y no suelta: lo que
    // este caso afirma —que el bloque dice cuánto dura— no cambia.
    expect(planRow('Bañarme')).toHaveTextContent('45 min')
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
    expect(planRow('Bañarme')).toBeInTheDocument()
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
    // 10:30–13:00 partido: lo que pasó se lee, y **sin fichas de plan** —desde
    // FEAT-011 trae su única salida, la de contar qué hiciste (criterio 220)—.
    const pasado = screen.getByLabelText('Libre de 10:30 – 11:30')
    expect(within(pasado).getByText('Libre 10:30 – 11:30')).toBeInTheDocument()
    expect(within(pasado).getByText('1h')).toBeInTheDocument()
    expect(
      within(pasado).getByRole('button', { name: 'Registrar lo que hiciste entre las 10:30 y las 11:30' }),
    ).toBeInTheDocument()
    expect(within(pasado).queryByRole('button', { name: /^Poner / })).toBeNull()
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
    const pasado = screen.getByLabelText('Libre de 6:30 – 9:24')
    expect(within(pasado).getByText('Libre 6:30 – 9:24')).toBeInTheDocument()
    expect(within(pasado).getByText('2h 54')).toBeInTheDocument()
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
    expect(planRow('Bañarme')).toBeInTheDocument()
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

/* ── Lo real encima de lo planeado (FEAT-004, tajada 2) ────────────────────
 *
 * Criterios 18 a 29 vistos **en la pantalla**. La aritmética del cruce y del
 * presupuesto tiene su propio test puro y exhaustivo en
 * `utils/vida-execution.utils.test.ts`; aquí se comprueba que la página la
 * cablea: que los bloques se quedan en su hora, que lo que no es de ningún
 * bloque se pinta en la suya y que la leyenda cambia de forma cuando toca.
 */
describe('VidaHoyPage — lo real encima de lo planeado (FEAT-004, tajada 2)', () => {
  /** Una sesión cerrada de ese día. */
  function done(
    id: string,
    activityId: string,
    startTime: string,
    durationMinutes: number,
    title = 'Actividad',
  ): ActivityFollowUp {
    return {
      id,
      activityId,
      date: '2026-09-18',
      startTime,
      durationMinutes,
      isOpen: false,
      endTime: null,
      endDate: null,
      endDateTime: null,
      notes: null,
      activity: { id: activityId, title, category: null },
    }
  }

  it('criterios 18 y 20 — el bloque se queda en su hora y enseña «✓ calcado»', () => {
    dayFollowUpsQuery = ready([done('f1', 'a-b1', '08:02', 44, 'Bañarme')])
    renderWithProviders(<VidaHoyPage />)

    expect(screen.getByText('✓ calcado')).toBeInTheDocument()
    // Las **horas reales** al lado, y el bloque sigue a las 8:00.
    expect(screen.getByText('8:02 – 8:46')).toBeInTheDocument()
    expect(screen.getByText('8:00')).toBeInTheDocument()
  })

  it('criterios 20 y 21 — «+N min» con su barrita «plan 45 · real 63»', () => {
    dayFollowUpsQuery = ready([done('f1', 'a-b1', '08:05', 63, 'Bañarme')])
    renderWithProviders(<VidaHoyPage />)

    expect(screen.getByText('+18 min')).toBeInTheDocument()
    expect(screen.getByText('plan 45 · real 63')).toBeInTheDocument()
  })

  it('criterio 20 — «empezó +N» cuando arranca tarde dentro del umbral', () => {
    dayFollowUpsQuery = ready([done('f1', 'a-b1', '08:30', 45, 'Bañarme')])
    renderWithProviders(<VidaHoyPage />)

    expect(screen.getByText('empezó +30')).toBeInTheDocument()
  })

  it('criterio 22 — lo que no es de ningún bloque se pinta fuera del plan, en su hora', () => {
    dayFollowUpsQuery = ready([done('f1', 'otra', '08:50', 25, 'Llamada con el banco')])
    renderWithProviders(<VidaHoyPage />)

    expect(screen.getByText('fuera del plan')).toBeInTheDocument()
    expect(screen.getByText('Llamada con el banco')).toBeInTheDocument()
    expect(screen.getByText('8:50 – 9:15 · 25m')).toBeInTheDocument()
    // Y el plan **no se toca**: los tres bloques siguen ahí.
    expect(planRow('Bañarme')).toBeInTheDocument()
  })

  it('criterio 23 — el movido deja sombra con «→ hecho a las 11:40» y lo real donde ocurrió', () => {
    dayFollowUpsQuery = ready([done('f1', 'a-b2', '11:40', 32, 'Leer un rato')])
    renderWithProviders(<VidaHoyPage />)

    expect(screen.getByText('→ hecho a las 11:40')).toBeInTheDocument()
    expect(screen.getByText('100 min tarde')).toBeInTheDocument()
    // Contado **una vez**: no aparecen dos veces las horas reales.
    expect(screen.getAllByText('11:40 – 12:12 · 32m')).toHaveLength(1)
  })

  it('criterio 24 — con el día en marcha la leyenda es hecho · en marcha · planeado · libre', () => {
    // `f9` y no `f1`: la sesión abierta del mock ya se llama `f1` y la página
    // no la duplica cuando el día ya la trae.
    dayFollowUpsQuery = ready([done('f9', 'a-b1', '08:00', 45, 'Bañarme')])
    openSession = {
      session: openFollowUp('a-b2', '09:00'),
      startInstant: new Date(2026, 8, 18, 9, 0, 0),
      isFromAnotherDay: false,
      isDisabled: false,
      isPending: false,
    }
    renderWithProviders(<VidaHoyPage />)

    expect(screen.getByText(/^hecho /)).toBeInTheDocument()
    expect(screen.getByText(/^en marcha /)).toBeInTheDocument()
    // «planeado» sale dos veces: en la leyenda y en el bloque en marcha
    // («planeado 30 min · en marcha»). Las dos dicen lo mismo.
    expect(screen.getAllByText(/^planeado /).length).toBeGreaterThan(0)
    expect(screen.getByText(/^libre /)).toBeInTheDocument()
    expect(screen.queryByText(/^seguido /)).not.toBeInTheDocument()
  })

  it('criterios 24 y 25 — con el día cerrado son seguido · de más · fuera del plan · sin dato, y lo dice', () => {
    viewedDate = '2026-09-16'
    dayFollowUpsQuery = ready([
      { ...done('f1', 'a-b1', '08:00', 60, 'Bañarme'), date: '2026-09-16' },
      { ...done('f2', 'otra', '11:00', 30, 'Llamada'), date: '2026-09-16' },
    ])
    planQuery = ready(PLAN.map((item) => ({ ...item, date: '2026-09-16' })))
    renderWithProviders(<VidaHoyPage />, {
      routerProps: { initialEntries: ['/app/vida/hoy?d=2026-09-16'] },
    })

    expect(screen.getByText(/^seguido /)).toBeInTheDocument()
    expect(screen.getByText(/^de más /)).toBeInTheDocument()
    expect(screen.getByText(/^fuera del plan /)).toBeInTheDocument()
    expect(screen.getByText(/^sin dato /)).toBeInTheDocument()
    expect(screen.getByText('Tu día ya terminó: esto es lo que pasó.')).toBeInTheDocument()
    expect(screen.queryByText(/^hecho /)).not.toBeInTheDocument()
  })

  it('criterio 29 — un día con plan y nada registrado se ve como lo dejó F2', () => {
    renderWithProviders(<VidaHoyPage />)

    // La leyenda, y no toda la página: desde la tajada 4 un bloque pendiente
    // también empieza por «planeado» (criterio 39). Lo que este caso afirma
    // —que la **barra** sigue en la forma de F2— es lo de dentro del
    // presupuesto.
    const presupuesto = document.getElementById('vida-budget-heading')!.closest('section')!
    expect(within(presupuesto).getByText(/^planeado /)).toBeInTheDocument()
    expect(within(presupuesto).getByText(/^libre /)).toBeInTheDocument()
    expect(screen.queryByText(/^hecho /)).not.toBeInTheDocument()
    expect(screen.queryByText(/^sin dato /)).not.toBeInTheDocument()
    expect(screen.queryByText('✓ calcado')).not.toBeInTheDocument()
  })

  it('criterio 1 (su otra mitad) — un bloque que ya tiene sesión no ofrece «▶ Empezar»', () => {
    dayFollowUpsQuery = ready([done('f1', 'a-b1', '08:00', 45, 'Bañarme')])
    renderWithProviders(<VidaHoyPage />)

    expect(screen.getAllByRole('button', { name: '▶ Empezar' })).toHaveLength(PLAN.length - 1)
  })

  it('criterio 58 — si falla lo vivido se dice qué falta y el plan se sigue viendo', () => {
    dayFollowUpsQuery = {
      isPending: false,
      isError: true,
      fetchStatus: 'idle',
      refetch: vi.fn(),
    }
    renderWithProviders(<VidaHoyPage />)

    expect(screen.getByText(/No pudimos cargar lo que viviste/)).toBeInTheDocument()
    expect(planRow('Bañarme')).toBeInTheDocument()
    // Y **no se afirma nada** de lo vivido: ni tramos nuevos ni etiquetas.
    expect(screen.queryByText(/^sin dato /)).not.toBeInTheDocument()
    expect(screen.queryByText('✓ calcado')).not.toBeInTheDocument()
  })
})

/* ── Registrar lo que se sale (FEAT-004, tajada 3) ───────────────────────── */

describe('VidaHoyPage — registrar lo que se sale (criterios 30 a 37 y 56)', () => {
  function loose(
    id: string,
    activityId: string,
    startTime: string,
    durationMinutes: number,
    title = 'Llamada con el banco',
    date = '2026-09-18',
  ): ActivityFollowUp {
    return {
      id,
      activityId,
      date,
      startTime,
      durationMinutes,
      isOpen: false,
      endTime: null,
      endDate: null,
      endDateTime: null,
      notes: null,
      activity: { id: activityId, title, category: null },
    }
  }

  it('criterio 32 — hoy trae los dos: «Empezar algo» y «Registrar tiempo pasado»', () => {
    renderWithProviders(<VidaHoyPage />)

    expect(screen.getByRole('button', { name: 'Empezar algo' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Registrar tiempo pasado' })).toBeInTheDocument()
  })

  it('criterios 32 y 56 — un día pasado registra, pero no empieza ni planea', () => {
    plansByDate = {
      '2026-09-17': [{ ...block('x1', 'Leer un rato', '09:00', '09:30'), date: '2026-09-17' }],
    }
    renderWithProviders(<VidaHoyPage />, {
      routerProps: { initialEntries: ['/app/vida/hoy?d=2026-09-17'] },
    })

    expect(screen.getByRole('button', { name: 'Registrar tiempo pasado' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Empezar algo' })).not.toBeInTheDocument()
    // Y sigue sin haber **un solo** botón de plan (criterio 56).
    expect(screen.queryByRole('button', { name: /copiar del/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Vaciar y rehacer' })).not.toBeInTheDocument()
  })

  it('criterio 32 — en un día futuro no hay ninguno de los dos', () => {
    renderWithProviders(<VidaHoyPage />, {
      routerProps: { initialEntries: ['/app/vida/hoy?d=2026-09-19'] },
    })

    expect(screen.queryByRole('button', { name: 'Empezar algo' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Registrar tiempo pasado' })).not.toBeInTheDocument()
  })

  it('criterio 30 — «Empezar algo» no pide duración y arranca ahora mismo', async () => {
    renderWithProviders(<VidaHoyPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Empezar algo' }))

    const sheet = screen.getByRole('dialog')
    expect(within(sheet).getByText('Empezar algo')).toBeInTheDocument()
    // **No pide duración**: una sesión abierta no la tiene.
    expect(within(sheet).queryByText('Cuánto duró')).not.toBeInTheDocument()
    expect(within(sheet).queryByRole('group', { name: 'Cuánto duró' })).not.toBeInTheDocument()

    fireEvent.click(within(sheet).getByRole('button', { name: /Poner lavadora/ }))
    fireEvent.click(within(sheet).getByRole('button', { name: 'Empezar' }))
    await act(async () => {})

    // Sin tocar la hora, el gesto es el de siempre: la pone el reloj.
    expect(startSession).toHaveBeenCalledWith('a-s1', undefined)
  })

  it('criterios 622 a 625 — «Empezar algo» ofrece cinco fichas, una por actividad y sin duración', () => {
    // El caso reportado: la misma actividad en tres ratos de la plantilla, y
    // más ítems de los que caben en la pantalla. El reloj del test son las 9:24.
    suggestionsQuery = ready([
      suggestion('lulu-am', 'Working at lululemon', 60, {
        activityId: 'a-lulu',
        startTime: '07:00',
        activity: { id: 'a-lulu', title: 'Working at lululemon', category: null },
      }),
      suggestion('lulu-pm', 'Working at lululemon', 240, {
        activityId: 'a-lulu',
        startTime: '10:00',
        activity: { id: 'a-lulu', title: 'Working at lululemon', category: null },
      }),
      suggestion('lulu-noche', 'Working at lululemon', 120, {
        activityId: 'a-lulu',
        startTime: '20:00',
        activity: { id: 'a-lulu', title: 'Working at lululemon', category: null },
      }),
      suggestion('des', 'Desayunar', 30, { startTime: '11:00' }),
      suggestion('casa', 'Organizar la casa', 15, { startTime: '12:00' }),
      suggestion('pas', 'Pasear', 30, { startTime: '13:00' }),
      suggestion('leer', 'Leer', 45, { startTime: '14:00' }),
      suggestion('estudiar', 'Estudiar', 60, { startTime: '15:00' }),
    ])

    renderWithProviders(<VidaHoyPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Empezar algo' }))

    const sheet = screen.getByRole('dialog')
    const options = within(sheet)
      .getAllByRole('button')
      .filter((button) => button.closest('li') !== null)

    // Cinco como mucho, ordenadas por lo que toca ahora: el bloque de las 10
    // representa a «Working at lululemon» y «Estudiar» (15:00) se queda fuera.
    expect(options.map((button) => button.textContent)).toEqual([
      'Working at lululemon',
      'Desayunar',
      'Organizar la casa',
      'Pasear',
      'Leer',
    ])
    // Ninguna ficha indistinguible de otra: la actividad repetida sale una vez.
    expect(within(sheet).getAllByRole('button', { name: 'Working at lululemon' })).toHaveLength(1)
    expect(within(sheet).queryByRole('button', { name: /Estudiar/ })).not.toBeInTheDocument()
    // Y el resto sigue alcanzable: el buscador y la hora están en la hoja.
    expect(within(sheet).getByLabelText('Buscar entre tus actividades')).toBeInTheDocument()
    expect(within(sheet).getByLabelText('Hora a la que empezaste')).toBeInTheDocument()
  })

  it('criterio 629 — sin plantilla activa, la hoja no se rompe: aviso y buscador', () => {
    suggestionsQuery = ready([])

    renderWithProviders(<VidaHoyPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Empezar algo' }))

    const sheet = screen.getByRole('dialog')
    expect(within(sheet).getByText(/no tiene nada más que ofrecer aquí/)).toBeInTheDocument()
    expect(within(sheet).getByLabelText('Buscar entre tus actividades')).toBeInTheDocument()
  })

  it('«Registrar tiempo pasado» sigue viendo la plantilla entera, con sus duraciones', () => {
    suggestionsQuery = ready([
      suggestion('lulu-am', 'Working at lululemon', 60, {
        activityId: 'a-lulu',
        startTime: '07:00',
        activity: { id: 'a-lulu', title: 'Working at lululemon', category: null },
      }),
      suggestion('lulu-pm', 'Working at lululemon', 240, {
        activityId: 'a-lulu',
        startTime: '10:00',
        activity: { id: 'a-lulu', title: 'Working at lululemon', category: null },
      }),
    ])

    renderWithProviders(<VidaHoyPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Registrar tiempo pasado' }))

    const sheet = screen.getByRole('dialog')
    const options = within(sheet)
      .getAllByRole('button')
      .filter((button) => button.closest('li') !== null)

    expect(options.map((button) => button.textContent)).toEqual([
      'Working at lululemon1h',
      'Working at lululemon4h',
    ])
  })

  it('criterios 330 y 331b — «empecé a las 8:07 y sigo» es **una** acción y **una** sesión', async () => {
    renderWithProviders(<VidaHoyPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Empezar algo' }))

    const sheet = screen.getByRole('dialog')
    // La hoja parte de **ahora** (el reloj del test son las 9:24).
    expect(within(sheet).getByLabelText('Hora a la que empezaste')).toHaveValue('09:24')

    fireEvent.click(within(sheet).getByRole('button', { name: /Poner lavadora/ }))
    fireEvent.change(within(sheet).getByLabelText('Hora a la que empezaste'), {
      target: { value: '08:07' },
    })
    fireEvent.click(within(sheet).getByRole('button', { name: 'Empezar' }))
    await act(async () => {})

    expect(startSession).toHaveBeenCalledTimes(1)
    expect(startSession).toHaveBeenCalledWith('a-s1', '08:07')
    // **Cero** `activityFollowUpAdd`: el trozo pasado no se registra aparte.
    expect(createFollowUpMutation.mutate).not.toHaveBeenCalled()
  })

  it('criterios 31, 33 y 37 — registrar un rato pasado escribe la sesión y no toca el plan', async () => {
    renderWithProviders(<VidaHoyPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Registrar tiempo pasado' }))

    const sheet = screen.getByRole('dialog')
    fireEvent.click(within(sheet).getByRole('button', { name: /Poner lavadora/ }))
    fireEvent.change(within(sheet).getByLabelText('Hora a la que empezó'), {
      target: { value: '08:00' },
    })
    // Las píldoras del criterio 31: 15 · 30 · 45 · 1h · libre.
    const pills = within(sheet).getByRole('group', { name: 'Cuánto duró' })
    expect(within(pills).getByRole('button', { name: '15' })).toBeInTheDocument()
    expect(within(pills).getByRole('button', { name: '1h' })).toBeInTheDocument()
    expect(within(pills).getByRole('button', { name: 'libre' })).toBeInTheDocument()
    fireEvent.click(within(pills).getByRole('button', { name: '45' }))
    fireEvent.click(within(sheet).getByRole('button', { name: 'Registrar' }))
    await act(async () => {})

    expect(createFollowUpMutation.mutate).toHaveBeenCalledTimes(1)
    expect(createFollowUpMutation.mutate.mock.calls[0][0]).toEqual({
      activityId: 'a-s1',
      date: '2026-09-18',
      startTime: '08:00',
      durationMinutes: 45,
      notes: null,
    })
    // **Registrar no toca el plan** (criterio 37): ninguna de las cuatro
    // mutaciones de `activityDayPlan` se llamó.
    expect(addMutation.mutate).not.toHaveBeenCalled()
    expect(editMutation.mutate).not.toHaveBeenCalled()
    expect(removeMutation.mutate).not.toHaveBeenCalled()
    expect(setMutation.mutate).not.toHaveBeenCalled()
  })

  it('criterio 33 — lo registrado ya se veía en su hora, y ahora además se puede tocar', () => {
    dayFollowUpsQuery = ready([loose('f9', 'otra', '11:40', 32)])
    renderWithProviders(<VidaHoyPage />)

    expect(screen.getByText('Llamada con el banco')).toBeInTheDocument()
    expect(screen.getByText('fuera del plan')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Más opciones de Llamada con el banco' }),
    ).toBeInTheDocument()
  })

  it('criterio 35 — «Corregir» abre la hoja con esa sesión, hora, duración y notas', async () => {
    // Un rato **que ya pasó** a las 9:24 de la mañana del fixture: corregir
    // valida contra el reloj igual que registrar, así que la sesión de las
    // 11:40 que usan los demás casos no serviría aquí.
    dayFollowUpsQuery = ready([loose('f9', 'otra', '08:10', 32)])
    renderWithProviders(<VidaHoyPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Más opciones de Llamada con el banco' }))
    fireEvent.click(screen.getByRole('button', { name: 'Corregir' }))

    // El `Popover` que se acaba de usar también es un `dialog`: la hoja es el
    // último que se montó.
    const sheet = screen.getAllByRole('dialog').at(-1) as HTMLElement
    expect(within(sheet).getByText('Corregir «Llamada con el banco»')).toBeInTheDocument()
    expect(within(sheet).getByLabelText('Hora a la que empezó')).toHaveValue('08:10')
    expect(within(sheet).getByLabelText('Notas de esta sesión')).toBeInTheDocument()

    fireEvent.change(within(sheet).getByLabelText('Hora a la que empezó'), {
      target: { value: '08:00' },
    })
    fireEvent.click(within(sheet).getByRole('button', { name: 'Guardar' }))
    await act(async () => {})

    expect(updateFollowUpMutation.mutate.mock.calls[0][0]).toEqual({
      id: 'f9',
      startTime: '08:00',
      durationMinutes: 32,
      notes: null,
    })
  })

  it('criterio 35 — «Quitar del registro» pide confirmación y sale por «Volver»', async () => {
    dayFollowUpsQuery = ready([loose('f9', 'otra', '11:40', 32)])
    renderWithProviders(<VidaHoyPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Más opciones de Llamada con el banco' }))
    fireEvent.click(screen.getByRole('button', { name: 'Quitar del registro' }))

    expect(screen.getByText('¿Quitar «Llamada con el banco» del registro?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Volver' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /cancelar|eliminar/i })).not.toBeInTheDocument()

    fireEvent.click(
      screen.getAllByRole('button', { name: 'Quitar del registro' }).at(-1) as HTMLElement,
    )
    await act(async () => {})

    expect(deleteFollowUpMutation.mutate).toHaveBeenCalledWith({
      id: 'f9',
      date: '2026-09-18',
      activityId: 'otra',
      wasOpen: false,
    })
  })

  it('una sesión **en marcha** no se corrige: se termina', () => {
    dayFollowUpsQuery = ready([
      { ...loose('f9', 'otra', '09:10', 0), durationMinutes: null, isOpen: true },
    ])
    renderWithProviders(<VidaHoyPage />)

    expect(screen.getByText('Llamada con el banco')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Más opciones de Llamada con el banco' }),
    ).not.toBeInTheDocument()
  })
})

/* ── Lo que falta (FEAT-004, tajada 4): criterios 39 a 51, 58 ───────────── */

describe('VidaHoyPage — pendiente, las tres salidas, sin dato y la frase de cierre', () => {
  /** Una sesión ya cerrada, la que deja «Empezar» + «Terminar» sobre un bloque. */
  function closedFollowUp(
    id: string,
    activityId: string,
    title: string,
    startTime: string,
    durationMinutes: number,
    date = '2026-09-18',
  ): ActivityFollowUp {
    return {
      id,
      activityId,
      date,
      startTime,
      durationMinutes,
      isOpen: false,
      endTime: null,
      endDate: null,
      endDateTime: null,
      notes: null,
      activity: { id: activityId, title, category: null },
    }
  }

  beforeEach(() => {
    // El store del aparato es un singleton: cada caso empieza sin nada dicho.
    useVidaDeviceNotesStore.setState({ blockNotes: {}, dismissedNoData: [] })
    window.localStorage.clear()
  })

  it('criterio 39 — al pasar su hora el bloque se lee «pendiente», no «no hecho»', () => {
    // Son las 9:24: «Bañarme» (08:00–08:45) ya pasó y «Leer un rato» (10:00) no.
    renderWithProviders(<VidaHoyPage />)

    const banarme = planRow('Bañarme')
    expect(within(banarme).getByText('pendiente')).toBeInTheDocument()
    expect(screen.queryByText('no hecho')).not.toBeInTheDocument()
    const leer = screen.getByText('Leer un rato').closest('li')!
    expect(within(leer).queryByText('pendiente')).not.toBeInTheDocument()
  })

  it('criterio 39 — el día cerrado ya dice «no hecho»', () => {
    vi.setSystemTime(new Date(2026, 8, 18, 23, 10, 0))
    dayFollowUpsQuery = ready([closedFollowUp('f9', 'a-b1', 'Bañarme', '08:00', 45)])
    renderWithProviders(<VidaHoyPage />)

    const leer = screen.getByText('Leer un rato').closest('li')!
    expect(within(leer).getByText('no hecho')).toBeInTheDocument()
    expect(screen.queryByText('pendiente')).not.toBeInTheDocument()
  })

  it('criterios 40 y 60 — las tres salidas, las tres a un toque y del mismo tipo', () => {
    renderWithProviders(<VidaHoyPage />)

    const banarme = planRow('Bañarme')
    const grupo = within(banarme).getByRole('group', { name: 'Qué pasó con Bañarme' })
    const botones = within(grupo).getAllByRole('button')
    expect(botones.map((boton) => boton.textContent)).toEqual([
      'Lo hice',
      'Hice otra cosa',
      'No se pudo',
    ])
    // Mismo peso visual: las tres son **el mismo control**, con la misma clase.
    expect(new Set(botones.map((boton) => boton.className)).size).toBe(1)
  })

  it('criterio 41 — «Lo hice» registra la hora y la duración planeadas', () => {
    renderWithProviders(<VidaHoyPage />)

    const banarme = planRow('Bañarme')
    fireEvent.click(within(banarme).getByRole('button', { name: 'Lo hice' }))

    expect(createFollowUpMutation.mutate).toHaveBeenCalledWith({
      activityId: 'a-b1',
      date: '2026-09-18',
      startTime: '08:00',
      durationMinutes: 45,
      notes: null,
    })
    // Y **no toca el plan** (criterio 37, que sigue valiendo aquí).
    expect(addMutation.mutate).not.toHaveBeenCalled()
    expect(editMutation.mutate).not.toHaveBeenCalled()
    expect(removeMutation.mutate).not.toHaveBeenCalled()
    expect(setMutation.mutate).not.toHaveBeenCalled()
  })

  it('criterio 41 — «Lo hice» a mitad del bloque recorta a «ahora», no al futuro', () => {
    // 9:24, con un bloque de 9:00 a 10:00: se registran 24 minutos, no 60.
    planQuery = ready([block('b9', 'Estirar', '09:00', '10:00')])
    renderWithProviders(<VidaHoyPage />)

    const fila = planRow('Estirar')
    // A esta hora el bloque aún no es «pendiente», así que las salidas no se
    // ofrecen: esto comprueba la red de debajo, no la puerta.
    expect(within(fila).queryByRole('button', { name: 'Lo hice' })).not.toBeInTheDocument()
  })

  it('criterios 35 y 41 — la sesión de un bloque se corrige y se quita desde su «···»', async () => {
    vi.setSystemTime(new Date(2026, 8, 18, 23, 10, 0))
    dayFollowUpsQuery = ready([closedFollowUp('f1', 'a-b1', 'Bañarme', '08:00', 45)])
    renderWithProviders(<VidaHoyPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Más opciones de Bañarme' }))
    fireEvent.click(screen.getByRole('button', { name: 'Corregir' }))

    const hoja = screen
      .getAllByRole('dialog')
      .find((node) => node.textContent?.includes('Corregir «Bañarme»'))!
    expect(within(hoja).getByText('Corregir «Bañarme»')).toBeInTheDocument()
    expect(within(hoja).getByLabelText('Hora a la que empezó')).toHaveValue('08:00')
    fireEvent.click(within(hoja).getByRole('button', { name: 'Volver' }))

    // Y «Quitar del registro», con confirmación que nombra qué se quita y
    // salida **«Volver»**, que no llama a la mutación.
    async function abrirConfirmacion() {
      fireEvent.click(screen.getByRole('button', { name: 'Más opciones de Bañarme' }))
      // El primero es el del menú: el del diálogo, si quedara alguno montado,
      // va después en el DOM porque se pinta en un portal al final del `body`.
      fireEvent.click(screen.getAllByRole('button', { name: 'Quitar del registro' })[0]!)
      await act(async () => {})
      return screen
        .getAllByRole('dialog')
        .find((node) => node.textContent?.includes('¿Quitar «Bañarme» del registro?'))!
    }

    const confirmacion = await abrirConfirmacion()
    expect(within(confirmacion).getByText('¿Quitar «Bañarme» del registro?')).toBeInTheDocument()
    fireEvent.click(within(confirmacion).getByRole('button', { name: 'Volver' }))
    await act(async () => {})
    expect(deleteFollowUpMutation.mutate).not.toHaveBeenCalled()

    const otraVez = await abrirConfirmacion()
    fireEvent.click(within(otraVez).getByRole('button', { name: 'Quitar del registro' }))
    await act(async () => {})
    expect(deleteFollowUpMutation.mutate).toHaveBeenCalledWith({
      id: 'f1',
      date: '2026-09-18',
      activityId: 'a-b1',
      wasOpen: false,
    })
  })

  it('criterios 41 y 46 — también en un día pasado, donde no se planea', () => {
    viewedDate = '2026-09-17'
    planQuery = ready([{ ...block('p1', 'Bañarme', '08:00', '08:45'), date: '2026-09-17' }])
    dayFollowUpsQuery = ready([
      closedFollowUp('f2', 'a-p1', 'Bañarme', '08:00', 45, '2026-09-17'),
    ])
    renderWithProviders(<VidaHoyPage />, {
      routerProps: { initialEntries: ['/app/vida/hoy?d=2026-09-17'] },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Más opciones de Bañarme' }))
    expect(screen.getByRole('button', { name: 'Corregir' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Quitar del registro' })).toBeInTheDocument()
    // Cero controles de **plan** en un día pasado (criterio 56).
    expect(screen.queryByRole('button', { name: 'Quitar del plan' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cambiar hora o duración' })).not.toBeInTheDocument()
  })

  it('criterio 42 — «Hice otra cosa» abre la hoja con el rato del bloque puesto', () => {
    renderWithProviders(<VidaHoyPage />)

    const banarme = planRow('Bañarme')
    fireEvent.click(within(banarme).getByRole('button', { name: 'Hice otra cosa' }))

    const hoja = screen
      .getAllByRole('dialog')
      .find((node) => node.textContent?.includes('Registrar tiempo pasado'))!
    expect(within(hoja).getByText('Registrar tiempo pasado')).toBeInTheDocument()
    expect(within(hoja).getByLabelText('Hora a la que empezó')).toHaveValue('08:00')
    // La duración planeada viene elegida y se puede cambiar antes de guardar.
    expect(within(hoja).getByRole('button', { name: '45' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('criterio 42 — el bloque queda no hecho pero **explicado**, con vía a lo que pasó', () => {
    vi.setSystemTime(new Date(2026, 8, 18, 23, 10, 0))
    dayFollowUpsQuery = ready([
      closedFollowUp('f3', 'a-otra', 'Llamada con el banco', '08:05', 30),
    ])
    renderWithProviders(<VidaHoyPage />)

    const banarme = planRow('Bañarme')
    expect(within(banarme).getByText('no hecho')).toBeInTheDocument()
    expect(within(banarme).getByText('en su lugar,', { exact: false })).toBeInTheDocument()
    const via = within(banarme).getByRole('link', { name: 'Llamada con el banco' })
    expect(via).toHaveAttribute('href', '#session-f3')
    // Y el plan **no se movió**: el bloque sigue en su hora.
    expect(within(banarme).getByText('8:00')).toBeInTheDocument()
    expect(document.getElementById('session-f3')).not.toBeNull()
  })

  it('criterios 43, 44 y 45 — «No se pudo», con razón opcional y dicho en el aparato', () => {
    renderWithProviders(<VidaHoyPage />)

    const banarme = () => planRow('Bañarme')
    fireEvent.click(within(banarme()).getByRole('button', { name: 'No se pudo' }))

    // Marcado al instante: no contar nada ya es una respuesta válida.
    expect(within(banarme()).getByText('no se pudo')).toBeInTheDocument()
    // Y se dice dónde se queda la nota (criterio 44).
    expect(
      within(banarme()).getByText('Esta nota se queda en este dispositivo.'),
    ).toBeInTheDocument()

    fireEvent.change(within(banarme()).getByLabelText('Si quieres, cuenta qué pasó'), {
      target: { value: 'me quedé dormido' },
    })
    fireEvent.click(within(banarme()).getByRole('button', { name: 'Guardar' }))

    expect(within(banarme()).getByText('· me quedé dormido')).toBeInTheDocument()
    expect(window.localStorage.getItem('xavi.vida.deviceNotes')).toContain('me quedé dormido')

    // Se puede quitar después.
    fireEvent.click(within(banarme()).getByRole('button', { name: 'Quitar la nota' }))
    expect(within(banarme()).queryByText('no se pudo')).not.toBeInTheDocument()
  })

  it('criterios 47 y 48 — los tramos sin dato tienen nombre, horas y «¿Qué pasó?»', () => {
    vi.setSystemTime(new Date(2026, 8, 18, 23, 10, 0))
    dayFollowUpsQuery = ready([closedFollowUp('f4', 'a-b1', 'Bañarme', '08:00', 45)])
    renderWithProviders(<VidaHoyPage />)

    const tramos = screen.getAllByText('Sin dato')
    expect(tramos.length).toBeGreaterThan(0)
    const manana = tramos[0]!.closest('li')!
    expect(within(manana).getByText('6:30 – 8:00 · 1h 30')).toBeInTheDocument()
    expect(within(manana).getByRole('button', { name: '¿Qué pasó?' })).toBeInTheDocument()
    expect(within(manana).getByRole('button', { name: 'Dejarlo así' })).toBeInTheDocument()

    fireEvent.click(within(manana).getByRole('button', { name: '¿Qué pasó?' }))
    const hoja = screen
      .getAllByRole('dialog')
      .find((node) => node.textContent?.includes('Registrar tiempo pasado'))!
    expect(within(hoja).getByLabelText('Hora a la que empezó')).toHaveValue('06:30')
  })

  it('criterio 49 — tras «dejarlo así» el tramo sigue, pero ya no pregunta', () => {
    vi.setSystemTime(new Date(2026, 8, 18, 23, 10, 0))
    dayFollowUpsQuery = ready([closedFollowUp('f5', 'a-b1', 'Bañarme', '08:00', 45)])
    const { unmount } = renderWithProviders(<VidaHoyPage />)

    const manana = () => screen.getAllByText('Sin dato')[0]!.closest('li')!
    fireEvent.click(within(manana()).getByRole('button', { name: 'Dejarlo así' }))

    expect(within(manana()).getByText('Sin dato')).toBeInTheDocument()
    expect(within(manana()).queryByRole('button', { name: '¿Qué pasó?' })).not.toBeInTheDocument()

    // Y al volver a entrar tampoco: se recuerda en este aparato.
    unmount()
    renderWithProviders(<VidaHoyPage />)
    expect(within(manana()).getByText('Sin dato')).toBeInTheDocument()
    expect(within(manana()).queryByRole('button', { name: '¿Qué pasó?' })).not.toBeInTheDocument()
    expect(within(manana()).getByText('Lo dejaste así.')).toBeInTheDocument()
  })

  it('criterio 50 — el tiempo que aún no ha llegado no se llama «sin dato»', () => {
    dayFollowUpsQuery = ready([closedFollowUp('f6', 'a-b1', 'Bañarme', '08:00', 45)])
    renderWithProviders(<VidaHoyPage />)

    expect(screen.queryByText('Sin dato')).not.toBeInTheDocument()
  })

  it('criterio 51 — la frase de cierre resume el día y releva a la guía de F3', () => {
    vi.setSystemTime(new Date(2026, 8, 18, 23, 10, 0))
    dayFollowUpsQuery = ready([
      closedFollowUp('f7', 'a-b1', 'Bañarme', '08:00', 45),
      closedFollowUp('f8', 'a-otra', 'Llamada con el banco', '13:05', 40),
    ])
    renderWithProviders(<VidaHoyPage />)

    expect(screen.getByText(/^Seguiste 1 de 3\./)).toBeInTheDocument()
    expect(screen.getByText(/En lugar de Cocinar y almorzar hiciste Llamada con el banco\./))
      .toBeInTheDocument()
    expect(screen.getByText(/Leer un rato se quedó sin hacer\./)).toBeInTheDocument()
    // La guía de FEAT-003 habla de huecos y de mañana: en un día cerrado la
    // releva la frase de cierre, y no se leen las dos.
    const presupuesto = document.getElementById('vida-budget-heading')!.closest('section')!
    expect(presupuesto.textContent).not.toContain('Tu día se cerró a las 23:00.')
    expect(presupuesto.textContent).not.toContain('Tu hueco más grande')
  })

  /**
   * **FEAT-006, criterio 25.** Es lo único que cambia en Hoy en la tajada 1 de
   * la revisión: al cerrarse el día, junto a la frase de cierre, la vía a
   * `/app/vida/revision?d=`. Con el día **en marcha** no se pinta, porque
   * todavía no hay nada que revisar.
   */
  it('FEAT-006 criterio 25 — al cerrarse el día hay «Ver cómo fue el día»', () => {
    vi.setSystemTime(new Date(2026, 8, 18, 23, 10, 0))
    dayFollowUpsQuery = ready([closedFollowUp('f9', 'a-b1', 'Bañarme', '08:00', 45)])
    const { unmount } = renderWithProviders(<VidaHoyPage />)

    expect(screen.getByRole('link', { name: 'Ver cómo fue el día' })).toHaveAttribute(
      'href',
      '/app/vida/revision?d=2026-09-18',
    )

    unmount()
    vi.setSystemTime(new Date(2026, 8, 18, 9, 24, 0))
    renderWithProviders(<VidaHoyPage />)
    expect(screen.queryByRole('link', { name: 'Ver cómo fue el día' })).not.toBeInTheDocument()
  })

  it('criterio 58 — con lo vivido caído no se afirma «no hecho» ni se ofrecen salidas', () => {
    vi.setSystemTime(new Date(2026, 8, 18, 23, 10, 0))
    dayFollowUpsQuery = {
      data: [],
      isPending: false,
      isError: true,
      fetchStatus: 'idle',
      refetch: vi.fn(),
    }
    renderWithProviders(<VidaHoyPage />)

    expect(screen.getByText('Falta una parte de tu día')).toBeInTheDocument()
    expect(screen.queryByText('no hecho')).not.toBeInTheDocument()
    expect(screen.queryByText('pendiente')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Lo hice' })).not.toBeInTheDocument()
    expect(screen.queryByText('Sin dato')).not.toBeInTheDocument()
    // Y el plan se sigue viendo.
    expect(planRow('Bañarme')).toBeInTheDocument()
  })

  it('criterio 59 — nada de lo nuevo usa una palabra de culpa', () => {
    vi.setSystemTime(new Date(2026, 8, 18, 23, 10, 0))
    dayFollowUpsQuery = ready([closedFollowUp('f10', 'a-otra', 'Llamada', '08:05', 30)])
    renderWithProviders(<VidaHoyPage />)

    const texto = (document.body.textContent ?? '').toLowerCase()
    for (const prohibida of ['desperdici', 'perdiste', 'fallaste', 'cancelar', 'eliminar']) {
      expect(texto).not.toContain(prohibida)
    }
  })
})

/* ── Los avisos al planear (FEAT-007, tajada 3: criterios 87 a 94) ───────── */

/** Una tarjeta de «Lo que se repite», de las que ya llegan filtradas por D1. */
function patternWith(
  overrides: Partial<{
    itemId: string
    activityId: string
    title: string
    occurrences: number
    offsetMinutes: number
    kind: 'duration' | 'start-time' | 'drop-day'
    dayPatch: { durationMinutes: number } | { startTime: string } | null
    usualDurationMinutes: number | null
  }> = {},
) {
  const {
    itemId = 'i-b2',
    activityId = 'a-b2',
    title = 'Leer un rato',
    occurrences = 6,
    offsetMinutes = 25,
    kind = 'duration',
    dayPatch = { durationMinutes: 60 },
    usualDurationMinutes = null,
  } = overrides
  return {
    itemId,
    usualDurationMinutes,
    occurrences,
    suggestion: {
      id: `${kind}|${itemId}`,
      kind,
      itemId,
      activityId,
      title,
      icon: 'fa-book',
      color: null,
      offsetMinutes,
      dayOfWeek: null,
      basis: 'base',
      ask: 'pregunta',
      consequence: 'consecuencia',
      affirmativeLabel: 'Ponerlo en 1h',
      dismissLabel: 'Dejarlo',
      templatePatch: { durationMinutes: 60 },
      dayPatch,
    },
  }
}

describe('el aviso pegado al bloque, en Hoy (criterios 87 a 94)', () => {
  it('criterio 92 — sin datos suficientes, Hoy es EXACTAMENTE el de FEAT-003/004', () => {
    renderWithProviders(<VidaHoyPage />)

    expect(screen.queryByText(/De tus últimas semanas/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Así está bien/)).not.toBeInTheDocument()
    // Ni leyenda nueva en los huecos, ni espacio reservado donde iría.
    expect(screen.queryByText(/sueles tardar/)).not.toBeInTheDocument()
    expect(screen.queryByText(/la que sueles tardar/)).not.toBeInTheDocument()
  })

  it('criterio 87 — el aviso va pegado a SU bloque, numerado y con las dos salidas', () => {
    patternsResult.patterns = [patternWith()]
    renderWithProviders(<VidaHoyPage />)

    const aviso = screen.getByText('De tus últimas semanas').closest('li')!
    expect(within(aviso).getByText('1 de 1')).toBeInTheDocument()
    expect(within(aviso).getByText(/Leer un rato te suele llevar 25 min más/)).toBeInTheDocument()
    expect(within(aviso).getByText(/¿lo dejamos en 1h\?/)).toBeInTheDocument()
    expect(within(aviso).getByRole('button', { name: 'Sí, 1h' })).toBeInTheDocument()
    expect(within(aviso).getByRole('button', { name: 'Así está bien' })).toBeInTheDocument()

    // **Pegado**: el aviso va justo debajo del bloque del que habla, y el
    // bloque sigue delante (criterio 94: no lo tapa ni lo empuja fuera).
    const filas = Array.from(document.querySelectorAll('li'))
    const bloque = screen.getByText('Leer un rato').closest('li')!
    expect(filas.indexOf(aviso)).toBe(filas.indexOf(bloque) + 1)
  })

  it('criterio 89 — «Sí» cambia SOLO el bloque de ese día; la plantilla no se toca', () => {
    patternsResult.patterns = [patternWith()]
    renderWithProviders(<VidaHoyPage />)

    const aviso = screen.getByText('De tus últimas semanas').closest('li')!
    // Y lo dice **antes** de tocar nada.
    expect(
      within(aviso).getByText('Esto cambia solo para hoy: tu plantilla se queda como está.'),
    ).toBeInTheDocument()

    fireEvent.click(within(aviso).getByRole('button', { name: 'Sí, 1h' }))

    expect(editMutation.mutate).toHaveBeenCalledTimes(1)
    expect(editMutation.mutate).toHaveBeenCalledWith({
      itemId: 'b2',
      startTime: '10:00',
      endTime: '11:00',
    })
    // **Cero** llamadas a la plantilla y a las otras tres del plan del día.
    expect(updateItemMutation.mutate).not.toHaveBeenCalled()
    expect(addMutation.mutate).not.toHaveBeenCalled()
    expect(removeMutation.mutate).not.toHaveBeenCalled()
    expect(setMutation.mutate).not.toHaveBeenCalled()
  })

  it('criterio 90 — «Así está bien» no llama a nadie: guarda la respuesta y ya', () => {
    patternsResult.patterns = [patternWith()]
    renderWithProviders(<VidaHoyPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Así está bien' }))

    expect(patternsResult.answerSuggestion).toHaveBeenCalledTimes(1)
    expect(editMutation.mutate).not.toHaveBeenCalled()
    expect(updateItemMutation.mutate).not.toHaveBeenCalled()
    expect(addMutation.mutate).not.toHaveBeenCalled()
  })

  it('criterio 88 — con tres candidatos se pintan DOS y el tercero no aparece', () => {
    patternsResult.patterns = [
      patternWith({ itemId: 'i-b2', activityId: 'a-b2', title: 'Leer un rato', occurrences: 9 }),
      patternWith({
        itemId: 'i-b3',
        activityId: 'a-b3',
        title: 'Cocinar y almorzar',
        occurrences: 7,
        dayPatch: { durationMinutes: 90 },
      }),
      patternWith({
        itemId: 'i-b1',
        activityId: 'a-b1',
        title: 'Bañarme',
        occurrences: 5,
        dayPatch: { durationMinutes: 60 },
      }),
    ]
    renderWithProviders(<VidaHoyPage />)

    expect(screen.getAllByText('De tus últimas semanas')).toHaveLength(2)
    expect(screen.getByText('1 de 2')).toBeInTheDocument()
    expect(screen.getByText('2 de 2')).toBeInTheDocument()
    expect(screen.queryByText(/Bañarme te suele llevar/)).not.toBeInTheDocument()
  })

  it('criterio 93 — ningún aviso se lee como alarma, y el día se arma ignorándolos', () => {
    patternsResult.patterns = [patternWith()]
    renderWithProviders(<VidaHoyPage />)

    const aviso = screen.getByText('De tus últimas semanas').closest('li')!
    expect(within(aviso).queryByRole('alert')).not.toBeInTheDocument()
    const texto = aviso.textContent!.toLowerCase()
    for (const palabra of ['desperdicio', 'fallaste', 'incumpl', 'deberías', 'perdiste', 'error']) {
      expect(texto).not.toContain(palabra)
    }
    // Sin tocar nada, el plan del día no se mueve: eso es «se puede ignorar».
    expect(editMutation.mutate).not.toHaveBeenCalled()
  })

  it('un día pasado no paga la ventana ni recibe avisos (criterio 38 sigue en pie)', () => {
    viewedDate = '2026-09-14'
    patternsResult.patterns = [patternWith()]
    renderWithProviders(<VidaHoyPage />, {
      routerProps: { initialEntries: ['/app/vida/hoy?d=2026-09-14'] },
    })

    expect(patternsEnabled.every((enabled) => enabled === false)).toBe(true)
    expect(screen.queryByText('De tus últimas semanas')).not.toBeInTheDocument()
  })

  it('criterio 91 — los chips del hueco ofrecen la duración que sueles tardar, y lo dicen', () => {
    suggestionsQuery = ready([suggestion('s1', 'Poner lavadora', 20)])
    patternsResult.patterns = [
      patternWith({ itemId: 's1', activityId: 'a-s1', usualDurationMinutes: 55, dayPatch: null }),
    ]
    renderWithProviders(<VidaHoyPage />)

    expect(screen.getAllByText('sueles tardar 55m').length).toBeGreaterThan(0)
    expect(
      screen.getAllByText(/La duración que se ofrece es la que sueles tardar/).length,
    ).toBeGreaterThan(0)
  })
})

/* ── FEAT-011, tajada 1: registrar en el hueco que ya pasó ───────────────── */

describe('VidaHoyPage — el hueco que ya pasó se pulsa (criterios 220 a 232)', () => {
  /** El hueco de 8:45 a 9:24: entre «Bañarme» y la marca de «ahora». */
  const HUECO_PASADO = 'Registrar lo que hiciste entre las 8:45 y las 9:24'

  it('criterio 220 — el hueco pasado trae una salida, y solo una: contar qué hiciste', () => {
    renderWithProviders(<VidaHoyPage />)

    const hueco = screen.getByLabelText('Libre de 8:45 – 9:24')
    expect(within(hueco).getByRole('button', { name: HUECO_PASADO })).toBeInTheDocument()
    // Ni fichas de plantilla ni «+ otra cosa»: en el pasado no se planea.
    expect(within(hueco).queryByRole('button', { name: /^Poner / })).toBeNull()
    expect(within(hueco).queryByText('+ otra cosa')).toBeNull()
    expect(within(hueco).getAllByRole('button')).toHaveLength(1)
  })

  // **Este test cambió con FEAT-014** (criterio 410, dicho en voz alta). Medía
  // el criterio 221 con un hueco de **10 minutos**, y ese tramo es justo el que
  // el criterio 402 sustituye: de 5 a 14 el hueco pasado sí ofrece contar. Lo
  // que el 221 sigue diciendo —y aquí se sigue midiendo— es lo de **por debajo
  // de 5**: ahí no hay nada que pulsar. El hueco de 10 se mide ahora en el test
  // de al lado, donde ya trae su salida.
  it('criterio 402 (sustituye al 221 de 5 a 14 min) — por debajo de 5 sigue siendo una línea sin controles', () => {
    // 8:45 → 8:49, y «ahora» a las 9:40: un hueco pasado de 4 minutos.
    planQuery = ready([block('b1', 'Bañarme', '08:00', '08:45'), block('b2', 'Leer', '08:49', '09:30')])
    vi.setSystemTime(new Date(2026, 8, 18, 9, 40, 0))
    renderWithProviders(<VidaHoyPage />)

    expect(screen.getByText('Libre 8:45 – 8:49 · 4m')).toBeInTheDocument()
    expect(screen.queryByLabelText('Libre de 8:45 – 8:49')).toBeNull()
  })

  it('criterios 401, 404, 405 y 406 — el hueco pasado de 13 min se cuenta, y la hoja abre con una duración que cabe', () => {
    // El caso del usuario: 8:45 → 8:58 entre dos bloques que ya pasaron.
    planQuery = ready([block('b1', 'Bañarme', '08:00', '08:45'), block('b2', 'Leer', '08:58', '09:30')])
    vi.setSystemTime(new Date(2026, 8, 18, 9, 40, 0))
    renderWithProviders(<VidaHoyPage />)

    // La misma tarjeta y las mismas palabras del criterio 220 (criterio 401).
    const hueco = screen.getByLabelText('Libre de 8:45 – 8:58')
    const registrar = within(hueco).getByRole('button', {
      name: 'Registrar lo que hiciste entre las 8:45 y las 8:58',
    })
    expect(registrar).toHaveTextContent('Registrar lo que hice')
    // Y **solo** esa: ahí no cabe ninguna píldora, así que no se planea
    // (criterio 404).
    expect(within(hueco).getAllByRole('button')).toHaveLength(1)
    expect(within(hueco).queryByText('+ otra cosa')).toBeNull()

    fireEvent.click(registrar)
    const hoja = screen.getByRole('dialog')
    expect(within(hoja).getByLabelText('Hora a la que empezó')).toHaveValue('08:45')
    // Las cuatro fijas apagadas, «Todo el hueco · 13 min» y el campo libre: los
    // controles que ya existían, sin ninguno nuevo (criterio 406).
    for (const pill of ['15', '30', '45', '1h']) {
      expect(within(hoja).getByRole('button', { name: pill })).toBeDisabled()
    }
    expect(within(hoja).getByRole('button', { name: 'Todo el hueco, 13 min' })).toBeEnabled()
    expect(within(hoja).getByText('Aquí caben 13 min.')).toBeInTheDocument()

    // **La duración de partida cabe** (criterio 405, D2): al elegir el qué, la
    // hoja pone 13 —el hueco entero— y no los 30 de la plantilla, así que
    // Guardar va encendido y no hay aviso de que no cabe.
    fireEvent.click(within(hoja).getByRole('button', { name: /Poner lavadora/ }))
    expect(within(hoja).getByRole('button', { name: 'Todo el hueco, 13 min' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(within(hoja).queryByText(/no cabe/i)).toBeNull()

    const guardar = within(hoja).getByRole('button', { name: 'Registrar' })
    expect(guardar).toBeEnabled()
    fireEvent.click(guardar)
    expect(createFollowUpMutation.mutate).toHaveBeenCalledTimes(1)
    expect(createFollowUpMutation.mutate.mock.calls[0][0]).toMatchObject({
      date: '2026-09-18',
      startTime: '08:45',
      durationMinutes: 13,
    })
    // Una sesión fuera del plan: ni una mutación de `activityDayPlan`
    // (criterio 407).
    expect(addMutation.mutate).not.toHaveBeenCalled()
    expect(editMutation.mutate).not.toHaveBeenCalled()
    expect(setMutation.mutate).not.toHaveBeenCalled()
  })

  it('criterios 222, 223 y 224 — abre la hoja de siempre, anclada al hueco', () => {
    renderWithProviders(<VidaHoyPage />)

    fireEvent.click(screen.getByRole('button', { name: HUECO_PASADO }))

    const hoja = screen.getByRole('dialog')
    expect(within(hoja).getByText('¿Qué hiciste?')).toBeInTheDocument()
    expect(within(hoja).getByText('Viernes · en el hueco de 8:45 a 9:24')).toBeInTheDocument()
    // El principio del hueco, no «media hora antes de ahora».
    expect(within(hoja).getByLabelText('Hora a la que empezó')).toHaveValue('08:45')
    // La duración no arranca puesta: la pone lo que se elija (criterio 224).
    expect(within(hoja).getByRole('button', { name: '15' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('criterio 229 — guardar escribe la sesión y no toca el plan', () => {
    renderWithProviders(<VidaHoyPage />)
    fireEvent.click(screen.getByRole('button', { name: HUECO_PASADO }))

    const hoja = screen.getByRole('dialog')
    fireEvent.click(within(hoja).getByRole('button', { name: /Poner lavadora/ }))
    fireEvent.click(within(hoja).getByRole('button', { name: '15' }))
    fireEvent.click(within(hoja).getByRole('button', { name: 'Registrar' }))

    expect(createFollowUpMutation.mutate).toHaveBeenCalledTimes(1)
    expect(createFollowUpMutation.mutate.mock.calls[0][0]).toMatchObject({
      date: '2026-09-18',
      startTime: '08:45',
      durationMinutes: 15,
    })
    expect(addMutation.mutate).not.toHaveBeenCalled()
    expect(editMutation.mutate).not.toHaveBeenCalled()
    expect(setMutation.mutate).not.toHaveBeenCalled()
  })

  it('criterio 226 — lo que no cabe en el hueco no se puede guardar', () => {
    renderWithProviders(<VidaHoyPage />)
    fireEvent.click(screen.getByRole('button', { name: HUECO_PASADO }))

    const hoja = screen.getByRole('dialog')
    fireEvent.click(within(hoja).getByRole('button', { name: /Poner lavadora/ }))
    // 39 minutos de hueco: «45» y «1h» ni siquiera se ofrecen.
    expect(within(hoja).getByRole('button', { name: '45' })).toBeDisabled()
    fireEvent.change(within(hoja).getByLabelText('horas'), { target: { value: '2' } })
    expect(within(hoja).getByRole('button', { name: 'Registrar' })).toBeDisabled()
    expect(createFollowUpMutation.mutate).not.toHaveBeenCalled()
  })

  it('criterio 232 — un día pasado ofrece contar en todos sus huecos y nada de plan', () => {
    plansByDate = {
      '2026-09-17': [{ ...block('x1', 'Leer un rato', '09:00', '09:30'), date: '2026-09-17' }],
    }
    viewedDate = '2026-09-17'
    planQuery = ready(plansByDate['2026-09-17'])
    renderWithProviders(<VidaHoyPage />, {
      routerProps: { initialEntries: ['/app/vida/hoy?d=2026-09-17'] },
    })

    const antes = screen.getByLabelText('Libre de 6:30 – 9:00')
    const despues = screen.getByLabelText('Libre de 9:30 – 23:00')
    expect(
      within(antes).getByRole('button', { name: /Registrar lo que hiciste/ }),
    ).toBeInTheDocument()
    expect(
      within(despues).getByRole('button', { name: /Registrar lo que hiciste/ }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Poner / })).toBeNull()
    expect(screen.queryByText('+ otra cosa')).toBeNull()
  })

  it('criterio 232 — un día futuro no ofrece contar: no hay pasado que contar', () => {
    viewedDate = '2026-09-19'
    planQuery = ready([])
    renderWithProviders(<VidaHoyPage />, {
      routerProps: { initialEntries: ['/app/vida/hoy?d=2026-09-19'] },
    })

    expect(screen.queryByRole('button', { name: /Registrar lo que hiciste/ })).toBeNull()
  })

  it('criterio 244 — con lo vivido caído, el hueco no ofrece registrar a ciegas', () => {
    dayFollowUpsQuery = {
      data: undefined,
      isPending: false,
      isError: true,
      fetchStatus: 'idle',
      refetch: vi.fn(),
    }
    renderWithProviders(<VidaHoyPage />)

    expect(screen.queryByRole('button', { name: /Registrar lo que hiciste/ })).toBeNull()
    // Y el hueco sigue ahí, con sus minutos: la leyenda tiene que cuadrar.
    expect(screen.getByText('Libre 8:45 – 9:24 · 39m')).toBeInTheDocument()
  })

  it('criterio 243 — mientras el día está en vuelo no hay ningún hueco que pulsar', () => {
    planQuery = { isPending: true, isError: false, fetchStatus: 'fetching', refetch: vi.fn() }
    renderWithProviders(<VidaHoyPage />)

    expect(screen.queryByRole('button', { name: /Registrar lo que hiciste/ })).toBeNull()
    expect(screen.getByText('Cargando tu día…')).toBeInTheDocument()
  })

  it('criterio 246 — ni una palabra de reproche en el hueco que ya pasó', () => {
    renderWithProviders(<VidaHoyPage />)

    const texto = document.body.textContent ?? ''
    expect(texto).not.toMatch(/perdid|desperdici|en blanco|vacío|por qué no/i)
    expect(screen.getAllByText(/^Libre /).length).toBeGreaterThan(0)
  })
})

/* ── FEAT-011, tajada 3: la otra cara del hueco ─────────────────────────── */

describe('VidaHoyPage — el hueco de delante cuenta de segundo (criterios 241 y 242)', () => {
  /** Con «ahora» a las 9:24 y «Leer un rato» a las 10:00. */
  const HUECO_FUTURO = 'Libre de 9:24 – 10:00'

  it('criterio 241 — manda «Poner algo» y «Registrar» queda detrás, con menos peso', () => {
    renderWithProviders(<VidaHoyPage />)

    const hueco = screen.getByLabelText(HUECO_FUTURO)
    // Lo de FEAT-003 sigue igual: fichas de plantilla y «+ otra cosa».
    expect(within(hueco).getAllByRole('button', { name: /^Poner / }).length).toBeGreaterThan(0)
    const registrar = within(hueco).getByRole('button', {
      name: 'Registrar algo que hiciste antes de las 10:00',
    })
    expect(registrar).toHaveTextContent('Registrar')
    // **Detrás** de las fichas, y fuera de su lista: si mañana las de
    // sugerencia se van (FEAT-010), esta salida se queda donde está.
    const fichas = within(hueco).getAllByRole('button', { name: /^Poner / })
    expect(
      fichas[0]!.compareDocumentPosition(registrar) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(registrar.closest('ul')).toBeNull()
  })

  it('criterio 242 — la hoja que abre no propone registrar el futuro', () => {
    renderWithProviders(<VidaHoyPage />)

    fireEvent.click(
      screen.getByRole('button', { name: 'Registrar algo que hiciste antes de las 10:00' }),
    )

    const hoja = screen.getByRole('dialog')
    // No se ancla a un rato que **no ha pasado**: su ventana acaba donde
    // empieza. Se ofrece lo de siempre, que parte de media hora atrás (8:54) y
    // nunca pasa de «ahora».
    expect(within(hoja).queryByText(/en el hueco de/)).toBeNull()
    expect(within(hoja).getByLabelText('Hora a la que empezó')).toHaveValue('08:54')

    // Y si se empuja a mano hacia delante, no se guarda.
    fireEvent.click(within(hoja).getByRole('button', { name: /Poner lavadora/ }))
    fireEvent.change(within(hoja).getByLabelText('Hora a la que empezó'), {
      target: { value: '09:40' },
    })
    fireEvent.click(within(hoja).getByRole('button', { name: 'Registrar' }))
    expect(within(hoja).getByText('Esa hora todavía no ha llegado.')).toBeInTheDocument()
    expect(createFollowUpMutation.mutate).not.toHaveBeenCalled()
  })

  it('criterio 232 — en un día futuro el hueco de delante tampoco ofrece contar', () => {
    viewedDate = '2026-09-19'
    planQuery = ready([block('b1', 'Bañarme', '08:00', '08:45')])
    renderWithProviders(<VidaHoyPage />, {
      routerProps: { initialEntries: ['/app/vida/hoy?d=2026-09-19'] },
    })

    expect(screen.queryByRole('button', { name: /^Registrar algo que hiciste/ })).toBeNull()
  })
})

/* ── FEAT-011, tajada 2: la ventana REAL ────────────────────────────────── */

describe('VidaHoyPage — el hueco se valida contra lo vivido (criterios 233 a 236)', () => {
  const HUECO_PASADO = 'Registrar lo que hiciste entre las 8:45 y las 9:24'

  function sesion(
    id: string,
    activityId: string,
    startTime: string,
    durationMinutes: number | null,
    title: string,
  ): ActivityFollowUp {
    return {
      id,
      activityId,
      date: '2026-09-18',
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

  /** «Bañarme» estaba planeado hasta las 8:45 y su sesión acabó a las 8:50. */
  function bañarseHastaLasOchoCincuenta() {
    dayFollowUpsQuery = ready([sesion('f1', 'a-b1', '08:00', 50, 'Bañarme')])
  }

  it('criterio 233 — el hueco se valida contra el borde real, no contra el del plan', () => {
    bañarseHastaLasOchoCincuenta()
    renderWithProviders(<VidaHoyPage />)
    fireEvent.click(screen.getByRole('button', { name: HUECO_PASADO }))

    const hoja = screen.getByRole('dialog')
    // La ventana empieza donde acabó el baño de verdad, no donde decía el plan.
    expect(within(hoja).getByText('Viernes · en el hueco de 8:50 a 9:24')).toBeInTheDocument()
    expect(within(hoja).getByLabelText('Hora a la que empezó')).toHaveValue('08:50')
  })

  it('criterio 234 — el renglón sigue diciendo las horas del plan y la hoja explica por qué se mueve', () => {
    bañarseHastaLasOchoCincuenta()
    renderWithProviders(<VidaHoyPage />)

    // El renglón, intacto: la barra y su leyenda reparten el día desde ahí.
    expect(screen.getByLabelText('Libre de 8:45 – 9:24')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: HUECO_PASADO }))
    expect(
      within(screen.getByRole('dialog')).getByText(
        'Bañarme acabó a las 8:50, así que aquí empieza más tarde.',
      ),
    ).toBeInTheDocument()
  })

  it('criterio 225 — lo que se pisa con el vecino no cabe, y el aviso lo nombra', () => {
    bañarseHastaLasOchoCincuenta()
    renderWithProviders(<VidaHoyPage />)
    fireEvent.click(screen.getByRole('button', { name: HUECO_PASADO }))

    const hoja = screen.getByRole('dialog')
    fireEvent.click(within(hoja).getByRole('button', { name: /Poner lavadora/ }))
    fireEvent.click(within(hoja).getByRole('button', { name: '15' }))
    // Las 8:45 son del plan, pero el baño llegó hasta las 8:50.
    fireEvent.change(within(hoja).getByLabelText('Hora a la que empezó'), {
      target: { value: '08:45' },
    })

    const aviso = within(hoja).getByRole('alert')
    expect(aviso).toHaveTextContent('Aquí cabe algo entre las 8:50 y las 9:24.')
    expect(aviso).toHaveTextContent('Bañarme acabó a las 8:50.')
    expect(within(hoja).getByRole('button', { name: 'Registrar' })).toBeDisabled()
    expect(createFollowUpMutation.mutate).not.toHaveBeenCalled()
  })

  it('criterio 235 — con un cronómetro corriendo, registrar en el hueco no lo toca', () => {
    // «Llamada» empezó a las 9:00 y sigue abierta: parte el hueco pasado en
    // dos y es el vecino del trozo de delante (8:45 → 9:00).
    dayFollowUpsQuery = ready([sesion('f1', 'otra', '09:00', null, 'Llamada con el banco')])
    renderWithProviders(<VidaHoyPage />)

    fireEvent.click(
      screen.getByRole('button', { name: 'Registrar lo que hiciste entre las 8:45 y las 9:00' }),
    )
    const hoja = screen.getByRole('dialog')
    fireEvent.click(within(hoja).getByRole('button', { name: /Poner lavadora/ }))
    // Desde la tajada 3 la duración viene puesta al elegir el «qué»: los 20 de
    // la plantilla, recortados a los 15 que caben (criterio 239). Antes había
    // que pulsar «15» a mano; volver a pulsarlo ahora la quitaría.
    expect(within(hoja).getByRole('button', { name: '15' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    // Un cuarto de hora desde las 8:50 se pisaría con la llamada: no cabe, y
    // se dice con su nombre.
    fireEvent.change(within(hoja).getByLabelText('Hora a la que empezó'), {
      target: { value: '08:50' },
    })

    const aviso = within(hoja).getByRole('alert')
    expect(aviso).toHaveTextContent('A las 9:00 entra Llamada con el banco.')
    expect(within(hoja).getByRole('button', { name: 'Registrar' })).toBeDisabled()

    // Y lo que sí cabe se guarda **sin tocar la sesión abierta**.
    fireEvent.change(within(hoja).getByLabelText('Hora a la que empezó'), {
      target: { value: '08:45' },
    })
    fireEvent.click(within(hoja).getByRole('button', { name: 'Registrar' }))
    expect(createFollowUpMutation.mutate).toHaveBeenCalledTimes(1)
    expect(updateFollowUpMutation.mutate).not.toHaveBeenCalled()
    expect(deleteFollowUpMutation.mutate).not.toHaveBeenCalled()
  })
})

/* ── «Lo que viene» (FEAT-010, tajada 1) ────────────────────────────────────
 *
 * Criterios 180, 183, 186, 188, 189, 196, 204, 205, 207, 208, 210, 211, 215,
 * 216, 370–376, 378 y 379.
 *
 * Con el reloj del fichero —viernes 18 a las 9:24— y el plan de siempre
 * (Bañarme 8:00, Leer un rato 10:00, Cocinar 13:00), la regla del criterio 375
 * propone **Bañarme**: es el más reciente cuya hora ya llegó.
 */

/** La tarjeta, o `null` si no se pintó **ningún** nodo (criterio 180). */
function upNextCard(): HTMLElement | null {
  return screen.queryByRole('region', { name: 'Lo que viene' })
}

describe('VidaHoyPage — «Lo que viene»', () => {
  it('va dentro de la lista, justo debajo de la línea de AHORA cuando no hay nada en marcha (criterio 370)', () => {
    renderWithProviders(<VidaHoyPage />)

    const card = upNextCard()
    expect(card).not.toBeNull()

    const row = card!.closest('li')!
    // Hija directa del `<ol>` de la agenda, no colgada fuera de la lista.
    expect(row.parentElement?.tagName).toBe('OL')
    const previous = row.previousElementSibling
    expect(previous).not.toBeNull()
    expect(previous).toHaveTextContent('Ahora')
  })

  it('lo que se lee, palabra por palabra del render (criterios 183, 371, 372, 373)', () => {
    renderWithProviders(<VidaHoyPage />)
    const card = upNextCard()!

    // A las 9:24, «Bañarme» era de las 8:00: la hora **ya pasó**, así que el
    // rótulo lo dice (criterio 193, tajada 2). Todo lo demás es idéntico.
    expect(within(card).getByText('Lo que viene · se pasó de la hora')).toBeInTheDocument()
    expect(within(card).getByText('Bañarme')).toBeInTheDocument()
    expect(within(card).getByText('En tu plantilla, a las 8:00 · suele durarte 45 min')).toBeInTheDocument()
    expect(
      within(card).getByText(
        'Arranca cuando pulses, no a las 8:00. Y los 45 min son lo que suele durarte: se registra lo que dure de verdad.',
      ),
    ).toBeInTheDocument()
    // La hora de la plantilla, en la canaleta, y **ninguna hora de fin**.
    expect(card.closest('li')!.querySelector('time')).toHaveTextContent('8:00')
    expect(card.textContent ?? '').not.toMatch(/acabarías|hasta las/i)
  })

  it('un solo toque arranca, y **la duración planeada no viaja** (criterios 188, 196, 374)', () => {
    renderWithProviders(<VidaHoyPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Empezar Bañarme ahora' }))

    // Éste es **el** criterio de la feature: se manda la actividad y nada más.
    // Ni los 45 min del plan, ni las 8:00 de la ficha: la hora la pone el reloj
    // de la mutación y la duración la pone cuándo se termine.
    expect(startSession).toHaveBeenCalledTimes(1)
    expect(startSession.mock.calls[0]).toEqual(['a-b1'])
    // Sin hoja, sin elegir, sin confirmar: entre el clic y la mutación no se
    // abre nada.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  /* ── Antes de empezar (FEAT-018, tajada 3) ────────────────────────────────
   *
   * Los dos casos van **pegados** al de arriba y comparan el **array entero**
   * por el mismo motivo: si alguien colara la hora de la plantilla o la
   * duración planeada por este camino, se pondrían rojos.
   *
   * Quien abre el editor es el layout, así que aquí se le pasa un contexto que
   * hace lo que haría la hoja: llamar a `onSave` con lo que se escribió.
   */
  function renderConLapiz(texto: string | null) {
    const openStartNoteSheet = vi.fn((request: VidaStartNoteRequest) => {
      request.onSave(texto)
    })
    renderWithProviders(
      <VidaSessionUiContext.Provider
        value={{
          openFinishModal: () => {},
          openNoteSheet: () => {},
          openStartNoteSheet,
          openStartTimeSheet: () => {},
        }}
      >
        <VidaHoyPage />
      </VidaSessionUiContext.Provider>,
    )
    return openStartNoteSheet
  }

  /**
   * La fila del plan de «Bañarme», que **no** es la tarjeta: las dos ofrecen
   * el mismo lápiz con el mismo nombre accesible —es la misma pregunta sobre
   * la misma actividad— así que hay que decir en cuál se toca.
   */
  function filaDelPlan() {
    return screen
      .getAllByRole('listitem')
      .find((row) => within(row).queryByRole('button', { name: '▶ Empezar' }))!
  }

  it('criterio 549 — con la nota escrita antes, la sesión nace con ella en **una sola** llamada', () => {
    renderConLapiz('Revisando MRs')
    const card = upNextCard()!

    // El control va **aparte** del botón (criterio 548): es otro botón, en la
    // esquina que deja libre el rótulo.
    fireEvent.click(within(card).getByRole('button', { name: '¿Qué vas a hacer? Bañarme' }))
    // Y una vez escrita se lee, en vez del lápiz vacío (criterio 551).
    expect(within(upNextCard()!).getByText('Revisando MRs')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Empezar Bañarme ahora' }))

    // **Una** llamada a `activityFollowUpStart` con la nota dentro: nunca un
    // arranque más una edición aparte. Y el `null` del segundo hueco deja
    // escrito que la hora de la plantilla sigue sin viajar.
    expect(startSession).toHaveBeenCalledTimes(1)
    expect(startSession.mock.calls[0]).toEqual(['a-b1', null, { notes: 'Revisando MRs' }])
  })

  it('criterio 550 — con el control puesto y sin tocarlo, se arranca igual que ayer', () => {
    renderConLapiz('Revisando MRs')
    const card = upNextCard()!
    // El control está ahí…
    expect(
      within(card).getByRole('button', { name: '¿Qué vas a hacer? Bañarme' }),
    ).toBeInTheDocument()

    // …y nadie lo toca: un solo toque en el botón grande.
    fireEvent.click(screen.getByRole('button', { name: 'Empezar Bañarme ahora' }))

    expect(startSession).toHaveBeenCalledTimes(1)
    expect(startSession.mock.calls[0]).toEqual(['a-b1'])
    // Ni diálogo de por medio, ni paso extra.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('criterio 548 — el botón grande no cambia: misma palabra, y el lápiz es otro botón', () => {
    renderConLapiz('Revisando MRs')
    const card = upNextCard()!
    const boton = within(card).getByRole('button', { name: 'Empezar Bañarme ahora' })
    expect(boton).toHaveTextContent('▶ Empezar ahora')

    fireEvent.click(within(card).getByRole('button', { name: '¿Qué vas a hacer? Bañarme' }))

    // Con la nota escrita sigue siendo **el mismo** botón, con la misma
    // palabra: la línea entra encima, no dentro.
    const despues = within(upNextCard()!).getByRole('button', { name: 'Empezar Bañarme ahora' })
    expect(despues).toHaveTextContent('▶ Empezar ahora')
    expect(despues).not.toBe(within(upNextCard()!).getByRole('button', { name: /Revisando MRs/ }))
    // Y el lápiz de la esquina ya no está: escrita la nota, el control es la
    // línea. Dos controles para lo mismo serían dos sitios que tocar.
    expect(
      within(upNextCard()!).queryByRole('button', { name: '¿Qué vas a hacer? Bañarme' }),
    ).not.toBeInTheDocument()
  })

  it('el borrador es **uno solo**: escrito en la fila del plan, lo usa la tarjeta', () => {
    renderConLapiz('Con agua fría')

    // El lápiz de la **fila del bloque**, que no es el de la tarjeta.
    fireEvent.click(
      within(filaDelPlan()).getByRole('button', { name: '¿Qué vas a hacer? Bañarme' }),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Empezar Bañarme ahora' }))

    expect(startSession).toHaveBeenCalledTimes(1)
    expect(startSession.mock.calls[0]).toEqual(['a-b1', null, { notes: 'Con agua fría' }])
  })

  it('criterio 550 — vaciar la nota a propósito vuelve a la llamada de siempre', () => {
    renderConLapiz(null)

    fireEvent.click(
      within(filaDelPlan()).getByRole('button', { name: '¿Qué vas a hacer? Bañarme' }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Empezar Bañarme ahora' }))

    expect(startSession.mock.calls[0]).toEqual(['a-b1'])
  })

  /* ── La plantilla propone, la sesión decide (FEAT-018, tajada 4) ──────────
   *
   * El plan del día no guarda de qué ítem de plantilla salió, así que el cruce
   * es por `activityId`: el bloque «Bañarme» es `a-b1`, y un ítem de plantilla
   * con ese mismo `activityId` es «el de detrás». Criterios 555 a 558.
   */

  /** La plantilla del día, con «Bañarme» y lo que sueles hacer ahí. */
  function conNotaDePlantilla(notes: string) {
    suggestionsQuery = ready([suggestion('b1', 'Bañarme', 45, { notes })])
  }

  it('criterio 555 — la tarjeta enseña lo que sueles hacer, **sin tocar** la hora ni la duración planeada', () => {
    conNotaDePlantilla('Con agua fría y rápido')
    renderWithProviders(<VidaHoyPage />)
    const card = upNextCard()!

    expect(within(card).getByText('Con agua fría y rápido')).toBeInTheDocument()
    // La línea de siempre sigue donde estaba y dice lo mismo: son dos datos,
    // no uno que sustituye al otro.
    expect(
      within(card).getByText('En tu plantilla, a las 8:00 · suele durarte 45 min'),
    ).toBeInTheDocument()
    // Y no es un botón: lo que sueles hacer se escribe en la hoja del ítem.
    expect(
      within(card).queryByRole('button', { name: /Con agua fría y rápido/ }),
    ).not.toBeInTheDocument()
    // Una línea más que sin plantilla detrás, no una en lugar de otra.
    expect(card.querySelectorAll('[title]')).toHaveLength(2)
  })

  it('sin ítem de plantilla detrás, la tarjeta no enseña ninguna línea de más (criterio 558)', () => {
    // La plantilla de siempre: «Poner lavadora» y «Compra de la semana», que no
    // son la actividad de este bloque.
    renderWithProviders(<VidaHoyPage />)
    const card = upNextCard()!

    // La única cosa con texto completo en reserva es el titular: no hay
    // ninguna línea de nota debajo de la meta.
    const conTitulo = card.querySelectorAll('[title]')
    expect(conTitulo).toHaveLength(1)
    expect(conTitulo[0]).toHaveTextContent('Bañarme')
    expect(
      within(card).getByText('En tu plantilla, a las 8:00 · suele durarte 45 min'),
    ).toBeInTheDocument()
  })

  it('criterio 556 — el control de antes de empezar abre con lo que dice la plantilla', () => {
    conNotaDePlantilla('Con agua fría y rápido')
    const openStartNoteSheet = renderConLapiz('Con agua fría y rápido')

    fireEvent.click(
      within(upNextCard()!).getByRole('button', { name: '¿Qué vas a hacer? Bañarme' }),
    )

    expect(openStartNoteSheet).toHaveBeenCalledWith(
      expect.objectContaining({ initialValue: 'Con agua fría y rápido' }),
    )
    // Y desde la otra puerta, la misma propuesta: es el mismo borrador.
    fireEvent.click(screen.getByRole('button', { name: 'Empezar Bañarme ahora' }))
    expect(startSession.mock.calls[0]).toEqual([
      'a-b1',
      null,
      { notes: 'Con agua fría y rápido' },
    ])
  })

  it('criterio 558 — sin ítem de plantilla detrás, el control abre vacío', () => {
    const openStartNoteSheet = renderConLapiz(null)

    fireEvent.click(
      within(filaDelPlan()).getByRole('button', { name: '¿Qué vas a hacer? Bañarme' }),
    )

    expect(openStartNoteSheet).toHaveBeenCalledWith(expect.objectContaining({ initialValue: '' }))
  })

  it('criterio 557 — con nota en la plantilla y el control **sin abrir**, se arranca exactamente igual que hoy', () => {
    conNotaDePlantilla('Con agua fría y rápido')
    const openStartNoteSheet = renderConLapiz('esto no se debería usar nunca')

    // Se lee en la tarjeta, sí…
    expect(within(upNextCard()!).getByText('Con agua fría y rápido')).toBeInTheDocument()

    // …y nadie abre nada: un solo toque en el botón grande.
    fireEvent.click(screen.getByRole('button', { name: 'Empezar Bañarme ahora' }))

    // **La línea roja de la feature**: la propuesta de la plantilla no se copia
    // en silencio. Array entero, como el caso de FEAT-010 de más arriba.
    expect(startSession).toHaveBeenCalledTimes(1)
    expect(startSession.mock.calls[0]).toEqual(['a-b1'])
    expect(openStartNoteSheet).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('criterio 557 — y por la otra puerta, la del «▶ Empezar» de la fila del plan, igual', () => {
    conNotaDePlantilla('Con agua fría y rápido')
    renderConLapiz('esto no se debería usar nunca')

    fireEvent.click(within(filaDelPlan()).getByRole('button', { name: '▶ Empezar' }))

    expect(startSession).toHaveBeenCalledTimes(1)
    expect(startSession.mock.calls[0]).toEqual(['a-b1'])
  })

  it('borrar la propuesta y guardar no la vuelve a colar (criterios 550 y 557)', () => {
    conNotaDePlantilla('Con agua fría y rápido')
    const openStartNoteSheet = renderConLapiz(null)

    // Se abre, se vacía y se guarda: el borrador queda en blanco a propósito.
    fireEvent.click(
      within(filaDelPlan()).getByRole('button', { name: '¿Qué vas a hacer? Bañarme' }),
    )
    // Al volver a abrirlo **no** reaparece la propuesta: manda lo que el
    // usuario dejó, no lo que dice la plantilla.
    fireEvent.click(
      within(filaDelPlan()).getByRole('button', { name: '¿Qué vas a hacer? Bañarme' }),
    )
    expect(openStartNoteSheet).toHaveBeenLastCalledWith(
      expect.objectContaining({ initialValue: '' }),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Empezar Bañarme ahora' }))
    expect(startSession.mock.calls[0]).toEqual(['a-b1'])
  })

  it('con algo en marcha cuelga de su fila y dice qué se dará por terminada (criterios 370 y 378)', () => {
    openSession = {
      session: openFollowUp('a-fuera', '09:00'),
      startInstant: new Date(2026, 8, 18, 9, 0, 0),
      isFromAnotherDay: false,
      isDisabled: false,
      isPending: false,
    }
    dayFollowUpsQuery = ready([openFollowUp('a-fuera', '09:00')])

    renderWithProviders(<VidaHoyPage />)
    const card = upNextCard()!

    expect(card).toHaveTextContent(
      'Al hacerlo, «Leer un rato» se dará por terminada a esa hora.',
    )
    const previous = card.closest('li')!.previousElementSibling
    expect(previous).toHaveTextContent('Leer un rato')
    // El cierre **no lo manda la tarjeta**: es la D1 de FEAT-013, dentro de
    // `start`. Aquí no sale ninguna mutación de cierre por su cuenta.
    expect(finishSession).not.toHaveBeenCalled()
    expect(updateFollowUpMutation.mutate).not.toHaveBeenCalled()
  })

  it('lo que dice la tarjeta y lo que dice la lista son lo mismo (criterio 211)', () => {
    renderWithProviders(<VidaHoyPage />)

    const card = upNextCard()!
    const row = planRow('Bañarme')
    // El bloque **se queda en la lista, en su hora**: la tarjeta es una segunda
    // entrada al mismo gesto, no una mudanza.
    expect(row).toHaveTextContent('Bañarme')
    expect(row).toHaveTextContent('45 min')
    expect(card).toHaveTextContent('Bañarme')
    expect(card).toHaveTextContent('45 min')
    expect(row.querySelector('time')).toHaveTextContent('8:00')
    expect(card.closest('li')!.querySelector('time')).toHaveTextContent('8:00')
  })

  it('las salidas van debajo, con la N real y ninguna en un menú (criterio 376)', () => {
    renderWithProviders(<VidaHoyPage />)
    const card = upNextCard()!

    // Tres bloques abiertos, uno propuesto: quedan dos.
    fireEvent.click(within(card).getByRole('button', { name: 'Ver las otras 2' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    expect(within(card).getByRole('button', { name: 'Empezar otra cosa' })).toBeInTheDocument()
    // **«Ya la hice», escrita** (criterio 197): la hora de «Bañarme» ya pasó.
    // Las tres salidas están en la **misma línea**, debajo del botón, y
    // ninguna vive en un menú.
    const salidas = within(card).getByRole('button', { name: 'Ya la hice' })
    expect(salidas).toBeInTheDocument()
    expect(salidas.closest('p')).toBe(
      within(card).getByRole('button', { name: 'Empezar otra cosa' }).closest('p'),
    )
    expect(within(card).queryByRole('menu')).not.toBeInTheDocument()
  })

  it('«Ya la hice» llama a la misma función de siempre, sin arrancar nada (criterio 197)', () => {
    renderWithProviders(<VidaHoyPage />)
    const card = upNextCard()!

    fireEvent.click(within(card).getByRole('button', { name: 'Ya la hice' }))

    // **La misma aritmética que el «Lo hice» del bloque** (FEAT-004, criterio
    // 41): la hora y la duración planeadas, no una segunda cuenta. Es
    // literalmente lo que afirma el caso del criterio 41 unas líneas arriba.
    expect(createFollowUpMutation.mutate).toHaveBeenCalledTimes(1)
    expect(createFollowUpMutation.mutate).toHaveBeenCalledWith({
      activityId: 'a-b1',
      date: '2026-09-18',
      startTime: '08:00',
      durationMinutes: 45,
      notes: null,
    })
    // No arranca ninguna sesión y no abre ninguna hoja: es un registro.
    expect(startSession).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    // Y no toca el plan.
    expect(removeMutation.mutate).not.toHaveBeenCalled()
    expect(setMutation.mutate).not.toHaveBeenCalled()
  })

  it('antes de su hora no hay «Ya la hice» (criterio 197)', () => {
    // Con «Bañarme» ya registrado, la propuesta pasa a «Leer un rato», que a
    // las 9:24 **todavía no ha llegado**.
    dayFollowUpsQuery = ready([
      {
        ...openFollowUp('a-b1', '08:00'),
        id: 'f-hecha',
        durationMinutes: 45,
        isOpen: false,
        endTime: '08:45',
        activity: {
          id: 'a-b1',
          title: 'Bañarme',
          category: { id: 'c1', name: 'Cuidado', color: '#10B981', icon: 'heart' },
        },
      },
    ])

    renderWithProviders(<VidaHoyPage />)
    const card = upNextCard()!

    expect(within(card).getByText('Lo que viene')).toBeInTheDocument()
    expect(within(card).queryByRole('button', { name: 'Ya la hice' })).not.toBeInTheDocument()
  })

  it('no propone lo ya resuelto: pasa al siguiente (criterio 186)', () => {
    // Bañarme ya tiene su sesión: la regla salta a «Leer un rato»… que a las
    // 9:24 no ha llegado, así que se propone por ser el siguiente por hora.
    dayFollowUpsQuery = ready([
      {
        ...openFollowUp('a-b1', '08:00'),
        id: 'f-hecha',
        durationMinutes: 45,
        isOpen: false,
        endTime: '08:45',
        activity: {
          id: 'a-b1',
          title: 'Bañarme',
          category: { id: 'c1', name: 'Cuidado', color: '#10B981', icon: 'heart' },
        },
      },
    ])

    renderWithProviders(<VidaHoyPage />)

    expect(upNextCard()).toHaveTextContent('Leer un rato')
    expect(upNextCard()).not.toHaveTextContent('Bañarme')
  })

  it('en un día pasado o futuro no se pinta ningún nodo (criterio 180)', () => {
    // **El día se elige con `initialEntries`, no con `history.pushState`**: la
    // pantalla se monta dentro de un `MemoryRouter`, que no mira la barra de
    // direcciones del `jsdom`. Escrito con `pushState`, este caso miraba **hoy
    // con el plan vacío** y pasaba por la razón equivocada (visto en la tajada
    // 2, cuando ese caso dejó de ser «ningún nodo» y empezó a ser la cara
    // apagada del criterio 377).
    viewedDate = '2026-09-17'
    plansByDate['2026-09-17'] = PLAN

    renderWithProviders(<VidaHoyPage />, {
      routerProps: { initialEntries: ['/app/vida/hoy?d=2026-09-17'] },
    })

    expect(screen.getByText('Jueves 17')).toBeInTheDocument()
    expect(upNextCard()).toBeNull()
  })

  it('con lo vivido en vuelo no afirma nada (criterio 208)', () => {
    dayFollowUpsQuery = { isPending: true, isError: false, fetchStatus: 'fetching', refetch: vi.fn() }
    renderWithProviders(<VidaHoyPage />)

    expect(upNextCard()).toBeNull()
  })

  it('con lo vivido caído no propone y **tampoco dice que no queda nada** (criterio 209)', () => {
    dayFollowUpsQuery = { isPending: false, isError: true, fetchStatus: 'idle', refetch: vi.fn() }
    renderWithProviders(<VidaHoyPage />)
    const card = upNextCard()!

    // Ni propone —no sabe qué está hecho— ni afirma que la plantilla se acabó.
    expect(card).not.toHaveTextContent('Bañarme')
    expect(card).not.toHaveTextContent(/no queda nada/i)
    expect(card).toHaveTextContent(
      'No pudimos cargar lo que llevas hecho hoy, así que no te proponemos nada.',
    )
    // Y deja la salida: «Empezar algo».
    fireEvent.click(within(card).getByRole('button', { name: 'Empezar algo' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('sin poder empezar no pinta un botón que no va a funcionar (criterio 189)', () => {
    openSession = {
      session: null,
      startInstant: null,
      isFromAnotherDay: true,
      isDisabled: false,
      isPending: false,
    }

    renderWithProviders(<VidaHoyPage />)
    const card = upNextCard()!

    expect(within(card).queryByRole('button', { name: /^Empezar Bañarme ahora$/ })).not.toBeInTheDocument()
    expect(card).toHaveTextContent(
      'Tienes una sesión de otro día sin cerrar. Contéstala en la barra de arriba y podrás empezar esto.',
    )
  })

  it('cuesta cero: las mismas consultas con propuesta y sin ella (criterio 204)', () => {
    // **Sin propuesta**: todo el plan resuelto en este aparato. Desde la
    // tajada 2 eso ya no deja la pantalla sin tarjeta —sale la cara apagada
    // del criterio 377—, así que lo que se comparan son **los dos caminos del
    // mismo `useMemo`**: ninguno de los dos estrena una consulta.
    useVidaDeviceNotesStore.getState().markBlockCouldNot('2026-09-18', 'b1', null)
    useVidaDeviceNotesStore.getState().markBlockCouldNot('2026-09-18', 'b2', null)
    useVidaDeviceNotesStore.getState().markBlockCouldNot('2026-09-18', 'b3', null)
    const { unmount } = renderWithProviders(<VidaHoyPage />)
    expect(upNextCard()).toHaveTextContent('Ya no queda nada en tu plantilla')
    const sinTarjeta = { ...queryCalls }
    unmount()

    queryCalls = {}
    useVidaDeviceNotesStore.setState({ blockNotes: {} })
    renderWithProviders(<VidaHoyPage />)
    expect(upNextCard()).not.toBeNull()

    expect(queryCalls).toEqual(sinTarjeta)
  })

  it('el reloj corre sin mover el foco ni remontar la tarjeta (criterios 205 y 207)', async () => {
    renderWithProviders(<VidaHoyPage />)

    const boton = screen.getByRole('button', { name: 'Empezar Bañarme ahora' })
    boton.focus()
    expect(document.activeElement).toBe(boton)
    const volverAEnfocar = vi.spyOn(boton, 'focus')

    await act(async () => {
      vi.advanceTimersByTime(60_000)
    })

    expect(document.activeElement).toBe(boton)
    expect(document.activeElement).not.toBe(document.body)
    // Un tic **no mueve nada**: la tarjeta no toca el foco (criterio 205).
    expect(volverAEnfocar).not.toHaveBeenCalled()
    // El titular es lo único que se anuncia, y en `polite` (criterio 207).
    const vivo = upNextCard()!.querySelector('[aria-live]')
    expect(vivo).toHaveAttribute('aria-live', 'polite')
    expect(upNextCard()!.querySelector('[role="alert"]')).toBeNull()
  })

  it('al cambiar de ancla la tarjeta se mueve y el foco vuelve al botón, nunca a `body` (criterios 205 y 379)', async () => {
    renderWithProviders(<VidaHoyPage />)

    const boton = screen.getByRole('button', { name: 'Empezar Bañarme ahora' })
    boton.focus()
    const fila = upNextCard()!.closest('li')!
    expect(fila.previousElementSibling).toHaveTextContent('Ahora')
    const volverAEnfocar = vi.spyOn(boton, 'focus')

    // Arranca algo: el ancla pasa de la marca de AHORA a la fila de la sesión
    // nueva y la tarjeta **cambia de sitio dentro del `<ol>`**. Es el gesto
    // principal de la feature, no un caso raro.
    openSession = {
      session: openFollowUp('a-fuera', '09:00'),
      startInstant: new Date(2026, 8, 18, 9, 0, 0),
      isFromAnotherDay: false,
      isDisabled: false,
      isPending: false,
    }
    dayFollowUpsQuery = ready([openFollowUp('a-fuera', '09:00')])
    await act(async () => {
      vi.advanceTimersByTime(60_000)
    })

    const despues = upNextCard()!.closest('li')!
    // El mismo nodo en otro sitio: React la **mueve**, no la remonta…
    expect(despues).toBe(fila)
    expect(despues.previousElementSibling).toHaveTextContent('Leer un rato')
    // …y mover un nodo que contiene al elemento enfocado manda el foco a
    // `body` en el navegador real (medido en Chromium). La tarjeta se lo
    // devuelve al botón equivalente en el mismo commit.
    expect(volverAEnfocar).toHaveBeenCalled()
    expect(document.activeElement).toBe(boton)
    expect(document.activeElement).not.toBe(document.body)
  })

  it('lo que vive en `aria-live` es lo que cambia, no el rótulo (criterio 207)', async () => {
    renderWithProviders(<VidaHoyPage />)

    const vivos = upNextCard()!.querySelectorAll('[aria-live]')
    expect(vivos).toHaveLength(1)
    const vivo = vivos[0]!
    expect(vivo).toHaveAttribute('aria-live', 'polite')
    // La región se llama «Lo que viene»; lo que se anuncia es **el titular**.
    expect(vivo).toHaveTextContent('Bañarme')
    expect(vivo.textContent).not.toContain('Lo que viene')

    // Cambia lo propuesto sin tocar el reloj: «Bañarme» queda resuelto y la
    // regla pasa a «Leer un rato».
    await act(async () => {
      useVidaDeviceNotesStore.getState().markBlockCouldNot('2026-09-18', 'b1', null)
    })

    const despues = upNextCard()!.querySelector('[aria-live]')!
    // El mismo nodo con otro texto: eso es lo que un lector de pantalla
    // anuncia. Una región viva cuyo texto nunca cambia no dice nada.
    expect(despues).toBe(vivo)
    expect(despues).toHaveTextContent('Leer un rato')
    expect(upNextCard()!.querySelector('[role="alert"]')).toBeNull()
  })

  it('el nombre recortado sigue disponible entero (criterio 213)', () => {
    renderWithProviders(<VidaHoyPage />)
    const card = upNextCard()!

    // `.name` recorta con ellipsis: el nombre completo tiene que quedar a mano
    // también para el ratón, no solo en el `aria-label` del botón.
    expect(within(card).getByText('Bañarme')).toHaveAttribute('title', 'Bañarme')
  })

  it('ni una palabra de reproche en la pantalla con tarjeta (criterio 210)', () => {
    renderWithProviders(<VidaHoyPage />)

    const texto = upNextCard()!.textContent ?? ''
    for (const palabra of [
      'tarde',
      'te saltaste',
      'perdiste',
      'fallaste',
      'deberías',
      'desperdicio',
      'vacío',
      'todavía no has',
    ]) {
      expect(texto.toLowerCase()).not.toContain(palabra)
    }
  })

  it('no pinta ninguna fila de hueco ni toca lo de FEAT-011 (criterio 216)', () => {
    renderWithProviders(<VidaHoyPage />)
    const card = upNextCard()!

    expect(card).not.toHaveTextContent('Libre')
    expect(within(card).queryByRole('button', { name: /Registrar lo que hice/ })).not.toBeInTheDocument()
  })

  /* ── Cuando ya no queda nada (tajada 2) ────────────────────────────────
   *
   * Criterios 192 y 377. El día de estas pruebas acaba a las 23:00 —el
   * respaldo de `useVidaDayHours`— y el reloj marca las 9:24, así que a la
   * barra le quedan **13h 36**.
   */

  /** Un día de hoy **sin nada que proponer**: el plan, vacío. */
  function renderSinNadaQueProponer() {
    planQuery = ready([])
    renderWithProviders(<VidaHoyPage />)
    return upNextCard()!
  }

  it('dice lo cierto y deja «Empezar algo», sin inventar ninguna sugerencia (criterio 377)', () => {
    const card = renderSinNadaQueProponer()

    expect(within(card).getByText('Ya no queda nada en tu plantilla')).toBeInTheDocument()
    expect(card).toHaveTextContent('Tu viernes se acaba a las 23:00. Te quedan 13h 36.')
    // No propone nada de la plantilla ni de las sugerencias del lateral.
    expect(card).not.toHaveTextContent('Poner lavadora')
    expect(card).not.toHaveTextContent('suele durarte')
    // Y no se queda muda: la salida es la **misma hoja de siempre**.
    fireEvent.click(within(card).getByRole('button', { name: 'Empezar algo' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('los números son **los mismos que la barra de arriba** (criterio 377)', () => {
    const card = renderSinNadaQueProponer()

    // La barra: «te quedan 13h 36 hasta las 23:00». La tarjeta no rehace la
    // resta: consume el mismo `budget.remainingMinutes` y el mismo `dayEnd`.
    const barra = document.getElementById('vida-budget-heading')!.parentElement!
    expect(barra).toHaveTextContent('te quedan 13h 36 hasta las 23:00')
    expect(card).toHaveTextContent('Te quedan 13h 36.')
    expect(card).toHaveTextContent('se acaba a las 23:00')
  })

  it('el mismo sitio y la misma forma, sin hora en la canaleta (criterios 371 y 377)', () => {
    const card = renderSinNadaQueProponer()
    const row = card.closest('li')!

    // Hija directa del `<ol>` y debajo de la línea de AHORA, igual que la
    // propuesta: siempre se sabe dónde mirar.
    expect(row.parentElement?.tagName).toBe('OL')
    expect(row.previousElementSibling).toHaveTextContent('Ahora')
    // La canaleta va **vacía**: ni «—» ni la hora actual.
    expect(row.querySelector('time')).toBeNull()
    expect(row).toHaveAttribute('data-variant', 'empty')
  })

  it('un día sin plan no repite el «aún no hay plan» ni suena a que falta algo (criterio 192)', () => {
    const card = renderSinNadaQueProponer()

    // El aviso de siempre se queda donde está…
    expect(screen.getByText(/Aún no hay plan para hoy\./)).toBeInTheDocument()
    // …y la tarjeta **no lo repite**.
    expect(card).not.toHaveTextContent('Aún no hay plan')
    for (const palabra of [
      'tarde',
      'te saltaste',
      'perdiste',
      'fallaste',
      'deberías',
      'desperdicio',
      'vacío',
      'todavía no has',
    ]) {
      expect((card.textContent ?? '').toLowerCase()).not.toContain(palabra)
    }
  })

  it('al resolverse lo último, la propuesta pasa a la cara apagada sin remontar (criterios 205 y 377)', async () => {
    // Un solo bloque, ya pasado: se propone y se puede decir «Ya la hice».
    planQuery = ready([block('b1', 'Bañarme', '08:00', '08:45')])
    renderWithProviders(<VidaHoyPage />)

    const antes = upNextCard()!
    expect(antes).toHaveTextContent('Bañarme')

    await act(async () => {
      useVidaDeviceNotesStore.getState().markBlockCouldNot('2026-09-18', 'b1', null)
    })

    const despues = upNextCard()!
    expect(despues).toHaveTextContent('Ya no queda nada en tu plantilla')
    // **La misma `<section>`**: la tarjeta se actualiza, no se desmonta.
    expect(despues).toBe(antes)
  })
})

/* ── El arco de la meta (FEAT-016, tajada 2) ─────────────────────────────── */

const WORK_GOAL: VidaGoal = {
  id: 'goal-work',
  slug: 'work',
  name: 'Trabajo',
  icon: 'briefcase',
  color: '#0284c7',
  targetMinutes: 480,
  // Como nace la meta automática (criterio 575). El día de estas pruebas es
  // viernes, así que cuenta; el caso del sábado tiene su propio bloque abajo.
  activeDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  orderIndex: 0,
}

function categoryOf(id: string, name: string, goal: VidaGoal | null): ActivityCategory {
  return {
    id,
    userId: 1,
    orderIndex: 0,
    name,
    description: null,
    icon: 'briefcase',
    color: '#0284c7',
    goalId: goal?.id ?? null,
    goal,
  }
}

/** Una sesión suelta del día visto, con (o sin) categoría. */
function workSession(input: {
  id: string
  startTime: string
  durationMinutes: number | null
  categoryId?: string | null
  date?: string
  title?: string
}): ActivityFollowUp {
  const categoryId = input.categoryId === undefined ? 'cat-trabajo' : input.categoryId
  return {
    id: input.id,
    activityId: `a-${input.id}`,
    date: input.date ?? '2026-09-18',
    startTime: input.startTime,
    durationMinutes: input.durationMinutes,
    isOpen: input.durationMinutes === null,
    endTime: null,
    endDate: null,
    endDateTime: null,
    notes: null,
    activity: {
      id: `a-${input.id}`,
      title: input.title ?? 'Working at lululemon',
      category: categoryId
        ? { id: categoryId, name: 'Trabajo', color: '#0284c7', icon: 'briefcase' }
        : null,
    },
  }
}

/**
 * El arco, buscado por su `<article>` y el nombre de la meta
 * (`aria-labelledby`).
 *
 * **Antes se buscaba por el `role="img"` del SVG** y desde la tajada 3 ese
 * papel ya no existe: el dibujo es decorativo y la frase entera vive una sola
 * vez, en el `<p>` de solo lectores de pantalla. El localizador se movió con la
 * estructura accesible, que es lo que la revisión de la tajada 2 avisó que
 * había que hacer si se arreglaba la doble lectura.
 */
function goalArc(): HTMLElement | null {
  return screen.queryByRole('article', { name: 'Trabajo' })
}

describe('VidaHoyPage — el arco de la meta (FEAT-016)', () => {
  beforeEach(() => {
    categoriesQuery = ready([categoryOf('cat-trabajo', 'Trabajo', WORK_GOAL)])
  })

  // El nombre y el comentario de este caso decían «dice una hora» (criterio 492
  // de FEAT-016). FEAT-019 enmienda ese criterio de fondo: dentro del arco va
  // **lo que falta**, porque el arco mide horas trabajadas y una hora del reloj
  // ahí dentro eran dos cosas distintas en el mismo sitio. Y en la tajada 5 la
  // hora proyectada desaparece del todo (criterio 589): lo que queda debajo es
  // el mismo texto, a 1×1 px, para quien no ve el arco.
  it('criterios 489, 490 y 559 — el arco va bajo el presupuesto y dice lo que falta', () => {
    dayFollowUpsQuery = ready([workSession({ id: 'w1', startTime: '08:00', durationMinutes: 60 })])
    renderWithProviders(<VidaHoyPage />)

    const arco = goalArc()
    expect(arco).not.toBeNull()
    // 8h − 1h = 7h dentro del arco, con su rótulo.
    expect(within(arco!).getByText('7h')).toBeInTheDocument()
    expect(within(arco!).getByText('Te faltan')).toBeInTheDocument()
    // La hora a la que pararías ya no está en ninguna parte (criterio 589).
    expect(arco!.textContent).not.toMatch(/ritmo|16:24|acabarías/)
    expect(within(arco!).getByText('Te faltan 7 h de Trabajo.')).toBeInTheDocument()
    expect(within(arco!).getByText('1h')).toBeInTheDocument()

    // Debajo del presupuesto del día y **encima** de la agenda.
    const presupuesto = document.getElementById('vida-budget-heading')!.closest('section')!
    const fila = planRow('Bañarme')
    expect(presupuesto.compareDocumentPosition(arco!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(arco!.compareDocumentPosition(fila) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  /**
   * **La hora proyectada se fue, y el arco no se quedó mudo** (FEAT-019,
   * tajada 5, criterios 589 y 590).
   *
   * Este caso medía el criterio 560 —la hora visible debajo del arco—, que el
   * usuario anuló el 2026-09-22 («quiero remover ese cálculo de "a qué hora
   * terminaría mi jornada"»). Lo que se mide ahora es lo contrario y una cosa
   * más: que **no queda ninguna hora** a la vista ni para el lector, y que el
   * `<p>` sigue ahí —uno solo, a 1×1 px— porque el SVG es `aria-hidden` y sin
   * él no habría nada que oír.
   */
  it('criterios 589 y 590 — no queda ninguna hora proyectada, y el arco sigue teniendo voz', () => {
    dayFollowUpsQuery = ready([workSession({ id: 'w1', startTime: '08:00', durationMinutes: 60 })])
    renderWithProviders(<VidaHoyPage />)

    const arco = goalArc()!
    // Ni a la vista, ni escondida, ni en un atributo: la hora no está.
    expect(arco.textContent).not.toMatch(/ritmo|acabarías|16:24/)
    expect(arco.innerHTML).not.toContain('16:24')

    const frase = 'Te faltan 7 h de Trabajo.'
    // Un solo nodo con la frase: ni uno visible y otro para el lector.
    expect(within(arco).getAllByText(frase)).toHaveLength(1)
    // Y es el de 1×1 px: a la vista ya lo dicen la cabecera y el propio arco.
    expect(within(arco).getByText(frase).className).toContain('srLine')
    // El SVG no aporta texto accesible: por eso ese `<p>` no puede faltar.
    expect(arco.querySelector('svg')!.getAttribute('aria-hidden')).not.toBeNull()
  })

  it('criterio 562 — pasada la meta el arco sigue diciendo una hora, y la frase vuelve al lector', () => {
    vi.setSystemTime(new Date(2026, 8, 18, 18, 10, 0))
    dayFollowUpsQuery = ready([
      workSession({ id: 'w1', startTime: '09:00', durationMinutes: 300 }),
      workSession({ id: 'w2', startTime: '14:00', durationMinutes: 240 }),
    ])
    renderWithProviders(<VidaHoyPage />)

    const arco = goalArc()!
    // Dentro sigue la hora a la que se cruzaron las 8 h, con su rótulo de dos
    // líneas: aquí no falta nada, así que no hay nada nuevo que anunciar.
    expect(within(arco).getByText('17:00')).toBeInTheDocument()
    expect(within(arco).getByText('Pasaste las 8h')).toBeInTheDocument()
    expect(arco).not.toHaveTextContent('Te faltan')
    // Y la frase es solo para lectores de pantalla (criterio 564): a la vista
    // ya la dice la hora grande. Esa hora **ocurrió** y por eso el criterio
    // 589 no la toca: sin ella este arco se queda sin nada que enseñar.
    const frase = 'Llevas 9 h. Pasaste las 8 h a las 17:00.'
    expect(within(arco).getAllByText(frase)).toHaveLength(1)
    expect(within(arco).getByText(frase).className).toContain('srLine')
  })

  /**
   * **El semáforo, visto desde la pantalla** (FEAT-019, tajada 2).
   *
   * El color entra por `data-fit` en el `<article>` del arco y no toca ni una
   * palabra: el mismo localizador de siempre (`role="article"` con el nombre
   * de la meta), la misma frase y ningún `role="alert"`. Lo de dentro —cómo
   * sale el margen— se prueba en `vida-goals.utils.test.ts`; aquí se prueba
   * que llega hasta el DOM y que no se convierte en un reproche.
   */
  it('criterios 566 y 567 — el arco se pinta de verde cuando lo que falta cabe de sobra', () => {
    dayFollowUpsQuery = ready([workSession({ id: 'w1', startTime: '08:00', durationMinutes: 60 })])
    renderWithProviders(<VidaHoyPage />)

    // 9:24, faltan 7 h y el día acaba a las 23:00: sobran 6 h 36.
    expect(goalArc()!.getAttribute('data-fit')).toBe('ok')
  })

  it('criterio 569 — cuando ya no cabe hoy y el día acaba corto, el arco se pinta de rojo', () => {
    vi.setSystemTime(new Date(2026, 8, 18, 20, 0, 0))
    dayFollowUpsQuery = ready([workSession({ id: 'w1', startTime: '08:00', durationMinutes: 60 })])
    renderWithProviders(<VidaHoyPage />)

    // Las 20:00: faltan 7 h y hasta las 23:00 quedan 3. Ni trabajando hasta el
    // final el día pasa de 4 h de 8 h, así que es rojo (criterios 569 y 585).
    expect(goalArc()!.getAttribute('data-fit')).toBe('over')
  })

  /**
   * **El rojo que el usuario vio y no reconoció** (FEAT-019, tajada 5,
   * criterios 585 y 586), pintado desde la página: día hasta las 22:00, son
   * las 23:05, lleva 7 h 09 de 8 h. Antes salía rojo; ahora, naranja.
   */
  it('criterio 586 — con el día acabado y el 89 % hecho, el arco es naranja y no rojo', () => {
    vi.setSystemTime(new Date(2026, 8, 18, 23, 5, 0))
    settingsQuery = ready({ ...SETTINGS, vidaDayEndTime: '22:00' })
    dayFollowUpsQuery = ready([workSession({ id: 'w1', startTime: '08:00', durationMinutes: 429 })])
    renderWithProviders(<VidaHoyPage />)

    const arco = goalArc()!
    expect(arco.getAttribute('data-fit')).toBe('tight')
    expect(within(arco).getByText('Te faltan')).toBeInTheDocument()
    expect(within(arco).getByText('51m')).toBeInTheDocument()
  })

  /**
   * **El color no puede convertirse en un reproche** (criterio 572). El mismo
   * día, el mismo arco, con el rojo puesto: ni un adjetivo, ni una
   * exclamación, ni un `role="alert"`, y la frase visible del 560 dice
   * exactamente lo que diría sin semáforo.
   */
  it('criterio 572 — en rojo el texto es el mismo y no hay ningún aviso', () => {
    vi.setSystemTime(new Date(2026, 8, 18, 20, 0, 0))
    dayFollowUpsQuery = ready([workSession({ id: 'w1', startTime: '08:00', durationMinutes: 60 })])
    renderWithProviders(<VidaHoyPage />)

    const arco = goalArc()!
    expect(arco.getAttribute('data-fit')).toBe('over')
    // La misma frase que en verde, letra por letra: lo que falta y nada más.
    expect(within(arco).getByText('Te faltan 7 h de Trabajo.')).toBeInTheDocument()
    expect(within(arco).getByText('Te faltan')).toBeInTheDocument()
    expect(within(arco).queryAllByRole('alert')).toHaveLength(0)
    expect(arco.textContent).not.toMatch(/!|tarde|corre|no llegas|deberías|cuidado/i)
  })

  /**
   * **El caso que devolvió esta tajada la primera vez.** Con cero minutos no
   * hay trazo de avance que teñir (`share === 0`, el `<path>` no se dibuja),
   * así que el color se apoyaba en algo que no existía: a las 20:00 sin nada
   * registrado el arco se veía idéntico a uno neutro. El punto del arranque es
   * lo que lo sostiene ahora, y es la marca que el propio criterio 572 nombra.
   */
  it('criterios 561 y 566 — con cero minutos el semáforo se ve igual', () => {
    vi.setSystemTime(new Date(2026, 8, 18, 20, 0, 0))
    dayFollowUpsQuery = ready([])
    renderWithProviders(<VidaHoyPage />)

    const arco = goalArc()!
    // A las 20:00 faltan las 8 h enteras y hasta las 23:00 quedan 3: no cabe.
    expect(arco.getAttribute('data-fit')).toBe('over')
    // Y hay algo pintado de ese color, aunque el trazo de avance no exista.
    expect(arco.querySelector('svg path[class*="valuePath"]')).toBeNull()
    expect(arco.querySelector('svg circle')).not.toBeNull()
    // Sin una palabra de más por estar en rojo y sin nada hecho.
    expect(within(arco).queryAllByRole('alert')).toHaveLength(0)
    expect(arco.textContent).not.toMatch(/!|tarde|corre|no llegas|deberías|cuidado/i)
  })

  it('el punto del semáforo no existe fuera de la ventana (criterio 571)', () => {
    vi.setSystemTime(new Date(2026, 8, 18, 18, 10, 0))
    dayFollowUpsQuery = ready([
      workSession({ id: 'w1', startTime: '09:00', durationMinutes: 300 }),
      workSession({ id: 'w2', startTime: '14:00', durationMinutes: 240 }),
    ])
    renderWithProviders(<VidaHoyPage />)

    const arco = goalArc()!
    expect(arco.hasAttribute('data-fit')).toBe(false)
    expect(arco.querySelector('svg circle')).toBeNull()
  })

  it('criterio 571 — pasada la meta el arco no lleva ningún color', () => {
    vi.setSystemTime(new Date(2026, 8, 18, 18, 10, 0))
    dayFollowUpsQuery = ready([
      workSession({ id: 'w1', startTime: '09:00', durationMinutes: 300 }),
      workSession({ id: 'w2', startTime: '14:00', durationMinutes: 240 }),
    ])
    renderWithProviders(<VidaHoyPage />)

    expect(goalArc()!.hasAttribute('data-fit')).toBe(false)
  })

  it('criterio 573 — un día pasado nunca lleva color, haya llegado o no a la meta', () => {
    dayFollowUpsQuery = ready([
      workSession({ id: 'w1', startTime: '09:00', durationMinutes: 300, date: '2026-09-17' }),
    ])
    renderWithProviders(<VidaHoyPage />, {
      routerProps: { initialEntries: ['/app/vida/hoy?d=2026-09-17'] },
    })

    const arco = goalArc()!
    expect(arco.hasAttribute('data-fit')).toBe(false)
    // Y sigue sin proyectar nada: el semáforo no reabre lo que cerró el 497.
    expect(arco).not.toHaveTextContent('A este ritmo')
  })

  it('criterio 490 — una categoría sin meta no suma en el arco', () => {
    categoriesQuery = ready([
      categoryOf('cat-trabajo', 'Trabajo', WORK_GOAL),
      categoryOf('cat-casa', 'Casa', null),
    ])
    dayFollowUpsQuery = ready([
      workSession({ id: 'w1', startTime: '08:00', durationMinutes: 60 }),
      workSession({ id: 'w2', startTime: '09:00', durationMinutes: 120, categoryId: 'cat-casa' }),
    ])
    renderWithProviders(<VidaHoyPage />)

    expect(within(goalArc()!).getByText('Te faltan 7 h de Trabajo.')).toBeInTheDocument()
    // Y tampoco se confiesa: de «Casa» ya se sabe que no cuenta (criterio 494).
    expect(screen.queryByText(/sin dato hoy/)).not.toBeInTheDocument()
  })

  it('criterio 491 — la sesión en marcha suma su minuto vivo sin recargar', async () => {
    dayFollowUpsQuery = ready([workSession({ id: 'w1', startTime: '08:00', durationMinutes: null })])
    renderWithProviders(<VidaHoyPage />)

    // 8:00 → 9:24 son 84 minutos, contados por `toSessionSpans`.
    expect(within(goalArc()!).getByText('1h 24')).toBeInTheDocument()
    expect(within(goalArc()!).getByText(/en marcha desde las 8:00/)).toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(60_000)
    })

    expect(within(goalArc()!).getByText('1h 25')).toBeInTheDocument()
  })

  it('criterio 493 — pasada la jornada, el dato y ni un adjetivo ni un aviso', () => {
    vi.setSystemTime(new Date(2026, 8, 18, 18, 10, 0))
    dayFollowUpsQuery = ready([
      workSession({ id: 'w1', startTime: '09:00', durationMinutes: 300 }),
      workSession({ id: 'w2', startTime: '14:00', durationMinutes: null }),
    ])
    renderWithProviders(<VidaHoyPage />)

    const arco = goalArc()!
    expect(within(arco).getByText('Llevas 9 h 10 min. Pasaste las 8 h a las 17:00.')).toBeInTheDocument()
    // Ni `role="alert"`, ni el tono de aviso que el módulo reserva para los
    // avisos de verdad, ni una palabra de reproche.
    expect(arco.querySelector('[role="alert"]')).toBeNull()
    expect(arco.querySelector('[class*="Alert"]')).toBeNull()
    const texto = (arco.textContent ?? '').toLowerCase()
    for (const palabra of ['demasiado', 'exceso', 'cuidado', 'deberías', 'fallaste', 'vicio', '!']) {
      expect(texto).not.toContain(palabra)
    }
  })

  it('criterio 494 — las sesiones sin categoría se confiesan en su línea', () => {
    dayFollowUpsQuery = ready([
      workSession({ id: 'w1', startTime: '08:00', durationMinutes: 60 }),
      workSession({ id: 'w2', startTime: '09:30', durationMinutes: 160, categoryId: null }),
    ])
    renderWithProviders(<VidaHoyPage />)

    expect(screen.getByText('2 h 40 min sin dato hoy.')).toBeInTheDocument()
  })

  it('criterio 495 — con cero minutos el arco aparece vacío y dice la jornada entera', () => {
    dayFollowUpsQuery = ready([])
    renderWithProviders(<VidaHoyPage />)

    const arco = goalArc()!
    // La frase en condicional («si arrancas ahora, acabarías a las…») se fue
    // con la otra hora proyectada (criterio 589).
    expect(arco.textContent).not.toMatch(/acabarías|ritmo/)
    expect(within(arco).getByText('Te faltan 8 h de Trabajo.')).toBeInTheDocument()
    expect(within(arco).getByText('0m')).toBeInTheDocument()
  })

  it('criterio 496 — en un día futuro no se pinta', () => {
    renderWithProviders(<VidaHoyPage />, {
      routerProps: { initialEntries: ['/app/vida/hoy?d=2026-09-19'] },
    })

    expect(goalArc()).toBeNull()
  })

  it('criterio 497 — en un día pasado se cuenta en pasado y sin proyección', () => {
    dayFollowUpsQuery = ready([
      workSession({ id: 'w1', startTime: '09:00', durationMinutes: 300, date: '2026-09-17' }),
    ])
    renderWithProviders(<VidaHoyPage />, {
      routerProps: { initialEntries: ['/app/vida/hoy?d=2026-09-17'] },
    })

    const arco = goalArc()!
    expect(within(arco).getByText('Registraste 5 h de Trabajo.')).toBeInTheDocument()
    expect(arco).not.toHaveTextContent('A este ritmo')
  })

  it('criterio 499 — con el catálogo caído el arco no aparece, y el aviso del día no lo nombra', () => {
    categoriesQuery = { data: undefined, isPending: false, isError: true, fetchStatus: 'idle', refetch: vi.fn() }
    dayFollowUpsQuery = ready([workSession({ id: 'w1', startTime: '08:00', durationMinutes: 60 })])
    renderWithProviders(<VidaHoyPage />)

    expect(goalArc()).toBeNull()
    // El contrato de «Falta una parte de tu día» son las cuatro consultas del
    // día: el catálogo no entra ahí y el aviso no se ensancha.
    expect(screen.queryByText('Falta una parte de tu día')).not.toBeInTheDocument()
  })

  it('criterio 499 — con una consulta del día caída tampoco se pinta media suma', () => {
    dayFollowUpsQuery = { data: [], isPending: false, isError: true, fetchStatus: 'idle', refetch: vi.fn() }
    renderWithProviders(<VidaHoyPage />)

    expect(goalArc()).toBeNull()
    expect(screen.getByText('Falta una parte de tu día')).toBeInTheDocument()
  })

  it('sin ninguna categoría apuntando a una meta no hay arco: ahí va la pregunta', () => {
    categoriesQuery = ready([categoryOf('cat-casa', 'Casa', null)])
    dayFollowUpsQuery = ready([workSession({ id: 'w1', startTime: '08:00', durationMinutes: 60 })])
    renderWithProviders(<VidaHoyPage />)

    expect(goalArc()).toBeNull()
    expect(screen.queryByText(/sin dato hoy/)).not.toBeInTheDocument()
    expect(goalPrompt()).not.toBeNull()
  })
})

/* ── La pregunta cuando nada apunta a una meta (FEAT-016, tajada 3) ───────── */

/** La pregunta, buscada por su `<section>` y el texto que la nombra. */
function goalPrompt(): HTMLElement | null {
  return screen.queryByRole('region', { name: '¿Cuál de estas es tu trabajo?' })
}

describe('VidaHoyPage — la pregunta de la meta (FEAT-016, tajada 3)', () => {
  beforeEach(() => {
    // Dos categorías del usuario y **ninguna** apuntando a una meta: el estado
    // de quien nunca fue a Ajustes a marcar nada.
    categoriesQuery = ready([
      categoryOf('cat-trabajo', 'Trabajo', null),
      categoryOf('cat-casa', 'Casa', null),
    ])
  })

  it('criterio 500 — la pregunta ocupa el sitio del arco, con las categorías en botones', () => {
    renderWithProviders(<VidaHoyPage />)

    const pregunta = goalPrompt()!
    expect(
      within(pregunta).getByText(
        'Toca una y te digo, cada día, cuánto llevas trabajado y a qué hora llegas a las 8 horas.',
      ),
    ).toBeInTheDocument()
    expect(within(pregunta).getByRole('button', { name: 'Trabajo' })).toBeInTheDocument()
    expect(within(pregunta).getByRole('button', { name: 'Casa' })).toBeInTheDocument()

    // **El sitio del arco**, afirmado por posición y no por un
    // `toBeInTheDocument`: debajo del presupuesto y encima de la agenda.
    const presupuesto = document.getElementById('vida-budget-heading')!.closest('section')!
    const fila = planRow('Bañarme')
    expect(presupuesto.compareDocumentPosition(pregunta) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(pregunta.compareDocumentPosition(fila) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('criterio 501 — un toque escribe el puntero y el arco aparece sin recargar', () => {
    dayFollowUpsQuery = ready([workSession({ id: 'w1', startTime: '08:00', durationMinutes: 60 })])
    const { rerender } = renderWithProviders(<VidaHoyPage />)

    fireEvent.click(within(goalPrompt()!).getByRole('button', { name: 'Trabajo' }))

    // La **misma** mutación de la casilla del formulario, con la meta sin
    // nombrar: la crea el servidor si no existe (criterio 484).
    expect(categoryMutation.mutate).toHaveBeenCalledTimes(1)
    expect(categoryMutation.mutate).toHaveBeenCalledWith({
      categoryId: 'cat-trabajo',
      attached: true,
    })

    // Lo que hace el `onSuccess` del hook: invalidar el catálogo. Cuando vuelve
    // con la meta dentro, **la misma página ya montada** pinta el arco.
    categoriesQuery = ready([
      categoryOf('cat-trabajo', 'Trabajo', WORK_GOAL),
      categoryOf('cat-casa', 'Casa', null),
    ])
    rerender(<VidaHoyPage />)

    expect(goalPrompt()).toBeNull()
    expect(within(goalArc()!).getByText('Te faltan 7 h de Trabajo.')).toBeInTheDocument()
  })

  it('criterio 502 — un toque y ya: ni navegación, ni formulario, ni confirmación', () => {
    renderWithProviders(<VidaHoyPage />)

    fireEvent.click(within(goalPrompt()!).getByRole('button', { name: 'Casa' }))

    // Ni un diálogo, ni una hoja, ni un segundo paso que confirmar.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    // Y no se fue a ningún sitio: la agenda sigue donde estaba.
    expect(planRow('Bañarme')).toBeInTheDocument()
    expect(categoryMutation.mutate).toHaveBeenCalledTimes(1)
  })

  it('criterio 502 — con una categoría ya apuntada la pregunta no vuelve en ningún día', () => {
    categoriesQuery = ready([
      categoryOf('cat-trabajo', 'Trabajo', WORK_GOAL),
      categoryOf('cat-casa', 'Casa', null),
    ])
    renderWithProviders(<VidaHoyPage />)
    expect(goalPrompt()).toBeNull()

    // Y tampoco en un día pasado, donde el arco sí se pinta.
    renderWithProviders(<VidaHoyPage />, {
      routerProps: { initialEntries: ['/app/vida/hoy?d=2026-09-17'] },
    })
    expect(goalPrompt()).toBeNull()
  })

  it('criterio 503 — con el catálogo vacío no hay botones vacíos ni error', () => {
    categoriesQuery = ready([])
    renderWithProviders(<VidaHoyPage />)

    expect(goalPrompt()).toBeNull()
    expect(screen.queryByText(/Cuál de estas/)).not.toBeInTheDocument()
    expect(goalArc()).toBeNull()
    // El sitio del arco no se rompe: la agenda sigue entera.
    expect(planRow('Bañarme')).toBeInTheDocument()
  })

  it('mientras el catálogo viaja no se afirma ni el arco ni la pregunta', () => {
    categoriesQuery = { data: undefined, isPending: true, isError: false, fetchStatus: 'fetching', refetch: vi.fn() }
    renderWithProviders(<VidaHoyPage />)

    expect(goalPrompt()).toBeNull()
    expect(goalArc()).toBeNull()
    // El hueco queda reservado: la agenda no da el salto cuando llega.
    expect(document.querySelector('[aria-busy="true"][aria-live="polite"]')).not.toBeNull()
  })

  it('«Ahora no» aparta la pregunta sin escribir nada', () => {
    renderWithProviders(<VidaHoyPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Ahora no' }))

    expect(goalPrompt()).toBeNull()
    expect(categoryMutation.mutate).not.toHaveBeenCalled()
  })

  it('los botones se inhabilitan mientras la mutación viaja', () => {
    categoryMutation = { ...categoryMutation, isPending: true }
    renderWithProviders(<VidaHoyPage />)

    expect(within(goalPrompt()!).getByRole('button', { name: 'Trabajo' })).toBeDisabled()
  })
})

/* ── El sábado sin arco (FEAT-019, tajada 3) ──────────────────────────────
 *
 * Criterios 576, 578, 579 y 580. Un sábado la meta de lunes a viernes **no
 * existe**: no es que se haya fallado, es que ese día no cuenta. Ni arco, ni
 * semáforo, ni pregunta, ni hueco donde estaban.
 */

/** La meta que cuenta los siete días, para medir que cada una va por su cuenta. */
const SLEEP_GOAL: VidaGoal = {
  id: 'goal-sleep',
  slug: 'sleep',
  name: 'Sueño',
  icon: 'moon',
  color: '#7C3AED',
  targetMinutes: 480,
  activeDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
  orderIndex: 1,
}

describe('VidaHoyPage — el sábado sin arco (FEAT-019, tajada 3)', () => {
  beforeEach(() => {
    // **Hoy es sábado 19.** El reloj y el día mirado se mueven juntos: sin `?d=`
    // la página mira hoy, que es lo que el usuario ve al abrirla un fin de semana.
    vi.setSystemTime(new Date(2026, 8, 19, 9, 24, 0))
    viewedDate = '2026-09-19'
    plansByDate['2026-09-19'] = [...PLAN]
    planQuery = ready(plansByDate['2026-09-19']!)
  })

  it('criterios 576 y 578 — un sábado no hay arco, ni semáforo, ni nodo escondido', () => {
    categoriesQuery = ready([categoryOf('cat-trabajo', 'Trabajo', WORK_GOAL)])
    dayFollowUpsQuery = ready([
      workSession({ id: 'w1', startTime: '08:00', durationMinutes: 60, date: '2026-09-19' }),
    ])
    renderWithProviders(<VidaHoyPage />)

    expect(goalArc()).toBeNull()
    // Ni escondido: no hay **ningún** nodo del arco, tampoco con `data-fit`.
    expect(document.querySelector('[data-fit]')).toBeNull()
    expect(screen.queryByText('Te faltan')).not.toBeInTheDocument()
    // Y el sitio no queda en obras: la agenda va donde iba, pegada al presupuesto.
    const presupuesto = document.getElementById('vida-budget-heading')!.closest('section')!
    const fila = planRow('Bañarme')
    expect(presupuesto.compareDocumentPosition(fila) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('criterio 577 — lo registrado ese sábado sigue en la pantalla, solo deja de sumar', () => {
    categoriesQuery = ready([categoryOf('cat-trabajo', 'Trabajo', WORK_GOAL)])
    dayFollowUpsQuery = ready([
      workSession({
        id: 'w1',
        startTime: '08:00',
        durationMinutes: 60,
        date: '2026-09-19',
        title: 'Working at lululemon',
      }),
    ])
    renderWithProviders(<VidaHoyPage />)

    expect(goalArc()).toBeNull()
    // La sesión se ve en la línea del día: no se ha perdido ni se ha dejado de
    // registrar, solo no cuenta contra ninguna meta.
    expect(screen.getAllByText('Working at lululemon').length).toBeGreaterThan(0)
    // Y tampoco se recoloca en «sin dato»: eso es para lo que no tiene categoría.
    expect(screen.queryByText(/sin dato hoy/)).not.toBeInTheDocument()
  })

  it('criterio 579 — la meta de los siete días sí sale ese mismo sábado', () => {
    categoriesQuery = ready([
      categoryOf('cat-trabajo', 'Trabajo', WORK_GOAL),
      categoryOf('cat-sueno', 'Sueño', SLEEP_GOAL),
    ])
    dayFollowUpsQuery = ready([])
    renderWithProviders(<VidaHoyPage />)

    expect(goalArc()).toBeNull()
    expect(screen.queryByRole('article', { name: 'Sueño' })).not.toBeNull()
  })

  it('criterio 580 — sin ninguna categoría apuntando a una meta, el sábado tampoco pregunta', () => {
    categoriesQuery = ready([
      categoryOf('cat-trabajo', 'Trabajo', null),
      categoryOf('cat-casa', 'Casa', null),
    ])
    renderWithProviders(<VidaHoyPage />)

    // El mismo dato esconde las dos cosas: si la pregunta saliera, tocar una
    // categoría no haría aparecer ningún arco y el usuario se quedaría mirando
    // un hueco después de contestar.
    expect(goalPrompt()).toBeNull()
    expect(goalArc()).toBeNull()
    expect(screen.queryByText(/Cuál de estas/)).not.toBeInTheDocument()
  })

  it('el lunes siguiente la pregunta vuelve: el sábado no la apaga para siempre', () => {
    vi.setSystemTime(new Date(2026, 8, 21, 9, 24, 0))
    viewedDate = '2026-09-21'
    plansByDate['2026-09-21'] = [...PLAN]
    planQuery = ready(plansByDate['2026-09-21']!)
    categoriesQuery = ready([categoryOf('cat-trabajo', 'Trabajo', null)])
    renderWithProviders(<VidaHoyPage />)

    expect(goalPrompt()).not.toBeNull()
  })
})

/* ── «Qué hiciste» en la línea del día (FEAT-018, tajada 1) ───────────────
 *
 * Criterios 535 a 538. Lo que la pantalla tiene que hacer bien es **cablear**:
 * de qué sesión sale la nota de cada fila, en qué días se ofrece escribirla y
 * a quién se le pasa al abrir el editor. El editor tiene su propio test en
 * `components/VidaNoteSheet/VidaNoteSheet.test.tsx`, y la línea que se lee es
 * un componente aparte para que el recorte viva en un solo sitio.
 */
describe('VidaHoyPage — la nota de la sesión en la línea del día (FEAT-018)', () => {
  function withNote(
    id: string,
    activityId: string,
    title: string,
    startTime: string,
    durationMinutes: number,
    notes: string | null,
    date = '2026-09-18',
  ): ActivityFollowUp {
    return {
      id,
      activityId,
      date,
      startTime,
      durationMinutes,
      isOpen: false,
      endTime: null,
      endDate: null,
      endDateTime: null,
      notes,
      activity: { id: activityId, title, category: null },
    }
  }

  /** La pantalla dentro del contexto del módulo: quien abre el editor es el layout. */
  function renderWithNoteSheet(
    openNoteSheet: (session: ActivityFollowUp) => void,
    search = '',
  ) {
    renderWithProviders(
      <VidaSessionUiContext.Provider
        value={{
          openFinishModal: () => {},
          openNoteSheet,
          openStartNoteSheet: () => {},
          openStartTimeSheet: () => {},
        }}
      >
        <VidaHoyPage />
      </VidaSessionUiContext.Provider>,
      search ? { routerProps: { initialEntries: [`/app/vida/hoy${search}`] } } : undefined,
    )
  }

  it('criterio 535 — un bloque del plan con nota la enseña bajo el nombre', () => {
    dayFollowUpsQuery = ready([
      withNote('f1', 'a-b1', 'Bañarme', '08:00', 45, 'Con agua fría, a ver si espabilo'),
    ])
    renderWithProviders(<VidaHoyPage />)

    const row = planRow('Bañarme')
    expect(within(row).getByText('Con agua fría, a ver si espabilo')).toBeInTheDocument()
    // Y no ofrece añadir lo que ya está escrito.
    expect(within(row).queryByText('añadir qué hiciste')).not.toBeInTheDocument()
  })

  it('criterio 535 — una sesión fuera del plan con nota también la enseña', () => {
    dayFollowUpsQuery = ready([
      withNote('f9', 'otra', 'Llamada con el banco', '11:40', 32, 'La hipoteca'),
    ])
    renderWithProviders(<VidaHoyPage />)

    const row = screen.getByText('Llamada con el banco').closest('li')!
    expect(within(row).getByText('La hipoteca')).toBeInTheDocument()
  })

  it('criterio 536 — una sesión terminada sin nota ofrece «añadir qué hiciste», sin reproche', () => {
    dayFollowUpsQuery = ready([withNote('f1', 'a-b1', 'Bañarme', '08:00', 45, null)])
    renderWithProviders(<VidaHoyPage />)

    const row = planRow('Bañarme')
    expect(within(row).getByText('añadir qué hiciste')).toBeInTheDocument()
    // Ni «falta», ni «vacío», ni «sin nota».
    expect(within(row).queryByText(/falta|vac|sin nota|olvid/i)).not.toBeInTheDocument()
  })

  it('criterio 537 — en un día futuro no se ofrece añadir nada', () => {
    plansByDate = {
      '2026-09-19': [{ ...block('p1', 'Leer un rato', '09:00', '09:30'), date: '2026-09-19' }],
    }
    renderWithProviders(<VidaHoyPage />, {
      routerProps: { initialEntries: ['/app/vida/hoy?d=2026-09-19'] },
    })

    expect(screen.getByText('Leer un rato')).toBeInTheDocument()
    expect(screen.queryByText('añadir qué hiciste')).not.toBeInTheDocument()
  })

  it('criterio 537 — la sesión en marcha no ofrece la línea: eso es la tajada 2', () => {
    dayFollowUpsQuery = ready([
      { ...withNote('f9', 'otra', 'Llamada con el banco', '09:10', 0, null), durationMinutes: null, isOpen: true },
    ])
    renderWithProviders(<VidaHoyPage />)

    const row = screen.getByText('Llamada con el banco').closest('li')!
    expect(within(row).getByText('en marcha')).toBeInTheDocument()
    expect(within(row).queryByText('añadir qué hiciste')).not.toBeInTheDocument()
  })

  it('criterio 538 — tocar la nota de un bloque abre el editor con **esa** sesión', async () => {
    const openNoteSheet = vi.fn()
    dayFollowUpsQuery = ready([
      withNote('f1', 'a-b1', 'Bañarme', '08:00', 45, 'Con agua fría'),
    ])
    renderWithNoteSheet(openNoteSheet)

    fireEvent.click(within(planRow('Bañarme')).getByRole('button', { name: /Con agua fría/ }))

    expect(openNoteSheet).toHaveBeenCalledTimes(1)
    expect(openNoteSheet.mock.calls[0]![0]).toMatchObject({ id: 'f1', notes: 'Con agua fría' })
  })

  it('criterio 538 — «añadir qué hiciste» abre el editor sobre la sesión suelta', () => {
    const openNoteSheet = vi.fn()
    dayFollowUpsQuery = ready([
      withNote('f9', 'otra', 'Llamada con el banco', '11:40', 32, null),
    ])
    renderWithNoteSheet(openNoteSheet)

    const row = screen.getByText('Llamada con el banco').closest('li')!
    fireEvent.click(within(row).getByRole('button', { name: 'añadir qué hiciste' }))

    expect(openNoteSheet).toHaveBeenCalledTimes(1)
    expect(openNoteSheet.mock.calls[0]![0]).toMatchObject({ id: 'f9', notes: null })
  })

  /* ── Durante, en la agenda (tajada 2, criterio 542) ────────────────────────
   *
   * La barra vive en `VidaModuleLayout` y tiene su propio test; lo que esta
   * pantalla tiene que hacer bien es que **la fila del plan y la fila de fuera
   * del plan se comporten igual** mientras algo corre. Antes divergían: la de
   * fuera enseñaba la nota y la del plan la escondía (hallazgo 1 de la
   * revisión de la tajada 1).
   */

  it('criterio 542 — el bloque del plan en marcha pregunta «¿Qué estás haciendo?»', () => {
    openSession = {
      session: openFollowUp('a-b2'),
      startInstant: new Date(2026, 8, 18, 9, 0, 0),
      isFromAnotherDay: false,
      isDisabled: false,
      isPending: false,
    }
    dayFollowUpsQuery = ready([
      { ...withNote('f1', 'a-b2', 'Leer un rato', '09:00', 0, null), durationMinutes: null, isOpen: true },
    ])
    renderWithProviders(<VidaHoyPage />)

    const row = planRow('Leer un rato')
    expect(within(row).getByRole('button', { name: '¿Qué estás haciendo?' })).toBeInTheDocument()
    // El «＋ añadir qué hiciste» sigue sin aparecer sobre lo que no ha
    // terminado (criterio 537): ahí la pregunta es otra.
    expect(within(row).queryByText('añadir qué hiciste')).not.toBeInTheDocument()
  })

  it('criterio 542 — con nota escrita, el bloque en marcha la enseña y se toca', () => {
    const openNoteSheet = vi.fn()
    openSession = {
      session: openFollowUp('a-b2'),
      startInstant: new Date(2026, 8, 18, 9, 0, 0),
      isFromAnotherDay: false,
      isDisabled: false,
      isPending: false,
    }
    dayFollowUpsQuery = ready([
      {
        ...withNote('f1', 'a-b2', 'Leer un rato', '09:00', 0, 'Bug del carrito'),
        durationMinutes: null,
        isOpen: true,
      },
    ])
    renderWithNoteSheet(openNoteSheet)

    fireEvent.click(within(planRow('Leer un rato')).getByRole('button', { name: /Bug del carrito/ }))

    expect(openNoteSheet).toHaveBeenCalledTimes(1)
    expect(openNoteSheet.mock.calls[0]![0]).toMatchObject({ id: 'f1', isOpen: true })
  })

  it('criterio 542 — la sesión en marcha **fuera del plan** pregunta lo mismo', () => {
    const openNoteSheet = vi.fn()
    dayFollowUpsQuery = ready([
      {
        ...withNote('f9', 'otra', 'Llamada con el banco', '09:10', 0, null),
        durationMinutes: null,
        isOpen: true,
      },
    ])
    renderWithNoteSheet(openNoteSheet)

    const row = screen.getByText('Llamada con el banco').closest('li')!
    expect(within(row).getByText('en marcha')).toBeInTheDocument()
    fireEvent.click(within(row).getByRole('button', { name: '¿Qué estás haciendo?' }))

    expect(openNoteSheet).toHaveBeenCalledTimes(1)
    expect(openNoteSheet.mock.calls[0]![0]).toMatchObject({ id: 'f9', isOpen: true })
  })
})

/**
 * **Empezar desde la hora planeada, en un toque** (FEAT-013, tajada 3,
 * criterios 350 a 354).
 *
 * El caso de arriba —«un solo toque arranca, y la duración planeada no viaja»,
 * que compara el **array entero**— es el guardián del ▶ y **no se ha tocado**.
 * Estos comparan el array entero por el mismo motivo: si el atajo colara la
 * duración del plan, o si el ▶ empezara a mandar una hora, se pondrían rojos.
 *
 * El reloj se mueve a las **8:20**: «Bañarme» estaba planeado a las 8:00, así
 * que se pasó veinte minutos y está dentro de la ventana.
 */
describe('VidaHoyPage — el atajo de la hora planeada (FEAT-013, criterios 350 a 354)', () => {
  const PLANNED_LABEL = 'Empezar «Bañarme» desde las 8:00, lo que tenías planeado'

  it('criterio 350 y 352 — un toque en la hora del plan manda **una** llamada con esa hora', () => {
    vi.setSystemTime(new Date(2026, 8, 18, 8, 20, 0))
    renderWithProviders(<VidaHoyPage />)

    fireEvent.click(screen.getByRole('button', { name: PLANNED_LABEL }))

    // **Una sola ruta al API**: la misma `start()` de la tajada 1, con la hora
    // en su hueco de siempre. Ni un `activityFollowUpAdd` del trozo pasado, ni
    // una segunda escritura, ni la duración planeada.
    expect(startSession).toHaveBeenCalledTimes(1)
    expect(startSession.mock.calls[0]).toEqual(['a-b1', '08:00'])
    expect(createFollowUpMutation.mutate).not.toHaveBeenCalled()
    // Sin hoja, sin elegir, sin confirmar: entre el toque y la mutación no se
    // abre nada.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('criterio 351 — el ▶ del mismo bloque sigue costando un toque y sigue sin hora', () => {
    vi.setSystemTime(new Date(2026, 8, 18, 8, 20, 0))
    renderWithProviders(<VidaHoyPage />)

    fireEvent.click(within(planRow('Bañarme')).getByRole('button', { name: '▶ Empezar' }))

    expect(startSession).toHaveBeenCalledTimes(1)
    expect(startSession.mock.calls[0]).toEqual(['a-b1'])
  })

  it('criterio 352 — con la nota escrita antes, sigue siendo **una** llamada', () => {
    vi.setSystemTime(new Date(2026, 8, 18, 8, 20, 0))
    const openStartNoteSheet = vi.fn((request: VidaStartNoteRequest) => {
      request.onSave('Con agua fría')
    })
    renderWithProviders(
      <VidaSessionUiContext.Provider
        value={{
          openFinishModal: () => {},
          openNoteSheet: () => {},
          openStartNoteSheet,
          openStartTimeSheet: () => {},
        }}
      >
        <VidaHoyPage />
      </VidaSessionUiContext.Provider>,
    )

    fireEvent.click(within(planRow('Bañarme')).getByRole('button', { name: /¿Qué vas a hacer\?/ }))
    fireEvent.click(screen.getByRole('button', { name: PLANNED_LABEL }))

    expect(startSession).toHaveBeenCalledTimes(1)
    expect(startSession.mock.calls[0]).toEqual(['a-b1', '08:00', { notes: 'Con agua fría' }])
  })

  it('criterio 353 — a las 7:40, con «Bañarme» todavía por venir, no hay atajo', () => {
    vi.setSystemTime(new Date(2026, 8, 18, 7, 40, 0))
    renderWithProviders(<VidaHoyPage />)

    expect(screen.queryByRole('button', { name: PLANNED_LABEL })).not.toBeInTheDocument()
  })

  it('criterio 354 — a las 9:24 (84 min tarde) ya no se ofrece', () => {
    renderWithProviders(<VidaHoyPage />)

    expect(screen.queryByRole('button', { name: PLANNED_LABEL })).not.toBeInTheDocument()
  })

  /**
   * **Con algo en marcha el atajo no existe, en ningún bloque** (decisión del
   * usuario tras la revisión de la tajada 3).
   *
   * Lo que se sujeta aquí es la razón, no el detalle: el atajo cerraría lo que
   * corre **a una hora del pasado** y eso le borraría minutos ya vividos. El ▶
   * sí se queda —cierra a este momento, que no borra nada—, y estos casos lo
   * comprueban en la misma pantalla para que nadie «arregle» uno rompiendo el
   * otro.
   */
  function conAlgoEnMarcha() {
    vi.setSystemTime(new Date(2026, 8, 18, 8, 20, 0))
    openSession = {
      session: openFollowUp('a-b2', '08:00'),
      startInstant: new Date(2026, 8, 18, 8, 0, 0),
      isFromAnotherDay: false,
      isDisabled: false,
      isPending: false,
    }
    renderWithProviders(<VidaHoyPage />)
  }

  it('con algo en marcha, **ningún** bloque ofrece el atajo', () => {
    conAlgoEnMarcha()

    expect(
      screen.queryAllByRole('button', { name: /lo que tenías planeado/ }),
    ).toHaveLength(0)
  })

  it('con algo en marcha, el ▶ **sigue** en los demás bloques', () => {
    conAlgoEnMarcha()

    // El ▶ no se toca: cierra lo anterior **a este momento**, que no borra
    // nada ya vivido (FEAT-004, criterio 15).
    fireEvent.click(within(planRow('Bañarme')).getByRole('button', { name: '▶ Empezar' }))
    expect(startSession).toHaveBeenCalledTimes(1)
    expect(startSession.mock.calls[0]).toEqual(['a-b1'])
  })

  it('con algo en marcha, la hora vuelve a ser texto: nada que parezca tocable', () => {
    conAlgoEnMarcha()

    const hora = within(planRow('Bañarme')).getByText('8:00')
    expect(hora.tagName).toBe('TIME')
    expect(hora.closest('button')).toBeNull()
  })

  it('en un día pasado no hay atajo: allí no se empieza nada', () => {
    viewedDate = '2026-09-17'
    plansByDate['2026-09-17'] = [block('p1', 'Leer un rato', '10:00', '10:30')]
    planQuery = ready(plansByDate['2026-09-17']!)
    renderWithProviders(<VidaHoyPage />, {
      routerProps: { initialEntries: ['/app/vida/hoy?d=2026-09-17'] },
    })

    expect(
      screen.queryByRole('button', { name: /lo que tenías planeado/ }),
    ).not.toBeInTheDocument()
  })
})

/**
 * **La noche en Hoy** (FEAT-012, tajada 2): las dos franjas y, sobre todo, la
 * ventana del día saliendo de la noche.
 *
 * El día de estas pruebas es **viernes 18/9/2026** a las 9:24, así que una
 * noche marcada jueves y viernes le llega por los dos lados: la del jueves
 * termina aquí (franja de arriba) y la del viernes empieza aquí (la de abajo).
 */
describe('VidaHoyPage — la noche es el borde del día (FEAT-012)', () => {
  function conNoche(overrides: Partial<UserSettings> = {}) {
    settingsQuery = ready({
      ...SETTINGS,
      vidaNightBedTime: '23:00',
      vidaNightWakeTime: '05:00',
      vidaNightDays: ['thursday', 'friday'],
      ...overrides,
    } as UserSettings)
  }

  /**
   * **Esa noche, ya contestada.** Desde la tajada 3 la franja de arriba de un
   * día real cuenta lo que dormiste, y mientras nadie conteste su sitio lo
   * ocupa la pregunta (criterio 288). Las pruebas de la **forma** de las dos
   * franjas —dónde van y qué no son— parten por tanto de una noche confirmada.
   */
  function nocheConfirmada(bedTime = '23:00', wakeTime = '05:00') {
    useVidaDeviceNotesStore.getState().setNightLog('2026-09-18', {
      bedTime,
      wakeTime,
      confirmedAt: '2026-09-18T07:05:00.000Z',
    })
  }

  // `data-variant` no basta aquí: en Hoy lo llevan también la tarjeta de «lo
  // que viene» y las filas de sesión. Las franjas son las dos únicas con
  // `dawn` / `dusk`.
  /** El texto entero del presupuesto: la barra reparte sus cifras en varios nodos. */
  function budgetText(): string {
    return (
      document.querySelector('section[aria-labelledby="vida-budget-heading"]')?.textContent ?? ''
    )
  }

  /**
   * El `<ol>` de la agenda, que en Hoy **no lleva nombre accesible** y convive
   * con otras listas (la leyenda del presupuesto, la tira). Se busca por su
   * clase de módulo, que conserva el nombre delante del hash.
   */
  function agendaList(): HTMLElement {
    return document.querySelector<HTMLElement>('ol[class*="agenda"]')!
  }

  function bands(): HTMLElement[] {
    return [
      ...document.querySelectorAll<HTMLElement>('[data-variant="dawn"], [data-variant="dusk"]'),
    ]
  }

  // Criterio 278: las dos franjas, con el mismo aspecto que en la plantilla y
  // en el mismo sitio relativo — lo primero y lo último de la agenda.
  it('pinta la franja de arriba y la de abajo, fuera de la lista (criterios 278 y 272)', () => {
    conNoche()
    // Con la noche ya contestada, la de arriba cuenta **lo real** (criterio
    // 297): es lo que se ve en Hoy el resto del día. Sin contestar, su sitio lo
    // ocupa la pregunta, y eso se prueba en el bloque de la tajada 3.
    nocheConfirmada()
    renderWithProviders(<VidaHoyPage />)

    const pintadas = bands()
    expect(pintadas).toHaveLength(2)
    expect(pintadas[0]!.dataset.variant).toBe('dawn')
    expect(pintadas[0]!.textContent).toContain('Dormiste 23:00 → 5:00')
    expect(pintadas[1]!.dataset.variant).toBe('dusk')
    expect(pintadas[1]!.textContent).toContain('23:00 · te acuestas')

    // Ni dentro del `<ol>`, ni una fila, ni nada que se pueda abrir.
    const agenda = agendaList()
    for (const band of pintadas) {
      expect(agenda.contains(band)).toBe(false)
      expect(band.closest('li')).toBeNull()
      expect(band.querySelector('button')).toBeNull()
    }
    // Y la de arriba va **antes** que la lista; la de abajo, después.
    expect(pintadas[0]!.compareDocumentPosition(agenda) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(pintadas[1]!.compareDocumentPosition(agenda) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy()
  })

  // Criterio 275/310: sin noche, ni una franja y nada se mueve.
  it('sin noche no pinta ninguna franja y la ventana es la de siempre', () => {
    renderWithProviders(<VidaHoyPage />)

    expect(bands()).toHaveLength(0)
    expect(screen.getByText(/Tu día ·/).textContent).toContain('6:30 → 23:00')
    expect(screen.getByText(/Tu día ·/).textContent).not.toContain('duermes')
  })

  // Criterio 277: la línea dice la ventana **y** cuánto duermes, que es lo que
  // hace explicable el número del presupuesto (D9).
  it('la línea del horario dice «Tu día · 5:00 → 23:00 · duermes 6 h» (criterio 277)', () => {
    conNoche()
    renderWithProviders(<VidaHoyPage />)

    const linea = screen.getByText(/Tu día ·/).textContent ?? ''
    expect(linea).toContain('5:00 → 23:00')
    expect(linea).toContain('duermes 6 h')
  })

  // Criterio 281: ningún hueco ofrece un rato en el que estabas durmiendo.
  it('el primer hueco empieza a las 5:00 y ninguno es de madrugada (criterio 281)', () => {
    conNoche()
    planQuery = ready([block('b1', 'Leer un rato', '09:00', '10:00')])
    renderWithProviders(<VidaHoyPage />)

    const filas = within(agendaList())
      .getAllByRole('listitem')
      .map((row) => row.textContent ?? '')
    // El primer tramo del día es un hueco y **empieza cuando te levantas**:
    // con la ventana vieja habría empezado a las 6:30, en pleno sueño.
    expect(filas.length).toBeGreaterThan(0)
    expect(filas[0]).toContain('5:00')
    expect(filas[0]).not.toContain('6:30')
    expect(filas.join(' | ')).not.toContain('6:30')
  })

  // Criterio 282: el presupuesto cuenta hasta la hora de acostarse, y lo dice
  // con esa hora. No es un número nuevo: es el de FEAT-003, ahora cierto.
  it('«te quedan … hasta las 23:00» es la hora de acostarse, no vidaDayEndTime (criterio 282)', () => {
    conNoche({ vidaDayStartTime: '06:30', vidaDayEndTime: '22:00' })
    renderWithProviders(<VidaHoyPage />)

    expect(budgetText()).toContain('hasta las 23:00')
    expect(budgetText()).not.toContain('hasta las 22:00')
  })

  // Criterio 283: una noche que no cruza no cierra la tarde.
  it('con 1:00 → 6:40 el día empieza a las 6:40 y acaba en «Tu día» (criterio 283)', () => {
    conNoche({
      vidaNightBedTime: '01:00',
      vidaNightWakeTime: '06:40',
      vidaNightDays: ['friday'],
      vidaDayEndTime: '22:00',
      vidaDayStartTime: '06:30',
    })
    nocheConfirmada('01:00', '06:40')
    renderWithProviders(<VidaHoyPage />)

    const linea = screen.getByText(/Tu día ·/).textContent ?? ''
    expect(linea).toContain('6:40 → 22:00')
    // Una sola franja, y arriba.
    const pintadas = bands()
    expect(pintadas).toHaveLength(1)
    expect(pintadas[0]!.dataset.variant).toBe('dawn')
  })

  // Criterio 284: dormir no es tiempo del día. No aparece en ningún tramo ni
  // en la leyenda, ni como planeado, ni como libre, ni como sin dato.
  it('los minutos de sueño no entran en la leyenda del presupuesto (criterio 284)', () => {
    conNoche()
    planQuery = ready([block('b1', 'Leer un rato', '09:00', '10:00')])
    renderWithProviders(<VidaHoyPage />)

    // 18 h de ventana menos 1 h puesta = 17 h libres. Si el sueño contara como
    // algo, este número sería otro.
    // 18 h de ventana menos 1 h puesta = 17 h libres. Si el sueño contara como
    // algo —planeado, libre o sin dato— este número sería otro.
    expect(budgetText()).toContain('libre 17h')
    expect(budgetText()).toContain('planeado 1h')
    // Y las 6 h de sueño no aparecen en ninguna parte de la barra.
    expect(budgetText()).not.toContain('6h')
  })
})

/**
 * **Lo real encima de lo planeado** (FEAT-012, tajada 3). Criterios 288, 289,
 * 290, 294, 295, 296, 298 y 299.
 *
 * El día es **viernes 18/9/2026 a las 9:24**, o sea por la mañana: la noche del
 * jueves al viernes ya pasó y nadie ha dicho todavía cómo fue.
 */
describe('VidaHoyPage — la noche que ya pasó (FEAT-012, tajada 3)', () => {
  function conNoche(overrides: Partial<UserSettings> = {}) {
    settingsQuery = ready({
      ...SETTINGS,
      vidaNightBedTime: '23:00',
      vidaNightWakeTime: '05:00',
      vidaNightDays: ['thursday', 'friday'],
      ...overrides,
    } as UserSettings)
  }

  function pregunta() {
    return screen.queryByText('¿Dormiste 23:00 → 5:00?')
  }

  function franjaDeArriba(): HTMLElement | null {
    return document.querySelector<HTMLElement>('[data-variant="dawn"]')
  }

  // Criterio 288: la pregunta, **una** y con sus dos salidas.
  it('con la noche sin registrar, Hoy pregunta cómo fue (criterio 288)', () => {
    conNoche()
    renderWithProviders(<VidaHoyPage />)

    expect(pregunta()).toBeInTheDocument()
    expect(
      screen.getByText('Es tu noche de siempre. Si fue así, un toque y listo.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sí, así fue' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Fue distinto' })).toBeInTheDocument()
    // Ocupa el sitio de la franja de arriba: no hay dos cosas diciendo lo mismo.
    expect(franjaDeArriba()).toBeNull()
    expect(screen.getAllByText('¿Dormiste 23:00 → 5:00?')).toHaveLength(1)
  })

  it('sin noche marcada ese día no se pregunta nada (criterio 275)', () => {
    conNoche({ vidaNightDays: ['monday'] })
    renderWithProviders(<VidaHoyPage />)

    expect(pregunta()).toBeNull()
  })

  // Criterio 289: nunca en un día futuro. De mañana no hay nada que confirmar,
  // y la franja de ese día sigue contando lo planeado, sin «sin confirmar».
  it('en un día futuro no pregunta y la franja no habla de confirmar (289)', () => {
    conNoche()
    viewedDate = '2026-09-19'
    plansByDate['2026-09-19'] = []
    planQuery = ready([])
    renderWithProviders(<VidaHoyPage />, {
      routerProps: { initialEntries: ['/app/vida/hoy?d=2026-09-19'] },
    })

    expect(pregunta()).toBeNull()
    expect(franjaDeArriba()!.textContent).toContain('Duermes hasta las 5:00')
    expect(franjaDeArriba()!.textContent).not.toContain('confirm')
  })

  // Criterio 289: y nunca **por su cuenta** en un día pasado. Ahí la franja
  // dice lo que hay —«sin confirmar»— y se puede tocar, pero no interrumpe.
  it('en un día pasado no pregunta: la franja dice «sin confirmar» (289 y 295)', () => {
    conNoche({ vidaNightDays: ['wednesday', 'thursday', 'friday'] })
    viewedDate = '2026-09-17'
    plansByDate['2026-09-17'] = []
    planQuery = ready([])
    renderWithProviders(<VidaHoyPage />, {
      routerProps: { initialEntries: ['/app/vida/hoy?d=2026-09-17'] },
    })

    expect(pregunta()).toBeNull()
    expect(franjaDeArriba()!.textContent).toContain('sin confirmar')
  })

  // Criterio 290: **un toque**. Y 294 y 299: lo guardado es del día en que te
  // levantas y cabe en la clave que ya existía.
  it('«Sí, así fue» guarda lo planeado como real y la pregunta se va (290)', () => {
    conNoche()
    renderWithProviders(<VidaHoyPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Sí, así fue' }))

    expect(pregunta()).toBeNull()
    expect(franjaDeArriba()!.textContent).toContain('Dormiste 23:00 → 5:00')
    expect(franjaDeArriba()!.textContent).toContain('confirmado')

    // El dato: la clave es **el viernes**, el día en que te levantas (294).
    const guardado = useVidaDeviceNotesStore.getState().nightLogs
    expect(Object.keys(guardado)).toEqual(['2026-09-18'])
    expect(guardado['2026-09-18']).toMatchObject({ bedTime: '23:00', wakeTime: '05:00' })
    expect(guardado['2026-09-18']!.confirmedAt).toBeTruthy()
  })

  // Criterio 290: «no vuelve ese día, tampoco tras recargar». Lo que sostiene
  // el «tampoco tras recargar» es que está **persistido**, no un estado de
  // React: un montaje nuevo con el mismo aparato ya no pregunta.
  it('una vez contestada no vuelve a preguntar al volver a montar la pantalla', () => {
    conNoche()
    const primera = renderWithProviders(<VidaHoyPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Sí, así fue' }))
    primera.unmount()

    renderWithProviders(<VidaHoyPage />)

    expect(pregunta()).toBeNull()
    expect(franjaDeArriba()!.textContent).toContain('confirmado')
  })

  // Criterio 295: ignorarla es válido y **no escribe nada**. Al acabar el día
  // —pasada la hora de acostarse— la pregunta se calla y la franja lo dice.
  it('ignorarla no guarda nada, y al acabar el día queda «sin confirmar» (295)', () => {
    conNoche()
    vi.setSystemTime(new Date(2026, 8, 18, 23, 10, 0))
    renderWithProviders(<VidaHoyPage />)

    expect(pregunta()).toBeNull()
    // **Adaptada en la tajada 4** (criterio 302): lo que sostiene el criterio
    // 295 —que ignorar no escribe nada y la franja lo dice con esa palabra—
    // se afirma igual; lo que cambia es que la franja ya no habla en presente
    // de una noche que nadie ha contado, dice lo que **dice tu noche**.
    expect(franjaDeArriba()!.textContent).toContain('Tu noche dice 23:00 → 5:00')
    expect(franjaDeArriba()!.textContent).toContain('sin confirmar')
    expect(franjaDeArriba()!.textContent).not.toContain('Dormiste')
    expect(useVidaDeviceNotesStore.getState().nightLogs).toEqual({})
  })

  // **El suelo de la pregunta** (hallazgo 1 del revisor). A las 3:00 la noche
  // de 23:00 → 5:00 todavía está pasando: preguntar ahí y guardar de un toque
  // dejaría escrita una hora de levantarse **que no ha ocurrido**.
  it('de madrugada no pregunta: esa noche aún no ha terminado', () => {
    conNoche()
    vi.setSystemTime(new Date(2026, 8, 18, 3, 0, 0))
    renderWithProviders(<VidaHoyPage />)

    expect(pregunta()).toBeNull()
    // Y no deja un hueco: la franja sigue ahí y dice lo que pasa, sin reproche.
    const franja = franjaDeArriba()!
    expect(franja.textContent).toContain('Duermes hasta las 5:00')
    expect(franja.textContent).toContain('aún no ha terminado')
    expect(franja.textContent).not.toContain('sin confirmar')
    // Tampoco se puede abrir la hoja: no hay nada que corregir todavía.
    expect(franja.tagName).toBe('DIV')
    expect(useVidaDeviceNotesStore.getState().nightLogs).toEqual({})
  })

  it('en cuanto llega tu hora de levantarte, pregunta', () => {
    conNoche()
    vi.setSystemTime(new Date(2026, 8, 18, 5, 0, 0))
    renderWithProviders(<VidaHoyPage />)

    expect(pregunta()).toBeInTheDocument()
  })

  // El mismo suelo con una noche que **no cruza** la medianoche: la regla no
  // tiene ningún caso aparte, porque mira el final y no el comienzo.
  it('con 1:00 → 6:40, a las 2:00 tampoco pregunta y a las 7:00 sí', () => {
    conNoche({ vidaNightBedTime: '01:00', vidaNightWakeTime: '06:40', vidaNightDays: ['friday'] })
    vi.setSystemTime(new Date(2026, 8, 18, 2, 0, 0))
    const primera = renderWithProviders(<VidaHoyPage />)
    expect(pregunta()).toBeNull()
    expect(franjaDeArriba()!.textContent).toContain('aún no ha terminado')
    primera.unmount()

    vi.setSystemTime(new Date(2026, 8, 18, 7, 0, 0))
    renderWithProviders(<VidaHoyPage />)
    expect(screen.getByText('¿Dormiste 1:00 → 6:40?')).toBeInTheDocument()
  })

  // Criterio 291: «Fue distinto» abre la hoja, con lo planeado dentro.
  it('«Fue distinto» abre «¿Cómo dormiste?» con las dos horas puestas (291)', () => {
    conNoche()
    renderWithProviders(<VidaHoyPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Fue distinto' }))

    expect(screen.getByText('¿Cómo dormiste?')).toBeInTheDocument()
    expect(
      screen.getByText('Noche del jueves al viernes · tu noche dice 23:00 → 5:00'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Te acostaste')).toHaveValue('23:00')
    // Abrir la hoja no guarda nada: hasta que no se toca «Guardar» no hay dato.
    expect(useVidaDeviceNotesStore.getState().nightLogs).toEqual({})
  })

  // Criterio 298: lo ya confirmado se corrige tocando la franja, sin límite.
  it('tocar la franja confirmada abre la misma hoja con lo guardado (298)', () => {
    conNoche()
    useVidaDeviceNotesStore.getState().setNightLog('2026-09-18', {
      bedTime: '01:00',
      wakeTime: '06:40',
      confirmedAt: '2026-09-18T07:00:00.000Z',
    })
    renderWithProviders(<VidaHoyPage />)

    const franja = franjaDeArriba()!
    expect(franja.tagName).toBe('BUTTON')
    fireEvent.click(franja)

    expect(screen.getByText('¿Cómo dormiste?')).toBeInTheDocument()
    expect(screen.getByLabelText('Te acostaste')).toHaveValue('01:00')
    expect(screen.getByLabelText('Te levantaste')).toHaveValue('06:40')
  })

  // Criterio 299: **ninguna clave nueva** de `localStorage`.
  it('lo real se guarda en el aparato y no estrena ninguna clave (299)', () => {
    window.localStorage.clear()
    conNoche()
    renderWithProviders(<VidaHoyPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Sí, así fue' }))

    // La pantalla de Hoy guarda alguna cosa más suya (la caché persistida de
    // React Query), así que lo que se afirma es lo del criterio: **la noche no
    // estrena ninguna clave**, va en la que ya existía.
    const claves = Object.keys(window.localStorage)
    expect(claves).toContain('xavi.vida.deviceNotes')
    expect(claves.filter((clave) => clave.toLowerCase().includes('night'))).toEqual([])
    const guardado = JSON.parse(window.localStorage.getItem('xavi.vida.deviceNotes')!)
    expect(guardado.state.nightLogs['2026-09-18'].wakeTime).toBe('05:00')
  })

  // Criterio 296: los tres estados se distinguen **en pantalla**, y ninguna
  // pantalla los mezcla.
  it('«sin confirmar», «confirmado» y «sin dato» no se mezclan (296)', () => {
    conNoche()
    useVidaDeviceNotesStore.getState().setNightLog('2026-09-18', {
      bedTime: null,
      wakeTime: '06:40',
      confirmedAt: '2026-09-18T07:00:00.000Z',
    })
    renderWithProviders(<VidaHoyPage />)

    const franja = franjaDeArriba()!
    expect(franja.dataset.state).toBe('no-data')
    expect(franja.textContent).toContain('Te levantaste a las 6:40')
    expect(franja.textContent).toContain('sin dato')
    expect(franja.textContent).not.toContain('confirmado')
    expect(franja.textContent).not.toContain('sin confirmar')
  })

  // Criterio 316, sobre lo que esta tajada estrena en la pantalla que más se
  // mira: ni una palabra de reproche por haber dormido mal o no haber dicho
  // nada.
  it('ni una palabra de reproche en la pregunta ni en la franja', () => {
    conNoche()
    renderWithProviders(<VidaHoyPage />)
    const texto = (document.body.textContent ?? '').toLowerCase()

    for (const palabra of ['deberías', 'desperdicio', 'apenas', 'dormiste poco']) {
      expect(texto).not.toContain(palabra)
    }
  })
})

/**
 * **Lo real manda, y lo que no se sabe se dice** (FEAT-012, tajada 4).
 * Criterios 300, 301, 304, 305, 306, 307, 308 y 309.
 *
 * Sigue siendo **viernes 18/9/2026 a las 9:24**. La noche del jueves al viernes
 * ya pasó; lo que cambia en esta tajada es qué hace la ventana del día con lo
 * que se conteste.
 */
describe('VidaHoyPage — la ventana con lo que dormiste de verdad (tajada 4)', () => {
  function conNoche(overrides: Partial<UserSettings> = {}) {
    settingsQuery = ready({
      ...SETTINGS,
      vidaNightBedTime: '23:00',
      vidaNightWakeTime: '05:00',
      vidaNightDays: ['wednesday', 'thursday', 'friday'],
      ...overrides,
    } as UserSettings)
  }

  function franjaDeArriba(): HTMLElement | null {
    return document.querySelector<HTMLElement>('[data-variant="dawn"]')
  }

  /** La línea «Tu día · 5:00 → 23:00 · duermes 6 h». */
  function lineaDelDia(): string {
    return screen.getByText(/Tu día ·/).textContent ?? ''
  }

  /** El texto de las filas de la agenda: la primera es el primer tramo del día. */
  function filasDeLaAgenda(): string[] {
    const lista = document.querySelector<HTMLElement>('ol[class*="agenda"]')!
    return within(lista)
      .getAllByRole('listitem')
      .map((row) => row.textContent ?? '')
  }

  // Criterios 300 y 301: **sin recargar**. Se contesta la pregunta de la
  // mañana con una hora distinta y la ventana se mueve en el mismo montaje.
  it('corregir la noche mueve la ventana y los huecos en el acto (300 y 301)', async () => {
    conNoche()
    planQuery = ready([block('b1', 'Leer un rato', '09:00', '10:00')])
    renderWithProviders(<VidaHoyPage />)

    // Antes: el día empieza a las 5:00, que es lo que dice tu noche.
    expect(lineaDelDia()).toContain('5:00 → 23:00')

    fireEvent.click(screen.getByRole('button', { name: 'Fue distinto' }))
    fireEvent.change(screen.getByLabelText('Te acostaste'), { target: { value: '01:00' } })
    fireEvent.change(screen.getByLabelText('Te levantaste'), { target: { value: '06:40' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    // Después, en el mismo montaje: la ventana empieza a la hora **real**.
    expect(lineaDelDia()).toContain('6:40 → 23:00')
    expect(lineaDelDia()).toContain('dormiste 5 h 40')
    expect(lineaDelDia()).not.toContain('5:00 →')
    // Y ningún hueco ofrece un rato en el que estabas durmiendo (301): el
    // primer tramo del día empieza a las 6:40, no a las 5:00.
    const filas = filasDeLaAgenda()
    expect(filas.length).toBeGreaterThan(0)
    expect(filas[0]).toContain('6:40')
    expect(filas.join(' | ')).not.toContain('5:00')
  })

  // Criterio 302: lo no confirmado no mueve nada y no se afirma en pasado.
  it('sin confirmar, la ventana sigue siendo la planeada (302)', () => {
    conNoche()
    renderWithProviders(<VidaHoyPage />)

    expect(lineaDelDia()).toContain('5:00 → 23:00')
    expect(lineaDelDia()).toContain('duermes 6 h')
    expect(lineaDelDia()).not.toContain('dormiste')
  })

  // Criterios 303, 304 y 305: «No sé a qué hora me levanté» deja la ventana en
  // lo planeado **y la pantalla lo dice**, sin inventar ninguna cifra.
  it('sin la hora real de levantarse, la ventana es la planeada y se dice (304)', () => {
    conNoche()
    useVidaDeviceNotesStore.getState().setNightLog('2026-09-18', {
      bedTime: '23:20',
      wakeTime: null,
      confirmedAt: '2026-09-18T07:00:00.000Z',
    })
    renderWithProviders(<VidaHoyPage />)

    expect(lineaDelDia()).toContain('5:00 → 23:00')
    expect(lineaDelDia()).toContain('lo planeado: de tu hora de levantarte no quedó dato')
    // Ni una duración inventada de una noche a medias (305): la franja pone
    // «sin dato» y la línea del día sigue diciendo lo que dice tu noche.
    expect(lineaDelDia()).toContain('duermes 6 h')
    expect(franjaDeArriba()!.textContent).toContain('sin dato')
    expect(franjaDeArriba()!.textContent).not.toContain('0 h')
  })

  // Criterios 306 y 307: un día pasado no interrumpe, pero tiene salida.
  it('un día pasado sin confirmar se puede confirmar a posteriori (306 y 307)', () => {
    conNoche()
    viewedDate = '2026-09-17'
    plansByDate['2026-09-17'] = []
    planQuery = ready([])
    renderWithProviders(<VidaHoyPage />, {
      routerProps: { initialEntries: ['/app/vida/hoy?d=2026-09-17'] },
    })

    // No pregunta por su cuenta (307)…
    expect(screen.queryByText('¿Dormiste 23:00 → 5:00?')).toBeNull()
    // …pero la franja sigue ahí, lo dice y es la salida (306).
    const franja = franjaDeArriba()!
    expect(franja.textContent).toContain('sin confirmar')
    expect(franja.tagName).toBe('BUTTON')

    fireEvent.click(franja)
    expect(screen.getByText('¿Cómo dormiste?')).toBeInTheDocument()
  })

  // Criterio 308: confirmar un día pasado recalcula **su** ventana.
  it('confirmar un día pasado recalcula su ventana, no la de hoy (308)', () => {
    conNoche()
    viewedDate = '2026-09-17'
    plansByDate['2026-09-17'] = []
    planQuery = ready([])
    const pasado = renderWithProviders(<VidaHoyPage />, {
      routerProps: { initialEntries: ['/app/vida/hoy?d=2026-09-17'] },
    })

    fireEvent.click(franjaDeArriba()!)
    fireEvent.change(screen.getByLabelText('Te levantaste'), { target: { value: '07:15' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(lineaDelDia()).toContain('7:15 → 23:00')
    // Lo guardado es de **ese** día, no del de hoy (294 y 308).
    expect(Object.keys(useVidaDeviceNotesStore.getState().nightLogs)).toEqual(['2026-09-17'])
    pasado.unmount()

    // Y hoy sigue con su ventana planeada: confirmar el jueves no movió el
    // viernes.
    viewedDate = '2026-09-18'
    planQuery = ready([])
    renderWithProviders(<VidaHoyPage />)
    expect(lineaDelDia()).toContain('5:00 → 23:00')
  })

  // Criterio 309: del futuro no se guarda sueño ni se mueve ninguna ventana.
  it('un día futuro no ofrece confirmar ni corregir, y su ventana es la planeada (309)', () => {
    conNoche()
    viewedDate = '2026-09-19'
    plansByDate['2026-09-19'] = []
    planQuery = ready([])
    // Aunque el aparato tuviera una entrada con fecha de mañana, no cuenta.
    useVidaDeviceNotesStore.getState().setNightLog('2026-09-19', {
      bedTime: '22:00',
      wakeTime: '08:30',
      confirmedAt: '2026-09-18T07:00:00.000Z',
    })
    renderWithProviders(<VidaHoyPage />, {
      routerProps: { initialEntries: ['/app/vida/hoy?d=2026-09-19'] },
    })

    expect(screen.queryByText('¿Dormiste 23:00 → 5:00?')).toBeNull()
    const franja = franjaDeArriba()!
    expect(franja.tagName).toBe('DIV')
    expect(franja.textContent).toContain('Duermes hasta las 5:00')
    expect(franja.textContent).not.toContain('confirm')
    expect(lineaDelDia()).toContain('5:00 → 23:00')
    expect(lineaDelDia()).not.toContain('8:30')
  })
})
