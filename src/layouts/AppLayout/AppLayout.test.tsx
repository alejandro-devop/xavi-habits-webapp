import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { RouteObject } from 'react-router'
import { useRoutes } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { habitsPaths } from '@/features/habits'
import { vidaPaths } from '@/features/vida'
import { vidaRoutes } from '@/features/vida/routes/vida.routes'
import type * as SharedIcons from '@/shared/icons'
import { AppLayout } from '@/layouts/AppLayout/AppLayout'
import { renderWithProviders } from '@/test/render'

const logoutMutate = vi.fn()

vi.mock('@/features/auth/store/auth.store', () => ({
  useAuthStore: () => ({ email: 'alejandro@example.com' }),
}))

vi.mock('@/features/auth/hooks/useLogoutMutation', () => ({
  useLogoutMutation: () => ({ mutate: logoutMutate, isPending: false }),
}))

vi.mock('@/features/auth/components/SessionExpiredModal', () => ({
  SessionExpiredModal: () => null,
}))

vi.mock('@/shared/ui/ConnectionIndicator', () => ({
  ConnectionIndicator: () => null,
}))

vi.mock('@/shared/icons', async (importOriginal) => ({
  ...(await importOriginal<typeof SharedIcons>()),
  loadIconCatalog: vi.fn(() => Promise.resolve()),
}))

/**
 * Desde la tajada 2 de FEAT-003, `/app/vida/hoy` ya no es un título: cruza el
 * plan del día, la plantilla y los ajustes, y los tres llegan al contexto de
 * sesión por `useAuthBootstrap`, que este arnés no monta. Se deja el guard en
 * `false` y los ajustes en la consulta deshabilitada; la pantalla pinta
 * entonces su «sin sesión», que conserva el `<h1>` —lo único que mira este
 * test, que es de la barra y no de lo que hay debajo—.
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

/**
 * Las páginas de hábitos piden datos: aquí se sustituyen por cascarones. Lo
 * que se prueba es la barra, no lo que hay debajo. Las de Vida sí son las
 * reales.
 */
function stub(title: string) {
  return <h1>{title}</h1>
}

const testRoutes: RouteObject[] = [
  {
    path: '/app',
    element: <AppLayout />,
    children: [
      { path: 'habits/my-day', element: stub('Mi día') },
      { path: 'habits/list', element: stub('Mis hábitos') },
      { path: 'habits/archived', element: stub('Archivados') },
      { path: 'habits/categories', element: stub('Categorías') },
      vidaRoutes,
    ],
  },
]

function TestApp() {
  return useRoutes(testRoutes)
}

function renderApp(initialEntry: string = habitsPaths.myDay) {
  return renderWithProviders(<TestApp />, {
    routerProps: { initialEntries: [initialEntry] },
  })
}

function modulesNav() {
  return screen.getByRole('navigation', { name: 'Módulos' })
}

function sectionsNav() {
  return screen.getByRole('navigation', { name: 'Secciones' })
}

describe('AppLayout', () => {
  it('ofrece los dos módulos y marca el activo', () => {
    renderApp()

    const mods = modulesNav()
    expect(within(mods).getByRole('link', { name: 'Hábitos' })).toBeInTheDocument()
    expect(within(mods).getByRole('link', { name: 'Vida' })).toBeInTheDocument()
    expect(within(mods).getByRole('link', { name: 'Vida' })).toHaveAttribute(
      'href',
      vidaPaths.hoy,
    )
  })

  it('cambia a las secciones de Vida y vuelve a las de Hábitos', async () => {
    const user = userEvent.setup()
    renderApp()

    expect(
      within(sectionsNav()).getByRole('link', { name: 'Mi día' }),
    ).toBeInTheDocument()

    await user.click(within(modulesNav()).getByRole('link', { name: 'Vida' }))

    const vidaSections = within(sectionsNav())
      .getAllByRole('link')
      .map((link) => link.textContent)
    expect(vidaSections).toEqual(['Hoy', 'Plantilla', 'Revisión', 'Actividades'])
    expect(screen.getByRole('heading', { level: 1, name: 'Hoy' })).toBeInTheDocument()
    // Desde FEAT-003 Vida tiene su popover «Ajustes», con un solo destino.
    expect(screen.getByRole('button', { name: 'Ajustes de vida' })).toBeInTheDocument()

    await user.click(within(modulesNav()).getByRole('link', { name: 'Hábitos' }))

    const habitSections = within(sectionsNav())
      .getAllByRole('link')
      .map((link) => link.textContent)
    expect(habitSections).toEqual(['Mi día', 'Mis hábitos', 'Archivados'])
    expect(screen.getByRole('heading', { level: 1, name: 'Mi día' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Ajustes de hábitos' }),
    ).toBeInTheDocument()
  })

  it('el módulo activo se deduce de la URL, no del último clic', () => {
    renderApp(vidaPaths.plantilla)

    expect(
      within(sectionsNav()).getByRole('link', { name: 'Plantilla' }),
    ).toBeInTheDocument()
    // La **píldora** sigue diciendo «Plantilla» (`app-nav.config.ts` no se
    // toca); el **título** de la pantalla pasa a ser «Tu plantilla» desde la
    // tajada 1 de FEAT-005 (criterio 1). La afirmación es la misma: el módulo
    // sale de la URL.
    expect(
      screen.getByRole('heading', { level: 1, name: 'Tu plantilla' }),
    ).toBeInTheDocument()
  })

  it('la ficha de usuario y el tema siguen en la barra en cualquier módulo', async () => {
    const user = userEvent.setup()
    renderApp(vidaPaths.hoy)

    await user.click(screen.getByRole('button', { name: 'Tu cuenta' }))
    expect(screen.getByText('alejandro@example.com')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Ajustes de cuenta' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
    expect(logoutMutate).toHaveBeenCalled()

    expect(
      screen.getByRole('button', { name: 'Buscar o ir a una sección' }),
    ).toBeInTheDocument()
  })
})
