import { describe, expect, it } from 'vitest'
import { pickInitialCategoryColor } from '@/features/vida/utils/vida-category-color.utils'
import { CORE_COLORS, EXTENDED_COLORS } from '@/shared/ui/ColorPicker/color-palette'

/**
 * Calcado de `habit-colors.test.ts:138-219`: mismo molde de pruebas para el
 * mismo sorteo, porque el criterio 523 pide exactamente esos casos —sin
 * categorías, con algunas, con las seis del núcleo en uso, y con extendidos o
 * colores de fuera mezclados en el historial—.
 */

/** Generador fijo: devuelve siempre lo mismo, así el sorteo es predecible. */
function fixedRandom(value: number) {
  return () => value
}

describe('pickInitialCategoryColor', () => {
  it('sin categorías devuelve el que señale el generador (criterio 522)', () => {
    expect(pickInitialCategoryColor([], fixedRandom(0))).toBe(CORE_COLORS[0].hex)
    expect(pickInitialCategoryColor([], fixedRandom(0.99))).toBe(CORE_COLORS.at(-1)!.hex)
  })

  it('con el catálogo vacío siempre sale uno de los seis del núcleo (criterio 522)', () => {
    const coreHexes = CORE_COLORS.map((c) => c.hex)
    for (let r = 0; r < 1; r += 0.01) {
      expect(coreHexes).toContain(pickInitialCategoryColor([], fixedRandom(r)))
    }
  })

  it('solo sortea entre los seis del núcleo, nunca un extendido (criterio 528)', () => {
    const coreHexes = CORE_COLORS.map((c) => c.hex)
    const extendedHexes = new Set(EXTENDED_COLORS.map((c) => c.hex))

    // Barrido fino del generador y con toda clase de historiales.
    const histories: (string | null)[][] = [
      [],
      [...coreHexes],
      [...extendedHexes],
      [...coreHexes, ...extendedHexes],
      [null, '#123456'],
    ]
    for (const used of histories) {
      for (let r = 0; r < 1; r += 0.01) {
        const picked = pickInitialCategoryColor(used, fixedRandom(r))
        expect(coreHexes).toContain(picked)
        expect(extendedHexes.has(picked)).toBe(false)
      }
    }
  })

  it('un extendido en uso no bloquea ninguna casilla del núcleo (criterio 523)', () => {
    const used = EXTENDED_COLORS.map((c) => c.hex)
    expect(pickInitialCategoryColor(used, fixedRandom(0))).toBe(CORE_COLORS[0].hex)
  })

  it('con algunas categorías, elige entre los colores que quedan libres (criterio 516)', () => {
    const used = [CORE_COLORS[0].hex, CORE_COLORS[1].hex]
    expect(pickInitialCategoryColor(used, fixedRandom(0))).toBe(CORE_COLORS[2].hex)
  })

  it('nunca repite mientras queden colores libres (criterio 516)', () => {
    const used = CORE_COLORS.slice(0, -1).map((c) => c.hex)
    for (const r of [0, 0.25, 0.5, 0.75, 0.999]) {
      expect(pickInitialCategoryColor(used, fixedRandom(r))).toBe(CORE_COLORS.at(-1)!.hex)
    }
  })

  it('normaliza antes de comparar: #10B981 y #10b981 son el mismo color', () => {
    const used = CORE_COLORS.slice(0, -1).map((c) => c.hex.toUpperCase())
    expect(pickInitialCategoryColor(used, fixedRandom(0))).toBe(CORE_COLORS.at(-1)!.hex)
  })

  it('ignora los null mezclados en la lista', () => {
    const used = [null, CORE_COLORS[0].hex, null, CORE_COLORS[1].hex, null]
    expect(pickInitialCategoryColor(used, fixedRandom(0))).toBe(CORE_COLORS[2].hex)
  })

  it('ignora colores que no son de la paleta (criterio 523)', () => {
    const used = ['#123456', 'rebeccapurple', '']
    expect(pickInitialCategoryColor(used, fixedRandom(0))).toBe(CORE_COLORS[0].hex)
  })

  it('con los seis del núcleo en uso, devuelve el que menos categorías tienen (criterio 517)', () => {
    // Todos aparecen dos veces menos el azul, que aparece una.
    const used = [
      ...CORE_COLORS.map((c) => c.hex),
      ...CORE_COLORS.filter((c) => c.name !== 'blue').map((c) => c.hex),
    ]
    for (const r of [0, 0.5, 0.999]) {
      expect(pickInitialCategoryColor(used, fixedRandom(r))).toBe(
        CORE_COLORS.find((c) => c.name === 'blue')!.hex,
      )
    }
  })

  it('con los seis usados por igual, vuelve a repartir entre todos (criterio 517)', () => {
    const used = CORE_COLORS.map((c) => c.hex)
    expect(pickInitialCategoryColor(used, fixedRandom(0))).toBe(CORE_COLORS[0].hex)
    expect(pickInitialCategoryColor(used, fixedRandom(0.99))).toBe(CORE_COLORS.at(-1)!.hex)
  })

  it('con los seis en uso y un empate a mínimo, elige entre los empatados (criterio 517)', () => {
    // Menta y Oliva una vez; los otros cuatro, dos veces.
    const used = [
      ...CORE_COLORS.map((c) => c.hex),
      ...CORE_COLORS.slice(2).map((c) => c.hex),
    ]
    const tied = [CORE_COLORS[0].hex, CORE_COLORS[1].hex]
    for (let r = 0; r < 1; r += 0.05) {
      expect(tied).toContain(pickInitialCategoryColor(used, fixedRandom(r)))
    }
  })

  it('aguanta un generador que devuelva exactamente 1', () => {
    expect(CORE_COLORS.map((c) => c.hex)).toContain(pickInitialCategoryColor([], fixedRandom(1)))
  })
})
