import TemplateHeading from '@/components/template-parts/heading'
import Signature from '@/components/template-parts/signature'
import { hexToRgba } from '@/helpers/colorUtils'
import { Circle, Paragraph, Rect, Skia, TextAlign, useFonts } from '@shopify/react-native-skia'
import { LinearGradient, vec } from '@shopify/react-native-skia'
import { useMemo } from 'react'
import { useWindowDimensions } from 'react-native'

interface ElegantTemplateProps {
  data: any
  postType: string
  template: string
  canvas: {
    primaryColor?: string
    showPrice?: boolean
    priceText?: string
    showBrokerage?: boolean
    showRealtor?: boolean
  }
  userPrefs: any
  showBrokerage: boolean
  showRealtor: boolean
  showSignature: boolean
  customText?: {
    mainHeading?: string
    subHeading?: string
    description?: string
  }
}

export default function ElegantTemplate({
  data,
  postType,
  template,
  canvas,
  userPrefs,
  showBrokerage,
  showRealtor,
  showSignature,
  customText,
}: ElegantTemplateProps) {
  const { width: screenWidth } = useWindowDimensions()
  const customFontMgr = useFonts({
    PlayfairDisplay: [require('@/assets/fonts/PlayfairDisplay-Regular.ttf')],
  })

  const paragraph = useMemo(() => {
    if (!customFontMgr) return null

    const paragraphStyle = {
      textAlign: TextAlign.Left,
    }
    const textStyle = {
      color: Skia.Color('white'),
      fontFamilies: ['PlayfairDisplay'],
      fontSize: 13,
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
  const subHeading = customText?.subHeading || (canvas.showPrice && canvas.priceText ? canvas.priceText : '')

  return (
    <>
      {/* Sophisticated gradient background */}
      <Rect x={0} y={0} width={screenWidth} height={screenWidth}>
        <LinearGradient
          start={vec(0, 0)}
          end={vec(screenWidth, screenWidth)}
          positions={[0, 0.3, 0.7, 1]}
          colors={[
            hexToRgba(canvas.primaryColor || '#2c3e50', 0.9) || 'rgba(44, 62, 80, 0.9)',
            hexToRgba(canvas.primaryColor || '#34495e', 0.7) || 'rgba(52, 73, 94, 0.7)',
            hexToRgba(canvas.primaryColor || '#2c3e50', 0.8) || 'rgba(44, 62, 80, 0.8)',
            hexToRgba(canvas.primaryColor || '#34495e', 0.6) || 'rgba(52, 73, 94, 0.6)',
          ]}
        />
      </Rect>

      {/* Elegant top accent */}
      <Rect
        x={screenWidth * 0.1}
        y={screenWidth * 0.05}
        width={screenWidth * 0.8}
        height={screenWidth * 0.02}
        color={Skia.Color('#ecf0f1')}
      />

      {/* Main heading with refined positioning */}
      <TemplateHeading
        screenWidth={screenWidth}
        text={mainHeading}
        x={screenWidth * 0}
        y={screenWidth * 0.2}
        size={1.3}
      />

      {/* Sub heading if provided */}
      {subHeading && (
        <TemplateHeading
          screenWidth={screenWidth}
          text={subHeading}
          x={screenWidth * 0}
          y={screenWidth * 0.35}
          size={0.9}
        />
      )}

      {/* Elegant bottom accent bar */}
      <Rect
        x={0}
        y={screenWidth * 0.75}
        width={screenWidth}
        height={screenWidth * 0.02}
        color={Skia.Color('#ecf0f1')}
      />

      {/* Refined accent circle */}
      <Circle cx={screenWidth * 0.85} cy={screenWidth * 0.85} r={screenWidth * 0.12} color={Skia.Color('#ecf0f1')} />

      {/* Address text positioned elegantly */}
      <Paragraph paragraph={paragraph} x={screenWidth * 0.05} y={screenWidth * 0.8} width={screenWidth * 0.6} />

      {/* Tidit Signature - Only show if enabled */}
      {showSignature && (
        <Signature screenWidth={screenWidth} y={screenWidth * 0.95} />
      )}
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
