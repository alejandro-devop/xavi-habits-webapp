import { describe, expect, it } from 'vitest'
import type { ActivityStatus } from '@/features/vida/types/activity.types'
import type { VidaDayOfWeek, VidaItem } from '@/features/vida/types/vida-item.types'
import {
  TEMPLATE_GRID_MIN_BLOCK_MINUTES,
  buildTemplateDay,
  buildTemplateGuidance,
  buildTemplateWeekGrid,
  buildWeekTotals,
  describeCopySkips,
  planCopyDay,
  countTemplateByDay,
  describeItemDays,
  describeItemDuration,
  describeItemMeta,
  daysWithout,
  describeOtherDays,
  describeTemplateDayTotals,
  describeDaysPhrase,
  describeExistingHours,
  describeFitAt,
  describeMultipleItemsNote,
  describeTemplatePreview,
  templateItemsForDay,
  whatIsAt,
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

/**
 * La hoja del ítem (tajada 2): los criterios **20** y **22**, que son de texto
 * y se cierran aquí, sin montar un modal.
 */
describe('describeTemplatePreview (criterio 20)', () => {
  it('con días, hora y duración enseña el rango **de verdad**, calculado', () => {
    const preview = describeTemplatePreview({
      days: ['monday', 'wednesday', 'friday'],
      startTime: '09:00',
      durationMinutes: 45,
    })
    expect(preview.complete).toBe(true)
    expect(preview.text).toBe('Así queda en Hoy: lunes, miércoles y viernes de 9:00 a 9:45.')
    expect(preview.rangeText).toBe('de 9:00 a 9:45')
    expect(preview.missingText).toBeNull()
  })

  it('los siete días se dicen «todos los días», y uno solo va solo', () => {
    expect(
      describeTemplatePreview({
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        startTime: '07:00',
        durationMinutes: 15,
      }).text,
    ).toBe('Así queda en Hoy: todos los días de 7:00 a 7:15.')
    expect(
      describeTemplatePreview({ days: ['saturday'], startTime: '10:00', durationMinutes: 60 }).text,
    ).toBe('Así queda en Hoy: sábado de 10:00 a 11:00.')
  })

  it('**sin hora** no enseña un rango falso: dice lo que Hoy hace de verdad', () => {
    const preview = describeTemplatePreview({
      days: ['monday'],
      startTime: null,
      durationMinutes: 30,
    })
    expect(preview.complete).toBe(false)
    expect(preview.rangeText).toBeNull()
    expect(preview.text).toBe(
      'Así queda en Hoy: lunes. Sin hora, Hoy la pone al final del día, una detrás de otra.',
    )
  })

  it('**sin duración** dice qué falta, y dice los 30 min que Hoy le pondría', () => {
    const preview = describeTemplatePreview({
      days: ['monday', 'friday'],
      startTime: '09:00',
      durationMinutes: null,
    })
    expect(preview.complete).toBe(false)
    expect(preview.text).toBe(
      'Así queda en Hoy: lunes y viernes a las 9:00. Sin cuánto dura, Hoy le pone 30 min al armar el día.',
    )
  })

  it('sin ningún día no se afirma nada: se pide el día (criterios 20 y 23)', () => {
    const preview = describeTemplatePreview({ days: [], startTime: '09:00', durationMinutes: 45 })
    expect(preview.complete).toBe(false)
    expect(preview.text).toBe('Marca al menos un día y verás cómo queda en Hoy.')
  })

  it('una hora que no es `HH:mm` cuenta como «no tiene», no como 00:00', () => {
    expect(
      describeTemplatePreview({ days: ['monday'], startTime: '   ', durationMinutes: 30 }).text,
    ).toContain('Sin hora')
    // Y una duración de 0 o negativa tampoco es una duración (criterio 7).
    expect(
      describeTemplatePreview({ days: ['monday'], startTime: '09:00', durationMinutes: 0 }).text,
    ).toContain('Sin cuánto dura')
  })

  it('ninguna variante trae una palabra de culpa', () => {
    const variantes = [
      describeTemplatePreview({ days: [], startTime: null, durationMinutes: null }),
      describeTemplatePreview({ days: ['monday'], startTime: null, durationMinutes: null }),
      describeTemplatePreview({ days: ['monday'], startTime: '09:00', durationMinutes: null }),
      describeTemplatePreview({ days: ['monday'], startTime: '09:00', durationMinutes: 45 }),
    ]
    for (const variante of variantes) {
      expect(variante.text).not.toMatch(/vac[ií]o|desperdici|fallaste|perdiste|cancelar|eliminar/i)
    }
  })
})

describe('describeOtherDays y daysWithout (criterio 22)', () => {
  const casa = item('casa', { days: ['monday', 'wednesday', 'friday'] })

  it('dice los otros días **con su artículo**, como el criterio', () => {
    expect(describeOtherDays(casa, 'friday')).toBe('también está los lunes y los miércoles')
    expect(describeOtherDays(casa, 'monday')).toBe('también está los miércoles y los viernes')
  })

  it('con dos días sueltos no inventa una lista', () => {
    const dos = item('dos', { days: ['saturday', 'sunday'] })
    expect(describeOtherDays(dos, 'saturday')).toBe('también está los domingos')
  })

  it('con un solo día **no hay nada que avisar**: una sola salida', () => {
    expect(describeOtherDays(item('uno', { days: ['friday'] }), 'friday')).toBeNull()
  })

  it('los días que quedan al quitar uno van de lunes a domingo y sin el quitado', () => {
    expect(daysWithout(casa, 'wednesday')).toEqual(['monday', 'friday'])
    expect(daysWithout(item('uno', { days: ['friday'] }), 'friday')).toEqual([])
  })
})

// ─── Tajada 3: lo que sostiene «Añadir a mi Vida» (criterios 33, 34 y 35) ────

describe('whatIsAt y describeFitAt (criterio 33)', () => {
  const dayItems = [
    item('paseo', { startTime: '18:00', durationMinutes: 30, title: 'Pasear a las mascotas' }),
    item('leer', { startTime: '21:30', durationMinutes: 30, title: 'Leer un rato' }),
  ]

  it('con el rato libre lo dice sin bloquear nada', () => {
    expect(describeFitAt(dayItems, '19:00')).toBe('a las 19:00 no tienes nada')
  })

  it('con algo puesto lo nombra', () => {
    expect(describeFitAt(dayItems, '18:00')).toBe('a las 18:00 ya tienes Pasear a las mascotas')
    expect(describeFitAt(dayItems, '18:29')).toBe('a las 18:29 ya tienes Pasear a las mascotas')
  })

  it('el minuto en que acaba ya está libre', () => {
    expect(whatIsAt(dayItems, 18 * 60 + 30)).toBeNull()
  })

  it('un ítem **sin duración** ocupa solo su minuto: no se le inventan 30', () => {
    const suelto = [item('x', { startTime: '10:00', title: 'Algo' })]
    expect(whatIsAt(suelto, 10 * 60)?.id).toBe('x')
    expect(whatIsAt(suelto, 10 * 60 + 5)).toBeNull()
  })

  it('sin hora que mirar no se afirma nada', () => {
    expect(describeFitAt(dayItems, '')).toBeNull()
    expect(describeFitAt(dayItems, '25:00')).toBeNull()
  })
})

describe('describeExistingHours (criterio 34)', () => {
  it('sin nada puesto no hay nada que avisar', () => {
    expect(describeExistingHours([])).toBeNull()
  })

  it('una hora, dos y tres', () => {
    const a = item('a', { startTime: '07:30' })
    const b = item('b', { startTime: '19:00' })
    const c = item('c', { startTime: '13:00' })
    expect(describeExistingHours([a])).toBe('a las 7:30')
    expect(describeExistingHours([a, b])).toBe('a las 7:30 y a las 19:00')
    expect(describeExistingHours([a, c, b])).toBe('a las 7:30, a las 13:00 y a las 19:00')
  })

  it('lo que no tiene hora se dice «sin hora», no se inventa una', () => {
    expect(describeExistingHours([item('a', { startTime: null })])).toBe('sin hora')
  })
})

describe('describeMultipleItemsNote (criterio 35)', () => {
  it('con uno solo el catálogo no dice nada: su hoja no se queda corta', () => {
    expect(describeMultipleItemsNote([])).toBeNull()
    expect(describeMultipleItemsNote([item('a', { startTime: '07:30' })])).toBeNull()
  })

  it('con dos horas lo dice y manda a Plantilla', () => {
    const note = describeMultipleItemsNote([
      item('a', { startTime: '07:30' }),
      item('b', { startTime: '19:00' }),
    ])
    expect(note).toBe('Esta actividad tiene 2 horas en tu plantilla · las dos se cambian en Plantilla.')
  })

  it('con tres, el número es el de verdad', () => {
    const note = describeMultipleItemsNote([
      item('a', { startTime: '07:30' }),
      item('b', { startTime: '13:00' }),
      item('c', { startTime: '19:00' }),
    ])
    expect(note).toContain('3 horas')
    expect(note).toContain('las 3 se cambian en Plantilla')
  })

  it('dos veces sin hora no se llaman «horas»', () => {
    expect(describeMultipleItemsNote([item('a'), item('b')])).toContain('2 veces')
  })
})

describe('describeDaysPhrase (criterio 36)', () => {
  it('los cinco de diario se dicen «de lunes a viernes»', () => {
    expect(
      describeDaysPhrase(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']),
    ).toBe('de lunes a viernes')
  })

  it('sábado y domingo, «el fin de semana»; los siete, «todos los días»', () => {
    expect(describeDaysPhrase(['saturday', 'sunday'])).toBe('el fin de semana')
    expect(
      describeDaysPhrase([
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday',
      ]),
    ).toBe('todos los días')
  })

  it('cualquier otra combinación se enumera, y sin ninguno no dice nada', () => {
    expect(describeDaysPhrase(['monday', 'wednesday'])).toBe('lunes y miércoles')
    expect(describeDaysPhrase([])).toBe('')
  })
})

/* ── La semana entera y copiar un día (tajada 4, criterios 42–54) ───────────
 *
 * Todo lo de abajo es puro: la geometría de la cuadrícula y la decisión de qué
 * se copia se cierran aquí, sin navegador y sin sesión.
 */

function gridItem(
  id: string,
  {
    days = ['monday'] as VidaDayOfWeek[],
    startTime = null as string | null,
    durationMinutes = null as number | null,
    title = 'Algo',
    isActive = true,
    status = 'pending' as ActivityStatus,
    activityId = `a-${id}`,
    category = null as { id: string; name: string; color: string | null; icon: string } | null,
  } = {},
): VidaItem {
  return {
    id,
    userId: 1,
    activityId,
    days,
    startTime,
    durationMinutes,
    notes: null,
    isActive,
    orderIndex: 0,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    activity: { id: activityId, title, status, category },
  }
}

function grid(items: VidaItem[]) {
  return buildTemplateWeekGrid({ items, dayStart: DAY_START, dayEnd: DAY_END })
}

describe('buildTemplateWeekGrid — las siete columnas (criterios 42, 43, 44)', () => {
  it('devuelve siete columnas de lunes a domingo, con su cuenta y su tiempo', () => {
    const week = grid([
      gridItem('1', { days: ['monday', 'wednesday'], startTime: '07:00', durationMinutes: 15 }),
      gridItem('2', { days: ['monday'], startTime: '13:00', durationMinutes: 60 }),
      gridItem('3', { days: ['monday'] }),
    ])

    expect(week.columns.map((column) => column.day)).toEqual([
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
    ])

    const monday = week.columns[0]!
    expect(monday.count).toBe(3)
    expect(monday.blocks).toHaveLength(2)
    expect(monday.untimed).toHaveLength(1)
    // 15 + 60: la cabecera dice «3 · 1h 15».
    expect(monday.plannedMinutes).toBe(75)
    expect(week.columns[1]!.count).toBe(0)
    expect(week.columns[2]!.count).toBe(1)
  })

  it('pone cada bloque a su hora y con el alto de su duración, en %', () => {
    const week = grid([
      gridItem('1', { days: ['monday'], startTime: '06:30', durationMinutes: 99 }),
    ])
    const block = week.columns[0]!.blocks[0]!

    expect(week.windowStart).toBe(390)
    expect(week.windowMinutes).toBe(DAY_MINUTES)
    expect(block.topPercent).toBe(0)
    expect(block.heightPercent).toBeCloseTo((99 / DAY_MINUTES) * 100, 6)
  })

  it('un ítem sin duración **se ve igual**: alto mínimo, y `durationMinutes` sigue `null`', () => {
    const week = grid([gridItem('1', { days: ['monday'], startTime: '09:00' })])
    const block = week.columns[0]!.blocks[0]!

    expect(block.durationMinutes).toBeNull()
    expect(block.heightPercent).toBeGreaterThan(0)
    expect(block.heightPercent).toBeCloseTo((TEMPLATE_GRID_MIN_BLOCK_MINUTES / DAY_MINUTES) * 100, 6)
  })

  it('ningún bloque se sale por abajo de la ventana', () => {
    const week = grid([
      gridItem('1', { days: ['monday'], startTime: '22:50', durationMinutes: 45 }),
    ])
    const block = week.columns[0]!.blocks[0]!

    expect(block.topPercent + block.heightPercent).toBeLessThanOrEqual(100.0001)
  })

  it('los «sin hora» quedan aparte, por nombre, y una columna sin ellos los trae vacíos', () => {
    const week = grid([
      gridItem('1', { days: ['monday'], title: 'Zapatos' }),
      gridItem('2', { days: ['monday'], title: 'Agua' }),
    ])

    expect(week.columns[0]!.untimed.map((entry) => entry.activity?.title)).toEqual([
      'Agua',
      'Zapatos',
    ])
    expect(week.columns[1]!.untimed).toEqual([])
  })
})

describe('buildTemplateWeekGrid — la ventana común (A5, aviso de la tajada 1)', () => {
  it('**una sola ventana para las siete columnas**: algo a las 5:00 el domingo mueve a todas', () => {
    const week = grid([
      gridItem('1', { days: ['sunday'], startTime: '05:00', durationMinutes: 30 }),
      gridItem('2', { days: ['monday'], startTime: '07:00', durationMinutes: 30 }),
    ])

    expect(week.windowStart).toBe(5 * 60)
    // El lunes se mide con la misma ventana que el domingo: si cada columna
    // tuviera la suya, comparar columnas sería engañoso.
    const monday = week.columns[0]!.blocks[0]!
    expect(monday.topPercent).toBeCloseTo(((7 * 60 - 5 * 60) / week.windowMinutes) * 100, 6)
  })

  it('sin nada fuera de horario, la ventana es la de los ajustes', () => {
    const week = grid([
      gridItem('1', { days: ['monday'], startTime: '07:00', durationMinutes: 30 }),
    ])

    expect(week.windowStart).toBe(390)
    expect(week.windowEnd).toBe(23 * 60)
  })

  it('las marcas del rail son horas en punto cada dos horas, dentro de la ventana', () => {
    const week = grid([])

    expect(week.hourMarks[0]!.label).toBe('7:00')
    expect(week.hourMarks.map((mark) => mark.label)).toEqual([
      '7:00',
      '9:00',
      '11:00',
      '13:00',
      '15:00',
      '17:00',
      '19:00',
      '21:00',
      '23:00',
    ])
    expect(week.hourMarks[0]!.topPercent).toBeCloseTo((30 / DAY_MINUTES) * 100, 6)
  })
})

describe('buildTemplateWeekGrid — dos que se pisan se ven los dos (criterio 47)', () => {
  it('reparte carriles y **no oculta ninguno**', () => {
    const week = grid([
      gridItem('1', { days: ['monday'], startTime: '09:00', durationMinutes: 60 }),
      gridItem('2', { days: ['monday'], startTime: '09:30', durationMinutes: 60 }),
    ])
    const blocks = week.columns[0]!.blocks

    expect(blocks).toHaveLength(2)
    expect(blocks.map((block) => block.lane)).toEqual([0, 1])
    expect(blocks.every((block) => block.laneCount === 2)).toBe(true)
    expect(blocks.every((block) => block.heightPercent > 0)).toBe(true)
  })

  it('lo que **no** se pisa se queda a toda la columna', () => {
    const week = grid([
      gridItem('1', { days: ['monday'], startTime: '09:00', durationMinutes: 30 }),
      gridItem('2', { days: ['monday'], startTime: '13:00', durationMinutes: 30 }),
    ])

    expect(week.columns[0]!.blocks.map((block) => block.laneCount)).toEqual([1, 1])
  })

  it('tres a la misma hora dan tres carriles', () => {
    const week = grid([
      gridItem('1', { days: ['monday'], startTime: '09:00', durationMinutes: 60 }),
      gridItem('2', { days: ['monday'], startTime: '09:00', durationMinutes: 60 }),
      gridItem('3', { days: ['monday'], startTime: '09:00', durationMinutes: 60 }),
    ])

    expect(week.columns[0]!.blocks.map((block) => block.lane)).toEqual([0, 1, 2])
    expect(week.columns[0]!.blocks.map((block) => block.laneCount)).toEqual([3, 3, 3])
  })

  it('lo ocupado del día **no cuenta dos veces** lo pisado', () => {
    const week = grid([
      gridItem('1', { days: ['monday'], startTime: '09:00', durationMinutes: 60 }),
      gridItem('2', { days: ['monday'], startTime: '09:30', durationMinutes: 30 }),
    ])

    // 9:00 → 10:00 es una hora, no 90 min: el mismo número que `plannedMinutes`.
    expect(week.columns[0]!.plannedMinutes).toBe(60)
    expect(
      buildTemplateDay({
        items: [
          gridItem('1', { days: ['monday'], startTime: '09:00', durationMinutes: 60 }),
          gridItem('2', { days: ['monday'], startTime: '09:30', durationMinutes: 30 }),
        ],
        day: 'monday',
        dayStart: DAY_START,
        dayEnd: DAY_END,
      }).plannedMinutes,
    ).toBe(60)
  })
})

describe('buildTemplateWeekGrid — la leyenda y los estados (criterios 45 y 54)', () => {
  it('una entrada por categoría **de las que aparecen**, por nombre', () => {
    const casa = { id: 'c1', name: 'Casa', color: '#7C3AED', icon: 'house' }
    const comida = { id: 'c2', name: 'Comida', color: '#10B981', icon: 'utensils' }
    const week = grid([
      gridItem('1', { days: ['monday'], startTime: '13:00', durationMinutes: 60, category: comida }),
      gridItem('2', { days: ['tuesday'], startTime: '09:00', category: casa }),
      gridItem('3', { days: ['monday'], startTime: '07:00', category: comida }),
    ])

    expect(week.categories.map((entry) => entry.name)).toEqual(['Casa', 'Comida'])
    expect(week.categories[1]!.color).toBe('#10B981')
  })

  it('dice si hay algo desactivado, que es lo que explica el trazo punteado', () => {
    expect(grid([gridItem('1', { days: ['monday'], startTime: '07:00' })]).hasInactive).toBe(false)
    expect(
      grid([gridItem('1', { days: ['monday'], startTime: '07:00', isActive: false })]).hasInactive,
    ).toBe(true)
  })

  it('una semana sin nada se dice `isEmpty`, y con algo no', () => {
    expect(grid([]).isEmpty).toBe(true)
    expect(grid([gridItem('1', { days: ['monday'] })]).isEmpty).toBe(false)
  })

  it('cada bloque trae su lectura completa: qué, qué día, a qué hora y cuánto', () => {
    const week = grid([
      gridItem('1', {
        days: ['monday'],
        startTime: '07:00',
        durationMinutes: 15,
        title: 'Bañarme',
      }),
      gridItem('2', {
        days: ['monday'],
        startTime: '06:45',
        title: 'Salir a correr',
        isActive: false,
      }),
    ])

    expect(week.columns[0]!.blocks[1]!.label).toBe('Bañarme · lunes a las 7:00 · 15 min')
    expect(week.columns[0]!.blocks[0]!.label).toBe(
      'Salir a correr · lunes a las 6:45 · sin duración · desactivada · no sale en Hoy',
    )
  })
})

describe('buildWeekTotals (criterio 46)', () => {
  it('escribe la línea con los números de verdad', () => {
    const week = grid([
      gridItem('1', {
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        startTime: '07:00',
        durationMinutes: 60,
      }),
      gridItem('2', { days: ['saturday'] }),
    ])
    const totals = buildWeekTotals(week)

    expect(totals.itemsCount).toBe(6)
    expect(totals.timedCount).toBe(5)
    expect(totals.untimedCount).toBe(1)
    expect(totals.plannedMinutes).toBe(300)
    expect(totals.weekMinutes).toBe(DAY_MINUTES * 7)
    expect(totals.text).toBe(
      '6 cosas puestas · 5h a la semana de 115h 30 · tu día va de 6:30 a 23:00',
    )
  })

  it('con una sola cosa no dice «1 cosas»', () => {
    const totals = buildWeekTotals(grid([gridItem('1', { days: ['monday'] })]))

    expect(totals.text.startsWith('1 cosa puesta · ')).toBe(true)
  })

  it('la semana vacía se cuenta en cero y sigue diciendo el horario', () => {
    const totals = buildWeekTotals(grid([]))

    expect(totals.itemsCount).toBe(0)
    expect(totals.text).toBe('0 cosas puestas · 0m a la semana de 115h 30 · tu día va de 6:30 a 23:00')
  })
})

describe('planCopyDay — copiar añade días al ítem que ya existe (A7, criterios 50 y 52)', () => {
  it('le añade los días destino al **mismo ítem**: ni un create', () => {
    const items = [
      gridItem('1', { days: ['monday'], startTime: '07:00', durationMinutes: 15 }),
    ]
    const plan = planCopyDay(items, 'monday', ['tuesday', 'wednesday'])

    expect(plan.updates).toHaveLength(1)
    expect(plan.updates[0]!.input).toEqual({
      id: '1',
      days: ['monday', 'tuesday', 'wednesday'],
    })
    expect(plan.updates[0]!.addedDays).toEqual(['tuesday', 'wednesday'])
    // El cuerpo **no lleva `activityId`**: no se crea nada.
    expect(Object.keys(plan.updates[0]!.input).sort()).toEqual(['days', 'id'])
  })

  it('**no pisa** lo que ya hay: otra actividad igual en el destino, a cualquier hora', () => {
    const items = [
      gridItem('1', {
        days: ['monday'],
        startTime: '07:30',
        activityId: 'pasear',
        title: 'Pasear a las mascotas',
      }),
      gridItem('2', {
        days: ['saturday'],
        startTime: '19:00',
        activityId: 'pasear',
        title: 'Pasear a las mascotas',
      }),
    ]
    const plan = planCopyDay(items, 'monday', ['saturday'])

    expect(plan.updates).toEqual([])
    expect(plan.skipped).toEqual([
      { title: 'Pasear a las mascotas', day: 'saturday', reason: 'other-item' },
    ])
    expect(describeCopySkips(plan.skipped)).toEqual([
      'Pasear a las mascotas ya estaba el sábado, se quedó como estaba',
    ])
  })

  it('un ítem que **ya está** en el destino se dice y no se toca', () => {
    const items = [
      gridItem('1', { days: ['monday', 'tuesday'], startTime: '07:00', title: 'Bañarme' }),
    ]
    const plan = planCopyDay(items, 'monday', ['tuesday', 'wednesday'])

    expect(plan.updates[0]!.addedDays).toEqual(['wednesday'])
    expect(plan.skipped).toEqual([
      { title: 'Bañarme', day: 'tuesday', reason: 'already-there' },
    ])
  })

  it('**los desactivados no se copian** (criterio 52)', () => {
    const items = [
      gridItem('1', { days: ['monday'], startTime: '06:45', isActive: false }),
      gridItem('2', { days: ['monday'], startTime: '07:00' }),
    ]
    const plan = planCopyDay(items, 'monday', ['tuesday'])

    expect(plan.updates.map((update) => update.input.id)).toEqual(['2'])
    expect(plan.skipped).toEqual([])
  })

  it('los **sin hora** también se copian: son parte del día', () => {
    const items = [gridItem('1', { days: ['monday'] })]

    expect(planCopyDay(items, 'monday', ['friday']).updates[0]!.input.days).toEqual([
      'monday',
      'friday',
    ])
  })

  it('el día de origen **nunca** entra como destino', () => {
    const items = [gridItem('1', { days: ['monday'], startTime: '07:00' })]

    expect(planCopyDay(items, 'monday', ['monday']).updates).toEqual([])
    expect(planCopyDay(items, 'monday', []).updates).toEqual([])
  })

  it('las actividades archivadas ni se copian ni bloquean (A8)', () => {
    const items = [
      gridItem('1', { days: ['monday'], startTime: '07:00', status: 'cancelled' }),
    ]

    expect(planCopyDay(items, 'monday', ['tuesday'])).toEqual({ updates: [], skipped: [] })
  })

  it('copiar **no borra nunca nada**: los días que ya tenía siguen en el cuerpo', () => {
    const items = [
      gridItem('1', { days: ['monday', 'sunday'], startTime: '07:00' }),
    ]

    expect(planCopyDay(items, 'monday', ['tuesday']).updates[0]!.input.days).toEqual([
      'monday',
      'tuesday',
      'sunday',
    ])
  })

  it('el resumen agrupa por nombre: «el martes, el miércoles y el jueves»', () => {
    const skips = describeCopySkips([
      { title: 'Leer', day: 'wednesday', reason: 'already-there' },
      { title: 'Leer', day: 'tuesday', reason: 'already-there' },
      { title: 'Leer', day: 'thursday', reason: 'other-item' },
    ])

    expect(skips).toEqual([
      'Leer ya estaba el martes, el miércoles y el jueves, se quedó como estaba',
    ])
  })
})

/**
 * Las filas de la agenda (FEAT-009, tajada 1). Salen del **mismo bucle** que
 * los tramos de la barra, así que lo que se comprueba aquí no es una cuenta
 * nueva: es que la lista y la barra digan lo mismo, y que donde no se sabe, se
 * diga en vez de inventar un hueco.
 */
describe('buildTemplateDay — las filas y sus huecos (criterios 140-146, 149)', () => {
  const gaps = (day: ReturnType<typeof build>) =>
    day.rows.filter((row) => row.kind === 'gap').map((row) => row.id)

  it('los bordes del día llevan hueco: un ítem de 8:00 a 9:00 deja dos (criterio 141)', () => {
    const day = build([item('1', { startTime: '08:00', durationMinutes: 60 })])

    expect(day.rows.map((row) => row.kind)).toEqual(['gap', 'item', 'gap'])
    expect(gaps(day)).toEqual(['free-06:30-08:00', 'free-09:00-23:00'])
  })

  it('el hueco trae sus dos horas y su tamaño, y no es fino (criterios 140 y 143)', () => {
    const day = build([
      item('1', { startTime: '08:00', durationMinutes: 40 }),
      item('2', { startTime: '09:00', durationMinutes: 30 }),
    ])
    const between = day.rows.find((row) => row.kind === 'gap' && row.startMinutes === 8 * 60 + 40)

    expect(between).toMatchObject({
      kind: 'gap',
      startMinutes: 520,
      endMinutes: 540,
      minutes: 20,
      isSliver: false,
    })
  })

  it('un resto de menos de 15 min se pinta igual, marcado como fino (criterio 143)', () => {
    const day = build([
      item('1', { startTime: '08:00', durationMinutes: 55 }),
      item('2', { startTime: '09:00', durationMinutes: 30 }),
    ])
    const sliver = day.rows.find((row) => row.kind === 'gap' && row.minutes === 5)

    expect(sliver).toMatchObject({ isSliver: true, startMinutes: 535, endMinutes: 540 })
  })

  it('la suma de los huecos pintados es exactamente `freeMinutes` (criterio 142)', () => {
    const day = build([
      item('1', { startTime: '08:00', durationMinutes: 60 }),
      item('2', { startTime: '09:00', durationMinutes: 30 }),
      item('3', { startTime: '21:00', durationMinutes: 45 }),
      item('sinHora', {}),
    ])
    const painted = day.rows.reduce(
      (total, row) => (row.kind === 'gap' ? total + row.minutes : total),
      0,
    )

    expect(painted).toBe(day.freeMinutes)
    expect(day.plannedMinutes + painted).toBe(DAY_MINUTES)
  })

  it('con un ítem fuera del horario la ventana manda, y los huecos la siguen (criterios 141 y 142)', () => {
    const day = build([item('1', { startTime: '05:00', durationMinutes: 30 })])
    const painted = day.rows.reduce(
      (total, row) => (row.kind === 'gap' ? total + row.minutes : total),
      0,
    )

    expect(day.windowStart).toBe(5 * 60)
    expect(gaps(day)).toEqual(['free-05:30-23:00'])
    expect(painted).toBe(day.freeMinutes)
  })

  it('en un solape no hay hueco, y el siguiente arranca en el final más tardío (criterio 144)', () => {
    const day = build([
      item('largo', { startTime: '08:00', durationMinutes: 120 }),
      item('dentro', { startTime: '09:00', durationMinutes: 30 }),
    ])

    expect(day.rows.map((row) => row.kind)).toEqual(['gap', 'item', 'item', 'gap'])
    expect(gaps(day)).toEqual(['free-06:30-08:00', 'free-10:00-23:00'])
  })

  it('un ítem sin duración no produce hueco: produce una línea que lo dice (criterio 145)', () => {
    const day = build([
      item('sinDuracion', { startTime: '10:00', title: 'Working at lululemon' }),
      item('despues', { startTime: '14:00', durationMinutes: 45 }),
    ])

    expect(day.rows.map((row) => row.kind)).toEqual(['gap', 'item', 'unknown', 'item', 'gap'])
    expect(day.rows[2]).toMatchObject({
      kind: 'unknown',
      untilMinutes: 14 * 60,
      isDayEnd: false,
    })
  })

  it('la barra no se entera: el tramo libre sigue en `segments` aunque la fila no lo pinte', () => {
    const day = build([
      item('sinDuracion', { startTime: '10:00' }),
      item('despues', { startTime: '14:00', durationMinutes: 45 }),
    ])

    expect(day.segments.map((segment) => segment.id)).toContain('free-10:00-14:00')
    expect(day.rows.some((row) => row.kind === 'gap' && row.startMinutes === 10 * 60)).toBe(false)
    expect(day.freeMinutes).toBe(DAY_MINUTES - 45)
  })

  it('si el ítem sin duración es el último, la línea habla del fin del día (criterio 146)', () => {
    const day = build([item('sinDuracion', { startTime: '10:00' })])

    expect(day.rows.map((row) => row.kind)).toEqual(['gap', 'item', 'unknown'])
    expect(day.rows[2]).toMatchObject({ kind: 'unknown', untilMinutes: 23 * 60, isDayEnd: true })
  })

  it('dos seguidos sin duración: una línea por cada uno y ningún hueco entre ellos (criterio 146)', () => {
    const day = build([
      item('uno', { startTime: '10:00' }),
      item('dos', { startTime: '12:00' }),
    ])

    expect(day.rows.map((row) => row.kind)).toEqual(['gap', 'item', 'unknown', 'item', 'unknown'])
    expect(day.rows[2]).toMatchObject({ untilMinutes: 12 * 60, isDayEnd: false })
    expect(day.rows[4]).toMatchObject({ untilMinutes: 23 * 60, isDayEnd: true })
  })

  it('un día sin ítems con hora no pinta ninguna fila (criterio 149)', () => {
    expect(build([item('sinHora', {})]).rows).toEqual([])
    expect(build([]).rows).toEqual([])
  })

  /*
   * Los dos bordes que ningún criterio cubre, decididos aquí: en los dos casos
   * la línea se emite igual y **nunca** se emite un hueco por un ítem del que
   * no se sabe dónde acaba.
   */

  it('borde: dos ítems a la misma hora y el primero sin duración — línea, nunca hueco', () => {
    const day = build([
      item('sinDuracion', { startTime: '09:00', title: 'Arreglar la cama' }),
      item('mismaHora', { startTime: '09:00', durationMinutes: 30, title: 'Bañarme' }),
    ])

    expect(day.rows.map((row) => row.kind)).toEqual(['gap', 'item', 'unknown', 'item', 'gap'])
    // El corte cae **en su propia hora**: la línea no retrocede por debajo de
    // ella, y no se cuela ningún hueco de cero ni negativo.
    expect(day.rows[2]).toMatchObject({ untilMinutes: 9 * 60, isDayEnd: false })
    expect(gaps(day)).toEqual(['free-06:30-09:00', 'free-09:30-23:00'])
  })

  it('borde: solape con un ítem sin duración dentro (criterios 144 × 145)', () => {
    const day = build([
      item('largo', { startTime: '08:00', durationMinutes: 120, title: 'Trabajar' }),
      item('sinDuracion', { startTime: '09:00', title: 'Café' }),
      item('luego', { startTime: '09:30', durationMinutes: 30, title: 'Daily' }),
    ])

    // Ni un hueco entre los tres —el largo los cubre— y la línea del que no
    // dice cuánto dura se emite igual en el primer corte que viene detrás.
    expect(day.rows.map((row) => row.kind)).toEqual([
      'gap',
      'item',
      'item',
      'unknown',
      'item',
      'gap',
    ])
    expect(day.rows[3]).toMatchObject({ untilMinutes: 9 * 60 + 30, isDayEnd: false })
    expect(gaps(day)).toEqual(['free-06:30-08:00', 'free-10:00-23:00'])
  })
})
