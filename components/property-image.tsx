import { Image } from '@/components/ui/image'

export default function PropertyImage({
  imageUrl,
  alt = 'Property Image',
  className,
}: {
  imageUrl: string
  alt?: string
  className?: string
}) {
  // We need to add some replacement to the image before the .jpg
  const imageUrlWithReplacement = imageUrl.replace('.jpg', '-w640_h520.jpg')

  return <Image source={{ uri: imageUrlWithReplacement }} className={className} alt={alt} />
}
