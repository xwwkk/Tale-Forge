import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import styles from './RankingItem.module.css'

interface RankingItemProps {
  id: number
  rank: number
  title: string
  author: string
  reads: number
  isNFT: boolean
  tokenId: string
  floorPrice: number
  totalEarnings: number
  miningRewards: number
  coverImage?: string
}

export function RankingItem({
  id,
  rank,
  title,
  author,
  reads,
  isNFT,
  tokenId,
  floorPrice,
  totalEarnings,
  miningRewards,
  coverImage
}: RankingItemProps) {
  return (
    <Link href={`/stories/${id}`} className="group block bg-white rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100">
      <div className="relative h-52">
        <Image
          src={coverImage || '/images/default-story-cover.png'}
          alt={title}
          fill
          className="object-cover transform group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3">
          <span className="px-3 py-1 text-xs font-medium bg-white/90 text-gray-700 rounded-full">
            #{rank}
          </span>
        </div>
        {isNFT && (
          <div className="absolute top-3 right-3">
            <span className="px-3 py-1 text-xs font-medium bg-blue-500 text-white rounded-full shadow-sm">
              NFT #{tokenId}
            </span>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
          {title}
        </h3>
        <div className="flex items-center text-sm text-gray-600 mb-3">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          {author}
        </div>
        
        <div className="flex justify-between items-center text-sm text-gray-500 border-t border-gray-100 pt-3">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center">
              <svg className="w-4 h-4 mr-1 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
              </svg>
              {totalEarnings.toFixed(2)} BNB
            </span>
            <span className="inline-flex items-center">
              <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
              </svg>
              {miningRewards.toFixed(2)} BNB
            </span>
          </div>
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {reads.toLocaleString()}
          </div>
        </div>
      </div>
    </Link>
  )
}