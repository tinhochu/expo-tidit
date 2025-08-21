// src/lib/saveSkiaImage.ts
import { Buffer } from 'buffer'
import * as FileSystem from 'expo-file-system'
import * as MediaLibrary from 'expo-media-library'
import { Platform } from 'react-native'

type SaveOptions = {
  /** custom filename without extension */
  filename?: string
  /** album name to save into (Android shows albums; iOS creates if missing) */
  albumName?: string
  /** PNG (default) or JPEG; Skia bytes are PNG by default */
  format?: 'png' | 'jpg'
}

export async function saveSkiaImageToPhotos(
  skiaImage: any, // Skia Image from makeImageSnapshot()
  opts: SaveOptions = {}
) {
  const { filename = `tidit_${Date.now()}`, albumName = 'Tidit', format = 'png' } = opts

  // 1) Ask for permission (once)
  const perm = await MediaLibrary.requestPermissionsAsync()
  if (!perm.granted) {
    throw new Error('Photos permission not granted.')
  }

  // 2) Encode to bytes (Skia returns Uint8Array)
  const bytes: Uint8Array = skiaImage.encodeToBytes()

  // 3) Write to a temporary file
  const fileUri = FileSystem.cacheDirectory + `${filename}.${format === 'jpg' ? 'jpg' : 'png'}`

  // expo-file-system writes base64 strings, so convert
  const base64 = Buffer.from(bytes).toString('base64')
  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  })

  // 4) Save into Photos (album optional)
  const asset = await MediaLibrary.createAssetAsync(fileUri)

  // On iOS, album creation is optional but nice; on Android it’s visible in Gallery apps
  try {
    await MediaLibrary.createAlbumAsync(albumName, asset, false)
  } catch {
    // If album exists or cannot be created, still return asset
  }

  return asset.uri // local Photos URI
}
