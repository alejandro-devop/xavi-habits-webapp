import { describe, expect, it } from 'vitest'
import {
  HABIT_COLORS,
  findHabitColor,
  normalizeHabitColor,
  pickInitialHabitColor,
} from './habit-colors'

/** Generador fijo: devuelve siempre lo mismo, así el sorteo es predecible. */
function fixedRandom(value: number) {
  return () => value
}

describe('HABIT_COLORS', () => {
  it('tiene seis colores', () => {
    expect(HABIT_COLORS).toHaveLength(6)
  })

  it('no repite hex ni nombre, y guarda los hex en minúsculas', () => {
    const hexes = HABIT_COLORS.map((c) => c.hex)
    const names = HABIT_COLORS.map((c) => c.name)
    expect(new Set(hexes).size).toBe(6)
    expect(new Set(names).size).toBe(6)
    for (const hex of hexes) expect(hex).toMatch(/^#[0-9a-f]{6}$/)
  })
})

describe('normalizeHabitColor', () => {
  it('iguala mayúsculas, minúsculas y espacios', () => {
    expect(normalizeHabitColor('#10B981')).toBe('#10b981')
    expect(normalizeHabitColor('  #10b981 ')).toBe('#10b981')
  })

  it('devuelve null para lo que no es color', () => {
    expect(normalizeHabitColor(null)).toBeNull()
    expect(normalizeHabitColor(undefined)).toBeNull()
    expect(normalizeHabitColor('   ')).toBeNull()
  })
})

describe('findHabitColor', () => {
  it('encuentra el color de la paleta aunque llegue en mayúsculas', () => {
    expect(findHabitColor('#10B981')?.label).toBe('Menta')
  })

  it('devuelve null para un color de fuera de la paleta', () => {
    expect(findHabitColor('#123456')).toBeNull()
  })
})

describe('pickInitialHabitColor', () => {
  it('sin colores usados devuelve el que señale el generador', () => {
    expect(pickInitialHabitColor([], fixedRandom(0))).toBe(HABIT_COLORS[0].hex)
    expect(pickInitialHabitColor([], fixedRandom(0.99))).toBe(HABIT_COLORS.at(-1)!.hex)
  })

  it('con algunos en uso, elige entre los que quedan libres', () => {
    const used = [HABIT_COLORS[0].hex, HABIT_COLORS[1].hex]
    expect(pickInitialHabitColor(used, fixedRandom(0))).toBe(HABIT_COLORS[2].hex)
  })

  it('nunca repite mientras queden colores libres', () => {
    const used = HABIT_COLORS.slice(0, -1).map((c) => c.hex)
    for (const r of [0, 0.25, 0.5, 0.75, 0.999]) {
      expect(pickInitialHabitColor(used, fixedRandom(r))).toBe(HABIT_COLORS.at(-1)!.hex)
    }
  })

  it('normaliza antes de comparar: #10B981 y #10b981 son el mismo color', () => {
    const used = HABIT_COLORS.slice(0, -1).map((c) => c.hex.toUpperCase())
    expect(pickInitialHabitColor(used, fixedRandom(0))).toBe(HABIT_COLORS.at(-1)!.hex)
  })

  it('ignora los null mezclados en la lista', () => {
    const used = [null, HABIT_COLORS[0].hex, null, HABIT_COLORS[1].hex, null]
    expect(pickInitialHabitColor(used, fixedRandom(0))).toBe(HABIT_COLORS[2].hex)
  })

  it('ignora colores que no son de la paleta', () => {
    const used = ['#123456', 'rebeccapurple', '']
    expect(pickInitialHabitColor(used, fixedRandom(0))).toBe(HABIT_COLORS[0].hex)
  })

  it('con todos en uso, devuelve el menos usado', () => {
    // Todos aparecen dos veces menos el azul, que aparece una.
    const used = [
      ...HABIT_COLORS.map((c) => c.hex),
      ...HABIT_COLORS.filter((c) => c.name !== 'blue').map((c) => c.hex),
    ]
    for (const r of [0, 0.5, 0.999]) {
      expect(pickInitialHabitColor(used, fixedRandom(r))).toBe(
        HABIT_COLORS.find((c) => c.name === 'blue')!.hex,
      )
    }
  })

  it('con todos usados por igual, vuelve a repartir entre todos', () => {
    const used = HABIT_COLORS.map((c) => c.hex)
    expect(pickInitialHabitColor(used, fixedRandom(0))).toBe(HABIT_COLORS[0].hex)
    expect(pickInitialHabitColor(used, fixedRandom(0.99))).toBe(HABIT_COLORS.at(-1)!.hex)
  })

  it('aguanta un generador que devuelva exactamente 1', () => {
    expect(HABIT_COLORS.map((c) => c.hex)).toContain(pickInitialHabitColor([], fixedRandom(1)))
  })
})
