const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateEmail(email: string): string | null {
  const trimmed = email.trim()
  if (!trimmed) {
    return 'El correo es obligatorio.'
  }
  if (!EMAIL_PATTERN.test(trimmed)) {
    return 'Introduce un correo electrónico válido.'
  }
  return null
}

export function validateName(name: string): string | null {
  const trimmed = name.trim()
  if (!trimmed) {
    return 'El nombre es obligatorio.'
  }
  if (trimmed.length < 2) {
    return 'El nombre debe tener al menos 2 caracteres.'
  }
  return null
}
