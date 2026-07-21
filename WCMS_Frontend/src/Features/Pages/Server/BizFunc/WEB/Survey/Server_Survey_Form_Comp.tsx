import { Server_FormTemplate_Comp } from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Comp";
import type { ServerFormBinding } from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Hook";
import { EditGrid } from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid";
import type { EditGridCellRenderArgs, EditGridEditingStateArgs, EditGridSubDetailRenderArgs, GridRow, IEditGridView_Style } from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid_Data";
import { getEditGridRowId, useEditGridSubDetailState } from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid_Hook";
import { SystemInfoTabComp } from "@/Features/Pages/Server/Scaffold/SystemTab/SystemTab";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { LibTabsProp } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/FieldComponets/LibTabs_Comp";
import { LibTextBox, LibTinyMCE } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/LibFormField";
import { useSetTableField } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/useSetTableField";
import { TabContentComp } from "@/SysCore/Components/TabContent/TabContent";
import type { Lang } from "@/SysCore/i18n/lang";
import { LibRoutePath } from "@/SysCore/Utils/Route/LibRoute";
import { markPageStateMemoryEntry } from "@/SysCore/Utils/PageStateMemory/PageStateMemory_Navigation";
import type { components } from "@/types/api";
import { SurveyFields, SurveySetFields } from "@/types/SchemaFields";
import type { ReactNode } from "react";
import { useCallback, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
    surveyEmptyData,
    useSurveyFormTemplate,
    useSurveyItemEditGrid,
    useSurveyItemLangEditGrid,
} from "./Server_Survey_Form_Hook";

// #region Property
type SurveySet = components["schemas"]["SurveySet_DTO"];

interface SurveyFormCompProps
{
    /** 後台主題設定 */
    theme: IBETheme;

    /** 目前語系 */
    lang: Lang;
}

interface SurveyContentProps
{
    /** 後台主題設定 */
    theme: IBETheme;

    /** 目前語系 */
    lang: Lang;

    /** Form Template 提供的主資料 binding */
    binding: ServerFormBinding<SurveySet>;

    /** 問卷欄位型別選項 */
    inputOpts: Record<string, string>;
}

interface HeaderSectionProps
{
    /** 後台主題設定 */
    theme: IBETheme;

    /** Form Template 提供的主資料 binding */
    binding: ServerFormBinding<SurveySet>;
}

interface HeaderTabContentOptions extends HeaderSectionProps
{
    /** 欄位 binding helper */
    setField: ReturnType<typeof useSetTableField<SurveySet>>;
}

interface SurveyItemLangGridProps extends SurveyContentProps
{
    /** SurveyItem 的 RowId */
    parentRowId: number;

