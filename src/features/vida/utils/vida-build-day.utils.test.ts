import { describe, expect, it } from 'vitest'
import type { VidaItem } from '@/features/vida/types/vida-item.types'
import {
  buildDayFromTemplate,
  buildDaySummaryLine,
  describeBuildDay,
  plannedMinutesOf,
  usableTemplateItems,
} from '@/features/vida/utils/vida-build-day.utils'

const DAY = { dayStart: '06:30', dayEnd: '23:00' }

let seq = 0

function item(partial: Partial<VidaItem> & { title?: string }): VidaItem {
  seq += 1
  const { title, ...rest } = partial
  return {
    id: `item-${seq}`,
    userId: 1,
    activityId: `activity-${seq}`,
    days: ['monday'],
    startTime: null,
    durationMinutes: null,
    notes: null,
    isActive: true,
    orderIndex: seq,
    createdAt: '2026-09-20T00:00:00.000Z',
    updatedAt: '2026-09-20T00:00:00.000Z',
    activity: {
      id: `activity-${seq}`,
      title: title ?? 'Actividad',
      status: 'pending',
    },
    ...rest,
  }
}

describe('usableTemplateItems', () => {
  it('deja fuera el ítem desactivado y la actividad archivada, y conserva el resto', () => {
    const alive = item({ title: 'Pasear', startTime: '08:00', durationMinutes: 40 })
    const inactive = item({ title: 'Leer', startTime: '21:00', isActive: false })
    const archived = item({
      title: 'Curso viejo',
      startTime: '10:00',
      activity: { id: 'a-x', title: 'Curso viejo', status: 'cancelled' },
    })

    expect(usableTemplateItems([alive, inactive, archived])).toEqual([alive])
  })

  it('no descarta nada cuando el documento no pidió `status` (undefined es «no se sabe»)', () => {
    const unknown = item({
      title: 'Sin status',
      startTime: '09:00',
      activity: { id: 'a-y', title: 'Sin status' },
    })
    expect(usableTemplateItems([unknown])).toEqual([unknown])
  })
})

describe('buildDayFromTemplate — criterio 41: a su hora y con su duración', () => {
  it('copia la hora y la duración de cada ítem, sin encadenar ni proponer otra', () => {
    const result = buildDayFromTemplate(
      [
        item({ title: 'Bañarme', startTime: '08:00', durationMinutes: 15 }),
        item({ title: 'Compra', startTime: '10:30', durationMinutes: 60 }),
      ],
      DAY,
    )

    expect(result.items).toEqual([
      {
        activityId: result.items[0]!.activityId,
        startTime: '08:00',
        endTime: '08:15',
        orderIndex: 0,
      },
      {
        activityId: result.items[1]!.activityId,
        startTime: '10:30',
        endTime: '11:30',
        orderIndex: 1,
      },
    ])
    expect(result.movedCount).toBe(0)
    expect(result.withoutTimeCount).toBe(0)
    expect(result.droppedTitles).toEqual([])
  })

  it('ordena por hora aunque la plantilla venga desordenada', () => {
    const result = buildDayFromTemplate(
      [
        item({ title: 'Tarde', startTime: '19:00', durationMinutes: 30 }),
        item({ title: 'Mañana', startTime: '08:00', durationMinutes: 30 }),
      ],
      DAY,
    )
    expect(result.items.map((entry) => entry.startTime)).toEqual(['08:00', '19:00'])
  })
})

