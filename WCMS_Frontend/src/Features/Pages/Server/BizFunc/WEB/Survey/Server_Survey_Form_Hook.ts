import { SurveyAdapter } from "@/Features/Hooks/BizFunc/WEB/Survey_Api";
import type {
    ServerFormBinding,
    ServerFormDefaultRawData,
    ServerFormTemplate,
} from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Hook";
import type {
    ColumnConfig,
    EditGridCellRenderArgs,
    EditGridSubDetailRenderArgs,
    GridRow,
    IEditGridView_Style,
    RowCell,
} from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid_Data";
import {
    buildEditGridCell,
    getEditGridCellValue,
    getEditGridNullableStringCellValue,
    getEditGridNumberCellValue,
    getEditGridRowId,
    getEditGridStringCellValue,
    toEditGridOptions,
    useEditGridBinding,
} from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid_Hook";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { buildSupportedLangOrder, type Lang, LangLabelMap, SUPPORTED_LANGS, useEnsureLangDetails } from "@/SysCore/i18n/lang";
import type { ApiFormInitial } from "@/SysCore/Utils/API/APIAdapter";
import { useFetchEnumOptions } from "@/SysCore/Utils/API/SystemAPI_Hook";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { PGID, SurveyItemFields, SurveyItemLangFields, SurveySetFields } from "@/types/SchemaFields";
import type { ReactNode } from "react";
import { useMemo } from "react";

// #region Property
type SurveySet = components["schemas"]["SurveySet_DTO"];

type SurveyItem = NonNullable<SurveySet["SurveyItem"]>[number];

type SurveyItemLang = NonNullable<SurveySet["SurveyItemLang"]>[number];

type SurveyInputTypeValue = SurveyItem["InputType"];

export type SurveyItemGridRow = GridRow & { SurveyId?: string | null; DetailRowId?: number | null; };

export type SurveyItemLangGridRow = GridRow & { SurveyId?: string | null; ParentRowId?: number | null; DetailRowId?: number | null; Lang?: string | null; };

export interface UseSurveyFormTemplateOptions
{
    /** 目前語系 */
    lang: Lang;

    /** 後台主題設定 */
    theme: IBETheme;

    /** 資料 internalId，空值代表新增 */
    internalId: string;

    /** 新增模式預設資料 */
    emptyData: SurveySet;

    /** Form Template 標準動作設定 */
    actionsOpt: SurveyFormActionsOpt;
}

export interface UseSurveyItemEditGridOptions
{
    /** 新版 Form Template 提供的資料 binding */
    binding: ServerFormBinding<SurveySet>;

    /** 問卷欄位型別選項 */
    inputOpts: Record<string, string>;

    /** EditGrid UI 樣式，仍由 Comp 決定 */
    style: IEditGridView_Style;

    /** SubDetail 展開按鈕渲染，畫面職責留在 Comp */
    renderSubDetailToggle: (args: EditGridCellRenderArgs) => ReactNode;

    /** SubDetail 區塊渲染，畫面職責留在 Comp */
    renderSubDetail: (args: EditGridSubDetailRenderArgs) => ReactNode;

    /** 子明細展開列 key */
    expandedRowKey: string | null;

    /** 子明細編輯中時鎖住父層 */
    isSubDetailEditing: boolean;
}

export interface UseSurveyItemLangEditGridOptions
{
    /** 新版 Form Template 提供的資料 binding */
    binding: ServerFormBinding<SurveySet>;

    /** SurveyItem 的 RowId */
    parentRowId: number;

    /** 目前語系，會優先排序 */
    lang: Lang;

    /** EditGrid UI 樣式，仍由 Comp 決定 */
    style: IEditGridView_Style;
}

export type SurveyFormRefs = {
    /** 問卷欄位型別選項 */
    inputOpts: Record<string, string>;
};

export type SurveyFormActionsOpt = {
    /** 儲存成功後要回到列表（或其他導頁） */
    onBackToList: () => void;
};

export type SurveyFormAdapter = {
    /** Survey 主資料 Adapter */
    Survey: ReturnType<typeof SurveyAdapter>;
};

