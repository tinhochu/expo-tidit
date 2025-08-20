import { Box } from '@/components/ui/box'
import { Heading } from '@/components/ui/heading'
import { HStack } from '@/components/ui/hstack'
import { Pressable } from '@/components/ui/pressable'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { useAuth } from '@/context/AuthContext'
import { Post, getPosts } from '@/lib/postService'
import AntDesign from '@expo/vector-icons/AntDesign'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { ScrollView } from 'react-native'

export default function Settings() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])

  useEffect(() => {
    const fetchPosts = async () => {
      const posts = await getPosts(user?.$id)
      setPosts(posts)
    }

    if (user?.$id) {
      fetchPosts()
    }
  }, [user?.$id])

  return (
    <VStack className="min-h-screen">
      <Box className="border-b border-gray-200 bg-white p-2 px-5 pt-[72px]">
        <HStack className="items-center justify-between">
          <Heading size="xl">Hello, {user?.name}</Heading>
          <Pressable onPress={() => router.push('/create-post')}>
            <AntDesign size={28} name="pluscircleo" color="black" />
          </Pressable>
        </HStack>
      </Box>
      <ScrollView>
        <VStack className="px-5 pt-5">
          <Box>
            {posts.length > 0 ? (
              posts.map((post) => <Text key={post.id}>{post.title}</Text>)
            ) : (
              <Text>No posts found</Text>
            )}
          </Box>
        </VStack>
      </ScrollView>
    </VStack>
  )
}
