import { describe, expect, it } from 'vitest'
import type { ActivityCategory } from '@/features/vida/types/activity-category.types'
import type { ActivityFollowUp } from '@/features/vida/types/activity-followup.types'
import type { VidaGoal } from '@/features/vida/types/vida-goal.types'
import {
  buildGoalArcs,
  DEFAULT_GOAL_ACTIVE_DAYS,
  GOAL_FIT_OK_MARGIN_MINUTES,
} from '@/features/vida/utils/vida-goals.utils'

/**
 * **La suma viva de una meta** (FEAT-016, tajada 2, criterios 489–499).
 *
 * Aquí se prueba la aritmética entera —la sesión en marcha, la hora a la que
 * paras, la frase sin reproche, «sin dato», el día pasado— porque los
 * componentes de Vida no llevan test co-locado: lo que pinta la pantalla se
 * comprueba en `VidaHoyPage.test.tsx`.
 *
 * El día de las pruebas es el **viernes 18 de septiembre de 2026**, el mismo
 * que usa el test de la página.
 */

const DATE = '2026-09-18'

const WORK: VidaGoal = {
  id: 'goal-work',
  slug: 'work',
  name: 'Trabajo',
  icon: 'briefcase',
  color: '#0284c7',
  targetMinutes: 480,
  // De lunes a viernes, como nace la meta automática (criterio 575). El día de
  // las pruebas —viernes 18— cuenta; el sábado 19 no.
  activeDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  orderIndex: 0,
}

const STUDY: VidaGoal = {
  id: 'goal-study',
  slug: 'study',
  name: 'Estudiar',
  icon: 'book',
  color: '#f59e0b',
  targetMinutes: 60,
  // Los siete días: es la segunda meta con **sus propios** días, y con ella se
  // mide el criterio 579 sin inventar una tercera.
  activeDays: [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ],
  orderIndex: 1,
}

/** La jornada más larga que el módulo admite: 24 h (criterio 565). */
const LONG_DAY: VidaGoal = {
  id: 'goal-long',
  slug: 'long',
  name: 'Jornada larga',
  icon: 'briefcase',
  color: '#0284c7',
  targetMinutes: 1440,
  activeDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  orderIndex: 0,
}

function category(id: string, name: string, goal: VidaGoal | null): ActivityCategory {
  return {
    id,
    userId: 1,
    orderIndex: 0,
    name,
    description: null,
    icon: null,
    color: null,
    goalId: goal?.id ?? null,
    goal,
  }
}

function session(input: {
  id: string
  startTime: string
  durationMinutes: number | null
  categoryId?: string | null
  title?: string
  date?: string
}): ActivityFollowUp {
  const categoryId = input.categoryId ?? null
  return {
    id: input.id,
    activityId: `a-${input.id}`,
    date: input.date ?? DATE,
    startTime: input.startTime,
    durationMinutes: input.durationMinutes,
    endTime: null,
    endDate: null,
    endDateTime: null,
    notes: null,
    activity: {
      id: `a-${input.id}`,
      title: input.title ?? 'Algo',
      category: categoryId
        ? { id: categoryId, name: categoryId, color: null, icon: null }
        : null,
    },
  }
}

/** 9:00 en minutos desde medianoche, que es la hora del render. */
const AT_9 = 9 * 60

/**
 * **La hora a la que se acaba el día del usuario**, la de por defecto del
 * módulo y la del render 20 («te quedan 9h 35m hasta las 23:00»). Contra ella
 * mide el semáforo si lo que falta todavía cabe hoy (FEAT-019, criterio 566).
 */
const DAY_END = '23:00'

