import { Box } from '@/components/ui/box'
import { Heading } from '@/components/ui/heading'
import { HStack } from '@/components/ui/hstack'
import { VStack } from '@/components/ui/vstack'
import { deletePost, getPostById } from '@/lib/postService'
import AntDesign from '@expo/vector-icons/AntDesign'
import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView } from 'react-native'

export default function PropertyDetails() {
  const { id } = useLocalSearchParams()
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    const fetchPropertyDetails = async () => {
      const propertyDetails = await getPostById(id as string)
      setData(propertyDetails)
    }
    fetchPropertyDetails()
  }, [])

  const handleDelete = () => {
    Alert.alert('Delete Post', 'Are you sure you want to delete this post? This action cannot be undone.', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePost(id as string)
            router.back()
          } catch (error) {
            console.error('Error deleting post:', error)
            Alert.alert('Error', 'Failed to delete post. Please try again.')
          }
        },
      },
    ])
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

        <ScrollView></ScrollView>
      </VStack>
    </KeyboardAvoidingView>
  )
}
