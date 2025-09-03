import { useAuth } from '@/context/AuthContext'
import { useOnboarding } from '@/context/OnboardingContext'
import { Redirect, Stack } from 'expo-router'
import { useEffect, useMemo } from 'react'

type RedirectTarget = '/signin' | '/signup' | 'app' | null

export default function AppLayout() {
  const { session, error, redirectPage, isDeletingAccount, setDeletingAccount } = useAuth()
  const { isOnboarded, isLoading } = useOnboarding()

  const redirectTarget = useMemo((): RedirectTarget => {
    // If account is being deleted, redirect to signin immediately
    if (isDeletingAccount) {
      return '/signin'
    }

    // If not authenticated, redirect to auth
    if (!session) {
      return redirectPage || (error?.page === 'signup' ? '/signup' : '/signin')
    }

    // If still loading onboarding status, show loading
    if (isLoading) {
      return null // This will show the loading state from AuthProvider
    }

    // For now, skip onboarding check since the route doesn't exist
    // TODO: Add onboarding route and re-enable this logic
    // if (!isOnboarded) {
    //   return '/onboarding'
    // }

    // User is authenticated, show the app
    return 'app'
  }, [session, redirectPage, error?.page, isLoading, isDeletingAccount])

  // Reset isDeletingAccount flag when we successfully redirect to signin
  useEffect(() => {
    if (isDeletingAccount && redirectTarget === '/signin') {
      // Small delay to ensure redirect happens, then reset the flag
      const timer = setTimeout(() => {
        setDeletingAccount(false)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isDeletingAccount, redirectTarget, setDeletingAccount])

  if (redirectTarget === '/signin') {
    return <Redirect href="/signin" />
  }

  if (redirectTarget === '/signup') {
    return <Redirect href="/signup" />
  }

  if (redirectTarget === null) {
    return null // Show loading state
  }

  // User is authenticated, show the app
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  )
}
