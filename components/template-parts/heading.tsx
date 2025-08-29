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
}) {
  const customFontMgr = useFonts({
    PlayfairDisplay: [require('@/assets/fonts/PlayfairDisplay-Regular.ttf')],
    Inter: [require('@/assets/fonts/Inter.ttf')],
    MontserratExtraBold: [require('@/assets/fonts/Montserrat-ExtraBold.ttf')],
    CormorantGaramond: [require('@/assets/fonts/CormorantGaramond.ttf')],
    PoppinsSemiBold: [require('@/assets/fonts/Poppins-SemiBold.ttf')],
    SpaceMono: [require('@/assets/fonts/SpaceMono-Regular.ttf')],
  })

  // Font-specific size adjustments for optimal readability
  const getFontSize = (baseSize: number, font: string) => {
    const baseFontSize = 55 * baseSize

    switch (font) {
      case 'PlayfairDisplay':
        return baseFontSize * 1.0 // Playfair is already well-balanced
      case 'Inter':
        return baseFontSize * 1.25 // Inter is more compact, reduce slightly
      case 'MontserratExtraBold':
        return baseFontSize * 1 // Montserrat ExtraBold is very bold, reduce more
      case 'CormorantGaramond':
        return baseFontSize * 1.3 // Cormorant is elegant but can be small, increase
      case 'PoppinsSemiBold':
        return baseFontSize * 1.125 // Poppins is balanced, slight reduction
      case 'SpaceMono':
        return baseFontSize * 1 // SpaceMono is monospace and can be large, reduce more
      default:
        return baseFontSize
    }
  }

  const CustomParagraph = useMemo(() => {
    // Are the font loaded already?
    if (!customFontMgr) return null

    const paragraphStyle = {
      textAlign: TextAlign.Center,
    }
    const textStyle = {
      color: Skia.Color(color),
      fontFamilies: [fontFamily],
      fontSize: getFontSize(size, fontFamily),
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

    const paragraphStyle = {
      textAlign: TextAlign.Center,
    }
    const textStyle = {
      color: Skia.Color(color === '#ffffff' ? '#000000' : '#ffffff'),
      fontFamilies: [fontFamily],
      fontSize: getFontSize(size, fontFamily),
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
