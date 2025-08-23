import { Paragraph, Skia, TextAlign, useFonts } from '@shopify/react-native-skia'
import { useMemo } from 'react'

export default function TemplateHeading({
  screenWidth,
  text = 'Just Sold',
  x = 0,
  y = 0,
  size = 1,
}: {
  screenWidth: number
  text: string
  x: number
  y: number
  size?: number
}) {
  const customFontMgr = useFonts({
    PlayfairDisplay: [require('@/assets/fonts/PlayfairDisplay-Regular.ttf')],
  })

  const CustomParagraph = useMemo(() => {
    // Are the font loaded already?
    if (!customFontMgr) return null

    const paragraphStyle = {
      textAlign: TextAlign.Center,
    }
    const textStyle = {
      color: Skia.Color('white'),
      fontFamilies: ['PlayfairDisplay'],
      fontSize: 55 * size,
    }

    return Skia.ParagraphBuilder.Make(paragraphStyle, customFontMgr)
      .pushStyle(textStyle)
      .addText(text)
      .pushStyle({ ...textStyle, fontStyle: { weight: 500 } })
      .pop()
      .build()
  }, [customFontMgr, text, size])

  // Create shadow paragraph with dark color
  const ShadowParagraph = useMemo(() => {
    if (!customFontMgr) return null

    const paragraphStyle = {
      textAlign: TextAlign.Center,
    }
    const textStyle = {
      color: Skia.Color('rgba(0, 0, 0, 0.5)'),
      fontFamilies: ['PlayfairDisplay'],
      fontSize: 55 * size,
    }

    return Skia.ParagraphBuilder.Make(paragraphStyle, customFontMgr)
      .pushStyle(textStyle)
      .addText(text)
      .pushStyle({ ...textStyle, fontStyle: { weight: 500 } })
      .pop()
      .build()
  }, [customFontMgr, text])

  return (
    <>
      {/* Shadow text */}
      {ShadowParagraph && <Paragraph paragraph={ShadowParagraph} width={screenWidth} x={x + 1} y={y + 2} />}
      {/* Main text */}
      {CustomParagraph && <Paragraph paragraph={CustomParagraph} width={screenWidth} x={x} y={y} />}
    </>
  )
}
