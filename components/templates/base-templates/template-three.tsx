import TemplateHeading from '@/components/template-parts/heading'
import Signature from '@/components/template-parts/signature'
import { getContrastColor, hexToRgba } from '@/helpers/colorUtils'
import {
  Circle,
  Group,
  Image,
  LinearGradient,
  Mask,
  Paragraph,
  Rect,
  RoundedRect,
  Skia,
  TextAlign,
  useFonts,
  useImage,
  vec,
} from '@shopify/react-native-skia'
import { useMemo } from 'react'
import { useWindowDimensions } from 'react-native'

interface TemplateThreeProps {
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

export default function TemplateThree({
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
}: TemplateThreeProps) {
  // Safety check for userPrefs and data
  if (!userPrefs || Object.keys(userPrefs).length === 0) {
    console.warn('TemplateThree: userPrefs is null, undefined, or empty')
    return null
  }

  if (!data || !data.propInformation || !data.propInformation.description) {
    console.warn('TemplateThree: data or data.propInformation is null or undefined')
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

  // Calculate optimal logo positioning above the heading
  const getOptimalLogoPosition = () => {
    if (!logoDimensions) return { x: screenWidth * 0.175, y: screenWidth * 0.75 }

    const { width: logoWidth, height: logoHeight } = logoDimensions

    // Position logo above the heading (which is at y={screenWidth * 0.9})
    // Leave some space between logo and heading
    const headingY = screenWidth * 0.99
    const logoSpacing = screenWidth * 0.05 // 5% spacing above heading
    const logoY = headingY - logoSpacing - logoHeight

    // Center logo horizontally
    const logoX = screenWidth * 0.05

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

    const createParagraphWithShadow = (text: string, fontSize: number = 14) => {
      const adjustedFontSize = getParagraphFontSize(fontSize, getFontFamily(selectedFont))
      const backgroundColor = canvas.primaryColor || '#000000'
      const shadowColor = getContrastColor(backgroundColor) === '#ffffff' ? '#000000' : '#ffffff'

      const baseStyle = {
        textAlign: TextAlign.Left,
      }

      // Shadow paragraph
      const shadowStyle = {
        color: Skia.Color(shadowColor),
        fontFamilies: [getFontFamily(selectedFont)],
        fontSize: adjustedFontSize,
      }

      // Main paragraph
      const textStyle = {
        color: Skia.Color(canvas.textColor || canvas.primaryColor || '#000000'),
        fontFamilies: [getFontFamily(selectedFont)],
        fontSize: adjustedFontSize,
      }

      return {
        shadow: Skia.ParagraphBuilder.Make(baseStyle, customFontMgr!).pushStyle(shadowStyle).addText(text).build(),
        main: Skia.ParagraphBuilder.Make(baseStyle, customFontMgr!).pushStyle(textStyle).addText(text).build(),
      }
    }

    return {
      sqft: createParagraphWithShadow(
        data.propInformation.description.sqft
          ? `${data?.propInformation?.description?.sqft?.toLocaleString()} ${data?.propInformation?.description?.unitType === 'm2' ? 'm²' : 'SQFT'}`
          : 'N/A',
        16
      ),
      address: (() => {
        const adjustedFontSize = getParagraphFontSize(16, getFontFamily(selectedFont))
        const addressText = `${data.propInformation.line}, ${data.propInformation.city}, ${data.propInformation.state}, ${data.propInformation.country || data.propInformation.postalCode}`
        const backgroundColor = canvas.primaryColor || '#000000'
        const shadowColor = getContrastColor(backgroundColor) === '#ffffff' ? '#000000' : '#ffffff'

        const shadowPara = Skia.ParagraphBuilder.Make({ textAlign: TextAlign.Center }, customFontMgr!)
          .pushStyle({
            color: Skia.Color(shadowColor),
            fontFamilies: [getFontFamily(selectedFont)],
            fontSize: adjustedFontSize,
          })
          .addText(addressText)
          .build()

        const mainPara = Skia.ParagraphBuilder.Make({ textAlign: TextAlign.Center }, customFontMgr!)
          .pushStyle({
            color: Skia.Color(canvas.textColor || canvas.primaryColor || '#000000'),
            fontFamilies: [getFontFamily(selectedFont)],
            fontSize: adjustedFontSize,
          })
          .addText(addressText)
          .build()

        return { shadow: shadowPara, main: mainPara }
      })(),
      beds: createParagraphWithShadow(`${data.propInformation.description.beds}BR`, 16),
      baths: createParagraphWithShadow(`${data.propInformation.description.baths}BA`, 16),
      signature: createParagraphWithShadow('Powered By', 10),
    }
  }, [createParagraph, customFontMgr, data.propInformation, canvas.textColor, canvas.primaryColor, selectedFont])

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

      <Circle cx={-screenWidth * 0.6} cy={-screenWidth * 1.6} r={screenWidth * 2} color={secondaryColor || '#ffffff'} />

      {hasRealtorPicture && showRealtor && realtorPicture && realtorPictureDimensions && (
        <Group transform={[{ translateX: -screenWidth * 0.25 }, { translateY: -screenWidth * 0.05 }]}>
          {/* Outer border circle with contrast color */}
          <Circle
            cx={screenWidth / 2}
            cy={realtorPictureDimensions.height / 2 + realtorPictureDimensions.height / 4}
            r={realtorPictureDimensions.width / 2 + 3}
            color={getContrastColor(secondaryColor || '#ffffff')}
          />
          {/* Background circle */}
          <Circle
            cx={screenWidth / 2}
            cy={realtorPictureDimensions.height / 2 + realtorPictureDimensions.height / 4}
            r={realtorPictureDimensions.width / 2}
            color={secondaryColor || '#ffffff'}
          />
          <Mask
            mask={
              <Group>
                <Circle
                  cx={screenWidth / 2}
                  cy={realtorPictureDimensions.height / 2 + realtorPictureDimensions.height / 4}
                  r={realtorPictureDimensions.width / 2}
                />
              </Group>
            }
          >
            <Image
              image={realtorPicture}
              fit="cover"
              x={(screenWidth - realtorPictureDimensions.width) / 2 - realtorPictureDimensions.width / 9}
              y={realtorPictureDimensions.height / 2 - realtorPictureDimensions.height / 4}
              width={realtorPictureDimensions.width * 1.1}
              height={realtorPictureDimensions.height * 1.1}
            />
          </Mask>
        </Group>
      )}

      <Circle
        cx={screenWidth * 0.19}
        cy={screenWidth * 2}
        r={screenWidth * 1.25}
        color={getContrastColor(secondaryColor || '#ffffff')}
      />

      <Circle cx={screenWidth * 0.2} cy={screenWidth * 2.05} r={screenWidth * 1.25} color={primaryColor} />

      <TemplateHeading
        color={getContrastColor(primaryColor || '#fafafa')}
        screenWidth={screenWidth}
        text={mainHeading}
        x={-screenWidth * 0.18}
        y={screenWidth * 0.9}
        size={0.85}
        fontFamily={getFontFamily(selectedFont)}
      />

      {subHeading && (
        <TemplateHeading
          color={getContrastColor(primaryColor || '#fafafa')}
          screenWidth={screenWidth}
          text={subHeading}
          x={-screenWidth * 0.19}
          y={screenWidth * 0.98}
          size={postType === 'OPEN_HOUSE' ? 1 : 0.8}
          fontFamily={getFontFamily(selectedFont)}
        />
      )}

      <Paragraph
        paragraph={paragraphs.address.shadow}
        x={-screenWidth * 0.125}
        y={screenWidth * 1.125 + 2}
        width={screenWidth}
      />

      <Paragraph
        paragraph={paragraphs.address.main}
        x={-screenWidth * 0.125}
        y={screenWidth * 1.125}
        width={screenWidth}
      />

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

      {data.propInformation.description.beds &&
        (() => {
          const posX = screenWidth * 0.05
          const posY = screenWidth * 1.19
          return (
            <Group transform={[{ translateX: bedsBathsSqftOffset }, { translateY: -screenWidth * 0.01 }]}>
              <Paragraph paragraph={paragraphs.beds.shadow} x={posX + 1} y={posY + 2} width={100} />
              <Paragraph paragraph={paragraphs.beds.main} x={posX} y={posY} width={100} />
            </Group>
          )
        })()}

      {data.propInformation.description.baths &&
        (() => {
          const posX = screenWidth * 0.05
          const posY = screenWidth * 1.19
          return (
            <Group transform={[{ translateX: bedsBathsSqftOffset * 8 }, { translateY: -screenWidth * 0.01 }]}>
              <Paragraph paragraph={paragraphs.baths.shadow} x={posX + 1} y={posY + 2} width={100} />
              <Paragraph paragraph={paragraphs.baths.main} x={posX} y={posY} width={100} />
            </Group>
          )
        })()}

      {data.propInformation.description.sqft &&
        (() => {
          const posX = screenWidth * 0.05
          const posY = screenWidth * 1.19
          return (
            <Group transform={[{ translateX: bedsBathsSqftOffset * 15 }, { translateY: -screenWidth * 0.01 }]}>
              <Paragraph paragraph={paragraphs.sqft.shadow} x={posX + 1} y={posY + 2} width={100} />
              <Paragraph paragraph={paragraphs.sqft.main} x={posX} y={posY} width={100} />
            </Group>
          )
        })()}

      {/* Tidit Signature - Only show if enabled */}
      {showSignature && (
        <Signature
          screenWidth={screenWidth}
          poweredBy={paragraphs.signature?.main || paragraphs.signature}
          primaryColor={primaryColor}
        />
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
