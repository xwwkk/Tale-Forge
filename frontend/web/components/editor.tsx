import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { cn } from '@/lib/utils'
import { useEffect } from 'react'

interface EditorProps {
  content: string
  onChange?: (content: string) => void
  editable?: boolean
  className?: string
}

const TipTapEditorContent = EditorContent as any

export function Editor({ content, onChange, editable = true, className }: EditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
  })

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  if (!editor) {
    return null
  }

  return (
    <div className={cn('prose prose-sm dark:prose-invert max-w-none', className)}>
      <TipTapEditorContent editor={editor} />
    </div>
  )
} 