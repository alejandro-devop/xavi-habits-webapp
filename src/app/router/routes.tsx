import type { RouteObject } from 'react-router'
import { RootLayout } from '@/layouts/RootLayout/RootLayout'
import { HomePage } from '@/pages/HomePage/HomePage'
import { NotFoundPage } from '@/pages/NotFoundPage/NotFoundPage'

// Lazy loading (futuro):
// const HomePage = lazy(() => import('@/pages/HomePage/HomePage'))
// Usar <Suspense fallback={<SuspenseFallback />}> al envolver rutas lazy

export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]
