import { useCreateBlockNote } from "@blocknote/react"
import { BlockNoteView } from "@blocknote/mantine"
import "@blocknote/mantine/style.css"
import { useEffect, useRef } from "react"

interface Props {
  value: string
  onChange: (json: string) => void
  editable?: boolean
}

export function BlockNoteEditor({ value, onChange, editable = true }: Props) {
  const valueRef = useRef(value)
  valueRef.current = value

  const getInitialContent = () => {
    if (!value || value.trim() === '') return undefined
    if (value.trim().startsWith('[')) {
      try { return JSON.parse(value) } catch { return undefined }
    }
    if (!value.trim().startsWith('<')) {
      return [{ type: "paragraph", content: [{ type: "text", text: value, styles: {} }] }]
    }
    return undefined
  }

  const editor = useCreateBlockNote({
    initialContent: getInitialContent(),
  })

  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    if (value && value.trim().startsWith('<')) {
      const blocks = editor.tryParseHTMLToBlocks(value)
      editor.replaceBlocks(editor.document, blocks)
    }
  }, [])

  useEffect(() => {
    if (!editor) return
    const trimmed = value?.trim()
    if (!trimmed) {
      editor.replaceBlocks(editor.document, [{ type: "paragraph", content: [] }])
      return
    }
    const currentJSON = JSON.stringify(editor.document)
    if (currentJSON === value) return
    if (trimmed.startsWith('[')) {
      try {
        const blocks = JSON.parse(value)
        editor.replaceBlocks(editor.document, blocks)
      } catch {}
    }
  }, [value])

  return (
    <BlockNoteView
      editor={editor}
      editable={editable}
      onChange={() => onChangeRef.current(JSON.stringify(editor.document))}
    />
  )
}
