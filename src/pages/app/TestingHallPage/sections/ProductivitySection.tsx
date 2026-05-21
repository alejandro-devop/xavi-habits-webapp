import { useCommandPalette } from '@/shared/ui/CommandPalette'
import { Button } from '@/shared/ui/Button'
import { Section } from '@/shared/ui/Section'

export function ProductivitySection() {
  const { open } = useCommandPalette()

  return (
    <Section
      id="productivity"
      title="Productivity"
      description="Paleta de comandos estilo Spotlight"
    >
      <p>
        Pulsa <kbd>⌘</kbd> <kbd>K</kbd> (Mac) o <kbd>Ctrl</kbd> <kbd>K</kbd> (Windows/Linux) en
        cualquier página de la app.
      </p>
      <Button variant="secondary" onClick={open}>
        Abrir paleta de comandos
      </Button>
    </Section>
  )
}
