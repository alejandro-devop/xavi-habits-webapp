import { act, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Route, Routes } from 'react-router'
import { useVidaSessionUi } from '@/features/vida/hooks/useVidaSessionUi'
import { VidaModuleLayout } from '@/features/vida/routes/VidaModuleLayout'
import type { ActivityFollowUp } from '@/features/vida/types/activity-followup.types'
import { renderWithProviders } from '@/test/render'

/**
 * El elemento de ruta del módulo: criterios 7 (la barra se ve en todas las
 * pantallas de Vida), 8 (una sola consulta), 16 y 54 (la sesión de otro día se
 * pregunta y **no** se pinta un cronómetro de catorce horas) y 64 (sin sesión de
 * usuario no hay spinner eterno).
 *
 * Se mockean los hooks de sesión, no la consulta: lo que este componente decide
 * es **qué se pinta** con cada estado.
 */

let openSession: {
  session: ActivityFollowUp | null
  startInstant: Date | null
  isFromAnotherDay: boolean
  isDisabled: boolean
  isPending: boolean
  isError: boolean
  refetch: () => void
}

vi.mock('@/features/vida/hooks/useVidaOpenSession', () => ({
  useVidaOpenSession: () => openSession,
  useVidaSessionPlannedMinutes: () => 45,
}))
/**
 * **Los espías de la sesión viven fuera de la fábrica** (FEAT-018): antes se
 * creaban con `vi.fn()` dentro, así que cada render devolvía espías nuevos y
 * no se podía afirmar «esto **no** se llamó». El criterio 543 necesita
 * exactamente eso.
 */
let sessionActions: {
  session: ActivityFollowUp | null
  isFromAnotherDay: boolean
  isBusy: boolean
  start: ReturnType<typeof vi.fn>
  finishNow: ReturnType<typeof vi.fn>
  finishWith: ReturnType<typeof vi.fn>
  discard: ReturnType<typeof vi.fn>
  resolveStale: ReturnType<typeof vi.fn>
}

vi.mock('@/features/vida/hooks/useVidaSessionActions', () => ({
  useVidaSessionActions: () => ({
    ...sessionActions,
    session: openSession.session,
    isFromAnotherDay: openSession.isFromAnotherDay,
  }),
}))

/**
 * **La escritura de la nota** (FEAT-018). Se mockea el hook, no la mutación:
 * lo que este componente decide es **a quién** se la manda y qué hace la hoja
 * con el resultado. La ida y vuelta al API la cubre `useActivityFollowUps.test`.
 */
let saveNote: ReturnType<typeof vi.fn>
vi.mock('@/features/vida/hooks/useVidaSessionNote', () => ({
  useVidaSessionNote: () => ({ saveNote, isSaving: false }),
}))

/**
 * **«Lo de otras veces»** (criterios 546 y 547). Se mockea el hook —tiene su
 * propia consulta y su propio test— y se **guarda lo que recibe**: lo que aquí
 * hay que comprobar es que solo se pide **con el editor abierto** y sobre la
 * actividad de esa sesión.
 */
let noteHistory: { suggestions: string[]; isPending: boolean }
let noteHistoryCalls: { activityId: string | null; enabled: boolean; excludeId?: string | null }[]
vi.mock('@/features/vida/hooks/useVidaActivityNoteHistory', () => ({
  useVidaActivityNoteHistory: (input: {
    activityId: string | null
    enabled: boolean
    excludeId?: string | null
  }) => {
    noteHistoryCalls.push(input)
    return noteHistory
  },
}))
vi.mock('@/features/vida/hooks/useVidaDayHours', () => ({
  useVidaDayHours: () => ({
    startTime: '06:30',
    endTime: '23:00',
    isDefault: true,
    saved: { startTime: null, endTime: null },
    isPending: false,
    isError: false,
    isDisabled: false,
    refetch: vi.fn(),
  }),
}))
/**
 * **La noche** (FEAT-012, tajada 2). Desde que el aviso de sesión vieja usa la
 * ventana de hoy —y no `vidaDayEndTime` a pelo—, este componente lee también la
 * noche. Sale de `useUserSettingsQuery`, que exige `AuthBootstrapProvider`, y
 * esta suite monta el layout suelto: se mockea igual que su hermana de arriba.
 * Sin noche, la ventana es exactamente la de antes y estas 22 pruebas no
 * cambian de resultado.
 */
vi.mock('@/features/vida/hooks/useVidaNight', () => ({
  useVidaNight: () => ({
    night: null,
    saved: { bedTime: null, wakeTime: null, days: null },
    isPending: false,
    isError: false,
    isDisabled: false,
    refetch: vi.fn(),
  }),
}))

