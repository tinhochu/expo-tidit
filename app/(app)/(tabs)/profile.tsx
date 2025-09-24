import DeleteAccountModal from '@/components/DeleteAccountModal'
import { Button, ButtonText } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { FormControl, FormControlLabel, FormControlLabelText } from '@/components/ui/form-control'
import { HStack } from '@/components/ui/hstack'
import { Icon } from '@/components/ui/icon'
import { Input, InputField } from '@/components/ui/input'
import { Pressable } from '@/components/ui/pressable'
import { Text } from '@/components/ui/text'
import { Toast, ToastTitle, useToast } from '@/components/ui/toast'
import { VStack } from '@/components/ui/vstack'
import { useAuth } from '@/context/AuthContext'
import { useSubscription } from '@/context/SubscriptionContext'
import { BUCKET_ID, storage } from '@/lib/appwriteConfig'
import { cleanupTempImages, getCompressionStats, getMimeType, processProfileImage } from '@/lib/imageProcessor'
import { getUserPrefs, updateUserPrefs } from '@/lib/userService'
import { ColorPicker } from '@expo/ui/swift-ui'
import { Ionicons } from '@expo/vector-icons'
import * as FileSystem from 'expo-file-system'
import * as ImagePicker from 'expo-image-picker'
import { router, useFocusEffect } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Image, RefreshControl, ScrollView } from 'react-native'
import { ID } from 'react-native-appwrite'
import RevenueCatUI from 'react-native-purchases-ui'

// Helper function to convert Uint8Array to base64
function uint8ArrayToBase64(uint8Array: Uint8Array): string {
  let binaryString = ''
  for (let i = 0; i < uint8Array.length; i++) {
    binaryString += String.fromCharCode(uint8Array[i])
  }

  // Use btoa if available, otherwise use a manual base64 encoding
  if (typeof btoa !== 'undefined') {
    return btoa(binaryString)
  } else {
    // Manual base64 encoding for React Native compatibility
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
    let result = ''
    let i = 0

    while (i < binaryString.length) {
      const a = binaryString.charCodeAt(i++)
      const b = i < binaryString.length ? binaryString.charCodeAt(i++) : 0
      const c = i < binaryString.length ? binaryString.charCodeAt(i++) : 0

      const bitmap = (a << 16) | (b << 8) | c

      result += chars.charAt((bitmap >> 18) & 63)
      result += chars.charAt((bitmap >> 12) & 63)
      result += i - 2 < binaryString.length ? chars.charAt((bitmap >> 6) & 63) : '='
      result += i - 1 < binaryString.length ? chars.charAt(bitmap & 63) : '='
    }

    return result
  }
}

/**
 * Remove.bg API function
 * Removes the background from an image using the remove.bg API
 * @param imageUri - Local URI of the image to process
 * @returns Promise<string> - URI of the processed image with background removed
 */
async function removeBg(imageUri: string): Promise<string> {
  try {
    // Convert local URI to base64 for remove.bg API
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    })

    const formData = new FormData()
    formData.append('size', 'auto')
    formData.append('image_file_b64', base64)

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': process.env.EXPO_PUBLIC_REMOVEBG_API_KEY!,
      },
      body: formData,
    })

    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer()

      // Convert arrayBuffer to base64 using a React Native compatible method
      const uint8Array = new Uint8Array(arrayBuffer)
      const base64String = uint8ArrayToBase64(uint8Array)

      // Save the processed image to a temporary file
      const tempUri = `${FileSystem.cacheDirectory}removed_bg_${Date.now()}.png`
      await FileSystem.writeAsStringAsync(tempUri, base64String, {
        encoding: FileSystem.EncodingType.Base64,
      })

      return tempUri
    } else {
      throw new Error(`${response.status}: ${response.statusText}`)
    }
  } catch (error) {
    console.error('Remove.bg error:', error)
    throw error
  }
}

