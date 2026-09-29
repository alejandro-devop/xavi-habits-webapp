import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { HabitCategoryFormValues } from '@/features/habits/types/habit-category.types'
import { PALETTE_COLORS } from '@/shared/ui/ColorPicker/color-palette'
import { renderWithProviders } from '@/test/render'
import { HabitCategoryForm } from './HabitCategoryForm'

/**
 * FEAT-026 tajada 1: el color de la categoría se elige en las 22 muestras de la
 * paleta compartida. La rueda del sistema y el campo de hex ya no están.
 */

function buildValues(overrides: Partial<HabitCategoryFormValues> = {}): HabitCategoryFormValues {
  return { name: 'Salud', description: '', icon: null, color: '#10b981', orderIndex: '0', ...overrides }
}

/** El formulario es tonto: este envoltorio hace de pantalla y guarda el estado. */
function Harness({
  initial,
  onSubmit = vi.fn(),
  loading = false,
}: {
  initial: HabitCategoryFormValues
  onSubmit?: (values: HabitCategoryFormValues) => void
  loading?: boolean
}) {
  const [values, setValues] = useState(initial)
  return (
    <HabitCategoryForm
      values={values}
      onChange={setValues}
      onSubmit={onSubmit}
      onCancel={vi.fn()}
      submitLabel="Guardar"
      loading={loading}
    />
  )
}

function colorGroup() {
  return screen.getByRole('radiogroup', { name: 'Color de la categoría' })
}

function checkedSwatches() {
  return within(colorGroup())
    .getAllByRole('radio')
    .filter((radio) => radio.getAttribute('aria-checked') === 'true')
}

describe('HabitCategoryForm — color', () => {
  it('no hay rueda ni campo de hex: hay las 22 muestras con su nombre (criterio 1)', () => {
    const { container } = renderWithProviders(<Harness initial={buildValues()} />)

    expect(container.querySelector('input[type="color"]')).toBeNull()
    expect(screen.queryByPlaceholderText('#6366f1')).toBeNull()
    expect(screen.queryByLabelText('Selector de color')).toBeNull()

    const radios = within(colorGroup()).getAllByRole('radio')
    expect(radios).toHaveLength(22)
    expect(radios.map((radio) => radio.getAttribute('aria-label'))).toEqual(
      PALETTE_COLORS.map((color) => color.label),
    )
  })

  it('un color de fuera de la paleta sale primero como «Color actual», marcado (criterio 7)', () => {
    renderWithProviders(<Harness initial={buildValues({ color: '#6366f1' })} />)

    const radios = within(colorGroup()).getAllByRole('radio')
    expect(radios).toHaveLength(23)
    expect(radios[0]).toHaveAccessibleName('Color actual')
    expect(checkedSwatches()).toEqual([radios[0]])
  })

  it('sin color no marca ninguna muestra (criterio 8)', () => {
    renderWithProviders(<Harness initial={buildValues({ color: null })} />)
    expect(checkedSwatches()).toHaveLength(0)
  })

  it('escribir el nombre, la descripción o el orden no mueve el color (criterio 5)', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    renderWithProviders(
      <Harness initial={buildValues({ name: '', color: '#f59e0b' })} onSubmit={onSubmit} />,
    )

    await user.type(screen.getByLabelText('Nombre'), 'Mente')
    await user.type(screen.getByLabelText('Descripción'), 'Leer y pensar')
    await user.clear(screen.getByLabelText('Orden'))
    await user.type(screen.getByLabelText('Orden'), '4')

    expect(checkedSwatches().map((radio) => radio.getAttribute('aria-label'))).toEqual(['Ámbar'])
    await user.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: 'Mente', color: '#f59e0b' }))
  })

  it('elegir otra muestra la sustituye y es la que se envía (criterio 6)', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    renderWithProviders(<Harness initial={buildValues({ color: '#6366f1' })} onSubmit={onSubmit} />)

    await user.click(screen.getByRole('radio', { name: 'Petróleo' }))

    expect(checkedSwatches().map((radio) => radio.getAttribute('aria-label'))).toEqual(['Petróleo'])
    await user.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ color: '#186068' }))
  })

  it('mientras se guarda, las muestras están deshabilitadas (criterio 11)', () => {
    renderWithProviders(<Harness initial={buildValues()} loading />)
    for (const radio of within(colorGroup()).getAllByRole('radio')) {
      expect(radio).toBeDisabled()
    }
  })

  it('entrar al grupo cuesta un tabulador y se recorre con flechas, Inicio y Fin (criterio 13)', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Harness initial={buildValues({ color: '#4d7c0f' })} />)

    const tabbable = within(colorGroup())
      .getAllByRole('radio')
      .filter((radio) => radio.tabIndex === 0)
    expect(tabbable.map((radio) => radio.getAttribute('aria-label'))).toEqual(['Oliva'])

    const olive = screen.getByRole('radio', { name: 'Oliva' })
    olive.focus()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('radio', { name: 'Ámbar' })).toHaveFocus()
    expect(screen.getByRole('radio', { name: 'Ámbar' })).toHaveAttribute('aria-checked', 'true')

    await user.keyboard('{End}')
    expect(screen.getByRole('radio', { name: PALETTE_COLORS.at(-1)!.label })).toHaveFocus()

    await user.keyboard('{Home}')
    expect(screen.getByRole('radio', { name: 'Menta' })).toHaveFocus()
    expect(screen.getByRole('radio', { name: 'Menta' })).toHaveAttribute('aria-checked', 'true')
  })
})
