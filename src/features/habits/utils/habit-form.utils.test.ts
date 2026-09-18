import { describe, expect, it } from 'vitest'
import { HABIT_TEMPLATES } from '@/features/habits/data/habit-templates'
import type { HabitCategory, HabitMeasure } from '@/features/habits/types/habit.types'
import {
  applyHabitTemplate,
  composeIntention,
  defaultFormValues,
  findByName,
  normalizeNameForMatch,
  parseIntention,
  proposeIntentionAction,
  readDescription,
  writeDescription,
  type HabitIntention,
} from '@/features/habits/utils/habit-form.utils'

function intention(partial: Partial<HabitIntention> = {}): HabitIntention {
  return { anchor: '', action: '', place: '', ...partial }
}

describe('composeIntention', () => {
  it('compone la frase completa con ancla, acción y lugar', () => {
    expect(
      composeIntention(
        intention({ anchor: 'me levante', action: '15 minutos de meditación', place: 'el salón' }),
      ),
    ).toBe('Cuando me levante, haré 15 minutos de meditación en el salón.')
  })

  it('omite el lugar cuando está vacío', () => {
    expect(
      composeIntention(intention({ anchor: 'desayune', action: '20 minutos de lectura' })),
    ).toBe('Cuando desayune, haré 20 minutos de lectura.')
  })

  it('omite el ancla cuando está vacía', () => {
    expect(composeIntention(intention({ action: 'una página', place: 'la cocina' }))).toBe(
      'Haré una página en la cocina.',
    )
  })

  it('devuelve cadena vacía sin acción, aunque haya ancla y lugar', () => {
    expect(composeIntention(intention({ anchor: 'cene', place: 'el gimnasio' }))).toBe('')
  })

  it('recorta los espacios de los huecos', () => {
    expect(composeIntention(intention({ anchor: '  cene  ', action: '  estirar  ' }))).toBe(
      'Cuando cene, haré estirar.',
    )
  })
})

describe('parseIntention', () => {
  it('descompone la frase completa', () => {
    expect(parseIntention('Cuando me levante, haré 15 minutos de meditación en el salón.')).toEqual(
      intention({ anchor: 'me levante', action: '15 minutos de meditación', place: 'el salón' }),
    )
  })

  it('descompone una frase sin lugar', () => {
    expect(parseIntention('Cuando cene, haré 10 minutos de estiramientos.')).toEqual(
      intention({ anchor: 'cene', action: '10 minutos de estiramientos' }),
    )
  })

  it('descompone una frase sin ancla', () => {
    expect(parseIntention('Haré una página en la cocina.')).toEqual(
      intention({ action: 'una página', place: 'la cocina' }),
    )
  })

  it('mantiene las comas que van dentro de la acción', () => {
    const text = 'Cuando me levante, haré 20 flexiones, 10 sentadillas y 1 plancha.'
    expect(parseIntention(text)).toEqual(
      intention({ anchor: 'me levante', action: '20 flexiones, 10 sentadillas y 1 plancha' }),
    )
  })

  // ── Casos feos: todos tienen que acabar en texto libre ─────────────────────

  it('no analiza texto libre que casualmente empieza por «Cuando»', () => {
    expect(
      parseIntention('Cuando era niño odiaba las verduras, así que esto va a costarme.'),
    ).toBeNull()
  })

  it('no analiza texto libre sin punto final', () => {
    expect(parseIntention('Cuando me levante, haré 15 minutos de meditación')).toBeNull()
  })

  it('no analiza una frase con dos «, haré »', () => {
    expect(
      parseIntention('Cuando me levante, haré café y cuando vuelva, haré ejercicio.'),
    ).toBeNull()
  })

  it('no analiza una descripción de varias líneas', () => {
    expect(parseIntention('Cuando me levante, haré yoga.\nY luego desayuno.')).toBeNull()
  })

  it('no analiza una frase sin acción', () => {
    expect(parseIntention('Cuando me levante, haré .')).toBeNull()
  })

  it('devuelve null con descripción vacía o nula', () => {
    expect(parseIntention('')).toBeNull()
    expect(parseIntention(null)).toBeNull()
    expect(parseIntention(undefined)).toBeNull()
  })

  it('no analiza un párrafo largo aunque tenga la forma de la frase', () => {
    const longText = `Cuando me levante, haré ${'ejercicio '.repeat(60).trim()}.`
    expect(parseIntention(longText)).toBeNull()
  })

  it('rechaza lo que no se recompone carácter a carácter', () => {
    // Dobles espacios alrededor del «haré»: no es una frase nuestra.
    expect(parseIntention('Cuando me levante,  haré  yoga.')).toBeNull()
  })

  it('es el inverso exacto de composeIntention', () => {
    const cases: HabitIntention[] = [
      intention({ anchor: 'me levante', action: '15 minutos de meditación', place: 'el salón' }),
      intention({ anchor: 'llegue a casa', action: 'la cena en la cocina', place: 'silencio' }),
      intention({ anchor: 'desayune', action: 'leer, tomar notas y subrayar' }),
      intention({ action: 'un paseo', place: 'el parque' }),
      intention({ action: 'apagar la luz a mi hora' }),
    ]

    for (const value of cases) {
      const text = composeIntention(value)
      expect(parseIntention(text)).toEqual(value)
      expect(composeIntention(parseIntention(text)!)).toBe(text)
    }
  })
})

