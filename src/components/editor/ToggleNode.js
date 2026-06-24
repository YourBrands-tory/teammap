import { Node, mergeAttributes } from '@tiptap/core';

export const ToggleTitle = Node.create({
  name: 'toggleTitle',
  content: 'inline*',
  defining: true,
  addAttributes() {
    return {};
  },
  parseHTML() {
    return [{ tag: 'summary' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['summary', mergeAttributes(HTMLAttributes), 0];
  },
  addKeyboardShortcuts() {
    return {
      Enter: () => {
        const { selection } = this.editor.state;
        const $from = selection.$from;
        if ($from.parent.type.name === 'toggleTitle') {
          return this.editor.chain().splitToggleContent().run();
        }
        return false;
      },
    };
  },
});

export const ToggleContent = Node.create({
  name: 'toggleContent',
  content: 'block+',
  defining: true,
  parseHTML() {
    return [{ tag: 'div[data-type="toggle-content"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ 'data-type': 'toggle-content' }, HTMLAttributes), 0];
  },
});

export const Toggle = Node.create({
  name: 'toggle',
  group: 'block',
  content: 'toggleTitle toggleContent',
  defining: true,
  isolating: true,
  addAttributes() {
    return {
      open: { default: false, parseHTML: el => el.classList.contains('open'), renderHTML: attrs => attrs.open ? { class: 'open' } : {} },
    };
  },
  parseHTML() {
    return [{ tag: 'div[data-type="toggle"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ 'data-type': 'toggle' }, HTMLAttributes), 0];
  },
  addCommands() {
    return {
      insertToggle: () => ({ chain }) => {
        return chain()
          .insertContent({
            type: 'toggle',
            attrs: { open: false },
            content: [
              { type: 'toggleTitle', content: [{ type: 'text', text: 'Toggle' }] },
              { type: 'toggleContent', content: [{ type: 'paragraph' }] },
            ],
          })
          .run();
      },
      toggleOpen: () => ({ state, dispatch }) => {
        const { selection } = state;
        const pos = selection.$from;
        let toggleNode = pos.node(pos.depth);
        if (toggleNode.type.name !== 'toggle') {
          for (let d = pos.depth; d > 0; d--) {
            toggleNode = pos.node(d);
            if (toggleNode.type.name === 'toggle') break;
          }
        }
        if (toggleNode.type.name !== 'toggle') return false;
        const tr = state.tr.setNodeMarkup(pos.before(pos.depth), undefined, { open: !toggleNode.attrs.open });
        if (dispatch) dispatch(tr);
        return true;
      },
    };
  },
  addKeyboardShortcuts() {
    return {
      'Mod-Enter': () => this.editor.commands.toggleOpen(),
    };
  },
});
