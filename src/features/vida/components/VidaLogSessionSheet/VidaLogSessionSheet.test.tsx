import { act, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { VidaLogSessionSheet } from '@/features/vida/components/VidaLogSessionSheet'
import type { ActivityFollowUp } from '@/features/vida/types/activity-followup.types'
import type { VidaItem, VidaSuggestion } from '@/features/vida/types/vida-item.types'
import { renderWithProviders } from '@/test/render'

/**
 * La hoja de registrar: criterios 30, 31, 32, 35 y **36**.
 *
 * El que más importa es el **36**: con la mutación fallando, la hoja **no se
 * cierra**, no pierde lo elegido y **no deja una sesión fantasma** —lo que aquí
 * se comprueba viendo que `onClose` no se llama, que lo elegido sigue marcado y
 * que el `mutate` salió **una sola vez**: no hay escritura optimista, así que
 * la agenda no puede enseñar nada que el servidor no tenga—.
 *
 * Molde: `VidaPlaceInGapSheet.test.tsx`; los hooks de datos se mockean.
 */

type MutationStub = {
  mutate: ReturnType<typeof vi.fn>
  isPending: boolean
  isError: boolean
}

let createMutation: MutationStub
let editMutation: MutationStub

vi.mock('@/features/vida/hooks/useActivityFollowUps', () => ({
  useCreateActivityFollowUpMutation: () => createMutation,
  useUpdateActivityFollowUpMutation: () => editMutation,
}))
vi.mock('@/features/vida/hooks/useActivities', () => ({
  useActivitiesQuery: () => ({
    data: { activities: [], total: 0 },
    isPending: false,
    fetchStatus: 'idle',
    isError: false,
  }),
}))

function suggestion(id: string, title: string, durationMinutes: number | null): VidaSuggestion {
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
  }
  return { item, takenToday: false }
}

const SUGGESTIONS = [suggestion('s1', 'Poner lavadora', 20)]

const SESSION: ActivityFollowUp = {
  id: 'f9',
  activityId: 'otra',
  date: '2026-09-18',
  startTime: '08:10',
  durationMinutes: 32,
  isOpen: false,
  endTime: null,
  endDate: null,
  endDateTime: null,
  notes: 'lo de siempre',
  activity: { id: 'otra', title: 'Llamada con el banco', category: null },
}

function renderSheet(props: Partial<Parameters<typeof VidaLogSessionSheet>[0]> = {}) {
  const onClose = vi.fn()
  renderWithProviders(
    <VidaLogSessionSheet
      open
      onClose={onClose}
      mode="log"
      date="2026-09-18"
      dayLabel="viernes"
      suggestions={SUGGESTIONS}
      defaultStartTime="08:54"
      {...props}
    />,
  )
  return onClose
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 8, 18, 9, 24, 0))
  createMutation = { mutate: vi.fn(), isPending: false, isError: false }
  editMutation = { mutate: vi.fn(), isPending: false, isError: false }
})

afterEach(() => {
  vi.useRealTimers()
})

