import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AppIcon } from '@/shared/ui/AppIcon'

describe('AppIcon', () => {
  it('renders icon by stored name', () => {
    const { container } = render(<AppIcon name="bell" decorative />)
    expect(container.querySelector('svg')).toBeTruthy()
  })
})
