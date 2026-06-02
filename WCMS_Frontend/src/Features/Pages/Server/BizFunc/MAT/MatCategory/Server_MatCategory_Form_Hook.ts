import { MatCategoryAdapter } from "@/Features/Hooks/BizFunc/MAT/MatCategory_Api";
import type {
    ServerFormBinding,
    ServerFormDefaultRawData,
    ServerFormTemplate,
} from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Hook";
import type {
    ColumnConfig,
    EditGridCellRenderArgs,
    EditGridCellValue,
    GridRow,
    IEditGridView_Style,
    RowCell,
} from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid_Data";
import {
    buildEditGridCell,
    getEditGridRowId,
    getEditGridStringCellValue,
    useEditGridBinding,
} from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid_Hook";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { type Lang, LangLabelMap, useEnsureLangDetails } from "@/SysCore/i18n/lang";
import type { ApiFormInitial } from "@/SysCore/Utils/API/APIAdapter";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import {
    CategoryDataSetFields,
    CategoryFields,
    MatCategoryDataSetFields,
    MatCategoryInfoFieldDisplayFields,
    MatCategoryInfoFieldFields,
    type PGID,
} from "@/types/SchemaFields";
import type { ReactNode } from "react";
import { useEffect, useMemo } from "react";

// #region Property
type MatCategorySet = components["schemas"]["MatCategoryDataSet_DTO"];
type MatCategoryInfoField = components["schemas"]["MatCategoryInfoField_DTO"];
type MatCategoryInfoFieldDisplay = components["schemas"]["MatCategoryInfoFieldDisplay_DTO"];

export interface UseMatCategoryFormTemplateOptions
{
    /** 目前語系 */
    lang: Lang;

    /** 後台主題設定 */
    theme: IBETheme;

    /** 資料 internalId，空值代表新增 */
    internalId: string;

    /** 新增模式預設資料 */
    emptyData: MatCategorySet;

    /** 舊 Route 傳入的功能標題，ModelDisplayName 無資料時才 fallback */
    title?: string;

    /** Form Template 標準動作設定 */
    actionsOpt: MatCategoryFormActionsOpt;
}

export interface UseMatCategoryInfoFieldEditGridOptions
{
    /** 新版 Form Template 提供的資料 binding */
    binding: ServerFormBinding<MatCategorySet>;

    /** EditGrid UI 樣式，仍由 Comp 決定 */
    style: IEditGridView_Style;

    /** 子明細是否正在編輯，用於鎖住父層 Grid */
    isSubDetailEditing: boolean;

    /** 目前展開的子明細 row key */
    expandedRowKey: string | null;

    /** 子明細展開列渲染 */
    renderSubDetail: (args: { row: GridRow; rowIndex: number; rowKey: string; disabled: boolean; }) => ReactNode;

    /** 子明細切換按鈕渲染 */
    renderSubDetailToggle: (args: EditGridCellRenderArgs) => ReactNode;
}

export interface UseMatCategoryInfoFieldDisplayEditGridOptions
{
    /** 新版 Form Template 提供的資料 binding */
    binding: ServerFormBinding<MatCategorySet>;

    /** 父層物件欄位 RowId */
    parentRowId: number;

    /** 目前語系，會優先排序 */
    lang: Lang;

    /** EditGrid UI 樣式，仍由 Comp 決定 */
    style: IEditGridView_Style;

    /** 是否禁用子層 Grid */
    disabled?: boolean;
}

export interface MatCategoryInfoFieldGridRow extends GridRow
{
    /** 類別 Id */
    CategoryId?: string | null;

    /** 欄位設定 RowId */
    FieldRowId?: number;
}

export interface MatCategoryInfoFieldDisplayGridRow extends GridRow
{
    /** 類別 Id */
    CategoryId?: string | null;

    /** 父層欄位 RowId */
    ParentRowId?: number | null;

    /** 語系顯示資料 RowId */
    DisplayRowId?: number;
}

