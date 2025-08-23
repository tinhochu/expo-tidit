import { Button, ButtonText } from '@/components/ui/button'
import { FormControl, FormControlLabel, FormControlLabelText } from '@/components/ui/form-control'
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
  getFileExtension,
  getMimeType,
  processProfileImage,
} from '@/lib/imageProcessor'
import { getUserPrefs, updateUserPrefs } from '@/lib/userService'
import * as ImagePicker from 'expo-image-picker'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Image, RefreshControl, ScrollView } from 'react-native'
import { ID } from 'react-native-appwrite'

export default function Profile() {
  const toast = useToast()
  const { signout, user } = useAuth()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    brokerageLogo: null,
    realtorPicture: null,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [uploadingImage, setUploadingImage] = useState<string | null>(null)

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
                // Clear the image from form data
                setFormData((prev) => ({ ...prev, [type]: null }))

                // Automatically save the updated preferences
                await updateUserPrefs(user?.$id, {
                  firstName: formData.firstName,
                  lastName: formData.lastName,
                  email: formData.email,
                  phone: formData.phone,
                  brokerageLogo: type === 'brokerageLogo' ? null : formData.brokerageLogo,
                  realtorPicture: type === 'realtorPicture' ? null : formData.realtorPicture,
                })

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
        setFormData((prev) => ({
          ...prev,
          [type]: `${process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!}/storage/buckets/${BUCKET_ID}/files/${response.$id}/view?project=${process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID}`,
        }))

        // Show final success toast with compression info
        toast.show({
          id: ID.unique(),
          placement: 'top',
          duration: 3000,
          render: ({ id }) => {
            const uniqueToastId = 'toast-' + id
            return (
              <Toast nativeID={uniqueToastId} action="success" variant="solid">
                <ToastTitle>{`${type === 'brokerageLogo' ? 'Brokerage logo' : 'Profile picture'} uploaded successfully!`}</ToastTitle>
              </Toast>
            )
          },
        })

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

            {/* Brokerage Logo */}
            <FormControl>
              <FormControlLabel>
                <FormControlLabelText className="font-medium text-gray-700">Brokerage Logo</FormControlLabelText>
              </FormControlLabel>
              <VStack space="sm">
                <Pressable onPress={() => pickImage('brokerageLogo')} disabled={uploadingImage === 'brokerageLogo'}>
                  <VStack
                    className="items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-4"
                    style={{ minHeight: 100 }}
                  >
                    {formData.brokerageLogo ? (
                      <VStack space="sm" className="items-center">
                        <Image
                          source={{ uri: formData.brokerageLogo }}
                          className="h-24 w-24 rounded-lg"
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
                      <VStack space="sm" className="items-center">
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
                    size="sm"
                    action="negative"
                    variant="outline"
                    onPress={() => clearImage('brokerageLogo')}
                    disabled={uploadingImage === 'brokerageLogo'}
                    className="self-center"
                  >
                    <ButtonText className="text-red-500">Remove Logo</ButtonText>
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
                <Pressable onPress={() => pickImage('realtorPicture')} disabled={uploadingImage === 'realtorPicture'}>
                  <VStack
                    className="items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-4"
                    style={{ minHeight: 100 }}
                  >
                    {formData.realtorPicture ? (
                      <VStack space="sm" className="items-center">
                        <Image
                          source={{ uri: formData.realtorPicture }}
                          className="h-24 w-24 rounded-lg"
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
                      <VStack space="sm" className="items-center">
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
                    size="sm"
                    action="negative"
                    variant="outline"
                    onPress={() => clearImage('realtorPicture')}
                    disabled={uploadingImage === 'realtorPicture'}
                    className="self-center"
                  >
                    <ButtonText className="text-red-500">Remove Picture</ButtonText>
                  </Button>
                )}
              </VStack>
            </FormControl>

            {/* Submit Button */}
            <Button size="lg" onPress={handleSubmit} disabled={isLoading} className="mt-4">
              <ButtonText>{isLoading ? 'Updating...' : 'Update Profile'}</ButtonText>
            </Button>

            {/* Sign Out Button */}
            <Button size="lg" action="negative" variant="outline" onPress={signout} className="mt-2">
              <ButtonText className="text-red-500">Sign Out</ButtonText>
            </Button>
          </VStack>
        </VStack>
      </VStack>
    </ScrollView>
  )
}