describe('buildGoalArcs', () => {
  it('suma solo las sesiones de las categorías que apuntan a la meta (criterio 490)', () => {
    const { arcs } = buildGoalArcs({
      followUps: [
        session({ id: 's1', startTime: '08:00', durationMinutes: 60, categoryId: 'trabajo' }),
        session({ id: 's2', startTime: '10:00', durationMinutes: 30, categoryId: 'consultoria' }),
        // Una categoría **sin** meta: no suma y tampoco se confiesa.
        session({ id: 's3', startTime: '11:00', durationMinutes: 45, categoryId: 'casa' }),
      ],
      date: DATE,
      nowMinutes: 12 * 60,
      categories: [
        category('trabajo', 'Trabajo', WORK),
        category('consultoria', 'Consultoría', WORK),
        category('casa', 'Casa', null),
      ],
      isPastDay: false,
      dayEnd: DAY_END,
    })

    expect(arcs).toHaveLength(1)
    expect(arcs[0].goal).toEqual(WORK)
    expect(arcs[0].categoryIds).toEqual(['trabajo', 'consultoria'])
    expect(arcs[0].workedMinutes).toBe(90)
    expect(arcs[0].workedLabel).toBe('1h 30')
    expect(arcs[0].share).toBeCloseTo(90 / 480)
  })

  it('cuenta la sesión en marcha hasta el minuto actual (criterio 491)', () => {
    const base = {
      followUps: [
        session({
          id: 's1',
          startTime: '09:00',
          durationMinutes: null,
          categoryId: 'trabajo',
          title: 'Working at lululemon',
        }),
      ],
      date: DATE,
      categories: [category('trabajo', 'Trabajo', WORK)],
      isPastDay: false,
      dayEnd: DAY_END,
    }

    const at1030 = buildGoalArcs({ ...base, nowMinutes: 10 * 60 + 30 }).arcs[0]
    // Una hora de reloj más tarde, una hora más: el arco se mueve con el minuto
    // vivo, sin recargar y sin pedir nada.
    const at1130 = buildGoalArcs({ ...base, nowMinutes: 11 * 60 + 30 }).arcs[0]

    expect(at1030.workedMinutes).toBe(90)
    expect(at1130.workedMinutes).toBe(150)
    expect(at1030.runningTitle).toBe('Working at lululemon')
    expect(at1030.runningSince).toBe('9:00')
  })

  // Enmienda el criterio 492 de FEAT-016, que pedía justo lo contrario: una
  // hora dentro del arco y «ningún texto que obligue a restar». El usuario vio
  // eso en producción y tuvo que preguntar «¿falta tiempo? ¿esa es la hora?»,
  // porque el arco mide horas trabajadas y dentro había una hora del reloj.
  // Ahora dentro va la resta —que es lo que el arco mide— y la hora baja a
  // `line`, que en este estado se ve de verdad (criterio 560).
  it('dentro del arco va lo que falta, no la hora (criterio 559)', () => {
    const { arcs } = buildGoalArcs({
      followUps: [session({ id: 's1', startTime: '08:00', durationMinutes: 220, categoryId: 'trabajo' })],
      date: DATE,
      // 11:45: quedan 260 min de los 480 → 11:45 + 4h 20 = 16:05.
      nowMinutes: 11 * 60 + 45,
      categories: [category('trabajo', 'Trabajo', WORK)],
      isPastDay: false,
      dayEnd: DAY_END,
    })

    expect(arcs[0].arcValue).toBe('4h 20')
    expect(arcs[0].arcCaption).toEqual(['Te faltan'])
    expect(arcs[0].variant).toBe('missing')
    // La hora no se pierde: sigue calculada y sigue dicha, palabra por palabra
    // como antes (criterio 560). Si esta línea cambia, el 560 está roto.
    expect(arcs[0].stopAtTime).toBe('16:05')
    expect(arcs[0].line).toBe('Llevas 3 h 40 min. A este ritmo paras a las 16:05.')
    expect(arcs[0].passedAtTime).toBeNull()
    // Y lo que falta no se dice dos veces: dentro va la resta, fuera la hora.
    expect(arcs[0].line).not.toContain('4h 20')
  })

  it.each([
    ['a este ritmo', 11 * 60 + 45, 220, false, WORK],
    ['sin nada trabajado', 11 * 60 + 45, 0, false, WORK],
    ['pasada la meta', 18 * 60, 560, false, WORK],
    ['un dia que ya termino', 11 * 60 + 45, 300, true, WORK],
    // La jornada mas larga que cabe en un dia, en los dos estados que estrena
    // esta feature: el rotulo es el mismo «Te faltan» y el que crece es el
    // numero («24h», «23h 59»), que se mide aparte en el navegador (565).
    ['la jornada mas larga sin empezar', 6 * 60, 0, false, LONG_DAY],
    ['la jornada mas larga a medias', 11 * 60 + 45, 1, false, LONG_DAY],
    ['la jornada mas larga pasada', 23 * 60, 1450, false, LONG_DAY],
  ])(
    'ninguna linea del rotulo se sale del arco: %s',
    (_caso, nowMinutes, workedMinutes, isPastDay, goal) => {
      const { arcs } = buildGoalArcs({
        followUps: workedMinutes
          ? [
              session({
                id: 's1',
                startTime: '00:00',
                durationMinutes: workedMinutes,
                categoryId: 'trabajo',
              }),
            ]
          : [],
        date: DATE,
        nowMinutes,
        categories: [category('trabajo', 'Trabajo', goal)],
        isPastDay,
        dayEnd: DAY_END,
      })

      // 18 caracteres es lo que el render aprobado metia dentro del arco
      // («A ESTE RITMO PARAS», 18 · panel 1 de `18-vida-arcos-familia.html`).
      // A 9,5 px con `letter-spacing: 0.06em` eso ocupa ~112 de las ~147
      // unidades que caben a esa altura; 24 caracteres ocupaban ~149 y el
      // trazo se comia las puntas. Esta prueba existe porque eso llego a
      // produccion y el usuario leyo un fragmento.
      for (const linea of arcs[0].arcCaption) {
        expect(linea.length).toBeLessThanOrEqual(18)
      }
      expect(arcs[0].arcCaption.length).toBeLessThanOrEqual(2)
    },
  )

  it('pasada la jornada dice el dato y ni un adjetivo (criterio 493)', () => {
    const { arcs } = buildGoalArcs({
      followUps: [
        session({ id: 's1', startTime: '09:00', durationMinutes: 300, categoryId: 'trabajo' }),
        session({ id: 's2', startTime: '14:00', durationMinutes: null, categoryId: 'trabajo' }),
      ],
      date: DATE,
      nowMinutes: 18 * 60 + 10,
      categories: [category('trabajo', 'Trabajo', WORK)],
      isPastDay: false,
      dayEnd: DAY_END,
    })

    const arc = arcs[0]
    expect(arc.workedMinutes).toBe(550)
    expect(arc.overMinutes).toBe(70)
    // La hora se saca recorriendo los tramos, no restando de «ahora»: los 480
    // se cumplen a los 180 minutos del segundo tramo, que empezó a las 14:00.
    expect(arc.passedAtTime).toBe('17:00')
    expect(arc.line).toBe('Llevas 9 h 10 min. Pasaste las 8 h a las 17:00.')
    expect(arc.line).not.toMatch(/!|demasiado|exceso|cuidado|deberías|ya basta/i)
    // El trazo se topa en el arco entero: no se sale ni se pinta dos veces.
    expect(arc.share).toBe(1)
  })

  it('las sesiones sin categoría se confiesan aparte, y las de una categoría sin meta no (criterio 494)', () => {
    const result = buildGoalArcs({
      followUps: [
        session({ id: 's1', startTime: '08:00', durationMinutes: 60, categoryId: 'trabajo' }),
        session({ id: 's2', startTime: '09:30', durationMinutes: 100, categoryId: null }),
        session({ id: 's3', startTime: '11:30', durationMinutes: 60, categoryId: 'casa' }),
        session({ id: 's4', startTime: '12:30', durationMinutes: 60, categoryId: null }),
      ],
      date: DATE,
      nowMinutes: 14 * 60,
      categories: [category('trabajo', 'Trabajo', WORK), category('casa', 'Casa', null)],
      isPastDay: false,
      dayEnd: DAY_END,
    })

    expect(result.noDataMinutes).toBe(160)
    expect(result.noDataLabel).toBe('2 h 40 min sin dato hoy.')
    // «Casa» no apunta a ninguna meta: de esa ya se sabe que no cuenta.
    expect(result.noDataLabel).not.toContain('Casa')
    expect(result.arcs[0].workedMinutes).toBe(60)
  })

  it('sin la palabra «sin dato» cuando no hay ninguna sesión sin categoría', () => {
    const result = buildGoalArcs({
      followUps: [session({ id: 's1', startTime: '08:00', durationMinutes: 60, categoryId: 'trabajo' })],
      date: DATE,
      nowMinutes: 14 * 60,
      categories: [category('trabajo', 'Trabajo', WORK)],
      isPastDay: false,
      dayEnd: DAY_END,
    })

    expect(result.noDataMinutes).toBe(0)
    expect(result.noDataLabel).toBe('')
  })

  // Enmienda el criterio 495 de FEAT-016 en una sola cosa: el número grande. Con
  // cero trabajado lo que falta es la jornada entera, y eso es lo que se dice —
  // no una hora de parada proyectada desde cero. `line` no se toca (criterio
  // 561): la fórmula en condicional sigue siendo exacta y sigue viéndose.
  it('con cero minutos faltan las ocho horas enteras (criterio 561, D-C)', () => {
    const { arcs } = buildGoalArcs({
      followUps: [],
      date: DATE,
      nowMinutes: AT_9,
      categories: [category('trabajo', 'Trabajo', WORK)],
      isPastDay: false,
      dayEnd: DAY_END,
    })

    expect(arcs).toHaveLength(1)
    expect(arcs[0].workedMinutes).toBe(0)
    expect(arcs[0].share).toBe(0)
    expect(arcs[0].arcValue).toBe('8h')
    expect(arcs[0].arcCaption).toEqual(['Te faltan'])
    expect(arcs[0].variant).toBe('missing')
    expect(arcs[0].stopAtTime).toBe('17:00')
    expect(arcs[0].line).toBe('Si arrancas ahora, acabarías a las 17:00.')
  })

  // Los dos casos en que **no falta nada que anunciar**, y por eso el arco no
  // cambia una coma respecto a FEAT-016: dentro sigue una hora (o lo
  // registrado) y la frase se queda donde estaba, a 1×1 px.
  it.each([
    ['pasada la meta hoy', 18 * 60, 560, false, 'passed', '17:00'],
    ['un día pasado sin llegar', 11 * 60 + 45, 300, true, 'logged', '5h'],
    ['un día pasado que se pasó', 11 * 60 + 45, 540, true, 'passed', '17:00'],
  ])(
    'fuera de «te faltan» el arco no cambia: %s (criterios 562 y 563)',
    (_caso, nowMinutes, workedMinutes, isPastDay, variant, arcValue) => {
      const { arcs } = buildGoalArcs({
        followUps: [
          session({
            id: 's1',
            startTime: '09:00',
            durationMinutes: workedMinutes,
            categoryId: 'trabajo',
          }),
        ],
        date: DATE,
        nowMinutes,
        categories: [category('trabajo', 'Trabajo', WORK)],
        isPastDay,
        dayEnd: DAY_END,
      })

      expect(arcs[0].variant).toBe(variant)
      expect(arcs[0].arcValue).toBe(arcValue)
      expect(arcs[0].arcCaption).not.toContain('Te faltan')
    },
  )

  it('en un día pasado se cuenta en pasado y sin proyección (criterio 497, D-B)', () => {
    const past = '2026-09-17'
    const { arcs, noDataLabel } = buildGoalArcs({
      followUps: [
        session({ id: 's1', startTime: '09:00', durationMinutes: 300, categoryId: 'trabajo', date: past }),
        session({ id: 's2', startTime: '15:00', durationMinutes: 40, categoryId: null, date: past }),
      ],
      date: past,
      nowMinutes: null,
      categories: [category('trabajo', 'Trabajo', WORK)],
      isPastDay: true,
      dayEnd: DAY_END,
    })

    expect(arcs[0].workedMinutes).toBe(300)
    expect(arcs[0].stopAtTime).toBeNull()
    expect(arcs[0].line).toBe('Registraste 5 h de Trabajo.')
    expect(arcs[0].line).not.toContain('ritmo')
    expect(arcs[0].arcValue).toBe('5h')
    expect(noDataLabel).toBe('40 min sin dato ese día.')
  })

  it('en un día pasado que se pasó de la meta, la misma frase sin reproche', () => {
    const past = '2026-09-17'
    const { arcs } = buildGoalArcs({
      followUps: [
        session({ id: 's1', startTime: '08:00', durationMinutes: 540, categoryId: 'trabajo', date: past }),
      ],
      date: past,
      nowMinutes: null,
      categories: [category('trabajo', 'Trabajo', WORK)],
      isPastDay: true,
      dayEnd: DAY_END,
    })

    expect(arcs[0].passedAtTime).toBe('16:00')
    expect(arcs[0].line).toBe('Registraste 9 h de Trabajo. Pasaste las 8 h a las 16:00.')
    expect(arcs[0].line).not.toMatch(/!|demasiado|exceso/i)
  })

  it('una sesión empezada antes de la hora de inicio del día cuenta entera (D-A)', () => {
    const { arcs } = buildGoalArcs({
      // El día del usuario arranca a las 6:30; esta empezó a las 5:00.
      followUps: [session({ id: 's1', startTime: '05:00', durationMinutes: 120, categoryId: 'trabajo' })],
      date: DATE,
      nowMinutes: 8 * 60,
      categories: [category('trabajo', 'Trabajo', WORK)],
      isPastDay: false,
      dayEnd: DAY_END,
    })

    expect(arcs[0].workedMinutes).toBe(120)
  })

  it('sin ninguna categoría apuntando a una meta no hay ningún arco (la puerta de la tajada 3)', () => {
    const result = buildGoalArcs({
      followUps: [session({ id: 's1', startTime: '08:00', durationMinutes: 60, categoryId: 'casa' })],
      date: DATE,
      nowMinutes: AT_9,
      categories: [category('casa', 'Casa', null)],
      isPastDay: false,
      dayEnd: DAY_END,
    })

    expect(result.arcs).toEqual([])
  })

  it('las sesiones de otro día no entran', () => {
    const { arcs } = buildGoalArcs({
      followUps: [
        session({ id: 's1', startTime: '08:00', durationMinutes: 60, categoryId: 'trabajo' }),
        session({
          id: 's2',
          startTime: '08:00',
          durationMinutes: 300,
          categoryId: 'trabajo',
          date: '2026-09-17',
        }),
      ],
      date: DATE,
      nowMinutes: AT_9,
      categories: [category('trabajo', 'Trabajo', WORK)],
      isPastDay: false,
      dayEnd: DAY_END,
    })

    expect(arcs[0].workedMinutes).toBe(60)
  })


  /**
   * **El semáforo** (FEAT-019, tajada 2, criterios 566–574).
   *
   * Mide **si lo que falta cabe antes de que se acabe el día**, no el
   * porcentaje de la meta. El usuario pidió el porcentaje al pie de la letra y
   * lo descartó al ver el render: por porcentaje, un lunes a las 9:15 con 15
   * minutos hechos sale rojo, y el arco estaría regañando por ir al ritmo de
   * cualquier lunes. El caso del 570 está aquí abajo como red de esa decisión.
   */
  describe('el semáforo (criterios 566-574)', () => {
    it.each([
      // `margen = (23:00 − ahora) − lo que falta`. Con la meta de 8 h:
      // a las 9:00 con 60 min hechos → 840 − 420 = 420, de sobra.
      ['de sobra', AT_9, 60, 'ok', 420],
      // A las 16:30 con 60 min hechos → 390 − 420 = −30: hoy ya no da.
      ['ya no cabe', 16 * 60 + 30, 60, 'over', -30],
      // A las 15:30 con 60 min hechos → 450 − 420 = 30: cabe justo.
      ['cabe justo', 15 * 60 + 30, 60, 'tight', 30],
      // El borde exacto del umbral: 61 es verde, 60 todavía es naranja.
      ['el borde del umbral, 61', 14 * 60 + 59, 60, 'ok', 61],
      ['el borde del umbral, 60', 15 * 60, 60, 'tight', 60],
    ])(
      'el color sale del margen, no del porcentaje: %s (criterios 566, 567, 568, 569)',
      (_caso, nowMinutes, workedMinutes, fitLevel, fitMinutes) => {
        const { arcs } = buildGoalArcs({
          followUps: [
            session({
              id: 's1',
              startTime: '08:00',
              durationMinutes: workedMinutes,
              categoryId: 'trabajo',
            }),
          ],
          date: DATE,
          nowMinutes,
          categories: [category('trabajo', 'Trabajo', WORK)],
          isPastDay: false,
          dayEnd: DAY_END,
        })

        expect(arcs[0].fitMinutes).toBe(fitMinutes)
        expect(arcs[0].fitLevel).toBe(fitLevel)
      },
    )

    it('el cero de margen cae en naranja y el −1 en rojo (criterios 568 y 569)', () => {
      const at = (nowMinutes: number) =>
        buildGoalArcs({
          followUps: [
            session({ id: 's1', startTime: '08:00', durationMinutes: 60, categoryId: 'trabajo' }),
          ],
          date: DATE,
          nowMinutes,
          categories: [category('trabajo', 'Trabajo', WORK)],
          isPastDay: false,
          dayEnd: DAY_END,
        }).arcs[0]

      // 23:00 − 16:00 = 420, y faltan 420: margen 0, cabe justo.
      expect(at(16 * 60).fitMinutes).toBe(0)
      expect(at(16 * 60).fitLevel).toBe('tight')
      // Un minuto más tarde ya no cabe.
      expect(at(16 * 60 + 1).fitMinutes).toBe(-1)
      expect(at(16 * 60 + 1).fitLevel).toBe('over')
    })

    /**
     * **La prueba viva de la decisión del usuario** (criterio 570). Si esto se
     * pone rojo, alguien construyó la lectura A —la del porcentaje— que se
     * descartó en el render: a las 9:15, 15 minutos de 480 son un 3 %.
     */
    it('un lunes a las 9:15 con 15 minutos de 480 el arco es verde (criterio 570)', () => {
      const monday = '2026-09-21'
      const { arcs } = buildGoalArcs({
        followUps: [
          session({
            id: 's1',
            startTime: '09:00',
            durationMinutes: 15,
            categoryId: 'trabajo',
            date: monday,
          }),
        ],
        date: monday,
        nowMinutes: 9 * 60 + 15,
        categories: [category('trabajo', 'Trabajo', WORK)],
        isPastDay: false,
        dayEnd: DAY_END,
      })

      expect(arcs[0].workedMinutes).toBe(15)
      expect(arcs[0].missingMinutes).toBe(465)
      // Por porcentaje esto sería un 3 % y saldría rojo; por margen sobran 6 h.
      expect(arcs[0].workedMinutes / arcs[0].targetMinutes).toBeLessThan(0.9)
      expect(arcs[0].fitMinutes).toBe(360)
      expect(arcs[0].fitMinutes!).toBeGreaterThan(GOAL_FIT_OK_MARGIN_MINUTES)
      expect(arcs[0].fitLevel).toBe('ok')
    })

    it.each([
      ['pasada la meta hoy', 18 * 60, 540, false, 'passed'],
      ['un día pasado sin llegar', null, 300, true, 'logged'],
      ['un día pasado que se pasó de la meta', null, 540, true, 'passed'],
    ])(
      'fuera de la ventana no hay ningún color: %s (criterios 571, 573 y 562)',
      (_caso, nowMinutes, workedMinutes, isPastDay, variant) => {
        const { arcs } = buildGoalArcs({
          followUps: [
            session({
              id: 's1',
              startTime: '08:00',
              durationMinutes: workedMinutes,
              categoryId: 'trabajo',
            }),
          ],
          date: DATE,
          nowMinutes,
          categories: [category('trabajo', 'Trabajo', WORK)],
          isPastDay,
          dayEnd: DAY_END,
        })

        expect(arcs[0].variant).toBe(variant)
        expect(arcs[0].fitLevel).toBeNull()
        expect(arcs[0].fitMinutes).toBeNull()
      },
    )

    it('un día futuro de la tira, sin reloj, tampoco lleva color (criterio 571)', () => {
      // Lunes 21 y no sábado 19: desde la tajada 3 un sábado no produce **ningún**
      // arco para una meta de lunes a viernes (criterio 576), así que el caso de
      // «futuro sin reloj» se mide en un día que la meta sí cuenta. Lo que este
      // test vigila —que sin reloj no hay color— no cambia.
      const { arcs } = buildGoalArcs({
        followUps: [],
        date: '2026-09-21',
        nowMinutes: null,
        categories: [category('trabajo', 'Trabajo', WORK)],
        isPastDay: false,
        dayEnd: DAY_END,
      })

      expect(arcs[0].stopAtTime).toBeNull()
      expect(arcs[0].fitLevel).toBeNull()
    })

    /**
     * El color no puede colarse en el texto: ni un adjetivo, ni un signo, ni
     * una palabra de más en rojo respecto al verde (criterio 572). Se compara
     * el mismo arco a dos horas distintas — lo único que cambia es `fitLevel`.
     */
    it('el rojo y el verde dicen exactamente el mismo texto (criterio 572)', () => {
      const at = (nowMinutes: number) =>
        buildGoalArcs({
          followUps: [
            session({ id: 's1', startTime: '08:00', durationMinutes: 60, categoryId: 'trabajo' }),
          ],
          date: DATE,
          nowMinutes,
          categories: [category('trabajo', 'Trabajo', WORK)],
          isPastDay: false,
          dayEnd: DAY_END,
        }).arcs[0]

      const verde = at(AT_9)
      const rojo = at(17 * 60)

      expect(verde.fitLevel).toBe('ok')
      expect(rojo.fitLevel).toBe('over')
      // Mismo rótulo, mismo valor dentro del arco y misma frase salvo la hora.
      expect(rojo.arcCaption).toEqual(verde.arcCaption)
      expect(rojo.arcValue).toBe(verde.arcValue)
      expect(rojo.variant).toBe(verde.variant)
      // La misma frase, con la misma forma: solo cambia la hora que dice.
      const forma = /^Llevas 1 h\. A este ritmo paras a las \d\d:\d\d\.$/
      expect(verde.line).toMatch(forma)
      expect(rojo.line).toMatch(forma)
      expect(rojo.line).not.toMatch(/!|tarde|corre|no llegas|deberías|cuidado|ya no da/i)
    })

    it('cada meta lleva su propio color, con sus propios minutos (criterio 574)', () => {
      const { arcs } = buildGoalArcs({
        followUps: [
          session({ id: 's1', startTime: '08:00', durationMinutes: 60, categoryId: 'trabajo' }),
          session({ id: 's2', startTime: '09:30', durationMinutes: 10, categoryId: 'cursos' }),
        ],
        date: DATE,
        // Las 16:00, el mismo momento para los dos arcos: a «Trabajo» le faltan
        // 7 h y quedan 7 h de día (cabe justo), a «Estudiar» le faltan 50 min
        // (sobra). Mismo reloj, mismo final de día, colores distintos.
        nowMinutes: 16 * 60,
        categories: [category('cursos', 'Cursos', STUDY), category('trabajo', 'Trabajo', WORK)],
        isPastDay: false,
        dayEnd: DAY_END,
      })

      const [trabajo, estudiar] = arcs
      expect(trabajo.goal.name).toBe('Trabajo')
      // Trabajo: faltan 420 y quedan 420 de día → cabe justo.
      expect(trabajo.missingMinutes).toBe(420)
      expect(trabajo.fitMinutes).toBe(0)
      expect(trabajo.fitLevel).toBe('tight')
      // Estudiar: faltan 50 de una meta de 60 y quedan 420 → de sobra.
      expect(estudiar.goal.name).toBe('Estudiar')
      expect(estudiar.missingMinutes).toBe(50)
      expect(estudiar.fitMinutes).toBe(370)
      expect(estudiar.fitLevel).toBe('ok')
    })

    /**
     * **El cero entra en la ventana** (criterio 561 leído junto al 566): con
     * nada registrado falta la jornada entera, y eso cabe o no cabe igual que
     * cualquier otra cantidad. Es el estado de cada mañana antes de la primera
     * sesión, y el de las ocho de la tarde sin haber empezado.
     */
    it.each([
      ['a las 9:00 sin nada, todavía cabe', AT_9, 'ok'],
      ['a las 20:00 sin nada, ya no cabe', 20 * 60, 'over'],
    ])('con cero minutos también hay semáforo: %s (criterios 561 y 566)', (_caso, nowMinutes, fitLevel) => {
      const { arcs } = buildGoalArcs({
        followUps: [],
        date: DATE,
        nowMinutes,
        categories: [category('trabajo', 'Trabajo', WORK)],
        isPastDay: false,
        dayEnd: DAY_END,
      })

      expect(arcs[0].workedMinutes).toBe(0)
      expect(arcs[0].share).toBe(0)
      expect(arcs[0].missingMinutes).toBe(480)
      expect(arcs[0].fitLevel).toBe(fitLevel)
    })

    /**
     * **Sin la hora de fin real no hay color.** `useVidaDayHours` sirve el
     * respaldo de las 23:00 mientras cargan los ajustes: pintar con él haría
     * que un día que acaba a las 18:00 se viera verde y saltara a rojo al
     * llegar el dato. Un rojo que aparece por una consulta a medias no es un
     * dato, es un susto.
     */
    it('sin la hora de fin del día todavía no hay semáforo', () => {
      const { arcs } = buildGoalArcs({
        followUps: [
          session({ id: 's1', startTime: '08:00', durationMinutes: 60, categoryId: 'trabajo' }),
        ],
        date: DATE,
        nowMinutes: 17 * 60,
        categories: [category('trabajo', 'Trabajo', WORK)],
        isPastDay: false,
        dayEnd: null,
      })

      // Todo lo demás sigue igual: el arco dice lo que falta y la hora de
      // parada. Lo único que falta es el color.
      expect(arcs[0].variant).toBe('missing')
      expect(arcs[0].missingMinutes).toBe(420)
      expect(arcs[0].line).toBe('Llevas 1 h. A este ritmo paras a las 23:59.')
      expect(arcs[0].fitMinutes).toBeNull()
      expect(arcs[0].fitLevel).toBeNull()
    })

    it('el final del día manda: el mismo momento cambia de color si el día acaba antes', () => {
      const conFinal = (dayEnd: string) =>
        buildGoalArcs({
          followUps: [
            session({ id: 's1', startTime: '08:00', durationMinutes: 60, categoryId: 'trabajo' }),
          ],
          date: DATE,
          nowMinutes: 14 * 60,
          categories: [category('trabajo', 'Trabajo', WORK)],
          isPastDay: false,
          dayEnd,
        }).arcs[0]

      // Faltan 7 h. Hasta las 23:00 quedan 9 h: sobra. Hasta las 21:00, 7 h
      // justas. Hasta las 20:00, ya no cabe.
      expect(conFinal('23:00').fitLevel).toBe('ok')
      expect(conFinal('21:00').fitLevel).toBe('tight')
      expect(conFinal('20:00').fitLevel).toBe('over')
    })
  })

  /**
   * **La forma aguanta dos metas.** Hoy la base solo permite una por usuario
   * —`UNIQUE (user_id, slug)` y solo nace la de slug `work`—, así que la app no
   * puede ejercitar esto todavía: este caso es la prueba de que el día que haya
   * una segunda no hay que rediseñar nada, y de que **la vista no necesita
   * ningún tope** para enseñar un solo arco.
   */
  it('devuelve un arco por meta, ordenados por orderIndex', () => {
    const { arcs } = buildGoalArcs({
      followUps: [
        session({ id: 's1', startTime: '08:00', durationMinutes: 120, categoryId: 'trabajo' }),
        session({ id: 's2', startTime: '10:30', durationMinutes: 25, categoryId: 'cursos' }),
      ],
      date: DATE,
      nowMinutes: 11 * 60,
      // A propósito al revés: el orden lo pone `goal.orderIndex`, no el catálogo.
      categories: [category('cursos', 'Cursos', STUDY), category('trabajo', 'Trabajo', WORK)],
      isPastDay: false,
      dayEnd: DAY_END,
    })

    expect(arcs.map((arc) => arc.goal.name)).toEqual(['Trabajo', 'Estudiar'])
    expect(arcs[0].workedMinutes).toBe(120)
    expect(arcs[0].targetLabel).toBe('8h')
    expect(arcs[1].workedMinutes).toBe(25)
    expect(arcs[1].targetLabel).toBe('1h')
    // Cada meta con su hora: 11:00 + (60 − 25) = 11:35.
    expect(arcs[1].stopAtTime).toBe('11:35')
    expect(arcs[1].line).toBe('Llevas 25 min. A este ritmo paras a las 11:35.')
  })

  /**
   * **El sábado sin arco** (FEAT-019, tajada 3, criterios 576 a 580).
   *
   * Un día que la meta no cuenta no es un día en rojo: la meta **ese día no
   * existe**. Por eso lo que se comprueba es que la meta sale del reparto
   * entera —sin arco, sin color y sin un nodo con ceros— y que la pregunta se
   * apaga con ella, desde el mismo dato.
   *
   * `WORK` cuenta de lunes a viernes; `STUDY`, los siete días.
   */
  describe('los días en que la meta cuenta', () => {
    /** Sábado 19 de septiembre de 2026, el día siguiente al de las pruebas. */
    const SATURDAY = '2026-09-19'
    const AT_10 = 10 * 60

    it('un sábado no hay arco ni pregunta, y no es un color: es que no existe (576, 578, 580)', () => {
      const { arcs, promptAllowed } = buildGoalArcs({
        followUps: [
          session({
            id: 's1',
            startTime: '08:00',
            durationMinutes: 60,
            categoryId: 'trabajo',
            date: SATURDAY,
          }),
        ],
        date: SATURDAY,
        nowMinutes: AT_10,
        categories: [category('trabajo', 'Trabajo', WORK)],
        isPastDay: false,
        dayEnd: DAY_END,
      })

      // Ni un arco vacío, ni uno con `fitLevel` en rojo: ninguno.
      expect(arcs).toEqual([])
      expect(promptAllowed).toBe(false)
    })

    it('lo registrado ese sábado ni se pierde ni se recoloca en «sin dato» (577)', () => {
      const followUps = [
        session({
          id: 's1',
          startTime: '08:00',
          durationMinutes: 60,
          categoryId: 'trabajo',
          date: SATURDAY,
        }),
      ]
      const copia = structuredClone(followUps)

      const { arcs, noDataMinutes, noDataLabel } = buildGoalArcs({
        followUps,
        date: SATURDAY,
        nowMinutes: AT_10,
        categories: [category('trabajo', 'Trabajo', WORK)],
        isPastDay: false,
        dayEnd: DAY_END,
      })

      expect(arcs).toEqual([])
      // «Sin dato» es de las sesiones **sin categoría**: esta tiene la suya y no
      // se reclasifica solo porque la meta no cuente hoy.
      expect(noDataMinutes).toBe(0)
      expect(noDataLabel).toBe('')
      // Y las sesiones entran y salen intactas: quien las guarda y las enseña no
      // es esta función.
      expect(followUps).toEqual(copia)
    })

    it('cada meta va por sus propios días (579)', () => {
      const categories = [category('trabajo', 'Trabajo', WORK), category('cursos', 'Cursos', STUDY)]

      const sabado = buildGoalArcs({
        followUps: [],
        date: SATURDAY,
        nowMinutes: AT_10,
        categories,
        isPastDay: false,
        dayEnd: DAY_END,
      })
      expect(sabado.arcs.map((arc) => arc.goal.name)).toEqual(['Estudiar'])
      expect(sabado.promptAllowed).toBe(true)

      const viernes = buildGoalArcs({
        followUps: [],
        date: DATE,
        nowMinutes: AT_10,
        categories,
        isPastDay: false,
        dayEnd: DAY_END,
      })
      expect(viernes.arcs.map((arc) => arc.goal.name)).toEqual(['Trabajo', 'Estudiar'])
    })

    it('sin ninguna meta todavía, la pregunta se rige por los días con los que nacería (580)', () => {
      const sinMetas = [category('trabajo', 'Trabajo', null), category('casa', 'Casa', null)]

      expect(
        buildGoalArcs({
          followUps: [],
          date: DATE,
          nowMinutes: AT_10,
          categories: sinMetas,
          isPastDay: false,
          dayEnd: DAY_END,
        }).promptAllowed,
      ).toBe(true)

      expect(
        buildGoalArcs({
          followUps: [],
          date: SATURDAY,
          nowMinutes: AT_10,
          categories: sinMetas,
          isPastDay: false,
          dayEnd: DAY_END,
        }).promptAllowed,
      ).toBe(false)

      expect(DEFAULT_GOAL_ACTIVE_DAYS).toEqual([
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
      ])
    })

    it('un día pasado que no contaba tampoco deja rastro (576, 578)', () => {
      // El sábado 12, ya pasado: ni arco ni color. Un día que la meta no existía
      // no se cuenta hacia atrás como un día fallado.
      const { arcs, promptAllowed } = buildGoalArcs({
        followUps: [
          session({
            id: 's1',
            startTime: '09:00',
            durationMinutes: 300,
            categoryId: 'trabajo',
            date: '2026-09-12',
          }),
        ],
        date: '2026-09-12',
        nowMinutes: null,
        categories: [category('trabajo', 'Trabajo', WORK)],
        isPastDay: true,
        dayEnd: DAY_END,
      })

      expect(arcs).toEqual([])
      expect(promptAllowed).toBe(false)
    })
  })
})
