import { act, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { UserSettings } from '@/features/settings/types/user-settings.types'
import { VidaHoyPage } from '@/features/vida/pages/VidaHoyPage'
import { useVidaDeviceNotesStore } from '@/features/vida/store/vida-device-notes.store'
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
  useActivityDayFollowUpsQuery: () => dayFollowUpsQuery,
  useCreateActivityFollowUpMutation: () => createFollowUpMutation,
  useUpdateActivityFollowUpMutation: () => updateFollowUpMutation,
  useDeleteActivityFollowUpMutation: () => deleteFollowUpMutation,
}))
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
let updateItemMutation: { mutate: ReturnType<typeof vi.fn>; isPending: boolean; isError: boolean }
vi.mock('@/features/vida/hooks/useVidaPatterns', () => ({
  useVidaPatterns: (input: { enabled: boolean }) => {
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
    expect(screen.getByText('Bañarme').closest('li')).toHaveTextContent('45 min')
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
    expect(screen.getByText('Bañarme')).toBeInTheDocument()
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
    expect(screen.getByText('Bañarme')).toBeInTheDocument()
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

    const banarme = screen.getByText('Bañarme').closest('li')!
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

    const banarme = screen.getByText('Bañarme').closest('li')!
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

    const banarme = screen.getByText('Bañarme').closest('li')!
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

    const fila = screen.getByText('Estirar').closest('li')!
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

    const banarme = screen.getByText('Bañarme').closest('li')!
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

    const banarme = screen.getByText('Bañarme').closest('li')!
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

    const banarme = () => screen.getByText('Bañarme').closest('li')!
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
    expect(screen.getByText('Bañarme')).toBeInTheDocument()
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
