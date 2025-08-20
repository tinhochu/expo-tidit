import { Box } from '@/components/ui/box'
import { Image } from '@/components/ui/image'
import { VStack } from '@/components/ui/vstack'
import { account } from '@/lib/appwriteConfig'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const AuthContext = createContext<{
  session: any
  user: any
  error: {
    message: string
    code: string
    page: string
  } | null
  loading: boolean
  redirectPage: '/signin' | '/signup' | null
  signin: ({ email, password }: { email: string; password: string }) => Promise<void>
  signup: ({ email, password, name }: { email: string; password: string; name: string }) => Promise<any | null>
  signout: () => Promise<void>
  clearError: () => void
  setRedirectPage: (page: '/signin' | '/signup' | null) => void
}>({
  session: null,
  user: null,
  error: null,
  loading: false,
  redirectPage: null,
  signin: async () => {},
  signup: async () => null,
  signout: async () => {},
  clearError: () => {},
  setRedirectPage: () => {},
})

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [redirectPage, setRedirectPage] = useState<'/signin' | '/signup' | null>(null)
  const [error, setError] = useState<{
    message: string
    code: string
    page: string
  } | null>(null)

  const checkAuth = useCallback(async () => {
    try {
      const response = await account.get()
      setUser(response as any)
      setSession(response as any)
      // Only clear errors if authentication is successful
      if (response) {
        setError(null)
      }
    } catch (error: any) {
      console.log(error)
      // Don't set error for auth check failures as they're expected for unauthenticated users
      // Also don't clear existing errors here
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const signup = useCallback(async ({ email, password, name }: { email: string; password: string; name: string }) => {
    setLoading(true)
    setError(null)
    try {
      // Create the user account
      const response = await account.create('unique()', email, password, name)

      // Create email session to automatically sign in the user
      const responseSession = await account.createEmailPasswordSession(email, password)

      // Get the user details
      const responseUser = await account.get()

      // Add a small delay to allow form data to be saved before redirecting
      setTimeout(() => {
        setSession(responseSession as any)
        setUser(responseUser as any)
        setLoading(false)
      }, 100)

      console.log('User signed up successfully:', response)
      return response
    } catch (error: any) {
      console.log(`AuthContext:Signup Error: ${error?.message}`)

      // Set a user-friendly error message
      let errorMessage = 'An error occurred during sign up'

      if (error?.message) {
        // Handle common Appwrite errors with user-friendly messages
        if (error.message.includes('already exists')) {
          errorMessage = 'An account with this email already exists. Please try signing in instead.'
        } else if (error.message.includes('password')) {
          errorMessage = 'Password requirements not met. Please ensure your password is at least 8 characters.'
        } else if (error.message.includes('email')) {
          errorMessage = 'Please enter a valid email address.'
        } else {
          errorMessage = error.message
        }
      }

      setError({
        message: errorMessage,
        code: error.code,
        page: 'signup',
      })
      setLoading(false)

      return null
    }
  }, [])

  const signin = useCallback(async ({ email, password }: { email: string; password: string }) => {
    setLoading(true)
    // Don't clear error immediately - let the error display until we know the result
    try {
      const responseSession = await account.createEmailPasswordSession(email, password)
      setSession(responseSession as any)
      const responseUser = await account.get()
      setUser(responseUser as any)
      // Only clear error on successful signin
      setError(null)
    } catch (error: any) {
      console.log(`AuthContext:Error: ${error?.message}`)
      setError({
        message: error?.message || 'An error occurred during sign in',
        code: error?.code || 'unknown',
        page: 'signin',
      })
    }
    setLoading(false)
  }, [])

  const signout = useCallback(async () => {
    setLoading(true)
    try {
      await account.deleteSession('current')
      setSession(null)
      setUser(null)
      setError(null)
      // Set redirect page to signin after logout
      setRedirectPage('/signin')
    } catch (error: any) {
      console.log(`AuthContext:Signout Error: ${error?.message}`)
      setError({
        message: error?.message || 'An error occurred during sign out',
        code: error?.code || 'unknown',
        page: 'signout',
      })
    }
    setLoading(false)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const setRedirectPageHandler = useCallback((page: '/signin' | '/signup' | null) => {
    setRedirectPage(page)
  }, [])

  const contextData = useMemo(
    () => ({
      session,
      user,
      error,
      loading,
      redirectPage,
      signin,
      signup,
      signout,
      clearError,
      setRedirectPage: setRedirectPageHandler,
    }),
    [session, user, error, loading, redirectPage, signin, signup, signout, clearError, setRedirectPageHandler]
  )

  return (
    <AuthContext.Provider value={contextData}>
      {loading ? (
        <Box className="min-h-screen justify-center">
          <VStack space="lg">
            <Image source={require('@/assets/images/icon.png')} alt="Tidit" size="2xl" className="self-center" />
          </VStack>
        </Box>
      ) : (
        children
      )}
    </AuthContext.Provider>
  )
}

const useAuth = () => {
  return useContext(AuthContext)
}

export { useAuth, AuthContext, AuthProvider }
