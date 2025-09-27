import { Paragraph, Skia, TextAlign, useFonts } from '@shopify/react-native-skia'
import { useMemo } from 'react'

export default function TemplateHeading({
  screenWidth,
  text = 'Just Sold',
  x = 0,
  y = 0,
  size = 1,
  color = '#ffffff',
  fontFamily = 'PlayfairDisplay',
  fontWeight = 500,
  align = TextAlign.Center,
}: {
  screenWidth: number
  text: string
  x: number
  y: number
  size?: number
  color?: string
  fontFamily?:
    | 'PlayfairDisplay'
    | 'Inter'
    | 'MontserratExtraBold'
    | 'CormorantGaramond'
    | 'PoppinsSemiBold'
    | 'SpaceMono'
  fontWeight?: number
  align?: TextAlign
}) {
  const customFontMgr = useFonts({
    PlayfairDisplay: [require('@/assets/fonts/PlayfairDisplay-Regular.ttf')],
    Inter: [require('@/assets/fonts/Inter.ttf')],
    MontserratExtraBold: [require('@/assets/fonts/Montserrat-ExtraBold.ttf')],
    CormorantGaramond: [require('@/assets/fonts/CormorantGaramond.ttf')],
    PoppinsSemiBold: [require('@/assets/fonts/Poppins-SemiBold.ttf')],
    SpaceMono: [require('@/assets/fonts/SpaceMono-Regular.ttf')],
  })

  // Calculate dynamic size based on text length to prevent wrapping
  const getDynamicSize = (baseSize: number, text: string) => {
    const textLength = text.length

    // If text is more than 11 characters, reduce the size
    if (textLength > 11) {
      // Calculate reduction factor based on length
      // For every 3 characters over 11, reduce by 0.1
      const excessChars = textLength - 11
      const reductionFactor = Math.max(0.3, 1 - excessChars * 0.1)
      return baseSize * reductionFactor
    }

    return baseSize
  }

  // Font-specific size adjustments for optimal readability
  const getFontSize = (baseSize: number, font: string) => {
    const baseFontSize = 55 * baseSize

    let adjustedSize: number
    switch (font) {
      case 'PlayfairDisplay':
        adjustedSize = baseFontSize * 1.0 // Playfair is already well-balanced
        break
      case 'Inter':
        adjustedSize = baseFontSize * 1.25 // Inter is more compact, reduce slightly
        break
      case 'MontserratExtraBold':
        adjustedSize = baseFontSize * 1 // Montserrat ExtraBold is very bold, reduce more
        break
      case 'CormorantGaramond':
        adjustedSize = baseFontSize * 1.3 // Cormorant is elegant but can be small, increase
        break
      case 'PoppinsSemiBold':
        adjustedSize = baseFontSize * 1.125 // Poppins is balanced, slight reduction
        break
      case 'SpaceMono':
        adjustedSize = baseFontSize * 1 // SpaceMono is monospace and can be large, reduce more
        break
      default:
        adjustedSize = baseFontSize
    }

    // If the font is not PlayfairDisplay, decrease the font size by 5 points
    if (font !== 'PlayfairDisplay') {
      adjustedSize = Math.max(adjustedSize - 5, adjustedSize * 0.5) // Ensure font doesn't get too small
    }

    return adjustedSize
  }

  const CustomParagraph = useMemo(() => {
    // Are the font loaded already?
    if (!customFontMgr) return null

    const dynamicSize = getDynamicSize(size, text)
    const paragraphStyle = {
      textAlign: align,
    }
    const textStyle = {
      color: Skia.Color(color),
      fontFamilies: [fontFamily],
      fontSize: getFontSize(dynamicSize, fontFamily),
    }

    return Skia.ParagraphBuilder.Make(paragraphStyle, customFontMgr)
      .pushStyle(textStyle)
      .addText(text)
      .pushStyle({ ...textStyle, fontStyle: { weight: fontWeight } })
      .pop()
      .build()
  }, [customFontMgr, text, size, color, fontFamily, fontWeight])

  // Create shadow paragraph with dark color
  const ShadowParagraph = useMemo(() => {
    if (!customFontMgr) return null

    const dynamicSize = getDynamicSize(size, text)
    const paragraphStyle = {
      textAlign: align,
    }
    const textStyle = {
      color: Skia.Color(color === '#ffffff' ? '#000000' : '#ffffff'),
      fontFamilies: [fontFamily],
      fontSize: getFontSize(dynamicSize, fontFamily),
    }

    return Skia.ParagraphBuilder.Make(paragraphStyle, customFontMgr)
      .pushStyle(textStyle)
      .addText(text)
      .pushStyle({ ...textStyle, fontStyle: { weight: fontWeight } })
      .pop()
      .build()
  }, [customFontMgr, text, color, size, fontFamily, fontWeight])

  // If fonts aren't loaded yet, return null to prevent crashes
  if (!customFontMgr) {
    return null
  }

  return (
    <>
      {/* Shadow text */}
      {ShadowParagraph && <Paragraph paragraph={ShadowParagraph} width={screenWidth} x={x + 1} y={y + 2} />}

      {/* Main text */}
      {CustomParagraph && <Paragraph paragraph={CustomParagraph} width={screenWidth} x={x} y={y} />}
    </>
  )
}
