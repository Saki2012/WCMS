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
import { getModelColumnDisplayName, getModelTableDisplayName } from "@/SysCore/Components/Grid/Grid_ModelDisplay";
import { buildSupportedLangOrder, DefaultLang, type Lang, LangLabelMap, normalizeSupportedLang, SUPPORTED_LANGS } from "@/SysCore/i18n/lang";
import type { ApiFormInitial } from "@/SysCore/Utils/API/APIAdapter";
import { useFetchEnumOptions } from "@/SysCore/Utils/API/SystemAPI_Hook";
import { LibText, LibType } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { PGID, SurveyFields, SurveyItemFields, SurveyItemLangFields } from "@/types/SchemaFields";
import type { ReactNode } from "react";
import { useEffect, useMemo } from "react";

// #region Property
type SurveyFormModel = components["schemas"]["Survey"];

type SurveyItem = components["schemas"]["SurveyItem"];

type SurveyItemLang = components["schemas"]["SurveyItemLang"];

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
    emptyData: SurveyFormModel;

    /** Form Template 標準動作設定 */
    actionsOpt: SurveyFormActionsOpt;
}

export interface UseSurveyItemEditGridOptions
{
    /** 新版 Form Template 提供的資料 binding */
    binding: ServerFormBinding<SurveyFormModel>;
    /** 目前語系，欄位名稱會優先顯示此語系 */
    lang: Lang;
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
    binding: ServerFormBinding<SurveyFormModel>;

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

const SurveyItemTableId = SurveyFields._SurveyItem.replace(/^_/, "");

const SurveyItemLangTableId = SurveyItemFields._SurveyItemLang.replace(/^_/, "");
// #endregion

// #region Public
export const surveyEmptyData: SurveyFormModel = { _SurveyItem: [] };

export const SurveyItemLangColumnKey = "__SurveyItemLang";
export const SurveyItemFieldNameColumnKey = "__SurveyItemFieldName";
const SurveyItemFieldNameColumnTitle = "欄位名稱";
/** 建立 Survey Form Template，統一交給 Server_FormTemplate 處理資料流程。 */
export const useSurveyFormTemplate = (
    opt: UseSurveyFormTemplateOptions,
): ServerFormTemplate<SurveyFormModel, SurveyFormAdapter, SurveyFormRefs, ServerFormDefaultRawData<SurveyFormModel, SurveyFormRefs>, SurveyFormActionsOpt> =>
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

    return useEditGridBinding<SurveyFormModel, SurveyItem, SurveyItemGridRow>({
        binding: opt.binding,
        emptyData: surveyEmptyData,
        getItems: data => data._SurveyItem,
        setItems: syncSurveyItemCollection,
        columns,
        getItemRowId: item => item.RowId,
        sortItems: sortSurveyItems,
        createItem: ctx => buildNewSurveyItem(ctx.data, ctx.nextRowId, ctx.nextRowNo),
        toRow: (item, index) => buildSurveyItemGridRow(item, index, opt, displayName),
        toItem: (row, index, ctx) => toSurveyItemDto(ctx.data, row, index, opt.inputOpts),
        editGridProps: buildSurveyItemGridProps(opt.style, displayName, opt),
    });
};

