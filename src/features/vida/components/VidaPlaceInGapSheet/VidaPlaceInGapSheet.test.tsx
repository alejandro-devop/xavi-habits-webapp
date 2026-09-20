import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { VidaPlaceInGapSheet } from '@/features/vida/components/VidaPlaceInGapSheet'
import type { ActivityDayPlanItem } from '@/features/vida/types/activity-day-plan.types'
import type { Activity } from '@/features/vida/types/activity.types'
import type { VidaItem, VidaSuggestion } from '@/features/vida/types/vida-item.types'
import type { GapWindow } from '@/features/vida/utils/vida-gap-form.utils'
import { renderWithProviders } from '@/test/render'

/**
 * Molde de `VidaActivitySheet.test.tsx`: los hooks de datos se mockean y la
 * hoja se monta con `renderWithProviders`. Aquí se comprueban los criterios
 * 24 a 29 de la sección 1, y el 30 en su mitad de «cambiar hora o duración».
 *
 * El caso que más importa es el **29**: con la mutación fallando, la hoja no se
 * cierra, no pierde lo elegido y no deja un bloque fantasma —lo que se prueba
 * comprobando que `onClose` **no** se llama y que el `mutate` salió una sola vez—.
 */

type MutationStub = {
  mutate: ReturnType<typeof vi.fn>
  isPending: boolean
  isError: boolean
}

function buildMutation(): MutationStub {
  return { mutate: vi.fn(), isPending: false, isError: false }
}

let addMutation: MutationStub
let editMutation: MutationStub
let activities: Activity[]

vi.mock('@/features/vida/hooks/useActivityDayPlan', () => ({
  useAddDayPlanItemMutation: () => addMutation,
  useEditDayPlanItemMutation: () => editMutation,
}))
vi.mock('@/features/vida/hooks/useActivities', () => ({
  useActivitiesQuery: () => ({
    data: { activities, total: activities.length },
    isPending: false,
    fetchStatus: 'idle',
    isError: false,
  }),
}))

const gapWindow: GapWindow = {
  startMinutes: 10 * 60 + 30,
  endMinutes: 13 * 60,
  nextBlockTitle: 'Cocinar y almorzar',
}

function buildActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: 'a1',
    userId: 1,
    title: 'Bañarme',
    description: null,
    status: 'pending',
    priority: 'medium',
    categoryId: 'casa',
    scheduledDate: null,
    completedAt: null,
    spentTimeMinutes: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function buildSuggestion(
  overrides: Partial<VidaItem> & { id: string; activityId: string },
): VidaSuggestion {
  const item: VidaItem = {
    userId: 1,
    days: ['friday'],
    isActive: true,
    orderIndex: 0,
    notes: null,
    startTime: null,
    durationMinutes: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
  return { item, takenToday: false }
}

function buildPlanItem(overrides: Partial<ActivityDayPlanItem> = {}): ActivityDayPlanItem {
  return {
    id: 'p1',
    userId: 1,
    activityId: 'a9',
    date: '2026-09-18',
    startTime: '13:00',
    endTime: '14:00',
    orderIndex: 0,
    completedAt: null,
    createdAt: '2026-09-18T00:00:00.000Z',
    updatedAt: '2026-09-18T00:00:00.000Z',
    activity: null,
    ...overrides,
  }
}

function renderSheet(props: Partial<Parameters<typeof VidaPlaceInGapSheet>[0]> = {}) {
  const onClose = vi.fn()
  renderWithProviders(
    <VidaPlaceInGapSheet
      open
      onClose={onClose}
      date="2026-09-18"
      gapWindow={gapWindow}
      dayLabel="viernes"
      suggestions={[
        buildSuggestion({
          id: 'v1',
          activityId: 'a1',
          durationMinutes: 45,
          activity: { id: 'a1', title: 'Bañarme', description: null, category: null },
        }),
      ]}
      planItems={[]}
      {...props}
    />,
  )
  return { onClose }
}

beforeEach(() => {
  addMutation = buildMutation()
  editMutation = buildMutation()
  activities = [buildActivity(), buildActivity({ id: 'a2', title: 'Leer un rato' })]
})

describe('VidaPlaceInGapSheet', () => {
  it('criterio 24 — se titula con la hora del hueco y dice hasta dónde llega', () => {
    renderSheet()
    expect(screen.getByText('Poner algo a las 10:30')).toBeInTheDocument()
    expect(
      screen.getByText('Hueco de 2h 30 · hasta las 13:00 «Cocinar y almorzar»'),
    ).toBeInTheDocument()
  })

  it('criterio 24 — sin bloque después dice «hasta el final del día»', () => {
    renderSheet({ gapWindow: { ...gapWindow, nextBlockTitle: null } })
    expect(screen.getByText('Hueco de 2h 30 · hasta el final del día')).toBeInTheDocument()
  })

  it('criterio 25 — son tres preguntas: qué, cuánto y cuándo', () => {
    renderSheet()
    expect(screen.getByRole('heading', { name: 'Qué' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Cuánto' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Cuándo' })).toBeInTheDocument()
  })

  it('criterio 25 — «Poner» no se habilita hasta tener las tres resueltas', async () => {
    const user = userEvent.setup()
    renderSheet()
    const submit = screen.getByRole('button', { name: 'Poner' })
    expect(submit).toBeDisabled()

    await user.click(screen.getByRole('button', { name: /Bañarme/ }))
    // La duración de la plantilla viene preseleccionada y cabe: ya hay las tres.
    expect(submit).toBeEnabled()
  })

  it('criterio 25 — la duración de la plantilla viene preseleccionada', async () => {
    const user = userEvent.setup()
    renderSheet()
    await user.click(screen.getByRole('button', { name: /Bañarme/ }))
    expect(screen.getByRole('button', { name: '45' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('criterio 25 — el buscador encuentra sin tildes y añade lo que no está en la plantilla', async () => {
    const user = userEvent.setup()
    renderSheet()
    await user.type(screen.getByLabelText('Buscar entre tus actividades'), 'banar')
    const results = screen.getAllByRole('button', { name: /Bañarme/ })
    expect(results.length).toBeGreaterThan(1)
  })

  it('criterio 26 — las duraciones que no caben salen apagadas', async () => {
    const user = userEvent.setup()
    renderSheet({ gapWindow: { startMinutes: 600, endMinutes: 640, nextBlockTitle: null } })
    await user.click(screen.getByRole('button', { name: /Bañarme/ }))
    expect(screen.getByRole('button', { name: '15' })).toBeEnabled()
    expect(screen.getByRole('button', { name: '30' })).toBeEnabled()
    expect(screen.getByRole('button', { name: '45' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '1h' })).toBeDisabled()
  })

  it('criterio 26 — «libre» no admite más minutos de los que caben y lo dice', async () => {
    const user = userEvent.setup()
    renderSheet({ gapWindow: { startMinutes: 600, endMinutes: 640, nextBlockTitle: null } })
    await user.click(screen.getByRole('button', { name: /Bañarme/ }))
    await user.click(screen.getByRole('button', { name: 'libre' }))
    const free = screen.getByRole('spinbutton')
    expect(free).toHaveAttribute('max', '40')
    expect(screen.getByText('Aquí caben 40 min.')).toBeInTheDocument()

    await user.type(free, '90')
    expect(screen.getByRole('button', { name: 'Poner' })).toBeDisabled()
    expect(screen.getByRole('alert')).toHaveTextContent(/caben 40 min/)
  })

  it('criterio 27 — ofrece el principio del hueco y al menos dos horas más, y «otra hora»', () => {
    renderSheet()
    const when = screen.getByRole('group', { name: 'A qué hora empieza' })
    const options = within(when).getAllByRole('button')
    expect(options[0]).toHaveTextContent('10:30')
    expect(options[0]).toHaveTextContent('al principio del hueco')
    expect(options.length).toBeGreaterThanOrEqual(4)
    expect(options.at(-1)).toHaveTextContent('otra hora')
  })

  it('criterio 27 — «otra hora» no admite una hora fuera del hueco', async () => {
    const user = userEvent.setup()
    renderSheet()
    await user.click(screen.getByRole('button', { name: /Bañarme/ }))
    await user.click(screen.getByRole('button', { name: 'otra hora' }))

    const input = screen.getByLabelText('Otra hora')
    expect(input).toHaveAttribute('min', '10:30')
    expect(input).toHaveAttribute('max', '12:59')

    await user.clear(input)
    await user.type(input, '19:00')
    expect(screen.getByRole('button', { name: 'Poner' })).toBeDisabled()
    expect(screen.getByRole('alert')).toHaveTextContent(/se sale de este rato libre/)
    expect(addMutation.mutate).not.toHaveBeenCalled()
  })

  it('criterio 28 — dice cuánto queda libre después y previsualiza la elección', async () => {
    const user = userEvent.setup()
    renderSheet()
    await user.click(screen.getByRole('button', { name: /Bañarme/ }))
    expect(screen.getByText('Bañarme · 10:30 · 45m')).toBeInTheDocument()
    expect(screen.getByText('Queda libre 1h 45 antes de Cocinar y almorzar.')).toBeInTheDocument()
  })

  it('criterio 23/25 — «Poner» manda la hora y el fin calculados, sin salirse del hueco', async () => {
    const user = userEvent.setup()
    renderSheet()
    await user.click(screen.getByRole('button', { name: /Bañarme/ }))
    await user.click(screen.getByRole('button', { name: 'Poner' }))

    expect(addMutation.mutate).toHaveBeenCalledTimes(1)
    expect(addMutation.mutate.mock.calls[0][0]).toEqual({
      date: '2026-09-18',
      activityId: 'a1',
      startTime: '10:30',
      endTime: '11:15',
    })
  })

  it('criterio 29 — si la mutación falla, la hoja no se cierra ni pierde lo elegido', async () => {
    const user = userEvent.setup()
    addMutation.isError = true
    const { onClose } = renderSheet()

    await user.click(screen.getByRole('button', { name: /Bañarme/ }))
    await user.click(screen.getByRole('button', { name: 'Poner' }))

    // El cierre vive en el `onSuccess` local del `mutate`: el stub no lo llama.
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByText(/No pudimos ponerlo en tu día/)).toBeInTheDocument()
    // Lo elegido sigue puesto.
    expect(screen.getByRole('button', { name: /Bañarme/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '45' })).toHaveAttribute('aria-pressed', 'true')
    // Y un solo intento: nada de un segundo bloque fantasma.
    expect(addMutation.mutate).toHaveBeenCalledTimes(1)
  })

  it('criterio 30 — editando un bloque no se pregunta «qué» y se guarda con ItemEdit', async () => {
    const user = userEvent.setup()
    renderSheet({
      editing: {
        itemId: 'p1',
        activity: { id: 'a1', title: 'Bañarme', icon: null, color: null },
        startTime: '10:30',
        durationMinutes: 45,
      },
    })

    expect(screen.getByText('Cambiar hora o duración')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Qué' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '1h' }))
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(editMutation.mutate).toHaveBeenCalledTimes(1)
    expect(editMutation.mutate.mock.calls[0][0]).toEqual({
      itemId: 'p1',
      startTime: '10:30',
      endTime: '11:30',
    })
    expect(addMutation.mutate).not.toHaveBeenCalled()
  })

  it('lo que ya está en el plan no se vuelve a ofrecer en «qué»', () => {
    renderSheet({ planItems: [buildPlanItem({ activityId: 'a1' })] })
    expect(
      screen.getByText('Tu plantilla de viernes no tiene nada más que ofrecer aquí. Búscalo abajo.'),
    ).toBeInTheDocument()
  })

  it('criterio 56 — la hoja no reprocha nada ni dice «cancelar» ni «eliminar»', () => {
    const { container } = renderWithProviders(
      <VidaPlaceInGapSheet
        open
        onClose={vi.fn()}
        date="2026-09-18"
        gapWindow={gapWindow}
        dayLabel="viernes"
        suggestions={[]}
        planItems={[]}
      />,
    )
    const text = `${container.textContent ?? ''}${document.body.textContent ?? ''}`
    expect(text).not.toMatch(/desperdici|perdiste|fallaste|vací|cancelar|eliminar/i)
  })

  it('la salida de la hoja se llama «Volver», nunca «Cancelar»', () => {
    renderSheet()
    expect(screen.getByRole('button', { name: 'Volver' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument()
  })
})
