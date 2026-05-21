import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { MemoryRouter, type MemoryRouterProps } from 'react-router'
import { ThemeProvider } from '@/features/theme'
import { ConfirmDialogProvider } from '@/shared/ui/ConfirmDialog'
import { ToastProvider } from '@/shared/ui/Toast'

type ProvidersProps = {
  children: ReactNode
  routerProps?: MemoryRouterProps
}

function AllProviders({ children, routerProps }: ProvidersProps) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <ConfirmDialogProvider>
            <MemoryRouter {...routerProps}>{children}</MemoryRouter>
          </ConfirmDialogProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { routerProps?: MemoryRouterProps },
) {
  const { routerProps, ...renderOptions } = options ?? {}
  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders routerProps={routerProps}>{children}</AllProviders>
    ),
    ...renderOptions,
  })
}
