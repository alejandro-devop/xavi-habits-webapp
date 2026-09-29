import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CreateHabitCategoryStep } from '@/features/habits/components/CreateHabitCategoryStep'
import type { HabitCategory } from '@/features/habits/types/habit.types'
import { CORE_COLORS, PALETTE_COLORS } from '@/shared/ui/ColorPicker/color-palette'
import type * as SteppedModalModule from '@/shared/ui/SteppedModal'
import { renderWithProviders } from '@/test/render'

/**
 * FEAT-026 tajada 2: el paso «+ nueva categoría» del asistente de crear hábito
 * elige el color en la paleta y nace con uno del núcleo que no repite el de
 * otra categoría de hábitos, a prueba de montaje en frío.
 *
 * El mock lista **los dos hooks** que el paso usa y **relee** `categoriesData`
 * en cada render: así el caso frío es de verdad una lista que llega después
 * del montaje, no datos síncronos. Si un día el paso usa otro hook de este
 * módulo, que reviente aquí y no pase en verde por casualidad.
 */

let categoriesData: HabitCategory[] | undefined
let createMutation: { mutate: ReturnType<typeof vi.fn>; isPending: boolean }
const pop = vi.fn()

vi.mock('@/features/habits/hooks/useHabitCategories', () => ({
  useHabitCategoriesQuery: () => ({ data: categoriesData }),
  useCreateHabitCategoryMutation: () => createMutation,
}))

vi.mock('@/shared/ui/SteppedModal', async (importOriginal) => ({
  ...(await importOriginal<typeof SteppedModalModule>()),
  useModalStep: () => ({ push: vi.fn(), pop }),
}))

const [MINT, OLIVE, AMBER, CRIMSON, VIOLET, BLUE] = CORE_COLORS
const CORE_HEXES = CORE_COLORS.map((color) => color.hex)

function buildCategory(overrides: Partial<HabitCategory> = {}): HabitCategory {
  return {
    id: '1',
    userId: 1,
    name: 'Salud',
    description: null,
    icon: null,
    color: MINT.hex,
    orderIndex: 0,
    ...overrides,
  }
}

function colorGroup() {
  return screen.getByRole('radiogroup', { name: 'Color de la categoría' })
}

/** El hex de la muestra marcada, o `null` si no hay ninguna. */
function checkedHex(): string | null {
  const checked = within(colorGroup())
    .getAllByRole('radio')
    .filter((radio) => radio.getAttribute('aria-checked') === 'true')
  expect(checked.length).toBeLessThanOrEqual(1)
  return checked[0]?.getAttribute('data-color-swatch') ?? null
}

function lastCreatePayload() {
  return createMutation.mutate.mock.calls.at(-1)?.[0] as {
    name: string
    icon: string | null
    color: string | null
  }
}

function renderStep(props: { initialName?: string; onCreated?: (id: string) => void } = {}) {
  const onCreated = props.onCreated ?? vi.fn()
  const view = renderWithProviders(
    <CreateHabitCategoryStep onCreated={onCreated} initialName={props.initialName} />,
  )
  return { ...view, onCreated }
}

let randomSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  categoriesData = []
  createMutation = { mutate: vi.fn(), isPending: false }
  pop.mockReset()
  randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0)
})

afterEach(() => {
  randomSpy.mockRestore()
})

