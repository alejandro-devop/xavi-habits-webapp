import { useContext } from 'react'
import { AuthBootstrapContext } from '@/features/auth/providers/auth-bootstrap.context'

export function useAuthBootstrap() {
  const context = useContext(AuthBootstrapContext)
  if (!context) {
    throw new Error('useAuthBootstrap must be used within AuthBootstrapProvider')
  }
  return context
}
