import { describe, expect, it } from 'vitest'
import type { ActivityDayPlanItem } from '@/features/vida/types/activity-day-plan.types'
import { buildDayAgenda } from '@/features/vida/utils/vida-agenda.utils'
import type { GapWindow } from '@/features/vida/utils/vida-gap-form.utils'
import {
  buildStartTimeOptions,
  describeLeftovers,
  describeWindow,
  durationPillsForWindow,
  fitsInWindow,
  gapToWindow,
  getBlockEditWindow,
  getMaxDurationForStartTime,
  getPlacementLeftovers,
  isStartTimeInsideWindow,
  toDayPlanTimes,
  validatePlacement,
  windowMinutes,
} from '@/features/vida/utils/vida-gap-form.utils'

/** Un hueco de 10:30 a 13:00, cerrado por «Cocinar y almorzar»: el del criterio 24. */
const gapWindow: GapWindow = {
  startMinutes: 10 * 60 + 30,
  endMinutes: 13 * 60,
  nextBlockTitle: 'Cocinar y almorzar',
}

function planItem(partial: Partial<ActivityDayPlanItem> & { id: string }): ActivityDayPlanItem {
  return {
    userId: 1,
    activityId: `act-${partial.id}`,
    date: '2026-09-18',
    startTime: '08:00',
    endTime: '08:30',
    orderIndex: 0,
    completedAt: null,
    createdAt: '2026-09-18T00:00:00.000Z',
    updatedAt: '2026-09-18T00:00:00.000Z',
    activity: null,
    ...partial,
  }
}

