import PropertyImage from '@/components/property-image'
import StatusBadge from '@/components/status-badge'
import { Box } from '@/components/ui/box'
import { Grid, GridItem } from '@/components/ui/grid'
import { Heading } from '@/components/ui/heading'
import { HStack } from '@/components/ui/hstack'
import { Pressable } from '@/components/ui/pressable'
import { Skeleton, SkeletonText } from '@/components/ui/skeleton'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { useAuth } from '@/context/AuthContext'
import { Post, getPostsByUserId } from '@/lib/postService'
import AntDesign from '@expo/vector-icons/AntDesign'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { router, useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import { RefreshControl, ScrollView, View } from 'react-native'

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
    <VStack className="min-h-screen">
      <Box className="border-b border-gray-200 bg-white p-2 px-5 pt-[72px]">
        <HStack className="items-center justify-between">
          <Heading size="xl">!Hello, {user?.name}</Heading>
          <Pressable onPress={() => router.push('/create-post')}>
            <AntDesign size={28} name="pluscircleo" color="black" />
          </Pressable>
        </HStack>
      </Box>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <VStack className="px-5 pt-5">
          {loading ? (
            <VStack className="items-center justify-center" space="xl">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} variant="sharp" className="h-44 w-full" />
              ))}
            </VStack>
          ) : posts.length > 0 ? (
            posts.map((post: any) => {
              const propInfo = post.propInformation

              return (
                <Pressable key={post.id} onPress={() => router.push(`/property/${post.id}`)}>
                  <Box className="mb-5 overflow-hidden rounded rounded-xl border border-gray-300 bg-white">
                    <Grid _extra={{ className: 'grid-cols-5 items-start' }}>
                      <GridItem _extra={{ className: 'col-span-2' }} className="p-0">
                        {propInfo.photos === null ? (
                          <Skeleton variant="sharp" className="aspect-square h-44 w-full" />
                        ) : (
                          <PropertyImage
                            imageUrl={propInfo?.photos[0]?.href || ''}
                            alt={post.title}
                            className="aspect-video h-44 object-fill"
                          />
                        )}
                      </GridItem>
                      <GridItem _extra={{ className: 'col-span-2' }} className="p-3">
                        <HStack className="mb-2 items-center justify-between gap-4">
                          {propInfo && (
                            <Text className="font-bold text-gray-600">
                              {propInfo.description?.beds || 'N/A'} <FontAwesome name="bed" size={14} color="inherit" />{' '}
                              • {propInfo.description?.baths || 'N/A'}{' '}
                              <FontAwesome name="bath" size={14} color="inherit" />
                            </Text>
                          )}
                          {propInfo?.postType && <StatusBadge status={propInfo?.postType} />}
                        </HStack>
                        <Heading size="sm" className="leading-tight">
                          {post.title.trim()}
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
