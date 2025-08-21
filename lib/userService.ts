export const updateUserPrefs = async (userId: string, prefs: any) => {
  const backendUrl = process.env.EXPO_PUBLIC_TIDIT_API_URL!

  const response = await fetch(`${backendUrl}/api/profile/${userId}`, {
    method: 'PUT',
    body: JSON.stringify({ prefs: { ...prefs } }),
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.EXPO_PUBLIC_TIDIT_API_KEY!,
    },
  })

  if (!response.ok) {
    throw new Error(response.statusText)
  }

  const { data } = await response.json()

  return data
}

export const getUserPrefs = async (userId: string) => {
  const backendUrl = process.env.EXPO_PUBLIC_TIDIT_API_URL!

  const response = await fetch(`${backendUrl}/api/profile/${userId}`, {
    headers: {
      'x-api-key': process.env.EXPO_PUBLIC_TIDIT_API_KEY!,
    },
  })

  if (!response.ok) {
    throw new Error(response.statusText)
  }

  const { data } = await response.json()

  return data
}
