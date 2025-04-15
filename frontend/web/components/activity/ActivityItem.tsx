import Image from 'next/image'

export function ActivityItem() {
  return (
    <div className="flex items-center gap-4">
      <div className="relative w-10 h-10">
        <Image
          src="/user-avatar.jpg"
          alt="用户头像"
          fill
          className="rounded-full object-cover"
        />
      </div>
      <div className="flex-1">
        <p className="text-sm">
          <span className="font-semibold">用户名称</span>
          <span className="text-gray-500 mx-2">购买了NFT作品</span>
          <span className="font-semibold">《作品名称》</span>
        </p>
        <p className="text-xs text-gray-500">2分钟前</p>
      </div>
    </div>
  )
} 