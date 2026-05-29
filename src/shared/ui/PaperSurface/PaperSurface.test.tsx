import { render, screen } from '@testing-library/react'
import { PaperSurface } from '@/shared/ui/PaperSurface'
import { PaperRow } from '@/shared/ui/PaperRow'

describe('PaperSurface', () => {
  it('renders children and optional margin line', () => {
    render(
      <PaperSurface minHeight="auto" data-testid="paper">
        <p>Contenido</p>
      </PaperSurface>,
    )

    expect(screen.getByText('Contenido')).toBeInTheDocument()
    expect(screen.getByTestId('paper')).toBeInTheDocument()
  })

  it('renders tabs slot when provided', () => {
    render(
      <PaperSurface tabs={<span>Carpeta A</span>} minHeight="auto">
        <p>Lista</p>
      </PaperSurface>,
    )

    expect(screen.getByText('Carpeta A')).toBeInTheDocument()
    expect(screen.getByText('Lista')).toBeInTheDocument()
  })
})

describe('PaperRow', () => {
  it('renders as li when requested', () => {
    render(
      <PaperRow as="li" interactive aria-label="Fila">
        Item
      </PaperRow>,
    )

    expect(screen.getByRole('listitem', { name: 'Fila' })).toHaveTextContent('Item')
  })
})
