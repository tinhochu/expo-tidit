import { Box } from '@/components/ui/box'
import { Button, ButtonText } from '@/components/ui/button'
import {
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
} from '@/components/ui/form-control'
import { Heading } from '@/components/ui/heading'
import { HStack } from '@/components/ui/hstack'
import { ChevronDownIcon } from '@/components/ui/icon'
import { Image } from '@/components/ui/image'
import { Input, InputField, InputSlot } from '@/components/ui/input'
import {
  Select,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicator,
  SelectDragIndicatorWrapper,
  SelectIcon,
  SelectInput,
  SelectItem,
  SelectPortal,
  SelectTrigger,
} from '@/components/ui/select'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { useAuth } from '@/context/AuthContext'
import { useSubscription } from '@/context/SubscriptionContext'
import { AddressSuggestion, getPropertyDetails, searchAddresses } from '@/lib/addressService'
import { checkForDuplicatePost, createPost, getPostCountByUserId } from '@/lib/postService'
import AntDesign from '@expo/vector-icons/AntDesign'
import { router } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native'

interface PropertyFormData {
  fullAddress: string
  line: string
  city: string
  state: string
  postalCode: string
  bedrooms: string
  bathrooms: string
  squareFeet: string
  price: string
  postType: 'JUST_LISTED' | 'JUST_SOLD' | 'JUST_RENTED' | 'OPEN_HOUSE' | 'UNDER_CONTRACT' | 'BACK_ON_MARKET'
}