const emptySurveyRefs: SurveyFormRefs = { inputOpts: {} };

const optionInputTypeKeys = new Set(["10", "11", "20"]);
// #endregion

// #region Public
export const surveyEmptyData: SurveySet = { Survey: {}, SurveyItem: [], SurveyItemLang: [] };

export const SurveyItemLangColumnKey = "__SurveyItemLang";

/** 建立 Survey Form Template，統一交給 Server_FormTemplate 處理資料流程。 */
export const useSurveyFormTemplate = (
    opt: UseSurveyFormTemplateOptions,
): ServerFormTemplate<SurveySet, SurveyFormAdapter, SurveyFormRefs, ServerFormDefaultRawData<SurveySet, SurveyFormRefs>, SurveyFormActionsOpt> =>
{
    return useMemo(() =>
    {
        return {
            featureKey: PGID.Survey,
            theme: opt.theme,
            lang: opt.lang,
            internalId: opt.internalId,
            emptyData: opt.emptyData,
            actionsOpt: opt.actionsOpt,
            feature: {
                buildAdapter: buildSurveyFormAdapter,
                selectDataAdapter: adapter => adapter.Survey,
                buildTitle: buildSurveyFormTitle,
                buildInitialData: buildSurveyInitialData,
                useReferenceData: ctx => useSurveyReferenceData({ ...ctx, lang: opt.lang }),
            },
        };
    }, [opt.actionsOpt, opt.emptyData, opt.internalId, opt.lang, opt.theme]);
};

/** 建立 SurveyItem 動態欄位 EditGrid binding，Comp 只負責掛載 Grid 與 SubDetail UI。 */
export const useSurveyItemEditGrid = (opt: UseSurveyItemEditGridOptions) =>
{
    const displayName = opt.binding.displayName;
    const columns = useMemo(() => buildSurveyItemColumns(displayName, opt.inputOpts), [displayName, opt.inputOpts]);

    return useEditGridBinding<SurveySet, SurveyItem, SurveyItemGridRow>({
        binding: opt.binding,
        emptyData: surveyEmptyData,
        getItems: data => data.SurveyItem,
        setItems: syncSurveyItemCollection,
        columns,
        getItemRowId: item => item.RowId,
        sortItems: sortSurveyItems,
        createItem: ctx => buildNewSurveyItem(ctx.data, ctx.nextRowId),
        toRow: (item, index) => buildSurveyItemGridRow(item, index, opt, displayName),
        toItem: (row, index, ctx) => toSurveyItemDto(ctx.data, row, index, opt.inputOpts),
        onDeleteRow: ctx => removeSurveyItemLangByRow(opt.binding, ctx.row),
        editGridProps: buildSurveyItemGridProps(opt.style, displayName, opt),
    });
};

/** 建立 SurveyItemLang 子層 EditGrid binding，讓欄位顯示名稱改由子表維護。 */
export const useSurveyItemLangEditGrid = (opt: UseSurveyItemLangEditGridOptions) =>
{
    const displayName = opt.binding.displayName;
    const columns = useMemo(() => buildSurveyItemLangColumns(displayName), [displayName]);

    return useEditGridBinding<SurveySet, SurveyItemLang, SurveyItemLangGridRow>({
        binding: opt.binding,
        emptyData: surveyEmptyData,
        collectionName: SurveySetFields.SurveyItemLang,
        parent: buildSurveyItemLangParent(opt.parentRowId),
        columns,
        getItemRowId: detail => detail.RowId,
        sortItems: details => sortSurveyItemLangs(details, opt.lang),
        createItem: ctx => buildNewSurveyItemLang(ctx.data, opt.parentRowId, ctx.nextRowId, opt.lang),
        toRow: (detail, index) => buildSurveyItemLangGridRow(detail, index, opt, displayName),
        toItem: (row, index, ctx) => toSurveyItemLangDto(ctx.data, opt.parentRowId, row, index),
        editGridProps: buildSurveyItemLangGridProps(opt.parentRowId, opt.style, displayName),
    });
};
// #endregion

