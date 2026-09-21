import { describe, expect, it } from 'vitest'
import type { ActivityStatus } from '@/features/vida/types/activity.types'
import type { VidaDayOfWeek, VidaItem } from '@/features/vida/types/vida-item.types'
import {
  buildTemplateDay,
  buildTemplateGuidance,
  countTemplateByDay,
  describeItemDays,
  describeItemDuration,
  describeItemMeta,
  describeTemplateDayTotals,
  templateItemsForDay,
} from '@/features/vida/utils/vida-template.utils'

/**
 * La aritmética de la plantilla, sin React y sin sesión: aquí se cierran los
 * criterios 4, 5, 6 y 7 de FEAT-005.
 *
 * El día de Vida por defecto (06:30 → 23:00) son **990 minutos**, que es el
 * «16h 30» del render: las sumas de la barra se comprueban contra ese total.
 */

const DAY_START = '06:30'
const DAY_END = '23:00'
const DAY_MINUTES = 990

function item(
  id: string,
  {
    days = ['friday'] as VidaDayOfWeek[],
    startTime = null as string | null,
    durationMinutes = null as number | null,
    title = 'Algo',
    isActive = true,
    status = 'pending' as ActivityStatus,
  } = {},
): VidaItem {
  return {
    id,
    userId: 1,
    activityId: `a-${id}`,
    days,
    startTime,
    durationMinutes,
    notes: null,
    isActive,
    orderIndex: 0,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    activity: { id: `a-${id}`, title, status, category: null },
  }
}

function build(items: VidaItem[], day: VidaDayOfWeek = 'friday') {
  return buildTemplateDay({ items, day, dayStart: DAY_START, dayEnd: DAY_END })
}

describe('templateItemsForDay (A8)', () => {
  it('trae los del día, **incluidos los desactivados** (criterio 8)', () => {
    const items = [
      item('1', { days: ['friday'] }),
      item('2', { days: ['friday'], isActive: false }),
      item('3', { days: ['monday'] }),
    ]
    expect(templateItemsForDay(items, 'friday').map((one) => one.id)).toEqual(['1', '2'])
  })

  it('deja fuera los de actividades archivadas: Hoy nunca los va a ofrecer', () => {
    const items = [item('1'), item('2', { status: 'cancelled' })]
    expect(templateItemsForDay(items, 'friday').map((one) => one.id)).toEqual(['1'])
  })

  it('un `status` que no viene es «no se sabe», y entonces no se descarta nada', () => {
    const sinStatus = item('1')
    sinStatus.activity = { id: 'a-1', title: 'Algo', category: null }
    expect(templateItemsForDay([sinStatus], 'friday')).toHaveLength(1)
  })
})

describe('buildTemplateDay — el orden y el cajón (criterios 6 y 9)', () => {
  it('ordena por hora ascendente y, a igual hora, por nombre', () => {
    const day = build([
      item('tarde', { startTime: '19:00', durationMinutes: 30, title: 'Pasear' }),
      item('b', { startTime: '07:00', durationMinutes: 15, title: 'Bañarme' }),
      item('a', { startTime: '07:00', durationMinutes: 15, title: 'Arreglar la cama' }),
    ])
    expect(day.timed.map((entry) => entry.item.id)).toEqual(['a', 'b', 'tarde'])
  })

  it('los que no tienen hora van al cajón, por nombre, y no a la agenda', () => {
    const day = build([
      item('1', { title: 'Zurcir' }),
      item('2', { title: 'Ahorrar' }),
      item('3', { startTime: '08:00', durationMinutes: 30 }),
    ])
    expect(day.timed.map((entry) => entry.item.id)).toEqual(['3'])
    expect(day.untimed.map((one) => one.id)).toEqual(['2', '1'])
  })

  it('una hora que no es `HH:mm` cae en el cajón en vez de inventarse las 00:00', () => {
    const day = build([item('roto', { startTime: 'a las ocho' })])
    expect(day.timed).toHaveLength(0)
    expect(day.untimed.map((one) => one.id)).toEqual(['roto'])
  })
})

