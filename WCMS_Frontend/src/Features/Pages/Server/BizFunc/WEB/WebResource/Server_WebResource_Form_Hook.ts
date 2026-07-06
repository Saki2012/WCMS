import { CategoryAdapter } from "@/Features/Hooks/BizFunc/COMM/Category_Api";
import { TagAdapter } from "@/Features/Hooks/BizFunc/COMM/Tag_Api";
import { WebResourceAdapter } from "@/Features/Hooks/BizFunc/WEB/WebResource_Api";
import { buildServerSupportedLangDetailMap } from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Helper";
import type {
    ServerFormBinding,
    ServerFormDefaultRawData,
    ServerFormTemplate,
} from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Hook";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { buildSupportedLangOrder, type Lang, LangLabelMap, normalizeSupportedLang, SUPPORTED_LANGS, useEnsureLangDetails } from "@/SysCore/i18n/lang";
import type { ApiFormInitial } from "@/SysCore/Utils/API/APIAdapter";
import { useFetchEnumOptions } from "@/SysCore/Utils/API/SystemAPI_Hook";
import { LibText } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { PGID, WebResourceFields, WebResourceInfoFields, WebResourceSetFields } from "@/types/SchemaFields";
import { useMemo } from "react";

// #region Property
type WebResourceSet = components["schemas"]["WebResourceSet_DTO"];

type WebResourceInfo = NonNullable<WebResourceSet["WebResourceInfo"]>[number];

export interface UseWebResourceFormTemplateOptions
{
    /** 目前語系 */
    lang: Lang;

    /** 後台主題設定 */
    theme: IBETheme;

    /** 資料 internalId，空值代表新增 */
    internalId: string;

    /** 新增模式預設資料 */
    emptyData: WebResourceSet;

    /** Form Template 標準動作設定 */
    actionsOpt: WebResourceFormActionsOpt;
}

export interface UseWebResourceDetailTabsOptions
{
    /** 新版 Form Template 提供的資料 binding */
    binding: ServerFormBinding<WebResourceSet>;

    /** 目前語系，會優先排在第一個 Tab */
    lang: Lang;
}

export interface WebResourceDetailTabItem
{
    /** Tab key，給 TabContentComp 對應內容 */
    key: string;

    /** Tab 顯示文字 */
    label: string;

    /** Detail 原始 DTO */
    detail: WebResourceInfo;

    /** Detail row keys，給 useSetTableField 綁定欄位 */
    rowKeys: Record<string, string | number | null | undefined>;
}

export interface WebResourceDetailTabsResult
{
    /** TabContentComp 使用的 tab item map */
    tabItems: Record<string, string>;

    /** Comp 渲染 Detail 欄位使用的 tab items */
    items: WebResourceDetailTabItem[];
}

export type WebResourceFormRefs = {
    /** 網路資源類別選項 */
    categoryMap: Record<string, string>;

    /** 網路資源標籤選項 */
    tagMap: Record<string, string>;

    /** 內容狀態選項 */
    statusOpts: Record<string, string>;

    /** 外部連結開啟方式選項 */
    windowTargetOpts: Record<string, string>;
};

export type WebResourceFormActionsOpt = {
    /** 儲存成功後要回到列表（或其他導頁） */
    onBackToList: () => void;
};

export type WebResourceFormAdapter = {
    WebResource: ReturnType<typeof WebResourceAdapter>;
    Category: ReturnType<typeof CategoryAdapter>;
    Tag: ReturnType<typeof TagAdapter>;
};
// #endregion

// #region Public
export const webResourceEmptyData: WebResourceSet = { WebResource: {}, WebResourceInfo: [] };

/** 網路資源圖片上傳限制。 */
export const WebResourceImageUploadLimit = {
    accept: "image/*",
    multiple: false,
    maxFileCount: 1,
    maxFileSizeMB: 10,
} as const;

/** 建立 WebResource Form Template，統一交給 Server_FormTemplate 處理資料流程。 */
export const useWebResourceFormTemplate = (
    opt: UseWebResourceFormTemplateOptions,
): ServerFormTemplate<
    WebResourceSet,
    WebResourceFormAdapter,
    WebResourceFormRefs,
    ServerFormDefaultRawData<WebResourceSet, WebResourceFormRefs>,
    WebResourceFormActionsOpt
