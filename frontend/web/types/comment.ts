export interface User {
  id: string
  name: string
  avatar: string
}

export interface Reply {
  id: string
  content: string
  author: User
  createdAt: string
  likes: number
  isLiked: boolean
}

export interface Comment {
  id: string
  content: string
  author: User
  createdAt: string
  likes: number
  isLiked: boolean
  replies: Reply[]
  replyCount: number
}

export interface CommentListProps {
  storyId: string
  chapterId: string
}

export interface CommentItemProps {
  comment: Comment
  onLike: (commentId: string) => void
  onReply: (commentId: string) => void
  onDelete: (commentId: string) => void
}

export interface CommentInputProps {
  storyId: string
  chapterId: string
  replyTo?: {
    commentId: string
    userName: string
  }
  onSubmit: (content: string) => Promise<void>
  onCancel?: () => void
}

export interface CommentFormData {
  content: string
  parentId?: string
} 