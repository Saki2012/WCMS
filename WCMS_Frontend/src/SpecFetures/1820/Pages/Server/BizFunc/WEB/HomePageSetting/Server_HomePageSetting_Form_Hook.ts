import { CategoryAdapter } from "@/Features/Hooks/BizFunc/COMM/Category_Api";
import type {
    ServerFormActionContext,
    ServerFormBinding,
    ServerFormDefaultRawData,
    ServerFormReferenceContext,
    ServerFormReferenceResult,
    ServerFormTemplate,
} from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Hook";
import type {
    ColumnConfig,
    EditGridCellValue,
    EditGridCellValueChangeArgs,
    EditGridCellValueChangeResult,
    EditGridFileValue,
    GridRow,
    IEditGridView_Style,
    RowCell,
} from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid_Data";
import {
    buildEditGridCell,
    getEditGridCellValue,
    getEditGridStringCellValue,
    useEditGridBinding,
} from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid_Hook";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { SpecHomePage1820Adapter } from "@/SpecFetures/1820/Hooks/WEB/HomePage_Api";
import { DefaultLang, type Lang } from "@/SysCore/i18n/lang";
import type { ApiFormInitial, ServerFormActions } from "@/SysCore/Utils/API/APIAdapter";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import type { UseFetchDataResult } from "@/SysCore/Utils/API/FetchDataType";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import { LibAttachment } from "@/SysCore/Utils/Library/LibData";
import { useUploadFile } from "@/SysCore/Utils/UI_Hooks/useUploadFile";
import type { components } from "@/types/api";
import {
    PGID,
    SpecHomePage1820_BannerMediaFields,
    SpecHomePage1820_DetailFields,
    SpecHomePage1820_MarqueeFields,
    SpecHomePage1820_ResourceFields,
    SpecHomePage1820Fields,
} from "@/types/SchemaFields";
import { type SetStateAction, useCallback, useMemo } from "react";

// #region Property
type HomePageFormModel = components["schemas"]["SpecHomePage1820"];


type BannerMedia = components["schemas"]["SpecHomePage1820_BannerMedia"];

type HomePageDetail = components["schemas"]["SpecHomePage1820_Detail"];

type HomePageMarquee = components["schemas"]["SpecHomePage1820_Marquee"];

type HomePageResource = components["schemas"]["SpecHomePage1820_Resource"];

export type HomePageGridFileValue = EditGridFileValue & { internalId?: string; originalFileName?: string; };

type UploadFileHandler = ReturnType<typeof useUploadFile>["handleFileChange"];

type QueryListParam = components["schemas"]["QueryListParam"];

type HomePageImageRender = ColumnConfig["render"];

type HomePageIntroRender = ColumnConfig["render"];

type HomePageIntroEditRender = ColumnConfig["editRender"];

interface HomePageEditGridBaseOptions
{
    /** 表單資料 binding */
    binding: UseFetchFormDataResult<HomePageFormModel>;

    /** 目前語系 */
    lang: string;

    /** EditGrid 樣式 */
    style: IEditGridView_Style;

    /** 圖片欄位預覽 render */
    renderPicturePreview?: HomePageImageRender;
}

interface HomePageDetailEditGridOptions extends HomePageEditGridBaseOptions
{
    /** Section4 內文唯讀預覽 render */
    renderIntroPreview?: HomePageIntroRender;

    /** Section4 內文 TinyMCE 編輯 render */
    renderIntroEditor?: HomePageIntroEditRender;
}

export type HomePage1820SummaryRow = { InternalId: string; HomePageId: string; Lang: string; };

export type HomePage1820SummaryRawData = {
    supportLangs: Lang[];
    langInternalIdMap: Record<string, string>;
    langSummaryMap: Record<string, HomePage1820SummaryRow>;
};

export type HomePage1820FormRefs = { categoryMap: Record<string, string>; };

export type HomePage1820FormRawData = ServerFormDefaultRawData<HomePageFormModel, HomePage1820FormRefs>;

export type HomePage1820FormAdapter = { HomePage: ReturnType<typeof SpecHomePage1820Adapter>; Category: ReturnType<typeof CategoryAdapter>; };

export type HomePage1820FormActionsOpt = {
    /** 目前語系 */
    lang: Lang;

    /** Template 預設 Back，首頁語系內層表單不導頁 */
    onBackToList: () => void;

    /** 儲存成功後重新整理語系摘要，讓新增後可切回 edit mode */
    onAfterSave: () => Promise<void> | void;
};

export type HomePage1820SummaryAdapter = { HomePage: ReturnType<typeof SpecHomePage1820Adapter>; };
// #endregion

// #region Public
/** 建立 Spec1820 首頁空白 FormModel。 */
export const createEmptyHomePage1820FormModel = (lang: string): HomePageFormModel =>
{
    return {
        ...createEmptyModel(lang),
        _SpecHomePage1820_BannerMedia: [],
        _SpecHomePage1820_Detail: [],
        _SpecHomePage1820_Marquee: [],
        _SpecHomePage1820_Resource: [],
    };
};

/** 外層：只撈 lang + internalId，儲存與 toast 交給內層 Server_FormTemplate。 */
export const useHomePage1820SummaryFetchData = (opt: { supportLangs: Lang[]; }): UseFetchDataResult<HomePage1820SummaryRawData, HomePage1820SummaryAdapter> =>
{
    /** 建立 adapter */
    const adapter = useMemo<HomePage1820SummaryAdapter>(() =>
    {
        return { HomePage: SpecHomePage1820Adapter() };
    }, []);

    /** QueryList 只查摘要欄位 */
    const listCondition = useMemo<QueryListParam>(() =>
    {
        return {
            Fields: [SpecHomePage1820Fields.InternalId, SpecHomePage1820Fields.HomePageId, SpecHomePage1820Fields.Lang],
            Condition: "",
            PageNumber: 0,
            PageSize: 0,
        };
    }, []);

    /** 全搜摘要，避免 1820 外層自己處理 toast。 */
    const list = adapter.HomePage.hooks.useQueryList({ condition: listCondition, deps: [] });

    /** 語系摘要 map */
    const langSummaryMap = useMemo(() =>
    {
        return buildSummaryMap(opt.supportLangs, list.data);
    }, [list.data, opt.supportLangs]);

    /** 語系 internalId map */
    const langInternalIdMap = useMemo<Record<string, string>>(() =>
    {
        return Object.fromEntries(opt.supportLangs.map(lang => [lang, langSummaryMap[lang]?.InternalId ?? ""]));
    }, [langSummaryMap, opt.supportLangs]);

    const rawData = useMemo<HomePage1820SummaryRawData>(() =>
    {
        return { supportLangs: opt.supportLangs, langInternalIdMap, langSummaryMap };
    }, [langInternalIdMap, langSummaryMap, opt.supportLangs]);

    const refetchData = useCallback(async () =>
    {
        // 重抓摘要，讓新增後取得 InternalId 並回到 edit mode。
        await Promise.resolve(list.refetch());
    }, [list]);

    const refetchRefData = useCallback(async () =>
    {
        // 此 hook 無參考資料。
    }, []);

    return { adapter, rawData, isLoading: list.isLoading, errors: [list.errorText].filter((x): x is string => Boolean(x)), refetchData, refetchRefData };
};

