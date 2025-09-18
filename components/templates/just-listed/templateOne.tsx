import TemplateHeading from '@/components/template-parts/heading'
import Signature from '@/components/template-parts/signature'
import { hexToRgba } from '@/helpers/colorUtils'
import { Circle, Paragraph, Rect, Skia, TextAlign, useFonts } from '@shopify/react-native-skia'
import { LinearGradient, vec } from '@shopify/react-native-skia'
import { useMemo } from 'react'
import { useWindowDimensions } from 'react-native'

export default function JustListedTemplateOne({
  data,
  postType,
  template,
  canvas,
  showBrokerage,
  showRealtor,
}: {
  data: any
  postType: string
  template: string
  canvas: any
  showBrokerage: boolean
  showRealtor: boolean
}) {
  // Safety check for data
  if (!data || !data.propInformation) {
    console.warn('JustListedTemplateOne: data or data.propInformation is null or undefined')
    return null
  }

  const { width: screenWidth } = useWindowDimensions()
  const customFontMgr = useFonts({
    PlayfairDisplay: [require('@/assets/fonts/PlayfairDisplay-Regular.ttf')],
  })

  const paragraph = useMemo(() => {
    if (!customFontMgr) return null

    const paragraphStyle = {
      textAlign: TextAlign.Right,
    }
    const textStyle = {
      color: Skia.Color('white'),
      fontFamilies: ['PlayfairDisplay'],
      fontSize: 14,
    }

    const para = Skia.ParagraphBuilder.Make(paragraphStyle, customFontMgr)
      .pushStyle(textStyle)
      .addText(`${data.propInformation.line}`)
      .addText(`\n${data.propInformation.city}, ${data.propInformation.state}`)
      .addText(`\n${data.propInformation.country || data.propInformation.postalCode}`)
      .build()

    return para
  }, [customFontMgr])

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
        text={postType === 'JUST_LISTED' ? 'Just Listed' : 'Just Sold'}
        x={screenWidth * 0}
        y={screenWidth * 0.1}
      />

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

      {/* Tidit Signature */}
      <Signature screenWidth={screenWidth} y={screenWidth * 0.95} />
    </>
  )
}
