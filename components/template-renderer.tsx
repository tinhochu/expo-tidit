import { BoldTemplate, ClassicTemplate, ElegantTemplate, ModernTemplate } from './templates/base-templates'

interface TemplateRendererProps {
  postType:
    | 'JUST_SOLD'
    | 'JUST_LISTED'
    | 'JUST_RENTED'
    | 'OPEN_HOUSE'
    | 'UNDER_CONTRACT'
    | 'BACK_ON_MARKET'
    | 'COMING_SOON'
    | 'PRICE_DROP'
    | 'LOADING'
  data: any
  template: string
  canvas: any
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

interface TemplateComponent {
  label: string
  value: string
  component: React.ComponentType<{
    data: any
    postType: string
    template: string
    canvas: any
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
  }>
}

function getTemplates(): TemplateComponent[] {
  return [
    {
      label: 'Classic',
      value: 'classic',
      component: ClassicTemplate,
    },
    // {
    //   label: 'Modern',
    //   value: 'modern',
    //   component: ModernTemplate,
    // },
    // {
    //   label: 'Bold',
    //   value: 'bold',
    //   component: BoldTemplate,
    // },
    // {
    //   label: 'Elegant',
    //   value: 'elegant',
    //   component: ElegantTemplate,
    // },
  ]
}

function TemplateRenderer({
  postType,
  template,
  data,
  canvas,
  userPrefs,
  showBrokerage,
  showRealtor,
  showSignature,
  customText,
  selectedFont,
}: TemplateRendererProps) {
  const Template = getTemplates()?.find((t) => t.value === template)?.component
  return Template ? (
    <Template
      data={data}
      postType={postType}
      template={template}
      canvas={canvas}
      userPrefs={userPrefs}
      showBrokerage={showBrokerage}
      showRealtor={showRealtor}
      showSignature={showSignature}
      customText={customText}
      selectedFont={selectedFont}
    />
  ) : null
}

export { TemplateRenderer, getTemplates }
