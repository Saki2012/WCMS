// src/components/TinyEditor.tsx

import { Editor } from '@tinymce/tinymce-react';
import 'tinymce/tinymce'; // 核心
import 'tinymce/icons/default'; // icon
import 'tinymce/themes/silver'; // theme
import 'tinymce/models/dom'; // model

// Plugins（你用哪些插件就引入哪些）
import 'tinymce/plugins/link';
import 'tinymce/plugins/lists';
import 'tinymce/plugins/table';
import 'tinymce/plugins/code';
import 'tinymce/plugins/image';
import { useRef } from 'react'

type TinyEditorProps = {
  value: string
  onChange: (value: string) => void
}

export default function LibTinyMCE({ value, onChange }: TinyEditorProps) {
  const editorRef = useRef<any>(null);
  return (
    <>
      <Editor
        tinymceScriptSrc="/node_modules/tinymce/tinymce.min.js"
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
          content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
        }}
      />
      {"本網站內容編輯器採用 TinyMCE 開源版（MIT License）"}
    </>
  );
}