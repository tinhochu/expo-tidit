// Address service for handling address search and geocoding
// This service can be extended to integrate with various address APIs

export interface AddressSuggestion {
  _id: string
  id: string
  full_address: string
  line: string
  city: string
  state_code: string
  postal_code: string
  country_code: string
  latitude?: number
  longitude?: number
}

export interface AddressSearchResponse {
  success: boolean
  data: AddressSuggestion[]
  query: string
  timestamp: string
}
/**
 * Search for addresses based on a query string
 * @param query - The search query
 * @param limit - Maximum number of results to return
 * @returns Promise with address suggestions
 */
export const searchAddresses = async (query: string, limit: number = 10): Promise<AddressSuggestion[]> => {
  try {
    // First, try to call your backend API if it's available
    const backendUrl = process.env.EXPO_PUBLIC_TIDIT_API_URL!

    const response = await fetch(`${backendUrl}/api/properties/auto-complete?q=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: {
        'x-api-key': process.env.EXPO_PUBLIC_TIDIT_API_KEY!,
      },
    })

    if (!response.ok) {
      throw new Error(response.statusText)
    }

    const { data } = await response.json()

    // Filter Only the Results where _id contains `addr:`
    const filteredData = data.autocomplete.filter((item: AddressSuggestion) => item._id.includes('addr:'))

    return filteredData || []
  } catch (error) {
    console.warn('Backend address search failed: ', error)
    return []
  }
}

export const getPropertyDetails = async (addressId: string): Promise<any | null> => {
  try {
    const backendUrl = process.env.EXPO_PUBLIC_TIDIT_API_URL!

    // remove the addr: prefix
    const trimmedAddressId = addressId.replace('addr:', '')

    const response = await fetch(`${backendUrl}/api/properties/${trimmedAddressId}`, {
      method: 'GET',
      headers: {
        'x-api-key': process.env.EXPO_PUBLIC_TIDIT_API_KEY!,
      },
    })

    if (!response.ok) {
      throw new Error(response.statusText)
    }

    const { data } = await response.json()

    return data
  } catch (error) {
    console.warn('Backend address lookup failed: ', error)
    return null
  }
}
