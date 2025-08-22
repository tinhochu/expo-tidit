import { TemplateRenderer, getTemplates } from '@/components/template-renderer'
import { Box } from '@/components/ui/box'
import { FormControl, FormControlLabel, FormControlLabelText } from '@/components/ui/form-control'
import { Heading } from '@/components/ui/heading'
import { HStack } from '@/components/ui/hstack'
import {
  Select,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicator,
  SelectDragIndicatorWrapper,
  SelectInput,
  SelectItem,
  SelectPortal,
  SelectTrigger,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { VStack } from '@/components/ui/vstack'
import { useAuth } from '@/context/AuthContext'
import { deletePost, getPostById, updatePost } from '@/lib/postService'
import { saveSkiaImageToPhotos } from '@/lib/saveSkiaImage'
import { getUserPrefs } from '@/lib/userService'
import { ColorPicker } from '@expo/ui/swift-ui'
import AntDesign from '@expo/vector-icons/AntDesign'
import { Canvas, Image as SkImage, useCanvasRef, useImage } from '@shopify/react-native-skia'
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
  const { user } = useAuth()
  const { width: screenWidth } = useWindowDimensions()
  const ref = useCanvasRef()
  const [data, setData] = useState<any>(null)
  const [imageUrl, setImageUrl] = useState<string>('')
  const [status, requestPermission] = MediaLibrary.usePermissions()
  const [templateStyle, setTemplateStyle] = useState<string>('1')
  const [postType, setPostType] = useState<
    'JUST_SOLD' | 'JUST_LISTED' | 'JUST_RENTED' | 'OPEN_HOUSE' | 'UNDER_CONTRACT' | 'BACK_ON_MARKET' | 'LOADING'
  >('LOADING')
  const [canvas, setCanvas] = useState<{ primaryColor?: string; template?: string } | null>(null)
  const [userPrefs, setUserPrefs] = useState<any>(null)
  // Use the useImage hook with the actual image URL
  const img = useImage(imageUrl)

  useEffect(() => {
    if (!status?.granted) {
      requestPermission()
    }
  }, [status])

  useEffect(() => {
    const fetchPropertyDetails = async () => {
      const propertyDetails = await getPostById(id as string)
      const parsedData = {
        ...propertyDetails,
        propInformation: JSON.parse(propertyDetails.propInformation),
      }
      setData(parsedData)

      if (propertyDetails?.canvas) {
        const parsedCanvas = JSON.parse(propertyDetails?.canvas)
        setCanvas(parsedCanvas)
      } else {
        // Set default canvas state if none exists
        setCanvas({ primaryColor: '#000000' })
      }

      const newPostType = propertyDetails.postType as
        | 'JUST_SOLD'
        | 'JUST_LISTED'
        | 'JUST_RENTED'
        | 'OPEN_HOUSE'
        | 'UNDER_CONTRACT'
        | 'BACK_ON_MARKET'

      setPostType(newPostType)

      // Reset templateStyle to a valid template for the new post type
      const availableTemplates = getTemplates(newPostType)
      if (availableTemplates.length > 0) {
        setTemplateStyle(availableTemplates[0].value)
      }

      // Set the image URL for the useImage hook
      if (parsedData?.propInformation?.photos?.[0]?.href) {
        setImageUrl(parsedData.propInformation.photos[0].href.replace('.jpg', '-w1200_h1200.jpg'))
      }
    }

    fetchPropertyDetails()
  }, [])

  useEffect(() => {
    const fetchUserPrefs = async () => {
      const userPrefs = await getUserPrefs(user?.$id as string)
      setUserPrefs(userPrefs)
    }

    fetchUserPrefs()
  }, [user?.$id])

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

  const handleCanvasChange = async (key: string, value: string) => {
    const updatedCanvas = {
      ...canvas,
      [key]: value,
    }

    // Save the updated post first
    try {
      await updatePost(id as string, { canvas: JSON.stringify(updatedCanvas) })
      // Only update local state after successful save
      setCanvas(updatedCanvas)
    } catch (error) {
      console.error('Error updating post:', error)
    }
  }

  // Get the label for the currently selected template
  const getSelectedTemplateLabel = () => {
    const templates = getTemplates(postType)
    const selectedTemplate = templates.find((t) => t.value === templateStyle)
    return selectedTemplate?.label || 'Select a template'
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
          {!img && postType === 'LOADING' ? (
            <Box className="relative" style={{ width: screenWidth, height: screenWidth * 1.25 }}>
              <Skeleton className="absolute inset-0 h-full w-full" />

              <AntDesign
                name="loading1"
                size={50}
                color="white"
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              />
            </Box>
          ) : (
            <Canvas
              ref={ref}
              style={{
                width: screenWidth,
                height: screenWidth * 1.25, // 4:5 aspect ratio (1080x1350)
                flex: 1,
              }}
            >
              {img && <SkImage image={img} x={0} y={0} width={screenWidth} height={screenWidth * 1.25} fit="cover" />}
              <TemplateRenderer
                postType={postType}
                template={templateStyle}
                data={data}
                canvas={canvas}
                userPrefs={userPrefs}
              />
            </Canvas>
          )}

          <VStack className="p-5" space="2xl">
            {canvas && postType !== 'LOADING' && (
              <>
                {getTemplates(postType).length > 0 && (
                  <FormControl>
                    <FormControlLabel>
                      <FormControlLabelText className="font-bold">Select a template</FormControlLabelText>
                    </FormControlLabel>
                    <Select
                      className="bg-white"
                      onValueChange={(value) => {
                        setTemplateStyle(value)
                        handleCanvasChange('template', value)
                      }}
                      defaultValue={templateStyle}
                    >
                      <SelectTrigger>
                        <SelectInput value={getSelectedTemplateLabel()} className="flex-1" />
                        <AntDesign name="down" size={15} className="mr-3" />
                      </SelectTrigger>
                      <SelectPortal>
                        <SelectBackdrop />
                        <SelectContent className="pb-10">
                          <SelectDragIndicatorWrapper>
                            <SelectDragIndicator />
                          </SelectDragIndicatorWrapper>
                          {getTemplates(postType)?.map((template) => (
                            <SelectItem key={template.value} label={template.label} value={template.value} />
                          ))}
                        </SelectContent>
                      </SelectPortal>
                    </Select>
                  </FormControl>
                )}
                <HStack className="flex items-center justify-between">
                  <Heading size="sm">Select a primary color</Heading>
                  <ColorPicker
                    selection={canvas.primaryColor || '#fafafa'}
                    onValueChanged={(color) => handleCanvasChange('primaryColor', color)}
                    supportsOpacity={false}
                  />
                </HStack>
              </>
            )}
          </VStack>
        </ScrollView>
      </VStack>
    </KeyboardAvoidingView>
  )
}
