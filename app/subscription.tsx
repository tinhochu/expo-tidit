import { Box } from '@/components/ui/box'
import { Button, ButtonText } from '@/components/ui/button'
import { HStack } from '@/components/ui/hstack'
import { Image } from '@/components/ui/image'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { useSubscription } from '@/context/SubscriptionContext'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useLocalSearchParams } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Linking, ScrollView, TouchableOpacity, View } from 'react-native'
import Purchases, { PurchasesPackage } from 'react-native-purchases'

const SubscriptionPlanToggle: React.FC<{ pkg: PurchasesPackage; isSelected: boolean; onSelect: () => void }> = ({
  pkg,
  isSelected,
  onSelect,
}) => {
  return (
    <TouchableOpacity onPress={onSelect} activeOpacity={0.8}>
      <VStack
        className={`rounded-xl border-2 p-6 ${
          isSelected ? 'border-tidit-primary bg-tidit-primary/20' : 'border-gray-300 bg-gray-100/10'
        }`}
        space="sm"
      >
        <HStack className="items-center justify-between">
          <Text className={`text-xl font-bold ${isSelected ? 'text-tidit-primary' : 'text-gray-600'}`}>
            {pkg.product.title} {pkg.packageType.toLowerCase()}
          </Text>
          {isSelected && (
            <View className="h-10 w-10 items-center justify-center rounded-full bg-tidit-primary">
              <Ionicons name="checkmark" size={24} color="white" />
            </View>
          )}
          {!isSelected && <View className="h-6 w-6 rounded-full border-2 border-gray-400" />}
        </HStack>

        <VStack className="items-start">
          <HStack className="items-start" space="sm">
            <Text className={`relative text-3xl font-bold ${isSelected ? 'text-tidit-primary' : 'text-gray-600'}`}>
              {pkg.product.priceString}
            </Text>
            <Text className="text-sm font-semibold text-tidit-primary">/ {pkg.packageType.toLowerCase()}</Text>
          </HStack>
        </VStack>
      </VStack>
    </TouchableOpacity>
  )
}

