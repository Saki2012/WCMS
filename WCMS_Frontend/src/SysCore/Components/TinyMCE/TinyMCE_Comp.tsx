// src/components/TinyEditor.tsx
import { Editor } from '@tinymce/tinymce-react';
import { useRef } from 'react'

type TinyEditorProps = {
  Id: string
  value: string
  onChange: (value: string) => void
}

export const TinyMCE=({ Id, value, onChange }: TinyEditorProps) => {
  const editorRef = useRef<any>(null);
  return (
    <>
      <Editor
        id={Id}
        tinymceScriptSrc="/tinymce/tinymce.min.js"
        onInit={(_, editor) => (editorRef.current = editor)}
        value={value}
        onEditorChange={(content) => onChange(content)}
        init={{
          base_url: '/tinymce',
          height: 400,
          menubar: false,

          plugins: ['advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'media', 'table', 'help', 'wordcount', 'print'
          ],
          toolbar:
            `undo redo | formatselect |
            bold italic underline forecolor backcolor | 
            alignleft aligncenter alignright alignjustify | 
            bullist numlist outdent indent | 
            link image table charmap | fullscreen code print preview`,
          content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
          skin_url: '/tinymce/skins/ui/oxide',
          content_css: '/tinymce/skins/content/default/content.css',
          icons_url: '/tinymce/icons/default/icons.js',

          language: "zh_TW",
          language_url: "/tinymce-i18n/langs5/zh_TW.js",
        }}
      />
      <p style={{color: 'rgba(0, 0, 0, 0.3)',textAlign: 'right',marginTop: '1rem',pointerEvents: 'none',userSelect: 'none',fontSize: '12px'}}>
        本網站內容編輯器採用 TinyMCE 開源版 (MIT License)
      </p>
    </>
  );
}