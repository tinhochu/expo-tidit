// components/TemplateRenderer.tsx
import { Text } from '@/components/ui/text'

import JustSoldTemplateOne from './templates/just-sold/templateOne'

interface TemplateRendererProps {
  postType: 'JUST_SOLD' | 'JUST_LISTED' | 'JUST_RENTED' | 'OPEN_HOUSE' | 'UNDER_CONTRACT' | 'BACK_ON_MARKET'
  data: any
  template: string
}

interface TemplateComponent {
  label: string
  value: string
  component: React.ComponentType<{ data: any }>
}

function getTemplates(postType: string): TemplateComponent[] | null {
  switch (postType) {
    case 'JUST_SOLD':
      return [
        {
          label: 'Template 1',
          value: '1',
          component: JustSoldTemplateOne,
        },
      ]
    default:
      return null
  }
}

function TemplateRenderer({ postType, template, data }: TemplateRendererProps) {
  const Template = getTemplates(postType)?.find((t) => t.value === template)?.component
  return Template ? <Template data={data} /> : null
}

export { TemplateRenderer, getTemplates }
