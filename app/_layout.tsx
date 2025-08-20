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
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined} // iOS needs 'padding'
            keyboardVerticalOffset={Platform.select({ ios: 64, android: 0 })} // tweak if you have a header
          >
            <ScrollView ref={scrollRef} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
              <SafeAreaView>
                <VStack className="min-h-screen flex-1 px-3">
                  <Slot />
                </VStack>
              </SafeAreaView>
            </ScrollView>
          </KeyboardAvoidingView>
        </OnboardingProvider>
      </AuthProvider>
    </GluestackUIProvider>
  )
}
