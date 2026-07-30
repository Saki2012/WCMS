import { TagAdapter } from "@/Features/Hooks/BizFunc/COMM/Tag_Api";
import type {
    ServerFormBinding,
    ServerFormDefaultRawData,
    ServerFormTemplate,
} from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Hook";
import { SpecCategoryAdapter } from "@/SpecFetures/1810/Hooks/WEB/SpecCategory_Api";
import { SpecResearchAdapter } from "@/SpecFetures/1810/Hooks/WEB/SpecResearch_Api";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangLabelMap, useEnsureLangDetails } from "@/SysCore/i18n/lang";
import type { ApiFormInitial } from "@/SysCore/Utils/API/APIAdapter";
import { useFetchEnumOptions } from "@/SysCore/Utils/API/SystemAPI_Hook";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { PGID, SpecResearchDetailFields, SpecResearchFields } from "@/types/SchemaFields";
import { useMemo } from "react";

// #region Property
type SpecResearchFormModel = components["schemas"]["SpecResearch"];

type SpecResearchDetail = NonNullable<SpecResearchFormModel["_SpecResearchDetail"]>[number];

type SpecCategoryFormModel = components["schemas"]["SpecCategory"];

type SpecResearchCategorySource = {
    /** 類別選項 Map */
    map?: Record<string, string>;

    /** 類別原始資料 */
    data?: SpecCategoryFormModel[];

    /** 類別查詢中 */
    isLoading?: boolean;

    /** 類別錯誤文字 */
    errorText?: string | null;

    /** 類別重新查詢 */
    refetch: () => Promise<unknown> | unknown;
};

type SpecResearchTagSource = {
    /** 標籤選項 Map */
    map?: Record<string, string>;

    /** 標籤查詢中 */
    isLoading?: boolean;

    /** 標籤錯誤文字 */
    errorText?: string | null;

    /** 標籤重新查詢 */
    refetch: () => Promise<unknown> | unknown;
};

export type SpecResearchRowKeyValue = string | number | null | undefined;

export type SpecResearchRowKeys = Record<string, SpecResearchRowKeyValue>;

export interface UseSpecResearchFormTemplateOptions
{
    /** 目前語系 */
    lang: Lang;

    /** 後台主題設定 */
    theme: IBETheme;

    /** 資料 internalId，空值代表新增 */
    internalId: string;

    /** 新增模式預設資料 */
    emptyData: SpecResearchFormModel;

    /** Form Template 標準動作設定 */
    actionsOpt: SpecResearchFormActionsOpt;
}

export interface UseSpecResearchDetailTabsOptions
{
    /** 新版 Form Template 提供的資料 binding */
    binding: ServerFormBinding<SpecResearchFormModel>;

    /** 目前語系，保留給後續語系排序擴充 */
    lang: Lang;
}

export interface SpecResearchDetailTabItem
{
    /** Tab key，給 TabContentComp 對應內容 */
    key: string;

    /** Tab 顯示文字 */
    label: string;

    /** Detail 原始 DTO */
    detail: SpecResearchDetail;

    /** Detail row keys，給 useSetTableField 綁定欄位 */
    rowKeys: SpecResearchRowKeys;
}

export interface SpecResearchDetailTabsResult
{
    /** TabContentComp 使用的 tab item map */
    tabItems: Record<string, string>;

    /** Comp 渲染 Detail 欄位使用的 tab items */
    items: SpecResearchDetailTabItem[];
}

export type SpecResearchFormRefs = {
    /** 研究計畫類別選項 */
    categoryMap: Record<string, string>;

    /** 類別可顯示欄位設定 */
    categoryCols: Record<string, string[]>;

    /** 研究計畫標籤選項 */
    tagMap: Record<string, string>;

    /** 內容狀態 enum 選項 */
    statusOpts: Record<string, string>;
};

export type SpecResearchFormActionsOpt = {
    /** 儲存/刪除成功後要回到列表 */
    onBackToList: () => void;
};

export type SpecResearchFormAdapter = {
    /** 研究計畫 API adapter */
    SpecResearch: ReturnType<typeof SpecResearchAdapter>;

    /** 研究計畫類別 API adapter */
    SpecCategory: ReturnType<typeof SpecCategoryAdapter>;

    /** 標籤 API adapter */
    Tag: ReturnType<typeof TagAdapter>;
};
// #endregion

// #region Public
export const specResearchEmptyData: SpecResearchFormModel = { _SpecResearchDetail: [] };

/** 建立 SpecResearch Form Template，統一交給 Server_FormTemplate 處理資料流程。 */
export const useSpecResearchFormTemplate = (
    opt: UseSpecResearchFormTemplateOptions,
): ServerFormTemplate<SpecResearchFormModel, SpecResearchFormAdapter, SpecResearchFormRefs, ServerFormDefaultRawData<SpecResearchFormModel, SpecResearchFormRefs>, SpecResearchFormActionsOpt> =>
{
    return useMemo(() =>
    {
        return {
            featureKey: PGID.SpecResearch,
            theme: opt.theme,
            lang: opt.lang,
            internalId: opt.internalId,
            emptyData: opt.emptyData,
            actionsOpt: opt.actionsOpt,
            spec: {
                buildAdapter: buildSpecResearchFormAdapter,
                selectDataAdapter: adapter => adapter.SpecResearch,
                buildTitle: buildSpecResearchFormTitle,
                buildInitialData: buildSpecResearchInitialData,
                useReferenceData: ctx => useSpecResearchReferenceData({ ...ctx, lang: opt.lang }),
            },
        };
    }, [opt.actionsOpt, opt.emptyData, opt.internalId, opt.lang, opt.theme]);
};