describe('CreateHabitCategoryStep — la paleta en lugar de la rueda', () => {
  it('no hay rueda ni campo de hex: hay el grupo de 22 muestras con sus nombres (criterios 14 y 19)', () => {
    const { container } = renderStep()

    expect(container.querySelector('input[type="color"]')).toBeNull()
    expect(screen.queryByPlaceholderText('#6366f1')).toBeNull()
    expect(screen.queryByLabelText('Selector de color')).toBeNull()

    const radios = within(colorGroup()).getAllByRole('radio')
    expect(radios).toHaveLength(22)
    expect(radios.map((radio) => radio.getAttribute('aria-label'))).toEqual(
      PALETTE_COLORS.map((color) => color.label),
    )
  })

  it('con la lista ya cargada nace marcada una del núcleo que ninguna categoría usa (criterios 14 y 2)', () => {
    categoriesData = [
      buildCategory({ id: '1', color: MINT.hex }),
      buildCategory({ id: '2', name: 'Mente', color: '#6366f1', orderIndex: 1 }),
      buildCategory({ id: '3', name: 'Casa', color: CRIMSON.hex.toUpperCase(), orderIndex: 2 }),
    ]
    renderStep()

    // Libres: Oliva, Ámbar, Violeta, Azul. `random = 0` → el primero.
    expect(checkedHex()).toBe(OLIVE.hex)
  })

  it('con el generador al otro extremo tampoco repite ninguna usada (criterio 2)', () => {
    randomSpy.mockReturnValue(0.999)
    categoriesData = [
      buildCategory({ id: '1', color: MINT.hex }),
      buildCategory({ id: '2', name: 'Casa', color: CRIMSON.hex, orderIndex: 1 }),
    ]
    renderStep()

    const picked = checkedHex()
    expect(picked).toBe(BLUE.hex)
    expect(picked).not.toBe(MINT.hex)
    expect(picked).not.toBe(CRIMSON.hex)
  })

  it('con los seis del núcleo ya usados, marca el que menos categorías tienen (criterio 3)', () => {
    randomSpy.mockReturnValue(0.5)
    categoriesData = [MINT, OLIVE, CRIMSON, VIOLET, BLUE, MINT, OLIVE, CRIMSON, VIOLET, BLUE, AMBER]
      .map((color, index) =>
        buildCategory({ id: String(index), name: `C${index}`, color: color.hex, orderIndex: index }),
      )
    renderStep()

    expect(checkedHex()).toBe(AMBER.hex)
  })

  it('sin ninguna categoría (lista llegada y vacía) marca una de los seis, sin esperar a nada (criterio 3)', () => {
    randomSpy.mockReturnValue(0.99)
    categoriesData = []
    renderStep()

    expect(checkedHex()).toBe(BLUE.hex)
    expect(randomSpy).toHaveBeenCalledTimes(1)
  })
})

describe('CreateHabitCategoryStep — lo que se ve es lo que se guarda', () => {
  it('crear sin tocar el color envía el hex de la muestra marcada, no null (criterio 15)', async () => {
    const user = userEvent.setup()
    categoriesData = [buildCategory({ color: MINT.hex })]
    renderStep()

    const picked = checkedHex()
    expect(CORE_HEXES).toContain(picked)

    await user.type(screen.getByLabelText('Nombre'), 'Lectura')
    await user.click(screen.getByRole('button', { name: 'Crear categoría' }))

    expect(createMutation.mutate).toHaveBeenCalledTimes(1)
    expect(lastCreatePayload()).toEqual({ name: 'Lectura', icon: null, color: picked })
    expect(lastCreatePayload().color).not.toBeNull()
  })

  it('elegir otra muestra la sustituye y es la que se envía; escribir el nombre no la mueve (criterio 16)', async () => {
    const user = userEvent.setup()
    categoriesData = [buildCategory({ color: MINT.hex })]
    renderStep()

    const picked = checkedHex()
    await user.type(screen.getByLabelText('Nombre'), 'Lect')
    expect(checkedHex()).toBe(picked)

    await user.click(screen.getByRole('radio', { name: 'Petróleo' }))
    const petrol = PALETTE_COLORS.find((color) => color.label === 'Petróleo')!.hex
    expect(checkedHex()).toBe(petrol)

    await user.type(screen.getByLabelText('Nombre'), 'ura')
    expect(checkedHex()).toBe(petrol)

    await user.click(screen.getByRole('button', { name: 'Crear categoría' }))
    expect(lastCreatePayload()).toMatchObject({ name: 'Lectura', color: petrol })
    // Un solo sorteo en todo el recorrido.
    expect(randomSpy).toHaveBeenCalledTimes(1)
  })

  it('mientras se crea, las muestras están deshabilitadas', () => {
    createMutation = { mutate: vi.fn(), isPending: true }
    renderStep()

    for (const radio of within(colorGroup()).getAllByRole('radio')) {
      expect(radio).toBeDisabled()
    }
  })
})

