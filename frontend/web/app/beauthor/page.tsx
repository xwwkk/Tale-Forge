'use client'

import { useState, useEffect } from 'react'
import styles from './page.module.css'
import { useRouter } from 'next/navigation'
import { useAccount, useContractRead, useContractWrite, usePublicClient, usePrepareContractWrite } from 'wagmi'
import Button from '@/components/ui/button'
import { FaPen, FaBook, FaChartLine } from 'react-icons/fa'
import { toast } from 'react-hot-toast'
import WalletRequired from '@/components/web3/WalletRequired'
import ImageCropper from '@/components/ImageCropper'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { FaTwitter, FaDiscord, FaGlobe } from 'react-icons/fa'
import { parseEther } from 'viem'
import { CONTRACT_ABIS, CONTRACT_ADDRESSES } from '@/constants/abi'

const authorManagerAddress = CONTRACT_ADDRESSES.AuthorManager as `0x${string}`

// 笔名验证规则
const PEN_NAME_RULES = {
  minLength: 2,
  maxLength: 20,
  pattern: /^[a-zA-Z0-9\u4e00-\u9fa5_-]+$/,
}

const GENRES = [
  { id: 'fiction', name: '小说' },
  { id: 'poetry', name: '诗歌' },
  { id: 'essay', name: '散文' },
  { id: 'fantasy', name: '奇幻' },
  { id: 'scifi', name: '科幻' },
  { id: 'romance', name: '言情' }
]

interface AuthorInfo {
  penName: string
  bio: string
  email: string
  genres: string[]
  agreement: boolean
  avatar?: string
}

interface AuthorData {
  authorAddress: string;
  penName: string;
  storyCount: number;
  totalWordCount: bigint;
  totalEarningsBNB: bigint;
  totalEarningsToken: bigint;
  totalMiningRewards: bigint;
  createdAt: bigint;
  lastUpdate: bigint;
  isActive: boolean;
}