describe('buildDayFromTemplate — criterio 43: dos que se pisarían', () => {
  it('corre el segundo justo detrás del primero conservando su duración, y lo cuenta', () => {
    const result = buildDayFromTemplate(
      [
        item({ title: 'Primero', startTime: '09:00', durationMinutes: 60 }),
        item({ title: 'Segundo', startTime: '09:30', durationMinutes: 45 }),
      ],
      DAY,
    )

    expect(result.items.map((entry) => [entry.startTime, entry.endTime])).toEqual([
      ['09:00', '10:00'],
      ['10:00', '10:45'],
    ])
    expect(result.movedCount).toBe(1)
    // Ninguno se descarta en silencio: los dos están puestos.
    expect(result.placedCount).toBe(2)
  })

  it('no mueve nada cuando uno empieza justo donde termina el otro', () => {
    const result = buildDayFromTemplate(
      [
        item({ startTime: '09:00', durationMinutes: 30 }),
        item({ startTime: '09:30', durationMinutes: 30 }),
      ],
      DAY,
    )
    expect(result.movedCount).toBe(0)
  })

  it('arrastra el desplazamiento en cadena y lo cuenta una vez por ítem', () => {
    const result = buildDayFromTemplate(
      [
        item({ startTime: '09:00', durationMinutes: 60 }),
        item({ startTime: '09:15', durationMinutes: 30 }),
        item({ startTime: '09:20', durationMinutes: 30 }),
      ],
      DAY,
    )
    expect(result.items.map((entry) => entry.startTime)).toEqual(['09:00', '10:00', '10:30'])
    expect(result.movedCount).toBe(2)
    expect(describeBuildDay(result).moved).toBe(
      '2 de 3 no cabían a su hora y quedaron después.',
    )
  })

  it('cuenta como movido el ítem cuya hora cae antes de que empiece el día', () => {
    const result = buildDayFromTemplate([item({ startTime: '05:00', durationMinutes: 30 })], DAY)
    expect(result.items[0]!.startTime).toBe('06:30')
    expect(result.movedCount).toBe(1)
  })
})

describe('buildDayFromTemplate — criterio 44: los que no tienen hora', () => {
  it('los encadena al final, detrás del último bloque con hora', () => {
    const result = buildDayFromTemplate(
      [
        item({ title: 'Sin hora A', durationMinutes: 20 }),
        item({ title: 'Con hora', startTime: '08:00', durationMinutes: 30 }),
        item({ title: 'Sin hora B' }),
      ],
      DAY,
    )

    expect(result.items.map((entry) => [entry.startTime, entry.endTime])).toEqual([
      ['08:00', '08:30'],
      ['08:30', '08:50'],
      ['08:50', '09:20'],
    ])
    expect(result.withoutTimeCount).toBe(2)
    // El que tampoco traía duración entra con la de por defecto, y se dice.
    expect(result.defaultDurationCount).toBe(1)
    expect(describeBuildDay(result).defaultDuration).toBe('1 cosa sin duración, puesta a 30 min.')
  })

  it('con la plantilla entera sin horas, empieza al inicio del día', () => {
    const result = buildDayFromTemplate(
      [item({ durationMinutes: 30 }), item({ durationMinutes: 15 })],
      DAY,
    )
    expect(result.items.map((entry) => entry.startTime)).toEqual(['06:30', '07:00'])
    expect(result.withoutTimeCount).toBe(2)
  })

  it('lo dice con sus palabras y con el plural correcto', () => {
    const three = buildDayFromTemplate([item({}), item({}), item({})], DAY)
    expect(describeBuildDay(three).withoutTime).toBe(
      '3 cosas sin hora, puestas al final — ponles una hora en tu plantilla.',
    )
    const one = buildDayFromTemplate([item({})], DAY)
    expect(describeBuildDay(one).withoutTime).toBe(
      '1 cosa sin hora, puesta al final — ponles una hora en tu plantilla.',
    )
  })
})

