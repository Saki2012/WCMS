import type { FormShellToolbarButton } from "@/Features/Pages/Server/Scaffold/Content/FormShell_Comp";
import type { PGID } from "@/types/SchemaFields";
import { useCallback, useState } from "react";

// #region Property
export interface ServerPreviewMessage<TPayload>
{
    /** PreviewFrame 與 TemplateHub 溝通用的訊息識別。 */
    type: "wcms:preview";
    /** 功能模組識別，統一使用系統既有 ProgId。 */
    ProgId: PGID;
    /** 預覽資料，直接傳入完整資料本體。 */
    payload: TPayload;
}

export interface UseServerPreviewFrameOptions
{
    /** 前台 TemplateHub 會用來分流的功能模組 ProgId。 */
    ProgId: PGID;
    /** 預覽對話框標題。 */
    title?: string;
    /** 預覽站台代號，空字串代表 /Template。 */
    siteIndex?: string;
}

export interface UseServerPreviewFrameResult<TPayload>
{
    isOpen: boolean;
    title: string;
    siteIndex: string;
    framePayload?: ServerPreviewMessage<TPayload>;
    /** 開啟預覽，並將資料送入 PreviewFrame。 */
    openPreview: (payload: TPayload) => void;
    /** 關閉預覽視窗。 */
    closePreview: () => void;
}
export interface BuildServerPreviewToolbarButtonOptions
{
    title?: string;
    action?: () => void | Promise<void>;
    disabled?: boolean;
    className?: string;
}
const previewMessageType = "wcms:preview" as const;
const defaultPreviewTitle = "預覽";
const defaultSiteIndex = "";
// #endregion

// #region Public
/** 建立後台預覽 Frame 狀態，統一處理 open、close 與 postMessage payload。 */
export const useServerPreviewFrame = <TPayload>(opt: UseServerPreviewFrameOptions): UseServerPreviewFrameResult<TPayload> =>
{
    const [isOpen, setIsOpen] = useState(false);
    const [framePayload, setFramePayload] = useState<ServerPreviewMessage<TPayload>>();
    const title = opt.title ?? defaultPreviewTitle;
    const siteIndex = opt.siteIndex ?? defaultSiteIndex;
    const openPreview = useCallback((payload: TPayload) =>
    {
        setFramePayload({ type: previewMessageType, ProgId: opt.ProgId, payload });
        setIsOpen(true);
    }, [opt.ProgId]);
    const closePreview = useCallback(() => setIsOpen(false), []);
    return { isOpen, title, siteIndex, framePayload, openPreview, closePreview };
};
/** 建立預覽 ActionToolbar button，讓各 Form 不重複宣告按鈕格式。 */
export const buildServerPreviewToolbarButton = (opt: BuildServerPreviewToolbarButtonOptions): FormShellToolbarButton =>
{
    return { title: opt.title ?? defaultPreviewTitle, action: opt.action ?? emptyPreviewAction, disabled: opt.disabled ?? !opt.action, className: opt.className };
};
// #endregion

// #region Private
/** 預覽動作不存在時的安全空動作。 */
const emptyPreviewAction = (): void => undefined;
// #endregion
