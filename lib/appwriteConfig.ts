import { Platform } from 'react-native'
import { Account, Client, Databases } from 'react-native-appwrite'

const client = new Client()
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!)

switch (Platform.OS) {
  case 'ios':
    client.setPlatform(process.env.EXPO_PUBLIC_APPWRITE_BUNDLE_ID!)
    break
}

const account = new Account(client)
const databases = new Databases(client)

// Database and collection IDs - you'll need to create these in your Appwrite console
const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || 'zengamer_db'
const USER_PREFERENCES_COLLECTION_ID =
  process.env.EXPO_PUBLIC_APPWRITE_USER_PREFERENCES_COLLECTION_ID || 'user_preferences'

export { account, databases, DATABASE_ID, USER_PREFERENCES_COLLECTION_ID }