export type MatCategoryFormRefs = Record<string, never>;

export type MatCategoryFormActionsOpt = {
    /** 儲存成功後返回列表 */
    onBackToList: () => void;
};

export type MatCategoryFormAdapter = {
    /** 物件類別資料 Adapter */
    MatCategory: ReturnType<typeof MatCategoryAdapter>;
};

export const matCategoryEmptyData = (progId: PGID | string): MatCategorySet => ({
    Category: { ProgId: progId },
    CategoryDetail: [],
    MatCategoryInfoField: [],
    MatCategoryInfoFieldDisplay: [],
});

const MatCategoryInfoFieldSubDetailColumnKey = "__MatCategoryInfoFieldDisplay";
// #endregion

// #region Public
/** 建立 MatCategory Form Template，統一交給 Server_FormTemplate 處理資料流程。 */
export const useMatCategoryFormTemplate = (
    opt: UseMatCategoryFormTemplateOptions,
): ServerFormTemplate<
    MatCategorySet,
    MatCategoryFormAdapter,
    MatCategoryFormRefs,
    ServerFormDefaultRawData<MatCategorySet, MatCategoryFormRefs>,
    MatCategoryFormActionsOpt
> =>
{
    return useMemo(() =>
    {
        return {
            featureKey: "MatCategory",
            theme: opt.theme,
            lang: opt.lang,
            internalId: opt.internalId,
            emptyData: opt.emptyData,
            actionsOpt: opt.actionsOpt,
            feature: {
                buildAdapter: buildMatCategoryFormAdapter,
                selectDataAdapter: adapter => adapter.MatCategory,
                buildTitle: ctx => buildMatCategoryFormTitle(ctx, opt.title ?? "物件類別"),
                buildInitialData: buildMatCategoryInitialData,
                useReferenceData: ctx => useMatCategoryReferenceData({ ...ctx, lang: opt.lang }),
            },
        };
    }, [opt.actionsOpt, opt.emptyData, opt.internalId, opt.lang, opt.theme, opt.title]);
};

/** 建立物件欄位設定父層 EditGrid，Comp 只掛載 Grid 與子明細展開。 */
export const useMatCategoryInfoFieldEditGrid = (opt: UseMatCategoryInfoFieldEditGridOptions) =>
{
    const displayName = opt.binding.displayName;
    const columns = useMemo(() => buildMatCategoryInfoFieldColumns(displayName), [displayName]);

    return useEditGridBinding<MatCategorySet, MatCategoryInfoField, MatCategoryInfoFieldGridRow>({
        binding: opt.binding,
        emptyData: matCategoryEmptyData(getMatCategoryProgId(opt.binding)),
        collectionName: MatCategoryDataSetFields.MatCategoryInfoField,
        columns,
        getItemRowId: field => field.RowId,
        sortItems: sortMatCategoryInfoFields,
        createItem: ctx => buildNewMatCategoryInfoField(ctx.data, ctx.nextRowId),
        toRow: (field, index) => buildMatCategoryInfoFieldGridRow(field, index, opt, displayName),
        toItem: (row, index, ctx) => toMatCategoryInfoFieldDto(ctx.data, row, index),
        beforeCommit: ctx => syncMatCategoryInfoFieldCommit(ctx.data, ctx.nextVisibleItems),
        onDeleteRow: ctx => removeMatCategoryInfoFieldDisplayByRow(opt.binding, ctx.row),
        editGridProps: buildMatCategoryInfoFieldGridProps(opt.style, displayName, opt),
    });
};

