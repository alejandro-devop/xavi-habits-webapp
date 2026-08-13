import { QueryClient, QueryClientProvider, onlineManager } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { ConnectionIndicator } from '@/shared/ui/ConnectionIndicator'

function renderIndicator() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return render(<ConnectionIndicator />, { wrapper })
}

afterEach(() => {
  onlineManager.setOnline(true)
})

describe('ConnectionIndicator', () => {
  it('no renderiza nada cuando la conexión está bien', () => {
    const { container } = renderIndicator()
    expect(container).toBeEmptyDOMElement()
  })

  it('anuncia el estado sin conexión de forma accesible', () => {
    onlineManager.setOnline(false)
    renderIndicator()

    const status = screen.getByRole('status')
    expect(status).toHaveTextContent('Sin conexión')
    expect(status).toHaveAttribute('aria-live', 'polite')
    // La etiqueta visible se acorta en móvil, así que la explicación completa
    // tiene que estar disponible para lectores de pantalla.
    expect(status).toHaveTextContent(/datos guardados en este dispositivo/i)
  })
})
