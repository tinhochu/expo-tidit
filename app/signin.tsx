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
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'

const signin = () => {
  const scrollRef = useRef<ScrollView>(null)
  const { session, signin, error, loading } = useAuth()

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
    }
  }

  const handleLoginClick = () => {
    setShowInputs(true)
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

  // Log error changes for debugging
  useEffect(() => {
    if (error && error.page === 'signin') {
      console.log(`Signin:Error: ${error.message}`)
    }
  }, [error])

  if (session) return <Redirect href="/" />

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} // iOS needs 'padding'
      keyboardVerticalOffset={Platform.select({ ios: 64, android: 0 })} // tweak if you have a header
    >
      <ScrollView
        ref={scrollRef}
        className="bg-orange-100"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <Box className="min-h-screen justify-end bg-orange-100">
          <VStack space="lg">
            <Image
              source={require('@/assets/images/icon.png')}
              alt="Tidit"
              size="2xl"
              className="self-center shadow-lg"
            />

            <Box className="rounded-t-3xl bg-orange-200 pb-20 pt-10 shadow-xl">
              <VStack space="md" className="mb-10">
                <Heading size="3xl" className="text-center text-black">
                  Welcome to Tidit
                </Heading>

                <Text size="lg" className="text-center text-black">
                  Esports Wellness Tracker
                </Text>
              </VStack>

              <VStack space="md" className="mx-auto w-3/4">
                {!showInputs && (
                  <>
                    <Button size="lg" onPress={() => router.push('/signup')}>
                      <ButtonText>Create Account</ButtonText>
                    </Button>
                    <Button size="lg" variant="outline" onPress={handleLoginClick}>
                      <ButtonText>Login</ButtonText>
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
                          onChangeText={(text) => setEmail(text)}
                        />
                      </Input>

                      <Text size="lg">Password:</Text>
                      <Input className="bg-white" size="xl">
                        <InputField
                          placeholder="Password"
                          value={password}
                          onChangeText={(text) => setPassword(text)}
                          secureTextEntry
                        />
                      </Input>

                      {/* Display error message */}
                      {error && error.page === 'signin' && (
                        <Text size="md" className="text-center text-red-600">
                          {error.message}
                        </Text>
                      )}

                      <Button size="xl" onPress={handleSubmit} disabled={loading}>
                        <ButtonText>{loading ? 'Signing in...' : 'Login'}</ButtonText>
                      </Button>
                      <Button size="lg" variant="outline" onPress={handleBackClick}>
                        <ButtonText>Back</ButtonText>
                      </Button>
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
