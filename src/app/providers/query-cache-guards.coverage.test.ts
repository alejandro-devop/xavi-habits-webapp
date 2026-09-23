import { describe, expect, it } from 'vitest'
import {
  CACHE_GUARDS,
  findGuard,
  SIN_GUARDA_A_PROPOSITO,
} from '@/app/providers/query-cache-guards'
import { vidaKeys } from '@/shared/api/query-keys'

/**
 * **El test que impide el olvido.**
 *
 * La devolución de la tajada 2 fue que `vidaKeys.items.list()` se había quedado
 * sin guarda aunque su dato se recorre sin red en el primer pintado de Hoy. Que
 * se colara no fue mala suerte: fue que la cobertura se decidía **de memoria**,
 * mirando una pantalla y apuntando lo que se veía.
 *
 * Esto lo sustituye por algo que no depende de acordarse. Recorre `vidaKeys`
 * —que es la única fuente de claves del módulo— y exige que **cada clave** esté
 * o bien guardada, o bien en `SIN_GUARDA_A_PROPOSITO` con un motivo escrito.
 * Añadir una consulta nueva pone este test en rojo hasta que alguien decida cuál
 * de las dos cosas es. Es la misma idea que la regla por contenido de la tajada
 * 1: la protección no puede depender de que alguien se acuerde.
 *
 * **Alcance: `vidaKeys`.** Es el módulo que se cayó, el que vive en el teléfono
 * y el que está en construcción, o sea donde van a aparecer las consultas
 * nuevas. `habitKeys`, `settingsKeys` y `authKeys` quedan fuera del automatismo
 * a propósito, y el motivo NO es que degraden a vacío —eso se escribió aquí y es
 * falso: `HabitDetailPage` pasa `weekView.days` a un `days.map(...)` sin red—. Es
 * **riesgo residual aceptado**: son superficies estables y el módulo que se cayó
 * es Vida. Si alguien amplía el automatismo, `habitKeys.weekView` es el primer
 * candidato, y no es «una línea»: es una decisión por clave. El día
 * que se quieran dentro, es una línea más en `FABRICAS`.
 */

const FABRICAS: ReadonlyArray<[string, Record<string, unknown>]> = [['', vidaKeys]]

type ClaveDescubierta = { camino: string; clave: readonly unknown[] }

/**
 * Recorre una fábrica de claves y devuelve cada **hoja**: las funciones que
 * producen una clave de consulta. Se saltan las llamadas `all`, que son prefijos
 * para invalidar y no claves de ninguna consulta.
 */
function descubrirClaves(prefijo: string, objeto: Record<string, unknown>): ClaveDescubierta[] {
  const encontradas: ClaveDescubierta[] = []
  for (const [nombre, valor] of Object.entries(objeto)) {
    const camino = prefijo === '' ? nombre : `${prefijo}.${nombre}`
    if (nombre === 'all' || nombre.endsWith('All')) continue
    if (typeof valor === 'function') {
      const argumentos = Array.from({ length: valor.length }, () => 'x')
      const clave = (valor as (...args: unknown[]) => readonly unknown[])(...argumentos)
      encontradas.push({ camino, clave })
      continue
    }
    if (valor && typeof valor === 'object' && !Array.isArray(valor)) {
      encontradas.push(...descubrirClaves(camino, valor as Record<string, unknown>))
    }
  }
  return encontradas
}

const CLAVES = FABRICAS.flatMap(([prefijo, fabrica]) => descubrirClaves(prefijo, fabrica))

describe('cobertura de las guardas', () => {
  it('descubre las claves de Vida de verdad (si esto baja, el recorrido se rompió)', () => {
    expect(CLAVES.length).toBeGreaterThanOrEqual(12)
    expect(CLAVES.map((c) => c.camino)).toContain('items.list')
    expect(CLAVES.map((c) => c.camino)).toContain('followUps.range')
  })

  it.each(CLAVES)('$camino está guardada o excluida con motivo', ({ camino, clave }) => {
    const guardada = findGuard(clave) !== undefined
    const excluida = camino in SIN_GUARDA_A_PROPOSITO
    // Si esto falla con una clave nueva: decide si su forma inesperada TUMBA una
    // pantalla (guarda) o solo la VACÍA (a `SIN_GUARDA_A_PROPOSITO`, con motivo).
    expect(guardada || excluida).toBe(true)
    // Y que no esté en las dos, que sería una contradicción escrita.
    expect(guardada && excluida).toBe(false)
  })

  it('no sobra ningún motivo: lo excluido existe y sigue sin guarda', () => {
    const caminos = new Set(CLAVES.map((c) => c.camino))
    for (const camino of Object.keys(SIN_GUARDA_A_PROPOSITO)) {
      expect(caminos.has(camino), `«${camino}» ya no existe en vidaKeys`).toBe(true)
      expect(SIN_GUARDA_A_PROPOSITO[camino].length).toBeGreaterThan(20)
    }
  })
})

describe('una guarda, una forma', () => {
  it('ninguna guarda es prefijo de otra: un prefijo ancho acaba mezclando formas', () => {
    for (const guarda of CACHE_GUARDS) {
      for (const otra of CACHE_GUARDS) {
        if (guarda === otra) continue
        const esPrefijo =
          guarda.keyPrefix.length <= otra.keyPrefix.length &&
          guarda.keyPrefix.every((pieza, i) => otra.keyPrefix[i] === pieza)
        expect(esPrefijo, `«${guarda.porQue}» solapa con «${otra.porQue}»`).toBe(false)
      }
    }
  })

  it('cada clave de followUps cae en la guarda de SU forma', () => {
    const range = findGuard(vidaKeys.followUps.range('2026-09-01', '2026-09-07'))
    const day = findGuard(vidaKeys.followUps.day('2026-09-23'))
    const open = findGuard(vidaKeys.followUps.open())
    const porActividad = findGuard(vidaKeys.followUps.byActivity('7', 5))

    expect(new Set([range, day, open, porActividad]).size).toBe(4)

    // La forma legítima de `range`, que la guarda única rechazaba entera.
    const grupos = [{ date: '2026-09-22', followUps: [{ id: 'f-1', startTime: '09:00' }] }]
    expect(range?.isValid(grupos)).toBe(true)
    // Y no se cuela por la de `day`, que pide `id` y `startTime` arriba.
    expect(day?.isValid(grupos)).toBe(false)
  })
})

describe('la guarda de items.list, que fue la devolución', () => {
  it('rechaza el ítem sin `days` — el gesto del 2026-09-23 con otro campo', () => {
    const guarda = findGuard(vidaKeys.items.list(false))
    expect(guarda).toBeDefined()
    expect(guarda?.isValid([{ id: 'it-1', activityId: '7', isActive: true }])).toBe(false)
    expect(guarda?.isValid([{ id: 'it-1', days: ['monday'] }])).toBe(true)
    expect(guarda?.isValid([])).toBe(true)
  })

  it('cubre las dos variantes de la clave', () => {
    expect(findGuard(vidaKeys.items.list(true))).toBeDefined()
    expect(findGuard(vidaKeys.items.list(false))).toBeDefined()
  })
})
