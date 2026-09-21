import { describe, expect, it } from 'vitest'
import type { ActivityDayPlanItem } from '@/features/vida/types/activity-day-plan.types'
import {
  REVIEW_LOOKBACK_DAYS,
  buildDayStrip,
  clampToPlanningWindow,
  clampToReviewWindow,
  describePlanningWindowEdge,
  describeReviewWindowEdge,
  getPlanningWindow,
  getReviewWindow,
  isEditableDate,
  isInPlanningWindow,
  planItemsToSetItems,
  sameWeekdayLastWeek,
} from '@/features/vida/utils/vida-window.utils'

/**
 * La ventana de planeación y la tira (criterios 31, 35, 36, 38).
 *
 * Todas las funciones reciben el «hoy» por parámetro: no hace falta tocar el
 * reloj global. El hoy de referencia es **viernes 18 de septiembre de 2026**,
 * el mismo del render aprobado.
 */

const FRIDAY = '2026-09-18'

describe('getPlanningWindow', () => {
  it('va del lunes de esta semana al domingo de la que viene (D5)', () => {
    expect(getPlanningWindow(FRIDAY)).toEqual({ from: '2026-09-14', to: '2026-09-27' })
  })

  it('un domingo sigue perteneciendo a su semana, no a la siguiente', () => {
    expect(getPlanningWindow('2026-09-20')).toEqual({ from: '2026-09-14', to: '2026-09-27' })
  })

  it('un lunes abre la ventana en él mismo', () => {
    expect(getPlanningWindow('2026-09-14')).toEqual({ from: '2026-09-14', to: '2026-09-27' })
  })
})

describe('isInPlanningWindow', () => {
  it('deja dentro los días ya pasados de esta semana: se miran (criterio 38)', () => {
    expect(isInPlanningWindow('2026-09-14', FRIDAY)).toBe(true)
    expect(isInPlanningWindow('2026-09-17', FRIDAY)).toBe(true)
  })

  it('deja fuera la semana pasada y la tercera', () => {
    expect(isInPlanningWindow('2026-09-13', FRIDAY)).toBe(false)
    expect(isInPlanningWindow('2026-09-28', FRIDAY)).toBe(false)
  })
})

describe('clampToPlanningWindow', () => {
  it('recorta al borde en vez de dejar la pantalla sin día (criterio 35)', () => {
    expect(clampToPlanningWindow('2026-08-01', FRIDAY)).toBe('2026-09-14')
    expect(clampToPlanningWindow('2026-12-25', FRIDAY)).toBe('2026-09-27')
  })

  it('sin parámetro, o con basura, se queda en hoy', () => {
    expect(clampToPlanningWindow(null, FRIDAY)).toBe(FRIDAY)
    expect(clampToPlanningWindow('mañana', FRIDAY)).toBe(FRIDAY)
    expect(clampToPlanningWindow('2026-9-1', FRIDAY)).toBe(FRIDAY)
  })

  it('un día válido de la ventana pasa tal cual', () => {
    expect(clampToPlanningWindow('2026-09-22', FRIDAY)).toBe('2026-09-22')
  })
})

describe('isEditableDate', () => {
  it('hoy y los futuros de la ventana se planean', () => {
    expect(isEditableDate(FRIDAY, FRIDAY)).toBe(true)
    expect(isEditableDate('2026-09-27', FRIDAY)).toBe(true)
  })

  it('un día pasado no se toca (D3, criterio 38)', () => {
    expect(isEditableDate('2026-09-17', FRIDAY)).toBe(false)
    expect(isEditableDate('2026-09-14', FRIDAY)).toBe(false)
  })

  it('fuera de la ventana tampoco, aunque sea futuro', () => {
    expect(isEditableDate('2026-09-28', FRIDAY)).toBe(false)
  })
})

describe('sameWeekdayLastWeek', () => {
  it('son siete días atrás, el mismo día de la semana (D7)', () => {
    expect(sameWeekdayLastWeek('2026-09-19')).toBe('2026-09-12')
    expect(sameWeekdayLastWeek(FRIDAY)).toBe('2026-09-11')
  })

  it('cruza el cambio de mes sin inventarse nada', () => {
    expect(sameWeekdayLastWeek('2026-10-03')).toBe('2026-09-26')
  })
})

describe('buildDayStrip', () => {
  it('son siete días y empiezan dos antes del que se mira (criterio 31)', () => {
    const strip = buildDayStrip('2026-09-19', FRIDAY)
    expect(strip).toHaveLength(7)
    expect(strip.map((day) => day.date)).toEqual([
      '2026-09-17',
      '2026-09-18',
      '2026-09-19',
      '2026-09-20',
      '2026-09-21',
      '2026-09-22',
      '2026-09-23',
    ])
  })

  it('marca hoy, el seleccionado y los pasados por separado', () => {
    const strip = buildDayStrip('2026-09-19', FRIDAY)
    expect(strip.find((day) => day.isToday)?.date).toBe(FRIDAY)
    expect(strip.find((day) => day.isSelected)?.date).toBe('2026-09-19')
    expect(strip.filter((day) => day.isPast).map((day) => day.date)).toEqual(['2026-09-17'])
  })

  it('pinta las etiquetas del render: «Sáb» y el número', () => {
    const saturday = buildDayStrip('2026-09-19', FRIDAY).find((day) => day.date === '2026-09-19')
    expect(saturday?.weekdayLabel).toBe('Sáb')
    expect(saturday?.longLabel).toBe('sábado')
    expect(saturday?.dayOfMonth).toBe(19)
  })

  it('contra el borde de atrás se desliza, no encoge', () => {
    const strip = buildDayStrip('2026-09-14', '2026-09-14')
    expect(strip.map((day) => day.date)).toEqual([
      '2026-09-14',
      '2026-09-15',
      '2026-09-16',
      '2026-09-17',
      '2026-09-18',
      '2026-09-19',
      '2026-09-20',
    ])
  })

  it('contra el borde de delante tampoco se sale de la ventana', () => {
    const strip = buildDayStrip('2026-09-27', FRIDAY)
    expect(strip).toHaveLength(7)
    expect(strip[0]?.date).toBe('2026-09-21')
    expect(strip[6]?.date).toBe('2026-09-27')
    expect(strip.every((day) => day.date <= '2026-09-27')).toBe(true)
  })

  it('un día de fuera se recorta antes de armar la tira', () => {
    const strip = buildDayStrip('2027-01-01', FRIDAY)
    expect(strip.find((day) => day.isSelected)?.date).toBe('2026-09-27')
  })
})

