import { TagAdapter } from "@/Features/Hooks/BizFunc/COMM/Tag_Api";
import type {
    ServerFormBinding,
    ServerFormDefaultRawData,
    ServerFormTemplate,
} from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Hook";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { SpecCategoryAdapter } from "@/SpecFetures/1810/Hooks/WEB/SpecCategory_Api";
import { SpecUSRAdapter } from "@/SpecFetures/1810/Hooks/WEB/SpecUSR_Api";
import type { ColumnConfig } from "@/SysCore/Components/Grid/Grid_Data";
import type { Lang } from "@/SysCore/i18n/lang";
import { useEnsureLangDetails } from "@/SysCore/i18n/lang";
import type { ApiFormInitial, ServerFormActions } from "@/SysCore/Utils/API/APIAdapter";
import { useFetchEnumOptions } from "@/SysCore/Utils/API/SystemAPI_Hook";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { PGID, SpecUSRDetailFields, SpecUSRModelFields, SpecUSRPhotoInfoFields, SpecUSRSetFields } from "@/types/SchemaFields";
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

export interface SpecUSRPreviewPayload
{
    /** 預覽使用的語系。 */
    lang: Lang;

    /** SpecUSR 預覽主資料。 */
    formData: SpecUSRSet;

    /** 依目前類別可顯示的欄位。 */
    showColumns: string[];

    /** 前台欄位標題設定。 */
    showColTitle: ColumnConfig[];
}

export type SpecUSRFormActionsOpt = {
    /** 儲存/刪除成功後要回到列表。 */
    onBackToList: () => void;

    /** 以目前 DTO 觸發 preview。 */
    onPreviewFromDto: (payload: SpecUSRPreviewPayload) => void;
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

const previewVisibleKeys: ReadonlyArray<readonly [string, string]> = [
    [SpecUSRSetFields.SpecUSR, SpecUSRModelFields.PictureId],
    [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.Year],
    [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.AcademicYear],
    [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.Courses],
    [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.PracticeField],
    [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.ProjectName],
    [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.ExternalCooperationUnit],
    [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.Department],
    [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.PlanAmount],
    [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.DuringExecution],
    [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.ExecutionStrategy],
    [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.ContentIntroduction],
    [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.ProjectConcept],
    [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.ProjectHighlights],
    [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.ProjectLeader],
    [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.ProjectSubLeader],
    [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.Cohost1],
    [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.Cohost2],
    [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.Commissioned],
    [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.AttendTeam],
    [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.Remark],
    [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.ProjectItem],
    [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.Url],
];

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
                buildActions: (ctx, defaultActions) => buildSpecUSRActions({ ...ctx, lang: opt.lang }, defaultActions),
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

/** 建立 SpecUSR Toolbar 動作，追加前台預覽行為。 */
const buildSpecUSRActions = (
    ctx: { binding: ServerFormBinding<SpecUSRSet>; refs: SpecUSRFormRefs; actionsOpt: SpecUSRFormActionsOpt; lang: Lang; },
    defaultActions: ServerFormActions,
): ServerFormActions =>
{
    // return
    return { ...defaultActions, Preview: () => ctx.actionsOpt.onPreviewFromDto(buildSpecUSRPreviewPayload(getLatestSpecUSRFormData(ctx.binding), ctx.refs, ctx.binding.displayName, ctx.lang)) };
};

/** 建立 SpecUSR 前台預覽 payload。 */
const buildSpecUSRPreviewPayload = (formData: SpecUSRSet, refs: SpecUSRFormRefs, displayName: ModelDisplaySchema, lang: Lang): SpecUSRPreviewPayload =>
{
    // 宣告變數
    const previewData = cloneSpecUSRPreviewData(formData);
    const categoryId = `${previewData.SpecUSR?.CategoryId ?? ""}`.trim();
    const showColumns = resolvePreviewShowColumns(refs.categoryCols?.[categoryId] ?? []);
    const showColTitle = buildSpecUSRPreviewColumns(displayName, previewVisibleKeys);

    // return
    return { lang, formData: previewData, showColumns, showColTitle };
};

/** 取得目前最新的 SpecUSR 表單資料，避免 Preview action 拿到舊 closure。 */
const getLatestSpecUSRFormData = (binding: ServerFormBinding<SpecUSRSet>): SpecUSRSet =>
{
    // return
    return binding.getData?.() ?? binding.data;
};

/** 複製 SpecUSR 預覽資料，避免 iframe payload 與後台編輯狀態共用 reference。 */
const cloneSpecUSRPreviewData = (formData: SpecUSRSet): SpecUSRSet =>
{
    // return
    return {
        SpecUSR: { ...(formData.SpecUSR ?? {}) },
        SpecUSRDetail: (formData.SpecUSRDetail ?? []).map(item => ({ ...item })),
        SpecUSRPhoto: (formData.SpecUSRPhoto ?? []).map(item => ({ ...item })),
        SpecUSRPhotoInfo: (formData.SpecUSRPhotoInfo ?? []).map(item => ({ ...item })),
        SpecUSRFile: (formData.SpecUSRFile ?? []).map(item => ({ ...item })),
        SpecUSRUrl: (formData.SpecUSRUrl ?? []).map(item => ({ ...item })),
    };
};

/** 依後端欄位顯示設定建立前台預覽欄位標題。 */
const buildSpecUSRPreviewColumns = (schema: ModelDisplaySchema, visibleKeys: ReadonlyArray<readonly [string, string]>): ColumnConfig[] =>
{
    // 執行 function
    if (!schema?.Tables?.length || visibleKeys.length === 0) return [];

    // return
    return visibleKeys.map(([tableId, columnId]) =>
    {
        const table = schema.Tables.find(p => p.TableId === tableId);
        const column = table?.Columns.find(p => p.ColumnId === columnId);
        if (!column) return null;
        return { key: column.ColumnId, title: column.ColumnDisplayName } as ColumnConfig;
    }).filter((p): p is ColumnConfig => p !== null);
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
    if (raw.startsWith("[") && raw.endsWith("]")) return resolvePreviewShowColumns(safeParseJsonArray(raw) ?? []);
    return resolvePreviewShowColumns(raw.split(/[,;|]/g));
};

/** 正規化預覽顯示欄位，讓後台組成資料與前台 view 比對格式一致。 */
const resolvePreviewShowColumns = (items: string[]): string[] =>
{
    const supported = new Set(previewVisibleKeys.map(([, col]) => col));
    const seen = new Set<string>();
    return items.map(item => normalizePreviewColumnKey(item)).filter(key => key && supported.has(key) && !seen.has(key)).map(key => (seen.add(key), key));
};

/** 將 SpecUSRDetail.ProjectName 這類欄位名稱轉成前台 view 使用的 ProjectName。 */
const normalizePreviewColumnKey = (item: string): string =>
{
    return `${item ?? ""}`.split(".").pop()?.trim() ?? "";
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