/** 建立物件欄位語系顯示名稱 EditGrid，Comp 只掛載子層 Grid。 */
export const useMatCategoryInfoFieldDisplayEditGrid = (opt: UseMatCategoryInfoFieldDisplayEditGridOptions) =>
{
    const displayName = opt.binding.displayName;
    const columns = useMemo(() => buildMatCategoryInfoFieldDisplayColumns(displayName), [displayName]);

    return useEditGridBinding<MatCategorySet, MatCategoryInfoFieldDisplay, MatCategoryInfoFieldDisplayGridRow>({
        binding: opt.binding,
        emptyData: matCategoryEmptyData(getMatCategoryProgId(opt.binding)),
        collectionName: MatCategoryDataSetFields.MatCategoryInfoFieldDisplay,
        parent: buildMatCategoryInfoFieldDisplayParent(opt.parentRowId),
        columns,
        getItemRowId: display => display.RowId,
        sortItems: displays => sortMatCategoryInfoFieldDisplays(displays, opt.lang),
        createItem: ctx => buildNewMatCategoryInfoFieldDisplay(ctx.data, opt.parentRowId, ctx.nextRowId, opt.lang),
        toRow: (display, index) => buildMatCategoryInfoFieldDisplayGridRow(display, index, displayName),
        toItem: (row, index, ctx) => toMatCategoryInfoFieldDisplayDto(ctx.data, opt.parentRowId, row, index),
        editGridProps: buildMatCategoryInfoFieldDisplayGridProps(opt.parentRowId, opt.style, displayName, opt.disabled),
    });
};
// #endregion

// #region Timing
/** 建立 MatCategory Form 標題，功能名稱優先讀 ModelDisplayName。 */
const buildMatCategoryFormTitle = (ctx: { mode: "new" | "edit"; displayName: ModelDisplaySchema; }, fallbackTitle: string): string =>
{
    const modelTitle = getMatCategoryModelTitle(ctx.displayName, fallbackTitle);
    return `${ctx.mode === "edit" ? "修改" : "新增"}${modelTitle}`;
};

/** 建立新增模式的 initial data，統一由 Feature Timing 交給 Template。 */
const buildMatCategoryInitialData = (ctx: { mode: "new" | "edit"; emptyData: MatCategorySet; }): ApiFormInitial<MatCategorySet> | undefined =>
{
    if (ctx.mode !== "new") return undefined;
    return { data: { args: "__new__", apiRes: { IsSuccess: true, Data: ctx.emptyData, SysMessage: [] } } };
};

/** 建立 MatCategory Form 會使用到的 Adapter 群組。 */
const buildMatCategoryFormAdapter = (): MatCategoryFormAdapter =>
{
    return { MatCategory: MatCategoryAdapter() };
};

/** 取得 Header / Detail 需要的參照資料與語系補齊。 */
const useMatCategoryReferenceData = (ctx: { binding: ServerFormBinding<MatCategorySet>; lang: Lang; }) =>
{
    useEnsureMatCategoryDetails(ctx.binding, ctx.lang);
    useEnsureMatCategoryInfoFieldDisplays(ctx.binding, ctx.lang);

    return useMemo(() =>
    {
        return { refs: {}, isLoading: false, errors: [], refetchRefData: async () => Promise.resolve() };
    }, []);
};
// #endregion

// #region Private
/** 取得 MatCategory Model 顯示名稱，避免 Form 標題寫死功能名稱。 */
const getMatCategoryModelTitle = (displayName: ModelDisplaySchema, fallback: string): string =>
{
    return displayName.ModelDisplayName || fallback;
};

/** 補齊共用 Category 多語資料。 */
const useEnsureMatCategoryDetails = (binding: ServerFormBinding<MatCategorySet>, lang: Lang): void =>
{
    useEnsureLangDetails(binding, {
        headerName: CategoryDataSetFields.Category,
        detailName: CategoryDataSetFields.CategoryDetail,
        parentKeys: [CategoryFields.CategoryId],
        preferFirstLang: lang,
    });
};

/** 補齊物件欄位語系顯示資料，避免子層 Grid 缺列。 */
const useEnsureMatCategoryInfoFieldDisplays = (binding: ServerFormBinding<MatCategorySet>, preferLang: Lang): void =>
{
    useEffect(() =>
    {
        const data = binding.data;
        if (!data) return;

        const nextData = syncMatCategoryInfoFieldData(data, preferLang);
        if (nextData === data) return;

        binding.setFormData(() => nextData);
    }, [binding, binding.data, preferLang]);
};

