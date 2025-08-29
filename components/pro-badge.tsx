import { Badge, BadgeText } from '@/components/ui/badge'

export default function ProBadge() {
  return (
    <Badge size="sm" action="info" className="border px-1 py-0">
      <BadgeText className="font-bold">Pro</BadgeText>
    </Badge>
  )
}
