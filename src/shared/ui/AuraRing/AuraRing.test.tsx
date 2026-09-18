import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AuraRing } from '@/shared/ui/AuraRing'

describe('AuraRing', () => {
  it('es decorativo: no expone rol ni nombre accesible', () => {
    const { container } = render(<AuraRing />)
    const svg = container.querySelector('svg')

    expect(svg).not.toBeNull()
    expect(svg?.getAttribute('aria-hidden')).toBe('true')
  })

  it('respeta el tamaño pedido', () => {
    const { container } = render(<AuraRing size={26} />)
    const svg = container.querySelector('svg')

    expect(svg?.getAttribute('width')).toBe('26')
    expect(svg?.getAttribute('height')).toBe('26')
  })

  it('pinta el degradado con los tokens del ámbito Aura', () => {
    const { container } = render(<AuraRing />)
    const stops = container.querySelectorAll('stop')

    expect(stops).toHaveLength(2)
    expect(stops[0]?.getAttribute('stop-color')).toBe('var(--aura-ring-from)')
    expect(stops[1]?.getAttribute('stop-color')).toBe('var(--aura-ring-to)')
  })
})
