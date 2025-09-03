import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import Purchases, { CustomerInfo, PurchasesOffering } from 'react-native-purchases'

interface SubscriptionContextType {
  isSubscribed: boolean
  isLoading: boolean
  customerInfo: CustomerInfo | null
  offerings: PurchasesOffering | null
  checkSubscriptionStatus: () => Promise<void>
  refreshOfferings: () => Promise<void>
  hasEntitlement: (entitlementId: string) => boolean
  hasError: boolean
  errorMessage: string | null
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  isSubscribed: false,
  isLoading: true,
  customerInfo: null,
  offerings: null,
  checkSubscriptionStatus: async () => {},
  refreshOfferings: async () => {},
  hasEntitlement: () => false,
  hasError: false,
  errorMessage: null,
})

export const SubscriptionProvider = ({ children }: { children: React.ReactNode }) => {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null)
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const checkSubscriptionStatus = useCallback(async () => {
    try {
      if (!isInitialized) return

      setIsLoading(true)
      setHasError(false)
      setErrorMessage(null)

      console.log('Checking subscription status...')
      const info = await Purchases.getCustomerInfo()
      setCustomerInfo(info)

      // Check if user has any active entitlements
      const hasActiveEntitlements = info.entitlements?.active ? Object.keys(info.entitlements.active).length > 0 : false
      setIsSubscribed(hasActiveEntitlements)

      console.log('Subscription status checked:', {
        isSubscribed: hasActiveEntitlements,
        entitlements: info.entitlements.active,
      })
    } catch (error: any) {
      console.error('Error checking subscription status:', error)
      setIsSubscribed(false)
      setCustomerInfo(null)
      setHasError(true)
      setErrorMessage(error?.message || 'Failed to check subscription status')
    } finally {
      setIsLoading(false)
    }
  }, [isInitialized])

  const refreshOfferings = useCallback(async () => {
    try {
      if (!isInitialized) return

      console.log('Refreshing offerings...')
      const offeringsData = await Purchases.getOfferings()
      if (offeringsData.current !== null && offeringsData.current.availablePackages.length !== 0) {
        setOfferings(offeringsData.current)
        console.log('Offerings refreshed:', offeringsData.current)
      } else {
        console.log('No current offerings available')
        setOfferings(null)
      }
    } catch (error: any) {
      console.error('Error refreshing offerings:', error)
      setOfferings(null)
      setErrorMessage(error?.message || 'Failed to load subscription options')
    }
  }, [isInitialized])

  const hasEntitlement = useCallback(
    (entitlementId: string): boolean => {
      try {
        if (!customerInfo || !customerInfo.entitlements || !customerInfo.entitlements.active) return false
        return typeof customerInfo.entitlements.active[entitlementId] !== 'undefined'
      } catch (error) {
        console.error('Error checking entitlement:', error)
        return false
      }
    },
    [customerInfo]
  )

  useEffect(() => {
    // Set initialized after first render to avoid issues during initial mount
    console.log('SubscriptionContext: Setting up initialization timer')
    const timer = setTimeout(() => {
      console.log('SubscriptionContext: Initializing...')
      setIsInitialized(true)
    }, 100)

    return () => {
      console.log('SubscriptionContext: Cleaning up timer')
      clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    if (isInitialized) {
      checkSubscriptionStatus()
      refreshOfferings()
    }
  }, [isInitialized, checkSubscriptionStatus, refreshOfferings])

  const value = {
    isSubscribed,
    isLoading,
    customerInfo,
    offerings,
    checkSubscriptionStatus,
    refreshOfferings,
    hasEntitlement,
    hasError,
    errorMessage,
  }

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>
}

export const useSubscription = () => {
  const context = useContext(SubscriptionContext)
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider')
  }
  return context
}
