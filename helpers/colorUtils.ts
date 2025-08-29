/**
 * Converts a hex color string to RGB values
 * @param hex - Hex color string (e.g., '#fafafa' or 'fafafa')
 * @returns Object with r, g, b values or null if invalid hex
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // Remove the # if present
  const cleanHex = hex.replace('#', '')

  // Parse the hex values
  const r = parseInt(cleanHex.substring(0, 2), 16)
  const g = parseInt(cleanHex.substring(2, 4), 16)
  const b = parseInt(cleanHex.substring(4, 6), 16)

  // Check if parsing was successful
  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return null
  }

  return { r, g, b }
}

/**
 * Converts a hex color string to RGB array
 * @param hex - Hex color string (e.g., '#fafafa' or 'fafafa')
 * @returns Array with [r, g, b] values or null if invalid hex
 */
export function hexToRgbArray(hex: string): [number, number, number] | null {
  const rgb = hexToRgb(hex)
  if (!rgb) return null

  return [rgb.r, rgb.g, rgb.b]
}

/**
 * Converts a hex color string to CSS rgb() string
 * @param hex - Hex color string (e.g., '#fafafa' or 'fafafa')
 * @returns CSS rgb() string or null if invalid hex
 */
export function hexToRgbString(hex: string): string | null {
  const rgb = hexToRgb(hex)
  if (!rgb) return null

  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
}

/**
 * Converts a hex color string to CSS rgba() string
 * @param hex - Hex color string (e.g., '#fafafa' or 'fafafa')
 * @param alpha - Alpha value (0-1)
 * @returns CSS rgba() string or null if invalid hex
 */
export function hexToRgba(hex: string, alpha: number = 1): string | null {
  const rgb = hexToRgb(hex)
  if (!rgb) return null

  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`
}

/**
 * Determines if a hex color is light or dark
 * @param hex - Hex color string (e.g., '#fafafa' or 'fafafa')
 * @returns 'white' for dark backgrounds, 'black' for light backgrounds
 */
export function getContrastColor(hex: string): 'white' | 'black' {
  const rgb = hexToRgb(hex)
  if (!rgb) return 'black' // Default fallback

  // Calculate relative luminance using the sRGB formula
  // This is the standard formula used by WCAG guidelines
  const { r, g, b } = rgb

  // Convert sRGB values to linear RGB
  const linearR = r / 255 <= 0.03928 ? r / 255 / 12.92 : Math.pow((r / 255 + 0.055) / 1.055, 2.4)
  const linearG = g / 255 <= 0.03928 ? g / 255 / 12.92 : Math.pow((g / 255 + 0.055) / 1.055, 2.4)
  const linearB = b / 255 <= 0.03928 ? b / 255 / 12.92 : Math.pow((b / 255 + 0.055) / 1.055, 2.4)

  // Calculate relative luminance
  const luminance = 0.2126 * linearR + 0.7152 * linearG + 0.0722 * linearB

  // Use a threshold of 0.5 to determine if color is light or dark
  // Colors with luminance > 0.5 are considered light and should use black text
  // Colors with luminance <= 0.5 are considered dark and should use white text
  return luminance > 0.5 ? 'black' : 'white'
}
