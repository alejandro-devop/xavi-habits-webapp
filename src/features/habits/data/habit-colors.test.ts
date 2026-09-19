import { describe, expect, it } from 'vitest'
import {
  HABIT_COLORS,
  HABIT_CORE_COLORS,
  HABIT_EXTENDED_COLORS,
  findHabitColor,
  normalizeHabitColor,
  pickInitialHabitColor,
} from './habit-colors'

/** Generador fijo: devuelve siempre lo mismo, así el sorteo es predecible. */
function fixedRandom(value: number) {
  return () => value
}

/** sRGB (0-255) a lineal, el paso previo obligatorio antes de OKLab. */
function toLinear(channel: number): number {
  const c = channel / 255
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

/** Un hexadecimal en coordenadas OKLab, donde la distancia sí se parece a lo que ve el ojo. */
function toOklab(hex: string): [number, number, number] {
  const r = toLinear(parseInt(hex.slice(1, 3), 16))
  const g = toLinear(parseInt(hex.slice(3, 5), 16))
  const b = toLinear(parseInt(hex.slice(5, 7), 16))

  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)

  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

/** Distancia euclídea en OKLab, en la escala de 0 a 100 que usa el validador. */
function deltaE(a: string, b: string): number {
  const [l1, a1, b1] = toOklab(a)
  const [l2, a2, b2] = toOklab(b)
  return 100 * Math.hypot(l1 - l2, a1 - a2, b1 - b2)
}

describe('HABIT_COLORS', () => {
  it('tiene diecisiete colores: seis del núcleo y once extendidos', () => {
    expect(HABIT_CORE_COLORS).toHaveLength(6)
    expect(HABIT_EXTENDED_COLORS).toHaveLength(11)
    expect(HABIT_COLORS).toHaveLength(17)
  })

  it('mantiene los seis hexadecimales del núcleo', () => {
    expect(HABIT_CORE_COLORS.map((c) => c.hex)).toEqual([
      '#10b981',
      '#4d7c0f',
      '#f59e0b',
      '#e11d48',
      '#8b5cf6',
      '#0284c7',
    ])
  })

  it('no repite hex ni nombre, y guarda los hex en minúsculas', () => {
    const hexes = HABIT_COLORS.map((c) => c.hex)
    const names = HABIT_COLORS.map((c) => c.name)
    expect(new Set(hexes).size).toBe(17)
    expect(new Set(names).size).toBe(17)
    for (const hex of hexes) expect(hex).toMatch(/^#[0-9a-f]{6}$/)
  })

  it('anuncia cada color con un nombre en español', () => {
    for (const color of HABIT_COLORS) expect(color.label.trim()).not.toBe('')
    expect(findHabitColor('#11bff0')?.label).toBe('Cian')
  })

  it('marca el nivel de cada color', () => {
    expect(HABIT_CORE_COLORS.every((c) => c.tier === 'core')).toBe(true)
    expect(HABIT_EXTENDED_COLORS.every((c) => c.tier === 'extended')).toBe(true)
  })

  // La garantía que sostiene la paleta: un extendido nunca se confunde con un
  // color que la app haya repartido sola, porque solo reparte los del núcleo.
  it('deja cada extendido a ΔE ≥ 15 de cada color del núcleo', () => {
    const tooClose: string[] = []
    for (const extended of HABIT_EXTENDED_COLORS) {
      for (const core of HABIT_CORE_COLORS) {
        const distance = deltaE(extended.hex, core.hex)
        if (distance < 15) {
          tooClose.push(`${extended.name} ↔ ${core.name} = ${distance.toFixed(1)}`)
        }
      }
    }
    expect(tooClose).toEqual([])
  })

  it('deja también cada par del núcleo por encima de ΔE 15', () => {
    const tooClose: string[] = []
    for (let i = 0; i < HABIT_CORE_COLORS.length; i += 1) {
      for (let j = i + 1; j < HABIT_CORE_COLORS.length; j += 1) {
        const distance = deltaE(HABIT_CORE_COLORS[i].hex, HABIT_CORE_COLORS[j].hex)
        if (distance < 15) {
          tooClose.push(`${HABIT_CORE_COLORS[i].name} ↔ ${HABIT_CORE_COLORS[j].name}`)
        }
      }
    }
    expect(tooClose).toEqual([])
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

  it('encuentra también los extendidos', () => {
    expect(findHabitColor('#B46CA8')?.label).toBe('Malva')
  })

  it('devuelve null para un color de fuera de la paleta', () => {
    expect(findHabitColor('#123456')).toBeNull()
  })
})

describe('pickInitialHabitColor', () => {
  it('sin colores usados devuelve el que señale el generador', () => {
    expect(pickInitialHabitColor([], fixedRandom(0))).toBe(HABIT_CORE_COLORS[0].hex)
    expect(pickInitialHabitColor([], fixedRandom(0.99))).toBe(HABIT_CORE_COLORS.at(-1)!.hex)
  })

  it('solo sortea entre los seis del núcleo, nunca un extendido', () => {
    const coreHexes = HABIT_CORE_COLORS.map((c) => c.hex)
    const extendedHexes = new Set(HABIT_EXTENDED_COLORS.map((c) => c.hex))

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
        const picked = pickInitialHabitColor(used, fixedRandom(r))
        expect(coreHexes).toContain(picked)
        expect(extendedHexes.has(picked)).toBe(false)
      }
    }
  })

  it('un extendido en uso no bloquea ninguna casilla del núcleo', () => {
    const used = HABIT_EXTENDED_COLORS.map((c) => c.hex)
    expect(pickInitialHabitColor(used, fixedRandom(0))).toBe(HABIT_CORE_COLORS[0].hex)
  })

  it('con algunos en uso, elige entre los que quedan libres', () => {
    const used = [HABIT_CORE_COLORS[0].hex, HABIT_CORE_COLORS[1].hex]
    expect(pickInitialHabitColor(used, fixedRandom(0))).toBe(HABIT_CORE_COLORS[2].hex)
  })

  it('nunca repite mientras queden colores libres', () => {
    const used = HABIT_CORE_COLORS.slice(0, -1).map((c) => c.hex)
    for (const r of [0, 0.25, 0.5, 0.75, 0.999]) {
      expect(pickInitialHabitColor(used, fixedRandom(r))).toBe(HABIT_CORE_COLORS.at(-1)!.hex)
    }
  })

  it('normaliza antes de comparar: #10B981 y #10b981 son el mismo color', () => {
    const used = HABIT_CORE_COLORS.slice(0, -1).map((c) => c.hex.toUpperCase())
    expect(pickInitialHabitColor(used, fixedRandom(0))).toBe(HABIT_CORE_COLORS.at(-1)!.hex)
  })

  it('ignora los null mezclados en la lista', () => {
    const used = [null, HABIT_CORE_COLORS[0].hex, null, HABIT_CORE_COLORS[1].hex, null]
    expect(pickInitialHabitColor(used, fixedRandom(0))).toBe(HABIT_CORE_COLORS[2].hex)
  })

  it('ignora colores que no son de la paleta', () => {
    const used = ['#123456', 'rebeccapurple', '']
    expect(pickInitialHabitColor(used, fixedRandom(0))).toBe(HABIT_CORE_COLORS[0].hex)
  })

  it('con todos en uso, devuelve el menos usado', () => {
    // Todos aparecen dos veces menos el azul, que aparece una.
    const used = [
      ...HABIT_CORE_COLORS.map((c) => c.hex),
      ...HABIT_CORE_COLORS.filter((c) => c.name !== 'blue').map((c) => c.hex),
    ]
    for (const r of [0, 0.5, 0.999]) {
      expect(pickInitialHabitColor(used, fixedRandom(r))).toBe(
        HABIT_CORE_COLORS.find((c) => c.name === 'blue')!.hex,
      )
    }
  })

  it('con todos usados por igual, vuelve a repartir entre todos', () => {
    const used = HABIT_CORE_COLORS.map((c) => c.hex)
    expect(pickInitialHabitColor(used, fixedRandom(0))).toBe(HABIT_CORE_COLORS[0].hex)
    expect(pickInitialHabitColor(used, fixedRandom(0.99))).toBe(HABIT_CORE_COLORS.at(-1)!.hex)
  })

  it('aguanta un generador que devuelva exactamente 1', () => {
    expect(HABIT_CORE_COLORS.map((c) => c.hex)).toContain(pickInitialHabitColor([], fixedRandom(1)))
  })
})
