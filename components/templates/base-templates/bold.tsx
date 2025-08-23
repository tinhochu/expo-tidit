import TemplateHeading from '@/components/template-parts/heading'
import { hexToRgba } from '@/helpers/colorUtils'
import { Circle, Paragraph, Rect, Skia, TextAlign, useFonts } from '@shopify/react-native-skia'
import { LinearGradient, vec } from '@shopify/react-native-skia'
import { useMemo } from 'react'
import { useWindowDimensions } from 'react-native'

interface BoldTemplateProps {
  data: any
  postType: string
  template: string
  canvas: any
  userPrefs: any
  showBrokerage: boolean
  showRealtor: boolean
  customText?: {
    mainHeading?: string
    subHeading?: string
    description?: string
  }
}

export default function BoldTemplate({
  data,
  postType,
  template,
  canvas,
  userPrefs,
  showBrokerage,
  showRealtor,
  customText,
}: BoldTemplateProps) {
  const { width: screenWidth } = useWindowDimensions()
  const customFontMgr = useFonts({
    PlayfairDisplay: [require('@/assets/fonts/PlayfairDisplay-Regular.ttf')],
  })

  const paragraph = useMemo(() => {
    if (!customFontMgr) return null

    const paragraphStyle = {
      textAlign: TextAlign.Center,
    }
    const textStyle = {
      color: Skia.Color('white'),
      fontFamilies: ['PlayfairDisplay'],
      fontSize: 16,
    }

    const para = Skia.ParagraphBuilder.Make(paragraphStyle, customFontMgr)
      .pushStyle(textStyle)
      .addText(`${data.propInformation.line}`)
      .addText(`\n${data.propInformation.city}, ${data.propInformation.state}`)
      .addText(`\n${data.propInformation.postalCode}`)
      .build()

    return para
  }, [customFontMgr, data.propInformation])

  // Use custom text or fall back to post type
  const mainHeading = customText?.mainHeading || getPostTypeLabel(postType)
  const subHeading = customText?.subHeading || ''

  return (
    <>
      {/* Dark background with strong contrast */}
      <Rect x={0} y={0} width={screenWidth} height={screenWidth} color={Skia.Color('#000000')} />

      {/* Bold accent bar */}
      <Rect
        x={0}
        y={screenWidth * 0.15}
        width={screenWidth}
        height={screenWidth * 0.1}
        color={canvas.primaryColor || '#ff6b35'}
      />

      {/* Main heading with dramatic positioning */}
      <TemplateHeading
        screenWidth={screenWidth}
        text={mainHeading}
        x={screenWidth * 0}
        y={screenWidth * 0.35}
        size={1.5}
      />

      {/* Sub heading if provided */}
      {subHeading && (
        <TemplateHeading
          screenWidth={screenWidth}
          text={subHeading}
          x={screenWidth * 0}
          y={screenWidth * 0.5}
          size={1.0}
        />
      )}

      {/* Large accent circle */}
      <Circle
        cx={screenWidth * 0.5}
        cy={screenWidth * 0.8}
        r={screenWidth * 0.25}
        color={canvas.primaryColor || '#ff6b35'}
      />

      {/* Address text centered over the circle */}
      <Paragraph paragraph={paragraph} x={0} y={screenWidth * 0.75} width={screenWidth} />
    </>
  )
}

// Helper function to get post type label
function getPostTypeLabel(postType: string): string {
  const labels: { [key: string]: string } = {
    JUST_SOLD: 'Just Sold',
    JUST_LISTED: 'Just Listed',
    JUST_RENTED: 'Just Rented',
    OPEN_HOUSE: 'Open House',
    UNDER_CONTRACT: 'Under Contract',
    BACK_ON_MARKET: 'Back on Market',
  }
  return labels[postType] || postType
}
