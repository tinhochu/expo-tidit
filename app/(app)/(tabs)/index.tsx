import PropertyImage from '@/components/property-image'
import StatusBadge from '@/components/status-badge'
import { Box } from '@/components/ui/box'
import { Grid, GridItem } from '@/components/ui/grid'
import { Heading } from '@/components/ui/heading'
import { HStack } from '@/components/ui/hstack'
import { Input, InputField, InputSlot } from '@/components/ui/input'
import { Pressable } from '@/components/ui/pressable'
import { Skeleton } from '@/components/ui/skeleton'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { POST_TYPES } from '@/constants/PostTypes'
import { useAuth } from '@/context/AuthContext'
import { useSubscription } from '@/context/SubscriptionContext'
import { Post, deletePost, getPostsByUserId } from '@/lib/postService'
import AntDesign from '@expo/vector-icons/AntDesign'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { router, useFocusEffect } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { Alert, RefreshControl, ScrollView } from 'react-native'

export default function Home() {
  const { user, isDeletingAccount } = useAuth()
  const { isSubscribed } = useSubscription()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  const fetchPosts = useCallback(async () => {
    // Additional safety check - if user is null/undefined, don't make any API calls
    if (!user || !user.$id || isDeletingAccount) {
      // Clear posts if user is deleted or being deleted
      setPosts([])
      return
    }

    try {
      setLoading(true)
      const allPosts = await getPostsByUserId(user.$id)
      setPosts(allPosts)
    } catch (error) {
      // Clear posts on error
      setPosts([])
    } finally {
      setLoading(false)
    }
  }, [user, user?.$id, isDeletingAccount])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchPosts()
    setRefreshing(false)
  }, [fetchPosts])

  // Filter posts based on selected filter and search query
  const filteredPosts = posts.filter((post) => {
    // First filter by post type
    const matchesType = selectedFilter === 'all' || post.postType === selectedFilter

    // Then filter by search query (case insensitive)
    const matchesSearch =
      !searchQuery ||
      post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (typeof post.propInformation === 'object' &&
        post.propInformation &&
        (post.propInformation as any)?.line?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (post.propInformation as any)?.city?.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesType && matchesSearch
  })

  // Clear posts when user is deleted or being deleted
  useEffect(() => {
    if (!user || !user.$id || isDeletingAccount) {
      setPosts([])
    }
  }, [user, user?.$id, isDeletingAccount])

  // Fetch posts when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Only fetch posts if we have a valid user and are not deleting account
      if (user && user.$id && !isDeletingAccount) {
        fetchPosts()
      }
    }, [fetchPosts, user, user?.$id, isDeletingAccount])
  )

  const handleLongPress = (post: Post) => {
    if (!post.id) {
      Alert.alert('Error', 'Cannot delete post: missing post ID')
      return
    }

    Alert.alert('Delete Post', 'Are you sure you want to delete this post? This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePost(post.id!)
            // Refresh the posts after deletion
            await fetchPosts()
          } catch (error) {
            Alert.alert('Error', 'Failed to delete post. Please try again.')
          }
        },
      },
    ])
  }

  return (
    <VStack>
      <Box className="border-b border-gray-200 bg-white p-2 px-5 pt-[72px]">
        <HStack className="items-center justify-between">
          {filteredPosts.length > 0 ? (
            <Heading size="xl">My Listings ({filteredPosts.length})</Heading>
          ) : (
            <Heading size="xl">My Listings</Heading>
          )}

          <Pressable onPress={() => router.push('/create-post')}>
            <AntDesign size={28} name="pluscircle" color="#2b7fff" />
          </Pressable>
        </HStack>
      </Box>

      {/* Search Bar */}
      <Box className="border-b border-gray-200 bg-white px-5 py-3">
        <Input>
          <InputField
            placeholder="Search listings by title, address, or city..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <InputSlot className="mr-2">
              <Pressable onPress={() => setSearchQuery('')}>
                <AntDesign size={16} name="close" color="black" />
              </Pressable>
            </InputSlot>
          )}
        </Input>
      </Box>

      {/* Post Type Filter */}
      <Box className="border-b border-gray-200 bg-white p-3">
        <HStack className="items-center justify-between">
          <Heading size="sm" className="pr-4">
            Post Type
          </Heading>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <HStack space="md" className="px-2">
              <Pressable
                onPress={() => setSelectedFilter('all')}
                className={`rounded-full border px-4 py-2 ${
                  selectedFilter === 'all' ? 'border-blue-500 bg-blue-500' : 'border-gray-300 bg-white'
                }`}
              >
                <Text className={`font-medium ${selectedFilter === 'all' ? 'text-white' : 'text-gray-700'}`}>All</Text>
              </Pressable>

              {Object.entries(POST_TYPES).map(([key, label]) => (
                <Pressable
                  key={key}
                  onPress={() => setSelectedFilter(key)}
                  className={`rounded-full border px-4 py-2 ${
                    selectedFilter === key ? 'border-blue-500 bg-blue-500' : 'border-gray-300 bg-white'
                  }`}
                >
                  <Text className={`font-medium ${selectedFilter === key ? 'text-white' : 'text-gray-700'}`}>
                    {label}
                  </Text>
                </Pressable>
              ))}
            </HStack>
          </ScrollView>
        </HStack>
      </Box>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <VStack className="px-5 pb-60 pt-5">
          {loading ? (
            <VStack className="items-center justify-center" space="xl">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} variant="sharp" className="h-44 w-full rounded-xl" />
              ))}
            </VStack>
          ) : (
            <>
              {/* Subscription CTA - Only show for non-subscribed users */}
              {!isSubscribed && (
                <Pressable onPress={() => router.push('/subscription')}>
                  <Box className="mb-4 overflow-hidden rounded-xl border border-tidit-primary bg-tidit-primary/20 p-4">
                    <HStack className="items-center justify-between">
                      <VStack className="flex-1" space="sm">
                        <HStack className="items-center" space="sm">
                          <AntDesign name="star" size={20} color="#3193EE" />
                          <Heading size="sm" className="text-blue-500">
                            Unlock Unlimited Posts
                          </Heading>
                        </HStack>
                        <Text className="text-sm font-semibold text-blue-500">
                          Create unlimited posts with Pro features
                        </Text>
                      </VStack>
                      <AntDesign name="arrowright" size={24} color="#3193EE" />
                    </HStack>
                  </Box>
                </Pressable>
              )}
              {filteredPosts.length > 0 ? (
                filteredPosts
                  .map((post: any, index: number) => {
                    const propInfo = post.propInformation
                    const isLastItem = index === filteredPosts.length - 1

                    // Safety check - if propInfo is null/undefined, skip this post
                    if (!propInfo || typeof propInfo !== 'object') {
                      console.warn('Post has invalid propInformation:', post.id)
                      return null
                    }

                    // Check for custom image in canvas
                    let customImageUrl = null
                    try {
                      if (post.canvas) {
                        const canvas = JSON.parse(post.canvas)
                        customImageUrl = canvas.customImage || null
                      }
                    } catch (error) {
                      console.error('Error parsing canvas:', error)
                    }

                    return (
                      <Pressable
                        key={post.id}
                        onPress={() => router.push(`/property/${post.id}`)}
                        onLongPress={() => handleLongPress(post)}
                      >
                        <Box
                          className={`${isLastItem ? 'mb-8' : 'mb-5'} overflow-hidden rounded-xl border border-gray-300 bg-white`}
                        >
                          <Grid _extra={{ className: 'grid-cols-5 items-start' }}>
                            <GridItem _extra={{ className: 'col-span-2' }} className="relative p-0">
                              {!propInfo.photos && !propInfo.propertyImage && !customImageUrl ? (
                                <Skeleton variant="sharp" className="aspect-square h-44 w-full" />
                              ) : (
                                <PropertyImage
                                  imageUrl={
                                    customImageUrl || propInfo?.propertyImage || propInfo?.photos?.[0]?.href || ''
                                  }
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
                                    <FontAwesome name="bed" size={14} color="inherit" />{' '}
                                    {propInfo.description?.beds || 'N/A'}
                                    {' • '}
                                    <FontAwesome name="bath" size={14} color="inherit" />{' '}
                                    {propInfo.description?.baths || 'N/A'}
                                    {' • '}
                                    <FontAwesome name="home" size={14} color="inherit" />{' '}
                                    {propInfo.description?.sqft
                                      ? `${propInfo.description?.sqft.toLocaleString()} ${propInfo.description?.unitType === 'm2' ? 'm²' : 'sqft'}`
                                      : 'N/A'}
                                  </Text>
                                )}
                              </HStack>
                              <Heading size="md" className="leading-tight">
                                {propInfo?.line
                                  ? propInfo.line.length > 20
                                    ? `${propInfo.line.slice(0, 20)}...`
                                    : `${propInfo.line},`
                                  : 'Address not available'}
                              </Heading>
                              <Heading size="md" className="leading-tight">
                                {propInfo?.city && `${propInfo.city}`}
                                {propInfo?.state && `, ${propInfo.state}`}
                                {/* Show country for international properties, postal code for USA properties */}
                                {propInfo?.country && propInfo.country !== 'US'
                                  ? `, ${propInfo.country}`
                                  : propInfo?.postalCode && `, ${propInfo.postalCode}`}
                              </Heading>
                            </GridItem>
                          </Grid>
                        </Box>
                      </Pressable>
                    )
                  })
                  .filter(Boolean)
              ) : (
                <Text>No posts found</Text>
              )}
            </>
          )}
        </VStack>
      </ScrollView>
    </VStack>
  )
}
