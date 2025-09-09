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
  userPrefs: any | null
  showBrokerage: boolean
  showRealtor: boolean
  showSignature: boolean
  customText?: {
    mainHeading?: string
    subHeading?: string
    description?: string
  }
  selectedFont?: string
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
  selectedFont = 'inter',
}: ElegantTemplateProps) {
  // Safety check for data
  if (!data || !data.propInformation) {
    console.warn('ElegantTemplate: data or data.propInformation is null or undefined')
    return null
  }

  const { width: screenWidth } = useWindowDimensions()

  // Function to get font family based on selected font
  const getFontFamily = (font: string) => {
    switch (font) {
      case 'inter':
        return 'Inter'
      case 'poppins':
        return 'PoppinsSemiBold'
      case 'playfair':
        return 'PlayfairDisplay'
      case 'cormorant':
        return 'CormorantGaramond'
      case 'montserrat':
        return 'MontserratExtraBold'
      case 'spacemono':
        return 'SpaceMono'
      default:
        return 'Inter'
    }
  }

  // Function to get font-specific size adjustments for paragraphs
  const getParagraphFontSize = (baseSize: number, font: string) => {
    switch (font) {
      case 'PlayfairDisplay':
        return baseSize * 1.0 // Playfair is well-balanced
      case 'Inter':
        return baseSize * 0.9 // Inter is compact, increase for readability
      case 'MontserratExtraBold':
        return baseSize * 0.85 // Montserrat ExtraBold is bold but readable
      case 'CormorantGaramond':
        return baseSize * 1.2 // Cormorant can be small, increase
      case 'PoppinsSemiBold':
        return baseSize * 0.85 // Poppins is balanced, slight increase
      case 'SpaceMono':
        return baseSize * 0.85 // SpaceMono is monospace, keep standard
      default:
        return baseSize
    }
  }

  const customFontMgr = useFonts({
    PlayfairDisplay: [require('@/assets/fonts/PlayfairDisplay-Regular.ttf')],
    Inter: [require('@/assets/fonts/Inter.ttf')],
    MontserratExtraBold: [require('@/assets/fonts/Montserrat-ExtraBold.ttf')],
    CormorantGaramond: [require('@/assets/fonts/CormorantGaramond.ttf')],
    PoppinsSemiBold: [require('@/assets/fonts/Poppins-SemiBold.ttf')],
    SpaceMono: [require('@/assets/fonts/SpaceMono-Regular.ttf')],
  })

  const paragraph = useMemo(() => {
    if (!customFontMgr) return null

    const paragraphStyle = {
      textAlign: TextAlign.Left,
    }
    const adjustedFontSize = getParagraphFontSize(13, getFontFamily(selectedFont))
    const textStyle = {
      color: Skia.Color('white'),
      fontFamilies: [getFontFamily(selectedFont)],
      fontSize: adjustedFontSize,
    }

    const para = Skia.ParagraphBuilder.Make(paragraphStyle, customFontMgr)
      .pushStyle(textStyle)
      .addText(`${data.propInformation.line}`)
      .addText(`\n${data.propInformation.city}, ${data.propInformation.state}`)
      .addText(`\n${data.propInformation.postalCode}`)
      .build()

    return para
  }, [customFontMgr, data.propInformation, selectedFont])

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
        fontFamily={getFontFamily(selectedFont)}
      />

      {/* Sub heading if provided */}
      {subHeading && (
        <TemplateHeading
          screenWidth={screenWidth}
          text={subHeading}
          x={screenWidth * 0}
          y={screenWidth * 0.35}
          size={0.9}
          fontFamily={getFontFamily(selectedFont)}
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
      {showSignature && <Signature screenWidth={screenWidth} y={screenWidth * 0.95} />}
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
    COMING_SOON: 'Coming Soon',
    PRICE_DROP: 'Price Drop',
  }
  return labels[postType] || postType
}
