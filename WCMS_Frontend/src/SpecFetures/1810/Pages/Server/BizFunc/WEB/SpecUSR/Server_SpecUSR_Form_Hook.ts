import { TagAdapter } from "@/Features/Hooks/BizFunc/COMM/Tag_Api";
import type {
    ServerFormBinding,
    ServerFormDefaultRawData,
    ServerFormTemplate,
} from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Hook";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { SpecCategoryAdapter } from "@/SpecFetures/1810/Hooks/WEB/SpecCategory_Api";
import { SpecUSRAdapter } from "@/SpecFetures/1810/Hooks/WEB/SpecUSR_Api";
import { buildSupportedLangOrder, type Lang, SUPPORTED_LANGS, useEnsureLangDetails } from "@/SysCore/i18n/lang";
import type { ApiFormInitial, ServerFormActions } from "@/SysCore/Utils/API/APIAdapter";
import { useFetchEnumOptions } from "@/SysCore/Utils/API/SystemAPI_Hook";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { PGID, SpecUSRDetailFields, SpecUSRFields } from "@/types/SchemaFields";
import { useEffect, useMemo } from "react";

// #region Property
type SpecUSRFormModel = components["schemas"]["SpecUSR"];

type SpecUSRPhoto = NonNullable<SpecUSRFormModel["_SpecUSRPhoto"]>[number];

type SpecUSRPhotoInfo = NonNullable<SpecUSRPhoto["_SpecUSRPhotoInfo"]>[number];

type SpecCategoryFormModel = components["schemas"]["SpecCategory"];

type SpecUSRCategorySource = {
    /** 類別選項 Map。 */
    map?: Record<string, string>;

    /** 類別原始資料。 */
    data?: SpecCategoryFormModel[];

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
    emptyData: SpecUSRFormModel;

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

    /** 以目前 FormModel 開啟預覽。 */
    onPreviewFromDto: (dto: SpecUSRFormModel) => void;
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
export const specUSREmptyData: SpecUSRFormModel = { _SpecUSRDetail: [], _SpecUSRPhoto: [] };

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
): ServerFormTemplate<SpecUSRFormModel, SpecUSRFormAdapter, SpecUSRFormRefs, ServerFormDefaultRawData<SpecUSRFormModel, SpecUSRFormRefs>, SpecUSRFormActionsOpt> =>
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
                buildActions: buildSpecUSRActions,
            },
        };
    }, [opt.actionsOpt, opt.emptyData, opt.internalId, opt.lang, opt.theme]);
};
// #endregion

// #region Private
/** 建立計畫成果 Toolbar 動作，保留 FormModel 預覽流程。 */
const buildSpecUSRActions = (
    ctx: { binding: ServerFormBinding<SpecUSRFormModel>; actionsOpt: SpecUSRFormActionsOpt; },
    defaultActions: ServerFormActions,
): ServerFormActions =>
{
    return { ...defaultActions, Preview: () => ctx.actionsOpt.onPreviewFromDto(ctx.binding.data) };
};

/** 建立 SpecUSR Form 標題，功能名稱優先讀 ModelDisplayName。 */
const buildSpecUSRFormTitle = (ctx: { mode: "new" | "edit"; displayName: ModelDisplaySchema; }): string =>
{
    const modelTitle = ctx.displayName.ModelDisplayName || "計畫成果";
    return `${ctx.mode === "edit" ? "修改" : "新增"}${modelTitle}`;
};

