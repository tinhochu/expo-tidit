import { Image } from '@/components/ui/image'

export default function ProfileImage({ profileIconId }: { profileIconId: number }) {
  return (
    <Image
      size="md"
      className="rounded"
      source={{
        uri: `https://opgg-static.akamaized.net/meta/images/profile_icons/profileIcon${profileIconId}.jpg?image=q_auto:good,f_webp,w_200`,
      }}
      alt="image"
    />
  )
}
