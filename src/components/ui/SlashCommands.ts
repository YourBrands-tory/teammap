import { Extension } from '@tiptap/core'
import Suggestion from '@tiptap/suggestion'
import type { Editor, Range } from '@tiptap/core'

interface CommandProps {
  editor: Editor
  range: Range
}

interface SlashItem {
  title: string
  icon: string
  description: string
  command: (props: CommandProps) => void
}

const items: SlashItem[] = [
  {
    title: 'Heading 1', icon: 'H1', description: 'Large section heading',
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run(),
  },
  {
    title: 'Heading 2', icon: 'H2', description: 'Medium section heading',
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run(),
  },
  {
    title: 'Heading 3', icon: 'H3', description: 'Small section heading',
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run(),
  },
  {
    title: 'Paragraph', icon: '¶', description: 'Regular text',
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setNode('paragraph').run(),
  },
  {
    title: 'Bullet List', icon: '•', description: 'Create a bullet list',
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBulletList().run(),
  },
  {
    title: 'Numbered List', icon: '1.', description: 'Create a numbered list',
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
  },
  {
    title: 'To-do List', icon: '☑', description: 'Create a task list',
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleTaskList().run(),
  },
  {
    title: 'Blockquote', icon: '"', description: 'Insert a quote',
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
  },
  {
    title: 'Code Block', icon: '<>', description: 'Insert a code block',
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
  },
  {
    title: 'Divider', icon: '—', description: 'Insert a horizontal rule',
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
  },
  {
    title: 'Toggle', icon: '▶', description: 'Collapsible toggle block',
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).insertContent({
      type: 'toggle',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Toggle' }] },
      ],
    }).run(),
  },
]

export const SlashCommands = Extension.create({
  name: 'slash-commands',

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        char: '/',
        startOfLine: true,
        command: ({ editor, range, props }) => {
          props.command({ editor, range })
        },
        items: ({ query }) => {
          if (!query) return items
          return items.filter(i =>
            i.title.toLowerCase().includes(query.toLowerCase())
          )
        },
        render: () => {
          let dom: HTMLDivElement | null = null
          let selectedIndex = 0
          let currentItems: SlashItem[] = []
          let currentCommand: ((item: SlashItem) => void) | null = null

          const updateItems = (props: any) => {
            if (!dom) return
            currentItems = props.items
            currentCommand = props.command
            if (selectedIndex >= currentItems.length) selectedIndex = 0
            dom.innerHTML = ''
            currentItems.forEach((item, i) => {
              const btn = document.createElement('button')
              btn.className = `slash-menu-item${i === selectedIndex ? ' active' : ''}`
              btn.type = 'button'
              btn.innerHTML = `<span class="slash-menu-item-icon">${item.icon}</span><span class="slash-menu-item-text"><span class="slash-menu-item-label">${item.title}</span><span class="slash-menu-item-desc">${item.description}</span></span>`
              btn.onclick = () => currentCommand?.(item)
              btn.onmouseenter = () => {
                selectedIndex = i
                dom?.querySelectorAll('.slash-menu-item').forEach((el, idx) => {
                  el.classList.toggle('active', idx === i)
                })
              }
              dom!.appendChild(btn)
            })
          }

          const updatePosition = (props: any) => {
            if (!dom) return
            const rect = props.clientRect?.()
            if (!rect) return
            dom.style.top = `${rect.bottom + 4}px`
            dom.style.left = `${rect.left}px`
          }

          return {
            onStart(props) {
              selectedIndex = 0
              dom = document.createElement('div')
              dom.className = 'slash-menu'
              document.body.appendChild(dom)
              updateItems(props)
              updatePosition(props)
            },
            onUpdate(props) {
              updateItems(props)
              updatePosition(props)
            },
            onKeyDown(props) {
              if (props.event.key === 'ArrowDown') {
                selectedIndex = (selectedIndex + 1) % currentItems.length
                updateItems(props)
                return true
              }
              if (props.event.key === 'ArrowUp') {
                selectedIndex = (selectedIndex - 1 + currentItems.length) % currentItems.length
                updateItems(props)
                return true
              }
              if (props.event.key === 'Enter') {
                if (currentItems[selectedIndex] && currentCommand) {
                  currentCommand(currentItems[selectedIndex])
                }
                return true
              }
              if (props.event.key === 'Escape') {
                dom?.remove()
                dom = null
                return true
              }
              return false
            },
            onExit() {
              dom?.remove()
              dom = null
            },
          }
        },
      }),
    ]
  },
})
