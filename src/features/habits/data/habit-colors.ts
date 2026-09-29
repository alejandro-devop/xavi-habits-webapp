// ─────────────────────────────────────────────────────────────────────────────
// Los colores de un hábito
//
// La paleta ya no vive aquí: se mudó a `@/shared/ui/ColorPicker/color-palette`
// en FEAT-002 (tajada 2), cuando el catálogo de Vida pidió el mismo selector.
// Este archivo se queda con dos cosas:
//
//  1. Los **nombres de hábitos** de la paleta, re-exportados, para que nada de
//     lo que ya importaba de aquí tenga que cambiar (incluido su test, que fija
//     los ΔE de los veintidós tonos).
//  2. `pickInitialHabitColor`, que **sí** es dominio de hábitos: sortea el color
//     de un hábito nuevo mirando los que ya usan los hábitos del usuario.
//
// Se importa del submódulo `color-palette` y no del barril de `ColorPicker` a
// propósito: esto es un archivo de datos y aquí no entra React.
// ─────────────────────────────────────────────────────────────────────────────

import { CORE_COLORS, normalizeColor } from '@/shared/ui/ColorPicker/color-palette'

export type { ColorTier as HabitColorTier, PaletteColor as HabitColor } from '@/shared/ui/ColorPicker/color-palette'

export {
  CORE_COLORS as HABIT_CORE_COLORS,
  EXTENDED_COLORS as HABIT_EXTENDED_COLORS,
  PALETTE_COLORS as HABIT_COLORS,
  findPaletteColor as findHabitColor,
  normalizeColor as normalizeHabitColor,
} from '@/shared/ui/ColorPicker/color-palette'

/**
 * Sortea el color con el que nace un hábito nuevo.
 *
 * **Solo reparte entre los seis del núcleo.** Los extendidos se parecen entre
 * sí a propósito, y dos hábitos a los que la app les pone el color sola tienen
 * que distinguirse siempre: nadie los está mirando cuando se deciden.
 *
 * Prefiere un color que el usuario **no** esté usando ya; solo cuando los seis
 * están cogidos repite, y entonces elige entre los menos usados. Un sorteo
 * puramente aleatorio repite enseguida, y el objetivo era justo lo contrario.
 *
 * `random` se inyecta para poder probarlo: con un generador fijo el resultado
 * es predecible.
 */
export function pickInitialHabitColor(
  usedColors: readonly (string | null)[],
  random: () => number = Math.random,
): string {
  const counts = new Map<string, number>(CORE_COLORS.map((color) => [color.hex, 0]))

  for (const used of usedColors) {
    const normalized = normalizeColor(used)
    // Un color de fuera del núcleo no bloquea ninguna casilla: no es «ninguno
    // de los seis», así que no cuenta para nada. Un extendido tampoco.
    if (!normalized || !counts.has(normalized)) continue
    counts.set(normalized, (counts.get(normalized) ?? 0) + 1)
  }

  const minCount = Math.min(...counts.values())
  const candidates = CORE_COLORS.filter((color) => counts.get(color.hex) === minCount)

  // `random()` devuelve [0, 1); el clamp es por si alguien inyecta un generador
  // que devuelva exactamente 1.
  const index = Math.min(candidates.length - 1, Math.floor(random() * candidates.length))
  return candidates[index].hex
}

/**
 * Sortea el color con el que nace una categoría de hábitos nueva (FEAT-026).
 *
 * **Es el mismo algoritmo que el de los hábitos, a propósito**, y por eso
 * delega en vez de copiarlo: solo los seis del núcleo, sin repetir mientras
 * quede alguno libre, y si no, entre los menos usados. Lo que cambia es **a
 * quién se mira**: `categoryColors` son los colores de las **categorías de
 * hábitos** del usuario, no los de sus hábitos ni los de las categorías de
 * Vida. Dos categorías se distinguen entre sí en el filtro de Mis hábitos; que
 * una categoría comparta color con un hábito no molesta a nadie.
 *
 * Vida tiene su gemelo en `vida-category-color.utils.ts` porque allí hay una
 * frontera de módulo; aquí no la hay. Si un día cambian las reglas del sorteo
 * de hábitos, cambian también las de sus categorías: es la consecuencia
 * aceptada.
 *
 * Quien llama tiene que pasar la lista **ya llegada**: sortear sobre una lista
 * que aún no ha llegado es sortear sobre cero y puede repetir color.
 */
export function pickInitialHabitCategoryColor(
  categoryColors: readonly (string | null)[],
  random: () => number = Math.random,
): string {
  return pickInitialHabitColor(categoryColors, random)
}