> =>
{
    return useMemo(() =>
    {
        return {
            featureKey: "WebResource",
            theme: opt.theme,
            lang: opt.lang,
            internalId: opt.internalId,
            emptyData: opt.emptyData,
            actionsOpt: opt.actionsOpt,
            feature: {
                buildAdapter: buildWebResourceFormAdapter,
                selectDataAdapter: adapter => adapter.WebResource,
                buildTitle: buildWebResourceFormTitle,
                buildInitialData: buildWebResourceInitialData,
                useReferenceData: ctx => useWebResourceReferenceData({ ...ctx, lang: opt.lang }),
            },
        };
    }, [opt.actionsOpt, opt.emptyData, opt.internalId, opt.lang, opt.theme]);
};

/** 建立 WebResource Detail 語系 Tabs，避免 Comp 處理語系過濾與 Unknown fallback。 */
export const useWebResourceDetailTabs = (opt: UseWebResourceDetailTabsOptions): WebResourceDetailTabsResult =>
{
    const details = opt.binding.data?.WebResourceInfo;

    return useMemo(() =>
    {
        return buildWebResourceDetailTabs(details ?? [], opt.lang);
    }, [details, opt.lang]);
};
// #endregion

// #region Private
/** 建立 WebResource Form 標題，功能名稱優先讀 ModelDisplayName。 */
const buildWebResourceFormTitle = (ctx: { mode: "new" | "edit"; displayName: ModelDisplaySchema; }): string =>
{
    const modelTitle = getWebResourceModelTitle(ctx.displayName, "網路資源");
    return `${ctx.mode === "edit" ? "修改" : "新增"}${modelTitle}`;
};

/** 建立新增模式的 initial data，統一由 Feature Timing 交給 Template。 */
const buildWebResourceInitialData = (ctx: { mode: "new" | "edit"; emptyData: WebResourceSet; }): ApiFormInitial<WebResourceSet> | undefined =>
{
    if (ctx.mode !== "new") return undefined;
    return { data: { args: "__new__", apiRes: { IsSuccess: true, Data: ctx.emptyData, SysMessage: [] } } };
};

/** 建立 WebResource Form 會使用到的 Adapter 群組。 */
const buildWebResourceFormAdapter = (): WebResourceFormAdapter =>
{
    return { WebResource: WebResourceAdapter(), Category: CategoryAdapter(), Tag: TagAdapter() };
};

/** 取得 Header / Detail 需要的參照資料與語系明細補齊。 */
const useWebResourceReferenceData = (ctx: { adapter: WebResourceFormAdapter; binding: ServerFormBinding<WebResourceSet>; lang: Lang; }) =>
{
    useEnsureLangDetails(ctx.binding, {
        headerName: WebResourceSetFields.WebResource,
        detailName: WebResourceSetFields.WebResourceInfo,
        parentKeys: [WebResourceFields.WebResourceId],
        langs: SUPPORTED_LANGS,
        preferFirstLang: ctx.lang,
    });

    const category = ctx.adapter.Category.hooks.useMapByProgId({ progId: PGID.WebResource, lang: ctx.lang });
    const tag = ctx.adapter.Tag.hooks.useMapByProgId({ progId: PGID.WebResource, lang: ctx.lang });
    const statusOpts = useContentStatusOptions();
    const windowTargetOpts = useWindowTargetOptions();

    return useMemo(() =>
    {
        return buildWebResourceReferenceResult({ category, tag, statusOpts, windowTargetOpts });
    }, [category, tag, statusOpts, windowTargetOpts]);
};

/** 取得 WebResource Model 顯示名稱，避免 Form 標題寫死功能名稱。 */
const getWebResourceModelTitle = (displayName: ModelDisplaySchema, fallback: string): string =>
{
    return displayName.ModelDisplayName || fallback;
};

/** ContentStatus enum options，去掉 key=0。 */
const useContentStatusOptions = (): { data: Record<string, string>; isLoading: boolean; error: string | null; } =>
{
    const src = useFetchEnumOptions("ContentStatus");

    return useMemo(() =>
    {
        const raw = src.data ?? {};
        const { ["0"]: _drop, ...rest } = raw;
        return { data: rest as Record<string, string>, isLoading: Boolean(src.isLoading), error: src.error };
    }, [src.data, src.error, src.isLoading]);
};

