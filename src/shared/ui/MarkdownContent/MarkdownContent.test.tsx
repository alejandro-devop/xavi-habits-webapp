import { render, screen } from '@testing-library/react'
import { MarkdownContent } from '@/shared/ui/MarkdownContent'

describe('MarkdownContent', () => {
  it('renders markdown headings and emphasis', () => {
    render(
      <MarkdownContent
        content={`## Título

**negrita**`}
      />,
    )
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Título')
    expect(screen.getByText('negrita').tagName).toBe('STRONG')
  })

  it('does not render script tags from malicious markdown', () => {
    const { container } = render(
      <MarkdownContent content={'# Safe\n\n<script>alert("xss")</script>'} />,
    )
    expect(container.querySelector('script')).toBeNull()
  })

  it('does not render images in v1', () => {
    const { container } = render(<MarkdownContent content="![alt](https://example.com/x.png)" />)
    expect(container.querySelector('img')).toBeNull()
  })
})
