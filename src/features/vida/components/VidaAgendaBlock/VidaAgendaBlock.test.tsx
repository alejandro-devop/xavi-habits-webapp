import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { VidaAgendaBlock } from '@/features/vida/components/VidaAgendaBlock'
import type { AgendaBlock } from '@/features/vida/utils/vida-agenda.utils'
import { renderWithProviders } from '@/test/render'

/**
 * El bloque de la agenda. Aquí solo lo que estrena FEAT-013, tajada 2: la
 * entrada **«Empecé antes»** del «···» del bloque **en marcha** (criterio 342) y
 * que lo que ya había siga en su sitio (criterio 349).
 *
 * El resto del bloque lo cubre `VidaHoyPage.test.tsx`, que es donde se monta con
 * sus datos de verdad.
 */
vi.mock('@/features/auth/providers/useAuthBootstrap', () => ({
  useAuthBootstrap: () => ({ status: 'ready' }),
}))
vi.mock('@/features/auth/store/auth.store', () => ({
  useAuthStore: (selector: (s: { accessToken: string | null }) => unknown) =>
    selector({ accessToken: 'token' }),
}))
vi.mock('@/features/auth/store/auth.selectors', () => ({
  selectIsAuthenticated: (s: { accessToken: string | null }) => Boolean(s.accessToken),
}))

const BLOCK = {
  id: 'b1',
  kind: 'block',
  startMinutes: 9 * 60,
  durationMinutes: 45,
  item: {
    id: 'i1',
    activityId: 'a-trabajo',
    activity: { id: 'a-trabajo', title: 'Trabajar', category: null },
  },
} as unknown as AgendaBlock

function renderBlock(overrides: Partial<Parameters<typeof VidaAgendaBlock>[0]> = {}) {
  renderWithProviders(
    <ul>
      <VidaAgendaBlock block={BLOCK} nowMinutes={10 * 60 + 8} {...overrides} />
    </ul>,
  )
}

describe('VidaAgendaBlock — «Empecé antes» (FEAT-013, criterios 342 y 349)', () => {
  it('criterio 342 — el bloque **en marcha** ofrece corregir la hora', async () => {
    const user = userEvent.setup()
    const onCorrectStart = vi.fn()
    renderBlock({ isRunning: true, onCorrectStart })

    await user.click(screen.getByRole('button', { name: 'Más opciones de Trabajar' }))
    await user.click(screen.getByRole('button', { name: 'Empecé antes' }))

    expect(onCorrectStart).toHaveBeenCalledTimes(1)
  })

  it('criterio 349 — «Terminar y añadir una nota» no se mueve de su sitio', async () => {
    const user = userEvent.setup()
    const onOpenFinishModal = vi.fn()
    renderBlock({ isRunning: true, onCorrectStart: vi.fn(), onOpenFinishModal })

    await user.click(screen.getByRole('button', { name: 'Más opciones de Trabajar' }))
    const items = screen.getAllByRole('button').map((button) => button.textContent)
    expect(items).toContain('Terminar y añadir una nota')
    // Lo de siempre, primero; lo nuevo, detrás.
    expect(items.indexOf('Terminar y añadir una nota')).toBeLessThan(
      items.indexOf('Empecé antes'),
    )

    await user.click(screen.getByRole('button', { name: 'Terminar y añadir una nota' }))
    expect(onOpenFinishModal).toHaveBeenCalledTimes(1)
  })

  it('sin sesión en marcha no se ofrece: no hay nada que corregir', async () => {
    const user = userEvent.setup()
    renderBlock({ date: '2026-09-18', onCorrectStart: vi.fn() })

    await user.click(screen.getByRole('button', { name: 'Más opciones de Trabajar' }))

    expect(screen.queryByRole('button', { name: 'Empecé antes' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Quitar del plan' })).toBeInTheDocument()
  })
})
