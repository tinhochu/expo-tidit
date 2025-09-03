import { HStack } from '@/components/ui/hstack'
import { Image } from '@/components/ui/image'
import { useSubscription } from '@/context/SubscriptionContext'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { useLocalSearchParams } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Purchases, { PurchasesPackage } from 'react-native-purchases'

const SubscriptionPlan = ({
  title,
  price,
  period,
  features,
  isPopular,
  onPress,
  isLoading = false,
  isAlreadyPro = false,
}: {
  title: string
  price: string
  period: string
  features: string[]
  isPopular?: boolean
  onPress: () => void
  isLoading?: boolean
  isAlreadyPro?: boolean
}) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.8} disabled={isLoading || isAlreadyPro}>
    <View style={[styles.planCard, isPopular && styles.popularCard]}>
      {isPopular && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularText}>MOST POPULAR</Text>
        </View>
      )}

      <View style={styles.trialBadge}>
        <Text style={styles.trialText}>1 WEEK TRIAL</Text>
      </View>

      <Text style={styles.planTitle}>{title}</Text>
      <View style={styles.priceContainer}>
        <Text style={styles.price}>{price}</Text>
        <Text style={styles.period}>/{period}</Text>
      </View>

      <View style={styles.featuresContainer}>
        {features.map((feature, index) => (
          <View key={index} style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={20} color="#4ade80" />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>

      <LinearGradient
        colors={isPopular ? ['#ff6b35', '#f7931e', '#ffd700'] : ['#ff6b35', '#f7931e', '#ffd700']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.selectButton, (isLoading || isAlreadyPro) && styles.selectButtonDisabled]}
      >
        {isLoading ? (
          <HStack className="items-center gap-2">
            <ActivityIndicator size="small" color="white" />
            <Text style={styles.selectButtonText}>Processing...</Text>
          </HStack>
        ) : isAlreadyPro ? (
          <HStack className="items-center gap-2">
            <Ionicons name="checkmark-circle" size={20} color="white" />
            <Text style={styles.selectButtonText}>Already Subscribed</Text>
          </HStack>
        ) : (
          <Text style={styles.selectButtonText}>Start Free Trial</Text>
        )}
      </LinearGradient>
    </View>
  </TouchableOpacity>
)

export default function SubscriptionScreen() {
  const { returnRoute } = useLocalSearchParams<{ returnRoute?: string }>()
  const { offerings, isSubscribed, checkSubscriptionStatus } = useSubscription()
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    checkSubscriptionStatus()
  }, [checkSubscriptionStatus])

  const handleSubscribe = async (pkg: PurchasesPackage) => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      console.log('Starting purchase for package:', pkg.identifier)

      const { customerInfo } = await Purchases.purchasePackage(pkg)

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
    <LinearGradient colors={['#000000', '#1a1a1a', '#404040']} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackNavigation} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="white" />
          </TouchableOpacity>

          <HStack className="items-center justify-center gap-2">
            <Text style={styles.title}>Unlock</Text>
            <Image
              source={require('@/assets/images/splash-icon-light.png')}
              className="h-16 w-16 pb-6"
              alt="Tidit Logo"
            />
            <Text style={styles.title}>Pro</Text>
          </HStack>

          <Text style={styles.subtitle}>Unlock premium features for your real estate success</Text>
        </View>

        <View style={styles.benefitsContainer}>
          <Text style={styles.benefitsTitle}>What You&apos;ll Get:</Text>
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Ionicons name="infinite" size={24} color="#ffffff" />
              <Text style={styles.benefitText}>Unlimited Posts Creation</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="sparkles" size={24} color="#ffffff" />
              <Text style={styles.benefitText}>Customize your posts</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="heart" size={24} color="#ffffff" />
              <Text style={styles.benefitText}>Remove Our Logo from your posts</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="lock-open" size={24} color="#ffffff" />
              <Text style={styles.benefitText}>Unlock all templates</Text>
            </View>
          </View>
        </View>

        {errorMessage && (
          <View style={styles.errorContainer}>
            <View style={styles.errorBadge}>
              <Ionicons name="alert-circle" size={24} color="#ef4444" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          </View>
        )}

        {isSubscribed && (
          <View style={styles.alreadyProContainer}>
            <View style={styles.alreadyProBadge}>
              <Ionicons name="checkmark-circle" size={24} color="#4ade80" />
              <Text style={styles.alreadyProText}>You already have Pro access!</Text>
            </View>
            <Text style={styles.alreadyProSubtext}>Enjoy all the premium features</Text>
          </View>
        )}

        <View style={styles.plansContainer}>
          {offerings?.availablePackages?.map((pkg: any) => (
            <SubscriptionPlan
              key={pkg.identifier}
              title={pkg.product.title}
              price={pkg.product.priceString}
              period={pkg.packageType.toLowerCase()}
              features={[
                'Unlock all templates',
                'Customize your posts',
                'Unlimited Templates',
                'Remove Our Logo from your posts',
                'Auto brand colors & logo',
                'One-tap exports',
              ]}
              onPress={() => handleSubscribe(pkg)}
              isLoading={isLoading}
              isAlreadyPro={isSubscribed}
            />
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Cancel anytime • Secure payment • Instant access</Text>
        </View>
      </ScrollView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
    color: 'rgba(255, 255, 255, 0.7)',
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
})
