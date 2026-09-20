import { act, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { UserSettings } from '@/features/settings/types/user-settings.types'
import { VidaHoyPage } from '@/features/vida/pages/VidaHoyPage'
import type { ActivityDayPlanItem } from '@/features/vida/types/activity-day-plan.types'
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
let settingsQuery: Query<UserSettings>
let addMutation: { mutate: ReturnType<typeof vi.fn>; isPending: boolean; isError: boolean }
let editMutation: { mutate: ReturnType<typeof vi.fn>; isPending: boolean; isError: boolean }
let removeMutation: { mutate: ReturnType<typeof vi.fn>; isPending: boolean; isError: boolean }

// Las tres mutaciones del plan del día entran en el mock desde la tajada 3: la
// página coloca desde una ficha, la hoja pone y edita, y el «···» del bloque
// quita. Sin ellas, montar la página revienta en el primer hook.
vi.mock('@/features/vida/hooks/useActivityDayPlan', () => ({
  useActivityDayPlanQuery: () => planQuery,
  useAddDayPlanItemMutation: () => addMutation,
  useEditDayPlanItemMutation: () => editMutation,
  useRemoveDayPlanItemMutation: () => removeMutation,
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
}))
vi.mock('@/features/settings/hooks/useUserSettings', () => ({
  useUserSettingsQuery: () => settingsQuery,
  useUpdateUserSettingsMutation: () => ({ mutate: vi.fn(), isPending: false, isError: false }),
}))

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
  editMutation = { mutate: vi.fn(), isPending: false, isError: false }
  removeMutation = { mutate: vi.fn(), isPending: false, isError: false }
  planQuery = ready(PLAN)
  suggestionsQuery = ready([
    suggestion('s1', 'Poner lavadora', 20),
    suggestion('s2', 'Compra de la semana', 240),
  ])
  settingsQuery = ready(SETTINGS)
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

  it('no hay nada de vivir el día (criterio 22)', () => {
    renderWithProviders(<VidaHoyPage />)

    for (const palabra of [/empezar/i, /terminar/i, /en marcha/i, /fuera del plan/i, /hecho/i]) {
      expect(screen.queryByText(palabra)).not.toBeInTheDocument()
    }
    expect(screen.queryByRole('button', { name: /empezar/i })).not.toBeInTheDocument()
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

  it('«Armar desde la plantilla» NO se pinta todavía: llegaría muerto (tajada 5)', () => {
    planQuery = ready([])
    renderWithProviders(<VidaHoyPage />)

    expect(screen.queryByRole('button', { name: /armar/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /armar/i })).not.toBeInTheDocument()
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
