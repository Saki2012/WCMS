import { CategoryAdapter } from "@/Features/Hooks/BizFunc/COMM/Category_Api";
import { PageManagementAdapter } from "@/Features/Hooks/BizFunc/WEB/PageManagement_Api";
import type {
    ServerFormBinding,
    ServerFormDefaultRawData,
    ServerFormTemplate,
} from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Hook";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { buildSupportedLangOrder, type Lang, LangLabelMap, normalizeSupportedLang, SUPPORTED_LANGS, useEnsureLangDetails } from "@/SysCore/i18n/lang";
import type { ApiFormInitial } from "@/SysCore/Utils/API/APIAdapter";
import { LibText } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { PageManagementDetailFields, PageManagementSetFields, PGID } from "@/types/SchemaFields";
import { useMemo } from "react";

// #region Property
type PageManagementSet = components["schemas"]["PageManagementSet_DTO"];

type PageManagementDetail = NonNullable<PageManagementSet["PageManagementDetail"]>[number];

export type PageManagementDetailRowKeys = Record<string, string | number | boolean | null | undefined>;

export interface UsePageManagementFormTemplateOptions
{
    /** 目前語系 */
    lang: Lang;

    /** 後台主題設定 */
    theme: IBETheme;

    /** 資料 internalId，空值代表新增 */
    internalId: string;

    /** 新增模式預設資料 */
    emptyData: PageManagementSet;

    /** Form Template 標準動作設定 */
    actionsOpt: PageManagementFormActionsOpt;
}

export interface UsePageManagementDetailTabsOptions
{
    /** 新版 Form Template 提供的資料 binding */
    binding: ServerFormBinding<PageManagementSet>;

    /** 目前語系，會優先排在第一個 Tab */
    lang: Lang;
}

export interface PageManagementDetailTabItem
{
    /** Tab key，給 TabContentComp 對應內容 */
    key: string;

    /** Tab 顯示文字 */
    label: string;

    /** Detail 原始 DTO */
    detail: PageManagementDetail;

    /** Detail row keys，給 useSetTableField 綁定欄位 */
    rowKeys: PageManagementDetailRowKeys;
}

export interface PageManagementDetailTabsResult
{
    /** TabContentComp 使用的 tab item map */
    tabItems: Record<string, string>;

    /** Comp 渲染 Detail 欄位使用的 tab items */
    items: PageManagementDetailTabItem[];
}

export type PageManagementFormRefs = {
    /** 頁面分類下拉選項 */
    categoryMap: Record<string, string>;

    /** 可綁定 SiteMenu 的功能模塊選項 */
    usedProgMap: Map<string, string>;
};

export type PageManagementFormActionsOpt = {
    /** 儲存成功後要回到列表（或其他導頁） */
    onBackToList: () => void;
};

export type PageManagementFormAdapter = { PageManagement: ReturnType<typeof PageManagementAdapter>; Category: ReturnType<typeof CategoryAdapter>; };

const emptyUsedProgMap = new Map<string, string>();
// #endregion

// #region Public
export const pageManagementEmptyData: PageManagementSet = { PageManagement: {}, PageManagementDetail: [] };

/** 建立 PageManagement Form Template，統一交給 Server_FormTemplate 處理資料流程。 */
export const usePageManagementFormTemplate = (
    opt: UsePageManagementFormTemplateOptions,
): ServerFormTemplate<
    PageManagementSet,
    PageManagementFormAdapter,
    PageManagementFormRefs,
    ServerFormDefaultRawData<PageManagementSet, PageManagementFormRefs>,
    PageManagementFormActionsOpt
> =>
{
    return useMemo(() =>
    {
        return {
            featureKey: "PageManagement",
            theme: opt.theme,
            lang: opt.lang,
            internalId: opt.internalId,
            emptyData: opt.emptyData,
            actionsOpt: opt.actionsOpt,
            feature: {
                buildAdapter: buildPageManagementFormAdapter,
                selectDataAdapter: adapter => adapter.PageManagement,
                buildTitle: buildPageManagementFormTitle,
                buildInitialData: buildPageManagementInitialData,
                useReferenceData: ctx => usePageManagementReferenceData({ ...ctx, lang: opt.lang }),
            },
        };
    }, [opt.actionsOpt, opt.emptyData, opt.internalId, opt.lang, opt.theme]);
};

/** 建立 PageManagement Detail 語系 Tabs，避免 Comp 處理語系過濾與 Unknown fallback。 */
export const usePageManagementDetailTabs = (opt: UsePageManagementDetailTabsOptions): PageManagementDetailTabsResult =>
{
    const details = opt.binding.data?.PageManagementDetail;

    return useMemo(() =>
    {
        return buildPageManagementDetailTabs(details ?? [], opt.lang);
    }, [details, opt.lang]);
};
// #endregion

// #region Private
/** 建立 PageManagement Form 標題，功能名稱優先讀 ModelDisplayName。 */
const buildPageManagementFormTitle = (ctx: { mode: "new" | "edit"; displayName: ModelDisplaySchema; }): string =>
{
    const modelTitle = getPageManagementModelTitle(ctx.displayName, "頁面");
    return `${ctx.mode === "edit" ? "修改" : "新增"}${modelTitle}`;
};

