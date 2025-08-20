import { ID, Query } from 'react-native-appwrite'

import { DATABASE_ID, POSTS_COLLECTION_ID, databases } from './appwriteConfig'

export interface Post {
  id?: string
  userId: string
  title: string
  propInformation: object | string | null
  createdAt?: string
  updatedAt?: string
}

export const createPost = async (post: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>): Promise<Post> => {
  try {
    const now = new Date().toISOString()

    const response = await databases.createDocument(DATABASE_ID, POSTS_COLLECTION_ID, ID.unique(), {
      title: post.title,
      userId: post.userId,
      propInformation: JSON.stringify(post.propInformation) || '{}',
      createdAt: now,
      updatedAt: now,
    })

    console.log('response', { response })

    return {
      id: response.$id,
      title: response.title,
      propInformation: JSON.stringify(post.propInformation) || '{}',
      userId: post.userId,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
    }
  } catch (error) {
    console.error('Error creating post:', error)
    throw new Error('Failed to create post')
  }
}

export const getPosts = async (userId: string): Promise<Post[]> => {
  try {
    const response = await databases.listDocuments(DATABASE_ID, POSTS_COLLECTION_ID, [Query.equal('userId', userId)])

    return response.documents.map((doc) => ({
      id: doc.$id,
      title: doc.title,
      propInformation: JSON.stringify(doc.propInformation) || '{}',
      userId: doc.userId,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }))
  } catch (error) {
    console.error('Error fetching posts:', error)
    throw new Error('Failed to fetch posts')
  }
}
