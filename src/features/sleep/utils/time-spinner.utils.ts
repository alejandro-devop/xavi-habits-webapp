export function sanitizeTimeUnitDigits(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 2)
}

export function commitTimeUnitDigits(digits: string, max: number): number {
  if (digits === '') return 0
  const num = parseInt(digits, 10)
  if (Number.isNaN(num)) return 0
  return Math.min(max, num)
}

export function isCompleteTimeUnit(digits: string, max: number): boolean {
  if (digits.length < 2) return false
  const num = parseInt(digits, 10)
  return !Number.isNaN(num) && num <= max
}
