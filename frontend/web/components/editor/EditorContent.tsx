'use client'

import React from 'react'
import { Editor, EditorContent as TiptapEditorContent } from '@tiptap/react'

interface EditorContentProps {
  editor: Editor | null
}

const EditorContentWrapper: React.FC<EditorContentProps> = ({ editor }) => {
  if (!editor) {
    return null
  }

  return (
    <div suppressHydrationWarning>
      <TiptapEditorContent editor={editor} />
    </div>
  )
}

export default EditorContentWrapper 