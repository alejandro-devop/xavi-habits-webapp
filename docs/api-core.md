# API Core — Xavi Habits Web

Infraestructura de comunicación con `xavi-api` (Fase 3). Sin UI de autenticación ni hooks de dominio todavía.

## Base URL

Configurar en `.env`:

```env
VITE_API_URL=https://xavi-api-wqpmywszuq-uc.a.run.app
```

Leer siempre desde `src/app/config/env.ts`:

| Export | Valor |
|--------|--------|
| `env.apiUrl` | URL raíz del backend (sin trailing slash) |
| `env.authBaseUrl` | `{apiUrl}/api/auth` |
| `env.graphqlUrl` | `{apiUrl}/graphql` |

**No** usar `import.meta.env` fuera de `env.ts`. **No** hardcodear URLs en features.

## REST auth vs GraphQL

| Dominio | Protocolo | Cliente |
|---------|-----------|---------|
| Login, registro, OTP, refresh, logout, profile | REST `/api/auth/*` | `restRequest` + `features/auth/api/auth.api.ts` |
| Hábitos, actividades, cursos | GraphQL `/graphql` | `graphqlRequest` |

**Regla:** no usar REST legacy (`/api/habit`, `/api/activity`, `/api/course`) en código nuevo. Esos dominios viven solo en GraphQL.

## Cliente REST (`restRequest`)

```ts
import { restRequest } from '@/shared/api/rest-client'
import { env } from '@/app/config/env'

const profile = await restRequest<ProfileResponseData>({
  baseUrl: env.authBaseUrl,
  method: 'GET',
  path: '/profile',
  accessToken: token,
})
```

- Respuestas envueltas en `ApiSuccess<T>` / `ApiErrorResponse`.
- `restRequest` devuelve solo `data` en éxito.
- Errores: `ApiClientError`, `ApiNetworkError`, `ApiTimeoutError`.

Auth encapsulado en `features/auth/api/auth.api.ts` (`login`, `register`, `refresh`, etc.).

## Cliente GraphQL (`graphqlRequest`)

```ts
import { graphqlRequest } from '@/shared/api/graphql-client'

const data = await graphqlRequest<{ habits: Habit[] }>(
  `query Habits($page: Int) { habits(page: $page, limit: 20) { habits { id name } } }`,
  { page: 1 },
)
```

- Obtiene token con `getValidAccessToken()` (refresh automático si aplica).
- Header `Authorization: Bearer <accessToken>`.
- Devuelve solo `json.data`.
- Errores: `AuthRequiredError`, `ValidationError` (`BAD_USER_INPUT`), `GraphQLClientError`.

## Refresh token

Implementado en `features/auth/services/token.service.ts`:

1. Margen: **60 s** antes de `accessExpiresAt` (`REFRESH_MARGIN_MS`).
2. `shouldRefreshToken(accessExpiresAt)` decide si refrescar.
3. `getValidAccessToken()` devuelve el access actual o llama a refresh.
4. `POST /api/auth/refresh` con `{ refreshToken }`.
5. El backend **rota** el refresh token: guardar siempre el nuevo en Zustand (`updateAccessToken`).
6. Refresh concurrente deduplicado con una promesa compartida.
7. Si refresh falla → `clearSession()`.

Sesión en `features/auth/store/auth.store.ts` (Zustand + persist): `accessToken`, `accessExpiresAt`, `refreshToken`, `user`.

## Errores tipados

Ver `src/shared/api/api-error.ts`:

| Clase | Uso |
|-------|-----|
| `ApiClientError` | REST `status: false` o HTTP error |
| `ApiNetworkError` | Fallo de red |
| `ApiTimeoutError` | Abort por timeout |
| `AuthRequiredError` | Sin token o GraphQL no autenticado |
| `ValidationError` | GraphQL `BAD_USER_INPUT` |
| `GraphQLClientError` | Otros errores GraphQL |

React Query (`query-client.ts`) no reintenta `AuthRequiredError`, `ValidationError` ni `ApiClientError` con `isAuthError`.

## Query keys

Factory en `src/shared/api/query-keys.ts`:

- `authKeys.profile()`
- `habitKeys.list(filters)`, `habitKeys.detail(id)`, `habitKeys.myDay(date)`
- `activityKeys.*`, `courseKeys.*`

Usar en hooks de fases siguientes; invalidar tras mutations según dominio.

## Futuros hooks con React Query

```ts
import { useQuery } from '@tanstack/react-query'
import { authKeys } from '@/shared/api/query-keys'
import { getProfile } from '@/features/auth/api/auth.api'
import { getValidAccessToken } from '@/features/auth/services/token.service'

export function useProfileQuery() {
  return useQuery({
    queryKey: authKeys.profile(),
    queryFn: async () => {
      const token = await getValidAccessToken()
      if (!token) throw new AuthRequiredError()
      return getProfile(token)
    },
  })
}
```

Para GraphQL, el `queryFn` / `mutationFn` llama a `graphqlRequest` con la query string. Invalidar keys relacionadas tras mutaciones (p. ej. `habitFollowUpAdd` → `habitKeys.myDay`, `habitKeys.detail`).

## Referencias

- Especificación completa: `implementation.md` (raíz del monorepo / proyecto padre).
- Convenciones: `docs/project-conventions.md`.
