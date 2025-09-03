import { Box } from '@/components/ui/box'
import { Button, ButtonText } from '@/components/ui/button'
import { Heading } from '@/components/ui/heading'
import { Image } from '@/components/ui/image'
import { Input, InputField } from '@/components/ui/input'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { useAuth } from '@/context/AuthContext'
import { Redirect, router } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView } from 'react-native'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'

const signin = () => {
  const scrollRef = useRef<ScrollView>(null)
  const { session, signin, error, loading, clearError, isDeletingAccount, user } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showInputs, setShowInputs] = useState(false)

  // Animation values
  const slideUpValue = useSharedValue(0)
  const opacityValue = useSharedValue(0)

  const handleSubmit = async () => {
    try {
      await signin({ email, password })
    } catch (err) {
      console.log('Signin error:', err)
      // Keep inputs visible when error occurs
      setShowInputs(true)
    }
  }

  const handleEmailChange = (text: string) => {
    setEmail(text)
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

  const handleLoginClick = () => {
    setShowInputs(true)
    // Clear any existing errors when opening inputs
    if (error && error.page === 'signin') {
      clearError()
    }
    // Trigger animation
    slideUpValue.value = withTiming(1, {
      duration: 500,
      easing: Easing.bezier(0.5, 0.01, 0, 1),
    })
    opacityValue.value = withTiming(1, {
      duration: 400,
      easing: Easing.out(Easing.quad),
    })
  }

  const handleBackClick = () => {
    setShowInputs(false)
    // Clear errors when going back
    if (error && error.page === 'signin') {
      clearError()
    }
    // Reset animation
    slideUpValue.value = withTiming(0, {
      duration: 300,
      easing: Easing.in(Easing.quad),
    })
    opacityValue.value = withTiming(0, {
      duration: 200,
      easing: Easing.in(Easing.quad),
    })
  }

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: withTiming(slideUpValue.value * 10, { duration: 500, easing: Easing.bezier(0.5, 0.01, 0, 1) }),
        },
      ],
      opacity: opacityValue.value,
    }
  })

  // Ensure inputs stay visible when error occurs
  useEffect(() => {
    if (error && error.page === 'signin') {
      console.log(`Signin:Error: ${error.message}`)
      // Keep inputs visible when error occurs
      setShowInputs(true)
      // Ensure animations are active
      slideUpValue.value = withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.quad),
      })
      opacityValue.value = withTiming(1, {
        duration: 200,
        easing: Easing.out(Easing.quad),
      })
    }
  }, [error, slideUpValue, opacityValue])

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
                {!showInputs && (
                  <>
                    <Button size="lg" variant="outline" onPress={handleLoginClick}>
                      <ButtonText>Login</ButtonText>
                    </Button>
                    <Button size="lg" className="bg-black" onPress={() => router.push('/signup')}>
                      <ButtonText className="text-white">Create Account</ButtonText>
                    </Button>
                  </>
                )}

                {showInputs && (
                  <Animated.View style={animatedStyle}>
                    <VStack space="md">
                      <Text size="lg">Email:</Text>
                      <Input className="bg-white" size="xl">
                        <InputField
                          placeholder="Enter your email..."
                          value={email.toLowerCase()}
                          onChangeText={handleEmailChange}
                        />
                      </Input>

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

                      <VStack space="xl">
                        <Button size="xl" onPress={handleSubmit} disabled={loading}>
                          <ButtonText>{loading ? 'Signing in...' : 'Login'}</ButtonText>
                        </Button>

                        <Button size="lg" variant="outline" onPress={handleBackClick}>
                          <ButtonText>Back</ButtonText>
                        </Button>
                      </VStack>
                    </VStack>
                  </Animated.View>
                )}
              </VStack>
            </Box>
          </VStack>
        </Box>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export default signin
