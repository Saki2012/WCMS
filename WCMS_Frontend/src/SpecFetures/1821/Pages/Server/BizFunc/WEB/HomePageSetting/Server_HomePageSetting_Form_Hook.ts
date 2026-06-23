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
    getEditGridNumberCellValue,
    getEditGridStringCellValue,
    useEditGridBinding,
} from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid_Hook";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { SpecHomePage1821Adapter } from "@/SpecFetures/1821/Hooks/WEB/HomePage_Api";
import type {
    FileManageDto,
    QueryListParam,
    SpecHomePage1821Banner,
    SpecHomePage1821Model,
    SpecHomePage1821Set,
    SpecHomePage1821Shortcut,
    SpecHomePage1821ShortcutModuleItem,
} from "@/SpecFetures/1821/Hooks/WEB/HomePage_Types";
import {
    HomePageModuleType,
    SpecHomePage1821BannerFields,
    SpecHomePage1821ModelFields,
    SpecHomePage1821SetFields,
    SpecHomePage1821ShortcutFields,
    SpecHomePage1821ShortcutModuleItemFields,
} from "@/SpecFetures/1821/Hooks/WEB/HomePage_Types";
import { DefaultLang, type Lang } from "@/SysCore/i18n/lang";
import type { ApiFormInitial, ServerFormActions } from "@/SysCore/Utils/API/APIAdapter";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import type { UseFetchDataResult } from "@/SysCore/Utils/API/FetchDataType";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import { LibAttachment } from "@/SysCore/Utils/Library/LibData";
import { useUploadFile } from "@/SysCore/Utils/UI_HookFunc/useUploadFile";
import { type SetStateAction, useCallback, useMemo } from "react";

// #region Property
type HomePageSet = SpecHomePage1821Set;

type HomePageModel = SpecHomePage1821Model;

type Banner = SpecHomePage1821Banner;

type Shortcut = SpecHomePage1821Shortcut;

type ShortcutModuleItem = SpecHomePage1821ShortcutModuleItem;

export type HomePageGridFileValue = EditGridFileValue & { internalId?: string; originalFileName?: string; };

type UploadFileHandler = ReturnType<typeof useUploadFile>["handleFileChange"];

type HomePageImageRender = ColumnConfig["render"];

interface HomePageEditGridBaseOptions
{
    binding: UseFetchFormDataResult<HomePageSet>;
    lang: string;
    style: IEditGridView_Style;
    renderPicturePreview?: HomePageImageRender;
}

export type HomePage1821SummaryRow = { InternalId: string; HomePageId: string; Lang: string; };

export type HomePage1821SummaryRawData = {
    supportLangs: Lang[];
    langInternalIdMap: Record<string, string>;
    langSummaryMap: Record<string, HomePage1821SummaryRow>;
};

export type HomePage1821FormRefs = Record<string, never>;

export type HomePage1821FormRawData = Record<string, unknown> & ServerFormDefaultRawData<HomePageSet, HomePage1821FormRefs> & {
    formData: UseFetchFormDataResult<HomePageSet>;
};

export type HomePage1821FormAdapter = { HomePage: ReturnType<typeof SpecHomePage1821Adapter>; };

export type HomePage1821FormActionsOpt = {
    lang: Lang;
    onBackToList: () => void;
    onAfterSave: () => Promise<void> | void;
};

export type HomePage1821SummaryAdapter = { HomePage: ReturnType<typeof SpecHomePage1821Adapter>; };

const DefaultOptionsJson = "{\"categoryIds\":\"\",\"tagIds\":\"\"}";

const moduleTypeOptions = [
    { label: "最新消息", value: HomePageModuleType.Announcement },
    { label: "檔案下載", value: HomePageModuleType.FileArchive },
];
// #endregion

// #region Public
export const createEmptyHomePage1821Set = (lang: string): HomePageSet =>
{
    return {
        SpecHomePage1821: createEmptyModel(lang),
        SpecHomePage1821_Banner: [],
        SpecHomePage1821_Shortcut: [],
        SpecHomePage1821_ShortcutModuleItem: [],
        SpecHomePage1821_FeatureCard: [],
        SpecHomePage1821_RelatedLink: [],
    };
};