// #region Private
/** 建立 Survey Form 標題，功能名稱優先讀 ModelDisplayName。 */
const buildSurveyFormTitle = (ctx: { mode: "new" | "edit"; displayName: ModelDisplaySchema; }): string =>
{
    const modelTitle = getSurveyModelTitle(ctx.displayName, "問卷");
    return `${ctx.mode === "edit" ? "修改" : "新增"}${modelTitle}`;
};

/** 建立新增模式的 initial data，統一由 Feature Timing 交給 Template。 */
const buildSurveyInitialData = (ctx: { mode: "new" | "edit"; emptyData: SurveySet; }): ApiFormInitial<SurveySet> | undefined =>
{
    if (ctx.mode !== "new") return undefined;
    return { data: { args: "__new__", apiRes: { IsSuccess: true, Data: ctx.emptyData, SysMessage: [] } } };
};

/** 建立 Survey Form 會使用到的 Adapter 群組。 */
const buildSurveyFormAdapter = (): SurveyFormAdapter =>
{
    return { Survey: SurveyAdapter() };
};

/** 取得問卷動態欄位參照資料，並補齊 SurveyItem 語系子明細。 */
const useSurveyReferenceData = (ctx: { binding: ServerFormBinding<SurveySet>; lang: Lang; }) =>
{
    useEnsureLangDetails(ctx.binding, {
        headerName: SurveySetFields.SurveyItem,
        detailName: SurveySetFields.SurveyItemLang,
        parentKeys: [SurveyItemLangFields.SurveyId, SurveyItemLangFields.ParentRowId],
        langs: SUPPORTED_LANGS,
        preferFirstLang: ctx.lang,
    });

    const inputTypeOpts = useLibInputTypeOptions();

    return useMemo(() =>
    {
        return {
            refs: { inputOpts: inputTypeOpts.data ?? emptySurveyRefs.inputOpts },
            isLoading: Boolean(inputTypeOpts.isLoading),
            errors: [inputTypeOpts.error],
            refetchRefData: undefined,
        };
    }, [inputTypeOpts.data, inputTypeOpts.error, inputTypeOpts.isLoading]);
};

/** 取得 Survey Model 顯示名稱，避免 Form 標題寫死功能名稱。 */
const getSurveyModelTitle = (displayName: ModelDisplaySchema, fallback: string): string =>
{
    return displayName.ModelDisplayName || fallback;
};

/** LibInputType enum options，若尚未回傳則給空物件避免 Grid 爆掉。 */
const useLibInputTypeOptions = (): { data: Record<string, string>; isLoading: boolean; error: string | null; } =>
{
    const src = useFetchEnumOptions("LibInputType");

    return useMemo(() =>
    {
        return { data: src.data ?? {}, isLoading: Boolean(src.isLoading), error: src.error };
    }, [src.data, src.error, src.isLoading]);
};

/** 建立父層 SurveyItem Grid 欄位。 */
const buildSurveyItemColumns = (displayName: ModelDisplaySchema, inputOpts: Record<string, string>): ColumnConfig[] =>
{
    return [{
        key: SurveyItemFields.FieldId,
        title: getSurveyColumnTitle(displayName, SurveySetFields.SurveyItem, SurveyItemFields.FieldId, "欄位代號"),
        inputType: "text",
        editable: true,
        required: true,
        maxLength: 100,
        width: 180,
    }, {
        key: SurveyItemFields.IsRequired,
        title: getSurveyColumnTitle(displayName, SurveySetFields.SurveyItem, SurveyItemFields.IsRequired, "必填"),
        inputType: "checkboxSingle",
        editable: true,
        width: 90,
    }, {
        key: SurveyItemFields.InputType,
        title: getSurveyColumnTitle(displayName, SurveySetFields.SurveyItem, SurveyItemFields.InputType, "欄位型別"),
        inputType: "selectSingle",
        editable: true,
        options: toEditGridOptions(inputOpts),
        searchable: true,
        width: 180,
    }, {
        key: SurveyItemFields.Options,
        title: getSurveyColumnTitle(displayName, SurveySetFields.SurveyItem, SurveyItemFields.Options, "選項資料"),
        inputType: "textarea",
        editable: true,
        rows: 3,
        width: 320,
        helpText: "單選、複選或下拉類型才需要填寫。",
    }, {
        key: SurveyItemLangColumnKey,
        title: getSurveyTableTitle(displayName, SurveySetFields.SurveyItemLang, "語系明細"),
        inputType: "readonly",
        editable: false,
        width: 140,
    }];
};

