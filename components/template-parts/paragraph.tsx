import { Canvas, Paragraph, Skia, TextAlign } from '@shopify/react-native-skia'
import { useMemo } from 'react'

const MyParagraph = () => {
  const paragraph = useMemo(() => {
    const paragraphStyle = {
      textAlign: TextAlign.Center,
    }
    const textStyle = {
      color: Skia.Color('black'),
      fontSize: 50,
    }
    return Skia.ParagraphBuilder.Make(paragraphStyle)
      .pushStyle(textStyle)
      .addText('Say Hello to ')
      .pushStyle({ ...textStyle, fontStyle: { weight: 500 } })
      .addText('Skia 🎨')
      .pop()
      .build()
  }, [])

  // Render the paragraph
  return <Paragraph paragraph={paragraph} x={0} y={0} width={300} />
}

export default MyParagraph
