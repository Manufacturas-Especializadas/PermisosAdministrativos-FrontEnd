interface BrandLogoProps {
  size?: 'compact' | 'login' | 'sidebar'
}

export default function BrandLogo({ size = 'compact' }: BrandLogoProps) {
  const sizes = { compact: 'w-20', login: 'w-28 sm:w-32', sidebar: 'w-28' }

  return (
    <img
      src="/logomesa-1.png"
      alt="Manufacturas Especializadas"
      width={250}
      height={141}
      className={`h-auto max-w-full shrink-0 object-contain ${sizes[size]}`}
    />
  )
}
