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
import { getModelColumnDisplayName, getModelTableDisplayName } from "@/SysCore/Components/Grid/Grid_ModelDisplay";
import { buildSupportedLangOrder, DefaultLang, type Lang, LangLabelMap, normalizeSupportedLang } from "@/SysCore/i18n/lang";
import type { ApiFormInitial } from "@/SysCore/Utils/API/APIAdapter";
import { LibText, LibType, Merge } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import {
    MatCategoryFormModelFields,
    MatCategoryInfoFieldDisplayFields,
    MatCategoryInfoFieldFields,
    type PGID,
} from "@/types/SchemaFields";
import type { ReactNode } from "react";
import { useEffect, useMemo } from "react";

// #region Property
type MatCategoryFormModel = components["schemas"]["MatCategoryFormModel"];

type CategoryDetail = components["schemas"]["CategoryDetail"];

type MatCategoryInfoField = components["schemas"]["MatCategoryInfoField"];

type MatCategoryInfoFieldDisplay = components["schemas"]["MatCategoryInfoFieldDisplay"];

export interface UseMatCategoryFormTemplateOptions
{
    /** 目前語系 */
    lang: Lang;

    /** 後台主題設定 */
    theme: IBETheme;

    /** 資料 internalId，空值代表新增 */
    internalId: string;

    /** 新增模式預設資料 */
    emptyData: MatCategoryFormModel;

    /** 舊 Route 傳入的功能標題，ModelDisplayName 無資料時才 fallback */
    title?: string;

    /** Form Template 標準動作設定 */
    actionsOpt: MatCategoryFormActionsOpt;
}

export interface UseMatCategoryInfoFieldEditGridOptions
{
    /** 新版 Form Template 提供的資料 binding */
    binding: ServerFormBinding<MatCategoryFormModel>;

    /** 目前語系，欄位名稱會優先顯示此語系 */
    lang: Lang;

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
    binding: ServerFormBinding<MatCategoryFormModel>;

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

    /** 父層列攜帶的巢狀語系顯示資料。 */
    InfoFieldDisplays?: MatCategoryInfoFieldDisplay[];
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

const MatCategoryInfoFieldTableId = MatCategoryFormModelFields.MatCategoryInfoField;
const MatCategoryInfoFieldDisplayTableId = MatCategoryInfoFieldFields._MatCategoryInfoFieldDisplay.replace(/^_/, "");
const MatCategoryInfoFieldDisplayNameColumnKey = "__MatCategoryInfoFieldDisplayName";
const MatCategoryInfoFieldDisplayNameColumnTitle = "【欄位名稱】";
const MatCategoryInfoFieldSubDetailColumnKey = "__MatCategoryInfoFieldDisplay";
// #endregion

// #region Public
/** 建立 MatCategory 新增模式預設 FormModel。 */
export const matCategoryEmptyData = (progId: PGID | string): MatCategoryFormModel => ({
    Category: { ProgId: progId, _CategoryDetail: [] },
    MatCategoryInfoField: [],
});

/** 建立 MatCategory Form Template，統一交給 Server_FormTemplate 處理資料流程。 */
export const useMatCategoryFormTemplate = (
    opt: UseMatCategoryFormTemplateOptions,
): ServerFormTemplate<
    MatCategoryFormModel,
    MatCategoryFormAdapter,
    MatCategoryFormRefs,
    ServerFormDefaultRawData<MatCategoryFormModel, MatCategoryFormRefs>,
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

    return useEditGridBinding<MatCategoryFormModel, MatCategoryInfoField, MatCategoryInfoFieldGridRow>({
        binding: opt.binding,
        emptyData: matCategoryEmptyData(opt.binding.data?.Category?.ProgId ?? ""),
        getItems: data => data.MatCategoryInfoField,
        setItems: syncMatCategoryInfoFieldCollection,
        columns,
        getItemRowId: field => field.RowId,
        sortItems: sortMatCategoryInfoFields,
        createItem: ctx => buildNewMatCategoryInfoField(ctx.data, ctx.nextRowId, ctx.nextRowNo, opt.lang),
        toRow: (field, index) => buildMatCategoryInfoFieldGridRow(field, index, opt, displayName),
        toItem: (row, index, ctx) => toMatCategoryInfoFieldModel(ctx.data, row, index, opt.lang),
        editGridProps: buildMatCategoryInfoFieldGridProps(opt.style, displayName, opt),
    });
};