describe('buildTemplateDay — la barra (criterio 4)', () => {
  it('los anchos suman el día entero y «puestas de» sale de la misma cuenta', () => {
    const day = build([
      item('1', { startTime: '07:00', durationMinutes: 15 }),
      item('2', { startTime: '09:00', durationMinutes: 45 }),
      item('3', { startTime: '13:00', durationMinutes: 60 }),
    ])
    expect(day.dayMinutes).toBe(DAY_MINUTES)
    expect(day.plannedMinutes).toBe(15 + 45 + 60)
    expect(day.freeMinutes).toBe(DAY_MINUTES - 120)
    expect(day.segments.reduce((total, segment) => total + segment.trackMinutes, 0)).toBe(
      DAY_MINUTES,
    )
    expect(describeTemplateDayTotals(day)).toEqual({ plannedLabel: '2h', dayLabel: '16h 30' })
  })

  it('con dos ítems que se pisan los anchos **siguen sumando el 100 %** (`trackMinutes`)', () => {
    const day = build([
      item('1', { startTime: '09:00', durationMinutes: 60 }),
      item('2', { startTime: '09:30', durationMinutes: 60 }),
    ])
    // 60 + 30: el segundo aporta solo lo que no pisaba el primero.
    expect(day.plannedMinutes).toBe(90)
    expect(day.segments.reduce((total, segment) => total + segment.trackMinutes, 0)).toBe(
      DAY_MINUTES,
    )
    // Y **los dos se ven**: ninguno se oculta (decisión (f) del analista).
    expect(day.timed).toHaveLength(2)
  })

  it('un ítem fuera del horario **estira la ventana** en vez de desaparecer (A5)', () => {
    const day = build([item('1', { startTime: '05:30', durationMinutes: 30 })])
    expect(day.windowStart).toBe(5 * 60 + 30)
    expect(day.windowEnd).toBe(23 * 60)
    expect(day.dayMinutes).toBe(DAY_MINUTES + 60)
    expect(day.segments.reduce((total, segment) => total + segment.trackMinutes, 0)).toBe(
      day.dayMinutes,
    )
  })

  it('un ítem que termina después del fin del día también la estira', () => {
    const day = build([item('1', { startTime: '22:30', durationMinutes: 90 })])
    expect(day.windowEnd).toBe(24 * 60)
    expect(day.plannedMinutes).toBe(90)
  })
})

describe('buildTemplateDay — sin duración (criterio 7)', () => {
  it('un ítem con hora y sin duración se pinta, no ocupa barra y no inventa minutos', () => {
    const day = build([item('1', { startTime: '08:00', durationMinutes: null })])
    expect(day.timed).toHaveLength(1)
    expect(day.timed[0]!.durationMinutes).toBeNull()
    expect(day.timed[0]!.trackMinutes).toBe(0)
    expect(day.plannedMinutes).toBe(0)
  })

  it('`0` y los negativos cuentan como «sin duración», no como una duración válida', () => {
    expect(describeItemDuration(item('1', { durationMinutes: 0 }))).toBe('sin duración')
    expect(describeItemDuration(item('2', { durationMinutes: -30 }))).toBe('sin duración')
    expect(build([item('3', { startTime: '08:00', durationMinutes: 0 })]).plannedMinutes).toBe(0)
  })
})

describe('describeItemMeta (criterios 6 y 7)', () => {
  it('«45 min · L M X J V», con los días del propio ítem', () => {
    const meta = describeItemMeta(
      item('1', {
        durationMinutes: 45,
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      }),
    )
    expect(meta).toBe('45 min · L M X J V')
  })

  it('los siete días se leen «todos los días» y una hora larga, «1 h»', () => {
    const meta = describeItemMeta(
      item('1', {
        durationMinutes: 60,
        days: [
          'monday',
          'tuesday',
          'wednesday',
          'thursday',
          'friday',
          'saturday',
          'sunday',
        ],
      }),
    )
    expect(meta).toBe('1 h · todos los días')
  })

  it('sin duración se lee «sin duración», nunca «0 min»', () => {
    expect(describeItemMeta(item('1', { days: ['friday'] }))).toBe('sin duración · V')
  })

  it('los días salen siempre en orden de lunes a domingo', () => {
    expect(describeItemDays(item('1', { days: ['sunday', 'monday'] }))).toBe('L D')
  })
})

