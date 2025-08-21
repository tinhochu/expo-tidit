// components/TemplateRenderer.tsx
import { fillTokens } from '@/lib/tokens'
import type { Template } from '@/types/templates'
import {
  Canvas,
  Circle,
  Group,
  LinearGradient,
  Rect,
  Image as SkImage,
  Text as SkText,
  useFont,
  useImage,
  vec,
} from '@shopify/react-native-skia'
import React from 'react'
import { View } from 'react-native'

type Props = {
  template: Template
  data: Record<string, string>
  assets: { background: string; logo?: string; headshot?: string }
  // scale controls export size; render at 2x for crispness then downscale
  scale?: number
}

export default function TemplateRenderer({ template, data, assets, scale = 2 }: Props) {
  //   const W = template.size.width * scale
  //   const H = template.size.height * scale

  //   const bg = useImage(assets.background)
  //   const logo = useImage(assets.logo || '')
  //   const head = useImage(assets.headshot || '')

  //   // Load fonts (use system fonts)
  //   const brandBold = useFont(
  //     require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/AntDesign.ttf'),
  //     48 * scale
  //   )
  //   const brandRegular = useFont(
  //     require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/AntDesign.ttf'),
  //     32 * scale
  //   )

  //   const ready = !!bg && !!brandBold && !!brandRegular

  //   const mapFont = (name: string) => (name === 'BrandBold' ? brandBold! : brandRegular!)

  //   // helper: draw image cover/contain
  //   function drawImageProps(img: any, x: number, y: number, w: number, h: number, fit: 'cover' | 'contain' = 'cover') {
  //     if (!img)
  //       return {
  //         sx: 0,
  //         sy: 0,
  //         sw: img?.width ?? 0,
  //         sh: img?.height ?? 0,
  //         dx: x * scale,
  //         dy: y * scale,
  //         dw: w * scale,
  //         dh: h * scale,
  //       }
  //     const iw = img.width,
  //       ih = img.height
  //     const targetAR = w / h
  //     const imgAR = iw / ih
  //     if (fit === 'cover') {
  //       if (imgAR > targetAR) {
  //         const sh = ih
  //         const sw = ih * targetAR
  //         const sx = (iw - sw) / 2
  //         return { sx, sy: 0, sw, sh, dx: x * scale, dy: y * scale, dw: w * scale, dh: h * scale }
  //       } else {
  //         const sw = iw
  //         const sh = iw / targetAR
  //         const sy = (ih - sh) / 2
  //         return { sx: 0, sy, sw, sh, dx: x * scale, dy: y * scale, dw: w * scale, dh: h * scale }
  //       }
  //     } else {
  //       return { sx: 0, sy: 0, sw: iw, sh: ih, dx: x * scale, dy: y * scale, dw: w * scale, dh: h * scale }
  //     }
  //   }

  //   if (!ready) return <View style={{ width: W, height: H, backgroundColor: '#eee', borderRadius: 12 }} />

  //   return (
  //     <Canvas style={{ width: W, height: H }}>
  //       {template.layers.map((layer, i) => {
  //         if (layer.type === 'image') {
  //           const img = layer.role === 'background' ? bg : layer.role === 'logo' ? logo : head
  //           if (!img) return null
  //           const { sx, sy, sw, sh, dx, dy, dw, dh } = drawImageProps(img, layer.x, layer.y, layer.w, layer.h, layer.fit)
  //           return (
  //             <Group key={i} clip={{ r: layer.radius ? layer.radius * scale : 0 }}>
  //               <SkImage image={img} sx={sx} sy={sy} sw={sw} sh={sh} x={dx} y={dy} width={dw} height={dh} />
  //             </Group>
  //           )
  //         }

  //         if (layer.type === 'rect') {
  //           return (
  //             <Rect
  //               key={i}
  //               x={layer.x * scale}
  //               y={layer.y * scale}
  //               width={layer.w * scale}
  //               height={layer.h * scale}
  //               color={layer.color}
  //               opacity={layer.opacity ?? 1}
  //               r={layer.radius ? layer.radius * scale : 0}
  //             />
  //           )
  //         }

  //         if (layer.type === 'gradient') {
  //           const from =
  //             layer.direction === 'horizontal'
  //               ? vec(layer.x * scale, layer.y * scale)
  //               : vec(layer.x * scale, layer.y * scale)
  //           const to =
  //             layer.direction === 'horizontal'
  //               ? vec((layer.x + layer.w) * scale, layer.y * scale)
  //               : vec(layer.x * scale, (layer.y + layer.h) * scale)
  //           return (
  //             <Rect
  //               key={i}
  //               x={layer.x * scale}
  //               y={layer.y * scale}
  //               width={layer.w * scale}
  //               height={layer.h * scale}
  //               opacity={layer.opacity ?? 1}
  //             >
  //               <LinearGradient start={from} end={to} colors={[layer.from, layer.to]} />
  //             </Rect>
  //           )
  //         }

  //         if (layer.type === 'ribbon') {
  //           // simple rotated rect w/ text
  //           const angle = ((layer.angle ?? 0) * Math.PI) / 180
  //           const cx = (layer.x + layer.w / 2) * scale
  //           const cy = (layer.y + layer.h / 2) * scale
  //           const text = layer.text
  //           return (
  //             <Group
  //               key={i}
  //               transform={[
  //                 { translateX: cx },
  //                 { translateY: cy },
  //                 { rotate: angle },
  //                 { translateX: -cx },
  //                 { translateY: -cy },
  //               ]}
  //             >
  //               <Rect
  //                 x={layer.x * scale}
  //                 y={layer.y * scale}
  //                 width={layer.w * scale}
  //                 height={layer.h * scale}
  //                 color={layer.color}
  //                 r={16 * scale}
  //               />
  //               <SkText
  //                 text={text}
  //                 x={(layer.x + 24) * scale}
  //                 y={(layer.y + layer.h / 2 + 14) * scale}
  //                 font={brandBold!}
  //                 color={layer.textColor}
  //               />
  //             </Group>
  //           )
  //         }

  //         if (layer.type === 'text') {
  //           const txt = fillTokens(layer.text, data)
  //           const font = mapFont(layer.font)
  //           let x = layer.x * scale
  //           const y = layer.y * scale
  //           // simplistic alignment
  //           if (layer.align === 'center' && layer.maxW) {
  //             x = (layer.x + layer.maxW / 2) * scale
  //           }
  //           return (
  //             <SkText
  //               key={i}
  //               text={layer.uppercase ? txt.toUpperCase() : txt}
  //               x={x}
  //               y={y}
  //               color={layer.color}
  //               font={font}
  //               align={layer.align ?? 'left'}
  //             />
  //           )
  //         }

  //         return null
  //       })}
  //     </Canvas>
  //   )

  return (
    <Canvas style={{ width: 100, height: 100 }}>
      <Circle cx={50} cy={50} r={40} color="hotpink" />
    </Canvas>
  )
}
