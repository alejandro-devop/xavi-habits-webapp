import { forwardRef, useState } from 'react'
import styles from './NotebookInput.module.scss'

type Props = {
  onAdd: (title: string) => void
}

export const NotebookInput = forwardRef<HTMLInputElement, Props>(function NotebookInput(
  { onAdd },
  ref,
) {
  const [value, setValue] = useState('')

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const title = value.trim()
      if (title) {
        onAdd(title)
        setValue('')
      }
    }
    if (e.key === 'Escape') {
      setValue('')
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
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Nueva tarea…"
        aria-label="Nueva tarea"
      />
    </div>
  )
})
