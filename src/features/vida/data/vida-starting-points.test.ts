import { describe, expect, it } from 'vitest'
import {
  findStartingCategory,
  getRecommendedStartingPointIds,
  VIDA_STARTING_CATEGORIES,
  VIDA_STARTING_POINTS,
} from '@/features/vida/data/vida-starting-points'
import { appIcons } from '@/shared/icons/app-icons'
import { CORE_COLORS } from '@/shared/ui/ColorPicker'

const catalogNames = new Set(appIcons.map((entry) => entry.name))

/**
 * `appIcons` arrastra las 850 entradas del catálogo: se importa **solo aquí**,
 * en un test. Ningún archivo de producción de Vida lo toca (criterio 35).
 */

describe('VIDA_STARTING_POINTS', () => {
  it('trae al menos las trece del render, con icono y categoría', () => {
    expect(VIDA_STARTING_POINTS.length).toBeGreaterThanOrEqual(13)
    for (const point of VIDA_STARTING_POINTS) {
      expect(point.title.trim()).not.toBe('')
      expect(point.icon.trim()).not.toBe('')
      expect(findStartingCategory(point.categoryName)).toBeDefined()
    }
  })

  it('nombra las trece del render', () => {
    expect(VIDA_STARTING_POINTS.map((point) => point.title)).toEqual([
      'Bañarme',
      'Lavarme los dientes',
      'Pasear a las mascotas',
      'Organizar la casa',
      'Desayunar con calma',
      'Cocinar',
      'Poner una lavadora',
      'Leer un rato',
      'Descansar',
      'Compra de la semana',
      'Llamar a alguien',
      'Salir a caminar',
      'Dormir la siesta',
    ])
  })

  it('no repite ids', () => {
    const ids = VIDA_STARTING_POINTS.map((point) => point.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('viene con seis marcadas, como el render', () => {
    expect(getRecommendedStartingPointIds()).toHaveLength(6)
  })

  it('cada icono existe en el catálogo de @/shared/icons', () => {
    const missing = VIDA_STARTING_POINTS.filter((point) => !catalogNames.has(point.icon)).map(
      (point) => `${point.title} → ${point.icon}`,
    )
    expect(missing).toEqual([])
  })
})

describe('VIDA_STARTING_CATEGORIES', () => {
  it('son las cuatro del render, en su orden', () => {
    expect(VIDA_STARTING_CATEGORIES.map((category) => category.name)).toEqual([
      'Casa',
      'Mascotas',
      'Yo',
      'Comida',
    ])
  })

  it('cada icono existe en el catálogo de @/shared/icons', () => {
    const missing = VIDA_STARTING_CATEGORIES.filter(
      (category) => !catalogNames.has(category.icon),
    ).map((category) => `${category.name} → ${category.icon}`)
    expect(missing).toEqual([])
  })

  it('usa exactamente los colores del núcleo de la paleta: violeta, ámbar, azul y menta', () => {
    const coreByName = new Map(CORE_COLORS.map((color) => [color.name, color.hex]))

    expect(VIDA_STARTING_CATEGORIES.map((category) => category.color)).toEqual([
      coreByName.get('violet'),
      coreByName.get('amber'),
      coreByName.get('blue'),
      coreByName.get('mint'),
    ])
  })
})
