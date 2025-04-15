import prisma from '../prisma'
import { uploadToIPFS, getJSONFromIPFS, uploadJSONToIPFS, getFromIPFS } from '../ipfs'
import { JsonRpcProvider } from '@ethersproject/providers'
import { Contract } from '@ethersproject/contracts'
import { formatEther } from '@ethersproject/units'
import { CONTRACT_ADDRESS, CONTRACT_ABI, getProvider, getContractWithSigner } from '../config/contract'
import type { StoryStatus } from '@prisma/client'
import type { SyncStatus } from '@prisma/client'

export class SyncService {
  private provider: JsonRpcProvider | null = null

  constructor() {
    // 初始化 provider
    this.initProvider()
  }

  private async initProvider() {
    this.provider = await getProvider()
  }

  private async ensureProvider() {
    if (!this.provider) {
      this.provider = await getProvider()
    }
    return this.provider
  }

  /**
   * 处理故事创建前的准备工作
   */
  async prepareStoryCreation(data: {
    title: string
    description: string
    content: string
    coverImage?: string
    authorAddress: string
  }) {
    console.log('[SyncService.prepareStoryCreation] 开始准备创建故事:', { 
      title: data.title,
      authorAddress: data.authorAddress 
    })

    try {
      // 1. 准备内容数据
      const contentData = {
        content: data.content,
        description: data.description,
        timestamp: new Date().toISOString(),
        version: '1.0'
      }

      // 2. 上传内容到IPFS
      console.log('[SyncService.prepareStoryCreation] 上传内容到IPFS...')
      const contentCid = await uploadToIPFS(JSON.stringify(contentData))

      // 3. 处理封面图片
      let coverCid = '/images/story-default-cover.jpg'
      if (data.coverImage) {
        if (data.coverImage.startsWith('data:image')) {
          console.log('[SyncService.prepareStoryCreation] 上传封面到IPFS...')
          coverCid = await uploadToIPFS(data.coverImage)
        } else {
          coverCid = data.coverImage
        }
      }

      console.log('[SyncService.prepareStoryCreation] 准备完成:', {
        contentCid,
        coverCid
      })

      return {
        contentCid,
        coverCid
      }
    } catch (error) {
      console.error('[SyncService.prepareStoryCreation] 准备失败:', error)
      throw error
    }
  }

  /**
   * 从链上获取作者作品列表
   */
  async getAuthorStoriesFromChain(authorAddress: string) {
    console.log('[SyncService.getAuthorStoriesFromChain] 开始从链上获取作品:', authorAddress)
    
    try {
      const provider = await this.ensureProvider()
      if (!provider) {
        throw new Error('无法获取 provider')
      }

      const contract = new Contract(
        CONTRACT_ADDRESS.StoryManager,
        CONTRACT_ABI.StoryManager,
        provider
      )
      
      const stories = await contract.getAuthorStories(authorAddress)
      console.log('[SyncService.getAuthorStoriesFromChain] 链上作品数据:', stories)
      
      return stories
    } catch (error) {
      console.error('[SyncService.getAuthorStoriesFromChain] 获取失败:', error)
      throw error
    }
  }

  /**
   * 获取区块链同步状态
   */
  async getChainSyncState(type: string) {
    return await prisma.chainSyncState.findUnique({
      where: { type }
    })
  }

  /**
   * 更新区块链同步状态
   */
  async updateChainSyncState(type: string, blockNumber: number) {
    return await prisma.chainSyncState.upsert({
      where: { type },
      update: { 
        blockNumber,
        updatedAt: new Date()
      },
      create: {
        type,
        blockNumber
      }
    })
  }

  /**
   * 获取作者作品同步状态
   */
  async getAuthorStoriesSyncState(authorId: string) {
    return await prisma.authorStoriesSync.findUnique({
      where: { authorId }
    })
  }

  /**
   * 将链上作品数据同步到数据库
   */
  async syncStoryFromChain(storyData: any) {
    console.log('[SyncService.syncStoryFromChain] 开始同步链上作品:', storyData)
    
    try {
      // 1. 从IPFS获取作品内容
      const rawContent = await getFromIPFS(storyData.contentHash)
      const content = JSON.parse(rawContent)
      
      // 2. 保存到数据库
      const story = await prisma.story.upsert({
        where: { 
          id: storyData.id 
        },
        update: {
          title: storyData.title,
          description: content.description,
          contentCid: storyData.contentHash,
          coverCid: storyData.coverCid,
          updatedAt: new Date(Number(storyData.lastUpdate) * 1000)
        },
        create: {
          id: storyData.id,
          title: storyData.title,
          description: content.description,
          contentCid: storyData.contentHash,
          coverCid: storyData.coverCid,
          authorId: storyData.authorId,
          category: content.category || 'GENERAL',
          tags: content.tags || [],
          createdAt: new Date(Number(storyData.createdAt) * 1000),
          updatedAt: new Date(Number(storyData.lastUpdate) * 1000)
        }
      })
      
      console.log('[SyncService.syncStoryFromChain] 同步完成:', story)
      return story
    } catch (error) {
      console.error('[SyncService.syncStoryFromChain] 同步失败:', error)
      throw error
    }
  }

