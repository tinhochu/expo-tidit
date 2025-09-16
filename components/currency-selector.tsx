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
import AntDesign from '@expo/vector-icons/AntDesign'
import { getSupportedCurrencies } from 'react-native-format-currency'

export default function CurrencySelector() {
  // get all of the supported currency codes
  const currencyCodes: { code: string; name: string }[] = getSupportedCurrencies()

  return (
    <Select className="bg-white" onValueChange={(value) => console.log(value)}>
      <SelectTrigger>
        <SelectInput value={currencyCodes[0].code} className="flex-1" />
        <AntDesign name="down" size={15} className="mr-3" />
      </SelectTrigger>
      <SelectPortal>
        <SelectBackdrop />
        <SelectContent className="pb-28">
          <SelectDragIndicatorWrapper>
            <SelectDragIndicator />
          </SelectDragIndicatorWrapper>
          {currencyCodes?.map((currency: { code: string; name: string }) => (
            <SelectItem key={currency.code} label={currency.name} value={currency.code} />
          ))}
        </SelectContent>
      </SelectPortal>
    </Select>
  )
}
