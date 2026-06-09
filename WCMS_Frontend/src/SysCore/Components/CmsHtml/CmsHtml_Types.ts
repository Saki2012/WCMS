import type { Lang } from "@/SysCore/i18n/lang";

// #region Property
export interface CmsHtmlFileMeta
{
    id: string;
    url?: string | null;
    alt?: string | null;
    fileName?: string | null;
    mime?: string | null;
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