/** 同步欄位設定 CategoryId 與缺少的語系顯示資料。 */
const syncMatCategoryInfoFieldData = (data: MatCategorySet, preferLang: Lang): MatCategorySet =>
{
    const categoryId = data.Category?.CategoryId ?? "";
    const fields = normalizeMatCategoryInfoFields(data.MatCategoryInfoField ?? [], categoryId);
    const displays = normalizeMatCategoryInfoFieldDisplays(data.MatCategoryInfoFieldDisplay ?? [], categoryId);
    const nextDisplays = syncMatCategoryInfoFieldDisplays(data, fields, displays, preferLang);

    if (fields === data.MatCategoryInfoField && nextDisplays === data.MatCategoryInfoFieldDisplay) return data;
    return { ...data, MatCategoryInfoField: fields, MatCategoryInfoFieldDisplay: nextDisplays };
};

/** 取得目前類別支援語系，沒有資料時以目前語系為優先。 */
const getMatCategoryLangs = (data: MatCategorySet | null | undefined, preferLang: Lang): Lang[] =>
{
    const langs = (data?.CategoryDetail ?? []).map(p => p.Lang as Lang).filter(Boolean);
    const uniqueLangs = Array.from(new Set([preferLang, ...langs]));
    return uniqueLangs.length > 0 ? uniqueLangs : [preferLang];
};

/** 建立物件欄位設定父層 Grid 固定設定。 */
const buildMatCategoryInfoFieldGridProps = (style: IEditGridView_Style, displayName: ModelDisplaySchema, opt: UseMatCategoryInfoFieldEditGridOptions) =>
{
    const gridTitle = getMatCategoryTableTitle(displayName, MatCategoryDataSetFields.MatCategoryInfoField, "物件欄位設定");

    return {
        title: gridTitle,
        ariaLabel: `${gridTitle}清單`,
        style,
        storageKey: "server-mat-category-info-field-grid",
        minTableWidth: 900,
        maxVisibleRows: 5,
        disabled: opt.isSubDetailEditing,
        canAdd: true,
        canEdit: true,
        canDelete: true,
        canDrag: false,
        showRowNo: true,
        showOperationGuide: false,
        actionColumnTitle: "操作",
        addButtonText: `新增${gridTitle}`,
        emptyText: `目前沒有${gridTitle}`,
        expandedRowKey: opt.expandedRowKey,
        subDetailRowClassName: "edit-grid-sub-detail-row",
        subDetailRender: opt.renderSubDetail,
    };
};

/** 建立語系顯示名稱 Grid 固定設定。 */
const buildMatCategoryInfoFieldDisplayGridProps = (parentRowId: number, style: IEditGridView_Style, displayName: ModelDisplaySchema, disabled?: boolean) =>
{
    const gridTitle = getMatCategoryTableTitle(displayName, MatCategoryDataSetFields.MatCategoryInfoFieldDisplay, "欄位顯示名稱");

    return {
        title: gridTitle,
        ariaLabel: `物件欄位 ${parentRowId} ${gridTitle}`,
        style,
        storageKey: `server-mat-category-info-field-display-grid-${parentRowId}`,
        minTableWidth: 700,
        maxVisibleRows: 5,
        disabled,
        canAdd: false,
        canEdit: true,
        canDelete: false,
        canDrag: false,
        showRowNo: false,
        showOperationGuide: false,
        emptyText: `目前沒有${gridTitle}`,
    };
};

