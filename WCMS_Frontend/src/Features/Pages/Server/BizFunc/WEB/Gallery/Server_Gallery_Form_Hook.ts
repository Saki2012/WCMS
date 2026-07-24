import { CategoryAdapter } from "@/Features/Hooks/BizFunc/COMM/Category_Api";
import { TagAdapter } from "@/Features/Hooks/BizFunc/COMM/Tag_Api";
import { GalleryAdapter } from "@/Features/Hooks/BizFunc/WEB/Gallery_Api";
import type {
    ServerFormBinding,
    ServerFormDefaultRawData,
    ServerFormTemplate,
} from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Hook";
import type {
    ColumnConfig,
    EditGridCellRenderArgs,
    EditGridCellValue,
    EditGridCellValueChangeArgs,
    EditGridCellValueChangeHandler,
    EditGridCellValueChangeResult,
    EditGridFileValue,
    EditGridSubDetailRenderArgs,
    GridRow,
    IEditGridView_Style,
    RowCell,
} from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid_Data";
import {
    buildEditGridCell,
    getEditGridCellValue,
    getEditGridRowId,
    getEditGridStringCellValue,
    getSelectedEditGridFile,
    useEditGridBinding,
} from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid_Hook";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { getModelColumnDisplayName, getModelTableDisplayName } from "@/SysCore/Components/Grid/Grid_ModelDisplay";
import { buildSupportedLangOrder, type Lang, LangLabelMap, normalizeSupportedLang, SUPPORTED_LANGS, useEnsureLangDetails } from "@/SysCore/i18n/lang";
import type { ApiFormInitial } from "@/SysCore/Utils/API/APIAdapter";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { useFetchEnumOptions } from "@/SysCore/Utils/API/SystemAPI_Hook";
import { LibAttachment, LibText } from "@/SysCore/Utils/Library/LibData";
import { useUploadFile } from "@/SysCore/Utils/UI_Hooks/useUploadFile";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { GalleryInfoFields, GalleryPhotosFields, GalleryPhotosInfoFields, GalleryFields, PGID } from "@/types/SchemaFields";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

// #region Property
type GalleryFormModel = components["schemas"]["Gallery"];

type GalleryInfo = NonNullable<GalleryFormModel["_GalleryInfo"]>[number];

type GalleryPhoto = components["schemas"]["GalleryPhotos"];

type GalleryPhotoInfo = components["schemas"]["GalleryPhotosInfo"];

type UploadFileHandler = ReturnType<typeof useUploadFile>["handleFileChange"];

export type GalleryInfoRowKeys = Record<string, string | number | boolean | null | undefined>;

export type GalleryPhotoCellValue = EditGridFileValue & { internalId?: string; originalFileName?: string; };

export type GalleryPhotoGridRow = GridRow & { GalleryId?: string | null; PhotoRowId?: number | null; };

export type GalleryPhotoInfoGridRow = GridRow & { GalleryId?: string | null; ParentRowId?: number | null; InfoRowId?: number | null; };

export interface UseGalleryFormTemplateOptions
{
    /** 目前語系 */
    lang: Lang;

    /** 後台主題設定 */
    theme: IBETheme;

    /** 資料 internalId，空值代表新增 */
    internalId: string;

    /** 新增模式預設資料 */
    emptyData: GalleryFormModel;

    /** Form Template 標準動作設定 */
    actionsOpt: GalleryFormActionsOpt;
}

export interface UseGalleryInfoTabsOptions
{
    /** 新版 Form Template 提供的資料 binding */
    binding: ServerFormBinding<GalleryFormModel>;

    /** 目前語系，會優先排在第一個 Tab */
    lang: Lang;
}

export interface UseGalleryPhotoEditGridOptions
{
    /** 新版 Form Template 提供的資料 binding */
    binding: ServerFormBinding<GalleryFormModel>;

    /** EditGrid UI 樣式，仍由 Comp 決定 */
    style: IEditGridView_Style;

    /** 相片預覽渲染，畫面職責留在 Comp */
    renderPicturePreview: (args: EditGridCellRenderArgs) => ReactNode;

    /** 封面選擇渲染，畫面職責留在 Comp */
    renderCoverSelector: (args: EditGridCellRenderArgs) => ReactNode;

    /** SubDetail 展開按鈕渲染，畫面職責留在 Comp */
    renderSubDetailToggle: (args: EditGridCellRenderArgs) => ReactNode;

    /** SubDetail 區塊渲染，畫面職責留在 Comp */
    renderSubDetail: (args: EditGridSubDetailRenderArgs) => ReactNode;

    /** 子明細展開列 key */
    expandedRowKey: string | null;

    /** 子明細編輯中時鎖住父層 */
    isSubDetailEditing: boolean;
}

export interface UseGalleryPhotoInfoEditGridOptions
{
    /** 新版 Form Template 提供的資料 binding */
    binding: ServerFormBinding<GalleryFormModel>;

    /** 目前相片 RowId，語系明細用它綁 ParentRowId */
    parentRowId: number;

    /** 目前語系，會優先排序 */
    lang: Lang;

    /** EditGrid UI 樣式，仍由 Comp 決定 */
    style: IEditGridView_Style;
}

export interface UseGalleryBatchPhotoUploadOptions
{
    /** 新版 Form Template 提供的資料 binding */
    binding: ServerFormBinding<GalleryFormModel>;
}

export interface GalleryInfoTabItem
{
    /** Tab key，給 TabContentComp 對應內容 */
    key: string;

    /** Tab 顯示文字 */
    label: string;

    /** Detail 原始 DTO */
    detail: GalleryInfo;

    /** Detail row keys，給 useSetTableField 綁定欄位 */
    rowKeys: GalleryInfoRowKeys;
}

export interface GalleryInfoTabsResult
{
    /** TabContentComp 使用的 tab item map */
    tabItems: Record<string, string>;

    /** Comp 渲染 Detail 欄位使用的 tab items */
    items: GalleryInfoTabItem[];
}

export interface GalleryUploadedPhoto
{
    /** 上傳後回傳的檔案 internalId */
    internalId: string;

    /** 使用者上傳時的原始檔名 */
    originalFileName: string;

    /** 不含副檔名的預設標題 */
    title: string;
}

export interface GalleryBatchPhotoUploadResult
{
    /** 使用者選取的批次檔案 */
    selectedFiles: File[];

    /** 是否正在批次上傳 */
    isUploading: boolean;

    /** 批次上傳錯誤 */
    error: string | null;

    /** 批次選檔 */
    setSelectedFiles: (files: File[]) => void;

    /** 清除批次選檔 */
    clearSelectedFiles: () => void;

