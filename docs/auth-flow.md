# Flujo de autenticación — Xavi Habits Web

Fase 4: routing, UI mínima y sesión persistente sobre el [API core](./api-core.md).

## Rutas

| Ruta | Acceso | Layout |
|------|--------|--------|
| `/` | Público; con sesión verificada → `/app/today` | `PublicLayout` + `PublicHomeRoute` |
| `/auth/login` | Guest | `AuthLayout` |
| `/auth/register` | Guest | `AuthLayout` |
| `/auth/verify-email` | Guest tras registro (email pendiente) o sesión no verificada; sin contexto → login | `VerifyEmailRoute` + `AuthLayout` |
| `/auth/forgot-password` | Guest | `AuthLayout` |
| `/auth/reset-password` | Guest | `AuthLayout` |
| `/app/today` | Protegido + cuenta verificada | `AppLayout` |

Redirects: `/auth` → login · `/app` → today.

## Guards

| Guard | Ubicación | Comportamiento |
|-------|-----------|----------------|
| `AuthBootstrapProvider` | App global | `loading` hasta hidratar Zustand y refrescar/perfil |
| `ProtectedRoute` | `/app/*` | Sin sesión → `/auth/login` |
| `GuestRoute` | `/auth/*` | Verificado → `/app/today`; no verificado → `/auth/verify-email` (excepto si ya estás en esa ruta) |
| `VerifyEmailRoute` | `/auth/verify-email` | Sin sesión ni email pendiente → `/auth/login` |
| `PublicHomeRoute` | `/` | Sesión verificada → `/app/today`; no verificada → verify-email |
| `VerifyAccountGuard` | hijos `/app` | `!isAccountVerified` → `/auth/verify-email` |

Los guards esperan `authStatus === 'ready'` y muestran `PageLoader` para evitar flicker.

## Ciclo de refresh

1. Al cargar la app, tras `persist.onFinishHydration`, si hay `refreshToken` se llama `getValidAccessToken()`.
2. Si el access expira en menos de 60 s, `POST /api/auth/refresh` (rotación de refresh token).
3. Con token válido, `GET /api/auth/profile` actualiza `user` en Zustand.
4. Si refresh o sesión fallan → `clearSession()`.

Detalle técnico: `features/auth/services/token.service.ts`.

## Flujos de pantalla

### Registro

1. `POST /api/auth/register`
2. Guardar email pendiente (`sessionStorage`)
3. Redirect `/auth/verify-email`
4. `POST /api/auth/verify-email` (modo guest, email + OTP 6 dígitos)
5. Redirect `/auth/login`

### Login

1. `POST /api/auth/login` → `setSession`
2. Si `!user.isAccountVerified` → `/auth/verify-email` (modo logueado: `verify-account` + `resend-otp`)
3. Si verificado → `/app/today`

### Recuperar contraseña

1. `POST /api/auth/forgot-password` — mensaje genérico siempre (no revelar si el email existe)
2. `POST /api/auth/reset-password` — email + OTP + nueva contraseña
3. Redirect login (sesiones refresh revocadas en backend)

### Logout

1. `POST /api/auth/logout` con `refreshToken`
2. `clearSession()` + `queryClient.clear()`
3. Redirect `/auth/login`

## Estado global

`features/auth/store/auth.store.ts` (persist `xavi-auth`):

- `accessToken`, `accessExpiresAt`, `refreshToken`, `user`

Selectores (`auth.selectors.ts`):

- `selectIsAuthenticated` — `refreshToken && accessToken`
- `selectIsAccountVerified` — `user?.isAccountVerified`

## Estructura de carpetas

```txt
features/auth/
  api/           # REST wrappers
  components/    # Formularios y UI auth
  hooks/         # Mutations y profile query
  providers/     # AuthBootstrapProvider
  router/        # Guards y auth-paths
  store/         # Zustand + selectors
  services/      # token.service (refresh)
  types/ utils/
layouts/         # Public, Auth, App
pages/           # Thin route entry points
```

## Hooks React Query

- `useLoginMutation`, `useRegisterMutation`, `useVerifyEmailMutation`, `useResendOtpMutation`
- `useForgotPasswordMutation`, `useResetPasswordMutation`, `useLogoutMutation`
- `useProfileQuery` — perfil tras bootstrap

## Validaciones cliente

- Contraseña: ≥8 caracteres, mayúscula, minúscula, número
- OTP: exactamente 6 dígitos (`OtpInput` con soporte de pegado)

## Próximas fases

- Módulo hábitos (`habitMyDay`) solo GraphQL
- No usar REST legacy para hábitos, actividades ni cursos
