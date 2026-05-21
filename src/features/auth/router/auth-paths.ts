export const authPaths = {
  home: '/',
  login: '/auth/login',
  register: '/auth/register',
  verifyEmail: '/auth/verify-email',
  forgotPassword: '/auth/forgot-password',
  resetPassword: '/auth/reset-password',
  today: '/app/today',
  testingHall: '/app/testinghall',
} as const

export type AuthPath = (typeof authPaths)[keyof typeof authPaths]

export const FORGOT_PASSWORD_GENERIC_MESSAGE =
  'Si existe una cuenta con este correo, se ha enviado un código para restablecer la contraseña.'
