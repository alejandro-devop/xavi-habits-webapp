import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AppIcon } from '@/shared/ui/AppIcon'

describe('AppIcon', () => {
  it('renders icon by stored name', () => {
    const { container } = render(<AppIcon name="bell" decorative />)
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('renders fallback when icon does not exist', () => {
    const { container } = render(<AppIcon name="not-a-real-icon" decorative />)
    expect(container.querySelector('svg')).toBeFalsy()
    expect(container.querySelector('[class*="fallback"]')).toBeTruthy()
  })

  it('applies color style', () => {
    const { container } = render(
      <AppIcon name="bell" decorative color="var(--color-primary)" />,
    )
    const root = container.firstElementChild as HTMLElement
    expect(root.style.color).toBe('var(--color-primary)')
  })

  it('supports 2xl size class', () => {
    const { container } = render(<AppIcon name="bell" size="2xl" decorative />)
    expect(container.firstElementChild?.className).toMatch(/size2xl/)
  })
})