    /** 上傳並新增相片資料 */
    uploadSelectedFiles: () => Promise<void>;
}

export type GalleryFormRefs = {
    /** 相簿類別選項 */
    categoryMap: Record<string, string>;

    /** 相簿標籤選項 */
    tagMap: Record<string, string>;

    /** 內容狀態選項 */
    statusOpts: Record<string, string>;
};

export type GalleryFormActionsOpt = {
    /** 儲存成功後要回到列表（或其他導頁） */
    onBackToList: () => void;
};

export type GalleryFormAdapter = {
    Gallery: ReturnType<typeof GalleryAdapter>;
    Category: ReturnType<typeof CategoryAdapter>;
    Tag: ReturnType<typeof TagAdapter>;
};
// #endregion

// #region Public
export const galleryEmptyData: GalleryFormModel = { GalleryId: "", _GalleryInfo: [], _GalleryPhotos: [] };

/** 單張相簿相片上傳限制。 */
export const GalleryPhotoUploadLimit = {
    accept: "image/*",
    multiple: false,
    maxFileCount: 1,
    maxFileSizeMB: 10,
} as const;

/** 批次相簿相片上傳限制。 */
export const GalleryBatchPhotoUploadLimit = {
    accept: "image/*",
    maxFileCount: 20,
    maxFileSizeMB: 10,
} as const;

export const GalleryPhotoSubDetailColumnKey = "__GalleryPhotosInfo";

export const GalleryPhotoCoverColumnKey = "__GalleryCover";

/** 建立 Gallery Form Template，統一交給 Server_FormTemplate 處理資料流程。 */
export const useGalleryFormTemplate = (
    opt: UseGalleryFormTemplateOptions,
): ServerFormTemplate<GalleryFormModel, GalleryFormAdapter, GalleryFormRefs, ServerFormDefaultRawData<GalleryFormModel, GalleryFormRefs>, GalleryFormActionsOpt> =>
{
    return useMemo(() =>
    {
        return {
            featureKey: "Gallery",
            theme: opt.theme,
            lang: opt.lang,
            internalId: opt.internalId,
            emptyData: opt.emptyData,
            actionsOpt: opt.actionsOpt,
            feature: {
                buildAdapter: buildGalleryFormAdapter,
                selectDataAdapter: adapter => adapter.Gallery,
                buildTitle: buildGalleryFormTitle,
                buildInitialData: buildGalleryInitialData,
                useReferenceData: ctx => useGalleryReferenceData({ ...ctx, lang: opt.lang }),
            },
        };
    }, [opt.actionsOpt, opt.emptyData, opt.internalId, opt.lang, opt.theme]);
};

/** 建立相簿語系 Tabs，避免 Comp 處理語系過濾與 Unknown fallback。 */
export const useGalleryInfoTabs = (opt: UseGalleryInfoTabsOptions): GalleryInfoTabsResult =>
{
    const details = opt.binding.data?._GalleryInfo;

    return useMemo(() =>
    {
        return buildGalleryInfoTabs(details ?? [], opt.lang);
    }, [details, opt.lang]);
};

/** 建立相片 EditGrid binding，Comp 只需掛載 EditGrid 與提供畫面 render。 */
export const useGalleryPhotoEditGrid = (opt: UseGalleryPhotoEditGridOptions) =>
{
    const uploadFile = useUploadFile({ enablePreview: false });
    const displayName = opt.binding.displayName;
    const columns = useMemo(() => buildGalleryPhotoColumns(displayName), [displayName]);
    const handlePictureValueChange = useCallback((args: EditGridCellValueChangeArgs) => uploadGalleryPhotoValue(args, uploadFile.handleFileChange, opt.binding), [
        opt.binding,
        uploadFile.handleFileChange,
    ]);

    return useEditGridBinding<GalleryFormModel, GalleryPhoto, GalleryPhotoGridRow>({
        binding: opt.binding,
        emptyData: galleryEmptyData,
        collectionName: GalleryFields._GalleryPhotos,
        columns,
        getItemRowId: photo => photo.RowId,
        sortItems: sortGalleryPhotos,
        createItem: ctx => buildNewGalleryPhotoItem(ctx.data, ctx.nextRowId, ctx.nextRowNo),
        toRow: (photo, index) => buildGalleryPhotoGridRow(photo, index, opt, handlePictureValueChange, displayName),
        toItem: (row, index, ctx) => toGalleryPhotoDto(ctx.data, row, index),
        beforeCommit: ctx => syncGalleryPhotoCommit(ctx.data, ctx.nextVisibleItems, ctx.rows),
        editGridProps: buildGalleryPhotoGridProps(opt.style, displayName, opt),
    });
};

/** 建立相片語系 SubDetail EditGrid binding，Comp 只需掛載 EditGrid。 */
export const useGalleryPhotoInfoEditGrid = (opt: UseGalleryPhotoInfoEditGridOptions) =>
{
    const displayName = opt.binding.displayName;
    const columns = useMemo(() => buildGalleryPhotoInfoColumns(displayName), [displayName]);

    return useEditGridBinding<GalleryFormModel, GalleryPhotoInfo, GalleryPhotoInfoGridRow>({
        binding: opt.binding,
        emptyData: galleryEmptyData,
        getItems: data => getGalleryPhotoInfos(data, opt.parentRowId),
        setItems: (data, items) => setGalleryPhotoInfos(data, opt.parentRowId, items),
        columns,
        getItemRowId: info => info.RowId,
        sortItems: infos => sortGalleryPhotoInfos(infos, opt.lang),
        createItem: ctx => buildNewGalleryPhotoInfoItem(ctx.data, opt.parentRowId, ctx.nextRowId, ctx.nextRowNo, opt.lang),
        toRow: (info, index) => buildGalleryPhotoInfoGridRow(info, index, displayName),
        toItem: (row, index, ctx) => toGalleryPhotoInfoDto(ctx.data, opt.parentRowId, row, index),
        editGridProps: buildGalleryPhotoInfoGridProps(opt.parentRowId, opt.style, displayName),
    });
};

/** 管理相簿封面選取，封面仍寫在 Header 的 CoverPicSrcId。 */
export const useGalleryCoverSelector = (binding: ServerFormBinding<GalleryFormModel>) =>
{
    const bindingSelected = normalizeGalleryCoverPicId(binding.data?.CoverPicSrcId);
    const [selected, setSelected] = useState<string | null>(bindingSelected);

    /** 後端資料或表單資料刷新時，同步目前封面狀態。 */
    useEffect(() =>
    {
        setSelected(bindingSelected);
    }, [bindingSelected]);

    /** 設定目前封面，先更新畫面，再寫回 Form data。 */
    const select = useCallback((picId: string) =>
    {
        const safePicId = normalizeGalleryCoverPicId(picId);
        setSelected(safePicId);
        setGalleryCoverPic(binding, safePicId);
    }, [binding]);

    return { selected, select };
};

