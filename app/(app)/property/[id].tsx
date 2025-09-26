import FontManager from '@/components/FontManager'
import CurrencySelector from '@/components/currency-selector'
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
import { BUCKET_ID, storage } from '@/lib/appwriteConfig'
import { processImage } from '@/lib/imageProcessor'
import { deletePost, ensureDefaultCanvas, getPostById, updatePost } from '@/lib/postService'
import { saveSkiaImageToPhotos } from '@/lib/saveSkiaImage'
import { getUserPrefs, updateUserPrefs } from '@/lib/userService'
import { ColorPicker, DateTimePicker, Host } from '@expo/ui/swift-ui'
import AntDesign from '@expo/vector-icons/AntDesign'
import { Canvas, Image as SkImage, useCanvasRef, useImage } from '@shopify/react-native-skia'
import * as ImagePicker from 'expo-image-picker'
import * as MediaLibrary from 'expo-media-library'
import { router, useLocalSearchParams } from 'expo-router'
import * as StoreReview from 'expo-store-review'
import { useCallback, useEffect, useState } from 'react'
import {
  ActionSheetIOS,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  useWindowDimensions,
} from 'react-native'
import { ID } from 'react-native-appwrite'
import { formatCurrency } from 'react-native-format-currency'
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

// Store review helper function with smart timing and user preference tracking
const requestStoreReview = async (userId: string) => {
  try {
    // Check if user has already been asked for a review recently
    const lastReviewRequest = (global as any).lastStoreReviewRequest
    const now = Date.now()
    const oneHour = 60 * 60 * 1000 // 1 hour in milliseconds

    // If we've requested a review in the last hour, skip it
    if (lastReviewRequest && now - lastReviewRequest < oneHour) {
      console.log('Store review already requested recently, skipping')
      return
    }

    // Check user preferences to see if they've already been asked
    const hasBeenAskedForReview = await checkUserReviewPreference(userId)
    if (hasBeenAskedForReview) {
      console.log('User has already been asked for review, skipping')
      return
    }

    // Try native store review first
    const isAvailable = await StoreReview.isAvailableAsync()

    if (isAvailable) {
      // Request the native store review
      await StoreReview.requestReview()
      console.log('Native store review requested successfully')

      // Mark that we've asked the user for a review
      await markUserReviewRequested(userId)
    } else {
      // Fallback to direct App Store link
      console.log('Native store review not available, using App Store link fallback')
      await openAppStoreForReview()

      // Mark that we've asked the user for a review
      await markUserReviewRequested(userId)
    }

    // Remember when we last requested a review (session-based)
    ;(global as any).lastStoreReviewRequest = now
  } catch (error) {
    console.error('Error requesting store review:', error)
    // If native API fails, try the fallback
    try {
      await openAppStoreForReview()
      await markUserReviewRequested(userId)
    } catch (fallbackError) {
      console.error('Fallback store review also failed:', fallbackError)
    }
  }
}

// Check if user has already been asked for a review (persistent across app sessions)
const checkUserReviewPreference = async (userId: string) => {
  try {
    if (!userId) return false

    // Check user preferences via userService
    const { getUserPrefs } = await import('@/lib/userService')
    const userPrefs = await getUserPrefs(userId)

    return userPrefs?.hasBeenAskedForReview || false
  } catch (error) {
    console.log('No user preferences found or error checking:', error)
    return false
  }
}

