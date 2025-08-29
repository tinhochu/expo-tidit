import { bathIcon, bedIcon, sqftIcon } from '@/components/template-icons'
import TemplateHeading from '@/components/template-parts/heading'
import Signature from '@/components/template-parts/signature'
import { hexToRgba } from '@/helpers/colorUtils'
import {
  Circle,
  Group,
  Image,
  ImageSVG,
  Paragraph,
  Rect,
  Skia,
  TextAlign,
  useFonts,
  useImage,
} from '@shopify/react-native-skia'
import { LinearGradient, vec } from '@shopify/react-native-skia'
import { useMemo } from 'react'
import { useWindowDimensions } from 'react-native'

// Define types for better type safety
interface PropertyDescription {
  sqft: string | number
  beds: string | number
  baths: string | number
}

interface PropertyInformation {
  line: string
  city: string
  state: string
  postalCode: string
  description: PropertyDescription
}

interface UserPrefs {
  brokerageLogo?: string
  realtorPicture?: string
}

interface Canvas {
  primaryColor?: string
  showPrice?: boolean
  priceText?: string
  showBrokerage?: boolean
  showRealtor?: boolean
  showAddress?: boolean
  showBeds?: boolean
  showBaths?: boolean
  showSqft?: boolean
}

interface Props {
  data: {
    propInformation: PropertyInformation
  }
  postType: string
  template: string
  canvas: Canvas
  userPrefs: UserPrefs
  showBrokerage: boolean
  showRealtor: boolean
}

export default function JustSoldTemplateOne({
  data,
  postType,
  template,
  canvas,
  userPrefs,
  showBrokerage,
  showRealtor,
}: Props) {
  const { width: screenWidth } = useWindowDimensions()
  // Always call useImage with valid URLs to prevent CoreUI errors and follow React hooks rules
  const brokerageLogo = useImage(userPrefs?.brokerageLogo || 'https://via.placeholder.com/1x1/00000000/00000000?text=')
  const realtorPicture = useImage(
    userPrefs?.realtorPicture || 'https://via.placeholder.com/1x1/00000000/00000000?text='
  )
  const customFontMgr = useFonts({
    PlayfairDisplay: [require('@/assets/fonts/PlayfairDisplay-Regular.ttf')],
  })

  // Consolidated paragraph creation function
  const createParagraph = useMemo(() => {
    if (!customFontMgr) return null

    const baseParagraphStyle = {
      textAlign: TextAlign.Right,
    }

    const createTextParagraph = (text: string, fontSize: number = 14) => {
      const textStyle = {
        color: Skia.Color('white'),
        fontFamilies: ['PlayfairDisplay'],
        fontSize,
      }

      return Skia.ParagraphBuilder.Make(baseParagraphStyle, customFontMgr).pushStyle(textStyle).addText(text).build()
    }

    return createTextParagraph
  }, [customFontMgr])

  // Create all paragraphs using the consolidated function
  const paragraphs = useMemo(() => {
    if (!createParagraph) return {}

    return {
      sqft: createParagraph(`${data.propInformation.description.sqft} sqft`, 15),
      address: (() => {
        const para = Skia.ParagraphBuilder.Make({ textAlign: TextAlign.Right }, customFontMgr!)
          .pushStyle({
            color: Skia.Color('white'),
            fontFamilies: ['PlayfairDisplay'],
            fontSize: 14,
          })
          .addText(`${data.propInformation.line}`)
          .addText(`\n${data.propInformation.city}, ${data.propInformation.state}`)
          .addText(`\n${data.propInformation.postalCode}`)
          .build()
        return para
      })(),
      beds: createParagraph(`${data.propInformation.description.beds} beds`),
      baths: createParagraph(`${data.propInformation.description.baths} baths`),
    }
  }, [createParagraph, customFontMgr, data.propInformation])

  // Early return if fonts aren't loaded
  if (!customFontMgr || !paragraphs.sqft || !paragraphs.beds || !paragraphs.baths) {
    return null
  }

  const primaryColor = canvas.primaryColor || '#fafafa'
  const gradientColors = [
    hexToRgba(primaryColor, 0.4) || 'rgba(0, 0, 0, 0.3)',
    hexToRgba(primaryColor, 0.4) || 'rgba(0, 0, 0, 0.5)',
  ]

  return (
    <>
      <Rect x={0} y={0} width={screenWidth} height={screenWidth * 1.25}>
        <LinearGradient start={vec(0, 0)} end={vec(0, screenWidth)} positions={[0, 0.9]} colors={gradientColors} />
      </Rect>

      <TemplateHeading
        screenWidth={screenWidth}
        text={postType === 'JUST_SOLD' ? 'Just Sold' : 'Just Listed'}
        x={screenWidth * 0}
        y={screenWidth * 0.15}
      />

      {canvas.showPrice && (
        <TemplateHeading
          screenWidth={screenWidth}
          text={canvas.priceText || ''}
          x={screenWidth * 0}
          y={screenWidth * 0.325}
          size={1.25}
        />
      )}

      <Circle cx={screenWidth * 0.01} cy={screenWidth * 1.15} r={screenWidth * 0.3} color={primaryColor} />
      <Rect x={0} y={screenWidth * 1.05} width={screenWidth} height={screenWidth * 0.2} color={primaryColor} />

      {userPrefs?.brokerageLogo && userPrefs.brokerageLogo.trim() !== '' && showBrokerage && (
        <Image
          image={brokerageLogo}
          fit="contain"
          x={screenWidth * 0.175}
          y={screenWidth * 1.0}
          width={screenWidth * 0.27}
          height={screenWidth * 0.27}
        />
      )}
      {userPrefs?.realtorPicture && userPrefs.realtorPicture.trim() !== '' && showRealtor && (
        <Image
          image={realtorPicture}
          fit="contain"
          x={-screenWidth * 0.05}
          y={screenWidth * 0.9}
          width={screenWidth * 0.35}
          height={screenWidth * 0.35}
        />
      )}

      <Group transform={[{ translateX: screenWidth * 0.05 }, { translateY: -screenWidth * 0.017 }]}>
        <ImageSVG svg={sqftIcon('#ffffff')} x={screenWidth * 0.4} y={screenWidth * 1.1} />
        <Paragraph paragraph={paragraphs.sqft} x={screenWidth * 0.34} y={screenWidth * 1.09} width={100} />
      </Group>

      <Group transform={[{ translateX: screenWidth * 0.05 }, { translateY: screenWidth * 0.03 }]}>
        <ImageSVG svg={bedIcon('#ffffff')} x={screenWidth * 0.4} y={screenWidth * 1.1} />
        <Paragraph paragraph={paragraphs.beds} x={screenWidth * 0.305} y={screenWidth * 1.09} width={100} />
      </Group>

      <Group transform={[{ translateX: screenWidth * 0.05 }, { translateY: screenWidth * 0.08 }]}>
        <ImageSVG svg={bathIcon('#ffffff')} x={screenWidth * 0.4} y={screenWidth * 1.1} />
        <Paragraph paragraph={paragraphs.baths} x={screenWidth * 0.315} y={screenWidth * 1.09} width={100} />
      </Group>

      <Paragraph paragraph={paragraphs.address} x={-screenWidth * 0.025} y={screenWidth * 1.075} width={screenWidth} />

      {/* Tidit Signature */}
      <Signature screenWidth={screenWidth} />
    </>
  )
}
