import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Grid } from '@/shared/layout/Grid/Grid'
import { GridItem } from '@/shared/layout/GridItem/GridItem'

describe('Grid', () => {
  it('renders grid items with content', () => {
    render(
      <Grid columns={12} data-testid="grid">
        <GridItem span={12} md={6}>
          <span>Celda A</span>
        </GridItem>
        <GridItem span={12} md={6}>
          <span>Celda B</span>
        </GridItem>
      </Grid>,
    )

    expect(screen.getByTestId('grid')).toBeInTheDocument()
    expect(screen.getByText('Celda A')).toBeInTheDocument()
    expect(screen.getByText('Celda B')).toBeInTheDocument()
  })
})