const SubscriptionPlan = ({
  price,
  period,
  onPress,
  isLoading = false,
  isAlreadyPro = false,
}: {
  title: string
  price: string
  period: string
  isPopular?: boolean
  onPress: () => void
  isLoading?: boolean
  isAlreadyPro?: boolean
}) => (
  <Box className="my-4 bg-white px-8">
    <VStack space="lg">
      <Box className="rounded-2xl border-2 border-tidit-primary bg-tidit-primary/30 p-6">
        <Text className="text-3xl font-bold text-tidit-primary">Pro</Text>

        <Box className="flex-row items-start">
          <Text className="text-3xl font-bold text-tidit-primary">{price}</Text>
          <Text className="ml-1 font-semibold text-tidit-primary">/ {period}</Text>
        </Box>
      </Box>

      <Button onPress={onPress} disabled={isLoading || isAlreadyPro} className="!h-20 rounded-full bg-tidit-primary">
        {isLoading ? (
          <HStack className="items-center gap-2">
            <ActivityIndicator size="small" color="white" />
            <ButtonText className="text-xl font-bold text-white">Processing...</ButtonText>
          </HStack>
        ) : isAlreadyPro ? (
          <HStack className="items-center gap-2">
            <Ionicons name="checkmark-circle" size={20} color="white" />
            <ButtonText className="text-xl font-bold text-white">Already Subscribed</ButtonText>
          </HStack>
        ) : (
          <ButtonText className="text-xl font-bold text-white">Start Free Trial</ButtonText>
        )}
      </Button>

      {!isAlreadyPro && (
        <VStack>
          <Text className="text-xs text-gray-600">
            1-week free trial, then {price}/{period}. Auto-renews until canceled. Cancel anytime in Settings {'>'} Apple
            ID {'>'} Subscriptions. By subscribing, you agree to our{' '}
            <Text
              className="text-xs text-tidit-primary underline"
              onPress={() => Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/')}
            >
              Terms of Use
            </Text>{' '}
            and{' '}
            <Text
              className="text-xs text-tidit-primary underline"
              onPress={() => Linking.openURL('https://www.apple.com/legal/privacy/en-ww/')}
            >
              Privacy Policy
            </Text>
            .
          </Text>
        </VStack>
      )}
    </VStack>
  </Box>
)

export default function SubscriptionScreen() {
  const { returnRoute } = useLocalSearchParams<{ returnRoute?: string }>()
  const { offerings, isSubscribed, checkSubscriptionStatus } = useSubscription()
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null)

  useEffect(() => {
    checkSubscriptionStatus()
  }, [checkSubscriptionStatus])

  // Auto-select first package when offerings are loaded
  useEffect(() => {
    if (offerings && offerings.availablePackages && offerings.availablePackages.length > 0 && !selectedPackage) {
      setSelectedPackage(offerings.availablePackages[0])
    }
  }, [offerings, selectedPackage])

  const handleSubscribe = async (pkg?: PurchasesPackage) => {
    const packageToUse = pkg || selectedPackage
    if (!packageToUse) return
    setIsLoading(true)
    setErrorMessage(null)

    try {
      console.log('Starting purchase for package:', packageToUse.identifier)

      const { customerInfo } = await Purchases.purchasePackage(packageToUse)

      console.log('Purchase successful, customer info:', customerInfo)

      if (typeof customerInfo.entitlements.active['tidit Pro'] !== 'undefined') {
        // Refresh subscription status after successful purchase
        await checkSubscriptionStatus()

        Alert.alert(
          'Welcome to Pro!',
          'Your subscription has been activated successfully. Enjoy all the premium features!',
          [
            {
              text: 'Continue',
              onPress: () => {
                // If we have a return route, go back there, otherwise go to home
                if (returnRoute) {
                  router.push(returnRoute as any)
                } else {
                  router.push('/')
                }
              },
            },
          ]
        )
      } else {
        throw new Error('Purchase completed but entitlement not found')
      }
    } catch (error: any) {
      console.error('Purchase error:', error)

      // Handle specific error cases
      let userMessage = 'Purchase failed. Please try again.'

      if (error.code === 'USER_CANCELLED') {
        userMessage = 'Purchase was cancelled.'
      } else if (error.code === 'NETWORK_ERROR') {
        userMessage = 'Network error. Please check your connection and try again.'
      } else if (error.code === 'PURCHASE_CANCELLED') {
        userMessage = 'Purchase was cancelled.'
      } else if (error.code === 'STORE_PROBLEM') {
        userMessage = 'Store error. Please try again later.'
      } else if (error.code === 'INVALID_PURCHASE_TOKEN') {
        userMessage = 'Invalid purchase. Please try again.'
      } else if (error.code === 'PURCHASE_IN_PROGRESS') {
        userMessage = 'Purchase already in progress. Please wait.'
      }

      setErrorMessage(userMessage)

      Alert.alert('Purchase Failed', userMessage, [{ text: 'OK' }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackNavigation = () => {
    try {
      // If we have a return route, go back there, otherwise use router.back()
      if (returnRoute) {
        router.push(returnRoute as any)
      } else {
        router.back()
      }
    } catch (error) {
      router.push('/')
    }
  }

  return (
    <Box className="h-full bg-white">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="relative px-4 pb-14 pt-24">
          <View className="absolute -top-[190px] left-1/2 right-1/2 h-[1000px] w-[1000px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-tidit-primary"></View>

          <TouchableOpacity onPress={handleBackNavigation} className="absolute left-6 top-20">
            <Ionicons name="close" size={30} color="white" />
          </TouchableOpacity>

          <VStack className="items-center justify-center">
            <Image source={require('@/assets/images/splash-icon-light.png')} className="h-24 w-24" alt="Tidit Pro" />
            <Text className="text-5xl font-black text-white">Unlock your</Text>
            <HStack className="items-center justify-center">
              <Text className="text-dark text-5xl font-black">Pro</Text>
              <Text className="text-5xl font-black text-white">ductivity</Text>
            </HStack>
          </VStack>
        </View>

        <Box className="px-6 pt-8">
          <Text className="mb-2 text-2xl font-bold">What You&apos;ll Get:</Text>
          <VStack className="gap-2">
            {[
              'Unlock all templates',
              'Customize your posts',
              'Unlimited Templates',
              'Remove Our Logo from your posts',
              'Auto brand colors & logo',
            ].map((feature, index) => (
              <HStack className="items-center gap-2" key={index}>
                <Ionicons name="checkmark" size={24} color="#3193EE" />
                <Text className="text-xl">{feature}</Text>
              </HStack>
            ))}
          </VStack>
        </Box>

        {isSubscribed && (
          <Box className="mt-4 px-6">
            <Box className="w-full items-center justify-center rounded-xl border-2 border-green-400 bg-green-400/50 p-6">
              <HStack className="items-center justify-center">
                <Ionicons name="checkmark-circle" size={24} color="#4ade80" />
                <Text className="text-xl font-bold text-green-900">You already have Pro access!</Text>
              </HStack>
              <Text className="text-sm text-gray-800">Enjoy all the premium features</Text>
            </Box>
          </Box>
        )}

        {errorMessage && (
          <Box className="px-8">
            <Box className="mt-5 rounded-2xl border-2 border-red-500/50 bg-red-500/10 p-6">
              <HStack className="items-center justify-center gap-2">
                <Ionicons name="alert-circle" size={24} color="#ef4444" />
                <Text className="text-xl text-red-500">{errorMessage}</Text>
              </HStack>
            </Box>
          </Box>
        )}

        {offerings?.availablePackages?.map((pkg: any) => (
          <SubscriptionPlan
            key={pkg.identifier}
            title={pkg.product.title}
            price={pkg.product.priceString}
            period={pkg.packageType.toLowerCase()}
            onPress={() => handleSubscribe(pkg)}
            isLoading={isLoading}
            isAlreadyPro={isSubscribed}
          />
        ))}

        <Box className="">
          <Text className="text-center text-sm text-tidit-primary">
            Cancel anytime • Secure payment • Instant access
          </Text>
        </Box>
      </ScrollView>
    </Box>
  )
}