/** 內層：單一語系用 internalId 組 Spec Form Template */
export const useHomePage1820LangFormTemplate = (
    opt: { theme: IBETheme; adapter: ReturnType<typeof SpecHomePage1820Adapter>; lang: Lang; internalId: string; onAfterSave: () => Promise<void> | void; },
): ServerFormTemplate<HomePageFormModel, HomePage1820FormAdapter, HomePage1820FormRefs, HomePage1820FormRawData, HomePage1820FormActionsOpt> =>
{
    const emptyData = useMemo(() => createEmptyHomePage1820FormModel(opt.lang), [opt.lang]);
    const actionsOpt = useMemo<HomePage1820FormActionsOpt>(() =>
    {
        return {
            lang: opt.lang,
            onBackToList: () =>
            {},
            onAfterSave: opt.onAfterSave,
        };
    }, [opt.lang, opt.onAfterSave]);

    return useMemo(() =>
    {
        return {
            featureKey: "SpecHomePage1820",
            theme: opt.theme,
            lang: opt.lang,
            internalId: opt.internalId,
            emptyData,
            actionsOpt,
            spec: {
                buildAdapter: () => buildHomePage1820FormAdapter(opt.adapter),
                selectDataAdapter: adapter => adapter.HomePage,
                buildTitle: buildHomePage1820FormTitle,
                buildInitialData: buildHomePage1820InitialData,
                useReferenceData: ctx => useHomePage1820ReferenceData({ ...ctx, lang: opt.lang }),
                buildSuccessActions: buildHomePage1820SuccessActions,
                buildActions: buildHomePage1820Actions,
                buildRawData: (ctx, baseRawData) => buildHomePage1820RawData(ctx, baseRawData, opt.lang),
            },
        };
    }, [actionsOpt, emptyData, opt.adapter, opt.internalId, opt.lang, opt.theme]);
};

/** 建立 Section1 Banner 的 EditGrid 綁定。 */
export const useHomePage1820BannerMediaEditGrid = (opt: HomePageEditGridBaseOptions) =>
{
    const uploadFile = useUploadFile({ enablePreview: false });
    const handleFileValueChange = useCallback(
        (args: EditGridCellValueChangeArgs) => uploadHomePageFileValue(args, uploadFile.handleFileChange, SpecHomePage1820_BannerMediaFields.BannerFileDescription),
        [uploadFile.handleFileChange],
    );
    const columns = useMemo(() => buildHomePageBannerMediaColumns(handleFileValueChange, opt.renderPicturePreview), [
        handleFileValueChange,
        opt.renderPicturePreview,
    ]);

    return useEditGridBinding<HomePageFormModel, BannerMedia>({
        binding: buildHomePageEditGridBinding(opt.binding),
        emptyData: createEmptyHomePage1820FormModel(opt.lang),
        collectionName: SpecHomePage1820Fields._SpecHomePage1820_BannerMedia,
        columns,
        getItemRowId: (item, index) => resolveHomePageRowId(item.RowId, index + 1),
        sortItems: sortHomePageRows,
        createItem: ctx => buildNewBannerMediaItem(ctx.data, ctx.nextRowId),
        toRow: (item, index) => buildBannerMediaGridRow(item, index, handleFileValueChange, opt.renderPicturePreview),
        toItem: (row, index, ctx) => toBannerMediaModel(ctx.visibleItems[index], row, index),
        editGridProps: buildHomePageGridProps("Section1 Banner", "Banner", "server-home-page-1820-banner-grid", 760, opt.style),
    });
};

/** 建立 Section4 Detail 的 EditGrid 綁定。 */
export const useHomePage1820DetailEditGrid = (opt: HomePageDetailEditGridOptions) =>
{
    const uploadFile = useUploadFile({ enablePreview: false });
    const handleMainFileChange = useCallback(
        (args: EditGridCellValueChangeArgs) => uploadHomePageFileValue(args, uploadFile.handleFileChange, SpecHomePage1820_DetailFields.MainPictureDescription),
        [uploadFile.handleFileChange],
    );
    const handleSubFileChange = useCallback(
        (args: EditGridCellValueChangeArgs) => uploadHomePageFileValue(args, uploadFile.handleFileChange, SpecHomePage1820_DetailFields.SubPictureDescription),
        [uploadFile.handleFileChange],
    );
    const columns = useMemo(
        () => buildHomePageDetailColumns(handleMainFileChange, handleSubFileChange, opt.renderPicturePreview, opt.renderIntroPreview, opt.renderIntroEditor),
        [handleMainFileChange, handleSubFileChange, opt.renderIntroEditor, opt.renderIntroPreview, opt.renderPicturePreview],
    );

    return useEditGridBinding<HomePageFormModel, HomePageDetail>({
        binding: buildHomePageEditGridBinding(opt.binding),
        emptyData: createEmptyHomePage1820FormModel(opt.lang),
        collectionName: SpecHomePage1820Fields._SpecHomePage1820_Detail,
        columns,
        getItemRowId: (item, index) => resolveHomePageRowId(item.RowId, index + 1),
        sortItems: sortHomePageRows,
        createItem: ctx => buildNewDetailItem(ctx.data, ctx.nextRowId),
        toRow: (item, index) => buildDetailGridRow(item, index, handleMainFileChange, handleSubFileChange, opt.renderPicturePreview, opt.renderIntroPreview, opt.renderIntroEditor),
        toItem: (row, index, ctx) => toDetailModel(ctx.visibleItems[index], row, index),
        editGridProps: buildHomePageGridProps("Section4 內容", "內容", "server-home-page-1820-detail-grid", 1880, opt.style),
    });
};

