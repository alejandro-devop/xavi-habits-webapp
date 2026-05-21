import { useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router'
import { AuthForm } from '@/features/auth/components/AuthForm/AuthForm'
import { FormField } from '@/features/auth/components/FormField/FormField'
import { useLoginMutation } from '@/features/auth/hooks/useLoginMutation'
import { authPaths } from '@/features/auth/router/auth-paths'
import { getAuthErrorMessage } from '@/features/auth/utils/auth.errors'
import { validateEmail } from '@/features/auth/utils/field.validation'
import styles from './LoginForm.module.scss'

type LoginLocationState = {
  message?: string
}

export function LoginForm() {
  const location = useLocation()
  const locationState = (location.state as LoginLocationState | null) ?? {}
  const loginMutation = useLoginMutation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>({})

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const errors: Record<string, string | null> = {
      email: validateEmail(email),
      password: password ? null : 'La contraseña es obligatoria.',
    }

    setFieldErrors(errors)

    if (Object.values(errors).some(Boolean)) {
      return
    }

    loginMutation.mutate(
      { email: email.trim(), password },
      {
        onError: (error) => {
          setFieldErrors({ form: getAuthErrorMessage(error, 'Credenciales no válidas.') })
        },
      },
    )
  }

  const apiError = loginMutation.isError
    ? getAuthErrorMessage(loginMutation.error, 'Credenciales no válidas.')
    : null

  return (
    <AuthForm
      title="Iniciar sesión"
      subtitle="Accede a tu cuenta de Xavi"
      error={fieldErrors.form ?? apiError}
      success={locationState.message ?? null}
      footer={
        <p>
          ¿No tienes cuenta?{' '}
          <Link className={styles.link} to={authPaths.register}>
            Regístrate
          </Link>
        </p>
      }
    >
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <FormField
          id="login-email"
          label="Correo electrónico"
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loginMutation.isPending}
          error={fieldErrors.email}
          required
        />
        <FormField
          id="login-password"
          label="Contraseña"
          type="password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loginMutation.isPending}
          error={fieldErrors.password}
          required
        />
        <p className={styles.forgot}>
          <Link className={styles.link} to={authPaths.forgotPassword}>
            ¿Olvidaste tu contraseña?
          </Link>
        </p>
        <button className={styles.submit} type="submit" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </AuthForm>
  )
}
