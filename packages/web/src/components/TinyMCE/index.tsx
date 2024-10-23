import { Editor } from '@tinymce/tinymce-react'
import { useRef, useState } from 'react'

type ITinyEditorProps = {
  value?: string
  onChange?: (value: string) => void
}

const TinyEditor = (props: ITinyEditorProps) => {
  const { value, onChange } = props
  const editorRef = useRef<Editor>()

  const [initialValue] = useState<string>(value ?? '')

  return (
    <Editor
      onInit={(_evt, editor) => {
        // @ts-ignore
        editorRef.current = editor
      }}
      initialValue={initialValue}
      tinymceScriptSrc="/tinymce/tinymce.min.js"
      init={{
        // height: 'calc(100% - 20px)',
        menubar: false,
        statusbar: false,
        placeholder: '请输入内容',
        language: 'zh_CN',
        toolbar_sticky: true,
        plugins: [
          'quickbars',
          'preview',
          'autolink',
          'directionality',
          'fullscreen',
          'image',
          'link',
          'code',
          'table',
          'charmap',
          'pagebreak',
          'nonbreaking',
          'anchor',
          'lists',
          'wordcount',
          'help',
          'emoticons',
          'autosave',
        ],
        toolbar: [
          'code | undo redo | ' +
            'formatselect fontselect fontsizeselect | ' +
            'forecolor backcolor bold italic underline strikethrough subscript superscript removeformat | ' +
            'align lineheight bullist numlist blockquote ' +
            'link table image charmap emoticons pagebreak | ' +
            'preview fullscreen',
        ],
        content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px; }',
      }}
      onEditorChange={content => {
        onChange?.(content)
      }}
    />
  )
}

export default TinyEditor
