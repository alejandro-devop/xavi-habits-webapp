// ─────────────────────────────────────────────────────────────────────────────
// La paleta de la app
//
// Diecisiete tonos en dos niveles. El criterio no es el gusto: es que dos cosas
// con color distinto se distingan de verdad, también para quien no ve bien el
// rojo o el verde.
//
// Vivía en `features/habits/data/habit-colors.ts`. Se mudó aquí cuando el
// módulo Vida pidió el mismo selector (FEAT-002, tajada 2): una lista de
// diecisiete hexadecimales no conoce ningún dominio, y dos features la
// necesitan. Lo que **no** se mudó es `pickInitialHabitColor`, que sortea el
// color de un hábito nuevo mirando los hábitos que ya hay: eso sí es dominio y
// sigue en hábitos.
//
// Los hexadecimales **no cambian**: hay hábitos y categorías guardados con ellos.
//
// Esto es un archivo de datos, no un componente: aquí no se importa React.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * `core` son los seis que la app puede repartir sola; `extended`, los once que
 * solo se eligen a mano. La distinción no es decorativa: el sorteo depende de
 * ella, así que vive en los datos y no en quien los pinta.
 */
export type ColorTier = 'core' | 'extended'

export interface PaletteColor {
  /** Identificador estable, no se traduce ni se muestra. */
  name: string
  /** Lo que lee y escucha el usuario. Obligatorio: es la pista que acompaña al color. */
  label: string
  /** Lo que se guarda en la API, siempre en minúsculas. */
  hex: string
  /** `core` entra en el sorteo automático; `extended`, nunca. */
  tier: ColorTier
}

/**
 * El núcleo: seis colores que pasan el validador entero en tema claro
 * comparando **todos los pares**, no solo los vecinos. Son los mismos de la
 * fase 9 y no cambian de hexadecimal: hay hábitos guardados con ellos.
 *
 * Seis es un techo, no un capricho: con los mismos hexadecimales sirviendo a
 * tema claro y oscuro no caben más sin que algún par se vuelva indistinguible.
 *
 * Ordenados por tono, para que la fila se lea como un arcoíris y no como un saco.
 */
export const CORE_COLORS: readonly PaletteColor[] = [
  { name: 'mint', label: 'Menta', hex: '#10b981', tier: 'core' },
  { name: 'olive', label: 'Oliva', hex: '#4d7c0f', tier: 'core' },
  { name: 'amber', label: 'Ámbar', hex: '#f59e0b', tier: 'core' },
  { name: 'crimson', label: 'Carmín', hex: '#e11d48', tier: 'core' },
  { name: 'violet', label: 'Violeta', hex: '#8b5cf6', tier: 'core' },
  { name: 'blue', label: 'Azul', hex: '#0284c7', tier: 'core' },
] as const

/**
 * Los extendidos: once colores que **solo se eligen a mano**.
 *
 * Cada uno está a ΔE ≥ 15 en OKLab de cada color del núcleo —comprobado en el
 * test, no supuesto—, así que nunca se confunde con uno que la app haya
 * repartido sola. Entre ellos sí pueden parecerse (`#b46ca8` y `#e1808d` están
 * a ΔE 11,2) y es deliberado: quien los elige los está mirando, y cada muestra
 * se anuncia con su nombre en español.
 *
 * Salen de una búsqueda con el validador de paletas, no de una propuesta
 * estética: no se sustituyen «porque quedan mejor».
 */
export const EXTENDED_COLORS: readonly PaletteColor[] = [
  { name: 'cyan', label: 'Cian', hex: '#11bff0', tier: 'extended' },
  { name: 'lavender', label: 'Lavanda', hex: '#99a7f9', tier: 'extended' },
  { name: 'indigo', label: 'Añil', hex: '#2d3acc', tier: 'extended' },
  { name: 'purple', label: 'Morado', hex: '#7017b6', tier: 'extended' },
  { name: 'plum', label: 'Ciruela', hex: '#793974', tier: 'extended' },
  { name: 'mauve', label: 'Malva', hex: '#b46ca8', tier: 'extended' },
  { name: 'magenta', label: 'Magenta', hex: '#c02ca7', tier: 'extended' },
  { name: 'fuchsia', label: 'Fucsia', hex: '#ff6ce2', tier: 'extended' },
  { name: 'rose', label: 'Rosa palo', hex: '#e1808d', tier: 'extended' },
  { name: 'cinnamon', label: 'Canela', hex: '#924b00', tier: 'extended' },
  { name: 'bronze', label: 'Bronce', hex: '#af761e', tier: 'extended' },
] as const

/** La paleta completa, en el orden en que se muestra: primero el núcleo. */
export const PALETTE_COLORS: readonly PaletteColor[] = [
  ...CORE_COLORS,
  ...EXTENDED_COLORS,
] as const

/**
 * Los colores llegan de la API como texto libre: hay `null`, hay espacios y hay
 * mayúsculas mezcladas (`#10B981` y `#10b981` son el mismo color). Todo lo que
 * compare colores tiene que pasar por aquí antes, o la regla de «no repetir»
 * no sirve de nada.
 */
export function normalizeColor(value: string | null | undefined): string | null {
  if (!value) return null
  const trimmed = value.trim().toLowerCase()
  return trimmed || null
}

/** El color de la paleta que corresponde a un hex, o `null` si es de fuera. */
export function findPaletteColor(value: string | null | undefined): PaletteColor | null {
  const normalized = normalizeColor(value)
  if (!normalized) return null
  return PALETTE_COLORS.find((color) => color.hex === normalized) ?? null
}
