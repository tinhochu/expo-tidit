import * as FileSystem from 'expo-file-system'
import * as ImageManipulator from 'expo-image-manipulator'

export interface ImageProcessingOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'auto' | 'jpeg' | 'png'
  maintainAspectRatio?: boolean
}

export interface ProcessedImage {
  uri: string
  width: number
  height: number
  size: number
  format: string
}

/**
 * Process an image to reduce its size and dimensions before uploading
 * @param imageUri - The URI of the image to process
 * @param options - Processing options
 * @returns Promise<ProcessedImage> - The processed image information
 */
export async function processImage(imageUri: string, options: ImageProcessingOptions = {}): Promise<ProcessedImage> {
  const { maxWidth = 800, maxHeight = 800, quality = 0.8, format = 'auto', maintainAspectRatio = true } = options

  try {
    // Get image information first
    const imageInfo = await getImageInfo(imageUri)

    // Determine the output format
    const outputFormat = format === 'auto' ? imageInfo.format : format

    // Calculate new dimensions
    const { newWidth, newHeight } = calculateDimensions(
      imageInfo.width,
      imageInfo.height,
      maxWidth,
      maxHeight,
      maintainAspectRatio
    )

    // Use expo-image-manipulator to resize and compress the image
    const manipulatorOptions: ImageManipulator.Action[] = [
      {
        resize: {
          width: newWidth,
          height: newHeight,
        },
      },
    ]

    const result = await ImageManipulator.manipulateAsync(imageUri, manipulatorOptions, {
      compress: quality,
      format: outputFormat === 'jpeg' ? ImageManipulator.SaveFormat.JPEG : ImageManipulator.SaveFormat.PNG,
    })

    // Get the file size of the processed image
    const fileSize = await getFileSize(result.uri)

    return {
      uri: result.uri,
      width: result.width,
      height: result.height,
      size: fileSize,
      format: outputFormat,
    }
  } catch (error) {
    console.error('Error processing image:', error)
    // Fallback to original image if processing fails
    const fallbackSize = await getFileSize(imageUri)
    return {
      uri: imageUri,
      width: 0,
      height: 0,
      size: fallbackSize,
      format,
    }
  }
}

/**
 * Get image information and detect format
 */
async function getImageInfo(imageUri: string): Promise<{ width: number; height: number; format: 'jpeg' | 'png' }> {
  try {
    // Detect format from file extension
    const fileExtension = imageUri.split('.').pop()?.toLowerCase()
    let detectedFormat: 'jpeg' | 'png' = 'jpeg'

    if (fileExtension === 'png') {
      detectedFormat = 'png'
    } else if (fileExtension === 'jpg' || fileExtension === 'jpeg') {
      detectedFormat = 'jpeg'
    }

    // Get dimensions using the detected format
    const result = await ImageManipulator.manipulateAsync(
      imageUri,
      [], // No manipulations, just get info
      { format: detectedFormat === 'png' ? ImageManipulator.SaveFormat.PNG : ImageManipulator.SaveFormat.JPEG }
    )

    return {
      width: result.width,
      height: result.height,
      format: detectedFormat,
    }
  } catch (error) {
    console.error('Error getting image info:', error)
    // Fallback dimensions and format
    return { width: 800, height: 800, format: 'jpeg' }
  }
}

/**
 * Calculate new dimensions while maintaining aspect ratio
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number,
  maintainAspectRatio: boolean
): { newWidth: number; newHeight: number } {
  if (originalWidth <= maxWidth && originalHeight <= maxHeight) {
    return { newWidth: originalWidth, newHeight: originalHeight }
  }

  if (maintainAspectRatio) {
    const aspectRatio = originalWidth / originalHeight

    if (originalWidth > originalHeight) {
      const newWidth = Math.min(originalWidth, maxWidth)
      const newHeight = newWidth / aspectRatio

      if (newHeight > maxHeight) {
        const newHeight2 = maxHeight
        const newWidth2 = newHeight2 * aspectRatio
        return { newWidth: newWidth2, newHeight: newHeight2 }
      }

      return { newWidth, newHeight }
    } else {
      const newHeight = Math.min(originalHeight, maxHeight)
      const newWidth = newHeight * aspectRatio

      if (newWidth > maxWidth) {
        const newWidth2 = maxWidth
        const newHeight2 = newWidth2 / aspectRatio
        return { newWidth: newWidth2, newHeight: newHeight2 }
      }

      return { newWidth, newHeight }
    }
  } else {
    return {
      newWidth: Math.min(originalWidth, maxWidth),
      newHeight: Math.min(originalHeight, maxHeight),
    }
  }
}

/**
 * Get file size in bytes
 */
export async function getFileSize(uri: string): Promise<number> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri)
    if (fileInfo.exists && 'size' in fileInfo && fileInfo.size) {
      return fileInfo.size
    }
    return 0
  } catch (error) {
    console.error('Error getting file size:', error)
    return 0
  }
}

/**
 * Convert bytes to human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Clean up temporary processed images
 */
export async function cleanupTempImages(): Promise<void> {
  try {
    const tempDir = FileSystem.cacheDirectory
    if (!tempDir) return

    const files = await FileSystem.readDirectoryAsync(tempDir)

    for (const file of files) {
      if (file.startsWith('ImageManipulator_')) {
        await FileSystem.deleteAsync(`${tempDir}${file}`)
      }
    }
  } catch (error) {
    console.error('Error cleaning up temp images:', error)
  }
}

/**
 * Profile-specific image processing with optimal settings
 */
export async function processProfileImage(
  imageUri: string,
  type: 'brokerageLogo' | 'realtorPicture'
): Promise<ProcessedImage> {
  const options: ImageProcessingOptions = {
    maxWidth: type === 'brokerageLogo' ? 400 : 600, // Logo smaller than profile pic
    maxHeight: type === 'brokerageLogo' ? 400 : 600,
    quality: 0.85, // Slightly higher quality for profile images
    format: 'auto', // Automatically detect and preserve original format
    maintainAspectRatio: true,
  }

  return processImage(imageUri, options)
}

/**
 * Get compression statistics
 */
export async function getCompressionStats(
  originalUri: string,
  processedUri: string
): Promise<{
  originalSize: number
  processedSize: number
  compressionRatio: number
  sizeReduction: string
}> {
  const originalSize = await getFileSize(originalUri)
  const processedSize = await getFileSize(processedUri)

  const compressionRatio = ((originalSize - processedSize) / originalSize) * 100
  const sizeReduction = formatFileSize(originalSize - processedSize)

  return {
    originalSize,
    processedSize,
    compressionRatio,
    sizeReduction,
  }
}

/**
 * Get file extension from URI
 */
export function getFileExtension(uri: string): string {
  const extension = uri.split('.').pop()?.toLowerCase()
  return extension || 'jpg'
}

/**
 * Get MIME type from file extension
 */
export function getMimeType(extension: string): string {
  switch (extension.toLowerCase()) {
    case 'png':
      return 'image/png'
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    default:
      return 'image/jpeg'
  }
}
