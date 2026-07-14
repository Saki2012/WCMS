import { TagAdapter } from "@/Features/Hooks/BizFunc/COMM/Tag_Api";
import type {
    ServerFormBinding,
    ServerFormDefaultRawData,
    ServerFormTemplate,
} from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Hook";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { SpecCategoryAdapter } from "@/SpecFetures/1810/Hooks/WEB/SpecCategory_Api";
import { SpecUSRAdapter } from "@/SpecFetures/1810/Hooks/WEB/SpecUSR_Api";
import type { Lang } from "@/SysCore/i18n/lang";
import { useEnsureLangDetails } from "@/SysCore/i18n/lang";
import type { ApiFormInitial } from "@/SysCore/Utils/API/APIAdapter";
import { useFetchEnumOptions } from "@/SysCore/Utils/API/SystemAPI_Hook";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { PGID, SpecUSRDetailFields, SpecUSRPhotoInfoFields, SpecUSRSetFields } from "@/types/SchemaFields";
import { useMemo } from "react";

// #region Property
type SpecUSRSet = components["schemas"]["SpecUSRSet_DTO"];

type SpecCategorySet = components["schemas"]["SpecCategorySet_DTO"];

type SpecUSRCategorySource = {
    /** 類別選項 Map。 */
    map?: Record<string, string>;

    /** 類別原始資料。 */
    data?: SpecCategorySet[];

    /** 類別查詢中。 */
    isLoading?: boolean;

    /** 類別錯誤文字。 */
    errorText?: string | null;

    /** 類別重新查詢。 */
    refetch: () => Promise<unknown> | unknown;
};

type SpecUSRTagSource = {
    /** 標籤選項 Map。 */
    map?: Record<string, string>;

    /** 標籤查詢中。 */
    isLoading?: boolean;

    /** 標籤錯誤文字。 */
    errorText?: string | null;

    /** 標籤重新查詢。 */
    refetch: () => Promise<unknown> | unknown;
};

export interface UseSpecUSRFormTemplateOptions
{
    /** 目前語系。 */
    lang: Lang;

    /** 後台主題設定。 */
    theme: IBETheme;

    /** 資料 internalId，空值代表新增。 */
    internalId: string;

    /** 新增模式預設資料。 */
    emptyData: SpecUSRSet;

    /** Form Template 標準動作設定。 */
    actionsOpt: SpecUSRFormActionsOpt;
}

export type SpecUSRFormRefs = {
    /** 計畫成果類別選項。 */
    categoryMap: Record<string, string>;

    /** 類別可顯示欄位設定。 */
    categoryCols: Record<string, string[]>;

    /** 計畫成果標籤選項。 */
    tagMap: Record<string, string>;

    /** 內容狀態 enum 選項。 */
    statusOpts: Record<string, string>;
};

export type SpecUSRFormActionsOpt = {
    /** 儲存/刪除成功後要回到列表。 */
    onBackToList: () => void;
};

export type SpecUSRFormAdapter = {
    /** 計畫成果 API adapter。 */
    SpecUSR: ReturnType<typeof SpecUSRAdapter>;

    /** 1810 類別 API adapter。 */
    SpecCategory: ReturnType<typeof SpecCategoryAdapter>;

    /** 標籤 API adapter。 */
    Tag: ReturnType<typeof TagAdapter>;
};
// #endregion

// #region Public
export const specUSREmptyData: SpecUSRSet = { SpecUSR: {}, SpecUSRDetail: [], SpecUSRFile: [], SpecUSRUrl: [], SpecUSRPhoto: [], SpecUSRPhotoInfo: [] };

/** 計畫成果主圖上傳限制。 */
export const SpecUSRPictureUploadLimit = {
    accept: "image/*",
    multiple: false,
    maxFileCount: 1,
    maxFileSizeMB: 10,
} as const;

/** 計畫成果附件上傳限制。 */
export const SpecUSRAttachmentUploadLimit = {
    accept: "*/*",
    multiple: false,
    maxFileCount: 1,
    maxFileSizeMB: 10,
} as const;

/** 計畫成果相片批次上傳限制。 */
export const SpecUSRPhotoBatchUploadLimit = {
    accept: "image/*",
    multiple: true,
    maxFileCount: 20,
    maxFileSizeMB: 10,
} as const;

