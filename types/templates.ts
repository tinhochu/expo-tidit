// types/template.ts
export type Template = {
  id: string
  name: string
  size: { width: number; height: number } // e.g. 1080x1350 base
  layers: Array<
    | {
        type: 'image'
        role: 'background' | 'logo' | 'headshot'
        src?: string
        x: number
        y: number
        w: number
        h: number
        fit?: 'cover' | 'contain'
        radius?: number
      }
    | { type: 'rect'; x: number; y: number; w: number; h: number; color: string; opacity?: number; radius?: number }
    | {
        type: 'gradient'
        x: number
        y: number
        w: number
        h: number
        from: string
        to: string
        direction?: 'vertical' | 'horizontal'
        opacity?: number
      }
    | {
        type: 'ribbon'
        text: string
        x: number
        y: number
        w: number
        h: number
        color: string
        textColor: string
        angle?: number
      }
    | {
        type: 'text'
        text: string
        x: number
        y: number
        maxW?: number
        align?: 'left' | 'center' | 'right'
        font: 'BrandBold' | 'BrandRegular'
        size: number
        color: string
        uppercase?: boolean
      }
  >
}
