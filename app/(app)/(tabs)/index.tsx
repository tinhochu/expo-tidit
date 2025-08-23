import PropertyImage from '@/components/property-image'
import StatusBadge from '@/components/status-badge'
import { Box } from '@/components/ui/box'
import { Grid, GridItem } from '@/components/ui/grid'
import { Heading } from '@/components/ui/heading'
import { HStack } from '@/components/ui/hstack'
import { Pressable } from '@/components/ui/pressable'
import { Skeleton } from '@/components/ui/skeleton'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { useAuth } from '@/context/AuthContext'
import { Post, getPostsByUserId } from '@/lib/postService'
import AntDesign from '@expo/vector-icons/AntDesign'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { router, useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import { RefreshControl, ScrollView } from 'react-native'

export default function Home() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const fetchPosts = useCallback(async () => {
    if (!user?.$id) return

    try {
      setLoading(true)
      const allPosts = await getPostsByUserId(user?.$id)
      setPosts(allPosts)
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }, [])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchPosts()
    setRefreshing(false)
  }, [fetchPosts])

  // Fetch posts when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchPosts()
    }, [fetchPosts])
  )

  return (
    <VStack>
      <Box className="border-b border-gray-200 bg-white p-2 px-5 pt-[72px]">
        <HStack className="items-center justify-between">
          <Heading size="xl">My Posts</Heading>
          <Pressable onPress={() => router.push('/create-post')}>
            <AntDesign size={28} name="pluscircleo" color="black" />
          </Pressable>
        </HStack>
      </Box>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <VStack className="px-5 pb-32 pt-5">
          {loading ? (
            <VStack className="items-center justify-center" space="xl">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} variant="sharp" className="h-44 w-full rounded-xl" />
              ))}
            </VStack>
          ) : posts.length > 0 ? (
            posts.map((post: any) => {
              const propInfo = post.propInformation

              return (
                <Pressable key={post.id} onPress={() => router.push(`/property/${post.id}`)}>
                  <Box className="mb-5 overflow-hidden rounded-xl border border-gray-300 bg-white">
                    <Grid _extra={{ className: 'grid-cols-5 items-start' }}>
                      <GridItem _extra={{ className: 'col-span-2' }} className="relative p-0">
                        {propInfo.photos === null ? (
                          <Skeleton variant="sharp" className="aspect-square h-44 w-full" />
                        ) : (
                          <PropertyImage
                            imageUrl={propInfo?.photos[0]?.href || ''}
                            alt={post.title}
                            className="aspect-video h-44 object-fill"
                          />
                        )}
                        {post.postType && (
                          <Box className="absolute left-0 top-0 p-2">
                            <StatusBadge status={post.postType} />
                          </Box>
                        )}
                      </GridItem>
                      <GridItem _extra={{ className: 'col-span-3' }} className="p-3">
                        <HStack space="lg" className="mb-2 items-center justify-between">
                          {propInfo && (
                            <Text className="font-bold text-gray-600">
                              <FontAwesome name="bed" size={14} color="inherit" /> {propInfo.description?.beds || 'N/A'}
                              {' • '}
                              <FontAwesome name="bath" size={14} color="inherit" />{' '}
                              {propInfo.description?.baths || 'N/A'}
                              {' • '}
                              <FontAwesome name="home" size={14} color="inherit" />{' '}
                              {`${propInfo.description?.sqft} sqft` || 'N/A'}
                            </Text>
                          )}
                        </HStack>
                        <Heading size="md" className="leading-tight">
                          {propInfo.line},
                        </Heading>
                        <Heading size="md" className="leading-tight">
                          {propInfo.city && ` ${propInfo.city}`}
                          {propInfo.state && `, ${propInfo.state}`}
                          {propInfo.postalCode && `, ${propInfo.postalCode}`}
                        </Heading>
                      </GridItem>
                    </Grid>
                  </Box>
                </Pressable>
              )
            })
          ) : (
            <Text>No posts found</Text>
          )}
        </VStack>
      </ScrollView>
    </VStack>
  )
}