/** 建立 SpecUSR Form Template，統一交給 Server_FormTemplate 處理資料流程。 */
export const useSpecUSRFormTemplate = (
    opt: UseSpecUSRFormTemplateOptions,
): ServerFormTemplate<SpecUSRSet, SpecUSRFormAdapter, SpecUSRFormRefs, ServerFormDefaultRawData<SpecUSRSet, SpecUSRFormRefs>, SpecUSRFormActionsOpt> =>
{
    return useMemo(() =>
    {
        return {
            featureKey: PGID.SpecUSR,
            theme: opt.theme,
            lang: opt.lang,
            internalId: opt.internalId,
            emptyData: opt.emptyData,
            actionsOpt: opt.actionsOpt,
            spec: {
                buildAdapter: buildSpecUSRFormAdapter,
                selectDataAdapter: adapter => adapter.SpecUSR,
                buildTitle: buildSpecUSRFormTitle,
                buildInitialData: buildSpecUSRInitialData,
                useReferenceData: ctx => useSpecUSRReferenceData({ ...ctx, lang: opt.lang }),
            },
        };
    }, [opt.actionsOpt, opt.emptyData, opt.internalId, opt.lang, opt.theme]);
};
// #endregion

// #region Private
/** 建立 SpecUSR Form 標題，功能名稱優先讀 ModelDisplayName。 */
const buildSpecUSRFormTitle = (ctx: { mode: "new" | "edit"; displayName: ModelDisplaySchema; }): string =>
{
    const modelTitle = ctx.displayName.ModelDisplayName || "計畫成果";
    return `${ctx.mode === "edit" ? "修改" : "新增"}${modelTitle}`;
};

/** 建立新增模式的 initial data，避免新增時查詢 __new__。 */
const buildSpecUSRInitialData = (ctx: { mode: "new" | "edit"; emptyData: SpecUSRSet; }): ApiFormInitial<SpecUSRSet> | undefined =>
{
    if (ctx.mode !== "new") return undefined;
    return { data: { args: "__new__", apiRes: { IsSuccess: true, Data: ctx.emptyData, SysMessage: [] } } };
};

/** 建立 SpecUSR Form 會使用到的 Adapter 群組。 */
const buildSpecUSRFormAdapter = (): SpecUSRFormAdapter =>
{
    return { SpecUSR: SpecUSRAdapter(), SpecCategory: SpecCategoryAdapter(), Tag: TagAdapter() };
};

/** 取得 Header / Detail 需要的參照資料。 */
const useSpecUSRReferenceData = (
    ctx: { adapter: SpecUSRFormAdapter; binding: ServerFormBinding<SpecUSRSet>; lang: Lang; },
) =>
{
    useEnsureLangDetails(ctx.binding, {
        headerName: SpecUSRSetFields.SpecUSR,
        detailName: SpecUSRSetFields.SpecUSRDetail,
        parentKeys: [SpecUSRDetailFields.USRId],
        preferFirstLang: ctx.lang,
    });
    useEnsureLangDetails(ctx.binding, {
        headerName: SpecUSRSetFields.SpecUSRPhoto,
        detailName: SpecUSRSetFields.SpecUSRPhotoInfo,
        parentKeys: [SpecUSRPhotoInfoFields.USRId, SpecUSRPhotoInfoFields.ParentRowId],
        preferFirstLang: ctx.lang,
    });

    const category = ctx.adapter.SpecCategory.hooks.useMapByProgId({ progId: PGID.SpecUSR, lang: ctx.lang });
    const tag = ctx.adapter.Tag.hooks.useMapByProgId({ progId: PGID.SpecUSR, lang: ctx.lang });
    const statusOpts = useContentStatusOptions();

    return useMemo(() =>
    {
        return buildSpecUSRReferenceResult(category, tag, statusOpts);
    }, [category, tag, statusOpts]);
};

/** 建立 SpecUSR 參照資料結果。 */
const buildSpecUSRReferenceResult = (
    category: SpecUSRCategorySource,
    tag: SpecUSRTagSource,
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

/** ContentStatus enum options，移除 key=0 的預設值。 */
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
const buildCategoryCols = (rows: SpecCategorySet[]): Record<string, string[]> =>
{
    return rows.reduce<Record<string, string[]>>((map, set) =>
    {
        const cateId = set.SpecCategory?.CategoryId ?? "";
        if (!cateId) return map;
        map[cateId] = parseShowColumnItems((set.SpecCategory?.ShowColumnItems ?? "").trim());
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
// #endregion
