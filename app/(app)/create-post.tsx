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
import { AddressSuggestion, getPropertyDetails, searchAddresses } from '@/lib/addressService'
import { createPost } from '@/lib/postService'
import AntDesign from '@expo/vector-icons/AntDesign'
import { router } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView } from 'react-native'

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
  const scrollRef = useRef<ScrollView>(null)
  const addressInputRef = useRef<any>(null)
  const { user } = useAuth()

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

    console.log('Property details structure:', propertyDetails)
    console.log('Available fields:', Object.keys(propertyDetails))

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

      console.log('Property details fields found:', {
        price,
        bedrooms,
        bathrooms,
        squareFeet,
      })

      console.log('Updated form data:', updated)

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

    setLoading(true)
    try {
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
          onPress: () => router.back(),
        },
      ])
    } catch (error) {
      console.error('Error creating post:', error)
      Alert.alert('Error', 'Failed to create post. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const resetAddress = () => {
    setSelectedAddress(null)
    setAddressQuery('')
    setFormData((prev) => ({
      ...prev,
      fullAddress: '',
      line: '',
      city: '',
      state: '',
      postalCode: '',
    }))
    setShowSuggestions(false)
    setAddressSuggestions([])
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.select({ ios: 64, android: 0 })}
    >
      <VStack className="min-h-screen">
        <Box className="border-b border-gray-200 bg-white p-2 px-5 pt-[72px]">
          <HStack className="items-center justify-start gap-5">
            <Pressable onPress={() => router.back()}>
              <AntDesign size={24} name="back" color="black" />
            </Pressable>
            <Heading size="xl">Create Post</Heading>
          </HStack>
        </Box>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ flexGrow: 1, paddingRight: 16, paddingLeft: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          <SafeAreaView>
            <VStack className="px-5 pt-8" space="xl">
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
                      <Input size="lg" className="border-2 border-gray-200 bg-white pr-2">
                        <InputField
                          ref={addressInputRef}
                          placeholder="Enter property address..."
                          value={addressQuery}
                          onChangeText={setAddressQuery}
                          onFocus={() => {
                            if (addressQuery.length >= 1) {
                              setShowSuggestions(true)
                            }
                          }}
                        />
                        {searching && !selectedAddress && (
                          <InputSlot className="animate-spin">
                            <AntDesign name="loading2" size={16} color="#1E40AF" />
                          </InputSlot>
                        )}
                      </Input>

                      {/* Address Suggestions Dropdown */}
                      {showSuggestions && addressSuggestions.length >= 2 && (
                        <Box className="absolute left-0 right-0 top-full z-10 mt-1 max-h-64 rounded bg-white shadow-xl">
                          <ScrollView>
                            {addressSuggestions.map((suggestion) => (
                              <Pressable
                                key={suggestion._id}
                                onPress={() => handleAddressSelect(suggestion)}
                                className="border-b border-gray-100 px-3 py-2 active:bg-gray-50"
                              >
                                <VStack>
                                  <Text className="font-medium text-gray-900">{suggestion.line}</Text>
                                  <Text className="text-sm text-gray-600">
                                    {suggestion.city}, {suggestion.state_code} {suggestion.postal_code}
                                  </Text>
                                </VStack>
                              </Pressable>
                            ))}
                          </ScrollView>
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
                      <Button size="xl" onPress={handleSubmit} disabled={loading} className="bg-blue-600">
                        <ButtonText>{loading ? 'Creating Post...' : 'Create Post'}</ButtonText>
                      </Button>

                      <Button onPress={resetAddress} variant="link" action="secondary">
                        <ButtonText>Change Address</ButtonText>
                      </Button>
                    </VStack>
                  )}
                </VStack>
              )}
            </VStack>
          </SafeAreaView>
        </ScrollView>
      </VStack>
    </KeyboardAvoidingView>
  )
}
