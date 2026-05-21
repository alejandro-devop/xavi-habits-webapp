import { config } from '@fortawesome/fontawesome-svg-core'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { AppProviders } from '@/app/providers/AppProviders'
import { router } from '@/app/router'
import { AppErrorBoundary } from '@/shared/components/feedback'
import '@/app/styles/global.scss'

config.autoAddCss = false

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </AppErrorBoundary>
  </StrictMode>,
)
