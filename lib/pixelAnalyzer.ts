import { Skia } from '@shopify/react-native-skia'

export interface PixelAnalysisResult {
  dominantColor: 'black' | 'white'
  averageBrightness: number
  contrastRatio: number
}

/**
 * Analyzes the pixels around a specific position to determine the appropriate color
 * for elements like signatures that need to contrast with the background
 */
export function analyzePixelsAroundPosition(
  canvas: any, // Skia Canvas
  x: number,
  y: number,
  sampleRadius: number = 20
): PixelAnalysisResult {
  try {
    // Create a snapshot of the canvas area around the signature
    const snapshot = canvas.makeImageSnapshot()
    if (!snapshot) {
      return { dominantColor: 'black', averageBrightness: 0.5, contrastRatio: 1.0 }
    }

    // Get the pixel data around the signature position
    const pixels = snapshot.readPixels(
      Math.max(0, x - sampleRadius),
      Math.max(0, y - sampleRadius),
      sampleRadius * 2,
      sampleRadius * 2
    )

    if (!pixels || pixels.length === 0) {
      return { dominantColor: 'black', averageBrightness: 0.5, contrastRatio: 1.0 }
    }

    // Analyze the pixels to determine brightness and color distribution
    let totalBrightness = 0
    let blackPixels = 0
    let whitePixels = 0
    let totalPixels = 0

    // Process pixels (assuming RGBA format)
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i]
      const g = pixels[i + 1]
      const b = pixels[i + 2]
      const a = pixels[i + 3]

      // Skip transparent pixels
      if (a < 128) continue

      // Calculate brightness (0-1)
      const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255
      totalBrightness += brightness
      totalPixels++

      // Categorize as black or white based on brightness threshold
      if (brightness < 0.3) {
        blackPixels++
      } else if (brightness > 0.7) {
        whitePixels++
      }
    }

    if (totalPixels === 0) {
      return { dominantColor: 'black', averageBrightness: 0.5, contrastRatio: 1.0 }
    }

    const averageBrightness = totalBrightness / totalPixels
    const blackRatio = blackPixels / totalPixels
    const whiteRatio = whitePixels / totalPixels

    // Determine dominant color
    let dominantColor: 'black' | 'white' = 'black'
    if (whiteRatio > blackRatio && averageBrightness > 0.5) {
      dominantColor = 'white'
    }

    // Calculate contrast ratio (simplified)
    const contrastRatio = Math.abs(averageBrightness - 0.5) * 2

    return {
      dominantColor,
      averageBrightness,
      contrastRatio,
    }
  } catch (error) {
    console.error('Error analyzing pixels:', error)
    // Fallback to black if analysis fails
    return { dominantColor: 'black', averageBrightness: 0.5, contrastRatio: 1.0 }
  }
}

/**
 * Determines the optimal color for a signature based on background analysis
 */
export function getOptimalSignatureColor(
  canvas: any,
  signatureX: number,
  signatureY: number,
  signatureSize: number
): string {
  const analysis = analyzePixelsAroundPosition(canvas, signatureX, signatureY, signatureSize / 2)

  // Use the opposite of the dominant background color for maximum contrast
  if (analysis.dominantColor === 'white') {
    return '#1d1d1b' // Dark color for light backgrounds
  } else {
    return '#ffffff' // White color for dark backgrounds
  }
}

/**
 * Alternative method using a larger sampling area for more accurate analysis
 */
export function analyzeSignatureBackground(
  canvas: any,
  signatureX: number,
  signatureY: number,
  signatureWidth: number,
  signatureHeight: number
): PixelAnalysisResult {
  // Sample pixels from multiple areas around the signature
  const samplePoints = [
    { x: signatureX - signatureWidth, y: signatureY - signatureHeight },
    { x: signatureX + signatureWidth, y: signatureY - signatureHeight },
    { x: signatureX - signatureWidth, y: signatureY + signatureHeight },
    { x: signatureX + signatureWidth, y: signatureY + signatureHeight },
    { x: signatureX, y: signatureY - signatureHeight },
    { x: signatureX, y: signatureY + signatureHeight },
  ]

  let totalBrightness = 0
  let totalPixels = 0

  for (const point of samplePoints) {
    const analysis = analyzePixelsAroundPosition(canvas, point.x, point.y, 10)
    totalBrightness += analysis.averageBrightness
    totalPixels++
  }

  const averageBrightness = totalPixels > 0 ? totalBrightness / totalPixels : 0.5
  const dominantColor = averageBrightness > 0.5 ? 'white' : 'black'
  const contrastRatio = Math.abs(averageBrightness - 0.5) * 2

  return {
    dominantColor,
    averageBrightness,
    contrastRatio,
  }
}
