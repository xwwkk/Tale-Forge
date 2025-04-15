export interface TiptapEditorProps {
  initialContent?: string | null;
  onChange: (content: string) => void;
  editable: boolean;
  className?: string;
  placeholder?: string;
  onSave?: () => void;
  storyId?: string;
  chapterId?: string;
} 