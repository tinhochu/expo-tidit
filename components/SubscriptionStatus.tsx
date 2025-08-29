import { useSubscription } from '@/context/SubscriptionContext'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

export const SubscriptionStatus = () => {
  const { isSubscribed, isLoading, customerInfo } = useSubscription()

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Checking subscription status...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Subscription Status: {isSubscribed ? 'Active' : 'Inactive'}</Text>
      {customerInfo && (
        <Text style={styles.text}>
          Active Entitlements: {Object.keys(customerInfo.entitlements.active).join(', ') || 'None'}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    margin: 16,
  },
  text: {
    fontSize: 16,
    marginBottom: 8,
  },
})
