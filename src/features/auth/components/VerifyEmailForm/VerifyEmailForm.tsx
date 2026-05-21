import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router'
import { AuthForm } from '@/features/auth/components/AuthForm/AuthForm'
import { Button, FormField } from '@/shared/ui'
import { OtpInput } from '@/features/auth/components/OtpInput/OtpInput'
import {
  useResendOtpMutation,
  useVerifyEmailMutation,
} from '@/features/auth/hooks/useVerifyEmailMutation'
import { authPaths } from '@/features/auth/router/auth-paths'
import { selectIsAuthenticated } from '@/features/auth/store/auth.selectors'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { getAuthErrorMessage } from '@/features/auth/utils/auth.errors'
import { validateEmail } from '@/features/auth/utils/field.validation'
import { getPendingEmail, setPendingEmail } from '@/features/auth/utils/pending-email'
import { validateOtpCode } from '@/features/auth/utils/password.validation'
import styles from './VerifyEmailForm.module.scss'

type VerifyLocationState = {
  email?: string
  nextResendAvailableAt?: string
}

export function VerifyEmailForm() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const locationState = (location.state as VerifyLocationState | null) ?? {}
  const isAuthenticated = useAuthStore(selectIsAuthenticated)

  const verifyMutation = useVerifyEmailMutation()
  const resendMutation = useResendOtpMutation()

  const initialEmail =
    locationState.email ?? searchParams.get('email') ?? getPendingEmail() ?? ''

  const [email, setEmail] = useState(initialEmail)
  const [code, setCode] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>({})
  const [resendBlocked, setResendBlocked] = useState(() => {
    if (!locationState.nextResendAvailableAt) return false
    return new Date(locationState.nextResendAvailableAt).getTime() > Date.now()
  })

  useEffect(() => {
    if (email.trim()) {
      setPendingEmail(email)
    }
  }, [email])

  const resendDisabled = !isAuthenticated || resendMutation.isPending || resendBlocked

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const errors: Record<string, string | null> = {
      email: isAuthenticated ? null : validateEmail(email),
      code: validateOtpCode(code),
    }

    setFieldErrors(errors)
    if (Object.values(errors).some(Boolean)) return

    if (isAuthenticated) {
      verifyMutation.mutate(
        { mode: 'authenticated', data: { code } },
        { onError: (error) => setFieldErrors({ form: getAuthErrorMessage(error) }) },
      )
      return
    }

    verifyMutation.mutate(
      { mode: 'guest', data: { email: email.trim(), code } },
      { onError: (error) => setFieldErrors({ form: getAuthErrorMessage(error) }) },
    )
  }

  const handleResend = () => {
    resendMutation.mutate(undefined, {
      onSuccess: () => {
        setResendBlocked(true)
        window.setTimeout(() => setResendBlocked(false), 5 * 60 * 1000)
      },
      onError: (error) => setFieldErrors({ form: getAuthErrorMessage(error) }),
    })
  }

  const apiError = verifyMutation.isError
    ? getAuthErrorMessage(verifyMutation.error)
    : fieldErrors.form ?? null

  return (
    <AuthForm
      title="Verificar correo"
      subtitle={
        isAuthenticated
          ? 'Introduce el código de 6 dígitos enviado a tu correo'
          : 'Confirma tu cuenta con el código enviado por email'
      }
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
        {!isAuthenticated ? (
          <FormField
            id="verify-email"
            label="Correo electrónico"
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={verifyMutation.isPending}
            error={fieldErrors.email}
            required
          />
        ) : null}

        <OtpInput
          value={code}
          onChange={setCode}
          disabled={verifyMutation.isPending}
          error={fieldErrors.code}
        />

        {isAuthenticated ? (
          <Button
            type="button"
            variant="secondary"
            fullWidth
            disabled={resendDisabled}
            isLoading={resendMutation.isPending}
            onClick={handleResend}
          >
            Reenviar código
          </Button>
        ) : null}

        <Button type="submit" fullWidth isLoading={verifyMutation.isPending}>
          Verificar
        </Button>
      </form>
    </AuthForm>
  )
}
