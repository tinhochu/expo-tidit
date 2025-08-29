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

// Function to calculate relative luminance of a color
function getLuminance(hexColor: string): number {
  // Remove # if present
  const hex = hexColor.replace('#', '')

  // Convert hex to RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255
  const g = parseInt(hex.substring(2, 4), 16) / 255
  const b = parseInt(hex.substring(4, 6), 16) / 255

  // Apply gamma correction
  const rGamma = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4)
  const gGamma = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4)
  const bGamma = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4)

  // Calculate relative luminance
  return 0.2126 * rGamma + 0.7152 * gGamma + 0.0722 * bGamma
}

// Function to determine best contrast color
export function getContrastColor(backgroundColor: string): string {
  const luminance = getLuminance(backgroundColor)

  // If background is light (luminance > 0.5), use dark text
  // If background is dark (luminance <= 0.5), use light text
  return luminance > 0.5 ? '#000000' : '#ffffff'
}