/** 建立 Section5 Marquee 的 EditGrid 綁定。 */
export const useHomePage1820MarqueeEditGrid = (opt: HomePageEditGridBaseOptions) =>
{
    const uploadFile = useUploadFile({ enablePreview: false });
    const handleFileValueChange = useCallback(
        (args: EditGridCellValueChangeArgs) => uploadHomePageFileValue(args, uploadFile.handleFileChange, SpecHomePage1820_MarqueeFields.PictureTitle),
        [uploadFile.handleFileChange],
    );
    const columns = useMemo(() => buildHomePageMarqueeColumns(handleFileValueChange, opt.renderPicturePreview), [
        handleFileValueChange,
        opt.renderPicturePreview,
    ]);

    return useEditGridBinding<HomePageFormModel, HomePageMarquee>({
        binding: buildHomePageEditGridBinding(opt.binding),
        emptyData: createEmptyHomePage1820FormModel(opt.lang),
        collectionName: SpecHomePage1820Fields._SpecHomePage1820_Marquee,
        columns,
        getItemRowId: (item, index) => resolveHomePageRowId(item.RowId, index + 1),
        sortItems: sortHomePageRows,
        createItem: ctx => buildNewMarqueeItem(ctx.data, ctx.nextRowId),
        toRow: (item, index) => buildMarqueeGridRow(item, index, handleFileValueChange, opt.renderPicturePreview),
        toItem: (row, index, ctx) => toMarqueeModel(ctx.visibleItems[index], row, index),
        editGridProps: buildHomePageGridProps("Section5 跑馬燈", "跑馬燈", "server-home-page-1820-marquee-grid", 920, opt.style),
    });
};

/** 建立 Section6 Resource 的 EditGrid 綁定。 */
export const useHomePage1820ResourceEditGrid = (opt: HomePageEditGridBaseOptions) =>
{
    const uploadFile = useUploadFile({ enablePreview: false });
    const handleFileValueChange = useCallback(
        (args: EditGridCellValueChangeArgs) => uploadHomePageFileValue(args, uploadFile.handleFileChange, SpecHomePage1820_ResourceFields.PicFileDescription),
        [uploadFile.handleFileChange],
    );
    const columns = useMemo(() => buildHomePageResourceColumns(handleFileValueChange, opt.renderPicturePreview), [
        handleFileValueChange,
        opt.renderPicturePreview,
    ]);

    return useEditGridBinding<HomePageFormModel, HomePageResource>({
        binding: buildHomePageEditGridBinding(opt.binding),
        emptyData: createEmptyHomePage1820FormModel(opt.lang),
        collectionName: SpecHomePage1820Fields._SpecHomePage1820_Resource,
        columns,
        getItemRowId: (item, index) => resolveHomePageRowId(item.RowId, index + 1),
        sortItems: sortHomePageRows,
        createItem: ctx => buildNewResourceItem(ctx.data, ctx.nextRowId),
        toRow: (item, index) => buildResourceGridRow(item, index, handleFileValueChange, opt.renderPicturePreview),
        toItem: (row, index, ctx) => toResourceModel(ctx.visibleItems[index], row, index),
        editGridProps: buildHomePageGridProps("Section6 資源連結", "資源連結", "server-home-page-1820-resource-grid", 1120, opt.style),
    });
};

/** 將任意 EditGrid value 正規化成首頁檔案值。 */
export const toHomePageFileCellValue = (value: EditGridCellValue): HomePageGridFileValue =>
{
    if (isHomePageFileValue(value)) return value;
    if (typeof value === "string") return buildHomePageFileCellValue(value);
    return buildEmptyHomePageFileCellValue();
};

/** 取得預覽網址。 */
export const getHomePageFilePreviewUrl = (fileId?: string | null): string | undefined =>
{
    const id = String(fileId ?? "").trim();
    return id ? FileManagementAPI.get_Server_Preview_Url(id) ?? undefined : undefined;
};
// #endregion

// #region Private
const normalizeLang = (lang?: string) =>
{
    // 統一語系 key
    return String(lang ?? "").trim().toLowerCase();
};

const resolveLangKey = (supportLangs: string[], lang?: string) =>
{
    // 依 supportLang 找實際語系 key
    const target = normalizeLang(lang);
    return supportLangs.find(a => normalizeLang(a) === target) ?? "";
};

const createEmptyModel = (lang: string): HomePageFormModel =>
{
    // 建立空主表
    return {
        Lang: lang,
        HomePageId: "",
        Section1Title_L: "",
        Section1Title_M: "",
        Section1Title_R: "",
        HeroText: "",
        HeroText_ViewMoreLink: "",
        AnnouncementTitle: "",
        AnnouncementSubTitle: "",
        AnnouncementCategoryIds: "",
        Announcement_ViewMoreLink: "",
        Resource_Title: "",
        Resource_SubTitle: "",
    };
};

/** 正規化首頁 FormModel 與所有明細集合。 */
const normalizeFormModel = (lang: string, data?: HomePageFormModel | null): HomePageFormModel =>
{
    const base = data ?? createEmptyHomePage1820FormModel(lang);
    return {
        ...createEmptyModel(lang),
        ...base,
        Lang: base.Lang || lang,
        _SpecHomePage1820_BannerMedia: [...(base._SpecHomePage1820_BannerMedia ?? [])],
        _SpecHomePage1820_Detail: [...(base._SpecHomePage1820_Detail ?? [])],
        _SpecHomePage1820_Marquee: [...(base._SpecHomePage1820_Marquee ?? [])],
        _SpecHomePage1820_Resource: [...(base._SpecHomePage1820_Resource ?? [])],
    };
};

const normalizeText = (value?: string | null) =>
{
    // 統一字串空值
    return String(value ?? "").trim();
};

/** 將空白關聯值轉為 null，符合新版 FormModel 關聯欄位。 */
const normalizeRelationId = (value?: string | null): string | null =>
{
    const text = normalizeText(value);
    return text || null;
};

/** 儲存前補齊語系、排序值與 FormModel 明細集合。 */
const sanitizeFormModelBeforeSave = (lang: string, data: HomePageFormModel): HomePageFormModel =>
{
    const formModel = normalizeFormModel(lang, data);
    return {
        ...formModel,
        Lang: formModel.Lang || lang,
        HomePageId: normalizeText(formModel.HomePageId),
        _SpecHomePage1820_BannerMedia: normalizeBannerMediaForSave(formModel._SpecHomePage1820_BannerMedia ?? []),
        _SpecHomePage1820_Detail: normalizeDetailForSave(formModel._SpecHomePage1820_Detail ?? []),
        _SpecHomePage1820_Marquee: normalizeMarqueeForSave(formModel._SpecHomePage1820_Marquee ?? []),
        _SpecHomePage1820_Resource: normalizeResourceForSave(formModel._SpecHomePage1820_Resource ?? []),
    };
};

/** 正規化 Banner 明細排序與檔案關聯。 */
const normalizeBannerMediaForSave = (rows: BannerMedia[]): BannerMedia[] =>
{
    return rows.map((row, index) => ({ ...row, RowNo: index + 1, BannerFileId: normalizeRelationId(row.BannerFileId) }));
};

/** 正規化 Section4 明細排序與檔案關聯。 */
const normalizeDetailForSave = (rows: HomePageDetail[]): HomePageDetail[] =>
{
    return rows.map((row, index) => ({
        ...row,
        RowNo: index + 1,
        MainPictureId: normalizeRelationId(row.MainPictureId),
        SubPictureId: normalizeRelationId(row.SubPictureId),
    }));
};

