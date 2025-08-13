// src/hooks/TinyMCE_Hook.ts
import { useRef, useMemo, useEffect } from 'react';
import type { Editor as TinyMCEEditor } from 'tinymce';

export interface TinyMceHookOptions {
  id: string;
  value: string;
  onChange: (html: string) => void;

  // 後端 API
  uploadFileApi?: string;   // 檔案/圖片上傳 API (form-data: file)
  // 依 internalId 轉可瀏覽 URL（同時插入 data-internal）
  makeFileUrl?: (internalId: string, meta: { kind: 'file' | 'image' }) => string;

  // 多語、外觀
  languageUrl?: string;     // 例如 "/tinymce-i18n/langs5/zh_TW.js"
  language?: string;        // "zh_TW"
  baseUrl?: string;         // "/tinymce"
}

type CopiedInlineStyle = string | null;

export const useTinyMCE = (p: TinyMceHookOptions) => {
  const editorRef = useRef<TinyMCEEditor | null>(null);
  const copiedStyleRef = useRef<CopiedInlineStyle>(null);

  const uploadAndReturn = async (file: File) => {
    const api = p.uploadFileApi ?? '/Service/FileManagement/UploadTemp';
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(api, { method: 'POST', body: fd });
    if (!res.ok) throw new Error('Upload failed');
    // 後端請回傳 { internalId: "xxx", name: "filename.ext" }
    const json = await res.json();
    if(!json.IsSuccess){ throw new Error('No internalId');}
    return {
    internalId: json.Data[0],
    name: file.name
  } as { internalId: string; name: string };
  };

  const toUrl = (id: string, kind: 'file' | 'image') =>
    (p.makeFileUrl?.(id, { kind })) ?? `/Service/FileManagement/Preview/${id}`;

  const pickLocalFile = (cb: (file: File) => void) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = () => {
      const f = input.files?.[0];
      if (f) cb(f);
    };
    input.click();
  };

  const insertIframeDialog = (ed: TinyMCEEditor) => {
    ed.windowManager.open({
      title: '插入 IFrame（YouTube / Google Map）',
      body: {
        type: 'panel',
        items: [
          { type: 'input', name: 'url', label: '完整 URL', placeholder: 'https://www.youtube.com/embed/...' },
          { type: 'input', name: 'title', label: '標題（無障礙）' },
          { type: 'input', name: 'width', label: '寬度(px 或 %，空白=100%)' },
          { type: 'input', name: 'height', label: '高度(px，建議 315/360/480...)' },
        ],
      },
      buttons: [
        { type: 'cancel', text: '取消' },
        { type: 'submit', text: '插入', primary: true },
      ],
      onSubmit(api) {
        const data: any = api.getData();
        const width = (data.width || '100%').trim();
        const height = (data.height || '360').trim();
        const title = (data.title || '').trim();
        const url = (data.url || '').trim();
        if (!url) {
          ed.windowManager.alert('請輸入 URL');
          return;
        }
        const html = `<iframe src="${ed.dom.encode(url)}" title="${ed.dom.encode(title)}" width="${ed.dom.encode(width)}" height="${ed.dom.encode(height)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen style="max-width:100%;border:0;"></iframe>`;
        ed.insertContent(html);
        api.close();
      },
    });
  };

  const editorInit = useMemo(() => {
    const baseUrl = p.baseUrl ?? '/tinymce';
    return {
      base_url: baseUrl,
      tinymceScriptSrc: `${baseUrl}/tinymce.min.js`,
      license_key: 'gpl',
      height: 450,
      menubar: false,
      plugins: [
        'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
        'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
        'insertdatetime', 'media', 'table', 'help', 'wordcount'
      ],
      toolbar: [
        'undo redo | blocks fontfamily fontsize |',
        'bold italic underline forecolor backcolor |',
        'alignleft aligncenter alignright alignjustify |',
        'bullist numlist outdent indent |',
        'link unlink | image filepicker | table tableprops cellprops |',
        'copyformat applyformat removeformat | insertiframe |',
        'fullscreen code preview'
      ].join(' '),
      toolbar_mode: 'wrap',

      // ★06 字體大小、字型
      font_size_formats: '8=8px 9=9px 10=10px 11=11px 12=12px 14=14px 16=16px 18=18px 20=20px 24=24px 28=28px 32=32px 36=36px 48=48px 72=72px',
      font_family_formats: `
        Arial=arial,helvetica,sans-serif;
        Courier New=courier new,courier;
        Georgia=georgia,palatino;
        Tahoma=tahoma,arial,helvetica,sans-serif;
        Times New Roman=times new roman,times;
        Verdana=verdana,geneva;
        微軟正黑體=微軟正黑體,Microsoft JhengHei,sans-serif;
        新細明體=新細明體,PMingLiU,serif;
        標楷體=標楷體,DFKai-SB,serif;`,

      // AA：讓圖片/iframe RWD；允許 td/th 設定背景色
      content_style: `
        img.rwd-img{max-width:100%;height:auto;}
        iframe{max-width:100%;}
        table{width:100%;border-collapse:collapse;}
        td,th{width:auto;word-break:break-word;}
      `,
      valid_styles: {
        td: 'background-color',
        th: 'background-color'
      },
      table_advtab: true,
      table_cell_advtab: true,
      table_toolbar: 'tableprops cellprops',

      // i18n / skin
      skin_url: `${baseUrl}/skins/ui/oxide`,
      content_css: `${baseUrl}/skins/content/default/content.css`,
      icons_url: `${baseUrl}/icons/default/icons.js`,
      language: p.language ?? 'zh_TW',
      language_url: p.languageUrl ?? '/tinymce-i18n/langs5/zh_TW.js',

      // ★01/02 本機檔案與圖片上傳（插入 data-internal）
      file_picker_types: 'file image',
      file_picker_callback: (callback: any, _value: any, meta: any) => {
        pickLocalFile(async (file) => {
          try {
            const { internalId, name } = await uploadAndReturn(file);
            if (meta.filetype === 'file') {
              const href = toUrl(internalId, 'file');
              // 插入可下載連結 + data-internal
              callback(href, { text: name ?? file.name, 'data-internal': internalId });
              // 直接把當前選取轉成 <a>
              const ed = editorRef.current!;
              const anchor = ed.dom.select('a[href="' + href + '"]').pop();
              if (anchor) ed.dom.setAttrib(anchor, 'download', '');
            } else if (meta.filetype === 'image') {
              const src = toUrl(internalId, 'image');
              // 先用 100% RWD
              callback(src, { alt: name ?? file.name, 'class': 'rwd-img', 'data-internal': internalId });
            }
          } catch {
            alert('上傳失敗');
          }
        });
      },

      // ★04 自訂 IFrame 插入
      setup: (editor: TinyMCEEditor) => {
        editorRef.current = editor;

        // insertiframe 按鈕
        editor.ui.registry.addButton('insertiframe', {
          icon: 'embed',
          tooltip: '插入 IFrame（YouTube / Google Map）',
          onAction: () => insertIframeDialog(editor),
        });

        // ★10 複製樣式 / 套用樣式（模擬 format painter）
        editor.ui.registry.addButton('copyformat', {
            icon: 'format-painter',
            tooltip: '複製格式 (Alt+Shift+C)',
            onAction: () => {
                const node = editor.selection.getNode();
                const span = node && node.nodeType === 3 ? node.parentElement : (node as HTMLElement | null);
                copiedStyleRef.current = span?.getAttribute('style') ?? null;
            }
        });
        editor.ui.registry.addButton('applyformat', {
            icon: 'paste',
            tooltip: '套用格式 (Alt+Shift+V)',
            onAction: () => {
                const css = copiedStyleRef.current;
                if (!css) return;
                editor.formatter.register('__copied_fmt__', { inline: 'span', styles: {} });
                editor.formatter.apply('__copied_fmt__', {}, undefined);
                const rng = editor.selection.getRng();
                const parent = rng.commonAncestorContainer as HTMLElement;
                const targets = Array.from(editor.dom.select('span', parent));
                if (targets.length) {
                const last = targets[targets.length - 1] as HTMLElement;
                const merged = last.getAttribute('style')
                    ? last.getAttribute('style') + ';' + css
                    : css;
                editor.dom.setAttrib(last, 'style', merged ?? '');
                }
            }
        });
        
        editor.addShortcut('alt+shift+c', '複製格式', () => editor.execCommand('mceToggleFormat')); // 只為了提示，實際上用上面的按鈕
        editor.addShortcut('alt+shift+v', '套用格式', () => {/* 上面按鈕處理 */});

        // ★11 移除連結快捷鍵
        editor.addShortcut('alt+shift+u', '移除連結', () => editor.execCommand('unlink'));

        // ★10 自訂移除樣式快捷鍵（原本有 removeformat 按鈕）
        editor.addShortcut('alt+shift+r', '移除格式', () => editor.execCommand('RemoveFormat'));

        // ★02 調整圖片寬高（若空白或100% → RWD）
        editor.on('ObjectSelected', (e) => {
          const elm = e.target as HTMLElement;
          if (elm?.tagName?.toLowerCase() === 'img') {
            // 保持 data-internal
            const internal = elm.getAttribute('data-internal');
            if (internal && !elm.classList.contains('rwd-img')) {
              // 若寬度是空白或 100%，就 RWD
              const w = elm.getAttribute('width') || elm.style.width || '';
              if (!w || w === '100%' || w === '100') {
                elm.classList.add('rwd-img');
                elm.removeAttribute('height');
                elm.style.height = '';
              }
            }
          }
        });

        // 保障：將使用者手動輸入的 <img> 也轉為 data-internal（若可解析 internal）
        editor.on('NodeChange', (_evt) => {
          const imgs = editor.dom.select('img');
          imgs.forEach((img) => {
            if (!img.getAttribute('data-internal')) return;
            // 確保 src 與 internal 對應（避免被 TinyMCE 改寫）
            const internalId = img.getAttribute('data-internal')!;
            const expect = toUrl(internalId, 'image');
            if (img.getAttribute('src') !== expect) editor.dom.setAttrib(img, 'src', expect);
          });
        });

        // ★01 檔案連結插入按鈕（除了工具列外也提供）
        editor.ui.registry.addButton('filepicker', {
          icon: 'new-document',
          tooltip: '上傳檔案並插入下載連結',
          onAction: () => {
            pickLocalFile(async (file) => {
              try {
                const { internalId, name } = await uploadAndReturn(file);
                const href = toUrl(internalId, 'file');
                editor.insertContent(
                  `<a href="${editor.dom.encode(href)}" data-internal="${editor.dom.encode(internalId)}" download>${editor.dom.encode(name ?? file.name)}</a>`
                );
              } catch { alert('上傳失敗'); }
            });
          }
        });

        // AA：連結預設帶 title（以文字當 title，使用者可再改）
        editor.on('ExecCommand', (cmd) => {
          if (cmd.command?.toLowerCase() === 'mcelink') {
            const a = editor.dom.getParent(editor.selection.getNode(), 'a');
            if (a && !a.title && a.textContent) a.title = a.textContent;
          }
        });
      },

      // ★06 / ★14 文字前景/背景色已在 toolbar forecolor / backcolor
      // ★10 / ★11 的快捷鍵見 setup

      // 基本事件接上外部 state
      setup_onchange: true,
      init_instance_callback: (ed: TinyMCEEditor) => {
        editorRef.current = ed;
      },
      paste_data_images: true,
      paste_retain_style_properties: 'all',
      paste_merge_formats: true,
      paste_word_valid_elements: 'b,strong,i,em,u,strike,sub,sup,p,h1,h2,h3,h4,h5,h6,table,tr,td,th,thead,tbody,tfoot,colgroup,col,span,div,ol,ul,li,img,a,br,hr',
      paste_webkit_styles: 'all',
      paste_filter_drop: false,
      valid_elements: '*[*]',

      // ← 這裡是處理從 Word/Excel 貼上時移除固定 px 寬度
      paste_postprocess: (_plugin:any, args:any) => {
        const root = args.node as HTMLElement;
        root.querySelectorAll('table').forEach(t => {
          t.removeAttribute('width');
          (t as HTMLElement).style.width = '100%';
          t.querySelectorAll('colgroup,col,td,th').forEach(el => {
            el.removeAttribute('width');
            (el as HTMLElement).style.width = '';
          });
        });
      },
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.id, p.language, p.languageUrl, p.baseUrl, p.uploadFileApi, p.makeFileUrl]);

  return {
    editorRef,
    init: editorInit,
    value: p.value,
    onChange: p.onChange,
  };
};

