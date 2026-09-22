import { describe, expect, it } from 'vitest'
import { getMaxDurationForStartTime, validatePlacement } from '@/features/vida/utils/vida-gap-form.utils'
import type { GapNeighbour } from '@/features/vida/utils/vida-gap-window.utils'
import {
  buildGapRealWindow,
  describeGapWindowShift,
  describePlacementBlocker,
} from '@/features/vida/utils/vida-gap-window.utils'

/** El hueco del render: «Libre 9:30 → 11:30», cerrado por «Daily meeting». */
const gap = {
  startMinutes: 9 * 60 + 30,
  endMinutes: 11 * 60 + 30,
  nextBlockTitle: 'Daily meeting',
}

function neighbour(partial: Partial<GapNeighbour> & { plannedMinutes: number }): GapNeighbour {
  return { title: null, realMinutes: null, isRunning: false, ...partial }
}

/** «Desayunar», planeado hasta las 9:30. */
function breakfast(realEnd: number | null, isRunning = false): GapNeighbour {
  return neighbour({
    title: 'Desayunar',
    plannedMinutes: 9 * 60 + 30,
    realMinutes: realEnd,
    isRunning,
  })
}

/** «Daily meeting», planeado desde las 11:30. */
function meeting(realStart: number | null): GapNeighbour {
  return neighbour({ title: 'Daily meeting', plannedMinutes: 11 * 60 + 30, realMinutes: realStart })
}

describe('buildGapRealWindow — los cinco casos del criterio 237', () => {
  it('el vecino que acabó ANTES abre el hueco antes (9:28, no 9:30)', () => {
    const space = buildGapRealWindow({ gap, before: breakfast(9 * 60 + 28), after: meeting(null) })

    expect(space.startMinutes).toBe(9 * 60 + 28)
    expect(space.endMinutes).toBe(11 * 60 + 30)
    expect(space.startShiftMinutes).toBe(-2)
    expect(space.plannedStartMinutes).toBe(9 * 60 + 30)
    // Y la validación de siempre lo acepta, **sin tocarla**.
    expect(validatePlacement({ startTime: '09:28', durationMinutes: 15 }, space).valid).toBe(true)
  })

  it('el vecino que acabó DESPUÉS lo cierra por la izquierda (a las 9:35 ya no cabe)', () => {
    const space = buildGapRealWindow({ gap, before: breakfast(9 * 60 + 40), after: meeting(null) })

    expect(space.startMinutes).toBe(9 * 60 + 40)
    expect(space.startShiftMinutes).toBe(10)
    expect(validatePlacement({ startTime: '09:35', durationMinutes: 15 }, space).valid).toBe(false)
    expect(describePlacementBlocker({ startTime: '09:35', durationMinutes: 15 }, space)).toContain(
      'Desayunar acabó a las 9:40.',
    )
  })

  it('el vecino SIN sesión deja mandar al plan', () => {
    const space = buildGapRealWindow({ gap, before: breakfast(null), after: meeting(null) })

    expect(space.startMinutes).toBe(9 * 60 + 30)
    expect(space.endMinutes).toBe(11 * 60 + 30)
    expect(space.startShiftMinutes).toBe(0)
    expect(space.endShiftMinutes).toBe(0)
    expect(describeGapWindowShift(space)).toBeNull()
  })

  it('el hueco que cierra el FIN DEL DÍA no tiene vecino a la derecha', () => {
    const space = buildGapRealWindow({
      gap: { startMinutes: 21 * 60, endMinutes: 22 * 60, nextBlockTitle: null },
      before: null,
      after: null,
    })

    expect(space.startMinutes).toBe(21 * 60)
    expect(space.endMinutes).toBe(22 * 60)
    expect(space.nextBlockTitle).toBeNull()
    expect(space.previousBlockTitle).toBeNull()
    // Sin nombre que dar, el aviso es el de siempre y nada más.
    expect(describePlacementBlocker({ startTime: '21:30', durationMinutes: 90 }, space)).toBe(
      validatePlacement({ startTime: '21:30', durationMinutes: 90 }, space).message,
    )
  })

  it('la sesión ABIERTA es un vecino más: cierra el borde y no se toca', () => {
    // El hueco ya viene partido por la sesión abierta (lo hace
    // `buildDayExecution`): el trozo de delante va de 9:30 a 10:00 y su vecino
    // de la derecha es la sesión, con el borde **exacto** de lo que pasó.
    const running = neighbour({
      title: 'Correr',
      plannedMinutes: 10 * 60,
      realMinutes: 10 * 60,
      isRunning: true,
    })
    const space = buildGapRealWindow({
      gap: { ...gap, endMinutes: 10 * 60 },
      before: breakfast(null),
      after: running,
    })

    expect(space.endMinutes).toBe(10 * 60)
    expect(space.nextIsRunning).toBe(true)
    expect(getMaxDurationForStartTime('09:30', space)).toBe(30)
    expect(describePlacementBlocker({ startTime: '09:30', durationMinutes: 45 }, space)).toContain(
      'A las 10:00 entra Correr.',
    )
  })
})

