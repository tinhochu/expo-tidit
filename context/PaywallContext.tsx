import AsyncStorage from '@react-native-async-storage/async-storage'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'

import { useSubscription } from './SubscriptionContext'

interface PaywallContextType {
  shouldShowPaywall: boolean
  hasClosedPaywall: boolean
  markPaywallAsShown: () => void
  markPaywallAsClosed: () => void
}

const PaywallContext = createContext<PaywallContextType>({
  shouldShowPaywall: false,
  hasClosedPaywall: false,
  markPaywallAsShown: () => {},
  markPaywallAsClosed: () => {},
})

export const PaywallProvider = ({ children }: { children: React.ReactNode }) => {
  const [shouldShowPaywall, setShouldShowPaywall] = useState(false)
  const [hasClosedPaywall, setHasClosedPaywall] = useState(false)
  const { isSubscribed } = useSubscription()

  // Storage keys for persistence
  const STORAGE_KEYS = {
    PAYWALL_CLOSED: 'paywall_user_closed',
  }

  // Load the closed state from AsyncStorage on startup
  useEffect(() => {
    const loadPaywallState = async () => {
      try {
        const closed = await AsyncStorage.getItem(STORAGE_KEYS.PAYWALL_CLOSED)
        const hasBeenClosed = closed === 'true'
        setHasClosedPaywall(hasBeenClosed)

        // If user has not closed the paywall and is not subscribed, show paywall
        if (!hasBeenClosed && !isSubscribed) {
          setShouldShowPaywall(true)
        }
      } catch (error) {
        console.error('Error loading paywall state:', error)
      }
    }

    loadPaywallState()
  }, [isSubscribed])

  const markPaywallAsShown = useCallback(() => {
    setShouldShowPaywall(false)
  }, [])

  const markPaywallAsClosed = useCallback(async () => {
    try {
      setShouldShowPaywall(false)

      // Don't mark as closed if user is subscribed, so paywall shows again on future launches if they become unsubscribed
      if (!isSubscribed) {
        setHasClosedPaywall(true)
        await AsyncStorage.setItem(STORAGE_KEYS.PAYWALL_CLOSED, 'true')
      } else {
        // Reset the closed state since they now have subscription
        setHasClosedPaywall(false)
        await AsyncStorage.removeItem(STORAGE_KEYS.PAYWALL_CLOSED)
      }
    } catch (error) {
      console.error('Error setting paywall closed state:', error)
    }
  }, [isSubscribed])

  // Reset the closed state when user subscribes
  useEffect(() => {
    if (isSubscribed) {
      setHasClosedPaywall(false)
      AsyncStorage.removeItem(STORAGE_KEYS.PAYWALL_CLOSED).catch((error) => {
        console.error('Error clearing paywall state:', error)
      })
    }
  }, [isSubscribed])

  const value = {
    shouldShowPaywall,
    hasClosedPaywall,
    markPaywallAsShown,
    markPaywallAsClosed,
  }

  return <PaywallContext.Provider value={value}>{children}</PaywallContext.Provider>
}

export const usePaywall = () => {
  const context = useContext(PaywallContext)
  if (!context) {
    throw new Error('usePaywall must be used within a PaywallProvider')
  }
  return context
}