/** 建立物件欄位設定欄位定義。 */
const buildMatCategoryInfoFieldColumns = (displayName: ModelDisplaySchema): ColumnConfig[] =>
{
    const fieldTitle = getMatCategoryColumnTitle(displayName, MatCategoryDataSetFields.MatCategoryInfoField, MatCategoryInfoFieldFields.Field, "欄位代碼");

    return [{ key: MatCategoryInfoFieldFields.Field, title: fieldTitle, width: 260, inputType: "text", editable: true, required: true, maxLength: 100 }, {
        key: MatCategoryInfoFieldSubDetailColumnKey,
        title: "語系明細",
        width: 130,
        inputType: "readonly",
        editable: false,
    }];
};

/** 建立物件欄位顯示名稱欄位定義。 */
const buildMatCategoryInfoFieldDisplayColumns = (displayName: ModelDisplaySchema): ColumnConfig[] =>
{
    return [{
        key: MatCategoryInfoFieldDisplayFields.Lang,
        title: getMatCategoryColumnTitle(displayName, MatCategoryDataSetFields.MatCategoryInfoFieldDisplay, MatCategoryInfoFieldDisplayFields.Lang, "語系"),
        width: 120,
        inputType: "readonly",
        editable: false,
    }, {
        key: MatCategoryInfoFieldDisplayFields.FieldDisplayName,
        title: getMatCategoryColumnTitle(
            displayName,
            MatCategoryDataSetFields.MatCategoryInfoFieldDisplay,
            MatCategoryInfoFieldDisplayFields.FieldDisplayName,
            "欄位顯示名稱",
        ),
        width: 320,
        inputType: "text",
        editable: true,
        required: true,
        maxLength: 200,
    }];
};

/** 將物件欄位設定 DTO 轉成 EditGrid Row。 */
const buildMatCategoryInfoFieldGridRow = (
    field: MatCategoryInfoField,
    index: number,
    opt: UseMatCategoryInfoFieldEditGridOptions,
    displayName: ModelDisplaySchema,
): MatCategoryInfoFieldGridRow =>
{
    const rowId = Number(field.RowId ?? index + 1);

    return {
        keyId: buildMatCategoryInfoFieldRowKey(field, index),
        rowId,
        RowId: rowId,
        RowNo: index + 1,
        CategoryId: field.CategoryId,
        FieldRowId: rowId,
        cells: buildMatCategoryInfoFieldCells(field, opt, displayName),
    };
};

/** 將物件欄位顯示 DTO 轉成 EditGrid Row。 */
const buildMatCategoryInfoFieldDisplayGridRow = (
    display: MatCategoryInfoFieldDisplay,
    index: number,
    displayName: ModelDisplaySchema,
): MatCategoryInfoFieldDisplayGridRow =>
{
    const rowId = Number(display.RowId ?? index + 1);

    return {
        keyId: buildMatCategoryInfoFieldDisplayRowKey(display, index),
        rowId,
        RowId: rowId,
        RowNo: index + 1,
        CategoryId: display.CategoryId,
        ParentRowId: display.ParentRowId,
        DisplayRowId: rowId,
        cells: buildMatCategoryInfoFieldDisplayCells(display, displayName),
    };
};

/** 建立物件欄位設定 Row cells。 */
const buildMatCategoryInfoFieldCells = (field: MatCategoryInfoField, opt: UseMatCategoryInfoFieldEditGridOptions, displayName: ModelDisplaySchema): RowCell[] =>
{
    const fieldTitle = getMatCategoryColumnTitle(displayName, MatCategoryDataSetFields.MatCategoryInfoField, MatCategoryInfoFieldFields.Field, "欄位代碼");

    return [
        buildEditGridCell(MatCategoryInfoFieldFields.Field, fieldTitle, field.Field ?? "", {
            inputType: "text",
            editable: true,
            required: true,
            maxLength: 100,
        }),
        buildEditGridCell(MatCategoryInfoFieldSubDetailColumnKey, "語系明細", "", {
            inputType: "readonly",
            editable: false,
            render: opt.renderSubDetailToggle,
        }),
    ];
};

