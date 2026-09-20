import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { VidaActividadesPage } from '@/features/vida/pages/VidaActividadesPage'
import type { ActivityCategory } from '@/features/vida/types/activity-category.types'
import type { Activity } from '@/features/vida/types/activity.types'
import type { VidaItem } from '@/features/vida/types/vida-item.types'
import { renderWithProviders } from '@/test/render'

/**
 * Molde de `src/features/habits/pages/HabitsListPage.test.tsx`: los hooks de
 * datos se mockean y la pantalla se monta con `renderWithProviders`. Lo que se
 * comprueba aquí son los criterios 1, 2, 4, 5, 28, 29, 30, 32 y 34 de la
 * sección 1 del dossier de FEAT-002.
 */

type QueryState = {
  data?: unknown
  isPending: boolean
  fetchStatus: 'fetching' | 'idle' | 'paused'
  isError: boolean
  refetch: () => void
}

const refetch = vi.fn()

/** La hoja se monta con la pantalla: sus mutaciones no hacen nada aquí. */
function buildMutation() {
  return { mutate: vi.fn(), reset: vi.fn(), isPending: false, isError: false }
}
let sheetMutation: ReturnType<typeof buildMutation>

let activitiesState: QueryState
let categoriesState: { data: ActivityCategory[] }
let vidaItemsState: { data: VidaItem[]; isPending: boolean; fetchStatus: string }
let vidaItemsQueryArgs: unknown[][]

