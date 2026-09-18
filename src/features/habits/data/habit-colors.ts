// ─────────────────────────────────────────────────────────────────────────────
// La paleta de colores de hábito
//
// Ocho tonos, ni uno más. Son los que hacen que la rejilla de Mis Hábitos se
// lea de un vistazo: suficientes para distinguir, pocos para que quepan en una
// fila sin desplegar nada.
//
// El criterio que manda al elegirlos es que **cada uno se distinga sobre el
// vidrio en tema claro y en oscuro**. Son tonos de saturación media: los muy
// claros se disuelven en el vidrio claro y los muy oscuros desaparecen en el
// oscuro. Un color bonito que no cumple eso no entra.
//
// Esto es un archivo de datos, no un componente: aquí no se importa React.
// ─────────────────────────────────────────────────────────────────────────────

export interface HabitColor {
  /** Identificador estable, no se traduce ni se muestra. */
  name: string
  /** Lo que lee y escucha el usuario. */
  label: string
  /** Lo que se guarda en la API, siempre en minúsculas. */
  hex: string
}

/**
 * Seis, no ocho. La paleta se validó con el comprobador de contraste y
 * daltonismo comparando **todos los pares**, no solo los vecinos: con ocho
 * tonos siempre quedaban dos indistinguibles —índigo y violeta se separaban
 * ΔE 0,9 para quien no distingue el rojo, y coral y rosa ΔE 9,9 incluso con
 * visión normal—. Seis es el número en el que cada par se distingue de
 * verdad. Más colores que no se diferencian no son más colores.
 *
 * Ordenados por tono, para que la fila se lea como un arcoíris y no como un
 * saco.
 */
export const HABIT_COLORS: readonly HabitColor[] = [
  { name: 'mint', label: 'Menta', hex: '#10b981' },
  { name: 'olive', label: 'Oliva', hex: '#4d7c0f' },
  { name: 'amber', label: 'Ámbar', hex: '#f59e0b' },
  { name: 'crimson', label: 'Carmín', hex: '#e11d48' },
  { name: 'violet', label: 'Violeta', hex: '#8b5cf6' },
  { name: 'blue', label: 'Azul', hex: '#0284c7' },
] as const

/**
 * Los colores llegan de la API como texto libre: hay `null`, hay espacios y hay
 * mayúsculas mezcladas (`#10B981` y `#10b981` son el mismo color). Todo lo que
 * compare colores tiene que pasar por aquí antes, o la regla de «no repetir»
 * no sirve de nada.
 */
export function normalizeHabitColor(value: string | null | undefined): string | null {
  if (!value) return null
  const trimmed = value.trim().toLowerCase()
  return trimmed || null
}

/** El color de la paleta que corresponde a un hex, o `null` si es de fuera. */
export function findHabitColor(value: string | null | undefined): HabitColor | null {
  const normalized = normalizeHabitColor(value)
  if (!normalized) return null
  return HABIT_COLORS.find((color) => color.hex === normalized) ?? null
}

/**
 * Sortea el color con el que nace un hábito nuevo.
 *
 * Prefiere un color que el usuario **no** esté usando ya; solo cuando los ocho
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
  const counts = new Map<string, number>(HABIT_COLORS.map((color) => [color.hex, 0]))

  for (const used of usedColors) {
    const normalized = normalizeHabitColor(used)
    // Un color de fuera de la paleta no bloquea ninguna casilla: no es
    // «ninguno de los ocho», así que no cuenta para nada.
    if (!normalized || !counts.has(normalized)) continue
    counts.set(normalized, (counts.get(normalized) ?? 0) + 1)
  }

  const minCount = Math.min(...counts.values())
  const candidates = HABIT_COLORS.filter((color) => counts.get(color.hex) === minCount)

  // `random()` devuelve [0, 1); el clamp es por si alguien inyecta un generador
  // que devuelva exactamente 1.
  const index = Math.min(candidates.length - 1, Math.floor(random() * candidates.length))
  return candidates[index].hex
}
