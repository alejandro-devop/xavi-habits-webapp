import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { Markdown } from '@tiptap/markdown'
import StarterKit from '@tiptap/starter-kit'
import { EditorContent, useEditor } from '@tiptap/react'
import { useEffect, useId } from 'react'
import { MarkdownEditorToolbar } from '@/shared/ui/MarkdownEditor/MarkdownEditorToolbar'
import styles from './MarkdownEditor.module.scss'

export type MarkdownEditorVariant = 'default' | 'notebook'

type MarkdownEditorProps = {
  value: string
  onChange: (value: string) => void
  onSave?: (value: string) => void
  savedValue?: string
  saveDebounceMs?: number
  maxLength?: number
  placeholder?: string
  variant?: MarkdownEditorVariant
  disabled?: boolean
  id?: string
  'aria-label'?: string
}

export function MarkdownEditor({
  value,
  onChange,
  onSave,
  savedValue = '',
  saveDebounceMs = 1000,
  maxLength,
  placeholder = 'Escribe aquí… Usa # para títulos, **negrita**, listas con -',
  variant = 'default',
  disabled = false,
  id: idProp,
  'aria-label': ariaLabel = 'Editor de descripción',
}: MarkdownEditorProps) {
  const generatedId = useId()
  const id = idProp ?? generatedId

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
      }),
      Placeholder.configure({ placeholder }),
      Markdown,
    ],
    content: value,
    contentType: 'markdown',
    editable: !disabled,
    immediatelyRender: false,
    onUpdate: ({ editor: currentEditor }) => {
      const markdown = currentEditor.getMarkdown()
      if (maxLength && markdown.length > maxLength) {
        currentEditor.commands.undo()
        return
      }
      onChange(markdown)
    },
    editorProps: {
      attributes: {
        id,
        class: styles.editorSurface,
        'aria-label': ariaLabel,
      },
    },
  })

  useEffect(() => {
    if (!editor) return
    editor.setEditable(!disabled)
  }, [disabled, editor])

  useEffect(() => {
    if (!onSave) return
    if (value === savedValue) return

    const timer = window.setTimeout(() => {
      onSave(value)
    }, saveDebounceMs)

    return () => window.clearTimeout(timer)
  }, [value, savedValue, saveDebounceMs, onSave])

  const showCount = Boolean(maxLength)
  const isSaving = value !== savedValue

  return (
    <div
      className={[styles.root, variant === 'notebook' ? styles.notebook : ''].filter(Boolean).join(' ')}
    >
      <MarkdownEditorToolbar editor={editor} disabled={disabled} />

      <div className={styles.editorWrap}>
        <EditorContent editor={editor} className={styles.editorContent} />
      </div>

      <div className={styles.footer}>
        <span className={styles.status} aria-live="polite">
          {isSaving ? 'Guardando…' : value.trim() ? 'Guardado' : ''}
        </span>
        {showCount ? (
          <span className={styles.count}>
            {value.length}/{maxLength}
          </span>
        ) : null}
      </div>
    </div>
  )
}
