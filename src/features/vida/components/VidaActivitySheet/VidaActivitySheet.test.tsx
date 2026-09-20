import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { VidaActivitySheet } from '@/features/vida/components/VidaActivitySheet'
import type { ActivityCategory } from '@/features/vida/types/activity-category.types'
import type { Activity } from '@/features/vida/types/activity.types'
import type { VidaItem } from '@/features/vida/types/vida-item.types'
import { renderWithProviders } from '@/test/render'

/**
 * Molde de `HabitFormModal.test.tsx`: los hooks de datos se mockean y la hoja
 * se monta con `renderWithProviders`. Aquí se comprueban los criterios 12, 13,
 * 14, 15 y 16 (tajada 2) y 17, 18, 19 y 20 (tajada 3) de la sección 1 del
 * dossier de FEAT-002, más los estados de las categorías dentro de la hoja.
 */

type MutationStub = {
  mutate: ReturnType<typeof vi.fn>
  reset: ReturnType<typeof vi.fn>
  isPending: boolean
  isError: boolean
}

function buildMutation(): MutationStub {
  return { mutate: vi.fn(), reset: vi.fn(), isPending: false, isError: false }
}

let createActivity: MutationStub
let updateActivity: MutationStub
let createCategory: MutationStub
let createVidaItem: MutationStub
let updateVidaItem: MutationStub
let categories: ActivityCategory[]
let categoriesQuery: Record<string, unknown>

vi.mock('@/features/vida/hooks/useActivities', () => ({
  useCreateActivityMutation: () => createActivity,
  useUpdateActivityMutation: () => updateActivity,
}))
vi.mock('@/features/vida/hooks/useActivityCategories', () => ({
  useActivityCategoriesQuery: () => ({ data: categories, ...categoriesQuery }),
  useCreateActivityCategoryMutation: () => createCategory,
}))
vi.mock('@/features/vida/hooks/useVidaItems', () => ({
  useCreateVidaItemMutation: () => createVidaItem,
  useUpdateVidaItemMutation: () => updateVidaItem,
}))

function buildCategory(overrides: Partial<ActivityCategory> = {}): ActivityCategory {
  return {
    id: 'casa',
    userId: 1,
    orderIndex: 0,
    name: 'Casa',
    description: null,
    icon: 'house-chimney',
    color: '#8b5cf6',
    ...overrides,
  }
}

function buildActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: 'a1',
    userId: 1,
    title: 'Organizar la casa',
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

