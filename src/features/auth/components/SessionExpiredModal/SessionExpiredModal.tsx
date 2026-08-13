import { useState, type FormEvent } from 'react'
import { useLogoutMutation } from '@/features/auth/hooks/useLogoutMutation'
import { useReauthMutation } from '@/features/auth/hooks/useReauthMutation'
import { selectAuthUser } from '@/features/auth/store/auth.selectors'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { getAuthErrorMessage } from '@/features/auth/utils/auth.errors'
import { validateEmail } from '@/features/auth/utils/field.validation'
import { Button, FormField, Modal } from '@/shared/ui'
import styles from './SessionExpiredModal.module.scss'

/**
 * Cuando la sesión caduca no se expulsa al usuario: se le pide volver a entrar
 * por encima de la pantalla donde estaba. Al reingresar sigue justo donde lo
 * dejó, y lo que hubiera en pantalla nunca desapareció.
 */
export function SessionExpiredModal() {
  const sessionExpired = useAuthStore((s) => s.sessionExpired)

  // El diálogo se monta sólo al caducar, para que su estado (el correo
  // precargado incluido) arranque limpio cada vez y no quede congelado con el
  // valor que hubiera al montar el layout.
  if (!sessionExpired) return null

  return <SessionExpiredDialog />
}

function SessionExpiredDialog() {
  const user = useAuthStore(selectAuthUser)
  const reauthMutation = useReauthMutation()
  const logoutMutation = useLogoutMutation()

  const [email, setEmail] = useState(user?.email ?? '')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>({})

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const errors: Record<string, string | null> = {
      email: validateEmail(email),
      password: password ? null : 'La contraseña es obligatoria.',
    }
    setFieldErrors(errors)

    if (Object.values(errors).some(Boolean)) return

    reauthMutation.mutate(
      { email: email.trim(), password },
      { onSettled: () => setPassword('') },
    )
  }

  const apiError = reauthMutation.isError
    ? getAuthErrorMessage(reauthMutation.error, 'Credenciales no válidas.')
    : null

  const isBusy = reauthMutation.isPending || logoutMutation.isPending

  return (
    <Modal
      open
      // No se puede descartar: sin sesión, quedarse "detrás" del modal deja la
      // app sin poder cargar ni guardar nada.
      dismissible={false}
      onClose={() => {}}
      size="sm"
      title="Tu sesión expiró"
      description="Vuelve a entrar para continuar donde estabas. No se ha perdido nada de lo que tienes en pantalla."
    >
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {apiError ? (
          <p className={styles.error} role="alert">
            {apiError}
          </p>
        ) : null}

        <FormField
          id="session-expired-email"
          label="Correo electrónico"
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isBusy}
          error={fieldErrors.email}
          required
        />
        <FormField
          id="session-expired-password"
          label="Contraseña"
          type="password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isBusy}
          error={fieldErrors.password}
          required
        />

        <div className={styles.actions}>
          <Button type="submit" fullWidth isLoading={reauthMutation.isPending} disabled={isBusy}>
            Entrar
          </Button>
          <Button
            type="button"
            variant="ghost"
            fullWidth
            disabled={isBusy}
            onClick={() => logoutMutation.mutate()}
          >
            Cerrar sesión
          </Button>
        </div>
      </form>
    </Modal>
  )
}
