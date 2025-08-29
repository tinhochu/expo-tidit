import { bathIcon, bedIcon, sqftIcon } from '@/components/template-icons'
import TemplateHeading from '@/components/template-parts/heading'
import Signature from '@/components/template-parts/signature'
import { getContrastColor, hexToRgba } from '@/helpers/colorUtils'
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

interface ClassicTemplateProps {
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
}

export default function ClassicTemplate({
  data,
  postType,
  template,
  canvas,
  userPrefs,
  showBrokerage,
  showRealtor,
  showSignature,
  customText,
}: ClassicTemplateProps) {
  // Safety check for userPrefs and data
  if (!userPrefs || Object.keys(userPrefs).length === 0) {
    console.warn('ClassicTemplate: userPrefs is null, undefined, or empty')
    return null
  }

  if (!data || !data.propInformation || !data.propInformation.description) {
    console.warn('ClassicTemplate: data or data.propInformation is null or undefined')
    return null
  }

  const { width: screenWidth } = useWindowDimensions()

  // Only create image objects if we have valid URLs
  const hasBrokerageLogo = userPrefs?.brokerageLogo && userPrefs.brokerageLogo.trim() !== ''
  const hasRealtorPicture = userPrefs?.realtorPicture && userPrefs.realtorPicture.trim() !== ''

  const brokerageLogo = hasBrokerageLogo ? useImage(userPrefs.brokerageLogo) : null
  const realtorPicture = hasRealtorPicture ? useImage(userPrefs.realtorPicture) : null
  const customFontMgr = useFonts({
    PlayfairDisplay: [require('@/assets/fonts/PlayfairDisplay-Regular.ttf')],
  })

  const createParagraph = useMemo(() => {
    if (!customFontMgr) return null

    const baseParagraphStyle = {
      textAlign: TextAlign.Right,
    }

    const createTextParagraph = (text: string, fontSize: number = 14) => {
      const textStyle = {
        color: Skia.Color(getContrastColor(canvas.primaryColor || '#fafafa')),
        fontFamilies: ['PlayfairDisplay'],
        fontSize,
      }

      return Skia.ParagraphBuilder.Make(baseParagraphStyle, customFontMgr).pushStyle(textStyle).addText(text).build()
    }

    return createTextParagraph
  }, [customFontMgr, canvas.primaryColor])

  const paragraphs = useMemo(() => {
    if (!createParagraph) return {}

    return {
      sqft: createParagraph(
        data.propInformation.description.sqft
          ? `${data?.propInformation?.description?.sqft?.toLocaleString()} sqft`
          : 'N/A',
        15
      ),
      address: (() => {
        const para = Skia.ParagraphBuilder.Make({ textAlign: TextAlign.Right }, customFontMgr!)
          .pushStyle({
            color: Skia.Color(getContrastColor(canvas.primaryColor || '#fafafa')),
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
      signature: createParagraph('Powered By', 10),
    }
  }, [createParagraph, customFontMgr, data.propInformation, canvas.primaryColor])

  if (!customFontMgr || !paragraphs.sqft || !paragraphs.beds || !paragraphs.baths) {
    return null
  }

  const primaryColor = canvas.primaryColor || '#fafafa'
  const gradientColors = [
    hexToRgba(primaryColor, 0.4) || 'rgba(0, 0, 0, 0.3)',
    hexToRgba(primaryColor, 0.4) || 'rgba(0, 0, 0, 0.5)',
  ]

  // Use custom text or fall back to post type
  const mainHeading = customText?.mainHeading || getPostTypeLabel(postType)
  const subHeading = customText?.subHeading || (canvas.showPrice && canvas.priceText ? canvas.priceText : '')

  // Adjust positioning for beds, baths, sqft when property line is long
  const isLongPropertyLine = data.propInformation.line && data.propInformation.line.length > 20
  const bedsBathsSqftOffset = isLongPropertyLine ? screenWidth * 0 : screenWidth * 0.05

  return (
    <>
      <Rect x={0} y={0} width={screenWidth} height={screenWidth * 1.25}>
        <LinearGradient start={vec(0, 0)} end={vec(0, screenWidth)} positions={[0, 0.9]} colors={gradientColors} />
      </Rect>

      <TemplateHeading
        color={getContrastColor(primaryColor || '#fafafa')}
        screenWidth={screenWidth}
        text={mainHeading}
        x={screenWidth * 0}
        y={screenWidth * 0.15}
      />

      {subHeading && (
        <TemplateHeading
          color={getContrastColor(primaryColor || '#fafafa')}
          screenWidth={screenWidth}
          text={subHeading}
          x={screenWidth * 0}
          y={screenWidth * 0.325}
          size={1.25}
        />
      )}

      {hasRealtorPicture && showRealtor && (
        <Circle cx={screenWidth * 0.01} cy={screenWidth * 1.15} r={screenWidth * 0.3} color={primaryColor} />
      )}

      <Rect x={0} y={screenWidth * 1.05} width={screenWidth} height={screenWidth * 0.2} color={primaryColor} />

      {hasBrokerageLogo && showBrokerage && brokerageLogo && (
        <Image
          image={brokerageLogo}
          fit="contain"
          x={screenWidth * 0.175}
          y={screenWidth * 1.0}
          width={screenWidth * 0.27}
          height={screenWidth * 0.27}
        />
      )}

      {hasRealtorPicture && showRealtor && realtorPicture && (
        <Image
          image={realtorPicture}
          fit="contain"
          x={-screenWidth * 0.05}
          y={screenWidth * 0.9}
          width={screenWidth * 0.35}
          height={screenWidth * 0.35}
        />
      )}

      {data.propInformation.description.beds && (
        <Group transform={[{ translateX: bedsBathsSqftOffset }, { translateY: -screenWidth * 0.017 }]}>
          <ImageSVG
            svg={bedIcon(getContrastColor(primaryColor || '#fafafa'))}
            x={screenWidth * 0.4}
            y={screenWidth * 1.1}
          />
          <Paragraph paragraph={paragraphs.beds} x={screenWidth * 0.305} y={screenWidth * 1.09} width={100} />
        </Group>
      )}

      {data.propInformation.description.baths && (
        <Group transform={[{ translateX: bedsBathsSqftOffset }, { translateY: screenWidth * 0.03 }]}>
          <ImageSVG
            svg={bathIcon(getContrastColor(primaryColor || '#fafafa'))}
            x={screenWidth * 0.4}
            y={screenWidth * 1.1}
          />
          <Paragraph paragraph={paragraphs.baths} x={screenWidth * 0.315} y={screenWidth * 1.09} width={100} />
        </Group>
      )}

      {data.propInformation.description.sqft && (
        <Group transform={[{ translateX: bedsBathsSqftOffset }, { translateY: screenWidth * 0.08 }]}>
          <ImageSVG
            svg={sqftIcon(getContrastColor(primaryColor || '#fafafa'))}
            x={screenWidth * 0.4}
            y={screenWidth * 1.1}
          />
          <Paragraph paragraph={paragraphs.sqft} x={screenWidth * 0.36} y={screenWidth * 1.09} width={100} />
        </Group>
      )}

      <Paragraph paragraph={paragraphs.address} x={-screenWidth * 0.025} y={screenWidth * 1.075} width={screenWidth} />

      {/* Tidit Signature - Only show if enabled */}
      {showSignature && (
        <Signature screenWidth={screenWidth} poweredBy={paragraphs.signature} primaryColor={primaryColor} />
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
