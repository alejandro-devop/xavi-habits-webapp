import { useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router'
import { AuthForm } from '@/features/auth/components/AuthForm/AuthForm'
import { FormField } from '@/features/auth/components/FormField/FormField'
import { useLoginMutation } from '@/features/auth/hooks/useLoginMutation'
import { authPaths } from '@/features/auth/router/auth-paths'
import { getAuthErrorMessage } from '@/features/auth/utils/auth.errors'
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
  const [fieldError, setFieldError] = useState<string | null>(null)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFieldError(null)

    if (!email.trim() || !password) {
      setFieldError('Introduce tu correo y contraseña.')
      return
    }

    loginMutation.mutate(
      { email: email.trim(), password },
      {
        onError: (error) => {
          setFieldError(getAuthErrorMessage(error, 'Credenciales no válidas.'))
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
      error={fieldError ?? apiError}
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
