/**
 * Texto de Vida para **comparar**, nunca para enseñar.
 *
 * Misma forma que `normalizeSearchText` de hábitos
 * (`src/features/habits/utils/habit-list.utils.ts:36`), copiada y no importada:
 * aquélla es dominio hábitos y Vida no depende de ese módulo. Son cuatro
 * líneas; el acoplamiento costaría más.
 */

/** Minúsculas y sin tildes, para que «banar» encuentre «Bañarme». */
export function normalizeVidaText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase()
}

/**
 * Orden alfabético como lo haría el navegador en español: la ñ después de la n
 * y las tildes sin alterar el orden.
 */
export function compareVidaNames(a: string, b: string): number {
  return a.localeCompare(b, 'es', { sensitivity: 'base' })
}
