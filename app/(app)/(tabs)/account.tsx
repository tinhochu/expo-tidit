import { Button, ButtonText } from '@/components/ui/button'
import { Heading } from '@/components/ui/heading'
import { HStack } from '@/components/ui/hstack'
import { ArrowLeftIcon, Icon } from '@/components/ui/icon'
import { Pressable } from '@/components/ui/pressable'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { useAuth } from '@/context/AuthContext'
import { createPost } from '@/lib/postService'
import { router } from 'expo-router'
import { useState } from 'react'
import { Alert } from 'react-native'

export default function Settings() {
  const { signout, user } = useAuth()
  // const [isCreating, setIsCreating] = useState(false)

  // const handleCreatePost = async () => {
  //   if (!user?.$id) {
  //     Alert.alert('Error', 'You must be signed in to create a post')
  //     return
  //   }

  //   setIsCreating(true)
  //   try {
  //     const newPost = await createPost({
  //       title: 'Sample Post',
  //       userId: user.$id,
  //       propInformation: {
  //         name: 'John Doe',
  //         age: 30,
  //         email: 'john.doe@example.com',
  //       },
  //     })

  //     Alert.alert('Success', 'Post created successfully!')
  //     console.log('Post created successfully:', newPost)
  //   } catch (error) {
  //     console.error('Failed to create post:', error)
  //     Alert.alert('Error', 'Failed to create post. Please try again.')
  //   } finally {
  //     setIsCreating(false)
  //   }
  // }

  return (
    <VStack className="min-h-screen" space="xl">
      <VStack space="lg" className="p-6">
        <VStack space="md">
          {/* <Button size="lg" action="positive" onPress={handleCreatePost} disabled={isCreating}>
            <ButtonText>{isCreating ? 'Creating Post...' : 'Create New Post'}</ButtonText>
          </Button> */}

          <Button size="lg" action="negative" variant="outline" onPress={signout}>
            <ButtonText className="text-red-500">Sign Out</ButtonText>
          </Button>
        </VStack>
      </VStack>
    </VStack>
  )
}
