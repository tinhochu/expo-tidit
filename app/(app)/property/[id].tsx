import TplParagraph from '@/components/template-parts/paragraph'
import { Box } from '@/components/ui/box'
import { Heading } from '@/components/ui/heading'
import { HStack } from '@/components/ui/hstack'
import { Skeleton } from '@/components/ui/skeleton'
import { VStack } from '@/components/ui/vstack'
import { deletePost, getPostById } from '@/lib/postService'
import { saveSkiaImageToPhotos } from '@/lib/saveSkiaImage'
import AntDesign from '@expo/vector-icons/AntDesign'
import {
  Canvas,
  Group,
  ImageSVG,
  Image as SkImage,
  fitbox,
  rect,
  useCanvasRef,
  useImage,
  useSVG,
} from '@shopify/react-native-skia'
import * as MediaLibrary from 'expo-media-library'
import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, useWindowDimensions } from 'react-native'

// Simple slugify function to convert title to safe filename
const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim()
}

export default function PropertyDetails() {
  const { id } = useLocalSearchParams()
  const { width: screenWidth } = useWindowDimensions()
  const ref = useCanvasRef()
  const [data, setData] = useState<any>(null)
  const [imageUrl, setImageUrl] = useState<string>('')
  const [status, requestPermission] = MediaLibrary.usePermissions()
  const svg = useSVG(require('@/assets/images/just-listed.svg'))

  useEffect(() => {
    if (!status?.granted) {
      requestPermission()
    }
  }, [status])

  // Use the useImage hook with the actual image URL
  const img = useImage(imageUrl)

  useEffect(() => {
    const fetchPropertyDetails = async () => {
      const propertyDetails = await getPostById(id as string)
      const parsedData = {
        ...propertyDetails,
        propInformation: JSON.parse(propertyDetails.propInformation),
      }
      setData(parsedData)

      // Set the image URL for the useImage hook
      if (parsedData?.propInformation?.photos?.[0]?.href) {
        setImageUrl(parsedData.propInformation.photos[0].href.replace('.jpg', '-w1200_h1200.jpg'))
      }
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

  const handleSaveCanvas = async () => {
    const image = ref.current?.makeImageSnapshot()
    if (image) {
      const slugifiedTitle = data?.title ? slugify(`tidit-${data.title}`) : `tidit-${Date.now()}`
      await saveSkiaImageToPhotos(image, { filename: slugifiedTitle, albumName: 'Tidit' })

      Alert.alert('Success', 'Canvas saved to image!')
    } else {
      Alert.alert('Error', 'Failed to save canvas')
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
            {img ? (
              <HStack className="gap-3">
                <Pressable onPress={handleSaveCanvas}>
                  <AntDesign size={24} name="download" color="blue" />
                </Pressable>
                <Pressable onPress={handleDelete}>
                  <AntDesign size={24} name="delete" color="red" />
                </Pressable>
              </HStack>
            ) : (
              <HStack className="gap-3">
                <AntDesign size={24} name="loading1" color="blue" className="animate-spin" />
              </HStack>
            )}
          </HStack>
        </Box>

        <ScrollView>
          {!img ? (
            <Box style={{ width: screenWidth, height: screenWidth }}>
              <Skeleton className="h-full w-full" />
            </Box>
          ) : (
            <Canvas ref={ref} style={{ width: screenWidth, height: screenWidth, flex: 1 }}>
              {img && <SkImage image={img} x={0} y={0} width={screenWidth} height={screenWidth} fit="cover" />}

              {/* Center the SVG and scale it appropriately */}
              <Group
                transform={fitbox(
                  'contain',
                  rect(0, 0, svg?.width() || 945, svg?.height() || 113), // Source rect using actual SVG dimensions
                  rect(screenWidth * 0.1, screenWidth * 0.4, screenWidth * 0.8, screenWidth * 0.2) // Destination rect: centered with 10% margin on sides, 40% from top, 80% width, 20% height
                )}
              >
                <ImageSVG svg={svg} x={0} y={0} />
              </Group>
            </Canvas>
          )}
        </ScrollView>
      </VStack>
    </KeyboardAvoidingView>
  )
}
