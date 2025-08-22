import JustListedTemplateOne from './templates/just-listed/templateOne'
import JustSoldTemplateOne from './templates/just-sold/templateOne'

interface TemplateRendererProps {
  postType: 'JUST_SOLD' | 'JUST_LISTED' | 'JUST_RENTED' | 'OPEN_HOUSE' | 'UNDER_CONTRACT' | 'BACK_ON_MARKET' | 'LOADING'
  data: any
  template: string
  canvas: any
  userPrefs: any
  showBrokerage: boolean
  showRealtor: boolean
}

interface TemplateComponent {
  label: string
  value: string
  component: React.ComponentType<{
    data: any
    postType: string
    template: string
    canvas: any
    userPrefs: any
    showBrokerage: boolean
    showRealtor: boolean
  }>
}

function getTemplates(postType: string): TemplateComponent[] {
  switch (postType) {
    case 'JUST_SOLD':
      return [
        {
          label: 'Template 1',
          value: '1',
          component: JustSoldTemplateOne,
        },
      ]
    case 'JUST_LISTED':
      return [
        {
          label: 'Template 1',
          value: '1',
          component: JustListedTemplateOne,
        },
      ]
    case 'JUST_RENTED':
      return [
        {
          label: 'Template 1',
          value: '1',
          component: JustListedTemplateOne, // Using JustSoldTemplateOne as fallback for now
        },
      ]
    case 'OPEN_HOUSE':
      return [
        {
          label: 'Template 1',
          value: '1',
          component: JustListedTemplateOne, // Using JustSoldTemplateOne as fallback for now
        },
      ]
    case 'UNDER_CONTRACT':
      return [
        {
          label: 'Template 1',
          value: '1',
          component: JustSoldTemplateOne, // Using JustSoldTemplateOne as fallback for now
        },
      ]
    case 'BACK_ON_MARKET':
      return [
        {
          label: 'Template 1',
          value: '1',
          component: JustSoldTemplateOne, // Using JustSoldTemplateOne as fallback for now
        },
      ]
    case 'LOADING':
      return []
    default:
      return []
  }
}

function TemplateRenderer({
  postType,
  template,
  data,
  canvas,
  userPrefs,
  showBrokerage,
  showRealtor,
}: TemplateRendererProps) {
  const Template = getTemplates(postType)?.find((t) => t.value === template)?.component
  return Template ? (
    <Template
      data={data}
      postType={postType}
      template={template}
      canvas={canvas}
      userPrefs={userPrefs}
      showBrokerage={showBrokerage}
      showRealtor={showRealtor}
    />
  ) : null
}

export { TemplateRenderer, getTemplates }
