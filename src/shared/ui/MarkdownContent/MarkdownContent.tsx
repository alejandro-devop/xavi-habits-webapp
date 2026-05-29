import ReactMarkdown, { type Components } from 'react-markdown'
import styles from './MarkdownContent.module.scss'

type MarkdownContentProps = {
  content: string
  variant?: 'default' | 'notebook'
  className?: string
  emptyFallback?: string
}

const components: Components = {
  // v1: no image support
  img: () => null,
  // Block raw HTML nodes if present in source
  html: () => null,
}

export function MarkdownContent({
  content,
  variant = 'default',
  className,
  emptyFallback = 'Sin contenido',
}: MarkdownContentProps) {
  const trimmed = content.trim()

  if (!trimmed) {
    return (
      <p className={[styles.empty, variant === 'notebook' ? styles.notebook : '', className]
        .filter(Boolean)
        .join(' ')}>
        {emptyFallback}
      </p>
    )
  }

  return (
    <div
      className={[styles.root, variant === 'notebook' ? styles.notebook : '', className]
        .filter(Boolean)
        .join(' ')}
    >
      <ReactMarkdown components={components}>{content}</ReactMarkdown>
    </div>
  )
}