/** 正規化跑馬燈明細排序與檔案關聯。 */
const normalizeMarqueeForSave = (rows: HomePageMarquee[]): HomePageMarquee[] =>
{
    return rows.map((row, index) => ({ ...row, RowNo: index + 1, PictureId: normalizeRelationId(row.PictureId) }));
};

/** 正規化資源連結明細排序與檔案關聯。 */
const normalizeResourceForSave = (rows: HomePageResource[]): HomePageResource[] =>
{
    return rows.map((row, index) => ({ ...row, RowNo: index + 1, PicFileId: normalizeRelationId(row.PicFileId) }));
};

const buildInitialSummaryMap = (supportLangs: string[]) =>
{
    // 建立空摘要 map
    return Object.fromEntries(supportLangs.map(lang => [lang, { InternalId: "", HomePageId: "", Lang: lang }])) as Record<string, HomePage1820SummaryRow>;
};

const buildSummaryMap = (supportLangs: string[], list?: HomePageFormModel[] | null) =>
{
    // 由 list 建立 lang -> summary
    const next = buildInitialSummaryMap(supportLangs);

    for (const item of list ?? [])
    {
        const key = resolveLangKey(supportLangs, item.Lang ?? DefaultLang);
        if (!key) continue;
        next[key] = { InternalId: item.InternalId ?? "", HomePageId: item.HomePageId ?? "", Lang: item.Lang ?? key };
    }

    return next;
};

const resolveNextFormData = (lang: string, prev: HomePageFormModel, next: SetStateAction<HomePageFormModel>) =>
{
    // 處理 setFormData 的 function / object 兩種寫法
    const current = normalizeFormModel(lang, prev);
    if (typeof next === "function") return (next as (prevState: HomePageFormModel) => HomePageFormModel)(current);
    return next;
};

/** 建立 HomePage1820 Form 會使用到的 Adapter 群組 */
const buildHomePage1820FormAdapter = (adapter: ReturnType<typeof SpecHomePage1820Adapter>): HomePage1820FormAdapter =>
{
    return { HomePage: adapter, Category: CategoryAdapter() };
};

/** 建立 HomePage1820 內層語系表單標題 */
const buildHomePage1820FormTitle = (): string =>
{
    return "首頁設定";
};

/** 建立新增模式的 initial data，避免新增時查詢 __new__ */
const buildHomePage1820InitialData = (ctx: { mode: "new" | "edit"; emptyData: HomePageFormModel; }): ApiFormInitial<HomePageFormModel> | undefined =>
{
    if (ctx.mode !== "new") return undefined;
    return { data: { args: "__new__", apiRes: { IsSuccess: true, Data: ctx.emptyData, SysMessage: [] } } };
};

/** 取得 HomePage1820 內層語系表單參照資料 */
const useHomePage1820ReferenceData = (ctx: { adapter: HomePage1820FormAdapter; lang: Lang; }): ServerFormReferenceResult<HomePage1820FormRefs> =>
{
    const category = ctx.adapter.Category.hooks.useMapByProgId({ progId: PGID.Announcement, lang: ctx.lang });

    return useMemo(() =>
    {
        return {
            refs: { categoryMap: category.map ?? {} },
            isLoading: Boolean(category.isLoading),
            errors: [category.errorText],
            refetchRefData: async () =>
            {
                await Promise.resolve(category.refetch());
            },
        };
    }, [category.errorText, category.isLoading, category.map, category.refetch]);
};

/** 建立 HomePage1820 儲存成功後的摘要重抓動作。 */
const buildHomePage1820SuccessActions = (
    ctx: ServerFormReferenceContext<HomePageFormModel, HomePage1820FormAdapter, HomePage1820FormActionsOpt, HomePage1820FormRefs>,
) =>
{
    return { create: ctx.actionsOpt.onAfterSave, update: ctx.actionsOpt.onAfterSave };
};

/** 覆寫 HomePage1820 儲存行為，讓 Template Toolbar 儲存前先正規化語系與子表鍵值。 */
const buildHomePage1820Actions = (
    ctx: ServerFormActionContext<HomePageFormModel, HomePage1820FormAdapter, HomePage1820FormRefs, HomePage1820FormRawData, HomePage1820FormActionsOpt>,
    baseActions: ServerFormActions,
): ServerFormActions =>
{
    const save = async () =>
    {
        // 儲存前統一補齊 1820 語系與子表關聯鍵。
        const payload = sanitizeFormModelBeforeSave(ctx.actionsOpt.lang, ctx.binding.data);
        if (ctx.mode === "new") await ctx.serverActions.createAsync(payload);
        else await ctx.serverActions.updateAsync(ctx.internalId, payload);
    };

    return {
        ...baseActions,
        Save: save,
        Delete: async () =>
        {},
        Back: ctx.actionsOpt.onBackToList,
        IsSaving: ctx.serverActions.isSaving,
    };
};

/** 建立 HomePage1820 內層 rawData，並保留語系正規化 setFormData 行為 */
const buildHomePage1820RawData = (
    ctx: { binding: ServerFormBinding<HomePageFormModel>; refs: HomePage1820FormRefs; actions: ServerFormActions; },
    baseRawData: ServerFormDefaultRawData<HomePageFormModel, HomePage1820FormRefs>,
    lang: Lang,
): HomePage1820FormRawData =>
{
    const langKey = normalizeLang(lang);
    const formData: ServerFormBinding<HomePageFormModel> = {
        ...ctx.binding,
        data: normalizeFormModel(langKey, ctx.binding.data),
        getData: () => normalizeFormModel(langKey, ctx.binding.getData()),
        setFormData: next => ctx.binding.setFormData(prev => resolveNextFormData(langKey, prev, next)),
    };
    return { ...baseRawData, formData, actions: ctx.actions };
};

/** 建立 EditGrid 可用的表單 binding，避免 Component 直接處理 rows 同步。 */
const buildHomePageEditGridBinding = (binding: UseFetchFormDataResult<HomePageFormModel>) =>
{
    return { data: binding.data, setFormData: binding.setFormData };
};

/** 建立首頁子資料 Grid 的共用設定。 */
const buildHomePageGridProps = (title: string, itemName: string, storageKey: string, minTableWidth: number, style: IEditGridView_Style) =>
{
    return {
        title,
        ariaLabel: `${title}清單`,
        style,
        storageKey,
        minTableWidth,
        maxVisibleRows: 5,
        canAdd: true,
        canEdit: true,
        canDelete: true,
        canDrag: true,
        showRowNo: true,
        showOperationGuide: false,
        actionColumnTitle: "排序 / 操作",
        addButtonText: `新增${itemName}`,
        emptyText: `目前沒有${itemName}`,
    };
};

