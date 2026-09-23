import { describe, expect, it } from 'vitest'
import {
  recentNoteSuggestions,
  templateNoteForActivity,
  VIDA_NOTE_ADD_LABEL,
  VIDA_NOTE_QUESTION_DONE,
  VIDA_NOTE_QUESTION_RUNNING,
} from '@/features/vida/utils/vida-notes.utils'

/**
 * «Lo de otras veces» (FEAT-018, criterios 546 y 547) y las palabras del
 * módulo (criterio 532). Aritmética pura: nada de React ni de red.
 */

function session(id: string, notes: string | null) {
  return { id, notes }
}

describe('recentNoteSuggestions', () => {
  it('criterio 546 — devuelve las últimas notas, en el orden en que llegan', () => {
    expect(
      recentNoteSuggestions([
        session('f3', 'Soporte y tickets'),
        session('f2', 'Daily + planning'),
        session('f1', 'Revisando MRs'),
      ]),
    ).toEqual(['Soporte y tickets', 'Daily + planning', 'Revisando MRs'])
  })

  it('las sesiones sin nota no son una píldora en blanco', () => {
    expect(
      recentNoteSuggestions([
        session('f4', null),
        session('f3', '   '),
        session('f2', 'Revisando MRs'),
      ]),
    ).toEqual(['Revisando MRs'])
  })

  it('deduplica ignorando mayúsculas y espacios, y conserva la redacción más reciente', () => {
    expect(
      recentNoteSuggestions([
        session('f3', 'Revisando MRs'),
        session('f2', 'revisando   mrs'),
        session('f1', 'REVISANDO MRS'),
        session('f0', 'Daily'),
      ]),
    ).toEqual(['Revisando MRs', 'Daily'])
  })

  it('recorta los espacios de los lados sin tocar el texto', () => {
    expect(recentNoteSuggestions([session('f1', '  Bug del carrito  ')])).toEqual([
      'Bug del carrito',
    ])
  })

  it('tres como mucho, salvo que se pida otra cosa', () => {
    const many = ['a', 'b', 'c', 'd', 'e'].map((text, index) => session(`f${index}`, text))

    expect(recentNoteSuggestions(many)).toEqual(['a', 'b', 'c'])
    expect(recentNoteSuggestions(many, { max: 2 })).toEqual(['a', 'b'])
  })

  it('la sesión que se está editando no se ofrece a sí misma', () => {
    expect(
      recentNoteSuggestions([session('f9', 'Lo de ahora'), session('f1', 'Revisando MRs')], {
        excludeId: 'f9',
      }),
    ).toEqual(['Revisando MRs'])
  })

  it('criterio 547 — sin nada devuelve una lista vacía, no un hueco que explicar', () => {
    expect(recentNoteSuggestions([])).toEqual([])
    expect(recentNoteSuggestions(undefined)).toEqual([])
    expect(recentNoteSuggestions([session('f1', null)])).toEqual([])
  })
})

describe('las palabras (criterio 532)', () => {
  it('son preguntas, y en ninguna aparece «nota» ni «descripción»', () => {
    for (const text of [
      VIDA_NOTE_ADD_LABEL,
      VIDA_NOTE_QUESTION_DONE,
      VIDA_NOTE_QUESTION_RUNNING,
    ]) {
      expect(text).not.toMatch(/nota|descripci/i)
    }
    expect(VIDA_NOTE_QUESTION_RUNNING).toBe('¿Qué estás haciendo?')
    expect(VIDA_NOTE_QUESTION_DONE).toBe('¿Qué hiciste?')
  })
})

/**
 * **La plantilla propone** (FEAT-018, tajada 4). El plan del día no guarda de
 * qué ítem de plantilla salió: el único vínculo es el `activityId`, y este
 * cruce es la heurística entera, escrita y comprobable.
 */

function templateItem(activityId: string, startTime: string | null, notes: string | null) {
  return { item: { activityId, startTime, notes } }
}

describe('templateNoteForActivity', () => {
  it('criterio 556 — devuelve la nota del ítem de esa actividad', () => {
    expect(
      templateNoteForActivity(
        [
          templateItem('a-1', '07:00', 'Estiramientos'),
          templateItem('a-2', '09:00', 'Revisando MRs'),
        ],
        'a-2',
      ),
    ).toBe('Revisando MRs')
  })

  it('criterio 558 — sin ítem de esa actividad no propone nada', () => {
    expect(
      templateNoteForActivity([templateItem('a-1', '07:00', 'Estiramientos')], 'a-9'),
    ).toBeNull()
    expect(templateNoteForActivity([], 'a-1')).toBeNull()
    expect(templateNoteForActivity(null, 'a-1')).toBeNull()
    expect(templateNoteForActivity([templateItem('a-1', '07:00', 'Algo')], null)).toBeNull()
  })

  it('un ítem sin nota, o con una nota en blanco, no propone nada', () => {
    expect(templateNoteForActivity([templateItem('a-1', '07:00', null)], 'a-1')).toBeNull()
    expect(templateNoteForActivity([templateItem('a-1', '07:00', '   ')], 'a-1')).toBeNull()
  })

  it('recorta los espacios de alrededor', () => {
    expect(
      templateNoteForActivity([templateItem('a-1', '07:00', '  Revisando MRs  ')], 'a-1'),
    ).toBe('Revisando MRs')
  })

  it('con dos ítems de la misma actividad el mismo día gana el más temprano', () => {
    const suggestions = [
      templateItem('a-1', '15:00', 'Reuniones de la tarde'),
      templateItem('a-1', '09:00', 'Revisando MRs'),
    ]
    expect(templateNoteForActivity(suggestions, 'a-1')).toBe('Revisando MRs')
    // Y el mismo resultado con la lista al revés: manda la hora, no el orden.
    expect(templateNoteForActivity([...suggestions].reverse(), 'a-1')).toBe('Revisando MRs')
  })

  it('el más temprano gana aunque no tenga nota, y entonces no se propone nada', () => {
    // El desempate es por hora, **no por quién tenga algo escrito**: la regla
    // es «la propuesta es la del primer rato del día», y eso incluye que el
    // primer rato no diga nada. Buscar la nota más tardía «porque hay una»
    // sería adivinar cuál de los dos ratos es el que vas a empezar.
    const suggestions = [
      templateItem('a-1', '15:00', 'Reuniones de la tarde'),
      templateItem('a-1', '09:00', null),
    ]
    expect(templateNoteForActivity(suggestions, 'a-1')).toBeNull()
    expect(templateNoteForActivity([...suggestions].reverse(), 'a-1')).toBeNull()
  })

  it('un ítem sin hora no le gana el desempate a uno que sí la tiene', () => {
    expect(
      templateNoteForActivity(
        [templateItem('a-1', null, 'Sin hora'), templateItem('a-1', '09:00', 'Revisando MRs')],
        'a-1',
      ),
    ).toBe('Revisando MRs')
  })

  it('con todos sin hora se queda con el primero que llega', () => {
    expect(
      templateNoteForActivity(
        [templateItem('a-1', null, 'Primero'), templateItem('a-1', null, 'Segundo')],
        'a-1',
      ),
    ).toBe('Primero')
  })
})
