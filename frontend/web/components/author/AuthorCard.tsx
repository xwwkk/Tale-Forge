import Image from 'next/image'
import Link from 'next/link'

export function AuthorCard() {
  return (
    <Link href="/author/profile" className="block group">
      <div className="text-center">
        <div className="relative w-24 h-24 mx-auto mb-3">
          <Image
            src="/author-avatar.jpg"
            alt="作者头像"
            fill
            className="object-cover rounded-full"
          />
        </div>
        <h3 className="font-semibold group-hover:text-blue-600">作者名称</h3>
        <p className="text-sm text-gray-500">100k 读者</p>
      </div>
    </Link>
  )
} 