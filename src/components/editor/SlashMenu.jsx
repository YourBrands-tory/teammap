import { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { TextSelection } from '@tiptap/pm/state';

const GROUPS = [
  {
    label: 'Basic',
    items: [
      { title: 'Heading 1', command: 'h1', icon: 'H1', description: 'Large heading', searchTerms: ['h1', 'heading1', '#'] },
      { title: 'Heading 2', command: 'h2', icon: 'H2', description: 'Medium heading', searchTerms: ['h2', 'heading2', '##'] },
      { title: 'Heading 3', command: 'h3', icon: 'H3', description: 'Small heading', searchTerms: ['h3', 'heading3', '###'] },
      { title: 'Divider', command: 'divider', icon: '—', description: 'Horizontal separator', searchTerms: ['divider', 'hr', 'separator', '---'] },
    ],
  },
  {
    label: 'Lists',
    items: [
      { title: 'Bullet List', command: 'bulletList', icon: '•', description: 'Bulleted list', searchTerms: ['bullet', 'ul', 'list', '•'] },
      { title: 'Numbered List', command: 'orderedList', icon: '1.', description: 'Numbered list', searchTerms: ['numbered', 'ol', 'ordered', '1'] },
      { title: 'Checklist', command: 'taskList', icon: '☑', description: 'Checklist', searchTerms: ['checklist', 'todo', 'task', 'checkbox', '✓'] },
    ],
  },
  {
    label: 'Blocks',
    items: [
      { title: 'Toggle', command: 'toggle', icon: '▶', description: 'Collapsible section', searchTerms: ['toggle', 'collapse', 'details'] },
      { title: 'Quote', command: 'blockquote', icon: '〝', description: 'Blockquote', searchTerms: ['quote', 'blockquote', '>'] },
      { title: 'Code', command: 'codeBlock', icon: '</>', description: 'Code block', searchTerms: ['code', 'pre', '```'] },
      { title: 'Callout', command: 'callout', icon: '💡', description: 'Highlighted callout', searchTerms: ['callout', 'info', 'alert', 'note'] },
    ],
  },
];

const FLAT_ITEMS = GROUPS.flatMap(g => g.items);

const SlashMenu = forwardRef(({ items: queryItems, command, editor, range, clientRect }, ref) => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const menuRef = useRef(null);

  const filtered = queryItems?.length ? queryItems : FLAT_ITEMS;

  const execute = useCallback((idx, actualRange) => {
    const item = filtered[idx];
    if (!item) return;
    const rng = actualRange || range;

    if (item.command === 'toggle' || item.command === 'callout') {
      editor.chain().focus().command(({ tr, dispatch }) => {
        tr.delete(rng.from, rng.to);
        const schema = tr.doc.type.schema;
        const $pos = tr.doc.resolve(rng.from);
        const start = $pos.before();
        const end = $pos.after();

        let newNode;
        if (item.command === 'toggle') {
          newNode = schema.nodes.toggle.create({ open: false }, [
            schema.nodes.toggleTitle.create(null, schema.text('Toggle')),
            schema.nodes.toggleContent.create(null, [schema.nodes.paragraph.create()]),
          ]);
        } else {
          newNode = schema.nodes.callout.create({ type: 'info' }, [
            schema.nodes.paragraph.create(),
          ]);
        }

        tr.replaceWith(start, end, newNode);
        tr.setSelection(TextSelection.near(tr.doc.resolve(start + 1)));
        dispatch(tr);
        return true;
      }).run();
      return;
    }

    const chain = editor.chain().focus();
    const cmdMap = {
      h1: () => chain.deleteRange(rng).toggleHeading({ level: 1 }).run(),
      h2: () => chain.deleteRange(rng).toggleHeading({ level: 2 }).run(),
      h3: () => chain.deleteRange(rng).toggleHeading({ level: 3 }).run(),
      divider: () => chain.deleteRange(rng).setHorizontalRule().run(),
      bulletList: () => chain.deleteRange(rng).toggleBulletList().run(),
      orderedList: () => chain.deleteRange(rng).toggleOrderedList().run(),
      taskList: () => chain.deleteRange(rng).toggleTaskList().run(),
      blockquote: () => chain.deleteRange(rng).toggleBlockquote().run(),
      codeBlock: () => chain.deleteRange(rng).toggleCodeBlock().run(),
    };
    cmdMap[item.command]?.();
  }, [filtered, editor, range]);

  useImperativeHandle(ref, () => ({
    onEnter: (enterRange) => { execute(selectedIdx, enterRange); },
    onArrow: (dir) => {
      setSelectedIdx(i => Math.min(Math.max(i + dir, 0), filtered.length - 1));
    },
  }));

  useEffect(() => {
    setSelectedIdx(0);
  }, [filtered.length]);

  const menuStyle = {};
  if (clientRect && clientRect.x != null) {
    menuStyle.position = 'fixed';
    menuStyle.left = clientRect.x;
    menuStyle.top = clientRect.y + clientRect.height + 4;
  }

  return (
    <div className="slash-menu" ref={menuRef} style={menuStyle}>
      {GROUPS.map(group => {
        const groupItems = group.items.filter(item =>
          !filtered.length || filtered.some(f => f.command === item.command)
        );
        if (!groupItems.length) return null;
        return (
          <div key={group.label}>
            <div className="slash-menu-label">{group.label}</div>
            {groupItems.map(item => {
              const idx = filtered.indexOf(item);
              return (
                <div key={item.command}
                  className={`slash-menu-item${idx === selectedIdx ? ' active' : ''}`}
                  onMouseEnter={() => setSelectedIdx(idx)}
                   onMouseDown={(e) => { e.preventDefault(); execute(idx, range); }}>
                  <span className="slash-menu-icon">{item.icon}</span>
                  <div className="slash-menu-text">
                    <div className="slash-menu-title">{item.title}</div>
                    <div className="slash-menu-desc">{item.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
});

export default SlashMenu;