export interface UseTinyMceInternalImageOptions {
  // 把 internalId 轉成可預覽的 API URL（例如 /Service/File/Image/:id）
  resolvePreviewUrl: (internalId: string) => string;
  // AA：存檔時若沒有 alt，就補 alt=""（預設 true）
  enforceAlt?: boolean;
}

export interface UseTinyMceInternalImageResult {
  // 提供給外部把事件掛到 editor（由外層 comp 整合）
  setup: (editor: any) => void;
  // 額外提供純函式，若你在外部流程要單獨呼叫也行（可不使用）
  transformForEditor: (html: string) => string;
  transformForDb: (html: string) => string;
}

const INTERNAL_ATTR = 'data-internalid';

const doTransformForEditor = (html: string, makeSrc: (id: string) => string) => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll<HTMLImageElement>('img').forEach(img => {
    const id = img.getAttribute(INTERNAL_ATTR) || '';
    if (!id) return;
    const want = makeSrc(id);
    if (img.getAttribute('src') !== want) img.setAttribute('src', want);
  });
  return doc.body.innerHTML;
};

const doTransformForDb = (html: string, enforceAlt: boolean) => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll<HTMLImageElement>('img').forEach(img => {
    if (img.hasAttribute(INTERNAL_ATTR)) {
      // 存 DB 前：只留 internalId，移除 src
      img.removeAttribute('src');
    }
    if (enforceAlt && !img.hasAttribute('alt')) img.setAttribute('alt', '');
  });
  return doc.body.innerHTML;
};

