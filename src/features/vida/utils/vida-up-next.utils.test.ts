import { describe, expect, it } from 'vitest'
import type { ActivityDayPlanItem } from '@/features/vida/types/activity-day-plan.types'
import type { AgendaBlock } from '@/features/vida/utils/vida-agenda.utils'
import type {
  BlockExecution,
  ExecutionEntry,
  SessionSpan,
} from '@/features/vida/utils/vida-execution.utils'
import {
  buildUpNext,
  collectResolvedBlockIds,
  findUpNextAnchorId,
  pickUpNextBlock,
} from '@/features/vida/utils/vida-up-next.utils'

/**
 * La regla de «Lo que viene», sin pintar nada: criterios 184, 186, 206, 210,
 * 370, 371, 372, 373, 375, 376 y 378.
 *
 * El «ahora» se inyecta como minutos desde medianoche —nunca se llama a
 * `new Date()` aquí dentro—, así que los tres casos del criterio 375 se prueban
 * a la hora que hace falta.
 */

function planItem(id: string, overrides: Partial<ActivityDayPlanItem> = {}): ActivityDayPlanItem {
  return {
    id,
    userId: 1,
    activityId: `a-${id}`,
    date: '2026-09-22',
    startTime: '11:30',
    endTime: '12:00',
    orderIndex: 0,
    completedAt: null,
    createdAt: '2026-09-22T00:00:00.000Z',
    updatedAt: '2026-09-22T00:00:00.000Z',
    activity: {
      id: `a-${id}`,
      title: `Actividad ${id}`,
      description: null,
      category: { id: 'c1', name: 'Trabajo', color: '#7C3AED', icon: 'briefcase' },
    },
    ...overrides,
  }
}

function block(
  id: string,
  startMinutes: number,
  durationMinutes: number,
  item: Partial<ActivityDayPlanItem> = {},
): AgendaBlock {
  return {
    kind: 'block',
    id,
    item: planItem(id, item),
    startMinutes,
    endMinutes: startMinutes + durationMinutes,
    durationMinutes,
    trackMinutes: durationMinutes,
  }
}

function execution(overrides: Partial<BlockExecution> = {}): BlockExecution {
  return { isRunning: false, ...overrides } as BlockExecution
}

function sessionEntry(id: string, isRunning: boolean): ExecutionEntry {
  return {
    kind: 'session',
    id,
    span: { id, title: 'Working at lululemon', isRunning } as SessionSpan,
    variant: 'off-plan',
    label: 'fuera del plan',
    rangeLabel: '10:57 – 11:05',
    durationLabel: '8 min',
    fromBlockId: null,
    startMinutes: 657,
    endMinutes: 665,
    durationMinutes: 8,
  } as ExecutionEntry
}

describe('collectResolvedBlockIds', () => {
  it('cuenta las tres fuentes del criterio 186 y nada más', () => {
    const blocks = [block('b1', 600, 30), block('b2', 660, 30), block('b3', 720, 30), block('b4', 780, 30)]

    const resolved = collectResolvedBlockIds({
      blocks,
      byBlockId: { b1: execution({ isRunning: true }) },
      insteadByBlockId: { b2: { title: 'Otra cosa' } },
      couldNotItemIds: new Set(['b3']),
    })

    expect([...resolved].sort()).toEqual(['b1', 'b2', 'b3'])
  })
})

describe('pickUpNextBlock — criterio 375', () => {
  // 11:30 = 690 · 13:00 = 780 · 18:00 = 1080
  const daily = block('daily', 690, 30)
  const work = block('work', 780, 240)
  const dogs = block('dogs', 1080, 45)
  const blocks = [daily, work, dogs]

  it('a las 11:05, con nada llegado, propone lo siguiente por hora (11:30)', () => {
    expect(
      pickUpNextBlock({ blocks, resolvedBlockIds: new Set(), nowMinutes: 665 })?.id,
    ).toBe('daily')
  })

  it('a las 13:40 propone lo de las 13:00, no lo de las 18:00', () => {
    expect(
      pickUpNextBlock({ blocks, resolvedBlockIds: new Set(['daily']), nowMinutes: 820 })?.id,
    ).toBe('work')
  })

  it('a las 20:00, con las 13:00 y las 18:00 abiertas, propone las 18:00 — la más reciente', () => {
    expect(
      pickUpNextBlock({ blocks, resolvedBlockIds: new Set(['daily']), nowMinutes: 1200 })?.id,
    ).toBe('dogs')
  })

  it('sin nada abierto no propone nada', () => {
    expect(
      pickUpNextBlock({
        blocks,
        resolvedBlockIds: new Set(['daily', 'work', 'dogs']),
        nowMinutes: 1200,
      }),
    ).toBeNull()
  })
})