/** 依 RowNo、RowId 排序首頁子資料。 */
const sortHomePageRows = <TItem extends { RowNo?: number | null; RowId?: number | null; }>(items: TItem[]): TItem[] =>
{
    return [...items].sort((a, b) => Number(a.RowNo ?? a.RowId ?? 0) - Number(b.RowNo ?? b.RowId ?? 0));
};

/** 取得主表 HomePageId，新增子資料時優先綁定主表。 */
const getHomePageId = (data: HomePageFormModel): string =>
{
    return normalizeText(data.HomePageId);
};

/** 建立 Banner 欄位設定。 */
const buildHomePageBannerMediaColumns = (
    onFileChange: (args: EditGridCellValueChangeArgs) => Promise<EditGridCellValueChangeResult>,
    renderPicturePreview?: HomePageImageRender,
): ColumnConfig[] =>
{
    return [
        buildTextColumn(SpecHomePage1820_BannerMediaFields.BannerFileDescription, "Banner 說明", 260, 200),
        buildFileColumn(SpecHomePage1820_BannerMediaFields.BannerFileId, "Banner 圖片", 460, onFileChange, renderPicturePreview),
    ];
};

/** 建立 Section4 Detail 欄位設定。 */
const buildHomePageDetailColumns = (
    onMainFileChange: (args: EditGridCellValueChangeArgs) => Promise<EditGridCellValueChangeResult>,
    onSubFileChange: (args: EditGridCellValueChangeArgs) => Promise<EditGridCellValueChangeResult>,
    renderPicturePreview?: HomePageImageRender,
    renderIntroPreview?: HomePageIntroRender,
    renderIntroEditor?: HomePageIntroEditRender,
): ColumnConfig[] =>
{
    return [
        buildTextColumn(SpecHomePage1820_DetailFields.Title, "標題", 180, 200),
        buildTextColumn(SpecHomePage1820_DetailFields.SubTitle, "副標題", 180, 200),
        buildFileColumn(SpecHomePage1820_DetailFields.MainPictureId, "主視覺圖片", 320, onMainFileChange, renderPicturePreview),
        buildTextColumn(SpecHomePage1820_DetailFields.MainPictureDescription, "主視覺說明", 180, 200),
        buildFileColumn(SpecHomePage1820_DetailFields.SubPictureId, "延伸圖片", 320, onSubFileChange, renderPicturePreview),
        buildTextColumn(SpecHomePage1820_DetailFields.SubPictureDescription, "延伸圖片說明", 180, 200),
        buildTinyMceColumn(SpecHomePage1820_DetailFields.Intro, "內文說明", 520, renderIntroPreview, renderIntroEditor),
        buildTextColumn(SpecHomePage1820_DetailFields.MainLinkTitle, "主連結標題", 180, 120),
        buildTextColumn(SpecHomePage1820_DetailFields.MainLink, "主連結", 240, 500),
        buildTextColumn(SpecHomePage1820_DetailFields.SubLinkTitle1, "次連結標題1", 180, 120),
        buildTextColumn(SpecHomePage1820_DetailFields.SubLink1, "次連結1", 240, 500),
        buildTextColumn(SpecHomePage1820_DetailFields.SubLinkTitle2, "次連結標題2", 180, 120),
        buildTextColumn(SpecHomePage1820_DetailFields.SubLink2, "次連結2", 240, 500),
        buildTextColumn(SpecHomePage1820_DetailFields.SubLinkTitle3, "次連結標題3", 180, 120),
        buildTextColumn(SpecHomePage1820_DetailFields.SubLink3, "次連結3", 240, 500),
    ];
};

/** 建立 Marquee 欄位設定。 */
const buildHomePageMarqueeColumns = (
    onFileChange: (args: EditGridCellValueChangeArgs) => Promise<EditGridCellValueChangeResult>,
    renderPicturePreview?: HomePageImageRender,
): ColumnConfig[] =>
{
    return [
        buildTextColumn(SpecHomePage1820_MarqueeFields.PictureTitle, "標題", 260, 200),
        buildFileColumn(SpecHomePage1820_MarqueeFields.PictureId, "圖片", 460, onFileChange, renderPicturePreview),
        { key: SpecHomePage1820_MarqueeFields.IsHide, title: "隱藏", width: 120, inputType: "checkboxSingle", editable: true },
    ];
};

/** 建立 Resource 欄位設定。 */
const buildHomePageResourceColumns = (
    onFileChange: (args: EditGridCellValueChangeArgs) => Promise<EditGridCellValueChangeResult>,
    renderPicturePreview?: HomePageImageRender,
): ColumnConfig[] =>
{
    return [
        buildTextColumn(SpecHomePage1820_ResourceFields.PicTitle, "標題", 200, 200),
        buildTextColumn(SpecHomePage1820_ResourceFields.PicSubTitle, "副標題", 200, 200),
        buildFileColumn(SpecHomePage1820_ResourceFields.PicFileId, "圖片", 420, onFileChange, renderPicturePreview),
        buildTextColumn(SpecHomePage1820_ResourceFields.PicFileDescription, "圖片說明", 180, 200),
        buildTextColumn(SpecHomePage1820_ResourceFields.Link, "連結", 280, 500),
    ];
};

/** 建立文字欄位設定。 */
const buildTextColumn = (key: string, title: string, width: number, maxLength: number): ColumnConfig =>
{
    return { key, title, width, inputType: "text", editable: true, maxLength };
};

/** 建立 TinyMCE 欄位設定。 */
const buildTinyMceColumn = (key: string, title: string, width: number, render?: HomePageIntroRender, editRender?: HomePageIntroEditRender): ColumnConfig =>
{
    return { key, title, width, inputType: "textarea", editable: true, render, editRender };
};

/** 建立檔案欄位設定。 */
const buildFileColumn = (
    key: string,
    title: string,
    width: number,
    onValueChange: (args: EditGridCellValueChangeArgs) => Promise<EditGridCellValueChangeResult>,
    render?: HomePageImageRender,
): ColumnConfig =>
{
    return {
        key,
        title,
        width,
        inputType: "file",
        editable: true,
        accept: "image/*",
        multiple: false,
        maxFileCount: 1,
        maxFileSizeMB: 10,
        render,
        onValueChange,
    };
};

/** 建立 Banner 新增資料。 */
const buildNewBannerMediaItem = (data: HomePageFormModel, rowId: number): BannerMedia =>
{
    return { HomePageId: getHomePageId(data), RowId: rowId, RowNo: rowId, BannerFileId: null, BannerFileDescription: "" };
};

