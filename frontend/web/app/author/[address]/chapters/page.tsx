// 'use client'

// import { useEffect, useState } from 'react'
// import { useRouter } from 'next/navigation'
// import { Button } from '@/components/ui/button'
// import { formatDistanceToNow } from 'date-fns'
// import { zhCN } from 'date-fns/locale'
// import { toast } from 'react-hot-toast'
// import { Chapter, ChapterMeta, PublishedData } from '@/types/story'

// export default function ChaptersPage({ params }: { params: { address: string } }) {
//   const [chapters, setChapters] = useState<ChapterMeta[]>([])
//   const [isLoading, setIsLoading] = useState(true)
//   const [publishingChapter, setPublishingChapter] = useState<string | null>(null)
//   const router = useRouter()

//   // 获取或创建默认故事
//   async function getOrCreateDefaultStory() {
//     const storyId = localStorage.getItem('currentStoryId')
//     if (storyId) {
//       return storyId
//     }

//     try {
//       // 创建默认故事
//       const response = await fetch('/api/stories', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//           title: '未命名故事',
//           description: '',
//           category: 'default'
//         })
//       })

//       if (!response.ok) {
//         throw new Error('创建故事失败')
//       }

//       const story = await response.json()
//       localStorage.setItem('currentStoryId', story.id)
//       return story.id
//     } catch (error) {
//       console.error('创建默认故事失败:', error)
//       throw error
//     }
//   }

//   // 加载章节列表
//   async function loadChapters() {
//     try {
//       const storyId = await getOrCreateDefaultStory()
//       const response = await fetch(`/api/stories/${storyId}/chapters`)
//       if (!response.ok) {
//         throw new Error('加载章节失败')
//       }
//       const data = await response.json()
//       setChapters(data)
//     } catch (error) {
//       console.error('加载章节失败:', error)
//       toast.error('加载章节失败')
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   useEffect(() => {
//     loadChapters()
//   }, [])

//   // 创建新章节
//   async function handleCreateChapter() {
//     try {
//       const storyId = await getOrCreateDefaultStory()
//       const response = await fetch(`/api/stories/${storyId}/chapters`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//           title: '新章节',
//           content: ''
//         })
//       })

//       if (!response.ok) {
//         throw new Error('创建章节失败')
//       }

//       const newChapter = await response.json()
//       router.push(`/write?story=${storyId}&chapter=${newChapter.id}`)
//     } catch (error) {
//       console.error('创建章节失败:', error)
//       toast.error('创建章节失败')
//     }
//   }

//   // 发布章节
//   async function handlePublishChapter(chapterId: string) {
//     if (publishingChapter) return
//     setPublishingChapter(chapterId)

//     try {
//       // 使用新的 API 发布章节
//       const response = await fetch(`/api/chapters/${chapterId}/publish`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//           authorAddress: params.address
//         })
//       })

//       if (!response.ok) {
//         throw new Error('发布失败')
//       }

//       const publishedChapter = await response.json()
//       toast.success('章节已发布到区块链')
      
//       // 刷新章节列表
//       loadChapters()
//     } catch (error) {
//       console.error('发布章节失败:', error)
//       toast.error('发布章节失败')
//     } finally {
//       setPublishingChapter(null)
//     }
//   }

//   if (isLoading) {
//     return (
//       <div className="flex justify-center items-center min-h-screen">
//         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
//       </div>
//     )
//   }

//   return (
//     <div className="container mx-auto px-4 py-8">
//       <div className="max-w-4xl mx-auto">
//         <div className="bg-white rounded-lg shadow-md p-6">
//           <div className="flex justify-between items-center mb-6">
//             <h1 className="text-2xl font-bold">我的章节</h1>
//             <Button onClick={handleCreateChapter}>写新章节</Button>
//           </div>

//           <div className="space-y-4">
//             {chapters.map(chapter => (
//               <div 
//                 key={chapter.id}
//                 className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
//               >
//                 <div className="flex-1">
//                   <h3 className="text-lg font-medium mb-1">{chapter.title}</h3>
//                   <div className="text-sm text-gray-500 space-x-4">
//                     <span>{chapter.wordCount} 字</span>
//                     <span>更新于 {formatDistanceToNow(new Date(chapter.updatedAt), { addSuffix: true, locale: zhCN })}</span>
//                     <span>状态: {chapter.status === 'published' ? '已发布' : '草稿'}</span>
//                     <span>{chapter.isVip ? 'VIP' : '免费'}</span>
//                   </div>
//                 </div>
//                 <div className="flex items-center space-x-4">
//                   <Button 
//                     variant="outline"
//                     onClick={() => {
//                       const storyId = localStorage.getItem('currentStoryId')
//                       router.push(`/write?story=${storyId}&chapter=${chapter.id}`)
//                     }}
//                   >
//                     编辑
//                   </Button>
//                   {chapter.status !== 'published' && (
//                     <Button
//                       onClick={() => handlePublishChapter(chapter.id)}
//                       disabled={publishingChapter === chapter.id}
//                     >
//                       {publishingChapter === chapter.id ? '发布中...' : '发布'}
//                     </Button>
//                   )}
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }
