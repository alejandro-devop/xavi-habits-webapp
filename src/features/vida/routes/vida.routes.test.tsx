import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { vidaPaths } from '@/features/vida/routes/vida-paths'
import { vidaRoutes } from '@/features/vida/routes/vida.routes'

/**
 * Actividades dejó de ser un cascarón (F1): consulta el API a través de
 * `useVidaQueryGuard`, que a su vez lee el contexto de sesión. Aquí solo se
 * comprueba el **enrutado**, así que el guard se deja en `false` —la pantalla
 * pinta entonces su estado «sin sesión», que sigue teniendo su título— y las
 * consultas viven en un `QueryClient` propio del test.
 */
vi.mock('@/features/vida/hooks/useVidaQueryGuard', () => ({
  useVidaQueryGuard: () => false,
}))

function renderAt(initialEntry: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createMemoryRouter([{ path: '/app', children: [vidaRoutes] }], {
    initialEntries: [initialEntry],
  })
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return router
}

describe('vidaRoutes', () => {
  it.each([
    [vidaPaths.hoy, 'Hoy'],
    [vidaPaths.plantilla, 'Plantilla'],
    [vidaPaths.revision, 'Revisión'],
    [vidaPaths.actividades, 'Actividades'],
  ])('%s renderiza el título «%s»', (path, title) => {
    renderAt(path)
    expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument()
  })

  it('el índice de /app/vida aterriza en /app/vida/hoy', () => {
    const router = renderAt(vidaPaths.root)

    expect(router.state.location.pathname).toBe(vidaPaths.hoy)
    expect(screen.getByRole('heading', { level: 1, name: 'Hoy' })).toBeInTheDocument()
  })

  it.each([vidaPaths.plantilla, vidaPaths.hoy, vidaPaths.revision])(
    '%s sigue siendo un cascarón: nada más que el título',
    (path) => {
      renderAt(path)

      expect(screen.getAllByRole('heading')).toHaveLength(1)
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
      expect(screen.queryByRole('list')).not.toBeInTheDocument()
    },
  )
})
