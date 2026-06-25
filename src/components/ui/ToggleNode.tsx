import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent, type NodeViewProps } from '@tiptap/react'
import { useState } from 'react'

export const Toggle = Node.create({
  name: 'toggle',
  group: 'block',
  content: 'block+',
  addAttributes() {
    return { open: { default: true } }
  },
  parseHTML() {
    return [{ tag: 'div[data-type="toggle"]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'toggle' }), 0]
  },
  addNodeView() {
    return ReactNodeViewRenderer(ToggleComponent)
  },
})

function ToggleComponent({ node, updateAttributes }: NodeViewProps) {
  const [open, setOpen] = useState(node.attrs.open)
  const toggle = () => {
    const next = !open
    setOpen(next)
    updateAttributes({ open: next })
  }
  return (
    <NodeViewWrapper className="toggle-item" data-open={open}>
      <div className="toggle-arrow" contentEditable={false} onClick={toggle}>
        <span>{open ? '▼' : '▶'}</span>
      </div>
      <div className="toggle-content" style={{ display: open ? 'block' : 'none' }}>
        <NodeViewContent />
      </div>
    </NodeViewWrapper>
  )
}
