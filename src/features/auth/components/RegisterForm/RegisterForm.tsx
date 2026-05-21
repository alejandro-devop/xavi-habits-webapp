import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { AuthForm } from '@/features/auth/components/AuthForm/AuthForm'
import { Button, FormField } from '@/shared/ui'
import { useRegisterMutation } from '@/features/auth/hooks/useRegisterMutation'
import { authPaths } from '@/features/auth/router/auth-paths'
import { getAuthErrorMessage } from '@/features/auth/utils/auth.errors'
import { validateEmail, validateName } from '@/features/auth/utils/field.validation'
import {
  validatePassword,
  validatePasswordMatch,
} from '@/features/auth/utils/password.validation'
import styles from './RegisterForm.module.scss'

export function RegisterForm() {
  const registerMutation = useRegisterMutation()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>({})

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const errors: Record<string, string | null> = {
      name: validateName(name),
      email: validateEmail(email),
      password: validatePassword(password),
      confirmPassword: validatePasswordMatch(password, confirmPassword),
    }

    setFieldErrors(errors)

    if (Object.values(errors).some(Boolean)) {
      return
    }

    registerMutation.mutate(
      { name: name.trim(), email: email.trim(), password },
      {
        onError: (error) => {
          setFieldErrors({ form: getAuthErrorMessage(error) })
        },
      },
    )
  }

  const apiError = registerMutation.isError
    ? getAuthErrorMessage(registerMutation.error)
    : fieldErrors.form ?? null

  return (
    <AuthForm
      title="Crear cuenta"
      subtitle="Empieza a organizar tus hábitos con Xavi"
      error={apiError}
      footer={
        <p>
          ¿Ya tienes cuenta?{' '}
          <Link className={styles.link} to={authPaths.login}>
            Inicia sesión
          </Link>
        </p>
      }
    >
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <FormField
          id="register-name"
          label="Nombre"
          name="name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={registerMutation.isPending}
          error={fieldErrors.name}
          required
        />
        <FormField
          id="register-email"
          label="Correo electrónico"
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={registerMutation.isPending}
          error={fieldErrors.email}
          required
        />
        <FormField
          id="register-password"
          label="Contraseña"
          type="password"
          name="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={registerMutation.isPending}
          error={fieldErrors.password}
          hint="Mínimo 8 caracteres, mayúscula, minúscula y número"
          required
        />
        <FormField
          id="register-confirm"
          label="Confirmar contraseña"
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={registerMutation.isPending}
          error={fieldErrors.confirmPassword}
          required
        />
        <Button type="submit" fullWidth isLoading={registerMutation.isPending}>
          Registrarse
        </Button>
      </form>
    </AuthForm>
  )
}
