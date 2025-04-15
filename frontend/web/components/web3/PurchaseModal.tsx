import React from 'react'
import Image from 'next/image'
import { FaEthereum } from 'react-icons/fa'

interface PurchaseModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  image: string
  price: string
  isPending: boolean
}

export function PurchaseModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  image,
  price,
  isPending
}: PurchaseModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 对话框内容 */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          确认购买
        </h3>
        
        <div className="flex items-start gap-4 mb-6">
          <div className="relative w-24 h-24 flex-shrink-0">
            <Image
              src={image}
              alt={title}
              fill
              className="object-cover rounded-lg"
            />
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              {title}
            </h4>
            <div className="flex items-center text-lg font-semibold text-purple-600 dark:text-purple-400">
              <FaEthereum className="w-5 h-5 mr-1" />
              {price} BNB
            </div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-6">
          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            交易详情
          </h5>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">商品价格</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {price} BNB
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Gas费用</span>
              <span className="font-medium text-gray-900 dark:text-white">
                预估中...
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            onClick={onClose}
            disabled={isPending}
          >
            取消
          </button>
          <button
            className="flex-1 px-4 py-2 text-white bg-purple-600 rounded-xl hover:bg-purple-700 transition-colors disabled:bg-purple-400"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? '处理中...' : '确认购买'}
          </button>
        </div>
      </div>
    </div>
  )
} 