/** 建立子層 SurveyItemLang Grid 欄位。 */
const buildSurveyItemLangColumns = (displayName: ModelDisplaySchema): ColumnConfig[] =>
{
    return [{
        key: SurveyItemLangFields.Lang,
        title: getSurveyColumnTitle(displayName, SurveySetFields.SurveyItemLang, SurveyItemLangFields.Lang, "語系"),
        inputType: "readonly",
        editable: false,
        width: 120,
    }, {
        key: SurveyItemLangFields.FieldName,
        title: getSurveyColumnTitle(displayName, SurveySetFields.SurveyItemLang, SurveyItemLangFields.FieldName, "欄位顯示名稱"),
        inputType: "text",
        editable: true,
        required: true,
        maxLength: 200,
    }];
};

/** 建立父層 SurveyItem Row。 */
const buildSurveyItemGridRow = (item: SurveyItem, index: number, opt: UseSurveyItemEditGridOptions, displayName: ModelDisplaySchema): SurveyItemGridRow =>
{
    const rowId = Number(item.RowId ?? index + 1);
    return {
        keyId: buildSurveyItemRowKey(item, index),
        rowId,
        RowId: rowId,
        RowNo: index + 1,
        SurveyId: item.SurveyId,
        DetailRowId: rowId,
        cells: buildSurveyItemCells(item, rowId, opt, displayName),
    };
};

/** 建立父層 SurveyItem Cells。 */
const buildSurveyItemCells = (item: SurveyItem, rowId: number, opt: UseSurveyItemEditGridOptions, displayName: ModelDisplaySchema): RowCell[] =>
{
    return [
        buildEditGridCell(
            SurveyItemFields.FieldId,
            getSurveyColumnTitle(displayName, SurveySetFields.SurveyItem, SurveyItemFields.FieldId, "欄位代號"),
            item.FieldId ?? "",
            { inputType: "text", editable: true, required: true, maxLength: 100 },
        ),
        buildEditGridCell(
            SurveyItemFields.IsRequired,
            getSurveyColumnTitle(displayName, SurveySetFields.SurveyItem, SurveyItemFields.IsRequired, "必填"),
            Boolean(item.IsRequired),
            { inputType: "checkboxSingle", editable: true },
        ),
        buildEditGridCell(
            SurveyItemFields.InputType,
            getSurveyColumnTitle(displayName, SurveySetFields.SurveyItem, SurveyItemFields.InputType, "欄位型別"),
            item.InputType ?? "",
            { inputType: "selectSingle", editable: true, options: toEditGridOptions(opt.inputOpts), searchable: true },
        ),
        buildEditGridCell(
            SurveyItemFields.Options,
            getSurveyColumnTitle(displayName, SurveySetFields.SurveyItem, SurveyItemFields.Options, "選項資料"),
            item.Options ?? "",
            { inputType: "textarea", editable: true, rows: 3, helpText: buildSurveyOptionHelpText(item, opt.inputOpts) },
        ),
        buildEditGridCell(SurveyItemLangColumnKey, getSurveyTableTitle(displayName, SurveySetFields.SurveyItemLang, "語系明細"), rowId, {
            inputType: "readonly",
            editable: false,
            render: opt.renderSubDetailToggle,
        }),
    ];
};

/** 建立子層 SurveyItemLang Row。 */
const buildSurveyItemLangGridRow = (
    detail: SurveyItemLang,
    index: number,
    opt: UseSurveyItemLangEditGridOptions,
    displayName: ModelDisplaySchema,
): SurveyItemLangGridRow =>
{
    const rowId = Number(detail.RowId ?? index + 1);
    const lang = String(detail.Lang ?? "");
    return {
        keyId: buildSurveyItemLangRowKey(detail, index),
        rowId,
        RowId: rowId,
        RowNo: index + 1,
        SurveyId: detail.SurveyId,
        ParentRowId: detail.ParentRowId,
        DetailRowId: rowId,
        Lang: lang,
        cells: buildSurveyItemLangCells(detail, displayName),
    };
};

