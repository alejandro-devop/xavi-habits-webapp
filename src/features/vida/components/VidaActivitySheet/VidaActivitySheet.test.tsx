import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { VidaActivitySheet } from '@/features/vida/components/VidaActivitySheet'
import type { ActivityCategory } from '@/features/vida/types/activity-category.types'
import type { Activity } from '@/features/vida/types/activity.types'
import { renderWithProviders } from '@/test/render'

/**
 * Molde de `HabitFormModal.test.tsx`: los hooks de datos se mockean y la hoja
 * se monta con `renderWithProviders`. Aquí se comprueban los criterios 12, 13,
 * 14, 15 y 16 de la sección 1 del dossier de FEAT-002.
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
let categories: ActivityCategory[]

vi.mock('@/features/vida/hooks/useActivities', () => ({
  useCreateActivityMutation: () => createActivity,
  useUpdateActivityMutation: () => updateActivity,
}))
vi.mock('@/features/vida/hooks/useActivityCategories', () => ({
  useActivityCategoriesQuery: () => ({ data: categories }),
  useCreateActivityCategoryMutation: () => createCategory,
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

beforeEach(() => {
  createActivity = buildMutation()
  updateActivity = buildMutation()
  createCategory = buildMutation()
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
    createActivity.mutate.mock.calls[0][1].onSuccess(buildActivity())
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
    createCategory.mutate.mock.calls[0][1].onSuccess({ id: 'plantas', name: 'Plantas' })

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
    updateActivity.mutate.mock.calls[0][1].onSuccess(buildActivity({ categoryId: 'yo' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('no dice ni una palabra de culpa ni de gestión de proyectos (criterio 34)', () => {
    renderSheet()
    const text = (document.body.textContent ?? '').toLowerCase()

    for (const word of ['pendiente', 'prioridad', 'vencida', 'fallaste', 'cancelad', 'tarea']) {
      expect(text).not.toContain(word)
    }
  })
})
