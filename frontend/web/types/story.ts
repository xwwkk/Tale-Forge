// 章节内容块类型
export type ContentBlock = {
  id: string
  type: 'text' | 'image'
  content: string
  caption?: string
  align?: 'left' | 'center' | 'right'
}

// 章节元信息
export interface ChapterMeta {
  id: string
  title: string
  order: number
  wordCount: number
  status: 'draft' | 'underreview' | 'published'
  createdAt: string
  updatedAt: string
}

// 章节信息
export interface Chapter extends ChapterMeta {
  content: string
  publishedData?: PublishedData
}

// 发布数据
export interface PublishedData {
  version: number
  publishedAt: string
  ipfsHash: string
  serverUrl: string
  txHash: string
}

// 作者信息
export interface Author {
  address: string
  authorName?: string
  avatarCid?: string
  createdAt: string
  updatedAt: string
}

// 故事统计信息
export interface StoryStats {
  likes: number
  comments: number
  favorites: number
}

// 故事信息
export interface Story {
  id: string
  title: string
  description: string
  coverCid?: string
  content: string
  category: string
  author: {
    address: string
    authorName?: string
    avatarCid?: string
    avatar?: string
    storyCount?: number
    followerCount?: number
    nftCount?: number
  }
  createdAt: string
  updatedAt: string
  wordCount: number
  targetWordCount?: number
  chapters?: Array<{
    id: string
    title: string
    content: string
    wordCount: number
    updatedAt: string
  }>
  stats?: {
    likes: number
    views: number
    comments: number
  }
  // Web3 相关字段
  nftImage?: string
  nftMinted?: number
  nftTotal?: number
  tokenPrice?: number
  tokenHolders?: number
  tokenSupply?: number
  contractAddress?: string
  contractCreatedAt?: string
  transactionCount?: number
  status: 'ongoing' | 'completed'
  bnbEarnings?: number
  tokenEarnings?: number
  viewCount: number
  likeCount: number
  commentCount: number
  chapterCount: number
  updateFrequency?: number
  averageWordsPerChapter?: number
}

// 分页信息
export interface Pagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

// 故事列表响应
export interface StoriesResponse {
  stories: Story[]
  pagination: Pagination
}

// 获取故事列表的参数
export interface GetStoriesParams {
  category?: string
  sortBy?: string
  search?: string
  page?: number
  limit?: number
}

// 分类
export interface Category {
  id: string
  name: string
}

// 排序选项
export interface SortOption {
  id: string
  name: string
}

// 创建故事的参数
export interface CreateStoryParams {
  title: string
  description: string
  content: string
  coverImage: File
  authorAddress: string
  targetWordCount: number
  category: string
}