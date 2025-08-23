# Image Processing for Profile Section

This document explains how to use the new image processing functionality that automatically resizes and compresses images before uploading them in the profile section.

## Overview

The image processing system automatically:

- Resizes images to optimal dimensions for profile pictures and logos
- Compresses images to reduce file size
- Maintains aspect ratio
- Provides compression statistics
- Cleans up temporary files

## Features

### Automatic Image Processing

- **Profile Pictures**: Automatically resized to 600x600px with 85% quality
- **Brokerage Logos**: Automatically resized to 400x400px with 85% quality
- **Smart Compression**: Reduces file size while maintaining visual quality
- **Aspect Ratio Preservation**: Images maintain their original proportions
- **Format Preservation**: PNG images stay PNG (preserving transparency), JPEG images stay JPEG

### Compression Statistics

- Shows original vs. processed file sizes
- Displays compression ratio percentage
- Reports size reduction in human-readable format
- Logs detailed statistics to console

### Performance Benefits

- Faster uploads due to smaller file sizes
- Reduced storage costs
- Better app performance
- Improved user experience

## How It Works

### 1. Image Selection

When a user selects an image in the profile section:

- Image picker launches with full quality settings
- User selects and crops the image
- Original image is temporarily stored

### 2. Image Processing

The selected image is automatically processed:

- Dimensions are calculated based on image type
- Image is resized using `expo-image-manipulator`
- Quality is optimized for the specific use case
- Processed image is created in temporary storage

### 3. Upload

The processed image is then uploaded:

- Smaller file size means faster upload
- Reduced bandwidth usage
- Better storage efficiency

### 4. Cleanup

Temporary files are automatically cleaned up:

- When component unmounts
- After successful upload
- Prevents storage bloat

## Configuration

### Profile Image Settings

```typescript
// Profile pictures
maxWidth: 600
maxHeight: 600
quality: 0.85
format: 'auto' // Automatically detects and preserves original format

// Brokerage logos
maxWidth: 400
maxHeight: 400
quality: 0.85
format: 'auto' // Automatically detects and preserves original format
```

### Custom Processing Options

You can customize processing for other use cases:

```typescript
import { processImage } from '@/lib/imageProcessor'

const processedImage = await processImage(imageUri, {
  maxWidth: 800,
  maxHeight: 600,
  quality: 0.7,
  format: 'auto', // Automatically detect and preserve original format
  maintainAspectRatio: true,
})
```

### Format Detection & Preservation

The system automatically detects the original image format and preserves it:

- **PNG Images**: Keep PNG format, preserving transparency and no background
- **JPEG Images**: Keep JPEG format for optimal compression
- **Format Detection**: Based on file extension (.png, .jpg, .jpeg)
- **No Background Issues**: PNG transparency is maintained throughout processing

## Usage Examples

### Basic Profile Image Processing

```typescript
import { processProfileImage } from '@/lib/imageProcessor'

const processedImage = await processProfileImage(imageUri, 'realtorPicture')
```

### Custom Image Processing

```typescript
import { getCompressionStats, processImage } from '@/lib/imageProcessor'

// Process with custom settings
const processedImage = await processImage(imageUri, {
  maxWidth: 1200,
  maxHeight: 800,
  quality: 0.9,
  format: 'jpeg',
})

// Get compression statistics
const stats = await getCompressionStats(imageUri, processedImage.uri)
console.log(`Reduced by ${stats.sizeReduction}`)
```

### File Size Utilities

```typescript
import { formatFileSize, getFileSize } from '@/lib/imageProcessor'

const sizeInBytes = await getFileSize(imageUri)
const humanReadableSize = formatFileSize(sizeInBytes)
```

## Dependencies

The image processing system requires:

- `expo-image-manipulator` - For image resizing and compression
- `expo-file-system` - For file operations and cleanup
- `expo-image-picker` - For image selection

## Installation

The required packages are already installed:

```bash
npm install expo-image-manipulator
```

## Error Handling

The system includes robust error handling:

- Falls back to original image if processing fails
- Logs errors for debugging
- Continues with upload process
- User-friendly error messages

## Performance Considerations

### Memory Usage

- Images are processed in temporary storage
- Automatic cleanup prevents memory leaks
- Efficient processing pipeline

### Processing Time

- Small images (< 1MB): ~100-500ms
- Medium images (1-5MB): ~500ms-2s
- Large images (> 5MB): ~2-5s

### File Size Reduction

- Typical reduction: 40-80%
- Depends on original image quality and dimensions
- Maintains visual quality while reducing size

## Troubleshooting

### Common Issues

1. **Processing Fails**
   - Check if `expo-image-manipulator` is installed
   - Verify image format is supported
   - Check available device storage

2. **Large File Sizes After Processing**
   - Adjust quality settings
   - Reduce max dimensions
   - Check original image format

3. **Memory Issues**
   - Ensure cleanup is working
   - Check for memory leaks
   - Monitor temporary file storage

### Debug Information

Enable detailed logging by checking console output:

```typescript
console.log(
  `Image compression stats: Original: ${formatFileSize(originalSize)}, Processed: ${formatFileSize(processedSize)}, Reduction: ${compressionRatio.toFixed(1)}%`
)
```

## Future Enhancements

Potential improvements:

- WebP format support for better compression
- Progressive JPEG for better loading
- Batch processing for multiple images
- Cloud-based processing for very large images
- Custom compression algorithms
- Image format conversion

## Support

For issues or questions:

1. Check console logs for error messages
2. Verify all dependencies are installed
3. Test with different image types and sizes
4. Review this documentation

## License

This image processing system is part of the Tidit application and follows the same licensing terms.
