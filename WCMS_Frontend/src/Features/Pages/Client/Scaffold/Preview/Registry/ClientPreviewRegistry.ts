import type { INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import type { Lang } from "@/SysCore/i18n/lang";
import type { PGID } from "@/types/SchemaFields";
import type React from "react";

// #region Property
export interface ClientPreviewMessage<TPayload = unknown>
{
    /** 預覽訊息類型，用於 postMessage 安全識別。 */
    type: "wcms:preview";
    /** 功能模組識別，統一使用系統既有 ProgId。 */
    ProgId: PGID;
    /** 後台傳入的預覽資料。 */
    payload: TPayload;
}
export interface ClientPreviewRenderProps<TPayload = unknown>
{
    /** 前台站台資料。 */
    site: INormSite;
    /** 目前語系。 */
    lang: Lang;
    /** 原始預覽訊息。 */
    message: ClientPreviewMessage<TPayload>;
    /** 後台傳入的預覽資料。 */
    payload: TPayload;
}

export interface ClientPreviewEntry<TPayload = unknown>
{
    /** 功能模組識別，統一使用系統既有 ProgId。 */
    ProgId: PGID;
    /** 渲染預覽內容。 */
    render: (props: ClientPreviewRenderProps<TPayload>) => React.ReactElement;
}
// #endregion

// #region Public
/** 合併 Feature 與 Spec 預覽註冊，Spec 放後面讓查找時可覆寫 Feature。 */
export const mergeClientPreviewEntries = (featureEntries: ClientPreviewEntry[], specEntries?: ClientPreviewEntry[]): ClientPreviewEntry[] =>
{
    return [...featureEntries, ...(specEntries ?? [])];
};
/** 依 ProgId 查找預覽註冊，後註冊者優先。 */
export const findClientPreviewEntry = (entries: ClientPreviewEntry[], message: ClientPreviewMessage): ClientPreviewEntry | undefined =>
{
    return [...entries].reverse().find(entry => entry.ProgId === message.ProgId);
};
// #endregion