export const useHomePage1821SummaryFetchData = (opt: { supportLangs: Lang[]; }): UseFetchDataResult<HomePage1821SummaryRawData, HomePage1821SummaryAdapter> =>
{
    const adapter = useMemo<HomePage1821SummaryAdapter>(() =>
    {
        return { HomePage: SpecHomePage1821Adapter() };
    }, []);

    const listCondition = useMemo<QueryListParam>(() =>
    {
        return {
            Fields: [SpecHomePage1821ModelFields.InternalId, SpecHomePage1821ModelFields.HomePageId, SpecHomePage1821ModelFields.Lang],
            Condition: "",
            PageNumber: 0,
            PageSize: 0,
        };
    }, []);

    const list = adapter.HomePage.hooks.useQueryList({ condition: listCondition, deps: [] });

    const langSummaryMap = useMemo(() =>
    {
        return buildSummaryMap(opt.supportLangs, list.data);
    }, [list.data, opt.supportLangs]);

    const langInternalIdMap = useMemo<Record<string, string>>(() =>
    {
        return Object.fromEntries(opt.supportLangs.map(lang => [lang, langSummaryMap[lang]?.InternalId ?? ""]));
    }, [langSummaryMap, opt.supportLangs]);

    const rawData = useMemo<HomePage1821SummaryRawData>(() =>
    {
        return { supportLangs: opt.supportLangs, langInternalIdMap, langSummaryMap };
    }, [langInternalIdMap, langSummaryMap, opt.supportLangs]);

    const refetchData = useCallback(async () =>
    {
        await Promise.resolve(list.refetch());
    }, [list]);

    const refetchRefData = useCallback(async () =>
    {}, []);

    return { adapter, rawData, isLoading: list.isLoading, errors: [list.errorText].filter((x): x is string => Boolean(x)), refetchData, refetchRefData };
};

export const useHomePage1821LangFormTemplate = (
    opt: { theme: IBETheme; adapter: ReturnType<typeof SpecHomePage1821Adapter>; lang: Lang; internalId: string; onAfterSave: () => Promise<void> | void; },
): ServerFormTemplate<HomePageSet, HomePage1821FormAdapter, HomePage1821FormRefs, HomePage1821FormRawData, HomePage1821FormActionsOpt> =>
{
    const emptyData = useMemo(() => createEmptyHomePage1821Set(opt.lang), [opt.lang]);
    const actionsOpt = useMemo<HomePage1821FormActionsOpt>(() =>
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
            featureKey: "SpecHomePage1821",
            theme: opt.theme,
            lang: opt.lang,
            internalId: opt.internalId,
            emptyData,
            actionsOpt,
            spec: {
                buildAdapter: () => buildHomePage1821FormAdapter(opt.adapter),
                selectDataAdapter: adapter => adapter.HomePage,
                buildTitle: buildHomePage1821FormTitle,
                buildInitialData: buildHomePage1821InitialData,
                useReferenceData: useHomePage1821ReferenceData,
                buildSuccessActions: buildHomePage1821SuccessActions,
                buildActions: buildHomePage1821Actions,
                buildRawData: (ctx, baseRawData) => buildHomePage1821RawData(ctx, baseRawData, opt.lang),
            },
        };
    }, [actionsOpt, emptyData, opt.adapter, opt.internalId, opt.lang, opt.theme]);
};

export const useHomePage1821BannerEditGrid = (opt: HomePageEditGridBaseOptions) =>
{
    const uploadFile = useUploadFile({ enablePreview: false });
    const handleFileValueChange = useCallback(
        (args: EditGridCellValueChangeArgs) => uploadHomePageFileValue(args, uploadFile.handleFileChange, SpecHomePage1821BannerFields.BannerFileDescription),
        [uploadFile.handleFileChange],
    );
    const columns = useMemo(() => buildBannerColumns(handleFileValueChange, opt.renderPicturePreview), [handleFileValueChange, opt.renderPicturePreview]);

    return useEditGridBinding<HomePageSet, Banner>({
        binding: buildHomePageEditGridBinding(opt.binding),
        emptyData: createEmptyHomePage1821Set(opt.lang),
        collectionName: SpecHomePage1821SetFields.SpecHomePage1821_Banner,
        columns,
        getItemRowId: item => item.RowId,
        sortItems: sortHomePageRows,
        createItem: ctx => buildNewBannerItem(ctx.data, ctx.nextRowId),
        toRow: (item, index) => buildBannerGridRow(item, index, handleFileValueChange, opt.renderPicturePreview),
        toItem: (row, index, ctx) => toBannerDto(ctx.data, row, index),
        editGridProps: buildHomePageGridProps("Section1 Banner", "Banner", "server-home-page-1821-banner-grid", 1180, opt.style),
    });
};

export const useHomePage1821ShortcutEditGrid = (opt: HomePageEditGridBaseOptions) =>
{
    const uploadFile = useUploadFile({ enablePreview: false });
    const handleIconFileChange = useCallback(
        (args: EditGridCellValueChangeArgs) => uploadHomePageFileValue(args, uploadFile.handleFileChange, SpecHomePage1821ShortcutFields.IconFileDescription),
        [uploadFile.handleFileChange],
    );
    const handleLinkPicChange = useCallback(
        (args: EditGridCellValueChangeArgs) => uploadHomePageFileValue(args, uploadFile.handleFileChange),
        [uploadFile.handleFileChange],
    );
    const columns = useMemo(
        () => buildShortcutColumns(handleIconFileChange, handleLinkPicChange, opt.renderPicturePreview),
        [handleIconFileChange, handleLinkPicChange, opt.renderPicturePreview],
    );

    return useEditGridBinding<HomePageSet, Shortcut>({
        binding: buildHomePageEditGridBinding(opt.binding),
        emptyData: createEmptyHomePage1821Set(opt.lang),
        collectionName: SpecHomePage1821SetFields.SpecHomePage1821_Shortcut,
        columns,
        getItemRowId: item => item.RowId,
        sortItems: sortHomePageRows,
        createItem: ctx => buildNewShortcutItem(ctx.data, ctx.nextRowId),
        toRow: (item, index) => buildShortcutGridRow(item, index, handleIconFileChange, handleLinkPicChange, opt.renderPicturePreview),
        toItem: (row, index, ctx) => toShortcutDto(ctx.data, row, index),
        editGridProps: buildHomePageGridProps("Section2 Tabs", "Tab", "server-home-page-1821-shortcut-grid", 1760, opt.style),
    });
};