function buildVidaItem(overrides: Partial<VidaItem> = {}): VidaItem {
  return {
    id: 'v1',
    userId: 1,
    activityId: 'a1',
    days: ['monday', 'wednesday', 'friday'],
    notes: 'Con calma',
    isActive: true,
    orderIndex: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

beforeEach(() => {
  createActivity = buildMutation()
  updateActivity = buildMutation()
  createCategory = buildMutation()
  createVidaItem = buildMutation()
  updateVidaItem = buildMutation()
  categoriesQuery = { isPending: false, isError: false, fetchStatus: 'idle', refetch: vi.fn() }
  categories = [
    buildCategory(),
    buildCategory({ id: 'yo', name: 'Yo', icon: 'spa', color: '#0284c7', orderIndex: 1 }),
  ]
})

function renderSheet(props: Partial<Parameters<typeof VidaActivitySheet>[0]> = {}) {
  const onClose = vi.fn()
  const result = renderWithProviders(
    <VidaActivitySheet open onClose={onClose} {...props} />,
  )
  return { ...result, onClose }
}

describe('VidaActivitySheet', () => {
  it('sin nombre no envía nada y señala el campo (criterio 12)', async () => {
    const user = userEvent.setup()
    renderSheet()

    await user.click(screen.getByRole('button', { name: 'Casa' }))
    await user.click(screen.getByRole('button', { name: 'Crear' }))

    expect(createActivity.mutate).not.toHaveBeenCalled()
    expect(screen.getByText('Ponle un nombre: es cómo la vas a reconocer.')).toBeInTheDocument()
  })

  it('con el nombre en blancos y sin categoría tampoco envía (criterio 12)', async () => {
    const user = userEvent.setup()
    renderSheet()

    await user.type(screen.getByLabelText('Cómo la llamas'), '   ')
    await user.click(screen.getByRole('button', { name: 'Crear' }))

    expect(createActivity.mutate).not.toHaveBeenCalled()
    expect(screen.getByText('Ponle un nombre: es cómo la vas a reconocer.')).toBeInTheDocument()
    expect(
      screen.getByText('Elige una categoría: le da el icono y el color.'),
    ).toBeInTheDocument()
  })

  it('con nombre y categoría crea y cierra la hoja (criterios 12 y 13)', async () => {
    const user = userEvent.setup()
    const { onClose } = renderSheet()

    await user.type(screen.getByLabelText('Cómo la llamas'), 'Regar las plantas')
    await user.click(screen.getByRole('button', { name: 'Casa' }))
    await user.click(screen.getByRole('button', { name: 'Crear' }))

    expect(createActivity.mutate).toHaveBeenCalledTimes(1)
    expect(createActivity.mutate.mock.calls[0][0]).toEqual({
      title: 'Regar las plantas',
      categoryId: 'casa',
    })

    // El cierre vive en el `onSuccess` **local**: solo se cierra si salió bien.
    expect(onClose).not.toHaveBeenCalled()
    act(() => createActivity.mutate.mock.calls[0][1].onSuccess(buildActivity()))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('si la mutación falla la hoja no se cierra ni pierde lo escrito (criterio 16)', async () => {
    const user = userEvent.setup()
    createActivity.isError = true
    const { onClose } = renderSheet()

    await user.type(screen.getByLabelText('Cómo la llamas'), 'Regar las plantas')
    await user.click(screen.getByRole('button', { name: 'Casa' }))
    await user.click(screen.getByRole('button', { name: 'Crear' }))

    // El `mutate` se llamó, pero nadie invocó su `onSuccess`: la hoja sigue.
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByText(/No pudimos crear la actividad/)).toBeInTheDocument()
    expect(screen.getByLabelText('Cómo la llamas')).toHaveValue('Regar las plantas')
    expect(screen.getByRole('button', { name: 'Casa' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('«+ nueva» crea la categoría, la deja elegida y conserva el nombre (criterio 14)', async () => {
    const user = userEvent.setup()
    renderSheet()

    await user.type(screen.getByLabelText('Cómo la llamas'), 'Regar las plantas')
    await user.click(screen.getByRole('button', { name: '+ nueva' }))

    // El paso apilado: nombre, icono y los diecisiete colores de la paleta.
    expect(await screen.findByRole('heading', { name: 'Nueva categoría' })).toBeInTheDocument()
    expect(
      await screen.findByRole('radiogroup', { name: 'Color de la categoría' }),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(17)

    await user.type(screen.getByLabelText('Cómo la llamas'), 'Plantas')
    await user.click(screen.getByRole('radio', { name: 'Menta' }))
    await user.click(screen.getByRole('button', { name: 'Crear categoría' }))

    expect(createCategory.mutate).toHaveBeenCalledTimes(1)
    expect(createCategory.mutate.mock.calls[0][0]).toMatchObject({
      name: 'Plantas',
      color: '#10b981',
    })

    // Al volver, la nueva queda elegida y lo escrito abajo sigue ahí.
    categories = [...categories, buildCategory({ id: 'plantas', name: 'Plantas', icon: null })]
    act(() => createCategory.mutate.mock.calls[0][1].onSuccess({ id: 'plantas', name: 'Plantas' }))

    await waitFor(() => {
      expect(screen.getByLabelText('Cómo la llamas')).toHaveValue('Regar las plantas')
    })
    expect(screen.getByRole('button', { name: 'Plantas' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('editando precarga nombre y categoría y guarda con la mutación de editar (criterio 15)', async () => {
    const user = userEvent.setup()
    const { onClose } = renderSheet({ activity: buildActivity() })

    expect(screen.getByRole('heading', { name: 'Editar actividad' })).toBeInTheDocument()
    expect(screen.getByLabelText('Cómo la llamas')).toHaveValue('Organizar la casa')
    expect(screen.getByRole('button', { name: 'Casa' })).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByRole('button', { name: 'Yo' }))
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(createActivity.mutate).not.toHaveBeenCalled()
    expect(updateActivity.mutate).toHaveBeenCalledTimes(1)
    expect(updateActivity.mutate.mock.calls[0][0]).toEqual({
      id: 'a1',
      title: 'Organizar la casa',
      categoryId: 'yo',
    })

    expect(onClose).not.toHaveBeenCalled()
    act(() => updateActivity.mutate.mock.calls[0][1].onSuccess(buildActivity({ categoryId: 'yo' })))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('el interruptor con días crea el VidaItem y cierra después (criterio 17)', async () => {
    const user = userEvent.setup()
    const { onClose } = renderSheet()

    await user.type(screen.getByLabelText('Cómo la llamas'), 'Regar las plantas')
    await user.click(screen.getByRole('button', { name: 'Casa' }))
    await user.click(screen.getByRole('switch', { name: /Ponerla en mi plantilla/ }))
    await user.click(screen.getByRole('button', { name: 'miércoles' }))
    await user.click(screen.getByRole('button', { name: 'lunes' }))
    await user.click(screen.getByRole('button', { name: 'Crear' }))

    // Primero la actividad: la plantilla necesita su id, que aún no existe.
    expect(createActivity.mutate).toHaveBeenCalledTimes(1)
    expect(createVidaItem.mutate).not.toHaveBeenCalled()

    act(() => createActivity.mutate.mock.calls[0][1].onSuccess(buildActivity({ id: 'a9' })))

    expect(createVidaItem.mutate).toHaveBeenCalledTimes(1)
    // De lunes a domingo, no en el orden de los clics.
    expect(createVidaItem.mutate.mock.calls[0][0]).toEqual({
      activityId: 'a9',
      days: ['monday', 'wednesday'],
    })
    expect(onClose).not.toHaveBeenCalled()
    act(() => createVidaItem.mutate.mock.calls[0][1].onSuccess())
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('encendido y sin ningún día no guarda nada y dice qué falta (criterio 18)', async () => {
    const user = userEvent.setup()
    renderSheet()

    await user.type(screen.getByLabelText('Cómo la llamas'), 'Regar las plantas')
    await user.click(screen.getByRole('button', { name: 'Casa' }))
    await user.click(screen.getByRole('switch', { name: /Ponerla en mi plantilla/ }))
    await user.click(screen.getByRole('button', { name: 'Crear' }))

    // Ni la actividad sale: no se crea a medias algo que el usuario pidió entero.
    expect(createActivity.mutate).not.toHaveBeenCalled()
    expect(createVidaItem.mutate).not.toHaveBeenCalled()
    expect(screen.getByText('Marca al menos un día, o apaga el interruptor.')).toBeInTheDocument()
  })

  it('editando, los días vienen marcados y se actualiza el MISMO VidaItem (criterio 19)', async () => {
    const user = userEvent.setup()
    const { onClose } = renderSheet({ activity: buildActivity(), vidaItem: buildVidaItem() })

    expect(screen.getByRole('switch', { name: /Ponerla en mi plantilla/ })).toBeChecked()
    expect(screen.getByRole('button', { name: 'lunes' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'miércoles' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'viernes' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'martes' })).toHaveAttribute('aria-pressed', 'false')

    await user.click(screen.getByRole('button', { name: 'martes' }))
    await user.click(screen.getByRole('button', { name: 'viernes' }))
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    act(() => updateActivity.mutate.mock.calls[0][1].onSuccess(buildActivity()))

    expect(createVidaItem.mutate).not.toHaveBeenCalled()
    expect(updateVidaItem.mutate).toHaveBeenCalledTimes(1)
    expect(updateVidaItem.mutate.mock.calls[0][0]).toEqual({
      id: 'v1',
      days: ['monday', 'tuesday', 'wednesday'],
      isActive: true,
    })
    act(() => updateVidaItem.mutate.mock.calls[0][1].onSuccess())
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('apagando el interruptor lo desactiva en vez de borrarlo (criterio 20)', async () => {
    const user = userEvent.setup()
    renderSheet({ activity: buildActivity(), vidaItem: buildVidaItem() })

    await user.click(screen.getByRole('switch', { name: /Ponerla en mi plantilla/ }))
    // Apagado, la fila de días desaparece: no hay nada que marcar.
    expect(screen.queryByRole('button', { name: 'lunes' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Guardar' }))
    act(() => updateActivity.mutate.mock.calls[0][1].onSuccess(buildActivity()))

    // Ni `days` ni `notes` viajan: se quedan como estaban en el servidor.
    expect(updateVidaItem.mutate.mock.calls[0][0]).toEqual({ id: 'v1', isActive: false })
  })

  it('un VidaItem desactivado se reactiva, no se duplica (criterios 19 y 20)', async () => {
    const user = userEvent.setup()
    renderSheet({
      activity: buildActivity(),
      vidaItem: buildVidaItem({ isActive: false }),
    })

    // Desactivado es «no está en la plantilla»: el interruptor nace apagado.
    expect(screen.getByRole('switch', { name: /Ponerla en mi plantilla/ })).not.toBeChecked()

    await user.click(screen.getByRole('switch', { name: /Ponerla en mi plantilla/ }))
    // Y sus días siguen ahí: lo que se desactivó no se perdió.
    expect(screen.getByRole('button', { name: 'lunes' })).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByRole('button', { name: 'Guardar' }))
    act(() => updateActivity.mutate.mock.calls[0][1].onSuccess(buildActivity()))

    expect(createVidaItem.mutate).not.toHaveBeenCalled()
    expect(updateVidaItem.mutate.mock.calls[0][0]).toEqual({
      id: 'v1',
      days: ['monday', 'wednesday', 'friday'],
      isActive: true,
    })
  })

  it('si falla la plantilla la hoja no se cierra y no miente sobre la actividad (criterio 16)', async () => {
    const user = userEvent.setup()
    updateVidaItem.isError = true
    const { onClose } = renderSheet({ activity: buildActivity(), vidaItem: buildVidaItem() })

    await user.click(screen.getByRole('button', { name: 'martes' }))
    await user.click(screen.getByRole('button', { name: 'Guardar' }))
    act(() => updateActivity.mutate.mock.calls[0][1].onSuccess(buildActivity()))

    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByText(/Guardamos la actividad, pero no pudimos poner los días/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'martes' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('las categorías cargando, vacías, con error y sin sesión se ven distintas', async () => {
    const user = userEvent.setup()

    categories = []
    categoriesQuery = { isPending: true, isError: false, fetchStatus: 'fetching', refetch: vi.fn() }
    const cargando = renderSheet()
    expect(screen.getByText('Cargando tus categorías…')).toBeInTheDocument()
    cargando.unmount()

    categoriesQuery = { isPending: true, isError: false, fetchStatus: 'idle', refetch: vi.fn() }
    const sinSesion = renderSheet()
    expect(screen.getByText('Entra en tu cuenta para ver tus categorías.')).toBeInTheDocument()
    sinSesion.unmount()

    const refetch = vi.fn()
    categoriesQuery = { isPending: false, isError: true, fetchStatus: 'idle', refetch }
    const conError = renderSheet()
    expect(screen.getByText(/No pudimos cargar tus categorías/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(refetch).toHaveBeenCalledTimes(1)
    conError.unmount()

    categoriesQuery = { isPending: false, isError: false, fetchStatus: 'idle', refetch: vi.fn() }
    renderSheet()
    expect(screen.getByText('Todavía no tienes ninguna: créala con «+ nueva».')).toBeInTheDocument()
    // La salida existe en los cuatro casos.
    expect(screen.getByRole('button', { name: '+ nueva' })).toBeInTheDocument()
  })

  it('con la plantilla en vuelo no se puede tocar ni guardar, y al llegar se pone sola', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    // El hueco real: la página ya pinta el catálogo con las actividades y la
    // plantilla todavía viaja, así que `vidaItem` llega `null` por no saberse.
    const { rerender } = renderWithProviders(
      <VidaActivitySheet
        open
        onClose={onClose}
        activity={buildActivity()}
        vidaItem={null}
        isTemplatePending
      />,
    )

    expect(screen.queryByRole('switch')).not.toBeInTheDocument()
    expect(screen.getByText('Mirando si ya está en tu plantilla…')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled()

    // Aunque alguien fuerce el clic, no sale nada hacia la API.
    await user.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(updateActivity.mutate).not.toHaveBeenCalled()
    expect(updateVidaItem.mutate).not.toHaveBeenCalled()

    // Llega la plantilla: la hoja se pone en su sitio sin remontarse.
    rerender(
      <VidaActivitySheet
        open
        onClose={onClose}
        activity={buildActivity()}
        vidaItem={buildVidaItem()}
        isTemplatePending={false}
      />,
    )

    expect(screen.getByRole('switch', { name: /Ponerla en mi plantilla/ })).toBeChecked()
    expect(screen.getByRole('button', { name: 'lunes' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeEnabled()

    // Y guardar ya no desactiva nada que el usuario no haya tocado: sin cambios
    // no viaja ninguna mutación de plantilla.
    await user.click(screen.getByRole('button', { name: 'Guardar' }))
    act(() => updateActivity.mutate.mock.calls[0][1].onSuccess(buildActivity()))
    expect(updateVidaItem.mutate).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('lo que el usuario toca manda sobre lo que llegue después', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const { rerender } = renderWithProviders(
      <VidaActivitySheet open onClose={onClose} activity={buildActivity()} vidaItem={null} />,
    )

    await user.click(screen.getByRole('switch', { name: /Ponerla en mi plantilla/ }))
    await user.click(screen.getByRole('button', { name: 'jueves' }))

    // Una revalidación que devuelve otra cosa no le pisa la decisión.
    rerender(
      <VidaActivitySheet
        open
        onClose={onClose}
        activity={buildActivity()}
        vidaItem={buildVidaItem()}
      />,
    )

    expect(screen.getByRole('button', { name: 'jueves' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'lunes' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('creando, la plantilla en vuelo no bloquea nada: no hay nada que saber', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <VidaActivitySheet open onClose={vi.fn()} vidaItem={null} isTemplatePending />,
    )

    expect(screen.getByRole('switch', { name: /Ponerla en mi plantilla/ })).toBeInTheDocument()
    await user.type(screen.getByLabelText('Cómo la llamas'), 'Regar las plantas')
    await user.click(screen.getByRole('button', { name: 'Casa' }))
    await user.click(screen.getByRole('button', { name: 'Crear' }))

    expect(createActivity.mutate).toHaveBeenCalledTimes(1)
  })

  it('no dice ni una palabra de culpa ni de gestión de proyectos (criterio 34)', () => {
    renderSheet()
    const text = (document.body.textContent ?? '').toLowerCase()

    for (const word of ['pendiente', 'prioridad', 'vencida', 'fallaste', 'cancelad', 'tarea']) {
      expect(text).not.toContain(word)
    }
  })
})