/** 建立子層 SurveyItemLang Cells。 */
const buildSurveyItemLangCells = (detail: SurveyItemLang, displayName: ModelDisplaySchema): RowCell[] =>
{
    return [
        buildEditGridCell(
            SurveyItemLangFields.Lang,
            getSurveyColumnTitle(displayName, SurveySetFields.SurveyItemLang, SurveyItemLangFields.Lang, "語系"),
            detail.Lang ?? "",
            { inputType: "readonly", editable: false, render: args => getSurveyLangText(args.value) },
        ),
        buildEditGridCell(
            SurveyItemLangFields.FieldName,
            getSurveyColumnTitle(displayName, SurveySetFields.SurveyItemLang, SurveyItemLangFields.FieldName, "欄位顯示名稱"),
            detail.FieldName ?? "",
            { inputType: "text", editable: true, required: true, maxLength: 200 },
        ),
    ];
};

/** 建立父層 Grid 設定。 */
const buildSurveyItemGridProps = (style: IEditGridView_Style, displayName: ModelDisplaySchema, opt: UseSurveyItemEditGridOptions) =>
{
    const gridTitle = getSurveyTableTitle(displayName, SurveySetFields.SurveyItem, "問卷欄位");

    return {
        title: gridTitle,
        style,
        canAdd: true,
        canEdit: true,
        canDelete: true,
        canDrag: true,
        showRowNo: true,
        maxVisibleRows: 5,
        addButtonText: "新增欄位",
        actionColumnTitle: "操作",
        emptyText: "目前沒有問卷欄位",
        ariaLabel: `${gridTitle}可編輯清單`,
        expandedRowKey: opt.expandedRowKey,
        disabled: opt.isSubDetailEditing,
        subDetailRowClassName: "edit-grid-sub-detail-row",
        subDetailRender: opt.renderSubDetail,
    };
};

/** 建立子層語系 Grid 設定。 */
const buildSurveyItemLangGridProps = (parentRowId: number, style: IEditGridView_Style, displayName: ModelDisplaySchema) =>
{
    const gridTitle = getSurveyTableTitle(displayName, SurveySetFields.SurveyItemLang, "語系明細");

    return {
        title: gridTitle,
        style,
        canAdd: false,
        canEdit: true,
        canDelete: false,
        canDrag: false,
        showRowNo: false,
        maxVisibleRows: 5,
        actionColumnTitle: "操作",
        emptyText: "目前沒有語系明細",
        ariaLabel: `第 ${parentRowId} 筆問卷欄位的${gridTitle}`,
    };
};

/** 將父層 Grid Row 轉回 DTO。 */
const toSurveyItemDto = (source: SurveySet, row: GridRow, index: number, inputOpts: Record<string, string>): SurveyItem =>
{
    const rowId = getEditGridRowId(row, index);
    const inputType = getSurveyInputTypeCellValue(row);

    return {
        SurveyId: source.Survey?.SurveyId ?? (row as SurveyItemGridRow).SurveyId,
        RowId: rowId,
        FieldId: getEditGridNullableStringCellValue(row, SurveyItemFields.FieldId),
        IsRequired: Boolean(getEditGridCellValue(row, SurveyItemFields.IsRequired)),
        InputType: inputType,
        Options: shouldKeepSurveyOptions(inputType, inputOpts) ? getEditGridNullableStringCellValue(row, SurveyItemFields.Options) : null,
    };
};

/** 將語系明細 Grid Row 轉回 DTO。 */
const toSurveyItemLangDto = (source: SurveySet, parentRowId: number, row: GridRow, index: number): SurveyItemLang =>
{
    return {
        SurveyId: source.Survey?.SurveyId ?? (row as SurveyItemLangGridRow).SurveyId,
        ParentRowId: parentRowId,
        RowId: getEditGridRowId(row, index),
        Lang: getSurveyLangCellValue(row),
        FieldName: getEditGridNullableStringCellValue(row, SurveyItemLangFields.FieldName),
    };
};