/** 建立物件欄位顯示名稱 Row cells。 */
const buildMatCategoryInfoFieldDisplayCells = (display: MatCategoryInfoFieldDisplay, displayName: ModelDisplaySchema): RowCell[] =>
{
    return [
        buildEditGridCell(
            MatCategoryInfoFieldDisplayFields.Lang,
            getMatCategoryColumnTitle(displayName, MatCategoryDataSetFields.MatCategoryInfoFieldDisplay, MatCategoryInfoFieldDisplayFields.Lang, "語系"),
            display.Lang ?? "zh-tw",
            {
                inputType: "readonly",
                editable: false,
                render: args => getMatCategoryLangText(args.value),
            },
        ),
        buildEditGridCell(
            MatCategoryInfoFieldDisplayFields.FieldDisplayName,
            getMatCategoryColumnTitle(
                displayName,
                MatCategoryDataSetFields.MatCategoryInfoFieldDisplay,
                MatCategoryInfoFieldDisplayFields.FieldDisplayName,
                "欄位顯示名稱",
            ),
            display.FieldDisplayName ?? "",
            { inputType: "text", editable: true, required: true, maxLength: 200 },
        ),
    ];
};

/** 建立新物件欄位設定 DTO。 */
const buildNewMatCategoryInfoField = (data: MatCategorySet, rowId: number): MatCategoryInfoField =>
{
    return { CategoryId: data.Category?.CategoryId ?? "", RowId: rowId, Field: "" };
};

/** 建立新物件欄位顯示 DTO。 */
const buildNewMatCategoryInfoFieldDisplay = (data: MatCategorySet, parentRowId: number, rowId: number, lang: Lang): MatCategoryInfoFieldDisplay =>
{
    return { CategoryId: data.Category?.CategoryId ?? "", ParentRowId: parentRowId, RowId: rowId, Lang: lang, FieldDisplayName: "" };
};

/** 將欄位設定 Grid Row 轉回 DTO。 */
const toMatCategoryInfoFieldDto = (source: MatCategorySet, row: GridRow, index: number): MatCategoryInfoField =>
{
    return {
        CategoryId: source.Category?.CategoryId ?? (row as MatCategoryInfoFieldGridRow).CategoryId ?? "",
        RowId: getEditGridRowId(row, index),
        Field: getEditGridStringCellValue(row, MatCategoryInfoFieldFields.Field).trim(),
    };
};

/** 將欄位顯示名稱 Grid Row 轉回 DTO。 */
const toMatCategoryInfoFieldDisplayDto = (source: MatCategorySet, parentRowId: number, row: GridRow, index: number): MatCategoryInfoFieldDisplay =>
{
    return {
        CategoryId: source.Category?.CategoryId ?? (row as MatCategoryInfoFieldDisplayGridRow).CategoryId ?? "",
        ParentRowId: parentRowId,
        RowId: getEditGridRowId(row, index),
        Lang: getMatCategoryLangCellValue(row),
        FieldDisplayName: getEditGridStringCellValue(row, MatCategoryInfoFieldDisplayFields.FieldDisplayName).trim(),
    };
};

/** 主欄位 Commit 前同步 CategoryId、清理孤兒語系明細，並補齊缺少語系。 */
const syncMatCategoryInfoFieldCommit = (data: MatCategorySet, nextFields: MatCategoryInfoField[]): MatCategoryInfoField[] =>
{
    const categoryId = data.Category?.CategoryId ?? "";
    const normalizedFields = normalizeMatCategoryInfoFields(nextFields, categoryId);
    const normalizedDisplays = normalizeMatCategoryInfoFieldDisplays(data.MatCategoryInfoFieldDisplay ?? [], categoryId);
    data.MatCategoryInfoFieldDisplay = syncMatCategoryInfoFieldDisplays(data, normalizedFields, normalizedDisplays, getFirstMatCategoryLang(data));

    return normalizedFields;
};