  /**
   * 触发作品同步
   */
  async triggerStoriesSync(authorId: string) {
    console.log('[SyncService.triggerStoriesSync] 开始同步作者作品:', authorId)

    // 1. 更新同步状态为进行中
    await prisma.authorStoriesSync.upsert({
      where: { authorId },
      update: {
        syncStatus: 'SYNCING',
        lastSynced: new Date(),
        errorMessage: null
      },
      create: {
        authorId,
        syncStatus: 'SYNCING'
      }
    })

    // 2. 异步执行同步操作
    this.syncAuthorStoriesAsync(authorId).catch(error => {
      console.error('[SyncService.triggerStoriesSync] 同步失败:', error)
    })
  }

  /**
   * 从链上获取作者作品列表并同步到数据库
   */
  private async syncAuthorStoriesAsync(authorId: string) {
    let rawContent: string | null = null;
    try {
      console.log('[SyncService.syncAuthorStoriesAsync] 开始异步同步:', authorId)

      // 1. 获取作者钱包地址
      const author = await prisma.user.findUnique({
        where: { id: authorId }
      })

      if (!author?.address) {
        throw new Error('作者信息不存在')
      }

      // 2. 从链上获取作品列表
      const provider = await this.ensureProvider()
      if (!provider) {
        throw new Error('无法获取 provider')
      }

      const storyManager = new Contract(
        CONTRACT_ADDRESS.StoryManager,
        CONTRACT_ABI.StoryManager,
        provider
      )
      
      const onchainStoryIds = await storyManager.getAuthorStories(author.address)
      console.log('[SyncService.syncAuthorStoriesAsync] 从链上获取到作品 IDs:', onchainStoryIds)

      // 3. 同步每个作品
      for (const storyId of onchainStoryIds) {
        try {
          // 获取链上作品详情
          const story = await storyManager.stories(storyId)
          console.log(`[SyncService.syncAuthorStoriesAsync] 作品 ID ${storyId} 链上数据:`, story)

          // 安全地处理数据
          const storyData = {
            id: storyId.toString(),
            title: story.title || '',
            authorId: story.author || '',
            contentHash: story.contentCid || '',
            coverCid: story.coverCid || '/images/story-default-cover.jpg',
            createdAt: story.createdAt ? new Date(story.createdAt.toNumber() * 1000) : new Date(),
            updatedAt: story.lastUpdate ? new Date(story.lastUpdate.toNumber() * 1000) : new Date()
          }

          console.log(`[SyncService.syncAuthorStoriesAsync] 作品 ID ${storyId} 的 contentHash:`, storyData.contentHash);
          // 从 IPFS 获取内容
          const response = await getFromIPFS(storyData.contentHash);

          if (!response) {
            throw new Error('无法获取IPFS内容')
          }

          // 确保 response 是字符串
          rawContent = response;
          if (typeof response === 'object') {
            rawContent = JSON.stringify(response);
          }

          console.log(`[SyncService.syncAuthorStoriesAsync] 作品 ID ${storyId} IPFS原始内容:`, rawContent)
          
          let content;
          try {
            content = JSON.parse(rawContent)
            console.log(`[SyncService.syncAuthorStoriesAsync] 作品 ID ${storyId} JSON解析成功:`, content)
          } catch (parseError) {
            console.error(`[SyncService.syncAuthorStoriesAsync] 作品 ID ${storyId} JSON解析失败，使用原始内容:`, parseError)
            // 如果不是JSON格式，使用原始内容构建一个基本的内容对象
            const description = typeof rawContent === 'string' 
              ? rawContent.slice(0, 200)  // 如果是字符串，取前200个字符
              : String(rawContent).slice(0, 200);  // 如果不是字符串，先转换成字符串
            
            content = {
              content: rawContent,
              description: description,
              timestamp: new Date().toISOString(),
              version: '1.0'
            }
          }
          
          // 保存到数据库
          await prisma.story.upsert({
            where: { 
              id: storyData.id 
            },
            update: {
              title: storyData.title,
              description: content.description || '',
              contentCid: storyData.contentHash,
              coverCid: storyData.coverCid,
              updatedAt: storyData.updatedAt
            },
            create: {
              id: storyData.id,
              title: storyData.title,
              description: content.description || '',
              contentCid: storyData.contentHash,
              coverCid: storyData.coverCid,
              authorId: author.id,
              category: content.category || 'GENERAL',
              tags: content.tags || [],
              createdAt: storyData.createdAt,
              updatedAt: storyData.updatedAt,
              wordCount: 0,
              targetWordCount: 10000
            }
          })

          console.log(`[SyncService.syncAuthorStoriesAsync] 作品 ID ${storyId} 同步完成`)
        } catch (error) {
          console.error(`[SyncService.syncAuthorStoriesAsync] 作品 ID ${storyId} 同步失败:`, error)
          // 继续同步其他作品
          continue
        }
      }

      // 4. 更新同步状态为完成
      if (rawContent) {
        await prisma.authorStoriesSync.update({
          where: { authorId },
          data: {
            syncStatus: 'COMPLETED',
            lastSynced: new Date(),
            errorMessage: null
          }
        });
        console.log('[SyncService.syncAuthorStoriesAsync] 同步完成:', authorId);
      } else {
        // 如果获取失败，更新状态为失败
        await prisma.authorStoriesSync.update({
          where: { authorId },
          data: {
            syncStatus: 'FAILED',
            errorMessage: '无法获取IPFS内容',
            retryCount: {
              increment: 1
            }
          }
        });
        console.error('[SyncService.syncAuthorStoriesAsync] 同步失败: 无法获取IPFS内容');
      }
    } catch (error) {
      console.error('[SyncService.syncAuthorStoriesAsync] 同步失败:', error)

      // 5. 更新同步状态为失败
      await prisma.authorStoriesSync.update({
        where: { authorId },
        data: {
          syncStatus: 'FAILED',
          errorMessage: error instanceof Error ? error.message : '同步失败',
          retryCount: {
            increment: 1
          }
        }
      })

      throw error
    }
  }

