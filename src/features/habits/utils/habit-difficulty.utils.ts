export const DIFFICULTY_EMOJIS: Record<number, string> = {
  0: '😊',
  1: '🙂',
  2: '😐',
  3: '😓',
  4: '💀',
}

export const DIFFICULTY_LABELS: Record<number, string> = {
  0: 'Muy fácil',
  1: 'Fácil',
  2: 'Normal',
  3: 'Difícil',
  4: 'Extremo',
}

export function getDifficultyEmoji(difficulty: number | null): string {
  if (difficulty === null) return '—'
  return DIFFICULTY_EMOJIS[difficulty] ?? '—'
}