/** 同步欄位顯示資料：移除孤兒、補齊語系。 */
const syncMatCategoryInfoFieldDisplays = (
    data: MatCategorySet,
    fields: MatCategoryInfoField[],
    displays: MatCategoryInfoFieldDisplay[],
    preferLang: Lang,
): MatCategoryInfoFieldDisplay[] =>
{
    const fieldKeys = new Set(fields.map(field => String(field.RowId ?? 0)));
    const keptDisplays = displays.filter(display => fieldKeys.has(String(display.ParentRowId ?? 0)));
    const missingDisplays = fields.flatMap(field => buildMissingMatCategoryInfoFieldDisplays(data, field, keptDisplays, preferLang));
    const hasRemovedOrphan = keptDisplays.length !== displays.length;

    if (!hasRemovedOrphan && missingDisplays.length === 0) return displays;
    return [...keptDisplays, ...missingDisplays];
};

/** 建立指定欄位缺少的語系顯示資料。 */
const buildMissingMatCategoryInfoFieldDisplays = (
    data: MatCategorySet,
    field: MatCategoryInfoField,
    displays: MatCategoryInfoFieldDisplay[],
    preferLang: Lang,
): MatCategoryInfoFieldDisplay[] =>
{
    const siblings = displays.filter(display => Number(display.ParentRowId ?? 0) === Number(field.RowId ?? 0));
    const existLangs = new Set(siblings.map(display => String(display.Lang ?? "").toLowerCase()));
    const maxRowId = siblings.reduce((max, display) => Math.max(max, Number(display.RowId ?? 0)), 0);
    const langs = getMatCategoryLangs(data, preferLang);

    return langs.filter(lang => !existLangs.has(lang.toLowerCase())).map((lang, index) => ({
        CategoryId: data.Category?.CategoryId ?? field.CategoryId ?? "",
        ParentRowId: field.RowId,
        RowId: maxRowId + index + 1,
        Lang: lang,
        FieldDisplayName: "",
    }));
};

/** 刪除欄位設定時，同步刪除該欄位語系顯示資料。 */
const removeMatCategoryInfoFieldDisplayByRow = (binding: ServerFormBinding<MatCategorySet>, row: GridRow): void =>
{
    const parentRowId = getEditGridRowId(row, 0);
    binding.setFormData(prev => removeMatCategoryInfoFieldDisplayFromData(prev ?? matCategoryEmptyData(getMatCategoryProgId(binding)), parentRowId));
};

/** 從資料中移除指定欄位的語系顯示資料。 */
const removeMatCategoryInfoFieldDisplayFromData = (data: MatCategorySet, parentRowId: number): MatCategorySet =>
{
    const nextDisplays = (data.MatCategoryInfoFieldDisplay ?? []).filter(display => Number(display.ParentRowId ?? 0) !== parentRowId);
    return { ...data, MatCategoryInfoFieldDisplay: nextDisplays };
};

/** 建立欄位顯示資料 parent 綁定，讓共用 Hook 自動過濾同欄位語系。 */
const buildMatCategoryInfoFieldDisplayParent = (parentRowId: number) =>
{
    return {
        field: MatCategoryInfoFieldDisplayFields.ParentRowId,
        value: parentRowId,
        compare: (itemValue: unknown, parentValue: string | number | null | undefined) => Number(itemValue ?? 0) === Number(parentValue ?? 0),
    };
};

/** 依 RowId 排序物件欄位設定。 */
const sortMatCategoryInfoFields = (fields: MatCategoryInfoField[]): MatCategoryInfoField[] =>
{
    return [...fields].sort((a, b) => Number(a.RowId ?? 0) - Number(b.RowId ?? 0));
};

/** 依目前語系與支援語系順序排序欄位顯示名稱。 */
const sortMatCategoryInfoFieldDisplays = (displays: MatCategoryInfoFieldDisplay[], preferLang: Lang): MatCategoryInfoFieldDisplay[] =>
{
    const order = [preferLang, ...Object.keys(LangLabelMap)].map(lang => lang.toLowerCase());
    return [...displays].sort((a, b) => order.indexOf(String(a.Lang ?? "").toLowerCase()) - order.indexOf(String(b.Lang ?? "").toLowerCase()));
};

