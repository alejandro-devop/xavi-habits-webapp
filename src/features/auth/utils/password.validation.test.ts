import { describe, expect, it } from 'vitest'
import {
  validateOtpCode,
  validatePassword,
  validatePasswordMatch,
} from '@/features/auth/utils/password.validation'

describe('password.validation', () => {
  it('validatePassword accepts a valid password', () => {
    expect(validatePassword('Secret123')).toBeNull()
  })

  it('validatePassword rejects weak passwords', () => {
    expect(validatePassword('short')).not.toBeNull()
    expect(validatePassword('alllowercase1')).not.toBeNull()
    expect(validatePassword('ALLUPPERCASE1')).not.toBeNull()
    expect(validatePassword('NoNumbers')).not.toBeNull()
  })

  it('validatePasswordMatch detects mismatch', () => {
    expect(validatePasswordMatch('Secret123', 'Secret124')).not.toBeNull()
    expect(validatePasswordMatch('Secret123', 'Secret123')).toBeNull()
  })

  it('validateOtpCode requires exactly 6 digits', () => {
    expect(validateOtpCode('12345')).not.toBeNull()
    expect(validateOtpCode('123456')).toBeNull()
    expect(validateOtpCode('12a456')).not.toBeNull()
  })
})