describe('pickUpNextBlock — el desempate del criterio 184', () => {
  it('gana el de inicio menor', () => {
    const blocks = [block('tarde', 700, 10), block('pronto', 690, 30)]
    expect(pickUpNextBlock({ blocks, resolvedBlockIds: new Set(), nowMinutes: 600 })?.id).toBe(
      'pronto',
    )
  })

  it('a la misma hora gana el de menos duración', () => {
    const blocks = [block('largo', 690, 60), block('corto', 690, 15)]
    expect(pickUpNextBlock({ blocks, resolvedBlockIds: new Set(), nowMinutes: 720 })?.id).toBe(
      'corto',
    )
  })

  it('a la misma hora y la misma duración gana el orden de la agenda', () => {
    const blocks = [block('primero', 690, 30), block('segundo', 690, 30)]
    expect(pickUpNextBlock({ blocks, resolvedBlockIds: new Set(), nowMinutes: 720 })?.id).toBe(
      'primero',
    )
  })
})

describe('findUpNextAnchorId — criterio 370', () => {
  const blockEntry = (id: string): ExecutionEntry => block(id, 690, 30)
  const nowEntry: ExecutionEntry = { kind: 'now', id: 'now', startMinutes: 665 } as ExecutionEntry

  it('manda la sesión viva suelta, aunque también haya un bloque en marcha', () => {
    expect(
      findUpNextAnchorId({
        entries: [blockEntry('b1'), sessionEntry('s1', true), nowEntry],
        byBlockId: { b1: execution({ isRunning: true }) },
      }),
    ).toBe('s1')
  })

  it('sin sesión suelta viva, el bloque en marcha', () => {
    expect(
      findUpNextAnchorId({
        entries: [sessionEntry('s1', false), blockEntry('b1'), nowEntry],
        byBlockId: { b1: execution({ isRunning: true }) },
      }),
    ).toBe('b1')
  })

  it('sin nada en marcha, la línea de AHORA', () => {
    expect(
      findUpNextAnchorId({ entries: [blockEntry('b1'), nowEntry], byBlockId: {} }),
    ).toBe('now')
  })

  it('sin marca de AHORA —el reloj fuera del día— no hay ancla, y por tanto no hay tarjeta', () => {
    expect(findUpNextAnchorId({ entries: [blockEntry('b1')], byBlockId: {} })).toBeNull()
  })
})

