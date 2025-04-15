'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import { 
  FaPen, 
  FaSave, 
  FaList, 
  FaCog, 
  FaUpload, 
  FaEye, 
  FaImage, 
  FaSitemap, 
  FaTrash, 
  FaEyeSlash,
  FaTimes,
  FaCamera,
  FaSort,
  FaPlus,
  FaWallet,
  FaBook,
  FaMoneyBill,
  FaInfoCircle,
  FaCheck,
  FaHeading,
  FaExclamationTriangle
} from 'react-icons/fa'
import { toast } from 'react-hot-toast'
import { Eye as EyeIcon, EyeOff as EyeOffIcon, FileText, BarChart2 } from 'lucide-react'
import WalletRequired from '@/components/web3/WalletRequired'
import ImageCropper from '@/components/ImageCropper'
import styles from './page.module.css'
import Button from '@/components/ui/button'
import { useAccount } from 'wagmi'
import { ethers } from 'ethers'

import { CONTRACT_ADDRESSES,CONTRACT_ABIS } from '@/constants/contracts'
import { Story as StoryType, Chapter as ChapterType, Author, StoryStats } from '@/types/story'
import { IoClose, IoWarning, IoRocket } from 'react-icons/io5'

// 扩展 Story 类型
interface Story extends StoryType {
  chapterCount: number;
  publishedChapterCount: number;
  draftChapterCount: number;
}

// 定义IconButton的类型
interface IconButtonProps {
  icon: React.ReactNode;
  onClick: () => void;
  className?: string;
  [key: string]: any;
}
// 修改 Editor 组件的类型定义
interface EditorProps {
  key?: string;
  initialContent?: string | null;
  onChange: (content: string) => void;
  editable: boolean;
  className?: string;
  placeholder?: string;
  onSave?: () => void;
}
// 大纲类型
interface Outline {
  id: string;
  title: string;
  description: string;
  chapterId: string;
}

// 卷类型
interface Volume {
  id: string;
  title: string;
  description: string;
  order: number;
}

// 扩展章节类型
interface Chapter {
  id: string;
  title: string;
  content: string;
  order: number;
  volumeId?: string;
  wordCount: number;
  status: 'draft' | 'pending' | 'published';
  price?: number;
  publishTime?: Date;
  createdAt: Date;
  updatedAt: Date;
  illustrations?: any[]; // Added this line
}

// 写作统计类型
interface WritingStats {
  totalWordCount: number;
  todayWordCount: number;
  averageSpeed: number; // words per minute
  writingDuration: number; // minutes
  lastSaved: Date;
}

// 作品类型
interface Story {
  id: string;
  title: string;
  category: string;
  wordCount: number;
  targetWordCount: number;
  chapterCount: number;
  publishedChapterCount: number;
  draftChapterCount: number;
}

// 在文件顶部添加类型定义
interface Illustration {
  id: string;
  chapterId: string;
  fileName: string;
  fileType: string;
  fileContent?: string;
  fileSize: number;
  description?: string;
  status: string;
  imageCID?: string;
  createdAt: Date;
  filePath?: string; // Added this line
}

// 在文件顶部添加后端URL常量
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// 修改IconButton的类型和实现
const IconButton: React.FC<IconButtonProps> = ({ icon, onClick, className = '', ...props }) => (
  <button
    onClick={onClick}
    className={`${styles.iconButton} ${className}`}
    {...props}
  >
    {icon}
  </button>
)

// 修改Input组件
const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input {...props} className={styles.input} />
)

// 修改Textarea组件
const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
  <textarea {...props} className={styles.textarea} />
)

// 修改 Editor 组件的导入
const Editor = dynamic<EditorProps>(
  () => import('@/components/editor/TiptapEditor').then(mod => mod.default as any), 
  {
    ssr: false,
    loading: () => <div className={styles.editorLoading}>加载编辑器...</div>
  }
);

// 作品类型选项
const STORY_TYPES = [
  { id: 'fantasy', name: '玄幻' },
  { id: 'scifi', name: '科幻' },
  { id: 'wuxia', name: '武侠' },
  { id: 'urban', name: '都市' },
  { id: 'romance', name: '言情' },
  { id: 'mystery', name: '悬疑' }
]

// 标签选项
const STORY_TAGS = [
  { id: 'action', name: '动作' },
  { id: 'adventure', name: '冒险' },
  { id: 'comedy', name: '喜剧' },
  { id: 'drama', name: '剧情' },
  { id: 'horror', name: '恐怖' },
  { id: 'romance', name: '爱情' },
]

// 添加创建状态类型
const enum CreateStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  CREATING_CONTRACT = 'CREATING_CONTRACT',
  SAVING_DATABASE = 'SAVING_DATABASE',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

// 错误提示组件
const ErrorDialog = ({ message, onClose }: { message: string; onClose: () => void }) => (
  <div className={styles.modal}>
    <div className={styles.modalContent}>
      <div className={styles.modalHeader}>
        <h2 className={styles.modalTitle}>创建失败</h2>
        <button 
          onClick={onClose}
          className={styles.closeButton}
        >
          ×
        </button>
      </div>
      <div className={styles.modalText}>
        {message}
      </div>
      <div className={styles.modalFooter}>
        <button
          onClick={onClose}
          className={`${styles.button} ${styles.cancelButton}`}
        >
          知道了
        </button>
      </div>
    </div>
  </div>
);

// 提示弹窗组件
const TipDialog = ({ message, onClose }: { message: string; onClose: () => void }) => (
  <div className={styles.modal}>
    <div className={styles.modalContent}>
      <div className={styles.modalHeader}>
        <h2 className={styles.modalTitle}>提示</h2>
        <button 
          className={styles.closeButton}
          onClick={onClose}
        >
          ×
        </button>
      </div>
      <div className={styles.modalText}>{message}</div>
      <div className={styles.modalFooter}>
        <button
          className={`${styles.button} ${styles.cancelButton}`}
          onClick={onClose}
        >
          知道了
        </button>
      </div>
    </div>
  </div>
);

// 成功确认弹窗组件
const SuccessDialog = ({ message, onClose }: { message: string; onClose: () => void }) => (
  <div className={styles.modal}>
    <div className={styles.modalContent}>
      <div className={styles.modalHeader}>
        <h2 className={styles.modalTitle}>操作成功</h2>
        <button 
          className={styles.closeButton}
          onClick={onClose}
        >
          ×
        </button>
      </div>
      <div className={styles.modalText}>{message}</div>
      <div className={styles.modalFooter}>
        <button
          className={`${styles.button} ${styles.primaryButton}`}
          onClick={onClose}
        >
          确认
        </button>
      </div>
    </div>
  </div>
);