describe('VidaLogSessionSheet — «Empezar algo» (criterios 30, 330 a 334)', () => {
  it('criterio 330 — pregunta qué y desde cuándo, con «ahora» puesto, y no pide duración', () => {
    renderSheet({ mode: 'start', onStart: vi.fn().mockResolvedValue({ ok: true }) })

    expect(screen.getByRole('heading', { name: 'Qué' })).toBeInTheDocument()
    // La duración **no** se pregunta: una sesión abierta no la tiene.
    expect(screen.queryByText('Cuánto duró')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '¿A qué hora empezaste?' })).toBeInTheDocument()
    // «Ahora» ya puesto: `defaultStartTime` es el reloj en este modo.
    expect(screen.getByLabelText('Hora a la que empezaste')).toHaveValue('08:54')
    expect(screen.getByText('Ahora mismo. Cámbialo si llevas un rato con ello.'))
      .toBeInTheDocument()
  })

  it('criterio 332 — sin tocar la hora, se empieza como siempre: sin hora que mandar', async () => {
    const onStart = vi.fn().mockResolvedValue({ ok: true })
    renderSheet({ mode: 'start', onStart })

    fireEvent.click(screen.getByRole('button', { name: /Poner lavadora/ }))
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Empezar' }))
    })

    expect(onStart).toHaveBeenCalledWith('a-s1', undefined)
  })

  it('criterio 331b — decir «08:07» es **una** acción: una sola llamada, sin registrar nada aparte', async () => {
    const onStart = vi.fn().mockResolvedValue({ ok: true })
    renderSheet({ mode: 'start', onStart })

    fireEvent.click(screen.getByRole('button', { name: /Poner lavadora/ }))
    fireEvent.change(screen.getByLabelText('Hora a la que empezaste'), {
      target: { value: '08:07' },
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Empezar' }))
    })

    expect(onStart).toHaveBeenCalledTimes(1)
    expect(onStart).toHaveBeenCalledWith('a-s1', '08:07')
    // `activityFollowUpAdd` —el «registrar tiempo pasado»— **no se roza**.
    expect(createMutation.mutate).not.toHaveBeenCalled()
  })

  it('criterio 334 — una hora que no ha llegado no empieza nada, con la frase de siempre', async () => {
    const onStart = vi.fn().mockResolvedValue({ ok: true })
    renderSheet({ mode: 'start', onStart })

    fireEvent.click(screen.getByRole('button', { name: /Poner lavadora/ }))
    fireEvent.change(screen.getByLabelText('Hora a la que empezaste'), {
      target: { value: '16:00' },
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Empezar' }))
    })

    expect(onStart).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('Esa hora todavía no ha llegado.')
  })

  it('criterio 334 — este mismo minuto **sí** vale: es «ahora»', async () => {
    const onStart = vi.fn().mockResolvedValue({ ok: true })
    renderSheet({ mode: 'start', onStart })

    fireEvent.click(screen.getByRole('button', { name: /Poner lavadora/ }))
    fireEvent.change(screen.getByLabelText('Hora a la que empezaste'), {
      target: { value: '09:24' },
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Empezar' }))
    })

    expect(onStart).toHaveBeenCalledWith('a-s1', '09:24')
  })

  it('criterio 333 — una hora vacía se dice con la frase que ya existía', async () => {
    const onStart = vi.fn().mockResolvedValue({ ok: true })
    renderSheet({ mode: 'start', onStart })

    fireEvent.click(screen.getByRole('button', { name: /Poner lavadora/ }))
    fireEvent.change(screen.getByLabelText('Hora a la que empezaste'), { target: { value: '' } })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Empezar' }))
    })

    expect(onStart).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Dinos a qué hora empezó, con horas y minutos.',
    )
  })

  it('criterio 338 — si falla, la hoja se queda con la actividad **y con la hora escrita**', async () => {
    const onStart = vi.fn().mockResolvedValue({ ok: false, message: 'Ya tenías algo en marcha.' })
    const onClose = renderSheet({ mode: 'start', onStart })

    fireEvent.click(screen.getByRole('button', { name: /Poner lavadora/ }))
    fireEvent.change(screen.getByLabelText('Hora a la que empezaste'), {
      target: { value: '08:07' },
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Empezar' }))
    })

    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Hora a la que empezaste')).toHaveValue('08:07')
    expect(screen.getByRole('button', { name: /Poner lavadora/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Ya tenías algo en marcha.')
  })

  it('si no se puede empezar, la hoja se queda abierta con lo elegido y lo dice', async () => {
    const onStart = vi.fn().mockResolvedValue({ ok: false, message: 'Ya tenías algo en marcha.' })
    const onClose = renderSheet({ mode: 'start', onStart })

    fireEvent.click(screen.getByRole('button', { name: /Poner lavadora/ }))
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Empezar' }))
    })

    expect(onStart).toHaveBeenCalledWith('a-s1', undefined)
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('Ya tenías algo en marcha.')
    expect(screen.getByRole('button', { name: /Poner lavadora/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })
})

describe('VidaLogSessionSheet — «Registrar tiempo pasado» (criterios 31, 32 y 36)', () => {
  it('parte de la hora que le dan y de la duración de la plantilla', () => {
    renderSheet()

    expect(screen.getByLabelText('Hora a la que empezó')).toHaveValue('08:54')
    fireEvent.click(screen.getByRole('button', { name: /Poner lavadora/ }))
    // Lo que la plantilla decía viene puesto y se puede cambiar.
    expect(screen.getByRole('button', { name: '30' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText(/Poner lavadora · 8:54 · 20m/)).toBeInTheDocument()
  })

  it('una hora que todavía no ha llegado no se registra (criterio 32)', () => {
    const onClose = renderSheet()

    fireEvent.click(screen.getByRole('button', { name: /Poner lavadora/ }))
    fireEvent.change(screen.getByLabelText('Hora a la que empezó'), {
      target: { value: '10:00' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Registrar' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Esa hora todavía no ha llegado.')
    expect(createMutation.mutate).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('criterio 36 — si la mutación falla, la hoja no se cierra ni pierde lo elegido', () => {
    // `mutate` que no llama a su `onSuccess`: es lo que pasa cuando el servidor
    // responde mal. El error se pinta porque el hook deja `isError`.
    createMutation = { mutate: vi.fn(), isPending: false, isError: true }
    const onClose = renderSheet()

    fireEvent.click(screen.getByRole('button', { name: /Poner lavadora/ }))
    // 15 y no 45: a las 9:24, un rato de 45 min empezado a las 8:54 todavía no
    // habría acabado, y la hoja lo pararía antes de llamar a nadie.
    fireEvent.click(screen.getByRole('button', { name: '15' }))
    fireEvent.click(screen.getByRole('button', { name: 'Registrar' }))

    expect(createMutation.mutate).toHaveBeenCalledTimes(1)
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /Poner lavadora/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: '15' })).toHaveAttribute('aria-pressed', 'true')
    expect(
      screen.getByText('No pudimos registrarlo. Vuelve a intentarlo; lo que elegiste sigue aquí.'),
    ).toBeInTheDocument()
  })

  it('se cierra sola cuando el servidor dice que sí', () => {
    createMutation = {
      mutate: vi.fn((_input, options) => options?.onSuccess?.()),
      isPending: false,
      isError: false,
    }
    const onClose = renderSheet()

    fireEvent.click(screen.getByRole('button', { name: /Poner lavadora/ }))
    fireEvent.click(screen.getByRole('button', { name: '15' }))
    fireEvent.click(screen.getByRole('button', { name: 'Registrar' }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('la salida es «Volver», nunca «Cancelar» (criterio 59)', () => {
    renderSheet()

    expect(screen.getByRole('button', { name: 'Volver' })).toBeInTheDocument()
    const sheet = screen.getByRole('dialog')
    expect(within(sheet).queryByRole('button', { name: /cancelar|eliminar/i })).toBeNull()
  })
  /* ── FEAT-008, tajada 3: los dos campos y la hora de fin ────────────────── */

  it('criterio 130 — «Cuánto duró» se escribe en dos campos, horas y minutos', () => {
    renderSheet()

    fireEvent.click(screen.getByRole('button', { name: /Poner lavadora/ }))
    // Los 20 min de la plantilla no son ninguna píldora, así que «libre» ya
    // está abierto: vienen **repartidos**, no en un campo de minutos.
    expect(screen.getByLabelText('horas')).toHaveValue('0')
    expect(screen.getByLabelText('minutos')).toHaveValue('20')
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument()
  })

  it('criterio 119 — con hora de inicio y duración se ve a qué hora finaliza', () => {
    // Es lo que el usuario pidió viendo esta modal: aquí hay las dos cosas.
    renderSheet()

    fireEvent.click(screen.getByRole('button', { name: /Poner lavadora/ }))
    const line = document.getElementById('vida-log-end-time')
    expect(line).toHaveAttribute('aria-live', 'polite')
    expect(line?.textContent).toContain('Acaba a las')
    // 8:54 + 20 min de la plantilla.
    expect(screen.getByText('9:14').tagName).toBe('B')

    fireEvent.click(screen.getByRole('button', { name: '15' }))
    expect(screen.getByText('9:09')).toBeInTheDocument()
  })

  it('criterio 131 — lo que se registra sigue siendo minutos, y sigue viajando igual', () => {
    renderSheet()

    fireEvent.click(screen.getByRole('button', { name: /Poner lavadora/ }))
    fireEvent.change(screen.getByLabelText('minutos'), { target: { value: '15' } })
    fireEvent.click(screen.getByRole('button', { name: 'Registrar' }))

    expect(createMutation.mutate).toHaveBeenCalledTimes(1)
    expect(createMutation.mutate.mock.calls[0][0]).toMatchObject({ durationMinutes: 15 })
  })
})

describe('VidaLogSessionSheet — corregir lo registrado (criterio 35)', () => {
  it('el «qué» no se pregunta: se recuerda, y se corrigen hora, duración y notas', () => {
    renderSheet({ mode: 'edit', session: SESSION })

    expect(screen.queryByRole('heading', { name: 'Qué' })).not.toBeInTheDocument()
    expect(screen.getByText('Llamada con el banco')).toBeInTheDocument()
    expect(screen.getByLabelText('Hora a la que empezó')).toHaveValue('08:10')
    expect(screen.getByLabelText('Notas de esta sesión')).toHaveValue('lo de siempre')
  })

  it('guardar manda el `id` con los tres campos', () => {
    renderSheet({ mode: 'edit', session: SESSION })

    fireEvent.change(screen.getByLabelText('Notas de esta sesión'), {
      target: { value: 'se alargó' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(editMutation.mutate.mock.calls[0][0]).toEqual({
      id: 'f9',
      startTime: '08:10',
      durationMinutes: 32,
      notes: 'se alargó',
    })
  })
})

/* ── FEAT-011, tajada 1: anclada a un hueco que ya pasó ──────────────────── */

describe('VidaLogSessionSheet — anclada a un hueco (criterios 222 a 229)', () => {
  /** Un hueco de 8:00 a 8:40 con «Daily meeting» al otro lado. */
  const GAP = { startMinutes: 480, endMinutes: 520, nextBlockTitle: 'Daily meeting' }

  function renderInGap(window = GAP) {
    return renderSheet({ gapWindow: window, initial: { startTime: '08:00' } })
  }

  it('criterios 222 y 223 — es la misma hoja, con el nombre del hueco y su hora puesta', () => {
    renderInGap()

    expect(screen.getByText('¿Qué hiciste?')).toBeInTheDocument()
    expect(screen.getByText('Viernes · en el hueco de 8:00 a 8:40')).toBeInTheDocument()
    // El principio del hueco, no «media hora antes de ahora» (8:54).
    expect(screen.getByLabelText('Hora a la que empezó')).toHaveValue('08:00')
    // **Un solo buscador** (criterio 38 de FEAT-004): el de siempre.
    expect(screen.getAllByRole('button', { name: /Poner lavadora/ })).toHaveLength(1)
  })

  it('criterio 224 — la duración arranca en la de la plantilla, nunca en el hueco entero', () => {
    renderInGap()

    fireEvent.click(screen.getByRole('button', { name: /Poner lavadora/ }))
    expect(screen.getByLabelText('minutos')).toHaveValue('20')
    expect(screen.getByRole('button', { name: /Todo el hueco/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('criterio 228 — solo se ofrece lo que cabe, y «Todo el hueco» pone lo que queda', () => {
    renderInGap()

    expect(screen.getByRole('button', { name: '15' })).toBeEnabled()
    expect(screen.getByRole('button', { name: '30' })).toBeEnabled()
    // 45 y 1h no caben en 40 minutos: se apagan, no desaparecen.
    expect(screen.getByRole('button', { name: '45' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '1h' })).toBeDisabled()
    expect(screen.getByText('Aquí caben 40 min.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Poner lavadora/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Todo el hueco, 40 min' }))
    expect(createMutation.mutate).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Registrar' }))
    expect(createMutation.mutate.mock.calls[0][0]).toMatchObject({
      startTime: '08:00',
      durationMinutes: 40,
    })
  })

  it('criterio 227 — con lo que cabe, dice lo que queda libre y quién está al otro lado', () => {
    renderInGap()

    fireEvent.click(screen.getByRole('button', { name: /Poner lavadora/ }))
    fireEvent.click(screen.getByRole('button', { name: '15' }))
    expect(
      screen.getByText(/Queda libre 25m antes de Daily meeting\./),
    ).toBeInTheDocument()
    // La hora de fin la sigue diciendo la línea de FEAT-008, sin repetirse.
    expect(document.getElementById('vida-log-end-time')?.textContent).toContain('8:15')
  })

  it('criterio 226 — lo que se pasa del final apaga Guardar y se dice sin pulsar nada', () => {
    renderInGap()

    fireEvent.click(screen.getByRole('button', { name: /Poner lavadora/ }))
    fireEvent.change(screen.getByLabelText('horas'), { target: { value: '1' } })

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Desde las 8:00 caben 40 min. Elige menos tiempo o empieza antes.',
    )
    expect(screen.getByRole('button', { name: 'Registrar' })).toBeDisabled()

    // Y vuelve a encenderse al corregir.
    fireEvent.change(screen.getByLabelText('horas'), { target: { value: '0' } })
    fireEvent.change(screen.getByLabelText('minutos'), { target: { value: '30' } })
    expect(screen.getByRole('button', { name: 'Registrar' })).toBeEnabled()
  })

  it('criterio 225 — también por arriba: una hora fuera del hueco no entra', () => {
    renderInGap()

    fireEvent.click(screen.getByRole('button', { name: /Poner lavadora/ }))
    fireEvent.change(screen.getByLabelText('Hora a la que empezó'), {
      target: { value: '07:30' },
    })

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Esa hora se sale de este rato libre. Aquí cabe algo entre las 8:00 y las 8:40.',
    )
    expect(screen.getByRole('button', { name: 'Registrar' })).toBeDisabled()
    expect(createMutation.mutate).not.toHaveBeenCalled()
  })

  it('criterio 229 — guardar sigue siendo la misma llamada de siempre', () => {
    renderInGap()

    fireEvent.click(screen.getByRole('button', { name: /Poner lavadora/ }))
    fireEvent.click(screen.getByRole('button', { name: '15' }))
    fireEvent.click(screen.getByRole('button', { name: 'Registrar' }))

    expect(createMutation.mutate).toHaveBeenCalledTimes(1)
    expect(createMutation.mutate.mock.calls[0][0]).toMatchObject({
      date: '2026-09-18',
      startTime: '08:00',
      durationMinutes: 15,
    })
  })

  it('sin hueco, la hoja de la cabecera no cambia ni una palabra (criterio 56)', () => {
    renderSheet()

    expect(screen.getByText('Registrar tiempo pasado')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Todo el hueco/ })).toBeNull()
    expect(screen.queryByText(/Aquí caben/)).toBeNull()
  })
})

/**
 * **La duración de siempre** (FEAT-011, tajada 3): lo que sueles tardar en esa
 * actividad viene puesto, con su caída ordenada cuando no hay ese dato — y la
 * frase solo cuando el número **es** la costumbre.
 */
describe('VidaLogSessionSheet — la duración que sueles tardar (criterios 238 a 240)', () => {
  /** Un hueco de 8:00 a 8:40 con «Daily meeting» al otro lado. */
  const GAP = { startMinutes: 480, endMinutes: 520, nextBlockTitle: 'Daily meeting' }

  it('criterio 238 — manda la costumbre por encima de lo que dice la plantilla', () => {
    renderSheet({
      gapWindow: GAP,
      initial: { startTime: '08:00' },
      usualDurations: { 'a-s1': 35 },
    })

    fireEvent.click(screen.getByRole('button', { name: /Poner lavadora/ }))
    // La plantilla dice 20; la costumbre, 35.
    expect(screen.getByLabelText('minutos')).toHaveValue('35')
    expect(screen.getByText(/Sueles tardar 35m/)).toBeInTheDocument()
  })

  it('criterio 239 — sin ese dato se cae a la plantilla, y no se dice nada de costumbre', () => {
    renderSheet({ gapWindow: GAP, initial: { startTime: '08:00' } })

    fireEvent.click(screen.getByRole('button', { name: /Poner lavadora/ }))
    expect(screen.getByLabelText('minutos')).toHaveValue('20')
    expect(screen.queryByText(/Sueles tardar/)).not.toBeInTheDocument()
  })

  it('criterio 239 — lo que no cabe se recorta al hueco, sin llamarlo costumbre', () => {
    renderSheet({
      gapWindow: GAP,
      initial: { startTime: '08:00' },
      usualDurations: { 'a-s1': 60 },
    })

    fireEvent.click(screen.getByRole('button', { name: /Poner lavadora/ }))
    // 60 no cabe en 40: se recorta a lo que queda —la píldora de «Todo el
    // hueco» se enciende sola— y entonces ya no es «lo que sueles tardar».
    expect(screen.getByRole('button', { name: 'Todo el hueco, 40 min' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.queryByText(/Sueles tardar/)).not.toBeInTheDocument()
  })

  it('criterio 240 — tocada a mano, la frase se va con el número', () => {
    renderSheet({
      gapWindow: GAP,
      initial: { startTime: '08:00' },
      usualDurations: { 'a-s1': 35 },
    })

    fireEvent.click(screen.getByRole('button', { name: /Poner lavadora/ }))
    expect(screen.getByText(/Sueles tardar 35m/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '15' }))
    expect(screen.queryByText(/Sueles tardar/)).not.toBeInTheDocument()
  })

  it('sin hueco, «Registrar tiempo pasado» de la cabecera sigue igual que en FEAT-004', () => {
    renderSheet({ usualDurations: { 'a-s1': 35 } })

    fireEvent.click(screen.getByRole('button', { name: /Poner lavadora/ }))
    // Sin bordes contra los que recortar, la duración es la de la plantilla y
    // nadie propone `DEFAULT_BLOCK_MINUTES` donde antes no había nada.
    expect(screen.getByLabelText('minutos')).toHaveValue('20')
    expect(screen.queryByText(/Sueles tardar/)).not.toBeInTheDocument()
  })
})
