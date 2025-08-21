import { Group, ImageSVG, Skia, fitbox, rect } from '@shopify/react-native-skia'
import { useWindowDimensions } from 'react-native'

interface ImageProps {
  svgString: string
  x?: number
  y?: number
  width?: number
  height?: number
  color?: string
  position?: {
    x: number
    y: number
    width: number
    height: number
  }
}

export default function Image({ svgString, x = 0, y = 0, width, height, color = 'black', position }: ImageProps) {
  const { width: screenWidth } = useWindowDimensions()

  // Create SVG from string
  const svg = Skia.SVG.MakeFromString(svgString)

  // If color is specified, replace all fill="black" with the specified color
  let processedSvgString = svgString
  if (color !== 'black') {
    processedSvgString = svgString.replace(/fill="black"/g, `fill="${color}"`)
  }

  // Recreate SVG with processed string if color changed
  const finalSvg = color !== 'black' ? Skia.SVG.MakeFromString(processedSvgString) : svg

  // Use provided position or default positioning
  const destRect = position
    ? rect(position.x, position.y, position.width, position.height)
    : rect(x, y, width || screenWidth * 0.8, height || screenWidth * 0.2)

  // Source rect using actual SVG dimensions
  const sourceRect = rect(0, 0, finalSvg?.width() || 945, finalSvg?.height() || 113)

  return (
    <Group transform={fitbox('contain', sourceRect, destRect)}>
      <ImageSVG svg={finalSvg} x={0} y={0} />
    </Group>
  )
}