/** 批次上傳相片，和 EditGrid 單筆新增按鈕分離，保留後續特殊處理空間。 */
export const useGalleryBatchPhotoUpload = (opt: UseGalleryBatchPhotoUploadOptions): GalleryBatchPhotoUploadResult =>
{
    const uploadFile = useUploadFile({ enablePreview: false });
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const clearSelectedFiles = useCallback(() => setSelectedFiles([]), []);
    const uploadSelectedFiles = useCallback(async () =>
    {
        await uploadGalleryBatchFiles({
            binding: opt.binding,
            files: selectedFiles,
            uploadFile: uploadFile.handleFileChange,
            setError,
            setIsUploading,
            clearSelectedFiles,
        });
    }, [clearSelectedFiles, opt.binding, selectedFiles, uploadFile.handleFileChange]);

    return { selectedFiles, isUploading, error, setSelectedFiles, clearSelectedFiles, uploadSelectedFiles };
};

/** 建立相片 CellValue，保留預覽 url 給 EditGrid readonly render 使用。 */
export const buildGalleryPhotoCellValue = (photo: GalleryPhoto): GalleryPhotoCellValue =>
{
    const internalId = photo.PicSrcId ?? "";

    return { internalId, fileName: internalId, originalFileName: "", url: getGalleryPhotoPreviewUrl(internalId) };
};

/** 上傳後建立新的相片 CellValue，欄位顯示原始檔名與 internalId。 */
export const buildUploadedGalleryPhotoCellValue = (internalId: string, originalName?: string): GalleryPhotoCellValue =>
{
    const safeOriginalName = originalName ?? "";

    return {
        internalId,
        fileName: buildGalleryPhotoFieldDisplayName(safeOriginalName, internalId),
        originalFileName: safeOriginalName,
        url: getGalleryPhotoPreviewUrl(internalId),
    };
};

/** 將 EditGrid 值正規化成相片 CellValue。 */
export const toGalleryPhotoCellValue = (value: EditGridCellValue): GalleryPhotoCellValue =>
{
    if (isGalleryPhotoCellValue(value)) return value;
    if (typeof value === "string") return { internalId: value, fileName: buildGalleryPhotoFieldDisplayName("", value), url: getGalleryPhotoPreviewUrl(value) };
    return { fileName: "", internalId: "" };
};

/** 取得相片預覽網址。 */
export const getGalleryPhotoPreviewUrl = (picId?: string | null): string | undefined =>
{
    const id = String(picId ?? "").trim();
    return id ? FileManagementAPI.get_Public_Preview_Url(id) ?? undefined : undefined;
};
// #endregion

// #region Private
/** 建立 Gallery Form 標題，功能名稱優先讀 ModelDisplayName。 */
const buildGalleryFormTitle = (ctx: { mode: "new" | "edit"; displayName: ModelDisplaySchema; }): string =>
{
    const modelTitle = getGalleryModelTitle(ctx.displayName, "相簿");
    return `${ctx.mode === "edit" ? "修改" : "新增"}${modelTitle}`;
};

/** 建立新增模式的 initial data，統一由 Feature Timing 交給 Template。 */
const buildGalleryInitialData = (ctx: { mode: "new" | "edit"; emptyData: GalleryFormModel; }): ApiFormInitial<GalleryFormModel> | undefined =>
{
    if (ctx.mode !== "new") return undefined;
    return { data: { args: "__new__", apiRes: { IsSuccess: true, Data: ctx.emptyData, SysMessage: [] } } };
};

/** 建立 Gallery Form 會使用到的 Adapter 群組。 */
const buildGalleryFormAdapter = (): GalleryFormAdapter =>
{
    return { Gallery: GalleryAdapter(), Category: CategoryAdapter(), Tag: TagAdapter() };
};

/** 取得 Header / Detail 需要的參照資料與語系明細補齊。 */
const useGalleryReferenceData = (
    ctx: { adapter: GalleryFormAdapter; binding: ServerFormDefaultRawData<GalleryFormModel, GalleryFormRefs>["formData"]; lang: Lang; },
) =>
{
    useEnsureGalleryLangDetails(ctx.binding, ctx.lang);

    const category = ctx.adapter.Category.hooks.useMapByProgId({ progId: PGID.Gallery, lang: ctx.lang });
    const tag = ctx.adapter.Tag.hooks.useMapByProgId({ progId: PGID.Gallery, lang: ctx.lang });
    const statusOpts = useContentStatusOptions();

    return useMemo(() =>
    {
        return {
            refs: { categoryMap: category.map ?? {}, tagMap: tag.map ?? {}, statusOpts: statusOpts.data },
            isLoading: Boolean(category.isLoading || tag.isLoading || statusOpts.isLoading),
            errors: [category.errorText, tag.errorText, statusOpts.error],
            refetchRefData: async () =>
            {
                await Promise.all([category.refetch(), tag.refetch()]);
            },
        };
    }, [
        category.errorText,
        category.isLoading,
        category.map,
        category.refetch,
        statusOpts.data,
        statusOpts.error,
        statusOpts.isLoading,
        tag.errorText,
        tag.isLoading,
        tag.map,
        tag.refetch,
    ]);
};

/** 載入 FormModel 後補齊各相片語系子明細。 */
const useEnsureGalleryPhotoInfos = (binding: ServerFormBinding<GalleryFormModel>, preferLang: Lang): void =>
{
    useEffect(() =>
    {
        binding.setFormData(prev =>
        {
            const photos = (prev._GalleryPhotos ?? []).map(photo => ensureGalleryPhotoLanguages(photo, prev.GalleryId));
            return { ...prev, _GalleryPhotos: sortGalleryPhotoLanguages(photos, preferLang) };
        });
    }, [binding.setFormData, preferLang]);
};

/** 依目前語系排序各相片語系子明細。 */
const sortGalleryPhotoLanguages = (photos: GalleryPhoto[], preferLang: Lang): GalleryPhoto[] =>
{
    return photos.map(photo => ({ ...photo, _GalleryPhotosInfo: sortGalleryPhotoInfos(photo._GalleryPhotosInfo ?? [], preferLang) }));
};

/** 取得 Gallery Model 顯示名稱，避免 Form 標題寫死功能名稱。 */
const getGalleryModelTitle = (displayName: ModelDisplaySchema, fallback: string): string =>
{
    return displayName.ModelDisplayName || fallback;
};

