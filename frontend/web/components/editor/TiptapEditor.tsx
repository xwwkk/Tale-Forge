'use client'

import React, { useCallback, useState, useEffect, memo, useRef, useMemo } from 'react'
import { useEditor, EditorContent, Editor } from '@tiptap/react'
import { Extension } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import TextStyle from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { FontSize } from './extensions/fontSize'
import { Indent } from './extensions/indent'
import { ResizableImageNode } from './extensions/ResizableImageNode'
import { AutoFormatter } from '@/utils/autoFormat'
import {
  FaBold,
  FaItalic,
  FaUnderline,
  FaStrikethrough,
  FaQuoteRight,
  FaListUl,
  FaListOl,
  FaImage,
  FaLink,
  FaCog,
  FaAlignLeft,
  FaAlignCenter,
  FaAlignRight,
  FaSave,
  FaHistory,
  FaFont,
  FaPalette,
  FaCheck,
  FaIndent,
  FaOutdent,
  FaMagic,
  FaRobot,
  FaDownload,
  FaEdit,
  FaTimes
} from 'react-icons/fa'
import styles from './TiptapEditor.module.css'
import { ImageExtension } from './extensions/ImageExtension'
import ImageResizer from './components/ImageResizer'
import { TiptapEditorProps } from './types'
import AIImageGenerator from '../common/AIImageGenerator'
import { toast } from 'react-hot-toast'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (size: number) => ReturnType;
    };
  }
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    indent: {
      indent: () => ReturnType;
      outdent: () => ReturnType;
    };
  }
}

// 添加自定义扩展来处理 Tab 键
const TabHandler = Extension.create({
  name: 'tabHandler',
  
  addKeyboardShortcuts() {
    return {
      Tab: ({ editor }) => {
        // 阻止默认行为
        const event = window.event;
        if (event) {
          event.preventDefault();
        }
        
        // 插入不间断空格而不是使用缩进功能
        return editor.commands.insertContent('\u00A0\u00A0\u00A0\u00A0');
      },
      'Shift-Tab': ({ editor }) => {
        // 阻止默认行为
        const event = window.event;
        if (event) {
          event.preventDefault();
        }
        
        // 使用减少缩进功能
        return editor.commands.outdent();
      }
    }
  },
})

// 添加自定义扩展来处理键盘快捷键
const KeyboardShortcuts = Extension.create({
  name: 'keyboardShortcuts',
  
  addKeyboardShortcuts() {
    return {
      // 保存快捷键
      'Mod-s': () => {
        // 触发保存按钮点击
        const saveButton = document.querySelector(`.${styles.saveButton}`) as HTMLButtonElement;
        if (saveButton) {
          saveButton.click();
        }
        return true;
      },
      
      // 其他快捷键可以在这里添加
    }
  },
})

