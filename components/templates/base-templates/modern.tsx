import TemplateHeading from '@/components/template-parts/heading'
import Signature from '@/components/template-parts/signature'
import { hexToRgba } from '@/helpers/colorUtils'
import { Circle, Paragraph, Rect, Skia, TextAlign, useFonts } from '@shopify/react-native-skia'
import { LinearGradient, vec } from '@shopify/react-native-skia'
import { useMemo } from 'react'
import { useWindowDimensions } from 'react-native'

interface ModernTemplateProps {
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

export default function ModernTemplate({
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
}: ModernTemplateProps) {
  // Safety check for data
  if (!data || !data.propInformation) {
    console.warn('ModernTemplate: data or data.propInformation is null or undefined')
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
        return 'PlayfairDisplay'
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
      textAlign: TextAlign.Right,
    }
    const adjustedFontSize = getParagraphFontSize(14, getFontFamily(selectedFont))
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
  const description = customText?.description || ''

  return (
    <>
      <Rect x={0} y={0} width={screenWidth} height={screenWidth}>
        <LinearGradient
          start={vec(0, 0)}
          end={vec(0, screenWidth)}
          positions={[0, 0.9]}
          colors={[
            hexToRgba(canvas.primaryColor || '#fafafa', 0.4) || 'rgba(0, 0, 0, 0.3)',
            hexToRgba(canvas.primaryColor || '#fafafa', 0.4) || 'rgba(0, 0, 0, 0.5)',
          ]}
        />
      </Rect>

      <TemplateHeading
        screenWidth={screenWidth}
        text={mainHeading}
        x={screenWidth * 0}
        y={screenWidth * 0.1}
        fontFamily={getFontFamily(selectedFont)}
      />

      {subHeading && (
        <TemplateHeading
          screenWidth={screenWidth}
          text={subHeading}
          x={screenWidth * 0}
          y={screenWidth * 0.25}
          size={0.8}
          fontFamily={getFontFamily(selectedFont)}
        />
      )}

      <Circle
        cx={screenWidth * 0.01}
        cy={screenWidth * 0.95}
        r={screenWidth * 0.3}
        color={canvas.primaryColor || '#fafafa'}
      />
      <Rect
        x={0}
        y={screenWidth * 0.8}
        width={screenWidth}
        height={screenWidth * 0.2}
        color={canvas.primaryColor || '#fafafa'}
      />

      <Paragraph paragraph={paragraph} x={-screenWidth * 0.025} y={screenWidth * 0.85} width={screenWidth} />

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
