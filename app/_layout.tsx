import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider'
import { AuthProvider } from '@/context/AuthContext'
import { OnboardingProvider } from '@/context/OnboardingContext'
import '@/global.css'
import { Slot } from 'expo-router'

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
