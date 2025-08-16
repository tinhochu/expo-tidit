import { useAuth } from '@/context/AuthContext'
import { useOnboarding } from '@/context/OnboardingContext'
import { Redirect, Slot } from 'expo-router'
import { useMemo } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'

type RedirectTarget = '/signin' | '/signup' | 'app' | null

export default function AppLayout() {
  const { session, error, redirectPage } = useAuth()
  const { isOnboarded, isLoading } = useOnboarding()

  const redirectTarget = useMemo((): RedirectTarget => {
    // If not authenticated, redirect to auth
    if (!session) {
      return redirectPage || (error?.page === 'signin' ? '/signin' : '/signup')
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
  }, [session, redirectPage, error?.page, isLoading])

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
    <SafeAreaView className="min-h-screen bg-orange-100 px-5">
      <Slot />
    </SafeAreaView>
  )
}
