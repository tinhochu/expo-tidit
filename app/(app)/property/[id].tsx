import { TemplateRenderer, getTemplates } from '@/components/template-renderer'
import { Box } from '@/components/ui/box'
import { Button, ButtonText } from '@/components/ui/button'
import { FormControl, FormControlLabel, FormControlLabelText } from '@/components/ui/form-control'
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
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { useAuth } from '@/context/AuthContext'
import { formatFileSize, getCompressionStats, processImage } from '@/lib/imageProcessor'
import { deletePost, getPostById, updatePost } from '@/lib/postService'
import { saveSkiaImageToPhotos } from '@/lib/saveSkiaImage'
import { getUserPrefs } from '@/lib/userService'
import { ColorPicker } from '@expo/ui/swift-ui'
import AntDesign from '@expo/vector-icons/AntDesign'
import { Canvas, Image as SkImage, useCanvasRef, useImage } from '@shopify/react-native-skia'
import * as ImagePicker from 'expo-image-picker'
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

  // Helper function to check if postType is in a valid state
  const isValidPostType = (
    type: string
  ): type is 'JUST_SOLD' | 'JUST_LISTED' | 'JUST_RENTED' | 'OPEN_HOUSE' | 'UNDER_CONTRACT' | 'BACK_ON_MARKET' => {
    return type !== 'LOADING'
  }

  // Image picker function for custom photos
  const pickImage = async () => {
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

          // Get compression statistics
          const compressionStats = await getCompressionStats(originalImageUri, processedImage.uri)

          // Show optimization results
          // Alert.alert(
          //   'Image Optimized!',
          //   `Original: ${formatFileSize(compressionStats.originalSize)}\n` +
          //     `Optimized: ${formatFileSize(compressionStats.processedSize)}\n` +
          //     `Size reduction: ${compressionStats.sizeReduction} (${compressionStats.compressionRatio.toFixed(1)}%)`
          // )

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
  } | null>(null)
  const [userPrefs, setUserPrefs] = useState<any>(null)
  const [showBrokerage, setShowBrokerage] = useState<boolean>(true) // Default to true (enabled)
  const [showRealtor, setShowRealtor] = useState<boolean>(true) // Default to true (enabled)
  const [showPrice, setShowPrice] = useState<boolean>(false) // Default to false (disabled)
  const [priceText, setPriceText] = useState<string>('') // Default to empty string
  const [customImage, setCustomImage] = useState<string | null>(null)
  // Use the useImage hook with the actual image URL - provide fallback to prevent conditional hook calls
  const img = useImage(imageUrl || 'https://via.placeholder.com/400x300?text=Loading...')
  const customImg = useImage(customImage || '')

  useEffect(() => {
    if (!status?.granted) {
      requestPermission()
    }
  }, [status])

  // Removed the useEffect that was causing circular updates

  useEffect(() => {
    const fetchPropertyDetails = async () => {
      const propertyDetails = await getPostById(id as string)
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
        // Load custom image from canvas if it exists
        if (parsedCanvas.customImage) {
          setCustomImage(parsedCanvas.customImage)
        }
      } else {
        // Set default canvas state if none exists
        // We'll set the primary color after fetching user preferences
        setCanvas({ primaryColor: '#000000', showBrokerage: true, showRealtor: true, showPrice: false, priceText: '' })
        setShowBrokerage(true)
        setShowRealtor(true)
        setShowPrice(false)
        setPriceText('')
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
        // Check if there's a saved template in the canvas
        const savedTemplate = parsedCanvas?.template
        const isValidSavedTemplate = availableTemplates.some((t) => t.value === savedTemplate)

        if (isValidSavedTemplate && savedTemplate) {
          setTemplateStyle(savedTemplate)
        } else {
          setTemplateStyle(availableTemplates[0].value)
        }
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
    }

    fetchUserPrefs()
  }, [user?.$id, canvas])

  // Update templateStyle when postType changes to ensure we have a valid template
  useEffect(() => {
    if (isValidPostType(postType)) {
      const availableTemplates = getTemplates(postType)
      console.log('Post type changed to:', postType, 'Available templates:', availableTemplates)

      if (availableTemplates.length > 0) {
        // Only update if current templateStyle is not valid for the new postType
        const isValidTemplate = availableTemplates.some((t) => t.value === templateStyle)
        console.log('Current templateStyle:', templateStyle, 'Is valid?', isValidTemplate)
        if (!isValidTemplate) {
          console.log('Updating template from', templateStyle, 'to', availableTemplates[0].value)
          setTemplateStyle(availableTemplates[0].value)
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
    const image = ref.current?.makeImageSnapshot()
    if (image) {
      const slugifiedTitle = data?.title ? slugify(`tidit-${data.title}`) : `tidit-${Date.now()}`
      await saveSkiaImageToPhotos(image, { filename: slugifiedTitle, albumName: 'Tidit' })

      Alert.alert('Success', 'Canvas saved to image!')
    } else {
      Alert.alert('Error', 'Failed to save canvas')
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
    if (!isValidPostType(postType)) return 'Select a template'

    const templates = getTemplates(postType)
    const selectedTemplate = templates.find((t) => t.value === templateStyle)
    return selectedTemplate?.label || 'Select a template'
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.select({ ios: 64, android: 0 })}
    >
      <VStack>
        <Box className="border-b border-gray-200 bg-white p-2 px-5 pt-[72px]">
          <HStack className="items-center justify-between gap-5">
            <Pressable onPress={() => router.back()}>
              <AntDesign size={24} name="back" color="black" />
            </Pressable>
            <Heading size="sm">{data?.title ? data.title.slice(0, 25) + '...' : 'Fetching...'}</Heading>
            {img ? (
              <HStack className="gap-6">
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
          {!img && !isValidPostType(postType) ? (
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
              {/* Use custom image if available, otherwise use property image */}
              {customImage && customImg ? (
                <SkImage image={customImg} x={0} y={0} width={screenWidth} height={screenWidth * 1.25} fit="cover" />
              ) : img ? (
                <SkImage image={img} x={0} y={0} width={screenWidth} height={screenWidth * 1.25} fit="cover" />
              ) : (
                // Show loading skeleton when no image is available
                <Box className="absolute inset-0 bg-gray-200" />
              )}
              <TemplateRenderer
                key={`${postType}-${templateStyle}`}
                postType={postType}
                template={templateStyle}
                data={data}
                canvas={canvas}
                userPrefs={userPrefs}
                showBrokerage={showBrokerage}
                showRealtor={showRealtor}
              />
            </Canvas>
          )}

          <VStack className="px-5 pb-8 pt-5" space="2xl">
            {canvas && isValidPostType(postType) && (
              <>
                <Grid _extra={{ className: 'grid-cols-2' }}>
                  <GridItem _extra={{ className: 'col-span-1' }}>
                    <FormControl className="pr-2">
                      <FormControlLabel>
                        <FormControlLabelText className="font-bold">Choose a Post Type</FormControlLabelText>
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

                          // Update templateStyle to match the first available template for the new post type
                          const availableTemplates = getTemplates(newPostType)

                          if (availableTemplates.length > 0) {
                            const newTemplateStyle = availableTemplates[0].value
                            console.log('Setting new template style:', newTemplateStyle, 'for post type:', newPostType)

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
                              {getTemplates(postType)?.map((template) => (
                                <SelectItem key={template.value} label={template.label} value={template.value} />
                              ))}
                            </SelectContent>
                          </SelectPortal>
                        </Select>
                      </FormControl>
                    )}
                  </GridItem>
                </Grid>

                {/* <Grid _extra={{ className: 'grid-cols-2' }}>
                  <GridItem _extra={{ className: 'col-span-1' }}>
                    <FormControl className="pr-2">
                      <FormControlLabel>
                        <FormControlLabelText className="font-bold">Choose a Post Type</FormControlLabelText>
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

                          // Update templateStyle to match the first available template for the new post type
                          const availableTemplates = getTemplates(newPostType)

                          if (availableTemplates.length > 0) {
                            const newTemplateStyle = availableTemplates[0].value
                            console.log('Setting new template style:', newTemplateStyle, 'for post type:', newPostType)

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
                              {getTemplates(postType)?.map((template) => (
                                <SelectItem key={template.value} label={template.label} value={template.value} />
                              ))}
                            </SelectContent>
                          </SelectPortal>
                        </Select>
                      </FormControl>
                    )}
                  </GridItem>
                </Grid> */}

                <HStack className="flex items-center justify-between">
                  <Heading size="sm">Select a Primary Color</Heading>
                  <HStack space="xs" className="items-end gap-4">
                    <ColorPicker
                      selection={canvas.primaryColor || '#3b82f6'}
                      onValueChanged={(color) => handleCanvasChange('primaryColor', color)}
                      supportsOpacity={false}
                    />
                    <Button
                      size="xs"
                      variant="outline"
                      onPress={() => handleCanvasChange('primaryColor', userPrefs.globalPrimaryColor)}
                      className="mt-2"
                      action="negative"
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
                        isDisabled={false}
                        trackColor={{ false: '#3b82f6', true: '#3b82f6' }}
                        ios_backgroundColor="#3b82f6"
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
                        ios_backgroundColor="#3b82f6"
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

                <Grid _extra={{ className: 'grid-cols-2 mb-2' }}>
                  <GridItem _extra={{ className: 'col-span-1' }}>
                    <HStack space="md" className="items-center">
                      <Switch
                        size="md"
                        isDisabled={false}
                        trackColor={{ false: '#3b82f6', true: '#3b82f6' }}
                        ios_backgroundColor="#3b82f6"
                        thumbColor="#fafafa"
                        onValueChange={(value) => {
                          setShowPrice(value)
                          handleCanvasChange('showPrice', value)
                        }}
                        value={showPrice}
                      />
                      <Text>Show Price</Text>
                    </HStack>
                  </GridItem>
                  <GridItem _extra={{ className: 'col-span-1' }}>
                    {showPrice && (
                      <FormControl>
                        <Input className="bg-white">
                          <InputField
                            placeholder="Enter your price text"
                            value={priceText}
                            onChangeText={(value: string) => {
                              setPriceText(value)
                              handleCanvasChange('priceText', value)
                            }}
                            autoCapitalize="none"
                          />
                        </Input>
                      </FormControl>
                    )}
                  </GridItem>
                </Grid>

                {/* Custom Image Upload Section */}
                <VStack className="pt-5">
                  <Heading size="sm">Custom Property Photo</Heading>
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

                {/* TODO: End of the form, don't remove this */}
                <Grid _extra={{ className: 'grid-cols-1 gap-5' }}>
                  <GridItem _extra={{ className: 'col-span-1' }}>
                    <Box className="aspect-square w-full"></Box>
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
