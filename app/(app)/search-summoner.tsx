import { Box } from '@/components/ui/box'
import { Button, ButtonText } from '@/components/ui/button'
import { Grid, GridItem } from '@/components/ui/grid'
import { Heading } from '@/components/ui/heading'
import { HStack } from '@/components/ui/hstack'
import { ChevronLeftIcon, Icon, InfoIcon } from '@/components/ui/icon'
import { Image } from '@/components/ui/image'
import { Input, InputField } from '@/components/ui/input'
import { Popover, PopoverBackdrop, PopoverBody, PopoverContent } from '@/components/ui/popover'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { router } from 'expo-router'
import { useState } from 'react'
import { Pressable } from 'react-native'

export default function SearchSummoner() {
  const [summonerName, setSummonerName] = useState('')
  const [tagline, setTagline] = useState('')
  const [isInfoOpen, setIsInfoOpen] = useState(false)
  const [results, setResults] = useState<any>(null)

  const handleInfoOpen = () => setIsInfoOpen(true)

  const handleInfoClose = () => setIsInfoOpen(false)

  const handleSearch = async () => {
    try {
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
        console.error('API Error:', data)
        return
      }

      setResults(data.data)
    } catch (error) {
      console.error('Error searching for summoner:', error)
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
                    value={tagline.startsWith('#') ? tagline : `#${tagline}`}
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

        {results && (
          <VStack space="lg">
            <Heading size="lg" className="text-gray-700">
              Summoners Found
            </Heading>

            <VStack>
              <Box className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <HStack space="lg">
                  <Image
                    size="md"
                    className="rounded"
                    source={{
                      uri: `https://opgg-static.akamaized.net/meta/images/profile_icons/profileIcon${results.profileIconId}.jpg?image=q_auto:good,f_webp,w_200`,
                    }}
                    alt="image"
                  />
                  <VStack>
                    <Text size="lg" className="font-bold">
                      {results.gameName}
                    </Text>
                    <Text size="md" className="font-italic font-semibold text-gray-500">
                      #{results.tagLine}
                    </Text>
                  </VStack>
                </HStack>
              </Box>
            </VStack>
          </VStack>
        )}
      </VStack>
    </VStack>
  )
}
