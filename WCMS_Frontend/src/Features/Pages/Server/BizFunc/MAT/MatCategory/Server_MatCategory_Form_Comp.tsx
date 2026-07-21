import { Server_FormTemplate_Comp } from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Comp";
import type { ServerFormBinding } from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Hook";
import { EditGrid } from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid";
import type {
    EditGridCellRenderArgs,
    EditGridEditingStateArgs,
    GridRow,
    IEditGridView_Style,
} from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid_Data";
import {
    getEditGridRowId,
    getEditGridRowKey,
    getEditGridStringCellValue,
    useEditGridSubDetailState,
} from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid_Hook";
import { SystemInfoTabComp } from "@/Features/Pages/Server/Scaffold/SystemTab/SystemTab";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { LibTabsProp } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/FieldComponets/LibTabs_Comp";
import { TabContentComp } from "@/SysCore/Components/TabContent/TabContent";
import type { Lang } from "@/SysCore/i18n/lang";
import { LibRoutePath } from "@/SysCore/Utils/Route/LibRoute";
import { markPageStateMemoryEntry } from "@/SysCore/Utils/PageStateMemory/PageStateMemory_Navigation";
import type { components } from "@/types/api";
import { CategoryDataSetFields, MatCategoryInfoFieldFields, type PGID } from "@/types/SchemaFields";
import type { ReactNode } from "react";
import { useCallback, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { CategorySharedEditorComp } from "../../COMM/Category/Server_CategorySharedEditor_Comp";
import {
    matCategoryEmptyData,
    useMatCategoryFormTemplate,
    useMatCategoryInfoFieldDisplayEditGrid,
    useMatCategoryInfoFieldEditGrid,
} from "./Server_MatCategory_Form_Hook";

// #region Property
type MatCategorySet = components["schemas"]["MatCategoryDataSet_DTO"];

interface MatCategoryFormCompProps
{
    /** 目前 ProgId，保留原 Route 傳入模式 */
    progId: PGID;

    /** 舊 Route 傳入的標題，ModelDisplayName 無資料時才 fallback */
    title: string;

    /** 後台主題設定 */
    theme: IBETheme;

    /** 目前語系 */
    lang: Lang;
}

interface MatCategoryContentProps
{
    /** 後台主題設定 */
    theme: IBETheme;

    /** 目前語系 */
    lang: Lang;

    /** Form Template 提供的主資料 binding */
    binding: ServerFormBinding<MatCategorySet>;
}

interface MatCategoryInfoFieldGridProps extends MatCategoryContentProps
{}

interface MatCategoryInfoFieldDisplayGridProps extends MatCategoryContentProps
{
    /** 父層物件欄位 RowId */
    parentRowId: number;

    /** 父層展開列是否已被禁用 */
    disabled?: boolean;

    /** 子層 EditGrid 編輯狀態，回報給父層避免語意錯位 */
    onEditingStateChange: (args: EditGridEditingStateArgs) => void;
}

interface BuildMatCategorySubDetailToggleOptions
{
    /** EditGrid Cell render 參數。 */
    args: EditGridCellRenderArgs;

    /** 目前展開中的父層 RowKey。 */
    expandedRowKey: string | null;

    /** 子層語系明細是否正在編輯。 */
    isSubDetailEditing: boolean;

    /** 切換語系明細展開狀態。 */
    toggleSubDetail: (row: GridRow) => void;
}

const editGridStyle: IEditGridView_Style = {
    TableStyle: "table table-striped table-bordered table-hover",
    ToolbarStyle: "d-flex align-items-center justify-content-between mb-2",
    ButtonStyle: "btn btn-custom btn-rounded btn-sm",
    DangerButtonStyle: "btn btn-danger btn-rounded btn-sm",
    ErrorStyle: "text-danger small mt-1",
};
// #endregion

// #region Public
/** 後台物件類別 Form，透過新版 Form Template 統一外框與資料流程。 */
export const Server_MatCategory_Form_Comp = (props: MatCategoryFormCompProps) =>
{
    const { internalId } = useParams();
    const navigate = useNavigate();
    const pathname = useLocation().pathname;
    const emptyData = useMemo(() => matCategoryEmptyData(props.progId), [props.progId]);

    const onBackToList = useCallback(() =>
    {
        const listPath = LibRoutePath.buildServerBackToListPath(pathname);
        markPageStateMemoryEntry(listPath, "normalize");
        navigate(listPath, { replace: true });
    }, [navigate, pathname]);

    const actionsOpt = useMemo(() =>
    {
        return { onBackToList };
    }, [onBackToList]);

    const template = useMatCategoryFormTemplate({
        lang: props.lang,
        theme: props.theme,
        internalId: internalId ?? "",
        emptyData,
        title: props.title,
        actionsOpt,
    });

    return (
        <Server_FormTemplate_Comp
            template={template}
            renderContent={({ vm }) => <MatCategoryContentComp theme={props.theme} lang={props.lang} binding={vm.binding} />}
        />
    );
};
// #endregion

// #region Section
/** 物件類別主要內容，維持基本類別資料 / 物件欄位設定 / 系統資訊三個主要分頁。 */
const MatCategoryContentComp = (props: MatCategoryContentProps) =>
{
    const tabInfo: LibTabsProp = { Style: props.theme.Tabs, item: { Category: "基本類別資料", MatField: "物件欄位設定", System: "系統資訊" } };
    const components = buildMatCategoryMainTabContent(props);

    return <TabContentComp tabInfos={tabInfo} components={components}></TabContentComp>;
};

/** 物件欄位設定區塊，父層欄位與語系顯示名稱皆改走 EditGrid。 */
const MatCategoryInfoFieldGridComp = (props: MatCategoryInfoFieldGridProps) =>
{
    const subDetailState = useEditGridSubDetailState();

    const renderSubDetailToggle = useCallback((args: EditGridCellRenderArgs) =>
    {
        return buildMatCategorySubDetailToggle({
            args,
            expandedRowKey: subDetailState.expandedRowKey,
            isSubDetailEditing: subDetailState.isSubDetailEditing,
            toggleSubDetail: subDetailState.toggleSubDetail,
        });
    }, [subDetailState.expandedRowKey, subDetailState.isSubDetailEditing, subDetailState.toggleSubDetail]);

    const renderSubDetail = useCallback((args: { row: GridRow; rowIndex: number; rowKey: string; disabled: boolean; }) =>
    {
        const parentRowId = getEditGridRowId(args.row, args.rowIndex);
        const shouldDisableSubDetail = false;

        return (
            <MatCategoryInfoFieldDisplayGridComp
                theme={props.theme}
                lang={props.lang}
                binding={props.binding}
                parentRowId={parentRowId}
                disabled={shouldDisableSubDetail}
                onEditingStateChange={subDetailState.onSubDetailEditingStateChange}
            />
        );
    }, [props.binding, props.lang, props.theme, subDetailState.onSubDetailEditingStateChange]);

    const fieldGrid = useMatCategoryInfoFieldEditGrid({
        binding: props.binding,
        lang: props.lang,
        style: editGridStyle,
        isSubDetailEditing: subDetailState.isSubDetailEditing,
        expandedRowKey: subDetailState.expandedRowKey,
        renderSubDetail,
        renderSubDetailToggle,
    });

    return <EditGrid {...fieldGrid.editGridProps} />;
};

/** 物件欄位語系顯示名稱子明細 Grid。 */
const MatCategoryInfoFieldDisplayGridComp = (props: MatCategoryInfoFieldDisplayGridProps) =>
{
    const displayGrid = useMatCategoryInfoFieldDisplayEditGrid({
        binding: props.binding,
        parentRowId: props.parentRowId,
        lang: props.lang,
        style: editGridStyle,
        disabled: props.disabled,
    });

    return <EditGrid {...displayGrid.editGridProps} onEditingStateChange={props.onEditingStateChange} />;
};
// #endregion

// #region EntityComp
/** 建立返回列表路徑。 */
// #endregion

// #region Protected
/** 建立物件類別主分頁內容。 */
const buildMatCategoryMainTabContent = (props: MatCategoryContentProps): Record<string, ReactNode[]> =>
{
    return {
        Category: [<CategorySharedEditorComp<MatCategorySet> key="CategorySharedEditor" theme={props.theme} formData={props.binding} />],
        MatField: [<MatCategoryInfoFieldGridComp key="MatCategoryInfoFieldGrid" theme={props.theme} lang={props.lang} binding={props.binding} />],
        System: [<SystemInfoTabComp key="SystemInfo" theme={props.theme} formData={props.binding} setKey={CategoryDataSetFields.Category} />],
    };
};

/** 建立欄位語系明細展開按鈕，父層編輯中不可開啟避免資料錯位。 */
const buildMatCategorySubDetailToggle = (opt: BuildMatCategorySubDetailToggleOptions): ReactNode =>
{
    const rowKey = getEditGridRowKey(opt.args.row);
    const isExpanded = opt.expandedRowKey === rowKey;
    const buttonText = isExpanded ? "收合" : "查看明細";
    const disabled = shouldDisableMatCategorySubDetailToggle(opt, isExpanded);

    return (
        <button
            type="button"
            className="btn btn-outline-primary btn-sm"
            disabled={disabled}
            onClick={() => opt.toggleSubDetail(opt.args.row)}
            aria-label={`${buttonText}物件欄位語系明細`}
            title={getMatCategorySubDetailToggleTitle(opt, isExpanded)}
        >
            {buttonText}
        </button>
    );
};
// #endregion

// #region Private
/** 判斷語系明細按鈕是否停用，避免父層尚未確認時編輯子層。 */
const shouldDisableMatCategorySubDetailToggle = (opt: BuildMatCategorySubDetailToggleOptions, isExpanded: boolean): boolean =>
{
    const isParentRowEditing = opt.args.disabled === false;
    const hasFieldValue = Boolean(getEditGridStringCellValue(opt.args.row, MatCategoryInfoFieldFields.Field).trim());
    const isOtherSubDetailEditing = opt.isSubDetailEditing && !isExpanded;

    return isParentRowEditing || !hasFieldValue || isOtherSubDetailEditing;
};

/** 取得語系明細按鈕提示文字。 */
const getMatCategorySubDetailToggleTitle = (opt: BuildMatCategorySubDetailToggleOptions, isExpanded: boolean): string =>
{
    const isParentRowEditing = opt.args.disabled === false;
    const hasFieldValue = Boolean(getEditGridStringCellValue(opt.args.row, MatCategoryInfoFieldFields.Field).trim());

    if (isParentRowEditing) return "請先確認物件欄位後再查看語系明細";
    if (!hasFieldValue) return "請先輸入欄位代碼";
    if (opt.isSubDetailEditing && !isExpanded) return "請先完成目前語系明細編輯";

    return isExpanded ? "收合語系明細" : "查看語系明細";
};
// #endregion
