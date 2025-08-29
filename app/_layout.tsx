import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider'
import { AuthProvider } from '@/context/AuthContext'
import { OnboardingProvider } from '@/context/OnboardingContext'
import '@/global.css'
import { Slot } from 'expo-router'
import { useEffect } from 'react'
import Purchases, { LOG_LEVEL } from 'react-native-purchases'

export default function RootLayout() {
  async function getCustomerInfo() {
    const customerInfo = await Purchases.getCustomerInfo()
    console.log(customerInfo)
  }

  async function getOfferings() {
    const offerings = await Purchases.getOfferings()

    if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
      console.log(`Offerings`, JSON.stringify(offerings, null, 2))
    }
  }

  useEffect(() => {
    Purchases.setLogLevel(LOG_LEVEL.VERBOSE)

    Purchases.configure({ apiKey: 'appl_HzWQyORvJvHjlkmobZIlBHlbGqV' })

    getCustomerInfo()
    getOfferings()
  }, [])

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
