import { createContext } from 'react'

export type AuthBootstrapStatus = 'loading' | 'ready'

export type AuthBootstrapContextValue = {
  status: AuthBootstrapStatus
}

export const AuthBootstrapContext = createContext<AuthBootstrapContextValue | null>(
  null,
)
