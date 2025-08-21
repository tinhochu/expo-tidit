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
}

export const createPost = async (post: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>): Promise<Post> => {
  try {
    const now = new Date().toISOString()

    const response = await databases.createDocument(DATABASE_ID, POSTS_COLLECTION_ID, ID.unique(), {
      title: post.title,
      userId: post.userId,
      propInformation: JSON.stringify(post.propInformation),
      createdAt: now,
      updatedAt: now,
      postType: post.postType,
    })

    return {
      id: response.$id,
      title: response.title,
      propInformation: response.propInformation,
      userId: post.userId,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
      postType: post.postType,
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
    }))
  } catch (error) {
    console.error('Error fetching posts:', error)
    throw new Error('Failed to fetch posts')
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