describe('CreateHabitCategoryStep — montaje en frío (criterio 17)', () => {
  it('sin lista no marca nada ni sortea; al llegar marca una, una sola vez, y no salta con un refresco', async () => {
    const user = userEvent.setup()
    // El caso frío: el paso se apila antes de que la consulta traiga nada.
    categoriesData = undefined
    const { rerender, onCreated } = renderStep()

    expect(checkedHex()).toBeNull()
    expect(randomSpy).not.toHaveBeenCalled()

    // Llega la lista **después** del montaje: el mock la relee en el render.
    categoriesData = [
      buildCategory({ id: '1', color: MINT.hex }),
      buildCategory({ id: '2', name: 'Casa', color: OLIVE.hex, orderIndex: 1 }),
    ]
    rerender(<CreateHabitCategoryStep onCreated={onCreated} />)

    const picked = checkedHex()
    expect(picked).toBe(AMBER.hex)
    expect(randomSpy).toHaveBeenCalledTimes(1)

    // Un refresco de la lista por debajo —ahora con una categoría que ya usa
    // justo el color marcado— no lo mueve ni vuelve a sortear.
    categoriesData = [
      ...categoriesData,
      buildCategory({ id: '3', name: 'Otra', color: AMBER.hex, orderIndex: 2 }),
    ]
    randomSpy.mockReturnValue(0.999)
    rerender(<CreateHabitCategoryStep onCreated={onCreated} />)
    await user.type(screen.getByLabelText('Nombre'), 'Lectura')

    expect(checkedHex()).toBe(picked)
    expect(randomSpy).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'Crear categoría' }))
    expect(lastCreatePayload().color).toBe(picked)
  })

  it('una muestra elegida a mano antes de que llegue la lista no la pisa el sorteo', async () => {
    const user = userEvent.setup()
    categoriesData = undefined
    const { rerender, onCreated } = renderStep()

    await user.click(screen.getByRole('radio', { name: 'Violeta' }))
    expect(checkedHex()).toBe(VIOLET.hex)

    categoriesData = [buildCategory({ color: VIOLET.hex })]
    rerender(<CreateHabitCategoryStep onCreated={onCreated} />)

    expect(checkedHex()).toBe(VIOLET.hex)
    expect(randomSpy).not.toHaveBeenCalled()
  })

  it('si se crea antes de que llegue la lista y sin elegir, se envía sin color: lo que se ve', async () => {
    const user = userEvent.setup()
    categoriesData = undefined
    renderStep({ initialName: 'Salud' })

    expect(checkedHex()).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Crear categoría' }))

    expect(lastCreatePayload()).toEqual({ name: 'Salud', icon: null, color: null })
  })
})

describe('CreateHabitCategoryStep — lo de siempre sigue igual (criterio 18)', () => {
  it('el nombre sugerido llega relleno, y al crear devuelve el id y vuelve al asistente', async () => {
    const user = userEvent.setup()
    categoriesData = [buildCategory({ color: MINT.hex })]
    const { onCreated } = renderStep({ initialName: 'Descanso' })

    expect(screen.getByLabelText('Nombre')).toHaveValue('Descanso')

    await user.click(screen.getByRole('button', { name: 'Crear categoría' }))
    expect(lastCreatePayload()).toMatchObject({ name: 'Descanso', color: OLIVE.hex })

    // El `onSuccess` que pasa el paso a `mutate`: deja elegida la nueva y vuelve.
    const [, options] = createMutation.mutate.mock.calls[0] as [
      unknown,
      { onSuccess: (category: { id: string }) => void },
    ]
    options.onSuccess({ id: 'c-descanso' })

    expect(onCreated).toHaveBeenCalledWith('c-descanso')
    expect(pop).toHaveBeenCalledTimes(1)
  })

  it('sin nombre no crea y lo dice en el campo', async () => {
    const user = userEvent.setup()
    renderStep()

    await user.click(screen.getByRole('button', { name: 'Crear categoría' }))

    expect(createMutation.mutate).not.toHaveBeenCalled()
    expect(screen.getByText('El nombre es obligatorio.')).toBeInTheDocument()
  })
})
