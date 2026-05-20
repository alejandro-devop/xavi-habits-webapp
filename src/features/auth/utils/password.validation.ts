const MIN_LENGTH = 8
const HAS_UPPERCASE = /[A-Z]/
const HAS_LOWERCASE = /[a-z]/
const HAS_NUMBER = /\d/

export function validatePassword(password: string): string | null {
  if (password.length < MIN_LENGTH) {
    return 'La contraseña debe tener al menos 8 caracteres.'
  }
  if (!HAS_UPPERCASE.test(password)) {
    return 'La contraseña debe incluir al menos una mayúscula.'
  }
  if (!HAS_LOWERCASE.test(password)) {
    return 'La contraseña debe incluir al menos una minúscula.'
  }
  if (!HAS_NUMBER.test(password)) {
    return 'La contraseña debe incluir al menos un número.'
  }
  return null
}

export function validatePasswordMatch(password: string, confirm: string): string | null {
  if (password !== confirm) {
    return 'Las contraseñas no coinciden.'
  }
  return null
}

export const OTP_LENGTH = 6
export const OTP_PATTERN = /^\d{6}$/

export function validateOtpCode(code: string): string | null {
  if (!OTP_PATTERN.test(code)) {
    return 'El código debe tener exactamente 6 dígitos.'
  }
  return null
}