/** 建立新的 SurveyItem。 */
const buildNewSurveyItem = (data: SurveySet, rowId: number): SurveyItem =>
{
    return { SurveyId: data.Survey?.SurveyId, RowId: rowId, FieldId: `Field${rowId}`, IsRequired: false, InputType: undefined, Options: null };
};

/** 建立新的 SurveyItemLang。 */
const buildNewSurveyItemLang = (data: SurveySet, parentRowId: number, rowId: number, lang: Lang): SurveyItemLang =>
{
    return { SurveyId: data.Survey?.SurveyId, ParentRowId: parentRowId, RowId: rowId, Lang: lang, FieldName: "" };
};

/** 父層 Grid 寫回時，同步保留有效語系明細並補齊缺少語系。 */
const syncSurveyItemCollection = (data: SurveySet, items: SurveyItem[]): SurveySet =>
{
    return { ...data, SurveyItem: items, SurveyItemLang: syncSurveyItemLangParents(data.SurveyItemLang ?? [], items, data.Survey?.SurveyId) };
};

/** 清理孤兒語系明細，並替每個 SurveyItem 補齊支援語系。 */
const syncSurveyItemLangParents = (details: SurveyItemLang[], parents: SurveyItem[], surveyId?: string | null): SurveyItemLang[] =>
{
    const parentKeys = new Set(parents.map(parent => String(parent.RowId ?? 0)));
    const keptDetails = details.filter(detail => parentKeys.has(String(detail.ParentRowId ?? 0)));
    const missingDetails = parents.flatMap(parent => buildMissingSurveyItemLangs(parent, keptDetails, surveyId));

    return [...keptDetails, ...missingDetails];
};

/** 建立指定 SurveyItem 缺少的語系明細。 */
const buildMissingSurveyItemLangs = (parent: SurveyItem, details: SurveyItemLang[], surveyId?: string | null): SurveyItemLang[] =>
{
    const siblings = details.filter(detail => Number(detail.ParentRowId ?? 0) === Number(parent.RowId ?? 0));
    const existLangs = new Set(siblings.map(detail => String(detail.Lang ?? "").toLowerCase()));
    const maxRowId = siblings.reduce((max, detail) => Math.max(max, Number(detail.RowId ?? 0)), 0);

    return SUPPORTED_LANGS.filter(lang => !existLangs.has(lang.toLowerCase())).map((lang, index) => ({
        SurveyId: parent.SurveyId ?? surveyId,
        ParentRowId: parent.RowId,
        RowId: maxRowId + index + 1,
        Lang: lang,
        FieldName: parent.FieldId ?? "",
    }));
};

/** 建立語系明細 parent 綁定，讓共用 Hook 自動過濾同問卷欄位。 */
const buildSurveyItemLangParent = (parentRowId: number) =>
{
    return {
        field: SurveyItemLangFields.ParentRowId,
        value: parentRowId,
        compare: (itemValue: unknown, parentValue: string | number | null | undefined) => Number(itemValue ?? 0) === Number(parentValue ?? 0),
    };
};

/** 依 RowId 排序 SurveyItem。 */
const sortSurveyItems = (items: SurveyItem[]): SurveyItem[] =>
{
    return [...items].sort((a, b) => Number(a.RowId ?? 0) - Number(b.RowId ?? 0));
};

/** 依目前語系優先排序 SurveyItemLang。 */
const sortSurveyItemLangs = (details: SurveyItemLang[], preferLang: Lang): SurveyItemLang[] =>
{
    const order = buildSupportedLangOrder(preferLang);
    return [...details].sort((a, b) => getSurveyLangOrder(a.Lang, order) - getSurveyLangOrder(b.Lang, order));
};

/** 取得語系排序權重。 */
const getSurveyLangOrder = (lang: string | null | undefined, order: string[]): number =>
{
    const index = order.indexOf(String(lang ?? "").toLowerCase());
    return index >= 0 ? index : order.length + 1;
};

/** 刪除問卷欄位時，同步移除該欄位語系明細。 */
const removeSurveyItemLangByRow = (binding: ServerFormBinding<SurveySet>, row: GridRow): void =>
{
    const parentRowId = getEditGridRowId(row, 0);
    binding.setFormData(prev => removeSurveyItemLangFromData(prev ?? surveyEmptyData, parentRowId));
};