/** 將欄位設定的 CategoryId 正規化成目前 Header CategoryId。 */
const normalizeMatCategoryInfoFields = (fields: MatCategoryInfoField[], categoryId: string): MatCategoryInfoField[] =>
{
    let isChanged = false;
    const nextFields = fields.map(field =>
    {
        if ((field.CategoryId ?? "") === categoryId) return field;
        isChanged = true;
        return { ...field, CategoryId: categoryId };
    });

    return isChanged ? nextFields : fields;
};

/** 將欄位顯示資料的 CategoryId 正規化成目前 Header CategoryId。 */
const normalizeMatCategoryInfoFieldDisplays = (displays: MatCategoryInfoFieldDisplay[], categoryId: string): MatCategoryInfoFieldDisplay[] =>
{
    let isChanged = false;
    const nextDisplays = displays.map(display =>
    {
        if ((display.CategoryId ?? "") === categoryId) return display;
        isChanged = true;
        return { ...display, CategoryId: categoryId };
    });

    return isChanged ? nextDisplays : displays;
};

/** 取得第一個可用語系作為補列預設。 */
const getFirstMatCategoryLang = (data: MatCategorySet): Lang =>
{
    return (data.CategoryDetail?.find(detail => Boolean(detail.Lang))?.Lang as Lang) ?? "zh-tw";
};

/** 從 binding 取得目前 ProgId，供 emptyData fallback 使用。 */
const getMatCategoryProgId = (binding: ServerFormBinding<MatCategorySet>): PGID | string =>
{
    return binding.data?.Category?.ProgId ?? "";
};

/** 取得子表顯示名稱，避免 Grid 標題寫死。 */
const getMatCategoryTableTitle = (displayName: ModelDisplaySchema, tableId: string, fallback: string): string =>
{
    const tableHit = displayName.Tables?.find(table => table.TableId === tableId);
    return tableHit?.TableDisplayName ?? fallback;
};

/** 依資料表與欄位代碼取得 ModelDisplayName 顯示文字。 */
const getMatCategoryColumnTitle = (displayName: ModelDisplaySchema, tableId: string, columnId: string, fallback: string): string =>
{
    const tables = displayName.Tables ?? [];
    const tableHit = tables.find(table => table.TableId === tableId);
    const columnHit = tableHit?.Columns?.find(column => column.ColumnId === columnId);
    const fallbackHit = tables.flatMap(table => table.Columns ?? []).find(column => column.ColumnId === columnId);

    return columnHit?.ColumnDisplayName ?? fallbackHit?.ColumnDisplayName ?? fallback;
};

/** 建立物件欄位設定 Row key。 */
const buildMatCategoryInfoFieldRowKey = (field: MatCategoryInfoField, index: number): string =>
{
    return LibMerge("_", true, "mat-category-field", field.CategoryId, field.RowId ?? index + 1);
};

/** 建立物件欄位顯示名稱 Row key。 */
const buildMatCategoryInfoFieldDisplayRowKey = (display: MatCategoryInfoFieldDisplay, index: number): string =>
{
    return LibMerge("_", true, "mat-category-display", display.CategoryId, display.ParentRowId, display.RowId ?? index + 1, display.Lang);
};

/** 取得語系欄位值。 */
const getMatCategoryLangCellValue = (row: GridRow): Lang =>
{
    const value = getEditGridStringCellValue(row, MatCategoryInfoFieldDisplayFields.Lang) as Lang;
    return value || "zh-tw";
};

/** 取得語系顯示文字。 */
const getMatCategoryLangText = (value: EditGridCellValue): string =>
{
    const lang = String(value ?? "") as Lang;
    return LangLabelMap[lang] ?? String(value ?? "");
};
// #endregion
