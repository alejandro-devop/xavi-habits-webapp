import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { VidaSessionBar } from '@/features/vida/components/VidaSessionBar'
import type { ActivityFollowUp } from '@/features/vida/types/activity-followup.types'
import { renderWithProviders } from '@/test/render'

/**
 * La barra de la sesión en marcha. Aquí solo lo que estrena FEAT-013, tajada 2:
 * **la línea de la hora se puede tocar** —«desde las 9:00» abre «Empecé antes»
 * en un toque— mientras el «···» sigue siendo, sin cambiar nada, el botón de un
 * toque al cierre completo (criterio 349). Sin `onCorrectStart` la hora es el
 * mismo texto de siempre y la barra se pinta como antes de FEAT-013.
 */

const SESSION: ActivityFollowUp = {
  id: 'f1',
  activityId: 'a-trabajo',
  date: '2026-09-18',
  startTime: '09:00',
  durationMinutes: null,
  isOpen: true,
  endTime: null,
  endDate: null,
  endDateTime: null,
  notes: null,
  activity: { id: 'a-trabajo', title: 'Trabajar' },
}

function renderBar(overrides: Partial<Parameters<typeof VidaSessionBar>[0]> = {}) {
  const onFinish = vi.fn()
  const onOpenFinishModal = vi.fn()
  renderWithProviders(
    <VidaSessionBar
      session={SESSION}
      startInstant={new Date(2026, 8, 18, 9, 0, 0)}
      onFinish={onFinish}
      onOpenFinishModal={onOpenFinishModal}
      {...overrides}
    />,
  )
  return { onFinish, onOpenFinishModal }
}

describe('VidaSessionBar — la hora es la puerta de «Empecé antes» (FEAT-013, criterios 342 y 349)', () => {
  it('criterio 342 — **un toque** en «desde las 9:00» corrige la hora', async () => {
    const user = userEvent.setup()
    const onCorrectStart = vi.fn()
    renderBar({ onCorrectStart })

    await user.click(
      screen.getByRole('button', {
        name: 'desde las 9:00 — corregir a qué hora empezaste «Trabajar»',
      }),
    )

    expect(onCorrectStart).toHaveBeenCalledTimes(1)
  })

  it('criterio 349 — el «···» **no cambia**: sigue siendo un toque al cierre completo', async () => {
    const user = userEvent.setup()
    const { onOpenFinishModal, onFinish } = renderBar({ onCorrectStart: vi.fn() })

    await user.click(
      screen.getByRole('button', {
        name: 'Terminar «Trabajar» con duración, notas y subtareas',
      }),
    )
    expect(onOpenFinishModal).toHaveBeenCalledTimes(1)
    // Y «Terminar» a secas sigue costando lo que costaba.
    await user.click(screen.getByRole('button', { name: 'Terminar' }))
    expect(onFinish).toHaveBeenCalledTimes(1)
    // Ni menús ni entradas: el «···» abre el cierre completo, no una lista.
    expect(screen.queryByRole('button', { name: 'Terminar y añadir una nota' })).not.toBeInTheDocument()
  })

  it('criterio 7 — el nombre sigue llevando a Hoy, al día de la sesión', () => {
    renderBar({ onCorrectStart: vi.fn() })

    expect(screen.getByRole('link', { name: 'Trabajar' })).toHaveAttribute(
      'href',
      '/app/vida/hoy?d=2026-09-18',
    )
  })

  it('sin la puerta nueva, la hora es el texto de siempre y no se puede tocar', () => {
    renderBar()

    expect(screen.getByText('desde las 9:00')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /corregir a qué hora/ })).not.toBeInTheDocument()
  })

  it('pasado el plan, la línea dice lo que ya decía (criterio 9) y sigue corrigiendo la hora', async () => {
    const user = userEvent.setup()
    const onCorrectStart = vi.fn()
    renderBar({
      onCorrectStart,
      plannedMinutes: 1,
      startInstant: new Date(Date.now() - 52 * 60 * 1000),
    })

    const line = screen.getByRole('button', { name: /llevas 52 min · planeado 1/ })
    await user.click(line)
    expect(onCorrectStart).toHaveBeenCalledTimes(1)
  })
})