/** 從資料中移除指定問卷欄位的語系明細。 */
const removeSurveyItemLangFromData = (data: SurveySet, parentRowId: number): SurveySet =>
{
    const nextLangs = (data.SurveyItemLang ?? []).filter(detail => Number(detail.ParentRowId ?? 0) !== parentRowId);
    return { ...data, SurveyItemLang: nextLangs };
};

/** 取得欄位型別 Cell 值。 */
const getSurveyInputTypeCellValue = (row: GridRow): SurveyInputTypeValue =>
{
    const value = getEditGridNumberCellValue(row, SurveyItemFields.InputType, Number.NaN);
    if (Number.isFinite(value)) return value as SurveyInputTypeValue;
    const text = getEditGridStringCellValue(row, SurveyItemFields.InputType);
    return text as unknown as SurveyInputTypeValue;
};

/** 判斷目前欄位型別是否需要保留 Options。 */
const shouldKeepSurveyOptions = (inputType: SurveyInputTypeValue, inputOpts?: Record<string, string>): boolean =>
{
    const key = String(inputType ?? "");
    const label = inputOpts?.[key] ?? key;
    return optionInputTypeKeys.has(key) || optionInputTypeKeys.has(label.trim().toLowerCase());
};

/** 建立選項欄位提示，非選項類型時提醒使用者會忽略。 */
const buildSurveyOptionHelpText = (item: SurveyItem, inputOpts: Record<string, string>): string =>
{
    const inputKey = String(item.InputType ?? "");
    const label = inputOpts[inputKey] ?? inputKey;
    if (shouldKeepSurveyOptions(item.InputType, inputOpts)) return `目前型別：${label}，可填寫選項資料。`;
    return "此欄位僅在單選、複選或下拉類型保存。";
};

/** 取得語系 Cell 文字值。 */
const getSurveyLangCellValue = (row: GridRow): Lang =>
{
    return (getEditGridStringCellValue(row, SurveyItemLangFields.Lang) || (row as SurveyItemLangGridRow).Lang || "zh-tw") as Lang;
};

/** 取得語系顯示文字。 */
const getSurveyLangText = (value: unknown): string =>
{
    const lang = String(value ?? "").toLowerCase() as Lang;
    return LangLabelMap[lang] ?? String(value ?? "Unknown");
};

/** 取得子表顯示名稱，避免 Grid 標題寫死。 */
const getSurveyTableTitle = (displayName: ModelDisplaySchema, tableId: string, fallback: string): string =>
{
    const tableHit = displayName.Tables?.find(table => table.TableId === tableId);
    return tableHit?.TableDisplayName ?? fallback;
};

/** 依資料表與欄位代碼取得 ModelDisplayName 顯示文字。 */
const getSurveyColumnTitle = (displayName: ModelDisplaySchema, tableId: string, columnId: string, fallback: string): string =>
{
    const tables = displayName.Tables ?? [];
    const tableHit = tables.find(table => table.TableId === tableId);
    const columnHit = tableHit?.Columns?.find(column => column.ColumnId === columnId);
    const fallbackHit = tables.flatMap(table => table.Columns ?? []).find(column => column.ColumnId === columnId);

    return columnHit?.ColumnDisplayName ?? fallbackHit?.ColumnDisplayName ?? fallback;
};

/** 建立 SurveyItem Row key，讓 SubDetail 展開與資料列同步穩定。 */
const buildSurveyItemRowKey = (item: SurveyItem, index: number): string =>
{
    return `survey-item-${item.SurveyId ?? "new"}-${item.RowId ?? index + 1}`;
};

/** 建立 SurveyItemLang Row key，讓語系明細編輯狀態穩定。 */
const buildSurveyItemLangRowKey = (detail: SurveyItemLang, index: number): string =>
{
    return `survey-item-lang-${detail.SurveyId ?? "new"}-${detail.ParentRowId ?? 0}-${detail.RowId ?? index + 1}-${detail.Lang ?? "unknown"}`;
};
// #endregion
