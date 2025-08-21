import { Platform } from 'react-native'
import { Account, Client, Databases, Storage } from 'react-native-appwrite'

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
const storage = new Storage(client)

const DATABASE_ID = '68a5ed72002d6a1772b0'
const POSTS_COLLECTION_ID = '68a5ed870018f4007514'
const BUCKET_ID = '68a74595003669be5401'

export { account, databases, DATABASE_ID, POSTS_COLLECTION_ID, BUCKET_ID, storage }
