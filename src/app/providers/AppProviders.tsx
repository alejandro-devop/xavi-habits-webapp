import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import type { ReactNode } from 'react'
import { AuthBootstrapProvider } from '@/features/auth/providers/AuthBootstrapProvider'
import { ThemeProvider } from '@/features/theme'
import { ConfirmDialogProvider } from '@/shared/ui/ConfirmDialog'
import { ToastProvider } from '@/shared/ui/Toast'
import { queryClient } from './query-client'
import { queryPersistOptions } from './query-persist'

type AppProvidersProps = {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      // Definidas en `query-persist.ts` para que los tests monten exactamente
      // esta configuración: el invalidador y el `maxAge` se explican allí.
      persistOptions={queryPersistOptions}
    >
      <ThemeProvider>
        {/* Avisos y confirmaciones son cromo global y se montan en portales:
            sin `ds` heredarían los tokens de `:root` y saldrían en azul Apple
            aunque los dispare un módulo ya migrado a Aura. */}
        <ToastProvider ds="aura">
          <ConfirmDialogProvider ds="aura">
            <AuthBootstrapProvider>{children}</AuthBootstrapProvider>
          </ConfirmDialogProvider>
        </ToastProvider>
      </ThemeProvider>
    </PersistQueryClientProvider>
  )
}
