import { HStack } from '@/components/ui/hstack'
import { Image } from '@/components/ui/image'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { useLocalSearchParams } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Purchases, { PurchasesOfferings, PurchasesPackage } from 'react-native-purchases'

const SubscriptionPlan = ({
  title,
  price,
  period,
  features,
  isPopular,
  onPress,
}: {
  title: string
  price: string
  period: string
  features: string[]
  isPopular?: boolean
  onPress: () => void
}) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
    <View style={[styles.planCard, isPopular && styles.popularCard]}>
      {isPopular && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularText}>MOST POPULAR</Text>
        </View>
      )}

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
        style={styles.selectButton}
      >
        <Text style={styles.selectButtonText}>Get Pro Now</Text>
      </LinearGradient>
    </View>
  </TouchableOpacity>
)

export default function SubscriptionScreen() {
  const { returnRoute } = useLocalSearchParams<{ returnRoute?: string }>()
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null)

  useEffect(() => {
    getOfferings()
  }, [])

  const handleSubscribe = async (pkg: PurchasesPackage) => {
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg)
      if (typeof customerInfo.entitlements.active['tidit Pro'] !== 'undefined') {
        // If we have a return route, go back there, otherwise go to home
        if (returnRoute) {
          router.push(returnRoute as any)
        } else {
          router.push('/')
        }
      }
    } catch (e) {
      console.log('📢 error', e)
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

  async function getOfferings() {
    const offerings = await Purchases.getOfferings()
    if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
      setOfferings(offerings)
    }
    console.log('📢 offerings', JSON.stringify(offerings, null, 2))
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
            <Image source={require('@/assets/images/splash-icon-light.png')} className="h-16 w-16 pb-6" />
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

        <View style={styles.plansContainer}>
          {offerings?.current?.availablePackages.map((pkg) => (
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
              ]}
              onPress={() => handleSubscribe(pkg)}
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
})
