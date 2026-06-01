import { CategoryAdapter } from "@/Features/Hooks/BizFunc/COMM/Category_Api";
import type {
    ServerFormActionContext,
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
import { useUploadFile } from "@/SysCore/Utils/UI_HookFunc/useUploadFile";
import type { components } from "@/types/api";
import {
    PGID,
    SpecHomePage1820_BannerMediaFields,
    SpecHomePage1820_DetailFields,
    SpecHomePage1820_MarqueeFields,
    SpecHomePage1820_ResourceFields,
    SpecHomePage1820ModelFields,
    SpecHomePage1820SetFields,
} from "@/types/SchemaFields";
import { type SetStateAction, useCallback, useMemo } from "react";

// #region Property
type HomePageSet = components["schemas"]["SpecHomePage1820Set_DTO"];
type HomePageModel = components["schemas"]["SpecHomePage1820Model_DTO"];
type BannerMedia = components["schemas"]["SpecHomePage1820_BannerMedia_DTO"];
type HomePageDetail = components["schemas"]["SpecHomePage1820_Detail_DTO"];
type HomePageMarquee = components["schemas"]["SpecHomePage1820_Marquee_DTO"];
type HomePageResource = components["schemas"]["SpecHomePage1820_Resource_DTO"];
export type HomePageGridFileValue = EditGridFileValue & { internalId?: string; originalFileName?: string; };
type UploadFileHandler = ReturnType<typeof useUploadFile>["handleFileChange"];
type QueryListParam = components["schemas"]["QueryListParam"];

type HomePageImageRender = ColumnConfig["render"];
type HomePageIntroRender = ColumnConfig["render"];
type HomePageIntroEditRender = ColumnConfig["editRender"];

interface HomePageEditGridBaseOptions
{
    /** 表單資料 binding */
    binding: UseFetchFormDataResult<HomePageSet>;

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
export type HomePage1820FormRawData = Record<string, unknown> & ServerFormDefaultRawData<HomePageSet, HomePage1820FormRefs> & {
    formData: UseFetchFormDataResult<HomePageSet>;
    categoryMap: Record<string, string>;
};

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

// #region Data Model / Summary Helpers
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

const createEmptyModel = (lang: string): HomePageModel =>
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

export const createEmptyHomePage1820Set = (lang: string): HomePageSet =>
{
    // 建立空 set
    return {
        SpecHomePage1820: createEmptyModel(lang),
        SpecHomePage1820_BannerMedia: [],
        SpecHomePage1820_Detail: [],
        SpecHomePage1820_Marquee: [],
        SpecHomePage1820_Resource: [],
    };
};

const normalizeSet = (lang: string, data?: HomePageSet | null): HomePageSet =>
{
    // 正規化 set
    const base = data ?? createEmptyHomePage1820Set(lang);

    return {
        SpecHomePage1820: { ...createEmptyModel(lang), ...(base.SpecHomePage1820 ?? {}), Lang: base.SpecHomePage1820?.Lang || lang },
        SpecHomePage1820_BannerMedia: [...(base.SpecHomePage1820_BannerMedia ?? [])],
        SpecHomePage1820_Detail: [...(base.SpecHomePage1820_Detail ?? [])],
        SpecHomePage1820_Marquee: [...(base.SpecHomePage1820_Marquee ?? [])],
        SpecHomePage1820_Resource: [...(base.SpecHomePage1820_Resource ?? [])],
    };
};

const normalizeText = (value?: string | null) =>
{
    // 統一字串空值
    return String(value ?? "").trim();
};

const resolveChildHomePageId = (childHomePageId?: string | null, parentHomePageId?: string | null) =>
{
    // 子表沒有 HomePageId 時，回補主表 HomePageId
    const child = normalizeText(childHomePageId);
    if (child) return child;
    return normalizeText(parentHomePageId);
};

const sanitizeSetBeforeSave = (lang: string, data: HomePageSet): HomePageSet =>
{
    // 儲存前補齊語系與主子表關聯鍵
    const set = normalizeSet(lang, data);
    const homePageId = normalizeText(set.SpecHomePage1820?.HomePageId);

    return {
        ...set,
        SpecHomePage1820: { ...set.SpecHomePage1820, Lang: set.SpecHomePage1820?.Lang || lang, HomePageId: homePageId },
        SpecHomePage1820_BannerMedia: (set.SpecHomePage1820_BannerMedia ?? []).map(a => ({
            ...a,
            HomePageId: resolveChildHomePageId(a.HomePageId, homePageId),
        })),
        SpecHomePage1820_Detail: (set.SpecHomePage1820_Detail ?? []).map(a => ({ ...a, HomePageId: resolveChildHomePageId(a.HomePageId, homePageId) })),
        SpecHomePage1820_Marquee: (set.SpecHomePage1820_Marquee ?? []).map(a => ({ ...a, HomePageId: resolveChildHomePageId(a.HomePageId, homePageId) })),
        SpecHomePage1820_Resource: (set.SpecHomePage1820_Resource ?? []).map(a => ({ ...a, HomePageId: resolveChildHomePageId(a.HomePageId, homePageId) })),
    };
};

const buildInitialSummaryMap = (supportLangs: string[]) =>
{
    // 建立空摘要 map
    return Object.fromEntries(supportLangs.map(lang => [lang, { InternalId: "", HomePageId: "", Lang: lang }])) as Record<string, HomePage1820SummaryRow>;
};

const buildSummaryMap = (supportLangs: string[], list?: HomePageSet[] | null) =>
{
    // 由 list 建立 lang -> summary
    const next = buildInitialSummaryMap(supportLangs);

    for (const item of list ?? [])
    {
        const model = item?.SpecHomePage1820;
        const key = resolveLangKey(supportLangs, model?.Lang ?? DefaultLang);
        if (!key) continue;

        next[key] = { InternalId: model?.InternalId ?? "", HomePageId: model?.HomePageId ?? "", Lang: model?.Lang ?? key };
    }

    return next;
};

const resolveNextFormData = (lang: string, prev: HomePageSet, next: SetStateAction<HomePageSet>) =>
{
    // 處理 setFormData 的 function / object 兩種寫法
    const current = normalizeSet(lang, prev);
    if (typeof next === "function") return (next as (prevState: HomePageSet) => HomePageSet)(current);
    return next;
};

// #endregion

// #region Public - Template Entry
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
            Fields: [SpecHomePage1820ModelFields.InternalId, SpecHomePage1820ModelFields.HomePageId, SpecHomePage1820ModelFields.Lang],
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
): ServerFormTemplate<HomePageSet, HomePage1820FormAdapter, HomePage1820FormRefs, HomePage1820FormRawData, HomePage1820FormActionsOpt> =>
{
    const emptyData = useMemo(() => createEmptyHomePage1820Set(opt.lang), [opt.lang]);
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

// #endregion

// #region Timing
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
const buildHomePage1820InitialData = (ctx: { mode: "new" | "edit"; emptyData: HomePageSet; }): ApiFormInitial<HomePageSet> | undefined =>
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
    ctx: ServerFormReferenceContext<HomePageSet, HomePage1820FormAdapter, HomePage1820FormActionsOpt, HomePage1820FormRefs>,
) =>
{
    return { create: ctx.actionsOpt.onAfterSave, update: ctx.actionsOpt.onAfterSave };
};

/** 覆寫 HomePage1820 儲存行為，讓 Template Toolbar 儲存前先正規化語系與子表鍵值。 */
const buildHomePage1820Actions = (
    ctx: ServerFormActionContext<HomePageSet, HomePage1820FormAdapter, HomePage1820FormRefs, HomePage1820FormRawData, HomePage1820FormActionsOpt>,
    baseActions: ServerFormActions,
): ServerFormActions =>
{
    const save = async () =>
    {
        // 儲存前統一補齊 1820 語系與子表關聯鍵。
        const payload = sanitizeSetBeforeSave(ctx.actionsOpt.lang, ctx.binding.data);
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
    ctx: { binding: UseFetchFormDataResult<HomePageSet>; refs: HomePage1820FormRefs; actions: ServerFormActions; },
    baseRawData: ServerFormDefaultRawData<HomePageSet, HomePage1820FormRefs>,
    lang: Lang,
): HomePage1820FormRawData =>
{
    const langKey = normalizeLang(lang);
    const formData: UseFetchFormDataResult<HomePageSet> = {
        ...ctx.binding,
        data: normalizeSet(langKey, ctx.binding.data),
        setFormData: next => ctx.binding.setFormData(prev => resolveNextFormData(langKey, prev, next)),
    };

    return { ...baseRawData, formData, categoryMap: ctx.refs.categoryMap, actions: ctx.actions };
};

// #endregion

// #region Public - EditGrid Binding
/** 建立 Section1 Banner 的 EditGrid 綁定。 */
export const useHomePage1820BannerMediaEditGrid = (opt: HomePageEditGridBaseOptions) =>
{
    const uploadFile = useUploadFile({ enablePreview: false });
    const handleFileValueChange = useCallback(
        (args: EditGridCellValueChangeArgs) =>
            uploadHomePageFileValue(args, uploadFile.handleFileChange, SpecHomePage1820_BannerMediaFields.BannerFileDescription),
        [uploadFile.handleFileChange],
    );
    const columns = useMemo(() => buildHomePageBannerMediaColumns(handleFileValueChange, opt.renderPicturePreview), [
        handleFileValueChange,
        opt.renderPicturePreview,
    ]);

    return useEditGridBinding<HomePageSet, BannerMedia>({
        binding: buildHomePageEditGridBinding(opt.binding),
        emptyData: createEmptyHomePage1820Set(opt.lang),
        collectionName: SpecHomePage1820SetFields.SpecHomePage1820_BannerMedia,
        columns,
        getItemRowId: item => item.RowId,
        sortItems: sortHomePageRows,
        createItem: ctx => buildNewBannerMediaItem(ctx.data, ctx.nextRowId),
        toRow: (item, index) => buildBannerMediaGridRow(item, index, handleFileValueChange, opt.renderPicturePreview),
        toItem: (row, index, ctx) => toBannerMediaDto(ctx.data, row, index),
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

    return useEditGridBinding<HomePageSet, HomePageDetail>({
        binding: buildHomePageEditGridBinding(opt.binding),
        emptyData: createEmptyHomePage1820Set(opt.lang),
        collectionName: SpecHomePage1820SetFields.SpecHomePage1820_Detail,
        columns,
        getItemRowId: item => item.RowId,
        sortItems: sortHomePageRows,
        createItem: ctx => buildNewDetailItem(ctx.data, ctx.nextRowId),
        toRow: (item, index) =>
            buildDetailGridRow(item, index, handleMainFileChange, handleSubFileChange, opt.renderPicturePreview, opt.renderIntroPreview, opt.renderIntroEditor),
        toItem: (row, index, ctx) => toDetailDto(ctx.data, row, index),
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

    return useEditGridBinding<HomePageSet, HomePageMarquee>({
        binding: buildHomePageEditGridBinding(opt.binding),
        emptyData: createEmptyHomePage1820Set(opt.lang),
        collectionName: SpecHomePage1820SetFields.SpecHomePage1820_Marquee,
        columns,
        getItemRowId: item => item.RowId,
        sortItems: sortHomePageRows,
        createItem: ctx => buildNewMarqueeItem(ctx.data, ctx.nextRowId),
        toRow: (item, index) => buildMarqueeGridRow(item, index, handleFileValueChange, opt.renderPicturePreview),
        toItem: (row, index, ctx) => toMarqueeDto(ctx.data, row, index),
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

    return useEditGridBinding<HomePageSet, HomePageResource>({
        binding: buildHomePageEditGridBinding(opt.binding),
        emptyData: createEmptyHomePage1820Set(opt.lang),
        collectionName: SpecHomePage1820SetFields.SpecHomePage1820_Resource,
        columns,
        getItemRowId: item => item.RowId,
        sortItems: sortHomePageRows,
        createItem: ctx => buildNewResourceItem(ctx.data, ctx.nextRowId),
        toRow: (item, index) => buildResourceGridRow(item, index, handleFileValueChange, opt.renderPicturePreview),
        toItem: (row, index, ctx) => toResourceDto(ctx.data, row, index),
        editGridProps: buildHomePageGridProps("Section6 資源連結", "資源連結", "server-home-page-1820-resource-grid", 1120, opt.style),
    });
};

// #endregion

// #region Private
/** 建立 EditGrid 可用的表單 binding，避免 Component 直接處理 rows 同步。 */
const buildHomePageEditGridBinding = (binding: UseFetchFormDataResult<HomePageSet>) =>
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

/** 依 RowId 排序首頁子資料。 */
const sortHomePageRows = <TItem extends { RowId?: number | null; }>(items: TItem[]): TItem[] =>
{
    return [...items].sort((a, b) => Number(a.RowId ?? 0) - Number(b.RowId ?? 0));
};

/** 取得主表 HomePageId，新增子資料時優先綁定主表。 */
const getHomePageId = (data: HomePageSet): string =>
{
    return String(data.SpecHomePage1820?.HomePageId ?? "").trim();
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
const buildNewBannerMediaItem = (data: HomePageSet, rowId: number): BannerMedia =>
{
    return { HomePageId: getHomePageId(data), RowId: rowId, BannerFileId: "", BannerFileDescription: "" };
};

/** 建立 Detail 新增資料。 */
const buildNewDetailItem = (data: HomePageSet, rowId: number): HomePageDetail =>
{
    return {
        HomePageId: getHomePageId(data),
        RowId: rowId,
        Title: "",
        SubTitle: "",
        MainPictureId: "",
        MainPictureDescription: "",
        SubPictureId: "",
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
const buildNewMarqueeItem = (data: HomePageSet, rowId: number): HomePageMarquee =>
{
    return { HomePageId: getHomePageId(data), RowId: rowId, PictureId: "", PictureTitle: "", IsHide: false };
};

/** 建立 Resource 新增資料。 */
const buildNewResourceItem = (data: HomePageSet, rowId: number): HomePageResource =>
{
    return { HomePageId: getHomePageId(data), RowId: rowId, PicTitle: "", PicSubTitle: "", PicFileId: "", PicFileDescription: "", Link: "" };
};

/** 將 Banner DTO 轉成 GridRow。 */
const buildBannerMediaGridRow = (
    item: BannerMedia,
    index: number,
    onFileChange: (args: EditGridCellValueChangeArgs) => Promise<EditGridCellValueChangeResult>,
    renderPicturePreview?: HomePageImageRender,
): GridRow =>
{
    const rowId = Number(item.RowId ?? index + 1);
    return {
        keyId: buildHomePageRowKey("banner", item.HomePageId, rowId),
        rowId,
        RowId: rowId,
        RowNo: index + 1,
        cells: buildBannerMediaCells(item, onFileChange, renderPicturePreview),
    };
};

/** 將 Detail DTO 轉成 GridRow。 */
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
    const rowId = Number(item.RowId ?? index + 1);
    return {
        keyId: buildHomePageRowKey("detail", item.HomePageId, rowId),
        rowId,
        RowId: rowId,
        RowNo: index + 1,
        cells: buildDetailCells(item, onMainFileChange, onSubFileChange, renderPicturePreview, renderIntroPreview, renderIntroEditor),
    };
};

/** 將 Marquee DTO 轉成 GridRow。 */
const buildMarqueeGridRow = (
    item: HomePageMarquee,
    index: number,
    onFileChange: (args: EditGridCellValueChangeArgs) => Promise<EditGridCellValueChangeResult>,
    renderPicturePreview?: HomePageImageRender,
): GridRow =>
{
    const rowId = Number(item.RowId ?? index + 1);
    return {
        keyId: buildHomePageRowKey("marquee", item.HomePageId, rowId),
        rowId,
        RowId: rowId,
        RowNo: index + 1,
        cells: buildMarqueeCells(item, onFileChange, renderPicturePreview),
    };
};

/** 將 Resource DTO 轉成 GridRow。 */
const buildResourceGridRow = (
    item: HomePageResource,
    index: number,
    onFileChange: (args: EditGridCellValueChangeArgs) => Promise<EditGridCellValueChangeResult>,
    renderPicturePreview?: HomePageImageRender,
): GridRow =>
{
    const rowId = Number(item.RowId ?? index + 1);
    return {
        keyId: buildHomePageRowKey("resource", item.HomePageId, rowId),
        rowId,
        RowId: rowId,
        RowNo: index + 1,
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
            buildHomePageFileCellValue(item.BannerFileId, getDtoFileName(item.BannerFile), item.BannerFileDescription),
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
            buildHomePageFileCellValue(item.MainPictureId, getDtoFileName(item.MainPicture), item.MainPictureDescription),
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
            buildHomePageFileCellValue(item.SubPictureId, getDtoFileName(item.SubPicture), item.SubPictureDescription),
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
            buildHomePageFileCellValue(item.PictureId, getDtoFileName(item.Picture), item.PictureTitle),
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
            buildHomePageFileCellValue(item.PicFileId, getDtoFileName(item.PicFile), item.PicFileDescription),
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

/** 將 Banner GridRow 轉回 DTO。 */
const toBannerMediaDto = (data: HomePageSet, row: GridRow, index: number): BannerMedia =>
{
    const file = toHomePageFileCellValue(getEditGridCellValue(row, SpecHomePage1820_BannerMediaFields.BannerFileId));
    return {
        HomePageId: getHomePageId(data),
        RowId: index + 1,
        BannerFileId: file.internalId ?? "",
        BannerFileDescription: getEditGridStringCellValue(row, SpecHomePage1820_BannerMediaFields.BannerFileDescription),
    };
};

/** 將 Detail GridRow 轉回 DTO。 */
const toDetailDto = (data: HomePageSet, row: GridRow, index: number): HomePageDetail =>
{
    const mainFile = toHomePageFileCellValue(getEditGridCellValue(row, SpecHomePage1820_DetailFields.MainPictureId));
    const subFile = toHomePageFileCellValue(getEditGridCellValue(row, SpecHomePage1820_DetailFields.SubPictureId));

    return {
        HomePageId: getHomePageId(data),
        RowId: index + 1,
        Title: getEditGridStringCellValue(row, SpecHomePage1820_DetailFields.Title),
        SubTitle: getEditGridStringCellValue(row, SpecHomePage1820_DetailFields.SubTitle),
        MainPictureId: mainFile.internalId ?? "",
        MainPictureDescription: getEditGridStringCellValue(row, SpecHomePage1820_DetailFields.MainPictureDescription),
        SubPictureId: subFile.internalId ?? "",
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

/** 將 Marquee GridRow 轉回 DTO。 */
const toMarqueeDto = (data: HomePageSet, row: GridRow, index: number): HomePageMarquee =>
{
    const file = toHomePageFileCellValue(getEditGridCellValue(row, SpecHomePage1820_MarqueeFields.PictureId));
    return {
        HomePageId: getHomePageId(data),
        RowId: index + 1,
        PictureId: file.internalId ?? "",
        PictureTitle: getEditGridStringCellValue(row, SpecHomePage1820_MarqueeFields.PictureTitle),
        IsHide: Boolean(getEditGridCellValue(row, SpecHomePage1820_MarqueeFields.IsHide)),
    };
};

/** 將 Resource GridRow 轉回 DTO。 */
const toResourceDto = (data: HomePageSet, row: GridRow, index: number): HomePageResource =>
{
    const file = toHomePageFileCellValue(getEditGridCellValue(row, SpecHomePage1820_ResourceFields.PicFileId));
    return {
        HomePageId: getHomePageId(data),
        RowId: index + 1,
        PicTitle: getEditGridStringCellValue(row, SpecHomePage1820_ResourceFields.PicTitle),
        PicSubTitle: getEditGridStringCellValue(row, SpecHomePage1820_ResourceFields.PicSubTitle),
        PicFileId: file.internalId ?? "",
        PicFileDescription: getEditGridStringCellValue(row, SpecHomePage1820_ResourceFields.PicFileDescription),
        Link: getEditGridStringCellValue(row, SpecHomePage1820_ResourceFields.Link),
    };
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
    return { value: file, rowValues: { [descriptionField]: getFileNameWithoutExtension(file.originalFileName ?? file.fileName) } };
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

/** 將任意 EditGrid value 正規化成首頁檔案值。 */
export const toHomePageFileCellValue = (value: EditGridCellValue): HomePageGridFileValue =>
{
    if (isHomePageFileValue(value)) return value;
    if (typeof value === "string") return buildHomePageFileCellValue(value);
    return buildEmptyHomePageFileCellValue();
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

/** 取得 DTO 檔案物件中的原始檔名。 */
const getDtoFileName = (file?: { FileName?: string | null; fileName?: string | null; } | null): string =>
{
    return String(file?.FileName ?? file?.fileName ?? "").trim();
};

/** 取得預覽網址。 */
export const getHomePageFilePreviewUrl = (fileId?: string | null): string | undefined =>
{
    const id = String(fileId ?? "").trim();
    return id ? FileManagementAPI.get_Server_Preview_Url(id) ?? undefined : undefined;
};

/** 取得下載網址。 */
const getHomePageFileDownloadUrl = (fileId?: string | null): string | undefined =>
{
    const id = String(fileId ?? "").trim();
    return id ? `/Service/FileManagement/Server_Download/${encodeURIComponent(id)}` : undefined;
};

/** 取得不含副檔名的檔案名稱。 */
const getFileNameWithoutExtension = (fileName?: string | null): string =>
{
    const safeFileName = String(fileName ?? "").trim();
    const extIndex = safeFileName.lastIndexOf(".");
    if (extIndex <= 0) return safeFileName;
    return safeFileName.slice(0, extIndex);
};
// #endregion
