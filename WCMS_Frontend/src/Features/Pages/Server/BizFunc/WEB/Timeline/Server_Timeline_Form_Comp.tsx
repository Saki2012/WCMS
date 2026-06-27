import { Server_FormTemplate_Comp } from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Comp";
import type { ServerFormBinding } from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Hook";
import { EditGrid } from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid";
import type {
    EditGridCellRenderArgs,
    EditGridEditingStateArgs,
    EditGridSubDetailRenderArgs,
    GridRow,
    IEditGridView_Style,
} from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid_Data";
import { getEditGridRowId, useEditGridSubDetailState } from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid_Hook";
import { PreviewFrame } from "@/Features/Pages/Server/Scaffold/Preview/PreviewFrame";
import { buildServerPreviewToolbarButton, useServerPreviewFrame } from "@/Features/Pages/Server/Scaffold/Preview/PreviewFrame_Hook";
import { SystemInfoTabComp } from "@/Features/Pages/Server/Scaffold/SystemTab/SystemTab";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { LibTabsProp } from "@/SysCore/Components/FormField/FieldComponets/LibTabs_Comp";
import { LibTextBox, LibTinyMCE } from "@/SysCore/Components/FormField/LibFormField";
import type { ILibTinyMCEStyle } from "@/SysCore/Components/FormField/LibFormField";
import { useSetTableField } from "@/SysCore/Components/FormField/useSetTableField";
import { TabContentComp } from "@/SysCore/Components/TabContent/TabContent";
import type { Lang } from "@/SysCore/i18n/lang";
import { LibRoutePath } from "@/SysCore/Utils/Route/LibRoute";
import type { components } from "@/types/api";
import { PGID, TimelineFields, TimelineLangDetailFields, TimelineSetFields } from "@/types/SchemaFields";
import type { ReactNode } from "react";
import { useCallback, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
    timelineEmptyData,
    type TimelineLangDetailGridRow,
    useTimelineFormTemplate,
    useTimelineItemEditGrid,
    useTimelineLangDetailEditGrid,
} from "./Server_Timeline_Form_Hook";

// #region Property
type TimelineSet = components["schemas"]["TimelineSet_DTO"];

interface TimelineFormCompProps
{
    /** 後台主題設定 */
    theme: IBETheme;

    /** 目前語系 */
    lang: Lang;
}

interface HeaderSectionProps
{
    /** 後台主題設定 */
    theme: IBETheme;

    /** Form Template 提供的主資料 binding */
    binding: ServerFormBinding<TimelineSet>;
}

interface DetailSectionProps
{
    /** 後台主題設定 */
    theme: IBETheme;

    /** 目前語系 */
    lang: Lang;

    /** Form Template 提供的主資料 binding */
    binding: ServerFormBinding<TimelineSet>;
}

interface HeaderTabContentOptions extends HeaderSectionProps
{
    /** 欄位 binding helper */
    setField: ReturnType<typeof useSetTableField<TimelineSet>>;
}

interface LangDetailGridProps extends DetailSectionProps
{
    /** TimelineItem 的 RowId */
    parentRowId: number;

    /** 子層 Grid 編輯狀態變化，回報給父層避免資料語意錯位 */
    onEditingStateChange: (args: EditGridEditingStateArgs) => void;
}

interface ContentEditorProps extends HeaderSectionProps
{
    /** 目前語系明細 Grid Row */
    row: GridRow;
}

const editGridStyle: IEditGridView_Style = {
    TableStyle: "table table-striped table-bordered table-hover",
    ToolbarStyle: "d-flex align-items-center justify-content-between mb-2",
    ButtonStyle: "btn btn-custom btn-rounded btn-sm",
    DangerButtonStyle: "btn btn-danger btn-rounded btn-sm",
    ErrorStyle: "text-danger small mt-1",
};

const fullWidthTinyMceStyle: ILibTinyMCEStyle = { Labelstyle: "sr-only visually-hidden", SelectStyle: "col-12 p-0 mb-1" };
// #endregion

// #region Public
/** 後台紀事表 Form，透過新版 Form Template 統一外框與資料流程。 */
export const Server_Timeline_Form_Comp = (props: TimelineFormCompProps) =>
{
    const { internalId } = useParams();
    const navigate = useNavigate();
    const pathname = useLocation().pathname;
    const preview = useServerPreviewFrame<TimelineSet>({ ProgId: PGID.Timeline });
    const onBackToList = useCallback(() =>
    {
        navigate(LibRoutePath.buildServerBackToListPath(pathname));
    }, [navigate, pathname]);

    const actionsOpt = useMemo(() =>
    {
        return { onBackToList, onPreviewFromDto: preview.openPreview };
    }, [onBackToList, preview.openPreview]);

    const template = useTimelineFormTemplate({ lang: props.lang, theme: props.theme, internalId: internalId ?? "", emptyData: timelineEmptyData, actionsOpt });

    return (
        <Server_FormTemplate_Comp
            template={template}
            resolveActionToolbarButtons={({ vm }) => [
                buildServerPreviewToolbarButton({ action: vm.actions.Preview }),
            ]}
            renderContent={({ vm }) => (
                <>
                    <TimelineContentComp theme={props.theme} lang={props.lang} binding={vm.binding} />
                    <PreviewFrame open={preview.isOpen} siteIndex={preview.siteIndex} onClose={preview.closePreview} payload={preview.framePayload} title={preview.title} />
                </>
            )}
        />
    );
};
// #endregion

