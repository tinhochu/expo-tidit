# Subscription Context

This document explains how to use the Subscription Context in your Tidit app to check subscription status and manage premium features.

## Overview

The Subscription Context provides a centralized way to check if a user has an active subscription and access to premium features. It integrates with RevenueCat to manage subscription status.

## Setup

The Subscription Context is already set up in your app's root layout (`app/_layout.tsx`) and is available throughout the entire app.

## Usage

### Basic Subscription Check

```tsx
import { useSubscription } from '@/context/SubscriptionContext'

function MyComponent() {
  const { isSubscribed, isLoading } = useSubscription()

  if (isLoading) {
    return <Text>Loading subscription status...</Text>
  }

  return (
    <View>
      {isSubscribed ? <Text>You have premium access!</Text> : <Text>Upgrade to premium for more features</Text>}
    </View>
  )
}
```

### Check Specific Entitlements

```tsx
import { useSubscription } from '@/context/SubscriptionContext'

function MyComponent() {
  const { hasEntitlement, customerInfo } = useSubscription()

  // Check if user has a specific entitlement
  const hasProAccess = hasEntitlement('tidit Pro')
  const hasPremiumAccess = hasEntitlement('Premium Cats')

  return (
    <View>
      {hasProAccess && <Text>Pro features unlocked!</Text>}
      {hasPremiumAccess && <Text>Premium features unlocked!</Text>}
    </View>
  )
}
```

### Access Customer Info

```tsx
import { useSubscription } from '@/context/SubscriptionContext'

function MyComponent() {
  const { customerInfo, isSubscribed } = useSubscription()

  if (customerInfo) {
    console.log('Active entitlements:', customerInfo.entitlements.active)
    console.log('All purchases:', customerInfo.allPurchaseDates)
  }

  return (
    <View>
      <Text>Subscription active: {isSubscribed ? 'Yes' : 'No'}</Text>
    </View>
  )
}
```

### Refresh Subscription Status

```tsx
import { useSubscription } from '@/context/SubscriptionContext'

function MyComponent() {
  const { checkSubscriptionStatus, refreshOfferings } = useSubscription()

  const handlePurchaseComplete = async () => {
    // After a successful purchase, refresh the subscription status
    await checkSubscriptionStatus()
    await refreshOfferings()
  }

  return (
    <Button onPress={handlePurchaseComplete}>
      <Text>Complete Purchase</Text>
    </Button>
  )
}
```

## Available Properties

- `isSubscribed`: Boolean indicating if user has any active subscription
- `isLoading`: Boolean indicating if subscription status is being checked
- `customerInfo`: RevenueCat CustomerInfo object with subscription details
- `offerings`: Available subscription packages from RevenueCat
- `checkSubscriptionStatus()`: Function to manually refresh subscription status
- `refreshOfferings()`: Function to refresh available subscription packages
- `hasEntitlement(entitlementId)`: Function to check for specific entitlements

## Premium Feature Gating

Use the subscription context to gate premium features:

```tsx
function PremiumFeature() {
  const { isSubscribed } = useSubscription()

  if (!isSubscribed) {
    return (
      <View>
        <Text>This is a premium feature</Text>
        <Button onPress={() => router.push('/subscription')}>
          <Text>Upgrade Now</Text>
        </Button>
      </View>
    )
  }

  return (
    <View>
      <Text>Premium feature content here</Text>
    </View>
  )
}
```

## Integration with Existing Code

The subscription context replaces the need to manually call `Purchases.getCustomerInfo()` throughout your app. Instead of:

```tsx
// Old way - don't do this anymore
useEffect(() => {
  const checkSubscription = async () => {
    const customerInfo = await Purchases.getCustomerInfo()
    const hasAccess = typeof customerInfo.entitlements.active['tidit Pro'] !== 'undefined'
    setIsPremium(hasAccess)
  }
  checkSubscription()
}, [])
```

Use:

```tsx
// New way - use the context
const { isSubscribed } = useSubscription()
```

## Notes

- The context automatically checks subscription status when the app starts
- Subscription status is cached and only refreshed when needed
- All subscription-related logic is centralized in one place
- The context handles loading states and error cases automatically
