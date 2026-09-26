// ─────────────────────────────────────────────────────────────────────────────
// El color con el que nace una categoría de Vida
//
// Gemelo de `pickInitialHabitColor` (`src/features/habits/data/habit-colors.ts`),
// y gemelo a propósito: son **dos dominios independientes**. Las categorías de
// Vida se reparten los colores entre ellas y los hábitos entre ellos; que un
// hábito use el ámbar no le quita el ámbar a ninguna categoría. Compartir una
// sola función obligaría a compartir también la lista de «en uso», que es justo
// lo que no se comparte (criterio 519).
//
// Vive en `features/vida/utils/` y no en `features/vida/data/` porque ahí solo
// hay catálogos (`vida-starting-points.ts`); las funciones puras del módulo son
// todas `vida-*.utils.ts`. Hábitos lo puso en `data/` cuando la paleta vivía
// allí, y ya no vive allí.
//
// Se importa del submódulo `color-palette` y no del barril de `ColorPicker` a
// propósito: esto es una función pura y aquí no entra React —la misma razón
// escrita en `habit-colors.ts:14-15`—.
// ─────────────────────────────────────────────────────────────────────────────

import { CORE_COLORS, normalizeColor } from '@/shared/ui/ColorPicker/color-palette'

/**
 * Sortea el color con el que nace una categoría de Vida.
 *
 * **Solo reparte entre los seis del núcleo.** Los extendidos se parecen entre
 * sí a propósito, y dos categorías a las que la app les pone el color sola
 * tienen que distinguirse siempre: nadie las está mirando cuando se deciden.
 *
 * Prefiere un color que las categorías del usuario **no** estén usando ya; solo
 * cuando los seis están cogidos repite, y entonces elige entre los menos
 * usados. Un sorteo puramente aleatorio repite enseguida, y el objetivo era
 * justo lo contrario.
 *
 * `random` se inyecta para poder probarlo: con un generador fijo el resultado
 * es predecible.
 */
export function pickInitialCategoryColor(
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
