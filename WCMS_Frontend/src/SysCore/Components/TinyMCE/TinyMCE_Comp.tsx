// src/components/TinyMCE_Comp.tsx
import { Editor } from '@tinymce/tinymce-react';
import { useTinyMCE, useTinyMceInternalImage } from './TinyMCE_Hook';
import { useMemo } from 'react';
import { FileManagementAPI } from '@/SysCore/Utils/API/APIClient';

type Props = {
  args: {
    id: string;
    value: string;
    onChange: (v: string) => void;
    uploadFileApi?: string;
    makeFileUrl?: (internalId: string, meta: { kind: 'file' | 'image' }) => string;
    languageUrl?: string;
    language?: string;
    baseUrl?: string;
    // （可選）若你想自訂預覽圖路徑，不填就用 makeFileUrl('image') 推導
    makeImagePreviewUrl?: (internalId: string) => string;
    // （可選）AA：存檔時補 alt=""
    enforceAlt?: boolean;
  };
};

const TinyMCE_Comp = ({ args }: Props) => {
  const tiny = useTinyMCE({
    id: args.id,
    value: args.value,
    onChange: args.onChange,
    uploadFileApi: args.uploadFileApi ?? FileManagementAPI.UPLOAD_URL,
    makeFileUrl: args.makeFileUrl ?? ((id, meta) => meta.kind === 'image' ? `${FileManagementAPI.PREVIEW_URL}/${id}` : `${FileManagementAPI.DOWNLOAD_URL}/${id}`),
    languageUrl: args.languageUrl ?? '/tinymce-i18n/langs5/zh_TW.js',
    language: args.language ?? 'zh_TW',
    baseUrl: args.baseUrl ?? '/tinymce',
  });

  // 新增：圖片 internalId <-> src 的轉換（預覽用 API 路徑）
  const image = useTinyMceInternalImage({
    resolvePreviewUrl:
      args.makeImagePreviewUrl ??
      ((id) => (args.makeFileUrl ? args.makeFileUrl(id, { kind: 'image' }) : `${FileManagementAPI.PREVIEW_URL}/${id}`)),
    enforceAlt: args.enforceAlt ?? true,
  });

  // ✅ 不覆蓋、不修改你原本 init：只是在外層包一個 setup，串上 image.setup
  const init = useMemo(() => {
    const existingInit = tiny.init as any;
    const originalSetup: ((editor: any) => void) | undefined = existingInit?.setup;

    return {
      ...existingInit,
      // 只做前後串接：先跑原本的 setup（如果有），再跑我們的 image.setup
      setup: (editor: any) => {

        if (typeof originalSetup === 'function') originalSetup(editor);
        image.setup(editor);
      },
    } as const;
  }, [tiny.init, image]);

  return (
    <>
      <Editor
        id={args.id}
        tinymceScriptSrc="/tinymce/tinymce.min.js"
        value={tiny.value}
        onEditorChange={tiny.onChange}
        init={init as any}
      />
      <p style={{
        color: 'rgba(0,0,0,.3)',
        textAlign: 'right',
        marginTop: 8,
        pointerEvents: 'none',
        userSelect: 'none',
        fontSize: 12
      }}>
        本網站內容編輯器採用 TinyMCE 開源版 (MIT)
      </p>
    </>
  );
};

export default TinyMCE_Comp;
