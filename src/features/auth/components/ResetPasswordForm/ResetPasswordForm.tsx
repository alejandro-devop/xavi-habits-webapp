import { useState, type FormEvent } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router'
import { AuthForm } from '@/features/auth/components/AuthForm/AuthForm'
import { Button, FormField } from '@/shared/ui'
import { OtpInput } from '@/features/auth/components/OtpInput/OtpInput'
import { useResetPasswordMutation } from '@/features/auth/hooks/useResetPasswordMutation'
import { authPaths } from '@/features/auth/router/auth-paths'
import { getAuthErrorMessage } from '@/features/auth/utils/auth.errors'
import { validateEmail } from '@/features/auth/utils/field.validation'
import {
  validateOtpCode,
  validatePassword,
  validatePasswordMatch,
} from '@/features/auth/utils/password.validation'
import styles from './ResetPasswordForm.module.scss'

type ResetLocationState = {
  email?: string
}

export function ResetPasswordForm() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const locationState = (location.state as ResetLocationState | null) ?? {}

  const resetMutation = useResetPasswordMutation()

  const [email, setEmail] = useState(
    locationState.email ?? searchParams.get('email') ?? '',
  )
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>({})

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const errors: Record<string, string | null> = {
      email: validateEmail(email),
      code: validateOtpCode(code),
      password: validatePassword(password),
      confirmPassword: validatePasswordMatch(password, confirmPassword),
    }

    setFieldErrors(errors)
    if (Object.values(errors).some(Boolean)) return

    resetMutation.mutate(
      { email: email.trim(), code, password },
      { onError: (error) => setFieldErrors({ form: getAuthErrorMessage(error) }) },
    )
  }

  const apiError = resetMutation.isError
    ? getAuthErrorMessage(resetMutation.error)
    : fieldErrors.form ?? null

  return (
    <AuthForm
      title="Nueva contraseña"
      subtitle="Introduce el código de 6 dígitos y tu nueva contraseña"
      error={apiError}
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
          id="reset-email"
          label="Correo electrónico"
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={resetMutation.isPending}
          error={fieldErrors.email}
          required
        />
        <OtpInput
          value={code}
          onChange={setCode}
          disabled={resetMutation.isPending}
          error={fieldErrors.code}
        />
        <FormField
          id="reset-password"
          label="Nueva contraseña"
          type="password"
          name="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={resetMutation.isPending}
          error={fieldErrors.password}
          hint="Mínimo 8 caracteres, mayúscula, minúscula y número"
          required
        />
        <FormField
          id="reset-confirm"
          label="Confirmar contraseña"
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={resetMutation.isPending}
          error={fieldErrors.confirmPassword}
          required
        />
        <Button type="submit" fullWidth isLoading={resetMutation.isPending}>
          Restablecer contraseña
        </Button>
      </form>
    </AuthForm>
  )
}
