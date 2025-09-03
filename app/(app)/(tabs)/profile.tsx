import DeleteAccountModal from '@/components/DeleteAccountModal'
import { Button, ButtonText } from '@/components/ui/button'
import { FormControl, FormControlLabel, FormControlLabelText } from '@/components/ui/form-control'
import { HStack } from '@/components/ui/hstack'
import { Icon } from '@/components/ui/icon'
import { Input, InputField } from '@/components/ui/input'
import { Pressable } from '@/components/ui/pressable'
import { Text } from '@/components/ui/text'
import { Toast, ToastTitle, useToast } from '@/components/ui/toast'
import { VStack } from '@/components/ui/vstack'
import { useAuth } from '@/context/AuthContext'
import { BUCKET_ID, storage } from '@/lib/appwriteConfig'
import {
  cleanupTempImages,
  formatFileSize,
  getCompressionStats,
  getMimeType,
  processProfileImage,
} from '@/lib/imageProcessor'
import { getUserPrefs, updateUserPrefs } from '@/lib/userService'
import { ColorPicker } from '@expo/ui/swift-ui'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Image, RefreshControl, ScrollView } from 'react-native'
import { ID } from 'react-native-appwrite'
import RevenueCatUI from 'react-native-purchases-ui'

export default function Profile() {
  const toast = useToast()
  const { signout, user, deleteAccount, setDeletingAccount } = useAuth()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    brokerageLogo: null,
    realtorPicture: null,
    globalPrimaryColor: '#3b82f6', // Default blue color
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
            globalPrimaryColor: userPrefs.globalPrimaryColor || '#3b82f6', // Default blue color
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
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio for profile images
        quality: 1, // Use full quality for processing
      })

      if (result.canceled || !result.assets[0]) {
        setUploadingImage(null)
        return
      }

      const originalImageUri = result.assets[0].uri

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
      const processedImage = await processProfileImage(originalImageUri, type)

      // Get compression statistics
      const compressionStats = await getCompressionStats(originalImageUri, processedImage.uri)

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
        const file = await fetch(processedImage.uri).then((r) => r.blob())

        // Determine file extension and MIME type based on processed format
        const fileExtension = processedImage.format
        const mimeType = getMimeType(fileExtension)

        const response = await storage.createFile(BUCKET_ID, ID.unique(), {
          name: `${user?.$id}-${type}.${fileExtension}`,
          type: mimeType,
          size: file.size,
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

        console.log(
          `Image compression stats: Original: ${formatFileSize(compressionStats.originalSize)}, Processed: ${formatFileSize(compressionStats.processedSize)}, Reduction: ${compressionStats.compressionRatio.toFixed(1)}%`
        )
      } catch (uploadError) {
        console.log('Upload error:', uploadError)
        Alert.alert('Error', `Failed to upload ${type === 'brokerageLogo' ? 'brokerage logo' : 'profile picture'}`)
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
                              className="min-h-40 w-40 rounded-lg"
                              resizeMode="cover"
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
                              className="min-h-40 w-40 rounded-lg"
                              resizeMode="cover"
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

              {/* Sign Out Button */}
              <Button size="lg" action="negative" variant="outline" onPress={signout} className="mt-2">
                <ButtonText className="text-red-500">Sign Out</ButtonText>
              </Button>

              {/* Account Deletion Section */}
              <VStack space="md" className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4">
                <HStack space="sm" className="items-center">
                  <Ionicons name="warning" size={24} color="#ef4444" />
                  <Text className="text-lg font-bold text-red-700">Danger Zone</Text>
                </HStack>
                <Text className="text-sm text-red-600">
                  Once you delete your account, there is no going back. Please be certain.
                </Text>
                <Button size="lg" action="negative" onPress={() => setShowDeleteModal(true)} className="mt-2">
                  <ButtonText>Delete Account</ButtonText>
                </Button>
              </VStack>

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
