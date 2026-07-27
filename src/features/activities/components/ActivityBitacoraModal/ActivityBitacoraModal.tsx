import { useCallback, useEffect, useState } from 'react'
import { ACTIVITY_BITACORA_MAX_LENGTH } from '@/shared/constants/text-limits'
import { Button } from '@/shared/ui/Button'
import { MarkdownContent } from '@/shared/ui/MarkdownContent'
import { MarkdownEditor } from '@/shared/ui/MarkdownEditor'
import { Modal } from '@/shared/ui/Modal'
import styles from './ActivityBitacoraModal.module.scss'

export type ActivityBitacoraMode = 'view' | 'edit'

type ActivityBitacoraModalProps = {
  open: boolean
  followUpId: string
  activityTitle: string
  notes: string | null
  initialMode?: ActivityBitacoraMode
  onClose: () => void
  onSave: (notes: string | null, onSuccess?: () => void) => void
}

export function ActivityBitacoraModal({
  open,
  followUpId,
  activityTitle,
  notes,
  initialMode = 'view',
  onClose,
  onSave,
}: ActivityBitacoraModalProps) {
  const [mode, setMode] = useState<ActivityBitacoraMode>(initialMode)
  const [draft, setDraft] = useState(notes ?? '')
  const [savedDraft, setSavedDraft] = useState(notes ?? '')

  useEffect(() => {
    if (!open) return
    setMode(initialMode)
    setDraft(notes ?? '')
    setSavedDraft(notes ?? '')
    // Reset only when opening or switching ejecución
    // eslint-disable-next-line react-hooks/exhaustive-deps -- avoid wiping draft on save refetch
  }, [open, followUpId, initialMode])

  const handleSave = useCallback(
    (nextValue: string) => {
      const normalized = nextValue.trim() ? nextValue : null
      const current = notes ?? null
      if (normalized === current) {
        setSavedDraft(nextValue)
        return
      }
      onSave(normalized, () => setSavedDraft(nextValue))
    },
    [notes, onSave],
  )

  const hasContent = Boolean((notes ?? '').trim() || draft.trim())

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Bitácora"
      description={
        mode === 'edit'
          ? 'Escribe en markdown: listas, negrita, títulos…'
          : (notes ?? '').trim()
            ? 'Registro de la ejecución.'
            : 'Aún no hay bitácora para esta ejecución.'
      }
      size="lg"
      footer={
        <div className={styles.footerBar}>
          {mode === 'view' ? (
            <>
              <Button variant="ghost" onClick={onClose}>
                Cerrar
              </Button>
              <Button variant="primary" onClick={() => setMode('edit')}>
                Editar
              </Button>
            </>
          ) : (
            <>
              {hasContent ? (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setDraft(notes ?? '')
                    setSavedDraft(notes ?? '')
                    setMode('view')
                  }}
                >
                  Ver
                </Button>
              ) : null}
              <Button variant="primary" onClick={onClose}>
                Listo
              </Button>
            </>
          )}
        </div>
      }
    >
      <div className={styles.content}>
        <p className={styles.activityTitle}>{activityTitle}</p>

        {mode === 'edit' ? (
          <MarkdownEditor
            key={`bitacora-${followUpId}`}
            value={draft}
            onChange={setDraft}
            onSave={handleSave}
            savedValue={savedDraft}
            saveDebounceMs={1000}
            maxLength={ACTIVITY_BITACORA_MAX_LENGTH}
            placeholder="Añade la bitácora… (# título, **negrita**, - lista)"
            variant="notebook"
            aria-label="Bitácora de la actividad"
          />
        ) : (
          <MarkdownContent
            content={notes ?? ''}
            variant="notebook"
            emptyFallback="Sin bitácora todavía. Pulsa Editar para escribirla."
          />
        )}
      </div>
    </Modal>
  )
}
