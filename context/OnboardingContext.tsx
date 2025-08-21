import { account } from '@/lib/appwriteConfig'
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { ID } from 'react-native-appwrite'

import { useAuth } from './AuthContext'

interface OnboardingContextType {
  isOnboarded: boolean
  isLoading: boolean
  completeOnboarding: (preferences: UserPreferences) => Promise<void>
  userPreferences: UserPreferences | null
  refetchUserPreferences: () => Promise<void>
}

interface UserPreferences {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  brokerageLogo?: string
  realtorPicture?: string
}

const OnboardingContext = createContext<OnboardingContextType>({
  isOnboarded: false,
  isLoading: true,
  completeOnboarding: async () => {},
  userPreferences: null,
  refetchUserPreferences: async () => {},
})

export const OnboardingProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, session } = useAuth()
  const [isOnboarded, setIsOnboarded] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null)

  // Use refs to track if we've already checked onboarding for this user
  const lastCheckedUserId = useRef<string | null>(null)
  const isCheckingRef = useRef(false)

  const checkOnboardingStatus = useCallback(async () => {
    // Prevent multiple simultaneous checks
    if (isCheckingRef.current) return

    // Only check if user ID has changed
    if (!user?.$id || lastCheckedUserId.current === user.$id) {
      return
    }

    isCheckingRef.current = true

    try {
      // Try to fetch existing user preferences from Appwrite
      const preferences = user.prefs

      if (preferences) {
        setUserPreferences(preferences)
        setIsOnboarded(true)
      } else {
        setIsOnboarded(false)
        setUserPreferences(null)
      }

      // Update the last checked user ID
      lastCheckedUserId.current = user.$id
    } catch (error: any) {
      // If document doesn't exist (404) or other error, user needs onboarding
      if (error.code === 404) {
        setIsOnboarded(false)
        setUserPreferences(null)
      } else {
        console.error('Error fetching user preferences:', error)
        // Default to not onboarded if there's an error
        setIsOnboarded(false)
        setUserPreferences(null)
      }

      // Update the last checked user ID even on error
      lastCheckedUserId.current = user.$id
    } finally {
      setIsLoading(false)
      isCheckingRef.current = false
    }
  }, [user?.$id])

  useEffect(() => {
    if (user && session && user.$id) {
      checkOnboardingStatus()
    } else if (!user || !session) {
      // Reset state when user logs out
      setIsOnboarded(false)
      setUserPreferences(null)
      setIsLoading(false)
      lastCheckedUserId.current = null
    }
  }, [user?.$id, session, checkOnboardingStatus])

  const completeOnboarding = async (preferences: UserPreferences) => {
    try {
      setIsLoading(true)

      if (!user?.$id) {
        throw new Error('User not authenticated')
      }

      // Since preferences are stored in user.prefs, we just update local state
      // The actual update happens through the userService.updateUserPrefs
      setUserPreferences(preferences)
      setIsOnboarded(true)

      console.log('Onboarding completed with preferences:', preferences)
    } catch (error) {
      console.error('Error completing onboarding:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const refetchUserPreferences = useCallback(async () => {
    if (!user?.$id) {
      throw new Error('User not authenticated')
    }
    try {
      setIsLoading(true)
      // Since user preferences are stored in user.prefs, we need to refresh the user session
      // or get the updated user object from Appwrite
      const updatedUser = await account.get()

      if (updatedUser.prefs) {
        setUserPreferences(updatedUser.prefs as UserPreferences)
      } else {
        setUserPreferences(null)
      }

      console.log('User preferences refetched successfully')
    } catch (error: any) {
      console.error('Error refetching user preferences:', error)
      setUserPreferences(null)
    } finally {
      setIsLoading(false)
    }
  }, [user?.$id])

  const value = {
    isOnboarded,
    isLoading,
    completeOnboarding,
    userPreferences,
    refetchUserPreferences,
  }

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>
}

export const useOnboarding = () => {
  const context = useContext(OnboardingContext)
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider')
  }
  return context
}
