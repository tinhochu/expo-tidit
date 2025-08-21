// lib/export.ts
import { Skia } from '@shopify/react-native-skia'
import * as FileSystem from 'expo-file-system'
import * as MediaLibrary from 'expo-media-library'

export async function exportCanvasToPng(canvasRef: any, filename = 'tidit-post.png') {
  // snapshot at high-res
  const image = canvasRef.current?.makeImageSnapshot()
  if (!image) throw new Error('Snapshot failed')
  const png = image.encodeToBase64('png')

  const path = FileSystem.cacheDirectory! + filename
  await FileSystem.writeAsStringAsync(path, png, {
    encoding: FileSystem.EncodingType.Base64,
  })

  // optional: save to Photos
  await MediaLibrary.requestPermissionsAsync()
  await MediaLibrary.saveToLibraryAsync(path)
  return path
}
