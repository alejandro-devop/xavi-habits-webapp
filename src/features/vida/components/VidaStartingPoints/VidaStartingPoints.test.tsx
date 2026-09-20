import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { VidaStartingPoints } from '@/features/vida/components/VidaStartingPoints'
import type { VidaStartingPoint } from '@/features/vida/data/vida-starting-points'
import type { CreateStartingActivitiesResult } from '@/features/vida/hooks/useCreateStartingActivities'
import { renderWithProviders } from '@/test/render'

type MutateOptions = {
  onSuccess?: (result: CreateStartingActivitiesResult) => void
}

const mutate = vi.fn<(points: VidaStartingPoint[], options?: MutateOptions) => void>()
let isPending = false

vi.mock('@/features/vida/hooks/useCreateStartingActivities', () => ({
  useCreateStartingActivities: () => ({ mutate, isPending }),
}))

beforeEach(() => {
  mutate.mockReset()
  isPending = false
})

describe('VidaStartingPoints', () => {
  it('enseña las trece del render, con seis marcadas y el botón diciendo cuántas', () => {
    renderWithProviders(<VidaStartingPoints />)

    expect(screen.getAllByRole('button', { pressed: true })).toHaveLength(6)
    expect(screen.getAllByRole('button', { pressed: false })).toHaveLength(7)
    expect(screen.getByRole('button', { name: 'Crear las 6' })).toBeEnabled()
    expect(screen.getByText('6 elegidas · con su categoría puesta')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Bañarme/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Dormir la siesta/ })).toBeInTheDocument()
  })

  it('el botón cuenta lo marcado y crea exactamente eso', async () => {
    const user = userEvent.setup()
    renderWithProviders(<VidaStartingPoints />)

    await user.click(screen.getByRole('button', { name: /Descansar/ }))
    expect(screen.getByRole('button', { name: 'Crear las 7' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Crear las 7' }))

    expect(mutate).toHaveBeenCalledTimes(1)
    const points = mutate.mock.calls[0]![0]
    expect(points).toHaveLength(7)
    expect(points.map((point) => point.title)).toContain('Descansar')
    for (const point of points) {
      expect(point.categoryName).toBeTruthy()
    }
  })

  it('sin ninguna marcada el botón está deshabilitado y no crea nada', async () => {
    const user = userEvent.setup()
    renderWithProviders(<VidaStartingPoints />)

    for (const pressed of screen.getAllByRole('button', { pressed: true })) {
      await user.click(pressed)
    }

    const createButton = screen.getByRole('button', { name: 'Crear' })
    expect(createButton).toBeDisabled()
    await user.click(createButton)
    expect(mutate).not.toHaveBeenCalled()
  })

  it('mientras crea no admite un segundo toque', async () => {
    const user = userEvent.setup()
    isPending = true
    renderWithProviders(<VidaStartingPoints />)

    const createButton = screen.getByRole('button', { name: /Crear las 6/ })
    expect(createButton).toBeDisabled()
    await user.click(createButton)
    await user.click(createButton)
    expect(mutate).not.toHaveBeenCalled()
  })

  it('si algo falla a mitad lo nombra y deja marcado solo lo que no se creó', async () => {
    const user = userEvent.setup()
    mutate.mockImplementation((points, options) => {
      options?.onSuccess?.({
        created: points
          .filter((point) => point.title !== 'Cocinar')
          .map((point, index) => ({ id: `a${index}`, title: point.title }) as never),
        failed: [{ name: 'Cocinar', reason: 'El servidor no respondió' }],
      })
    })

    renderWithProviders(<VidaStartingPoints />)
    await user.click(screen.getByRole('button', { name: 'Crear las 6' }))

    await waitFor(() => {
      expect(screen.getByText('Algunas no se pudieron crear')).toBeInTheDocument()
    })
    expect(screen.getByText(/El servidor no respondió/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Cocinar/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: /Bañarme/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(screen.getByRole('button', { name: 'Crear la 1' })).toBeInTheDocument()
  })
})
