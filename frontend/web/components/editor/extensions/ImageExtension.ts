import Image from '@tiptap/extension-image'
import { mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import DraggableImage from '../components/DraggableImage'

export const ImageExtension = Image.configure({
  inline: true,
  allowBase64: true,
}).extend({
  name: 'customImage',

  addAttributes() {
    return {
      ...Image.config.addAttributes(),
      width: {
        default: null,
        parseHTML: element => element.getAttribute('width'),
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
        parseHTML: element => element.getAttribute('height'),
        renderHTML: attributes => {
          if (!attributes.height) {
            return {}
          }
          return {
            height: attributes.height,
          }
        },
      },
      dataId: {
        default: null,
        parseHTML: element => element.getAttribute('data-id'),
        renderHTML: attributes => {
          if (!attributes.dataId) {
            return {}
          }
          return {
            'data-id': attributes.dataId,
          }
        },
      },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(DraggableImage)
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
      class: 'editor-image',
      draggable: 'true',
    })]
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