vi.mock('@/features/vida/hooks/useActivities', () => ({
  useActivitiesQuery: () => activitiesState,
  useCreateActivityMutation: () => sheetMutation,
  useUpdateActivityMutation: () => sheetMutation,
}))
vi.mock('@/features/vida/hooks/useActivityCategories', () => ({
  useActivityCategoriesQuery: () => categoriesState,
  useCreateActivityCategoryMutation: () => sheetMutation,
}))
vi.mock('@/features/vida/hooks/useVidaItems', () => ({
  // Se guarda el argumento: si alguien quita el `includeInactive`, el test se
  // entera (la hoja dejaría de ver los `VidaItem` desactivados).
  useVidaItemsQuery: (...args: unknown[]) => {
    vidaItemsQueryArgs.push(args)
    return vidaItemsState
  },
  // La hoja las pide para el bloque de plantilla (tajada 3): aquí no mutan nada.
  useCreateVidaItemMutation: () => sheetMutation,
  useUpdateVidaItemMutation: () => sheetMutation,
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

const categories = [
  buildCategory(),
  buildCategory({ id: 'yo', name: 'Yo', icon: 'spa', color: '#0284c7', orderIndex: 1 }),
]

const activities = [
  buildActivity({ id: 'a1', title: 'Organizar la casa', categoryId: 'casa' }),
  buildActivity({ id: 'a2', title: 'Poner una lavadora', categoryId: 'casa' }),
  buildActivity({ id: 'a3', title: 'Bañarme', categoryId: 'yo' }),
  buildActivity({ id: 'a4', title: 'Llamar a alguien', categoryId: null }),
]

function loaded(list: Activity[] = activities, total = list.length): QueryState {
  return {
    data: { activities: list, page: 1, limit: 200, total },
    isPending: false,
    fetchStatus: 'idle',
    isError: false,
    refetch,
  }
}

beforeEach(() => {
  refetch.mockReset()
  sheetMutation = buildMutation()
  activitiesState = loaded()
  categoriesState = { data: categories }
  vidaItemsState = { data: [], isPending: false, fetchStatus: 'idle' }
  vidaItemsQueryArgs = []
})

function groupHeadings() {
  return screen.getAllByRole('heading', { level: 2 })
}

describe('VidaActividadesPage', () => {
  it('agrupa por categoría, con su nombre, su color y cuántas tiene (criterio 1)', () => {
    const { container } = renderWithProviders(<VidaActividadesPage />)

    const casa = screen.getByRole('heading', { level: 2, name: /Casa/ })
    expect(casa).toHaveTextContent('2 actividades')
    expect(casa.closest('section')?.getAttribute('style')).toContain(
      '--vida-category-color: #8b5cf6',
    )

    const casaCards = within(casa.closest('section')!).getAllByRole('article')
    expect(casaCards.map((card) => card.textContent)).toEqual([
      expect.stringContaining('Organizar la casa'),
      expect.stringContaining('Poner una lavadora'),
    ])
    expect(container.querySelectorAll('article')).toHaveLength(activities.length)
  })

  it('la actividad sin categoría va a «Sin categoría», y va la última (criterio 2)', () => {
    renderWithProviders(<VidaActividadesPage />)

    const names = groupHeadings().map((heading) => heading.textContent ?? '')
    expect(names.at(-1)).toContain('Sin categoría')
    expect(names.filter((name) => name.includes('Sin categoría'))).toHaveLength(1)

    const uncategorized = screen.getByRole('heading', { level: 2, name: /Sin categoría/ })
    expect(within(uncategorized.closest('section')!).getByText('Llamar a alguien')).toBeInTheDocument()
  })

  it('la línea dice «N actividades · M categorías» y cuadra con lo pintado (criterio 4)', () => {
    renderWithProviders(<VidaActividadesPage />)

    // Cuatro actividades; «Sin categoría» no es una categoría, son dos.
    expect(screen.getByText('4 actividades · 2 categorías')).toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(4)
    expect(groupHeadings()).toHaveLength(3)
  })

  it('las archivadas no se pintan ni cuentan en la línea', () => {
    activitiesState = loaded(
      [...activities, buildActivity({ id: 'a5', title: 'Ir al gimnasio', status: 'cancelled' })],
      5,
    )
    renderWithProviders(<VidaActividadesPage />)

    expect(screen.queryByText('Ir al gimnasio')).not.toBeInTheDocument()
    expect(screen.getByText('4 actividades · 2 categorías')).toBeInTheDocument()
  })

  it('el buscador filtra sin tildes y esconde los grupos vacíos (criterio 5)', async () => {
    const user = userEvent.setup()
    renderWithProviders(<VidaActividadesPage />)

    await user.type(screen.getByLabelText('Buscar actividades'), 'banar')

    expect(screen.getByText('Bañarme')).toBeInTheDocument()
    expect(screen.queryByText('Organizar la casa')).not.toBeInTheDocument()
    expect(groupHeadings().map((heading) => heading.textContent)).toEqual([
      expect.stringContaining('Yo'),
    ])
  })

  it('sin resultados lo dice con el texto buscado y deja limpiar (criterio 5)', async () => {
    const user = userEvent.setup()
    renderWithProviders(<VidaActividadesPage />)

    await user.type(screen.getByLabelText('Buscar actividades'), 'zzz')

    expect(screen.getByText('Sin resultados para “zzz”')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Limpiar búsqueda' }))

    expect(screen.getByText('Organizar la casa')).toBeInTheDocument()
    expect(screen.getByLabelText('Buscar actividades')).toHaveValue('')
  })

  it('cargando enseña el esqueleto y nunca los puntos de partida (criterio 28)', () => {
    activitiesState = {
      data: undefined,
      isPending: true,
      fetchStatus: 'fetching',
      isError: false,
      refetch,
    }
    const { container } = renderWithProviders(<VidaActividadesPage />)

    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Crear las/ })).not.toBeInTheDocument()
    expect(screen.queryByText(/Toca las tuyas/)).not.toBeInTheDocument()
  })

  it('sin sesión no gira para siempre: dice cómo entrar (criterio 29)', () => {
    // El guard deshabilita la consulta: `isPending` con `fetchStatus: 'idle'`.
    activitiesState = {
      data: undefined,
      isPending: true,
      fetchStatus: 'idle',
      isError: false,
      refetch,
    }
    const { container } = renderWithProviders(<VidaActividadesPage />)

    expect(screen.getByText('Entra para ver tus actividades')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toBeInTheDocument()
    expect(container.querySelector('[aria-busy="true"]')).not.toBeInTheDocument()
  })

  it('el error se lee en cristiano y el botón vuelve a pedir los datos (criterio 30)', async () => {
    const user = userEvent.setup()
    activitiesState = {
      data: undefined,
      isPending: false,
      fetchStatus: 'idle',
      isError: true,
      refetch,
    }
    renderWithProviders(<VidaActividadesPage />)

    expect(screen.getByText('No pudimos cargar tus actividades')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('con cero actividades salen los puntos de partida, no una lista vacía (criterio 6)', () => {
    activitiesState = loaded([], 0)
    renderWithProviders(<VidaActividadesPage />)

    expect(screen.getByRole('button', { name: /Crear las 6/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Bañarme/ })).toBeInTheDocument()
    expect(screen.queryByLabelText('Buscar actividades')).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('el FAB «+» abre la hoja de crear, vacía (criterios 12 y 13)', async () => {
    const user = userEvent.setup()
    renderWithProviders(<VidaActividadesPage />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Nueva actividad' }))

    const sheet = await screen.findByRole('dialog', { name: /Nueva actividad/ })
    expect(within(sheet).getByRole('heading', { name: 'Nueva actividad' })).toBeInTheDocument()
    expect(within(sheet).getByLabelText('Cómo la llamas')).toHaveValue('')
  })

  it('el «···» de una tarjeta abre la misma hoja ya rellena (criterio 15)', async () => {
    const user = userEvent.setup()
    renderWithProviders(<VidaActividadesPage />)

    await user.click(screen.getByRole('button', { name: 'Más opciones de Bañarme' }))
    await user.click(screen.getByRole('button', { name: 'Editar' }))

    // El «···» es un `Popover`, que también es `dialog`: se busca por nombre.
    const sheet = await screen.findByRole('dialog', { name: /Editar actividad/ })
    expect(within(sheet).getByRole('heading', { name: 'Editar actividad' })).toBeInTheDocument()
    expect(within(sheet).getByLabelText('Cómo la llamas')).toHaveValue('Bañarme')
    expect(within(sheet).getByRole('button', { name: 'Yo' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('la hoja de editar recibe el VidaItem de esa actividad, con sus días (criterio 19)', async () => {
    const user = userEvent.setup()
    vidaItemsState = {
      data: [
        {
          id: 'v1',
          userId: 1,
          activityId: 'a3',
          days: ['monday', 'friday'],
          notes: null,
          isActive: true,
          orderIndex: 0,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      isPending: false,
      fetchStatus: 'idle',
    }
    renderWithProviders(<VidaActividadesPage />)

    await user.click(screen.getByRole('button', { name: 'Más opciones de Bañarme' }))
    await user.click(screen.getByRole('button', { name: 'Editar' }))

    const sheet = await screen.findByRole('dialog', { name: /Editar actividad/ })
    expect(
      within(sheet).getByRole('switch', { name: /Ponerla en mi plantilla/ }),
    ).toBeChecked()
    expect(within(sheet).getByRole('button', { name: 'lunes' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(within(sheet).getByRole('button', { name: 'martes' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('mientras la plantilla está en vuelo, ninguna tarjeta afirma «sin plantilla»', () => {
    vidaItemsState = { data: [], isPending: true, fetchStatus: 'fetching' }
    renderWithProviders(<VidaActividadesPage />)

    // La consulta de la plantilla va por su cuenta: afirmarlo antes de que
    // llegue sería mentira durante ese hueco (hallazgo del revisor, tajada 1).
    expect(screen.queryByText('sin plantilla')).not.toBeInTheDocument()
    expect(screen.getAllByText('Cargando tu plantilla…')).toHaveLength(activities.length)
  })

  it('sin sesión la plantilla no llega nunca y la tarjeta sí lo dice', () => {
    vidaItemsState = { data: [], isPending: true, fetchStatus: 'idle' }
    renderWithProviders(<VidaActividadesPage />)

    expect(screen.getAllByText('sin plantilla')).toHaveLength(activities.length)
  })

  it('pide la plantilla con los desactivados incluidos (includeInactive)', () => {
    renderWithProviders(<VidaActividadesPage />)

    // Sin esto, apagar el interruptor y volver a encenderlo crearía un segundo
    // `VidaItem` y la nota del primero quedaría enterrada (criterios 19 y 20).
    expect(vidaItemsQueryArgs.length).toBeGreaterThan(0)
    expect(vidaItemsQueryArgs[0]).toEqual([true])
  })

  it('un VidaItem desactivado no pinta casillas: la tarjeta dice «sin plantilla»', () => {
    vidaItemsState = {
      data: [
        {
          id: 'v1',
          userId: 1,
          activityId: 'a3',
          days: ['monday', 'friday'],
          notes: 'Con calma',
          isActive: false,
          orderIndex: 0,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      isPending: false,
      fetchStatus: 'idle',
    }
    renderWithProviders(<VidaActividadesPage />)

    expect(screen.queryByLabelText(/En tu plantilla/)).not.toBeInTheDocument()
    expect(screen.getAllByText('sin plantilla')).toHaveLength(activities.length)
  })

  it('editar mientras la plantilla viaja no deja guardar (y no desactiva nada)', async () => {
    const user = userEvent.setup()
    vidaItemsState = { data: [], isPending: true, fetchStatus: 'fetching' }
    renderWithProviders(<VidaActividadesPage />)

    await user.click(screen.getByRole('button', { name: 'Más opciones de Bañarme' }))
    await user.click(screen.getByRole('button', { name: 'Editar' }))

    const sheet = await screen.findByRole('dialog', { name: /Editar actividad/ })
    expect(within(sheet).getByText('Mirando si ya está en tu plantilla…')).toBeInTheDocument()
    expect(within(sheet).queryByRole('switch')).not.toBeInTheDocument()
    expect(within(sheet).getByRole('button', { name: 'Guardar' })).toBeDisabled()
  })

  it('un nombre de 60 y una categoría de 40 no rompen la pantalla (criterio 32)', () => {
    const longTitle = 'Organizar la casa entera de arriba abajo un sábado cualquiera'
    const longCategory = 'Cosas de la casa que nadie quiere hacer hoy'
    expect(longTitle.length).toBeGreaterThanOrEqual(60)
    expect(longCategory.length).toBeGreaterThanOrEqual(40)

    categoriesState = { data: [buildCategory({ name: longCategory })] }
    activitiesState = loaded([buildActivity({ title: longTitle })])
    renderWithProviders(<VidaActividadesPage />)

    expect(screen.getByText(longTitle)).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: new RegExp(longCategory) })).toBeInTheDocument()
  })

  it('el recuento sigue a la búsqueda: cuenta lo que se ve (criterio 4)', async () => {
    const user = userEvent.setup()
    renderWithProviders(<VidaActividadesPage />)
    expect(screen.getByText('4 actividades · 2 categorías')).toBeInTheDocument()

    await user.type(screen.getByRole('searchbox', { name: 'Buscar actividades' }), 'banar')

    expect(screen.getByText('1 actividad · 1 categoría')).toBeInTheDocument()
  })

  it('lleva a categorías y a las archivadas (criterios 24 y 27)', () => {
    renderWithProviders(<VidaActividadesPage />)

    expect(screen.getByRole('link', { name: 'Categorías ›' })).toHaveAttribute(
      'href',
      '/app/vida/categorias',
    )
    expect(screen.getByRole('link', { name: 'Ver archivadas' })).toHaveAttribute(
      'href',
      '/app/vida/actividades/archivadas',
    )
  })

  it('el acceso a las archivadas también está en el primer minuto', () => {
    // Quien archiva todo su catálogo vuelve a ver los puntos de partida: sin
    // este enlace se quedaría sin manera de recuperar lo suyo.
    activitiesState = loaded([])
    renderWithProviders(<VidaActividadesPage />)

    expect(screen.getByRole('link', { name: 'Ver archivadas' })).toBeInTheDocument()
  })

  it('no hay ni una palabra de culpa ni de gestión de proyectos (criterio 34)', () => {
    const { container } = renderWithProviders(<VidaActividadesPage />)
    const text = (container.textContent ?? '').toLowerCase()

    for (const word of [
      'pendiente',
      'prioridad',
      'vencida',
      'atrasad',
      'fallaste',
      'incumpl',
      'desperdici',
      'cancelad',
      'eliminar',
      'tarea',
    ]) {
      expect(text).not.toContain(word)
    }
  })
})
