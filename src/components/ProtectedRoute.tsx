import { type ReactNode } from 'react'
import { Navigate } from 'react-router'
import { useAppSelector } from '../app/hooks'
import { selectIsAuthenticated, selectOtpVerified } from '../app/features/auth/authSlice'

type RouteGuardProps = {
  children: ReactNode
  redirectTo?: string
}

export default function ProtectedRoute({
  children,
  redirectTo = '/login',
}: RouteGuardProps) {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}

export function GuestOnlyRoute({
  children,
  redirectTo = '/',
}: RouteGuardProps) {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}

export function RegistrationRoute({
  children,
  redirectTo = '/login',
}: RouteGuardProps) {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const otpVerified = useAppSelector(selectOtpVerified)

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  if (!otpVerified) {
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}
