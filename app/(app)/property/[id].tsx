import TemplateRenderer from '@/components/template-renderer'
import { Box } from '@/components/ui/box'
import { Heading } from '@/components/ui/heading'
import { HStack } from '@/components/ui/hstack'
import { VStack } from '@/components/ui/vstack'
import { deletePost, getPostById } from '@/lib/postService'
import { Template } from '@/types/templates'
import AntDesign from '@expo/vector-icons/AntDesign'
import * as MediaLibrary from 'expo-media-library'
import { router, useLocalSearchParams } from 'expo-router'
import * as Sharing from 'expo-sharing'
import { useEffect, useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native'

export default function PropertyDetails() {
  const { id } = useLocalSearchParams()
  const [data, setData] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    ;(async () => {
      const propertyDetails = await getPostById(id as string)
      setData(propertyDetails)
    })()
  }, [id])

  const handleDelete = () => {
    Alert.alert('Delete Post', 'Are you sure you want to delete this post? This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePost(id as string)
            router.back()
          } catch (e) {
            console.error(e)
            Alert.alert('Error', 'Failed to delete post. Please try again.')
          }
        },
      },
    ])
  }

  // Map your record -> tokens & assets
  const tokens = data
    ? {
        ADDRESS: data.addressLine1 || data.address || '',
        CITY_STATE: [data.city, data.state].filter(Boolean).join(', '),
        PRICE: data.priceFormatted || data.price || '',
        BEDS: String(data.beds ?? ''),
        BATHS: String(data.baths ?? ''),
        SQFT: String(data.sqft ?? ''),
      }
    : {}

  const assets = {
    background: data?.heroImageUrl || data?.imageUrl || '', // e.g. your chosen OG:image
    headshot: data?.agent?.photoUrl || '',
    logo: data?.agent?.brokerageLogoUrl || '',
  }

  async function exportAndShare() {
    try {
      setSaving(true)
      // Since TemplateRenderer doesn't support onReady, we'll show a message
      // To implement actual export, you'd need to modify TemplateRenderer to expose a snapshot method
      Alert.alert(
        'Export',
        'Export functionality requires TemplateRenderer to support snapshot methods. For now, you can take a screenshot of the preview.'
      )
    } catch (e: any) {
      Alert.alert('Export failed', String(e?.message ?? e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.select({ ios: 64, android: 0 })}
    >
      <VStack className="min-h-screen">
        <Box className="border-b border-gray-200 bg-white p-2 px-5 pt-[72px]">
          <HStack className="items-center justify-between gap-5">
            <Pressable onPress={() => router.back()}>
              <AntDesign size={24} name="back" color="black" />
            </Pressable>
            <Heading size="sm">{data?.title ? data.title.slice(0, 25) + '...' : 'Fetching...'}</Heading>
            <Pressable onPress={handleDelete}>
              <AntDesign size={24} name="delete" color="red" />
            </Pressable>
          </HStack>
        </Box>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
          {!data && <Text>Loading...</Text>}

          {!!data && (
            <>
              <View style={{ alignItems: 'center' }}>
                {/* Render at 2× internally, but displayed smaller on-screen */}
                <TemplateRenderer
                  template={TEMPLATE_JUST_LISTED}
                  data={tokens as Record<string, string>}
                  assets={assets}
                  scale={2}
                />
              </View>

              <Pressable
                onPress={exportAndShare}
                style={{
                  backgroundColor: '#111',
                  padding: 14,
                  borderRadius: 10,
                  alignItems: 'center',
                  opacity: saving ? 0.6 : 1,
                }}
                disabled={saving}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>{saving ? 'Processing…' : 'Export PNG'}</Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </VStack>
    </KeyboardAvoidingView>
  )
}