/** 補齊相簿與相片多語資料，避免語系 Tab / SubDetail 缺列。 */
const useEnsureGalleryLangDetails = (binding: ServerFormBinding<GalleryFormModel>, lang: Lang): void =>
{
    useEnsureLangDetails(binding, {
        detailName: GalleryFields._GalleryInfo,
        parentKeys: [GalleryInfoFields.GalleryId],
        langs: SUPPORTED_LANGS,
        preferFirstLang: lang,
    });
    useEnsureGalleryPhotoInfos(binding, lang);
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

/** 建立相簿語系分頁資料。 */
const buildGalleryInfoTabs = (details: GalleryInfo[], preferLang: Lang): GalleryInfoTabsResult =>
{
    const supportedDetails = filterSupportedGalleryInfoRows(details, preferLang);
    const tabItems = buildGalleryInfoTabItems(supportedDetails);

    return { tabItems, items: supportedDetails };
};

/** 依支援語系排序並過濾 Detail，避免無效語系產生 Unknown Tab。 */
const filterSupportedGalleryInfoRows = (details: GalleryInfo[], preferLang: Lang): GalleryInfoTabItem[] =>
{
    const detailMap = buildSupportedGalleryInfoMap(details);
    const langs = buildSupportedLangOrder(preferLang);

    return langs.map((lang, index) => buildGalleryInfoTabItem(detailMap.get(lang.toLowerCase()), index)).filter((item): item is GalleryInfoTabItem => Boolean(item));
};

/** 將有效語系 Detail 建成 Map，同語系只保留第一筆。 */
const buildSupportedGalleryInfoMap = (details: GalleryInfo[]): Map<string, GalleryInfo> =>
{
    return details.reduce<Map<string, GalleryInfo>>((map, detail) =>
    {
        const lang = normalizeSupportedLang(detail.Lang);
        if (!lang || map.has(lang)) return map;
        map.set(lang, detail);
        return map;
    }, new Map<string, GalleryInfo>());
};

/** 建立單一相簿語系 Tab 項目。 */
const buildGalleryInfoTabItem = (detail: GalleryInfo | undefined, index: number): GalleryInfoTabItem | null =>
{
    if (!detail) return null;
    const lang = normalizeSupportedLang(detail.Lang);
    if (!lang) return null;
    const key = LibText.Merge("_", true, detail.GalleryId, detail.RowId, lang);
    const label = LangLabelMap[lang] ?? lang;
    const rowKeys = buildGalleryInfoRowKeys(detail, index);
    return { key, label, detail, rowKeys };
};

/** 建立相簿語系 RowKeys，保留 null 主鍵並加入 Lang，避免 Template 寫入時新建無語系列。 */
const buildGalleryInfoRowKeys = (detail: GalleryInfo, index: number): GalleryInfoRowKeys =>
{
    const lang = normalizeSupportedLang(detail.Lang);
    return {
        [GalleryInfoFields.GalleryId]: toBindingRowKey(detail.GalleryId),
        [GalleryInfoFields.RowId]: toBindingRowKey(detail.RowId ?? index + 1),
        [GalleryInfoFields.Lang]: lang,
    };
};

/** 建立 GalleryInfo TabContentComp 需要的 item map。 */
const buildGalleryInfoTabItems = (items: GalleryInfoTabItem[]): Record<string, string> =>
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
    return value;
};

/** 建立相片 EditGrid 固定設定，Grid 標題優先讀 ModelDisplayName。 */
const buildGalleryPhotoGridProps = (style: IEditGridView_Style, displayName: ModelDisplaySchema, opt: UseGalleryPhotoEditGridOptions) =>
{
    const gridTitle = getGalleryTableTitle(displayName, GalleryFields._GalleryPhotos, "相片");

    return {
        title: gridTitle,
        ariaLabel: `${gridTitle}清單`,
        style,
        storageKey: "server-gallery-photo-grid",
        minTableWidth: 1180,
        maxVisibleRows: 5,
        disabled: opt.isSubDetailEditing,
        canAdd: true,
        canEdit: true,
        canDelete: true,
        canDrag: true,
        showRowNo: true,
        showOperationGuide: false,
        actionColumnTitle: "排序 / 操作",
        addButtonText: `新增${gridTitle}`,
        emptyText: `目前沒有${gridTitle}`,
        expandedRowKey: opt.expandedRowKey,
        subDetailRowClassName: "edit-grid-sub-detail-row",
        subDetailRender: opt.renderSubDetail,
    };
};

/** 建立相片語系 EditGrid 固定設定，語系列不開放新增刪除。 */
const buildGalleryPhotoInfoGridProps = (parentRowId: number, style: IEditGridView_Style, displayName: ModelDisplaySchema) =>
{
    const gridTitle = getGalleryTableTitle(displayName, GalleryPhotosFields._GalleryPhotosInfo, "相片語系明細");
    return {
        title: gridTitle,
        ariaLabel: `相片 ${parentRowId} ${gridTitle}`,
        style,
        storageKey: `server-gallery-photo-info-grid-${parentRowId}`,
        minTableWidth: 760,
        maxVisibleRows: 5,
        canAdd: false,
        canEdit: true,
        canDelete: false,
        canDrag: false,
        showRowNo: false,
        showOperationGuide: false,
        emptyText: `目前沒有${gridTitle}`,
    };
};

/** 依 Sort / RowId 排序相片。 */
const sortGalleryPhotos = (photos: GalleryPhoto[]): GalleryPhoto[] =>
{
    return [...photos].sort((a, b) => Number(a.Sort ?? a.RowId ?? 0) - Number(b.Sort ?? b.RowId ?? 0));
};

/** 依目前語系與支援語系順序排序相片語系資料。 */
const sortGalleryPhotoInfos = (infos: GalleryPhotoInfo[], preferLang: Lang): GalleryPhotoInfo[] =>
{
    const order = buildSupportedLangOrder(preferLang).map(lang => lang.toLowerCase());
    return [...infos].sort((a, b) => order.indexOf(String(a.Lang ?? "").toLowerCase()) - order.indexOf(String(b.Lang ?? "").toLowerCase()));
};

