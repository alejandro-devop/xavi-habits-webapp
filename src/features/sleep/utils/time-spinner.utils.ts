export function sanitizeTimeUnitDigits(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 2)
}

export function extractTypingDigits(raw: string): string {
  return raw.replace(/\D/g, '')
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

/** Derive the next in-progress digit buffer from a controlled input change. */
export function nextDraftDigits(current: string, incoming: string): string {
  const digits = extractTypingDigits(incoming)
  if (digits.length === 0) return ''

  if (current.length === 0) {
    if (digits.length <= 2) return digits
    return digits.slice(-2)
  }

  if (digits.startsWith(current)) {
    return digits.slice(0, 2)
  }

  if (digits.length === current.length + 1 && digits.slice(0, -1) === current) {
    return digits.slice(0, 2)
  }

  const appended = sanitizeTimeUnitDigits(current + digits.slice(-1))
  if (appended.length <= 2) return appended

  return digits.slice(-2)
}

export function appendDraftDigit(current: string, digit: string): string {
  return sanitizeTimeUnitDigits(current + digit).slice(0, 2)
}