describe('buildGapRealWindow — el vecino que no toca el hueco', () => {
  it('un vecino que no está pegado al borde no mueve nada (hueco partido por «ahora»)', () => {
    const faraway = neighbour({
      title: 'Desayunar',
      plannedMinutes: 9 * 60 + 30,
      realMinutes: 9 * 60 + 28,
    })
    const space = buildGapRealWindow({
      // El trozo de delante de «ahora»: empieza a las 10:30, no a las 9:30.
      gap: { startMinutes: 10 * 60 + 30, endMinutes: 11 * 60 + 30, nextBlockTitle: 'Daily meeting' },
      before: faraway,
      after: null,
    })

    expect(space.startMinutes).toBe(10 * 60 + 30)
    expect(space.previousBlockTitle).toBeNull()
    expect(space.previousTouchesStart).toBe(false)
  })

  it('sin vecino pegado al final, el aviso NO dice a qué hora entra nadie', () => {
    // El hueco lo cierra «ahora» a las 9:24, pero quien lo cierra en el plan es
    // «Leer un rato», que empieza a las 10:00: decir «a las 9:24 entra Leer un
    // rato» sería un dato falso.
    const space = buildGapRealWindow({
      gap: { startMinutes: 8 * 60 + 45, endMinutes: 9 * 60 + 24, nextBlockTitle: 'Leer un rato' },
      before: null,
      after: null,
    })

    expect(space.nextBlockTitle).toBe('Leer un rato')
    expect(space.nextTouchesEnd).toBe(false)
    expect(describePlacementBlocker({ startTime: '09:00', durationMinutes: 60 }, space)).toBe(
      validatePlacement({ startTime: '09:00', durationMinutes: 60 }, space).message,
    )
  })
})

describe('buildGapRealWindow — los bordes que se cruzan', () => {
  it('un vecino que se comió el hueco entero deja la ventana vacía, nunca del revés', () => {
    const space = buildGapRealWindow({ gap, before: breakfast(12 * 60), after: meeting(null) })

    expect(space.startMinutes).toBe(12 * 60)
    expect(space.endMinutes).toBe(12 * 60)
    expect(getMaxDurationForStartTime('12:00', space)).toBe(0)
  })

  it('`clampToNow` recorta el final a «ahora» (la mitad de delante, criterio 242)', () => {
    const space = buildGapRealWindow({
      gap,
      before: breakfast(null),
      after: meeting(null),
      nowMinutes: 10 * 60,
      clampToNow: true,
    })

    expect(space.endMinutes).toBe(10 * 60)
    expect(space.endShiftMinutes).toBe(-90)
  })
})

describe('describeGapWindowShift — por qué el rato no es el del renglón (criterio 234)', () => {
  it('lo dice con el nombre del vecino cuando el hueco empieza antes', () => {
    const space = buildGapRealWindow({ gap, before: breakfast(9 * 60 + 28), after: meeting(null) })

    expect(describeGapWindowShift(space)).toBe(
      'Desayunar acabó a las 9:28, así que aquí empieza antes.',
    )
  })

  it('cuenta los dos bordes cuando los dos se movieron', () => {
    const space = buildGapRealWindow({
      gap,
      before: breakfast(9 * 60 + 40),
      after: meeting(11 * 60 + 25),
    })

    expect(describeGapWindowShift(space)).toBe(
      'Desayunar acabó a las 9:40, así que aquí empieza más tarde. Daily meeting empezó a las 11:25, así que aquí acaba antes.',
    )
  })

  it('con una ventana del plan (sin campos de más) no dice nada', () => {
    expect(
      describeGapWindowShift({ startMinutes: 570, endMinutes: 690, nextBlockTitle: null }),
    ).toBeNull()
  })
})

