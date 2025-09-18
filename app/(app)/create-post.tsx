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
import * as ImagePicker from 'expo-image-picker'
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
  postType:
    | 'JUST_LISTED'
    | 'JUST_SOLD'
    | 'JUST_RENTED'
    | 'OPEN_HOUSE'
    | 'UNDER_CONTRACT'
    | 'BACK_ON_MARKET'
    | 'COMING_SOON'
    | 'PRICE_DROP'
  currency: string
  // International property fields
  country: 'USA' | 'International'
  unitType: 'sqft' | 'm2'
  // International address fields
  countryName?: string
  province?: string
  // Image upload
  propertyImage?: string
}

export default function CreatePost() {
  const addressInputRef = useRef<any>(null)
  const { user, isDeletingAccount } = useAuth()
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
    currency: 'USD',
    country: 'USA',
    unitType: 'sqft',
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

  // Multi-step form state
  const [currentStep, setCurrentStep] = useState(1)
  const [showCountrySelection, setShowCountrySelection] = useState(true)
  const [isInternationalForm, setIsInternationalForm] = useState(false)
  const [showUSAMethodSelection, setShowUSAMethodSelection] = useState(false)
  const [isManualUSAForm, setIsManualUSAForm] = useState(false)

  // Fetch current post count when component mounts
  useEffect(() => {
    const fetchPostCount = async () => {
      if (user?.$id && !isDeletingAccount) {
        try {
          const count = await getPostCountByUserId(user.$id)
          setCurrentPostCount(count)
        } catch (error) {
          console.error('Error fetching post count:', error)
        }
      }
    }

    fetchPostCount()
  }, [user?.$id, isDeletingAccount])

  const refreshPostCount = async () => {
    if (user?.$id && !isDeletingAccount) {
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
    if (!addressSuggestions.length || !user?.$id || isDeletingAccount) return

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
  }, [addressSuggestions, user?.$id, isDeletingAccount])

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

    // Check for bedrooms - try multiple possible field names
    const bedrooms = propertyDetails?.description?.beds || ''

    // Check for bathrooms - try multiple possible field names
    const bathrooms = propertyDetails?.description?.baths || ''

    // Check for square feet - try multiple possible field names
    const squareFeet = propertyDetails?.description?.sqft || ''

    setFormData((prev) => {
      const updated = {
        ...prev,
        bedrooms: bedrooms?.toString() || '',
        bathrooms: bathrooms?.toString() || '',
        squareFeet: squareFeet?.toString() || '',
        currency: 'USD',
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

    if (isInternationalForm) {
      // Validate international form fields
      if (!formData.line.trim()) newErrors.line = 'Street address is required'
      if (!formData.city.trim()) newErrors.city = 'City is required'
      if (!formData.countryName?.trim()) newErrors.countryName = 'Country is required'
      if (!formData.bedrooms.trim()) newErrors.bedrooms = 'Bedrooms is required'
      if (!formData.bathrooms.trim()) newErrors.bathrooms = 'Bathrooms is required'
      if (!formData.squareFeet.trim()) newErrors.squareFeet = 'Area is required'
    } else if (isManualUSAForm) {
      // Validate manual USA form fields
      if (!formData.line.trim()) newErrors.line = 'Street address is required'
      if (!formData.city.trim()) newErrors.city = 'City is required'
      if (!formData.state.trim()) newErrors.state = 'State is required'
      if (!formData.postalCode.trim()) newErrors.postalCode = 'ZIP code is required'
      if (!formData.bedrooms.trim()) newErrors.bedrooms = 'Bedrooms is required'
      if (!formData.bathrooms.trim()) newErrors.bathrooms = 'Bathrooms is required'
      if (!formData.squareFeet.trim()) newErrors.squareFeet = 'Square feet is required'
    } else {
      // Validate USA search form fields
      // if (!formData.postalCode.trim()) newErrors.postalCode = 'ZIP code is required'
    }

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
        title: isInternationalForm
          ? `${formData.line}, ${formData.city}, ${formData.countryName}`
          : isManualUSAForm
            ? `${formData.line}, ${formData.city}, ${formData.state}`
            : selectedAddress?.full_address[0] || '',
        propInformation: {
          ...propertyDetails,
          ...formData,
          currency: formData.currency,
          // For international properties, use the manually entered data
          ...(isInternationalForm && {
            line: formData.line,
            city: formData.city,
            state: formData.province || formData.state,
            postalCode: formData.postalCode,
            country: formData.countryName,
            description: {
              beds: formData.bedrooms,
              baths: formData.bathrooms,
              sqft: formData.squareFeet,
              unitType: formData.unitType,
            },
            propertyImage: formData.propertyImage,
          }),
          // For manual USA properties, use the manually entered data
          ...(isManualUSAForm && {
            line: formData.line,
            city: formData.city,
            state: formData.state,
            postalCode: formData.postalCode,
            description: {
              beds: formData.bedrooms,
              baths: formData.bathrooms,
              sqft: formData.squareFeet,
              unitType: 'sqft',
            },
            propertyImage: formData.propertyImage,
          }),
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
      currency: 'USD',
    }))

    setShowSuggestions(true)
    setDuplicateStatus({})
  }

  // Image picker functionality
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        setFormData((prev) => ({
          ...prev,
          propertyImage: result.assets[0].uri,
        }))
      }
    } catch (error) {
      console.error('Error picking image:', error)
      Alert.alert('Error', 'Failed to pick image. Please try again.')
    }
  }

  const removeImage = () => {
    setFormData((prev) => ({
      ...prev,
      propertyImage: undefined,
    }))
  }

  // Country selection handlers
  const handleCountrySelection = (country: 'USA' | 'International') => {
    setFormData((prev) => ({
      ...prev,
      country,
    }))

    if (country === 'USA') {
      setShowCountrySelection(false)
      setIsInternationalForm(false)
      setShowUSAMethodSelection(true)
    } else {
      setShowCountrySelection(false)
      setIsInternationalForm(true)
      setCurrentStep(1)
    }
  }

  // USA method selection handlers
  const handleUSAMethodSelection = (method: 'search' | 'manual') => {
    if (method === 'search') {
      setShowUSAMethodSelection(false)
      setIsManualUSAForm(false)
    } else {
      setShowUSAMethodSelection(false)
      setIsManualUSAForm(true)
      setCurrentStep(1)
    }
  }

  // Multi-step form navigation
  const nextStep = () => {
    // Validate current step before proceeding
    if (currentStep === 1) {
      // Validate address fields
      if (isInternationalForm) {
        if (!formData.line.trim() || !formData.city.trim() || !formData.countryName?.trim()) {
          Alert.alert('Validation Error', 'Please fill in all required address fields')
          return
        }
      } else if (isManualUSAForm) {
        if (!formData.line.trim() || !formData.city.trim() || !formData.state.trim() || !formData.postalCode.trim()) {
          Alert.alert('Validation Error', 'Please fill in all required address fields')
          return
        }
      }
    } else if (currentStep === 2) {
      // Validate property details
      if (!formData.bedrooms.trim() || !formData.bathrooms.trim() || !formData.squareFeet.trim()) {
        Alert.alert('Validation Error', 'Please fill in all required property details')
        return
      }
    }

    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const resetToCountrySelection = () => {
    setShowCountrySelection(true)
    setIsInternationalForm(false)
    setShowUSAMethodSelection(false)
    setIsManualUSAForm(false)
    setCurrentStep(1)
    setFormData((prev) => ({
      ...prev,
      country: 'USA',
      unitType: 'sqft',
      propertyImage: undefined,
    }))
  }

  const resetToUSAMethodSelection = () => {
    setShowUSAMethodSelection(true)
    setIsManualUSAForm(false)
    setCurrentStep(1)
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
            {/* Back to Country Selection Button */}
            {!showCountrySelection && (
              <Pressable
                onPress={showUSAMethodSelection ? resetToUSAMethodSelection : resetToCountrySelection}
                className="ml-auto"
              >
                <HStack className="items-center gap-2">
                  <AntDesign size={16} name="left" color="#6B7280" />
                  <Text className="text-sm text-gray-600">
                    {showUSAMethodSelection ? 'Change Method' : 'Change Location'}
                  </Text>
                </HStack>
              </Pressable>
            )}
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

            {/* Country Selection */}
            {showCountrySelection && (
              <VStack space="lg" className="items-center">
                <VStack space="md" className="w-full max-w-md">
                  <Heading size="lg" className="text-center">
                    Select Property Location
                  </Heading>
                  <Text className="text-center text-gray-600">
                    Choose whether your property is located in the USA or internationally
                  </Text>

                  <VStack space="md" className="mt-6">
                    <TouchableOpacity
                      onPress={() => handleCountrySelection('USA')}
                      activeOpacity={0.7}
                      className="rounded-lg border-2 border-blue-200 bg-blue-50 p-6"
                    >
                      <VStack space="sm" className="items-center">
                        <AntDesign name="home" size={32} color="#1E40AF" />
                        <Text className="text-lg font-semibold text-blue-900">United States</Text>
                        <Text className="text-center text-sm text-blue-700">
                          Properties located within the United States
                        </Text>
                      </VStack>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleCountrySelection('International')}
                      activeOpacity={0.7}
                      className="rounded-lg border-2 border-gray-200 bg-gray-50 p-6"
                    >
                      <VStack space="sm" className="items-center">
                        <AntDesign name="earth" size={32} color="#6B7280" />
                        <Text className="text-lg font-semibold text-gray-900">International</Text>
                        <Text className="text-center text-sm text-gray-600">
                          Properties located outside the United States
                        </Text>
                      </VStack>
                    </TouchableOpacity>
                  </VStack>
                </VStack>
              </VStack>
            )}

            {/* USA Method Selection */}
            {showUSAMethodSelection && (
              <VStack space="lg" className="items-center">
                <VStack space="md" className="w-full max-w-md">
                  <VStack space="sm" className="items-center">
                    <Heading size="lg" className="text-center">
                      How would you like to add your property?
                    </Heading>
                    <Text className="text-center text-gray-600">
                      Choose how you'd like to input your property information
                    </Text>
                    <Button onPress={resetToCountrySelection} variant="link" action="secondary" className="mt-2">
                      <ButtonText className="text-sm">← Change Location</ButtonText>
                    </Button>
                  </VStack>

                  <VStack space="md" className="mt-6">
                    <TouchableOpacity
                      onPress={() => handleUSAMethodSelection('search')}
                      activeOpacity={0.7}
                      className="rounded-lg border-2 border-blue-200 bg-blue-50 p-6"
                    >
                      <VStack space="sm" className="items-center">
                        <AntDesign name="search1" size={32} color="#1E40AF" />
                        <Text className="text-lg font-semibold text-blue-900">Search & Auto-Fill</Text>
                        <Text className="text-center text-sm text-blue-700">
                          Search for your property address and automatically fill in details
                        </Text>
                        <Box className="mt-2 rounded-full bg-blue-100 px-3 py-1">
                          <Text className="text-xs font-medium text-blue-800">Recommended</Text>
                        </Box>
                      </VStack>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleUSAMethodSelection('manual')}
                      activeOpacity={0.7}
                      className="rounded-lg border-2 border-gray-200 bg-gray-50 p-6"
                    >
                      <VStack space="sm" className="items-center">
                        <AntDesign name="edit" size={32} color="#6B7280" />
                        <Text className="text-lg font-semibold text-gray-900">Manual Entry</Text>
                        <Text className="text-center text-sm text-gray-600">
                          Manually enter all property details step by step
                        </Text>
                      </VStack>
                    </TouchableOpacity>
                  </VStack>
                </VStack>
              </VStack>
            )}

            {/* International Multi-Step Form */}
            {isInternationalForm && (
              <VStack space="lg" className="w-full">
                {/* Progress Indicator */}
                <VStack space="sm" className="items-center">
                  <HStack space="sm" className="items-center">
                    {[1, 2, 3].map((step) => (
                      <Box
                        key={step}
                        className={`h-3 w-3 rounded-full ${step <= currentStep ? 'bg-blue-600' : 'bg-gray-300'}`}
                      />
                    ))}
                  </HStack>
                  <Text className="text-sm text-gray-600">
                    Step {currentStep} of 3:{' '}
                    {currentStep === 1 ? 'Address' : currentStep === 2 ? 'Property Details' : 'Image Upload'}
                  </Text>
                </VStack>

                {/* Step 1: Address Form */}
                {currentStep === 1 && (
                  <VStack space="md">
                    <Heading size="lg">Property Address</Heading>
                    <Text className="text-gray-600">Enter the property address details</Text>

                    <FormControl isRequired>
                      <FormControlLabel>
                        <FormControlLabelText>Street Address</FormControlLabelText>
                      </FormControlLabel>
                      <Input className="bg-white">
                        <InputField
                          placeholder="Enter street address"
                          value={formData.line}
                          onChangeText={(value) => handleInputChange('line', value)}
                        />
                      </Input>
                    </FormControl>

                    <HStack space="md">
                      <FormControl className="flex-1" isRequired>
                        <FormControlLabel>
                          <FormControlLabelText>City</FormControlLabelText>
                        </FormControlLabel>
                        <Input className="bg-white">
                          <InputField
                            placeholder="City"
                            value={formData.city}
                            onChangeText={(value) => handleInputChange('city', value)}
                          />
                        </Input>
                      </FormControl>

                      <FormControl className="flex-1">
                        <FormControlLabel>
                          <FormControlLabelText>Province/State</FormControlLabelText>
                        </FormControlLabel>
                        <Input className="bg-white">
                          <InputField
                            placeholder="Province/State"
                            value={formData.province || formData.state}
                            onChangeText={(value) => handleInputChange('province', value)}
                          />
                        </Input>
                      </FormControl>
                    </HStack>

                    <HStack space="md">
                      <FormControl className="flex-1" isRequired>
                        <FormControlLabel>
                          <FormControlLabelText>Country</FormControlLabelText>
                        </FormControlLabel>
                        <Input className="bg-white">
                          <InputField
                            placeholder="Country"
                            value={formData.countryName}
                            onChangeText={(value) => handleInputChange('countryName', value)}
                          />
                        </Input>
                      </FormControl>

                      <FormControl className="flex-1">
                        <FormControlLabel>
                          <FormControlLabelText>Postal Code</FormControlLabelText>
                        </FormControlLabel>
                        <Input className="bg-white">
                          <InputField
                            placeholder="Postal Code"
                            value={formData.postalCode}
                            onChangeText={(value) => handleInputChange('postalCode', value)}
                          />
                        </Input>
                      </FormControl>
                    </HStack>

                    <HStack space="md" className="mt-6">
                      <Button onPress={resetToCountrySelection} variant="outline" className="flex-1">
                        <ButtonText>Back</ButtonText>
                      </Button>
                      <Button onPress={nextStep} className="flex-1 bg-blue-600">
                        <ButtonText>Next</ButtonText>
                      </Button>
                    </HStack>
                  </VStack>
                )}

                {/* Step 2: Property Details */}
                {currentStep === 2 && (
                  <VStack space="md">
                    <Heading size="lg">Property Details</Heading>
                    <Text className="text-gray-600">Enter the property specifications</Text>

                    <FormControl isRequired>
                      <FormControlLabel>
                        <FormControlLabelText>Post Type</FormControlLabelText>
                      </FormControlLabel>
                      <Select className="bg-white" onValueChange={(value) => handleInputChange('postType', value)}>
                        <SelectTrigger>
                          <SelectInput placeholder="Select post type" className="flex-1" />
                          <SelectIcon className="mr-3" as={ChevronDownIcon} />
                        </SelectTrigger>
                        <SelectPortal>
                          <SelectBackdrop />
                          <SelectContent className="pb-28">
                            <SelectDragIndicatorWrapper>
                              <SelectDragIndicator />
                            </SelectDragIndicatorWrapper>
                            <SelectItem label="Just Listed" value="JUST_LISTED" />
                            <SelectItem label="Just Sold" value="JUST_SOLD" />
                            <SelectItem label="Just Rented" value="JUST_RENTED" />
                            <SelectItem label="Open House" value="OPEN_HOUSE" />
                            <SelectItem label="Under Contract" value="UNDER_CONTRACT" />
                            <SelectItem label="Back on Market" value="BACK_ON_MARKET" />
                            <SelectItem label="Coming Soon" value="COMING_SOON" />
                            <SelectItem label="Price Drop" value="PRICE_DROP" />
                          </SelectContent>
                        </SelectPortal>
                      </Select>
                    </FormControl>

                    <HStack space="md">
                      <FormControl className="flex-1" isRequired>
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

                      <FormControl className="flex-1" isRequired>
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

                    <FormControl isRequired>
                      <FormControlLabel>
                        <FormControlLabelText>Area Unit</FormControlLabelText>
                      </FormControlLabel>
                      <Select className="bg-white" onValueChange={(value) => handleInputChange('unitType', value)}>
                        <SelectTrigger>
                          <SelectInput placeholder="Select unit type" className="flex-1" />
                          <SelectIcon className="mr-3" as={ChevronDownIcon} />
                        </SelectTrigger>
                        <SelectPortal>
                          <SelectBackdrop />
                          <SelectContent className="pb-28">
                            <SelectDragIndicatorWrapper>
                              <SelectDragIndicator />
                            </SelectDragIndicatorWrapper>
                            <SelectItem label="Square Feet (sqft)" value="sqft" />
                            <SelectItem label="Square Meters (m²)" value="m2" />
                          </SelectContent>
                        </SelectPortal>
                      </Select>
                    </FormControl>

                    <FormControl isRequired>
                      <FormControlLabel>
                        <FormControlLabelText>
                          Area ({formData.unitType === 'sqft' ? 'Square Feet' : 'Square Meters'})
                        </FormControlLabelText>
                      </FormControlLabel>
                      <Input className="bg-white">
                        <InputField
                          placeholder={`Enter area in ${formData.unitType === 'sqft' ? 'sqft' : 'm²'}`}
                          value={formData.squareFeet}
                          onChangeText={(value) => handleInputChange('squareFeet', value)}
                          keyboardType="numeric"
                        />
                      </Input>
                    </FormControl>

                    <HStack space="md" className="mt-6">
                      <Button onPress={prevStep} variant="outline" className="flex-1">
                        <ButtonText>Back</ButtonText>
                      </Button>
                      <Button onPress={nextStep} className="flex-1 bg-blue-600">
                        <ButtonText>Next</ButtonText>
                      </Button>
                    </HStack>
                  </VStack>
                )}

                {/* Step 3: Image Upload */}
                {currentStep === 3 && (
                  <VStack space="md">
                    <Heading size="lg">Property Image</Heading>
                    <Text className="text-gray-600">Upload a photo of the property</Text>

                    <VStack space="md" className="items-center">
                      {formData.propertyImage ? (
                        <VStack space="md" className="w-full">
                          <Box className="relative">
                            <Image
                              source={{ uri: formData.propertyImage }}
                              className="h-64 w-full rounded-lg"
                              alt="Property image"
                            />
                            <TouchableOpacity
                              onPress={removeImage}
                              className="absolute right-2 top-2 rounded-full bg-red-500 p-2"
                            >
                              <AntDesign name="close" size={16} color="white" />
                            </TouchableOpacity>
                          </Box>
                          <Button onPress={pickImage} variant="outline" className="w-full">
                            <ButtonText>Change Image</ButtonText>
                          </Button>
                        </VStack>
                      ) : (
                        <TouchableOpacity
                          onPress={pickImage}
                          className="h-64 w-full rounded-lg border-2 border-dashed border-gray-300 bg-gray-50"
                        >
                          <VStack space="md" className="flex-1 items-center justify-center">
                            <AntDesign name="camera" size={48} color="#6B7280" />
                            <Text className="text-gray-600">Tap to upload property image</Text>
                            <Text className="text-sm text-gray-500">Recommended: 4:3 aspect ratio</Text>
                          </VStack>
                        </TouchableOpacity>
                      )}
                    </VStack>

                    <HStack space="md" className="mt-6">
                      <Button onPress={prevStep} variant="outline" className="flex-1">
                        <ButtonText>Back</ButtonText>
                      </Button>
                      <Button onPress={handleSubmit} className="flex-1 bg-blue-600" disabled={loading}>
                        <ButtonText>{loading ? 'Creating Post...' : 'Create Post'}</ButtonText>
                      </Button>
                    </HStack>
                  </VStack>
                )}
              </VStack>
            )}

            {/* Manual USA Multi-Step Form */}
            {isManualUSAForm && (
              <VStack space="lg" className="w-full">
                {/* Progress Indicator */}
                <VStack space="sm" className="items-center">
                  <HStack space="sm" className="items-center">
                    {[1, 2, 3].map((step) => (
                      <Box
                        key={step}
                        className={`h-3 w-3 rounded-full ${step <= currentStep ? 'bg-blue-600' : 'bg-gray-300'}`}
                      />
                    ))}
                  </HStack>
                  <Text className="text-sm text-gray-600">
                    Step {currentStep} of 3:{' '}
                    {currentStep === 1 ? 'Address' : currentStep === 2 ? 'Property Details' : 'Image Upload'}
                  </Text>
                </VStack>

                {/* Step 1: Address Form */}
                {currentStep === 1 && (
                  <VStack space="md">
                    <Heading size="lg">Property Address</Heading>
                    <Text className="text-gray-600">Enter the property address details</Text>

                    <FormControl isRequired>
                      <FormControlLabel>
                        <FormControlLabelText>Street Address</FormControlLabelText>
                      </FormControlLabel>
                      <Input className="bg-white">
                        <InputField
                          placeholder="Enter street address"
                          value={formData.line}
                          onChangeText={(value) => handleInputChange('line', value)}
                        />
                      </Input>
                    </FormControl>

                    <HStack space="md">
                      <FormControl className="flex-1" isRequired>
                        <FormControlLabel>
                          <FormControlLabelText>City</FormControlLabelText>
                        </FormControlLabel>
                        <Input className="bg-white">
                          <InputField
                            placeholder="City"
                            value={formData.city}
                            onChangeText={(value) => handleInputChange('city', value)}
                          />
                        </Input>
                      </FormControl>

                      <FormControl className="flex-1" isRequired>
                        <FormControlLabel>
                          <FormControlLabelText>State</FormControlLabelText>
                        </FormControlLabel>
                        <Input className="bg-white">
                          <InputField
                            placeholder="State"
                            value={formData.state}
                            onChangeText={(value) => handleInputChange('state', value)}
                          />
                        </Input>
                      </FormControl>
                    </HStack>

                    <FormControl isRequired>
                      <FormControlLabel>
                        <FormControlLabelText>ZIP Code</FormControlLabelText>
                      </FormControlLabel>
                      <Input className="bg-white">
                        <InputField
                          placeholder="ZIP Code"
                          value={formData.postalCode}
                          onChangeText={(value) => handleInputChange('postalCode', value)}
                        />
                      </Input>
                    </FormControl>

                    <HStack space="md" className="mt-6">
                      <Button onPress={resetToUSAMethodSelection} variant="outline" className="flex-1">
                        <ButtonText>Back</ButtonText>
                      </Button>
                      <Button onPress={nextStep} className="flex-1 bg-blue-600">
                        <ButtonText>Next</ButtonText>
                      </Button>
                    </HStack>
                  </VStack>
                )}

                {/* Step 2: Property Details */}
                {currentStep === 2 && (
                  <VStack space="md">
                    <Heading size="lg">Property Details</Heading>
                    <Text className="text-gray-600">Enter the property specifications</Text>

                    <FormControl isRequired>
                      <FormControlLabel>
                        <FormControlLabelText>Post Type</FormControlLabelText>
                      </FormControlLabel>
                      <Select className="bg-white" onValueChange={(value) => handleInputChange('postType', value)}>
                        <SelectTrigger>
                          <SelectInput placeholder="Select post type" className="flex-1" />
                          <SelectIcon className="mr-3" as={ChevronDownIcon} />
                        </SelectTrigger>
                        <SelectPortal>
                          <SelectBackdrop />
                          <SelectContent className="pb-28">
                            <SelectDragIndicatorWrapper>
                              <SelectDragIndicator />
                            </SelectDragIndicatorWrapper>
                            <SelectItem label="Just Listed" value="JUST_LISTED" />
                            <SelectItem label="Just Sold" value="JUST_SOLD" />
                            <SelectItem label="Just Rented" value="JUST_RENTED" />
                            <SelectItem label="Open House" value="OPEN_HOUSE" />
                            <SelectItem label="Under Contract" value="UNDER_CONTRACT" />
                            <SelectItem label="Back on Market" value="BACK_ON_MARKET" />
                            <SelectItem label="Coming Soon" value="COMING_SOON" />
                            <SelectItem label="Price Drop" value="PRICE_DROP" />
                          </SelectContent>
                        </SelectPortal>
                      </Select>
                    </FormControl>

                    <HStack space="md">
                      <FormControl className="flex-1" isRequired>
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

                      <FormControl className="flex-1" isRequired>
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

                    <FormControl isRequired>
                      <FormControlLabel>
                        <FormControlLabelText>Square Feet</FormControlLabelText>
                      </FormControlLabel>
                      <Input className="bg-white">
                        <InputField
                          placeholder="Enter square footage"
                          value={formData.squareFeet}
                          onChangeText={(value) => handleInputChange('squareFeet', value)}
                          keyboardType="numeric"
                        />
                      </Input>
                    </FormControl>

                    <HStack space="md" className="mt-6">
                      <Button onPress={prevStep} variant="outline" className="flex-1">
                        <ButtonText>Back</ButtonText>
                      </Button>
                      <Button onPress={nextStep} className="flex-1 bg-blue-600">
                        <ButtonText>Next</ButtonText>
                      </Button>
                    </HStack>
                  </VStack>
                )}

                {/* Step 3: Image Upload */}
                {currentStep === 3 && (
                  <VStack space="md">
                    <Heading size="lg">Property Image</Heading>
                    <Text className="text-gray-600">Upload a photo of the property</Text>

                    <VStack space="md" className="items-center">
                      {formData.propertyImage ? (
                        <VStack space="md" className="w-full">
                          <Box className="relative">
                            <Image
                              source={{ uri: formData.propertyImage }}
                              className="h-64 w-full rounded-lg"
                              alt="Property image"
                            />
                            <TouchableOpacity
                              onPress={removeImage}
                              className="absolute right-2 top-2 rounded-full bg-red-500 p-2"
                            >
                              <AntDesign name="close" size={16} color="white" />
                            </TouchableOpacity>
                          </Box>
                          <Button onPress={pickImage} variant="outline" className="w-full">
                            <ButtonText>Change Image</ButtonText>
                          </Button>
                        </VStack>
                      ) : (
                        <TouchableOpacity
                          onPress={pickImage}
                          className="h-64 w-full rounded-lg border-2 border-dashed border-gray-300 bg-gray-50"
                        >
                          <VStack space="md" className="flex-1 items-center justify-center">
                            <AntDesign name="camera" size={48} color="#6B7280" />
                            <Text className="text-gray-600">Tap to upload property image</Text>
                            <Text className="text-sm text-gray-500">Recommended: 4:3 aspect ratio</Text>
                          </VStack>
                        </TouchableOpacity>
                      )}
                    </VStack>

                    <HStack space="md" className="mt-6">
                      <Button onPress={prevStep} variant="outline" className="flex-1">
                        <ButtonText>Back</ButtonText>
                      </Button>
                      <Button onPress={handleSubmit} className="flex-1 bg-blue-600" disabled={loading}>
                        <ButtonText>{loading ? 'Creating Post...' : 'Create Post'}</ButtonText>
                      </Button>
                    </HStack>
                  </VStack>
                )}
              </VStack>
            )}

            {/* USA Address Search Section */}
            {!selectedAddress &&
              !isInternationalForm &&
              !showCountrySelection &&
              !showUSAMethodSelection &&
              !isManualUSAForm && (
                <VStack space="lg" className="items-center">
                  <VStack space="md" className="w-full max-w-md">
                    <VStack space="sm" className="items-center">
                      <Heading size="lg" className="text-center">
                        Find the Property
                      </Heading>
                      <Text className="text-center text-gray-600">Start by searching for the property address</Text>
                      <Button onPress={resetToCountrySelection} variant="link" action="secondary" className="mt-2">
                        <ButtonText className="text-sm">← Change Location</ButtonText>
                      </Button>
                    </VStack>

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
                                  currency: 'USD',
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

            {/* USA Property Form - Only show after address is selected */}
            {selectedAddress && !isInternationalForm && !showUSAMethodSelection && !isManualUSAForm && (
              <VStack space="lg" className="w-full">
                {/* Selected Address Display */}
                <VStack className="flex-1">
                  <HStack className="items-center justify-between">
                    <Heading size="lg" className="flex-1">
                      {selectedAddress.full_address[0]}
                    </Heading>
                    <Button onPress={resetToCountrySelection} variant="link" action="secondary">
                      <ButtonText className="text-sm">← Change Location</ButtonText>
                    </Button>
                  </HStack>
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
                              <SelectContent className="pb-28">
                                <SelectDragIndicatorWrapper>
                                  <SelectDragIndicator />
                                </SelectDragIndicatorWrapper>
                                <SelectItem label="Just Listed" value="JUST_LISTED" />
                                <SelectItem label="Just Sold" value="JUST_SOLD" />
                                <SelectItem label="Just Rented" value="JUST_RENTED" />
                                <SelectItem label="Open House" value="OPEN_HOUSE" />
                                <SelectItem label="Under Contract" value="UNDER_CONTRACT" />
                                <SelectItem label="Back on Market" value="BACK_ON_MARKET" />
                                <SelectItem label="Coming Soon" value="COMING_SOON" />
                                <SelectItem label="Price Drop" value="PRICE_DROP" />
                              </SelectContent>
                            </SelectPortal>
                          </Select>
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
