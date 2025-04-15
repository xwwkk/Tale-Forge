import { Extension } from '@tiptap/core'

export interface IndentOptions {
  types: string[]
  minIndent: number
  maxIndent: number
}

interface IndentAttributes {
  indent: number
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    indent: {
      indent: () => ReturnType
      outdent: () => ReturnType
    }
  }
}

export const Indent = Extension.create<IndentOptions>({
  name: 'indent',

  addOptions() {
    return {
      types: ['paragraph', 'heading'],
      minIndent: 0,
      maxIndent: 8,
    }
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: 0,
            renderHTML: attributes => ({
              style: `margin-left: ${attributes.indent}em`
            }),
            parseHTML: element => {
              const indent = parseInt(element.style.marginLeft) || 0
              return indent
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      indent: () => ({ commands }) => {
        return this.options.types.every(type => 
          commands.updateAttributes(type, (attributes: IndentAttributes) => ({
            indent: Math.min((attributes.indent || 0) + 1, this.options.maxIndent),
          }))
        )
      },
      outdent: () => ({ commands }) => {
        return this.options.types.every(type => 
          commands.updateAttributes(type, (attributes: IndentAttributes) => ({
            indent: Math.max((attributes.indent || 0) - 1, this.options.minIndent),
          }))
        )
      },
    }
  },
}) 