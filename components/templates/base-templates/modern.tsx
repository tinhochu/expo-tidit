import TemplateHeading from '@/components/template-parts/heading'
import Signature from '@/components/template-parts/signature'
import { getContrastColor, hexToRgba } from '@/helpers/colorUtils'
import {
  Group,
  Image,
  Paragraph,
  Rect,
  RoundedRect,
  Skia,
  TextAlign,
  useFonts,
  useImage,
} from '@shopify/react-native-skia'
import { LinearGradient, vec } from '@shopify/react-native-skia'
import { useMemo } from 'react'
import { useWindowDimensions } from 'react-native'

interface ModernTemplateProps {
  data: any
  postType: string
  template: string
  canvas: {
    primaryColor?: string
    secondaryColor?: string
    textColor?: string
    showPrice?: boolean
    priceText?: string
    showBrokerage?: boolean
    showRealtor?: boolean
    openHouseString?: string
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
  // Safety check for userPrefs and data
  if (!userPrefs || Object.keys(userPrefs).length === 0) {
    console.warn('ModernTemplate: userPrefs is null, undefined, or empty')
    return null
  }

  if (!data || !data.propInformation || !data.propInformation.description) {
    console.warn('ModernTemplate: data or data.propInformation is null or undefined')
    return null
  }

  const { width: screenWidth } = useWindowDimensions()

  // Only create image objects if we have valid URLs
  const hasBrokerageLogo = userPrefs?.brokerageLogo && userPrefs.brokerageLogo.trim() !== ''
  const hasRealtorPicture = userPrefs?.realtorPicture && userPrefs.realtorPicture.trim() !== ''

  const brokerageLogo = hasBrokerageLogo ? useImage(userPrefs.brokerageLogo) : null
  const realtorPicture = hasRealtorPicture ? useImage(userPrefs.realtorPicture) : null

  // Calculate brokerage logo dimensions and positioning
  const getBrokerageLogoDimensions = () => {
    if (!brokerageLogo) return null

    const imageWidth = brokerageLogo.width()
    const imageHeight = brokerageLogo.height()
    const aspectRatio = imageWidth / imageHeight

    // Determine if logo is square (aspect ratio close to 1) or rectangle
    const isSquare = Math.abs(aspectRatio - 1) < 0.2 // Allow 20% tolerance for "square"
    const isWideRectangle = aspectRatio > 1.5
    const isTallRectangle = aspectRatio < 0.7

    // Base dimensions - smaller than rectangle (0.2) to stay centered with margin
    const baseWidth = screenWidth * 0.17
    const baseHeight = screenWidth * 0.17

    // Adjust dimensions based on aspect ratio
    let logoWidth = baseWidth
    let logoHeight = baseHeight

    if (isWideRectangle) {
      // Wide rectangle: maintain width, reduce height
      logoHeight = baseHeight * 0.7
    } else if (isTallRectangle) {
      // Tall rectangle: maintain height, reduce width
      logoWidth = baseWidth * 0.7
    }

    return {
      width: logoWidth,
      height: logoHeight,
      aspectRatio,
      isSquare,
      isWideRectangle,
      isTallRectangle,
    }
  }

  const logoDimensions = getBrokerageLogoDimensions()

  // Calculate realtor picture dimensions and positioning
  const getRealtorPictureDimensions = () => {
    if (!realtorPicture) return null

    const imageWidth = realtorPicture.width()
    const imageHeight = realtorPicture.height()
    const aspectRatio = imageWidth / imageHeight

    // Determine if picture is square (aspect ratio close to 1) or rectangle
    const isSquare = Math.abs(aspectRatio - 1) < 0.2 // Allow 20% tolerance for "square"
    const isWideRectangle = aspectRatio > 1.5
    const isTallRectangle = aspectRatio < 0.7

    // Base dimensions - smaller than rectangle (0.2) to stay centered with margin
    const baseWidth = screenWidth * 0.35
    const baseHeight = screenWidth * 0.35

    // Adjust dimensions based on aspect ratio
    let pictureWidth = baseWidth
    let pictureHeight = baseHeight

    if (isWideRectangle) {
      // Wide rectangle: maintain width, reduce height
      pictureHeight = baseHeight * 0.7
    } else if (isTallRectangle) {
      // Tall rectangle: maintain height, reduce width
      pictureWidth = baseWidth * 0.7
    }

    return {
      width: pictureWidth,
      height: pictureHeight,
      aspectRatio,
      isSquare,
      isWideRectangle,
      isTallRectangle,
    }
  }

  const realtorPictureDimensions = getRealtorPictureDimensions()

  // Calculate optimal logo positioning centered at the edge/height
  const getOptimalLogoPosition = () => {
    if (!logoDimensions) return { x: screenWidth * 0.175, y: screenWidth * 1.1 }

    const { width: logoWidth, height: logoHeight } = logoDimensions

    // Rectangle dimensions
    const rectangleTopY = screenWidth * 1.05
    const rectangleBottomY = screenWidth * 1.35
    const rectangleHeight = rectangleBottomY - rectangleTopY
    const rectangleLeftX = screenWidth * 0.05 // Rectangle starts at 5% from left
    const rectangleRightX = screenWidth * 0.95 // Rectangle ends at 95% from left
    const rectangleWidth = rectangleRightX - rectangleLeftX

    // Center logo both vertically and horizontally within the rectangle
    const logoX = rectangleLeftX + (rectangleWidth - logoWidth) / 2
    const logoY = rectangleTopY + (rectangleHeight - logoHeight) / 2

    return {
      x: logoX,
      y: logoY,
    }
  }

  const logoPosition = getOptimalLogoPosition()
  const customFontMgr = useFonts({
    PlayfairDisplay: [require('@/assets/fonts/PlayfairDisplay-Regular.ttf')],
    Inter: [require('@/assets/fonts/Inter.ttf')],
    MontserratExtraBold: [require('@/assets/fonts/Montserrat-ExtraBold.ttf')],
    CormorantGaramond: [require('@/assets/fonts/CormorantGaramond.ttf')],
    PoppinsSemiBold: [require('@/assets/fonts/Poppins-SemiBold.ttf')],
    SpaceMono: [require('@/assets/fonts/SpaceMono-Regular.ttf')],
  })

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

  // Function to calculate icon positioning based on font size for vertical centering
  const getIconPositioning = (baseY: number, fontSize: number, groupTranslateY: number) => {
    const fontFamily = getFontFamily(selectedFont)
    const adjustedFontSize = getParagraphFontSize(fontSize, fontFamily)

    // Calculate the center point of the text and align the icon with it
    // Icon height is typically around 20-24px, so we center it with the text
    const iconHeight = 22 // Approximate icon height

    // Apply the group translation to the base Y position
    const adjustedBaseY = baseY + groupTranslateY
    const textCenterY = adjustedBaseY + adjustedFontSize / 2
    const iconCenterY = textCenterY - iconHeight / 2

    return {
      iconY: iconCenterY,
      textY: adjustedBaseY,
    }
  }

  const createParagraph = useMemo(() => {
    if (!customFontMgr) return null

    const baseParagraphStyle = {
      textAlign: TextAlign.Left,
    }

    const createTextParagraph = (text: string, fontSize: number = 14) => {
      const adjustedFontSize = getParagraphFontSize(fontSize, getFontFamily(selectedFont))
      const textStyle = {
        color: Skia.Color(canvas.textColor || canvas.primaryColor || '#000000'),
        fontFamilies: [getFontFamily(selectedFont)],
        fontSize: adjustedFontSize,
      }

      return Skia.ParagraphBuilder.Make(baseParagraphStyle, customFontMgr).pushStyle(textStyle).addText(text).build()
    }

    return createTextParagraph
  }, [customFontMgr, canvas.textColor, canvas.primaryColor, selectedFont])

  const paragraphs = useMemo(() => {
    if (!createParagraph) return {}

    return {
      sqft: createParagraph(
        data.propInformation.description.sqft
          ? `${data?.propInformation?.description?.sqft?.toLocaleString()} ${data?.propInformation?.description?.unitType === 'm2' ? 'm²' : 'SQFT'}`
          : 'N/A',
        20
      ),
      address: (() => {
        const adjustedFontSize = getParagraphFontSize(20, getFontFamily(selectedFont))
        const addressText = `${data.propInformation.line},\n ${data.propInformation.city}, ${data.propInformation.state}, ${data.propInformation.country || data.propInformation.postalCode}`
        const para = Skia.ParagraphBuilder.Make({ textAlign: TextAlign.Center }, customFontMgr!)
          .pushStyle({
            color: Skia.Color(canvas.textColor || canvas.primaryColor || '#000000'),
            fontFamilies: [getFontFamily(selectedFont)],
            fontSize: adjustedFontSize,
          })
          .addText(addressText)
          .build()
        return para
      })(),
      beds: createParagraph(`${data.propInformation.description.beds}BR`, 20),
      baths: createParagraph(`${data.propInformation.description.baths}BA`, 20),
      signature: createParagraph('Powered By', 10),
    }
  }, [createParagraph, customFontMgr, data.propInformation, canvas.textColor, canvas.primaryColor])

  if (!customFontMgr || !paragraphs.sqft || !paragraphs.beds || !paragraphs.baths) {
    return null
  }

  const primaryColor = canvas.primaryColor || '#fafafa'
  const secondaryColor = canvas.secondaryColor || '#ffffff'
  const textColor = canvas.textColor || canvas.primaryColor || '#000000'
  const gradientColors = [
    hexToRgba(primaryColor, 0.5) || 'rgba(0, 0, 0, 0.3)',
    hexToRgba(primaryColor, 0.5) || 'rgba(0, 0, 0, 0.2)',
  ]

  // Use custom text or fall back to post type
  const mainHeading = customText?.mainHeading || getPostTypeLabel(postType)
  const subHeading =
    customText?.subHeading || postType === 'OPEN_HOUSE'
      ? canvas.openHouseString
      : canvas.showPrice && canvas.priceText
        ? canvas.priceText
        : ''

  // Adjust positioning for beds, baths, sqft when property line is long
  const isLongPropertyLine = data.propInformation.line && data.propInformation.line.length > 20
  const bedsBathsSqftOffset = isLongPropertyLine ? screenWidth * 0 : screenWidth * 0.015

  return (
    <>
      <Rect x={0} y={0} width={screenWidth} height={screenWidth * 1.25}>
        <LinearGradient start={vec(0, 0)} end={vec(0, screenWidth)} positions={[0, 0.9]} colors={gradientColors} />
      </Rect>

      <Rect
        color={getContrastColor(primaryColor || '#fafafa')}
        x={screenWidth * 0.05}
        y={screenWidth * 0.1}
        width={screenWidth * 0.9}
        height={5}
      />

      <Rect
        color={getContrastColor(primaryColor || '#fafafa')}
        x={screenWidth * 0.05}
        y={screenWidth * 0.1}
        width={5}
        height={screenWidth * 1.25 * 0.85}
      />

      <Rect
        color={getContrastColor(primaryColor || '#fafafa')}
        x={screenWidth * 0.95}
        y={screenWidth * 0.1}
        width={5}
        height={screenWidth * 1.25 * 0.85}
      />

      <Rect
        color={getContrastColor(primaryColor || '#fafafa')}
        x={screenWidth * 0.05}
        y={screenWidth * 1.15}
        width={screenWidth * 0.91}
        height={5}
      />

      <TemplateHeading
        color={getContrastColor(primaryColor || '#fafafa')}
        screenWidth={screenWidth}
        text={mainHeading}
        x={screenWidth * 0}
        y={screenWidth * 0.3}
        fontFamily={getFontFamily(selectedFont)}
      />

      {subHeading && (
        <TemplateHeading
          color={getContrastColor(primaryColor || '#fafafa')}
          screenWidth={screenWidth}
          text={subHeading}
          x={screenWidth * 0}
          y={screenWidth * 0.55}
          size={postType === 'OPEN_HOUSE' ? 2 : 1.25}
          fontFamily={getFontFamily(selectedFont)}
        />
      )}

      {hasRealtorPicture && showRealtor && realtorPicture && realtorPictureDimensions && (
        <>
          <RoundedRect
            x={-screenWidth * 0.2}
            y={screenWidth * 1}
            width={screenWidth * 0.5}
            height={screenWidth * 0.5}
            r={30}
            color={secondaryColor}
          />
          <Image
            image={realtorPicture}
            fit="cover"
            x={-screenWidth * 0.05}
            y={screenWidth * 1.25 - realtorPictureDimensions.height}
            width={realtorPictureDimensions.width}
            height={realtorPictureDimensions.height}
          />
        </>
      )}

      {data.propInformation.description.beds &&
        (() => {
          return (
            <Group transform={[{ translateX: bedsBathsSqftOffset }, { translateY: -screenWidth * 0.01 }]}>
              <Paragraph paragraph={paragraphs.beds} x={screenWidth * 0.46} y={screenWidth * 1.07} width={100} />
            </Group>
          )
        })()}

      {data.propInformation.description.baths &&
        (() => {
          return (
            <Group transform={[{ translateX: bedsBathsSqftOffset * 8 }, { translateY: -screenWidth * 0.01 }]}>
              <Paragraph paragraph={paragraphs.baths} x={screenWidth * 0.46} y={screenWidth * 1.07} width={100} />
            </Group>
          )
        })()}

      {data.propInformation.description.sqft &&
        (() => {
          return (
            <Group transform={[{ translateX: bedsBathsSqftOffset * 15 }, { translateY: -screenWidth * 0.01 }]}>
              <Paragraph paragraph={paragraphs.sqft} x={screenWidth * 0.46} y={screenWidth * 1.07} width={100} />
            </Group>
          )
        })()}

      {hasBrokerageLogo && showBrokerage && brokerageLogo && logoDimensions && (
        <Image
          image={brokerageLogo}
          fit="contain"
          x={logoPosition.x}
          y={logoPosition.y}
          width={logoDimensions.width}
          height={logoDimensions.height}
        />
      )}

      <Paragraph paragraph={paragraphs.address} x={0} y={screenWidth * 0.8} width={screenWidth} />

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
    COMING_SOON: 'Coming Soon',
    PRICE_DROP: 'Price Drop',
  }
  return labels[postType] || postType
}
