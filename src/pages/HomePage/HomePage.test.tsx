import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { describe, expect, it } from 'vitest'
import { HomePage } from './HomePage'

function renderWithProviders(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  )
}

describe('HomePage', () => {
  it('renders the app title', () => {
    renderWithProviders(<HomePage />)
    expect(screen.getByRole('heading', { name: /xavi habits/i })).toBeInTheDocument()
  })

  it('increments zustand count on button click', async () => {
    const user = userEvent.setup()
    renderWithProviders(<HomePage />)

    const incrementButton = screen.getByRole('button', { name: /incrementar/i })
    await user.click(incrementButton)

    expect(screen.getByText(/zustand \(persist\): 1/i)).toBeInTheDocument()
  })
})