describe('countTemplateByDay (criterios 2 y 3)', () => {
  it('cuenta por día, con minutos y sin hora aparte', () => {
    const counts = countTemplateByDay([
      item('1', { days: ['monday', 'friday'], startTime: '07:00', durationMinutes: 15 }),
      item('2', { days: ['friday'], durationMinutes: 20 }),
      item('3', { days: ['friday'], isActive: false, startTime: '06:45', durationMinutes: 40 }),
      item('4', { days: ['sunday'], status: 'cancelled' }),
    ])
    expect(counts.friday).toEqual({ count: 3, minutes: 75, untimedCount: 1, hasAny: true })
    expect(counts.monday).toEqual({ count: 1, minutes: 15, untimedCount: 0, hasAny: true })
    // Archivada: ni cuenta ni enciende el punto.
    expect(counts.sunday).toEqual({ count: 0, minutes: 0, untimedCount: 0, hasAny: false })
  })

  it('las siete casillas existen aunque no haya nada', () => {
    const counts = countTemplateByDay([])
    expect(Object.keys(counts)).toHaveLength(7)
    expect(Object.values(counts).every((entry) => !entry.hasAny)).toBe(true)
  })
})

describe('buildTemplateGuidance (criterio 5)', () => {
  it('la frase del render: cuenta, dónde está lleno y el hueco grande', () => {
    const day = build([
      item('1', { startTime: '07:00', durationMinutes: 15 }),
      item('2', { startTime: '07:30', durationMinutes: 40 }),
      item('3', { startTime: '09:00', durationMinutes: 45 }),
      item('4', { startTime: '10:00', durationMinutes: 60 }),
      item('5', { startTime: '13:00', durationMinutes: 60 }),
      item('6', { startTime: '19:00', durationMinutes: 30 }),
      item('7', {}),
    ])
    expect(buildTemplateGuidance(day, 'viernes')).toBe(
      'Seis cosas con hora y una sin ella. Tu viernes está lleno por la mañana y libre de 14:00 a 19:00.',
    )
  })

  it('**no se afirma un hueco** que no existe: con el día apretado, solo la cuenta', () => {
    const day = build([
      item('1', { startTime: '06:30', durationMinutes: 360 }),
      item('2', { startTime: '12:30', durationMinutes: 320 }),
      item('3', { startTime: '18:00', durationMinutes: 290 }),
    ])
    expect(buildTemplateGuidance(day, 'lunes')).toBe('Tres cosas con hora.')
  })

  it('un hueco por debajo del umbral tampoco se nombra', () => {
    const day = build([
      item('1', { startTime: '06:30', durationMinutes: 300 }),
      item('2', { startTime: '12:00', durationMinutes: 660 }),
    ])
    expect(buildTemplateGuidance(day, 'martes')).not.toContain('libre de')
  })

  it('un día repartido no dice que esté lleno por ningún lado, pero sí nombra su hueco', () => {
    const day = build([
      item('1', { startTime: '07:00', durationMinutes: 60 }),
      item('2', { startTime: '20:00', durationMinutes: 60 }),
    ])
    const line = buildTemplateGuidance(day, 'sábado')
    expect(line).toContain('Dos cosas con hora.')
    expect(line).toContain('libre de')
    expect(line).not.toContain('lleno')
  })

  it('un día vacío se dice sin reproche (criterio 11)', () => {
    expect(buildTemplateGuidance(build([]), 'viernes')).toBe('El viernes no tienes nada puesto.')
  })

  it('con todo sin hora, la frase lo dice y **no describe la forma** de un día que no la tiene', () => {
    const day = build([item('1'), item('2')])
    expect(buildTemplateGuidance(day, 'jueves')).toBe('Todavía nada con hora y dos sin ellas.')
  })

  it('con la mañana y la noche empatadas no se elige una: no hay parte llena', () => {
    const day = build([
      item('1', { startTime: '07:00', durationMinutes: 60 }),
      item('2', { startTime: '20:00', durationMinutes: 60 }),
    ])
    expect(buildTemplateGuidance(day, 'sábado')).not.toContain('lleno')
  })

  it('nunca reprocha: ni «vacío», ni «desperdicio», ni «fallaste»', () => {
    const day = build([item('1', { startTime: '07:00', durationMinutes: 15 })])
    const line = buildTemplateGuidance(day, 'viernes')
    expect(line).not.toMatch(/vac[ií]o|desperdici|fallaste|perdiste/i)
  })
})
