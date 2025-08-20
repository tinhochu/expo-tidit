import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider'
import { VStack } from '@/components/ui/vstack'
import '@/global.css'
import { Slot } from 'expo-router'
import { useRef } from 'react'
import { Platform, SafeAreaView, ScrollView } from 'react-native'
import { KeyboardAvoidingView } from 'react-native'

import { AuthProvider } from '../context/AuthContext'
import { OnboardingProvider } from '../context/OnboardingContext'

export default function RootLayout() {
  const scrollRef = useRef<ScrollView>(null)

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
