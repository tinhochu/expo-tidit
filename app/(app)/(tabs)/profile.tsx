import { Button, ButtonText } from '@/components/ui/button'
import { FormControl, FormControlLabel, FormControlLabelText } from '@/components/ui/form-control'
import { Icon } from '@/components/ui/icon'
import { Input, InputField } from '@/components/ui/input'
import { Pressable } from '@/components/ui/pressable'
import { Text } from '@/components/ui/text'
import { Toast, ToastTitle, useToast } from '@/components/ui/toast'
import { VStack } from '@/components/ui/vstack'
import { useAuth } from '@/context/AuthContext'
import { useOnboarding } from '@/context/OnboardingContext'
import { BUCKET_ID, storage } from '@/lib/appwriteConfig'
import { getUserPrefs, updateUserPrefs } from '@/lib/userService'
import * as ImagePicker from 'expo-image-picker'
import { router } from 'expo-router'
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

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const pickImage = async (type: 'brokerageLogo' | 'realtorPicture') => {
    try {
      setUploadingImage(type)

      // Launch image picker
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio for profile images
        quality: 0.8,
      })

      if (result.canceled || !result.assets[0]) {
        setUploadingImage(null)
        return
      }

      const imageUri = result.assets[0].uri

      // Set the local image URI for immediate display
      setFormData((prev) => ({ ...prev, [type]: imageUri }))

      // Show toast for image selection
      toast.show({
        id: ID.unique(),
        placement: 'top',
        duration: 1500,
        render: ({ id }) => {
          const uniqueToastId = 'toast-' + id
          return (
            <Toast nativeID={uniqueToastId} action="info" variant="solid">
              <ToastTitle>{`Uploading ${type === 'brokerageLogo' ? 'Brokerage logo' : 'Profile picture'}`}</ToastTitle>
            </Toast>
          )
        },
      })

      // Now upload to storage
      try {
        const file = await fetch(imageUri).then((r) => r.blob())
        const response = await storage.createFile(BUCKET_ID, ID.unique(), {
          name: `${user?.$id}-${type}.jpg`,
          type: 'image/jpeg',
          size: file.size,
          uri: imageUri,
        })

        // Update with the uploaded image URL
        setFormData((prev) => ({
          ...prev,
          [type]: `${process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!}/storage/buckets/${BUCKET_ID}/files/${response.$id}/view?project=${process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID}`,
        }))

        toast.show({
          id: ID.unique(),
          placement: 'top',
          duration: 1500,
          render: ({ id }) => {
            const uniqueToastId = 'toast-' + id
            return (
              <Toast nativeID={uniqueToastId} action="success" variant="solid">
                <ToastTitle>{`${type === 'brokerageLogo' ? 'Brokerage logo' : 'Profile picture'} uploaded successfully!`}</ToastTitle>
              </Toast>
            )
          },
        })
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
        brokerageLogo: formData?.brokerageLogo ?? '',
        realtorPicture: formData?.realtorPicture ?? '',
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
            </FormControl>

            {/* Realtor Picture */}
            <FormControl>
              <FormControlLabel>
                <FormControlLabelText className="font-medium text-gray-700">Realtor Picture</FormControlLabelText>
              </FormControlLabel>
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