/** 建立相片 Grid 欄位設定，欄位名稱優先讀 ModelDisplayName。 */
const buildGalleryPhotoColumns = (displayName: ModelDisplaySchema): ColumnConfig[] =>
{
    const picTitle = getGalleryColumnTitle(displayName, GalleryFields._GalleryPhotos, GalleryPhotosFields.PicSrcId, "相片");
    const sortTitle = getGalleryColumnTitle(displayName, GalleryFields._GalleryPhotos, GalleryPhotosFields.Sort, "排序編號");

    return [
        {
            key: GalleryPhotosFields.PicSrcId,
            title: picTitle,
            width: 360,
            inputType: "file",
            editable: true,
            accept: GalleryPhotoUploadLimit.accept,
            multiple: GalleryPhotoUploadLimit.multiple,
            maxFileCount: GalleryPhotoUploadLimit.maxFileCount,
            maxFileSizeMB: GalleryPhotoUploadLimit.maxFileSizeMB,
        },
        { key: GalleryPhotoCoverColumnKey, title: "封面", width: 120, inputType: "readonly", editable: false },
        { key: GalleryPhotosFields.Sort, title: sortTitle, width: 120, inputType: "number", editable: true, min: 0 },
        { key: GalleryPhotoSubDetailColumnKey, title: "語系明細", width: 130, inputType: "readonly", editable: false },
    ];
};

/** 建立相片語系 Grid 欄位設定，欄位名稱優先讀 ModelDisplayName。 */
const buildGalleryPhotoInfoColumns = (displayName: ModelDisplaySchema): ColumnConfig[] =>
{
    const langTitle = getGalleryColumnTitle(displayName, GalleryPhotosFields._GalleryPhotosInfo, GalleryPhotosInfoFields.Lang, "語系");
    const titleTitle = getGalleryColumnTitle(displayName, GalleryPhotosFields._GalleryPhotosInfo, GalleryPhotosInfoFields.Title, "標題");
    const descTitle = getGalleryColumnTitle(displayName, GalleryPhotosFields._GalleryPhotosInfo, GalleryPhotosInfoFields.Description, "描述");

    return [{ key: GalleryPhotosInfoFields.Lang, title: langTitle, width: 110, inputType: "readonly", editable: false }, {
        key: GalleryPhotosInfoFields.Title,
        title: titleTitle,
        width: 240,
        inputType: "text",
        editable: true,
        maxLength: 200,
    }, { key: GalleryPhotosInfoFields.Description, title: descTitle, width: 360, inputType: "textarea", editable: true, rows: 3, maxLength: 500 }];
};

/** 將相片 DTO 轉成 EditGrid Row。 */
const buildGalleryPhotoGridRow = (
    photo: GalleryPhoto,
    index: number,
    opt: UseGalleryPhotoEditGridOptions,
    onPictureValueChange: EditGridCellValueChangeHandler,
    displayName: ModelDisplaySchema,
): GalleryPhotoGridRow =>
{
    const rowId = Number(photo.RowId ?? index + 1);
    const selectedCoverPicId = String(opt.binding.data?.CoverPicSrcId ?? "").trim();

    return {
        keyId: buildGalleryPhotoRowKey(photo, index),
        rowId,
        RowId: rowId,
        RowNo: photo.RowNo ?? index + 1,
        GalleryId: photo.GalleryId,
        PhotoRowId: rowId,
        cells: buildGalleryPhotoCells(photo, rowId, opt, onPictureValueChange, displayName, selectedCoverPicId),
    };
};

/** 將相片語系 DTO 轉成 EditGrid Row。 */
const buildGalleryPhotoInfoGridRow = (info: GalleryPhotoInfo, index: number, displayName: ModelDisplaySchema): GalleryPhotoInfoGridRow =>
{
    const rowId = Number(info.RowId ?? index + 1);

    return {
        keyId: buildGalleryPhotoInfoRowKey(info, index),
        rowId,
        RowId: rowId,
        RowNo: info.RowNo ?? index + 1,
        GalleryId: info.GalleryId,
        ParentRowId: info.ParentRowId,
        InfoRowId: rowId,
        cells: buildGalleryPhotoInfoCells(info, displayName),
    };
};

/** 建立相片列 cells，避免 Comp 介入 DTO 與 CellValue 轉換。 */
const buildGalleryPhotoCells = (
    photo: GalleryPhoto,
    rowId: number,
    opt: UseGalleryPhotoEditGridOptions,
    onPictureValueChange: EditGridCellValueChangeHandler,
    displayName: ModelDisplaySchema,
    selectedCoverPicId: string,
): RowCell[] =>
{
    const picTitle = getGalleryColumnTitle(displayName, GalleryFields._GalleryPhotos, GalleryPhotosFields.PicSrcId, "相片");
    const sortTitle = getGalleryColumnTitle(displayName, GalleryFields._GalleryPhotos, GalleryPhotosFields.Sort, "排序編號");

    return [
        buildEditGridCell(GalleryPhotosFields.PicSrcId, picTitle, buildGalleryPhotoCellValue(photo), {
            inputType: "file",
            editable: true,
            accept: GalleryPhotoUploadLimit.accept,
            multiple: GalleryPhotoUploadLimit.multiple,
            maxFileCount: GalleryPhotoUploadLimit.maxFileCount,
            maxFileSizeMB: GalleryPhotoUploadLimit.maxFileSizeMB,
            render: opt.renderPicturePreview,
            onValueChange: onPictureValueChange,
        }),
        buildEditGridCell(GalleryPhotoCoverColumnKey, "封面", selectedCoverPicId, {
            inputType: "readonly",
            editable: false,
            render: opt.renderCoverSelector,
        }),
        buildEditGridCell(GalleryPhotosFields.Sort, sortTitle, photo.Sort ?? rowId, { inputType: "number", editable: true, min: 0 }),
        buildEditGridCell(GalleryPhotoSubDetailColumnKey, "語系明細", "", { inputType: "readonly", editable: false, render: opt.renderSubDetailToggle }),
    ];
};

/** 建立相片語系列 cells，語系不可手動修改。 */
const buildGalleryPhotoInfoCells = (info: GalleryPhotoInfo, displayName: ModelDisplaySchema): RowCell[] =>
{
    const langTitle = getGalleryColumnTitle(displayName, GalleryPhotosFields._GalleryPhotosInfo, GalleryPhotosInfoFields.Lang, "語系");
    const titleTitle = getGalleryColumnTitle(displayName, GalleryPhotosFields._GalleryPhotosInfo, GalleryPhotosInfoFields.Title, "標題");
    const descTitle = getGalleryColumnTitle(displayName, GalleryPhotosFields._GalleryPhotosInfo, GalleryPhotosInfoFields.Description, "描述");

    return [
        buildEditGridCell(GalleryPhotosInfoFields.Lang, langTitle, info.Lang ?? "zh-tw", {
            inputType: "readonly",
            editable: false,
            render: args => getGalleryLangText(args.value),
        }),
        buildEditGridCell(GalleryPhotosInfoFields.Title, titleTitle, info.Title ?? "", { inputType: "text", editable: true, maxLength: 200 }),
        buildEditGridCell(GalleryPhotosInfoFields.Description, descTitle, info.Description ?? "", {
            inputType: "textarea",
            editable: true,
            rows: 3,
            maxLength: 500,
        }),
    ];
};