// #region Section
/** Timeline 主要內容，Header 維持舊 input，紀事項目改由 EditGrid 呈現。 */
const TimelineContentComp = (props: DetailSectionProps) =>
{
    return (
        <>
            <HeaderComp theme={props.theme} binding={props.binding} />
            <TimelineItemGridComp theme={props.theme} lang={props.lang} binding={props.binding} />
        </>
    );
};

/** 紀事表 Header 區塊，保留舊版 Header input 並改用 Template Binding。 */
const HeaderComp = (props: HeaderSectionProps) =>
{
    const setField = useSetTableField<TimelineSet>(props.binding);
    const tabInfo: LibTabsProp = { Style: props.theme.Tabs, item: { Basic: "基本", System: "系統資訊" } };
    const tabContent = buildHeaderTabContent({ ...props, setField });

    return <TabContentComp tabInfos={tabInfo} components={tabContent}></TabContentComp>;
};

/** 紀事項目父層 Grid，透過查看按鈕展開語系明細。 */
const TimelineItemGridComp = (props: DetailSectionProps) =>
{
    const subDetailState = useEditGridSubDetailState();
    const renderSubDetailToggle = useCallback(
        (args: EditGridCellRenderArgs) => (
            <TimelineSubDetailToggleButton
                row={args.row}
                expandedRowKey={subDetailState.expandedRowKey}
                isSubDetailEditing={subDetailState.isSubDetailEditing}
                onToggle={subDetailState.toggleSubDetail}
            />
        ),
        [subDetailState.expandedRowKey, subDetailState.isSubDetailEditing, subDetailState.toggleSubDetail],
    );

    const renderSubDetail = useCallback(
        (args: EditGridSubDetailRenderArgs) => (
            <TimelineLangDetailGridComp
                theme={props.theme}
                lang={props.lang}
                binding={props.binding}
                parentRowId={getEditGridRowId(args.row, args.rowIndex)}
                onEditingStateChange={subDetailState.onSubDetailEditingStateChange}
            />
        ),
        [props.binding, props.lang, props.theme, subDetailState.onSubDetailEditingStateChange],
    );

    const itemGrid = useTimelineItemEditGrid({
        binding: props.binding,
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

/** 語系子明細 Grid，TinyMCE 放在 Grid 下方，避免再插入一筆 SubDetail Row。 */
const TimelineLangDetailGridComp = (props: LangDetailGridProps) =>
{
    const contentState = useEditGridSubDetailState();

    const renderContentToggle = useCallback(
        (args: EditGridCellRenderArgs) => <TimelineContentToggleButton row={args.row} expandedRowKey={contentState.expandedRowKey} onToggle={contentState.toggleSubDetail} />,
        [contentState.expandedRowKey, contentState.toggleSubDetail],
    );

    const langGrid = useTimelineLangDetailEditGrid({
        binding: props.binding,
        parentRowId: props.parentRowId,
        lang: props.lang,
        style: editGridStyle,
        renderContentToggle,
    });

    const contentRow = useMemo(() =>
    {
        return findTimelineGridRowByKey(langGrid.gridData.rows, contentState.expandedRowKey);
    }, [contentState.expandedRowKey, langGrid.gridData.rows]);

    return (
        <div className="p-3" style={{ backgroundColor: "#fafafa", border: "1px solid #dee2e6" }}>
            <div className="mb-2 font-weight-bold">語系明細</div>
            <EditGrid {...langGrid.editGridProps} onEditingStateChange={props.onEditingStateChange} />
            {contentRow && <TimelineContentEditorComp theme={props.theme} binding={props.binding} row={contentRow} />}
        </div>
    );
};

/** TinyMCE 內容編輯區，移除前置 Label 並讓編輯器吃滿展開區。 */
const TimelineContentEditorComp = (props: ContentEditorProps) =>
{
    const setField = useSetTableField<TimelineSet>(props.binding);
    const rowKeys = buildTimelineLangDetailRowKeys(props.row as TimelineLangDetailGridRow);
    const contentField = setField(TimelineSetFields.TimelineLangDetail, TimelineLangDetailFields.Content, "string", rowKeys);

    return (
        <div className="p-3 w-100" style={{ backgroundColor: "#fff", border: "1px solid #e9ecef" }}>
            <LibTinyMCE {...contentField} Style={fullWidthTinyMceStyle} />
        </div>
    );
};
// #endregion

// #region Protected
/** 建立紀事表 Header 的各分頁欄位。 */
const buildHeaderTabContent = (opt: HeaderTabContentOptions): Record<string, ReactNode[]> =>
{
    return { Basic: buildBasicFields(opt), System: [<SystemInfoTabComp theme={opt.theme} formData={opt.binding} setKey={TimelineSetFields.Timeline} />] };
};

/** 建立基本資料欄位。 */
const buildBasicFields = (opt: HeaderTabContentOptions): ReactNode[] =>
{
    return [
        <LibTextBox
            Style={opt.theme.TextBox}
            DefaultInputDisplay="請輸入"
            {...opt.setField(TimelineSetFields.Timeline, TimelineFields.TimelineName, "string")}
        />,
    ];
};

/** 建立返回列表頁路徑。 */
/** 建立 TimelineLangDetail 的 Binding row keys，避免 undefined/null 主鍵造成 upsert 追加空白列。 */
const buildTimelineLangDetailRowKeys = (row: TimelineLangDetailGridRow): Record<string, string | number> =>
{
    const rowKeys = buildTimelineLangDetailBaseRowKeys(row);
    if (row.TimelineId) rowKeys[TimelineLangDetailFields.TimelineId] = row.TimelineId;

    return rowKeys;
};

/** 建立語系明細必要主鍵，使用 ParentRowId + RowId + Lang 精準定位資料列。 */
const buildTimelineLangDetailBaseRowKeys = (row: TimelineLangDetailGridRow): Record<string, string | number> =>
{
    return {
        [TimelineLangDetailFields.ParentRowId]: Number(row.ParentRowId ?? 0),
        [TimelineLangDetailFields.RowId]: Number(row.DetailRowId ?? row.RowId ?? row.rowId ?? 0),
        [TimelineLangDetailFields.Lang]: String(row.Lang ?? ""),
    };
};
// #endregion

// #region Private
/** 紀事項目語系明細展開按鈕。 */
const TimelineSubDetailToggleButton = (
    props: { row: GridRow; expandedRowKey: string | null; isSubDetailEditing: boolean; onToggle: (row: GridRow) => void; },
) =>
{
    const rowKey = getTimelineGridRowKey(props.row);
    const isExpanded = props.expandedRowKey === rowKey;
    const title = isExpanded ? "收合語系明細" : "查看語系明細";

    return (
        <button
            type="button"
            className="btn btn-outline-primary btn-sm"
            title={title}
            disabled={props.isSubDetailEditing}
            onClick={() => props.onToggle(props.row)}
        >
            <i className={isExpanded ? "fa fa-eye-slash" : "fa fa-eye"} aria-hidden="true" />
            <span className="ml-1">{isExpanded ? "收合" : "查看"}</span>
        </button>
    );
};

/** TinyMCE 內容展開按鈕。 */
const TimelineContentToggleButton = (props: { row: GridRow; expandedRowKey: string | null; onToggle: (row: GridRow) => void; }) =>
{
    const rowKey = getTimelineGridRowKey(props.row);
    const isExpanded = props.expandedRowKey === rowKey;
    const title = isExpanded ? "收合事件內容" : "查看事件內容";

    return (
        <button type="button" className="btn btn-outline-secondary btn-sm" title={title} onClick={() => props.onToggle(props.row)}>
            <i className={isExpanded ? "fa fa-edit" : "fa fa-file-alt"} aria-hidden="true" />
            <span className="ml-1">{isExpanded ? "收合" : "編輯內容"}</span>
        </button>
    );
};

/** 取得 Grid Row key，讓展開狀態與 EditGrid 內部 row key 一致。 */
const getTimelineGridRowKey = (row: GridRow | null | undefined, rowIndex?: number): string =>
{
    if (!row) return "";

    const rowId = row.keyId || row.RowId || row.rowId || row.rowid;
    if (rowId !== null && rowId !== undefined && rowId !== "") return String(rowId);

    return rowIndex === undefined ? "" : `fallback-${rowIndex}`;
};

/** 依目前展開 key 從最新 Grid rows 找出 TinyMCE 需要綁定的語系列。 */
const findTimelineGridRowByKey = (rows: GridRow[], rowKey: string | null): GridRow | null =>
{
    if (!rowKey) return null;

    return rows.find((row, index) => getTimelineGridRowKey(row, index) === rowKey) ?? null;
};
// #endregion
