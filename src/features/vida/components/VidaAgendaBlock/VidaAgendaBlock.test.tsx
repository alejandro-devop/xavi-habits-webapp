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

/**
 * **Empezar desde la hora planeada, en un toque** (FEAT-013, tajada 3,
 * criterios 350 a 354).
 *
 * La puerta es **la hora de la canaleta**, que ya estaba pintada. Lo que estos
 * tests sujetan, y es lo delicado de la tajada: que el «▶ Empezar» **siga
 * costando un toque** y siga sin mandar hora (criterio 351). El test de
 * `VidaHoyPage` que compara el array entero de argumentos es el otro guardián y
 * **no se toca**.
 */
describe('VidaAgendaBlock — empezar desde la hora planeada (FEAT-013, criterios 350 a 354)', () => {
  const PLANNED_LABEL = 'Empezar «Trabajar» desde las 9:00, lo que tenías planeado'

  it('criterio 350 — la hora planeada que ya pasó arranca la sesión desde ella, en un toque', async () => {
    const user = userEvent.setup()
    const onStartAtPlanned = vi.fn()
    // 9:12: el bloque de las 9:00 se pasó doce minutos.
    renderBlock({ nowMinutes: 9 * 60 + 12, onStart: vi.fn(), onStartAtPlanned })

    const shortcut = screen.getByRole('button', { name: PLANNED_LABEL })
    // Lo que se lee sigue siendo la hora del plan: no se estrena ningún texto.
    expect(shortcut).toHaveTextContent('9:00')
    await user.click(shortcut)

    expect(onStartAtPlanned).toHaveBeenCalledTimes(1)
    expect(onStartAtPlanned.mock.calls[0][1]).toBe('09:00')
  })

  it('lleva el ▸ dentro del mismo botón, y es decorativo (hallazgo 2 del revisor)', () => {
    renderBlock({ nowMinutes: 9 * 60 + 12, onStart: vi.fn(), onStartAtPlanned: vi.fn() })

    const shortcut = screen.getByRole('button', { name: PLANNED_LABEL })
    // Se ve la marca…
    expect(shortcut.textContent).toContain('▸')
    expect(shortcut.querySelector('[aria-hidden="true"]')?.textContent).toBe('▸')
    // …y **no se oye**: el nombre accesible es el de siempre, sin el glifo.
    expect(shortcut).toHaveAccessibleName(PLANNED_LABEL)
    // La hora sigue siendo un `<time>` de verdad, con su `datetime`.
    expect(shortcut.querySelector('time')).toHaveAttribute('datetime', '09:00')
  })

  it('criterio 351 — el ▶ sigue siendo un toque y **no manda hora**', async () => {
    const user = userEvent.setup()
    const onStart = vi.fn()
    const onStartAtPlanned = vi.fn()
    renderBlock({ nowMinutes: 9 * 60 + 12, onStart, onStartAtPlanned })

    await user.click(screen.getByRole('button', { name: '▶ Empezar' }))

    // Un toque, la ruta de siempre, y el atajo **ni se roza**: no es un paso
    // intermedio de nada.
    expect(onStart).toHaveBeenCalledTimes(1)
    expect(onStart.mock.calls[0]).toEqual([BLOCK])
    expect(onStartAtPlanned).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('criterio 353 — con la hora planeada todavía por venir el atajo no existe', () => {
    renderBlock({ nowMinutes: 8 * 60 + 40, onStart: vi.fn(), onStartAtPlanned: vi.fn() })

    expect(screen.queryByRole('button', { name: PLANNED_LABEL })).not.toBeInTheDocument()
    // Y la hora sigue ahí, como el texto de siempre.
    expect(screen.getByText('9:00').tagName).toBe('TIME')
    expect(screen.getByRole('button', { name: '▶ Empezar' })).toBeInTheDocument()
  })

  it('criterio 353 — en un día sin reloj (`nowMinutes` nulo) tampoco', () => {
    renderBlock({ nowMinutes: null, onStart: vi.fn(), onStartAtPlanned: vi.fn() })

    expect(screen.queryByRole('button', { name: PLANNED_LABEL })).not.toBeInTheDocument()
  })

  it('criterio 354 — pasada la ventana de 60 min ya no se ofrece', () => {
    // 10:01: 61 minutos tarde. Un bloque de hace cuatro horas no ofrece
    // registrar cuatro horas de trabajo en un toque.
    renderBlock({ nowMinutes: 10 * 60 + 1, onStart: vi.fn(), onStartAtPlanned: vi.fn() })
    expect(screen.queryByRole('button', { name: PLANNED_LABEL })).not.toBeInTheDocument()
  })

  it('criterio 354 — justo en el borde (60 min) todavía se ofrece', () => {
    renderBlock({ nowMinutes: 10 * 60, onStart: vi.fn(), onStartAtPlanned: vi.fn() })
    expect(screen.getByRole('button', { name: PLANNED_LABEL })).toBeInTheDocument()
  })

  it('donde no hay «▶ Empezar» no hay atajo: no se empieza lo que ya tiene sesión', () => {
    renderBlock({ nowMinutes: 9 * 60 + 12, isRunning: true, onStartAtPlanned: vi.fn() })

    expect(screen.queryByRole('button', { name: PLANNED_LABEL })).not.toBeInTheDocument()
  })

  it('sin la prop, la canaleta es el `<time>` de siempre', () => {
    renderBlock({ nowMinutes: 9 * 60 + 12, onStart: vi.fn() })

    expect(screen.getByText('9:00').tagName).toBe('TIME')
    expect(screen.getByText('9:00').closest('button')).toBeNull()
  })

  it('con una mutación en vuelo el atajo se inhabilita, igual que el ▶ (criterio 13)', () => {
    renderBlock({
      nowMinutes: 9 * 60 + 12,
      onStart: vi.fn(),
      onStartAtPlanned: vi.fn(),
      isSessionBusy: true,
    })

    expect(screen.getByRole('button', { name: PLANNED_LABEL })).toBeDisabled()
    expect(screen.getByRole('button', { name: '▶ Empezar' })).toBeDisabled()
  })
})
