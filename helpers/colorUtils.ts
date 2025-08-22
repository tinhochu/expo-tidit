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