describe('buildUpNext — lo que se lee', () => {
  const daily = block('daily', 690, 30, {
    activity: {
      id: 'a-daily',
      title: 'Daily meeting',
      description: null,
      category: { id: 'c1', name: 'Trabajo', color: '#7C3AED', icon: 'briefcase' },
    },
  })

  it('escribe el rótulo, la meta y el botón del render (criterios 183, 206, 371)', () => {
    const upNext = buildUpNext({
      block: daily,
      anchorId: 'now',
      usualMinutes: null,
      runningTitle: null,
      nowMinutes: 665,
      openCount: 4,
      canStart: true,
    })

    expect(upNext.kicker).toBe('Lo que viene')
    expect(upNext.gutterLabel).toBe('11:30')
    expect(upNext.gutterTime).toBe('11:30')
    expect(upNext.metaLine).toBe('En tu plantilla, a las 11:30 · suele durarte 30 min')
    expect(upNext.buttonLabel).toBe('Empezar ahora')
    expect(upNext.buttonSrLabel).toBe('Empezar Daily meeting ahora')
    expect(upNext.exits.othersCount).toBe(3)
    expect(upNext.canStart).toBe(true)
    expect(upNext.blockedNote).toBeNull()
  })

  it('manda la costumbre de FEAT-007 sobre la plantilla, y las palabras no cambian (372)', () => {
    const upNext = buildUpNext({
      block: daily,
      anchorId: 'now',
      usualMinutes: 45,
      runningTitle: null,
      nowMinutes: 665,
      openCount: 1,
      canStart: true,
    })

    expect(upNext.metaLine).toBe('En tu plantilla, a las 11:30 · suele durarte 45 min')
    expect(upNext.truthLine).toContain('los 45 min son lo que suele durarte')
  })

  it('la frase de verdad va siempre, con 30 min y con 4 h, y no pinta ninguna hora de fin (373)', () => {
    const short = buildUpNext({
      block: daily,
      anchorId: 'now',
      usualMinutes: null,
      runningTitle: null,
      nowMinutes: 665,
      openCount: 1,
      canStart: true,
    })
    const long = buildUpNext({
      block: block('work', 780, 240, {
        activity: {
          id: 'a-work',
          title: 'Working at lululemon',
          description: null,
          category: { id: 'c1', name: 'Trabajo', color: '#7C3AED', icon: 'briefcase' },
        },
      }),
      anchorId: 'now',
      usualMinutes: null,
      runningTitle: null,
      nowMinutes: 820,
      openCount: 1,
      canStart: true,
    })

    expect(short.truthLine).toBe(
      'Arranca cuando pulses, no a las 11:30. Y los 30 min son lo que suele durarte: se registra lo que dure de verdad.',
    )
    expect(long.truthLine).toBe(
      'Arranca cuando pulses, no a las 13:00. Y las 4 h son lo que suele durarte: se registra lo que dure de verdad.',
    )
    // **Ninguna hora de fin, en ninguna rama**: es lo que se leía como una
    // reserva y lo que impedía pulsar.
    for (const text of [short.truthLine, short.metaLine, long.truthLine, long.metaLine]) {
      expect(text).not.toMatch(/acabar|terminar(?!á)|hasta las|fin\b/i)
    }
  })

  it('con algo en marcha, lo dice antes de pulsar (criterio 378)', () => {
    const upNext = buildUpNext({
      block: daily,
      anchorId: 's1',
      usualMinutes: null,
      runningTitle: 'Working at lululemon',
      nowMinutes: 665,
      openCount: 2,
      canStart: true,
    })

    expect(upNext.truthLine).toContain(
      'Al hacerlo, «Working at lululemon» se dará por terminada a esa hora.',
    )
  })

  it('sin poder empezar no ofrece botón: dice qué falta (criterio 189)', () => {
    const upNext = buildUpNext({
      block: daily,
      anchorId: 'now',
      usualMinutes: null,
      runningTitle: null,
      nowMinutes: 665,
      openCount: 1,
      canStart: false,
      blockedNote: 'Tienes una sesión de otro día sin cerrar.',
    })

    expect(upNext.canStart).toBe(false)
    expect(upNext.blockedNote).toBe('Tienes una sesión de otro día sin cerrar.')
  })

  it('sin más ítems abiertos, «Ver las otras N» no se escribe (criterio 376)', () => {
    const upNext = buildUpNext({
      block: daily,
      anchorId: 'now',
      usualMinutes: null,
      runningTitle: null,
      nowMinutes: 665,
      openCount: 1,
      canStart: true,
    })

    expect(upNext.exits.othersCount).toBe(0)
  })

  it('ni una palabra de reproche, en ninguno de los momentos (criterio 210)', () => {
    const reproach =
      /tarde|te saltaste|perdiste|fallaste|deberías|desperdicio|vacío|todavía no has/i
    const cases = [
      buildUpNext({
        block: daily,
        anchorId: 'now',
        usualMinutes: null,
        runningTitle: null,
        nowMinutes: 665,
        openCount: 4,
        canStart: true,
      }),
      buildUpNext({
        block: daily,
        anchorId: 's1',
        usualMinutes: 45,
        runningTitle: 'Working at lululemon',
        nowMinutes: 700,
        openCount: 2,
        canStart: true,
      }),
      buildUpNext({
        block: block('work', 780, 240),
        anchorId: 'now',
        usualMinutes: null,
        runningTitle: null,
        nowMinutes: 820,
        openCount: 2,
        canStart: true,
      }),
    ]

    for (const upNext of cases) {
      for (const text of [
        upNext.kicker,
        upNext.metaLine,
        upNext.truthLine,
        upNext.buttonLabel,
        upNext.buttonSrLabel,
        upNext.regionLabel,
      ]) {
        expect(text).not.toMatch(reproach)
      }
    }
  })

  it('marca que la hora ya pasó sin decirlo todavía en el rótulo (la tajada 2 lo escribe)', () => {
    const upNext = buildUpNext({
      block: block('work', 780, 240),
      anchorId: 'now',
      usualMinutes: null,
      runningTitle: null,
      nowMinutes: 820,
      openCount: 1,
      canStart: true,
    })

    expect(upNext.isOverdue).toBe(true)
    expect(upNext.kicker).toBe('Lo que viene')
    expect(upNext.exits.showDidIt).toBe(false)
  })
})
