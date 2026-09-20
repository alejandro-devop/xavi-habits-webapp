import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { VidaActivityCard } from '@/features/vida/components/VidaActivityCard'
import type { Activity } from '@/features/vida/types/activity.types'
import type { VidaItem } from '@/features/vida/types/vida-item.types'
import { renderWithProviders } from '@/test/render'

/**
 * Las dos mutaciones de F0 que usa «Archivar» se mockean: lo que se comprueba
 * aquí es **con qué** se llaman (criterios 21 y 22), no que viajen al API. El
 * orquestador `useArchiveActivity` corre de verdad; el que no existe en el
 * mock, a propósito, es `useDeleteActivityMutation`: si alguien lo llamara, el
 * test reventaría —y eso es justamente lo que dice el criterio 21—.
 */
const updateActivity = { mutate: vi.fn(), isPending: false, isError: false }
const updateVidaItem = { mutate: vi.fn(), isPending: false, isError: false }

vi.mock('@/features/vida/hooks/useActivities', () => ({
  useUpdateActivityMutation: () => updateActivity,
}))
vi.mock('@/features/vida/hooks/useVidaItems', () => ({
  useUpdateVidaItemMutation: () => updateVidaItem,
}))

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

const vidaItem: VidaItem = {
  id: 'v1',
  userId: 1,
  activityId: 'a1',
  days: ['monday', 'wednesday', 'friday'],
  notes: null,
  isActive: true,
  orderIndex: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

function renderCard(props: Partial<Parameters<typeof VidaActivityCard>[0]> = {}) {
  return renderWithProviders(
    <VidaActivityCard
      activity={buildActivity()}
      icon="house-chimney"
      color="#8b5cf6"
      onEdit={vi.fn()}
      {...props}
    />,
  )
}

beforeEach(() => {
  updateActivity.mutate.mockReset()
  updateVidaItem.mutate.mockReset()
  // El `onSuccess` local encadena el `VidaItem`: sin esto el mock cortaría la
  // cadena y el criterio 22 no se podría comprobar.
  updateActivity.mutate.mockImplementation((_input, options) => options?.onSuccess?.())
})

/**
 * El `Popover` del «···» **también** es `role="dialog"` y se queda abierto
 * detrás del diálogo de confirmación —no expone forma de cerrarse desde su
 * contenido; el revisor de las tajadas 2 y 3 ya lo dejó anotado—. Por eso el
 * diálogo se busca por su nombre accesible y no por el rol a secas.
 */
function findConfirmDialog() {
  return screen.findByRole('dialog', { name: /Archivar/ })
}

describe('VidaActivityCard', () => {
  it('pinta siete casillas L M X J V S D y marca las del VidaItem activo', () => {
    const { container } = renderCard({ vidaItem })

    const boxes = [...container.querySelectorAll('[data-day]')]
    expect(boxes.map((box) => box.textContent)).toEqual(['L', 'M', 'X', 'J', 'V', 'S', 'D'])
    expect(boxes.filter((box) => box.getAttribute('data-on') === 'true').map((b) => b.textContent))
      .toEqual(['L', 'X', 'V'])
    expect(
      screen.getByLabelText('En tu plantilla: lunes, miércoles y viernes'),
    ).toBeInTheDocument()
  })

  it('sin VidaItem activo lee «sin plantilla» y no pinta ninguna casilla', () => {
    const { container } = renderCard({ vidaItem: null })

    expect(screen.getByText('sin plantilla')).toBeInTheDocument()
    expect(container.querySelectorAll('[data-day]')).toHaveLength(0)
  })

  it('lleva el color de la categoría al fondo del icono', () => {
    const { container } = renderCard()

    const card = container.querySelector('article')
    expect(card?.getAttribute('style')).toContain('--vida-category-color: #8b5cf6')
  })

  it('no rompe con un nombre de sesenta caracteres', () => {
    const longTitle = 'Organizar la casa entera de arriba abajo un sábado cualquiera'
    expect(longTitle.length).toBeGreaterThanOrEqual(60)
    renderCard({ activity: buildActivity({ title: longTitle }) })

    expect(screen.getByText(longTitle)).toBeInTheDocument()
  })

  it('el «···» abre «Editar» y devuelve la actividad (criterio 15)', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    renderCard({ onEdit })

    await user.click(screen.getByRole('button', { name: 'Más opciones de Organizar la casa' }))
    await user.click(screen.getByRole('button', { name: 'Editar' }))

    expect(onEdit).toHaveBeenCalledTimes(1)
    expect(onEdit.mock.calls[0][0]).toMatchObject({ id: 'a1', title: 'Organizar la casa' })
  })

  it('«Archivar» pide confirmación diciendo que se restaura y que lo registrado se conserva (criterio 21)', async () => {
    const user = userEvent.setup()
    renderCard({ vidaItem })

    await user.click(screen.getByRole('button', { name: 'Más opciones de Organizar la casa' }))
    await user.click(screen.getByRole('button', { name: 'Archivar' }))

    const dialog = await findConfirmDialog()
    expect(within(dialog).getByText('¿Archivar «Organizar la casa»?')).toBeInTheDocument()
    expect(within(dialog).getByText(/restaurarla cuando quieras/i)).toBeInTheDocument()
    expect(within(dialog).getByText(/ya registraste se conserva/i)).toBeInTheDocument()
    // Criterio 25: ni «cancelar» ni «eliminar» en todo el gesto.
    expect((dialog.textContent ?? '').toLowerCase()).not.toContain('cancelar')
    expect((dialog.textContent ?? '').toLowerCase()).not.toContain('eliminar')
    // Y no ha mutado nada todavía.
    expect(updateActivity.mutate).not.toHaveBeenCalled()
  })

  it('al confirmar archiva con status cancelled y desactiva su VidaItem (criterios 21 y 22)', async () => {
    const user = userEvent.setup()
    renderCard({ vidaItem })

    await user.click(screen.getByRole('button', { name: 'Más opciones de Organizar la casa' }))
    await user.click(screen.getByRole('button', { name: 'Archivar' }))
    const dialog = await findConfirmDialog()
    await user.click(within(dialog).getByRole('button', { name: 'Archivar' }))

    expect(updateActivity.mutate).toHaveBeenCalledTimes(1)
    expect(updateActivity.mutate.mock.calls[0][0]).toEqual({ id: 'a1', status: 'cancelled' })
    expect(updateVidaItem.mutate).toHaveBeenCalledTimes(1)
    // Desactivado, **no** borrado: sin `days` ni `notes` en el input, que es lo
    // que garantiza que no se pisan.
    expect(updateVidaItem.mutate.mock.calls[0][0]).toEqual({ id: 'v1', isActive: false })
  })

  it('si dices que no, no archiva nada', async () => {
    const user = userEvent.setup()
    renderCard({ vidaItem })

    await user.click(screen.getByRole('button', { name: 'Más opciones de Organizar la casa' }))
    await user.click(screen.getByRole('button', { name: 'Archivar' }))
    const dialog = await findConfirmDialog()
    await user.click(within(dialog).getByRole('button', { name: 'Volver' }))

    expect(updateActivity.mutate).not.toHaveBeenCalled()
    expect(updateVidaItem.mutate).not.toHaveBeenCalled()
  })

  it('sin VidaItem, archivar no toca la plantilla', async () => {
    const user = userEvent.setup()
    renderCard({ vidaItem: null })

    await user.click(screen.getByRole('button', { name: 'Más opciones de Organizar la casa' }))
    await user.click(screen.getByRole('button', { name: 'Archivar' }))
    const dialog = await findConfirmDialog()
    await user.click(within(dialog).getByRole('button', { name: 'Archivar' }))

    expect(updateActivity.mutate).toHaveBeenCalledTimes(1)
    expect(updateVidaItem.mutate).not.toHaveBeenCalled()
  })

  it('no dice ni una palabra de culpa ni de gestión de proyectos', () => {
    const { container } = renderCard({ vidaItem: null })
    const text = container.textContent ?? ''

    for (const word of ['pendiente', 'prioridad', 'vencida', 'fallaste', 'cancelada']) {
      expect(text.toLowerCase()).not.toContain(word)
    }
  })
})
