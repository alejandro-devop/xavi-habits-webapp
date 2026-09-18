import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'

type Listener = () => void

function mockMatchMedia(initialMatches: boolean) {
  const listeners = new Set<Listener>()
  let matches = initialMatches

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((media: string) => ({
      get matches() {
        return matches
      },
      media,
      addEventListener: (_event: string, listener: Listener) => listeners.add(listener),
      removeEventListener: (_event: string, listener: Listener) => listeners.delete(listener),
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
      onchange: null,
    })),
  })

  return {
    setMatches(next: boolean) {
      matches = next
      listeners.forEach((listener) => listener())
    },
    get listenerCount() {
      return listeners.size
    },
  }
}

function Probe() {
  const isMobile = useMediaQuery('(max-width: 767px)')
  return <span>{isMobile ? 'móvil' : 'escritorio'}</span>
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useMediaQuery', () => {
  it('lee el valor real en el primer render', () => {
    mockMatchMedia(true)
    render(<Probe />)
    expect(screen.getByText('móvil')).toBeInTheDocument()
  })

  it('reacciona a los cambios de la media query', () => {
    const media = mockMatchMedia(false)
    render(<Probe />)
    expect(screen.getByText('escritorio')).toBeInTheDocument()

    act(() => media.setMatches(true))
    expect(screen.getByText('móvil')).toBeInTheDocument()
  })

  it('se desuscribe al desmontar', () => {
    const media = mockMatchMedia(false)
    const { unmount } = render(<Probe />)
    expect(media.listenerCount).toBe(1)

    unmount()
    expect(media.listenerCount).toBe(0)
  })
})