/** 取得子表顯示名稱，避免 Grid 標題寫死。 */
const getGalleryTableTitle = (displayName: ModelDisplaySchema, tableId: string, fallback: string): string =>
{
    return getModelTableDisplayName(displayName, tableId, fallback);
};

/** 依資料表與欄位代碼取得 ModelDisplayName 顯示文字。 */
const getGalleryColumnTitle = (displayName: ModelDisplaySchema, tableId: string, columnId: string, fallback: string): string =>
{
    return getModelColumnDisplayName(displayName, tableId, columnId, fallback);
};

/** 建立新相片 DTO，RowId 由共用 Hook 推算。 */
const buildNewGalleryPhotoItem = (data: GalleryFormModel, rowId: number, rowNo: number): GalleryPhoto =>
{
    return { GalleryId: data.GalleryId ?? "", RowId: rowId, RowNo: rowNo, PicSrcId: "", Sort: rowNo, _GalleryPhotosInfo: [] };
};

/** 建立新相片語系 DTO，通常只在特殊手動補列時使用。 */
const buildNewGalleryPhotoInfoItem = (data: GalleryFormModel, parentRowId: number, rowId: number, rowNo: number, lang: Lang): GalleryPhotoInfo =>
{
    return { GalleryId: data.GalleryId ?? "", ParentRowId: parentRowId, RowId: rowId, RowNo: rowNo, Lang: lang, Title: "", Description: "" };
};


/** 將相片 Grid Row 轉回 DTO，RowId 保持穩定，Sort 依目前畫面順序重算。 */
const toGalleryPhotoDto = (source: GalleryFormModel, row: GridRow, index: number): GalleryPhoto =>
{
    const photoValue = toGalleryPhotoCellValue(getEditGridCellValue(row, GalleryPhotosFields.PicSrcId));
    const rowId = getEditGridRowId(row, index);

    return {
        GalleryId: source.GalleryId ?? (row as GalleryPhotoGridRow).GalleryId ?? "",
        RowId: rowId,
        RowNo: index + 1,
        PicSrcId: photoValue.internalId ?? "",
        Sort: index + 1,
        _GalleryPhotosInfo: getGalleryPhotoInfos(source, rowId),
    };
};

/** 將相片語系 Grid Row 轉回 DTO。 */
const toGalleryPhotoInfoDto = (source: GalleryFormModel, parentRowId: number, row: GridRow, index: number): GalleryPhotoInfo =>
{
    return {
        GalleryId: source.GalleryId ?? (row as GalleryPhotoInfoGridRow).GalleryId ?? "",
        ParentRowId: parentRowId,
        RowId: getEditGridRowId(row, index),
        RowNo: index + 1,
        Lang: getEditGridStringCellValue(row, GalleryPhotosInfoFields.Lang) as components["schemas"]["LangCode"],
        Title: getNullableStringCellValue(row, GalleryPhotosInfoFields.Title),
        Description: getNullableStringCellValue(row, GalleryPhotosInfoFields.Description),
    };
};

/** 主相片 Commit 前補齊語系明細並同步封面。 */
const syncGalleryPhotoCommit = (data: GalleryFormModel, nextPhotos: GalleryPhoto[], rows: GridRow[]): GalleryPhoto[] =>
{
    const titled = nextPhotos.map((photo, index) => syncGalleryPhotoFromRow(data, photo, rows[index]));
    const header = syncGalleryCoverFromPhotos(data, titled);
    data.CoverPicSrcId = header.CoverPicSrcId;
    return titled;
};

/** 依 Grid Row 的檔名補齊單張相片語系標題。 */
const syncGalleryPhotoFromRow = (data: GalleryFormModel, photo: GalleryPhoto, row?: GridRow): GalleryPhoto =>
{
    const ensured = ensureGalleryPhotoLanguages(photo, data.GalleryId);
    if (!row) return ensured;
    const fileValue = toGalleryPhotoCellValue(getEditGridCellValue(row, GalleryPhotosFields.PicSrcId));
    const title = LibAttachment.getDisplayFileNameWithoutExtension(fileValue.originalFileName);
    if (!title) return ensured;
    return { ...ensured, _GalleryPhotosInfo: upsertGalleryPhotoInfos(ensured._GalleryPhotosInfo ?? [], data.GalleryId, Number(photo.RowId ?? 0), title) };
};

/** 若封面空白或指向不存在相片，改指向目前第一張相片。 */
const syncGalleryCoverFromPhotos = (header: GalleryFormModel, photos: GalleryPhoto[]): GalleryFormModel =>
{
    const currentCover = String(header.CoverPicSrcId ?? "").trim();
    if (currentCover && photos.some(photo => String(photo.PicSrcId ?? "") === currentCover)) return header;
    return { ...header, CoverPicSrcId: photos[0]?.PicSrcId ?? null };
};

/** 取得指定相片的語系子明細。 */
const getGalleryPhotoInfos = (data: GalleryFormModel, parentRowId: number): GalleryPhotoInfo[] =>
{
    const photo = data._GalleryPhotos?.find(item => Number(item.RowId ?? 0) === parentRowId);
    return photo?._GalleryPhotosInfo ?? [];
};

/** 寫回指定相片的語系子明細。 */
const setGalleryPhotoInfos = (data: GalleryFormModel, parentRowId: number, infos: GalleryPhotoInfo[]): GalleryFormModel =>
{
    const photos = (data._GalleryPhotos ?? []).map(photo => Number(photo.RowId ?? 0) === parentRowId ? { ...photo, _GalleryPhotosInfo: infos } : photo);
    return { ...data, _GalleryPhotos: photos };
};

/** 補齊單張相片缺少的支援語系。 */
const ensureGalleryPhotoLanguages = (photo: GalleryPhoto, galleryId?: string | null): GalleryPhoto =>
{
    const infos = photo._GalleryPhotosInfo ?? [];
    const existLangs = new Set(infos.map(info => String(info.Lang ?? "").toLowerCase()));
    const maxRowId = infos.reduce((max, info) => Math.max(max, Number(info.RowId ?? 0)), 0);
    const maxRowNo = infos.reduce((max, info) => Math.max(max, Number(info.RowNo ?? 0)), 0);
    const missing = SUPPORTED_LANGS.filter(lang => !existLangs.has(lang)).map((lang, index) => ({
        GalleryId: photo.GalleryId ?? galleryId ?? "",
        ParentRowId: photo.RowId,
        RowId: maxRowId + index + 1,
        RowNo: maxRowNo + index + 1,
        Lang: lang,
        Title: "",
        Description: "",
    }));
    return { ...photo, _GalleryPhotosInfo: [...infos, ...missing] };
};

