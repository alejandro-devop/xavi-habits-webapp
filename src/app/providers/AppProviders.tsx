import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import type { ReactNode } from 'react'
import { AuthBootstrapProvider } from '@/features/auth/providers/AuthBootstrapProvider'
import { queryClient } from './query-client'
import { queryPersistBuster, queryPersister } from './query-persist'

type AppProvidersProps = {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: queryPersister,
        buster: queryPersistBuster,
      }}
    >
      <AuthBootstrapProvider>{children}</AuthBootstrapProvider>
    </PersistQueryClientProvider>
  )
}