describe('buildDayFromTemplate — cada ítem se cuenta una sola vez', () => {
  it('lo que se movería y luego no cabe se cuenta SOLO como descartado', () => {
    const result = buildDayFromTemplate(
      [
        item({ title: 'Aa', startTime: '22:00', durationMinutes: 50 }),
        item({ title: 'Ab', startTime: '22:10', durationMinutes: 30 }),
      ],
      DAY,
    )

    expect(result.droppedTitles).toEqual(['Ab'])
    // Antes se leía «1 de 2 no cabían a su hora y quedaron después» **y** «Ab
    // no cabía…», las dos sobre el mismo ítem.
    expect(result.movedCount).toBe(0)
    expect(describeBuildDay(result).moved).toBeNull()
  })

  it('lo sin hora que no cabe no se cuenta como «puesto al final»', () => {
    const result = buildDayFromTemplate(
      [
        item({ title: 'Larga', startTime: '22:00', durationMinutes: 55 }),
        item({ title: 'Sobra', durationMinutes: 30 }),
      ],
      DAY,
    )

    expect(result.withoutTimeCount).toBe(0)
    expect(result.droppedTitles).toEqual(['Sobra'])
  })
})

describe('buildDayFromTemplate — una duración de cero no es una duración', () => {
  it('`durationMinutes: 0` entra con la de por defecto, no con un bloque vacío', () => {
    const result = buildDayFromTemplate(
      [item({ title: 'Cero', startTime: '08:00', durationMinutes: 0 })],
      DAY,
    )

    expect(result.items).toEqual([
      { activityId: result.items[0]!.activityId, startTime: '08:00', endTime: '08:30', orderIndex: 0 },
    ])
    expect(result.defaultDurationCount).toBe(1)
  })

  it('una duración negativa se trata igual', () => {
    const result = buildDayFromTemplate(
      [item({ title: 'Negativa', startTime: '08:00', durationMinutes: -15 })],
      DAY,
    )
    expect(result.items[0]!.endTime).toBe('08:30')
  })
})

describe('buildDayFromTemplate — lo que no cabe antes del fin del día', () => {
  it('no lo pone, pero lo nombra: nada se pierde en silencio', () => {
    const result = buildDayFromTemplate(
      [
        item({ title: 'Cena', startTime: '22:00', durationMinutes: 30 }),
        item({ title: 'Maratón', startTime: '22:40', durationMinutes: 90 }),
      ],
      DAY,
    )

    expect(result.items).toHaveLength(1)
    expect(result.droppedTitles).toEqual(['Maratón'])
    expect(describeBuildDay(result).dropped).toBe(
      'Maratón no cabía antes de que termine tu día y se quedó fuera del plan.',
    )
  })

  it('una plantilla vacía no rompe nada y lo dice sin reprochar', () => {
    const result = buildDayFromTemplate([], DAY)
    expect(result.items).toEqual([])
    expect(describeBuildDay(result).headline).toBe('No quedó nada puesto desde tu plantilla.')
  })
})

describe('el resumen de una línea', () => {
  it('junta solo lo que pasó', () => {
    const result = buildDayFromTemplate(
      [
        item({ title: 'A', startTime: '09:00', durationMinutes: 60 }),
        item({ title: 'B', startTime: '09:30', durationMinutes: 30 }),
        item({ title: 'C' }),
      ],
      DAY,
    )
    expect(buildDaySummaryLine(result)).toBe(
      'Armado desde tu plantilla: 3 bloques. 1 de 3 no cabían a su hora y quedaron después. 1 cosa sin hora, puesta al final — ponles una hora en tu plantilla. 1 cosa sin duración, puesta a 30 min.',
    )
  })

  it('no dice nada de reproche en ninguna de sus frases', () => {
    const result = buildDayFromTemplate([item({}), item({ startTime: '05:00' })], DAY)
    const line = buildDaySummaryLine(result).toLowerCase()
    for (const word of ['desperdici', 'perdiste', 'fallaste', 'vacío', 'eliminar', 'cancelar']) {
      expect(line).not.toContain(word)
    }
  })
})

describe('plannedMinutesOf', () => {
  it('suma la duración de los bloques de un día', () => {
    expect(
      plannedMinutesOf([
        { startTime: '08:00', endTime: '08:15' },
        { startTime: '10:30', endTime: '11:30' },
      ]),
    ).toBe(75)
  })

  it('un día sin bloques suma cero', () => {
    expect(plannedMinutesOf([])).toBe(0)
  })
})