describe('describePlacementBlocker — envuelve, no sustituye (criterios 225 y 236)', () => {
  const space = buildGapRealWindow({ gap, before: breakfast(9 * 60 + 40), after: meeting(null) })

  it('empieza por las palabras EXACTAS de `validatePlacement` y añade la cláusula detrás', () => {
    const input = { startTime: '10:45', durationMinutes: 120 }
    const plain = validatePlacement(input, space).message

    expect(plain).not.toBeNull()
    expect(describePlacementBlocker(input, space)).toBe(`${plain} A las 11:30 entra Daily meeting.`)
  })

  it('cuando cabe, no hay aviso', () => {
    expect(describePlacementBlocker({ startTime: '10:00', durationMinutes: 30 }, space)).toBeNull()
  })

  it('«dile cuánto dura» no nombra a nadie: no habla de ningún borde', () => {
    expect(describePlacementBlocker({ startTime: '10:00', durationMinutes: null }, space)).toBe(
      'Dile cuánto dura, aunque sean 15 minutos.',
    )
  })

  it('una ventana del plan (sin `previousBlockTitle`) no inventa ningún nombre por la izquierda', () => {
    const planWindow = { startMinutes: 9 * 60 + 30, endMinutes: 11 * 60 + 30, nextBlockTitle: null }
    const input = { startTime: '09:00', durationMinutes: 30 }

    expect(describePlacementBlocker(input, planWindow)).toBe(validatePlacement(input, planWindow).message)
  })
})

/**
 * **La ventana que se quedó sin sitio** (hallazgo 1 de la revisión de la tajada
 * 2). Antes decía «Aquí cabe algo entre las 12:00 y las 12:00»: bloqueaba bien,
 * pero la frase no se entendía.
 */
describe('describePlacementBlocker — la ventana sin sitio (tajada 3)', () => {
  it('no dice la misma hora dos veces: dice que ya no queda rato, y quién lo ocupó', () => {
    const space = buildGapRealWindow({ gap, before: breakfast(12 * 60), after: meeting(null) })
    const message = describePlacementBlocker({ startTime: '09:30', durationMinutes: 15 }, space)

    expect(message).toBe('Aquí ya no queda rato libre. Desayunar acabó a las 12:00.')
    expect(message).not.toContain('entre las 12:00 y las 12:00')
  })

  it('también sin duración elegida: con la ventana sin sitio, da igual cuánto dure', () => {
    const space = buildGapRealWindow({ gap, before: breakfast(12 * 60), after: meeting(null) })

    expect(describePlacementBlocker({ startTime: '09:30', durationMinutes: null }, space)).toBe(
      'Aquí ya no queda rato libre. Desayunar acabó a las 12:00.',
    )
  })

  it('sin nadie a quien nombrar —la mitad de delante, recortada a «ahora»— no se inventa un vecino', () => {
    const space = buildGapRealWindow({
      gap,
      before: null,
      after: meeting(null),
      nowMinutes: gap.startMinutes,
      clampToNow: true,
    })

    expect(describePlacementBlocker({ startTime: '09:30', durationMinutes: 15 }, space)).toBe(
      'Aquí ya no queda rato libre. Lo de al lado ocupó todo este rato.',
    )
  })

  it('ni una palabra de reproche: no se llama «vacío» ni «perdido» a nada (criterio 246)', () => {
    const space = buildGapRealWindow({ gap, before: breakfast(12 * 60), after: meeting(null) })
    const message = describePlacementBlocker({ startTime: '09:30', durationMinutes: 15 }, space) ?? ''

    for (const word of ['vacío', 'perdido', 'desperdici', 'en blanco']) {
      expect(message.toLowerCase()).not.toContain(word)
    }
  })
})