export const useHomePage1821ShortcutModuleItemEditGrid = (opt: HomePageEditGridBaseOptions) =>
{
    const shortcutOptions = useMemo(() => buildShortcutParentOptions(opt.binding.data?.SpecHomePage1821_Shortcut), [opt.binding.data?.SpecHomePage1821_Shortcut]);
    const columns = useMemo(() => buildModuleItemColumns(shortcutOptions), [shortcutOptions]);

    return useEditGridBinding<HomePageSet, ShortcutModuleItem>({
        binding: buildHomePageEditGridBinding(opt.binding),
        emptyData: createEmptyHomePage1821Set(opt.lang),
        collectionName: SpecHomePage1821SetFields.SpecHomePage1821_ShortcutModuleItem,
        columns,
        getItemRowId: item => item.RowId,
        sortItems: sortModuleRows,
        createItem: ctx => buildNewModuleItem(ctx.data, ctx.nextRowId),
        toRow: buildModuleItemGridRow,
        toItem: (row, index, ctx) => toModuleItemDto(ctx.data, row, index),
        beforeCommit: ctx => normalizeModuleItemRowNo(ctx.nextVisibleItems),
        editGridProps: buildHomePageGridProps("Section2 Module Items", "Module Item", "server-home-page-1821-module-item-grid", 1320, opt.style),
    });
};

export const toHomePageFileCellValue = (value: EditGridCellValue): HomePageGridFileValue =>
{
    if (isHomePageFileValue(value)) return value;
    if (typeof value === "string") return buildHomePageFileCellValue(value);
    return buildEmptyHomePageFileCellValue();
};

export const getHomePageFilePreviewUrl = (fileId?: string | null): string | undefined =>
{
    const id = normalizeText(fileId);
    return id ? FileManagementAPI.get_Server_Preview_Url(id) ?? undefined : undefined;
};
// #endregion

// #region Private
const createEmptyModel = (lang: string): HomePageModel =>
{
    return {
        Lang: lang,
        HomePageId: "",
        Section3Title: "",
        Section3SubTitle: "",
        Card1Title: "",
        Card1PicId: "",
        Card2Title: "",
        Card2PicId: "",
        Section4Title: "",
        Section4SubTitle: "",
        LinkOptions: DefaultOptionsJson,
        LinkViewMore: "",
    };
};

const normalizeSet = (lang: string, data?: HomePageSet | null): HomePageSet =>
{
    const base = data ?? createEmptyHomePage1821Set(lang);

    return {
        SpecHomePage1821: { ...createEmptyModel(lang), ...(base.SpecHomePage1821 ?? {}), Lang: base.SpecHomePage1821?.Lang || lang },
        SpecHomePage1821_Banner: [...(base.SpecHomePage1821_Banner ?? [])],
        SpecHomePage1821_Shortcut: [...(base.SpecHomePage1821_Shortcut ?? [])],
        SpecHomePage1821_ShortcutModuleItem: [...(base.SpecHomePage1821_ShortcutModuleItem ?? [])],
        SpecHomePage1821_FeatureCard: [...(base.SpecHomePage1821_FeatureCard ?? [])],
        SpecHomePage1821_RelatedLink: [...(base.SpecHomePage1821_RelatedLink ?? [])],
    };
};

const normalizeText = (value?: string | null) =>
{
    return String(value ?? "").trim();
};

const normalizeLang = (lang?: string) =>
{
    return normalizeText(lang).toLowerCase();
};

const resolveLangKey = (supportLangs: string[], lang?: string) =>
{
    const target = normalizeLang(lang);
    return supportLangs.find(a => normalizeLang(a) === target) ?? "";
};

const resolveChildHomePageId = (childHomePageId?: string | null, parentHomePageId?: string | null) =>
{
    const child = normalizeText(childHomePageId);
    if (child) return child;
    return normalizeText(parentHomePageId);
};

const sanitizeSetBeforeSave = (lang: string, data: HomePageSet): HomePageSet =>
{
    const set = normalizeSet(lang, data);
    const homePageId = normalizeText(set.SpecHomePage1821?.HomePageId);

    return {
        ...set,
        SpecHomePage1821: {
            ...set.SpecHomePage1821,
            Lang: set.SpecHomePage1821?.Lang || lang,
            HomePageId: homePageId,
            LinkOptions: normalizeOptionsText(set.SpecHomePage1821?.LinkOptions),
        },
        SpecHomePage1821_Banner: normalizeBannerForSave(set.SpecHomePage1821_Banner ?? [], homePageId),
        SpecHomePage1821_Shortcut: normalizeShortcutForSave(set.SpecHomePage1821_Shortcut ?? [], homePageId),
        SpecHomePage1821_ShortcutModuleItem: normalizeModuleForSave(set.SpecHomePage1821_ShortcutModuleItem ?? [], homePageId),
        SpecHomePage1821_FeatureCard: (set.SpecHomePage1821_FeatureCard ?? []).map(a => ({ ...a, HomePageId: resolveChildHomePageId(a.HomePageId, homePageId) })),
        SpecHomePage1821_RelatedLink: (set.SpecHomePage1821_RelatedLink ?? []).map(a => ({ ...a, HomePageId: resolveChildHomePageId(a.HomePageId, homePageId) })),
    };
};