function followUp(overrides: Partial<ActivityFollowUp> = {}): ActivityFollowUp {
  return {
    id: 'f1',
    activityId: 'a-casa',
    date: '2026-09-18',
    startTime: '09:00',
    durationMinutes: null,
    isOpen: true,
    endTime: null,
    endDate: null,
    endDateTime: null,
    notes: null,
    activity: {
      id: 'a-casa',
      title: 'Organizar la casa',
      category: { id: 'c1', name: 'Casa', color: '#7C3AED', icon: 'broom' },
    },
    ...overrides,
  }
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 8, 18, 9, 24, 0))
  sessionActions = {
    session: null,
    isFromAnotherDay: false,
    isBusy: false,
    start: vi.fn(),
    finishNow: vi.fn(),
    finishWith: vi.fn(),
    discard: vi.fn(),
    resolveStale: vi.fn(),
  }
  saveNote = vi.fn().mockResolvedValue({ ok: true })
  noteHistory = { suggestions: [], isPending: false }
  noteHistoryCalls = []
  openSession = {
    session: null,
    startInstant: null,
    isFromAnotherDay: false,
    isDisabled: false,
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  }
})

afterEach(() => {
  vi.useRealTimers()
})

describe('VidaModuleLayout — la sesión visible en todo el módulo (criterio 7)', () => {
  it('sin nada en marcha no pinta barra ni reserva hueco', () => {
    const { container } = renderWithProviders(<VidaModuleLayout />)

    expect(screen.queryByRole('button', { name: 'Terminar' })).not.toBeInTheDocument()
    expect(container.querySelector('[data-session-bar="on"]')).toBeNull()
  })

  it('con una sesión abierta pinta la barra con nombre, cronómetro y «Terminar»', () => {
    openSession = {
      session: followUp(),
      startInstant: new Date(2026, 8, 18, 9, 0, 0),
      isFromAnotherDay: false,
      isDisabled: false,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    }
    const { container } = renderWithProviders(<VidaModuleLayout />)

    expect(screen.getByText('Organizar la casa')).toBeInTheDocument()
    expect(screen.getByText('00:24:00')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Terminar' })).toBeInTheDocument()
    // El hueco reservado abajo: la barra es fija y si no, taparía el último
    // bloque de la agenda (criterio 60).
    expect(container.querySelector('[data-session-bar="on"]')).not.toBeNull()
  })

  it('un toque en el nombre lleva a Hoy, al día de la sesión', () => {
    openSession = {
      session: followUp(),
      startInstant: new Date(2026, 8, 18, 9, 0, 0),
      isFromAnotherDay: false,
      isDisabled: false,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    }
    renderWithProviders(<VidaModuleLayout />)

    expect(screen.getByRole('link', { name: /Organizar la casa/ })).toHaveAttribute(
      'href',
      '/app/vida/hoy?d=2026-09-18',
    )
  })

  it('criterio 9 — pasarse del plan se lee en la barra, sin interrumpir', () => {
    openSession = {
      session: followUp({ startTime: '08:00' }),
      startInstant: new Date(2026, 8, 18, 8, 0, 0),
      isFromAnotherDay: false,
      isDisabled: false,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    }
    renderWithProviders(<VidaModuleLayout />)

    // 84 minutos sobre 45 planeados.
    expect(screen.getByText('llevas 84 min · planeado 45')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('en la barra **no** hay «Cancelar» (criterios 14 y 59)', () => {
    openSession = {
      session: followUp(),
      startInstant: new Date(2026, 8, 18, 9, 0, 0),
      isFromAnotherDay: false,
      isDisabled: false,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    }
    renderWithProviders(<VidaModuleLayout />)

    expect(screen.queryByRole('button', { name: /cancelar/i })).not.toBeInTheDocument()
  })

  it('criterio 64 — sin sesión de usuario no se pinta nada ni se queda cargando', () => {
    openSession = {
      session: null,
      startInstant: null,
      isFromAnotherDay: false,
      isDisabled: true,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    }
    const { container } = renderWithProviders(<VidaModuleLayout />)

    expect(container.querySelector('[aria-busy="true"]')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Terminar' })).not.toBeInTheDocument()
  })
})

describe('VidaModuleLayout — la que quedó abierta de otro día (criterios 16 y 54)', () => {
  beforeEach(() => {
    openSession = {
      session: followUp({ date: '2026-09-17', startTime: '21:00' }),
      startInstant: new Date(2026, 8, 17, 21, 0, 0),
      isFromAnotherDay: true,
      isDisabled: false,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    }
  })

  it('pregunta hasta qué hora, y **no** pinta un cronómetro corriendo desde ayer', () => {
    renderWithProviders(<VidaModuleLayout />)

    expect(
      screen.getByText(/Dejaste «Organizar la casa» en marcha ayer a las 21:00/),
    ).toBeInTheDocument()
    expect(screen.getByText('¿Hasta qué hora la hiciste?')).toBeInTheDocument()
    // 12 horas y pico en marcha no se enseñan como si fueran normales.
    expect(screen.queryByText(/^\d\d:\d\d:\d\d$/)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Terminar' })).not.toBeInTheDocument()
  })

  it('el «No sé» dice **antes** lo que va a anotar, y no es hasta el fin del día', () => {
    renderWithProviders(<VidaModuleLayout />)

    expect(screen.getByRole('button', { name: 'No sé' })).toBeInTheDocument()
    // 45 min es lo planeado de ese bloque; hasta las 23:00 habrían sido 120.
    expect(screen.getByText(/anotamos 45 min/)).toBeInTheDocument()
    expect(screen.getByText(/lo que tenías planeado/)).toBeInTheDocument()
  })

  it('explica que solo bloquea empezar otra cosa, y nunca dice «cancelar»', () => {
    const { container } = renderWithProviders(<VidaModuleLayout />)

    expect(screen.getByText(/no se puede empezar otra cosa/)).toBeInTheDocument()
    expect(container.textContent ?? '').not.toMatch(/cancelar/i)
    // No es un modal: no atrapa el foco ni tapa la pantalla (criterio 54).
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

/* ── El error de la consulta de la sesión (hallazgo 1 de la tajada 1) ────── */

describe('VidaModuleLayout — si no se pudo saber qué hay en marcha', () => {
  it('lo dice y ofrece reintentar, en vez de callar y parecer que no hay nada', () => {
    const refetch = vi.fn()
    openSession = {
      session: null,
      startInstant: null,
      isFromAnotherDay: false,
      isDisabled: false,
      isPending: false,
      isError: true,
      refetch,
    }
    renderWithProviders(<VidaModuleLayout />)

    expect(screen.getByText('No pudimos saber si tienes algo en marcha')).toBeInTheDocument()
    screen.getByRole('button', { name: 'Reintentar' }).click()
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('sin sesión de usuario no se pinta ese aviso (criterio 64)', () => {
    openSession = {
      session: null,
      startInstant: null,
      isFromAnotherDay: false,
      isDisabled: true,
      isPending: false,
      isError: true,
      refetch: vi.fn(),
    }
    renderWithProviders(<VidaModuleLayout />)

    expect(
      screen.queryByText('No pudimos saber si tienes algo en marcha'),
    ).not.toBeInTheDocument()
  })
})


/* ── «Qué estás haciendo»: la nota de la sesión en marcha (FEAT-018, tajada 2) ─
 *
 * Criterios 542 a 547. Lo que este componente tiene que hacer bien es que
 * **abrir el editor no sea empezar a terminar**: la hoja se monta una vez, se
 * abre desde la barra y no toca ni el cronómetro ni la sesión.
 */

describe('VidaModuleLayout — la nota de la sesión en marcha (FEAT-018)', () => {
  /**
   * Guardar resuelve una promesa y la hoja se va con una animación de salida:
   * con el reloj congelado hay que soltar los microtasks **y** correr los
   * fotogramas, o el diálogo se queda puesto para siempre.
   */
  /**
   * Guardar resuelve una promesa: hay que soltar los microtasks a mano.
   *
   * **Lo que aquí no se puede medir**, y se dice en voz alta: que el diálogo
   * *desaparezca* del DOM. `SteppedModal` lo saca con una animación de salida
   * de `AnimatePresence` que en jsdom llega a `opacity: 0` y ahí se queda —con
   * reloj congelado y con reloj de verdad—. Que «Guardar» **cierra** la hoja
   * se mide donde sí se puede, en `VidaNoteSheet.test.tsx` (`onClose`
   * llamado); aquí se mide lo otro: qué se guardó y que la sesión sigue en
   * marcha.
   */
  async function flushSave() {
    await act(async () => {})
  }

  function running(notes: string | null = null) {
    openSession = {
      session: followUp({ notes }),
      startInstant: new Date(2026, 8, 18, 9, 0, 0),
      isFromAnotherDay: false,
      isDisabled: false,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    }
  }

  it('criterio 542 — sin nota, la barra pregunta «¿Qué estás haciendo?»', () => {
    running(null)
    renderWithProviders(<VidaModuleLayout />)

    expect(screen.getByRole('button', { name: '¿Qué estás haciendo?' })).toBeInTheDocument()
    // La pregunta no es un reproche ni un campo: no se lee «nota» en la barra.
    expect(screen.queryByText(/añadir qué hiciste/)).not.toBeInTheDocument()
  })

  it('criterio 542 — con nota, la barra enseña lo que se escribió', () => {
    running('Bug del carrito — reproduciendo')
    renderWithProviders(<VidaModuleLayout />)

    expect(screen.getByText('Bug del carrito — reproduciendo')).toBeInTheDocument()
    expect(screen.queryByText('¿Qué estás haciendo?')).not.toBeInTheDocument()
  })

  /**
   * **El criterio 543, que es el delicado.** No se declara: se afirma con lo
   * que **no** pasó —ninguna acción de sesión llamada— y con lo que **sigue
   * pasando**: el cronómetro avanza con la hoja abierta y la barra sigue ahí.
   */
  it('criterio 543 — abrir el editor no pausa, no termina y no cierra la barra', () => {
    running('Bug del carrito')
    renderWithProviders(<VidaModuleLayout />)
    expect(screen.getByText('00:24:00')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Bug del carrito/ }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(
      within(screen.getByRole('dialog')).getByRole('heading', { name: '¿Qué estás haciendo?' }),
    ).toBeInTheDocument()

    // Nada de la sesión se ha tocado.
    expect(sessionActions.finishNow).not.toHaveBeenCalled()
    expect(sessionActions.finishWith).not.toHaveBeenCalled()
    expect(sessionActions.discard).not.toHaveBeenCalled()
    expect(sessionActions.start).not.toHaveBeenCalled()
    expect(saveNote).not.toHaveBeenCalled()

    // La barra sigue entera **y el cronómetro sigue contando** con la hoja
    // abierta: cinco segundos después marca cinco segundos más.
    expect(screen.getByRole('button', { name: 'Terminar' })).toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(screen.getByText('00:24:05')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('criterio 544 — guardar escribe **solo** la nota de esa sesión, y la sesión sigue', async () => {
    running(null)
    renderWithProviders(<VidaModuleLayout />)

    fireEvent.click(screen.getByRole('button', { name: '¿Qué estás haciendo?' }))
    fireEvent.change(screen.getByLabelText('¿Qué estás haciendo?'), {
      target: { value: 'Bug del carrito' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    await flushSave()
    expect(saveNote).toHaveBeenCalledTimes(1)
    // **La sesión entera, no un id suelto**: lo que se manda es la que está
    // abierta, y se manda solo la nota.
    expect(saveNote.mock.calls[0]![0]).toMatchObject({ id: 'f1', isOpen: true })
    expect(saveNote.mock.calls[0]![1]).toBe('Bug del carrito')
    // Guardar la nota **no termina nada**: la barra sigue con su «Terminar».
    expect(sessionActions.finishNow).not.toHaveBeenCalled()
    expect(sessionActions.finishWith).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Terminar' })).toBeInTheDocument()
  })

  it('criterio 545 — se reescribe las veces que haga falta, sin límite', async () => {
    running('Revisando MRs')
    renderWithProviders(<VidaModuleLayout />)

    for (const texto of ['Daily', 'Soporte']) {
      fireEvent.click(screen.getByRole('button', { name: /Revisando MRs/ }))
      // La hoja se remonta limpia en cada apertura (`key` por apertura): cada
      // vez arranca de lo que hay guardado, no de lo que se escribió la vez
      // anterior.
      expect(screen.getByLabelText('¿Qué estás haciendo?')).toHaveValue('Revisando MRs')
      fireEvent.change(screen.getByLabelText('¿Qué estás haciendo?'), {
        target: { value: texto },
      })
      fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
      await flushSave()
    }

    // Dos reescrituras, dos guardados, **ningún** tope ni bloqueo por el medio.
    expect(saveNote).toHaveBeenCalledTimes(2)
    expect(saveNote.mock.calls.map((call) => call[1])).toEqual(['Daily', 'Soporte'])
    expect(sessionActions.finishNow).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Terminar' })).toBeInTheDocument()
  })

  it('criterio 546 — el editor ofrece las últimas notas de **esa** actividad', () => {
    running(null)
    noteHistory = { suggestions: ['Revisando MRs', 'Daily + planning'], isPending: false }
    renderWithProviders(<VidaModuleLayout />)

    // Cerrado: la consulta ni se enciende (cero consultas nuevas al entrar).
    expect(noteHistoryCalls.every((call) => call.enabled === false)).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: '¿Qué estás haciendo?' }))

    const ultima = noteHistoryCalls.at(-1)!
    expect(ultima).toMatchObject({ activityId: 'a-casa', enabled: true, excludeId: 'f1' })
    const seccion = screen.getByLabelText('Lo de otras veces')
    expect(within(seccion).getByRole('button', { name: 'Revisando MRs' })).toBeInTheDocument()

    fireEvent.click(within(seccion).getByRole('button', { name: 'Revisando MRs' }))
    expect(screen.getByLabelText('¿Qué estás haciendo?')).toHaveValue('Revisando MRs')
  })

  it('criterio 547 — sin notas previas no hay sección de píldoras ni explicación', () => {
    running(null)
    noteHistory = { suggestions: [], isPending: false }
    renderWithProviders(<VidaModuleLayout />)

    fireEvent.click(screen.getByRole('button', { name: '¿Qué estás haciendo?' }))

    const hoja = screen.getByRole('dialog')
    expect(within(hoja).queryByLabelText('Lo de otras veces')).not.toBeInTheDocument()
    expect(within(hoja).queryByText(/todav|ningun|primera vez|error/i)).not.toBeInTheDocument()
  })

  it('la sesión de otro día no estrena la línea: ahí lo que se pregunta es la hora', () => {
    openSession = {
      session: followUp({ date: '2026-09-17', startTime: '21:00' }),
      startInstant: new Date(2026, 8, 17, 21, 0, 0),
      isFromAnotherDay: true,
      isDisabled: false,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    }
    renderWithProviders(<VidaModuleLayout />)

    expect(screen.queryByRole('button', { name: '¿Qué estás haciendo?' })).not.toBeInTheDocument()
  })
})

/* ── Antes de empezar (FEAT-018, tajada 3) ──────────────────────────────────
 *
 * El editor es **el mismo** y se monta **una sola vez**: aquí se comprueba que
 * también se abre cuando **todavía no hay sesión**, que la pregunta cambia de
 * tiempo verbal y —lo importante— que guardar **no escribe nada en el API**:
 * lo que devuelve va al borrador de quien va a empezar.
 */
describe('VidaModuleLayout — la nota de antes de empezar (FEAT-018, criterio 548)', () => {
  function Pantalla({ onSave }: { onSave: (notes: string | null) => void }) {
    const { openStartNoteSheet } = useVidaSessionUi()
    return (
      <button
        type="button"
        onClick={() =>
          openStartNoteSheet({
            activityId: 'a-1',
            title: 'Trabajo en lululemon',
            initialValue: '',
            onSave,
          })
        }
      >
        lápiz
      </button>
    )
  }

  function renderConPantalla(onSave: (notes: string | null) => void) {
    renderWithProviders(
      <Routes>
        <Route element={<VidaModuleLayout />}>
          <Route index element={<Pantalla onSave={onSave} />} />
        </Route>
      </Routes>,
    )
  }

  it('abre la misma hoja sin sesión, y la pregunta va en futuro', () => {
    const onSave = vi.fn()
    renderConPantalla(onSave)

    fireEvent.click(screen.getByRole('button', { name: 'lápiz' }))

    const hoja = screen.getByRole('dialog')
    expect(within(hoja).getByRole('heading', { name: '¿Qué vas a hacer?' })).toBeInTheDocument()
    // De qué hablamos, sin repetir la pregunta.
    expect(within(hoja).getByText('Trabajo en lululemon')).toBeInTheDocument()
  })

  it('guardar deja el borrador y **no escribe en el API**', async () => {
    const onSave = vi.fn()
    renderConPantalla(onSave)

    fireEvent.click(screen.getByRole('button', { name: 'lápiz' }))
    fireEvent.change(screen.getByLabelText('¿Qué vas a hacer?'), {
      target: { value: 'Revisando MRs' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    await act(async () => {})

    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave).toHaveBeenCalledWith('Revisando MRs')
    // Ni una escritura de sesión: aquí todavía no hay sesión que escribir.
    expect(saveNote).not.toHaveBeenCalled()
    expect(sessionActions.start).not.toHaveBeenCalled()
  })

  it('vaciarla y guardar devuelve «nada», sin error', async () => {
    const onSave = vi.fn()
    renderConPantalla(onSave)

    fireEvent.click(screen.getByRole('button', { name: 'lápiz' }))
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    await act(async () => {})

    expect(onSave).toHaveBeenCalledWith(null)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
