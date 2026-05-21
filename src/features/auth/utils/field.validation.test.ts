import { describe, expect, it } from 'vitest'
import { validateEmail, validateName } from '@/features/auth/utils/field.validation'

describe('field.validation', () => {
  it('validateEmail rejects empty and invalid formats', () => {
    expect(validateEmail('')).not.toBeNull()
    expect(validateEmail('not-an-email')).not.toBeNull()
    expect(validateEmail('user@example.com')).toBeNull()
  })

  it('validateName rejects empty and too short names', () => {
    expect(validateName('')).not.toBeNull()
    expect(validateName('A')).not.toBeNull()
    expect(validateName('Jane')).toBeNull()
  })
})
