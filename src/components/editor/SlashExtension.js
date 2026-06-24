import { Extension } from '@tiptap/core';
import { ReactRenderer } from '@tiptap/react';
import Suggestion from '@tiptap/suggestion';
import { PluginKey } from '@tiptap/pm/state';
import tippy from 'tippy.js';
import SlashMenu from './SlashMenu';

const SLASH_ITEMS = [
  { title: 'Heading 1', command: 'h1', icon: 'H1', description: 'Large heading', searchTerms: ['h1', 'heading1', '#'] },
  { title: 'Heading 2', command: 'h2', icon: 'H2', description: 'Medium heading', searchTerms: ['h2', 'heading2', '##'] },
  { title: 'Heading 3', command: 'h3', icon: 'H3', description: 'Small heading', searchTerms: ['h3', 'heading3', '###'] },
  { title: 'Bullet List', command: 'bulletList', icon: '•', description: 'Bulleted list', searchTerms: ['bullet', 'ul', 'list', '•'] },
  { title: 'Numbered List', command: 'orderedList', icon: '1.', description: 'Numbered list', searchTerms: ['numbered', 'ol', 'ordered', '1'] },
  { title: 'Checklist', command: 'taskList', icon: '☑', description: 'Checklist', searchTerms: ['checklist', 'todo', 'task', 'checkbox', '✓'] },
  { title: 'Toggle', command: 'toggle', icon: '▶', description: 'Collapsible section', searchTerms: ['toggle', 'collapse', 'details'] },
  { title: 'Divider', command: 'divider', icon: '—', description: 'Horizontal separator', searchTerms: ['divider', 'hr', 'separator', '---'] },
  { title: 'Quote', command: 'blockquote', icon: '〝', description: 'Blockquote', searchTerms: ['quote', 'blockquote', '>'] },
  { title: 'Code', command: 'codeBlock', icon: '</>', description: 'Code block', searchTerms: ['code', 'pre', '```'] },
  { title: 'Callout', command: 'callout', icon: '💡', description: 'Highlighted callout', searchTerms: ['callout', 'info', 'alert', 'note'] },
];

const slashPluginKey = new PluginKey('slash-menu');

export const SlashExtension = Extension.create({
  name: 'slash-command',
  addOptions() {
    return { suggestion: { char: '/', pluginKey: slashPluginKey, items: ({ query }) => SLASH_ITEMS.filter(item => item.searchTerms.some(t => t.includes(query.toLowerCase())) || item.title.toLowerCase().includes(query.toLowerCase())).slice(0, 12) } };
  },
  addProseMirrorPlugins() {
    return [
      Suggestion({ editor: this.editor, ...this.options.suggestion, render: () => {
        let component;
        let popup;
        return {
          onStart: (props) => {
            component = new ReactRenderer(SlashMenu, { ...props, editor: props.editor });
            if (!props.clientRect) return;
            popup = tippy('body', { getReferenceClientRect: props.clientRect, appendTo: () => document.body, content: component.element, showOnCreate: true, interactive: true, trigger: 'manual', placement: 'bottom-start' });
          },
          onUpdate: (props) => {
            component?.updateProps(props);
            popup?.[0]?.setProps({ getReferenceClientRect: props.clientRect });
          },
          onKeyDown: (props) => {
            if (props.event.key === 'Escape') { popup?.[0]?.hide(); return true; }
            if (props.event.key === 'Enter') {
              component?.ref?.onEnter?.(props.range);
              return true;
            }
            if (props.event.key === 'ArrowUp') {
              component?.ref?.onArrow?.(-1);
              return true;
            }
            if (props.event.key === 'ArrowDown') {
              component?.ref?.onArrow?.(1);
              return true;
            }
            return false;
          },
          onExit: () => { popup?.[0]?.destroy(); component?.destroy(); },
        };
      }}),
    ];
  },
});
