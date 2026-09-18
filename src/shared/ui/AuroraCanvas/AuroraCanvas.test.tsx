import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AuroraCanvas } from '@/shared/ui/AuroraCanvas/AuroraCanvas'

describe('AuroraCanvas', () => {
  it('renders three decorative orbs hidden from assistive technology', () => {
    const { container } = render(<AuroraCanvas />)

    const canvas = container.querySelector('[aria-hidden="true"]')
    expect(canvas).toBeInTheDocument()
    expect(canvas?.children).toHaveLength(3)
  })

  it('exposes no accessible content', () => {
    const { container } = render(<AuroraCanvas />)

    expect(container.textContent).toBe('')
  })
})