/** 建立物件欄位語系顯示名稱 EditGrid，Comp 只掛載子層 Grid。 */
export const useMatCategoryInfoFieldDisplayEditGrid = (opt: UseMatCategoryInfoFieldDisplayEditGridOptions) =>
{
    const displayName = opt.binding.displayName;
    const columns = useMemo(() => buildMatCategoryInfoFieldDisplayColumns(displayName), [displayName]);

    return useEditGridBinding<MatCategoryFormModel, MatCategoryInfoFieldDisplay, MatCategoryInfoFieldDisplayGridRow>({
        binding: opt.binding,
        emptyData: matCategoryEmptyData(opt.binding.data?.Category?.ProgId ?? ""),
        getItems: data => getMatCategoryInfoFieldDisplays(data, opt.parentRowId),
        setItems: (data, items) => setMatCategoryInfoFieldDisplays(data, opt.parentRowId, items),
        columns,
        getItemRowId: display => display.RowId,
        sortItems: displays => sortMatCategoryInfoFieldDisplays(displays, opt.lang),
        createItem: ctx => buildNewMatCategoryInfoFieldDisplay(ctx.data, opt.parentRowId, ctx.nextRowId, ctx.nextRowNo, opt.lang),
        toRow: (display, index) => buildMatCategoryInfoFieldDisplayGridRow(display, index, displayName),
        toItem: (row, index, ctx) => toMatCategoryInfoFieldDisplayModel(ctx.data, opt.parentRowId, row, index),
        editGridProps: buildMatCategoryInfoFieldDisplayGridProps(opt.parentRowId, opt.style, displayName, opt.disabled),
    });
};
// #endregion

// #region Private
/** 建立 MatCategory Form 標題，功能名稱優先讀 ModelDisplayName。 */
const buildMatCategoryFormTitle = (ctx: { mode: "new" | "edit"; displayName: ModelDisplaySchema; }, fallbackTitle: string): string =>
{
    const modelTitle = getMatCategoryModelTitle(ctx.displayName, fallbackTitle);
    return `${ctx.mode === "edit" ? "修改" : "新增"}${modelTitle}`;
};

/** 建立新增模式的 initial data，統一由 Feature Timing 交給 Template。 */
const buildMatCategoryInitialData = (ctx: { mode: "new" | "edit"; emptyData: MatCategoryFormModel; }): ApiFormInitial<MatCategoryFormModel> | undefined =>
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
const useMatCategoryReferenceData = (ctx: { binding: ServerFormBinding<MatCategoryFormModel>; lang: Lang; }) =>
{
    useEnsureMatCategoryDetails(ctx.binding, ctx.lang);
    useEnsureMatCategoryInfoFieldDisplays(ctx.binding, ctx.lang);

    return useMemo(() =>
    {
        return { refs: {}, isLoading: false, errors: [], refetchRefData: async () => Promise.resolve() };
    }, []);
};

/** 取得 MatCategory Model 顯示名稱，避免 Form 標題寫死功能名稱。 */
const getMatCategoryModelTitle = (displayName: ModelDisplaySchema, fallback: string): string =>
{
    return displayName.ModelDisplayName || fallback;
};

/** 補齊內嵌 Category 多語明細。 */
const useEnsureMatCategoryDetails = (binding: ServerFormBinding<MatCategoryFormModel>, preferLang: Lang): void =>
{
    const setFormData = binding.setFormData;
    useEffect(() =>
    {
        setFormData(prev => ensureMatCategoryDetails(prev ?? matCategoryEmptyData(""), preferLang));
    }, [binding.data, preferLang, setFormData]);
};

/** 補齊物件欄位的語系顯示名稱並正規化 Graph 關聯。 */
const useEnsureMatCategoryInfoFieldDisplays = (binding: ServerFormBinding<MatCategoryFormModel>, preferLang: Lang): void =>
{
    const setFormData = binding.setFormData;
    useEffect(() =>
    {
        setFormData(prev => syncMatCategoryInfoFieldData(prev ?? matCategoryEmptyData(""), preferLang));
    }, [binding.data, preferLang, setFormData]);
};

