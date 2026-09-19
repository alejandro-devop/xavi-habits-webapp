import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import { vidaPaths } from '@/features/vida/routes/vida-paths'
import { vidaRoutes } from '@/features/vida/routes/vida.routes'

function renderAt(initialEntry: string) {
  const router = createMemoryRouter([{ path: '/app', children: [vidaRoutes] }], {
    initialEntries: [initialEntry],
  })
  render(<RouterProvider router={router} />)
  return router
}

describe('vidaRoutes', () => {
  it.each([
    [vidaPaths.hoy, 'Hoy'],
    [vidaPaths.plantilla, 'Plantilla'],
    [vidaPaths.revision, 'Revisión'],
    [vidaPaths.actividades, 'Actividades'],
  ])('%s renderiza solo el título «%s»', (path, title) => {
    renderAt(path)
    expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument()
  })

  it('el índice de /app/vida aterriza en /app/vida/hoy', () => {
    const router = renderAt(vidaPaths.root)

    expect(router.state.location.pathname).toBe(vidaPaths.hoy)
    expect(screen.getByRole('heading', { level: 1, name: 'Hoy' })).toBeInTheDocument()
  })

  it('las páginas de F0 no muestran nada más que el título', () => {
    renderAt(vidaPaths.plantilla)

    expect(screen.getAllByRole('heading')).toHaveLength(1)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })
})
