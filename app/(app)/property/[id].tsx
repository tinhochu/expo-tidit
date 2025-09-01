import FontManager from '@/components/FontManager'
import ProBadge from '@/components/pro-badge'
import { TemplateRenderer, getTemplates } from '@/components/template-renderer'
import { Box } from '@/components/ui/box'
import { Button, ButtonText } from '@/components/ui/button'
import { FormControl, FormControlHelper, FormControlLabel, FormControlLabelText } from '@/components/ui/form-control'
import { Grid, GridItem } from '@/components/ui/grid'
import { Heading } from '@/components/ui/heading'
import { HStack } from '@/components/ui/hstack'
import { Input, InputField } from '@/components/ui/input'
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
import { Switch } from '@/components/ui/switch'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { useAuth } from '@/context/AuthContext'
import { useSubscription } from '@/context/SubscriptionContext'
import { processImage } from '@/lib/imageProcessor'
import { deletePost, ensureDefaultCanvas, getPostById, updatePost } from '@/lib/postService'
import { saveSkiaImageToPhotos } from '@/lib/saveSkiaImage'
import { getUserPrefs } from '@/lib/userService'
import { ColorPicker } from '@expo/ui/swift-ui'
import AntDesign from '@expo/vector-icons/AntDesign'
import { Canvas, Image as SkImage, useCanvasRef, useImage } from '@shopify/react-native-skia'
import * as ImagePicker from 'expo-image-picker'
import * as MediaLibrary from 'expo-media-library'
import { router, useLocalSearchParams } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import {
  ActionSheetIOS,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  useWindowDimensions,
} from 'react-native'
import Share, { Social } from 'react-native-share'

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
  const { isSubscribed } = useSubscription()
  const { width: screenWidth } = useWindowDimensions()
  const ref = useCanvasRef()
  const [data, setData] = useState<any>(null)
  const [imageUrl, setImageUrl] = useState<string>('')
  const [status, requestPermission] = MediaLibrary.usePermissions()
  const [templateStyle, setTemplateStyle] = useState<string>('classic')
  const [parsedCanvasData, setParsedCanvasData] = useState<any>(null)
  const [postType, setPostType] = useState<
    'JUST_SOLD' | 'JUST_LISTED' | 'JUST_RENTED' | 'OPEN_HOUSE' | 'UNDER_CONTRACT' | 'BACK_ON_MARKET' | 'LOADING'
  >('LOADING')
  const [isDownloading, setIsDownloading] = useState(false)

  // Helper function to check if postType is in a valid state
  const isValidPostType = (
    type: string
  ): type is 'JUST_SOLD' | 'JUST_LISTED' | 'JUST_RENTED' | 'OPEN_HOUSE' | 'UNDER_CONTRACT' | 'BACK_ON_MARKET' => {
    return type !== 'LOADING'
  }

  // Image picker function for custom photos
  const pickImage = async () => {
    // Check if user has premium access
    if (!isSubscribed) {
      Alert.alert(
        'Premium Feature',
        'Custom photo uploads are a premium feature. Upgrade to unlock this and other premium features!',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Upgrade Now',
            style: 'default',
            onPress: () => router.push(`/subscription?returnRoute=${encodeURIComponent(`/property/${id}`)}`),
          },
        ]
      )
      return
    }

    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your photo library.')
        return
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 5], // 4:5 aspect ratio to match canvas
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        const originalImageUri = result.assets[0].uri

        try {
          // Process and optimize the image using existing functionality
          const processedImage = await processImage(originalImageUri, {
            maxWidth: 800,
            maxHeight: 1000, // Allow for 4:5 aspect ratio
            quality: 0.85,
            format: 'auto',
            maintainAspectRatio: true,
          })

          // Use the optimized image
          setCustomImage(processedImage.uri)

          // Save optimized image to canvas in database
          try {
            const updatedCanvas = {
              ...canvas,
              customImage: processedImage.uri,
            }
            await updatePost(id as string, {
              canvas: JSON.stringify(updatedCanvas),
            })
            setCanvas(updatedCanvas)
          } catch (error) {
            console.error('Error saving custom image:', error)
          }
        } catch (processingError) {
          console.error('Error processing image:', processingError)
          // Fallback to original image if processing fails
          Alert.alert('Processing Failed', 'Using original image. Please try again.')
          setCustomImage(originalImageUri)

          // Save original image to canvas in database
          try {
            const updatedCanvas = {
              ...canvas,
              customImage: originalImageUri,
            }
            await updatePost(id as string, {
              canvas: JSON.stringify(updatedCanvas),
            })
            setCanvas(updatedCanvas)
          } catch (error) {
            console.error('Error saving custom image:', error)
          }
        }
      }
    } catch (error) {
      console.error('Error picking image:', error)
      Alert.alert('Error', 'Failed to pick image. Please try again.')
    }
  }

  // Function to remove custom image
  const removeCustomImage = async () => {
    setCustomImage(null)

    // Remove custom image from canvas in database
    try {
      const updatedCanvas = {
        ...canvas,
        customImage: null,
      }
      await updatePost(id as string, {
        canvas: JSON.stringify(updatedCanvas),
      })
      setCanvas(updatedCanvas)
    } catch (error) {
      console.error('Error removing custom image:', error)
    }
  }

  // Wrapper function to set custom text with premium check
  const setCustomTextWithPremiumCheck = (
    updater:
      | { mainHeading?: string; subHeading?: string; description?: string }
      | undefined
      | ((
          prev: { mainHeading?: string; subHeading?: string; description?: string } | undefined
        ) => { mainHeading?: string; subHeading?: string; description?: string } | undefined)
  ) => {
    if (!isSubscribed) {
      Alert.alert(
        'Premium Feature',
        'Custom text personalization is a premium feature. Upgrade to unlock this and other premium features!',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Upgrade Now',
            style: 'default',
            onPress: () => router.push(`/subscription?returnRoute=${encodeURIComponent(`/property/${id}`)}`),
          },
        ]
      )
      return
    }
    setCustomText(updater)
  }

  // Simplified post type options for the dropdown
  const postTypeOptions = [
    { value: 'JUST_SOLD', label: 'Just Sold' },
    { value: 'JUST_LISTED', label: 'Just Listed' },
    { value: 'JUST_RENTED', label: 'Just Rented' },
    { value: 'OPEN_HOUSE', label: 'Open House' },
    { value: 'UNDER_CONTRACT', label: 'Under Contract' },
    { value: 'BACK_ON_MARKET', label: 'Back on Market' },
  ]
  const [canvas, setCanvas] = useState<{
    primaryColor?: string
    template?: string
    showBrokerage?: boolean
    showRealtor?: boolean
    showPrice?: boolean
    priceText?: string
    customImage?: string | null
    showSignature?: boolean
    font?: string
  } | null>(null)
  const [userPrefs, setUserPrefs] = useState<any>(null)
  const [isLoadingUserPrefs, setIsLoadingUserPrefs] = useState<boolean>(true)
  const [showBrokerage, setShowBrokerage] = useState<boolean>(true) // Default to true (enabled)
  const [showRealtor, setShowRealtor] = useState<boolean>(true) // Default to true (enabled)
  const [showPrice, setShowPrice] = useState<boolean>(false) // Default to false (disabled)
  const [priceText, setPriceText] = useState<string>('') // Default to empty string
  const [customImage, setCustomImage] = useState<string | null>(null)
  const [showSignature, setShowSignature] = useState<boolean>(true) // Default to true (logo visible, switch ON)
  const [customText, setCustomText] = useState<
    { mainHeading?: string; subHeading?: string; description?: string } | undefined
  >(undefined)
  const [selectedFont, setSelectedFont] = useState<string>('playfair') // Default to Playfair font
  // Use the useImage hook with the actual image URL - provide fallback to prevent conditional hook calls
  const img = useImage(imageUrl || 'https://via.placeholder.com/400x300?text=Loading...')
  const customImg = useImage(customImage || '')

  useEffect(() => {
    if (!status?.granted) {
      requestPermission()
    }
  }, [status])

  // Load custom data after premium status is determined
  useEffect(() => {
    if (isSubscribed && parsedCanvasData) {
      // Load custom image if it exists
      if (parsedCanvasData.customImage) {
        setCustomImage(parsedCanvasData.customImage)
      }
      // Load custom text if it exists
      if (parsedCanvasData.customText) {
        setCustomText(parsedCanvasData.customText)
      }
    } else if (!isSubscribed) {
      // Clear custom data for non-premium users
      setCustomImage(null)
      setCustomText(undefined)
    }
  }, [isSubscribed, parsedCanvasData])

  // Removed the useEffect that was causing circular updates

  useEffect(() => {
    const fetchPropertyDetails = async () => {
      const propertyDetails = await getPostById(id as string)

      // Ensure the post has a default canvas with tidit logo
      await ensureDefaultCanvas(id as string)

      const parsedData = {
        ...propertyDetails,
        propInformation: JSON.parse(propertyDetails.propInformation),
      }
      setData(parsedData)

      let parsedCanvas = null
      if (propertyDetails?.canvas) {
        parsedCanvas = JSON.parse(propertyDetails?.canvas)
        setCanvas(parsedCanvas)
        // Load showBrokerage from canvas if it exists, otherwise default to true
        setShowBrokerage(parsedCanvas.showBrokerage !== undefined ? parsedCanvas.showBrokerage : true)
        setShowRealtor(parsedCanvas.showRealtor !== undefined ? parsedCanvas.showRealtor : true)
        // Load showPrice from canvas if it exists, otherwise default to false
        setShowPrice(parsedCanvas.showPrice !== undefined ? parsedCanvas.showPrice : false)
        // Load priceText from canvas if it exists, otherwise default to empty string
        setPriceText(parsedCanvas.priceText || '')
        // Store parsed canvas data for later loading (after premium status is determined)
        setParsedCanvasData(parsedCanvas)
        // Load showSignature from canvas if it exists, otherwise default to true
        setShowSignature(parsedCanvas.showSignature !== undefined ? parsedCanvas.showSignature : true)
        // Load font from canvas if it exists, otherwise default to 'inter'
        setSelectedFont(parsedCanvas.font || 'playfair')
      } else {
        // Set default canvas state if none exists
        // We'll set the primary color after fetching user preferences
        setCanvas({
          primaryColor: '#000000',
          showBrokerage: true,
          showRealtor: true,
          showPrice: false,
          priceText: '',
          showSignature: true, // Default to true (logo visible)
          font: 'playfair', // Default to Playfair font
        })
        setShowBrokerage(true)
        setShowRealtor(true)
        setShowPrice(false)
        setPriceText('')
        setShowSignature(true) // Default to true (logo visible)
        setCustomText(undefined)
        setSelectedFont('playfair')
      }

      const newPostType = propertyDetails.postType as
        | 'JUST_SOLD'
        | 'JUST_LISTED'
        | 'JUST_RENTED'
        | 'OPEN_HOUSE'
        | 'UNDER_CONTRACT'
        | 'BACK_ON_MARKET'

      setPostType(newPostType)

      // Reset templateStyle to a valid template
      const availableTemplates = getTemplates()
      if (availableTemplates.length > 0) {
        // Check if there's a saved template in the canvas
        const savedTemplate = parsedCanvas?.template
        const isValidSavedTemplate = availableTemplates.some((t) => t.value === savedTemplate)

        if (isValidSavedTemplate && savedTemplate) {
          setTemplateStyle(savedTemplate)
        } else {
          // Prefer 'classic' template if available, otherwise use first available
          const defaultTemplate = availableTemplates.find((t) => t.value === 'classic') || availableTemplates[0]
          setTemplateStyle(defaultTemplate.value)
        }
      }

      // Set the image URL for the useImage hook
      if (parsedData?.propInformation?.photos?.[0]?.href) {
        setImageUrl(parsedData.propInformation.photos[0].href.replace('.jpg', '-w1200_h1200.jpg'))
      }
    }

    fetchPropertyDetails()
  }, [])

  const fetchUserPrefs = useCallback(async () => {
    if (!user?.$id) return

    setIsLoadingUserPrefs(true)
    try {
      const userPrefs = await getUserPrefs(user.$id)
      setUserPrefs(userPrefs)

      // If we have user preferences with global primary color and no primary color is set in canvas, use the global primary color
      if (userPrefs?.globalPrimaryColor && canvas && !canvas.primaryColor) {
        const updatedCanvas = { ...canvas, primaryColor: userPrefs.globalPrimaryColor }
        setCanvas(updatedCanvas)

        // Also update the canvas in the database if this is a new post
        try {
          await updatePost(id as string, {
            canvas: JSON.stringify(updatedCanvas),
          })
        } catch (error) {
          console.error('Error updating canvas with global primary color:', error)
        }
      }
    } catch (error) {
      console.warn('Failed to fetch user preferences:', error)
      // Set empty object as fallback to prevent template errors
      setUserPrefs({})
    } finally {
      setIsLoadingUserPrefs(false)
    }
  }, [user?.$id, canvas, id])

  useEffect(() => {
    fetchUserPrefs()
  }, [fetchUserPrefs])

  // Save custom text to canvas when it changes
  useEffect(() => {
    if (customText && canvas && isSubscribed) {
      const updatedCanvas = { ...canvas, customText }
      setCanvas(updatedCanvas)

      // Save to database
      const saveCustomText = async () => {
        try {
          await updatePost(id as string, {
            canvas: JSON.stringify(updatedCanvas),
          })
        } catch (error) {
          console.error('Error updating canvas with custom text:', error)
        }
      }

      saveCustomText()
    }
  }, [customText, isSubscribed])

  // Update templateStyle when postType changes to ensure we have a valid template
  useEffect(() => {
    if (isValidPostType(postType)) {
      const availableTemplates = getTemplates()

      if (availableTemplates.length > 0) {
        // Only update if current templateStyle is not valid for the new postType
        const isValidTemplate = availableTemplates.some((t) => t.value === templateStyle)

        if (!isValidTemplate) {
          // Prefer 'classic' template if available, otherwise use first available
          const defaultTemplate = availableTemplates.find((t) => t.value === 'classic') || availableTemplates[0]
          setTemplateStyle(defaultTemplate.value)
        }
      }
    }
  }, [postType, templateStyle])

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
    setIsDownloading(true)
    try {
      const image = ref.current?.makeImageSnapshot()
      if (image) {
        const slugifiedTitle = data?.title ? slugify(`tidit-${data.title}`) : `tidit-${Date.now()}`
        await saveSkiaImageToPhotos(image, { filename: slugifiedTitle, albumName: 'Tidit' })

        Alert.alert('Success', 'Canvas saved to image!')
      } else {
        Alert.alert('Error', 'Failed to save canvas')
      }
    } catch (error) {
      console.error('Error saving canvas:', error)
      Alert.alert('Error', 'Failed to save canvas')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleCanvasChange = async (key: string, value: string | boolean) => {
    const updatedCanvas = {
      ...canvas,
      [key]: value,
    }

    // Save the updated canvas
    try {
      await updatePost(id as string, { canvas: JSON.stringify(updatedCanvas) })
      // Only update local state after successful save
      setCanvas(updatedCanvas)
    } catch (error) {
      console.error('Error updating canvas:', error)
    }
  }

  // Get the label for the currently selected template
  const getSelectedTemplateLabel = () => {
    const templates = getTemplates()
    const selectedTemplate = templates.find((t) => t.value === templateStyle)
    return selectedTemplate?.label || 'Select a template'
  }

  // Handle font change with subscription check
  const handleFontChange = async (font: string) => {
    setSelectedFont(font)

    // Update canvas with new font
    if (canvas) {
      const updatedCanvas = { ...canvas, font }
      setCanvas(updatedCanvas)

      try {
        await updatePost(id as string, {
          canvas: JSON.stringify(updatedCanvas),
        })
      } catch (error) {
        console.error('Error updating canvas with font:', error)
      }
    }
  }

  // Handle signature toggle with subscription check
  const handleSignatureToggle = async (value: boolean) => {
    if (!value && !isSubscribed) {
      // User is trying to hide logo (switch OFF) but doesn't have premium
      Alert.alert(
        'Premium Feature',
        'Hiding the Tidit signature is a premium feature. Upgrade to unlock this and other premium features!',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Upgrade Now',
            style: 'default',
            onPress: () => router.push(`/subscription?returnRoute=${encodeURIComponent(`/property/${id}`)}`),
          },
        ]
      )
      return
    }

    // If user has premium or is showing logo (switch ON), proceed normally
    setShowSignature(value) // ON = show logo, OFF = hide logo
    handleCanvasChange('showSignature', value)
  }

  // Enhanced share functionality with platform-specific options
  const handleShare = async () => {
    // iOS Action Sheet
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ['Cancel', 'Share to Instagram', 'Share to Facebook', 'General Share', 'Download Image'],
        cancelButtonIndex: 0,
      },
      (buttonIndex) => {
        switch (buttonIndex) {
          case 1:
            shareToInstagram()
            break
          case 2:
            shareToFacebook()
            break
          case 3:
            generalShare()
            break
          case 4:
            handleSaveCanvas()
            break
        }
      }
    )
  }

  const shareToInstagram = async () => {
    try {
      // For Instagram, we need to share an image
      const image = ref.current?.makeImageSnapshot()
      if (image) {
        // Convert Skia image to base64
        const imageData = image.encodeToBase64()

        await Share.shareSingle({
          social: Social.Instagram,
          url: `data:image/png;base64,${imageData}`,
          type: 'image/*',
        })
      } else {
        // No fallback needed - just log error
        console.error('No image available for Instagram sharing')
      }
    } catch (error) {
      console.error('Error sharing to Instagram:', error)
      // No fallback needed
    }
  }

  const shareToFacebook = async () => {
    try {
      // For Facebook, we need to share an image just like Instagram
      const image = ref.current?.makeImageSnapshot()
      if (image) {
        // Convert Skia image to base64
        const imageData = image.encodeToBase64()

        await Share.shareSingle({
          social: Social.Facebook,
          url: `data:image/png;base64,${imageData}`,
          type: 'image/*',
        })
      } else {
        // No fallback needed - just log error
        console.error('No image available for Facebook sharing')
      }
    } catch (error) {
      console.error('Error sharing to Facebook:', error)
      // No fallback needed
    }
  }

  const generalShare = async () => {
    try {
      // For general share, we always share the image with a message
      const image = ref.current?.makeImageSnapshot()
      if (image) {
        // Convert Skia image to base64
        const imageData = image.encodeToBase64()

        const shareOptions = {
          title: 'Share Property',
          message: `Check out this amazing property!\n*${data?.title || 'Amazing Property'}*\n\nI created this with *tidit*, a real estate app that lets you create stunning property posts in minutes. Download it now!`,
          url: `data:image/png;base64,${imageData}`,
          type: 'image/*',
        }

        await Share.open(shareOptions)
      } else {
        // No fallback - just log error if no image available
        console.error('No image available for sharing')
      }
    } catch (error) {
      console.error('Error sharing:', error)
      // No fallback needed
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.select({ ios: 0, android: 0 })}
    >
      {/* Download Overlay */}
      {isDownloading && (
        <Box className="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <VStack className="items-center space-y-4 rounded-lg bg-white p-8">
            <AntDesign name="loading1" size={40} color="#3b82f6" className="animate-spin" />
            <Text className="text-lg font-semibold text-gray-800">Prepping your image...</Text>
          </VStack>
        </Box>
      )}

      <VStack>
        <Box className="border-b border-gray-200 bg-white p-2 px-5 pt-[72px]">
          <HStack className="items-center justify-between gap-5">
            <Pressable onPress={() => router.push('/')}>
              <AntDesign size={24} name="back" color="black" />
            </Pressable>
            <Heading size="sm">{data?.title ? data.title.slice(0, 25) + '...' : 'Fetching...'}</Heading>
            {img ? (
              <HStack className="gap-6">
                <Pressable onPress={handleShare}>
                  <AntDesign size={24} name="sharealt" color="blue" />
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
          {!img && !isValidPostType(postType) ? (
            <Box className="relative" style={{ width: screenWidth, height: screenWidth * 1.25 }}>
              <Box className="absolute inset-0 h-full w-full bg-gray-200" />

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
              {/* Use custom image if available, otherwise use property image */}
              {customImage && customImg ? (
                <SkImage image={customImg} x={0} y={0} width={screenWidth} height={screenWidth * 1.25} fit="cover" />
              ) : img ? (
                <SkImage image={img} x={0} y={0} width={screenWidth} height={screenWidth * 1.25} fit="cover" />
              ) : (
                // Show loading skeleton when no image is available
                <Box className="absolute inset-0 bg-gray-200" />
              )}
              {isLoadingUserPrefs || !data ? (
                <Box className="absolute inset-0 flex items-center justify-center bg-white">
                  <Box className="h-10 w-32 rounded bg-gray-200" />
                </Box>
              ) : (
                <TemplateRenderer
                  key={`${postType}-${templateStyle}-${selectedFont}`}
                  postType={postType}
                  template={templateStyle}
                  data={data}
                  canvas={canvas}
                  userPrefs={userPrefs || {}}
                  showBrokerage={showBrokerage}
                  showRealtor={showRealtor}
                  showSignature={showSignature}
                  customText={customText}
                  selectedFont={selectedFont}
                />
              )}
            </Canvas>
          )}

          <VStack className="px-5 pb-8 pt-5" space="2xl">
            {canvas && isValidPostType(postType) && (
              <>
                <Grid _extra={{ className: 'grid-cols-2' }}>
                  <GridItem _extra={{ className: 'col-span-1' }}>
                    <FormControl className="pr-2">
                      <FormControlLabel>
                        <FormControlLabelText className="font-bold">Select a Post Type</FormControlLabelText>
                      </FormControlLabel>
                      <Select
                        className="bg-white"
                        onValueChange={async (value) => {
                          const newPostType = value as
                            | 'JUST_SOLD'
                            | 'JUST_LISTED'
                            | 'JUST_RENTED'
                            | 'OPEN_HOUSE'
                            | 'UNDER_CONTRACT'
                            | 'BACK_ON_MARKET'

                          setPostType(newPostType)

                          // Update templateStyle to match the first available template
                          const availableTemplates = getTemplates()

                          if (availableTemplates.length > 0) {
                            // Prefer 'classic' template if available, otherwise use first available
                            const defaultTemplate =
                              availableTemplates.find((t) => t.value === 'classic') || availableTemplates[0]
                            const newTemplateStyle = defaultTemplate.value

                            setTemplateStyle(newTemplateStyle)

                            // Update the post type and template in the database
                            try {
                              await updatePost(id as string, {
                                postType: newPostType,
                                canvas: JSON.stringify({
                                  ...canvas,
                                  template: newTemplateStyle,
                                }),
                              })
                            } catch (error) {
                              console.error('Error updating post type and template:', error)
                            }
                          } else {
                            // Update just the post type in the database
                            try {
                              await updatePost(id as string, {
                                postType: newPostType,
                              })
                            } catch (error) {
                              console.error('Error updating post type:', error)
                            }
                          }
                        }}
                        defaultValue={postType}
                      >
                        <SelectTrigger>
                          <SelectInput
                            value={postTypeOptions.find((opt) => opt.value === postType)?.label || 'Select post type'}
                            className="flex-1"
                          />
                          <AntDesign name="down" size={15} className="mr-3" />
                        </SelectTrigger>
                        <SelectPortal>
                          <SelectBackdrop />
                          <SelectContent className="pb-10">
                            <SelectDragIndicatorWrapper>
                              <SelectDragIndicator />
                            </SelectDragIndicatorWrapper>
                            {postTypeOptions.map((option) => (
                              <SelectItem key={option.value} label={option.label} value={option.value} />
                            ))}
                          </SelectContent>
                        </SelectPortal>
                      </Select>
                    </FormControl>
                  </GridItem>
                  <GridItem _extra={{ className: 'col-span-1' }}>
                    {isValidPostType(postType) && (
                      <FormControl className="pl-2">
                        <FormControlLabel>
                          <FormControlLabelText className="font-bold">Select a Template</FormControlLabelText>
                        </FormControlLabel>
                        <Select
                          key={`template-select-${postType}`}
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
                              {getTemplates()?.map((template) => (
                                <SelectItem key={template.value} label={template.label} value={template.value} />
                              ))}
                            </SelectContent>
                          </SelectPortal>
                        </Select>
                      </FormControl>
                    )}
                  </GridItem>
                </Grid>

                {/* Font Manager - Premium Feature */}
                <Grid _extra={{ className: 'grid-cols-1' }}>
                  <GridItem _extra={{ className: 'col-span-1' }}>
                    <FontManager
                      selectedFont={selectedFont}
                      onFontChange={handleFontChange}
                      isPremium={isSubscribed}
                      onUpgradeClick={() =>
                        router.push(`/subscription?returnRoute=${encodeURIComponent(`/property/${id}`)}`)
                      }
                    />
                  </GridItem>
                </Grid>

                <HStack className="flex items-center justify-between">
                  <Heading size="sm">Select a Primary Color</Heading>
                  <HStack space="xs" className="items-end gap-4">
                    <ColorPicker
                      key={canvas.primaryColor || 'default'} // Force re-render when color changes
                      selection={canvas.primaryColor || '#3b82f6'}
                      onValueChanged={(color) => handleCanvasChange('primaryColor', color)}
                      supportsOpacity={false}
                    />
                    <Button
                      size="xs"
                      variant="outline"
                      onPress={() => {
                        if (userPrefs?.globalPrimaryColor) {
                          // Update local state immediately for better UX
                          const updatedCanvas = { ...canvas, primaryColor: userPrefs.globalPrimaryColor }
                          setCanvas(updatedCanvas)
                          // Then save to database
                          handleCanvasChange('primaryColor', userPrefs.globalPrimaryColor)
                        } else {
                          console.log('No global primary color found in userPrefs:', userPrefs)
                        }
                      }}
                      className="mt-2"
                      action="negative"
                      isDisabled={!userPrefs?.globalPrimaryColor}
                    >
                      <ButtonText className="text-red-500">Reset</ButtonText>
                    </Button>
                  </HStack>
                </HStack>

                <Grid _extra={{ className: 'grid-cols-2 mb-2' }}>
                  <GridItem _extra={{ className: 'col-span-1' }}>
                    <HStack space="md" className="items-center">
                      <Switch
                        size="md"
                        isDisabled={false} // Enabled for all users
                        trackColor={{ false: '#333333', true: '#3b82f6' }}
                        ios_backgroundColor="#333333"
                        thumbColor="#fafafa"
                        onValueChange={(value) => {
                          setShowBrokerage(value)
                          handleCanvasChange('showBrokerage', value)
                        }}
                        value={showBrokerage}
                      />
                      <Text>Show Brokerage</Text>
                    </HStack>
                  </GridItem>
                  <GridItem _extra={{ className: 'col-span-1' }}>
                    <HStack space="md" className="items-center">
                      <Switch
                        size="md"
                        isDisabled={false}
                        trackColor={{ false: '#3b82f6', true: '#3b82f6' }}
                        ios_backgroundColor="#333333"
                        thumbColor="#fafafa"
                        onValueChange={(value) => {
                          setShowRealtor(value)
                          handleCanvasChange('showRealtor', value)
                        }}
                        value={showRealtor}
                      />
                      <Text>Show Realtor</Text>
                    </HStack>
                  </GridItem>
                </Grid>

                <Grid _extra={{ className: 'grid-cols-2' }}>
                  <GridItem _extra={{ className: 'col-span-1' }}>
                    <HStack space="md" className="items-center">
                      <HStack space="md" className="items-center">
                        <Switch
                          size="md"
                          isDisabled={false}
                          trackColor={{ false: '#3b82f6', true: '#3b82f6' }}
                          ios_backgroundColor="#333333"
                          thumbColor="#fafafa"
                          onValueChange={(value) => {
                            setShowPrice(value)
                            handleCanvasChange('showPrice', value)
                          }}
                          value={showPrice}
                        />
                        <Text>Show Price</Text>
                      </HStack>
                    </HStack>
                  </GridItem>

                  <GridItem _extra={{ className: 'col-span-1' }}>
                    <Input className="bg-white" isDisabled={!showPrice}>
                      <InputField
                        placeholder="Enter Your Price"
                        value={priceText}
                        onChangeText={(text) => {
                          setPriceText(text)
                          handleCanvasChange('priceText', text)
                        }}
                      />
                    </Input>
                  </GridItem>
                </Grid>

                {/* Signature Toggle - Premium Feature */}
                <Grid _extra={{ className: 'grid-cols-1 mb-2' }}>
                  <GridItem _extra={{ className: 'col-span-1' }}>
                    <HStack space="md" className="items-center">
                      <Switch
                        size="md"
                        isDisabled={false} // Enabled for all users
                        trackColor={{ false: '#333333', true: '#3b82f6' }}
                        ios_backgroundColor="#333333"
                        thumbColor="#fafafa"
                        onValueChange={handleSignatureToggle}
                        value={showSignature} // ON = show logo, OFF = hide logo
                      />
                      <Text>
                        Show tidit Logo <ProBadge />
                      </Text>
                    </HStack>
                  </GridItem>
                </Grid>

                {/* Custom Image Upload Section */}
                {isSubscribed ? (
                  <VStack className="pt-5">
                    <Heading size="sm">
                      Custom Property Photo <ProBadge />
                    </Heading>
                    <Text className="text-gray-600">
                      {customImage ? 'Custom photo selected' : 'Use your own photo instead of the property photo'}
                    </Text>

                    <Box className="mt-3 rounded-md border border-2 border-dashed border-gray-600 p-5 py-6">
                      {customImage ? (
                        <Button size="lg" onPress={removeCustomImage} className="border-red-500">
                          <ButtonText className="text-red-500">Remove</ButtonText>
                        </Button>
                      ) : (
                        <Button size="lg" onPress={pickImage} className="bg-blue-500">
                          <ButtonText>Upload Property Photo</ButtonText>
                        </Button>
                      )}
                    </Box>
                  </VStack>
                ) : (
                  <VStack className="pt-5">
                    <Heading size="sm">
                      Custom Property Photo <ProBadge />
                    </Heading>
                    <Text className="text-gray-600">Use your own photo instead of the property photo</Text>
                    <Box className="mt-3 rounded-lg border border-gray-300 bg-gray-50 p-4">
                      <Text className="text-center text-gray-600">
                        Upgrade to Premium to unlock custom photo uploads for your posts!
                      </Text>
                      <Button
                        size="md"
                        className="mt-3 bg-blue-500"
                        onPress={() =>
                          router.push(`/subscription?returnRoute=${encodeURIComponent(`/property/${id}`)}`)
                        }
                      >
                        <ButtonText>Upgrade to Premium</ButtonText>
                      </Button>
                    </Box>
                  </VStack>
                )}

                {/* Custom Text Customization */}
                {isSubscribed ? (
                  <VStack space="md" className="pb-40">
                    <Heading size="sm">
                      Personalize Your Post <ProBadge />
                    </Heading>
                    <FormControl>
                      <FormControlLabel>
                        <FormControlLabelText>
                          Main Heading <Text size="xs">(optional)</Text>
                        </FormControlLabelText>
                      </FormControlLabel>
                      <Input className="bg-white">
                        <InputField
                          placeholder="Leave empty to use default post type text"
                          value={customText?.mainHeading || ''}
                          onChangeText={(text) => {
                            setCustomTextWithPremiumCheck((prev) => ({ ...prev, mainHeading: text }))
                          }}
                        />
                      </Input>
                      <FormControlHelper className="mt-2 block">
                        <Text size="sm">This will override the main heading. if it is set.</Text>
                      </FormControlHelper>
                    </FormControl>

                    <FormControl>
                      <FormControlLabel>
                        <FormControlLabelText>
                          Sub Heading <Text size="xs">(optional)</Text>
                        </FormControlLabelText>
                      </FormControlLabel>
                      <Input className="bg-white">
                        <InputField
                          placeholder="Add a subtitle or additional text"
                          value={customText?.subHeading || ''}
                          onChangeText={(text) => {
                            setCustomTextWithPremiumCheck((prev) => ({ ...prev, subHeading: text }))
                          }}
                        />
                      </Input>
                      <FormControlHelper className="mt-2 block">
                        <Text size="sm">This will override the price text. if it is set.</Text>
                      </FormControlHelper>
                    </FormControl>
                  </VStack>
                ) : (
                  <VStack space="md" className="pb-40">
                    <Heading size="sm">
                      Personalize Your Post <ProBadge />
                    </Heading>
                    <Box className="rounded-lg border border-gray-300 bg-gray-50 p-4">
                      <Text className="text-center text-gray-600">
                        Upgrade to Premium to unlock custom text personalization for your posts!
                      </Text>
                      <Button
                        size="md"
                        className="mt-3 bg-blue-500"
                        onPress={() =>
                          router.push(`/subscription?returnRoute=${encodeURIComponent(`/property/${id}`)}`)
                        }
                      >
                        <ButtonText>Upgrade to Premium</ButtonText>
                      </Button>
                    </Box>
                  </VStack>
                )}

                {/* TODO: End of the form, don't remove this */}
                <Grid _extra={{ className: 'grid-cols-1 gap-5' }}>
                  <GridItem _extra={{ className: 'col-span-1' }}>
                    <Box className="aspect-video w-full"></Box>
                  </GridItem>
                </Grid>
              </>
            )}
          </VStack>
        </ScrollView>
      </VStack>
    </KeyboardAvoidingView>
  )
}
