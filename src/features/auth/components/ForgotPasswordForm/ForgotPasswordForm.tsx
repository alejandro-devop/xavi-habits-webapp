import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { AuthForm } from '@/features/auth/components/AuthForm/AuthForm'
import { FormField } from '@/features/auth/components/FormField/FormField'
import { useForgotPasswordMutation } from '@/features/auth/hooks/useForgotPasswordMutation'
import {
  authPaths,
  FORGOT_PASSWORD_GENERIC_MESSAGE,
} from '@/features/auth/router/auth-paths'
import { getAuthErrorMessage } from '@/features/auth/utils/auth.errors'
import { validateEmail } from '@/features/auth/utils/field.validation'
import styles from './ForgotPasswordForm.module.scss'

export function ForgotPasswordForm() {
  const forgotMutation = useForgotPasswordMutation()
  const [email, setEmail] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFieldError(null)

    const emailError = validateEmail(email)
    if (emailError) {
      setFieldError(emailError)
      return
    }

    forgotMutation.mutate(
      { email: email.trim() },
      {
        onSuccess: () => setSubmitted(true),
        onError: () => setSubmitted(true),
      },
    )
  }

  if (submitted) {
    return (
      <AuthForm
        title="Revisa tu correo"
        success={FORGOT_PASSWORD_GENERIC_MESSAGE}
        footer={
          <p>
            <Link className={styles.link} to={authPaths.resetPassword} state={{ email }}>
              Tengo el código — restablecer contraseña
            </Link>
            <br />
            <Link className={styles.link} to={authPaths.login}>
              Volver al inicio de sesión
            </Link>
          </p>
        }
      >
        <p className={styles.doneHint}>
          Si no ves el correo, revisa la carpeta de spam o espera unos minutos antes de
          solicitar otro código desde el inicio de sesión.
        </p>
      </AuthForm>
    )
  }

  const apiError = forgotMutation.isError
    ? getAuthErrorMessage(forgotMutation.error)
    : null

  return (
    <AuthForm
      title="Recuperar contraseña"
      subtitle="Te enviaremos un código si existe una cuenta con este correo"
      error={fieldError ?? apiError}
      footer={
        <p>
          <Link className={styles.link} to={authPaths.login}>
            Volver al inicio de sesión
          </Link>
        </p>
      }
    >
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <FormField
          id="forgot-email"
          label="Correo electrónico"
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={forgotMutation.isPending}
          error={fieldError}
          required
        />
        <button className={styles.submit} type="submit" disabled={forgotMutation.isPending}>
          {forgotMutation.isPending ? 'Enviando…' : 'Enviar código'}
        </button>
      </form>
    </AuthForm>
  )
}