export default function CreatePost() {
  const addressInputRef = useRef<any>(null)
  const { user } = useAuth()
  const { isSubscribed } = useSubscription()

  const [formData, setFormData] = useState<PropertyFormData>({
    fullAddress: '',
    line: '',
    city: '',
    state: '',
    postalCode: '',
    price: '',
    bedrooms: '',
    bathrooms: '',
    squareFeet: '',
    postType: 'JUST_LISTED',
  })

  const [addressQuery, setAddressQuery] = useState('')
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState<AddressSuggestion | null>(null)
  const [propertyDetails, setPropertyDetails] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [fetchingPropertyDetails, setFetchingPropertyDetails] = useState(false)
  const [errors, setErrors] = useState<Partial<PropertyFormData>>({})
  const [duplicateStatus, setDuplicateStatus] = useState<Record<string, boolean>>({})
  const [checkingDuplicates, setCheckingDuplicates] = useState(false)
  const [currentPostCount, setCurrentPostCount] = useState<number>(0)

  // Fetch current post count when component mounts
  useEffect(() => {
    const fetchPostCount = async () => {
      if (user?.$id) {
        try {
          const count = await getPostCountByUserId(user.$id)
          setCurrentPostCount(count)
        } catch (error) {
          console.error('Error fetching post count:', error)
        }
      }
    }

    fetchPostCount()
  }, [user?.$id])

  const refreshPostCount = async () => {
    if (user?.$id) {
      try {
        const count = await getPostCountByUserId(user.$id)
        setCurrentPostCount(count)
      } catch (error) {
        console.error('Error refreshing post count:', error)
      }
    }
  }

  // *Debounced address search
  const searchAddress = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setAddressSuggestions([])
      setShowSuggestions(false)
      return
    }

    setSearching(true)
    try {
      const suggestions = await searchAddresses(query)
      setAddressSuggestions(suggestions)
      setShowSuggestions(suggestions.length > 0)
    } catch (error) {
      console.error('Error searching addresses:', error)
      setAddressSuggestions([])
      setShowSuggestions(false)
    } finally {
      setSearching(false)
    }
  }, [])

  // * Debounce address search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchAddress(addressQuery)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [addressQuery, searchAddress])

  // * Check for duplicates when address suggestions change
  useEffect(() => {
    if (!addressSuggestions.length || !user?.$id) return

    const checkDuplicates = async () => {
      setCheckingDuplicates(true)
      const duplicateMap: Record<string, boolean> = {}

      for (const suggestion of addressSuggestions) {
        try {
          const isDuplicate = await checkForDuplicatePost(user.$id, suggestion.line)
          duplicateMap[suggestion._id] = isDuplicate
        } catch (error) {
          console.error('Error checking duplicate for address:', suggestion.line, error)
          duplicateMap[suggestion._id] = false
        }
      }

      setDuplicateStatus(duplicateMap)
      setCheckingDuplicates(false)
    }

    // Only check duplicates if suggestions have been stable for a moment
    const timeoutId = setTimeout(() => {
      checkDuplicates()
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [addressSuggestions, user?.$id])

  useEffect(() => {
    if (!selectedAddress) return

    const fetchPropertyDetails = async () => {
      setFetchingPropertyDetails(true)
      try {
        const response = await getPropertyDetails(selectedAddress._id)
        setPropertyDetails(response.home)
      } catch (error) {
        console.error('Error fetching property details:', error)
        // Optionally show an error message to the user
      } finally {
        setFetchingPropertyDetails(false)
      }
    }

    fetchPropertyDetails()
  }, [selectedAddress])

  useEffect(() => {
    if (!propertyDetails) return

    // Check if list_price exists, if not, look for other possible price fields
    const price = propertyDetails?.list_price || propertyDetails?.price || propertyDetails?.listing_price || ''

    // Check for bedrooms - try multiple possible field names
    const bedrooms = propertyDetails?.description?.beds || ''

    // Check for bathrooms - try multiple possible field names
    const bathrooms = propertyDetails?.description?.baths || ''

    // Check for square feet - try multiple possible field names
    const squareFeet = propertyDetails?.description?.sqft || ''

    setFormData((prev) => {
      const updated = {
        ...prev,
        price: price?.toString() || '',
        bedrooms: bedrooms?.toString() || '',
        bathrooms: bathrooms?.toString() || '',
        squareFeet: squareFeet?.toString() || '',
      }

      return updated
    })
  }, [propertyDetails])

  const handleAddressSelect = (suggestion: AddressSuggestion) => {
    setSelectedAddress(suggestion)

    setFormData((prev) => ({
      ...prev,
      fullAddress: suggestion.full_address[0],
      line: suggestion.line,
      city: suggestion.city,
      state: suggestion.state_code,
      postalCode: suggestion.postal_code,
    }))

    setAddressQuery(suggestion.line)

    setShowSuggestions(false)

    // Remove focus from the address input field
    if (addressInputRef.current) {
      addressInputRef.current.blur()
    }
  }

  const handleInputChange = (field: keyof PropertyFormData, value: string) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value }
      return updated
    })

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<PropertyFormData> = {}

    // if (!formData.postalCode.trim()) newErrors.postalCode = 'ZIP code is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill in all required fields')
      return
    }

    // Check post limit before proceeding
    if (!isSubscribed && currentPostCount >= 3) {
      Alert.alert(
        'Post Limit Reached',
        'You have reached the maximum limit of 3 posts for free users. Please upgrade to Pro to create more posts.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Upgrade to Pro',
            onPress: () => router.push('/subscription?returnRoute=/create-post'),
          },
        ]
      )
      return
    }

    setLoading(true)
    try {
      // Check for duplicate posts before creating
      const isDuplicate = await checkForDuplicatePost(user?.$id || '', selectedAddress?.line || '')

      if (isDuplicate) {
        Alert.alert('Duplicate Post', 'A post for this property already exists. Please check your existing posts.')
        setLoading(false)
        return
      }

      await createPost({
        title: selectedAddress?.full_address[0] || '',
        propInformation: {
          ...propertyDetails,
          ...formData,
        },
        userId: user?.$id,
        postType: formData.postType,
      })

      Alert.alert('Success', 'Post created successfully!', [
        {
          text: 'OK',
          onPress: () => {
            router.back()
            refreshPostCount()
          },
        },
      ])
    } catch (error) {
      console.error('Error creating post:', error)
      Alert.alert('Error', 'Failed to create post. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const onChangeAddress = () => {
    setSelectedAddress(null)
    // Don't clear addressQuery or suggestions - keep them visible
    // setAddressQuery('')
    setFormData((prev) => ({
      ...prev,
      fullAddress: '',
      line: '',
      city: '',
      state: '',
      postalCode: '',
    }))

    setShowSuggestions(true)
    setDuplicateStatus({})
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.select({ ios: 64, android: 0 })}
    >
      <VStack className="min-h-screen">
        <Box className="border-b border-gray-200 bg-white p-2 px-5 pt-[72px]">
          <HStack className="items-center justify-start gap-5">
            <Pressable onPress={() => router.push('/')}>
              <AntDesign size={24} name="back" color="black" />
            </Pressable>
            <Heading size="xl">Create Post</Heading>
          </HStack>
        </Box>

        <SafeAreaView>
          <VStack className="px-5 pt-8" space="xl">
            {/* Post Count Indicator for Non-Subscribed Users */}
            {!isSubscribed && (
              <VStack space="sm" className="items-center">
                <Box className="w-full max-w-md rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <HStack className="mb-2 items-center justify-center gap-2">
                    <AntDesign name="infocirlce" size={16} color="#1E40AF" />
                    <Text className="font-medium text-blue-800">Free Plan Post Limit</Text>
                  </HStack>
                  <Text className="text-center text-sm text-blue-700">
                    You have created {currentPostCount} of 3 posts.{' '}
                    {currentPostCount >= 3
                      ? 'Upgrade to Pro for unlimited posts!'
                      : 'You can create ' + (3 - currentPostCount) + ' more posts.'}
                  </Text>
                  {currentPostCount >= 3 && (
                    <TouchableOpacity
                      onPress={() => router.push('/subscription?returnRoute=/create-post')}
                      className="mt-3 rounded-lg bg-blue-600 px-4 py-2"
                    >
                      <Text className="text-center font-medium text-white">Upgrade to Pro</Text>
                    </TouchableOpacity>
                  )}
                </Box>
              </VStack>
            )}

            {/* Address Search Section */}
            {!selectedAddress && (
              <VStack space="lg" className="items-center">
                <VStack space="md" className="w-full max-w-md">
                  <Heading size="lg" className="text-center">
                    Find the Property
                  </Heading>
                  <Text className="text-center text-gray-600">Start by searching for the property address</Text>

                  {/* Address Search Input */}
                  <Box className="relative">
                    <Input
                      size="lg"
                      className={`border-2 border-gray-200 bg-white pr-2 ${!isSubscribed && currentPostCount >= 3 ? 'opacity-50' : ''}`}
                      isDisabled={!isSubscribed && currentPostCount >= 3}
                    >
                      <InputField
                        ref={addressInputRef}
                        placeholder={
                          !isSubscribed && currentPostCount >= 3
                            ? 'Post limit reached - Upgrade to Pro'
                            : 'Enter property address...'
                        }
                        value={addressQuery}
                        onChangeText={setAddressQuery}
                        onFocus={() => {
                          if (addressQuery.length >= 1) {
                            setShowSuggestions(true)
                          }
                        }}
                        editable={isSubscribed || currentPostCount < 3}
                      />
                      <InputSlot className="mr-2">
                        {searching && !selectedAddress ? (
                          <Box className="animate-spin">
                            <AntDesign name="loading2" size={16} color="#1E40AF" />
                          </Box>
                        ) : addressQuery.length > 0 ? (
                          <TouchableOpacity
                            onPress={() => {
                              setAddressQuery('')
                              setAddressSuggestions([])
                              setShowSuggestions(false)
                              setSelectedAddress(null)
                              setDuplicateStatus({})
                              setFormData((prev) => ({
                                ...prev,
                                fullAddress: '',
                                line: '',
                                city: '',
                                state: '',
                                postalCode: '',
                              }))
                            }}
                            activeOpacity={0.7}
                          >
                            <AntDesign name="closecircle" size={16} color="#6B7280" />
                          </TouchableOpacity>
                        ) : null}
                      </InputSlot>
                    </Input>

                    {/* Address Suggestions Dropdown */}
                    {showSuggestions && addressSuggestions.length >= 2 && (
                      <Box className="mt-2">
                        <HStack className="items-center justify-between">
                          <Heading>Property Suggestions</Heading>
                          {checkingDuplicates && (
                            <HStack className="items-center" space="xs">
                              <Box className="animate-spin">
                                <AntDesign name="loading2" size={14} color="#6B7280" />
                              </Box>
                              <Text className="text-xs text-gray-500">Checking posts...</Text>
                            </HStack>
                          )}
                        </HStack>
                        <ScrollView className="mt-2 max-h-96 min-h-[200px]">
                          <Box>
                            {addressSuggestions.map((suggestion) => (
                              <TouchableOpacity
                                key={suggestion._id}
                                onPress={() => {
                                  if (duplicateStatus[suggestion._id]) {
                                    Alert.alert(
                                      'Already Posted',
                                      'This property address is already in your posts. You cannot create duplicate posts for the same property.',
                                      [{ text: 'OK' }]
                                    )
                                    return
                                  }
                                  handleAddressSelect(suggestion)
                                }}
                                activeOpacity={0.7}
                                style={{ marginBottom: 8 }}
                                disabled={duplicateStatus[suggestion._id]}
                              >
                                <Box
                                  className={`rounded-lg border p-3 ${
                                    duplicateStatus[suggestion._id]
                                      ? 'border-red-200 bg-red-50'
                                      : 'border-gray-200 bg-gray-50'
                                  }`}
                                >
                                  <VStack space="xs">
                                    <HStack className="items-center justify-between">
                                      <Text
                                        className={`text-base font-semibold ${
                                          duplicateStatus[suggestion._id] ? 'text-red-900' : 'text-gray-900'
                                        }`}
                                      >
                                        {suggestion.line}
                                      </Text>
                                      {checkingDuplicates ? (
                                        <Box className="rounded-full bg-gray-100 px-2 py-1">
                                          <HStack className="items-center" space="xs">
                                            <Box className="animate-spin">
                                              <AntDesign name="loading2" size={10} color="#6B7280" />
                                            </Box>
                                            <Text className="text-xs font-medium text-gray-600">Checking...</Text>
                                          </HStack>
                                        </Box>
                                      ) : duplicateStatus[suggestion._id] ? (
                                        <Box className="rounded-full bg-red-100 px-2 py-1">
                                          <Text className="text-xs font-medium text-red-700">Already Posted</Text>
                                        </Box>
                                      ) : (
                                        <Box className="rounded-full bg-green-100 px-2 py-1">
                                          <Text className="text-xs font-medium text-green-700">Available</Text>
                                        </Box>
                                      )}
                                    </HStack>
                                    <Text
                                      className={`text-sm ${
                                        duplicateStatus[suggestion._id] ? 'text-red-600' : 'text-gray-600'
                                      }`}
                                    >
                                      {suggestion.city}, {suggestion.state_code} {suggestion.postal_code}
                                    </Text>
                                  </VStack>
                                </Box>
                              </TouchableOpacity>
                            ))}
                          </Box>
                        </ScrollView>
                        {/* Summary of duplicate status */}
                        {!checkingDuplicates && addressSuggestions.length > 0 && (
                          <Box className="mt-2 rounded-lg bg-blue-50 p-3">
                            <Text className="text-center text-sm text-blue-700">
                              {Object.values(duplicateStatus).some(Boolean)
                                ? 'Some addresses are already in your posts (shown in red)'
                                : 'All addresses are available to post'}
                            </Text>
                          </Box>
                        )}
                        <HStack className="items-center justify-center">
                          <Image
                            source={require('@/assets/images/splash-icon-dark.png')}
                            className="mt-4 h-16 w-16"
                            alt="Tidit Logo"
                          />
                        </HStack>
                      </Box>
                    )}
                  </Box>
                </VStack>
              </VStack>
            )}

            {/* Property Form - Only show after address is selected */}
            {selectedAddress && (
              <VStack space="lg" className="w-full">
                {/* Selected Address Display */}
                <VStack className="flex-1">
                  <Heading size="lg">{selectedAddress.full_address[0]}</Heading>
                </VStack>

                {/* Post Limit Reached Message */}
                {!isSubscribed && currentPostCount >= 3 ? (
                  <VStack space="lg" className="items-center py-8">
                    <Box className="w-full max-w-md rounded-lg border border-red-200 bg-red-50 p-6">
                      <HStack className="mb-3 items-center justify-center gap-2">
                        <AntDesign name="exclamationcircle" size={24} color="#DC2626" />
                        <Text className="text-lg font-medium text-red-800">Post Limit Reached</Text>
                      </HStack>
                      <Text className="mb-4 text-center text-sm text-red-700">
                        You have reached the maximum limit of 3 posts for free users. To create more posts, please
                        upgrade to our Pro plan.
                      </Text>
                      <TouchableOpacity
                        onPress={() => router.push('/subscription?returnRoute=/create-post')}
                        className="rounded-lg bg-red-600 px-6 py-3"
                      >
                        <Text className="text-center font-medium text-white">Upgrade to Pro</Text>
                      </TouchableOpacity>
                    </Box>
                  </VStack>
                ) : (
                  <>
                    {/* Loading State for Property Details */}
                    {fetchingPropertyDetails && (
                      <VStack space="md" className="items-center py-8">
                        <Box className="animate-spin">
                          <AntDesign name="loading2" size={24} color="#1E40AF" />
                        </Box>
                        <Text className="text-gray-600">Loading property details...</Text>
                      </VStack>
                    )}

                    {/* Basic Information - Only show when not loading */}
                    {!fetchingPropertyDetails && (
                      <VStack space="md">
                        <FormControl isInvalid={!!errors.price} isRequired>
                          <FormControlLabel>
                            <FormControlLabelText>Post Type</FormControlLabelText>
                          </FormControlLabel>
                          <Select className="bg-white" onValueChange={(value) => handleInputChange('postType', value)}>
                            <SelectTrigger>
                              <SelectInput placeholder="Select option" className="flex-1" />
                              <SelectIcon className="mr-3" as={ChevronDownIcon} />
                            </SelectTrigger>
                            <SelectPortal>
                              <SelectBackdrop />
                              <SelectContent>
                                <SelectDragIndicatorWrapper>
                                  <SelectDragIndicator />
                                </SelectDragIndicatorWrapper>
                                <SelectItem label="Just Listed" value="JUST_LISTED" />
                                <SelectItem label="Just Sold" value="JUST_SOLD" />
                                <SelectItem label="Just Rented" value="JUST_RENTED" />
                                <SelectItem label="Open House" value="OPEN_HOUSE" />
                                <SelectItem label="Under Contract" value="UNDER_CONTRACT" />
                                <SelectItem label="Back on Market" value="BACK_ON_MARKET" />
                              </SelectContent>
                            </SelectPortal>
                          </Select>
                          {errors.price && (
                            <FormControlError>
                              <FormControlErrorText>{errors.price}</FormControlErrorText>
                            </FormControlError>
                          )}
                        </FormControl>

                        <FormControl isInvalid={!!errors.price} isRequired>
                          <FormControlLabel>
                            <FormControlLabelText>Price</FormControlLabelText>
                          </FormControlLabel>
                          <Input className="bg-white">
                            <InputField
                              placeholder="Enter price..."
                              value={formData.price}
                              onChangeText={(value) => handleInputChange('price', value)}
                              keyboardType="numeric"
                            />
                          </Input>
                          {errors.price && (
                            <FormControlError>
                              <FormControlErrorText>{errors.price}</FormControlErrorText>
                            </FormControlError>
                          )}
                        </FormControl>

                        <HStack space="md">
                          <FormControl className="flex-1">
                            <FormControlLabel>
                              <FormControlLabelText>Bedrooms</FormControlLabelText>
                            </FormControlLabel>
                            <Input className="bg-white">
                              <InputField
                                placeholder="Bedrooms"
                                value={formData.bedrooms}
                                onChangeText={(value) => handleInputChange('bedrooms', value)}
                                keyboardType="numeric"
                              />
                            </Input>
                          </FormControl>

                          <FormControl className="flex-1">
                            <FormControlLabel>
                              <FormControlLabelText>Bathrooms</FormControlLabelText>
                            </FormControlLabel>
                            <Input className="bg-white">
                              <InputField
                                placeholder="Bathrooms"
                                value={formData.bathrooms}
                                onChangeText={(value) => handleInputChange('bathrooms', value)}
                                keyboardType="numeric"
                              />
                            </Input>
                          </FormControl>
                        </HStack>

                        <FormControl>
                          <FormControlLabel>
                            <FormControlLabelText>Square Feet</FormControlLabelText>
                          </FormControlLabel>
                          <Input className="bg-white">
                            <InputField
                              placeholder="Square footage"
                              value={formData.squareFeet}
                              onChangeText={(value) => handleInputChange('squareFeet', value)}
                              keyboardType="numeric"
                            />
                          </Input>
                        </FormControl>
                      </VStack>
                    )}

                    {/* Submit Button - Only show when not loading */}
                    {!fetchingPropertyDetails && (
                      <VStack className="pb-8" space="md">
                        <Button
                          size="xl"
                          onPress={handleSubmit}
                          disabled={loading || (!isSubscribed && currentPostCount >= 3)}
                          className={`${!isSubscribed && currentPostCount >= 3 ? 'bg-gray-400' : 'bg-blue-600'}`}
                        >
                          <ButtonText>
                            {loading
                              ? 'Creating Post...'
                              : !isSubscribed && currentPostCount >= 3
                                ? 'Post Limit Reached'
                                : 'Create Post'}
                          </ButtonText>
                        </Button>

                        {!isSubscribed && currentPostCount >= 3 && (
                          <Box className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                            <Text className="text-center text-sm text-yellow-800">
                              You've reached your free plan limit. Upgrade to Pro to create unlimited posts!
                            </Text>
                            <TouchableOpacity
                              onPress={() => router.push('/subscription?returnRoute=/create-post')}
                              className="mt-2 rounded-lg bg-yellow-600 px-4 py-2"
                            >
                              <Text className="text-center font-medium text-white">Upgrade to Pro</Text>
                            </TouchableOpacity>
                          </Box>
                        )}

                        <Button onPress={onChangeAddress} variant="link" action="secondary">
                          <ButtonText>Change Address</ButtonText>
                        </Button>
                      </VStack>
                    )}
                  </>
                )}
              </VStack>
            )}
          </VStack>
        </SafeAreaView>
      </VStack>
    </KeyboardAvoidingView>
  )
}