describe('vida-gap-form.utils', () => {
  describe('la ventana', () => {
    it('mide lo que hay entre sus dos bordes', () => {
      expect(windowMinutes(gapWindow)).toBe(150)
    })

    it('sale de un hueco de la agenda con su bloque de después', () => {
      const agenda = buildDayAgenda({
        planItems: [planItem({ id: 'a', startTime: '13:00', endTime: '14:00' })],
        dayStart: '06:30',
        dayEnd: '23:00',
      })
      const first = agenda.gaps[0]
      expect(gapToWindow(first)).toEqual({
        startMinutes: 6 * 60 + 30,
        endMinutes: 13 * 60,
        nextBlockTitle: null,
      })
    })
  })

  describe('isStartTimeInsideWindow (criterio 27)', () => {
    it('acepta el principio exacto', () => {
      expect(isStartTimeInsideWindow('10:30', gapWindow)).toBe(true)
    })

    it('rechaza el final exacto: ahí ya no cabe nada', () => {
      expect(isStartTimeInsideWindow('13:00', gapWindow)).toBe(false)
    })

    it('rechaza una hora de antes y una de después', () => {
      expect(isStartTimeInsideWindow('10:29', gapWindow)).toBe(false)
      expect(isStartTimeInsideWindow('19:00', gapWindow)).toBe(false)
    })
  })

  describe('getMaxDurationForStartTime (criterio 26)', () => {
    it('desde el principio, el hueco entero', () => {
      expect(getMaxDurationForStartTime('10:30', gapWindow)).toBe(150)
    })

    it('desde más tarde, lo que queda', () => {
      expect(getMaxDurationForStartTime('12:15', gapWindow)).toBe(45)
    })

    it('fuera de la ventana, cero', () => {
      expect(getMaxDurationForStartTime('13:30', gapWindow)).toBe(0)
    })
  })

  describe('durationPillsForWindow (criterio 26)', () => {
    it('las cuatro caben en un hueco de 2h 30', () => {
      expect(durationPillsForWindow('10:30', gapWindow)).toEqual([15, 30, 45, 60])
    })

    it('empezando a las 12:15 se apaga la hora entera', () => {
      expect(durationPillsForWindow('12:15', gapWindow)).toEqual([15, 30, 45])
    })

    it('en un hueco de 20 minutos solo queda la de 15', () => {
      const small: GapWindow = { startMinutes: 600, endMinutes: 620, nextBlockTitle: null }
      expect(durationPillsForWindow('10:00', small)).toEqual([15])
    })
  })

  describe('fitsInWindow', () => {
    it('lo que acaba justo en el borde cabe', () => {
      expect(fitsInWindow('12:30', 30, gapWindow)).toBe(true)
    })

    it('un minuto más, no', () => {
      expect(fitsInWindow('12:30', 31, gapWindow)).toBe(false)
    })

    it('sin duración no cabe nada', () => {
      expect(fitsInWindow('10:30', null, gapWindow)).toBe(false)
    })
  })

  describe('buildStartTimeOptions (criterio 27)', () => {
    it('ofrece el principio del hueco y al menos dos horas más dentro', () => {
      const options = buildStartTimeOptions(gapWindow)
      expect(options.length).toBeGreaterThanOrEqual(3)
      expect(options[0]).toEqual({
        value: '10:30',
        label: '10:30',
        hint: 'al principio del hueco',
      })
      expect(options.map((option) => option.value)).toEqual(['10:30', '11:00', '11:30', '12:00'])
    })

    it('todas las horas ofrecidas caen dentro de la ventana', () => {
      for (const option of buildStartTimeOptions(gapWindow)) {
        expect(isStartTimeInsideWindow(option.value, gapWindow)).toBe(true)
      }
    })

    it('un hueco que ya empezó ofrece «ahora mismo» como primera hora', () => {
      const started: GapWindow = { startMinutes: 9 * 60 + 24, endMinutes: 13 * 60, nextBlockTitle: null }
      expect(buildStartTimeOptions(started, { nowMinutes: 9 * 60 + 24 })[0]).toEqual({
        value: '09:24',
        label: '9:24',
        hint: 'ahora mismo',
      })
    })

    it('en un hueco corto el paso es de cuartos, y no se ofrece un callejón sin salida', () => {
      const short: GapWindow = { startMinutes: 600, endMinutes: 640, nextBlockTitle: null }
      // 10:00, 10:15 (quedan 25) — las 10:30 dejarían 10 min: menos que lo más
      // corto que se puede poner, así que no se ofrecen.
      expect(buildStartTimeOptions(short).map((option) => option.value)).toEqual(['10:00', '10:15'])
    })

    it('una ventana de cero minutos no ofrece ninguna hora', () => {
      expect(buildStartTimeOptions({ startMinutes: 600, endMinutes: 600, nextBlockTitle: null })).toEqual([])
    })
  })

  describe('validatePlacement (criterios 26, 27 y 56)', () => {
    it('lo que encaja, encaja', () => {
      expect(validatePlacement({ startTime: '11:00', durationMinutes: 60 }, gapWindow)).toEqual({
        valid: true,
        message: null,
      })
    })

    it('una hora fuera del hueco dice entre qué horas sí cabe', () => {
      const result = validatePlacement({ startTime: '14:00', durationMinutes: 30 }, gapWindow)
      expect(result.valid).toBe(false)
      expect(result.message).toContain('10:30')
      expect(result.message).toContain('13:00')
    })

    it('sin duración pide la duración sin reprochar', () => {
      const result = validatePlacement({ startTime: '11:00', durationMinutes: null }, gapWindow)
      expect(result.valid).toBe(false)
      expect(result.message).toBe('Dile cuánto dura, aunque sean 15 minutos.')
    })

    it('una duración que se sale dice cuánto cabe de verdad', () => {
      const result = validatePlacement({ startTime: '12:15', durationMinutes: 60 }, gapWindow)
      expect(result.valid).toBe(false)
      expect(result.message).toContain('45 min')
    })

    it('ningún mensaje reprocha nada (criterio 56)', () => {
      const messages = [
        validatePlacement({ startTime: '14:00', durationMinutes: 30 }, gapWindow).message,
        validatePlacement({ startTime: '11:00', durationMinutes: null }, gapWindow).message,
        validatePlacement({ startTime: '12:15', durationMinutes: 60 }, gapWindow).message,
      ]
      for (const message of messages) {
        expect(message).not.toMatch(/desperdici|perdiste|fallaste|vací|error|cancelar|eliminar/i)
      }
    })
  })

  describe('lo que queda libre después (criterio 28)', () => {
    it('cuenta lo de después y lo de antes', () => {
      expect(getPlacementLeftovers({ startTime: '11:00', durationMinutes: 60 }, gapWindow)).toEqual({
        beforeMinutes: 30,
        afterMinutes: 60,
      })
    })

    it('lo dice nombrando el bloque que viene', () => {
      expect(describeLeftovers({ startTime: '10:30', durationMinutes: 60 }, gapWindow)).toBe(
        'Queda libre 1h 30 antes de Cocinar y almorzar.',
      )
    })

    it('sin bloque después, lo dice hasta el final del día', () => {
      const openEnd: GapWindow = { ...gapWindow, nextBlockTitle: null }
      expect(describeLeftovers({ startTime: '10:30', durationMinutes: 30 }, openEnd)).toBe(
        'Queda libre 2h antes del final del día.',
      )
    })

    it('si sobra un rato antes, también se dice', () => {
      expect(describeLeftovers({ startTime: '11:00', durationMinutes: 60 }, gapWindow)).toBe(
        'Queda libre 1h antes de Cocinar y almorzar, y 30m antes de empezar.',
      )
    })

    it('llenando el hueco entero no queda nada, y se dice sin reproche', () => {
      expect(describeLeftovers({ startTime: '10:30', durationMinutes: 150 }, gapWindow)).toBe(
        'Con esto el rato queda completo.',
      )
    })
  })

  describe('describeWindow (criterio 24)', () => {
    it('el subtítulo de la hoja con el bloque que la cierra', () => {
      expect(describeWindow(gapWindow)).toBe('Hueco de 2h 30 · hasta las 13:00 «Cocinar y almorzar»')
    })

    it('y «hasta el final del día» cuando no hay bloque después', () => {
      expect(describeWindow({ ...gapWindow, nextBlockTitle: null })).toBe(
        'Hueco de 2h 30 · hasta el final del día',
      )
    })
  })

  describe('toDayPlanTimes', () => {
    it('hora y duración se vuelven las dos horas que pide el API', () => {
      expect(toDayPlanTimes('10:30', 45)).toEqual({ startTime: '10:30', endTime: '11:15' })
    })
  })

  describe('getBlockEditWindow (criterio 30)', () => {
    const agenda = buildDayAgenda({
      planItems: [
        planItem({ id: 'a', startTime: '08:00', endTime: '09:00' }),
        planItem({ id: 'b', startTime: '10:30', endTime: '11:00' }),
        planItem({
          id: 'c',
          startTime: '13:00',
          endTime: '14:00',
          activity: { id: 'x', title: 'Cocinar y almorzar', description: null, category: null },
        }),
      ],
      dayStart: '06:30',
      dayEnd: '23:00',
    })

    it('es el bloque más lo libre pegado a cada lado', () => {
      expect(getBlockEditWindow(agenda, 'b')).toEqual({
        startMinutes: 9 * 60,
        endMinutes: 13 * 60,
        nextBlockTitle: 'Cocinar y almorzar',
      })
    })

    it('el primero del día llega hasta el inicio del día', () => {
      expect(getBlockEditWindow(agenda, 'a')?.startMinutes).toBe(6 * 60 + 30)
    })

    it('el último llega hasta el fin del día y no nombra ningún bloque', () => {
      expect(getBlockEditWindow(agenda, 'c')).toEqual({
        startMinutes: 11 * 60,
        endMinutes: 23 * 60,
        nextBlockTitle: null,
      })
    })

    it('mover un bloque dentro de su ventana nunca pisa al vecino (D4)', () => {
      const space = getBlockEditWindow(agenda, 'b')!
      // Pegado al bloque de antes y al de después: los dos bordes son legales.
      expect(fitsInWindow('09:00', 240, space)).toBe(true)
      // Un minuto más ya pisaría «Cocinar y almorzar».
      expect(fitsInWindow('09:00', 241, space)).toBe(false)
    })

    it('un bloque que no está en la agenda no tiene ventana', () => {
      expect(getBlockEditWindow(agenda, 'no-existe')).toBeNull()
    })

    it('con la marca de «ahora» en medio, la ventana no cambia', () => {
      const withNow = buildDayAgenda({
        planItems: [
          planItem({ id: 'a', startTime: '08:00', endTime: '09:00' }),
          planItem({ id: 'b', startTime: '10:30', endTime: '11:00' }),
        ],
        dayStart: '06:30',
        dayEnd: '23:00',
        nowMinutes: 9 * 60 + 30,
      })
      expect(withNow.hasNowMark).toBe(true)
      expect(getBlockEditWindow(withNow, 'b')).toEqual({
        startMinutes: 9 * 60,
        endMinutes: 23 * 60,
        nextBlockTitle: null,
      })
    })
  })
})