/** 建立 SurveyItemLang 子層 EditGrid binding，讓欄位顯示名稱改由子表維護。 */
export const useSurveyItemLangEditGrid = (opt: UseSurveyItemLangEditGridOptions) =>
{
    const displayName = opt.binding.displayName;
    const columns = useMemo(() => buildSurveyItemLangColumns(displayName), [displayName]);

    return useEditGridBinding<SurveyFormModel, SurveyItemLang, SurveyItemLangGridRow>({
        binding: opt.binding,
        emptyData: surveyEmptyData,
        getItems: data => getSurveyItemLangs(data, opt.parentRowId),
        setItems: (data, items) => setSurveyItemLangs(data, opt.parentRowId, items),
        columns,
        getItemRowId: detail => detail.RowId,
        sortItems: details => sortSurveyItemLangs(details, opt.lang),
        createItem: ctx => buildNewSurveyItemLang(ctx.data, opt.parentRowId, ctx.nextRowId, ctx.nextRowNo, opt.lang),
        toRow: (detail, index) => buildSurveyItemLangGridRow(detail, index, displayName),
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
const buildSurveyInitialData = (ctx: { mode: "new" | "edit"; emptyData: SurveyFormModel; }): ApiFormInitial<SurveyFormModel> | undefined =>
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
const useSurveyReferenceData = (ctx: { binding: ServerFormBinding<SurveyFormModel>; lang: Lang; }) =>
{
    useEnsureSurveyItemLangs(ctx.binding, ctx.lang);
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
        title: getSurveyColumnTitle(displayName, SurveyItemTableId, SurveyItemFields.FieldId, "欄位代號"),
        inputType: "text",
        editable: true,
        required: true,
        maxLength: 100,
        width: 180,
    }, {
        key: SurveyItemFieldNameColumnKey,
        title: SurveyItemFieldNameColumnTitle,
        inputType: "readonly",
        editable: false,
        minWidth: 240,
    }, {
        key: SurveyItemFields.IsRequired,
        title: getSurveyColumnTitle(displayName, SurveyItemTableId, SurveyItemFields.IsRequired, "必填"),
        inputType: "checkboxSingle",
        editable: true,
        width: 90,
    }, {
        key: SurveyItemFields.InputType,
        title: getSurveyColumnTitle(displayName, SurveyItemTableId, SurveyItemFields.InputType, "欄位型別"),
        inputType: "selectSingle",
        editable: true,
        options: toEditGridOptions(inputOpts),
        searchable: true,
        width: 180,
    }, {
        key: SurveyItemFields.Options,
        title: getSurveyColumnTitle(displayName, SurveyItemTableId, SurveyItemFields.Options, "選項資料"),
        inputType: "textarea",
        editable: true,
        rows: 3,
        width: 320,
        helpText: "單選、複選或下拉類型才需要填寫。",
    }, {
        key: SurveyItemLangColumnKey,
        title: getSurveyTableTitle(displayName, SurveyItemLangTableId, "語系明細"),
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
        title: getSurveyColumnTitle(displayName, SurveyItemLangTableId, SurveyItemLangFields.Lang, "語系"),
        inputType: "readonly",
        editable: false,
        width: 120,
    }, {
        key: SurveyItemLangFields.FieldName,
        title: getSurveyColumnTitle(displayName, SurveyItemLangTableId, SurveyItemLangFields.FieldName, "欄位顯示名稱"),
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
            getSurveyColumnTitle(displayName, SurveyItemTableId, SurveyItemFields.FieldId, "欄位代號"),
            item.FieldId ?? "",
            { inputType: "text", editable: true, required: true, maxLength: 100 },
        ),
        buildEditGridCell(SurveyItemFieldNameColumnKey, SurveyItemFieldNameColumnTitle, getSurveyItemFieldName(opt.binding.data, rowId, opt.lang), {
            inputType: "readonly",
            editable: false,
        }),
        buildEditGridCell(
            SurveyItemFields.IsRequired,
            getSurveyColumnTitle(displayName, SurveyItemTableId, SurveyItemFields.IsRequired, "必填"),
            Boolean(item.IsRequired),
            { inputType: "checkboxSingle", editable: true },
        ),
        buildEditGridCell(
            SurveyItemFields.InputType,
            getSurveyColumnTitle(displayName, SurveyItemTableId, SurveyItemFields.InputType, "欄位型別"),
            item.InputType ?? "",
            { inputType: "selectSingle", editable: true, options: toEditGridOptions(opt.inputOpts), searchable: true },
        ),
        buildEditGridCell(
            SurveyItemFields.Options,
            getSurveyColumnTitle(displayName, SurveyItemTableId, SurveyItemFields.Options, "選項資料"),
            item.Options ?? "",
            { inputType: "textarea", editable: true, rows: 3, helpText: buildSurveyOptionHelpText(item, opt.inputOpts) },
        ),
        buildEditGridCell(SurveyItemLangColumnKey, getSurveyTableTitle(displayName, SurveyItemLangTableId, "語系明細"), rowId, {
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
            getSurveyColumnTitle(displayName, SurveyItemLangTableId, SurveyItemLangFields.Lang, "語系"),
            detail.Lang ?? "",
            { inputType: "readonly", editable: false, render: args => getSurveyLangText(args.value) },
        ),
        buildEditGridCell(
            SurveyItemLangFields.FieldName,
            getSurveyColumnTitle(displayName, SurveyItemLangTableId, SurveyItemLangFields.FieldName, "欄位顯示名稱"),
            detail.FieldName ?? "",
            { inputType: "text", editable: true, required: true, maxLength: 200 },
        ),
    ];
};

/** 建立父層 Grid 設定。 */
const buildSurveyItemGridProps = (style: IEditGridView_Style, displayName: ModelDisplaySchema, opt: UseSurveyItemEditGridOptions) =>
{
    const gridTitle = getSurveyTableTitle(displayName, SurveyItemTableId, "問卷欄位");

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
    const gridTitle = getSurveyTableTitle(displayName, SurveyItemLangTableId, "語系明細");

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

/** 將父層 Grid Row 轉回 DTO，並保留目前題目的語系子明細。 */
const toSurveyItemDto = (source: SurveyFormModel, row: GridRow, index: number, inputOpts: Record<string, string>): SurveyItem =>
{
    const rowId = getEditGridRowId(row, index);
    const inputType = getSurveyInputTypeCellValue(row);
    const current = getSurveyItemByRowId(source, rowId);
    return {
        SurveyId: source.SurveyId ?? (row as SurveyItemGridRow).SurveyId,
        RowId: rowId,
        RowNo: index + 1,
        FieldId: getEditGridNullableStringCellValue(row, SurveyItemFields.FieldId),
        IsRequired: Boolean(getEditGridCellValue(row, SurveyItemFields.IsRequired)),
        InputType: inputType,
        Options: shouldKeepSurveyOptions(inputType, inputOpts) ? getEditGridNullableStringCellValue(row, SurveyItemFields.Options) : null,
        _SurveyItemLang: current?._SurveyItemLang ?? [],
    };
};

/** 將語系明細 Grid Row 轉回 DTO。 */
const toSurveyItemLangDto = (source: SurveyFormModel, parentRowId: number, row: GridRow, index: number): SurveyItemLang =>
{
    return {
        SurveyId: source.SurveyId ?? (row as SurveyItemLangGridRow).SurveyId,
        ParentRowId: parentRowId,
        RowId: getEditGridRowId(row, index),
        RowNo: index + 1,
        Lang: getSurveyLangCellValue(row),
        FieldName: getEditGridNullableStringCellValue(row, SurveyItemLangFields.FieldName),
    };
};

/** 建立新的 SurveyItem，並立即補齊所有支援語系。 */
const buildNewSurveyItem = (data: SurveyFormModel, rowId: number, rowNo: number): SurveyItem =>
{
    const item: SurveyItem = { SurveyId: data.SurveyId, RowId: rowId, RowNo: rowNo, FieldId: `Field${rowId}`, IsRequired: false, InputType: undefined, Options: null };
    return { ...item, _SurveyItemLang: buildMissingSurveyItemLangs(item, [], data.SurveyId) };
};

/** 建立新的 SurveyItemLang。 */
const buildNewSurveyItemLang = (data: SurveyFormModel, parentRowId: number, rowId: number, rowNo: number, lang: Lang): SurveyItemLang =>
{
    return { SurveyId: data.SurveyId, ParentRowId: parentRowId, RowId: rowId, RowNo: rowNo, Lang: lang, FieldName: "" };
};

/** 父層 Grid 寫回時，保留各題目的語系子明細並補齊缺少語系。 */
const syncSurveyItemCollection = (data: SurveyFormModel, items: SurveyItem[]): SurveyFormModel =>
{
    const nextItems = items.map((item, index) => ensureSurveyItemLanguages(item, data.SurveyId, index + 1));
    return { ...data, _SurveyItem: nextItems };
};

/** 取得指定題目的語系子明細。 */
const getSurveyItemLangs = (data: SurveyFormModel, parentRowId: number): SurveyItemLang[] =>
{
    return getSurveyItemByRowId(data, parentRowId)?._SurveyItemLang ?? [];
};

/** 寫回指定題目的語系子明細，不改動其他題目。 */
const setSurveyItemLangs = (data: SurveyFormModel, parentRowId: number, details: SurveyItemLang[]): SurveyFormModel =>
{
    const normalized = normalizeSurveyItemLangs(data, parentRowId, details);
    const items = (data._SurveyItem ?? []).map(item => Number(item.RowId ?? 0) === parentRowId ? { ...item, _SurveyItemLang: normalized } : item);
    return { ...data, _SurveyItem: items };
};

/** 正規化語系子明細的父鍵與顯示順序。 */
const normalizeSurveyItemLangs = (data: SurveyFormModel, parentRowId: number, details: SurveyItemLang[]): SurveyItemLang[] =>
{
    return details.map((detail, index) => ({
        ...detail,
        SurveyId: detail.SurveyId ?? data.SurveyId,
        ParentRowId: parentRowId,
        RowNo: index + 1,
    }));
};

/** 依 RowId 取得題目資料。 */
const getSurveyItemByRowId = (data: SurveyFormModel, rowId: number): SurveyItem | undefined =>
{
    return (data._SurveyItem ?? []).find(item => Number(item.RowId ?? 0) === rowId);
};

/** 載入 FormModel 後補齊每一題的支援語系，並依目前語系排序。 */
const useEnsureSurveyItemLangs = (binding: ServerFormBinding<SurveyFormModel>, preferLang: Lang): void =>
{
    const setFormData = binding.setFormData;
    useEffect(() =>
    {
        setFormData(prev => ({ ...prev, _SurveyItem: (prev._SurveyItem ?? []).map((item, index) => ensureSurveyItemLanguages(item, prev.SurveyId, index + 1, preferLang)) }));
    }, [preferLang, setFormData]);
};

/** 補齊單一題目的語系子明細與排序欄位。 */
const ensureSurveyItemLanguages = (item: SurveyItem, surveyId?: string | null, rowNo?: number, preferLang: Lang = DefaultLang): SurveyItem =>
{
    const details = item._SurveyItemLang ?? [];
    const missing = buildMissingSurveyItemLangs(item, details, surveyId);
    const sorted = sortSurveyItemLangs([...details, ...missing], preferLang).map((detail, index) => ({ ...detail, RowNo: index + 1 }));
    return { ...item, SurveyId: item.SurveyId ?? surveyId, RowNo: rowNo ?? item.RowNo, _SurveyItemLang: sorted };
};

/** 建立指定 SurveyItem 缺少的語系明細。 */
const buildMissingSurveyItemLangs = (parent: SurveyItem, details: SurveyItemLang[], surveyId?: string | null): SurveyItemLang[] =>
{
    const existLangs = new Set(details.map(detail => String(detail.Lang ?? "").toLowerCase()));
    const maxRowId = details.reduce((max, detail) => Math.max(max, Number(detail.RowId ?? 0)), 0);
    return SUPPORTED_LANGS.filter(lang => !existLangs.has(lang.toLowerCase())).map((lang, index) => ({
        SurveyId: parent.SurveyId ?? surveyId,
        ParentRowId: parent.RowId,
        RowId: maxRowId + index + 1,
        RowNo: details.length + index + 1,
        Lang: lang,
        FieldName: parent.FieldId ?? "",
    }));
};

/** 依 RowId 排序 SurveyItem。 */
const sortSurveyItems = (items: SurveyItem[]): SurveyItem[] =>
{
    return [...items].sort((a, b) => Number(a.RowNo ?? a.RowId ?? 0) - Number(b.RowNo ?? b.RowId ?? 0));
};
/** 取得父層欄位名稱，優先目前語系，找不到時回退 DefaultLang。 */
const getSurveyItemFieldName = (data: SurveyFormModel | undefined, parentRowId: number, lang: Lang): string =>
{
    const details = data ? getSurveyItemLangs(data, parentRowId) : [];
    const langs = buildSurveyItemNameLangs(lang);
    const names = langs.map(item => findSurveyItemLangFieldName(details, parentRowId, item));
    return LibText.getFirstNonEmptyText(...names);
};

/** 建立欄位名稱語系優先順序。 */
const buildSurveyItemNameLangs = (lang: Lang): Lang[] =>
{
    const langs = [normalizeSupportedLang(lang), normalizeSupportedLang(DefaultLang)];
    return Array.from(new Set(langs.filter((item): item is Lang => item !== null)));
};

/** 依 parent row 與語系取得欄位顯示名稱。 */
const findSurveyItemLangFieldName = (details: SurveyItemLang[], parentRowId: number, lang: Lang): string =>
{
    const parentKey = LibType.toSafeNumber(parentRowId);
    const langKey = normalizeSupportedLang(lang);
    const detail = details.find(item => isSurveyItemLangMatched(item, parentKey, langKey));
    return LibText.safeTrim(detail?.FieldName);
};

/** 判斷語系明細是否符合父層與語系。 */
const isSurveyItemLangMatched = (detail: SurveyItemLang, parentRowId: number, lang: Lang | null): boolean =>
{
    return LibType.toSafeNumber(detail.ParentRowId) === parentRowId
        && normalizeSupportedLang((detail.Lang ?? undefined) as Lang | undefined) === lang;
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
    return getModelTableDisplayName(displayName, tableId, fallback);
};

/** 依資料表與欄位代碼取得 ModelDisplayName 顯示文字。 */
const getSurveyColumnTitle = (displayName: ModelDisplaySchema, tableId: string, columnId: string, fallback: string): string =>
{
    return getModelColumnDisplayName(displayName, tableId, columnId, fallback);
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