    /** 子層 Grid 編輯狀態變化，回報給父層避免資料語意錯位 */
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
/** 後台問卷 Form，透過新版 Form Template 統一外框與資料流程。 */
export const Server_Survey_Form_Comp = (
    props: SurveyFormCompProps,
) =>
{
    const { internalId } = useParams();
    const navigate = useNavigate();
    const pathname = useLocation().pathname;

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

    const template = useSurveyFormTemplate({
        lang: props.lang,
        theme: props.theme,
        internalId: internalId ?? "",
        emptyData: surveyEmptyData,
        actionsOpt,
    });

    return (
        <Server_FormTemplate_Comp
            template={template}
            renderContent={({ vm }) => (
                <SurveyContentComp
                    theme={props.theme}
                    lang={props.lang}
                    binding={vm.binding}
                    inputOpts={vm.refs.inputOpts}
                />
            )}
        />
    );
};
// #endregion

// #region Section
/** 問卷主要內容，Header 維持舊 input，動態欄位改由 EditGrid 呈現。 */
const SurveyContentComp = (props: SurveyContentProps) =>
{
    return (
        <>
            <HeaderComp
                theme={props.theme}
                binding={props.binding}
            />
            <SurveyItemGridComp
                theme={props.theme}
                lang={props.lang}
                binding={props.binding}
                inputOpts={props.inputOpts}
            />
        </>
    );
};

/** 問卷 Header 區塊，保留舊版 Header input 並改用 Template Binding。 */
const HeaderComp = (props: HeaderSectionProps) =>
{
    const setField = useSetTableField<SurveySet>(props.binding);
    const tabInfo: LibTabsProp = { Style: props.theme.Tabs, item: { Basic: "基本", System: "系統資訊" } };
    const tabContent = buildHeaderTabContent({ ...props, setField });

    return (
        <TabContentComp
            tabInfos={tabInfo}
            components={tabContent}
        >
        </TabContentComp>
    );
};

/** 問卷欄位父層 Grid，透過查看按鈕展開語系明細。 */
const SurveyItemGridComp = (props: SurveyContentProps) =>
{
    const subDetailState = useEditGridSubDetailState();
    const renderSubDetailToggle = useCallback((args: EditGridCellRenderArgs) => (
        <SurveySubDetailToggleButton
            row={args.row}
            expandedRowKey={subDetailState.expandedRowKey}
            isSubDetailEditing={subDetailState.isSubDetailEditing}
            onToggle={subDetailState.toggleSubDetail}
        />
    ), [subDetailState.expandedRowKey, subDetailState.isSubDetailEditing, subDetailState.toggleSubDetail]);

    const renderSubDetail = useCallback((args: EditGridSubDetailRenderArgs) => (
        <SurveyItemLangGridComp
            theme={props.theme}
            lang={props.lang}
            binding={props.binding}
            inputOpts={props.inputOpts}
            parentRowId={getEditGridRowId(args.row, args.rowIndex)}
            onEditingStateChange={subDetailState.onSubDetailEditingStateChange}
        />
    ), [props.binding, props.inputOpts, props.lang, props.theme, subDetailState.onSubDetailEditingStateChange]);

    const itemGrid = useSurveyItemEditGrid({
        binding: props.binding,
        lang: props.lang,
        inputOpts: props.inputOpts,
        style: editGridStyle,
        renderSubDetailToggle,
        renderSubDetail,
        expandedRowKey: subDetailState.expandedRowKey,
        isSubDetailEditing: subDetailState.isSubDetailEditing,
    });

    return (
        <div className="form-group">
            <EditGrid {...itemGrid.editGridProps} />
        </div>
    );
};

/** 問卷欄位語系子明細 Grid，負責維護各語系欄位顯示名稱。 */
const SurveyItemLangGridComp = (props: SurveyItemLangGridProps) =>
{
    const langGrid = useSurveyItemLangEditGrid({
        binding: props.binding,
        parentRowId: props.parentRowId,
        lang: props.lang,
        style: editGridStyle,
    });

    return (
        <div className="p-3" style={{ backgroundColor: "#fafafa", border: "1px solid #dee2e6" }}>
            <div className="mb-2 font-weight-bold">語系明細</div>
            <EditGrid
                {...langGrid.editGridProps}
                onEditingStateChange={props.onEditingStateChange}
            />
        </div>
    );
};
// #endregion

// #region EntityComp
/** 建立返回列表頁路徑。 */
// #endregion

// #region Protected
/** 建立問卷 Header 的各分頁欄位。 */
const buildHeaderTabContent = (opt: HeaderTabContentOptions): Record<string, ReactNode[]> =>
{
    return {
        Basic: buildBasicFields(opt),
        System: [
            <SystemInfoTabComp
                theme={opt.theme}
                formData={opt.binding}
                setKey={SurveySetFields.Survey}
            />,
        ],
    };
};

/** 建立基本資料欄位。 */
const buildBasicFields = (opt: HeaderTabContentOptions): ReactNode[] =>
{
    return [
        <LibTextBox
            Style={opt.theme.TextBox}
            DefaultInputDisplay="請輸入"
            {...opt.setField(SurveySetFields.Survey, SurveyFields.SurveyName, "string")}
        />,
        <LibTinyMCE
            Style={opt.theme.TinyMCE}
            {...opt.setField(SurveySetFields.Survey, SurveyFields.SurveyDescription, "string")}
        />,
        <LibTinyMCE
            Style={opt.theme.TinyMCE}
            {...opt.setField(SurveySetFields.Survey, SurveyFields.SurveySuccessContent, "string")}
        />,
    ];
};
// #endregion

// #region Private
/** 問卷欄位語系明細展開按鈕。 */
const SurveySubDetailToggleButton = (props: { row: GridRow; expandedRowKey: string | null; isSubDetailEditing: boolean; onToggle: (row: GridRow) => void; }) =>
{
    const rowKey = getSurveyGridRowKey(props.row);
    const isExpanded = props.expandedRowKey === rowKey;
    const title = isExpanded ? "收合語系明細" : "查看語系明細";

    return (
        <button type="button" className="btn btn-outline-primary btn-sm" title={title} disabled={props.isSubDetailEditing} onClick={() => props.onToggle(props.row)}>
            <i className={isExpanded ? "fa fa-eye-slash" : "fa fa-eye"} aria-hidden="true" />
            <span className="ml-1">{isExpanded ? "收合" : "查看"}</span>
        </button>
    );
};

/** 取得 Grid Row key，讓展開狀態與 EditGrid 內部 row key 一致。 */
const getSurveyGridRowKey = (row: GridRow | null | undefined, rowIndex?: number): string =>
{
    if (!row) return "";

    const rowId = row.keyId || row.RowId || row.rowId || row.rowid;
    if (rowId !== null && rowId !== undefined && rowId !== "") return String(rowId);

    return rowIndex === undefined ? "" : `fallback-${rowIndex}`;
};
// #endregion