/** 補齊 Category 支援語系並維持目前語系優先。 */
const ensureMatCategoryDetails = (data: MatCategoryFormModel, preferLang: Lang): MatCategoryFormModel =>
{
    const category = data.Category ?? {};
    const details = category._CategoryDetail ?? [];
    const normalized = normalizeMatCategoryDetails(details, category.CategoryId ?? "", preferLang);
    if (normalized === details && data.Category) return data;
    return { ...data, Category: { ...category, _CategoryDetail: normalized } };
};

/** 正規化 Category 多語明細並補上缺少語系。 */
const normalizeMatCategoryDetails = (details: CategoryDetail[], categoryId: string, preferLang: Lang): CategoryDetail[] =>
{
    const langs = buildSupportedLangOrder(preferLang);
    const existing = new Set(details.map(detail => String(detail.Lang ?? "").toLowerCase()));
    const maxRowId = details.reduce((max, detail) => Math.max(max, Number(detail.RowId ?? 0)), 0);
    const normalized = details.map((detail, index) => normalizeMatCategoryDetail(detail, categoryId, index + 1));
    const missing = langs.filter(lang => !existing.has(lang)).map((lang, index) => ({
        CategoryId: categoryId,
        RowId: maxRowId + index + 1,
        RowNo: normalized.length + index + 1,
        Lang: lang,
    }));
    const sorted = sortMatCategoryDetails([...normalized, ...missing], preferLang)
        .map((detail, index) => Number(detail.RowNo ?? 0) === index + 1 ? detail : { ...detail, RowNo: index + 1 });
    const isSame = missing.length === 0 && sorted.every((detail, index) => detail === details[index]);
    return isSame ? details : sorted;
};

/** 正規化單筆 Category 語系明細。 */
const normalizeMatCategoryDetail = (detail: CategoryDetail, categoryId: string, rowNo: number): CategoryDetail =>
{
    if ((detail.CategoryId ?? "") === categoryId && Number(detail.RowNo ?? 0) === rowNo) return detail;
    return { ...detail, CategoryId: categoryId, RowNo: rowNo };
};

/** 依目前語系排序 Category 語系明細。 */
const sortMatCategoryDetails = (details: CategoryDetail[], preferLang: Lang): CategoryDetail[] =>
{
    const order = buildSupportedLangOrder(preferLang);
    return [...details].sort((a, b) => order.indexOf(a.Lang as Lang) - order.indexOf(b.Lang as Lang));
};

/** 同步欄位設定與巢狀語系顯示名稱。 */
const syncMatCategoryInfoFieldData = (data: MatCategoryFormModel, preferLang: Lang): MatCategoryFormModel =>
{
    const fields = data.MatCategoryInfoField ?? [];
    const normalized = normalizeMatCategoryInfoFieldCollection(data, fields, preferLang);
    const isSame = normalized.every((field, index) => field === fields[index]);
    return isSame ? data : { ...data, MatCategoryInfoField: normalized };
};

/** 取得目前類別支援語系。 */
const getMatCategoryLangs = (data: MatCategoryFormModel | null | undefined, preferLang: Lang): Lang[] =>
{
    const detailLangs = (data?.Category?._CategoryDetail ?? []).map(detail => normalizeSupportedLang(detail.Lang as Lang)).filter((lang): lang is Lang => lang !== null);
    return Array.from(new Set([...buildSupportedLangOrder(preferLang), ...detailLangs]));
};

