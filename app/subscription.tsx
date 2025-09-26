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
import React, { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'
import Purchases, { PurchasesPackage } from 'react-native-purchases'

interface SubscriptionPlanToggleProps {
  pkg: PurchasesPackage
  isSelected: boolean
  onSelect: () => void
}

const SubscriptionPlanToggle: React.FC<SubscriptionPlanToggleProps> = ({ pkg, isSelected, onSelect }) => {
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

export default function SubscriptionScreen() {
  const closeRef = useRef<() => void>(null)
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
    // If we have a return route, go back there, otherwise use router.back()
    if (returnRoute) {
      router.push(returnRoute as any)
    } else {
      router.back()
    }
  }

  return (
    <Box>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="relative px-4 pb-14 pt-24">
          <View className="absolute -top-[190px] left-1/2 right-1/2 h-[1000px] w-[1000px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-tidit-primary"></View>

          <TouchableOpacity onPress={handleBackNavigation} className="absolute left-6 top-20">
            <Ionicons name="close" size={30} color="white" />
          </TouchableOpacity>

          <VStack className="items-center justify-center">
            <Image source={require('@/assets/images/splash-icon-light.png')} className="h-24 w-24" />
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
                <Text className="text-xl font-medium">{feature}</Text>
              </HStack>
            ))}
          </VStack>
        </Box>

        {isSubscribed && (
          <View style={styles.alreadyProContainer}>
            <View style={styles.alreadyProBadge}>
              <Ionicons name="checkmark-circle" size={24} color="#4ade80" />
              <Text style={styles.alreadyProText}>You already have Pro access!</Text>
            </View>
            <Text style={styles.alreadyProSubtext}>Enjoy all the premium features</Text>
          </View>
        )}

        <Box className="p-6">
          {offerings?.availablePackages && (
            <>
              {offerings.availablePackages.length === 1 ? (
                // Single offering - just auto-select it
                <VStack space="md">
                  {offerings.availablePackages.map((pkg: any) => (
                    <SubscriptionPlanToggle
                      key={pkg.identifier}
                      pkg={pkg}
                      isSelected={selectedPackage?.identifier === pkg.identifier}
                      onSelect={() => setSelectedPackage(pkg)}
                    />
                  ))}
                </VStack>
              ) : offerings.availablePackages.length === 2 ? (
                // Two offerings - show side by side with selection
                <HStack className="gap-4">
                  {offerings.availablePackages.map((pkg: any) => (
                    <Box key={pkg.identifier} className="flex-1">
                      <SubscriptionPlanToggle
                        pkg={pkg}
                        isSelected={selectedPackage?.identifier === pkg.identifier}
                        onSelect={() => setSelectedPackage(pkg)}
                      />
                    </Box>
                  ))}
                </HStack>
              ) : (
                // Fallback for other amounts of offerings
                <VStack space="md">
                  {offerings.availablePackages.map((pkg: any) => (
                    <SubscriptionPlanToggle
                      key={pkg.identifier}
                      pkg={pkg}
                      isSelected={selectedPackage?.identifier === pkg.identifier}
                      onSelect={() => setSelectedPackage(pkg)}
                    />
                  ))}
                </VStack>
              )}

              {/* Single CTA Button */}
              {selectedPackage && (
                <VStack className="mt-6" space="md">
                  <TouchableOpacity
                    onPress={() => handleSubscribe()}
                    activeOpacity={0.8}
                    disabled={isLoading || isSubscribed}
                    className={isLoading || isSubscribed ? 'opacity-70' : ''}
                  >
                    <Button className="h-[65px] w-full bg-tidit-primary" size="xl">
                      {isLoading ? (
                        <HStack className="items-center gap-2">
                          <ActivityIndicator size="small" color="white" />
                          <ButtonText className="text-2xl font-bold text-white">Processing...</ButtonText>
                        </HStack>
                      ) : isSubscribed ? (
                        <HStack className="items-center gap-2">
                          <Ionicons name="checkmark-circle" size={20} color="white" />
                          <ButtonText className="text-2xl font-bold text-white">Already Subscribed</ButtonText>
                        </HStack>
                      ) : (
                        <ButtonText className="text-2xl font-bold text-white">Start 7-Day Trial</ButtonText>
                      )}
                    </Button>
                  </TouchableOpacity>

                  <View className="px-2">
                    <Text className="text-center text-xs text-gray-500">
                      1-week free trial, then {selectedPackage.product.priceString}. Auto-renews until canceled. Cancel
                      anytime in Settings {'>'} Apple ID {'>'} Subscriptions. By subscribing, you agree to our{' '}
                      <Text
                        className="text-sm text-tidit-primary underline"
                        onPress={() =>
                          Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/')
                        }
                      >
                        Terms of Use
                      </Text>{' '}
                      and{' '}
                      <Text
                        className="text-sm text-tidit-primary underline"
                        onPress={() => Linking.openURL('https://www.apple.com/legal/privacy/en-ww/')}
                      >
                        Privacy Policy
                      </Text>
                      .
                    </Text>
                  </View>
                </VStack>
              )}
            </>
          )}
        </Box>

        <Box className="">
          <Text className="text-center text-sm text-gray-500">Cancel anytime • Secure payment • Instant access</Text>
        </Box>

        {errorMessage && (
          <Box className="px-6">
            <Box className="mt-5 rounded-xl border border-red-500/50 bg-red-500/10 p-6">
              <HStack className="items-center justify-center gap-2">
                <Ionicons name="alert-circle" size={24} color="#ef4444" />
                <Text className="text-xl text-red-500">{errorMessage}</Text>
              </HStack>
            </Box>
          </Box>
        )}
      </ScrollView>
    </Box>
  )
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  benefitsContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  benefitsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  errorContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  errorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    flex: 1,
  },
  plansContainer: {
    paddingHorizontal: 20,
    gap: 20,
    paddingBottom: 20,
  },
  planCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  popularCard: {
    borderColor: '#e94560',
    borderWidth: 2,
    transform: [{ scale: 1.02 }],
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    backgroundColor: '#e94560',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  popularText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  trialBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ff6b35',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#ff6b35',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  trialText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  planTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  price: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
  },
  period: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 5,
  },
  featuresContainer: {
    gap: 10,
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    flex: 1,
  },
  selectButton: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#ff6b35',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  selectButtonDisabled: {
    opacity: 0.7,
  },
  selectButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  footer: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  alreadyProContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
    alignItems: 'center',
  },
  alreadyProBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginBottom: 10,
  },
  alreadyProText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  alreadyProSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  legalTextContainer: {
    marginTop: 16,
    paddingHorizontal: 8,
  },
  legalText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 16,
    textAlign: 'center',
  },
  linkText: {
    color: '#ff6b35',
    textDecorationLine: 'underline',
  },
})
