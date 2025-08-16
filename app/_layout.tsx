import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider'
import '@/global.css'
import { Slot } from 'expo-router'

import { AuthProvider } from '../context/AuthContext'

export default function RootLayout() {
  return (
    <GluestackUIProvider mode="light">
      <AuthProvider>
        <Slot />
      </AuthProvider>
    </GluestackUIProvider>
  )
}
