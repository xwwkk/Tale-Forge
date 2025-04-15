import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Story } from '@/types/story'
import { FiEye, FiHeart, FiMessageSquare } from 'react-icons/fi'
import cardStyles from '@/styles/card.module.css'
import styles from './StoryCard.module.css'

interface StoryCardProps {
  id: string
  title: string
  description: string
  coverImage: string
  author: {
    name?: string
    address: string
  }
  category: string
  stats?: {
    views?: number
    likes?: number
    comments?: number
    favorites?: number
  }
  isNFT?: boolean
  nftMinted?: number
  earnings?: number
  wordCount?: number
}

export function StoryCard({ 
  id, 
  title, 
  description, 
  coverImage, 
  author,
  category,
  stats = {},
  isNFT = false,
  nftMinted = 0,
  earnings = 0,
  wordCount = 0
}: StoryCardProps) {
  return (
    <Link 
      href={`/stories/${id}`}
      className="group block bg-white rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100"
    >
      <div className="relative h-56 w-full">
        <Image
          src={coverImage}
          alt={title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <span className="px-3 py-1 bg-blue-600/90 text-white text-xs font-medium rounded-full backdrop-blur-sm">
            {category}
          </span>
          {isNFT && (
            <span className="px-3 py-1 bg-purple-600/90 text-white text-xs font-medium rounded-full backdrop-blur-sm">
              NFT
            </span>
          )}
        </div>
      </div>
      
      <div className="p-5">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-2 line-clamp-1">
            {title}
          </h2>
          <p className="text-gray-600 text-sm line-clamp-2">
            {description || '暂无简介'}
          </p>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-500 text-white rounded-full flex items-center justify-center text-sm font-medium ring-2 ring-white shadow-sm">
            {(author.name || 'A')[0].toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">
              {author.name || author.address.slice(0, 6) + '...' + author.address.slice(-4) || '匿名作者'}
            </div>
            <div className="text-xs text-gray-500 font-mono">
              {author.address.slice(0, 6)}...{author.address.slice(-4)}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <div className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                {nftMinted} NFT
              </div>
              <div className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">
                {earnings.toFixed(4)} BNB
              </div>
            </div>
            <div className="text-xs text-gray-500">
              {isNFT ? '已铸造' : '未铸造'}
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-gray-600">
                <FiHeart className="w-4 h-4" />
                <span>{stats.likes || 0}</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-600">
                <FiMessageSquare className="w-4 h-4" />
                <span>{stats.comments || 0}</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-600">
                <FiEye className="w-4 h-4" />
                <span>{stats.favorites || 0}</span>
              </div>
            </div>
            <div className="text-gray-500">
              {wordCount.toLocaleString()} 字
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}