/** 取得刪除目前列後的第一張相片 id，給封面 fallback 使用。 */
const getFirstOtherPhotoId = (photos: GalleryPhoto[], removedRowId: number): string | null =>
{
    return photos.find(photo => Number(photo.RowId ?? 0) !== removedRowId)?.PicSrcId ?? null;
};

/** 使用 EditGrid 內建 file 欄位選圖後，上傳並同步所有語系標題。 */
const uploadGalleryPhotoValue = async (
    args: EditGridCellValueChangeArgs,
    handleFileChange: UploadFileHandler,
    binding: ServerFormBinding<GalleryFormModel>,
): Promise<EditGridCellValueChangeResult> =>
{
    const current = toGalleryPhotoCellValue(args.value);
    const selectedFile = getSelectedEditGridFile(args.nextValue);
    const parentRowId = getEditGridRowId(args.row, args.rowIndex);

    if (!selectedFile?.file)
    {
        syncGalleryPhotoTitleByFileChange(binding, parentRowId, "");
        syncGalleryCoverByFileChange(binding, parentRowId, current.internalId, "");

        return { value: buildEmptyGalleryPhotoCellValue() };
    }

    let uploadedValue: GalleryPhotoCellValue = current;
    const selectedOriginalName = getSelectedGalleryPhotoName(selectedFile);

    await handleFileChange([selectedFile.file], (internalId, originalName) =>
    {
        uploadedValue = buildUploadedGalleryPhotoCellValue(internalId, originalName || selectedOriginalName);
    });

    const title = LibAttachment.getDisplayFileNameWithoutExtension(uploadedValue.originalFileName);

    syncGalleryPhotoTitleByFileChange(binding, parentRowId, title);
    syncGalleryCoverByFileChange(binding, parentRowId, current.internalId, uploadedValue.internalId ?? "");

    return { value: uploadedValue };
};

/** 依相片 file 異動同步所有語系標題。 */
const syncGalleryPhotoTitleByFileChange = (
    binding: ServerFormBinding<GalleryFormModel>,
    parentRowId: number,
    title: string,
): void =>
{
    binding.setFormData(prev => syncGalleryPhotoTitleByFileChangeToData(prev ?? galleryEmptyData, parentRowId, title));
};

/** 寫入相片語系標題，清除 file 時也同步清空標題。 */
const syncGalleryPhotoTitleByFileChangeToData = (
    data: GalleryFormModel,
    parentRowId: number,
    title: string,
): GalleryFormModel =>
{
    const photos = (data._GalleryPhotos ?? []).map(photo =>
    {
        if (Number(photo.RowId ?? 0) !== parentRowId) return photo;
        const infos = upsertGalleryPhotoInfos(photo._GalleryPhotosInfo ?? [], data.GalleryId, parentRowId, title);
        return { ...photo, _GalleryPhotosInfo: infos };
    });
    return { ...data, _GalleryPhotos: photos };
};

/** 依相片 file 異動同步封面欄位。 */
const syncGalleryCoverByFileChange = (
    binding: ServerFormBinding<GalleryFormModel>,
    parentRowId: number,
    oldPicId?: string | null,
    nextPicId?: string | null,
): void =>
{
    binding.setFormData(prev => syncGalleryCoverByFileChangeToData(prev ?? galleryEmptyData, parentRowId, oldPicId, nextPicId));
};

/** 若目前封面是被清除或替換的相片，封面也要一起更新。 */
const syncGalleryCoverByFileChangeToData = (
    data: GalleryFormModel,
    parentRowId: number,
    oldPicId?: string | null,
    nextPicId?: string | null,
): GalleryFormModel =>
{
    const currentCover = String(data?.CoverPicSrcId ?? "").trim();
    const oldId = String(oldPicId ?? "").trim();
    const nextId = String(nextPicId ?? "").trim();

    if (!currentCover || currentCover !== oldId) return data;

    return { ...data, CoverPicSrcId: nextId || getFirstOtherPhotoId(data._GalleryPhotos ?? [], parentRowId) };
};

/** 批次上傳所有選取檔案，成功後一次寫入 Form data。 */
const uploadGalleryBatchFiles = async (
    opt: {
        binding: ServerFormBinding<GalleryFormModel>;
        files: File[];
        uploadFile: UploadFileHandler;
        setError: (error: string | null) => void;
        setIsUploading: (isUploading: boolean) => void;
        clearSelectedFiles: () => void;
    },
): Promise<void> =>
{
    if (opt.files.length === 0) return;

    try
    {
        opt.setError(null);
        opt.setIsUploading(true);
        const uploaded = await uploadGalleryFilesSequentially(opt.files, opt.uploadFile);
        appendGalleryUploadedPhotos(opt.binding, uploaded);
        opt.clearSelectedFiles();
    } catch (error)
    {
        const err = error as Error;
        opt.setError(err?.message ?? String(error));
        throw error;
    } finally
    {
        opt.setIsUploading(false);
    }
};

/** 逐檔上傳圖片，保留每個檔案的原始檔名供 AA 標題使用。 */
const uploadGalleryFilesSequentially = async (files: File[], uploadFile: UploadFileHandler): Promise<GalleryUploadedPhoto[]> =>
{
    const result: GalleryUploadedPhoto[] = [];

    for (const file of files)
    {
        const uploaded = await uploadSingleGalleryFile(file, uploadFile);
        result.push(uploaded);
    }

    return result;
};

/** 上傳單一圖片並轉為 GalleryUploadedPhoto。 */
const uploadSingleGalleryFile = async (file: File, uploadFile: UploadFileHandler): Promise<GalleryUploadedPhoto> =>
{
    let uploadedId = "";
    const originalFileName = file.name;

    await uploadFile([file], (internalId) =>
    {
        uploadedId = internalId;
    });

    return { internalId: uploadedId, originalFileName, title: LibAttachment.getDisplayFileNameWithoutExtension(originalFileName) };
};

/** 將批次上傳結果追加成 GalleryPhotos 與 GalleryPhotosInfo。 */
const appendGalleryUploadedPhotos = (binding: ServerFormBinding<GalleryFormModel>, uploaded: GalleryUploadedPhoto[]): void =>
{
    binding.setFormData(prev => appendGalleryUploadedPhotosToData(prev ?? galleryEmptyData, uploaded));
};

