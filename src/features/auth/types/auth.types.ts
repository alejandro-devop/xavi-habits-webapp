export interface AuthUser {
  id: number
  email: string
  name: string
  isAccountVerified: boolean
  createdAt?: string
}

export interface AuthSession {
  accessToken: string
  accessExpiresAt: number
  refreshToken: string
  user: AuthUser
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponseData {
  accessToken: string
  accessExpiresAt: number
  refreshToken: string
  user: AuthUser
  nextResendAvailableAt?: string
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
}

export interface RegisterResponseData {
  user: AuthUser
  message?: string
  emailSent?: boolean
}

export interface RefreshRequest {
  refreshToken: string
}

export interface RefreshResponseData {
  accessToken: string
  accessExpiresAt: number
  refreshToken: string
  user: AuthUser
}

export interface LogoutRequest {
  refreshToken: string
}

export interface ProfileResponseData {
  user: AuthUser
}

export interface VerifyEmailRequest {
  email: string
  code: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  email: string
  code: string
  password: string
}

export interface MessageResponseData {
  message: string
}

export interface VerifyAccountRequest {
  code: string
}
