import { Node, mergeAttributes } from '@tiptap/core';

export const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  defining: true,
  addAttributes() {
    return {
      type: { default: 'info', parseHTML: el => el.getAttribute('data-callout-type') || 'info', renderHTML: attrs => ({ 'data-callout-type': attrs.type }) },
    };
  },
  parseHTML() {
    return [{ tag: 'div[data-type="callout"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ 'data-type': 'callout', class: 'callout-block' }, HTMLAttributes), 0];
  },
  addCommands() {
    return {
      insertCallout: () => ({ chain }) => {
        return chain()
          .insertContent({
            type: 'callout',
            attrs: { type: 'info' },
            content: [{ type: 'paragraph' }],
          })
          .run();
      },
    };
  },
});
