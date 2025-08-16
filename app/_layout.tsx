import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider'
import '@/global.css'
import { Slot } from 'expo-router'

import { AuthProvider } from '../context/AuthContext'
import { OnboardingProvider } from '../context/OnboardingContext'

export default function RootLayout() {
  return (
    <GluestackUIProvider mode="light">
      <AuthProvider>
        <OnboardingProvider>
          <Slot />
        </OnboardingProvider>
      </AuthProvider>
    </GluestackUIProvider>
  )
}
