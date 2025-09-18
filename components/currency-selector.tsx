import {
  Select,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicator,
  SelectDragIndicatorWrapper,
  SelectInput,
  SelectItem,
  SelectPortal,
  SelectScrollView,
  SelectTrigger,
} from '@/components/ui/select'
import AntDesign from '@expo/vector-icons/AntDesign'
import { useState } from 'react'
import { getSupportedCurrencies } from 'react-native-format-currency'

interface CurrencySelectorProps {
  onCurrencyChange?: (currency: string) => void
  defaultValue?: string
  isDisabled?: boolean
}

export default function CurrencySelector({
  onCurrencyChange,
  defaultValue = 'USD',
  isDisabled = false,
}: CurrencySelectorProps) {
  // State to track selected value
  const [selectedValue, setSelectedValue] = useState(defaultValue)

  // get all of the supported currency codes
  const allCurrencies: { code: string; name: string }[] = getSupportedCurrencies()

  // Define priority currencies to show first
  const priorityCurrencies = ['USD', 'CAD', 'GBP']

  // Sort currencies: priority currencies first, then alphabetical
  const currencyCodes = allCurrencies.sort((a, b) => {
    const aIsPriority = priorityCurrencies.includes(a.code)
    const bIsPriority = priorityCurrencies.includes(b.code)

    if (aIsPriority && !bIsPriority) return -1
    if (!aIsPriority && bIsPriority) return 1
    if (aIsPriority && bIsPriority) {
      return priorityCurrencies.indexOf(a.code) - priorityCurrencies.indexOf(b.code)
    }
    return a.name.localeCompare(b.name)
  })

  // Handle value change
  const handleValueChange = (value: string) => {
    setSelectedValue(value)
    onCurrencyChange?.(value)
  }

  return (
    <Select className="bg-white" onValueChange={handleValueChange} isDisabled={isDisabled}>
      <SelectTrigger>
        <SelectInput value={selectedValue} className="flex-1" />
        <AntDesign name="down" size={15} className="mr-3" />
      </SelectTrigger>
      <SelectPortal>
        <SelectBackdrop />
        <SelectContent className="max-h-[50%] pb-28">
          <SelectDragIndicatorWrapper>
            <SelectDragIndicator />
          </SelectDragIndicatorWrapper>
          <SelectScrollView>
            {currencyCodes?.map((currency: { code: string; name: string }) => (
              <SelectItem
                key={currency.code}
                label={`(${currency.code}) ${currency.code} ${currency.name}`}
                value={currency.code}
              />
            ))}
          </SelectScrollView>
        </SelectContent>
      </SelectPortal>
    </Select>
  )
}
