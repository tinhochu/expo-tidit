import { Box } from '@/components/ui/box'
import { Button, ButtonText } from '@/components/ui/button'
import {
  FormControl,
  FormControlError,
  FormControlErrorIcon,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
} from '@/components/ui/form-control'
import { Grid, GridItem } from '@/components/ui/grid'
import { Heading } from '@/components/ui/heading'
import { HStack } from '@/components/ui/hstack'
import { AlertCircleIcon, ChevronLeftIcon, Icon } from '@/components/ui/icon'
import { Image } from '@/components/ui/image'
import { Input, InputField } from '@/components/ui/input'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { useAuth } from '@/context/AuthContext'
import { Link, router } from 'expo-router'
import * as SecureStore from 'expo-secure-store'
import { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function Signup() {
  const { signup, loading, error, clearError, clearFormData } = useAuth()

  // Individual state for each input field
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Individual error states for each field
  const [firstNameError, setFirstNameError] = useState('')
  const [lastNameError, setLastNameError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [confirmPasswordError, setConfirmPasswordError] = useState('')

  // Save form data to SecureStore
  const saveFormData = async (data: any) => {
    try {
      console.log('💾 Saving form data')

      // Only save if we have meaningful data
      if (!data.firstName && !data.lastName && !data.email && !data.password && !data.confirmPassword) {
        console.log('📝 No meaningful data to save, skipping')
        return
      }

      // Try SecureStore first
      await SecureStore.setItemAsync('signupFormData', JSON.stringify(data))
      console.log('✅ Form data saved successfully to SecureStore')

      // Verify the save worked
      const verifyData = await SecureStore.getItemAsync('signupFormData')
      if (verifyData) {
        console.log('✅ Data verification successful')
      } else {
        console.log('⚠️ Data verification failed - data not persisted')
      }
    } catch (error) {
      console.log('❌ Error saving form data to SecureStore:', error)
      console.log('🔄 SecureStore might not be available on this platform')
    }
  }

  // Save form data whenever any field changes (debounced)
  useEffect(() => {
    const currentData = {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
    }

    // Only save if we have actual data to save
    if (firstName || lastName || email || password || confirmPassword) {
      console.log('🔄 Form data changed, saving...')
      saveFormData(currentData)
    }
  }, [firstName, lastName, email, password, confirmPassword])

  // Clear form data when component unmounts (after successful signup)
  useEffect(() => {
    return () => {
      // Clear the SecureStore data when component unmounts
      SecureStore.deleteItemAsync('signupFormData').catch((error) => {
        console.log('Error clearing saved form data on unmount:', error)
      })
    }
  }, [])

  // Clear form data when user navigates away manually
  const handleBackNavigation = async () => {
    await clearFormData()
    router.push('/signin')
  }

  // Validation functions
  const validateFirstName = (value: string) => {
    if (!value.trim()) {
      setFirstNameError('First name is required')
      return false
    }
    if (value.trim().length < 2) {
      setFirstNameError('First name must be at least 2 characters')
      return false
    }
    setFirstNameError('')
    return true
  }

  const validateLastName = (value: string) => {
    if (!value.trim()) {
      setLastNameError('Last name is required')
      return false
    }
    if (value.trim().length < 2) {
      setLastNameError('Last name must be at least 2 characters')
      return false
    }
    setLastNameError('')
    return true
  }

  const validateEmail = (value: string) => {
    if (!value.trim()) {
      setEmailError('Email is required')
      return false
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      setEmailError('Please enter a valid email address')
      return false
    }
    setEmailError('')
    return true
  }

  const validatePassword = (value: string) => {
    if (!value) {
      setPasswordError('Password is required')
      return false
    }
    if (value.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      return false
    }
    setPasswordError('')
    return true
  }

  const validateConfirmPassword = (value: string) => {
    if (!value) {
      setConfirmPasswordError('Please confirm your password')
      return false
    }
    if (value !== password) {
      setConfirmPasswordError('Passwords do not match')
      return false
    }
    setConfirmPasswordError('')
    return true
  }

  // Handle input changes with validation
  const handleFirstNameChange = (text: string) => {
    setFirstName(text)
    if (firstNameError) {
      validateFirstName(text)
    }
  }

  const handleLastNameChange = (text: string) => {
    setLastName(text)
    if (lastNameError) {
      validateLastName(text)
    }
  }

  const handleEmailChange = (text: string) => {
    setEmail(text)
    if (emailError) {
      validateEmail(text)
    }
  }

  const handlePasswordChange = (text: string) => {
    setPassword(text)
    if (passwordError) {
      validatePassword(text)
    }
    // Re-validate confirm password if it has a value
    if (confirmPassword) {
      validateConfirmPassword(confirmPassword)
    }
  }

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text)
    if (confirmPasswordError) {
      validateConfirmPassword(text)
    }
  }

  const clearForm = () => {
    setFirstName('')
    setLastName('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setFirstNameError('')
    setLastNameError('')
    setEmailError('')
    setPasswordError('')
    setConfirmPasswordError('')
    // Clear SecureStore data as well
    SecureStore.deleteItemAsync('signupFormData').catch((error) => {
      console.log('Error clearing saved form data:', error)
    })
    clearError()
  }

  const handleSubmit = async () => {
    // Clear any previous auth errors
    clearError()

    // Validate all fields
    const isFirstNameValid = validateFirstName(firstName)
    const isLastNameValid = validateLastName(lastName)
    const isEmailValid = validateEmail(email)
    const isPasswordValid = validatePassword(password)
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword)

    // If all validations pass, proceed with signup
    if (isFirstNameValid && isLastNameValid && isEmailValid && isPasswordValid && isConfirmPasswordValid) {
      // Combine first and last name for the name field
      const fullName = `${firstName.trim()} ${lastName.trim()}`

      try {
        const result = await signup({
          email: email.trim(),
          password,
          name: fullName,
        })

        // If signup is successful, clear the form data
        if (result) {
          await clearFormData()
        }
      } catch (error) {
        console.log('Signup failed:', error)
      }
    }
  }

  useEffect(() => {
    if (error && error.page === 'signup') {
      console.log(`Signup:Error: ${error.message}`)
    }
  }, [error])

  return (
    <SafeAreaView className="flex-1 bg-orange-100">
      <Box className="min-h-screen justify-start bg-orange-100 px-5">
        <VStack space="lg">
          <HStack className="items-center justify-between">
            <Button onPress={handleBackNavigation} variant="link">
              <ButtonText>
                <Icon as={ChevronLeftIcon} className="h-8 w-8 text-black" />
              </ButtonText>
            </Button>

            <Text size="lg" className="text-black">
              Already have an account?{' '}
              <Link href="/signin" className="font-bold text-green-500 underline">
                Log In
              </Link>
            </Text>
          </HStack>

          <VStack className="mt-5" space="lg">
            <Heading size="xl" className="text-black">
              Welcome to ZenGamer
            </Heading>
            <Text size="lg">Create a account to access personalized wellness insights and track your progress.</Text>

            <Grid
              className="gap-5"
              _extra={{
                className: 'grid-cols-2',
              }}
            >
              <GridItem _extra={{ className: 'col-span-1' }}>
                <FormControl isInvalid={!!firstNameError} isDisabled={false} isReadOnly={false} isRequired={false}>
                  <FormControlLabel>
                    <FormControlLabelText>First Name</FormControlLabelText>
                  </FormControlLabel>
                  <Input className="my-1">
                    <InputField
                      type="text"
                      placeholder="First Name"
                      value={firstName}
                      className="bg-white"
                      onChangeText={handleFirstNameChange}
                    />
                  </Input>
                  {firstNameError && (
                    <FormControlError>
                      <FormControlErrorIcon as={AlertCircleIcon} />
                      <FormControlErrorText>{firstNameError}</FormControlErrorText>
                    </FormControlError>
                  )}
                </FormControl>
              </GridItem>

              <GridItem _extra={{ className: 'col-span-1' }}>
                <FormControl isInvalid={!!lastNameError} isDisabled={false} isReadOnly={false} isRequired={false}>
                  <FormControlLabel>
                    <FormControlLabelText>Last Name</FormControlLabelText>
                  </FormControlLabel>
                  <Input className="my-1">
                    <InputField
                      type="text"
                      placeholder="Last Name"
                      value={lastName}
                      className="bg-white"
                      onChangeText={handleLastNameChange}
                    />
                  </Input>
                  {lastNameError && (
                    <FormControlError>
                      <FormControlErrorIcon as={AlertCircleIcon} />
                      <FormControlErrorText>{lastNameError}</FormControlErrorText>
                    </FormControlError>
                  )}
                </FormControl>
              </GridItem>
            </Grid>

            <FormControl isInvalid={!!emailError} isDisabled={false} isReadOnly={false} isRequired={false}>
              <FormControlLabel>
                <FormControlLabelText>Email Address</FormControlLabelText>
              </FormControlLabel>
              <Input className="my-1">
                <InputField
                  type="text"
                  placeholder="Email Address"
                  value={email}
                  className="bg-white"
                  onChangeText={handleEmailChange}
                />
              </Input>
              {emailError && (
                <FormControlError>
                  <FormControlErrorIcon as={AlertCircleIcon} />
                  <FormControlErrorText>{emailError}</FormControlErrorText>
                </FormControlError>
              )}
            </FormControl>

            <FormControl isInvalid={!!passwordError} isDisabled={false} isReadOnly={false} isRequired={false}>
              <FormControlLabel>
                <FormControlLabelText>Password (8+ characters)</FormControlLabelText>
              </FormControlLabel>
              <Input className="my-1">
                <InputField
                  type="password"
                  placeholder="Password"
                  value={password}
                  className="bg-white"
                  onChangeText={handlePasswordChange}
                />
              </Input>
              {passwordError && (
                <FormControlError>
                  <FormControlErrorIcon as={AlertCircleIcon} />
                  <FormControlErrorText>{passwordError}</FormControlErrorText>
                </FormControlError>
              )}
            </FormControl>

            <FormControl isInvalid={!!confirmPasswordError} isDisabled={false} isReadOnly={false} isRequired={false}>
              <FormControlLabel>
                <FormControlLabelText>Confirm Password</FormControlLabelText>
              </FormControlLabel>
              <Input className="my-1">
                <InputField
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  className="bg-white"
                  onChangeText={handleConfirmPasswordChange}
                />
              </Input>
              {confirmPasswordError && (
                <FormControlError>
                  <FormControlErrorIcon as={AlertCircleIcon} />
                  <FormControlErrorText>{confirmPasswordError}</FormControlErrorText>
                </FormControlError>
              )}
            </FormControl>

            <Text>
              By Continuing, you agree to our{' '}
              <Link href="/terms" className="font-semibold text-green-500 underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy-policy" className="font-semibold text-green-500 underline">
                Privacy Policy
              </Link>
              .
            </Text>

            {/* Show auth error above the Continue button */}
            {error && (
              <Box className="rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
                <VStack space="sm">
                  <Text className="text-red-700">{error.message}</Text>
                </VStack>
              </Box>
            )}

            <Button onPress={handleSubmit} className="bg-green-500" size="xl" isDisabled={loading}>
              <ButtonText>{loading ? 'Creating Account...' : 'Continue'}</ButtonText>
            </Button>
            <Image source={require('@/assets/images/icon.png')} alt="ZenGamer" size="xl" className="self-center" />
          </VStack>
        </VStack>
      </Box>
    </SafeAreaView>
  )
}