const normalizeBannerForSave = (rows: Banner[], homePageId: string): Banner[] =>
{
    return rows.map((row, index) => ({ ...row, HomePageId: resolveChildHomePageId(row.HomePageId, homePageId), RowNo: index + 1 }));
};

const normalizeShortcutForSave = (rows: Shortcut[], homePageId: string): Shortcut[] =>
{
    return rows.map((row, index) =>
    {
        const isLink = Boolean(row.IsLink);
        return {
            ...row,
            HomePageId: resolveChildHomePageId(row.HomePageId, homePageId),
            RowNo: index + 1,
            IsLink: isLink,
            Link: isLink ? row.Link ?? "" : "",
            LinkPicId: isLink ? row.LinkPicId ?? "" : "",
        };
    });
};

const normalizeModuleForSave = (rows: ShortcutModuleItem[], homePageId: string): ShortcutModuleItem[] =>
{
    return normalizeModuleItemRowNo(rows).map(row => ({
        ...row,
        HomePageId: resolveChildHomePageId(row.HomePageId, homePageId),
        ModuleOptions: normalizeOptionsText(row.ModuleOptions),
    }));
};

const normalizeOptionsText = (value?: string | null): string =>
{
    const text = normalizeText(value);
    return text || DefaultOptionsJson;
};

const buildInitialSummaryMap = (supportLangs: string[]) =>
{
    return Object.fromEntries(supportLangs.map(lang => [lang, { InternalId: "", HomePageId: "", Lang: lang }])) as Record<string, HomePage1821SummaryRow>;
};

const buildSummaryMap = (supportLangs: string[], list?: HomePageSet[] | null) =>
{
    const next = buildInitialSummaryMap(supportLangs);

    for (const item of list ?? [])
    {
        const model = item?.SpecHomePage1821;
        const key = resolveLangKey(supportLangs, model?.Lang ?? DefaultLang);
        if (!key) continue;

        next[key] = { InternalId: model?.InternalId ?? "", HomePageId: model?.HomePageId ?? "", Lang: model?.Lang ?? key };
    }

    return next;
};

const resolveNextFormData = (lang: string, prev: HomePageSet, next: SetStateAction<HomePageSet>) =>
{
    const current = normalizeSet(lang, prev);
    if (typeof next === "function") return (next as (prevState: HomePageSet) => HomePageSet)(current);
    return next;
};

const buildHomePage1821FormAdapter = (adapter: ReturnType<typeof SpecHomePage1821Adapter>): HomePage1821FormAdapter =>
{
    return { HomePage: adapter };
};

const buildHomePage1821FormTitle = (): string =>
{
    return "招生首頁設定";
};

const buildHomePage1821InitialData = (ctx: { mode: "new" | "edit"; emptyData: HomePageSet; }): ApiFormInitial<HomePageSet> | undefined =>
{
    if (ctx.mode !== "new") return undefined;
    return { data: { args: "__new__", apiRes: { IsSuccess: true, Data: ctx.emptyData, SysMessage: [] } } };
};

const useHomePage1821ReferenceData = (): ServerFormReferenceResult<HomePage1821FormRefs> =>
{
    return useMemo(() =>
    {
        return { refs: {}, isLoading: false, errors: [], refetchRefData: async () => undefined };
    }, []);
};

const buildHomePage1821SuccessActions = (
    ctx: ServerFormReferenceContext<HomePageSet, HomePage1821FormAdapter, HomePage1821FormActionsOpt, HomePage1821FormRefs>,
) =>
{
    return { create: ctx.actionsOpt.onAfterSave, update: ctx.actionsOpt.onAfterSave };
};

