import { FormControl, FormControlLabel, FormControlLabelText } from '@/components/ui/form-control'
import { HStack } from '@/components/ui/hstack'
import {
  Select,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicator,
  SelectDragIndicatorWrapper,
  SelectInput,
  SelectItem,
  SelectPortal,
  SelectTrigger,
} from '@/components/ui/select'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import AntDesign from '@expo/vector-icons/AntDesign'
import React from 'react'

export interface FontOption {
  value: string
  label: string
  fontFamily: string
  preview: string
}

const fontOptions: FontOption[] = [
  {
    value: 'playfair',
    label: 'Playfair Display',
    fontFamily: 'PlayfairDisplay-Regular',
    preview: 'Elegant & Sophisticated',
  },
  {
    value: 'inter',
    label: 'Inter',
    fontFamily: 'Inter',
    preview: 'Clean & Modern',
  },
  {
    value: 'poppins',
    label: 'Poppins',
    fontFamily: 'Poppins-SemiBold',
    preview: 'Friendly & Approachable',
  },

  {
    value: 'cormorant',
    label: 'Cormorant Garamond',
    fontFamily: 'CormorantGaramond',
    preview: 'Classic & Refined',
  },
  {
    value: 'montserrat',
    label: 'Montserrat',
    fontFamily: 'Montserrat-ExtraBold',
    preview: 'Bold & Contemporary',
  },
  {
    value: 'spacemono',
    label: 'Space Mono',
    fontFamily: 'SpaceMono-Regular',
    preview: 'Modern & Technical',
  },
]

interface FontManagerProps {
  selectedFont: string
  onFontChange: (font: string) => void
  isPremium?: boolean
  onUpgradeClick?: () => void
}

export default function FontManager({
  selectedFont,
  onFontChange,
  isPremium = true,
  onUpgradeClick,
}: FontManagerProps) {
  const currentFont = fontOptions.find((font) => font.value === selectedFont) || fontOptions[0]

  const handleFontChange = (font: string) => onFontChange(font)

  return (
    <VStack space="md" className="w-full">
      <FormControl>
        <FormControlLabel>
          <FormControlLabelText className="font-bold">Select a Font</FormControlLabelText>
        </FormControlLabel>

        <Select selectedValue={selectedFont} onValueChange={handleFontChange} className="bg-white">
          <SelectTrigger className="w-full">
            <SelectInput placeholder="Select font style" className="flex-1" />

            <AntDesign name="down" size={15} className="mr-3" />
          </SelectTrigger>
          <SelectPortal>
            <SelectBackdrop />
            <SelectContent>
              <SelectDragIndicatorWrapper>
                <SelectDragIndicator />
              </SelectDragIndicatorWrapper>
              {fontOptions.map((font) => (
                <SelectItem key={font.value} value={font.value} label={font.label}>
                  <HStack space="sm" className="items-center">
                    <Text className="text-lg" style={{ fontFamily: font.fontFamily }}>
                      {font.label}
                    </Text>
                    <Text className="ml-2 text-sm text-gray-500">{font.preview}</Text>
                  </HStack>
                </SelectItem>
              ))}
            </SelectContent>
          </SelectPortal>
        </Select>
      </FormControl>
    </VStack>
  )
}
