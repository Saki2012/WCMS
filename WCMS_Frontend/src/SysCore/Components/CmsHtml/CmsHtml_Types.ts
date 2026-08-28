import type { Lang } from "@/SysCore/i18n/lang";

// #region Property
export const CMS_HTML_VIEWER_ATTR = "data-wcms-viewer";

export const CMS_HTML_VIEWER_PDF = "pdf";

/** CMS 內部檔案連結的正式行為標記。 */
export const CMS_HTML_FILE_ACTION_ATTR = "data-wcms-file-action";

export const CMS_HTML_FILE_ACTION_PREVIEW = "preview";

export const CMS_HTML_FILE_ACTION_DOWNLOAD = "download";

export type CmsHtmlFileAction = typeof CMS_HTML_FILE_ACTION_PREVIEW | typeof CMS_HTML_FILE_ACTION_DOWNLOAD;

export interface CmsHtmlFileMeta
{
    id: string;
    url?: string | null;
    alt?: string | null;
    fileName?: string | null;
    fileExtension?: string | null;
    mime?: string | null;
    mimeType?: string | null;
    width?: number | null;
    height?: number | null;
}


export type CmsHtmlFileMetaMap = Record<string, CmsHtmlFileMeta | undefined>;


export interface CmsHtmlTransformOptions
{
    lang: Lang;
    fileMetaMap?: CmsHtmlFileMetaMap;
    keepDataInternalId?: boolean;
    downloadInNewWindow?: boolean;
    buildPreviewUrl?: (internalId: string, meta?: CmsHtmlFileMeta) => string;
    buildDownloadUrl?: (internalId: string, meta?: CmsHtmlFileMeta) => string;
}


export interface CmsHtmlParseOptions
{
    lang: Lang;
}


export interface CmsHtmlContentOptions extends CmsHtmlTransformOptions, CmsHtmlParseOptions
{}
// #endregion