/** 建立 Detail 新增資料。 */
const buildNewDetailItem = (data: HomePageFormModel, rowId: number): HomePageDetail =>
{
    return {
        HomePageId: getHomePageId(data),
        RowId: rowId,
        RowNo: rowId,
        Title: "",
        SubTitle: "",
        MainPictureId: null,
        MainPictureDescription: "",
        SubPictureId: null,
        SubPictureDescription: "",
        Intro: "",
        MainLinkTitle: "",
        MainLink: "",
        SubLinkTitle1: "",
        SubLink1: "",
        SubLinkTitle2: "",
        SubLink2: "",
        SubLinkTitle3: "",
        SubLink3: "",
    };
};

/** 建立 Marquee 新增資料。 */
const buildNewMarqueeItem = (data: HomePageFormModel, rowId: number): HomePageMarquee =>
{
    return { HomePageId: getHomePageId(data), RowId: rowId, RowNo: rowId, PictureId: null, PictureTitle: "", IsHide: false };
};

/** 建立 Resource 新增資料。 */
const buildNewResourceItem = (data: HomePageFormModel, rowId: number): HomePageResource =>
{
    return { HomePageId: getHomePageId(data), RowId: rowId, RowNo: rowId, PicTitle: "", PicSubTitle: "", PicFileId: null, PicFileDescription: "", Link: "" };
};

/** 將 Banner FormModel 明細轉成 GridRow。 */
const buildBannerMediaGridRow = (
    item: BannerMedia,
    index: number,
    onFileChange: (args: EditGridCellValueChangeArgs) => Promise<EditGridCellValueChangeResult>,
    renderPicturePreview?: HomePageImageRender,
): GridRow =>
{
    const rowId = resolveHomePageRowId(item.RowId, index + 1);
    return {
        keyId: buildHomePageRowKey("banner", item.HomePageId, rowId),
        rowId,
        RowId: rowId,
        RowNo: Number(item.RowNo ?? index + 1),
        cells: buildBannerMediaCells(item, onFileChange, renderPicturePreview),
    };
};

/** 將 Detail FormModel 明細轉成 GridRow。 */
const buildDetailGridRow = (
    item: HomePageDetail,
    index: number,
    onMainFileChange: (args: EditGridCellValueChangeArgs) => Promise<EditGridCellValueChangeResult>,
    onSubFileChange: (args: EditGridCellValueChangeArgs) => Promise<EditGridCellValueChangeResult>,
    renderPicturePreview?: HomePageImageRender,
    renderIntroPreview?: HomePageIntroRender,
    renderIntroEditor?: HomePageIntroEditRender,
): GridRow =>
{
    const rowId = resolveHomePageRowId(item.RowId, index + 1);
    return {
        keyId: buildHomePageRowKey("detail", item.HomePageId, rowId),
        rowId,
        RowId: rowId,
        RowNo: Number(item.RowNo ?? index + 1),
        cells: buildDetailCells(item, onMainFileChange, onSubFileChange, renderPicturePreview, renderIntroPreview, renderIntroEditor),
    };
};

/** 將 Marquee FormModel 明細轉成 GridRow。 */
const buildMarqueeGridRow = (
    item: HomePageMarquee,
    index: number,
    onFileChange: (args: EditGridCellValueChangeArgs) => Promise<EditGridCellValueChangeResult>,
    renderPicturePreview?: HomePageImageRender,
): GridRow =>
{
    const rowId = resolveHomePageRowId(item.RowId, index + 1);
    return {
        keyId: buildHomePageRowKey("marquee", item.HomePageId, rowId),
        rowId,
        RowId: rowId,
        RowNo: Number(item.RowNo ?? index + 1),
        cells: buildMarqueeCells(item, onFileChange, renderPicturePreview),
    };
};

/** 將 Resource FormModel 明細轉成 GridRow。 */
const buildResourceGridRow = (
    item: HomePageResource,
    index: number,
    onFileChange: (args: EditGridCellValueChangeArgs) => Promise<EditGridCellValueChangeResult>,
    renderPicturePreview?: HomePageImageRender,
): GridRow =>
{
    const rowId = resolveHomePageRowId(item.RowId, index + 1);
    return {
        keyId: buildHomePageRowKey("resource", item.HomePageId, rowId),
        rowId,
        RowId: rowId,
        RowNo: Number(item.RowNo ?? index + 1),
        cells: buildResourceCells(item, onFileChange, renderPicturePreview),
    };
};

/** 建立 Banner cells。 */
const buildBannerMediaCells = (
    item: BannerMedia,
    onFileChange: (args: EditGridCellValueChangeArgs) => Promise<EditGridCellValueChangeResult>,
    renderPicturePreview?: HomePageImageRender,
): RowCell[] =>
{
    return [
        buildEditGridCell(SpecHomePage1820_BannerMediaFields.BannerFileDescription, "Banner 說明", item.BannerFileDescription ?? "", {
            inputType: "text",
            editable: true,
            maxLength: 200,
        }),
        buildEditGridCell(
            SpecHomePage1820_BannerMediaFields.BannerFileId,
            "Banner 圖片",
            buildHomePageFileCellValue(item.BannerFileId, getFileModelName(item.BannerFile), item.BannerFileDescription),
            { inputType: "file", editable: true, accept: "image/*", render: renderPicturePreview, onValueChange: onFileChange },
        ),
    ];
};

