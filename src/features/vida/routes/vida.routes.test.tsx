import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { vidaPaths } from '@/features/vida/routes/vida-paths'
import { vidaRoutes } from '@/features/vida/routes/vida.routes'
import { ToastProvider } from '@/shared/ui/Toast'

/**
 * Actividades y sus dos pantallas hermanas —archivadas y categorías— dejaron de
 * ser cascarones (F1): consulta el API a través de
 * `useVidaQueryGuard`, que a su vez lee el contexto de sesión. Aquí solo se
 * comprueba el **enrutado**, así que el guard se deja en `false` —la pantalla
 * pinta entonces su estado «sin sesión», que sigue teniendo su título— y las
 * consultas viven en un `QueryClient` propio del test.
 *
 * El `ToastProvider` hace falta desde la tajada 4: archivadas y categorías
 * piden sus mutaciones en el cuerpo del componente —antes de cualquier
 * return— y esas mutaciones avisan con un toast cuando fallan. En la app lo
 * pone `AppProviders`; aquí se monta a mano.
 *
 * `useUserSettings` (FEAT-003) se mockea por lo mismo pero un escalón más
 * abajo: no pasa por `useVidaQueryGuard` sino por `useAuthBootstrap`, que aquí
 * no está montado. Se devuelve la consulta deshabilitada —`isPending` con
 * `fetchStatus: 'idle'`—, que es el «sin sesión» del resto de las pantallas.
 */
vi.mock('@/features/vida/hooks/useVidaQueryGuard', () => ({
  useVidaQueryGuard: () => false,
}))
vi.mock('@/features/settings/hooks/useUserSettings', () => ({
  useUserSettingsQuery: () => ({
    data: undefined,
    isPending: true,
    isError: false,
    fetchStatus: 'idle',
  }),
  useUpdateUserSettingsMutation: () => ({ mutate: vi.fn(), isPending: false, isError: false }),
}))

function renderAt(initialEntry: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createMemoryRouter([{ path: '/app', children: [vidaRoutes] }], {
    initialEntries: [initialEntry],
  })
  render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </QueryClientProvider>,
  )
  return router
}

describe('vidaRoutes', () => {
  it.each([
    [vidaPaths.hoy, 'Hoy'],
    [vidaPaths.plantilla, 'Tu plantilla'],
    [vidaPaths.revision, 'Revisión'],
    [vidaPaths.actividades, 'Actividades'],
    [vidaPaths.archivadas, 'Archivadas'],
    [vidaPaths.categorias, 'Categorías'],
    [vidaPaths.ajustes, 'Ajustes de Vida'],
  ])('%s renderiza el título «%s»', (path, title) => {
    renderAt(path)
    expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument()
  })

  it('el índice de /app/vida aterriza en /app/vida/hoy', () => {
    const router = renderAt(vidaPaths.root)

    expect(router.state.location.pathname).toBe(vidaPaths.hoy)
    expect(screen.getByRole('heading', { level: 1, name: 'Hoy' })).toBeInTheDocument()
  })

  /**
   * **Ya no queda ningún cascarón entre estas rutas.** `/app/vida/plantilla`
   * salió de la lista en la tajada 1 de FEAT-005 y **`/app/vida/revision` sale
   * ahora**, en la tajada 1 de FEAT-006 (criterio 1): con el guard en `false`
   * ya no pinta solo el título, pinta su estado «sin sesión».
   *
   * La afirmación de F0 queda **derogada y reemplazada por algo más fuerte**,
   * no borrada: en vez de «no hay nada», se afirma **qué** hay — la vía para
   * entrar—, que es lo que sostiene el criterio 23.
   */
  it('/app/vida/revision ya no es un cascarón: sin sesión enseña la vía para entrar', () => {
    renderAt(vidaPaths.revision)

    expect(screen.getByRole('heading', { level: 1, name: 'Revisión' })).toBeInTheDocument()
    expect(screen.getByText('Entra para ver cómo te fue')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toBeInTheDocument()
  })

  /**
   * `/app/vida/hoy` **dejó de ser un cascarón** en la tajada 2 de FEAT-003
   * (criterio 11). Esta afirmación era de F0 y esta tajada la deroga: con el
   * guard en `false` la pantalla pinta su estado «sin sesión», que es lo que
   * sostiene el criterio 51 —mensaje breve con la vía para entrar, y **no** un
   * esqueleto girando para siempre—.
   */
  it('/app/vida/plantilla ya no es un cascarón: sin sesión enseña la vía para entrar', () => {
    renderAt(vidaPaths.plantilla)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Tu plantilla' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Entra para ver tu plantilla')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toBeInTheDocument()
  })

  it('/app/vida/hoy ya no es un cascarón: sin sesión enseña la vía para entrar', () => {
    renderAt(vidaPaths.hoy)

    expect(screen.getByRole('heading', { level: 1, name: 'Hoy' })).toBeInTheDocument()
    expect(screen.getByText('Entra para ver tu día')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toBeInTheDocument()
  })
})
