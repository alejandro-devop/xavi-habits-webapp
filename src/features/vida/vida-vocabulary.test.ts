import { describe, expect, it } from 'vitest'

/**
 * El vocabulario del módulo Vida, comprobado sobre el código entero
 * (criterios 14 y 59, y la regla de `docs/features/ENVIRONMENT.md`).
 *
 * **Nada de culpa**: ni «desperdicio», ni «perdiste», ni «fallaste», ni «vacío»
 * como reproche. Y **nada de «cancelar» ni «eliminar»** referidos a una sesión o
 * a un bloque: los dos toasts heredados de `useDeleteActivityFollowUpMutation`
 * decían «Actividad cancelada» y «Registro eliminado», y ahí es donde se
 * colaban. Ahora dicen «No la guardamos» y «Lo quitamos del registro».
 *
 * Se leen los fuentes con `import.meta.glob(..., { query: '?raw' })` y se les
 * quitan los comentarios antes de mirar: en una explicación **sí** se puede
 * escribir «aquí no se dice "cancelar"», y ese es justo el comentario que hay
 * que poder escribir. Lo que se comprueba es lo que queda, que es lo que puede
 * acabar en pantalla.
 *
 * Los propios tests quedan fuera: un test que afirma que una traducción **no**
 * dice «cancel» tiene que poder escribir la palabra.
 */

const sources = import.meta.glob('./**/*.{ts,tsx}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

/** Fuera los comentarios de bloque y de línea, y fuera los propios tests. */
function codeOf(raw: string): string {
  return raw
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/.*$/gm, '$1 ')
}

const files = Object.entries(sources)
  .filter(([path]) => !path.includes('.test.'))
  .map(([path, raw]) => [path, codeOf(raw)] as const)

/**
 * Cuatro sitios **anteriores a esta feature** que dicen una de las dos palabras
 * y que NO son de una sesión ni de un bloque, que es lo que acota el criterio
 * 59: el botón «Cancelar» de dos hojas del catálogo (FEAT-002) y los toasts de
 * borrar una **actividad** y una **categoría**.
 *
 * Se nombran aquí en vez de callarlos, y **no se tocan** desde FEAT-004: el
 * alcance de esta tajada es la sesión. Queda anotado como hallazgo para quien
 * decida si el vocabulario de Vida también manda en el catálogo.
 */
const HEREDADOS = [
  './components/CreateVidaCategoryStep/CreateVidaCategoryStep.tsx',
  './components/VidaActivitySheet/VidaActivitySheet.tsx',
  './hooks/useActivities.ts',
  './hooks/useActivityCategories.ts',
]

const FORBIDDEN: [string, RegExp][] = [
  ['culpa: «desperdicio»', /desperdici/i],
  ['culpa: «perdiste» / «perdido»', /perdiste|perdid[oa]s?\b/i],
  ['culpa: «fallaste»', /fallaste|fallast/i],
  ['«cancelar» sobre una sesión o un bloque', /cancelar|cancelad[oa]s?\b/i],
  ['«eliminar» sobre una sesión o un bloque', /eliminar|eliminad[oa]s?\b/i],
  // Las siete de FEAT-007 (criterio 73). «mal» **necesita frontera de
  // palabra**: sin ella revienta con «formal», «normal» y «malla».
  ['culpa: «incumpliste» / «objetivo incumplido»', /incumpl/i],
  ['culpa: «deberías»', /deber[íi]as/i],
  ['culpa: «mal»', /\bmal\b/i],
  ['culpa: «racha»', /\bracha/i],
  ['culpa: «cumplimiento»', /cumplimiento/i],
]

describe('el vocabulario de Vida (criterios 14 y 59)', () => {
  it('hay fuentes que mirar: si el glob se rompiera, este archivo no probaría nada', () => {
    expect(files.length).toBeGreaterThan(40)
  })

  it.each(FORBIDDEN)('ningún archivo del módulo dice %s', (_nombre, patron) => {
    const culpables = files
      .filter(([path]) => !HEREDADOS.includes(path))
      .filter(([, code]) => patron.test(code))
      .map(([path]) => path)
    expect(culpables).toEqual([])
  })

  it('los cuatro heredados siguen existiendo: si se arreglan, esta lista sobra', () => {
    // Si alguien los corrige y no quita su nombre de `HEREDADOS`, este test lo
    // dice. Una excepción que ya no hace falta es una excepción que engaña.
    const patron = /cancelar|cancelad[oa]s?\b|eliminar|eliminad[oa]s?\b/i
    for (const path of HEREDADOS) {
      expect(patron.test(codeOf(sources[path] ?? ''))).toBe(true)
    }
  })

  it('los dos toasts heredados quedaron reescritos', () => {
    const hook = sources['./hooks/useActivityFollowUps.ts'] ?? ''
    expect(hook).toContain('No la guardamos')
    expect(hook).toContain('Lo quitamos del registro')
    expect(hook).not.toContain('Actividad cancelada')
    expect(hook).not.toContain('Registro eliminado')
    // «Actividad iniciada» era correcta pero no es la palabra del render.
    expect(hook).toContain("'En marcha'")
  })
})