// 作者写作页面
export default function AuthorWrite() {
  const router = useRouter()
  const pathname = usePathname()
  const { address } = useAccount()
  
  // 发布确认对话框状态
  const [showPublishConfirm, setShowPublishConfirm] = useState(false)
  const [chapterToPublish, setChapterToPublish] = useState<string | null>(null)

  // 作品信息状态
  const [storyInfo, setStoryInfo] = useState({
    title: '',
    type: '',
    description: '',
    tags: [] as string[],
    coverImage: '',
    isSerial: true, // 是否连载
    price: 0, // 定价
    isFree: true, // 是否免费
    targetWordCount: 100000, // 目标字数，设置默认值
  })

  // 作品状态
  const [currentStory, setCurrentStory] = useState<Story | null>(null)
  const [showStorySelector, setShowStorySelector] = useState(false)
  const [stories, setStories] = useState<Story[]>([])
  const [isLoadingStories, setIsLoadingStories] = useState(false)
  const [message, setMessage] = useState('')

  
  
  // 章节管理
  const [chapters, setChapters] = useState<ChapterType[]>([])
  const [currentChapter, setCurrentChapter] = useState<any>(null);
  // 章节加载状态
  const [isChapterLoading, setIsChapterLoading] = useState(true);
  // 添加章节分页和折叠相关状态
  const [totalChapters, setTotalChapters] = useState(0);
  const [recentChapters, setRecentChapters] = useState<ChapterType[]>([]);
  const [historicalChapters, setHistoricalChapters] = useState<{start: number, end: number, count: number}[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<number[]>([]);
  const [showAllChapters, setShowAllChapters] = useState(false);
  const [isLoadingMoreChapters, setIsLoadingMoreChapters] = useState(false);
  const [chapterSearchKeyword, setChapterSearchKeyword] = useState('');
  const [filteredChapters, setFilteredChapters] = useState<ChapterType[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // 简化的状态管理
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [currentChapterId, setCurrentChapterId] = useState<string | null>(null);
  const [hasContentChanged, setHasContentChanged] = useState(false); // 添加内容变更标记
  
  // 界面状态
  const [showSettings, setShowSettings] = useState(false)
  const [showChapters, setShowChapters] = useState(false)
  const [showStatsDialog, setShowStatsDialog] = useState(false)
  const [isPreview, setIsPreview] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>()
  
  // 文件上传相关
  const coverInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const editorRef = useRef<any>(null) // 添加编辑器引用

  // 大纲管理
  const [outlines, setOutlines] = useState<Outline[]>([])
  const [showOutlineDialog, setShowOutlineDialog] = useState(false)
  
  // 卷管理
  const [volumes, setVolumes] = useState<Volume[]>([])
  
  // 写作统计
  const [wordCountGoal, setWordCountGoal] = useState(0);
  const [writingStartTime, setWritingStartTime] = useState<Date | null>(null);
  const [totalWritingTime, setTotalWritingTime] = useState(0);
  const [writingStats, setWritingStats] = useState<WritingStats>({
    totalWordCount: 0,
    todayWordCount: 0,
    averageSpeed: 0,
    writingDuration: 0,
    lastSaved: new Date()
  })

  // 在顶部添加新的状态
  const [lastSavedContent, setLastSavedContent] = useState('');
  const [lastSavedTitle, setLastSavedTitle] = useState('');



  // 添加编辑状态管理
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);

  // 在组件顶部添加新的状态
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [chapterToDelete, setChapterToDelete] = useState<string | null>(null);

  // 在状态管理部分添加新的状态
  const [showCreateConfirm, setShowCreateConfirm] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // 添加错误提示状态
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 在状态管理部分添加新的状态
  const [showCoverCropper, setShowCoverCropper] = useState(false);
  const [selectedCoverFile, setSelectedCoverFile] = useState<File | null>(null);

  // 在状态管理部分添加新的状态
  const [showTipDialog, setShowTipDialog] = useState(false);

  // 成功对话框状态
const [successMessage, setSuccessMessage] = useState('');
const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  // 在状态管理部分添加新的状态
  const [createStatus, setCreateStatus] = useState<CreateStatus | null>(null)
  const [createProgress, setCreateProgress] = useState(0)

  // 在状态定义部分添加新的状态
  const [showCreateChapterDialog, setShowCreateChapterDialog] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');

  // 添加编辑器展开状态的状态变量
  // const [editorExpanded, setEditorExpanded] = useState(false);

  // 添加切换编辑器展开状态的函数
  // const toggleEditorExpand = () => {
  //   setEditorExpanded(prev => !prev);
  // };

  // 错误提示函数
  const showError = (error: unknown, defaultMessage: string) => {
    console.error(error);
    let message = defaultMessage;
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    }
    // 使用toast显示错误，而不是设置errorMessage
    toast.error(message);
  };

  // 成功提示函数
  const showSuccess = (message: string) => {
    toast.success(message);
  };

  // 成功提示函数
  const showCreateSuccess = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessDialog(true);
  };

  // 修改确认对话框函数
  const showConfirm = (message: string): boolean => {
    return window.confirm(message);
  };

  // 修改提示函数
  const showNoStoryTip = () => {
    setShowTipDialog(true);
  };


  // 切换作品创建面板
  const toggleSettings = () => {
    setShowSettings(prev => !prev);
    setShowChapters(false);
  };

  // 切换章节管理面板
  const toggleChapters = () => {
    setShowChapters(prev => !prev);
    setShowSettings(false);
  };

  // 添加no-scroll类到body元素。去除创作界面外层的滚动条（注意这里还能优化，）
  useEffect(() => {
    // 添加no-scroll类到body元素
    document.body.classList.add('no-scroll');
    
    // 组件卸载时移除no-scroll类
    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, []);
  
  /**
   * 作品创建及加载相关 
  */
  // 修改加载时机
  useEffect(() => {
    // 清理错误消息
    setErrorMessage(null);
    console.log('检查钱包地址:', address)
    if (address) {
      console.log('准备加载作品列表...')
      loadStories()
    } else {
      console.log('未连接钱包')
    }
  }, [address]) // 确保依赖项包含 address
  
  
  // 加载作品列表
  const loadStories = async () => {
    try {
      setIsLoadingStories(true);
      
      // 检查钱包地址
      if (!address) {
        console.log('未找到钱包地址，跳过加载作品列表');
        return;
      }
      
      console.log('开始加载作品列表，作者地址:', address);
      const response = await fetch(`/api/authors/${address}/stories`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API错误响应:', errorData);
        throw new Error(errorData.error || '加载作品列表失败');
      }
      
      const data = await response.json();
      console.log('API返回的原始数据:', data);

      // 显示同步状态或错误信息
      if (data.message) {
        setMessage(data.message);
      } else if (data.error) {
        setMessage(data.error);
      } else {
        setMessage('');
      }
      
      // 如果有作品列表则显示
      if (data.stories && data.stories.length > 0) {
        console.log('找到作品列表，开始处理每个作品...');
        
        // 获取每个作品的详细信息
        const getStoryDetails = async (story: Story) => {
          try {
            console.log('开始获取作品详细信息:', story);
            
            // 获取作品的章节列表
            const chaptersResponse = await fetch(`/api/stories/${story.id}/chapters`);
            if (!chaptersResponse.ok) {
              console.error('获取章节列表失败:', chaptersResponse.status);
              throw new Error('获取章节列表失败');
            }
            
            const chaptersData = await chaptersResponse.json();
            console.log('API返回的章节数据:', chaptersData);
            
            // 确保 chapters 是数组
            const chapters = Array.isArray(chaptersData) ? chaptersData : [];
            console.log('处理后的章节列表:', chapters);
            
            // 修改章节统计逻辑 - 只有明确标记为已发布的才算已发布章节，其他都算草稿
            const publishedCount = chapters.filter(ch => 
              ch.status?.toLowerCase() === 'published'
            ).length;
            
            // 所有非已发布的章节都视为草稿
            const draftCount = chapters.filter(ch => 
              ch.status?.toLowerCase() !== 'published'
            ).length;
            
            // 计算总字数（包括所有章节的字数）
            const totalWordCount = chapters.reduce((sum, ch) => {
              const chapterWordCount = typeof ch.wordCount === 'number' && !isNaN(ch.wordCount) ? ch.wordCount : 0;
              console.log(`章节 ${ch.id} 字数:`, chapterWordCount);
              return sum + chapterWordCount;
            }, 0);
            
            // 创建扩展的故事对象
            const storyDetails: Story = {
              ...story,
              wordCount: totalWordCount,
              targetWordCount: typeof story.targetWordCount === 'number' && !isNaN(story.targetWordCount) ? story.targetWordCount : 100000,
              chapterCount: chapters.length,
              publishedChapterCount: publishedCount,
              draftChapterCount: draftCount,
              // 确保其他必需字段都存在
              description: story.description || '',
              coverCid: story.coverCid || '',
              // contentCid: story.contentCid || '',
              author: story.author || { id: '', address: '', name: '' },
              category: story.category || '',
              status: story.status || 'DRAFT',
              // isNFT: story.isNFT || false,
              stats: story.stats || { favorites: 0, comments: 0 },
              createdAt: story.createdAt || new Date().toISOString(),
              updatedAt: story.updatedAt || new Date().toISOString()
            };
            
            console.log('处理后的作品详细信息:', storyDetails);
            return storyDetails;
          } catch (error) {
            console.error(`获取作品 ${story.id} 的详细信息失败:`, error);
            return {
              ...story,
              wordCount: 0,
              targetWordCount: typeof story.targetWordCount === 'number' && !isNaN(story.targetWordCount) ? story.targetWordCount : 100000,
              chapterCount: 0,
              publishedChapterCount: 0,
              draftChapterCount: 0,
              description: story.description || '',
              coverCid: story.coverCid || '',
              // contentCid: story.contentCid || '',
              author: story.author || { id: '', address: '', name: '' },
              category: story.category || '',
              status: story.status || 'DRAFT',
              // isNFT: story.isNFT || false,
              stats: story.stats || { likes: 0, views: 0, comments: 0 },
              createdAt: story.createdAt || new Date().toISOString(),
              updatedAt: story.updatedAt || new Date().toISOString()
            };
          }
        };
        
        const storiesWithDetails = await Promise.all(data.stories.map(getStoryDetails));
        console.log('最终处理后的作品列表:', storiesWithDetails);
        setStories(storiesWithDetails);
      } else {
        console.log('没有找到作品列表');
        setStories([]);
        if (!data.message && !data.error) {
          setMessage('暂无作品');
        }
      }
    } catch (error) {
      console.error('加载作品列表失败:', error);
      showError(error, '加载作品列表失败');
      setStories([]); // 设置空数组确保界面正常显示
    } finally {
      setIsLoadingStories(false);
    }
  };

  // 选择作品
  const handleStorySelect = async (story: Story) => {
    try {
      // 如果有未保存的更改,提示用户
      if (hasUnsavedChanges) {
        const confirm = window.confirm('当前章节有未保存的更改,切换作品将丢失这些更改,是否继续?')
        if (!confirm) return
      }
      
      setCurrentStory(story)
      localStorage.setItem('currentStoryId', story.id)
      setShowStorySelector(false)
      
      // 重置编辑器状态
      setContent('')
      setCurrentChapterId(null)
      setHasUnsavedChanges(false)
      
      // 加载新作品的章节列表
      await loadChapterList()
    } catch (error) {
      showError(error, '切换作品失败')
    }
  }

  /**作品创建 */
  // 创建作品
  const handleCreateStory = async () => {
    try {
      // 验证必填字段
      const validationErrors = [];
      if (!storyInfo.title.trim()) {
        validationErrors.push('作品标题不能为空');
      }
      if (!storyInfo.type) {
        validationErrors.push('请选择作品类型');
      }
      if (!storyInfo.description.trim()) {
        validationErrors.push('作品简介不能为空');
      }
      if (!storyInfo.targetWordCount || storyInfo.targetWordCount < 100000) {
        validationErrors.push('目标字数不能少于10万字。原因：较低的目标字数可能影响作品质量评估和NFT价值，同时不利于读者对作品完整度的判断。');
      }
      if (!storyInfo.isFree && (!storyInfo.price || storyInfo.price <= 0)) {
        validationErrors.push('付费作品必须设置价格');
      }

      // 如果有验证错误，显示错误信息并返回
      if (validationErrors.length > 0) {
        showError(validationErrors.join('\n\n'), '创建失败');
        return;
      }

      setShowCreateConfirm(true);
    } catch (error) {
      showError(error, '创建作品失败');
    }
  }

  // 修改handleConfirmCreate函数
  const handleConfirmCreate = async () => {
    try {
      // 验证必填字段
      const validationErrors = [];
      if (!storyInfo.title.trim()) {
        validationErrors.push('作品标题不能为空');
      }
      if (!storyInfo.type) {
        validationErrors.push('请选择作品类型');
      }
      if (!storyInfo.description.trim()) {
        validationErrors.push('作品简介不能为空');
      }
      if (!storyInfo.targetWordCount || storyInfo.targetWordCount < 100000) {
        validationErrors.push('目标字数不能少于10万字。原因：较低的目标字数可能影响作品质量评估和NFT价值，同时不利于读者对作品完整度的判断。');
      }
      if (!storyInfo.isFree && (!storyInfo.price || storyInfo.price <= 0)) {
        validationErrors.push('付费作品必须设置价格');
      }

      if (validationErrors.length > 0) {
        showError(validationErrors.join('\n\n'), '请完善作品信息');
        return;
      }

      // 检查钱包连接
      if (!address) {
        showError('请先连接钱包', '钱包未连接');
        return;
      }

      setIsCreating(true);
      setCreateProgress(0);

      // 第一步：上传内容到IPFS
      setCreateStatus(CreateStatus.UPLOADING);
      setCreateProgress(20);
      
      console.log('开始上传内容到IPFS...');
      const ipfsResponse = await fetch('/api/stories/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: storyInfo.title,
          description: storyInfo.description,
          content: content,
          coverImage: storyInfo.coverImage,
          authorAddress: address,
          category: storyInfo.type,
          tags: storyInfo.tags
        })
      });

      let ipfsData;
      try {
        ipfsData = await ipfsResponse.json();
      } catch (error) {
        console.error('解析API响应失败:', error);
        throw new Error('内容上传失败: 无法解析服务器响应');
      }

      if (!ipfsData.success) {
        console.error('上传失败:', ipfsData);
        throw new Error(ipfsData.message || '内容上传失败');
      }

      if (!ipfsData.contentCid || !ipfsData.coverCid) {
        console.error('API响应格式错误:', ipfsData);
        throw new Error('内容上传失败: 服务器返回的数据格式不正确');
      }

      console.log('IPFS上传成功:', ipfsData);

      // 准备智能合约调用参数
      const { contentCid, coverCid } = ipfsData;
      if (!contentCid || !coverCid) {
        throw new Error('IPFS上传返回的CID无效');
      }

      // 调用智能合约创建故事
      console.log('开始调用智能合约创建故事...');
      try {
        // 确保已连接钱包
        if (!window.ethereum) {
          throw new Error('未检测到钱包');
        }

                // 在调用智能合约前
        setCreateStatus(CreateStatus.CREATING_CONTRACT);
        setCreateProgress(40);
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        
        // 创建合约实例
        const storyManagerContract = new ethers.Contract(
          CONTRACT_ADDRESSES.StoryManager,
          CONTRACT_ABIS.StoryManager,
          signer
        );

        const tx = await storyManagerContract.createStory(
          storyInfo.title,
          storyInfo.description,
          coverCid,
          contentCid,
          storyInfo.targetWordCount
        );
        
        console.log('等待交易确认...');
        setCreateProgress(60);
        const receipt = await tx.wait();
        console.log('故事创建成功！交易收据:', receipt);
        setCreateProgress(80);

        // 从交易收据中获取新创建的故事ID
        const newStoryId = receipt.events?.find((e: any) => e.event === 'StoryCreated')?.args?.storyId;
        if (!newStoryId) {
          throw new Error('无法获取新创建的故事ID');
        }
        console.log('新创建的故事链上ID:', newStoryId);

        // 保存到数据库
        console.log('开始保存到数据库，发送数据:', {
          title: storyInfo.title,
          description: storyInfo.description,
          content: content,
          coverImage: storyInfo.coverImage,
          authorAddress: address,
          contentCid,
          coverCid,
          category: storyInfo.type,
          tags: storyInfo.tags,
          targetWordCount: storyInfo.targetWordCount
        });

        setCreateStatus(CreateStatus.SAVING_DATABASE);
        setCreateProgress(90);
        const saveResponse = await fetch('/api/stories/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: storyInfo.title,
            description: storyInfo.description,
            content: content,
            coverImage: storyInfo.coverImage,
            authorAddress: address,
            contentCid,
            coverCid,
            category: storyInfo.type,
            tags: storyInfo.tags,
            targetWordCount: storyInfo.targetWordCount,
            chainId: newStoryId.toString() // 确保转换为字符串
          })
        });

        if (!saveResponse.ok) {
          const errorData = await saveResponse.json();
          throw new Error(errorData.error || '保存故事失败');
        }

        const savedStory = await saveResponse.json();
        console.log('故事保存成功:', savedStory);
        
        // 重置创建状态
        setCreateStatus(CreateStatus.COMPLETED);
        setCreateProgress(100);
        // 关闭创建确认弹窗
        setShowCreateConfirm(false);
        // 显示成功提示
        showCreateSuccess('作品创建成功！');
      
        // 刷新作品列表
        try {
          await loadStories();
          console.log('作品列表已更新');
        } catch (error) {
          console.error('刷新作品列表失败:', error);
        }

        // 重置创建状态
        setStoryInfo({
          title: '',
          description: '',
          type: '',
          tags: [],
          targetWordCount: 100000,
          isFree: true,
          price: 0,
          coverImage: '',
          isSerial: true  // 添加这一行
        });
        
        return savedStory;
      } catch (error) {
        console.error('创建故事失败:', error);
        throw error;
      }

    } catch (error: any) {
      console.error('创建作品失败:', error);
      showError(error, error.message || '创建作品失败，请稍后重试');
      setCreateStatus(null);
    } finally {
      setIsCreating(false);
    }
  };

  // 添加封面处理函数
  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setSelectedCoverFile(file);
          setShowCoverCropper(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // 添加封面裁剪处理函数
  const handleCropComplete = async (croppedImage: string) => {
    try {
      // 直接使用裁剪后的base64图片URL
      handleInfoChange('coverImage', croppedImage);
      setShowCoverCropper(false);
      setSelectedCoverFile(null);
      showSuccess('封面上传成功');
    } catch (error) {
      showError(error, '封面上传失败');
    }
  };

  // 处理作品信息更新
  const handleInfoChange = (field: keyof typeof storyInfo, value: any) => {
    setStoryInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };


  /**章节列表创建及加载相关
   * 对于章节我们是直接加载已经发布的，而不是本地编辑，因为我们主要的目的是发布作品。
   * 并不是以写作为主的在线工具软件。要先明白这一原则，不要开发走偏了。
   * 增加一个文件加载显示功能，以方便作者用其它写作软件写好文章后直接加载进来，方便发布。
  */

  // 添加章节的处理函数
  const handleAddChapter = async (volumeId?: string) => {
    // 显示创建章节对话框
    setNewChapterTitle(`第${chapters.length + 1}章  `); // 在章节标题后添加两个空格
    setShowCreateChapterDialog(true);
  };

  // 修改添加确认创建章节的函数
  const handleConfirmAddChapter = async () => {
    try {
      console.log('开始创建新章节...');
      const storyId = localStorage.getItem('currentStoryId');
      if (!storyId) {
        throw new Error('未找到当前故事，请先选择或创建故事');
      }

      if (!newChapterTitle.trim()) {
        toast.error('章节标题不能为空');
        return;
      }

      // 先关闭对话框，避免操作延迟
      setShowCreateChapterDialog(false);
      
      // 创建章节
      const response = await fetch(`/api/stories/${storyId}/chapters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newChapterTitle,
          content: '',
          order: chapters.length + 1,
          wordCount: 0
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '创建章节失败');
      }
      
      const newChapter = await response.json();
      console.log('创建新章节成功:', newChapter);

      // 更新章节列表
      setChapters(prevChapters => {
        const updatedChapters = [...prevChapters, newChapter];
        return updatedChapters.sort((a, b) => a.order - b.order);
      });

      // 更新最新章节列表
      setRecentChapters(prevRecent => {
        const updatedRecent = [...prevRecent, newChapter];
        const sortedRecent = updatedRecent
          .sort((a, b) => b.order - a.order)
          .slice(0, 10);
        return sortedRecent;
      });

      // 更新总章节数（使用当前章节数加1）
      setTotalChapters(prevTotal => {
        const newTotal = prevTotal + 1;
        console.log('更新总章节数:', newTotal);
        return newTotal;
      });

      // 自动加载新创建的章节
      await loadChapter(newChapter.id);

      toast.success('创建章节成功');
      
      // 重置标题
      setNewChapterTitle('');

    } catch (error) {
      console.error('创建章节失败:', error);
      toast.error(error instanceof Error ? error.message : '创建章节失败，请稍后重试');
    }
  };

  // 添加取消创建章节的函数
  const handleCancelAddChapter = () => {
    setShowCreateChapterDialog(false);
    setNewChapterTitle('');
  };

  // 修改加载章节列表的函数
  const loadChapterList = async () => {
    try {
      setIsChapterLoading(true);
      console.log('【loadChapterList】开始加载章节列表...');
      
      const storyId = localStorage.getItem('currentStoryId');
      console.log('【loadChapterList】当前故事ID:', storyId);
      
      if (!storyId) {
        console.log('【loadChapterList】未找到当前故事ID，跳过加载章节');
        setIsChapterLoading(false);
        return;
      }

      // 1. 获取最新章节列表
      console.log(`【loadChapterList】请求API: /api/stories/${storyId}/chapters/recent?limit=10`);
      const response = await fetch(`/api/stories/${storyId}/chapters/recent?limit=10`);
      console.log('【loadChapterList】API响应状态:', response.status);
      
      if (!response.ok) {
        throw new Error(`获取章节列表失败: ${response.status}`);
      }
      
      const chapters = await response.json();
      console.log('【loadChapterList】API返回数据:', chapters);
      
      // 确保chapters是数组
      if (!Array.isArray(chapters)) {
        throw new Error('API返回的数据格式不正确');
      }
      
      // 处理后的章节数据已经是最新的章节在前面（降序排列）
      const processedChapters = chapters.map(chapter => ({
        ...chapter,
        status: chapter.status?.toLowerCase() || 'draft' // 将状态转为小写，如果为空则默认为'draft'
      }));
      console.log('【loadChapterList】处理后的章节数据:', processedChapters);
      
      // 2. 获取章节统计信息（总数）
      console.log(`【loadChapterList】请求API: /api/stories/${storyId}/chapters/stats`);
      const statsResponse = await fetch(`/api/stories/${storyId}/chapters/stats`);
      
      if (!statsResponse.ok) {
        throw new Error(`获取章节统计信息失败: ${statsResponse.status}`);
      }
      
      const stats = await statsResponse.json();
      console.log('【loadChapterList】章节统计信息状态stats:', stats);
      
      // 更新总章节数
      const total = stats.total || processedChapters.length;
      setTotalChapters(total);
      console.log('【loadChapterList】设置总章节数:', total);
      
      // 保留原始章节顺序（已经是最新的在前面）
      const sortedRecentChapters = [...processedChapters];
      console.log('【loadChapterList】最新章节:', sortedRecentChapters);
      
      // 全部章节按照升序排列，用于完整显示
      const sortedChapters = [...processedChapters].sort((a, b) => a.order - b.order);
      console.log('【loadChapterList】按顺序排序后的全部章节:', sortedChapters);
      
      // 更新最新章节列表和全部章节列表
      setRecentChapters(sortedRecentChapters); // 保持API返回的顺序（最新的在前）
      setChapters(sortedChapters); // 全部章节按升序排列
      setFilteredChapters([]); // 清空搜索结果
      setChapterSearchKeyword(''); // 清空搜索关键词
      setIsSearching(false); // 重置搜索状态
      console.log('【loadChapterList】已更新章节状态');

      // 3. 计算历史章节分组
      if (total > 10) {
        console.log('【loadChapterList】开始计算历史章节分组...');
        const groupSize = 30; // 每组30章
        const groups = [];
        
        // 计算历史章节的开始序号：总数 - 已显示的最新章节数量
        const latestChapterOrderMin = Math.min(...processedChapters.map(c => c.order)); // 最新显示章节中序号最小的
        
        console.log('【loadChapterList】当前显示的最小章节序号:', latestChapterOrderMin);
        
        // 历史章节从小于当前显示最小序号的章节开始
        let currentOrder = latestChapterOrderMin - 1;
        
        while (currentOrder > 0) {
          const end = currentOrder;
          const start = Math.max(1, end - groupSize + 1);
          
          if (start <= end) {
            groups.push({
              start: end,
              end: start,
              count: end - start + 1
            });
          }
          
          currentOrder = start - 1;
        }
        
        console.log('【loadChapterList】计算出的历史章节分组:', groups);
        setHistoricalChapters(groups);
      } else {
        console.log('【loadChapterList】章节总数不足10，无需分组');
        setHistoricalChapters([]);
      }

      // 3. 如果当前没有选中的章节，且有章节存在，则加载第一个章节
      if (!currentChapterId && sortedRecentChapters.length > 0) {
        console.log('【loadChapterList】准备加载第一个章节:', sortedRecentChapters[0].id);
        await loadChapter(sortedRecentChapters[0].id);
      }

    } catch (error) {
      console.error('【loadChapterList】加载章节列表失败:', error);
      showError(error, '加载章节列表失败，请稍后重试');
      // 重置所有相关状态
      setChapters([]);
      setRecentChapters([]);
      setHistoricalChapters([]);
      setTotalChapters(0);
      setFilteredChapters([]);
      setChapterSearchKeyword('');
      setIsSearching(false);
    } finally {
      setIsChapterLoading(false);
      console.log('【loadChapterList】章节加载完成');
    }
  };

  // 下面的这些功能需要验证一下。。。。。
  // 添加加载更多章节的函数
  const loadChapterGroup = async (start: number, end: number) => {
    try {
      setIsLoadingMoreChapters(true);
      
      const storyId = localStorage.getItem('currentStoryId');
      if (!storyId) {
        throw new Error('未找到当前故事ID');
      }
      
      const response = await fetch(`/api/stories/${storyId}/chapters/range?start=${start}&end=${end}`);
      if (!response.ok) {
        throw new Error('获取章节范围失败');
      }
      
      const data = await response.json();
      console.log(`获取章节范围 ${start}-${end} 数据:`, data);
      
      // 确保数据是数组并处理状态大小写
      const rangeChapters = Array.isArray(data) ? data.map(chapter => ({
        ...chapter,
        status: chapter.status?.toLowerCase() as 'draft' | 'pending' | 'published'  // 转换状态为小写
      })) : [];
      
      // 按照章节序号排序
      const sortedRangeChapters = rangeChapters.sort((a: ChapterType, b: ChapterType) => b.order - a.order);
      
      // 更新章节列表，添加新加载的章节
      setChapters(prev => {
        // 创建一个新数组，包含之前的章节和新加载的章节
        const newChapters = [...prev];
        
        // 添加新加载的章节，避免重复
        sortedRangeChapters.forEach(chapter => {
          if (!newChapters.some(ch => ch.id === chapter.id)) {
            newChapters.push(chapter);
          }
        });
        
        // 按照章节序号排序
        return newChapters.sort((a, b) => b.order - a.order);
      });
      
      return sortedRangeChapters;
    } catch (error) {
      console.error(`加载章节范围 ${start}-${end} 失败:`, error);
      showError(error, '加载更多章节失败');
      return [];
    } finally {
      setIsLoadingMoreChapters(false);
    }
  };

  // 添加展开章节组的函数
  const toggleChapterGroup = async (groupIndex: number) => {
    // 检查是否已经展开
    if (expandedGroups.includes(groupIndex)) {
      // 已展开，则折叠
      setExpandedGroups(prev => prev.filter(idx => idx !== groupIndex));
    } else {
      // 未展开，则展开并加载数据
      const group = historicalChapters[groupIndex];
      await loadChapterGroup(group.start, group.end);
      setExpandedGroups(prev => [...prev, groupIndex]);
    }
  };

  // 添加显示所有章节的函数
  const handleShowAllChapters = async () => {
    setShowAllChapters(true);
    
    // 加载所有历史章节组
    for (let i = 0; i < historicalChapters.length; i++) {
      if (!expandedGroups.includes(i)) {
        const group = historicalChapters[i];
        await loadChapterGroup(group.start, group.end);
      }
    }
    
    // 展开所有组
    setExpandedGroups(historicalChapters.map((_, index) => index));
  };

  // 添加章节搜索函数
  const handleSearchChapters = async (keyword: string) => {
    setChapterSearchKeyword(keyword);
    
    if (!keyword.trim()) {
      setIsSearching(false);
      setFilteredChapters([]);
      return;
    }
    
    setIsSearching(true);
    
    try {
      const storyId = localStorage.getItem('currentStoryId');
      if (!storyId) {
        throw new Error('未找到当前故事ID');
      }
      
      const response = await fetch(`/api/stories/${storyId}/chapters/search?keyword=${encodeURIComponent(keyword)}`);
      if (!response.ok) {
        throw new Error('搜索章节失败');
      }
      
      const data = await response.json();
      console.log('搜索章节结果:', data);
      
      // 确保数据是数组
      const searchResults = Array.isArray(data) ? data : [];
      
      // 按照章节序号排序
      const sortedResults = searchResults.sort((a: ChapterType, b: ChapterType) => b.order - a.order);
      setFilteredChapters(sortedResults);
    } catch (error) {
      console.error('搜索章节失败:', error);
      showError(error, '搜索章节失败');
      setFilteredChapters([]);
    }
  };

  // 添加清除搜索的函数
  const clearSearch = () => {
    setChapterSearchKeyword('');
    setIsSearching(false);
    setFilteredChapters([]);
  };

  // 添加一个 ref 来保存章节列表的滚动位置
  const chapterListRef = useRef<HTMLDivElement>(null);

  // 在组件的状态声明部分
  const [loadingChapterIds, setLoadingChapterIds] = useState<Set<string>>(new Set());

  // 修改 loadChapter 函数中的 Set 操作
  const loadChapter = async (chapterId: string) => {
    try {
      if (chapterId === currentChapterId) {
        return null;
      }

      setLoadingChapterIds((prev: Set<string>) => {
        const newSet = new Set(prev);
        newSet.add(chapterId);
        return newSet;
      });

      // 保存当前滚动位置
      const scrollPosition = chapterListRef.current?.scrollTop;

      // 获取当前故事ID
      const storyId = localStorage.getItem('currentStoryId');
      if (!storyId) {
        throw new Error('未找到当前故事');
      }

      // 获取章节内容
      console.log('【loadChapter】开始加载章节:', chapterId);
      const response = await fetch(`/api/stories/${storyId}/chapters/${chapterId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `加载章节失败 (${response.status})`);
      }

      console.log('【loadChapter】加载章节内容:', response);
      const chapter = await response.json();
      
      
      // 获取章节插画
      console.log('【loadChapter】开始加载章节插画');
      const illustrationsResponse = await fetch(`/api/stories/${storyId}/chapters/${chapterId}/images`);
      if (!illustrationsResponse.ok) {
        console.error('加载插画失败:', await illustrationsResponse.text());
      } else {
        const illustrations = await illustrationsResponse.json();
        console.log('【loadChapter】获取到插画数量:', illustrations.length);
        
        // 处理章节内容中的图片
        let processedContent = chapter.content || '';
        
        // 遍历所有插画，将文件路径设置到图片src
        if (illustrations.length > 0) {
          // 使用 DOMParser 解析 HTML
          const parser = new DOMParser();
          const doc = parser.parseFromString(processedContent, 'text/html');
          let hasUpdates = false;

          illustrations.forEach((illustration: Illustration) => {
            if (!illustration.filePath) {
              console.log(`【loadChapter】插画 ${illustration.id} 没有文件路径，跳过处理`);
              return;
            }
            
            // 规范化文件路径，确保只有一个 uploads 前缀
            const normalizedPath = illustration.filePath.replace(/^uploads\//, '');
            const imageUrl = `${API_URL}/uploads/${normalizedPath}`;
            console.log(`【loadChapter】处理插画 ${illustration.id}, URL: ${imageUrl}`);
            
            // 查找对应的图片标签
            const img = doc.querySelector(`img[data-illustration-id="${illustration.id}"]`);
            
            if (img) {
              console.log(`【loadChapter】找到图片标签，更新src属性`);
              img.setAttribute('src', imageUrl);
              hasUpdates = true;
            } else {
              // 如果找不到对应的图片标签，说明这个图片可能是新上传的
              // 我们应该保留它，但不自动添加到内容中
              console.log(`【loadChapter】未找到插画 ${illustration.id} 对应的图片标签，这可能是一个新上传的图片`);
            }
          });

          if (hasUpdates) {
            // 获取更新后的 HTML 内容
            processedContent = doc.body.innerHTML;
            console.log('【loadChapter】更新后的内容:', processedContent);
          }
        }
        
        // 更新章节内容
        chapter.content = processedContent;
        chapter.illustrations = illustrations;
      }

      const wordCount = calculateWordCount(chapter.content || '');      chapter.wordCount = wordCount;

      // 成功获取数据后，再更新状态
      setCurrentChapterId(chapterId);
      setIsChapterLoading(true);
      setContent(chapter.content || '');
      setLastSavedContent(chapter.content || '');
      setCurrentChapter(chapter);
      setDisplayWordCount(wordCount);
      setHasUnsavedChanges(false);
      
      // 恢复滚动位置
      if (scrollPosition !== undefined && chapterListRef.current) {
        requestAnimationFrame(() => {
          if (chapterListRef.current) {
            chapterListRef.current.scrollTop = scrollPosition;
          }
        });
      }

      setIsChapterLoading(false);
      // 移除加载状态
      setLoadingChapterIds((prev: Set<string>) => {
        const newSet = new Set(prev);
        newSet.delete(chapterId);
        return newSet;
      });

      return chapter;
    } catch (error) {
      // 发生错误时也要移除加载状态
      setLoadingChapterIds((prev: Set<string>) => {
        const newSet = new Set(prev);
        newSet.delete(chapterId);
        return newSet;
      });
      showError(error, '加载章节失败，请稍后重试');
      return null;
    }
  };

  // 处理章节发布按钮点击
  const handlePublishChapter = async (chapterId: string) => {
    if (!address) {
      toast.error('请先连接钱包', {
        style: {
          background: '#fff',
          color: '#333',
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        },
        position: 'top-center',
      });
      return;
    }

    // 检查是否是当前选定的章节
    if (chapterId !== currentChapterId) {
      toast.error('请先选定要发布的章节', {
        style: {
          background: '#fff',
          color: '#333',
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        },
        position: 'top-center',
        icon: '⚠️',
        duration: 3000,
      });
      return;
    }

    // 显示发布确认对话框
    setChapterToPublish(chapterId);
    setShowPublishConfirm(true);
  };

  // 确认发布的处理函数
  const handleConfirmPublish = async () => {
    if (!chapterToPublish || !address) return;

    try {
      console.log('【handleConfirmPublish】开始处理发布，章节ID:', chapterToPublish);

      // 检查章节内容和字数
      const wordCount = calculateWordCount(content || '');
      if (!content || content.trim().length === 0 || wordCount === 0) {
        throw new Error('章节内容不能为空，请添加有效内容后再发布');
      }
      console.log('【handleConfirmPublish】章节字数:', wordCount);

      // 设置初始进度
      setIsCreating(true);
      setCreateProgress(0);
      
      const storyId = localStorage.getItem('currentStoryId');
      if (!storyId) {
        throw new Error('未找到当前故事');
      }
      console.log('【handleConfirmPublish】当前故事ID:', storyId);
      
      // 提前获取故事信息并验证作者身份 - 10%进度
      console.log('【handleConfirmPublish】准备获取故事信息并验证作者身份');
      setCreateStatus(CreateStatus.IDLE);
      setCreateProgress(10);
      
      const storyResponse = await fetch(`/api/stories/${storyId}`);
      if (!storyResponse.ok) {
        throw new Error('获取故事信息失败');
      }

      const storyData = await storyResponse.json();
      console.log('【handleConfirmPublish】故事信息:', storyData);
      
      if (!storyData) {
        throw new Error('故事不存在');
      }

      console.log('【handleConfirmPublish】故事作者ID:', storyData.authorId);
      console.log('【handleConfirmPublish】当前钱包地址:', address);  
      // 验证作者身份
      if (storyData.author.address !== address) {
        throw new Error('只有作者才能发布章节');
      }
      console.log('【handleConfirmPublish】作者身份验证通过');
      
      // 检查故事是否已上链
      if (!storyData.chainId) {
        throw new Error('故事未上链，请先在区块链上发布故事');
      }
      console.log('【handleConfirmPublish】故事链上 ID:', storyData.chainId);
      const storyChainId = storyData.chainId;
      if (!storyChainId || isNaN(storyChainId)) {
        throw new Error('无效的故事链上 ID');
      }
      
      // 先保存最新内容 - 20%进度
      setCreateProgress(20);
      await handleSaveClick({ stopPropagation: () => {} } as React.MouseEvent, chapterToPublish);
      console.log('【handleConfirmPublish】已保存最新内容');

      // 获取当前章节
      const currentChapter = chapters.find(ch => ch.id === chapterToPublish);
      if (!currentChapter) {
        throw new Error('未找到当前章节');
      }
      console.log('【handleConfirmPublish】当前章节信息:', currentChapter);

  
      // 调用合约上传章节数据 - 30%进度
      showSuccess('正在将章节数据上传到区块链...');
      setCreateStatus(CreateStatus.UPLOADING);
      setCreateProgress(30);
      console.log('【handleConfirmPublish】准备上传章节数据到区块链');

      // 检查是否有可用的以太坊提供者
      if (!window.ethereum) {
        throw new Error('未检测到以太坊钱包，请安装 MetaMask 或其他兼容的钱包');
      }

      // 获取合约实例 - 40%进度
      setCreateProgress(40);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const storyManagerContract = new ethers.Contract(
        CONTRACT_ADDRESSES.StoryManager,
        CONTRACT_ABIS.StoryManager,
        signer
      );
      console.log('【handleConfirmPublish】合约实例已创建');

      // 获取链上当前章节总数 - 50%进度
      setCreateStatus(CreateStatus.CREATING_CONTRACT);
      setCreateProgress(50);
      console.log('【handleConfirmPublish】准备获取链上章节总数, storyChainId:', storyChainId);
      const chainStory = await storyManagerContract.stories(storyChainId);
      console.log('【handleConfirmPublish】链上故事数据:', chainStory);
      
      // 检查chapterCount的类型并正确处理
      const currentCount = typeof chainStory.chapterCount === 'object' && chainStory.chapterCount.toNumber 
        ? chainStory.chapterCount.toNumber() 
        : Number(chainStory.chapterCount);
      const nextCount = currentCount + 1;
      console.log('【handleConfirmPublish】当前章节数:', currentCount, '下一章节数:', nextCount);

      // 调用合约的 updateChapter 函数 - 60%进度
      setCreateProgress(60);
      console.log('【handleConfirmPublish】准备调用合约updateChapter函数');
      console.log('【handleConfirmPublish】章节字数:', wordCount);
      const tx = await storyManagerContract.updateChapter(
        storyChainId,           // 故事的链上ID
        nextCount,    // 章节数目
        // currentChapter.title,    // 章节标题
        '',                      // 内容摘要，这里不使用 contentCid
        wordCount                // 章节字数
      );
      console.log('【handleConfirmPublish】交易已提交:', tx.hash);

      showSuccess('交易已提交，等待确认...');
      
      // 等待交易确认 - 70%进度
      setCreateProgress(70);
      console.log('【handleConfirmPublish】等待交易确认');
      const receipt = await tx.wait();
      console.log('【handleConfirmPublish】交易已确认:', receipt);
      
      showSuccess('章节数据已成功上传到区块链！');
      console.log('章节上链成功，交易哈希:', receipt.transactionHash);

      // 使用 API 客户端发布章节，同时传递交易哈希 - 80%进度
      setCreateStatus(CreateStatus.SAVING_DATABASE);
      setCreateProgress(80);
      console.log('【handleConfirmPublish】准备调用API发布章节, 参数:', {
        storyId, 
        chapterToPublish, 
        authorAddress: address, 
        txHash: receipt.transactionHash
      });
      const publishResponse = await fetch(`/api/stories/${storyId}/chapters/${chapterToPublish}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          authorAddress: address,
          txHash: receipt.transactionHash // 将交易哈希传递给后端
        })
      });
      console.log('【handleConfirmPublish】API响应状态:', publishResponse.status);

      if (!publishResponse.ok) {
        const errorData = await publishResponse.json();
        console.error('【handleConfirmPublish】API返回错误:', errorData);
        throw new Error(errorData.error || '发布失败');
      }

      // 更新章节列表 - 90%进度
      setCreateProgress(90);
      const publishedChapter = await publishResponse.json();
      console.log('【handleConfirmPublish】发布成功，返回数据:', publishedChapter);
      
      // 更新章节列表
      console.log('【handleConfirmPublish】准备更新章节列表');
      await updateChapterList();
      
      // 更新本地状态中的章节状态
      console.log('【handleConfirmPublish】更新本地章节状态');
      // 更新chapters状态
      setChapters(prevChapters => 
        prevChapters.map(ch => 
          ch.id === chapterToPublish 
            ? { ...ch, status: 'published' } 
            : ch
        )
      );
      
      // 更新recentChapters状态
      setRecentChapters(prevRecent => 
        prevRecent.map(ch => 
          ch.id === chapterToPublish 
            ? { ...ch, status: 'published' } 
            : ch
        )
      );
      
      // 如果在搜索结果中，也更新搜索结果中的状态
      if (isSearching) {
        setFilteredChapters(prevFiltered => 
          prevFiltered.map(ch => 
            ch.id === chapterToPublish 
              ? { ...ch, status: 'published' } 
              : ch
          )
        );
      }
      
      console.log('【handleConfirmPublish】章节列表已更新');

      // 完成 - 100%进度
      setCreateStatus(CreateStatus.COMPLETED);
      setCreateProgress(100);
      // showSuccess('章节已发布成功');
      // 显示成功提示
      showCreateSuccess('章节已发布成功!');

      // 关闭确认对话框
      setShowPublishConfirm(false);
      setChapterToPublish(null);
      console.log('【handleConfirmPublish】已关闭确认对话框，流程完成');
    } catch (error: any) {
      console.error('【handleConfirmPublish】发布失败:', error);
      setCreateStatus(CreateStatus.FAILED);
      setCreateProgress(0);
      showError(error, '发布章节失败');
      // 关闭确认对话框
      setShowPublishConfirm(false);
      setChapterToPublish(null);
    } finally {
      setIsCreating(false);
    }
  };

  // 保存章节的函数
  const handleSave = useCallback(async (): Promise<boolean> => {
    console.log('【handleSave】函数被调用');
    console.log('【handleSave】currentChapterId:', currentChapterId);
    console.log('【handleSave】isSaving:', isSaving);
    console.log('【handleSave】content长度:', content.length);
    
    // 检查是否有章节ID和内容
    if (!currentChapterId) {
      console.log('【handleSave】没有当前章节ID，无法保存');
      showError(new Error('没有当前章节'), '请先选择或创建一个章节');
      return false;
    }
    
    if (isSaving) {
      console.log('【handleSave】正在保存中，跳过');
      return false;
    }
    
    if (!content) {
      console.log('【handleSave】没有内容，无法保存');
      showError(new Error('没有内容'), '请先添加内容再保存');
      return false;
    }
    
    setIsSaving(true);
    try {
      // 获取当前故事ID
      const storyId = localStorage.getItem('currentStoryId');
      console.log('【handleSave】当前故事ID:', storyId);
      if (!storyId) {
        throw new Error('未找到当前故事');
      }

      // 提取内容中的临时图片URL和已有图片URL
      console.log('【章节保存-图片处理】原始内容:', content);
      
      // 获取所有图片标签
      const imgTags = content.match(/<img[^>]*>/g) || [];
      console.log('【章节保存-图片处理】所有img标签数量:', imgTags.length);
      
      // 分析所有图片，区分临时图片和已保存的图片
      const allImages = Array.from(content.matchAll(/<img[^>]+src="([^"]+)"[^>]*>/g))
        .map((match, index) => {
          const fullTag = match[0];
          const src = match[1];
          // 图片位置就是它在内容中的索引位置+1
          const position = index + 1;
          
          // 检查是否是临时图片 (blob或data URL)
          const isTemp = src.startsWith('blob:') || src.startsWith('data:');
          
          return {
            src,
            fullTag,
            position,
            isTemp
          };
        });
      
      console.log('【章节保存-图片处理】分析图片结果:', {
        total: allImages.length,
        temp: allImages.filter(img => img.isTemp).length,
        positions: allImages.map(img => img.position)
      });
      console.log('【章节保存-图片处理】所有图片的信息:', allImages);
      
      // 筛选出需要上传的临时图片
      const tempImages = allImages.filter(img => img.isTemp);
      console.log('【章节保存-图片处理】需要上传的临时图片数量:', tempImages.length);

      // 处理所有图片的URL，无论是新上传的还是已有的
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      let processedContent = content;
      
      // 先处理所有已有图片，更新它们的URL
      const permanentImages = allImages.filter(img => !img.isTemp);
      for (const img of permanentImages) {
        // 构建正确的文件名和路径
        const fileName = `image-${img.position}.png`;
        const imagePath = `${BACKEND_URL}/uploads/drafts/${storyId}/${currentChapterId}/${fileName}`;
        
        console.log(`【章节保存-图片处理】处理永久图片:`, {
          position: img.position,
          oldSrc: img.src,
          newSrc: imagePath
        });
        
        // 无论图片URL是否符合预期，都替换整个图片标签
        const searchRegex = new RegExp(`<img[^>]*src="${img.src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`, 'g');
        processedContent = processedContent.replace(
          searchRegex, 
          `<img class="chapter-image editor-image" src="${imagePath}" data-position="${img.position}" data-filename="${fileName}" alt="${img.fullTag.match(/alt="([^"]*)"/) ? img.fullTag.match(/alt="([^"]*)"/)[1] : ''}" title="${img.fullTag.match(/title="([^"]*)"/) ? img.fullTag.match(/title="([^"]*)"/)[1] : ''}" width="${img.fullTag.match(/width="([^"]*)"/) ? img.fullTag.match(/width="([^"]*)"/)[1] : ''}" height="${img.fullTag.match(/height="([^"]*)"/) ? img.fullTag.match(/height="([^"]*)"/)[1] : ''}" draggable="true">`
        );
      }
      
      // 如果有临时图片，上传并替换
      if (tempImages.length > 0) {
        console.log('【章节保存-图片处理】开始处理临时图片');
        
        // 获取每个临时图片的 Blob 数据
        const imageBlobs = await Promise.all(
          tempImages.map(async ({ src }, index) => {
            console.log(`【章节保存-图片处理】获取第${index + 1}个图片的Blob数据:`, src);
            
            let blob: Blob;
            if (src.startsWith('blob:')) {
              // 处理 blob URL
              const response = await fetch(src);
              blob = await response.blob();
            } else if (src.startsWith('data:')) {
              // 处理 data URL
              const base64Data = src.split(',')[1];
              const byteCharacters = atob(base64Data);
              const byteArrays = [];
              
              for (let offset = 0; offset < byteCharacters.length; offset += 512) {
                const slice = byteCharacters.slice(offset, offset + 512);
                const byteNumbers = new Array(slice.length);
                
                for (let i = 0; i < slice.length; i++) {
                  byteNumbers[i] = slice.charCodeAt(i);
                }
                
                const byteArray = new Uint8Array(byteNumbers);
                byteArrays.push(byteArray);
              }
              
              blob = new Blob(byteArrays, { type: 'image/jpeg' });
            } else {
              // 默认情况，创建一个空的Blob
              blob = new Blob([], { type: 'image/jpeg' });
            }
            
            return blob;
          })
        );

        // 上传图片
        console.log('【章节保存-图片处理】开始上传图片');
        const uploadedImages = [];
        
        for (let i = 0; i < imageBlobs.length; i++) {
          // 使用图片在内容中的位置索引
          const position = tempImages[i].position;
          const fileName = `image-${position}.png`;
          
          // 为每个图片创建一个新的FormData
          const formData = new FormData();
          formData.append('image', imageBlobs[i], fileName);
          formData.append('position', position.toString());
          
          console.log(`【章节保存-图片处理】准备上传图片${i + 1}:`, {
            position,
            fileName,
            blobSize: imageBlobs[i].size
          });

          try {
            const uploadUrl = `/api/stories/${storyId}/chapters/${currentChapterId}/images`;
            const uploadResponse = await fetch(uploadUrl, {
              method: 'POST',
              body: formData
            });
            
            if (!uploadResponse.ok) {
              console.error(`【章节保存-图片处理】图片${i + 1}上传失败:`, {
                status: uploadResponse.status,
                statusText: uploadResponse.statusText
              });
              continue;
            }
            
            const responseData = await uploadResponse.json();
            console.log(`【章节保存-图片处理】图片${i + 1}上传成功:`, responseData);
            uploadedImages.push({
              ...responseData,
              position
            });
          } catch (error) {
            console.error(`【章节保存-图片处理】图片${i + 1}上传出错:`, error);
            continue;
          }
        }
        
        console.log('【章节保存-图片处理】图片上传结果:', uploadedImages);
        
        // 替换内容中的临时URL为实际URL
        console.log('【章节保存-图片处理】开始替换临时URL为实际URL');
        
        for (const tempImage of tempImages) {
          const position = tempImage.position;
          const fileName = `image-${position}.png`;
          const imagePath = `${BACKEND_URL}/uploads/drafts/${storyId}/${currentChapterId}/${fileName}`;
            
          console.log(`【章节保存-图片处理】处理图片:`, {
            position,
            oldSrc: tempImage.src,
            newSrc: imagePath
          });
          
          // 替换图片URL，添加位置和文件名属性
          const searchRegex = new RegExp(`src="${tempImage.src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g');
          processedContent = processedContent.replace(
            searchRegex, 
            `src="${imagePath}" data-position="${position}" data-filename="${fileName}"`
          );
        }
        
        console.log('【章节保存-图片处理】URL替换完成');
      }
      
      // 最终检查所有图片标签
      const finalImageTags = Array.from(processedContent.matchAll(/<img[^>]+src="([^"]+)"[^>]*>/g));
      console.log('【章节保存-图片处理】最终图片数量:', finalImageTags.length);
      
      console.log('【章节保存-图片处理】内容处理完成, 长度变化:', {
          before: content.length,
          after: processedContent.length
      });
      
      // 计算字数
      const wordCount = calculateWordCount(processedContent);
      console.log('【handleSave】字数:', wordCount);
      
      // 保存章节内容
      console.log('【handleSave】开始发送保存请求');
      console.log('【handleSave】processedContent',processedContent);
      // console.log('【handleSave】准备发送的请求体:', {
      //   content: processedContent,
      //   title: currentChapter?.title,
      //   wordCount
      // });
      const saveResponse = await fetch(`/api/stories/${storyId}/chapters/${currentChapterId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: processedContent, // 使用处理后的内容
          title: currentChapter?.title,
          wordCount // 添加字数
        }),
      });
      console.log('【handleSave】保存请求已发送，状态码:', saveResponse.status);

      if (!saveResponse.ok) {
        const error = await saveResponse.json();
        throw new Error(error.error || '保存失败');
      }

      const savedChapter = await saveResponse.json();
      console.log('【handleSave】保存成功，返回数据:', savedChapter);
      
      // 更新当前章节
      setCurrentChapter(savedChapter);
      setContent(processedContent);
      
      // 更新章节列表中的字数
      setChapters(prevChapters => 
        prevChapters.map(ch => 
          ch.id === savedChapter.id ? { ...ch, wordCount: savedChapter.wordCount } : ch
        )
      );
      
      // 更新最新章节列表中的字数
      setRecentChapters(prevRecent => 
        prevRecent.map(ch => 
          ch.id === savedChapter.id ? { ...ch, wordCount: savedChapter.wordCount } : ch
        )
      );
      
      // 如果在搜索结果中，也更新搜索结果中的字数
      if (isSearching) {
        setFilteredChapters(prevFiltered => 
          prevFiltered.map(ch => 
            ch.id === savedChapter.id ? { ...ch, wordCount: savedChapter.wordCount } : ch
          )
        );
      }
      
      setLastSavedContent(processedContent);
      setHasUnsavedChanges(false);
      setDisplayWordCount(wordCount); // 更新显示的字数
      
      localStorage.removeItem(`draft_${currentChapterId}`);
      showSuccess('保存成功');
      return true;
    } catch (error) {
      console.error('【handleSave】保存失败:', error);
      showError(error, '保存失败，请稍后重试');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [currentChapterId, content, isSaving, currentChapter, chapters, isSearching]);

  // 更新章节列表函数
  const updateChapterList = async () => {
    const storyId = localStorage.getItem('currentStoryId');
    if (!storyId) return null;
    
    try {
      // 获取章节列表
      const response = await fetch(`/api/stories/${storyId}/chapters`);
      if (!response.ok) {
        throw new Error('获取章节列表失败');
      }
      const updatedChapters = await response.json();
      const sortedChapters = updatedChapters.sort((a: ChapterType, b: ChapterType) => a.order - b.order);
      setChapters(sortedChapters);
      return sortedChapters;
    } catch (error) {
      showError(error, '获取章节列表失败');
      return null;
    }
  };

  // 处理确认删除章节
  const handleConfirmDelete = async () => {
    if (!chapterToDelete) return;
    
    try {
      const storyId = localStorage.getItem('currentStoryId');
      if (!storyId) {
        throw new Error('未找到当前故事');
      }

      // 获取要删除的章节信息
      const chapterToBeDeleted = chapters.find(ch => ch.id === chapterToDelete);
      if (!chapterToBeDeleted) {
        throw new Error('未找到要删除的章节');
      }

      // 检查章节状态，如果是已发布状态则不允许删除
      if (chapterToBeDeleted.status === 'published') {
        throw new Error('已发布的章节不能删除');
      }
      
      // 使用 API 客户端删除章节
      const response = await fetch(`/api/stories/${storyId}/chapters/${chapterToDelete}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '删除失败');
      }
      
      // 更新所有相关状态
      setChapters(prevChapters => prevChapters.filter(ch => ch.id !== chapterToDelete));
      setRecentChapters(prevRecent => prevRecent.filter(ch => ch.id !== chapterToDelete));
      setFilteredChapters(prevFiltered => prevFiltered.filter(ch => ch.id !== chapterToDelete));
      setTotalChapters(prev => Math.max(0, prev - 1));
      
      // 如果删除的是当前章节，清空编辑器并重置相关状态
      if (currentChapter?.id === chapterToDelete) {
        setContent('');
        setCurrentChapter(null);
        setCurrentChapterId(null);
        setHasUnsavedChanges(false);
        setLastSavedContent('');
        setDisplayWordCount(0);
      }
      
      // 关闭对话框
      setShowDeleteDialog(false);
      setChapterToDelete(null);
      
      showSuccess('删除成功');

      // 重新加载章节列表以确保数据同步
      await loadChapterList();
    } catch (error) {
      showError(error, '删除失败');
      // 关闭对话框
      setShowDeleteDialog(false);
      setChapterToDelete(null);
    }
  };

  // 添加字数计算函数
  const calculateWordCount = (content: string): number => {
    if (!content) return 0;
    
    // 移除HTML标签
    const plainText = content.replace(/<[^>]*>/g, '');
    
    // 匹配中文字符（包括中文标点）
    const chineseChars = (plainText.match(/[\u4e00-\u9fa5]|[\u3000-\u303f]|[\uff00-\uffef]/g) || []).length;
    
    // 匹配英文单词（包括数字）
    const englishWords = plainText
      .replace(/[\u4e00-\u9fa5]|[\u3000-\u303f]|[\uff00-\uffef]/g, ' ') // 移除中文字符
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0).length;
    
    // 返回中文字符数和英文单词数之和
    return chineseChars + englishWords;
  };

  // 获取当前编辑器字数
  const getCurrentWordCount = useCallback((): number => {
    if (!editorRef.current) return 0;
    const text = editorRef.current.getText();
    if (!text) return 0;
    return text.replace(/\s+/g, '').length;
  }, []);

  // 添加章节标题状态管理
  const [editingTitle, setEditingTitle] = useState('');

  // 修改章节更新函数
  const handleChapterUpdate = async (chapterId: string, field: keyof ChapterType, value: any) => {
    try {
      const storyId = localStorage.getItem('currentStoryId');
      if (!storyId) {
        throw new Error('未找到当前故事');
      }

      // 发送更新请求到服务器
      const response = await fetch(`/api/stories/${storyId}/chapters/${chapterId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [field]: value,
        }),
      });

      if (!response.ok) {
        throw new Error('更新章节失败');
      }

      const updatedChapter = await response.json();
      console.log('章节更新成功:', updatedChapter);

      // 更新本地状态
      setChapters(prevChapters => 
        prevChapters.map(ch => 
          ch.id === chapterId ? { ...ch, [field]: value } : ch
        )
      );

      // 更新最新章节列表
      setRecentChapters(prevRecent => 
        prevRecent.map(ch => 
          ch.id === chapterId ? { ...ch, [field]: value } : ch
        )
      );

      // 如果是当前正在编辑的章节，也更新currentChapter
      if (currentChapter?.id === chapterId) {
        setCurrentChapter(updatedChapter);
      }

      toast.success('更新成功');
    } catch (error) {
      console.error('更新章节失败:', error);
      toast.error('更新失败，请重试');
      
      // 如果失败，回滚本地状态
      loadChapterList();
    }
  };

  // 处理编辑章节按钮点击
  const handleEditClick = (e: React.MouseEvent, chapterId: string, currentTitle: string) => {
    e.stopPropagation();
    setEditingChapterId(chapterId);
  };

  // 处理标题输入变更
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 限制标题长度为50个字符
    if (e.target.value.length <= 50) {
      setEditingTitle(e.target.value);
    }
  };

  // 处理标题输入框按键事件
  const handleTitleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>, chapterId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = e.currentTarget.value.trim();
      if (value) {
        await handleChapterUpdate(chapterId, 'title', value);
        setEditingChapterId(null);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditingChapterId(null);
    }
  };

  // 处理标题编辑完成
  const handleTitleBlur = async (e: React.FocusEvent<HTMLInputElement>, chapterId: string) => {
    const value = e.target.value.trim();
    const chapter = chapters.find(ch => ch.id === chapterId);
    if (value && chapter && value !== chapter.title) {
      await handleChapterUpdate(chapterId, 'title', value);
    }
    setEditingChapterId(null);
  };

  // 处理章节保存按钮点击
  const handleSaveClick = async (e: React.MouseEvent, chapterId: string) => {
    e.stopPropagation();
    setEditingChapterId(null);
    
    try {
      const storyId = localStorage.getItem('currentStoryId');
      if (!storyId) {
        throw new Error('未找到当前故事');
      }

      // 获取当前章节
      const currentChapter = chapters.find(ch => ch.id === chapterId);
      if (!currentChapter) {
        throw new Error('未找到当前章节');
      }

      // 计算字数
      const wordCount = calculateWordCount(content);

      // 使用 API 客户端保存章节草稿
      const response = await fetch(`/api/stories/${storyId}/chapters/${chapterId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content,
          title: currentChapter.title,
          wordCount // 添加字数
        })
      });

      if (!response.ok) {
        throw new Error('保存失败');
      }

      const savedChapter = await response.json();
      setLastSavedContent(content);
      setHasUnsavedChanges(false);
      showSuccess('保存成功');
      
      // 更新章节列表
      await updateChapterList();
    } catch (error) {
      showError(error, '保存失败');
    }
  };

  // 处理删除章节按钮点击
  const handleDeleteClick = (e: React.MouseEvent, chapterId: string) => {
    e.stopPropagation();
    setChapterToDelete(chapterId);
    setShowDeleteDialog(true);
  };

  // 添加故事大纲
  const addOutline = (title: string, description: string) => {
    if (!currentChapter) return
    
    const newOutline: Outline = {
      id: Date.now().toString(),
      title,
      description,
      chapterId: currentChapter.id
    }
    
    setOutlines([...outlines, newOutline])
    setShowOutlineDialog(false)
  }

  /**
   * 编辑框工具栏
  */

  // 编辑框工具栏
  const renderToolbar = () => (
  <div className={styles.toolbar}>
    <div className={styles.toolbarLeft}>
      <button
        className={`${styles.iconButton} ${showChapters ? styles.active : ''}`}
        onClick={toggleChapters}
        title="章节管理"
      >
        <FaList />
      </button>
      <button
        className={`${styles.iconButton} ${showSettings ? styles.active : ''}`}
        onClick={toggleSettings}
        title="作品创建"
      >
        <FaPlus />
      </button>
      {/* 这个本意是按钮触发作品章节显示弹窗，以显示更多内容，但是设计上还没有确定，先放一放 */}
      {/* <button
        className={`${styles.iconButton}`}
        onClick={handleShowStorySelector}
        title="我的作品"
        style={{ marginLeft: '12px' }}
      >
        <FaBook />
      </button> */}
    </div>

    <div className={styles.toolbarCenter}>
      <div className={styles.writingStats}>
        {currentStory && (
          <div className={styles.currentStoryInfo}>
            <span className={styles.storyTitle}>{currentStory.title}</span>
            {currentChapter && (
              <>
                <span className={styles.divider}>|</span>
                <span className={styles.chapterTitle}>{currentChapter.title}</span>
                <span className={styles.divider}>|</span>
                <span className={styles.wordCount}>{displayWordCount} 字</span>
              </>
            )}
          </div>
        )}
        <div className={styles.writingStatsRight}>
          <span>写作时长: {formatTime(totalWritingTime)}</span>
          <span>目标字数: {wordCountGoal}</span>
        </div>
      </div>
    </div>

    <div className={styles.toolbarRight}>
      <button                                                                                                                                                                                                                                                                                     className={`${styles.iconButton} ${isPreview ? styles.active : ''}`}
        onClick={() => setIsPreview(!isPreview)}
        title="预览"
      >
      {isPreview ? <FaEye className={styles.icon} /> : <FaEyeSlash className={styles.icon} />}
      </button>
      {currentChapter?.status?.toLowerCase() === 'published' ? (
        <div className={styles.publishedHint}>
          <FaCheck />
          已发布
        </div>
      ) : (
        <button
          className={`${styles.primaryButton} ${hasContentChanged ? styles.hasChanges : ''} ${isSaving ? styles.saving : ''}`}
          onClick={async () => {
            try {
              const result = await handleSave();
              console.log('【保存按钮】保存结果:', result);
            } catch (error) {
              console.error('【保存按钮】保存出错:', error);
            }
          }}
          disabled={isSaving || currentChapter?.status?.toLowerCase() === 'published'}
        >
          <FaSave />
          {isSaving ? '保存中...' : '保存'}
        </button>
      )}
    </div>
  </div>
  )

  // 修改内容变更处理
  const handleContentChange = useCallback((newContent: string) => {
    console.log('【write/page】handleContentChange 被调用，内容长度:', newContent.length);
    
    // 检查内容是否真的变化了
    if (newContent === content) {
      console.log('【write/page】内容没有变化，跳过更新');
      return;
    }
    
    console.log('【write/page】内容已变更，更新状态');
    setContent(newContent);
    setHasContentChanged(true); // 标记内容已变更

    // 计算字数
    const currentWordCount = calculateWordCount(newContent);
    console.log('【write/page】计算字数:', currentWordCount);
    
    // 更新显示的字数
    setDisplayWordCount(currentWordCount);

    // 使用 localStorage 作为临时存储
    if (currentChapterId) {
      // 只有当内容真的发生变化时才标记为未保存
      const hasChanges = newContent !== lastSavedContent;
      console.log('【write/page】内容是否变更:', hasChanges);
      console.log('【write/page】当前内容长度:', newContent.length, '上次保存内容长度:', lastSavedContent.length);
      
      // 强制设置为有变更
      console.log('【write/page】强制设置hasUnsavedChanges为true');
      setHasUnsavedChanges(true);
      console.log('【write/page】hasUnsavedChanges设置完成，当前值:', true);

      if (hasChanges) {
        localStorage.setItem(`draft_${currentChapterId}`, newContent);
        // 更新字数统计
        setWritingStats(prev => ({
          ...prev,
          totalWordCount: prev.totalWordCount + (currentWordCount - (currentChapter?.wordCount || 0)),
        }));
      }
    }
  }, [currentChapterId, lastSavedContent, content, currentChapter?.wordCount]);

  // 添加路由切换拦截
  useEffect(() => {
    // 监听浏览器的后退/前进
    const handlePopState = async (e: PopStateEvent) => {
    if (hasUnsavedChanges && content !== '') {
      const confirm = window.confirm('你有未保存的更改，确定要离开吗？');
      if (!confirm) {
        // 阻止后退/前进
        e.preventDefault();
        window.history.pushState(null, '', pathname);
      } else {
          // 用户确认离开，先保存
          await handleSave();
          // 允许导航
          window.history.go(-1);
        }
      }
    };

    // 监听所有链接点击
    const handleLinkClick = async (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      if (link && link.href && !link.href.includes(pathname) && hasUnsavedChanges && content !== '') {
          e.preventDefault();
          const confirm = window.confirm('你有未保存的更改，确定要离开吗？');
          if (confirm) {
            await handleSave();
            window.location.href = link.href;
          }
        }
    };

    window.addEventListener('popstate', handlePopState);
    document.addEventListener('click', handleLinkClick);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('click', handleLinkClick);
    };
  }, [hasUnsavedChanges, pathname, handleSave, content]);

  // 修改 beforeunload 事件监听
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && content !== '') {
        e.preventDefault();
        e.returnValue = '你有未保存的更改，确定要离开吗？';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, content]);


  // 计算写作统计的 useEffect
  // useEffect(() => {
  //   if (!currentChapter) return
  //   const wordCount = content.length // 使用 content 而不是 currentChapter.content
  //   const now = new Date()
  //   const duration = (now.getTime() - writingStats.lastSaved.getTime()) / 1000 / 60

  //   // 避免在 useEffect 中直接更新依赖项
  //   const newStats = {
  //     totalWordCount: chapters.reduce((sum, ch) => sum + ch.wordCount, 0),
  //     todayWordCount: wordCount,
  //     averageSpeed: duration > 0 ? wordCount / duration : 0,
  //     writingDuration: duration,
  //     lastSaved: now
  //   }
  //   if (JSON.stringify(newStats) !== JSON.stringify(writingStats)) {
  //     setWritingStats(newStats)
  //   }
  // }, [content, chapters]) // 只依赖 content 和 chapters

  // 修改写作时长统计的 useEffect
  useEffect(() => {
    if (!writingStartTime) {
    setWritingStartTime(new Date())
    return
  }

  const intervalId = setInterval(() => {
  const now = new Date()
  const diff = now.getTime() - writingStartTime.getTime()
  setTotalWritingTime(Math.floor(diff / 1000))
  }, 1000)

  return () => clearInterval(intervalId)
  }, [writingStartTime]) // 只依赖 writingStartTime

  // 移除导航拦截，自动保存相关
  useEffect(() => {
    const cleanup = () => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }
  }
  return cleanup
  }, [])

  // 添加自动保存清理
  useEffect(() => {
    return () => {
    if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // 自动保存功能
  useEffect(() => {
    if (!currentChapterId || !content || !hasContentChanged) return; // 只在内容变更时触发

    const timeoutId = setTimeout(() => {
      console.log('自动保存草稿...');
      localStorage.setItem(`draft_${currentChapterId}`, content);
      setHasContentChanged(false); // 重置内容变更标记
  }, 30000); // 每30秒保存一次

  return () => clearTimeout(timeoutId);
  }, [currentChapterId, content, hasContentChanged]);

  // 组件卸载时保存草稿
  useEffect(() => {
    return () => {
      if (currentChapterId && content) {
        console.log('组件卸载，保存草稿...');
        localStorage.setItem(`draft_${currentChapterId}`, content);
      }
    }
  }, [currentChapterId, content]);


  // 修改选择作品按钮的点击处理
  const handleShowStorySelector = () => {
    console.log('点击选择作品按钮')
    console.log('当前作品数量:', stories.length)
    if (stories.length > 0) {
      setShowStorySelector(true)
    } else {
      showNoStoryTip()
    }
  }

  // 在 showStorySelector 状态变化时添加日志
  useEffect(() => {
    console.log('作品选择器显示状态:', showStorySelector)
}, [showStorySelector])


  // 添加一个状态来存储当前字数（实时显示字数，包括初始化时）
  const [displayWordCount, setDisplayWordCount] = useState(0);
  // 添加一个 useEffect 来初始化字数显示
  useEffect(() => {
    // 初始化字数显示
    const initialWordCount = calculateWordCount(content);
    setDisplayWordCount(initialWordCount);
  }, [content]); // 只在 content 变化时更新

  
  /*
    页面渲染
  */
  return (
    <WalletRequired
      title="开始创作"
      description="连接钱包以开始您的创作"
      icon={<FaPen className="w-10 h-10 text-indigo-600" />}
    >

      <div className={styles.container}>
        {showTipDialog && (
          <TipDialog
            message="您还没有创建任何作品"
            onClose={() => setShowTipDialog(false)}
          />
        )}

        {/* 成功提示对话框 */}
        {showSuccessDialog && (
          <SuccessDialog
            message={successMessage}
            onClose={() => setShowSuccessDialog(false)}
          />
        )}
                
        {/* 添加错误提示对话框 */}
        {errorMessage && (
          <ErrorDialog
            message={errorMessage}
            onClose={() => setErrorMessage(null)}
          />
        )}
        
        {isLoadingStories ? (
          <div className={styles.loading}>加载中...</div>
        ) : (
          <>
            {/* 顶部工具栏 */}
            {renderToolbar()}

            <div className={styles.content}>
              {/* 左侧边栏 */}
              <div className={`${styles.sidebar} ${(showChapters || showSettings) ? styles.expanded : ''}`}>
                
                {/* 作品选择器 - 只在非设置模式下显示 */}
                {!showSettings && (
                  // 作品选择器
                  <div className={styles.storySection}>
                    <div className={styles.storySelectorHeader}>
                      <IconButton
                        icon={<FaList />}
                        onClick={handleShowStorySelector}
                        title="选择作品"
                      />
                      <span className={styles.sectionTitle}>当前作品</span>
                      <IconButton
                        icon={<FaPlus />}
                        onClick={() => router.push('/author/works')}
                        title="前往作品管理"
                      />
                    </div>
                    
                    {/* 当前作品信息 */}
                    <div className={styles.storyCard} onClick={handleShowStorySelector}>
                      <div className={styles.storyHeader}>
                        <h3>{currentStory?.title || '选择作品'}</h3>
                        <span className={styles.storyCategory}>{currentStory?.category || 'GENERAL'}</span>
                      </div>
                      {currentStory && (
                        <div className={styles.storyStats}>
                          <span>字数: {currentStory.wordCount || 0} / {currentStory.targetWordCount || 10000}</span>
                      </div>
                    )}
                    </div>

                    {/* 作品选择器弹窗 */}
                    {showStorySelector && stories.length > 0 && (
                      <>
                        {/* 遮罩层 */}
                        <div style={{
                          position: 'fixed',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: 'rgba(0, 0, 0, 0.5)',
                          zIndex: 999
                        }} />
                        
                        {/* 选择器弹窗 */}
                        <div style={{
                          position: 'fixed',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          backgroundColor: 'white',
                          padding: '24px',
                          borderRadius: '12px',
                          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
                          zIndex: 1000,
                          width: '90%',
                          maxWidth: '600px',
                          height: '80vh',
                          display: 'flex',
                          flexDirection: 'column',
                          overflow: 'hidden'
                        }}>
                          {/* 标题栏 */}
                          <div style={{
                            marginBottom: '24px',
                            paddingBottom: '16px',
                            borderBottom: '1px solid #e5e7eb',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}>
                            <h3 style={{ 
                              margin: 0,
                              fontSize: '1.5rem',
                              fontWeight: '600',
                              color: '#111827'
                            }}>选择作品</h3>
                            <IconButton
                              icon={<FaTimes />}
                              onClick={() => setShowStorySelector(false)}
                              title="关闭"
                              style={{
                                padding: '8px',
                                borderRadius: '8px',
                                backgroundColor: '#f3f4f6',
                                cursor: 'pointer'
                              }}
                            />
                          </div>

                          {/* 列表内容区 */}
                          <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: '0 4px'
                          }}>
                            {stories.map((story) => (
                                <div
                                  key={story.id}
                                  onClick={() => handleStorySelect(story)}
                                  style={{
                                    padding: '20px',
                                    borderRadius: '12px',
                                    backgroundColor: currentStory?.id === story.id ? '#f3f4f6' : 'white',
                                  cursor: 'pointer',
                                  marginBottom: '16px',
                                  transition: 'all 0.2s',
                                  border: '1px solid #e5e7eb',
                                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                                  e.currentTarget.style.transform = 'translateY(-1px)';
                                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                                }}
                                onMouseLeave={(e) => {
                                  if (currentStory?.id !== story.id) {
                                    e.currentTarget.style.backgroundColor = 'white';
                                  }
                                  e.currentTarget.style.transform = 'none';
                                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                                }}
                              >
                                <div style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  marginBottom: '12px'
                                }}>
                                  <h4 style={{ 
                                    margin: 0,
                                    fontSize: '1.125rem',
                                    fontWeight: '600',
                                    color: '#111827'
                                  }}>{story.title}</h4>
                                  <span style={{
                                    fontSize: '0.875rem',
                                    color: '#6b7280',
                                    backgroundColor: '#f3f4f6',
                                    padding: '4px 12px',
                                    borderRadius: '16px',
                                    fontWeight: '500'
                                  }}>
                                    {STORY_TYPES.find(t => t.id === story.category)?.name || story.category}
                                  </span>
                                </div>
                                
                                  <div style={{ 
                                    display: 'flex',
                                  gap: '16px',
                                    fontSize: '0.875rem',
                                  color: '#6b7280',
                                  marginTop: '8px'
                                  }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ color: '#4b5563', fontWeight: '500' }}>字数:</span>
                                    <span>{story.wordCount.toLocaleString()} / {story.targetWordCount.toLocaleString()}</span>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ color: '#4b5563', fontWeight: '500' }}>总章节:</span>
                                    <span>{story.chapterCount}</span>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ color: '#10b981', fontWeight: '500' }}>已发布:</span>
                                    <span>{story.publishedChapterCount}</span>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ color: '#f59e0b', fontWeight: '500' }}>草稿:</span>
                                    <span>{story.draftChapterCount}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* 左侧面板 */}
                {((currentStory && showChapters) || showSettings) && (
                  <div className={styles.leftPanel}>
                    {/* 章节管理面板 */}
                    {showChapters && currentStory && (
                      <div className={styles.chaptersPanel}>
                        <div className={styles.chapterManagement}>
                          <div className={styles.chapterManagementTitle}>
                            章节管理<span className={styles.chapterCount}>({totalChapters})</span>
                          </div>
                          <button
                            className={styles.createChapterButton}
                            onClick={() => handleAddChapter()}
                          >
                            + 新建章节
                          </button>
                        </div>
                       
                        <div className={styles.chapterList} ref={chapterListRef}>
                          <div className={styles.searchContainer}>
                            <input
                              type="text"
                              className={styles.searchInput}
                              placeholder="搜索章节..."
                              value={chapterSearchKeyword}
                              onChange={(e) => handleSearchChapters(e.target.value)}
                            />
                            {chapterSearchKeyword && (
                              <button 
                                className={styles.clearSearchButton}
                                onClick={clearSearch}
                                title="清除搜索"
                              >
                                <FaTimes />
                              </button>
                            )}
                          </div>
                          
                          {isChapterLoading ? (
                            <div className={styles.loadingChapters}>加载章节中...</div>
                          ) : (
                            <>
                              {isSearching ? (
                                // 搜索结果
                                <div className={styles.searchResults}>
                                  <div className={styles.searchResultsHeader}>
                                    搜索结果: {filteredChapters.length} 章节
                                  </div>
                                  {filteredChapters.length === 0 ? (
                                    <div className={styles.noSearchResults}>
                                      没有找到匹配的章节
                                    </div>
                                  ) : (
                                    filteredChapters.map((chapter) => (
                                      <div
                                        key={chapter.id}
                                        className={`${styles.chapterItem} ${
                                          currentChapter?.id === chapter.id ? styles.activeChapter : ''
                                        } ${currentChapterId === chapter.id ? styles.selected : ''}`}
                                        onClick={() => loadChapter(chapter.id)}
                                      >
                                        {/* 章节项内容 - 与下面相同 */}
                                        <div className={styles.chapterMain}>
                                          {editingChapterId === chapter.id ? (
                                            <input
                                              type="text"
                                              defaultValue={chapter.title}
                                              onKeyDown={(e) => handleTitleKeyDown(e, chapter.id)}
                                              onBlur={(e) => handleTitleBlur(e, chapter.id)}
                                              className={styles.chapterTitleInput}
                                              onClick={(e) => e.stopPropagation()}
                                              autoFocus
                                              maxLength={50}
                                            />
                                          ) : (
                                            <span className={styles.chapterTitle}>{chapter.title}</span>
                                          )}
                                          <div className={styles.chapterInfo}>
                                            <span className={styles.wordCount}>
                                              {chapter.wordCount}字
                                            </span>
                                            <select
                                              value={chapter.status}
                                              onChange={(e) => handleChapterUpdate(chapter.id, 'status', e.target.value)}
                                              className={`${styles.chapterStatus} ${chapter.status === 'published' ? styles.published : ''}`}
                                              onClick={(e) => e.stopPropagation()}
                                              disabled={chapter.status === 'published'}
                                            >
                                              <option value="draft">草稿</option>
                                              <option value="pending">待审核</option>
                                              <option value="published">已发布</option>
                                            </select>
                                            {chapter.status === 'published' && loadingChapterIds.has(chapter.id) && (
                                              <div className={styles.loadingIndicator} />
                                            )}
                                          </div>
                                          <div className={styles.chapterActions}>
                                            {editingChapterId === chapter.id && chapter.status !== 'published' ? (
                                              <button
                                                className={styles.actionButton}
                                                onClick={(e) => handleSaveClick(e, chapter.id)}
                                                title="保存"
                                              >
                                                <FaSave />
                                              </button>
                                            ) : (
                                              <>
                                                {chapter.status !== 'published' && (
                                                  <>
                                                    <button
                                                      className={styles.actionButton}
                                                      onClick={(e) => handleEditClick(e, chapter.id, chapter.title)}
                                                      title="编辑"
                                                    >
                                                      <FaPen />
                                                    </button>
                                                    <button
                                                      className={styles.actionButton}
                                                      onClick={(e) => handleDeleteClick(e, chapter.id)}
                                                      title="删除"
                                                    >
                                                      <FaTrash />
                                                    </button>
                                                    <button
                                                      className={styles.actionButton}
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        handlePublishChapter(chapter.id);
                                                      }}
                                                      title="发布到区块链"
                                                    >
                                                      <FaUpload />
                                                    </button>
                                                  </>
                                                )}
                                              </>
                                            )}
                                          </div>
                            </div>
                          </div>
                                    ))
                                  )}
                                </div>
                              ) : (
                                // 正常章节列表
                                <>
                                  {/* 最新章节 */}
                                  <div className={styles.chapterSection}>
                                    <div className={styles.sectionHeader}>
                                      最新章节
                                    </div>
                                    {recentChapters.length === 0 ? (
                                      <div className={styles.noChapters}>
                                        暂无章节，请点击"+ 新建"按钮创建第一个章节
                                      </div>
                                    ) : (
                                      recentChapters.map((chapter) => (
                            <div
                              key={chapter.id}
                              className={`${styles.chapterItem} ${
                                currentChapter?.id === chapter.id ? styles.activeChapter : ''
                              } ${currentChapterId === chapter.id ? styles.selected : ''}`}
                              onClick={() => loadChapter(chapter.id)}
                              >
                                          <div className={styles.chapterMain}>
                                            {editingChapterId === chapter.id ? (
                                              <input
                                                type="text"
                                                defaultValue={chapter.title}
                                                onKeyDown={(e) => handleTitleKeyDown(e, chapter.id)}
                                                onBlur={(e) => handleTitleBlur(e, chapter.id)}
                                                className={styles.chapterTitleInput}
                                                onClick={(e) => e.stopPropagation()}
                                                autoFocus
                                                maxLength={50}
                                              />
                                            ) : (
                                              <span className={styles.chapterTitle}>{chapter.title}</span>
                                            )}
                                            <div className={styles.chapterInfo}>
                                              <span className={styles.wordCount}>
                                                {chapter.wordCount}字
                                              </span>
                                              <select
                                                value={chapter.status}
                                                onChange={(e) => handleChapterUpdate(chapter.id, 'status', e.target.value)}
                                                className={`${styles.chapterStatus} ${chapter.status === 'published' ? styles.published : ''}`}
                                                onClick={(e) => e.stopPropagation()}
                                                disabled={chapter.status === 'published'}
                                              >
                                                <option value="draft">草稿</option>
                                                <option value="pending">待审核</option>
                                                <option value="published">已发布</option>
                                              </select>
                                              {chapter.status === 'published' && loadingChapterIds.has(chapter.id) && (
                                                <div className={styles.loadingIndicator} />
                                              )}
                                            </div>
                                          </div>
                                          <div className={styles.chapterActions}>
                                            {editingChapterId === chapter.id && chapter.status !== 'published' ? (
                                              <button
                                                className={styles.actionButton}
                                                onClick={(e) => handleSaveClick(e, chapter.id)}
                                                title="保存"
                                              >
                                                <FaSave />
                                              </button>
                                            ) : (
                                              <>
                                                {chapter.status !== 'published' && (
                                                  <>
                                                    <button
                                                      className={styles.actionButton}
                                                      onClick={(e) => handleEditClick(e, chapter.id, chapter.title)}
                                                      title="编辑"
                                                    >
                                                      <FaPen />
                                                    </button>
                                                    <button
                                                      className={styles.actionButton}
                                                      onClick={(e) => handleDeleteClick(e, chapter.id)}
                                                      title="删除"
                                                    >
                                                      <FaTrash />
                                                    </button>
                                                    <button
                                                      className={styles.actionButton}
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        handlePublishChapter(chapter.id);
                                                      }}
                                                      title="发布到区块链"
                                                    >
                                                      <FaUpload />
                                                    </button>
                                                  </>
                                                )}
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                  
                                  {/* 历史章节 */}
                                  {historicalChapters.length > 0 && (
                                    <>
                                      {!showAllChapters && (
                                        <button 
                                          className={styles.showMoreButton}
                                          onClick={handleShowAllChapters}
                                        >
                                          展开更多章节 ▼
                                        </button>
                                      )}
                                      
                                      {showAllChapters && (
                                        <div className={styles.chapterSection}>
                                          <div className={styles.sectionHeader}>
                                            历史章节
                                          </div>
                                          
                                          {historicalChapters.map((group, index) => (
                                            <div key={`group-${index}`} className={styles.chapterGroup}>
                                              <div 
                                                className={styles.groupHeader}
                                                onClick={() => toggleChapterGroup(index)}
                                              >
                                                <span>第{group.end}-{group.start}章</span>
                                                <span className={styles.groupCount}>[{group.count}章]</span>
                                                <span className={styles.expandIcon}>
                                                  {expandedGroups.includes(index) ? '▼' : '▶'}
                                                </span>
                                              </div>
                                              
                                              {expandedGroups.includes(index) && (
                                                <div className={styles.groupChapters}>
                                                  {chapters
                                                    .filter(ch => ch.order >= group.end && ch.order <= group.start)
                                                    .map(chapter => (
                                                      <div
                                                        key={chapter.id}
                                                        className={`${styles.chapterItem} ${
                                                          currentChapter?.id === chapter.id ? styles.activeChapter : ''
                                                        } ${currentChapterId === chapter.id ? styles.selected : ''}`}
                                                        onClick={() => loadChapter(chapter.id)}
                                                      >
                                <div className={styles.chapterMain}>
                                {editingChapterId === chapter.id ? (
                                  <input
                                    type="text"
                                    defaultValue={chapter.title}
                                    onKeyDown={(e) => handleTitleKeyDown(e, chapter.id)}
                                    onBlur={(e) => handleTitleBlur(e, chapter.id)}
                                    className={styles.chapterTitleInput}
                                    onClick={(e) => e.stopPropagation()}
                                    autoFocus
                                    maxLength={50}
                                  />
                                ) : (
                                  <span className={styles.chapterTitle}>{chapter.title}</span>
                                )}
                                <div className={styles.chapterInfo}>
                                  <span className={styles.wordCount}>
                                    {chapter.wordCount}字
                                  </span>
                                  <select
                                    value={chapter.status}
                                    onChange={(e) => handleChapterUpdate(chapter.id, 'status', e.target.value)}
                                    className={`${styles.chapterStatus} ${chapter.status === 'published' ? styles.published : ''}`}
                                    onClick={(e) => e.stopPropagation()}
                                    disabled={chapter.status === 'published'}
                                  >
                                    <option value="draft">草稿</option>
                                    <option value="pending">待审核</option>
                                    <option value="published">已发布</option>
                                  </select>
                                  {chapter.status === 'published' && loadingChapterIds.has(chapter.id) && (
                                    <div className={styles.loadingIndicator} />
                                  )}
                                </div>
                              </div>
                              <div className={styles.chapterActions}>
                                {editingChapterId === chapter.id && chapter.status !== 'published' ? (
                                  <button
                                    className={styles.actionButton}
                                    onClick={(e) => handleSaveClick(e, chapter.id)}
                                    title="保存"
                                  >
                                    <FaSave />
                                  </button>
                                ) : (
                                  <>
                                    {chapter.status !== 'published' && (
                                      <>
                                        <button
                                          className={styles.actionButton}
                                          onClick={(e) => handleEditClick(e, chapter.id, chapter.title)}
                                          title="编辑"
                                        >
                                          <FaPen />
                                        </button>
                                        <button
                                          className={styles.actionButton}
                                          onClick={(e) => handleDeleteClick(e, chapter.id)}
                                          title="删除"
                                        >
                                          <FaTrash />
                                        </button>
                                        <button
                                          className={styles.actionButton}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handlePublishChapter(chapter.id);
                                          }}
                                          title="发布到区块链"
                                        >
                                          <FaUpload />
                                        </button>
                                      </>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </>
                                  )}
                                </>
                              )}
                            </>
                          )}
                          
                          {/* 添加底部边界区域 */}
                          <div className={styles.chapterListBottomBoundary}>
                            <div className={styles.bottomBoundaryContent}>
                              {isSearching 
                                ? `搜索结果: ${filteredChapters.length} 章节` 
                                : totalChapters > 0 
                                  ? (showAllChapters ? "已显示全部章节" : "显示最新章节") 
                                  : "暂无章节"}
                            </div>
                          </div>
                        </div>

                        <div className={styles.chapterStats}>
                          <div className={styles.statItem}>
                            总字数: {writingStats.totalWordCount}
                          </div>
                          <div className={styles.statItem}>
                            已发布: {chapters.filter(ch => ch.status === 'published').length}
                          </div>
                          <div className={styles.statItem}>
                            草稿: {chapters.filter(ch => ch.status !== 'published').length}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 作品设置面板 */}
                    {showSettings && (
                      <div className={styles.settingsPanel}>
                        <div className={styles.settingsHeader}>
                          <h2 className={styles.panelTitle}>创建新作品</h2>
                        </div>
                        <div className={styles.settingsContent}>
                          <div className={styles.formGroup}>
                            <label className={styles.label}>作品标题</label>
                            <input
                              type="text"
                              className={styles.input}
                              value={storyInfo.title}
                              onChange={e => handleInfoChange('title', e.target.value)}
                              placeholder="请输入作品标题"
                            />
                          </div>

                          <div className={styles.formGroup}>
                            <label className={styles.label}>作品类型</label>
                            <div className={styles.typeGrid}>
                              {STORY_TYPES.map(type => (
                                <button
                                  key={type.id}
                                  className={`${styles.typeButton} ${storyInfo.type === type.id ? styles.active : ''}`}
                                  onClick={() => handleInfoChange('type', type.id)}
                                >
                                  {type.name}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className={styles.formGroup}>
                            <label className={styles.label}>作品简介</label>
                            <textarea
                              className={styles.textarea}
                              value={storyInfo.description}
                              onChange={e => handleInfoChange('description', e.target.value)}
                              placeholder="请输入作品简介"
                              rows={4}
                            />
                          </div>

                          <div className={`${styles.formGroup} ${styles.targetWordCountGroup}`}>
                            <label className={styles.label}>
                              目标字数
                              <span className={styles.requiredStar}>*</span>
                              <span className={styles.importantBadge}>重要</span>
                            </label>
                            <div className={styles.targetWordCountInput}>
                              <input
                                type="number"
                                className={styles.input}
                                value={storyInfo.targetWordCount}
                                onChange={e => handleInfoChange('targetWordCount', e.target.value)}
                                placeholder="请设置作品目标字数"
                                min="0"
                                step="10000"
                              />
                              <span className={styles.wordCountUnit}>字</span>
                            </div>
                            <p className={styles.wordCountHint}>目标字数将影响作品NFT铸造、挖矿奖励及作品价值评估。</p>
                          </div>

                          <div className={styles.formGroup}>
                            <label className={styles.label}>发布设置</label>
                            <div className={styles.publishSettings}>
                              <label className={styles.checkboxLabel}>
                                <input
                                  type="checkbox"
                                  checked={storyInfo.isSerial}
                                  onChange={e => handleInfoChange('isSerial', e.target.checked)}
                                />
                                连载作品
                              </label>
                              <label className={styles.checkboxLabel}>
                                <input
                                  type="checkbox"
                                  checked={storyInfo.isFree}
                                  onChange={e => handleInfoChange('isFree', e.target.checked)}
                                />
                                免费阅读
                              </label>
                            </div>
                            {!storyInfo.isFree && (
                              <input
                                type="number"
                                className={styles.input}
                                value={storyInfo.price}
                                onChange={e => handleInfoChange('price', parseFloat(e.target.value))}
                                placeholder="设置价格（BNB）"
                                min="0"
                                step="0.01"
                              />
                            )}
                          </div>

                          <div className={styles.formGroup}>
                            <label className={styles.label}>作品封面</label>
                            <div className="relative">
                              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                {storyInfo.coverImage ? (
                                  <div className="relative w-full aspect-[3/4] max-w-[240px] mx-auto">
                                    <img 
                                      src={storyInfo.coverImage} 
                                      alt="作品封面" 
                                      className="w-full h-full object-cover rounded-lg"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/50 rounded-lg">
                                      <label className="cursor-pointer p-2 bg-white rounded-lg shadow hover:bg-gray-50">
                                        <input
                                          type="file"
                                          accept="image/*"
                                          onChange={handleCoverSelect}
                                          className="hidden"
                                        />
                                        <FaCamera className="w-6 h-6 text-gray-600" />
                                      </label>
                                      <button
                                        onClick={() => handleInfoChange('coverImage', '')}
                                        className="ml-2 p-2 bg-red-500 text-white rounded-lg shadow hover:bg-red-600"
                                      >
                                        <FaTimes className="w-6 h-6" />
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <label className="cursor-pointer">
                                    <div className="flex flex-col items-center justify-center py-8">
                                      <FaCamera className="w-12 h-12 text-gray-400 mb-4" />
                                      <p className="text-sm text-gray-500 mb-2">点击或拖拽上传封面</p>
                                      <p className="text-xs text-gray-400">建议尺寸: 600x800px</p>
                                    </div>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={handleCoverSelect}
                                      className="hidden"
                                    />
                                  </label>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className={styles.formActions}>
                            <Button onClick={handleCreateStory} className={styles.confirmButton}>
                              创建作品
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 编辑器区域 */}
              <div className={styles.editor}>
                <div className={styles.editorContent}>
                  <div className={styles.editorInner}>
                    <Editor
                      key={currentChapterId || undefined}
                      initialContent={content}
                      onChange={handleContentChange}
                      editable={!isPreview && currentChapter?.status !== 'published'}
                      className={isPreview ? styles.previewContent : styles.content}
                      placeholder={currentChapter?.status === 'published' ? '该章节已发布，无法编辑' : '开始创作你的故事...'}
                      onSave={async () => {
                        if (currentChapter?.status !== 'published') {
                          await handleSave();
                        }
                      }}
                    />
                    {/* 添加底部边界区域 */}
                    <div className={styles.chapterListBottomBoundary}>
                      <div className={styles.bottomBoundaryContent}>
                        文档结束
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 大纲对话框 */}
              {showOutlineDialog && (
                <div className={styles.modal}>
                  <div className={styles.modalContent}>
                    <div className={styles.modalHeader}>
                      <h2>添加大纲</h2>
                      <button 
                        className={styles.closeButton}
                        onClick={() => setShowOutlineDialog(false)}
                      >
                        ×
                      </button>
                    </div>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.target as HTMLFormElement;
                      const title = (form.elements.namedItem('title') as HTMLInputElement).value;
                      const description = (form.elements.namedItem('description') as HTMLTextAreaElement).value;
                      addOutline(title, description);
                      setShowOutlineDialog(false);
                    }}>
                      <Input id="title" placeholder="大纲标题" required />
                      <Textarea id="description" placeholder="大纲描述" required />
                      <div className={styles.modalFooter}>
                        <Button type="button" variant="outline" onClick={() => setShowOutlineDialog(false)}>取消</Button>
                        <Button type="submit">保存</Button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* 写作统计对话框 */}
              {showStatsDialog && (
                <div className={styles.modal}>
                  <div className={styles.modalContent}>
                    <h2>写作统计</h2>
                    <div>
                      <div>总字数: {writingStats.totalWordCount}</div>
                      <div>今日字数: {writingStats.todayWordCount}</div>
                      <div>平均速度: {Math.round(writingStats.averageSpeed)} 字/分钟</div>
                      <div>写作时长: {Math.round(writingStats.writingDuration)} 分钟</div>
                    </div>
                    <Button onClick={() => setShowStatsDialog(false)}>关闭</Button>
                  </div>
                </div>
              )}

              {/* 添加删除确认弹窗 */}
              {showDeleteDialog && (
                <div className={styles.modal}>
                  <div className={styles.modalContent}>
                    <div className={styles.modalHeader}>
                      <h2>确认删除</h2>
                      <button 
                        className={styles.closeButton}
                        onClick={() => {
                          setShowDeleteDialog(false);
                          setChapterToDelete(null);
                        }}
                      >
                        ×
                      </button>
                    </div>
                    <p className={styles.modalText}>确定要删除这个章节吗？此操作不可恢复。</p>
                    <div className={styles.modalFooter}>
                      <Button
                        className={`${styles.button} ${styles.cancelButton}`}
                        onClick={() => {
                          setShowDeleteDialog(false);
                          setChapterToDelete(null);
                        }}
                      >
                        取消
                      </Button>
                      <Button
                        className={`${styles.button} ${styles.deleteButton}`}
                        onClick={handleConfirmDelete}
                      >
                        删除
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* 作品创建确认弹窗 */}
              {showCreateConfirm && (
                
                <div className={styles.previewOverlay}>
                  <div className={styles.previewPanel}>
                    <div className={styles.previewHeader}>
                      <h2>创建新作品</h2>
                      <button 
                        className={styles.closeButton}
                        onClick={() => !isCreating && setShowCreateConfirm(false)}
                        disabled={isCreating}
                      >
                        <FaTimes />
                      </button>
                    </div>
                    <div className={styles.previewContent}>
                      <div className={styles.previewLeft}>
                        {storyInfo.coverImage ? (
                          <img 
                            src={storyInfo.coverImage} 
                            alt="作品封面"
                            className={styles.previewCover}
                          />
                        ) : (
                          <div className={styles.previewCoverPlaceholder}>
                            <FaImage className={styles.placeholderIcon} />
                            <span>暂无封面</span>
                          </div>
                        )}
                      </div>
                      <div className={styles.previewRight}>
                        <h3 className={styles.previewTitle}>{storyInfo.title}</h3>
                        <span className={styles.previewType}>
                          {STORY_TYPES.find(t => t.id === storyInfo.type)?.name || '未选择类型'}
                        </span>
                        <div className={styles.previewDescription}>
                          {storyInfo.description || '暂无简介'}
                        </div>
                        <div className={styles.previewDetails}>
                          <div className={styles.previewDetailItem}>
                            <FaBook className={styles.detailIcon} />
                            <span>{storyInfo.isSerial ? '连载中' : '已完结'}</span>
                          </div>
                          <div className={styles.previewDetailItem}>
                            <FaMoneyBill className={styles.detailIcon} />
                            <span>{storyInfo.isFree ? '免费阅读' : `${storyInfo.price} BNB`}</span>
                          </div>
                          {storyInfo.targetWordCount > 0 && (
                            <div className={styles.previewDetailItem}>
                              <FaPen className={styles.detailIcon} />
                              <span>目标字数：{storyInfo.targetWordCount}</span>
                            </div>
                          )}
                        </div>
                        <div className={styles.previewWarning}>
                          <FaInfoCircle className={styles.warningIcon} />
                          <span>创建作品需要连接钱包并支付少量gas费用</span>
                        </div>
                      </div>
                    </div>
                    {createStatus && (
                      <div className={styles.createProgress}>
                        <div className={styles.progressBar}>
                          <div 
                            className={styles.progressFill} 
                            style={{ width: `${createProgress}%` }}
                          />
                        </div>
                        <div className={styles.progressStatus}>
                          {createStatus === CreateStatus.UPLOADING && '正在上传封面...'}
                          {createStatus === CreateStatus.UPLOADING && '正在上传内容...'}
                          {createStatus === CreateStatus.CREATING_CONTRACT && '正在创建合约...'}
                          {createStatus === CreateStatus.SAVING_DATABASE && '正在保存数据...'}
                          {createStatus === CreateStatus.COMPLETED && '创建完成！'}
                        </div>
                      </div>
                    )}
                    <div className={styles.previewActions}>
                      <button
                        className={styles.cancelButton}
                        onClick={() => !isCreating && setShowCreateConfirm(false)}
                        disabled={isCreating}
                      >
                        取消
                      </button>
                      <button
                        className={styles.confirmButton}
                        onClick={handleConfirmCreate}
                        disabled={isCreating}
                      >
                        {isCreating ? (
                          <>
                            <div className={styles.loadingSpinner} />
                            创建中...
                          </>
                        ) : (
                          <>
                            <FaCheck />
                            确认创建
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 作品添加图片裁剪对话框 */}
              {showCoverCropper && selectedCoverFile && (
                <div className={styles.modal}>
                  <div className={styles.modalContent}>
                    <div className={styles.modalHeader}>
                      <h2>裁剪封面</h2>
                      <button 
                        className={styles.closeButton}
                        onClick={() => {
                          setShowCoverCropper(false);
                          setSelectedCoverFile(null);
                        }}
                      >
                        <FaTimes />
                      </button>
                    </div>
                    <ImageCropper
                      image={URL.createObjectURL(selectedCoverFile)}
                      onCropComplete={handleCropComplete}
                      aspectRatio={3/4}
                      minWidth={600}
                      minHeight={800}
                      onCancel={() => {
                        setShowCoverCropper(false);
                        setSelectedCoverFile(null);
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    
      {/* 创建章节对话框 - 美化版 */}
      {showCreateChapterDialog && (
        <div className={styles.modalOverlay}>
          <div className={styles.modernModal}>
            <div className={styles.modernModalHeader}>
              <h3>创建新章节</h3>
              <button 
                className={styles.modernCloseButton}
                onClick={handleCancelAddChapter}
                aria-label="关闭"
                >
                <FaTimes />
              </button>
            </div>
            <div className={styles.modernModalBody}>
              <div className={styles.modernFormGroup}>
                <label htmlFor="chapterTitle" className={styles.modernLabel}>章节标题</label>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputIcon}>
                    <FaHeading />
                  </span>
                  <input
                    id="chapterTitle"
                    type="text"
                    value={newChapterTitle}
                    onChange={(e) => setNewChapterTitle(e.target.value)}
                    className={styles.modernInput}
                    placeholder="请输入章节标题"
                    autoFocus
                    spellCheck="false"
                    autoCorrect="off"
                    autoCapitalize="off"
                    ref={(input) => {
                      // 当输入框挂载后，将光标移动到末尾
                      if (input) {
                        setTimeout(() => {
                          input.focus();
                          input.selectionStart = input.selectionEnd = input.value.length;
                        }, 50);
                      }
                    }}
                  />
                </div>
                <p className={styles.inputHint}>好的章节标题能够吸引读者并概括章节内容</p>
              </div>
            </div>
            <div className={styles.modernModalFooter}>
              <button 
                className={styles.modernCancelButton}
                onClick={handleCancelAddChapter}
              >
                取消
              </button>
              <button 
                className={styles.modernConfirmButton}
                onClick={handleConfirmAddChapter}
              >
                <FaPlus className={styles.buttonIcon} />
                创建章节
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 发布章节确认弹窗 */}
      {showPublishConfirm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modernModal}>
            <div className={styles.modernModalHeader}>
              <h3>确认发布章节</h3>
              <button 
                className={styles.modernCloseButton}
                onClick={() => setShowPublishConfirm(false)}
                >
                <IoClose />
              </button>
            </div>
            
            <div className={styles.modernModalBody}>
               {/* 添加前一章节信息显示 */}
               <div className={styles.previousChapter}>
                <h4>前一发布章节</h4>
                {(() => {
                  // 获取所有章节，按照order排序
                  const sortedChapters = [...chapters].sort((a, b) => a.order - b.order);
                  // 找到当前章节的索引
                  const currentIndex = currentChapter ? sortedChapters.findIndex(ch => ch.id === currentChapter.id) : -1;
                  // 查找当前章节之前的已发布章节
                  let prevPublishedChapter = null;
                  if (currentIndex > 0) {
                    for (let i = currentIndex - 1; i >= 0; i--) {
                      if (sortedChapters[i].status.toLowerCase() === 'published') {
                        prevPublishedChapter = sortedChapters[i];
                        break;
                      }
                    }
                  }
                  return prevPublishedChapter ? (
                    <div className={styles.prevChapterContent}>
                      <p><strong>{prevPublishedChapter.title}</strong></p>
                      <p>第 {prevPublishedChapter.order} 章 · {prevPublishedChapter.wordCount} 字</p>
                    </div>
                  ) : (
                    <div className={styles.prevChapterContent}>
                      <p className={styles.noPrevChapter}>无已发布章节</p>
                    </div>
                  );
                })()}
              </div>

              <div className={styles.chapterPreview}>
                <h4>当前发布章节</h4>
                <div className={styles.previewContent}>
                  <p>{currentChapter?.title}</p>
                  <p>{displayWordCount} 字</p>
                </div>
              </div>

             
              {isCreating && (
                <div className={styles.publishProgress}>
                  <div className={styles.progressBar}>
                    <div 
                      className={styles.progressFill} 
                      style={{ width: `${createProgress}%` }}
                    />
                  </div>
                  <div className={styles.progressStatus}>
                    {createStatus === CreateStatus.IDLE && '准备发布...'}
                    {createStatus === CreateStatus.UPLOADING && '正在上传到区块链...'}
                    {createStatus === CreateStatus.CREATING_CONTRACT && '正在创建合约...'}
                    {createStatus === CreateStatus.SAVING_DATABASE && '正在保存数据...'}
                    {createStatus === CreateStatus.COMPLETED && '发布完成！'}
                    {createStatus === CreateStatus.FAILED && '发布失败'}
                  </div>
                </div>
              )}

              <div className={styles.warningSection}>
                <ul className={styles.warningList}>
                  <li>发布后章节内容将无法修改</li>
                  <li>发布操作需要支付gas费用</li>
                  <li>请确保章节内容已经完善</li>
                </ul>
              </div>
            </div>

            <div className={styles.modernModalFooter}>
              <button
                className={styles.modernCancelButton}
                onClick={() => setShowPublishConfirm(false)}
              >
                取消
              </button>
              <button
                className={styles.modernConfirmButton}
                onClick={handleConfirmPublish}
              >
                <IoRocket className={styles.buttonIcon} />
                确认发布
              </button>
            </div>
          </div>
        </div>
      )}
      
    </WalletRequired>
  )
}

// 格式化时间函数
function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
} 