export const useTinyMceInternalImage = (
  opts: UseTinyMceInternalImageOptions
): UseTinyMceInternalImageResult => {
  const { resolvePreviewUrl, enforceAlt = true } = opts;

  const transformForEditor = (html: string) =>
    doTransformForEditor(html, resolvePreviewUrl);

  const transformForDb = (html: string) =>
    doTransformForDb(html, enforceAlt);

  const setup = (editor: any) => {
    editor.on('BeforeSetContent', (e: any) => {
      if (typeof e.content === 'string' && e.content.includes('<img')) {
        e.content = transformForEditor(e.content);
      }
    });
    editor.on('GetContent', (e: any) => {
      if (!e.format || e.format === 'html') {
        e.content = transformForDb(e.content);
      }
    });
  };

  return { setup, transformForEditor, transformForDb } as const;
};

export const useTinyBlurShield = () => {
  const editorRef = useRef<any>(null);
  const ignoreUntil = useRef<number>(0);

  const setup = (ed: any) => {
    editorRef.current = ed;

    ed.on('focus', () => {
      // 進編輯器時清理忽略期（可選）
      ignoreUntil.current = 0;
    });

    ed.on('blur', (e: any) => {
      // 若正處於忽略期，視為假性 blur，不處理
      if (Date.now() < ignoreUntil.current) return;
      // 這裡放你真正需要做的事情（ex: 同步內容、驗證…）
      // onEditorBlur?.(ed.getContent());
    });
  };

  useEffect(() => {
    const onFocusIn = (ev: FocusEvent) => {
      const ed = editorRef.current;
      if (!ed) return;

      const container: HTMLElement | null = ed.getContainer?.() ?? null;
      const target = ev.target as HTMLElement | null;

      // 若新焦點不在編輯器容器內 → 手動 fire blur，並開啟忽略期以防抖
      if (container && target && !container.contains(target)) {
        ignoreUntil.current = Date.now() + 250; // 防抖時間可微調
        ed.fire('blur'); // 官方支援的事件觸發
      }
    };

    document.addEventListener('focusin', onFocusIn, true);
    return () => document.removeEventListener('focusin', onFocusIn, true);
  }, []);

  return { setup };
};