/** 建立新增模式的 initial data，避免新增時查詢 __new__。 */
const buildSpecUSRInitialData = (ctx: { mode: "new" | "edit"; emptyData: SpecUSRFormModel; }): ApiFormInitial<SpecUSRFormModel> | undefined =>
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
    ctx: { adapter: SpecUSRFormAdapter; binding: ServerFormBinding<SpecUSRFormModel>; lang: Lang; },
) =>
{
    useEnsureLangDetails(ctx.binding, {
        detailName: SpecUSRFields._SpecUSRDetail,
        parentKeys: [SpecUSRDetailFields.USRId],
        preferFirstLang: ctx.lang,
    });
    useEnsureSpecUSRNestedCollections(ctx.binding, ctx.lang);

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


/** 補齊 Detail 子集合與相片語系子明細。 */
const useEnsureSpecUSRNestedCollections = (binding: ServerFormBinding<SpecUSRFormModel>, preferLang: Lang): void =>
{
    useEffect(() =>
    {
        if (!binding.data) return;
        binding.setFormData(prev => ensureSpecUSRNestedFormModel(prev, preferLang));
    }, [binding.data, binding.setFormData, preferLang]);
};

/** 補齊目前 FormModel 的巢狀子集合，內容未變時保留原 reference。 */
const ensureSpecUSRNestedFormModel = (model: SpecUSRFormModel, preferLang: Lang): SpecUSRFormModel =>
{
    const details = ensureSpecUSRDetailCollections(model._SpecUSRDetail ?? []);
    const photos = ensureSpecUSRPhotoCollections(model._SpecUSRPhoto ?? [], model.USRId, preferLang);
    if (details === model._SpecUSRDetail && photos === model._SpecUSRPhoto) return model;
    return { ...model, _SpecUSRDetail: details, _SpecUSRPhoto: photos };
};

/** 補齊 Detail 內的附件與網址集合。 */
const ensureSpecUSRDetailCollections = (details: SpecUSRFormModel["_SpecUSRDetail"]): NonNullable<SpecUSRFormModel["_SpecUSRDetail"]> =>
{
    const source = details ?? [];
    const next = source.map(detail =>
    {
        if (detail._SpecUSRFile && detail._SpecUSRUrl) return detail;
        return { ...detail, _SpecUSRFile: detail._SpecUSRFile ?? [], _SpecUSRUrl: detail._SpecUSRUrl ?? [] };
    });
    return isSameReferenceOrder(source, next) ? source : next;
};

/** 補齊相片支援語系並依目前語系排序。 */
const ensureSpecUSRPhotoCollections = (photos: SpecUSRPhoto[], usrId: string | null | undefined, preferLang: Lang): SpecUSRPhoto[] =>
{
    const langOrder = buildSupportedLangOrder(preferLang);
    const next = photos.map(photo => ensureSpecUSRPhotoCollection(photo, usrId, langOrder));
    return isSameReferenceOrder(photos, next) ? photos : next;
};

/** 補齊單張相片語系資訊並依目前語系排序。 */
const ensureSpecUSRPhotoCollection = (photo: SpecUSRPhoto, usrId: string | null | undefined, langOrder: Lang[]): SpecUSRPhoto =>
{
    const ensured = ensureSpecUSRPhotoLanguages(photo, usrId);
    const infos = ensured._SpecUSRPhotoInfo ?? [];
    const ordered = [...infos].sort((a, b) => langOrder.indexOf(a.Lang as Lang) - langOrder.indexOf(b.Lang as Lang));
    if (ensured === photo && isSameReferenceOrder(infos, ordered)) return photo;
    return { ...ensured, _SpecUSRPhotoInfo: ordered };
};

/** 補齊單張相片缺少的支援語系。 */
const ensureSpecUSRPhotoLanguages = (photo: SpecUSRPhoto, usrId?: string | null): SpecUSRPhoto =>
{
    const infos = photo._SpecUSRPhotoInfo ?? [];
    const existLangs = new Set(infos.map(info => String(info.Lang ?? "").toLowerCase()));
    const missingLangs = SUPPORTED_LANGS.filter(lang => !existLangs.has(lang));
    if (missingLangs.length === 0 && photo._SpecUSRPhotoInfo) return photo;
    const maxRowId = infos.reduce((max, info) => Math.max(max, Number(info.RowId ?? 0)), 0);
    const maxRowNo = infos.reduce((max, info) => Math.max(max, Number(info.RowNo ?? 0)), 0);
    const missing = missingLangs.map((lang, index): SpecUSRPhotoInfo => ({
        USRId: photo.USRId ?? usrId ?? "",
        ParentRowId: photo.RowId,
        RowId: maxRowId + index + 1,
        RowNo: maxRowNo + index + 1,
        Lang: lang,
        Title: "",
    }));
    return { ...photo, _SpecUSRPhotoInfo: [...infos, ...missing] };
};

/** 比較兩個集合的 reference 與排列是否一致。 */
const isSameReferenceOrder = <T,>(current: T[], next: T[]): boolean =>
{
    return current.length === next.length && current.every((item, index) => item === next[index]);
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
// #endregion
