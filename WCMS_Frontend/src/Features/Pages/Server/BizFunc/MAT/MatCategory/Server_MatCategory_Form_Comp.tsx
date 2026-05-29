import { Server_FormTemplate_Comp } from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Comp";
import type { ServerFormBinding } from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Hook";
import { EditGrid } from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid";
import type { EditGridCellRenderArgs, EditGridEditingStateArgs, GridRow, IEditGridView_Style } from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid_Data";
import { getEditGridRowId, getEditGridRowKey, useEditGridSubDetailState } from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid_Hook";
import { SystemInfoTabComp } from "@/Features/Pages/Server/Scaffold/SystemTab/SystemTab";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { LibTabsProp } from "@/SysCore/Components/FormField/FieldComponets/LibTabs_Comp";
import TabContentComp from "@/SysCore/Components/TabContent/TabContent";
import type { Lang } from "@/SysCore/i18n/lang";
import type { components } from "@/types/api";
import { CategoryDataSetFields, type PGID } from "@/types/SchemaFields";
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

interface MatCategoryInfoFieldGridProps extends MatCategoryContentProps { }

interface MatCategoryInfoFieldDisplayGridProps extends MatCategoryContentProps
{
    /** 父層物件欄位 RowId */
    parentRowId: number;

    /** 父層展開列是否已被禁用 */
    disabled?: boolean;

    /** 子層 EditGrid 編輯狀態，回報給父層避免語意錯位 */
    onEditingStateChange: (args: EditGridEditingStateArgs) => void;
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
        navigate(buildBackToListPath(pathname));
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
            renderContent={({ vm }) => (
                <MatCategoryContentComp
                    theme={props.theme}
                    lang={props.lang}
                    binding={vm.binding}
                />
            )}
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

    return (
        <TabContentComp
            tabInfos={tabInfo}
            components={components}
        ></TabContentComp>
    );
};

/** 物件欄位設定區塊，父層欄位與語系顯示名稱皆改走 EditGrid。 */
const MatCategoryInfoFieldGridComp = (props: MatCategoryInfoFieldGridProps) =>
{
    const subDetailState = useEditGridSubDetailState();

    const renderSubDetailToggle = useCallback((args: EditGridCellRenderArgs) =>
    {
        return buildMatCategorySubDetailToggle(args, subDetailState.expandedRowKey, subDetailState.toggleSubDetail);
    }, [subDetailState.expandedRowKey, subDetailState.toggleSubDetail]);

    const renderSubDetail = useCallback((args: { row: GridRow; rowIndex: number; rowKey: string; disabled: boolean; }) =>
    {
        const parentRowId = getEditGridRowId(args.row, args.rowIndex);

        return (
            <MatCategoryInfoFieldDisplayGridComp
                theme={props.theme}
                lang={props.lang}
                binding={props.binding}
                parentRowId={parentRowId}
                disabled={args.disabled}
                onEditingStateChange={subDetailState.onSubDetailEditingStateChange}
            />
        );
    }, [props.binding, props.lang, props.theme, subDetailState.onSubDetailEditingStateChange]);

    const fieldGrid = useMatCategoryInfoFieldEditGrid({
        binding: props.binding,
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

    return (
        <EditGrid
            {...displayGrid.editGridProps}
            onEditingStateChange={props.onEditingStateChange}
        />
    );
};
// #endregion

// #region EntityComp
/** 建立物件類別主分頁內容。 */
const buildMatCategoryMainTabContent = (props: MatCategoryContentProps): Record<string, ReactNode[]> =>
{
    return {
        Category: [<CategorySharedEditorComp<MatCategorySet> key="CategorySharedEditor" theme={props.theme} formData={props.binding} />],
        MatField: [
            <MatCategoryInfoFieldGridComp
                key="MatCategoryInfoFieldGrid"
                theme={props.theme}
                lang={props.lang}
                binding={props.binding}
            />,
        ],
        System: [<SystemInfoTabComp key="SystemInfo" theme={props.theme} formData={props.binding} setKey={CategoryDataSetFields.Category} />],
    };
};

/** 建立欄位語系明細展開按鈕。 */
const buildMatCategorySubDetailToggle = (
    args: EditGridCellRenderArgs,
    expandedRowKey: string | null,
    toggleSubDetail: (row: GridRow) => void,
): ReactNode =>
{
    const rowKey = getEditGridRowKey(args.row);
    const isExpanded = expandedRowKey === rowKey;
    const buttonText = isExpanded ? "收合" : "查看明細";

    return (
        <button
            type="button"
            className="btn btn-outline-primary btn-sm"
            disabled={args.disabled}
            onClick={() => toggleSubDetail(args.row)}
            aria-label={`${buttonText}物件欄位語系明細`}
        >
            {buttonText}
        </button>
    );
};
// #endregion

// #region Private
/** 建立返回列表路徑。 */
const buildBackToListPath = (pathname: string): string =>
{
    return pathname.replace(/\/Form(\/[^\/]*)?$/, "/List");
};
// #endregion