/** 建立物件欄位設定父層 Grid 固定設定。 */
const buildMatCategoryInfoFieldGridProps = (style: IEditGridView_Style, displayName: ModelDisplaySchema, opt: UseMatCategoryInfoFieldEditGridOptions) =>
{
    const gridTitle = getMatCategoryTableTitle(displayName, MatCategoryInfoFieldTableId, "物件欄位設定");

    return {
        title: gridTitle,
        ariaLabel: `${gridTitle}清單`,
        style,
        storageKey: "server-mat-category-info-field-grid",
        minTableWidth: 1100,
        maxVisibleRows: 5,
        disabled: opt.isSubDetailEditing,
        canAdd: true,
        canEdit: true,
        canDelete: true,
        canDrag: true,
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
    const gridTitle = getMatCategoryTableTitle(displayName, MatCategoryInfoFieldDisplayTableId, "欄位顯示名稱");

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
    const fieldTitle = getMatCategoryColumnTitle(displayName, MatCategoryInfoFieldTableId, MatCategoryInfoFieldFields.Field, "欄位代號");

    return [{
        key: MatCategoryInfoFieldFields.Field,
        title: fieldTitle,
        width: 220,
        inputType: "text",
        editable: true,
        required: true,
        maxLength: 100,
    }, {
        key: MatCategoryInfoFieldDisplayNameColumnKey,
        title: MatCategoryInfoFieldDisplayNameColumnTitle,
        minWidth: 260,
        inputType: "readonly",
        editable: false,
    }, {
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
        title: getMatCategoryColumnTitle(displayName, MatCategoryInfoFieldDisplayTableId, MatCategoryInfoFieldDisplayFields.Lang, "語系"),
        width: 120,
        inputType: "readonly",
        editable: false,
    }, {
        key: MatCategoryInfoFieldDisplayFields.FieldDisplayName,
        title: getMatCategoryColumnTitle(
            displayName,
            MatCategoryInfoFieldDisplayTableId,
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
    const rowNo = Number(field.RowNo ?? index + 1);

    return {
        keyId: buildMatCategoryInfoFieldRowKey(field, index),
        rowId,
        RowId: rowId,
        RowNo: rowNo,
        CategoryId: field.CategoryId,
        FieldRowId: rowId,
        InfoFieldDisplays: field._MatCategoryInfoFieldDisplay ?? [],
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
    const fieldTitle = getMatCategoryColumnTitle(displayName, MatCategoryInfoFieldTableId, MatCategoryInfoFieldFields.Field, "欄位代號");
    const rowId = LibType.toSafeNumber(field.RowId);
    return [
        buildEditGridCell(MatCategoryInfoFieldFields.Field, fieldTitle, field.Field ?? "", {
            inputType: "text",
            editable: true,
            required: true,
            maxLength: 100,
        }),
        buildEditGridCell(MatCategoryInfoFieldDisplayNameColumnKey, MatCategoryInfoFieldDisplayNameColumnTitle, getMatCategoryInfoFieldDisplayName(opt.binding.data, rowId, opt.lang), {
            inputType: "readonly",
            editable: false,
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
            getMatCategoryColumnTitle(displayName, MatCategoryInfoFieldDisplayTableId, MatCategoryInfoFieldDisplayFields.Lang, "語系"),
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
                MatCategoryInfoFieldDisplayTableId,
                MatCategoryInfoFieldDisplayFields.FieldDisplayName,
                "欄位顯示名稱",
            ),
            display.FieldDisplayName ?? "",
            { inputType: "text", editable: true, required: true, maxLength: 200 },
        ),
    ];
};

/** 建立新物件欄位設定 Model，並同步建立支援語系顯示名稱。 */
const buildNewMatCategoryInfoField = (
    data: MatCategoryFormModel,
    rowId: number,
    rowNo: number,
    preferLang: Lang,
): MatCategoryInfoField =>
{
    const categoryId = data.Category?.CategoryId ?? "";
    const nextDisplayRowId = getMaxMatCategoryDisplayRowId(data) + 1;
    const displays = getMatCategoryLangs(data, preferLang).map((lang, index) => ({
        CategoryId: categoryId,
        ParentRowId: rowId,
        RowId: nextDisplayRowId + index,
        RowNo: index + 1,
        Lang: lang,
        FieldDisplayName: "",
    }));
    return { CategoryId: categoryId, RowId: rowId, RowNo: rowNo, Field: "", _MatCategoryInfoFieldDisplay: displays };
};

/** 建立新物件欄位顯示名稱 Model。 */
const buildNewMatCategoryInfoFieldDisplay = (
    data: MatCategoryFormModel,
    parentRowId: number,
    rowId: number,
    rowNo: number,
    lang: Lang,
): MatCategoryInfoFieldDisplay =>
{
    return {
        CategoryId: data.Category?.CategoryId ?? "",
        ParentRowId: parentRowId,
        RowId: rowId,
        RowNo: rowNo,
        Lang: lang,
        FieldDisplayName: "",
    };
};

/** 將欄位設定 Grid Row 轉回 FormModel，保留巢狀語系明細。 */
const toMatCategoryInfoFieldModel = (
    source: MatCategoryFormModel,
    row: GridRow,
    index: number,
    preferLang: Lang,
): MatCategoryInfoField =>
{
    const rowId = getEditGridRowId(row, index);
    const gridRow = row as MatCategoryInfoFieldGridRow;
    const current = getMatCategoryInfoFieldByRowId(source, rowId);
    const displays = current?._MatCategoryInfoFieldDisplay
        ?? gridRow.InfoFieldDisplays
        ?? buildNewMatCategoryInfoField(source, rowId, index + 1, preferLang)._MatCategoryInfoFieldDisplay
        ?? [];
    return {
        ...current,
        CategoryId: source.Category?.CategoryId ?? gridRow.CategoryId ?? "",
        RowId: rowId,
        RowNo: index + 1,
        Field: getEditGridStringCellValue(row, MatCategoryInfoFieldFields.Field).trim(),
        _MatCategoryInfoFieldDisplay: displays,
    };
};

/** 將欄位顯示名稱 Grid Row 轉回巢狀 Model。 */
const toMatCategoryInfoFieldDisplayModel = (
    source: MatCategoryFormModel,
    parentRowId: number,
    row: GridRow,
    index: number,
): MatCategoryInfoFieldDisplay =>
{
    const rowId = getEditGridRowId(row, index);
    const current = getMatCategoryInfoFieldDisplays(source, parentRowId)
        .find(display => Number(display.RowId ?? 0) === rowId);
    return {
        ...current,
        CategoryId: source.Category?.CategoryId ?? (row as MatCategoryInfoFieldDisplayGridRow).CategoryId ?? "",
        ParentRowId: parentRowId,
        RowId: rowId,
        RowNo: index + 1,
        Lang: getMatCategoryLangCellValue(row),
        FieldDisplayName: getEditGridStringCellValue(row, MatCategoryInfoFieldDisplayFields.FieldDisplayName).trim(),
    };
};

/** 寫回物件欄位集合，移除被刪除欄位的巢狀語系資料。 */
const syncMatCategoryInfoFieldCollection = (data: MatCategoryFormModel, fields: MatCategoryInfoField[]): MatCategoryFormModel =>
{
    const normalized = normalizeMatCategoryInfoFieldCollection(data, fields, getFirstMatCategoryLang(data));
    return { ...data, MatCategoryInfoField: normalized };
};

/** 取得指定物件欄位的語系顯示名稱。 */
const getMatCategoryInfoFieldDisplays = (data: MatCategoryFormModel, parentRowId: number): MatCategoryInfoFieldDisplay[] =>
{
    return getMatCategoryInfoFieldByRowId(data, parentRowId)?._MatCategoryInfoFieldDisplay ?? [];
};

/** 寫回指定物件欄位的語系顯示名稱。 */
const setMatCategoryInfoFieldDisplays = (
    data: MatCategoryFormModel,
    parentRowId: number,
    displays: MatCategoryInfoFieldDisplay[],
): MatCategoryFormModel =>
{
    const categoryId = data.Category?.CategoryId ?? "";
    const fields = (data.MatCategoryInfoField ?? []).map(field =>
    {
        if (Number(field.RowId ?? 0) !== parentRowId) return field;
        const normalized = normalizeMatCategoryInfoFieldDisplayRows(displays, categoryId, parentRowId, getFirstMatCategoryLang(data));
        return { ...field, _MatCategoryInfoFieldDisplay: normalized };
    });
    return { ...data, MatCategoryInfoField: fields };
};

/** 依 RowId 取得物件欄位。 */
const getMatCategoryInfoFieldByRowId = (data: MatCategoryFormModel | undefined, rowId: number): MatCategoryInfoField | undefined =>
{
    return (data?.MatCategoryInfoField ?? []).find(field => Number(field.RowId ?? 0) === rowId);
};

/** 正規化完整物件欄位集合與所有巢狀顯示名稱。 */
const normalizeMatCategoryInfoFieldCollection = (
    data: MatCategoryFormModel,
    fields: MatCategoryInfoField[],
    preferLang: Lang,
): MatCategoryInfoField[] =>
{
    const categoryId = data.Category?.CategoryId ?? "";
    let nextDisplayRowId = getMaxMatCategoryDisplayRowId(data);
    return fields.map((field, index) =>
    {
        const rowId = Number(field.RowId ?? index + 1);
        const result = normalizeMatCategoryInfoFieldWithNextId(data, field, rowId, index + 1, preferLang, nextDisplayRowId);
        nextDisplayRowId = result.nextDisplayRowId;
        return result.field;
    });
};

/** 正規化單一物件欄位並回傳下一個顯示名稱 RowId。 */
const normalizeMatCategoryInfoFieldWithNextId = (
    data: MatCategoryFormModel,
    field: MatCategoryInfoField,
    rowId: number,
    rowNo: number,
    preferLang: Lang,
    currentDisplayRowId: number,
): { field: MatCategoryInfoField; nextDisplayRowId: number; } =>
{
    const categoryId = data.Category?.CategoryId ?? field.CategoryId ?? "";
    const normalized = normalizeMatCategoryInfoFieldDisplayRows(
        field._MatCategoryInfoFieldDisplay ?? [],
        categoryId,
        rowId,
        preferLang,
        currentDisplayRowId,
    );
    const nextDisplayRowId = normalized.reduce((max, display) => Math.max(max, Number(display.RowId ?? 0)), currentDisplayRowId);
    const isSame = field.CategoryId === categoryId
        && Number(field.RowId ?? 0) === rowId
        && Number(field.RowNo ?? 0) === rowNo
        && normalized === field._MatCategoryInfoFieldDisplay;
    const nextField = isSame ? field : { ...field, CategoryId: categoryId, RowId: rowId, RowNo: rowNo, _MatCategoryInfoFieldDisplay: normalized };
    return { field: nextField, nextDisplayRowId };
};

/** 正規化欄位顯示名稱的關聯鍵、排序與缺少語系。 */
const normalizeMatCategoryInfoFieldDisplayRows = (
    displays: MatCategoryInfoFieldDisplay[],
    categoryId: string,
    parentRowId: number,
    preferLang: Lang,
    currentMaxRowId?: number,
): MatCategoryInfoFieldDisplay[] =>
{
    const langs = buildSupportedLangOrder(preferLang);
    const existingLangs = new Set(displays.map(display => String(display.Lang ?? "").toLowerCase()));
    let nextRowId = currentMaxRowId ?? displays.reduce((max, display) => Math.max(max, Number(display.RowId ?? 0)), 0);
    const normalized = displays.map((display, index) => normalizeMatCategoryInfoFieldDisplay(display, categoryId, parentRowId, index + 1));
    const missing = langs.filter(lang => !existingLangs.has(lang)).map((lang) => ({
        CategoryId: categoryId,
        ParentRowId: parentRowId,
        RowId: ++nextRowId,
        RowNo: normalized.length + 1,
        Lang: lang,
        FieldDisplayName: "",
    }));
    const sorted = sortMatCategoryInfoFieldDisplays([...normalized, ...missing], preferLang)
        .map((display, index) => Number(display.RowNo ?? 0) === index + 1 ? display : { ...display, RowNo: index + 1 });
    const isSame = missing.length === 0 && sorted.every((display, index) => display === displays[index]);
    return isSame ? displays : sorted;
};

/** 正規化單筆欄位顯示名稱。 */
const normalizeMatCategoryInfoFieldDisplay = (
    display: MatCategoryInfoFieldDisplay,
    categoryId: string,
    parentRowId: number,
    rowNo: number,
): MatCategoryInfoFieldDisplay =>
{
    const isSame = (display.CategoryId ?? "") === categoryId
        && Number(display.ParentRowId ?? 0) === parentRowId
        && Number(display.RowNo ?? 0) === rowNo;
    return isSame ? display : { ...display, CategoryId: categoryId, ParentRowId: parentRowId, RowNo: rowNo };
};

/** 取得目前 FormModel 內最大的欄位顯示名稱 RowId。 */
const getMaxMatCategoryDisplayRowId = (data: MatCategoryFormModel): number =>
{
    return (data.MatCategoryInfoField ?? []).flatMap(field => field._MatCategoryInfoFieldDisplay ?? [])
        .reduce((max, display) => Math.max(max, Number(display.RowId ?? 0)), 0);
};

/** 取得父層欄位名稱，優先目前語系，找不到時回退 DefaultLang。 */
const getMatCategoryInfoFieldDisplayName = (data: MatCategoryFormModel | undefined, parentRowId: number, lang: Lang): string =>
{
    const displays = getMatCategoryInfoFieldDisplays(data ?? matCategoryEmptyData(""), parentRowId);
    const langs = buildMatCategoryInfoFieldDisplayNameLangs(lang);
    const names = langs.map(item => findMatCategoryInfoFieldDisplayName(displays, item));
    return LibText.getFirstNonEmptyText(...names);
};

/** 建立欄位名稱語系優先順序。 */
const buildMatCategoryInfoFieldDisplayNameLangs = (lang: Lang): Lang[] =>
{
    const langs = [normalizeSupportedLang(lang), normalizeSupportedLang(DefaultLang)];
    return Array.from(new Set(langs.filter((item): item is Lang => item !== null)));
};

/** 依語系取得欄位顯示名稱。 */
const findMatCategoryInfoFieldDisplayName = (displays: MatCategoryInfoFieldDisplay[], lang: Lang): string =>
{
    const langKey = normalizeSupportedLang(lang);
    const display = displays.find(item => normalizeSupportedLang((item.Lang ?? undefined) as Lang | undefined) === langKey);
    return LibText.safeTrim(display?.FieldDisplayName);
};

/** 依 RowNo 與 RowId 穩定排序物件欄位設定。 */
const sortMatCategoryInfoFields = (fields: MatCategoryInfoField[]): MatCategoryInfoField[] =>
{
    return [...fields].sort((left, right) => getMatCategoryInfoFieldOrder(left) - getMatCategoryInfoFieldOrder(right) || Number(left.RowId ?? 0) - Number(right.RowId ?? 0));
};

/** 取得欄位排序值，未設定 RowNo 的舊資料排到最後。 */
const getMatCategoryInfoFieldOrder = (field: MatCategoryInfoField): number =>
{
    const rowNo = Number(field.RowNo ?? 0);
    return rowNo > 0 ? rowNo : Number.MAX_SAFE_INTEGER;
};

/** 依目前語系與支援語系順序排序欄位顯示名稱。 */
const sortMatCategoryInfoFieldDisplays = (displays: MatCategoryInfoFieldDisplay[], preferLang: Lang): MatCategoryInfoFieldDisplay[] =>
{
    const order = buildSupportedLangOrder(preferLang);
    return [...displays].sort((a, b) => order.indexOf(a.Lang as Lang) - order.indexOf(b.Lang as Lang));
};

/** 取得第一個可用語系作為補列預設。 */
const getFirstMatCategoryLang = (data: MatCategoryFormModel): Lang =>
{
    return (data.Category?._CategoryDetail?.find(detail => Boolean(detail.Lang))?.Lang as Lang) ?? DefaultLang;
};

/** 取得子表顯示名稱，避免 Grid 標題寫死。 */
const getMatCategoryTableTitle = (displayName: ModelDisplaySchema, tableId: string, fallback: string): string =>
{
    return getModelTableDisplayName(displayName, tableId, fallback);
};

/** 依資料表與欄位代碼取得 ModelDisplayName 顯示文字。 */
const getMatCategoryColumnTitle = (displayName: ModelDisplaySchema, tableId: string, columnId: string, fallback: string): string =>
{
    return getModelColumnDisplayName(displayName, tableId, columnId, fallback);
};

/** 建立物件欄位設定 Row key。 */
const buildMatCategoryInfoFieldRowKey = (field: MatCategoryInfoField, index: number): string =>
{
    return Merge("_", true, "mat-category-field", field.CategoryId, field.RowId ?? index + 1);
};

/** 建立物件欄位顯示名稱 Row key。 */
const buildMatCategoryInfoFieldDisplayRowKey = (display: MatCategoryInfoFieldDisplay, index: number): string =>
{
    return Merge("_", true, "mat-category-display", display.CategoryId, display.ParentRowId, display.RowId ?? index + 1, display.Lang);
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
