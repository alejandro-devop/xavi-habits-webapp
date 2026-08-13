import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import type { ReactNode } from 'react'
import { AuthBootstrapProvider } from '@/features/auth/providers/AuthBootstrapProvider'
import { ThemeProvider } from '@/features/theme'
import { ConfirmDialogProvider } from '@/shared/ui/ConfirmDialog'
import { ToastProvider } from '@/shared/ui/Toast'
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
        // Explícito y alineado con el gcTime de query-client.ts: si maxAge
        // superara al gcTime, se hidratarían queries que la caché en memoria
        // ya descartó.
        maxAge: 1000 * 60 * 60 * 24,
      }}
    >
      <ThemeProvider>
        <ToastProvider>
          <ConfirmDialogProvider>
            <AuthBootstrapProvider>{children}</AuthBootstrapProvider>
          </ConfirmDialogProvider>
        </ToastProvider>
      </ThemeProvider>
    </PersistQueryClientProvider>
  )
}
