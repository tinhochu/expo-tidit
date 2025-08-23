import { Badge, BadgeText } from '@/components/ui/badge'

const statusMap = {
  JUST_LISTED: 'Just Listed',
  JUST_SOLD: 'Just Sold',
  JUST_RENTED: 'Just Rented',
  JUST_OFFERED: 'Just Offered',
  BACK_ON_MARKET: 'Back on Market',
  OPEN_HOUSE: 'Open House',
  UNDER_CONTRACT: 'Under Contract',
}

export default function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" action="success">
      <BadgeText className="font-semibold text-success-600">{statusMap[status as keyof typeof statusMap]}</BadgeText>
    </Badge>
  )
}