const buildHomePage1821Actions = (
    ctx: ServerFormActionContext<HomePageSet, HomePage1821FormAdapter, HomePage1821FormRefs, HomePage1821FormRawData, HomePage1821FormActionsOpt>,
    baseActions: ServerFormActions,
): ServerFormActions =>
{
    const save = async () =>
    {
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

const buildHomePage1821RawData = (
    ctx: { binding: UseFetchFormDataResult<HomePageSet>; refs: HomePage1821FormRefs; actions: ServerFormActions; },
    baseRawData: ServerFormDefaultRawData<HomePageSet, HomePage1821FormRefs>,
    lang: Lang,
): HomePage1821FormRawData =>
{
    const langKey = normalizeLang(lang);
    const formData: UseFetchFormDataResult<HomePageSet> = {
        ...ctx.binding,
        data: normalizeSet(langKey, ctx.binding.data),
        setFormData: next => ctx.binding.setFormData(prev => resolveNextFormData(langKey, prev, next)),
    };

    return { ...baseRawData, formData, actions: ctx.actions };
};

const buildHomePageEditGridBinding = (binding: UseFetchFormDataResult<HomePageSet>) =>
{
    return { data: binding.data, setFormData: binding.setFormData };
};

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

const sortHomePageRows = <TItem extends { RowNo?: number | null; RowId?: number | null; }>(items: TItem[]): TItem[] =>
{
    return [...items].sort((a, b) => compareNumber(a.RowNo, b.RowNo) || compareNumber(a.RowId, b.RowId));
};

const sortModuleRows = (items: ShortcutModuleItem[]): ShortcutModuleItem[] =>
{
    return [...items].sort((a, b) => compareNumber(a.ParentRowId, b.ParentRowId) || compareNumber(a.RowNo, b.RowNo) || compareNumber(a.RowId, b.RowId));
};

const compareNumber = (a?: number | null, b?: number | null): number =>
{
    return Number(a ?? 0) - Number(b ?? 0);
};

const getHomePageId = (data: HomePageSet): string =>
{
    return normalizeText(data.SpecHomePage1821?.HomePageId);
};

const buildBannerColumns = (
    onFileChange: (args: EditGridCellValueChangeArgs) => Promise<EditGridCellValueChangeResult>,
    renderPicturePreview?: HomePageImageRender,
): ColumnConfig[] =>
{
    return [
        buildFileColumn(SpecHomePage1821BannerFields.BannerFileId, "Banner 圖片", 360, onFileChange, renderPicturePreview),
        buildTextColumn(SpecHomePage1821BannerFields.BannerFileDescription, "圖片說明", 220, 200),
        buildTextColumn(SpecHomePage1821BannerFields.Link, "連結", 300, 500),
        buildCheckboxColumn(SpecHomePage1821BannerFields.IsHide, "隱藏", 100),
    ];
};

const buildShortcutColumns = (
    onIconFileChange: (args: EditGridCellValueChangeArgs) => Promise<EditGridCellValueChangeResult>,
    onLinkPicChange: (args: EditGridCellValueChangeArgs) => Promise<EditGridCellValueChangeResult>,
    renderPicturePreview?: HomePageImageRender,
): ColumnConfig[] =>
{
    return [
        buildFileColumn(SpecHomePage1821ShortcutFields.IconFileId, "Icon", 280, onIconFileChange, renderPicturePreview),
        buildTextColumn(SpecHomePage1821ShortcutFields.IconFileDescription, "Icon 說明", 180, 200),
        buildTextColumn(SpecHomePage1821ShortcutFields.Title, "標題", 180, 120),
        buildTextColumn(SpecHomePage1821ShortcutFields.SubTitle, "副標題", 200, 160),
        buildCheckboxColumn(SpecHomePage1821ShortcutFields.IsLink, "連結頁籤", 120),
        buildTextColumn(SpecHomePage1821ShortcutFields.Link, "連結", 300, 500),
        buildFileColumn(SpecHomePage1821ShortcutFields.LinkPicId, "連結圖片", 280, onLinkPicChange, renderPicturePreview),
        buildCheckboxColumn(SpecHomePage1821ShortcutFields.IsHide, "隱藏", 100),
    ];
};

const buildModuleItemColumns = (shortcutOptions: { label: string; value: number; }[]): ColumnConfig[] =>
{
    return [
        { key: SpecHomePage1821ShortcutModuleItemFields.ParentRowId, title: "所屬頁籤", width: 220, inputType: "selectSingle", editable: true, options: shortcutOptions },
        buildTextColumn(SpecHomePage1821ShortcutModuleItemFields.Title, "標題", 180, 120),
        buildTextColumn(SpecHomePage1821ShortcutModuleItemFields.SubTitle, "副標題", 200, 160),
        { key: SpecHomePage1821ShortcutModuleItemFields.ModuleType, title: "模組類型", width: 160, inputType: "selectSingle", editable: true, options: moduleTypeOptions },
        buildTextareaColumn(SpecHomePage1821ShortcutModuleItemFields.ModuleOptions, "模組條件 JSON", 260, 220),
        buildTextColumn(SpecHomePage1821ShortcutModuleItemFields.MoreViewLink, "More View 連結", 280, 500),
        buildCheckboxColumn(SpecHomePage1821ShortcutModuleItemFields.IsHide, "隱藏", 100),
    ];
};

const buildTextColumn = (key: string, title: string, width: number, maxLength: number): ColumnConfig =>
{
    return { key, title, width, inputType: "text", editable: true, maxLength };
};

const buildTextareaColumn = (key: string, title: string, width: number, maxLength: number): ColumnConfig =>
{
    return { key, title, width, inputType: "textarea", editable: true, maxLength, rows: 3 };
};

const buildCheckboxColumn = (key: string, title: string, width: number): ColumnConfig =>
{
    return { key, title, width, inputType: "checkboxSingle", editable: true };
};

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

const buildNewBannerItem = (data: HomePageSet, rowId: number): Banner =>
{
    return { HomePageId: getHomePageId(data), RowId: rowId, RowNo: rowId, BannerFileId: "", BannerFileDescription: "", Link: "", IsHide: false };
};

const buildNewShortcutItem = (data: HomePageSet, rowId: number): Shortcut =>
{
    return {
        HomePageId: getHomePageId(data),
        RowId: rowId,
        RowNo: rowId,
        Title: "",
        SubTitle: "",
        IconFileId: "",
        IconFileDescription: "",
        IsLink: false,
        Link: "",
        LinkPicId: "",
        IsHide: false,
    };
};

const buildNewModuleItem = (data: HomePageSet, rowId: number): ShortcutModuleItem =>
{
    return {
        HomePageId: getHomePageId(data),
        ParentRowId: getDefaultParentRowId(data.SpecHomePage1821_Shortcut),
        RowId: rowId,
        RowNo: rowId,
        Title: "",
        SubTitle: "",
        ModuleType: HomePageModuleType.Announcement,
        ModuleOptions: DefaultOptionsJson,
        MoreViewLink: "",
        IsHide: false,
    };
};

const buildBannerGridRow = (
    item: Banner,
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
        RowNo: Number(item.RowNo ?? index + 1),
        cells: buildBannerCells(item, onFileChange, renderPicturePreview),
    };
};

const buildShortcutGridRow = (
    item: Shortcut,
    index: number,
    onIconFileChange: (args: EditGridCellValueChangeArgs) => Promise<EditGridCellValueChangeResult>,
    onLinkPicChange: (args: EditGridCellValueChangeArgs) => Promise<EditGridCellValueChangeResult>,
    renderPicturePreview?: HomePageImageRender,
): GridRow =>
{
    const rowId = Number(item.RowId ?? index + 1);
    return {
        keyId: buildHomePageRowKey("shortcut", item.HomePageId, rowId),
        rowId,
        RowId: rowId,
        RowNo: Number(item.RowNo ?? index + 1),
        cells: buildShortcutCells(item, onIconFileChange, onLinkPicChange, renderPicturePreview),
    };
};

const buildModuleItemGridRow = (item: ShortcutModuleItem, index: number): GridRow =>
{
    const rowId = Number(item.RowId ?? index + 1);
    return {
        keyId: buildHomePageRowKey(`module-${item.ParentRowId ?? 0}`, item.HomePageId, rowId),
        rowId,
        RowId: rowId,
        RowNo: Number(item.RowNo ?? index + 1),
        cells: buildModuleItemCells(item),
    };
};

const buildBannerCells = (
    item: Banner,
    onFileChange: (args: EditGridCellValueChangeArgs) => Promise<EditGridCellValueChangeResult>,
    renderPicturePreview?: HomePageImageRender,
): RowCell[] =>
{
    return [
        buildEditGridCell(
            SpecHomePage1821BannerFields.BannerFileId,
            "Banner 圖片",
            buildHomePageFileCellValue(item.BannerFileId, getDtoFileName(item.BannerFile), item.BannerFileDescription),
            { inputType: "file", editable: true, accept: "image/*", render: renderPicturePreview, onValueChange: onFileChange },
        ),
        buildEditGridCell(SpecHomePage1821BannerFields.BannerFileDescription, "圖片說明", item.BannerFileDescription ?? "", {
            inputType: "text",
            editable: true,
            maxLength: 200,
        }),
        buildEditGridCell(SpecHomePage1821BannerFields.Link, "連結", item.Link ?? "", { inputType: "text", editable: true, maxLength: 500 }),
        buildEditGridCell(SpecHomePage1821BannerFields.IsHide, "隱藏", Boolean(item.IsHide), { inputType: "checkboxSingle", editable: true }),
    ];
};

const buildShortcutCells = (
    item: Shortcut,
    onIconFileChange: (args: EditGridCellValueChangeArgs) => Promise<EditGridCellValueChangeResult>,
    onLinkPicChange: (args: EditGridCellValueChangeArgs) => Promise<EditGridCellValueChangeResult>,
    renderPicturePreview?: HomePageImageRender,
): RowCell[] =>
{
    return [
        buildEditGridCell(
            SpecHomePage1821ShortcutFields.IconFileId,
            "Icon",
            buildHomePageFileCellValue(item.IconFileId, getDtoFileName(item.IconFile), item.IconFileDescription),
            { inputType: "file", editable: true, accept: "image/*", render: renderPicturePreview, onValueChange: onIconFileChange },
        ),
        buildEditGridCell(SpecHomePage1821ShortcutFields.IconFileDescription, "Icon 說明", item.IconFileDescription ?? "", {
            inputType: "text",
            editable: true,
            maxLength: 200,
        }),
        buildEditGridCell(SpecHomePage1821ShortcutFields.Title, "標題", item.Title ?? "", { inputType: "text", editable: true, maxLength: 120 }),
        buildEditGridCell(SpecHomePage1821ShortcutFields.SubTitle, "副標題", item.SubTitle ?? "", { inputType: "text", editable: true, maxLength: 160 }),
        buildEditGridCell(SpecHomePage1821ShortcutFields.IsLink, "連結頁籤", Boolean(item.IsLink), { inputType: "checkboxSingle", editable: true }),
        buildEditGridCell(SpecHomePage1821ShortcutFields.Link, "連結", item.Link ?? "", { inputType: "text", editable: true, maxLength: 500 }),
        buildEditGridCell(
            SpecHomePage1821ShortcutFields.LinkPicId,
            "連結圖片",
            buildHomePageFileCellValue(item.LinkPicId, getDtoFileName(item.LinkPic), item.Title),
            { inputType: "file", editable: true, accept: "image/*", render: renderPicturePreview, onValueChange: onLinkPicChange },
        ),
        buildEditGridCell(SpecHomePage1821ShortcutFields.IsHide, "隱藏", Boolean(item.IsHide), { inputType: "checkboxSingle", editable: true }),
    ];
};

const buildModuleItemCells = (item: ShortcutModuleItem): RowCell[] =>
{
    return [
        buildEditGridCell(SpecHomePage1821ShortcutModuleItemFields.ParentRowId, "所屬頁籤", Number(item.ParentRowId ?? 0), {
            inputType: "selectSingle",
            editable: true,
        }),
        buildEditGridCell(SpecHomePage1821ShortcutModuleItemFields.Title, "標題", item.Title ?? "", { inputType: "text", editable: true, maxLength: 120 }),
        buildEditGridCell(SpecHomePage1821ShortcutModuleItemFields.SubTitle, "副標題", item.SubTitle ?? "", { inputType: "text", editable: true, maxLength: 160 }),
        buildEditGridCell(SpecHomePage1821ShortcutModuleItemFields.ModuleType, "模組類型", Number(item.ModuleType ?? HomePageModuleType.Announcement), {
            inputType: "selectSingle",
            editable: true,
            options: moduleTypeOptions,
        }),
        buildEditGridCell(SpecHomePage1821ShortcutModuleItemFields.ModuleOptions, "模組條件 JSON", normalizeOptionsText(item.ModuleOptions), {
            inputType: "textarea",
            editable: true,
            rows: 3,
            maxLength: 220,
        }),
        buildEditGridCell(SpecHomePage1821ShortcutModuleItemFields.MoreViewLink, "More View 連結", item.MoreViewLink ?? "", {
            inputType: "text",
            editable: true,
            maxLength: 500,
        }),
        buildEditGridCell(SpecHomePage1821ShortcutModuleItemFields.IsHide, "隱藏", Boolean(item.IsHide), { inputType: "checkboxSingle", editable: true }),
    ];
};

const toBannerDto = (data: HomePageSet, row: GridRow, index: number): Banner =>
{
    const file = toHomePageFileCellValue(getEditGridCellValue(row, SpecHomePage1821BannerFields.BannerFileId));
    return {
        HomePageId: getHomePageId(data),
        RowId: getGridRowId(row, index),
        RowNo: index + 1,
        BannerFileId: file.internalId ?? "",
        BannerFileDescription: getEditGridStringCellValue(row, SpecHomePage1821BannerFields.BannerFileDescription),
        Link: getEditGridStringCellValue(row, SpecHomePage1821BannerFields.Link),
        IsHide: Boolean(getEditGridCellValue(row, SpecHomePage1821BannerFields.IsHide)),
    };
};

const toShortcutDto = (data: HomePageSet, row: GridRow, index: number): Shortcut =>
{
    const iconFile = toHomePageFileCellValue(getEditGridCellValue(row, SpecHomePage1821ShortcutFields.IconFileId));
    const linkPic = toHomePageFileCellValue(getEditGridCellValue(row, SpecHomePage1821ShortcutFields.LinkPicId));
    const isLink = Boolean(getEditGridCellValue(row, SpecHomePage1821ShortcutFields.IsLink));

    return {
        HomePageId: getHomePageId(data),
        RowId: getGridRowId(row, index),
        RowNo: index + 1,
        Title: getEditGridStringCellValue(row, SpecHomePage1821ShortcutFields.Title),
        SubTitle: getEditGridStringCellValue(row, SpecHomePage1821ShortcutFields.SubTitle),
        IconFileId: iconFile.internalId ?? "",
        IconFileDescription: getEditGridStringCellValue(row, SpecHomePage1821ShortcutFields.IconFileDescription),
        IsLink: isLink,
        Link: isLink ? getEditGridStringCellValue(row, SpecHomePage1821ShortcutFields.Link) : "",
        LinkPicId: isLink ? linkPic.internalId ?? "" : "",
        IsHide: Boolean(getEditGridCellValue(row, SpecHomePage1821ShortcutFields.IsHide)),
    };
};

const toModuleItemDto = (data: HomePageSet, row: GridRow, index: number): ShortcutModuleItem =>
{
    return {
        HomePageId: getHomePageId(data),
        ParentRowId: getEditGridNumberCellValue(row, SpecHomePage1821ShortcutModuleItemFields.ParentRowId, 0),
        RowId: getGridRowId(row, index),
        RowNo: index + 1,
        Title: getEditGridStringCellValue(row, SpecHomePage1821ShortcutModuleItemFields.Title),
        SubTitle: getEditGridStringCellValue(row, SpecHomePage1821ShortcutModuleItemFields.SubTitle),
        ModuleType: getEditGridNumberCellValue(row, SpecHomePage1821ShortcutModuleItemFields.ModuleType, HomePageModuleType.Announcement),
        ModuleOptions: normalizeOptionsText(getEditGridStringCellValue(row, SpecHomePage1821ShortcutModuleItemFields.ModuleOptions)),
        MoreViewLink: getEditGridStringCellValue(row, SpecHomePage1821ShortcutModuleItemFields.MoreViewLink),
        IsHide: Boolean(getEditGridCellValue(row, SpecHomePage1821ShortcutModuleItemFields.IsHide)),
    };
};

const normalizeModuleItemRowNo = (items: ShortcutModuleItem[]): ShortcutModuleItem[] =>
{
    const rowNoByParent: Record<string, number> = {};
    return items.map(item =>
    {
        const parent = String(item.ParentRowId ?? 0);
        rowNoByParent[parent] = (rowNoByParent[parent] ?? 0) + 1;
        return { ...item, RowNo: rowNoByParent[parent] };
    });
};

const buildShortcutParentOptions = (shortcuts?: Shortcut[] | null) =>
{
    return sortHomePageRows(shortcuts ?? []).map((item, index) => ({
        label: `${index + 1}. ${item.Title || item.ShortcutCode || item.RowId || "未命名頁籤"}`,
        value: Number(item.RowId ?? index + 1),
    }));
};

const getDefaultParentRowId = (shortcuts?: Shortcut[] | null): number =>
{
    const first = sortHomePageRows(shortcuts ?? [])[0];
    return Number(first?.RowId ?? 0);
};

const getGridRowId = (row: GridRow, index: number): number =>
{
    const value = Number(row.RowId ?? row.rowId ?? row.rowid ?? index + 1);
    return Number.isFinite(value) && value > 0 ? value : index + 1;
};

const buildHomePageRowKey = (section: string, homePageId?: string | null, rowId?: number | null): string =>
{
    return `home-page-1821-${section}-${homePageId ?? "new"}-${rowId ?? 0}`;
};

const uploadHomePageFileValue = async (
    args: EditGridCellValueChangeArgs,
    handleFileChange: UploadFileHandler,
    descriptionField?: string,
): Promise<EditGridCellValueChangeResult> =>
{
    const current = toHomePageFileCellValue(args.value);
    const selectedFile = getSelectedHomePageFile(args.nextValue);
    if (!selectedFile?.file) return buildHomePageUploadChangeResult(buildEmptyHomePageFileCellValue(), descriptionField);

    let uploadedValue: HomePageGridFileValue = current;
    const originalName = getHomePageSelectedFileName(selectedFile);

    await handleFileChange([selectedFile.file], (internalId, uploadedName) =>
    {
        uploadedValue = buildUploadedHomePageFileCellValue(internalId, uploadedName || originalName);
    });

    return buildHomePageUploadChangeResult(uploadedValue, descriptionField);
};

const buildHomePageUploadChangeResult = (file: HomePageGridFileValue, descriptionField?: string): EditGridCellValueChangeResult =>
{
    if (!descriptionField) return { value: file };
    return { value: file, rowValues: { [descriptionField]: LibAttachment.getDisplayFileNameWithoutExtension(file.originalFileName ?? file.fileName) } };
};

const buildHomePageFileCellValue = (internalId?: string | null, originalName?: string | null, description?: string | null): HomePageGridFileValue =>
{
    const id = normalizeText(internalId);
    const name = String(originalName || description || id).trim();
    return {
        internalId: id,
        fileName: name,
        originalFileName: String(originalName ?? ""),
        url: getHomePageFilePreviewUrl(id),
        downloadUrl: getHomePageFileDownloadUrl(id),
    };
};

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

const buildEmptyHomePageFileCellValue = (): HomePageGridFileValue =>
{
    return { internalId: "", fileName: "", originalFileName: "" };
};

const isHomePageFileValue = (value: EditGridCellValue): value is HomePageGridFileValue =>
{
    return typeof value === "object" && value !== null && !Array.isArray(value) && "fileName" in value;
};

const getSelectedHomePageFile = (value: EditGridCellValue): HomePageGridFileValue | null =>
{
    if (!isHomePageFileValue(value)) return null;
    return value;
};

const getHomePageSelectedFileName = (file: HomePageGridFileValue): string =>
{
    return String(file.file?.name || file.fileName || "").trim();
};

const getDtoFileName = (file?: FileManageDto | null): string =>
{
    return normalizeText(file?.FileName);
};

const getHomePageFileDownloadUrl = (fileId?: string | null): string | undefined =>
{
    const id = normalizeText(fileId);
    return id ? `/Service/FileManagement/Server_Download/${encodeURIComponent(id)}` : undefined;
};
// #endregion
