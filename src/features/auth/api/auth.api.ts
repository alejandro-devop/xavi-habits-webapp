import { env } from '@/app/config/env'
import type {
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponseData,
  LogoutRequest,
  MessageResponseData,
  ProfileResponseData,
  RefreshRequest,
  RefreshResponseData,
  RegisterRequest,
  RegisterResponseData,
  ResetPasswordRequest,
  VerifyAccountRequest,
  VerifyEmailRequest,
} from '@/features/auth/types/auth.types'
import { restRequest } from '@/shared/api/rest-client'

const authBaseUrl = env.authBaseUrl

export function register(input: RegisterRequest): Promise<RegisterResponseData> {
  return restRequest<RegisterResponseData, RegisterRequest>({
    baseUrl: authBaseUrl,
    method: 'POST',
    path: '/register',
    body: input,
  })
}

export function login(input: LoginRequest): Promise<LoginResponseData> {
  return restRequest<LoginResponseData, LoginRequest>({
    baseUrl: authBaseUrl,
    method: 'POST',
    path: '/login',
    body: input,
  })
}

export function verifyEmail(input: VerifyEmailRequest): Promise<MessageResponseData> {
  return restRequest<MessageResponseData, VerifyEmailRequest>({
    baseUrl: authBaseUrl,
    method: 'POST',
    path: '/verify-email',
    body: input,
  })
}

export function forgotPassword(input: ForgotPasswordRequest): Promise<MessageResponseData> {
  return restRequest<MessageResponseData, ForgotPasswordRequest>({
    baseUrl: authBaseUrl,
    method: 'POST',
    path: '/forgot-password',
    body: input,
  })
}

export function resetPassword(input: ResetPasswordRequest): Promise<MessageResponseData> {
  return restRequest<MessageResponseData, ResetPasswordRequest>({
    baseUrl: authBaseUrl,
    method: 'POST',
    path: '/reset-password',
    body: input,
  })
}

export function refresh(input: RefreshRequest): Promise<RefreshResponseData> {
  return restRequest<RefreshResponseData, RefreshRequest>({
    baseUrl: authBaseUrl,
    method: 'POST',
    path: '/refresh',
    body: input,
  })
}

export function logout(input: LogoutRequest): Promise<MessageResponseData> {
  return restRequest<MessageResponseData, LogoutRequest>({
    baseUrl: authBaseUrl,
    method: 'POST',
    path: '/logout',
    body: input,
  })
}

export function getProfile(accessToken: string): Promise<ProfileResponseData> {
  return restRequest<ProfileResponseData>({
    baseUrl: authBaseUrl,
    method: 'GET',
    path: '/profile',
    accessToken,
  })
}

export function resendOtp(accessToken: string): Promise<MessageResponseData> {
  return restRequest<MessageResponseData>({
    baseUrl: authBaseUrl,
    method: 'POST',
    path: '/resend-otp',
    body: {},
    accessToken,
  })
}

export function verifyAccount(
  input: VerifyAccountRequest,
  accessToken: string,
): Promise<MessageResponseData> {
  return restRequest<MessageResponseData, VerifyAccountRequest>({
    baseUrl: authBaseUrl,
    method: 'POST',
    path: '/verify-account',
    body: input,
    accessToken,
  })
}