export default function Profile() {
  const toast = useToast()
  const { signout, user, deleteAccount, setDeletingAccount } = useAuth()
  const { isSubscribed } = useSubscription()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    brokerageLogo: null,
    realtorPicture: null,
    globalPrimaryColor: '#3b82f6', // Default blue color
    globalSecondaryColor: '#6b7280', // Default gray color
    globalTextColor: '#1f2937', // Default dark gray color
    customPhotosCount: 0,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [uploadingImage, setUploadingImage] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)

  // Fetch user preferences when component mounts
  useEffect(() => {
    const fetchUserPrefs = async () => {
      if (!user?.$id) return

      try {
        setIsInitialLoading(true)
        const userPrefs = await getUserPrefs(user.$id)

        // Update form data with fetched preferences
        if (userPrefs) {
          setFormData((prev) => ({
            ...prev,
            firstName: userPrefs.firstName || '',
            lastName: userPrefs.lastName || '',
            email: userPrefs.email || '',
            phone: userPrefs.phone || '',
            brokerageLogo: userPrefs.brokerageLogo || null,
            realtorPicture: userPrefs.realtorPicture || null,
            globalPrimaryColor: userPrefs.globalPrimaryColor || '#3b82f6',
            globalSecondaryColor: userPrefs.globalSecondaryColor || '#ffffff',
            globalTextColor: userPrefs.globalTextColor || '#3b82f6',
            customPhotosCount: userPrefs.customPhotosCount || 0,
          }))
        }
      } catch (error) {
        console.error('Error fetching user preferences:', error)
        toast.show({
          id: ID.unique(),
          placement: 'top',
          duration: 3000,
          render: ({ id }) => {
            const uniqueToastId = 'toast-' + id
            return (
              <Toast nativeID={uniqueToastId} action="error" variant="solid">
                <ToastTitle>Failed to load profile data</ToastTitle>
              </Toast>
            )
          },
        })
      } finally {
        setIsInitialLoading(false)
      }
    }

    fetchUserPrefs()
  }, [user?.$id])

  // Refresh data every time the profile tab is focused
  useFocusEffect(
    useCallback(() => {
      if (user?.$id) {
        handleRefresh()
      }
    }, [user?.$id])
  )

  // Cleanup temporary images when component unmounts
  useEffect(() => {
    return () => {
      cleanupTempImages()
    }
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const clearImage = async (type: 'brokerageLogo' | 'realtorPicture') => {
    try {
      // Show confirmation dialog
      Alert.alert(
        'Remove Image',
        `Are you sure you want to remove your ${type === 'brokerageLogo' ? 'brokerage logo' : 'profile picture'}?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              try {
                // Save the updated preferences first
                if (!user?.$id) {
                  throw new Error('User ID is not available')
                }

                console.log(`Saving preferences after clearing ${type}`)
                console.log('Current formData:', formData)
                console.log('User ID:', user.$id)

                await updateUserPrefs(user.$id, {
                  firstName: formData.firstName,
                  lastName: formData.lastName,
                  email: formData.email,
                  phone: formData.phone,
                  brokerageLogo: type === 'brokerageLogo' ? null : formData.brokerageLogo,
                  realtorPicture: type === 'realtorPicture' ? null : formData.realtorPicture,
                  globalPrimaryColor: formData.globalPrimaryColor,
                  globalSecondaryColor: formData.globalSecondaryColor,
                  globalTextColor: formData.globalTextColor,
                })

                console.log(`Preferences saved successfully after clearing ${type}`)

                // Only clear the image from form data after successful save
                setFormData((prev) => ({ ...prev, [type]: null }))

                // Small delay to ensure state update is processed
                await new Promise((resolve) => setTimeout(resolve, 100))

                // Show success toast
                toast.show({
                  id: ID.unique(),
                  placement: 'top',
                  duration: 2000,
                  render: ({ id }) => {
                    const uniqueToastId = 'toast-' + id
                    return (
                      <Toast nativeID={uniqueToastId} action="success" variant="solid">
                        <ToastTitle>{`${type === 'brokerageLogo' ? 'Brokerage logo' : 'Profile picture'} removed and saved`}</ToastTitle>
                      </Toast>
                    )
                  },
                })
              } catch (saveError) {
                console.error('Error saving preferences after clearing image:', saveError)
                // Revert the form data if save fails
                setFormData((prev) => ({ ...prev, [type]: formData[type] }))

                toast.show({
                  id: ID.unique(),
                  placement: 'top',
                  duration: 3000,
                  render: ({ id }) => {
                    const uniqueToastId = 'toast-' + id
                    return (
                      <Toast nativeID={uniqueToastId} action="error" variant="solid">
                        <ToastTitle>Failed to save changes. Please try again.</ToastTitle>
                      </Toast>
                    )
                  },
                })
              }
            },
          },
        ]
      )
    } catch (error) {
      console.error('Error clearing image:', error)
      Alert.alert('Error', `Failed to remove ${type === 'brokerageLogo' ? 'brokerage logo' : 'profile picture'}`)
    }
  }

  const pickImage = async (type: 'brokerageLogo' | 'realtorPicture') => {
    try {
      setUploadingImage(type)

      // Launch image picker
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 1, // Use full quality for processing
      })

      if (result.canceled || !result.assets[0]) {
        setUploadingImage(null)
        return
      }

      const originalImageUri = result.assets[0].uri

      // Show toast for background removal
      toast.show({
        id: ID.unique(),
        placement: 'top',
        duration: 2000,
        render: ({ id }) => {
          const uniqueToastId = 'toast-' + id
          return (
            <Toast nativeID={uniqueToastId} action="info" variant="solid">
              <ToastTitle>{`Removing background from ${type === 'brokerageLogo' ? 'brokerage logo' : 'profile picture'}...`}</ToastTitle>
            </Toast>
          )
        },
      })

      // Remove background using remove.bg API
      let imageWithRemovedBg: string
      try {
        imageWithRemovedBg = await removeBg(originalImageUri)
      } catch (removeBgError) {
        console.error('Background removal failed:', removeBgError)

        // Show error toast for background removal failure
        toast.show({
          id: ID.unique(),
          placement: 'top',
          duration: 3000,
          render: ({ id }) => {
            const uniqueToastId = 'toast-' + id
            return (
              <Toast nativeID={uniqueToastId} action="error" variant="solid">
                <ToastTitle>Background removal failed. Using original image...</ToastTitle>
              </Toast>
            )
          },
        })

        // Fall back to original image if background removal fails
        imageWithRemovedBg = originalImageUri
      }

      // Show toast for image processing
      toast.show({
        id: ID.unique(),
        placement: 'top',
        duration: 1500,
        render: ({ id }) => {
          const uniqueToastId = 'toast-' + id
          return (
            <Toast nativeID={uniqueToastId} action="info" variant="solid">
              <ToastTitle>{`Processing ${type === 'brokerageLogo' ? 'brokerage logo' : 'profile picture'}...`}</ToastTitle>
            </Toast>
          )
        },
      })

      // Process the image to reduce size and dimensions
      const processedImage = await processProfileImage(imageWithRemovedBg, type)

      // Get compression statistics
      const compressionStats = await getCompressionStats(imageWithRemovedBg, processedImage.uri)

      // Set the processed image URI for immediate display
      setFormData((prev) => ({ ...prev, [type]: processedImage.uri }))

      // Show toast for image processing completion
      toast.show({
        id: ID.unique(),
        placement: 'top',
        duration: 2000,
        render: ({ id }) => {
          const uniqueToastId = 'toast-' + id
          return (
            <Toast nativeID={uniqueToastId} action="success" variant="solid">
              <ToastTitle>{`Image processed! Reduced by ${compressionStats.sizeReduction}`}</ToastTitle>
            </Toast>
          )
        },
      })

      // Show toast for upload start
      toast.show({
        id: ID.unique(),
        placement: 'top',
        duration: 1500,
        render: ({ id }) => {
          const uniqueToastId = 'toast-' + id
          return (
            <Toast nativeID={uniqueToastId} action="info" variant="solid">
              <ToastTitle>{`Uploading ${type === 'brokerageLogo' ? 'brokerage logo' : 'profile picture'}...`}</ToastTitle>
            </Toast>
          )
        },
      })

      // Now upload the processed image to storage
      try {
        // Remove blob conversion - React Native doesn't support fetching local file URIs

        // Determine file extension and MIME type based on processed format
        // Convert 'jpeg' to 'jpg' for Appwrite compatibility
        const fileExtension = processedImage.format === 'jpeg' ? 'jpg' : processedImage.format
        const mimeType = getMimeType(fileExtension)

        const response = await storage.createFile(BUCKET_ID, ID.unique(), {
          name: `${user?.$id}-${type}.${fileExtension}`,
          type: mimeType,
          size: processedImage.size,
          uri: processedImage.uri,
        })

        // Update with the uploaded image URL
        const uploadedImageUrl = `${process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!}/storage/buckets/${BUCKET_ID}/files/${response.$id}/view?project=${process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID}`

        // Automatically save the updated preferences first
        // Note: We use the current formData values, not the processed image URI
        try {
          if (!user?.$id) {
            throw new Error('User ID is not available')
          }

          await updateUserPrefs(user.$id, {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            brokerageLogo: type === 'brokerageLogo' ? uploadedImageUrl : formData.brokerageLogo,
            realtorPicture: type === 'realtorPicture' ? uploadedImageUrl : formData.realtorPicture,
            globalPrimaryColor: formData.globalPrimaryColor,
            globalSecondaryColor: formData.globalSecondaryColor,
            globalTextColor: formData.globalTextColor,
          })

          console.log(`Preferences saved successfully for ${type}`)

          // Only update the form data after successful save
          setFormData((prev) => ({
            ...prev,
            [type]: uploadedImageUrl,
          }))

          // Small delay to ensure state update is processed
          await new Promise((resolve) => setTimeout(resolve, 100))

          // Show final success toast with compression info
          toast.show({
            id: ID.unique(),
            placement: 'top',
            duration: 3000,
            render: ({ id }) => {
              const uniqueToastId = 'toast-' + id
              return (
                <Toast nativeID={uniqueToastId} action="success" variant="solid">
                  <ToastTitle>{`${type === 'brokerageLogo' ? 'Brokerage logo' : 'Profile picture'} uploaded and saved successfully!`}</ToastTitle>
                </Toast>
              )
            },
          })
        } catch (saveError) {
          console.error('Error saving preferences after image upload:', saveError)

          // Show error toast for save failure
          toast.show({
            id: ID.unique(),
            placement: 'top',
            duration: 3000,
            render: ({ id }) => {
              const uniqueToastId = 'toast-' + id
              return (
                <Toast nativeID={uniqueToastId} action="error" variant="solid">
                  <ToastTitle>
                    Image uploaded but failed to save preferences. Please try updating your profile manually.
                  </ToastTitle>
                </Toast>
              )
            },
          })
        }
      } catch (uploadError) {
        console.error('Upload error details:', uploadError)
        console.error('Upload error message:', uploadError instanceof Error ? uploadError.message : 'Unknown error')
        console.error('Upload error stack:', uploadError instanceof Error ? uploadError.stack : 'No stack trace')

        // Show detailed error in alert for debugging
        const errorMessage = uploadError instanceof Error ? uploadError.message : 'Unknown error'
        Alert.alert(
          'Upload Error',
          `Failed to upload ${type === 'brokerageLogo' ? 'brokerage logo' : 'profile picture'}. Error: ${errorMessage}`
        )
      } finally {
        setUploadingImage(null)
      }
    } catch (error) {
      console.error('Image picker error:', error)
      setUploadingImage(null)
      Alert.alert('Error', `Failed to select ${type === 'brokerageLogo' ? 'brokerage logo' : 'profile picture'}`)
    }
  }

  const handleRefresh = async () => {
    try {
      const userPrefs = await getUserPrefs(user?.$id)

      // Update form data with fetched preferences
      if (userPrefs) {
        setFormData((prev) => ({
          ...prev,
          firstName: userPrefs.firstName || '',
          lastName: userPrefs.lastName || '',
          email: userPrefs.email || '',
          phone: userPrefs.phone || '',
          brokerageLogo: userPrefs.brokerageLogo || null,
          realtorPicture: userPrefs.realtorPicture || null,
          globalPrimaryColor: userPrefs.globalPrimaryColor || '#3b82f6', // Default blue color
          globalSecondaryColor: userPrefs.globalSecondaryColor || '#6b7280', // Default gray color
          globalTextColor: userPrefs.globalTextColor || '#1f2937', // Default dark gray color
          customPhotosCount: userPrefs.customPhotosCount || 0,
        }))
      }
    } catch (error) {
      console.error('Error refreshing user preferences:', error)
    }
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      await updateUserPrefs(user?.$id, {
        firstName: formData?.firstName ?? '',
        lastName: formData?.lastName ?? '',
        email: formData?.email ?? '',
        phone: formData?.phone ?? '',
        brokerageLogo: formData?.brokerageLogo ?? null,
        realtorPicture: formData?.realtorPicture ?? null,
        globalPrimaryColor: formData?.globalPrimaryColor ?? '#3b82f6', // Default blue color
        globalSecondaryColor: formData?.globalSecondaryColor ?? '#6b7280', // Default gray color
        globalTextColor: formData?.globalTextColor ?? '#1f2937', // Default dark gray color
        customPhotosCount: formData?.customPhotosCount ?? 0,
      })

      // Refresh the form data to show the updated values
      await handleRefresh()

      toast.show({
        id: ID.unique(),
        placement: 'top',
        duration: 1500,
        render: ({ id }) => {
          const uniqueToastId = 'toast-' + id
          return (
            <Toast nativeID={uniqueToastId} action="success" variant="solid">
              <ToastTitle>{`Profile updated successfully!`}</ToastTitle>
            </Toast>
          )
        },
      })
    } catch (error) {
      toast.show({
        id: ID.unique(),
        placement: 'top',
        duration: 1500,
        render: ({ id }) => {
          const uniqueToastId = 'toast-' + id
          return (
            <Toast nativeID={uniqueToastId} action="error" variant="solid">
              <ToastTitle>{`Error updating profile`}</ToastTitle>
            </Toast>
          )
        },
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    // Set the AuthContext's isDeletingAccount flag immediately
    setDeletingAccount(true)
    setIsDeletingAccount(true)

    try {
      await deleteAccount()
      setShowDeleteModal(false)

      // Note: No success toast needed here as the user will be redirected to signin
      // The AuthContext will handle the redirect automatically
    } catch (error) {
      // Reset the deletion flags on error
      setDeletingAccount(false)
      setIsDeletingAccount(false)
      toast.show({
        id: ID.unique(),
        placement: 'top',
        duration: 3000,
        render: ({ id }) => {
          const uniqueToastId = 'toast-' + id
          return (
            <Toast nativeID={uniqueToastId} action="error" variant="solid">
              <ToastTitle>Failed to delete account. Please try again.</ToastTitle>
            </Toast>
          )
        },
      })
    }
    // Note: We don't reset the flags here because the user will be redirected
  }

  // Show loading state while fetching initial data
  if (isInitialLoading) {
    return (
      <VStack className="min-h-screen items-center justify-center" space="lg">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-center text-gray-600">Loading profile...</Text>
      </VStack>
    )
  }

  return (
    <>
      <ScrollView refreshControl={<RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />}>
        <VStack className="min-h-screen" space="xl">
          <VStack space="lg" className="p-6">
            <VStack space="lg">
              <HStack space="lg" className="justify-center">
                {/* Brokerage Logo */}
                <FormControl>
                  <FormControlLabel>
                    <FormControlLabelText className="font-medium text-gray-700">Brokerage Logo</FormControlLabelText>
                  </FormControlLabel>
                  <VStack space="sm">
                    <Pressable onPress={() => pickImage('brokerageLogo')} disabled={uploadingImage === 'brokerageLogo'}>
                      <VStack className="aspect-square h-40 w-40 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-gray-400">
                        {formData.brokerageLogo ? (
                          <VStack space="sm" className="min-h-40 w-40 items-center justify-center px-5">
                            <Image
                              source={{ uri: formData.brokerageLogo }}
                              className="min-h-40 w-40 rounded-lg p-4"
                              resizeMode="contain"
                            />
                            {uploadingImage === 'brokerageLogo' && (
                              <VStack space="xs" className="items-center">
                                <ActivityIndicator size="small" color="#3b82f6" />
                                <Text className="text-center text-sm text-blue-500">Uploading...</Text>
                              </VStack>
                            )}
                          </VStack>
                        ) : (
                          <VStack space="sm" className="min-h-40 w-40 items-center justify-center px-5">
                            {uploadingImage === 'brokerageLogo' ? (
                              <VStack space="xs" className="items-center">
                                <ActivityIndicator size="small" color="#3b82f6" />
                                <Text className="text-center text-sm text-blue-500">Selecting...</Text>
                              </VStack>
                            ) : (
                              <>
                                <Icon size="lg" className="text-gray-400" />
                                <Text className="text-center text-gray-500">Tap to select brokerage logo</Text>
                              </>
                            )}
                          </VStack>
                        )}
                      </VStack>
                    </Pressable>

                    {/* Clear Button - Only show when image exists */}
                    {formData.brokerageLogo && (
                      <Button
                        size="xs"
                        action="negative"
                        onPress={() => clearImage('brokerageLogo')}
                        disabled={uploadingImage === 'brokerageLogo'}
                        className="absolute bottom-0 left-0 right-0"
                      >
                        <ButtonText>Remove Logo</ButtonText>
                      </Button>
                    )}
                  </VStack>
                </FormControl>

                {/* Realtor Picture */}
                <FormControl>
                  <FormControlLabel>
                    <FormControlLabelText className="font-medium text-gray-700">Realtor Picture</FormControlLabelText>
                  </FormControlLabel>
                  <VStack space="sm">
                    <Pressable
                      onPress={() => pickImage('realtorPicture')}
                      disabled={uploadingImage === 'realtorPicture'}
                    >
                      <VStack className="aspect-square items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-gray-400">
                        {formData.realtorPicture ? (
                          <VStack space="sm" className="min-h-40 w-40 items-center justify-center px-5">
                            <Image
                              source={{ uri: formData.realtorPicture }}
                              className="min-h-40 w-40 rounded-lg p-4"
                              resizeMode="contain"
                            />
                            {uploadingImage === 'realtorPicture' && (
                              <VStack space="xs" className="items-center">
                                <ActivityIndicator size="small" color="#3b82f6" />
                                <Text className="text-center text-sm text-blue-500">Uploading...</Text>
                              </VStack>
                            )}
                          </VStack>
                        ) : (
                          <VStack space="sm" className="min-h-40 w-40 items-center justify-center px-5">
                            {uploadingImage === 'realtorPicture' ? (
                              <VStack space="xs" className="items-center">
                                <ActivityIndicator size="small" color="#3b82f6" />
                                <Text className="text-center text-sm text-blue-500">Selecting...</Text>
                              </VStack>
                            ) : (
                              <>
                                <Icon size="lg" className="text-gray-400" />
                                <Text className="text-center text-gray-500">Tap to select profile picture</Text>
                              </>
                            )}
                          </VStack>
                        )}
                      </VStack>
                    </Pressable>

                    {/* Clear Button - Only show when image exists */}
                    {formData.realtorPicture && (
                      <Button
                        size="xs"
                        action="negative"
                        onPress={() => clearImage('realtorPicture')}
                        disabled={uploadingImage === 'realtorPicture'}
                        className="absolute bottom-0 left-0 right-0"
                      >
                        <ButtonText>Remove Picture</ButtonText>
                      </Button>
                    )}
                  </VStack>
                </FormControl>
              </HStack>

              {/* First Name */}
              <FormControl>
                <FormControlLabel>
                  <FormControlLabelText className="font-medium text-gray-700">First Name *</FormControlLabelText>
                </FormControlLabel>
                <Input className="bg-white">
                  <InputField
                    placeholder="Enter your first name"
                    value={formData.firstName}
                    onChangeText={(value: string) => handleInputChange('firstName', value)}
                  />
                </Input>
              </FormControl>

              {/* Last Name */}
              <FormControl>
                <FormControlLabel>
                  <FormControlLabelText className="font-medium text-gray-700">Last Name *</FormControlLabelText>
                </FormControlLabel>
                <Input className="bg-white">
                  <InputField
                    placeholder="Enter your last name"
                    value={formData.lastName}
                    onChangeText={(value: string) => handleInputChange('lastName', value)}
                  />
                </Input>
              </FormControl>

              {/* Email */}
              <FormControl>
                <FormControlLabel>
                  <FormControlLabelText className="font-medium text-gray-700">Email *</FormControlLabelText>
                </FormControlLabel>
                <Input className="bg-white">
                  <InputField
                    placeholder="Enter your email"
                    value={formData.email}
                    onChangeText={(value: string) => handleInputChange('email', value)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </Input>
              </FormControl>

              {/* Phone Number */}
              <FormControl>
                <FormControlLabel>
                  <FormControlLabelText className="font-medium text-gray-700">Phone Number</FormControlLabelText>
                </FormControlLabel>
                <Input className="bg-white">
                  <InputField
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChangeText={(value: string) => handleInputChange('phone', value)}
                  />
                </Input>
              </FormControl>

              {/* Custom Photos Counter */}
              <FormControl>
                <FormControlLabel>
                  <FormControlLabelText className="font-medium text-gray-700">
                    Custom Photos Uploaded
                  </FormControlLabelText>
                </FormControlLabel>
                <VStack space="sm" className="rounded-lg bg-blue-50 p-4">
                  <HStack space="sm" className="items-center">
                    <Ionicons name="camera" size={20} color="#3b82f6" />
                    <Text className="text-lg font-semibold text-blue-700">
                      {formData.customPhotosCount} photos
                      {!isSubscribed && ` (${formData.customPhotosCount}/5)`}
                    </Text>
                  </HStack>
                  <Text className="text-sm text-blue-600">
                    {!isSubscribed && formData.customPhotosCount >= 5
                      ? 'Photo limit reached! Upgrade to Pro for unlimited photos.'
                      : !isSubscribed && formData.customPhotosCount > 0
                        ? `Total custom photos uploaded for your properties. ${5 - formData.customPhotosCount} photos remaining.`
                        : !isSubscribed
                          ? 'Total custom photos uploaded for your properties. 5 photos available.'
                          : 'Total custom photos uploaded for your properties'}
                  </Text>

                  {/* Upgrade Buttons for Free Users */}
                  {!isSubscribed && (
                    <Button size="sm" className="mt-2 bg-blue-600" onPress={() => router.push('/subscription')}>
                      <ButtonText className="text-white">Upgrade to Pro</ButtonText>
                    </Button>
                  )}

                  {/* Upgrade Suggestion for Users Close to Limit */}
                  {!isSubscribed && formData.customPhotosCount >= 3 && formData.customPhotosCount < 5 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 border-blue-500"
                      onPress={() => router.push('/subscription')}
                    >
                      <ButtonText className="text-blue-600">Upgrade for Unlimited Photos</ButtonText>
                    </Button>
                  )}
                </VStack>
              </FormControl>

              {/* Global Primary Color */}
              <FormControl>
                <FormControlLabel>
                  <FormControlLabelText className="font-medium text-gray-700">
                    Global Primary Color
                  </FormControlLabelText>
                </FormControlLabel>
                <VStack space="sm">
                  <Text className="text-gray-600">
                    This color will be used as the default primary color for all new posts
                  </Text>
                  <ColorPicker
                    selection={formData.globalPrimaryColor}
                    onValueChanged={(color: string) => handleInputChange('globalPrimaryColor', color)}
                    supportsOpacity={false}
                  />
                </VStack>
              </FormControl>

              {/* Global Secondary Color */}
              <FormControl>
                <FormControlLabel>
                  <FormControlLabelText className="font-medium text-gray-700">
                    Global Secondary Color
                  </FormControlLabelText>
                </FormControlLabel>
                <VStack space="sm">
                  <Text className="text-gray-600">
                    This color will be used as the default secondary color for all new posts
                  </Text>
                  <ColorPicker
                    selection={formData.globalSecondaryColor}
                    onValueChanged={(color: string) => handleInputChange('globalSecondaryColor', color)}
                    supportsOpacity={false}
                  />
                </VStack>
              </FormControl>

              {/* Global Text Color */}
              <FormControl>
                <FormControlLabel>
                  <FormControlLabelText className="font-medium text-gray-700">Global Text Color</FormControlLabelText>
                </FormControlLabel>
                <VStack space="sm">
                  <Text className="text-gray-600">
                    This color will be used as the default text color for all new posts
                  </Text>
                  <ColorPicker
                    selection={formData.globalTextColor}
                    onValueChanged={(color: string) => handleInputChange('globalTextColor', color)}
                    supportsOpacity={false}
                  />
                </VStack>
              </FormControl>

              {/* Submit Button */}
              <Button size="lg" onPress={handleSubmit} disabled={isLoading} className="mt-4">
                <ButtonText>{isLoading ? 'Updating...' : 'Update Profile'}</ButtonText>
              </Button>

              {/* Customer Center Button */}
              <Button
                size="lg"
                variant="outline"
                onPress={async () => {
                  try {
                    if (!RevenueCatUI || typeof RevenueCatUI.presentCustomerCenter !== 'function') {
                      throw new Error(
                        'RevenueCatUI is not properly imported or presentCustomerCenter method is not available'
                      )
                    }
                    await RevenueCatUI.presentCustomerCenter()
                  } catch (error) {
                    console.error('Error presenting customer center:', error)
                    toast.show({
                      id: ID.unique(),
                      placement: 'top',
                      duration: 3000,
                      render: ({ id }) => {
                        const uniqueToastId = 'toast-' + id
                        return (
                          <Toast nativeID={uniqueToastId} action="error" variant="solid">
                            <ToastTitle>Failed to open customer center</ToastTitle>
                          </Toast>
                        )
                      },
                    })
                  }
                }}
                className="mt-2"
              >
                <ButtonText>Customer Center</ButtonText>
              </Button>

              {/* Account Deletion Section */}
              <VStack space="md" className="mt-3 rounded-lg border border-red-200 bg-red-50 p-4">
                <Collapsible>
                  <CollapsibleTrigger>
                    <HStack space="sm" className="w-full items-center justify-between">
                      <HStack space="sm" className="items-center">
                        <Ionicons name="warning" size={24} color="#ef4444" />
                        <Text className="text-lg font-bold text-red-700">Danger Zone</Text>
                      </HStack>
                      <Ionicons name="chevron-down" size={20} color="#ef4444" />
                    </HStack>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <VStack space="md" className="mt-4">
                      <Text className="text-sm text-red-600">
                        Once you delete your account, there is no going back. Please be certain.
                      </Text>
                      <Button size="lg" action="negative" onPress={() => setShowDeleteModal(true)}>
                        <ButtonText>Delete Account</ButtonText>
                      </Button>
                    </VStack>
                  </CollapsibleContent>
                </Collapsible>
              </VStack>

              {/* Sign Out Button */}
              <Button size="lg" action="negative" variant="outline" onPress={signout} className="mt-2">
                <ButtonText className="text-red-500">Sign Out</ButtonText>
              </Button>

              <Image source={require('@/assets/images/icon.png')} className="mx-auto h-14 w-14" />
            </VStack>
          </VStack>
        </VStack>
      </ScrollView>

      {/* Delete Account Modal */}
      <DeleteAccountModal
        isVisible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        isLoading={isDeletingAccount}
      />
    </>
  )
}