// AI 生图提示框组件
const AIPromptModal = ({ onClose, onSubmit, initialValue = '' }: { 
  onClose: () => void, 
  onSubmit: (prompt: string, resolution: string, style?: string, referenceImage?: string) => void,
  initialValue?: string 
}) => {
  const [prompt, setPrompt] = useState(initialValue);
  const [style, setStyle] = useState<string | null>(null);
  const [resolution, setResolution] = useState('1024:1024');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showStyle, setShowStyle] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (prompt.trim()) {
        onSubmit(prompt.trim(), resolution, style || undefined, referenceImage || undefined);
        onClose();
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file);
    }
  };

  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('请上传图片文件');
      return;
    }

    // 检查文件大小（5MB限制）
    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片大小不能超过5MB');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);
            
            const base64String = canvas.toDataURL('image/jpeg', 0.8);
            const base64Data = base64String.split(',')[1];
            if (!base64Data || !/^[A-Za-z0-9+/=]+$/.test(base64Data)) {
              throw new Error('Invalid base64 data');
            }
            setReferenceImage(base64Data);
          }
        };
        img.onerror = () => {
          toast.error('图片加载失败，请重试');
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = () => {
        toast.error('文件读取失败，请重试');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('图片处理失败:', error);
      toast.error('图片处理失败，请重试');
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleRemoveImage = () => {
    setReferenceImage(null);
  };

  const handleToggleUpload = () => {
    setShowUpload(!showUpload);
    if (!showUpload) {
      setReferenceImage(null);
    }
  };

  const styleOptions = [
    { value: 'manhua', label: '漫画' },
    { value: 'xieshi', label: '写实' },
    { value: 'dongman', label: '动漫' },
    { value: '3dxuanran', label: '3D渲染' },
    { value: 'riman', label: '日漫动画' },
    { value: 'bianping', label: '扁平插画' },
    { value: 'xiangsu', label: '像素插画' },
    { value: 'saibopengke', label: '赛博朋克' },
  ];

  const resolutionOptions = [
    { value: '1024:1024', label: '1 ： 1' },
    { value: '768:1024', label: '3 ： 4' },
    { value: '1024:768', label: '4 ： 3' },
    { value: '720:1280', label: '9 ： 16' },
    { value: '1280:720', label: '16 ： 9' }
  ];

  return (
    <AIImageGenerator isOpen={true} onClose={onClose} title="AI 生图">
      <textarea
        ref={textareaRef}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="描述您想要生成的图片，例如：一只可爱的猫咪在阳光下玩耍"
        rows={4}
        className={styles.promptTextarea}
      />
      <div className={styles.uploadToggle}>
        <button
          onClick={handleToggleUpload}
          className={`${styles.toggleButton} ${showUpload ? styles.toggleButtonActive : ''}`}
        >
          <FaImage className={styles.toggleIcon} />
          {showUpload ? '关闭参考图片' : '添加参考图片'}
        </button>
      </div>
      {showUpload && (
        <div 
          className={`${styles.uploadArea} ${isDragging ? styles.dragging : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
          />
          {referenceImage ? (
            <div style={{ position: 'relative', width: '100%', maxWidth: '300px', margin: '0 auto' }}>
              <img 
                src={`data:image/jpeg;base64,${referenceImage}`}
                alt="参考图片" 
                className={styles.previewImage}
                style={{ 
                  width: '100%', 
                  height: 'auto', 
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  objectFit: 'contain'
                }} 
              />
              <button 
                className={styles.removeImage} 
                onClick={handleRemoveImage}
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  background: 'rgba(0, 0, 0, 0.5)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <FaTimes />
              </button>
            </div>
          ) : (
            <>
              <div className={styles.uploadIcon}>
                <FaImage />
              </div>
              <div className={styles.uploadText}>
                点击或拖拽图片到此处上传
              </div>
              <div className={styles.uploadHint}>
                支持 jpg、png... 格式，最大 5MB
              </div>
            </>
          )}
        </div>
      )}
      <div className={styles.promptOptions}>
        <div className={styles.optionGroup}>
          <label className={styles.optionLabel}>图片风格</label>
          <select
            value={style || ''}
            onChange={(e) => setStyle(e.target.value || null)}
            className={styles.optionSelect}
          >
            <option value="">默认风格</option>
            {styleOptions.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className={styles.promptOptions}>
        <div className={styles.optionGroup}>
          <label className={styles.optionLabel}>分辨率</label>
          <select
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            className={styles.optionSelect}
          >
            {resolutionOptions.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className={styles.promptButtons}>
        <button
          onClick={onClose}
          className={styles.cancelButton}
        >
          取消
        </button>
        <button
          onClick={() => {
            if (prompt.trim()) {
              onSubmit(prompt.trim(), resolution, style || undefined, referenceImage || undefined);
              onClose();
            }
          }}
          disabled={!prompt.trim()}
          className={styles.generateButton}
        >
          生成图片
        </button>
      </div>
    </AIImageGenerator>
  );
};

// 工具栏组件
const MenuBar = memo(({ editor, onImageClick, onSave, onImageSelect }: { 
  editor: Editor | null, 
  onImageClick: () => void, 
  onSave?: () => void,
  onImageSelect?: (event: React.ChangeEvent<HTMLInputElement>) => void 
}) => {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontSize, setShowFontSize] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAIPrompt, setShowAIPrompt] = useState(false);

  const addLink = useCallback(() => {
    if (!editor) return;
    const url = window.prompt('输入链接URL:')
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }, [editor]);

  const setFontSize = useCallback((size: number) => {
    if (!editor) return;
    editor.chain().focus().setMark('textStyle', { fontSize: `${size}px` }).run();
  }, [editor]);

  const setColor = useCallback((color: string) => {
    if (!editor) return;
    editor.chain().focus().setColor(color).run();
  }, [editor]);

  const handleAutoFormat = useCallback(() => {
    if (!editor) return;
    const content = editor.getHTML();
    const formatted = AutoFormatter.format(content);
    editor.commands.setContent(formatted);
  }, [editor]);

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (!editor || !event.target.files?.length) return;

    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      if (imageUrl) {
        const imgElement = document.createElement('img');
        imgElement.onload = () => {
          const maxWidth = 800;
          let width = imgElement.naturalWidth;
          let height = imgElement.naturalHeight;

          if (width > maxWidth) {
            const ratio = maxWidth / width;
            width = maxWidth;
            height = Math.round(height * ratio);
          }

          editor.commands.setImage({ 
            src: imageUrl,
            alt: file.name,
            title: file.name,
            width,
            height
          });
        };
        imgElement.src = imageUrl;
      }
    };

    reader.readAsDataURL(file);
    event.target.value = '';
  }, [editor]);


  const insertIndent = useCallback(() => {
    if (!editor) return;
    console.log('通过按钮插入缩进');
    editor.commands.insertContent('    ');
  }, [editor]);

  const handleSave = useCallback(() => {
    if (onSave) {
      onSave();
    } else {
      console.log('保存功能未实现');
    }
  }, [onSave]);

  const handleAIImage = useCallback(async () => {
    if (!editor) return;
    
    try {
      const selectedText = editor.state.selection.empty 
        ? null 
        : editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to);

      setShowAIPrompt(true);
      
      if (selectedText) {
        setTimeout(() => {
          const textarea = document.querySelector(`.${styles.promptTextarea}`) as HTMLTextAreaElement;
          if (textarea) {
            textarea.value = selectedText;
          }
        }, 0);
      }
    } catch (error) {
      console.error('AI 生图失败:', error);
      alert('生成图片失败，请重试');
    }
  }, [editor]);

  const generateImage = async (prompt: string, resolution: string, style?: string, referenceImage?: string) => {
    if (!editor) return;
    
    let progressInterval: NodeJS.Timeout | undefined;
    let loadingDialog: HTMLDivElement | undefined;
    
    try {
      loadingDialog = document.createElement('div');
      loadingDialog.className = styles.imagePreviewDialog;
      loadingDialog.innerHTML = `
        <div class="${styles.imagePreviewContent}">
          <div class="${styles.loadingContainer}">
            <div class="${styles.loadingSpinner}"></div>
            <div class="${styles.loadingText}">正在生成图片...</div>
            <div class="${styles.progressBar}">
              <div class="${styles.progressFill}"></div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(loadingDialog);

      let progress = 0;
      progressInterval = setInterval(() => {
        progress += 5;
        const progressFill = loadingDialog?.querySelector(`.${styles.progressFill}`) as HTMLElement;
        if (progressFill) {
          progressFill.style.width = `${Math.min(progress, 90)}%`;
        }
      }, 500);

      const requestBody = {
        prompt,
        resolution,
        ...(style && { style }),
        ...(referenceImage && { referenceImage }) 
      };

      const response = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        clearInterval(progressInterval);
        document.body.removeChild(loadingDialog);
        throw new Error('生成图片失败');
      }

      const { imageUrl } = await response.json();

      const imgLoader = new Image();
      imgLoader.src = imageUrl;

      await new Promise((resolve, reject) => {
        imgLoader.onload = resolve;
        imgLoader.onerror = reject;
      });

      clearInterval(progressInterval);
      document.body.removeChild(loadingDialog);

      const previewDialog = document.createElement('div');
      previewDialog.className = styles.imagePreviewDialog;
      previewDialog.innerHTML = `
        <div class="${styles.imagePreviewContent}">
          <div class="${styles.imageContainer}" style="
            width: 100%;
            max-width: 90vw;
            max-height: 80vh;
            overflow: auto;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
            background: #f5f5f5;
            border-radius: 8px;
            margin-bottom: 20px;
          ">
            <img src="${imageUrl}" alt="${prompt}" style="
              max-width: 100%;
              max-height: 70vh;
              object-fit: contain;
              border-radius: 4px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            " />
          </div>
          <div class="${styles.imageActions}" style="
            display: flex;
            gap: 12px;
            justify-content: center;
            margin-top: 20px;
          ">
            <button class="${styles.downloadButton}" style="
              padding: 8px 16px;
              background: #4CAF50;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              display: flex;
              align-items: center;
              gap: 8px;
              transition: background 0.2s;
            ">
              <span class="${styles.buttonIcon}"><i class="fas fa-download"></i></span>
              下载图片
            </button>
            <button class="${styles.insertButton}" style="
              padding: 8px 16px;
              background: #2196F3;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              display: flex;
              align-items: center;
              gap: 8px;
              transition: background 0.2s;
            ">
              <span class="${styles.buttonIcon}"><i class="fas fa-edit"></i></span>
              插入到编辑器
            </button>
            <button class="${styles.cancelButton}" style="
              padding: 8px 16px;
              background: #f44336;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              display: flex;
              align-items: center;
              gap: 8px;
              transition: background 0.2s;
            ">
              <span class="${styles.buttonIcon}"><i class="fas fa-times"></i></span>
              取消
            </button>
          </div>
        </div>
      `;

      previewDialog.querySelector(`.${styles.downloadButton}`)?.addEventListener('click', () => {
        window.open(imageUrl, '_blank');
      });

      previewDialog.querySelector(`.${styles.insertButton}`)?.addEventListener('click', () => {
        editor.chain().focus().setImage({ 
          src: imageUrl,
          alt: prompt,
          title: prompt
        }).run();
        document.body.removeChild(previewDialog);
      });

      previewDialog.querySelector(`.${styles.cancelButton}`)?.addEventListener('click', () => {
        document.body.removeChild(previewDialog);
      });


      const buttons = previewDialog.querySelectorAll('button');
      buttons.forEach(button => {
        button.addEventListener('mouseover', () => {
          button.style.opacity = '0.9';
        });
        button.addEventListener('mouseout', () => {
          button.style.opacity = '1';
        });
      });


      document.body.appendChild(previewDialog);
    } catch (error) {
      console.error('AI 生图失败:', error);
      if (typeof progressInterval !== 'undefined') {
        clearInterval(progressInterval);
      }
      if (loadingDialog && document.body.contains(loadingDialog)) {
        document.body.removeChild(loadingDialog);
      }
      toast.error('生成图片失败，请重试');
    }
  };

  if (!editor) return null;

  return (
    <>
      <div className={styles.menuBar}>
        <div className={styles.toolGroup}>
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? styles.isActive : ''}
            title="粗体"
          >
            <FaBold />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? styles.isActive : ''}
            title="斜体"
          >
            <FaItalic />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={editor.isActive('underline') ? styles.isActive : ''}
            title="下划线"
          >
            <FaUnderline />
          </button>
        </div>

        <div className={styles.divider} />

        <div className={styles.toolGroup}>
          <button
            onClick={() => editor.chain().focus().indent().run()}
            title="增加缩进"
          >
            <FaIndent />
          </button>
          <button
            onClick={() => editor.chain().focus().outdent().run()}
            title="减少缩进"
          >
            <FaOutdent />
          </button>
          <button
            onClick={insertIndent}
            title="插入空格缩进"
            className={styles.indentButton}
          >
            空格缩进
          </button>
        </div>

        <div className={styles.divider} />

        <div className={styles.toolGroup}>
          <button
            onClick={handleAutoFormat}
            title="自动排版"
            className={styles.formatButton}
          >
            <FaMagic />
          </button>
        </div>

        <div className={styles.divider} />

        <div className={styles.toolGroup}>
          <button
            onClick={() => setShowFontSize(!showFontSize)}
            title="字号"
          >
            <FaFont />
          </button>
          {showFontSize && (
            <div className={styles.dropdown}>
              {[12, 14, 16, 18, 20, 24, 28, 32].map(size => (
                <button
                  key={size}
                  onClick={() => setFontSize(size)}
                  className={styles.dropdownItem}
                >
                  {size}px
                </button>
              ))}
            </div>
          )}
          
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            title="文字颜色"
          >
            <FaPalette />
          </button>
          {showColorPicker && (
            <div className={styles.colorPicker}>
              {['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFA500', '#800080'].map(color => (
                <button
                  key={color}
                  onClick={() => setColor(color)}
                  className={styles.colorButton}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          )}
        </div>

        <div className={styles.divider} />

        <div className={styles.toolGroup}>
          <button
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={editor.isActive({ textAlign: 'left' }) ? styles.isActive : ''}
            title="左对齐"
          >
            <FaAlignLeft />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={editor.isActive({ textAlign: 'center' }) ? styles.isActive : ''}
            title="居中"
          >
            <FaAlignCenter />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={editor.isActive({ textAlign: 'right' }) ? styles.isActive : ''}
            title="右对齐"
          >
            <FaAlignRight />
          </button>
        </div>

        <div className={styles.divider} />

        <div className={styles.toolGroup}>
          <input
            type="file"
            ref={imageInputRef}
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />
          <button 
            onClick={() => imageInputRef.current?.click()} 
            title="插入图片"
          >
            <FaImage />
          </button>
          <button 
            onClick={handleAIImage} 
            title="AI 生图"
            className={styles.aiButton}
          >
            <FaRobot />
          </button>
          <button onClick={addLink} title="插入链接">
            <FaLink />
          </button>
        </div>

        <div className={styles.divider} />

        <div className={styles.toolGroup}>
          <button
            onClick={() => setShowSettings(!showSettings)}
            title="设置"
            className={styles.settingsButton}
          >
            <FaCog />
          </button>
        </div>

        <div className={styles.rightTools}>
          <button
            onClick={handleSave}
            title="保存 (Ctrl+S)"
            className={styles.saveButton}
          >
            <FaSave />
          </button>
        </div>
      </div>
      {showAIPrompt && (
        <AIPromptModal
          onClose={() => setShowAIPrompt(false)}
          onSubmit={generateImage}
          initialValue={editor.state.selection.empty 
            ? '' 
            : editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to)
          }
        />
      )}
    </>
  )
});

MenuBar.displayName = 'MenuBar';

const TiptapEditor: React.FC<TiptapEditorProps> = ({
  initialContent = '',
  onChange,
  editable = true,
  className = '',
  placeholder = '开始写作...',
  onSave,
  storyId,
  chapterId
}) => {
  const handleTabKey = useCallback((editor: Editor) => {
    console.log('自定义 Tab 处理函数被调用');
    
    try {
      editor.commands.insertContent('    ');
      return true;
    } catch (error) {
      console.error('方法 1 失败:', error);
    }
    
    try {
      const { state, view } = editor;
      const { tr } = state;
      const transaction = tr.insertText('    ', state.selection.from, state.selection.to);
      view.dispatch(transaction);
      return true;
    } catch (error) {
      console.error('方法 2 失败:', error);
    }
    
    try {
      editor.chain().focus().insertContent('    ').run();
      return true;
    } catch (error) {
      console.error('方法 3 失败:', error);
    }
    
    return false;
  }, []);
  

  // 添加图片输入引用
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        paragraph: {
          HTMLAttributes: {
            class: 'editor-paragraph',
            spellcheck: 'false',
          },
        },
        heading: {
          levels: [1, 2, 3],
          HTMLAttributes: {
            class: 'editor-heading',
            spellcheck: 'false',
          },
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'editor-link',
          spellcheck: 'false',
        },
      }),
      Placeholder.configure({
        placeholder,
        showOnlyCurrent: false,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right'],
        defaultAlignment: 'left',
      }),
      Underline.configure({
        HTMLAttributes: {
          class: 'editor-underline',
          spellcheck: 'false',
        },
      }),
      TextStyle,
      Color,
      FontSize,
      Indent,
      ImageExtension.configure({
        inline: true,
        allowBase64: false,
        HTMLAttributes: {
          class: 'chapter-image',
        },
      }),
      TabHandler,
      KeyboardShortcuts,
    ],
    content: initialContent,
    editable,
    enablePasteRules: true,
    enableInputRules: true,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      console.log('编辑器内容更新:', html)
      onChange?.(html)
    },
    editorProps: {
      attributes: {
        spellcheck: 'false',
        autocorrect: 'off',
        autocapitalize: 'off',
      },
    },
  })

  useEffect(() => {
    if (editor) {
      editor.setEditable(editable)
    }
  }, [editor, editable])

  useEffect(() => {
    if (editor && initialContent !== editor.getHTML()) {
      console.log('更新编辑器内容:', initialContent)
      editor.commands.setContent(initialContent)
    }
  }, [editor, initialContent])

  // 添加全局键盘事件监听器
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果按下 Ctrl+S
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault(); // 阻止浏览器默认的保存行为
        if (onSave) {
          onSave();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onSave]);

  // 添加图片处理函数
  const handleImageSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (!editor || !event.target.files?.length) return;

    const file = event.target.files[0];
    
    // 验证文件类型和大小
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件');
      return;
    }

    // 验证文件大小（5MB）
    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片大小不能超过5MB');
      return;
    }

    // 创建临时URL并插入图片
    const tempUrl = URL.createObjectURL(file);
    const imgElement = document.createElement('img');
    imgElement.onload = () => {
      const maxWidth = 800;
      let width = imgElement.naturalWidth;
      let height = imgElement.naturalHeight;

      if (width > maxWidth) {
        const ratio = maxWidth / width;
        width = maxWidth;
        height = Math.round(height * ratio);
      }

      editor.commands.setImage({ 
        src: tempUrl,
        alt: file.name,
        title: file.name,
        width,
        height
      });

      // 在组件卸载时清理临时URL
      window.addEventListener('beforeunload', () => {
        URL.revokeObjectURL(tempUrl);
      });
    };
    imgElement.src = tempUrl;

    // 清除input值，允许重复选择同一文件
    event.target.value = '';
  }, [editor]);

  if (!editor) {
    return null
  }

  return (
    <div className={styles.editor}>
      {editable && <MenuBar editor={editor} onImageClick={() => {}} onSave={onSave} onImageSelect={handleImageSelect} />}
      <div className={editable ? styles.content : styles.previewContent}>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          style={{ display: 'none' }}
        />
        <EditorContent 
          editor={editor} 
          spellCheck="false" 
          autoCorrect="off" 
          autoCapitalize="off"
          className={styles.preserveWhitespace}
          onKeyDown={(e) => {
            if (e.key === 'Tab') {
              e.preventDefault();
              if (editor) {
                const success = handleTabKey(editor);
                console.log('Tab 键处理结果:', success ? '成功' : '失败');
              }
            }
          }}
        />
        <div className={styles.editorBottomBoundary}>
          文档结束
        </div>
      </div>
    </div>
  )
}

export default TiptapEditor; 