// Mark that we've asked the user for a review
const markUserReviewRequested = async (userId: string) => {
  try {
    if (!userId) return

    // Update user preferences via userService
    const { updateUserPrefs } = await import('@/lib/userService')

    await updateUserPrefs(userId, {
      hasBeenAskedForReview: true,
      reviewRequestDate: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    console.log('Marked user as having been asked for review')
  } catch (error) {
    console.error('Error marking user review request:', error)
  }
}

// Fallback function to open App Store directly (iOS only)
const openAppStoreForReview = async () => {
  const itunesItemId = 6751514675

  try {
    // Try direct App Store link first
    const directUrl = `itms-apps://itunes.apple.com/app/viewContentsUserReviews/id${itunesItemId}?action=write-review`
    const canOpen = await Linking.canOpenURL(directUrl)

    if (canOpen) {
      await Linking.openURL(directUrl)
      console.log('Opened App Store directly for review')
    } else {
      // Fallback to web URL
      const webUrl = `https://apps.apple.com/app/apple-store/id${itunesItemId}?action=write-review`
      await Linking.openURL(webUrl)
      console.log('Opened App Store via web URL for review')
    }
  } catch (error) {
    console.error('Error opening app store for review:', error)
    throw error
  }
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
    | 'JUST_SOLD'
    | 'JUST_LISTED'
    | 'JUST_RENTED'
    | 'OPEN_HOUSE'
    | 'UNDER_CONTRACT'
    | 'BACK_ON_MARKET'
    | 'COMING_SOON'
    | 'PRICE_DROP'
    | 'LOADING'
  >('LOADING')
  const [isDownloading, setIsDownloading] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [isCanvasLoading, setIsCanvasLoading] = useState(false)

  // Helper function to check if postType is in a valid state
  const isValidPostType = (
    type: string
  ): type is
    | 'JUST_SOLD'
    | 'JUST_LISTED'
    | 'JUST_RENTED'
    | 'OPEN_HOUSE'
    | 'UNDER_CONTRACT'
    | 'BACK_ON_MARKET'
    | 'COMING_SOON'
    | 'PRICE_DROP' => {
    return type !== 'LOADING'
  }

  // Image picker function for custom photos
  const pickImage = async () => {
    try {
      // Check photo limit for free users
      if (!isSubscribed) {
        try {
          const userPrefs = await getUserPrefs(user?.$id)
          const currentCount = userPrefs?.customPhotosCount || 0

          if (currentCount >= 5) {
            Alert.alert(
              'Photo Limit Reached',
              'You have reached the limit of 5 custom photos. Upgrade to Pro to upload unlimited photos!',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Upgrade', onPress: () => router.push('/subscription') },
              ]
            )
            return
          }
        } catch (error) {
          console.error('Error checking photo limit:', error)
          // Continue with upload if we can't check the limit
        }
      }

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

          // Upload processed image to Appwrite storage
          try {
            // Determine file extension and MIME type based on processed format
            const fileExtension = processedImage.format === 'jpeg' ? 'jpg' : processedImage.format
            const mimeType = fileExtension === 'jpg' ? 'image/jpeg' : `image/${fileExtension}`

            const response = await storage.createFile(BUCKET_ID, ID.unique(), {
              name: `${user?.$id}-custom-${id}-${Date.now()}.${fileExtension}`,
              type: mimeType,
              size: processedImage.size,
              uri: processedImage.uri,
            })

            // Get the uploaded image URL
            const uploadedImageUrl = `${process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!}/storage/buckets/${BUCKET_ID}/files/${response.$id}/view?project=${process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID}`

            // Use the uploaded image URL
            setCustomImage(uploadedImageUrl)

            // Save uploaded image URL to canvas in database
            const updatedCanvas = {
              ...canvas,
              customImage: uploadedImageUrl,
            }
            await updatePost(id as string, {
              canvas: JSON.stringify(updatedCanvas),
            })
            setCanvas(updatedCanvas)

            // Increment custom photos counter
            try {
              const userPrefs = await getUserPrefs(user?.$id)
              const currentCount = userPrefs?.customPhotosCount || 0
              const newCount = currentCount + 1
              await updateUserPrefs(user?.$id, {
                ...userPrefs,
                customPhotosCount: newCount,
              })
              // Update local state
              setCustomPhotosCount(newCount)
            } catch (counterError) {
              console.error('Error updating photo counter:', counterError)
              // Don't fail the image upload if counter update fails
            }
          } catch (uploadError) {
            console.error('Error uploading custom image:', uploadError)
            Alert.alert('Upload Failed', 'Failed to upload image. Please try again.')
          }
        } catch (processingError) {
          console.error('Error processing image:', processingError)
          // Fallback to original image if processing fails
          Alert.alert('Processing Failed', 'Using original image. Please try again.')

          // Upload original image to Appwrite storage
          try {
            // Determine file extension and MIME type for original image
            const fileExtension = 'jpg' // Default to jpg for original images
            const mimeType = 'image/jpeg'

            const response = await storage.createFile(BUCKET_ID, ID.unique(), {
              name: `${user?.$id}-custom-${id}-${Date.now()}.${fileExtension}`,
              type: mimeType,
              size: 0,
              uri: originalImageUri,
            })

            // Get the uploaded image URL
            const uploadedImageUrl = `${process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!}/storage/buckets/${BUCKET_ID}/files/${response.$id}/view?project=${process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID}`

            // Use the uploaded image URL
            setCustomImage(uploadedImageUrl)

            // Save uploaded image URL to canvas in database
            const updatedCanvas = {
              ...canvas,
              customImage: uploadedImageUrl,
            }
            await updatePost(id as string, {
              canvas: JSON.stringify(updatedCanvas),
            })
            setCanvas(updatedCanvas)

            // Increment custom photos counter
            try {
              const userPrefs = await getUserPrefs(user?.$id)
              const currentCount = userPrefs?.customPhotosCount || 0
              const newCount = currentCount + 1
              await updateUserPrefs(user?.$id, {
                ...userPrefs,
                customPhotosCount: newCount,
              })
              // Update local state
              setCustomPhotosCount(newCount)
            } catch (counterError) {
              console.error('Error updating photo counter:', counterError)
              // Don't fail the image upload if counter update fails
            }
          } catch (uploadError) {
            console.error('Error uploading original image:', uploadError)
            Alert.alert('Upload Failed', 'Failed to upload image. Please try again.')
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
    // Get the current custom image URL before removing it
    const currentCustomImageUrl = customImage

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

      // Delete the file from Appwrite storage if it exists
      if (currentCustomImageUrl && currentCustomImageUrl.includes('/storage/buckets/')) {
        try {
          // Extract file ID from the URL
          const urlParts = currentCustomImageUrl.split('/')
          const fileId = urlParts[urlParts.length - 2] // File ID is before the 'view' part

          await storage.deleteFile(BUCKET_ID, fileId)
          console.log('Custom image deleted from storage:', fileId)
        } catch (deleteError) {
          console.error('Error deleting custom image from storage:', deleteError)
          // Don't fail the removal if storage deletion fails
        }
      }

      // // Decrement custom photos counter
      // try {
      //   const userPrefs = await getUserPrefs(user?.$id)
      //   const currentCount = userPrefs?.customPhotosCount || 0
      //   const newCount = Math.max(0, currentCount - 1) // Ensure counter doesn't go below 0
      //   await updateUserPrefs(user?.$id, {
      //     ...userPrefs,
      //     customPhotosCount: newCount,
      //   })
      // } catch (counterError) {
      //   console.error('Error updating photo counter:', counterError)
      //   // Don't fail the image removal if counter update fails
      // }
    } catch (error) {
      console.error('Error removing custom image:', error)
    }
  }

  // Wrapper function to set custom text with Pro check
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
        'Pro Feature',
        'Custom text personalization is a Pro feature. Upgrade to unlock this and other Pro features!',
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
    { value: 'COMING_SOON', label: 'Coming Soon' },
    { value: 'PRICE_DROP', label: 'Price Drop' },
  ]
  const [canvas, setCanvas] = useState<{
    currency?: string
    primaryColor?: string
    secondaryColor?: string
    textColor?: string
    template?: string
    showBrokerage?: boolean
    showRealtor?: boolean
    showPrice?: boolean
    priceText?: string
    customImage?: string | null
    showSignature?: boolean
    font?: string
    openHouseString?: string
  } | null>(null)
  const [userPrefs, setUserPrefs] = useState<any>(null)
  const [isLoadingUserPrefs, setIsLoadingUserPrefs] = useState<boolean>(true)
  const [showBrokerage, setShowBrokerage] = useState<boolean>(true) // Default to true (enabled)
  const [showRealtor, setShowRealtor] = useState<boolean>(true) // Default to true (enabled)
  const [showPrice, setShowPrice] = useState<boolean>(false) // Default to false (disabled)
  const [priceText, setPriceText] = useState<string>('') // Default to empty string
  const [customImage, setCustomImage] = useState<string | null>(null)
  const [customPhotosCount, setCustomPhotosCount] = useState<number>(0)
  const [showSignature, setShowSignature] = useState<boolean>(true) // Default to true (logo visible, switch ON)
  const [customText, setCustomText] = useState<
    { mainHeading?: string; subHeading?: string; description?: string } | undefined
  >(undefined)
  const [selectedFont, setSelectedFont] = useState<string>('playfair') // Default to Playfair font
  // Helper function to round date to the nearest hour
  const roundToNearestHour = (date: Date): Date => {
    const rounded = new Date(date)
    rounded.setMinutes(0, 0, 0) // Set minutes, seconds, and milliseconds to 0
    return rounded
  }

  const [openHouseStartDate, setOpenHouseStartDate] = useState<Date>(() => roundToNearestHour(new Date()))
  const [openHouseEndDate, setOpenHouseEndDate] = useState<Date>(() => {
    const startDate = roundToNearestHour(new Date())
    return new Date(startDate.getTime() + 60 * 60 * 1000) // 1 hour after start date
  })
  // Use the useImage hook with the actual image URL - provide fallback to prevent conditional hook calls
  const img = useImage(imageUrl || 'https://via.placeholder.com/400x300?text=Loading...')
  const customImg = useImage(customImage || '')

  useEffect(() => {
    if (!status?.granted) {
      requestPermission()
    }
  }, [status])

  // Load custom data after canvas data is available
  useEffect(() => {
    if (parsedCanvasData) {
      // Load custom image if it exists (available for all users)
      if (parsedCanvasData.customImage) {
        setCustomImage(parsedCanvasData.customImage)
      }
      // Load custom text if it exists (Pro feature)
      if (parsedCanvasData.customText && isSubscribed) {
        setCustomText(parsedCanvasData.customText)
      }
    }
  }, [parsedCanvasData, isSubscribed])

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
        // Store parsed canvas data for later loading (after pro status is determined)
        setParsedCanvasData(parsedCanvas)
        // Load showSignature from canvas if it exists, otherwise default to true
        setShowSignature(parsedCanvas.showSignature !== undefined ? parsedCanvas.showSignature : true)
        // Load font from canvas if it exists, otherwise default to 'inter'
        setSelectedFont(parsedCanvas.font || 'playfair')
        // Load open house dates from canvas if they exist
        if (parsedCanvas.openHouseStartDate) {
          setOpenHouseStartDate(roundToNearestHour(new Date(parsedCanvas.openHouseStartDate)))
        }
        if (parsedCanvas.openHouseEndDate) {
          const endDate = roundToNearestHour(new Date(parsedCanvas.openHouseEndDate))
          const startDate = parsedCanvas.openHouseStartDate
            ? roundToNearestHour(new Date(parsedCanvas.openHouseStartDate))
            : roundToNearestHour(new Date())

          // Ensure end date is not equal to start date
          if (endDate.getTime() === startDate.getTime()) {
            setOpenHouseEndDate(new Date(startDate.getTime() + 60 * 60 * 1000)) // Add 1 hour
          } else {
            setOpenHouseEndDate(endDate)
          }
        }

        // Generate open house string if both dates exist
        if (parsedCanvas.openHouseStartDate && parsedCanvas.openHouseEndDate) {
          const startDate = roundToNearestHour(new Date(parsedCanvas.openHouseStartDate))
          const endDate = parsedCanvas.openHouseEndDate
            ? roundToNearestHour(new Date(parsedCanvas.openHouseEndDate))
            : new Date(startDate.getTime() + 60 * 60 * 1000)
          const openHouseString = formatOpenHouseString(startDate, endDate)
          // Update canvas with the formatted string
          const updatedCanvas = { ...parsedCanvas, openHouseString }
          setCanvas(updatedCanvas)
        }
      } else {
        // Set default canvas state if none exists
        // We'll set the primary color after fetching user preferences
        setCanvas({
          currency: 'USD', // Default to USD
          primaryColor: '#000000',
          secondaryColor: '#ffffff',
          textColor: '#000000', // Default same as primary color
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
        | 'COMING_SOON'
        | 'PRICE_DROP'

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
      } else if (parsedData?.propInformation?.propertyImage) {
        setImageUrl(parsedData?.propInformation?.propertyImage)
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

      // Load custom photos count
      setCustomPhotosCount(userPrefs?.customPhotosCount || 0)

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

  // Generate initial open house string when component mounts
  useEffect(() => {
    if (postType === 'OPEN_HOUSE' && canvas && !canvas.openHouseString) {
      const openHouseString = formatOpenHouseString(openHouseStartDate, openHouseEndDate)
      const updatedCanvas = { ...canvas, openHouseString }
      setCanvas(updatedCanvas)
    }
  }, [postType, canvas, openHouseStartDate, openHouseEndDate])

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

        // Trigger paywall after successful save if user is not subscribed
        if (!isSubscribed) {
          Alert.alert('Success!', 'Canvas saved to image!', [
            { text: 'OK', onPress: () => router.push('/subscription') },
          ])
        } else {
          Alert.alert('Success', 'Canvas saved to image!')
        }
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
    setIsCanvasLoading(true)

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
    } finally {
      setIsCanvasLoading(false)
    }
  }

  // Format open house date/time string
  const formatOpenHouseString = (startDate: Date, endDate: Date): string => {
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    }

    const formatTime = (date: Date) => {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    }

    const startDateStr = formatDate(startDate)
    const startTimeStr = formatTime(startDate)
    const endTimeStr = formatTime(endDate)

    // Check if both dates are on the same day
    const isSameDay = startDate.toDateString() === endDate.toDateString()

    if (isSameDay) {
      return `${startDateStr}\n${startTimeStr} - ${endTimeStr}`
    } else {
      const endDateStr = formatDate(endDate)
      return `${startDateStr} at ${startTimeStr}\n${endDateStr} at ${endTimeStr}`
    }
  }

  // Update open house string in canvas
  const updateOpenHouseString = async () => {
    const openHouseString = formatOpenHouseString(openHouseStartDate, openHouseEndDate)
    await handleCanvasChange('openHouseString', openHouseString)
  }

  // Get the label for the currently selected template
  const getSelectedTemplateLabel = () => {
    const templates = getTemplates()
    const selectedTemplate = templates.find((t) => t.value === templateStyle)
    return selectedTemplate?.label || 'Select a template'
  }

  // Handle font change with subscription check
  const handleFontChange = async (font: string) => {
    setIsCanvasLoading(true)
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
      } finally {
        setIsCanvasLoading(false)
      }
    }
  }

  // Handle signature toggle with subscription check
  const handleSignatureToggle = async (value: boolean) => {
    if (!value && !isSubscribed) {
      // User is trying to hide logo (switch OFF) but doesn't have Pro
      Alert.alert(
        'Pro Feature',
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

    // If user has Pro or is showing logo (switch ON), proceed normally
    setShowSignature(value) // ON = show logo, OFF = hide logo
    await handleCanvasChange('showSignature', value)
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
      setIsSharing(true)
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

        // Trigger paywall after successful share if user is not subscribed
        if (!isSubscribed) {
          Alert.alert('Success!', 'Shared to Instagram!', [{ text: 'OK', onPress: () => router.push('/subscription') }])
        } else {
          Alert.alert('Success!', 'Shared to Instagram!')
          // Request store review for subscribed users after successful share
          setTimeout(() => {
            requestStoreReview(user?.$id || '')
          }, 1000) // Small delay to let the success alert show first
        }
      } else {
        // No fallback needed - just log error
        console.error('No image available for Instagram sharing')
      }
    } catch (error) {
      console.error('Error sharing to Instagram:', error)
      // No fallback needed
    } finally {
      setIsSharing(false)
    }
  }

  const shareToFacebook = async () => {
    try {
      setIsSharing(true)
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

        // Trigger paywall after successful share if user is not subscribed
        if (!isSubscribed) {
          Alert.alert('Success!', 'Shared to Facebook!', [{ text: 'OK', onPress: () => router.push('/subscription') }])
        } else {
          Alert.alert('Success!', 'Shared to Facebook!')
          // Request store review for subscribed users after successful share
          setTimeout(() => {
            requestStoreReview(user?.$id || '')
          }, 1000) // Small delay to let the success alert show first
        }
      } else {
        // No fallback needed - just log error
        console.error('No image available for Facebook sharing')
      }
    } catch (error) {
      console.error('Error sharing to Facebook:', error)
      // No fallback needed
    } finally {
      setIsSharing(false)
    }
  }

  const generalShare = async () => {
    try {
      setIsSharing(true)
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

        // Trigger paywall after successful share if user is not subscribed
        if (!isSubscribed) {
          Alert.alert('Success!', 'Post shared successfully!', [
            { text: 'OK', onPress: () => router.push('/subscription') },
          ])
        } else {
          Alert.alert('Success!', 'Post shared successfully!')
          // Request store review for subscribed users after successful share
          setTimeout(() => {
            requestStoreReview(user?.$id || '')
          }, 1000) // Small delay to let the success alert show first
        }
      } else {
        // No fallback - just log error if no image available
        console.error('No image available for sharing')
      }
    } catch (error) {
      console.error('Error sharing:', error)
      // No fallback needed
    } finally {
      setIsSharing(false)
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
            <HStack className="gap-6">
              <Pressable onPress={handleDelete}>
                <AntDesign size={24} name="delete" color="red" />
              </Pressable>
            </HStack>
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
              {/* Optimized image rendering with proper error handling */}
              {(() => {
                // Priority 1: Custom image if available
                if (customImage && customImg) {
                  return (
                    <SkImage
                      image={customImg}
                      x={0}
                      y={0}
                      width={screenWidth}
                      height={screenWidth * 1.25}
                      fit="cover"
                    />
                  )
                }

                // Priority 2: Property image if custom image unavailable
                if (img && imageUrl) {
                  return <SkImage image={img} x={0} y={0} width={screenWidth} height={screenWidth * 1.25} fit="cover" />
                }

                // Fallback: Show placeholder loading state
                return <Box className="absolute inset-0 bg-gray-200" />
              })()}
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
                <Grid _extra={{ className: 'grid-cols-1' }}>
                  <GridItem _extra={{ className: 'col-span-1' }}>
                    <Button
                      onPress={handleShare}
                      className="bg-tidit-primary"
                      size="xl"
                      disabled={isSharing || isDownloading || isLoadingUserPrefs || isCanvasLoading}
                    >
                      <HStack space="sm" className="items-center">
                        <ButtonText>{isSharing ? 'Sharing...' : 'Share'}</ButtonText>
                      </HStack>
                    </Button>
                  </GridItem>
                </Grid>

                {/* Post Type and Template Select */}
                <Grid _extra={{ className: 'grid-cols-2' }}>
                  <GridItem _extra={{ className: 'col-span-1' }}>
                    <FormControl className="pr-2">
                      <FormControlLabel>
                        <FormControlLabelText className="font-bold">Select a Post Type</FormControlLabelText>
                      </FormControlLabel>
                      <Select
                        className="bg-white"
                        onValueChange={async (value) => {
                          setIsCanvasLoading(true)

                          const newPostType = value as
                            | 'JUST_SOLD'
                            | 'JUST_LISTED'
                            | 'JUST_RENTED'
                            | 'OPEN_HOUSE'
                            | 'UNDER_CONTRACT'
                            | 'BACK_ON_MARKET'
                            | 'COMING_SOON'
                            | 'PRICE_DROP'

                          setPostType(newPostType)

                          // Check if current template is valid for the new post type
                          const availableTemplates = getTemplates()
                          const isValidCurrentTemplate = availableTemplates.some((t) => t.value === templateStyle)

                          try {
                            // Keep the current template if it's valid for the new post type
                            let templateSelected = templateStyle

                            // If current template is not valid, find a new one
                            if (!isValidCurrentTemplate && availableTemplates.length > 0) {
                              const defaultTemplate =
                                availableTemplates.find((t) => t.value === 'classic') || availableTemplates[0]
                              templateSelected = defaultTemplate.value
                              setTemplateStyle(templateSelected)
                            }

                            // Update the post type and template in the database
                            await updatePost(id as string, {
                              postType: newPostType,
                              canvas: JSON.stringify({
                                ...canvas,
                                template: templateSelected,
                              }),
                            })
                          } catch (error) {
                            console.error('Error updating post type and template:', error)
                          } finally {
                            setIsCanvasLoading(false)
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
                          <SelectContent className="pb-28">
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
                          onValueChange={async (value) => {
                            setTemplateStyle(value)
                            await handleCanvasChange('template', value)
                          }}
                          defaultValue={templateStyle}
                        >
                          <SelectTrigger>
                            <SelectInput value={getSelectedTemplateLabel()} className="flex-1" />
                            <AntDesign name="down" size={15} className="mr-3" />
                          </SelectTrigger>
                          <SelectPortal>
                            <SelectBackdrop />
                            <SelectContent className="pb-28">
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

                {/* Price section - only show for all post types except OPEN_HOUSE */}
                {postType !== 'OPEN_HOUSE' && (
                  <VStack space="md">
                    <Heading size="sm" className="mb-0 leading-none">
                      Post Type Options
                    </Heading>
                    <Grid _extra={{ className: 'grid-cols-4' }}>
                      <GridItem _extra={{ className: 'col-span-1' }}>
                        <HStack space="md" className="items-center">
                          <Switch
                            size="md"
                            isDisabled={false}
                            trackColor={{ false: '#3b82f6', true: '#3b82f6' }}
                            ios_backgroundColor="#333333"
                            thumbColor="#fafafa"
                            onValueChange={async (value) => {
                              setShowPrice(value)
                              await handleCanvasChange('showPrice', value)
                            }}
                            value={showPrice}
                          />
                          <Text>Price</Text>
                        </HStack>
                      </GridItem>
                      <GridItem _extra={{ className: 'col-span-3' }}>
                        <Grid _extra={{ className: 'grid-cols-3' }}>
                          <GridItem className="pr-2" _extra={{ className: 'col-span-1' }}>
                            <CurrencySelector
                              isDisabled={!showPrice || isCanvasLoading}
                              defaultValue={canvas.currency || 'USD'}
                              onCurrencyChange={async (currency) => {
                                await handleCanvasChange('currency', currency)

                                // Reformat existing price with new currency
                                if (priceText && priceText.trim() !== '') {
                                  const numericValue = priceText.replace(/[^\d.]/g, '')
                                  const amount = parseFloat(numericValue)

                                  if (!isNaN(amount)) {
                                    const [formattedValue] = formatCurrency({
                                      amount,
                                      code: currency,
                                    })

                                    setPriceText(formattedValue)
                                    await handleCanvasChange('priceText', formattedValue)
                                  }
                                }
                              }}
                            />
                          </GridItem>
                          <GridItem className="pl-2" _extra={{ className: 'col-span-2' }}>
                            <Input className="bg-white" isDisabled={!showPrice}>
                              <InputField
                                placeholder="Enter Your Price"
                                value={priceText}
                                onChangeText={async (text) => {
                                  // Extract numeric value from formatted text
                                  const numericValue = text.replace(/[^\d.]/g, '')

                                  if (numericValue === '' || numericValue === '0') {
                                    setPriceText('')
                                    await handleCanvasChange('priceText', '')
                                    return
                                  }

                                  const amount = parseFloat(numericValue)
                                  if (!isNaN(amount)) {
                                    // Format the currency
                                    const [formattedValue] = formatCurrency({
                                      amount,
                                      code: canvas.currency || 'USD',
                                    })

                                    setPriceText(formattedValue)
                                    await handleCanvasChange('priceText', formattedValue)
                                  }
                                }}
                              />
                            </Input>
                          </GridItem>
                        </Grid>
                      </GridItem>
                    </Grid>
                  </VStack>
                )}

                {/* Open House Date/Time section - only show for OPEN_HOUSE post type */}
                {postType === 'OPEN_HOUSE' && (
                  <VStack space="md">
                    <Heading size="sm" className="mb-0 leading-none">
                      Open House Schedule
                    </Heading>
                    <Grid gap={14} _extra={{ className: 'grid-cols-1' }}>
                      <GridItem _extra={{ className: 'col-span-1' }}>
                        <VStack space="sm">
                          <Host>
                            <DateTimePicker
                              key={`start-${openHouseStartDate.getTime()}`}
                              color="#000000"
                              title="Start Date & Time"
                              onDateSelected={async (date) => {
                                const roundedDate = roundToNearestHour(date)

                                setOpenHouseStartDate(roundedDate)
                                await handleCanvasChange('openHouseStartDate', roundedDate.toISOString())

                                // Always add 1 hour to the start date for the end date
                                const adjustedEndDate = new Date(roundedDate.getTime() + 60 * 60 * 1000) // Add 1 hour

                                setOpenHouseEndDate(adjustedEndDate)
                                await handleCanvasChange('openHouseEndDate', adjustedEndDate.toISOString())

                                // Update the open house string
                                await updateOpenHouseString()
                              }}
                              displayedComponents="dateAndTime"
                              initialDate={openHouseStartDate.toISOString()}
                            />
                          </Host>
                        </VStack>
                      </GridItem>
                      <GridItem _extra={{ className: 'col-span-1' }}>
                        <VStack space="sm">
                          <Host>
                            <DateTimePicker
                              key={`end-${openHouseEndDate.getTime()}`}
                              color="#000000"
                              title="End Date & Time"
                              onDateSelected={async (date) => {
                                const roundedDate = roundToNearestHour(date)
                                // Ensure end date is not equal to or before start date
                                if (roundedDate.getTime() <= openHouseStartDate.getTime()) {
                                  // If end date is equal to or before start date, add 1 hour to the start date
                                  const adjustedDate = new Date(openHouseStartDate.getTime() + 60 * 60 * 1000)
                                  setOpenHouseEndDate(adjustedDate)
                                  await handleCanvasChange('openHouseEndDate', adjustedDate.toISOString())
                                } else {
                                  setOpenHouseEndDate(roundedDate)
                                  await handleCanvasChange('openHouseEndDate', roundedDate.toISOString())
                                }

                                // Update the open house string
                                await updateOpenHouseString()
                              }}
                              displayedComponents="dateAndTime"
                              initialDate={openHouseEndDate.toISOString()}
                            />
                          </Host>
                        </VStack>
                      </GridItem>
                    </Grid>
                  </VStack>
                )}

                {/* Font Manager - Pro Feature */}
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

                {/* Primary, Secondary, and Text Colors */}
                <VStack space="md">
                  <Grid _extra={{ className: 'grid-cols-3' }}>
                    <GridItem _extra={{ className: 'col-span-2 items-center justify-between' }}>
                      <VStack space="sm">
                        <Heading size="sm" className="mb-0 leading-none">
                          Select a Primary Color
                        </Heading>
                        <Text className="mt-0 leading-none text-gray-600" size="xs">
                          This color will be used as the default primary color for all new posts
                        </Text>
                      </VStack>
                    </GridItem>
                    <GridItem _extra={{ className: 'col-span-1 self-end' }}>
                      <HStack space="xs" className="items-end justify-end gap-4">
                        <ColorPicker
                          key={canvas.primaryColor || 'default'} // Force re-render when color changes
                          selection={canvas.primaryColor || '#3b82f6'}
                          onValueChanged={async (color) => await handleCanvasChange('primaryColor', color)}
                          supportsOpacity={false}
                        />
                        <Button
                          size="xs"
                          variant="outline"
                          onPress={async () => {
                            if (userPrefs?.globalPrimaryColor) {
                              // Update local state immediately for better UX
                              const updatedCanvas = { ...canvas, primaryColor: userPrefs.globalPrimaryColor }
                              setCanvas(updatedCanvas)
                              // Then save to database
                              await handleCanvasChange('primaryColor', userPrefs.globalPrimaryColor)
                            } else {
                              console.log('No global primary color found in userPrefs:', userPrefs)
                            }
                          }}
                          className="mt-2"
                          action="negative"
                        >
                          <ButtonText className="text-red-500">Reset</ButtonText>
                        </Button>
                      </HStack>
                    </GridItem>
                  </Grid>

                  <Grid _extra={{ className: 'grid-cols-3' }}>
                    <GridItem _extra={{ className: 'col-span-2 items-center justify-between' }}>
                      <VStack space="sm">
                        <Heading size="sm" className="mb-0 leading-none">
                          Select a Secondary Color
                        </Heading>
                        <Text className="mt-0 leading-none text-gray-600" size="xs">
                          This color will be used as the default secondary color for all new posts
                        </Text>
                      </VStack>
                    </GridItem>
                    <GridItem _extra={{ className: 'col-span-1 self-end' }}>
                      <HStack space="xs" className="items-end justify-end gap-4">
                        <ColorPicker
                          key={canvas.secondaryColor || 'default-secondary'} // Force re-render when color changes
                          selection={canvas.secondaryColor || '#ffffff'}
                          onValueChanged={async (color) => await handleCanvasChange('secondaryColor', color)}
                          supportsOpacity={false}
                        />
                        <Button
                          size="xs"
                          variant="outline"
                          onPress={async () => {
                            if (userPrefs?.globalSecondaryColor) {
                              // Update local state immediately for better UX
                              const updatedCanvas = { ...canvas, secondaryColor: userPrefs.globalSecondaryColor }
                              setCanvas(updatedCanvas)
                              // Then save to database
                              await handleCanvasChange('secondaryColor', userPrefs.globalSecondaryColor)
                            } else {
                              // Reset to default white color
                              const updatedCanvas = { ...canvas, secondaryColor: '#ffffff' }
                              setCanvas(updatedCanvas)
                              await handleCanvasChange('secondaryColor', '#ffffff')
                            }
                          }}
                          className="mt-2"
                          action="negative"
                        >
                          <ButtonText className="text-red-500">Reset</ButtonText>
                        </Button>
                      </HStack>
                    </GridItem>
                  </Grid>

                  <Grid _extra={{ className: 'grid-cols-3' }}>
                    <GridItem _extra={{ className: 'col-span-2 items-center justify-between' }}>
                      <VStack space="sm">
                        <Heading size="sm" className="mb-0 leading-none">
                          Select a Text Color
                        </Heading>
                        <Text className="mt-0 leading-none text-gray-600" size="xs">
                          This color will be used as the default text color for all new posts
                        </Text>
                      </VStack>
                    </GridItem>
                    <GridItem _extra={{ className: 'col-span-1 self-end' }}>
                      <HStack space="xs" className="items-end justify-end gap-4">
                        <ColorPicker
                          key={canvas.textColor || 'default-text'} // Force re-render when color changes
                          selection={canvas.textColor || canvas.primaryColor || '#000000'}
                          onValueChanged={async (color) => await handleCanvasChange('textColor', color)}
                          supportsOpacity={false}
                        />
                        <Button
                          size="xs"
                          variant="outline"
                          onPress={async () => {
                            if (userPrefs?.globalTextColor) {
                              // Update local state immediately for better UX
                              const updatedCanvas = { ...canvas, textColor: userPrefs.globalTextColor }
                              setCanvas(updatedCanvas)
                              // Then save to database
                              await handleCanvasChange('textColor', userPrefs.globalTextColor)
                            } else {
                              // Reset to same as primary color
                              const resetColor = canvas.primaryColor || '#000000'
                              const updatedCanvas = { ...canvas, textColor: resetColor }
                              setCanvas(updatedCanvas)
                              await handleCanvasChange('textColor', resetColor)
                            }
                          }}
                          className="mt-2"
                          action="negative"
                        >
                          <ButtonText className="text-red-500">Reset</ButtonText>
                        </Button>
                      </HStack>
                    </GridItem>
                  </Grid>
                </VStack>

                {/* Show Brokerage, Show Realtor, Show Price */}
                <Grid _extra={{ className: 'grid-cols-2 mb-2' }} gap={4}>
                  <GridItem _extra={{ className: 'col-span-1' }}>
                    <HStack space="md" className="items-center">
                      <Switch
                        size="md"
                        trackColor={{ false: '#333333', true: '#3b82f6' }}
                        ios_backgroundColor="#333333"
                        thumbColor="#fafafa"
                        onValueChange={async (value) => {
                          // Check if brokerage logo exists before allowing toggle
                          if (value && (!userPrefs?.brokerageLogo || userPrefs.brokerageLogo.trim() === '')) {
                            Alert.alert(
                              'Brokerage Logo Required',
                              'Please upload a brokerage logo in your profile to enable this feature.',
                              [
                                { text: 'Cancel', style: 'cancel' },
                                { text: 'Go to Profile', onPress: () => router.push('/(app)/(tabs)/profile') },
                              ]
                            )
                            return
                          }
                          setShowBrokerage(value)
                          await handleCanvasChange('showBrokerage', value)
                        }}
                        value={
                          !userPrefs?.brokerageLogo || userPrefs.brokerageLogo.trim() === '' ? false : showBrokerage
                        }
                      />
                      <Text>Show Brokerage</Text>
                    </HStack>
                  </GridItem>

                  <GridItem _extra={{ className: 'col-span-1' }}>
                    <HStack space="md" className="items-center">
                      <Switch
                        size="md"
                        trackColor={{ false: '#3b82f6', true: '#3b82f6' }}
                        ios_backgroundColor="#333333"
                        thumbColor="#fafafa"
                        onValueChange={async (value) => {
                          // Check if realtor picture exists before allowing toggle
                          if (value && (!userPrefs?.realtorPicture || userPrefs.realtorPicture.trim() === '')) {
                            Alert.alert(
                              'Realtor Picture Required',
                              'Please upload a realtor picture in your profile to enable this feature.',
                              [
                                { text: 'Cancel', style: 'cancel' },
                                { text: 'Go to Profile', onPress: () => router.push('/(app)/(tabs)/profile') },
                              ]
                            )
                            return
                          }
                          setShowRealtor(value)
                          await handleCanvasChange('showRealtor', value)
                        }}
                        value={
                          !userPrefs?.realtorPicture || userPrefs.realtorPicture.trim() === '' ? false : showRealtor
                        }
                      />
                      <Text>Show Realtor</Text>
                    </HStack>
                  </GridItem>
                </Grid>

                {/* Signature Toggle - Pro Feature */}
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
                <VStack className="pt-5">
                  <Heading size="sm">Custom Property Photo</Heading>
                  <Text className="text-gray-600">
                    {customImage ? 'Custom photo selected' : 'Use your own photo instead of the property photo'}
                  </Text>

                  {/* Photo Limit Indicator */}
                  {!isSubscribed && (
                    <Box className="mt-2 rounded-lg bg-blue-50 p-3">
                      <HStack space="sm" className="items-center justify-between">
                        <HStack>
                          <AntDesign name="info" size={16} color="#3b82f6" />
                          <Text className="text-sm text-blue-700">
                            {customPhotosCount >= 5
                              ? 'Photo limit reached (5/5). Upgrade to Pro for unlimited photos!'
                              : `${customPhotosCount}/5 custom photos used. ${5 - customPhotosCount} remaining.`}
                          </Text>
                        </HStack>
                        <Button size="xs" onPress={() => router.push('/subscription')} className="bg-blue-500">
                          <ButtonText>Upgrade</ButtonText>
                        </Button>
                      </HStack>
                    </Box>
                  )}

                  <Box className="mt-3 rounded-full border border-2 border-dashed border-gray-600 p-5 py-6">
                    {customImage ? (
                      <Button size="lg" onPress={removeCustomImage} className="border-red-500">
                        <ButtonText className="text-red-500">Remove</ButtonText>
                      </Button>
                    ) : (
                      <Button size="xl" onPress={pickImage} className="bg-tidit-primary">
                        <ButtonText>Upload Property Photo</ButtonText>
                      </Button>
                    )}
                  </Box>
                </VStack>

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

                    {/* Feature Preview Cards */}
                    <VStack space="sm">
                      <Box className="rounded-lg border border-gray-200 bg-white p-4">
                        <Text className="font-semibold text-gray-800">Main Heading</Text>
                        <Text className="mt-1 text-sm text-gray-600">
                          Customize the main headline instead of using default post types like "Just Sold" or "Just
                          Listed"
                        </Text>
                        <Box className="mt-2 rounded bg-gray-100 p-2">
                          <Text className="text-sm italic text-gray-500">
                            Example: "🏡 SOLD! Congratulations to our amazing clients!"
                          </Text>
                        </Box>
                      </Box>

                      <Box className="rounded-lg border border-gray-200 bg-white p-4">
                        <Text className="font-semibold text-gray-800">Sub Heading</Text>
                        <Text className="mt-1 text-sm text-gray-600">
                          Replace the price text with custom messaging or call-to-action
                        </Text>
                        <Box className="mt-2 rounded bg-gray-100 p-2">
                          <Text className="text-sm italic text-gray-500">
                            Example: "Call for details" or "Price upon request"
                          </Text>
                        </Box>
                      </Box>
                    </VStack>

                    <Box className="rounded-lg border border-tidit-primary bg-tidit-primary/20 p-4">
                      <Text className="text-center text-gray-600">
                        Upgrade to Pro to unlock custom text personalization for your posts!
                      </Text>
                      <Button
                        size="xl"
                        className="mt-3 bg-blue-500"
                        onPress={() =>
                          router.push(`/subscription?returnRoute=${encodeURIComponent(`/property/${id}`)}`)
                        }
                      >
                        <ButtonText>Upgrade to Pro</ButtonText>
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
