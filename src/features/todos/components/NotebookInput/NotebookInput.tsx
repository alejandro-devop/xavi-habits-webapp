import { forwardRef } from 'react'
import styles from './NotebookInput.module.scss'

type Props = {
  value: string
  onChange: (value: string) => void
  onAdd: (title: string) => void
  onClear: () => void
}

export const NotebookInput = forwardRef<HTMLInputElement, Props>(function NotebookInput(
  { value, onChange, onAdd, onClear },
  ref,
) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const title = value.trim()
      if (title) {
        onAdd(title)
      }
    }
    if (e.key === 'Escape') {
      onClear()
      ;(e.target as HTMLInputElement).blur()
    }
  }

  return (
    <div className={styles.row}>
      <span className={styles.bullet} aria-hidden="true" />
      <input
        ref={ref}
        className={styles.input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Nueva tarea…"
        aria-label="Nueva tarea"
      />
    </div>
  )
})