describe('readDescription / writeDescription', () => {
  it('reconoce una intención guardada', () => {
    const state = readDescription('Cuando me levante, haré 15 minutos de meditación.')
    expect(state.mode).toBe('intention')
    expect(state.intention.anchor).toBe('me levante')
    expect(state.freeText).toBe('')
  })

  it('deja intacto el texto libre de un hábito viejo', () => {
    const legacy = 'Apuntes sueltos sobre por qué quiero esto. Sin formato ninguno.'
    const state = readDescription(legacy)
    expect(state.mode).toBe('free')
    expect(state.freeText).toBe(legacy)
    expect(writeDescription(state)).toBe(legacy)
  })

  it('devuelve el mismo texto al ir y volver', () => {
    const texts = [
      'Cuando cene, haré 10 minutos de estiramientos en el salón.',
      'Una descripción libre cualquiera',
      '',
    ]
    for (const text of texts) {
      expect(writeDescription(readDescription(text))).toBe(text)
    }
  })

  it('trata la descripción nula como texto libre vacío', () => {
    const state = readDescription(null)
    expect(state.mode).toBe('free')
    expect(state.freeText).toBe('')
  })
})

describe('proposeIntentionAction', () => {
  const base = defaultFormValues()

  it('usa el nombre en minúscula para un hábito de un toque', () => {
    expect(proposeIntentionAction({ ...base, name: 'Leer 20 páginas' })).toBe('leer 20 páginas')
  })

  it('añade los minutos cuando hay objetivo de tiempo', () => {
    expect(
      proposeIntentionAction({ ...base, name: 'Meditación', habitType: 'time', timerGoal: '15' }),
    ).toBe('15 minutos de meditación')
  })

  it('añade la cantidad y la medida cuando hay objetivo de cantidad', () => {
    expect(
      proposeIntentionAction(
        { ...base, name: 'Agua', habitType: 'count', dailyGoal: '8' },
        'vasos',
      ),
    ).toBe('8 vasos de agua')
  })

  it('devuelve cadena vacía sin nombre', () => {
    expect(proposeIntentionAction(base)).toBe('')
  })
})

describe('normalizeNameForMatch / findByName', () => {
  it('ignora mayúsculas, acentos y espacios de sobra', () => {
    expect(normalizeNameForMatch('  Páginas  Leídas ')).toBe('paginas leidas')
  })

  it('encuentra por nombre sin distinguir acentos', () => {
    const items = [{ id: 'm1', name: 'páginas' }]
    expect(findByName(items, 'Paginas')?.id).toBe('m1')
    expect(findByName(items, 'vasos')).toBeNull()
    expect(findByName(items, undefined)).toBeNull()
  })
})

describe('applyHabitTemplate', () => {
  const template = HABIT_TEMPLATES.find((t) => t.id === 'beber-agua')!
  const measure = { id: 'measure-1', name: 'vasos' } as HabitMeasure
  const category = { id: 'category-1', name: 'Salud' } as HabitCategory

  it('ninguna plantilla trae ids de medida ni de categoría', () => {
    for (const entry of HABIT_TEMPLATES) {
      expect(entry).not.toHaveProperty('measureId')
      expect(entry).not.toHaveProperty('categoryId')
    }
  })

  it('rellena nombre, icono, color, tipo y objetivo', () => {
    const { values } = applyHabitTemplate(defaultFormValues(), template, {
      measures: [],
      categories: [],
    })
    expect(values.name).toBe('Beber agua')
    expect(values.habitType).toBe('count')
    expect(values.icon).toBe('droplet')
    expect(values.color).toBe('#0ea5e9')
    expect(values.dailyGoal).toBe('8')
  })

  it('preselecciona la medida y la categoría del usuario si coinciden por nombre', () => {
    const result = applyHabitTemplate(defaultFormValues(), template, {
      measures: [measure],
      categories: [category],
    })
    expect(result.values.measureId).toBe('measure-1')
    expect(result.values.categoryId).toBe('category-1')
    expect(result.pendingMeasureName).toBeNull()
    expect(result.pendingCategoryName).toBeNull()
  })

  it('no inventa nada cuando el usuario no tiene esa medida: deja el nombre sugerido', () => {
    const result = applyHabitTemplate(defaultFormValues(), template, {
      measures: [],
      categories: [],
    })
    expect(result.values.measureId).toBe('')
    expect(result.values.categoryId).toBe('')
    expect(result.pendingMeasureName).toBe('Vasos')
    expect(result.pendingCategoryName).toBe('Salud')
  })

  it('conserva lo que no toca la plantilla', () => {
    const current = { ...defaultFormValues(), shouldAvoid: true, hidden: true }
    const { values } = applyHabitTemplate(current, template, { measures: [], categories: [] })
    expect(values.shouldAvoid).toBe(true)
    expect(values.hidden).toBe(true)
  })
})
