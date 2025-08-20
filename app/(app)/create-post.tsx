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
import { Input, InputField, InputSlot } from '@/components/ui/input'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { useAuth } from '@/context/AuthContext'
import { AddressSuggestion, searchAddresses } from '@/lib/addressService'
import AntDesign from '@expo/vector-icons/AntDesign'
import { router } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView } from 'react-native'

interface PropertyFormData {
  title: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
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
    title: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
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
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
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

  const handleAddressSelect = (suggestion: AddressSuggestion) => {
    setSelectedAddress(suggestion)

    setFormData((prev) => ({
      ...prev,
      title: suggestion.full_address[0],
      address: suggestion.line,
      city: suggestion.city,
      state: suggestion.state_code,
      zipCode: suggestion.postal_code,
      country: suggestion.country_code,
    }))

    setAddressQuery(suggestion.line)

    setShowSuggestions(false)

    // Remove focus from the address input field
    if (addressInputRef.current) {
      addressInputRef.current.blur()
    }
  }

  const handleInputChange = (field: keyof PropertyFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<PropertyFormData> = {}

    if (!formData.title.trim()) newErrors.title = 'Title is required'
    if (!formData.address.trim()) newErrors.address = 'Address is required'
    if (!formData.city.trim()) newErrors.city = 'City is required'
    if (!formData.state.trim()) newErrors.state = 'State is required'
    if (!formData.zipCode.trim()) newErrors.zipCode = 'ZIP code is required'

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
      // Here you would typically call your API to create the post
      // For now, we'll just show a success message
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
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
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
                      <Input className="border-2 border-gray-200 bg-white pr-2">
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
                                key={suggestion.id}
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
                  <Box className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <HStack className="items-center justify-between">
                      <VStack className="flex-1">
                        <Text className="text-lg font-medium text-blue-900">{selectedAddress.line}</Text>
                        <Text className="text-sm text-blue-700">
                          {selectedAddress.city}, {selectedAddress.state_code} {selectedAddress.postal_code}
                        </Text>
                      </VStack>
                      <Pressable onPress={resetAddress} className="p-2">
                        <AntDesign name="close" size={20} color="#1E40AF" />
                      </Pressable>
                    </HStack>
                  </Box>

                  {/* Basic Information */}
                  <VStack space="md">
                    <Heading size="lg">Property Details</Heading>

                    <FormControl isInvalid={!!errors.title} isRequired>
                      <FormControlLabel>
                        <FormControlLabelText>Title *</FormControlLabelText>
                      </FormControlLabel>
                      <Input className="bg-white">
                        <InputField
                          placeholder="Enter property title..."
                          value={formData.title}
                          onChangeText={(value) => handleInputChange('title', value)}
                        />
                      </Input>
                      {errors.title && (
                        <FormControlError>
                          <FormControlErrorText>{errors.title}</FormControlErrorText>
                        </FormControlError>
                      )}
                    </FormControl>

                    <FormControl isInvalid={!!errors.price} isRequired>
                      <FormControlLabel>
                        <FormControlLabelText>Price *</FormControlLabelText>
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

                  {/* Submit Button */}
                  <VStack className="pb-8">
                    <Button size="xl" onPress={handleSubmit} disabled={loading} className="bg-blue-600">
                      <ButtonText>{loading ? 'Creating Post...' : 'Create Post'}</ButtonText>
                    </Button>
                  </VStack>
                </VStack>
              )}
            </VStack>
          </SafeAreaView>
        </ScrollView>
      </VStack>
    </KeyboardAvoidingView>
  )
}