/** 建立研究計畫多語 Detail Tabs，避免 Comp 自行處理 Tab key 與 rowKeys。 */
export const useSpecResearchDetailTabs = (opt: UseSpecResearchDetailTabsOptions): SpecResearchDetailTabsResult =>
{
    const details = opt.binding.data?._SpecResearchDetail;

    return useMemo(() =>
    {
        return buildSpecResearchDetailTabs(details ?? []);
    }, [details]);
};
// #endregion

// #region Private
/** 建立 SpecResearch Form 標題，功能名稱優先讀 ModelDisplayName。 */
const buildSpecResearchFormTitle = (ctx: { mode: "new" | "edit"; displayName: ModelDisplaySchema; }): string =>
{
    const modelTitle = ctx.displayName.ModelDisplayName || "研究計畫";
    return `${ctx.mode === "edit" ? "修改" : "新增"}${modelTitle}`;
};

/** 建立新增模式的 initial data，避免新增時查詢 __new__。 */
const buildSpecResearchInitialData = (ctx: { mode: "new" | "edit"; emptyData: SpecResearchFormModel; }): ApiFormInitial<SpecResearchFormModel> | undefined =>
{
    if (ctx.mode !== "new") return undefined;
    return { data: { args: "__new__", apiRes: { IsSuccess: true, Data: ctx.emptyData, SysMessage: [] } } };
};

/** 建立 SpecResearch Form 會使用到的 Adapter 群組。 */
const buildSpecResearchFormAdapter = (): SpecResearchFormAdapter =>
{
    return { SpecResearch: SpecResearchAdapter(), SpecCategory: SpecCategoryAdapter(), Tag: TagAdapter() };
};

/** 取得 Header / Detail 需要的參照資料。 */
const useSpecResearchReferenceData = (
    ctx: { adapter: SpecResearchFormAdapter; binding: ServerFormBinding<SpecResearchFormModel>; lang: Lang; },
) =>
{
    useEnsureLangDetails(ctx.binding, {
        detailName: SpecResearchFields._SpecResearchDetail,
        parentKeys: [SpecResearchDetailFields.ResearchId],
        preferFirstLang: ctx.lang,
    });

    const category = ctx.adapter.SpecCategory.hooks.useMapByProgId({ progId: PGID.SpecResearch, lang: ctx.lang });
    const tag = ctx.adapter.Tag.hooks.useMapByProgId({ progId: PGID.SpecResearch, lang: ctx.lang });
    const statusOpts = useContentStatusOptions();

    return useMemo(() =>
    {
        return buildSpecResearchReferenceResult(category, tag, statusOpts);
    }, [category, tag, statusOpts]);
};

/** 建立 SpecResearch 參照資料結果。 */
const buildSpecResearchReferenceResult = (
    category: SpecResearchCategorySource,
    tag: SpecResearchTagSource,
    statusOpts: { data: Record<string, string>; isLoading: boolean; error: string | null; },
) =>
{
    return {
        refs: {
            categoryMap: category.map ?? {},
            categoryCols: buildCategoryCols(category.data ?? []),
            tagMap: tag.map ?? {},
            statusOpts: statusOpts.data,
        },
        isLoading: Boolean(category.isLoading || tag.isLoading || statusOpts.isLoading),
        errors: [category.errorText, tag.errorText, statusOpts.error],
        refetchRefData: async () =>
        {
            await Promise.all([category.refetch(), tag.refetch()]);
        },
    };
};

/** ContentStatus enum options（去掉 key=0）。 */
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

/** SpecCategory.ShowColumnItems 轉成 CategoryId 對顯示欄位清單。 */
const buildCategoryCols = (rows: SpecCategoryFormModel[]): Record<string, string[]> =>
{
    return rows.reduce<Record<string, string[]>>((map, set) =>
    {
        const cateId = set.CategoryId ?? "";
        if (!cateId) return map;
        map[cateId] = parseShowColumnItems((set.ShowColumnItems ?? "").trim());
        return map;
    }, {});
};

/** 解析 ShowColumnItems，支援 JSON array / CSV / pipe / semicolon。 */
const parseShowColumnItems = (raw: string): string[] =>
{
    if (!raw) return [];
    if (raw.startsWith("[") && raw.endsWith("]")) return safeParseJsonArray(raw) ?? [];
    return raw.split(/[,;|]/g).map(item => item.trim()).filter(Boolean);
};

/** 安全解析 JSON array。 */
const safeParseJsonArray = (raw: string): string[] | null =>
{
    try
    {
        const parsed = JSON.parse(raw) as unknown;
        if (!Array.isArray(parsed)) return null;
        return parsed.filter((item): item is string => typeof item === "string").map(item => item.trim()).filter(Boolean);
    } catch
    {
        return null;
    }
};

/** 建立 Detail Tab 資料。 */
const buildSpecResearchDetailTabs = (details: SpecResearchDetail[]): SpecResearchDetailTabsResult =>
{
    const items = details.map(buildSpecResearchDetailTabItem);
    const tabItems = items.reduce<Record<string, string>>((map, item) =>
    {
        map[item.key] = item.label;
        return map;
    }, {});

    return { tabItems, items };
};

/** 建立單一 Detail Tab。 */
const buildSpecResearchDetailTabItem = (detail: SpecResearchDetail): SpecResearchDetailTabItem =>
{
    const key = `${detail.ResearchId ?? ""}_${detail.RowId ?? ""}_${detail.Lang ?? ""}`;
    const label = LangLabelMap[detail.Lang as Lang] ?? detail.Lang ?? "Unknown";
    const rowKeys = { [SpecResearchDetailFields.ResearchId]: detail.ResearchId, [SpecResearchDetailFields.RowId]: detail.RowId };

    return { key, label, detail, rowKeys };
};
// #endregion