/** 將批次圖片寫入資料，所有語系 Title 預設為檔案名稱。 */
const appendGalleryUploadedPhotosToData = (data: GalleryFormModel, uploaded: GalleryUploadedPhoto[]): GalleryFormModel =>
{
    const galleryId = data?.GalleryId;
    const photos = data._GalleryPhotos ?? [];
    const startRowId = getNextGalleryPhotoRowId(photos);
    const startRowNo = getNextGalleryPhotoRowNo(photos);
    const newPhotos = uploaded.map((item, index) => buildUploadedGalleryPhotoDto(galleryId, startRowId + index, startRowNo + index, item));
    const header = buildGalleryHeaderWithCover(data, uploaded[0]?.internalId ?? "");
    return { ...header, _GalleryPhotos: [...data._GalleryPhotos ?? [], ...newPhotos] };
};

/** 建立批次上傳後的相片 DTO。 */
const buildUploadedGalleryPhotoDto = (galleryId: string | null | undefined, rowId: number, rowNo: number, item: GalleryUploadedPhoto): GalleryPhoto =>
{
    return { GalleryId: galleryId ?? "", RowId: rowId, RowNo: rowNo, PicSrcId: item.internalId, Sort: rowNo, _GalleryPhotosInfo: buildGalleryPhotoInfosForTitle(galleryId, rowId, item.title) };
};

/** 若目前尚未設定封面，使用本次上傳的第一張圖當封面。 */
const buildGalleryHeaderWithCover = (header: GalleryFormModel, picId: string): GalleryFormModel =>
{
    if (!picId || header.CoverPicSrcId) return header;
    return { ...header, CoverPicSrcId: picId };
};

/** 正規化封面圖片 id，空值轉成 null。 */
const normalizeGalleryCoverPicId = (picId?: string | null): string | null =>
{
    const safePicId = String(picId ?? "").trim();
    return safePicId || null;
};

/** 直接指定相簿封面圖片。 */
const setGalleryCoverPic = (binding: ServerFormBinding<GalleryFormModel>, picId: string | null): void =>
{
    binding.setFormData(prev =>
    {
        const data = prev ?? galleryEmptyData;
        return { ...data, CoverPicSrcId: picId };
    });
};

/** 建立所有支援語系的相片標題資料。 */
const buildGalleryPhotoInfosForTitle = (galleryId: string | null | undefined, parentRowId: number, title: string): GalleryPhotoInfo[] =>
{
    return SUPPORTED_LANGS.map((lang, index) => ({
        GalleryId: galleryId ?? "",
        ParentRowId: parentRowId,
        RowId: index + 1,
        RowNo: index + 1,
        Lang: lang,
        Title: title,
        Description: "",
    }));
};

/** 更新或補齊某張相片所有語系標題。 */
const upsertGalleryPhotoInfos = (infos: GalleryPhotoInfo[], galleryId: string | null | undefined, parentRowId: number, title: string): GalleryPhotoInfo[] =>
{
    const otherInfos = infos.filter(info => Number(info.ParentRowId ?? 0) !== parentRowId);
    const currentInfos = infos.filter(info => Number(info.ParentRowId ?? 0) === parentRowId);
    const nextInfos = SUPPORTED_LANGS.map((lang, index) => buildGalleryPhotoInfoWithTitle(currentInfos, galleryId, parentRowId, lang, index, title));

    return [...otherInfos, ...nextInfos];
};

/** 建立或更新單一語系標題，描述欄位保留既有值。 */
const buildGalleryPhotoInfoWithTitle = (
    infos: GalleryPhotoInfo[],
    galleryId: string | null | undefined,
    parentRowId: number,
    lang: Lang,
    index: number,
    title: string,
): GalleryPhotoInfo =>
{
    const exist = infos.find(info => String(info.Lang ?? "").toLowerCase() === lang.toLowerCase());
    return { ...(exist ?? {}), GalleryId: exist?.GalleryId ?? galleryId ?? "", ParentRowId: parentRowId, RowId: exist?.RowId ?? index + 1, RowNo: index + 1, Lang: lang, Title: title };
};

/** 取得下一個相片 RowId。 */
const getNextGalleryPhotoRowId = (photos: GalleryPhoto[]): number =>
{
    return photos.reduce((max, photo) => Math.max(max, Number(photo.RowId ?? 0)), 0) + 1;
};

/** 取得下一個相片 RowNo，避免刪除後把 RowNo 當成穩定主鍵。 */
const getNextGalleryPhotoRowNo = (photos: GalleryPhoto[]): number =>
{
    return photos.reduce((max, photo) => Math.max(max, Number(photo.RowNo ?? 0)), 0) + 1;
};

/** 取得本次選圖的原始檔名，避免上傳 callback 未帶檔名時只剩 internalId。 */
const getSelectedGalleryPhotoName = (file: EditGridFileValue): string =>
{
    return String(file.file?.name || file.fileName || "").trim();
};

/** 建立空相片值，用於使用者清除 file 欄位。 */
const buildEmptyGalleryPhotoCellValue = (): GalleryPhotoCellValue =>
{
    return { fileName: "", internalId: "", originalFileName: "" };
};

/** 判斷是否為相片 CellValue。 */
const isGalleryPhotoCellValue = (value: EditGridCellValue): value is GalleryPhotoCellValue =>
{
    return typeof value === "object" && value !== null && "fileName" in value;
};

/** 建立相片欄位顯示文字：原始檔名 (internalId)。 */
const buildGalleryPhotoFieldDisplayName = (originalName?: string | null, internalId?: string | null): string =>
{
    const name = String(originalName ?? "").trim();
    const id = String(internalId ?? "").trim();
    if (name && id) return `${name} (${id})`;
    return name || id;
};

/** 建立相片 Row key。 */
const buildGalleryPhotoRowKey = (photo: GalleryPhoto, index: number): string =>
{
    return `gallery-photo-${photo.GalleryId ?? "new"}-${photo.RowId ?? index + 1}`;
};

/** 建立相片語系 Row key。 */
const buildGalleryPhotoInfoRowKey = (info: GalleryPhotoInfo, index: number): string =>
{
    return `gallery-photo-info-${info.GalleryId ?? "new"}-${info.ParentRowId ?? 0}-${info.RowId ?? index + 1}`;
};

/** 取得 nullable 字串 cell 值，空字串會轉成 null。 */
const getNullableStringCellValue = (row: GridRow, key: string): string | null =>
{
    const value = getEditGridStringCellValue(row, key).trim();
    return value.length > 0 ? value : null;
};

/** 取得語系顯示文字。 */
const getGalleryLangText = (value: EditGridCellValue): string =>
{
    const lang = String(value ?? "") as Lang;
    return LangLabelMap[lang] ?? String(value ?? "");
};
// #endregion
