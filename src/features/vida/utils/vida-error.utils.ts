/**
 * El mensaje que se le enseña a alguien cuando una mutación de Vida falla.
 *
 * Vivía copiada en `useActivities.ts` y en `useActivityCategories.ts`; el
 * revisor de la tajada 2 pidió que la tercera copia —la de `useVidaItems.ts`—
 * no se escribiera. Es del módulo y no de `shared` porque solo la usan los
 * hooks de Vida: cuando alguien la necesite fuera, se sube entonces.
 *
 * Por qué existe: sin `onError` una mutación que falla no dice nada y el
 * usuario cree que guardó. Lo dejaron anotado los tres revisores de F0.
 */
export function toErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message.trim() ? error.message : fallback
}