  //上传章节数据到链上(后端不考虑用合约写入功能，所有合约相关都是尽可能在前端，通过钱包组件调用合约实现)
  // async uploadChapterData(chapterData: any) {
  //   console.log('[SyncService.uploadChapterData] 开始上传章节数据:', chapterData)

  //   try {
  //     // 确保 provider 已初始化
  //     const provider = await this.ensureProvider()
  //     if (!provider) {
  //       throw new Error('无法获取 provider')
  //     }

  //     // 获取故事信息，以获取链上 ID
  //     const chapter = await prisma.chapter.findUnique({
  //       where: { id: chapterData.id },
  //       include: {
  //         story: true
  //       }
  //     })

  //     if (!chapter || !chapter.story) {
  //       throw new Error('章节或故事信息不存在')
  //     }

  //     // 获取故事的链上 ID
  //     const storyChainId = chapter.story.nftAddress ? parseInt(chapter.story.nftAddress) : 0;
  //     if (!storyChainId) {
  //       throw new Error('故事链上 ID 不存在')
  //     }

  //     // 计算章节字数
  //     const wordCount = chapterData.content ? chapterData.content.length : 0

  //     // 获取带签名的合约实例
  //     const contract = getContractWithSigner(
  //       CONTRACT_ADDRESS.StoryManager,
  //       CONTRACT_ABI.StoryManager,
  //       provider
  //     )
      
  //     console.log('[SyncService.uploadChapterData] 调用合约更新章节:', {
  //       storyId: storyChainId,
  //       chapterNumber: chapter.order,
  //       title: chapterData.title,
  //       wordCount
  //     })

  //     // 调用合约的 updateChapter 函数
  //     // 参数：故事ID, 章节序号, 章节标题, 内容摘要, 字数
  //     const tx = await contract.updateChapter(
  //       storyChainId,         // 故事的链上ID
  //       chapter.order,        // 章节序号
  //       chapterData.title,    // 章节标题
  //       '',                   // 内容摘要，这里不使用 contentCid
  //       wordCount             // 章节字数
  //     )
      
  //     // 等待交易确认
  //     const receipt = await tx.wait()
      
  //     console.log('[SyncService.uploadChapterData] 章节上链成功:', receipt.transactionHash)

  //     // 更新数据库中的章节信息
  //     const updatedChapter = await prisma.chapter.update({
  //       where: { id: chapterData.id },
  //       data: {
  //         title: chapterData.title,
  //         content: chapterData.content,
  //         status: chapterData.status,
  //         txHash: receipt.transactionHash,
  //         wordCount,
  //         updatedAt: new Date()
  //       }
  //     })

  //     console.log('[SyncService.uploadChapterData] 章节数据上传完成:', updatedChapter)
  //     return updatedChapter
  //   } catch (error) {
  //     console.error('[SyncService.uploadChapterData] 章节数据上传失败:', error)
  //     throw error
  //   }
  // }



}






// 导出单例实例
export const syncService = new SyncService()