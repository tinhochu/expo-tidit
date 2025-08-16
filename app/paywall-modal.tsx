import EditScreenInfo from '@/components/EditScreenInfo'
import { Text, View } from '@/components/Themed'
import { Link, router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function PaywallModal() {
  const isPresented = router.canGoBack()

  return (
    <SafeAreaView className="flex-1 bg-orange-100">
      <View>
        <Text>Sign In Modal</Text>
        <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
        <View lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
        <EditScreenInfo path="app/modal.tsx" />

        {/* Use a light status bar on iOS to account for the black space above the modal */}
        <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
        {isPresented && <Link href="/">Dismiss modal</Link>}
      </View>
    </SafeAreaView>
  )
}
