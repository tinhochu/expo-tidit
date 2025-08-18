import ProfileImage from '@/components/profile-image'
import { Box } from '@/components/ui/box'
import { Button, ButtonText } from '@/components/ui/button'
import { Grid, GridItem } from '@/components/ui/grid'
import { Heading } from '@/components/ui/heading'
import { HStack } from '@/components/ui/hstack'
import { AlertCircleIcon, ChevronLeftIcon, Icon, InfoIcon } from '@/components/ui/icon'
import { Input, InputField } from '@/components/ui/input'
import { Modal, ModalBackdrop, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@/components/ui/modal'
import { Popover, PopoverBackdrop, PopoverBody, PopoverContent } from '@/components/ui/popover'
import { Text } from '@/components/ui/text'
import { Toast, ToastDescription, ToastTitle, useToast } from '@/components/ui/toast'
import { VStack } from '@/components/ui/vstack'
import { useAuth } from '@/context/AuthContext'
import { router } from 'expo-router'
import { useState } from 'react'
import { Pressable } from 'react-native'

export default function SearchSummoner() {
  const { user } = useAuth()
  const toast = useToast()
  const [summonerName, setSummonerName] = useState('')
  const [tagline, setTagline] = useState('')
  const [isInfoOpen, setIsInfoOpen] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleInfoOpen = () => setIsInfoOpen(true)

  const handleInfoClose = () => setIsInfoOpen(false)

  const handleSearch = async () => {
    try {
      // Clear any previous errors
      setError(null)

      const response = await fetch('https://zengamer-api.vercel.app/api/account/fetch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.EXPO_PUBLIC_ZENGAMER_API_KEY!,
        },
        body: JSON.stringify({
          region: tagline,
          summonerName: summonerName,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message)
        console.error('API Error:', data)
        return
      }

      setResults(data.data)
    } catch (error) {
      console.error('Error searching for summoner:', error)
    }
  }

  const handleConfirmSummonerLink = async () => {
    if (!results) return

    setIsConfirming(true)
    try {
      const response = await fetch(`https://zengamer-api.vercel.app/api/users/${user?.$id}/prefs`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.EXPO_PUBLIC_ZENGAMER_API_KEY!,
        },
        body: JSON.stringify({
          preferences: {
            ...user?.prefs,
            summonerId: results.puuid,
            summonerLinkDate: new Date().toISOString(),
            profileIconId: results.profileIconId,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Failed to link summoner')
        setShowModal(false)
        return
      }

      setShowModal(false)
      setIsSuccess(true)

      // Clear the form and results for a clean state
      setSummonerName('')
      setTagline('')
      setResults(null)

      // Show success notification
      toast.show({
        placement: 'top',
        render: ({ id }) => {
          return (
            <Toast action="success" variant="solid" nativeID={id}>
              <ToastTitle>Success!</ToastTitle>
              <ToastDescription>Your summoner account has been linked successfully!</ToastDescription>
            </Toast>
          )
        },
      })

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/(app)/(dashboard)')
      }, 2000)
    } catch (error) {
      console.error('Error linking summoner:', error)
      setError('Failed to link summoner. Please try again.')
      setShowModal(false)
    } finally {
      setIsConfirming(false)
    }
  }

  return (
    <VStack space="lg">
      <HStack className="items-center justify-between">
        <Pressable onPress={() => router.push('/')}>
          <Icon as={ChevronLeftIcon} size="xl" />
        </Pressable>
        <Heading size="xl" className="gap-2 text-black">
          Link Your Riot Account
        </Heading>
        <Popover
          isOpen={isInfoOpen}
          onClose={handleInfoClose}
          onOpen={handleInfoOpen}
          placement="bottom right"
          size="md"
          trigger={(triggerProps) => {
            return (
              <Button {...triggerProps} variant="link">
                <ButtonText>
                  <Icon as={InfoIcon} size="xl" className="text-blue-500" />
                </ButtonText>
              </Button>
            )
          }}
        >
          <PopoverBackdrop />
          <PopoverContent className="native:max-w-[300px] max-w-sm">
            <PopoverBody>
              <Heading size="md" className="mb-2 text-amber-800">
                ⚠️ Important Notice
              </Heading>
              <Text className="text-amber-700">
                • Your summoner name will be permanently linked to this account for 180 days
              </Text>
              <Text className="text-amber-700">
                • You cannot change or remove this connection during the lock period
              </Text>
              <Text className="text-amber-700">• This helps maintain account security and prevents abuse</Text>
              <Text className="text-amber-700">
                • After 180 days, you can update your summoner connection if needed
              </Text>
            </PopoverBody>
          </PopoverContent>
        </Popover>
      </HStack>

      <Box className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <Heading size="sm" className="mb-2 text-gray-700">
          How It Works
        </Heading>
        <Text size="xs" className="mb-2 text-gray-600">
          1. Enter your exact summoner name as it appears in League of Legends
        </Text>
        <Text size="xs" className="text-gray-600">
          2. Select your server region from the dropdown
        </Text>
        <Text size="xs" className="text-gray-600">
          3. We'll verify your summoner exists and link it to your profile
        </Text>
        <Text size="xs" className="text-gray-600">
          4. Your account will be locked to this summoner for 180 days
        </Text>
      </Box>

      <VStack className="space-y-4" space="lg">
        <Grid className="gap-3" _extra={{ className: 'grid-cols-3' }}>
          <GridItem
            _extra={{
              className: 'col-span-2',
            }}
          >
            <Box>
              <Text className="mb-2 font-medium text-gray-700">Summoner Name</Text>
              <Input>
                <InputField
                  placeholder="Enter your summoner name"
                  value={summonerName.toLowerCase()}
                  onChangeText={setSummonerName}
                  className="bg-white"
                />
              </Input>
            </Box>
          </GridItem>

          <GridItem
            _extra={{
              className: 'col-span-1',
            }}
          >
            <Box>
              <Text className="mb-2 font-medium text-gray-700">Tagline</Text>
              <Box>
                <Input>
                  <InputField
                    placeholder="#LAN"
                    value={tagline.startsWith('#') ? tagline.toUpperCase() : `#${tagline.toUpperCase()}`}
                    onChangeText={(text) => {
                      // Remove # if user types it, then add it back
                      const cleanText = text.replace(/^#+/, '')
                      // Limit to 3 characters (plus the # sign = 4 total)
                      const limitedText = cleanText.slice(0, 3)
                      setTagline(limitedText)
                    }}
                    className="bg-white"
                  />
                </Input>
              </Box>
            </Box>
          </GridItem>
        </Grid>

        <Button
          onPress={handleSearch}
          size="xl"
          className="bg-green-500 disabled:bg-green-300"
          disabled={!summonerName.trim() || !tagline.trim()}
        >
          <ButtonText>Search Summoner</ButtonText>
        </Button>

        {error && (
          <VStack>
            <Box className="flex flex-col items-center justify-center gap-5 rounded-lg border border-red-200 bg-red-200 p-4">
              <Heading size="lg" className="text-red-700">
                {error}
              </Heading>
              <Button onPress={() => setError(null)} className="bg-red-500">
                <ButtonText>Try Again</ButtonText>
              </Button>
            </Box>
          </VStack>
        )}

        {results && !error && (
          <VStack space="lg">
            <Heading size="lg" className="text-gray-700">
              Summoner Found:
            </Heading>

            <VStack>
              <Pressable onPress={() => setShowModal(true)}>
                <Box className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <HStack space="lg">
                    <ProfileImage profileIconId={results.profileIconId} />
                    <VStack>
                      <Text size="lg" className="font-bold">
                        {results.gameName}
                      </Text>
                      <Text size="md" className="font-italic font-semibold text-gray-500">
                        #{results.tagLine.toUpperCase()}
                      </Text>
                    </VStack>
                  </HStack>
                </Box>
              </Pressable>
            </VStack>
          </VStack>
        )}

        {isSuccess && (
          <VStack>
            <Box className="flex flex-col items-center justify-center gap-5 rounded-lg border border-green-200 bg-green-50 p-4">
              <Heading size="lg" className="text-green-700">
                ✅ Summoner Linked Successfully!
              </Heading>
              <Text size="md" className="text-center text-green-600">
                Your Riot account has been linked to your profile. Redirecting to dashboard...
              </Text>
              <Button onPress={() => router.push('/(app)/(dashboard)')} size="md" className="bg-green-600">
                <ButtonText>Go to Dashboard Now</ButtonText>
              </Button>
            </Box>
          </VStack>
        )}
      </VStack>
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
        }}
      >
        <ModalBackdrop />
        <ModalContent className="max-w-[305px] items-center">
          <ModalHeader>
            <Box className="h-[56px] w-[56px] items-center justify-center rounded-full bg-background-error">
              <Icon as={AlertCircleIcon} className="stroke-orange-600" size="xl" />
            </Box>
          </ModalHeader>
          <ModalBody className="mb-4 mt-0">
            <Heading size="md" className="mb-2 text-center text-typography-950">
              Confirm Summoner Link
            </Heading>
            <Text size="sm" className="text-center text-typography-500">
              Are you sure you want to link this summoner to your account?
            </Text>
          </ModalBody>
          <ModalFooter className="w-full">
            <Button
              variant="outline"
              action="secondary"
              size="sm"
              onPress={() => {
                setShowModal(false)
              }}
              className="flex-grow"
            >
              <ButtonText>Go Back</ButtonText>
            </Button>
            <Button
              onPress={handleConfirmSummonerLink}
              size="sm"
              className="flex-grow bg-green-500"
              disabled={isConfirming}
            >
              <ButtonText>{isConfirming ? 'Linking...' : 'Confirm'}</ButtonText>
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  )
}