/** WindowTarget enum options，沒有回傳時保留舊版預設顯示。 */
const useWindowTargetOptions = (): { data: Record<string, string>; isLoading: boolean; error: string | null; } =>
{
    const src = useFetchEnumOptions("WindowTarget");

    return useMemo(() =>
    {
        const data = Object.keys(src.data ?? {}).length > 0 ? src.data ?? {} : getFallbackWindowTargetMap();
        return { data, isLoading: Boolean(src.isLoading), error: src.error };
    }, [src.data, src.error, src.isLoading]);
};

/** 建立 WindowTarget 預設選項，避免 enum 尚未回來時外部連結無法編輯。 */
const getFallbackWindowTargetMap = (): Record<string, string> =>
{
    return { "0": "本頁開啟", "1": "另開分頁" };
};

/** 彙整 WebResource 參照資料，讓 timing hook 本體維持精簡。 */
const buildWebResourceReferenceResult = (
    opt: {
        category: { map?: Record<string, string>; isLoading: boolean; errorText?: string | null; refetch: () => Promise<void>; };
        tag: { map?: Record<string, string>; isLoading: boolean; errorText?: string | null; refetch: () => Promise<void>; };
        statusOpts: { data: Record<string, string>; isLoading: boolean; error: string | null; };
        windowTargetOpts: { data: Record<string, string>; isLoading: boolean; error: string | null; };
    },
) =>
{
    return {
        refs: { categoryMap: opt.category.map ?? {}, tagMap: opt.tag.map ?? {}, statusOpts: opt.statusOpts.data, windowTargetOpts: opt.windowTargetOpts.data },
        isLoading: Boolean(opt.category.isLoading || opt.tag.isLoading || opt.statusOpts.isLoading || opt.windowTargetOpts.isLoading),
        errors: [opt.category.errorText, opt.tag.errorText, opt.statusOpts.error, opt.windowTargetOpts.error],
        refetchRefData: async () =>
        {
            await Promise.all([opt.category.refetch(), opt.tag.refetch()]);
        },
    };
};

/** 建立 WebResource Detail 語系分頁資料。 */
const buildWebResourceDetailTabs = (details: WebResourceInfo[], preferLang: Lang): WebResourceDetailTabsResult =>
{
    const supportedDetails = filterSupportedDetailRows(details, preferLang);
    const tabItems = buildWebResourceDetailTabItems(supportedDetails);

    return { tabItems, items: supportedDetails };
};

/** 依支援語系排序並過濾 Detail，避免無效語系產生 Unknown Tab。 */
const filterSupportedDetailRows = (details: WebResourceInfo[], preferLang: Lang): WebResourceDetailTabItem[] =>
{
    const detailMap = buildServerSupportedLangDetailMap(details);
    const langs = buildSupportedLangOrder(preferLang);
    return langs.map(lang => buildWebResourceDetailTabItem(detailMap.get(lang.toLowerCase()))).filter((item): item is WebResourceDetailTabItem => Boolean(item));
};

/** 建立單一 Detail Tab 項目。 */
const buildWebResourceDetailTabItem = (detail: WebResourceInfo | undefined): WebResourceDetailTabItem | null =>
{
    if (!detail) return null;

    const lang = normalizeSupportedLang(detail.Lang);
    if (!lang) return null;

    const key = LibText.Merge("_", true, detail.WebResourceId, detail.RowId, lang);
    const label = LangLabelMap[lang] ?? lang;
    const rowKeys = buildWebResourceInfoRowKeys(detail);

    return { key, label, detail, rowKeys };
};

/** 建立 Detail RowKeys，新增模式不使用尚未產生的 WebResourceId 避免誤新增 row。 */
const buildWebResourceInfoRowKeys = (detail: WebResourceInfo): Record<string, string | number | null | undefined> =>
{
    return {
        [WebResourceInfoFields.RowId]: detail.RowId,
        [WebResourceInfoFields.Lang]: detail.Lang,
    };
};

/** 建立 Detail TabContentComp 需要的 item map。 */
const buildWebResourceDetailTabItems = (items: WebResourceDetailTabItem[]): Record<string, string> =>
{
    return items.reduce<Record<string, string>>((tabItems, item) =>
    {
        tabItems[item.key] = item.label;
        return tabItems;
    }, {});
};
// #endregion