describe('planItemsToSetItems', () => {
  function item(
    id: string,
    startTime: string,
    endTime: string,
    orderIndex = 0,
  ): ActivityDayPlanItem {
    return {
      id,
      userId: 1,
      activityId: `a-${id}`,
      date: '2026-09-12',
      startTime,
      endTime,
      orderIndex,
      completedAt: null,
      createdAt: '2026-09-12T00:00:00.000Z',
      updatedAt: '2026-09-12T00:00:00.000Z',
    }
  }

  it('trae las horas y las duraciones tal cual (criterio 36)', () => {
    expect(planItemsToSetItems([item('1', '08:00', '08:40')])).toEqual([
      { activityId: 'a-1', startTime: '08:00', endTime: '08:40', orderIndex: 0 },
    ])
  })

  it('ordena por hora y renumera, venga como venga el origen', () => {
    const copied = planItemsToSetItems([
      item('2', '13:00', '14:00', 7),
      item('1', '08:00', '08:40', 3),
    ])
    expect(copied.map((entry) => entry.activityId)).toEqual(['a-1', 'a-2'])
    expect(copied.map((entry) => entry.orderIndex)).toEqual([0, 1])
  })

  it('normaliza un `HH:mm:ss` viejo antes de mandarlo al API', () => {
    expect(planItemsToSetItems([item('1', '08:00:00', '08:40:00')])[0]).toMatchObject({
      startTime: '08:00',
      endTime: '08:40',
    })
  })

  it('un día vacío se copia como lista vacía, sin inventarse nada', () => {
    expect(planItemsToSetItems([])).toEqual([])
  })
})

describe('describePlanningWindowEdge', () => {
  it('dice hasta dónde se planea, sin botón muerto (criterio 35)', () => {
    expect(describePlanningWindowEdge(FRIDAY)).toBe(
      'Se planea esta semana y la que viene: hasta el domingo 27.',
    )
  })
})

/**
 * **La ventana de mirar atrás** (FEAT-006, A3). Existe porque la de planear no
 * sirve para revisar: un lunes, «ayer» es domingo y la de planear lo recorta
 * —la revisión abriría el lunes en vez del domingo—.
 */
describe('getReviewWindow y clampToReviewWindow', () => {
  it('arranca en el **lunes** de la semana de hoy − 14 y llega hasta donde llega planear', () => {
    expect(REVIEW_LOOKBACK_DAYS).toBe(14)
    expect(getReviewWindow(FRIDAY)).toEqual({ from: '2026-08-31', to: '2026-09-27' })
  })

  it('**el domingo anterior es alcanzable un lunes**, que es el defecto que corrige', () => {
    const monday = '2026-09-21'
    const sunday = '2026-09-20'
    expect(clampToPlanningWindow(sunday, monday)).toBe('2026-09-21')
    expect(clampToReviewWindow(sunday, monday)).toBe(sunday)
  })

  it('deja ver un día futuro —el criterio 4 lo necesita— y recorta lo que se sale', () => {
    expect(clampToReviewWindow('2026-09-25', FRIDAY)).toBe('2026-09-25')
    expect(clampToReviewWindow('2026-10-30', FRIDAY)).toBe('2026-09-27')
    expect(clampToReviewWindow('2026-01-01', FRIDAY)).toBe('2026-08-31')
    expect(clampToReviewWindow(null, FRIDAY)).toBe(FRIDAY)
    expect(clampToReviewWindow('lo que sea', FRIDAY)).toBe(FRIDAY)
  })

  it('el borde se dice con palabras, no con una flecha muerta', () => {
    expect(describeReviewWindowEdge(FRIDAY)).toBe('Se miran los días ya vividos: desde el lunes 31.')
  })
})

describe('buildDayStrip con la ventana de la revisión (A3)', () => {
  it('sin tercer parámetro se comporta **exactamente** como antes', () => {
    expect(buildDayStrip(FRIDAY, FRIDAY)).toEqual(
      buildDayStrip(FRIDAY, FRIDAY, getPlanningWindow(FRIDAY)),
    )
  })

  it('con la ventana de revisión, un lunes la tira alcanza el domingo de atrás', () => {
    const monday = '2026-09-21'
    const days = buildDayStrip(monday, monday, getReviewWindow(monday)).map((day) => day.date)
    expect(days).toContain('2026-09-20')
    expect(days).toHaveLength(7)
  })

  it('mirando un día viejo, ningún día pintado se sale de la ventana', () => {
    const window = getReviewWindow(FRIDAY)
    for (const day of buildDayStrip('2026-09-01', FRIDAY, window)) {
      expect(day.date >= window.from && day.date <= window.to).toBe(true)
    }
  })
})