/** 建立 Detail cells。 */
const buildDetailCells = (
    item: HomePageDetail,
    onMainFileChange: (args: EditGridCellValueChangeArgs) => Promise<EditGridCellValueChangeResult>,
    onSubFileChange: (args: EditGridCellValueChangeArgs) => Promise<EditGridCellValueChangeResult>,
    renderPicturePreview?: HomePageImageRender,
    renderIntroPreview?: HomePageIntroRender,
    renderIntroEditor?: HomePageIntroEditRender,
): RowCell[] =>
{
    return [
        buildEditGridCell(SpecHomePage1820_DetailFields.Title, "標題", item.Title ?? "", { inputType: "text", editable: true, maxLength: 200 }),
        buildEditGridCell(SpecHomePage1820_DetailFields.SubTitle, "副標題", item.SubTitle ?? "", { inputType: "text", editable: true, maxLength: 200 }),
        buildEditGridCell(
            SpecHomePage1820_DetailFields.MainPictureId,
            "主視覺圖片",
            buildHomePageFileCellValue(item.MainPictureId, getFileModelName(item.MainPicture), item.MainPictureDescription),
            { inputType: "file", editable: true, accept: "image/*", render: renderPicturePreview, onValueChange: onMainFileChange },
        ),
        buildEditGridCell(SpecHomePage1820_DetailFields.MainPictureDescription, "主視覺說明", item.MainPictureDescription ?? "", {
            inputType: "text",
            editable: true,
            maxLength: 200,
        }),
        buildEditGridCell(
            SpecHomePage1820_DetailFields.SubPictureId,
            "延伸圖片",
            buildHomePageFileCellValue(item.SubPictureId, getFileModelName(item.SubPicture), item.SubPictureDescription),
            { inputType: "file", editable: true, accept: "image/*", render: renderPicturePreview, onValueChange: onSubFileChange },
        ),
        buildEditGridCell(SpecHomePage1820_DetailFields.SubPictureDescription, "延伸圖片說明", item.SubPictureDescription ?? "", {
            inputType: "text",
            editable: true,
            maxLength: 200,
        }),
        buildEditGridCell(SpecHomePage1820_DetailFields.Intro, "內文說明", item.Intro ?? "", {
            inputType: "textarea",
            editable: true,
            render: renderIntroPreview,
            editRender: renderIntroEditor,
        }),
        buildEditGridCell(SpecHomePage1820_DetailFields.MainLinkTitle, "主連結標題", item.MainLinkTitle ?? "", {
            inputType: "text",
            editable: true,
            maxLength: 120,
        }),
        buildEditGridCell(SpecHomePage1820_DetailFields.MainLink, "主連結", item.MainLink ?? "", { inputType: "text", editable: true, maxLength: 500 }),
        buildEditGridCell(SpecHomePage1820_DetailFields.SubLinkTitle1, "次連結標題1", item.SubLinkTitle1 ?? "", {
            inputType: "text",
            editable: true,
            maxLength: 120,
        }),
        buildEditGridCell(SpecHomePage1820_DetailFields.SubLink1, "次連結1", item.SubLink1 ?? "", { inputType: "text", editable: true, maxLength: 500 }),
        buildEditGridCell(SpecHomePage1820_DetailFields.SubLinkTitle2, "次連結標題2", item.SubLinkTitle2 ?? "", {
            inputType: "text",
            editable: true,
            maxLength: 120,
        }),
        buildEditGridCell(SpecHomePage1820_DetailFields.SubLink2, "次連結2", item.SubLink2 ?? "", { inputType: "text", editable: true, maxLength: 500 }),
        buildEditGridCell(SpecHomePage1820_DetailFields.SubLinkTitle3, "次連結標題3", item.SubLinkTitle3 ?? "", {
            inputType: "text",
            editable: true,
            maxLength: 120,
        }),
        buildEditGridCell(SpecHomePage1820_DetailFields.SubLink3, "次連結3", item.SubLink3 ?? "", { inputType: "text", editable: true, maxLength: 500 }),
    ];
};

/** 建立 Marquee cells。 */
const buildMarqueeCells = (
    item: HomePageMarquee,
    onFileChange: (args: EditGridCellValueChangeArgs) => Promise<EditGridCellValueChangeResult>,
    renderPicturePreview?: HomePageImageRender,
): RowCell[] =>
{
    return [
        buildEditGridCell(SpecHomePage1820_MarqueeFields.PictureTitle, "標題", item.PictureTitle ?? "", { inputType: "text", editable: true, maxLength: 200 }),
        buildEditGridCell(
            SpecHomePage1820_MarqueeFields.PictureId,
            "圖片",
            buildHomePageFileCellValue(item.PictureId, getFileModelName(item.Picture), item.PictureTitle),
            { inputType: "file", editable: true, accept: "image/*", render: renderPicturePreview, onValueChange: onFileChange },
        ),
        buildEditGridCell(SpecHomePage1820_MarqueeFields.IsHide, "隱藏", Boolean(item.IsHide), { inputType: "checkboxSingle", editable: true }),
    ];
};

/** 建立 Resource cells。 */
const buildResourceCells = (
    item: HomePageResource,
    onFileChange: (args: EditGridCellValueChangeArgs) => Promise<EditGridCellValueChangeResult>,
    renderPicturePreview?: HomePageImageRender,
): RowCell[] =>
{
    return [
        buildEditGridCell(SpecHomePage1820_ResourceFields.PicTitle, "標題", item.PicTitle ?? "", { inputType: "text", editable: true, maxLength: 200 }),
        buildEditGridCell(SpecHomePage1820_ResourceFields.PicSubTitle, "副標題", item.PicSubTitle ?? "", { inputType: "text", editable: true, maxLength: 200 }),
        buildEditGridCell(
            SpecHomePage1820_ResourceFields.PicFileId,
            "圖片",
            buildHomePageFileCellValue(item.PicFileId, getFileModelName(item.PicFile), item.PicFileDescription),
            { inputType: "file", editable: true, accept: "image/*", render: renderPicturePreview, onValueChange: onFileChange },
        ),
        buildEditGridCell(SpecHomePage1820_ResourceFields.PicFileDescription, "圖片說明", item.PicFileDescription ?? "", {
            inputType: "text",
            editable: true,
            maxLength: 200,
        }),
        buildEditGridCell(SpecHomePage1820_ResourceFields.Link, "連結", item.Link ?? "", { inputType: "text", editable: true, maxLength: 500 }),
    ];
};

/** 將 Banner GridRow 轉回 FormModel 明細。 */
const toBannerMediaModel = (source: BannerMedia | undefined, row: GridRow, index: number): BannerMedia =>
{
    const file = toHomePageFileCellValue(getEditGridCellValue(row, SpecHomePage1820_BannerMediaFields.BannerFileId));
    return {
        ...source,
        RowId: getGridRowId(row, index),
        RowNo: index + 1,
        BannerFileId: normalizeRelationId(file.internalId),
        BannerFileDescription: getEditGridStringCellValue(row, SpecHomePage1820_BannerMediaFields.BannerFileDescription),
    };
};

/** 將 Detail GridRow 轉回 FormModel 明細。 */
const toDetailModel = (source: HomePageDetail | undefined, row: GridRow, index: number): HomePageDetail =>
{
    const mainFile = toHomePageFileCellValue(getEditGridCellValue(row, SpecHomePage1820_DetailFields.MainPictureId));
    const subFile = toHomePageFileCellValue(getEditGridCellValue(row, SpecHomePage1820_DetailFields.SubPictureId));
    return {
        ...source,
        RowId: getGridRowId(row, index),
        RowNo: index + 1,
        Title: getEditGridStringCellValue(row, SpecHomePage1820_DetailFields.Title),
        SubTitle: getEditGridStringCellValue(row, SpecHomePage1820_DetailFields.SubTitle),
        MainPictureId: normalizeRelationId(mainFile.internalId),
        MainPictureDescription: getEditGridStringCellValue(row, SpecHomePage1820_DetailFields.MainPictureDescription),
        SubPictureId: normalizeRelationId(subFile.internalId),
        SubPictureDescription: getEditGridStringCellValue(row, SpecHomePage1820_DetailFields.SubPictureDescription),
        Intro: getEditGridStringCellValue(row, SpecHomePage1820_DetailFields.Intro),
        MainLinkTitle: getEditGridStringCellValue(row, SpecHomePage1820_DetailFields.MainLinkTitle),
        MainLink: getEditGridStringCellValue(row, SpecHomePage1820_DetailFields.MainLink),
        SubLinkTitle1: getEditGridStringCellValue(row, SpecHomePage1820_DetailFields.SubLinkTitle1),
        SubLink1: getEditGridStringCellValue(row, SpecHomePage1820_DetailFields.SubLink1),
        SubLinkTitle2: getEditGridStringCellValue(row, SpecHomePage1820_DetailFields.SubLinkTitle2),
        SubLink2: getEditGridStringCellValue(row, SpecHomePage1820_DetailFields.SubLink2),
        SubLinkTitle3: getEditGridStringCellValue(row, SpecHomePage1820_DetailFields.SubLinkTitle3),
        SubLink3: getEditGridStringCellValue(row, SpecHomePage1820_DetailFields.SubLink3),
    };
};

