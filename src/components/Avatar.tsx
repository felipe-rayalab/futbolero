import Image from 'next/image'

type AvatarProps = {
  url?: string | null
  name?: string | null
  size?: number
  className?: string
}

const ALLOWED_DOMAINS = [
  'lh3.googleusercontent.com',
  'avatars.githubusercontent.com',
]

function isAllowedUrl(url: string): boolean {
  try {
    const { hostname, protocol } = new URL(url)
    return protocol === 'https:' && (
      ALLOWED_DOMAINS.includes(hostname) ||
      hostname.endsWith('.supabase.co')
    )
  } catch {
    return false
  }
}

export default function Avatar({ url, name, size = 36, className = '' }: AvatarProps) {
  const initial = (name ?? '?')[0].toUpperCase()
  const px = size

  if (url && isAllowedUrl(url)) {
    return (
      <Image
        src={url}
        alt={name ?? 'Avatar'}
        width={px}
        height={px}
        className={`rounded-full ring-2 ring-white/10 object-cover ${className}`}
      />
    )
  }

  return (
    <div
      style={{ width: px, height: px, minWidth: px, fontSize: Math.max(10, px * 0.4) }}
      className={`rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold ${className}`}
    >
      {initial}
    </div>
  )
}
