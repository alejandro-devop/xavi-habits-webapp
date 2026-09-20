import { describe, expect, it } from 'vitest'
import type { ActivityCategory } from '@/features/vida/types/activity-category.types'
import type { Activity } from '@/features/vida/types/activity.types'
import type { VidaItem } from '@/features/vida/types/vida-item.types'
import {
  buildVidaItemsByActivity,
  countCatalogCategories,
  excludeArchivedActivities,
  findVidaItemForActivity,
  groupActivitiesByCategory,
  UNCATEGORIZED_GROUP_ID,
} from '@/features/vida/utils/vida-catalog.utils'

function buildActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: 'a1',
    userId: 1,
    title: 'Bañarme',
    description: null,
    status: 'pending',
    priority: 'medium',
    categoryId: 'yo',
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
    id: 'yo',
    userId: 1,
    orderIndex: 0,
    name: 'Yo',
    description: null,
    icon: 'spa',
    color: '#0284c7',
    ...overrides,
  }
}

function buildVidaItem(overrides: Partial<VidaItem> = {}): VidaItem {
  return {
    id: 'v1',
    userId: 1,
    activityId: 'a1',
    days: ['monday', 'wednesday'],
    notes: null,
    isActive: true,
    orderIndex: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

const categories = [
  buildCategory(),
  buildCategory({ id: 'casa', name: 'Casa', orderIndex: 1, icon: 'house-chimney' }),
]

describe('excludeArchivedActivities', () => {
  it('deja fuera las archivadas y respeta el resto de estados', () => {
    const activities = [
      buildActivity({ id: 'a1' }),
      buildActivity({ id: 'a2', status: 'cancelled' }),
      buildActivity({ id: 'a3', status: 'completed' }),
    ]

    expect(excludeArchivedActivities(activities).map((a) => a.id)).toEqual(['a1', 'a3'])
  })
})

describe('buildVidaItemsByActivity', () => {
  it('indexa por actividad y descarta los desactivados', () => {
    const items = [
      buildVidaItem(),
      buildVidaItem({ id: 'v2', activityId: 'a2', isActive: false }),
    ]
    const byActivity = buildVidaItemsByActivity(items)

    expect(byActivity.get('a1')?.days).toEqual(['monday', 'wednesday'])
    expect(byActivity.has('a2')).toBe(false)
  })
})

describe('findVidaItemForActivity', () => {
  it('prefiere el activo cuando la actividad tiene dos', () => {
    const items = [
      buildVidaItem({ id: 'viejo', isActive: false }),
      buildVidaItem({ id: 'vivo', isActive: true }),
    ]

    expect(findVidaItemForActivity(items, 'a1')?.id).toBe('vivo')
  })

  it('devuelve el desactivado si es el único: es lo que evita crear un segundo', () => {
    const items = [buildVidaItem({ id: 'dormido', isActive: false })]

    expect(findVidaItemForActivity(items, 'a1')?.id).toBe('dormido')
    expect(findVidaItemForActivity(items, 'otra')).toBeNull()
  })
})

describe('groupActivitiesByCategory', () => {
  it('agrupa por categoría, ordena grupos por orderIndex y actividades por nombre', () => {
    const groups = groupActivitiesByCategory(
      [
        buildActivity({ id: 'a1', title: 'Organizar la casa', categoryId: 'casa' }),
        buildActivity({ id: 'a2', title: 'Bañarme', categoryId: 'yo' }),
        buildActivity({ id: 'a3', title: 'Compra de la semana', categoryId: 'casa' }),
      ],
      categories,
    )

    expect(groups.map((group) => group.name)).toEqual(['Yo', 'Casa'])
    expect(groups[1]?.activities.map((activity) => activity.title)).toEqual([
      'Compra de la semana',
      'Organizar la casa',
    ])
    expect(groups[0]?.color).toBe('#0284c7')
    expect(groups[0]?.icon).toBe('spa')
  })

  it('pone «Sin categoría» al final, con icono neutro y sin color', () => {
    const groups = groupActivitiesByCategory(
      [
        buildActivity({ id: 'a1', title: 'Fregar los platos', categoryId: null, category: null }),
        buildActivity({ id: 'a2', title: 'Bañarme', categoryId: 'yo' }),
      ],
      categories,
    )

    expect(groups.map((group) => group.id)).toEqual(['yo', UNCATEGORIZED_GROUP_ID])
    const uncategorized = groups[1]!
    expect(uncategorized.name).toBe('Sin categoría')
    expect(uncategorized.color).toBeNull()
    expect(uncategorized.icon).toBe('circle-dot')
    expect(uncategorized.activities).toHaveLength(1)
  })

  it('no pierde una actividad cuya categoría no está en el catálogo', () => {
    const groups = groupActivitiesByCategory(
      [buildActivity({ id: 'a1', categoryId: 'borrada', category: null })],
      categories,
    )

    expect(groups).toHaveLength(1)
    expect(groups[0]?.id).toBe(UNCATEGORIZED_GROUP_ID)
  })

  it('usa la categoría que viene en la propia actividad si el catálogo aún no llegó', () => {
    const groups = groupActivitiesByCategory(
      [
        buildActivity({
          categoryId: 'yo',
          category: { id: 'yo', name: 'Yo', icon: 'spa', color: '#0284c7', orderIndex: 0 },
        }),
      ],
      [],
    )

    expect(groups[0]?.name).toBe('Yo')
    expect(groups[0]?.isUncategorized).toBe(false)
  })

  it('ordena por nombre los grupos que comparten orderIndex', () => {
    const groups = groupActivitiesByCategory(
      [
        buildActivity({ id: 'a1', categoryId: 'casa' }),
        buildActivity({ id: 'a2', categoryId: 'yo' }),
      ],
      [buildCategory({ id: 'yo', name: 'Yo' }), buildCategory({ id: 'casa', name: 'Casa' })],
    )

    expect(groups.map((group) => group.name)).toEqual(['Casa', 'Yo'])
  })
})

describe('countCatalogCategories', () => {
  it('no cuenta «Sin categoría» como una categoría', () => {
    const groups = groupActivitiesByCategory(
      [
        buildActivity({ id: 'a1', categoryId: 'yo' }),
        buildActivity({ id: 'a2', categoryId: 'casa' }),
        buildActivity({ id: 'a3', categoryId: null, category: null }),
      ],
      categories,
    )

    expect(groups).toHaveLength(3)
    expect(countCatalogCategories(groups)).toBe(2)
  })
})