/** 將 Marquee GridRow 轉回 FormModel 明細。 */
const toMarqueeModel = (source: HomePageMarquee | undefined, row: GridRow, index: number): HomePageMarquee =>
{
    const file = toHomePageFileCellValue(getEditGridCellValue(row, SpecHomePage1820_MarqueeFields.PictureId));
    return {
        ...source,
        RowId: getGridRowId(row, index),
        RowNo: index + 1,
        PictureId: normalizeRelationId(file.internalId),
        PictureTitle: getEditGridStringCellValue(row, SpecHomePage1820_MarqueeFields.PictureTitle),
        IsHide: Boolean(getEditGridCellValue(row, SpecHomePage1820_MarqueeFields.IsHide)),
    };
};

/** 將 Resource GridRow 轉回 FormModel 明細。 */
const toResourceModel = (source: HomePageResource | undefined, row: GridRow, index: number): HomePageResource =>
{
    const file = toHomePageFileCellValue(getEditGridCellValue(row, SpecHomePage1820_ResourceFields.PicFileId));
    return {
        ...source,
        RowId: getGridRowId(row, index),
        RowNo: index + 1,
        PicTitle: getEditGridStringCellValue(row, SpecHomePage1820_ResourceFields.PicTitle),
        PicSubTitle: getEditGridStringCellValue(row, SpecHomePage1820_ResourceFields.PicSubTitle),
        PicFileId: normalizeRelationId(file.internalId),
        PicFileDescription: getEditGridStringCellValue(row, SpecHomePage1820_ResourceFields.PicFileDescription),
        Link: getEditGridStringCellValue(row, SpecHomePage1820_ResourceFields.Link),
    };
};

/** 取得 Grid 實際 RowId，保留既有資料鍵值。 */
const getGridRowId = (row: GridRow, index: number): number =>
{
    return resolveHomePageRowId(row.RowId ?? row.rowId ?? row.rowid, index + 1);
};

/** 建立首頁子資料 row key。 */
const buildHomePageRowKey = (section: string, homePageId?: string | null, rowId?: number | null): string =>
{
    return `home-page-1820-${section}-${homePageId ?? "new"}-${rowId ?? 0}`;
};

/** 上傳首頁圖片並回寫檔案欄位與說明欄位。 */
const uploadHomePageFileValue = async (
    args: EditGridCellValueChangeArgs,
    handleFileChange: UploadFileHandler,
    descriptionField: string,
): Promise<EditGridCellValueChangeResult> =>
{
    const current = toHomePageFileCellValue(args.value);
    const selectedFile = getSelectedHomePageFile(args.nextValue);
    if (!selectedFile?.file) return { value: buildEmptyHomePageFileCellValue(), rowValues: { [descriptionField]: "" } };

    let uploadedValue: HomePageGridFileValue = current;
    const originalName = getHomePageSelectedFileName(selectedFile);

    await handleFileChange([selectedFile.file], (internalId, uploadedName) =>
    {
        uploadedValue = buildUploadedHomePageFileCellValue(internalId, uploadedName || originalName);
    });

    return buildHomePageUploadChangeResult(uploadedValue, descriptionField);
};

/** 建立首頁圖片上傳後的欄位更新結果。 */
const buildHomePageUploadChangeResult = (file: HomePageGridFileValue, descriptionField: string): EditGridCellValueChangeResult =>
{
    return { value: file, rowValues: { [descriptionField]: LibAttachment.getDisplayFileNameWithoutExtension(file.originalFileName ?? file.fileName) } };
};

/** 建立既有檔案的 EditGrid value。 */
const buildHomePageFileCellValue = (internalId?: string | null, originalName?: string | null, description?: string | null): HomePageGridFileValue =>
{
    const id = String(internalId ?? "").trim();
    const name = String(originalName || description || id).trim();
    return {
        internalId: id,
        fileName: name,
        originalFileName: String(originalName ?? ""),
        url: getHomePageFilePreviewUrl(id),
        downloadUrl: getHomePageFileDownloadUrl(id),
    };
};

/** 建立上傳後的 EditGrid 檔案值。 */
const buildUploadedHomePageFileCellValue = (internalId: string, originalName?: string): HomePageGridFileValue =>
{
    return {
        internalId,
        fileName: originalName ?? internalId,
        originalFileName: originalName ?? "",
        url: getHomePageFilePreviewUrl(internalId),
        downloadUrl: getHomePageFileDownloadUrl(internalId),
    };
};

/** 建立空檔案值。 */
const buildEmptyHomePageFileCellValue = (): HomePageGridFileValue =>
{
    return { internalId: "", fileName: "", originalFileName: "" };
};

/** 判斷是否為首頁檔案值。 */
const isHomePageFileValue = (value: EditGridCellValue): value is HomePageGridFileValue =>
{
    return typeof value === "object" && value !== null && !Array.isArray(value) && "fileName" in value;
};

/** 取得剛選取的檔案。 */
const getSelectedHomePageFile = (value: EditGridCellValue): HomePageGridFileValue | null =>
{
    if (!isHomePageFileValue(value)) return null;
    return value;
};

/** 取得上傳前原始檔名。 */
const getHomePageSelectedFileName = (file: HomePageGridFileValue): string =>
{
    return String(file.file?.name || file.fileName || "").trim();
};

/** 取得 FormModel 檔案物件中的原始檔名。 */
const getFileModelName = (file?: { FileName?: string | null; fileName?: string | null; } | null): string =>
{
    return String(file?.FileName ?? file?.fileName ?? "").trim();
};

/** 取得下載網址。 */
const getHomePageFileDownloadUrl = (fileId?: string | null): string | undefined =>
{
    const id = String(fileId ?? "").trim();
    return id ? `/Service/FileManagement/Server_Download/${encodeURIComponent(id)}` : undefined;
};

/** 將 RowId 轉為有效正整數，避免空值造成 EditGrid key 不穩定。 */
const resolveHomePageRowId = (value: unknown, fallback: number): number =>
{
    const rowId = Number(value);
    return Number.isFinite(rowId) && rowId > 0 ? rowId : fallback;
};

// #endregion