export default function BeAuthor() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const [isRegistering, setIsRegistering] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [isExistingAuthor, setIsExistingAuthor] = useState(false)
  const [isLoadingAuthorInfo, setIsLoadingAuthorInfo] = useState(false)
  const [authorInfo, setAuthorInfo] = useState<AuthorInfo>({
    penName: '',
    bio: '',
    email: '',
    genres: [],
    agreement: false,
    avatar: undefined
  })
  const [showCropper, setShowCropper] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [penNameError, setPenNameError] = useState('')
  const [originalAuthorInfo, setOriginalAuthorInfo] = useState<AuthorInfo | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)


  // 提交表单(注册及更新)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const error = validateForm()
    if (error) {
      toast.error(error)
      return
    }

    if (isExistingAuthor) {
      // 如果修改了笔名，显示确认对话框
      if (authorInfo.penName !== originalAuthorInfo?.penName) {
        setShowConfirmDialog(true)
      } else {
        // 直接更新信息
        await updateAuthorInfo()
      }
    } else {
      // 新作者注册
      register?.()
    }
  }

  // 合约注册作者
  const { write: register } = useContractWrite({
    address: authorManagerAddress,
    abi: CONTRACT_ABIS.AuthorManager,
    functionName: 'registerAuthor',
    args: [authorInfo.penName],
    onSuccess: async (data) => {
      try {
        // 等待交易确认
        await publicClient.waitForTransactionReceipt({
          hash: data.hash,
          confirmations: 1,
        })
        
        // 调用后端注册 API
        await registerAuthorToServer()
        
        toast.success('注册成功！')
        router.push('/author/write')
      } catch (error) {
        console.error('注册作者失败:', error)
        toast.error('注册失败：' + (error as Error).message)
      }
    },
    onError: (error) => {
      console.error('注册作者失败:', error)
      if (error.message.includes('Author already registered')) {
        toast.error('您已经是作者了')
        router.push('/author/write')
      } else {
        toast.error('注册失败：' + error.message)
      }
    }
  })

  // 调用后端注册 API
  const registerAuthorToServer = async () => {
    try {
      console.log('注册作者到服务器:', {
        ...authorInfo,
        address
      })
      
      const response = await fetch('/api/authors/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...authorInfo,
          address,
          avatar: authorInfo.avatar // 确保传递头像URL
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to register author')
      }

      return await response.json()
    } catch (error) {
      console.error('Register to server failed:', error)
      throw error
    }
  }


  // 合约检查笔名是否已被使用
  const { data: isPenNameTaken, isLoading: isPenNameCheckLoading } = useContractRead({
    address: authorManagerAddress,
    abi: CONTRACT_ABIS.AuthorManager,
    functionName: 'isPenNameTaken',
    args: [authorInfo.penName],
    enabled: authorInfo.penName.length > 0 && authorInfo.penName !== (isExistingAuthor ? authorInfo.penName : ''),
  })

  // 验证笔名
  useEffect(() => {
    const error = validatePenName()
    setPenNameError(error)
  }, [authorInfo.penName, isPenNameTaken, isExistingAuthor])

  // 验证笔名
  const validatePenName = () => {
    if (!authorInfo.penName) {
      return '笔名不能为空'
    }
    if (authorInfo.penName.length < PEN_NAME_RULES.minLength) {
      return `笔名至少需要 ${PEN_NAME_RULES.minLength} 个字符`
    }
    if (authorInfo.penName.length > PEN_NAME_RULES.maxLength) {
      return `笔名最多 ${PEN_NAME_RULES.maxLength} 个字符`
    }
    if (!PEN_NAME_RULES.pattern.test(authorInfo.penName)) {
      return '笔名只能包含字母、数字、中文、下划线和连字符'
    }
    if (isPenNameTaken && !isExistingAuthor) {
      return '该笔名已被使用'
    }
    return ''
  }

  // 从合约获取作者信息
  const { data: authorData } = useContractRead({
    address: authorManagerAddress,
    abi: CONTRACT_ABIS.AuthorManager,
    functionName: 'getAuthor',
    args: address ? [address as `0x${string}`] : undefined,
    enabled: !!address,
    onSuccess(data) {
      console.log('合约读取成功:', {
        raw: data,
        address: authorManagerAddress,
        walletAddress: address
      })
    },
    onError(error) {
      console.error('合约读取失败:', error)
    }
  })

  // 获取用户信息
  useEffect(() => {
    const fetchAuthorInfo = async () => {
      if (!address) return
      
      setIsLoadingAuthorInfo(true)
      try {
        console.log('=== Author Data Debug ===')
        console.log('Raw authorData:', authorData)
        console.log('Contract Address:', authorManagerAddress)
        console.log('Wallet Address:', address)
        
        if (authorData) {
          console.log('Raw Author Data:', authorData);
          let author: AuthorData;
          // 检查数据结构
          if (Array.isArray(authorData)) {
            const [authorAddress, penName, storyCount, totalWordCount, totalEarningsBNB, totalEarningsToken, totalMiningRewards, createdAt, lastUpdate, isActive] = authorData as any[];
            author = {
              authorAddress,
              penName,
              storyCount,
              totalWordCount,
              totalEarningsBNB,
              totalEarningsToken,
              totalMiningRewards,
              createdAt,
              lastUpdate,
              isActive
            };
          } else {
            author = authorData as unknown as AuthorData;
          }
          console.log('Parsed Author Data:', author);
          
          if (author.isActive) {
            setIsExistingAuthor(true)
            setAuthorInfo(prev => ({
              ...prev,
              penName: author.penName || ''
            }))
            setOriginalAuthorInfo({
              penName: author.penName || '',
              bio: '',
              email: '',
              genres: [],
              agreement: true,
              avatar: undefined
            })
          }
        }
        console.log('/api/authors/:', address)
        // 获取指定作者信息
        const response = await fetch(`/api/authors/${address}`)
        if (response.ok) {
          const data = await response.json()
          console.log('获取到作者数据:', data)
          
          if (data.isAuthor) {
            setIsExistingAuthor(true)
            setAuthorInfo(prev => ({
              ...prev,
              bio: data.bio || '',
              email: data.email || '',
              genres: data.genres || [],
              avatar: data.avatar || '', // 确保设置头像URL
              agreement: true
            }))
            
            // 更新原始数据
            setOriginalAuthorInfo({
              penName: data.authorName || '',
              bio: data.bio || '',
              email: data.email || '',
              genres: data.genres || [],
              avatar: data.avatar || '',
              agreement: true
            })
          }
        }
      } catch (error) {
        console.error('Failed to fetch author info:', error)
        toast.error('获取作者信息失败，请稍后重试')
      } finally {
        setIsLoadingAuthorInfo(false)
      }
    }

    fetchAuthorInfo()
  }, [address, authorData])



  // 更新作者信息
  const updateAuthorInfo = async () => {
    if (!address) return
    setIsLoading(true)

    try {
      // 如果笔名被修改了，需要先调用合约更新笔名
      if (authorInfo.penName !== originalAuthorInfo?.penName) {
        console.log('更新笔名:', authorInfo.penName)
        const { hash } = await updatePenName({
          args: [authorInfo.penName]
        })

        // 等待交易确认
        await publicClient.waitForTransactionReceipt({
          hash,
          confirmations: 1,
        })
        console.log('笔名更新成功，交易hash:', hash)
      }

      // 更新服务器数据
      console.log('更新服务器数据:', {
        ...authorInfo,
        avatar: authorInfo.avatar // 确保包含头像URL
      })
      
      const response = await fetch(`/api/users/${address}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          penName: authorInfo.penName,
          bio: authorInfo.bio,
          email: authorInfo.email,
          avatar: authorInfo.avatar, // 确保包含头像URL
          genres: authorInfo.genres
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '更新失败')
      }

      const updatedData = await response.json()
      console.log('服务器更新成功:', updatedData)

      // 更新本地状态
      setOriginalAuthorInfo({
        ...authorInfo,
        agreement: true
      })

      toast.success('作者信息更新成功')
      setShowConfirmDialog(false)
      router.refresh()
    } catch (error) {
      console.error('更新失败:', error)
      toast.error('更新失败：' + (error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  // 合约写入函数
  const { writeAsync: updatePenName } = useContractWrite({
    address: authorManagerAddress,
    abi: CONTRACT_ABIS.AuthorManager,
    functionName: 'updatePenName',
  })


  // 前端只保留基础的表单验证
  const validateForm = () => {
    if (!authorInfo.penName) {
      return '笔名不能为空'
    }
    if (!authorInfo.email) {
      return '邮箱不能为空'
    }
    // 只做基本格式验证
    if (!/^[a-zA-Z0-9\u4e00-\u9fa5_-]{2,20}$/.test(authorInfo.penName)) {
      return '笔名格式不正确'
    }
    return ''
  }


  return (
    <div className="pt-16">
      <WalletRequired
        title="成为作者"
        description="连接钱包以开始您的创作之旅"
        icon={<FaPen className="w-10 h-10 text-indigo-600" />}
      >
        <div className={styles.container}>
          <div className={styles.hero}>
            <div className={styles.heroContent}>
              <h1>{isExistingAuthor ? '更新作者信息' : '成为作者'}</h1>
              <p>{isExistingAuthor ? '修改您的作者信息' : '在 TaleForge 开启您的创作之旅'}</p>
            </div>
          </div>

          <div className={styles.content}>
            {isLoadingAuthorInfo ? (
              <div className="flex justify-center items-center min-h-[200px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <>
                {!isExistingAuthor && (
                  <div className={styles.benefits}>
                    <div className={styles.benefitCard}>
                      <div className={styles.benefitIcon}>
                        <FaPen />
                      </div>
                      <div className={styles.benefitText}>
                        <h3>自由创作</h3>
                        <p>完全掌控您的创作，随时发布新作品，让您的创意不受限制</p>
                      </div>
                    </div>
                    <div className={styles.benefitCard}>
                      <div className={styles.benefitIcon}>
                        <FaBook />
                      </div>
                      <div className={styles.benefitText}>
                        <h3>版权保护</h3>
                        <p>基于区块链技术，确保您的作品版权得到完善保护</p>
                      </div>
                    </div>
                    <div className={styles.benefitCard}>
                      <div className={styles.benefitIcon}>
                        <FaChartLine />
                      </div>
                      <div className={styles.benefitText}>
                        <h3>收益管理</h3>
                        <p>透明的收益分配机制，实时查看您的创作收入</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className={styles.registerSection}>
                  <div className={styles.registerForm}>
                    <h2>{isExistingAuthor ? '更新作者信息' : '开始创作之旅'}</h2>
                    
                    <div className={styles.formGroup}>
                      <label>头像</label>
                      <div className="w-full max-w-2xl">
                        {showCropper && selectedFile ? (
                          <ImageCropper
                            image={URL.createObjectURL(selectedFile)}
                            onCropComplete={(croppedImage) => {
                              setAuthorInfo(prev => ({
                                ...prev,
                                avatar: croppedImage
                              }))
                              setShowCropper(false)
                              setSelectedFile(null)
                              toast.success('头像裁剪成功')
                            }}
                            onCancel={() => {
                              setShowCropper(false)
                              setSelectedFile(null)
                            }}
                            minWidth={200}
                            minHeight={200}
                            aspectRatio={1}
                            previewShape="circle"
                            previewClassName="w-[200px] h-[200px]"
                          />
                        ) : (
                          <div className="flex items-center space-x-4">
                            {authorInfo.avatar ? (
                              <img
                                src={authorInfo.avatar}
                                alt="作者头像"
                                className="w-24 h-24 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                                <FaPen className="w-8 h-8 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <input
                                type="file"
                                id="avatar-upload"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setSelectedFile(file);
                                    setShowCropper(true);
                                  }
                                }}
                                className="hidden"
                              />
                              <label
                                htmlFor="avatar-upload"
                                className="cursor-pointer px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors inline-flex items-center justify-center"
                              >
                                {isUploading ? '上传中...' : '更换头像'}
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label>笔名</label>
                      <input
                        type="text"
                        value={authorInfo.penName}
                        onChange={(e) =>
                          setAuthorInfo((prev) => ({
                            ...prev,
                            penName: e.target.value,
                          }))
                        }
                        placeholder="您的笔名"
                        className={`${styles.input} pl-3 border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors duration-200`}
                        required
                      />
                      {penNameError && (
                        <small className="text-red-500 mt-1">{penNameError}</small>
                      )}
                      <small className="text-gray-500 block mt-1">
                        {PEN_NAME_RULES.minLength}-{PEN_NAME_RULES.maxLength}
                        个字符，可包含字母、数字、中文、下划线和连字符
                      </small>
                      {isExistingAuthor && (
                        <small className="text-gray-500 block mt-1">
                          修改笔名需要支付少量 Gas 费用，具体金额取决于当前网络状况
                        </small>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label>简介</label>
                      <textarea
                        value={authorInfo.bio}
                        onChange={(e) =>
                          setAuthorInfo((prev) => ({
                            ...prev,
                            bio: e.target.value,
                          }))
                        }
                        placeholder="介绍一下您自己"
                        className={`${styles.textarea} pl-3 border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors duration-200`}
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>邮箱</label>
                      <div className="relative">
                        <input
                          type="email"
                          value={authorInfo.email}
                          onChange={(e) =>
                            setAuthorInfo((prev) => ({
                              ...prev,
                              email: e.target.value,
                            }))
                          }
                          placeholder="您的邮箱"
                          className={`${styles.input} pl-3 border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors duration-200`}
                          required
                        />
                      </div>
                    </div>

                    {!isExistingAuthor && (
                      <div className={styles.formGroup}>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={authorInfo.agreement}
                            onChange={(e) =>
                              setAuthorInfo((prev) => ({
                                ...prev,
                                agreement: e.target.checked,
                              }))
                            }
                            className={styles.checkbox}
                            required
                          />
                          <span className="ml-2">
                            我同意并接受服务条款
                            <small className="text-gray-500 block mt-1">
                              注册作者需要支付少量 Gas 费用，具体金额取决于当前网络状况
                            </small>
                          </span>
                        </label>
                      </div>
                    )}

                    <div className="flex justify-center mt-8">
                      {isExistingAuthor ? (
                        <Button
                          type="submit"
                          onClick={handleSubmit}
                          disabled={
                            isLoading ||
                            !authorInfo.penName ||
                            !authorInfo.bio ||
                            !authorInfo.email ||
                            !!penNameError
                          }
                          className="w-64 h-12 text-lg font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                        >
                          {isLoading ? (
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                              更新中...
                            </div>
                          ) : (
                            '更新作者信息'
                          )}
                        </Button>
                      ) : (
                        <Button
                          type="submit"
                          onClick={handleSubmit}
                          disabled={
                            isLoading ||
                            (!isExistingAuthor && !authorInfo.agreement) ||
                            !authorInfo.penName ||
                            !authorInfo.bio ||
                            !authorInfo.email ||
                            !!penNameError
                          }
                          className="w-64 h-12 text-lg font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                        >
                          {isLoading ? (
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                              提交中...
                            </div>
                          ) : (
                            '成为作者'
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </WalletRequired>

      <ConfirmDialog
        isOpen={showConfirmDialog}
        title="确认更新"
        message={
          isExistingAuthor && authorInfo.penName !== originalAuthorInfo?.penName
            ? "修改笔名需要支付少量 Gas 费用，具体金额取决于当前网络状况，确定要继续吗？"
            : "确定要更新您的作者信息吗？"
        }
        onConfirm={updateAuthorInfo}
        onCancel={() => setShowConfirmDialog(false)}
      />
    </div>
  )
}
