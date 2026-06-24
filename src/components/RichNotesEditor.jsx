import { useMemo, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Toggle, ToggleTitle, ToggleContent } from './editor/ToggleNode';
import { Callout } from './editor/CalloutNode';
import { SlashExtension } from './editor/SlashExtension';

export default function RichNotesEditor({ content, onChange, placeholder }) {
  const extensions = useMemo(() => [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      codeBlock: { HTMLAttributes: { class: 'code-block' } },
      link: false,
      underline: false,
    }),
    Placeholder.configure({ placeholder: placeholder || 'Type / for commands...' }),
    TaskList.configure({ HTMLAttributes: { class: 'task-list' } }),
    TaskItem.configure({ nested: true, HTMLAttributes: { class: 'task-item' } }),
    Underline,
    Link.configure({ openOnClick: false, HTMLAttributes: { class: 'editor-link' } }),
    Image.configure({ inline: false, allowBase64: true, HTMLAttributes: { class: 'editor-image' } }),
    Table.configure({ resizable: true, HTMLAttributes: { class: 'editor-table' } }),
    TableRow,
    TableCell,
    TableHeader,
    ToggleTitle,
    ToggleContent,
    Toggle,
    Callout,
    SlashExtension,
  ], []);

  const handleUpdate = useCallback(({ editor }) => {
    const json = editor.getJSON();
    onChange(json);
  }, [onChange]);

  const editor = useEditor({
    extensions,
    content: content || { type: 'doc', content: [{ type: 'paragraph' }] },
    onUpdate: handleUpdate,
    editorProps: {
      attributes: { class: 'rich-editor' },
      handleDrop: () => true,
      handlePaste: () => false,
    },
  });

  return <EditorContent editor={editor} className="rich-editor-wrapper" />;
}
