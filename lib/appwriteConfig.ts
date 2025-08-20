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

const DATABASE_ID = '68a5ed72002d6a1772b0'
const POSTS_COLLECTION_ID = '68a5ed870018f4007514'

export { account, databases, DATABASE_ID, POSTS_COLLECTION_ID }
