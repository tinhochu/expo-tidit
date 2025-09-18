import { ID, Query } from 'react-native-appwrite'

import { DATABASE_ID, POSTS_COLLECTION_ID, databases } from './appwriteConfig'

export interface Post {
  id?: string
  userId: string
  title: string
  propInformation: string | null
  createdAt?: string
  updatedAt?: string
  postType: string
  canvas?: string
}

export const createPost = async (post: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>): Promise<Post> => {
  try {
    const now = new Date().toISOString()

    // Create default canvas with tidit logo enabled
    const defaultCanvas = {
      primaryColor: '#2b7fff',
      secondaryColor: '#ffffff',
      textColor: '#2b7fff',
      showPrice: false,
      priceText: '',
      showBrokerage: true,
      showRealtor: true,
      showSignature: true, // Enable tidit logo by default
      font: 'playfair',
      currency: 'USD',
    }

    const response = await databases.createDocument(DATABASE_ID, POSTS_COLLECTION_ID, ID.unique(), {
      title: post.title,
      userId: post.userId,
      propInformation: JSON.stringify(post.propInformation),
      createdAt: now,
      updatedAt: now,
      postType: post.postType,
      canvas: JSON.stringify(defaultCanvas), // Include default canvas with tidit logo
    })

    return {
      id: response.$id,
      title: response.title,
      propInformation: response.propInformation,
      userId: post.userId,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
      postType: post.postType,
      canvas: response.canvas, // Include canvas in returned post
    }
  } catch (error) {
    console.error('Error creating post:', error)
    throw new Error('Failed to create post')
  }
}

export const getPostsByUserId = async (userId: string): Promise<Post[]> => {
  try {
    const response = await databases.listDocuments(DATABASE_ID, POSTS_COLLECTION_ID, [
      Query.equal('userId', userId),
      Query.orderDesc('createdAt'),
    ])

    return response.documents.map((doc) => ({
      id: doc.$id,
      title: doc.title,
      propInformation: JSON.parse(doc.propInformation),
      userId: doc.userId,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      postType: doc.postType,
      canvas: doc.canvas, // Include canvas field
    }))
  } catch (error) {
    throw new Error('Failed to fetch posts')
  }
}

export const getPostCountByUserId = async (userId: string): Promise<number> => {
  try {
    const response = await databases.listDocuments(DATABASE_ID, POSTS_COLLECTION_ID, [Query.equal('userId', userId)])
    return response.total
  } catch (error) {
    console.error('Error counting posts:', error)
    throw new Error('Failed to count posts')
  }
}

export const checkForDuplicatePost = async (userId: string, propertyAddress: string): Promise<boolean> => {
  try {
    // Get all posts by the user
    const userPosts = await getPostsByUserId(userId)

    // Check if any existing post has the same property address
    const hasDuplicate = userPosts.some((post) => {
      try {
        const propInfo =
          typeof post.propInformation === 'string' ? JSON.parse(post.propInformation) : post.propInformation

        // Check if the address line matches
        return propInfo?.line === propertyAddress
      } catch (error) {
        console.error('Error parsing post property information:', error)
        return false
      }
    })

    return hasDuplicate
  } catch (error) {
    console.error('Error checking for duplicate posts:', error)
    throw new Error('Failed to check for duplicate posts')
  }
}

export const getPostById = async (postId: string): Promise<any> => {
  try {
    const response = await databases.getDocument(DATABASE_ID, POSTS_COLLECTION_ID, postId)
    return response
  } catch (error) {
    console.error('Error fetching post:', error)
    throw new Error('Failed to fetch post')
  }
}

export const deletePost = async (postId: string): Promise<void> => {
  try {
    await databases.deleteDocument(DATABASE_ID, POSTS_COLLECTION_ID, postId)
  } catch (error) {
    console.error('Error deleting post:', error)
    throw new Error('Failed to delete post')
  }
}

export const updatePost = async (postId: string, updates: Partial<Post>): Promise<Post> => {
  try {
    const now = new Date().toISOString()

    const response = await databases.updateDocument(DATABASE_ID, POSTS_COLLECTION_ID, postId, {
      ...updates,
      updatedAt: now,
    })

    return {
      id: response.$id,
      title: response.title,
      propInformation: response.propInformation,
      userId: response.userId,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
      postType: response.postType,
      canvas: response.canvas, // Include canvas field
    }
  } catch (error) {
    console.error('Error updating post:', error)
    throw new Error('Failed to update post')
  }
}

/**
 * Ensures a post has a default canvas with tidit logo enabled
 * This is useful for existing posts that don't have a canvas field
 */
export const ensureDefaultCanvas = async (postId: string): Promise<void> => {
  try {
    const post = await getPostById(postId)

    // If post doesn't have a canvas, create one with defaults
    if (!post.canvas) {
      const defaultCanvas = {
        primaryColor: '#2b7fff',
        secondaryColor: '#ffffff',
        textColor: '#2b7fff',
        showPrice: false,
        priceText: '',
        showBrokerage: true,
        showRealtor: true,
        showSignature: true, // Enable tidit logo by default
        font: 'playfair',
      }

      await updatePost(postId, {
        canvas: JSON.stringify(defaultCanvas),
      })
    }
  } catch (error) {
    console.error('Error ensuring default canvas:', error)
  }
}
