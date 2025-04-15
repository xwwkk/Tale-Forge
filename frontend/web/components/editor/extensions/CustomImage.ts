import { mergeAttributes } from '@tiptap/core'
import Image from '@tiptap/extension-image'

export interface CustomImageOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    customImage: {
      setImage: (options: { 
        src: string, 
        alt?: string, 
        title?: string,
        width?: number,
        height?: number 
      }) => ReturnType
    }
  }
}

export const CustomImage = Image.configure({
  HTMLAttributes: {
    class: 'resizable-image',
  },
}).extend({
  name: 'customImage',

  addAttributes() {
    return {
      ...Image.config.addAttributes(),
      width: {
        default: null,
        renderHTML: attributes => {
          if (!attributes.width) {
            return {}
          }
          return {
            width: attributes.width,
          }
        },
      },
      height: {
        default: null,
        renderHTML: attributes => {
          if (!attributes.height) {
            return {}
          }
          return {
            height: attributes.height,
          }
        },
      },
    }
  },

  addCommands() {
    return {
      setImage: options => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options
        })
      },
    }
  },
}) 