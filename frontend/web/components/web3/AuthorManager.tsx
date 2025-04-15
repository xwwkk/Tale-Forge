'use client'

import { useState, useEffect } from 'react'
import { useAccount, useContractRead, useContractWrite, useWaitForTransaction } from 'wagmi'

import { toast } from 'react-hot-toast'
import styles from './AuthorManager.module.css'
import { CONTRACT_ABIS, CONTRACT_ADDRESSES } from '@/constants/contracts'

// 使用网络切换机制的合约地址
const authorManagerAddress = CONTRACT_ADDRESSES.AuthorManager
const AuthorManagerABI = CONTRACT_ABIS.AuthorManager
// 笔名验证规则
const PEN_NAME_RULES = {
  minLength: 2,
  maxLength: 20,
  pattern: /^[a-zA-Z0-9\u4e00-\u9fa5_-]+$/,
}

interface Author {
  penName: string;
  isActive: boolean;
}

export default function AuthorManager() {
  const { address, isConnected } = useAccount()
  const [penName, setPenName] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [author, setAuthor] = useState<Author | null>(null)

  // 获取作者信息
  const { data: authorData, refetch: refetchAuthor } = useContractRead({
    address: authorManagerAddress as `0x${string}`,
    abi: AuthorManagerABI,
    functionName: 'getAuthor',
    args: [address!],
    enabled: isConnected && !!address,
  })

  // 处理作者数据
  useEffect(() => {
    if (authorData && Array.isArray(authorData)) {
      setAuthor({
        penName: authorData[1],
        isActive: authorData[9]
      });
    }
  }, [authorData]);

  // 检查笔名是否已被使用
  const { data: isPenNameTaken, refetch: refetchPenNameTaken } = useContractRead({
    address: authorManagerAddress as `0x${string}`,
    abi: AuthorManagerABI,
    functionName: 'isPenNameTaken',
    args: [penName],
    enabled: penName.length > 0,
  })

  // 注册作者
  const { write: register, data: registerData } = useContractWrite({
    address: authorManagerAddress as `0x${string}`,
    abi: AuthorManagerABI,
    functionName: 'registerAuthor',
  })

  // 更新笔名
  const { write: update, data: updateData } = useContractWrite({
    address: authorManagerAddress as `0x${string}`,
    abi: AuthorManagerABI,
    functionName: 'updatePenName',
  })

  // 监听注册交易
  const { isLoading: isRegistering } = useWaitForTransaction({
    hash: registerData?.hash,
    onSuccess: () => {
      toast.success('注册成功！')
      refetchAuthor()
      setIsLoading(false)
      setPenName('')
    },
    onError: (error) => {
      toast.error(`注册失败: ${error.message}`)
      setIsLoading(false)
    },
  })

  // 监听更新交易
  const { isLoading: isUpdating } = useWaitForTransaction({
    hash: updateData?.hash,
    onSuccess: () => {
      toast.success('笔名更新成功！')
      refetchAuthor()
      setIsLoading(false)
      setIsEditing(false)
      setPenName('')
    },
    onError: (error) => {
      toast.error(`更新失败: ${error.message}`)
      setIsLoading(false)
    },
  })

  // 验证笔名
  const validatePenName = (name: string): string | null => {
    if (name.length < PEN_NAME_RULES.minLength) {
      return `笔名至少需要 ${PEN_NAME_RULES.minLength} 个字符`
    }
    if (name.length > PEN_NAME_RULES.maxLength) {
      return `笔名最多 ${PEN_NAME_RULES.maxLength} 个字符`
    }
    if (!PEN_NAME_RULES.pattern.test(name)) {
      return '笔名只能包含字母、数字、中文、下划线和连字符'
    }
    return null
  }

  // 处理笔名输入
  const handlePenNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPenName = e.target.value
    setPenName(newPenName)
    const validationError = validatePenName(newPenName)
    setError(validationError || '')
  }

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isConnected) {
      toast.error('请先连接钱包')
      return
    }

    const validationError = validatePenName(penName)
    if (validationError) {
      setError(validationError)
      return
    }

    // 如果是编辑模式，检查新笔名是否与当前笔名相同
    if (author && isEditing && author.penName === penName) {
      toast.error('新笔名与当前笔名相同')
      return
    }

    // 只在非编辑模式下检查笔名是否被使用
    if (!isEditing && isPenNameTaken) {
      setError('该笔名已被使用')
      return
    }

    setIsLoading(true)
    try {
      if (author && isEditing) {
        update?.({
          args: [penName],
        })
      } else {
        register?.({
          args: [penName],
        })
      }
    } catch (err: any) {
      toast.error(`操作失败: ${err.message}`)
      setIsLoading(false)
    }
  }

  // 开始编辑笔名
  const handleEdit = () => {
    setIsEditing(true)
    setPenName(author?.penName || '')
  }

  // 取消编辑
  const handleCancel = () => {
    setIsEditing(false)
    setPenName('')
    setError('')
  }

  if (!isConnected) {
    return (
      <div className={styles.container}>
        <p className={styles.message}>请先连接钱包以管理你的笔名</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {author && !isEditing ? (
        // 显示作者信息
        <div className={styles.authorInfo}>
          <h2 className={styles.title}>作者信息</h2>
          <div className={styles.infoItem}>
            <span className={styles.label}>钱包地址:</span>
            <span className={styles.value}>{address}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.label}>笔名:</span>
            <span className={styles.value}>{author.penName}</span>
          </div>
          <button
            onClick={handleEdit}
            className="px-4 py-2 mt-4 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            修改笔名
          </button>
        </div>
      ) : (
        // 注册/编辑表单
        <form onSubmit={handleSubmit} className={styles.form}>
          <h2 className={styles.title}>
            {isEditing ? '修改笔名' : '注册笔名'}
          </h2>
          
          <div className={styles.inputGroup}>
            <label htmlFor="penName" className={styles.label}>
              笔名:
            </label>
            <input
              id="penName"
              type="text"
              value={penName}
              onChange={handlePenNameChange}
              placeholder="输入你的笔名"
              className={styles.input}
              disabled={isLoading || isRegistering || isUpdating}
            />
            {error && <p className={styles.error}>{error}</p>}
          </div>

          <div className={styles.buttonGroup}>
            <button
              type="submit"
              disabled={!!error || isLoading || isRegistering || isUpdating || !penName || (isEditing && author?.penName === penName)}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading || isRegistering || isUpdating ? '处理中...' : (isEditing ? '更新' : '注册')}
            </button>
            
            {isEditing && (
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading || isRegistering || isUpdating}
              >
                取消
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  )
}
