import type { RouteObject } from 'react-router'
import { Navigate } from 'react-router'
import { GuestRoute } from '@/features/auth/router/GuestRoute'
import { ProtectedRoute } from '@/features/auth/router/ProtectedRoute'
import { VerifyAccountGuard } from '@/features/auth/router/VerifyAccountGuard'
import { authPaths } from '@/features/auth/router/auth-paths'
import { AuthLayout } from '@/layouts/AuthLayout/AuthLayout'
import { AppLayout } from '@/layouts/AppLayout/AppLayout'
import { PublicLayout } from '@/layouts/PublicLayout/PublicLayout'
import { TestingHallPage } from '@/pages/app/TestingHallPage/TestingHallPage'
import { TodayPage } from '@/pages/app/TodayPage/TodayPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage/ForgotPasswordPage'
import { LoginPage } from '@/pages/auth/LoginPage/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage/RegisterPage'
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage/ResetPasswordPage'
import { VerifyEmailRoute } from '@/features/auth/router/VerifyEmailRoute'
import { PublicHomeRoute } from '@/pages/public/PublicHomeRoute'
import { NotFoundPage } from '@/pages/NotFoundPage/NotFoundPage'

export const routes: RouteObject[] = [
  {
    element: <PublicLayout />,
    children: [
      {
        index: true,
        element: <PublicHomeRoute />,
      },
    ],
  },
  {
    path: '/auth',
    element: <GuestRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          {
            index: true,
            element: <Navigate to={authPaths.login} replace />,
          },
          {
            path: 'login',
            element: <LoginPage />,
          },
          {
            path: 'register',
            element: <RegisterPage />,
          },
          {
            path: 'verify-email',
            element: <VerifyEmailRoute />,
          },
          {
            path: 'forgot-password',
            element: <ForgotPasswordPage />,
          },
          {
            path: 'reset-password',
            element: <ResetPasswordPage />,
          },
        ],
      },
    ],
  },
  {
    path: '/app',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <Navigate to={authPaths.today} replace />,
          },
          {
            element: <VerifyAccountGuard />,
            children: [
              {
                path: 'today',
                element: <TodayPage />,
              },
              {
                path: 'testinghall',
                element: <TestingHallPage />,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]