/** 建立新增模式的 initial data，統一由 Feature Timing 交給 Template。 */
const buildPageManagementInitialData = (ctx: { mode: "new" | "edit"; emptyData: PageManagementSet; }): ApiFormInitial<PageManagementSet> | undefined =>
{
    if (ctx.mode !== "new") return undefined;
    return { data: { args: "__new__", apiRes: { IsSuccess: true, Data: ctx.emptyData, SysMessage: [] } } };
};

/** 建立 PageManagement Form 會使用到的 Adapter 群組。 */
const buildPageManagementFormAdapter = (): PageManagementFormAdapter =>
{
    return { PageManagement: PageManagementAdapter(), Category: CategoryAdapter() };
};

/** 取得 Header / Detail 需要的參照資料與語系明細補齊。 */
const usePageManagementReferenceData = (
    ctx: { adapter: PageManagementFormAdapter; binding: ServerFormDefaultRawData<PageManagementSet, PageManagementFormRefs>["formData"]; lang: Lang; },
) =>
{
    useEnsureLangDetails(ctx.binding, {
        headerName: PageManagementSetFields.PageManagement,
        detailName: PageManagementSetFields.PageManagementDetail,
        parentKeys: [PageManagementDetailFields.PageId],
        langs: SUPPORTED_LANGS,
        preferFirstLang: ctx.lang,
    });

    const category = ctx.adapter.Category.hooks.useMapByProgId({ progId: PGID.PageManagement, lang: ctx.lang });
    const usedProg = ctx.adapter.PageManagement.hooks.useUsedProgList({ deps: [] });

    return useMemo(() =>
    {
        return {
            refs: { categoryMap: category.map ?? {}, usedProgMap: usedProg.data ?? emptyUsedProgMap },
            isLoading: Boolean(category.isLoading || usedProg.isLoading),
            errors: [category.errorText, usedProg.errorText],
            refetchRefData: async () =>
            {
                await Promise.all([category.refetch(), usedProg.refetch()]);
            },
        };
    }, [category.errorText, category.isLoading, category.map, category.refetch, usedProg.data, usedProg.errorText, usedProg.isLoading, usedProg.refetch]);
};

/** 取得 PageManagement Model 顯示名稱，避免 Form 標題寫死功能名稱。 */
const getPageManagementModelTitle = (displayName: ModelDisplaySchema, fallback: string): string =>
{
    return displayName.ModelDisplayName || fallback;
};

/** 建立 PageManagement Detail 語系分頁資料。 */
const buildPageManagementDetailTabs = (details: PageManagementDetail[], preferLang: Lang): PageManagementDetailTabsResult =>
{
    const supportedDetails = filterSupportedDetailRows(details, preferLang);
    const tabItems = buildPageManagementDetailTabItems(supportedDetails);

    return { tabItems, items: supportedDetails };
};

/** 依支援語系排序並過濾 Detail，避免無效語系產生 Unknown Tab。 */
const filterSupportedDetailRows = (details: PageManagementDetail[], preferLang: Lang): PageManagementDetailTabItem[] =>
{
    const detailMap = buildSupportedDetailMap(details);
    const langs = buildSupportedLangOrder(preferLang);

    return langs.map(lang => buildPageManagementDetailTabItem(detailMap.get(lang.toLowerCase()))).filter((item): item is PageManagementDetailTabItem =>
        Boolean(item)
    );
};

/** 將有效語系 Detail 建成 Map，同語系只保留第一筆。 */
const buildSupportedDetailMap = (details: PageManagementDetail[]): Map<string, PageManagementDetail> =>
{
    return details.reduce<Map<string, PageManagementDetail>>((map, detail) =>
    {
        const lang = normalizeSupportedLang(detail.Lang);
        if (!lang || map.has(lang)) return map;
        map.set(lang, detail);
        return map;
    }, new Map<string, PageManagementDetail>());
};

/** 建立單一 Detail Tab 項目。 */
const buildPageManagementDetailTabItem = (detail: PageManagementDetail | undefined): PageManagementDetailTabItem | null =>
{
    if (!detail) return null;

    const lang = normalizeSupportedLang(detail.Lang);
    if (!lang) return null;

    const key = LibText.Merge("_", true, detail.PageId, detail.RowId, lang);
    const label = LangLabelMap[lang] ?? lang;
    const rowKeys = buildPageManagementDetailRowKeys(detail);

    return { key, label, detail, rowKeys };
};

/** 建立 Detail RowKeys，保留 null 主鍵並加入 Lang，避免 Template 寫入時新建無語系列。 */
const buildPageManagementDetailRowKeys = (detail: PageManagementDetail): PageManagementDetailRowKeys =>
{
    // 宣告變數
    const lang = normalizeSupportedLang(detail.Lang);

    // return
    return {
        [PageManagementDetailFields.PageId]: toBindingRowKey(detail.PageId),
        [PageManagementDetailFields.RowId]: toBindingRowKey(detail.RowId),
        [PageManagementDetailFields.Lang]: lang,
    };
};

/** 建立 Detail TabContentComp 需要的 item map。 */
const buildPageManagementDetailTabItems = (items: PageManagementDetailTabItem[]): Record<string, string> =>
{
    return items.reduce<Record<string, string>>((tabItems, item) =>
    {
        tabItems[item.key] = item.label;
        return tabItems;
    }, {});
};

/** 保留 DTO 原始 key 值，避免 null 被轉成 undefined 後比對不到原列。 */
const toBindingRowKey = (value: string | number | null | undefined): string | number | null | undefined =>
{
    // return
    return value;
};
// #endregion
