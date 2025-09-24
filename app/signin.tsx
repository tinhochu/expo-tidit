import { Box } from '@/components/ui/box'
import { Button, ButtonText } from '@/components/ui/button'
import { Heading } from '@/components/ui/heading'
import { HStack } from '@/components/ui/hstack'
import { Image } from '@/components/ui/image'
import { Input, InputField } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Redirect, router } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native'

// Storage keys for persistent form data
const STORAGE_KEYS = {
  EMAIL: 'signin_email',
}

const signin = () => {
  const scrollRef = useRef<ScrollView>(null)
  const { session, signin, error, loading, clearError, isDeletingAccount, user } = useAuth()

  // Simple state management
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Functions to save/load form data from AsyncStorage
  // Only save email for security reasons - never save passwords
  const saveFormData = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.EMAIL, email)
    } catch (e) {
      console.error('Error saving form data:', e)
    }
  }

  const loadFormData = async () => {
    try {
      const emailValue = await AsyncStorage.getItem(STORAGE_KEYS.EMAIL)

      if (emailValue !== null) {
        setEmail(emailValue)
      } else {
        console.log('No email found in AsyncStorage')
      }
    } catch (e) {
      console.error('Error loading form data:', e)
    }
  }

  const clearFormData = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.EMAIL)
    } catch (e) {
      console.error('Error clearing form data:', e)
    }
  }

  // Load form data on component mount
  useEffect(() => {
    loadFormData()
  }, [])

  // Email validation function
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email.trim())
  }

  const handleSubmit = async () => {
    try {
      await signin({ email, password })
      // Clear form data on successful login
      await clearFormData()
    } catch (err) {
      // Save current form data in case of error
      await saveFormData()
    }
  }

  const handleEmailChange = (text: string) => {
    const lowerText = text.toLowerCase()
    setEmail(lowerText)
    // Save form data as user types
    saveFormData() // Don't await to avoid blocking UI
    // Clear error when user starts typing
    if (error && error.page === 'signin') {
      clearError()
    }
  }

  const handlePasswordChange = (text: string) => {
    setPassword(text)
    // Clear error when user starts typing
    if (error && error.page === 'signin') {
      clearError()
    }
  }

  // Only redirect to app if we have a valid session, user exists, and we're not deleting account
  // Also ensure user has a valid ID to prevent redirect with deleted users
  if (session && user && user.$id && !isDeletingAccount) return <Redirect href="/" />

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} // iOS needs 'padding'
      keyboardVerticalOffset={Platform.select({ ios: 64, android: 0 })} // tweak if you have a header
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ flexGrow: 1, backgroundColor: 'white' }}
        keyboardShouldPersistTaps="handled"
      >
        <Box className="relative min-h-screen justify-center bg-white pb-10">
          <VStack space="lg">
            <Box className="flex items-center justify-center px-10">
              <Image source={require('@/assets/images/icon.png')} alt="Tidit" size="2xl" />
            </Box>

            <Box className="bg-white pb-20 pt-10">
              <VStack space="md" className="mb-10">
                <Heading size="3xl" className="text-center text-black">
                  Create. Post. Done.
                </Heading>
              </VStack>

              <VStack space="md" className="mx-auto w-3/4">
                {/* Email field */}
                <Text size="lg">Email:</Text>
                <Input className={`bg-white ${email.trim() && !isValidEmail(email) ? 'border-red-500' : ''}`} size="xl">
                  <InputField placeholder="Enter your email..." value={email} onChangeText={handleEmailChange} />
                </Input>

                {/* Password field */}
                <Text size="lg">Password:</Text>
                <Input className="bg-white" size="xl">
                  <InputField
                    placeholder="Password"
                    value={password}
                    onChangeText={handlePasswordChange}
                    secureTextEntry
                  />
                </Input>

                {/* Display error message */}
                {error && error.page === 'signin' && (
                  <Text size="md" className="text-center font-medium text-red-600">
                    {error.message}
                  </Text>
                )}

                {/* Login button */}
                <Button
                  size="xl"
                  onPress={handleSubmit}
                  disabled={loading || !email.trim() || !password.trim() || !isValidEmail(email)}
                  className={cn(
                    'bg-tidit-primary',
                    loading || !email.trim() || !password.trim() || !isValidEmail(email) ? 'opacity-50' : ''
                  )}
                >
                  <ButtonText>{loading ? 'Signing in...' : 'Login'}</ButtonText>
                </Button>

                {/* Helper text for disabled button */}
                {!loading && (!email.trim() || !password.trim()) && (
                  <Text size="sm" className="text-center text-gray-500">
                    Please fill in both email and password to continue
                  </Text>
                )}

                {/* Email validation helper text */}
                {!loading && email.trim() && !isValidEmail(email) && (
                  <Box className="rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
                    <Text size="sm" className="text-center text-red-500">
                      Please enter a valid email address
                    </Text>
                  </Box>
                )}

                <HStack space="lg" className="w-full items-center justify-center">
                  <Separator className="w-1/2" />
                  <Text className="text-center font-bold text-gray-500">OR</Text>
                  <Separator className="w-1/2" />
                </HStack>

                {/* Create Account button */}
                <Button
                  size="xl"
                  variant="outline"
                  className="!border-tidit-primary"
                  onPress={() => {
                    clearError() // Clear any signin errors before navigating
                    router.push('/signup')
                  }}
                >
                  <ButtonText className="text-tidit-primary">Create Account</ButtonText>
                </Button>
              </VStack>
            </Box>
          </VStack>
        </Box>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export default signin
