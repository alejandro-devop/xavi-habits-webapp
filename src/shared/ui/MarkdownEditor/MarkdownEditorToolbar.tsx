import type { Editor } from '@tiptap/react'
import styles from './MarkdownEditor.module.scss'

type ToolbarAction = {
  id: string
  label: string
  title: string
  isActive?: (editor: Editor) => boolean
  run: (editor: Editor) => void
}

const TOOLBAR_ACTIONS: ToolbarAction[] = [
  {
    id: 'bold',
    label: 'B',
    title: 'Negrita',
    isActive: (editor) => editor.isActive('bold'),
    run: (editor) => editor.chain().focus().toggleBold().run(),
  },
  {
    id: 'italic',
    label: 'I',
    title: 'Cursiva',
    isActive: (editor) => editor.isActive('italic'),
    run: (editor) => editor.chain().focus().toggleItalic().run(),
  },
  {
    id: 'h2',
    label: 'H',
    title: 'Encabezado',
    isActive: (editor) => editor.isActive('heading', { level: 2 }),
    run: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    id: 'ul',
    label: '•',
    title: 'Lista',
    isActive: (editor) => editor.isActive('bulletList'),
    run: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    id: 'ol',
    label: '1.',
    title: 'Lista numerada',
    isActive: (editor) => editor.isActive('orderedList'),
    run: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    id: 'quote',
    label: '❝',
    title: 'Cita',
    isActive: (editor) => editor.isActive('blockquote'),
    run: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    id: 'code',
    label: '</>',
    title: 'Código inline',
    isActive: (editor) => editor.isActive('code'),
    run: (editor) => editor.chain().focus().toggleCode().run(),
  },
  {
    id: 'link',
    label: '🔗',
    title: 'Enlace',
    isActive: (editor) => editor.isActive('link'),
    run: (editor) => {
      const previous = editor.getAttributes('link').href as string | undefined
      const href = window.prompt('URL del enlace', previous ?? 'https://')
      if (href === null) return
      if (href === '') {
        editor.chain().focus().extendMarkRange('link').unsetLink().run()
        return
      }
      editor.chain().focus().extendMarkRange('link').setLink({ href }).run()
    },
  },
]

type Props = {
  editor: Editor | null
  disabled?: boolean
}

export function MarkdownEditorToolbar({ editor, disabled = false }: Props) {
  if (!editor) return null

  return (
    <div className={styles.toolbar} role="toolbar" aria-label="Formato">
      {TOOLBAR_ACTIONS.map((action) => {
        const active = action.isActive?.(editor) ?? false
        return (
          <button
            key={action.id}
            type="button"
            className={[styles.toolbarBtn, active ? styles.toolbarBtnActive : ''].filter(Boolean).join(' ')}
            title={action.title}
            aria-label={action.title}
            aria-pressed={active}
            disabled={disabled}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => action.run(editor)}
          >
            {action.label}
          </button>
        )
      })}
    </div>
  )
}
