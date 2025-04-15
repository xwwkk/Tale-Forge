'use client'

import { useEffect, useState } from 'react'
import { useAccount, useContractRead, useContractWrite, usePrepareContractWrite } from 'wagmi'
import { FiEdit2, FiAward, FiBook, FiDollarSign, FiClock } from 'react-icons/fi'
import { toast } from 'react-hot-toast'
import { CONTRACT_ABIS, CONTRACT_ADDRESSES } from '@/constants/contracts'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface Author {
  authorAddress: string
  penName: string
  storyCount: number
  totalWordCount: number
  totalEarningsBNB: number
  totalEarningsToken: number
  totalMiningRewards: number
  createdAt: number
  lastUpdate: number
  isActive: boolean
}

export function AuthorProfile() {
  const { address } = useAccount()
  const [isEditing, setIsEditing] = useState(false)
  const [newPenName, setNewPenName] = useState('')
  const [author, setAuthor] = useState<Author | null>(null)

  // 读取作者信息
  const { data: authorData, isError, isLoading } = useContractRead({
    address: CONTRACT_ADDRESSES.AuthorManager as `0x${string}`,
    abi: CONTRACT_ABIS.AuthorManager,
    functionName: 'authors',
    args: [address],
    watch: true,
  })

  // 准备更新笔名的合约调用
  const { config: updateConfig } = usePrepareContractWrite({
    address: CONTRACT_ADDRESSES.AuthorManager as `0x${string}`,
    abi: CONTRACT_ABIS.AuthorManager,
    functionName: 'updatePenName',
    args: [newPenName],
    enabled: newPenName.length > 0,
  })

  // 更新笔名的合约调用
  const { write: updatePenName, isLoading: isUpdating } = useContractWrite({
    ...updateConfig,
    onSuccess: () => {
      toast.success('笔名更新成功！')
      setIsEditing(false)
    },
    onError: (error) => {
      toast.error('笔名更新失败：' + error.message)
    },
  })

  // 处理作者数据
  useEffect(() => {
    if (authorData) {
      setAuthor({
        authorAddress: authorData[0],
        penName: authorData[1],
        storyCount: Number(authorData[2]),
        totalWordCount: Number(authorData[3]),
        totalEarningsBNB: Number(authorData[4]),
        totalEarningsToken: Number(authorData[5]),
        totalMiningRewards: Number(authorData[6]),
        createdAt: Number(authorData[7]),
        lastUpdate: Number(authorData[8]),
        isActive: authorData[9],
      })
    }
  }, [authorData])

  if (isLoading) return <div className="text-center py-8">加载作者信息中...</div>
  if (isError) return <div className="text-center py-8 text-red-500">加载作者信息失败</div>
  if (!author?.isActive) return <div className="text-center py-8">您还不是作者，请先注册</div>

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-2xl font-bold text-gray-900">作者信息</h2>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
        >
          <FiEdit2 className="w-4 h-4" />
          {isEditing ? '取消' : '修改笔名'}
        </button>
      </div>

      {/* 笔名编辑区域 */}
      {isEditing ? (
        <div className="mb-6">
          <input
            type="text"
            value={newPenName}
            onChange={(e) => setNewPenName(e.target.value)}
            placeholder="输入新的笔名"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <div className="mt-4 flex justify-end gap-4">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              取消
            </button>
            <button
              onClick={() => updatePenName?.()}
              disabled={isUpdating || !newPenName}
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
            >
              {isUpdating ? '更新中...' : '确认更新'}
            </button>
          </div>
        </div>
      ) : null}

      {/* 作者信息卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <FiAward className="w-6 h-6 text-indigo-600" />
            <div>
              <div className="text-sm text-gray-500">笔名</div>
              <div className="font-medium">{author.penName}</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <FiBook className="w-6 h-6 text-indigo-600" />
            <div>
              <div className="text-sm text-gray-500">作品数量</div>
              <div className="font-medium">{author.storyCount} 部作品</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <FiDollarSign className="w-6 h-6 text-indigo-600" />
            <div>
              <div className="text-sm text-gray-500">总收益</div>
              <div className="font-medium">
                {author.totalEarningsBNB / 1e18} BNB / {author.totalEarningsToken / 1e18} Token
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <FiClock className="w-6 h-6 text-indigo-600" />
            <div>
              <div className="text-sm text-gray-500">注册时间</div>
              <div className="font-medium">
                {formatDistanceToNow(author.createdAt * 1000, { addSuffix: true, locale: zhCN })}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <FiBook className="w-6 h-6 text-indigo-600" />
            <div>
              <div className="text-sm text-gray-500">总字数</div>
              <div className="font-medium">{author.totalWordCount} 字</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <FiAward className="w-6 h-6 text-indigo-600" />
            <div>
              <div className="text-sm text-gray-500">挖矿奖励</div>
              <div className="font-medium">{author.totalMiningRewards / 1e18} Token</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
