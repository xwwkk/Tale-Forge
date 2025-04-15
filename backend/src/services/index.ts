export * from './story.service'
export * from './user.service'
export * from './comment.service'
export * from './sync.service'
export * from './image.service'
export * from './nft.service'

// 创建服务实例
import { StoryService } from './story.service'
import { UserService } from './user.service'
import { ImageService } from './image.service'
import { CommentService } from './comment.service'
import { NftService } from './nft.service'
import { AIService } from './ai.service'


export const storyService = new StoryService()
export const userService = new UserService()
export const commentService = new CommentService()
export const aiService = new AIService()
export const imageService = new ImageService()
export const nftService = new NftService()
