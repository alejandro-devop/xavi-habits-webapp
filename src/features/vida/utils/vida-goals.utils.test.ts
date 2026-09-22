import { describe, expect, it } from 'vitest'
import type { ActivityCategory } from '@/features/vida/types/activity-category.types'
import type { ActivityFollowUp } from '@/features/vida/types/activity-followup.types'
import type { VidaGoal } from '@/features/vida/types/vida-goal.types'
import { buildGoalArcs } from '@/features/vida/utils/vida-goals.utils'

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
  orderIndex: 0,
}

const STUDY: VidaGoal = {
  id: 'goal-study',
  slug: 'study',
  name: 'Estudiar',
  icon: 'book',
  color: '#f59e0b',
  targetMinutes: 60,
  orderIndex: 1,
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

  it('la línea principal es una hora, no una resta (criterio 492)', () => {
    const { arcs } = buildGoalArcs({
      followUps: [session({ id: 's1', startTime: '08:00', durationMinutes: 220, categoryId: 'trabajo' })],
      date: DATE,
      // 11:45: quedan 260 min de los 480 → 11:45 + 4h 20 = 16:05.
      nowMinutes: 11 * 60 + 45,
      categories: [category('trabajo', 'Trabajo', WORK)],
      isPastDay: false,
    })

    expect(arcs[0].stopAtTime).toBe('16:05')
    expect(arcs[0].arcValue).toBe('16:05')
    expect(arcs[0].arcCaption).toBe('A este ritmo paras a las')
    expect(arcs[0].line).toBe('Llevas 3 h 40 min. A este ritmo paras a las 16:05.')
    expect(arcs[0].passedAtTime).toBeNull()
  })

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
    })

    expect(result.noDataMinutes).toBe(0)
    expect(result.noDataLabel).toBe('')
  })

  it('con cero minutos el arco aparece vacío y la fórmula va en condicional (criterio 495, D-C)', () => {
    const { arcs } = buildGoalArcs({
      followUps: [],
      date: DATE,
      nowMinutes: AT_9,
      categories: [category('trabajo', 'Trabajo', WORK)],
      isPastDay: false,
    })

    expect(arcs).toHaveLength(1)
    expect(arcs[0].workedMinutes).toBe(0)
    expect(arcs[0].share).toBe(0)
    expect(arcs[0].stopAtTime).toBe('17:00')
    expect(arcs[0].line).toBe('Si arrancas ahora, acabarías a las 17:00.')
  })

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
    })

    expect(arcs[0].workedMinutes).toBe(60)
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
})
