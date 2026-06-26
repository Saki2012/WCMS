import { AAInputFieldItem } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/AAInputField__Atoms";
import type { AAInputField, AAInputOption, AAInputType, AAInputValue } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/AAInputField__Atoms";
import { OperationGuideHelp_Comp } from "@/SysCore/Components/Grid/OperationGuideHelp_Comp";
import {
    type CSSProperties,
    type Dispatch,
    Fragment,
    type KeyboardEvent as ReactKeyboardEvent,
    type MouseEvent as ReactMouseEvent,
    type PointerEvent as ReactPointerEvent,
    type ReactNode,
    type RefObject,
    type SetStateAction,
    useEffect,
    useMemo,
    useRef,
    useState,
    type WheelEvent as ReactWheelEvent,
} from "react";
import { createPortal } from "react-dom";
// import "./EditGrid.css";
import { LibDate } from "@/SysCore/Utils/Library/LibData";
import type {
    ColumnConfig,
    EditGridCellRenderArgs,
    EditGridCellValue,
    EditGridCellValueChangeResult,
    EditGridCellValueChangeReturn,
    EditGridFileValue,
    EditGridInputType,
    EditGridOptionValue,
    EditGridProps,
    EditGridRowState,
    EditGridSelectOption,
    GridProps,
    GridRow,
    IEditGridView_Style,
    RowCell,
} from "./EditGrid_Data";

// #region Property
const ACTION_COLUMN_KEY = "__editGridAction";
const ROW_NO_COLUMN_KEY = "__editGridRowNo";
const ACTION_COLUMN_DEFAULT_WIDTH = 148;
const ROW_NO_COLUMN_DEFAULT_WIDTH = 80;
const DEFAULT_MAX_VISIBLE_ROWS = 5;
const DEFAULT_SCROLL_BOX_FIXED_HEIGHT_PX = 450;
const DEFAULT_HEADER_ESTIMATED_HEIGHT_PX = 46;
const DEFAULT_ROW_ESTIMATED_HEIGHT_PX = 68;
const EDIT_GRID_DESKTOP_BREAKPOINT_PX = 1024;

const EmptyGridData: GridProps = { columns: [], rows: [], CurrentPage: 1, TotalPage: 1, onPageChange: () => undefined };
type EditGridDragPlacement = "before" | "after";
interface EditGridDragPointer
{
    x: number;
    y: number;
}

interface EditGridDragTarget
{
    rowIndex: number;
    placement: EditGridDragPlacement;
}

interface EditGridPointerRowRect
{
    rowIndex: number;
    top: number;
    bottom: number;
    height: number;
}

// [Fix] 全域自增 ID，避免新增/刪除後 new-${rowIndex} key 碰撞
let _newRowIdCounter = 0;
const generateNewRowId = () => `new-${++_newRowIdCounter}-${Date.now()}`;
// #endregion

// #region Public
/** 可編輯 Grid：支援欄寬、橫向捲動、拖曳排序、列編輯、新增、刪除與檔案預覽。 */
export const EditGrid = (props: EditGridProps) =>
{
    const sourceGridData = props.GridData ?? props.gridData ?? EmptyGridData;
    const [gridData, setGridData] = useState<GridProps>(() => normalizeGridData(sourceGridData));
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [dragPlacement, setDragPlacement] = useState<EditGridDragPlacement>("before");
    const [dragPointer, setDragPointer] = useState<EditGridDragPointer | null>(null);
    const [, setResizeGuideX] = useState<number | null>(null);
    const [editingKeys, setEditingKeys] = useState<Set<string>>(() => new Set<string>());
    const [backupMap, setBackupMap] = useState<Record<string, GridRow>>({});
    const pendingAddedRowIndexRef = useRef<number | null>(null);
    const scrollBoxRef = useRef<HTMLDivElement>(null);
    const isDesktopViewport = useEditGridDesktopViewport(EDIT_GRID_DESKTOP_BREAKPOINT_PX);
    const tableScroll = useEditGridTableScrollClass(isDesktopViewport);
    const grabScroll = useEditGridGrabScroll(scrollBoxRef);
    // [Fix] dragAutoScroll 回傳的 onDragOver 先前未使用，現改由 moveRowDrag 呼叫自動捲動，hook 僅需觸發 cleanup
    useEditGridDragAutoScroll(scrollBoxRef, dragIndex);
    useEditGridDragWheelScroll(scrollBoxRef, dragIndex, setDragOverIndex, setDragPlacement, setDragPointer);

    const storageKey = props.storageKey ?? "edit-grid-col-widths";
    const [systemWidths, setSystemWidths] = useState<Record<string, number>>(() => readSavedWidths(storageKey));
    const sourceColumns = Array.isArray(gridData.columns) ? gridData.columns : [];
    const sourceRows = Array.isArray(gridData.rows) ? gridData.rows : [];
    const sourceGridDataRef = useRef(sourceGridData);
    sourceGridDataRef.current = sourceGridData;

    /** 外部 GridData 只用內容簽章當依賴，避免父層每 render 產生新物件造成同步循環。 */
    const sourceGridDataSignature = buildGridDataSnapshotText(sourceGridData);
    const sourceColumnSignature = buildColumnListSignature(sourceColumns);
    const stableSourceColumns = useMemo(() => sourceColumns, [sourceColumnSignature]);
    const { columns, resizeColumn } = useEditGridColumns(stableSourceColumns, storageKey);
    const rows = sourceRows;
    const rowKeySignature = useMemo(() => buildRowKeySignature(rows), [rows]);
    const disabled = props.disabled === true;
    const hasEditingRow = editingKeys.size > 0;
    const canAdd = props.canAdd === true && !disabled && !hasEditingRow;
    const canEdit = props.canEdit === true && !disabled;
    const canDelete = props.canDelete === true && !disabled;
    const canDrag = props.canDrag === true && !disabled && rows.length > 1;
    const hasActionCell = props.canEdit === true || props.canDelete === true || props.canDrag === true;

    const visibleColumns = useMemo(() => (Array.isArray(columns) ? columns : []).filter(col => col.visible !== false), [columns]);
    const bodyColSpan = visibleColumns.length + (hasActionCell ? 1 : 0) + (props.showRowNo === true ? 1 : 0);
    const actionColumnWidth = systemWidths[ACTION_COLUMN_KEY] ?? ACTION_COLUMN_DEFAULT_WIDTH;
    const rowNoColumnWidth = systemWidths[ROW_NO_COLUMN_KEY] ?? ROW_NO_COLUMN_DEFAULT_WIDTH;
    const systemColumnWidth = (hasActionCell ? actionColumnWidth : 0) + (props.showRowNo === true ? rowNoColumnWidth : 0);
    const tableMinWidth = useMemo(() => getTableMinWidth(visibleColumns, props.minTableWidth, systemColumnWidth), [
        visibleColumns,
        props.minTableWidth,
        systemColumnWidth,
    ]);
    const shouldScroll = useShouldUseXScroll(props.scrollBreakpoint ?? tableMinWidth);
    const maxVisibleRows = normalizeMaxVisibleRows(props.maxVisibleRows);
    const estimatedHeaderHeightPx = normalizePositivePixel(props.estimatedHeaderHeightPx, DEFAULT_HEADER_ESTIMATED_HEIGHT_PX);
    const estimatedRowHeightPx = normalizePositivePixel(props.estimatedRowHeightPx, DEFAULT_ROW_ESTIMATED_HEIGHT_PX);
    const shouldUseYScroll = shouldUseVerticalScroll(isDesktopViewport, rows.length, maxVisibleRows);
    const measuredHeaderHeightPx = useEditGridMeasuredHeaderHeight(scrollBoxRef, rows, shouldUseYScroll, estimatedHeaderHeightPx);
    const isHeaderScrolled = useEditGridHeaderScrolled(scrollBoxRef, shouldUseYScroll);
    const scrollBoxHeightPx = getScrollBoxFixedHeightPx(shouldUseYScroll, measuredHeaderHeightPx, maxVisibleRows, estimatedRowHeightPx);
    const errors = useMemo(() => buildErrorMap(rows, visibleColumns), [rows, visibleColumns]);

    /** 外部 GridData 內容真的變更時才同步，避免父層每次 render 給新物件造成循環。 */
    useEffect(() =>
    {
        const normalized = normalizeGridData(sourceGridDataRef.current);
        setGridData(prev => isSameGridDataSnapshot(prev, normalized) ? prev : normalized);
    }, [sourceGridDataSignature]);
    useEffect(() =>
    {
        const rowKeySet = buildRowKeySet(rows);
        setEditingKeys(prev => syncEditingKeys(prev, rowKeySet));
        setBackupMap(prev => syncBackupMap(prev, rowKeySet));
    }, [rowKeySignature]);
    useEffect(() => setSystemWidths(readSavedWidths(storageKey)), [storageKey]);
    useEffect(() => scrollPendingAddedRowIntoView(scrollBoxRef, pendingAddedRowIndexRef), [rows.length]);

    const onEditingStateChangeRef = useRef(props.onEditingStateChange);
    const editingStateSignatureRef = useRef("");

    /** 保存最新的編輯狀態 callback，避免 callback reference 造成循環觸發。 */
    useEffect(() =>
    {
        onEditingStateChangeRef.current = props.onEditingStateChange;
    }, [props.onEditingStateChange]);

    /** 編輯狀態真的變更時才通知外層，避免外層 setState 後重複回呼。 */
    useEffect(() =>
    {
        const nextEditingKeys = Array.from(editingKeys);
        const nextSignature = `${hasEditingRow}|${nextEditingKeys.join(",")}`;

        if (editingStateSignatureRef.current === nextSignature) return;

        editingStateSignatureRef.current = nextSignature;
        onEditingStateChangeRef.current?.({ editingKeys: nextEditingKeys, hasEditingRow });
    }, [editingKeys, hasEditingRow]);

    const resizeAnyColumn = (key: string, width: number, persist: boolean = true) =>
    {
        if (key !== ACTION_COLUMN_KEY && key !== ROW_NO_COLUMN_KEY)
        {
            resizeColumn(key, width, persist);
            return;
        }
        const nextWidths = { ...systemWidths, [key]: width };
        setSystemWidths(nextWidths);
        if (persist) saveColumnWidthsRecord({ ...readSavedWidths(storageKey), [key]: width }, storageKey);
    };

    const commitGridData = (nextGridData: GridProps) =>
    {
        const normalized = normalizeGridData(nextGridData);
        setGridData(normalized);
        props.onGridDataChange?.(normalized);
        props.onRowsChange?.(normalized.rows);
    };

    const commitRows = (nextRows: GridRow[]) => commitGridData({ ...gridData, columns, rows: rebuildRowNo(nextRows) });
    const addRow = () => handleAddRow(canAdd, props, rows, editingKeys, pendingAddedRowIndexRef, commitRows, setEditingKeys);
    const editRow = (rowIndex: number) => handleEditRow(rows, rowIndex, editingKeys, setEditingKeys, setBackupMap);
    const saveRow = (rowIndex: number) => handleSaveRow(rows, rowIndex, visibleColumns, setEditingKeys, setBackupMap, commitRows);
    const cancelRow = (rowIndex: number) => handleCancelRow(rows, rowIndex, backupMap, setEditingKeys, setBackupMap, commitRows);
    const deleteRow = (rowIndex: number) => handleDeleteRow(canDelete, props, rows, rowIndex, commitRows);
    const moveRow = (rowIndex: number, offset: number) =>
    {
        if (canDrag) commitRows(moveItem(rows, rowIndex, rowIndex + offset));
    };
    const updateCell = (rowIndex: number, columnKey: string, value: EditGridCellValue) => commitRows(updateRowCellValue(rows, rowIndex, columnKey, value));
    const updateCells = (rowIndex: number, values: Record<string, EditGridCellValue>) => commitRows(updateRowCellValues(rows, rowIndex, values));
    const startRowDrag = (event: ReactPointerEvent<HTMLElement>, rowIndex: number) => startPointerRowDrag(event, rowIndex, setDragIndex, setDragOverIndex, setDragPlacement, setDragPointer);
    const moveRowDrag = (event: ReactPointerEvent<HTMLElement>) => movePointerRowDrag(event, dragIndex, setDragOverIndex, setDragPlacement, setDragPointer);
    const endRowDrag = (event: ReactPointerEvent<HTMLElement>) =>
        endPointerRowDrag(
            event,
            rows,
            canDrag,
            dragIndex,
            dragOverIndex,
            dragPlacement,
            commitRows,
            setDragIndex,
            setDragOverIndex,
            setDragPlacement,
            setDragPointer,
        );
    const dragPreviewRow = dragIndex === null ? undefined : rows[dragIndex];
    const dragPreviewTargetRowNo = getDragPreviewTargetRowNo(rows, dragIndex, dragOverIndex, dragPlacement);
    const dragPreviewText = dragIndex === null || !dragPreviewRow ? "" : getDragPreviewText(getRowNo(dragPreviewRow, dragIndex), dragPreviewTargetRowNo);

    /** 保留原本水平拖曳捲動行為。 */
    const handleScrollBoxPointerDown = (event: ReactPointerEvent<HTMLDivElement>) =>
    {
        grabScroll.onPointerDown(event);
    };

    /** 拖曳表格捲動時同步原本水平捲動位置。 */
    const handleScrollBoxPointerMove = (event: ReactPointerEvent<HTMLDivElement>) =>
    {
        grabScroll.onPointerMove(event);
    };

    /** 結束指標操作。 */
    const handleScrollBoxPointerUp = (event: ReactPointerEvent<HTMLDivElement>) =>
    {
        grabScroll.onPointerUp(event);
    };

    /** 鍵盤移動捲動區時保留原本水平捲動行為。 */
    const handleScrollBoxKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) =>
    {
        grabScroll.onKeyDown(event);
    };

    /** 表格內滾輪只捲動 EditGrid，避免連動整頁滾動。 */
    const handleScrollBoxWheel = (event: ReactWheelEvent<HTMLDivElement>) =>
    {
        preventPageWheelWhenTableScrolling(scrollBoxRef.current, event);
    };

    return (
        <div className="edit-grid-root" style={getEditGridRootStyle()}>
            <EditGridToolbar props={props} canAdd={canAdd} onAdd={addRow} />
            <div className={getEditGridTableWrapClassName(tableScroll.isActive)} style={getEditGridTableWrapStyle()}>
                <div
                    ref={scrollBoxRef}
                    className="edit-grid-scroll-box"
                    style={getScrollBoxStyle(
                        shouldScroll,
                        grabScroll.isDragging,
                        shouldUseYScroll,
                        scrollBoxHeightPx,
                    )}
                    tabIndex={0}
                    role="region"
                    aria-label="可水平拖曳捲動的表格區塊"
                    onMouseEnter={tableScroll.markMouseInside}
                    onMouseLeave={tableScroll.markMouseOutside}
                    onWheel={handleScrollBoxWheel}
                    onPointerDown={handleScrollBoxPointerDown}
                    onPointerMove={handleScrollBoxPointerMove}
                    onPointerUp={handleScrollBoxPointerUp}
                    onPointerCancel={handleScrollBoxPointerUp}
                    onKeyDown={handleScrollBoxKeyDown}
                >
                    <EditGridStickyHeaderBackdrop enabled={shouldUseYScroll} heightPx={measuredHeaderHeightPx} />
                    <table
                        className={props.style?.TableStyle ?? "table table-striped table-bordered table-hover mb-1"}
                        style={getTableStyle(shouldScroll, tableMinWidth)}
                        aria-label={props.ariaLabel ?? props.title ?? "可編輯資料表格"}
                    >
                        <EditGridColGroup
                            columns={visibleColumns}
                            hasActionCell={hasActionCell}
                            showRowNo={props.showRowNo === true}
                            actionWidth={actionColumnWidth}
                            rowNoWidth={rowNoColumnWidth}
                        />
                        <EditGridHeader
                            columns={visibleColumns}
                            hasActionCell={hasActionCell}
                            showRowNo={props.showRowNo === true}
                            actionWidth={actionColumnWidth}
                            rowNoWidth={rowNoColumnWidth}
                            isHeaderScrolled={isHeaderScrolled}
                            style={props.style}
                            actionTitle={props.actionColumnTitle}
                            onResize={resizeAnyColumn}
                            onResizeGuide={setResizeGuideX}
                        />
                        <tbody>
                            {rows.length === 0 && <EditGridEmptyRow colSpan={bodyColSpan} emptyText={props.emptyText} />}
                            {rows.map((row, rowIndex) =>
                            {
                                const rowKey = getRowKey(row, rowIndex);
                                const isEditing = editingKeys.has(rowKey);
                                const isSubDetailExpanded = props.expandedRowKey !== null && props.expandedRowKey !== undefined
                                    && String(props.expandedRowKey) === rowKey;
                                const canEditThisRow = canEdit && (!hasEditingRow || isEditing);
                                const showPlaceholderBefore = shouldRenderDropPlaceholder(rowIndex, dragIndex, dragOverIndex, dragPlacement, "before");
                                const showPlaceholderAfter = shouldRenderDropPlaceholder(rowIndex, dragIndex, dragOverIndex, dragPlacement, "after");

                                return (
                                    <Fragment key={rowKey}>
                                        {showPlaceholderBefore && <EditGridDropPlaceholder colSpan={bodyColSpan} />}
                                        <tr data-edit-grid-row-index={rowIndex} className={getRowClassName(rowIndex, props.style, dragIndex)}>
                                            {hasActionCell && (
                                                <EditGridActionCell
                                                    row={row}
                                                    rowIndex={rowIndex}
                                                    isEditing={isEditing}
                                                    canEdit={canEditThisRow}
                                                    canDrag={canDrag && !isEditing}
                                                    canDelete={canDelete}
                                                    style={props.style}
                                                    deleteText={props.deleteButtonText}
                                                    editText={props.editButtonText}
                                                    saveText={props.saveButtonText}
                                                    cancelText={props.cancelButtonText}
                                                    onEdit={editRow}
                                                    onSave={saveRow}
                                                    onCancel={cancelRow}
                                                    onMove={moveRow}
                                                    onDelete={deleteRow}
                                                    onDragStart={(event) => startRowDrag(event, rowIndex)}
                                                    onDragMove={moveRowDrag}
                                                    onDragEnd={endRowDrag}
                                                />
                                            )}
                                            {props.showRowNo === true && (
                                                <td className="table_td_vertical_align" data-th="序號" style={getEditGridCellStyle()}>
                                                    <div className="edit-grid-cell-content" style={getEditGridCellContentStyle()}>
                                                        {getRowNo(row, rowIndex)}
                                                    </div>
                                                </td>
                                            )}
                                            {visibleColumns.map(column => (
                                                <td
                                                    key={column.key}
                                                    headers={column.key}
                                                    className={`table_td_vertical_align ${props.style?.CellStyle ?? ""}`.trim()}
                                                    data-th={column.title}
                                                    style={getEditGridCellStyle()}
                                                >
                                                    <div className="edit-grid-cell-content" style={getEditGridCellContentStyle()}>
                                                        <EditGridCell
                                                            row={row}
                                                            rowIndex={rowIndex}
                                                            column={column}
                                                            error={errors[getErrorKey(rowIndex, column.key)]}
                                                            disabled={!canEdit || !isEditing}
                                                            errorClassName={props.style?.ErrorStyle}
                                                            onUpdate={updateCell}
                                                            onUpdateValues={updateCells}
                                                        />
                                                    </div>
                                                </td>
                                            ))}
                                        </tr>
                                        {isSubDetailExpanded && props.subDetailRender && (
                                            <tr className={props.subDetailRowClassName ?? "edit-grid-sub-detail-row"}>
                                                <td colSpan={bodyColSpan} style={getEditGridCellStyle()}>
                                                    {props.subDetailRender({ row, rowIndex, rowKey, disabled })}
                                                </td>
                                            </tr>
                                        )}
                                        {showPlaceholderAfter && <EditGridDropPlaceholder colSpan={bodyColSpan} />}
                                    </Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <EditGridDragPreview text={dragPreviewText} pointer={dragPointer} />
        </div>
    );
};
// #endregion

// #region Section
/** 表格上方工具列，提供新增列與操作說明。 */
const EditGridToolbar = (args: { props: EditGridProps; canAdd: boolean; onAdd: () => void; }) =>
{
    const { props, canAdd, onAdd } = args;
    const showGuide = props.showOperationGuide !== false;
    if (!canAdd && !showGuide) return null;

    return (
        <div className={props.style?.ToolbarStyle ?? "d-flex align-items-center justify-content-between mb-2"}>
            <div>{showGuide && <OperationGuideHelp_Comp lang={props.lang} />}</div>
            {canAdd && (
                <button type="button" className={props.style?.ButtonStyle ?? "btn btn-custom btn-rounded btn-sm "} onClick={onAdd}>
                    {props.addButtonText ?? "新增"}
                </button>
            )}
        </div>
    );
};

/** 輸出 colgroup，讓欄寬能穩定套用到標題與內容列。 */
const EditGridColGroup = (props: { columns: ColumnConfig[]; hasActionCell: boolean; showRowNo: boolean; actionWidth: number; rowNoWidth: number; }) =>
{
    return (
        <colgroup>
            {props.hasActionCell && <col style={{ width: toCssWidth(props.actionWidth), minWidth: toCssWidth(120) }} />}
            {props.showRowNo && <col style={{ width: toCssWidth(props.rowNoWidth), minWidth: toCssWidth(64) }} />}
            {props.columns.map(col => <col key={col.key} style={{ width: toCssWidth(col.width), minWidth: toCssWidth(col.minWidth) }} />)}
        </colgroup>
    );
};

/** 表格標題列，支援拖曳欄位分隔線調整欄寬。 */
const EditGridHeader = (
    props: {
        columns: ColumnConfig[];
        hasActionCell: boolean;
        showRowNo: boolean;
        actionWidth: number;
        rowNoWidth: number;
        isHeaderScrolled: boolean;
        style?: IEditGridView_Style;
        actionTitle?: string;
        onResize: (key: string, width: number, persist?: boolean) => void;
        onResizeGuide: (x: number | null) => void;
    },
) =>
{
    const headerClassName = getEditGridHeaderClassName(props.style?.ColumnStyle, props.isHeaderScrolled);

    return (
        <thead>
            {/* [Fix] 移除殘留 className="111" */}
            <tr style={{ background: "rgba(0, 0, 0, .075)" }}>
                {props.hasActionCell && (
                    <th
                        scope="col"
                        className={headerClassName}
                        style={getEditGridHeaderCellStyle({ width: toCssWidth(props.actionWidth), minWidth: toCssWidth(120) })}
                    >
                        {props.actionTitle ?? "動作"}
                        <ColumnResizeHandle columnKey={ACTION_COLUMN_KEY} onResize={props.onResize} onResizeGuide={props.onResizeGuide} />
                    </th>
                )}
                {props.showRowNo && (
                    <th
                        scope="col"
                        className={headerClassName}
                        style={getEditGridHeaderCellStyle({ width: toCssWidth(props.rowNoWidth), minWidth: toCssWidth(64) })}
                    >
                        序號
                        <ColumnResizeHandle columnKey={ROW_NO_COLUMN_KEY} onResize={props.onResize} onResizeGuide={props.onResizeGuide} />
                    </th>
                )}
                {props.columns.map((col) => (
                    // [Fix] 所有欄位（含最後一欄）都加上 ColumnResizeHandle，讓使用者可調整任意欄寬
                    <th
                        key={col.key}
                        id={col.key}
                        scope="col"
                        className={headerClassName}
                        style={getEditGridHeaderCellStyle({ width: toCssWidth(col.width), minWidth: toCssWidth(col.minWidth) })}
                    >
                        {col.title}
                        <ColumnResizeHandle columnKey={col.key} onResize={props.onResize} onResizeGuide={props.onResizeGuide} />
                    </th>
                ))}
            </tr>
        </thead>
    );
};

/** 建立 sticky 表頭背板，遮住 th 縫隙並提供不會被 tbody 捲走的單一底線。 */
const EditGridStickyHeaderBackdrop = (props: { enabled: boolean; heightPx: number; }) =>
{
    if (!props.enabled) return null;

    return <div className="edit-grid-sticky-header-backdrop" aria-hidden="true" style={getStickyHeaderBackdropStyle(props.heightPx)} />;
};

/** 欄位拖曳控制點，保存使用者調整後的欄寬。 */
const ColumnResizeHandle = (
    props: { columnKey: string; onResize: (key: string, width: number, persist?: boolean) => void; onResizeGuide: (x: number | null) => void; },
) =>
{
    const handleMouseDown = (event: ReactMouseEvent<HTMLDivElement>) =>
    {
        event.preventDefault();

        const startX = event.clientX;
        const th = event.currentTarget.parentElement as HTMLTableCellElement | null;
        const startWidth = th?.getBoundingClientRect().width ?? 0;
        const bodyCursor = document.body.style.cursor;
        const bodyUserSelect = document.body.style.userSelect;
        let latestWidth = startWidth;

        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
        props.onResizeGuide(startX);

        const onMouseMove = (moveEvent: MouseEvent) =>
        {
            latestWidth = Math.max(50, startWidth + (moveEvent.clientX - startX));
            props.onResizeGuide(moveEvent.clientX);
            props.onResize(props.columnKey, latestWidth, false);
        };

        const onMouseUp = () =>
        {
            props.onResizeGuide(null);
            props.onResize(props.columnKey, latestWidth, true);
            document.body.style.cursor = bodyCursor;
            document.body.style.userSelect = bodyUserSelect;
            removeResizeListeners(onMouseMove, onMouseUp);
        };

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    };

    return (
        <div
            className="edit-grid-resize-handle"
            aria-hidden="true"
            onMouseDown={handleMouseDown}
            style={{ position: "absolute", right: "-3px", top: 0, bottom: 0, width: "8px", cursor: "col-resize", userSelect: "none", zIndex: 2 }}
        />
    );
};

/** 每列操作欄，包含拖曳提示、修改、確認、取消與刪除。 */
const EditGridActionCell = (
    props: {
        row: GridRow;
        rowIndex: number;
        isEditing: boolean;
        canEdit: boolean;
        canDrag: boolean;
        canDelete: boolean;
        style?: IEditGridView_Style;
        deleteText?: string;
        editText?: string;
        saveText?: string;
        cancelText?: string;
        onEdit: (rowIndex: number) => void;
        onSave: (rowIndex: number) => void;
        onCancel: (rowIndex: number) => void;
        onMove: (rowIndex: number, offset: number) => void;
        onDelete: (rowIndex: number) => void;
        onDragStart: (event: ReactPointerEvent<HTMLElement>) => void;
        onDragMove: (event: ReactPointerEvent<HTMLElement>) => void;
        onDragEnd: (event: ReactPointerEvent<HTMLElement>) => void;
    },
) =>
{
    const rowNo = getRowNo(props.row, props.rowIndex);

    return (
        <td className={`table_td_vertical_align ${props.style?.ActionCellStyle ?? ""}`.trim()} data-th="動作" style={getEditGridCellStyle()}>
            <div className="all-btn Edit Icon" style={getEditGridActionContentStyle()}>
                {props.canDrag && (
                    <div className="icon">
                        <span
                            className="edit-grid-row-drag-handle Igrab btn btn-ctm btn-ctm-rounded"
                            title={`拖曳序號 ${rowNo}`}
                            aria-hidden="true"
                            style={{ cursor: "grab", userSelect: "none", touchAction: "none" }}
                            onPointerDown={props.onDragStart}
                            onPointerMove={props.onDragMove}
                            onPointerUp={props.onDragEnd}
                            onPointerCancel={props.onDragEnd}
                        >
                            ☰
                        </span>
                    </div>
                )}
                {props.canEdit && !props.isEditing && (
                    <div className="icon">
                        <button
                            type="button"
                            className="Ipencil btn btn-ctm btn-ctm-rounded"
                            data-bs-toggle="tooltip"
                            title={props.editText ?? "修改"}
                            aria-label={`第 ${rowNo} 列${props.editText ?? "修改"}`}
                            onClick={() => props.onEdit(props.rowIndex)}
                        >
                            <i className="far fa-edit" aria-hidden="true"></i>
                        </button>
                    </div>
                )}
                {props.canEdit && props.isEditing && (
                    <div className="icon">
                        <button
                            type="button"
                            className="Ipencil btn btn-ctm btn-ctm-rounded"
                            data-bs-toggle="tooltip"
                            title={props.saveText ?? "確認"}
                            aria-label={`第 ${rowNo} 列${props.saveText ?? "確認"}`}
                            onClick={() => props.onSave(props.rowIndex)}
                        >
                            <i className="far fa-check-circle" aria-hidden="true"></i>
                        </button>
                    </div>
                )}
                {props.canEdit && props.isEditing && (
                    <div className="icon">
                        <button
                            type="button"
                            className="Itrash btn btn-ctm btn-ctm-rounded"
                            data-bs-toggle="tooltip"
                            title={props.cancelText ?? "取消"}
                            aria-label={`第 ${rowNo} 列${props.cancelText ?? "取消"}`}
                            onClick={() => props.onCancel(props.rowIndex)}
                        >
                            <i className="far fa-times-circle" aria-hidden="true"></i>
                        </button>
                    </div>
                )}
                {props.canDelete && !props.isEditing && (
                    <div className="icon">
                        <button
                            type="button"
                            className="Itrash btn btn-ctm btn-ctm-rounded"
                            data-bs-toggle="tooltip"
                            title={props.deleteText ?? "刪除"}
                            aria-label={`第 ${rowNo} 列${props.deleteText ?? "刪除"}`}
                            onClick={() => props.onDelete(props.rowIndex)}
                        >
                            <i className="far fa-trash-alt" aria-hidden="true"></i>
                        </button>
                    </div>
                )}
            </div>
        </td>
    );
};

/** 依欄位設定輸出唯讀內容、自訂編輯器或預設輸入元件。 */
const EditGridCell = (
    props: {
        row: GridRow;
        rowIndex: number;
        column: ColumnConfig;
        error?: string;
        disabled: boolean;
        errorClassName?: string;
        onUpdate: (rowIndex: number, columnKey: string, value: EditGridCellValue) => void;
        onUpdateValues: (rowIndex: number, values: Record<string, EditGridCellValue>) => void;
    },
) =>
{
    const cell = getCellByColumn(props.row, props.column.key, props.column);
    const value = getCellValue(cell);
    const updateValue = (nextValue: EditGridCellValue) => props.onUpdate(props.rowIndex, props.column.key, nextValue);
    const updateValues = (nextValues: Record<string, EditGridCellValue>) => props.onUpdateValues(props.rowIndex, nextValues);
    const args: EditGridCellRenderArgs = {
        row: props.row,
        rowIndex: props.rowIndex,
        cell,
        column: props.column,
        value,
        disabled: props.disabled,
        updateValue,
        updateValues,
    };
    const canEdit = getCellEditable(cell, props.column) && getCellInputType(cell, props.column) !== "readonly" && !props.disabled;
    const content = canEdit ? renderEditContent(args, props.error) : renderReadonlyContent(args);

    const shouldRenderExternalError = Boolean(props.error) && !canEdit;

    return <>{content} {shouldRenderExternalError && <div className={props.errorClassName ?? "text-danger small mt-1"}>{props.error}</div>}</>;
};

/** 沒有資料時輸出單列表格提示，避免空 tbody 造成閱讀器資訊不足。 */
const EditGridEmptyRow = (props: { colSpan: number; emptyText?: string; }) =>
{
    return (
        <tr>
            <td colSpan={props.colSpan} className="text-center py-3" style={getEditGridCellStyle()}>{props.emptyText ?? "目前沒有資料"}</td>
        </tr>
    );
};

/** 拖拉排序時顯示可放置位置的空框。 */
const EditGridDropPlaceholder = (props: { colSpan: number; }) =>
{
    return (
        <tr className="edit-grid-row-drop-placeholder">
            <td colSpan={props.colSpan} style={getEditGridCellStyle()}>
                <div className="edit-grid-row-drop-placeholder-box" aria-hidden="true">放置於此</div>
            </td>
        </tr>
    );
};

/** 拖曳中的浮動提示，透過 Portal 放到 body，避免被 EditGrid contain/overflow 重新定位。 */
const EditGridDragPreview = (props: { text: string; pointer: EditGridDragPointer | null; }) =>
{
    if (!props.text || !props.pointer || !isBrowserDocumentReady()) return null;

    return createPortal(
        <div className="edit-grid-drag-floating" style={getEditGridDragPreviewStyle(props.pointer)} aria-hidden="true">
            <span aria-hidden="true">☰</span>
            <span>{props.text}</span>
        </div>,
        document.body,
    );
};
// #endregion

// #region Protected
/** 產生欄位編輯內容，若有自訂 editRender 則優先使用，其餘全部統一走 AAInputFieldItem。 */
const renderEditContent = (args: EditGridCellRenderArgs, error?: string) =>
{
    if (args.cell.editRender) return args.cell.editRender(args);
    if (args.column.editRender) return args.column.editRender(args);
    return renderEditGridAAInputCell(args, getEditGridAAInputType(args), error);
};

/** 產生唯讀內容，日期欄位優先套用統一格式，password 固定顯示遮罩。 */
const renderReadonlyContent = (args: EditGridCellRenderArgs) =>
{
    const aaType = getEditGridAAInputType(args);
    const options = getCellOptions(args.cell, args.column);

    if (isPasswordCell(args.cell, args.column)) return getPasswordMaskedText();

    const dateText = getEditGridReadonlyDateText(args.value, aaType);
    if (dateText !== undefined) return dateText;

    if (args.cell.render) return args.cell.render(args);
    if (args.column.render) return args.column.render(args);
    if (getCellInputType(args.cell, args.column) === "file") return <FilePreview value={args.value} />;
    if (aaType === "selectSingle" || aaType === "radio") return renderOptionLabel(args.value, options);
    if (Array.isArray(args.value)) return renderOptionLabels(args.value, options);
    if (typeof args.value === "boolean") return args.value ? "是" : "否";
    return args.value ?? args.cell.content ?? "";
};

/** EditGrid cell 使用 AAInputFieldItem 的共用轉接層。 */
const renderEditGridAAInputCell = (args: EditGridCellRenderArgs, aaType: AAInputType, error?: string) =>
{
    const field = buildEditGridAAInputField(args, aaType, error);
    const handleChange = (_fieldKey: string, value: AAInputValue) => handleEditGridAAInputChange(args, aaType, value);

    return (
        <AAInputFieldItem
            baseId={`edit-grid-${getRowKey(args.row, args.rowIndex)}-${args.column.key}`}
            variant="gridCell"
            field={field}
            onChange={handleChange}
        />
    );
};

/** 將 AAInputField 的變更回寫到 EditGrid，必要時交給欄位自訂轉換。 */
const handleEditGridAAInputChange = (args: EditGridCellRenderArgs, aaType: AAInputType, rawValue: AAInputValue): void =>
{
    const nextValue = toEditGridCellValue(rawValue, args, aaType);
    const handler = args.cell.onValueChange ?? args.column.onValueChange;

    if (!handler)
    {
        args.updateValue(nextValue);
        return;
    }

    const handledValue = handler({ ...args, nextValue, rawValue });
    resolveEditGridCellValue(handledValue, args);
};

/** 支援同步或非同步的欄位值轉換結果。 */
const resolveEditGridCellValue = (value: EditGridCellValueChangeReturn | Promise<EditGridCellValueChangeReturn>, args: EditGridCellRenderArgs): void =>
{
    if (isEditGridValuePromise(value))
    {
        void value.then(result => applyEditGridCellValueChangeResult(result, args));
        return;
    }

    applyEditGridCellValueChangeResult(value, args);
};

/** 套用欄位值轉換結果，支援同步更新同列多欄位。 */
const applyEditGridCellValueChangeResult = (result: EditGridCellValueChangeReturn, args: EditGridCellRenderArgs): void =>
{
    if (!isEditGridCellValueChangeResult(result))
    {
        args.updateValue(result);
        return;
    }

    args.updateValues({ ...(result.rowValues ?? {}), [args.column.key]: result.value });
};

/** 判斷是否為欄位值轉換結果物件。 */
const isEditGridCellValueChangeResult = (value: EditGridCellValueChangeReturn): value is EditGridCellValueChangeResult =>
{
    return typeof value === "object" && value !== null && "value" in value;
};

/** 判斷欄位值轉換是否為 Promise。 */
const isEditGridValuePromise = (
    value: EditGridCellValueChangeReturn | Promise<EditGridCellValueChangeReturn>,
): value is Promise<EditGridCellValueChangeReturn> =>
{
    return typeof (value as Promise<EditGridCellValueChangeReturn>)?.then === "function";
};

/** 將 EditGrid 欄位轉成 AAInputField。 */
const buildEditGridAAInputField = (args: EditGridCellRenderArgs, aaType: AAInputType, error?: string): AAInputField =>
{
    return {
        key: args.column.key,
        type: aaType,
        label: args.column.title,
        aaLabel: buildEditGridCellAaLabel(args, aaType),
        value: toAAInputValue(args.value, aaType),
        options: toAAInputOptions(getCellOptions(args.cell, args.column)),
        required: getCellRequired(args.cell, args.column),
        placeholder: getCellPlaceholder(args.cell, args.column),
        disabled: args.disabled,
        errorText: error,
        searchable: getCellSearchable(args.cell, args.column, aaType),
        searchPlaceholder: getCellSearchPlaceholder(args.cell, args.column),
        maxSearchLength: getCellMaxSearchLength(args.cell, args.column),
        min: aaType === "number" ? getEditGridNumberMin(args) : undefined,
        max: aaType === "number" ? getEditGridNumberMax(args) : undefined,
        step: aaType === "number" ? getEditGridNumberStep(args) : undefined,
        maxLength: getCellMaxLength(args.cell, args.column),
        rows: aaType === "textarea" ? getEditGridTextareaRows(args) : undefined,
        accept: aaType === "file" ? getCellAccept(args.cell, args.column) : undefined,
        multiple: aaType === "file" ? getCellFileMultiple(args.cell, args.column) : undefined,
        maxFileCount: aaType === "file" ? getCellMaxFileCount(args.cell, args.column) : undefined,
        maxFileSizeMB: aaType === "file" ? getCellMaxFileSizeMB(args.cell, args.column) : undefined,
        helpText: getCellHelpText(args.cell, args.column),
        renderVariant: "gridCell",
    };
};

/** 將 EditGrid inputType 統一轉成 AAInputField type，舊命名與新命名都可支援。 */
const getEditGridAAInputType = (args: EditGridCellRenderArgs): AAInputType =>
{
    const inputType = getCellInputType(args.cell, args.column);

    if (inputType === "checkbox") return "checkboxSingle";
    if (inputType === "checkboxSingle") return "checkboxSingle";
    if (inputType === "checkboxGroup") return "checkboxMultiple";
    if (inputType === "checkboxMultiple") return "checkboxMultiple";
    if (inputType === "select") return getCellSelectionMode(args.cell, args.column) === "multiple" ? "selectMultiple" : "selectSingle";
    if (inputType === "selectSingle" || inputType === "selectMultiple" || inputType === "dateRange" || inputType === "dateTimeRange") return inputType;
    if (inputType === "email" || inputType === "tel" || inputType === "password" || inputType === "date" || inputType === "date-time") return inputType;
    if (inputType === "number" || inputType === "textarea" || inputType === "file" || inputType === "radio" || inputType === "readonly") return inputType;

    return "text";
};

/** 建立表格 cell 用的 AA label，讓螢幕閱讀器知道目前列與欄。 */
const buildEditGridCellAaLabel = (args: EditGridCellRenderArgs, aaType: AAInputType) =>
{
    const customLabel = getCellAaLabel(args.cell, args.column);
    if (customLabel) return customLabel;
    return `第 ${getRowNo(args.row, args.rowIndex)} 列，${args.column.title}，${getEditGridCellAaActionText(aaType)}`;
};

/** 依 AA 欄位型別取得 cell 操作提示。 */
const getEditGridCellAaActionText = (aaType: AAInputType) =>
{
    if (aaType === "email") return "請輸入有效電子郵件";
    if (aaType === "tel") return "請輸入聯絡電話";
    if (aaType === "password") return "請輸入密碼";
    if (aaType === "number") return "請輸入數字";
    if (aaType === "date") return "請選擇日期";
    if (aaType === "date-time") return "請選擇日期與時間";
    if (aaType === "dateRange") return "請選擇日期區間";
    if (aaType === "dateTimeRange") return "請選擇日期與時間區間";
    if (aaType === "textarea") return "請輸入文字內容，可多行";
    if (aaType === "selectSingle") return "請選擇項目";
    if (aaType === "selectMultiple") return "請選擇項目，可複選";
    if (aaType === "file") return "請上傳檔案";
    if (aaType === "radio") return "請選擇項目，擇一";
    if (aaType === "checkboxSingle") return "請勾選項目";
    if (aaType === "checkboxMultiple") return "請勾選項目，可複選";
    if (aaType === "readonly") return "僅供檢視";
    return "請輸入文字內容";
};

/** 將 EditGrid value 轉成 AAInputField 可吃的 value。 */
const toAAInputValue = (value: EditGridCellValue, aaType: AAInputType): AAInputValue =>
{
    if (aaType === "checkboxSingle") return Boolean(value);
    if (aaType === "selectSingle" || aaType === "radio") return toSelectValue(value);
    if (aaType === "selectMultiple" || aaType === "checkboxMultiple" || aaType === "dateRange" || aaType === "dateTimeRange") return toStringValueArray(value);
    if (aaType === "file") return toAAFileValueList(value);
    if (aaType === "number") return value === null || value === undefined ? "" : String(value);
    if (aaType === "date") return formatEditGridDateValue(value) ?? "";
    return toInputValue(value);
};

/** 將 AAInputField 回傳值轉回 EditGridCellValue。 */
const toEditGridCellValue = (value: AAInputValue, args: EditGridCellRenderArgs, aaType: AAInputType): EditGridCellValue =>
{
    const options = getCellOptions(args.cell, args.column);

    if (aaType === "checkboxSingle") return Boolean(value);
    if (aaType === "number") return value === "" || value === null || value === undefined ? null : Number(value);
    if (aaType === "selectSingle" || aaType === "radio") return getSelectValue(options, String(value ?? ""));
    if (aaType === "selectMultiple" || aaType === "checkboxMultiple") return toEditGridOptionValues(value, options);
    if (aaType === "dateRange" || aaType === "dateTimeRange") return Array.isArray(value) ? value.map(String) : [];
    if (aaType === "file") return toEditGridFileValue(value);

    return typeof value === "string" || typeof value === "number" || typeof value === "boolean" ? value : "";
};

/** 將 EditGrid options 轉成 AAInputOption。 */
const toAAInputOptions = (options: EditGridSelectOption[]): AAInputOption[] =>
{
    return options.map((option) => ({ value: toSelectValue(option.value), label: option.label, disabled: option.disabled }));
};

/** 將 AA 多選字串值轉回 EditGrid 原始 option value。 */
const toEditGridOptionValues = (value: AAInputValue, options: EditGridSelectOption[]): EditGridOptionValue[] =>
{
    if (!Array.isArray(value)) return [];
    return value.map((item) => getSelectValue(options, String(item))).filter(isOptionValue);
};

/** 將 EditGrid 檔案值轉成 AAInputField FileField 使用的陣列。 */
const toAAFileValueList = (value: EditGridCellValue): AAInputValue =>
{
    const file = toFileValue(value);
    if (!file || !file.fileName) return [];

    return [{ file: file.file, name: file.fileName, size: file.size ?? 0, type: file.mimeType ?? "", url: file.url }] as AAInputValue;
};

/** 將 AAInputField FileField 回傳值轉回 EditGrid 檔案值。 */
const toEditGridFileValue = (value: AAInputValue): EditGridCellValue =>
{
    const file = getFirstAAFileValue(value);
    if (!file) return null;

    return { file: file.file, fileName: file.name, url: getEditGridFilePreviewUrl(file), mimeType: file.type, size: file.size };
};

/** 取得檔案預覽網址，讓圖片與影片在儲存後仍可顯示預覽。
 *  [Fix] createObjectURL 產生的 Blob URL 需在元件卸載時由呼叫端釋放；
 *        此處僅負責建立，不在此呼叫 revokeObjectURL，以免先 revoke 再渲染導致圖片空白。
 *        建議呼叫端在不需要時呼叫 URL.revokeObjectURL(url)。 */
const getEditGridFilePreviewUrl = (file: EditGridAAFileValue) =>
{
    if (file.url) return file.url;
    if (file.file) return URL.createObjectURL(file.file);
    return undefined;
};

/** 取得 AAInputField FileField 第一個檔案值。 */
const getFirstAAFileValue = (value: AAInputValue): EditGridAAFileValue | null =>
{
    if (!Array.isArray(value)) return null;
    const firstFile = value.find(isEditGridAAFileValue);
    return firstFile ?? null;
};

/** 判斷 AAInputField FileField 回傳是否為檔案值。 */
const isEditGridAAFileValue = (value: string | EditGridAAFileValue): value is EditGridAAFileValue =>
{
    return typeof value !== "string" && typeof value.name === "string";
};

/** 將值轉成字串陣列，給日期區間與多選欄位共用。 */
const toStringValueArray = (value: EditGridCellValue) =>
{
    if (Array.isArray(value)) return value.map(String);
    return [];
};

/** 取得 cell 的自訂 AA label。 */
const getCellAaLabel = (cell: RowCell, column: ColumnConfig) => cell.aaLabel ?? column.aaLabel;

/** 取得 cell 的說明文字。 */
const getCellHelpText = (cell: RowCell, column: ColumnConfig) => cell.helpText ?? column.helpText ?? `${column.title}欄位`;

/** 取得 select 搜尋框 placeholder。 */
const getCellSearchPlaceholder = (cell: RowCell, column: ColumnConfig) => cell.searchPlaceholder ?? column.searchPlaceholder;

/** 取得文字長度限制。 */
const getCellMaxLength = (cell: RowCell, column: ColumnConfig) => cell.maxLength ?? column.maxLength;

/** 取得搜尋文字長度限制。 */
const getCellMaxSearchLength = (cell: RowCell, column: ColumnConfig) => cell.maxSearchLength ?? column.maxSearchLength;

/** 取得 select 是否啟用搜尋。 */
const getCellSearchable = (cell: RowCell, column: ColumnConfig, aaType: AAInputType) =>
{
    if (aaType !== "selectSingle" && aaType !== "selectMultiple") return undefined;
    return cell.searchable ?? column.searchable ?? true;
};

/** 取得 file accept。 */
const getCellAccept = (cell: RowCell, column: ColumnConfig) => cell.accept ?? column.accept;

/** 取得 file 是否可多檔。 */
const getCellFileMultiple = (cell: RowCell, column: ColumnConfig) => cell.multiple ?? column.multiple;

/** 取得 file 最大檔案數。 */
const getCellMaxFileCount = (cell: RowCell, column: ColumnConfig) => cell.maxFileCount ?? column.maxFileCount ?? 1;

/** 取得 file 最大 MB。 */
const getCellMaxFileSizeMB = (cell: RowCell, column: ColumnConfig) => cell.maxFileSizeMB ?? column.maxFileSizeMB ?? 10;

/** 讀取 number min，若未設定則預設 0。 */
const getEditGridNumberMin = (args: EditGridCellRenderArgs) => args.cell.min ?? args.column.min ?? 0;

/** 讀取 number max，若未設定則預設 9999。 */
const getEditGridNumberMax = (args: EditGridCellRenderArgs) => args.cell.max ?? args.column.max ?? 9999;

/** 讀取 number step，若未設定則預設 1。 */
const getEditGridNumberStep = (args: EditGridCellRenderArgs) => args.cell.step ?? args.column.step ?? 1;

/** 讀取 textarea rows，若未設定則預設 3。 */
const getEditGridTextareaRows = (args: EditGridCellRenderArgs) => args.cell.rows ?? args.column.rows ?? 3;

/** AAInputField FileField 可選擇保留 File 物件，供 EditGrid 後續上傳流程使用。 */
interface EditGridAAFileValue
{
    file?: File;
    name: string;
    size: number;
    type: string;
    url?: string;
}

/** 檔案預覽：未選擇檔案時不顯示；有檔名才顯示圖片、影片或檔名。 */
const FilePreview = (props: { value: EditGridCellValue; }) =>
{
    const file = toFileValue(props.value);
    if (!file || !hasFileDisplayName(file)) return null;

    const fileType = getFileKind(file);
    const fileName = file.fileName.trim();

    return (
        <div className="edit-grid-file-preview mt-1">
            {fileType === "image" && file.url && <img src={file.url} alt={fileName} style={{ display: "block", maxWidth: "8rem", maxHeight: "6rem", objectFit: "contain" }} />}
            {fileType === "video" && file.url && <video src={file.url} controls preload="metadata" style={{ display: "block", maxWidth: "10rem", maxHeight: "7rem" }} />}
            {buildFilePreviewName(file, fileName)}
        </div>
    );
};

/** 建立檔案名稱顯示；有 downloadUrl 時直接提供可開啟連結。 */
const buildFilePreviewName = (file: EditGridFileValue, fileName: string) =>
{
    if (file.downloadUrl)
    {
        return <a className="small text-break" href={file.downloadUrl} target="_blank" rel="noopener noreferrer">{fileName}</a>;
    }

    return <div className="small text-break">{fileName}</div>;
};

/** 組合表頭欄位 class，下滑後才補上 sroll-border-top 頂線 class。 */
const getEditGridHeaderClassName = (sourceClassName: string | undefined, isHeaderScrolled: boolean) =>
{
    const classNames = [sourceClassName, isHeaderScrolled ? "sroll-border-top" : ""].filter(Boolean);

    return classNames.join(" ");
};
// #endregion

// #region Protected
/** 管理欄位設定與欄寬保存。 */
const useEditGridColumns = (sourceColumns: ColumnConfig[], storageKey: string) =>
{
    const safeSourceColumns = Array.isArray(sourceColumns) ? sourceColumns : [];
    const [columns, setColumns] = useState<ColumnConfig[]>(safeSourceColumns);

    /** 同步外部欄位設定；內容相同時回傳 prev，避免 effect setState 循環。 */
    useEffect(() =>
    {
        setColumns(prev =>
        {
            const next = mergeColumns(prev, safeSourceColumns);
            return isSameColumnListSnapshot(prev, next) ? prev : next;
        });
    }, [safeSourceColumns]);

    /** 套用 localStorage 欄寬；內容相同時回傳 prev，避免重複 render。 */
    useEffect(() =>
    {
        setColumns(prev =>
        {
            const next = applySavedWidths(prev, storageKey);
            return isSameColumnListSnapshot(prev, next) ? prev : next;
        });
    }, [storageKey]);

    const resizeColumn = (key: string, width: number, persist: boolean = true) =>
    {
        setColumns(prev =>
        {
            const updated = prev.map(col => col.key === key ? { ...col, width } : col);
            if (persist) saveColumnWidths(updated, storageKey);
            return isSameColumnListSnapshot(prev, updated) ? prev : updated;
        });
    };

    return { columns, resizeColumn };
};

/** 判斷目前是否需要啟用橫向捲動。 */
const useShouldUseXScroll = (breakpoint: number) =>
{
    const [shouldScroll, setShouldScroll] = useState(false);

    useEffect(() =>
    {
        const update = () => setShouldScroll(typeof window !== "undefined" && window.innerWidth < breakpoint);
        update();
        window.addEventListener("resize", update);

        return () => window.removeEventListener("resize", update);
    }, [breakpoint]);

    return shouldScroll;
};

/** 判斷目前是否為電腦版寬度，避免手機版被固定 5 列高度。 */
const useEditGridDesktopViewport = (breakpoint: number) =>
{
    const [isDesktop, setIsDesktop] = useState(false);

    useEffect(() =>
    {
        const update = () => setIsDesktop(typeof window !== "undefined" && window.innerWidth >= breakpoint);
        update();
        window.addEventListener("resize", update);

        return () => window.removeEventListener("resize", update);
    }, [breakpoint]);

    return isDesktop;
};

/** 管理表格外框狀態：1024px 以上滑鼠在表格內才顯示紅框 class。 */
const useEditGridTableScrollClass = (isDesktop: boolean) =>
{
    const [isMouseInside, setIsMouseInside] = useState(false);

    /** 滑鼠進入表格區時，桌機版才補上外框 class。 */
    const markMouseInside = () =>
    {
        if (!isDesktop) return;

        setIsMouseInside(true);
    };

    /** 滑鼠離開表格區時移除外框 class。 */
    const markMouseOutside = () => setIsMouseInside(false);

    /** 視窗切到非桌機版時，主動清除外框狀態。 */
    useEffect(() =>
    {
        if (!isDesktop) setIsMouseInside(false);
    }, [isDesktop]);

    return { isActive: isDesktop && isMouseInside, markMouseInside, markMouseOutside };
};

/** 偵測表格是否已向下捲動，控制 sticky thead 是否補上頂線 class。 */
const useEditGridHeaderScrolled = (scrollBoxRef: RefObject<HTMLDivElement>, shouldUseYScroll: boolean) =>
{
    const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);

    useEffect(() =>
    {
        const scrollBox = scrollBoxRef.current;
        if (!scrollBox || !shouldUseYScroll)
        {
            setIsHeaderScrolled(false);
            return;
        }

        const syncHeaderScrolled = () => setIsHeaderScrolled(scrollBox.scrollTop > 0);
        syncHeaderScrolled();
        scrollBox.addEventListener("scroll", syncHeaderScrolled, { passive: true });

        return () => scrollBox.removeEventListener("scroll", syncHeaderScrolled);
    }, [scrollBoxRef, shouldUseYScroll]);

    return isHeaderScrolled;
};

/** 實測 sticky 表頭高度，讓背板可完整遮住表頭下方縫隙。 */
const useEditGridMeasuredHeaderHeight = (
    scrollBoxRef: RefObject<HTMLDivElement>,
    rows: GridRow[],
    shouldUseYScroll: boolean,
    fallbackHeightPx: number,
) =>
{
    const [headerHeightPx, setHeaderHeightPx] = useState(fallbackHeightPx);

    useEffect(() =>
    {
        if (!shouldUseYScroll || typeof window === "undefined")
        {
            setHeaderHeightPx(fallbackHeightPx);
            return;
        }

        const scrollBox = scrollBoxRef.current;
        if (!scrollBox) return;

        const syncHeight = () => setHeaderHeightPx(getMeasuredHeaderHeight(scrollBox, fallbackHeightPx));
        const frameId = window.requestAnimationFrame(syncHeight);
        const observer = createEditGridResizeObserver(scrollBox, syncHeight);
        window.addEventListener("resize", syncHeight);

        return () =>
        {
            window.cancelAnimationFrame(frameId);
            observer?.disconnect();
            window.removeEventListener("resize", syncHeight);
        };
    }, [fallbackHeightPx, rows, scrollBoxRef, shouldUseYScroll]);

    return headerHeightPx;
};

/** 讓 EditGrid 可用滑鼠拖曳方式水平捲動，不必精準拉底部 scrollbar。 */
const useEditGridGrabScroll = (scrollBoxRef: RefObject<HTMLDivElement>) =>
{
    const dragStateRef = useRef<EditGridGrabScrollState>(getDefaultGrabScrollState());
    const [isDragging, setIsDragging] = useState(false);

    /** 開始水平拖曳捲動。 */
    const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) =>
    {
        const scrollBox = scrollBoxRef.current;
        if (!scrollBox || event.button !== 0 || shouldIgnoreGrabScroll(event.target)) return;
        if (scrollBox.scrollWidth <= scrollBox.clientWidth) return;

        dragStateRef.current = { pointerId: event.pointerId, startX: event.clientX, startScrollLeft: scrollBox.scrollLeft };
        setIsDragging(true);
        scrollBox.setPointerCapture?.(event.pointerId);
    };

    /** 拖曳時同步調整水平捲動位置。 */
    const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) =>
    {
        if (!isDragging) return;

        const scrollBox = scrollBoxRef.current;
        if (!scrollBox) return;

        const distanceX = event.clientX - dragStateRef.current.startX;
        scrollBox.scrollLeft = dragStateRef.current.startScrollLeft - distanceX;
        event.preventDefault();
    };

    /** 結束水平拖曳捲動。 */
    const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) =>
    {
        if (!isDragging) return;

        scrollBoxRef.current?.releasePointerCapture?.(dragStateRef.current.pointerId || event.pointerId);
        dragStateRef.current = getDefaultGrabScrollState();
        setIsDragging(false);
    };

    /** 讓鍵盤使用者也可以在 scroll box focus 時水平移動。 */
    const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) =>
    {
        const scrollBox = scrollBoxRef.current;
        if (!scrollBox || shouldIgnoreGrabScroll(event.target)) return;

        const offset = getGrabScrollKeyboardOffset(event.key, scrollBox.clientWidth);
        if (offset === 0) return;

        scrollBox.scrollLeft += offset;
        event.preventDefault();
    };

    return { isDragging, onPointerDown, onPointerMove, onPointerUp, onKeyDown };
};

/** 拖曳排序期間依游標靠近上下邊界自動捲動，補足瀏覽器原生 drag 常不派發 wheel 的限制。 */
const useEditGridDragAutoScroll = (_scrollBoxRef: RefObject<HTMLDivElement>, dragIndex: number | null) =>
{
    const rafRef = useRef<number | null>(null);

    useEffect(() =>
    {
        if (dragIndex === null && rafRef.current !== null)
        {
            window.cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
    }, [dragIndex]);
};

/** 拖拉排序期間允許使用滑鼠滾輪移動畫面，並在滾動後同步更新放置位置。 */
const useEditGridDragWheelScroll = (
    scrollBoxRef: RefObject<HTMLDivElement>,
    dragIndex: number | null,
    setDragOverIndex: (rowIndex: number | null) => void,
    setDragPlacement: (placement: EditGridDragPlacement) => void,
    setDragPointer: (pointer: EditGridDragPointer | null) => void,
) =>
{
    useEffect(() =>
    {
        if (dragIndex === null || typeof window === "undefined") return;

        const handleWheel = (event: WheelEvent) =>
        {
            const scrollBox = scrollBoxRef.current;
            if (!scrollBox) return;

            setDragPointer({ x: event.clientX, y: event.clientY });
            handleDragWheelScroll(scrollBox, event);
            updateDragTargetAfterWheel(scrollBox, event.clientY, dragIndex, setDragOverIndex, setDragPlacement);
            event.preventDefault();
        };

        window.addEventListener("wheel", handleWheel, { passive: false, capture: true });

        return () => window.removeEventListener("wheel", handleWheel, { capture: true });
    }, [dragIndex, scrollBoxRef, setDragOverIndex, setDragPlacement, setDragPointer]);
};

// #endregion

// #region Private

/** 建立 ResizeObserver，瀏覽器不支援時回傳 null，避免 SSR/舊瀏覽器錯誤。 */
const createEditGridResizeObserver = (target: HTMLElement, onResize: () => void): ResizeObserver | null =>
{
    if (typeof ResizeObserver === "undefined") return null;

    const observer = new ResizeObserver(() => onResize());
    observer.observe(target);

    return observer;
};

/** 建立預設拖曳狀態。 */
const getDefaultGrabScrollState = (): EditGridGrabScrollState => ({ pointerId: 0, startX: 0, startScrollLeft: 0 });

/** 避免使用者操作 input/button/select/file 等互動元件時被誤判為拖曳表格。 */
const shouldIgnoreGrabScroll = (target: EventTarget | null) =>
{
    if (!(target instanceof HTMLElement)) return true;

    return Boolean(target.closest(getGrabScrollIgnoreSelector()));
};

/** 取得不應觸發表格 grab 橫向拖曳的互動元件 selector。 */
const getGrabScrollIgnoreSelector = () =>
{
    return [
        "input",
        "textarea",
        "select",
        "button",
        "a",
        "label",
        "[role='button']",
        "[role='option']",
        "[role='combobox']",
        "[role='listbox']",
        "[aria-haspopup='listbox']",
        "[contenteditable='true']",
        ".aa-input-field-cell",
        ".form-group",
        ".edit-grid-resize-handle",
        ".edit-grid-row-drag-handle",
    ].join(", ");
};

/** 依鍵盤按鍵取得水平捲動距離。 */
const getGrabScrollKeyboardOffset = (key: string, clientWidth: number) =>
{
    if (key === "ArrowLeft") return -80;
    if (key === "ArrowRight") return 80;
    if (key === "PageUp") return -Math.floor(clientWidth * 0.85);
    if (key === "PageDown") return Math.floor(clientWidth * 0.85);
    if (key === "Home") return -999999;
    if (key === "End") return 999999;

    return 0;
};

/** 表格有可捲動內容時攔截滾輪，避免捲到頂或底後連動整頁。 */
const preventPageWheelWhenTableScrolling = (scrollBox: HTMLDivElement | null, event: ReactWheelEvent<HTMLDivElement>): void =>
{
    if (!scrollBox || shouldIgnoreTableWheel(event.target)) return;
    if (!shouldHandleTableWheel(scrollBox, event)) return;

    scrollEditGridByReactWheel(scrollBox, event);
    event.preventDefault();
    event.stopPropagation();
};

/** 避免在可自行處理滾輪的內部元件中攔截，例如 textarea 或下拉清單。 */
const shouldIgnoreTableWheel = (target: EventTarget | null): boolean =>
{
    if (!(target instanceof HTMLElement)) return true;

    return Boolean(target.closest(getTableWheelIgnoreSelector()));
};

/** 取得表格滾輪攔截忽略清單。 */
const getTableWheelIgnoreSelector = (): string =>
{
    return [
        "textarea",
        "select",
        "[role='listbox']",
        "[data-edit-grid-allow-page-wheel='true']",
    ].join(", ");
};

/** 判斷此次滾輪是否應由 EditGrid 承接。 */
const shouldHandleTableWheel = (scrollBox: HTMLElement, event: ReactWheelEvent<HTMLDivElement>): boolean =>
{
    if (shouldWheelScrollHorizontally(event.nativeEvent)) return canScrollHorizontally(scrollBox);

    return canScrollVertically(scrollBox);
};

/** 依 React 滾輪事件捲動 EditGrid 容器。 */
const scrollEditGridByReactWheel = (scrollBox: HTMLElement, event: ReactWheelEvent<HTMLDivElement>): void =>
{
    if (shouldWheelScrollHorizontally(event.nativeEvent))
    {
        scrollBox.scrollLeft += event.shiftKey ? event.deltaY : event.deltaX;
        return;
    }

    scrollBox.scrollTop += event.deltaY;
};

/** 判斷指定容器是否可水平捲動。 */
const canScrollHorizontally = (element: HTMLElement): boolean => element.scrollWidth > element.clientWidth;

/** 依滾輪方向處理拖曳中的水平或垂直捲動。 */
const handleDragWheelScroll = (scrollBox: HTMLElement, event: WheelEvent) =>
{
    if (shouldWheelScrollHorizontally(event))
    {
        scrollBox.scrollLeft += event.shiftKey ? event.deltaY : event.deltaX;
        return;
    }

    scrollEditGridByWheel(scrollBox, event.deltaY);
};

/** 拖曳中優先捲動 EditGrid 容器；容器到頂/到底後才捲動頁面。 */
const scrollEditGridByWheel = (scrollBox: HTMLElement, deltaY: number) =>
{
    if (canScrollElementByDelta(scrollBox, deltaY))
    {
        scrollBox.scrollTop += deltaY;
        return;
    }

    window.scrollBy({ top: deltaY, left: 0, behavior: "auto" });
};

/** 滾輪捲動後等畫面位置更新，再重新計算目前應放置的資料列。 */
const updateDragTargetAfterWheel = (
    scrollBox: HTMLElement,
    clientY: number,
    dragIndex: number,
    setDragOverIndex: (rowIndex: number | null) => void,
    setDragPlacement: (placement: EditGridDragPlacement) => void,
) =>
{
    window.requestAnimationFrame(() => syncDragTargetByPointer(scrollBox, clientY, dragIndex, setDragOverIndex, setDragPlacement));
};

/** 依目前游標位置同步拖曳放置目標。 */
const syncDragTargetByPointer = (
    sourceElement: HTMLElement,
    clientY: number,
    dragIndex: number,
    setDragOverIndex: (rowIndex: number | null) => void,
    setDragPlacement: (placement: EditGridDragPlacement) => void,
) =>
{
    const target = findPointerRowTarget(sourceElement, clientY);
    if (!target || target.rowIndex === dragIndex)
    {
        setDragOverIndex(null);
        return;
    }

    setDragOverIndex(target.rowIndex);
    setDragPlacement(target.placement);
};

/** 判斷指定容器是否可依滾輪方向繼續垂直捲動。 */
const canScrollElementByDelta = (element: HTMLElement, deltaY: number) =>
{
    if (!canScrollVertically(element) || deltaY === 0) return false;
    if (deltaY < 0) return element.scrollTop > 0;

    return Math.ceil(element.scrollTop + element.clientHeight) < element.scrollHeight;
};

/** 依拖曳游標位置取得垂直自動捲動速度。 */
const getDragAutoScrollOffset = (clientY: number, viewportHeight: number) =>
{
    const edgeSize = 96;
    const maxStep = 28;

    if (clientY < edgeSize) return -Math.ceil(maxStep * ((edgeSize - clientY) / edgeSize));
    if (clientY > viewportHeight - edgeSize) return Math.ceil(maxStep * ((clientY - (viewportHeight - edgeSize)) / edgeSize));

    return 0;
};

/** 拖拉排序時，Shift + 滾輪或觸控板橫向手勢改為移動 EditGrid 橫向捲軸。 */
const shouldWheelScrollHorizontally = (event: WheelEvent) =>
{
    return event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY);
};

/** 計算固定高度表格的可視高度。 */
const getScrollBoxFixedHeightPx = (
    shouldUseYScroll: boolean,
    headerHeightPx: number,
    maxVisibleRows: number | null,
    rowHeightPx: number,
) =>
{
    if (!shouldUseYScroll || maxVisibleRows === null) return undefined;

    return headerHeightPx + maxVisibleRows * rowHeightPx;
};

interface EditGridGrabScrollState
{
    pointerId: number;
    startX: number;
    startScrollLeft: number;
}

/** 若剛新增資料列，等 DOM 更新後移動到新增列所在位置。 */
const scrollPendingAddedRowIntoView = (scrollBoxRef: RefObject<HTMLDivElement>, pendingAddedRowIndexRef: { current: number | null; }) =>
{
    const rowIndex = pendingAddedRowIndexRef.current;
    if (rowIndex === null) return;

    pendingAddedRowIndexRef.current = null;
    scrollEditGridRowIntoViewWithRetry(scrollBoxRef, rowIndex, 0);
};

/** 等待新增列渲染完成後捲動到指定列，避免新增後 DOM 尚未建立。 */
const scrollEditGridRowIntoViewWithRetry = (scrollBoxRef: RefObject<HTMLDivElement>, rowIndex: number, retryCount: number) =>
{
    if (!isBrowserDocumentReady()) return;

    window.requestAnimationFrame(() =>
    {
        const rowElement = getEditGridRowElement(scrollBoxRef.current, rowIndex);
        if (rowElement)
        {
            scrollEditGridRowElementIntoView(rowElement);
            return;
        }
        if (retryCount < 5) scrollEditGridRowIntoViewWithRetry(scrollBoxRef, rowIndex, retryCount + 1);
    });
};

/** 取得指定 index 的表格列。 */
const getEditGridRowElement = (scrollBox: HTMLDivElement | null, rowIndex: number) =>
{
    return scrollBox?.querySelector<HTMLElement>(`[data-edit-grid-row-index="${rowIndex}"]`) ?? null;
};

/** 將新增列移到可視範圍中央，inline nearest 避免干擾水平捲動。 */
const scrollEditGridRowElementIntoView = (rowElement: HTMLElement) =>
{
    rowElement.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
};
// #endregion

// #region Private
/** 新增資料列並直接進入編輯模式；已有列在編輯時不可新增，新增後會移到新增列位置。
 *  [Fix] 若未設定 createRow，加上 console.warn 提示開發者，避免靜默 return 難以排查。 */
const handleAddRow = (
    canAdd: boolean,
    props: EditGridProps,
    rows: GridRow[],
    editingKeys: Set<string>,
    pendingAddedRowIndexRef: { current: number | null; },
    commitRows: (rows: GridRow[]) => void,
    setEditingKeys: Dispatch<SetStateAction<Set<string>>>,
) =>
{
    if (!canAdd || editingKeys.size > 0) return;

    if (!props.createRow)
    {
        console.warn("[EditGrid] canAdd=true 但未提供 createRow，無法新增列。請設定 createRow prop。");
        return;
    }

    const nextRowIndex = rows.length;
    const nextRow = props.createRow(nextRowIndex + 1);
    // [Fix] 確保新增列的 keyId 不重複，使用全域自增 ID
    const normalizedRow: GridRow = { ...nextRow, keyId: nextRow.keyId || generateNewRowId(), rowState: "insert" };

    pendingAddedRowIndexRef.current = nextRowIndex;
    commitRows([...rows, normalizedRow]);
    setEditingKeys(prev => new Set([...prev, getRowKey(normalizedRow, nextRowIndex)]));
};

/** 進入列編輯模式並建立備份；同一時間只允許一列編輯。 */
const handleEditRow = (
    rows: GridRow[],
    rowIndex: number,
    editingKeys: Set<string>,
    setEditingKeys: Dispatch<SetStateAction<Set<string>>>,
    setBackupMap: Dispatch<SetStateAction<Record<string, GridRow>>>,
) =>
{
    const row = rows[rowIndex];
    if (!row) return;

    const rowKey = getRowKey(row, rowIndex);
    if (editingKeys.has(rowKey)) return;
    if (editingKeys.size > 0) return;

    setBackupMap(prev => ({ ...prev, [rowKey]: cloneGridRow(row) }));
    setEditingKeys(new Set([rowKey]));
};

/** 確認列編輯內容；若該列仍有驗證錯誤，保留編輯模式。 */
const handleSaveRow = (
    rows: GridRow[],
    rowIndex: number,
    columns: ColumnConfig[],
    setEditingKeys: Dispatch<SetStateAction<Set<string>>>,
    setBackupMap: Dispatch<SetStateAction<Record<string, GridRow>>>,
    commitRows: (rows: GridRow[]) => void,
) =>
{
    const row = rows[rowIndex];
    if (!row || hasRowError(row, rowIndex, columns)) return;

    const rowKey = getRowKey(row, rowIndex);
    const nextRows = rows.map((item, index): GridRow => index === rowIndex ? normalizeSavedRow(item) : item);

    setEditingKeys(prev => removeSetValue(prev, rowKey));
    setBackupMap(prev => removeRecordKey(prev, rowKey));
    commitRows(nextRows);
};

/** 取消列編輯內容。 */
const handleCancelRow = (
    rows: GridRow[],
    rowIndex: number,
    backupMap: Record<string, GridRow>,
    setEditingKeys: Dispatch<SetStateAction<Set<string>>>,
    setBackupMap: Dispatch<SetStateAction<Record<string, GridRow>>>,
    commitRows: (rows: GridRow[]) => void,
) =>
{
    const row = rows[rowIndex];
    if (!row) return;
    const rowKey = getRowKey(row, rowIndex);
    const backup = backupMap[rowKey];
    const nextRows = row.rowState === "insert" && !backup
        ? rows.filter((_, index) => index !== rowIndex)
        : rows.map((item, index): GridRow => index === rowIndex ? backup ?? item : item);
    setEditingKeys(prev => removeSetValue(prev, rowKey));
    setBackupMap(prev => removeRecordKey(prev, rowKey));
    commitRows(nextRows);
};

/** 刪除資料列。 */
const handleDeleteRow = (canDelete: boolean, props: EditGridProps, rows: GridRow[], rowIndex: number, commitRows: (rows: GridRow[]) => void) =>
{
    const target = rows[rowIndex];
    if (!canDelete || !target || !confirmDelete(props.deleteConfirmMessage)) return;
    props.onDeleteRow?.(target);
    commitRows(rows.filter((_, index) => index !== rowIndex));
};
// #endregion

// #region Private
/** 正規化 GridData，避免 columns/rows 未初始化時發生 runtime error。 */
const normalizeGridData = (gridData?: GridProps): GridProps =>
{
    return {
        columns: Array.isArray(gridData?.columns) ? gridData.columns : [],
        rows: Array.isArray(gridData?.rows) ? gridData.rows : [],
        CurrentPage: gridData?.CurrentPage ?? 1,
        TotalPage: gridData?.TotalPage ?? 1,
        onPageChange: gridData?.onPageChange ?? (() => undefined),
    };
};

/** 建立 GridData 內容簽章，避免外層只有物件 reference 改變就觸發 effect。 */
const buildGridDataSnapshotText = (gridData?: GridProps): string =>
{
    const normalized = normalizeGridData(gridData);
    const columnText = buildColumnListSignature(normalized.columns);
    const rowText = buildRowListSignature(normalized.rows);

    return [normalized.CurrentPage, normalized.TotalPage, columnText, rowText].join("¶");
};

/** 判斷 GridData 內容是否相同，避免 props reference 改變就觸發 setState。 */
const isSameGridDataSnapshot = (current: GridProps, next: GridProps): boolean =>
{
    if (current.CurrentPage !== next.CurrentPage) return false;
    if (current.TotalPage !== next.TotalPage) return false;
    if (!isSameColumnListSnapshot(current.columns, next.columns)) return false;
    if (!isSameRowListSnapshot(current.rows, next.rows)) return false;

    return true;
};

/** 建立欄位清單簽章。 */
const buildColumnListSignature = (columns: ColumnConfig[]): string =>
{
    return (Array.isArray(columns) ? columns : []).map(getColumnSnapshotText).join("§");
};

/** 建立資料列清單簽章。 */
const buildRowListSignature = (rows: GridRow[]): string =>
{
    return (Array.isArray(rows) ? rows : []).map((row, index) => getRowSnapshotText(row, index)).join("§");
};

/** 判斷欄位清單快照是否相同。 */
const isSameColumnListSnapshot = (current: ColumnConfig[], next: ColumnConfig[]): boolean =>
{
    if (current.length !== next.length) return false;

    return current.every((column, index) => getColumnSnapshotText(column) === getColumnSnapshotText(next[index]));
};

/** 判斷資料列清單快照是否相同。 */
const isSameRowListSnapshot = (current: GridRow[], next: GridRow[]): boolean =>
{
    if (current.length !== next.length) return false;

    return current.every((row, index) => getRowSnapshotText(row, index) === getRowSnapshotText(next[index], index));
};

/** 建立欄位比對文字，忽略 render function 這類每次 render 都可能不同的參考。 */
const getColumnSnapshotText = (column: ColumnConfig): string =>
{
    return [
        column.key,
        column.title,
        column.visible,
        column.width,
        column.minWidth,
        column.inputType,
        column.editable,
        column.required,
        column.maxLength,
        column.min,
        column.max,
        column.step,
        column.rows,
    ].join("|");
};

/** 建立資料列比對文字。 */
const getRowSnapshotText = (row: GridRow, rowIndex: number): string =>
{
    const cellText = row.cells.map(cell => `${cell.col.key}:${toSnapshotValue(getCellValue(cell))}`).join("|");

    return [getRowKey(row, rowIndex), getRowNo(row, rowIndex), row.rowState, cellText].join("|");
};

/** 將 cell value 轉成穩定比對文字。 */
const toSnapshotValue = (value: EditGridCellValue): string =>
{
    if (value === null || value === undefined) return "";
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
    if (Array.isArray(value)) return value.map(item => String(item)).join(",");

    try
    {
        return JSON.stringify(value);
    } catch
    {
        return "";
    }
};

/** 重新整理排序欄位，拖曳、新增、刪除後都會保持 RowNo 連續。 */
const rebuildRowNo = (rows: GridRow[]): GridRow[] => rows.map((row, index): GridRow => ({ ...row, rowNo: index + 1, RowNo: index + 1, rowno: index + 1 }));

/** 更新單一欄位值。 */
const updateRowCellValue = (rows: GridRow[], rowIndex: number, columnKey: string, value: EditGridCellValue): GridRow[] => rows.map((row, index): GridRow => index === rowIndex ? updateRowValues(row, { [columnKey]: value }) : row);

/** 更新同列多個欄位值。 */
const updateRowCellValues = (rows: GridRow[], rowIndex: number, values: Record<string, EditGridCellValue>): GridRow[] => rows.map((row, index): GridRow => index === rowIndex ? updateRowValues(row, values) : row);

/** 更新資料列內對應 cell 的 value 與 content。 */
const updateRowValues = (row: GridRow, values: Record<string, EditGridCellValue>): GridRow =>
{
    const cells = row.cells.map(cell =>
        Object.prototype.hasOwnProperty.call(values, cell.col.key)
            ? { ...cell, value: values[cell.col.key], content: valueToReadonlyContent(values[cell.col.key], cell) }
            : cell
    );
    const rowState: EditGridRowState = row.rowState === "insert" ? "insert" : "update";
    return { ...row, rowState, cells };
};

/** 將指定列移動到新位置。 */
const moveItem = (rows: GridRow[], fromIndex: number, toIndex: number): GridRow[] =>
{
    if (fromIndex === toIndex || toIndex < 0 || toIndex >= rows.length) return rows;
    const nextRows = [...rows];
    const [target] = nextRows.splice(fromIndex, 1);
    nextRows.splice(toIndex, 0, target);
    return nextRows;
};

/** 依空框位置移動列，不處理階層，只做平面排序。 */
const moveItemByDropPlacement = (rows: GridRow[], fromIndex: number, targetIndex: number, placement: EditGridDragPlacement): GridRow[] =>
{
    const toIndex = getDropInsertIndex(rows.length, fromIndex, targetIndex, placement);
    return moveItem(rows, fromIndex, toIndex);
};

/** 取得 drop 後實際插入 index。 */
const getDropInsertIndex = (rowCount: number, fromIndex: number, targetIndex: number, placement: EditGridDragPlacement) =>
{
    const rawIndex = placement === "after" ? targetIndex + 1 : targetIndex;
    const adjustedIndex = fromIndex < rawIndex ? rawIndex - 1 : rawIndex;
    return Math.max(0, Math.min(adjustedIndex, rowCount - 1));
};

/** 取得拖曳提示文字。 */
const getDragPreviewText = (sourceRowNo: number, targetRowNo?: number) =>
{
    return targetRowNo === undefined ? `移動序號 ${sourceRowNo}` : `移動序號 ${sourceRowNo} 至序號 ${targetRowNo}`;
};

/** 取得拖曳提示的目標列號。 */
const getDragPreviewTargetRowNo = (rows: GridRow[], dragIndex: number | null, dragOverIndex: number | null, dragPlacement: EditGridDragPlacement) =>
{
    if (dragIndex === null || dragOverIndex === null) return undefined;
    if (dragIndex === dragOverIndex) return undefined;

    const targetIndex = getDropInsertIndex(rows.length, dragIndex, dragOverIndex, dragPlacement);
    const targetRow = rows[targetIndex];

    return targetRow ? getRowNo(targetRow, targetIndex) : targetIndex + 1;
};

/** 判斷是否顯示 drop 空框。 */
const shouldRenderDropPlaceholder = (
    rowIndex: number,
    dragIndex: number | null,
    dragOverIndex: number | null,
    dragPlacement: EditGridDragPlacement,
    placement: EditGridDragPlacement,
) =>
{
    if (dragIndex === null || dragOverIndex === null || dragIndex === rowIndex) return false;
    if (placement === "before" && dragIndex === rowIndex - 1) return false;
    if (placement === "after" && dragIndex === rowIndex + 1) return false;
    return dragOverIndex === rowIndex && dragPlacement === placement;
};

/** 取得列的 key，優先使用 keyId，其次使用資料庫 RowId。
 *  [Fix] 舊版在無 keyId 時回傳 new-${rowIndex}，新增/刪除後 index 重映射會造成 key 碰撞；
 *        現改在 handleAddRow 時即賦予穩定唯一 keyId，此處作為最後保底。 */
const getRowKey = (row: GridRow, rowIndex: number) =>
{
    const rowId = row.keyId || row.RowId || row.rowId || row.rowid;
    return rowId === null || rowId === undefined || rowId === "" ? `fallback-${rowIndex}` : String(rowId);
};

/** 取得 RowNo 顯示值。 */
const getRowNo = (row: GridRow, rowIndex: number) => row.RowNo ?? row.rowNo ?? row.rowno ?? rowIndex + 1;

/** 取得欄位對應 cell，找不到時建立唯讀空 cell。 */
const getCellByColumn = (row: GridRow, columnKey: string, column: ColumnConfig): RowCell => row.cells.find(cell => cell.col.key === columnKey) ?? { col: column, content: "", value: undefined };

/** 取得 cell value。 */
const getCellValue = (cell: RowCell): EditGridCellValue => cell.value ?? (typeof cell.content === "string" || typeof cell.content === "number" || typeof cell.content === "boolean" ? cell.content : undefined);

/** 建立欄位驗證訊息 Map。 */
const buildErrorMap = (rows: GridRow[], columns: ColumnConfig[]) =>
{
    const errors: Record<string, string> = {};
    rows.forEach((row, rowIndex) => columns.forEach(column => setError(errors, row, rowIndex, column)));
    return errors;
};

/** 寫入單一欄位的驗證結果。 */
const setError = (errors: Record<string, string>, row: GridRow, rowIndex: number, column: ColumnConfig) =>
{
    const cell = getCellByColumn(row, column.key, column);
    const value = getCellValue(cell);
    const required = getCellRequired(cell, column);
    const validate = cell.validate ?? column.validate;

    if (required && isEmptyValue(value)) errors[getErrorKey(rowIndex, column.key)] = `${column.title}不可空白`;
    if (isEmailCell(cell, column) && !isEmptyValue(value) && !isValidEmailValue(value)) errors[getErrorKey(rowIndex, column.key)] = `${column.title}格式不正確`;

    const customError = validate?.(value, row, rowIndex);
    if (customError) errors[getErrorKey(rowIndex, column.key)] = customError;
};

/** 判斷指定列是否仍有驗證錯誤。 */
const hasRowError = (row: GridRow, rowIndex: number, columns: ColumnConfig[]) =>
{
    const errors: Record<string, string> = {};
    columns.forEach((column) => setError(errors, row, rowIndex, column));
    return Object.keys(errors).length > 0;
};

/** 判斷欄位是否為 email。 */
const isEmailCell = (cell: RowCell, column: ColumnConfig) =>
{
    return getCellInputType(cell, column) === "email";
};

/** 驗證 email 格式，避免空白、多個 @ 或缺少網域。 */
const isValidEmailValue = (value: EditGridCellValue) =>
{
    const text = String(value ?? "").trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return emailPattern.test(text);
};

/** 取得欄位錯誤 Map key。 */
const getErrorKey = (rowIndex: number, key: string) => `${rowIndex}:${key}`;

/** 儲存列時標記 rowState，並清除 password 明文，避免前端狀態與畫面帶出密碼。 */
const normalizeSavedRow = (row: GridRow): GridRow =>
{
    const nextRowState = row.rowState === "insert" ? "insert" : "update";
    return clearPasswordCellValues({ ...row, rowState: nextRowState });
};

/** 清除資料列中的 password 欄位值，password 僅作為寫入欄位，不在前端保存。 */
const clearPasswordCellValues = (row: GridRow): GridRow =>
{
    return { ...row, cells: row.cells.map((cell) => isPasswordCell(cell, cell.col) ? { ...cell, value: "", content: getPasswordMaskedText() } : cell) };
};

/** 判斷欄位是否為 password。 */
const isPasswordCell = (cell: RowCell, column: ColumnConfig) =>
{
    return getCellInputType(cell, column) === "password";
};

/** 密碼欄位固定遮罩文字；只表示此欄位為密碼，不代表前端持有密碼或雜湊值。 */
const getPasswordMaskedText = () => "●●●●●●";

/** 複製資料列，用於取消編輯還原。 */
const cloneGridRow = (row: GridRow): GridRow => ({
    ...row,
    cells: row.cells.map(cell => ({ ...cell, col: { ...cell.col }, options: cell.options ? [...cell.options] : undefined })),
});
// #endregion

// #region Private
/** 取得欄位是否可編輯。 */
const getCellEditable = (cell: RowCell, column: ColumnConfig) => cell.editable ?? column.editable ?? false;

/** 取得欄位 inputType。 */
const getCellInputType = (cell: RowCell, column: ColumnConfig): EditGridInputType => cell.inputType ?? column.inputType ?? "text";

/** 取得欄位是否必填。 */
const getCellRequired = (cell: RowCell, column: ColumnConfig) => cell.required ?? column.required ?? false;

/** 取得欄位 placeholder。 */
const getCellPlaceholder = (cell: RowCell, column: ColumnConfig) => cell.placeholder ?? column.placeholder;

/** 取得欄位 options。 */
const getCellOptions = (cell: RowCell, column: ColumnConfig) => cell.options ?? column.options ?? [];

/** 取得欄位 selectionMode。 */
const getCellSelectionMode = (cell: RowCell, column: ColumnConfig) => cell.selectionMode ?? column.selectionMode ?? "single";

/** 將 value 轉成唯讀 content，password 永遠不轉成可顯示內容。 */
const valueToReadonlyContent = (value: EditGridCellValue, cell: RowCell): ReactNode =>
{
    const aaType = getEditGridCellAAInputType(cell);
    const options = getCellOptions(cell, cell.col);
    const file = toFileValue(value);

    if (isPasswordCell(cell, cell.col)) return getPasswordMaskedText();

    const dateText = getEditGridReadonlyDateText(value, aaType);
    if (dateText !== undefined) return dateText;

    if (aaType === "selectSingle" || aaType === "radio") return renderOptionLabel(value, options);
    if (Array.isArray(value)) return renderOptionLabels(value, options);
    if (file) return getFileReadonlyContent(file);
    if (typeof value === "boolean") return value ? "是" : "否";
    if (typeof value === "string" || typeof value === "number") return value;
    return "";
};
// #endregion

// #region Private
/** 合併外部欄位設定，同時保留目前已調整的欄寬。 */
const mergeColumns = (current: ColumnConfig[], source: ColumnConfig[]) =>
    source.map(sourceCol =>
    {
        const currentCol = current.find(col => col.key === sourceCol.key);
        return currentCol?.width !== undefined ? { ...sourceCol, width: currentCol.width } : sourceCol;
    });

/** 套用 localStorage 內保存的欄寬。 */
const applySavedWidths = (columns: ColumnConfig[], storageKey: string) =>
{
    const widths = readSavedWidths(storageKey);
    return columns.map(col => typeof widths[col.key] === "number" ? { ...col, width: widths[col.key] } : col);
};

/** 讀取欄寬設定。 */
const readSavedWidths = (storageKey: string) =>
{
    if (typeof window === "undefined") return {} as Record<string, number>;
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) return {} as Record<string, number>;
    try
    {
        return JSON.parse(saved) as Record<string, number>;
    } catch
    {
        return {} as Record<string, number>;
    }
};

/** 保存欄寬設定。 */
const saveColumnWidths = (columns: ColumnConfig[], storageKey: string) =>
{
    const widths = { ...readSavedWidths(storageKey) };
    columns.forEach(col =>
    {
        if (typeof col.width === "number") widths[col.key] = col.width;
    });
    saveColumnWidthsRecord(widths, storageKey);
};

/** 保存欄寬設定物件。 */
const saveColumnWidthsRecord = (widths: Record<string, number>, storageKey: string) =>
{
    if (typeof window === "undefined") return;
    window.localStorage.setItem(storageKey, JSON.stringify(widths));
};

/** 依欄位寬度推算表格最小寬度。 */
const getTableMinWidth = (columns: ColumnConfig[], fallback?: number, extraWidth: number = 0) =>
{
    if (fallback) return fallback;
    const total = columns.reduce((sum, col) => sum + getColumnWidthNumber(col), 144 + extraWidth);
    return Math.max(total, 720);
};

/** 將欄位寬度轉成數字，無法轉換時給預設寬度。 */
const getColumnWidthNumber = (column: ColumnConfig) =>
{
    if (typeof column.width === "number") return column.width;
    if (typeof column.minWidth === "number") return column.minWidth;
    return 140;
};
// #endregion

// #region Private
/** 開始拖曳資料列；只能由操作欄拖曳把手觸發。 */
const startPointerRowDrag = (
    event: ReactPointerEvent<HTMLElement>,
    rowIndex: number,
    setDragIndex: (rowIndex: number) => void,
    setDragOverIndex: (rowIndex: number | null) => void,
    setDragPlacement: (placement: EditGridDragPlacement) => void,
    setDragPointer: (pointer: EditGridDragPointer | null) => void,
) =>
{
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setDragIndex(rowIndex);
    setDragOverIndex(null);
    setDragPlacement("before");
    setDragPointer({ x: event.clientX, y: event.clientY });
};

/** 拖曳移動時更新浮動提示與放置空框。 */
const movePointerRowDrag = (
    event: ReactPointerEvent<HTMLElement>,
    dragIndex: number | null,
    setDragOverIndex: (rowIndex: number | null) => void,
    setDragPlacement: (placement: EditGridDragPlacement) => void,
    setDragPointer: (pointer: EditGridDragPointer | null) => void,
) =>
{
    if (dragIndex === null) return;

    event.preventDefault();
    setDragPointer({ x: event.clientX, y: event.clientY });
    scrollDragContainerByPointerPosition(event.currentTarget, event.clientY);

    const target = findPointerRowTarget(event.currentTarget, event.clientY);
    if (!target || target.rowIndex === dragIndex)
    {
        setDragOverIndex(null);
        return;
    }

    setDragOverIndex(target.rowIndex);
    setDragPlacement(target.placement);
};

/** 放開拖曳把手時依空框位置提交排序。 */
const endPointerRowDrag = (
    event: ReactPointerEvent<HTMLElement>,
    rows: GridRow[],
    canDrag: boolean,
    dragIndex: number | null,
    dragOverIndex: number | null,
    dragPlacement: EditGridDragPlacement,
    commitRows: (rows: GridRow[]) => void,
    setDragIndex: (rowIndex: number | null) => void,
    setDragOverIndex: (rowIndex: number | null) => void,
    setDragPlacement: (placement: EditGridDragPlacement) => void,
    setDragPointer: (pointer: EditGridDragPointer | null) => void,
) =>
{
    event.preventDefault();
    event.currentTarget.releasePointerCapture?.(event.pointerId);

    if (canDrag && dragIndex !== null && dragOverIndex !== null)
    {
        commitRows(moveItemByDropPlacement(rows, dragIndex, dragOverIndex, dragPlacement));
    }

    clearDragState(setDragIndex, setDragOverIndex, setDragPlacement, setDragPointer);
};

/** 找出目前游標最接近的資料列邊界，避免游標落在 placeholder 時失去目標。 */
const findPointerRowTarget = (sourceElement: HTMLElement, clientY: number): EditGridDragTarget | null =>
{
    const table = getDragSourceTable(sourceElement);
    const rowRects = getPointerRowRects(table);

    if (rowRects.length === 0) return null;

    return resolvePointerRowTarget(rowRects, clientY);
};

/** 從拖曳把手或捲動容器取得目前 EditGrid 的 table。 */
const getDragSourceTable = (sourceElement: HTMLElement): HTMLTableElement | null =>
{
    const closestTable = sourceElement.closest("table") as HTMLTableElement | null;
    if (closestTable) return closestTable;

    return sourceElement.querySelector("table") as HTMLTableElement | null;
};

/** 取得目前表格內可排序列的位置資訊。 */
const getPointerRowRects = (table: HTMLTableElement | null): EditGridPointerRowRect[] =>
{
    const bodyRows = Array.from(table?.tBodies.item(0)?.rows ?? []);
    return bodyRows.map(getPointerRowRect).filter(isPointerRowRect);
};

/** 取得單一資料列的位置資訊。 */
const getPointerRowRect = (row: HTMLTableRowElement): EditGridPointerRowRect | null =>
{
    if (!row.hasAttribute("data-edit-grid-row-index")) return null;

    const rowIndex = Number(row.dataset.editGridRowIndex);
    if (!Number.isFinite(rowIndex)) return null;

    const rect = row.getBoundingClientRect();
    return rect.height <= 0 ? null : { rowIndex, top: rect.top, bottom: rect.bottom, height: rect.height };
};

/** 過濾不可用的資料列位置資訊。 */
const isPointerRowRect = (rowRect: EditGridPointerRowRect | null): rowRect is EditGridPointerRowRect => rowRect !== null;

/** 依游標 Y 座標解析最精準的放置目標。 */
const resolvePointerRowTarget = (rowRects: EditGridPointerRowRect[], clientY: number): EditGridDragTarget =>
{
    const firstRow = rowRects[0];
    const lastRow = rowRects[rowRects.length - 1];
    const hitRow = rowRects.find(rowRect => clientY >= rowRect.top && clientY <= rowRect.bottom);

    if (clientY <= firstRow.top) return { rowIndex: firstRow.rowIndex, placement: "before" };
    if (clientY >= lastRow.bottom) return { rowIndex: lastRow.rowIndex, placement: "after" };
    if (hitRow) return getPointerRowHalfTarget(hitRow, clientY);

    return getNearestPointerRowBoundaryTarget(rowRects, clientY);
};

/** 依資料列上下半部決定放在該列之前或之後。 */
const getPointerRowHalfTarget = (rowRect: EditGridPointerRowRect, clientY: number): EditGridDragTarget =>
{
    const middleY = rowRect.top + rowRect.height / 2;
    return { rowIndex: rowRect.rowIndex, placement: clientY <= middleY ? "before" : "after" };
};

/** 游標落在列與列之間時，改抓最近的資料列邊界。 */
const getNearestPointerRowBoundaryTarget = (rowRects: EditGridPointerRowRect[], clientY: number): EditGridDragTarget =>
{
    const nearest = rowRects.reduce(getNearestPointerBoundaryReducer(clientY), getDefaultPointerBoundary(rowRects[0], clientY));
    return { rowIndex: nearest.rowIndex, placement: nearest.placement };
};

/** 建立最近邊界比對的初始值。 */
const getDefaultPointerBoundary = (rowRect: EditGridPointerRowRect, clientY: number) =>
{
    return { rowIndex: rowRect.rowIndex, placement: "before" as EditGridDragPlacement, distance: Math.abs(clientY - rowRect.top) };
};

/** 建立最近邊界比對器。 */
const getNearestPointerBoundaryReducer = (clientY: number) =>
{
    return (nearest: ReturnType<typeof getDefaultPointerBoundary>, rowRect: EditGridPointerRowRect) =>
    {
        const before = getPointerBoundaryDistance(rowRect, clientY, "before");
        const after = getPointerBoundaryDistance(rowRect, clientY, "after");
        const current = before.distance <= after.distance ? before : after;
        return current.distance < nearest.distance ? current : nearest;
    };
};

/** 計算游標與資料列指定邊界的距離。 */
const getPointerBoundaryDistance = (rowRect: EditGridPointerRowRect, clientY: number, placement: EditGridDragPlacement) =>
{
    const boundaryY = placement === "before" ? rowRect.top : rowRect.bottom;
    return { rowIndex: rowRect.rowIndex, placement, distance: Math.abs(clientY - boundaryY) };
};

/** 游標靠近 Grid 或視窗上下邊界時自動垂直捲動。 */
const scrollDragContainerByPointerPosition = (sourceElement: HTMLElement, clientY: number) =>
{
    const scrollBox = sourceElement.closest(".edit-grid-scroll-box") as HTMLElement | null;
    if (!scrollBox || !canScrollVertically(scrollBox))
    {
        scrollWindowByPointerPosition(clientY);
        return;
    }

    const rect = scrollBox.getBoundingClientRect();
    const offset = getDragAutoScrollOffset(clientY - rect.top, rect.height);
    if (offset !== 0) scrollBox.scrollTop += offset;
};

/** 判斷指定容器是否可垂直捲動。 */
const canScrollVertically = (element: HTMLElement) => element.scrollHeight > element.clientHeight;

/** 游標靠近視窗上下邊界時自動垂直捲動。 */
const scrollWindowByPointerPosition = (clientY: number) =>
{
    if (typeof window === "undefined") return;

    const offset = getDragAutoScrollOffset(clientY, window.innerHeight);
    if (offset !== 0) window.scrollBy({ top: offset, left: 0, behavior: "auto" });
};

/** 清除拖曳排序狀態。 */
const clearDragState = (
    setDragIndex: (rowIndex: number | null) => void,
    setDragOverIndex: (rowIndex: number | null) => void,
    setDragPlacement: (placement: EditGridDragPlacement) => void,
    setDragPointer: (pointer: EditGridDragPointer | null) => void,
) =>
{
    setDragIndex(null);
    setDragOverIndex(null);
    setDragPlacement("before");
    setDragPointer(null);
};

/** 移除欄寬拖曳監聽。 */
const removeResizeListeners = (onMouseMove: (event: MouseEvent) => void, onMouseUp: () => void) =>
{
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
};

/** 有設定刪除確認文字時才跳出確認視窗。 */
const confirmDelete = (message?: string) =>
{
    if (!message || typeof window === "undefined") return true;
    return window.confirm(message);
};
// #endregion

// #region Private
/** 格式化單一日期欄位。 */
const formatEditGridDateValue = (value: EditGridCellValue): string | undefined =>
{
    const input = getEditGridDateInput(value);
    if (!LibDate.toDateOrNull(input)) return undefined;
    return LibDate.formatDate(input);
};
/** 取得可交給 LibDate 處理的日期值。 */
const getEditGridDateInput = (value: EditGridCellValue): string | number | null | undefined =>
{
    if (typeof value === "string" || typeof value === "number") return value;
    return undefined;
};
/** 依欄位型別取得 EditGrid 唯讀日期文字。 */
const getEditGridReadonlyDateText = (value: EditGridCellValue, aaType: AAInputType) =>
{
    if (aaType === "date") return formatEditGridDateValue(value);
    if (aaType === "date-time") return formatEditGridDateTimeValue(value);
    if (aaType === "dateRange") return formatEditGridDateRangeValue(value);
    if (aaType === "dateTimeRange") return formatEditGridDateTimeRangeValue(value);
    return undefined;
};
/** 依 cell 設定取得 AA 欄位型別，供儲存 content 時套用。 */
const getEditGridCellAAInputType = (cell: RowCell): AAInputType =>
{
    const inputType = getCellInputType(cell, cell.col);

    if (inputType === "select") return getCellSelectionMode(cell, cell.col) === "multiple" ? "selectMultiple" : "selectSingle";
    if (inputType === "selectSingle" || inputType === "selectMultiple" || inputType === "radio") return inputType;
    if (inputType === "checkboxGroup" || inputType === "checkboxMultiple") return "checkboxMultiple";
    if (inputType === "date-time") return "date-time";
    if (inputType === "dateRange") return "dateRange";
    if (inputType === "dateTimeRange") return "dateTimeRange";
    return "text";
};

/** 格式化單一日期時間欄位。 */
const formatEditGridDateTimeValue = (value: EditGridCellValue) =>
{
    const parts = parseEditGridDateTimeParts(String(value ?? ""));
    return parts ? `${formatEditGridDate(parts)} ${formatEditGridTime(parts)}` : undefined;
};

/** 格式化日期區間欄位。 */
const formatEditGridDateRangeValue = (value: EditGridCellValue) =>
{
    const range = getEditGridRangeStringValues(value);
    const startParts = parseEditGridDateTimeParts(range[0]);
    const endParts = parseEditGridDateTimeParts(range[1]);

    if (!startParts || !endParts) return undefined;
    return `${formatEditGridDateWithWeekday(startParts)} ~ ${formatEditGridDateWithWeekday(endParts)}`;
};

/** 格式化日期時間區間欄位。 */
const formatEditGridDateTimeRangeValue = (value: EditGridCellValue) =>
{
    const range = getEditGridRangeStringValues(value);
    const startParts = parseEditGridDateTimeParts(range[0]);
    const endParts = parseEditGridDateTimeParts(range[1]);

    if (!startParts || !endParts) return undefined;
    return `${formatEditGridDateWithWeekday(startParts)} ${formatEditGridTime(startParts)} ~ ${formatEditGridDateWithWeekday(endParts)} ${formatEditGridTime(endParts)}`;
};

/** 將 range value 轉成開始與結束字串。 */
const getEditGridRangeStringValues = (value: EditGridCellValue) =>
{
    if (!Array.isArray(value)) return ["", ""];
    return [String(value[0] ?? ""), String(value[1] ?? "")];
};

/** 解析 EditGrid 可能收到的日期或日期時間字串。 */
const parseEditGridDateTimeParts = (value: string): EditGridDateTimeParts | null =>
{
    const normalizedValue = value.trim();
    const pattern = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:\s*\([^)]*\))?(?:[T\s]+(?:(上午|下午|AM|PM)\s*)?(\d{1,2}):(\d{2}))?/i;
    const match = normalizedValue.match(pattern);

    if (!match) return null;
    return normalizeEditGridDateTimeParts(match);
};

/** 正規化日期時間 regex 結果。 */
const normalizeEditGridDateTimeParts = (match: RegExpMatchArray): EditGridDateTimeParts =>
{
    const period = match[4];
    const rawHour = match[5] === undefined ? undefined : Number(match[5]);
    const hour = rawHour === undefined ? undefined : normalizeEditGridHour(rawHour, period);

    return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]), hour, minute: match[6] === undefined ? undefined : Number(match[6]) };
};

/** 依上午下午轉換 24 小時制。 */
const normalizeEditGridHour = (hour: number, period?: string) =>
{
    if (!period) return hour;
    const upperPeriod = period.toUpperCase();

    if ((period === "下午" || upperPeriod === "PM") && hour < 12) return hour + 12;
    if ((period === "上午" || upperPeriod === "AM") && hour === 12) return 0;
    return hour;
};

/** 格式化日期。 */
const formatEditGridDate = (parts: EditGridDateTimeParts) =>
{
    return `${parts.year}/${padEditGridDatePart(parts.month)}/${padEditGridDatePart(parts.day)}`;
};

/** 格式化日期並附上星期。 */
const formatEditGridDateWithWeekday = (parts: EditGridDateTimeParts) =>
{
    return `${formatEditGridDate(parts)} (${getEditGridWeekdayText(parts)})`;
};

/** 格式化時間為上午/下午。 */
const formatEditGridTime = (parts: EditGridDateTimeParts) =>
{
    const hour = parts.hour ?? 0;
    const minute = parts.minute ?? 0;
    const period = hour >= 12 ? "下午" : "上午";
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;

    return `${period} ${padEditGridDatePart(displayHour)}:${padEditGridDatePart(minute)}`;
};

/** 取得中文星期。 */
const getEditGridWeekdayText = (parts: EditGridDateTimeParts) =>
{
    const weekTextList = ["日", "一", "二", "三", "四", "五", "六"];
    return weekTextList[new Date(parts.year, parts.month - 1, parts.day).getDay()];
};

/** 補零日期與時間數字。 */
const padEditGridDatePart = (value: number) => String(value).padStart(2, "0");

interface EditGridDateTimeParts
{
    year: number;
    month: number;
    day: number;
    hour?: number;
    minute?: number;
}
// #endregion

// #region Private
/** 將值轉成 input 可使用的字串。 */
const toInputValue = (value: EditGridCellValue) => value === null || value === undefined ? "" : String(toFileValue(value)?.fileName ?? value);

/** 將值轉成 select 可使用的字串。 */
const toSelectValue = (value: EditGridCellValue | EditGridOptionValue) => value === null || value === undefined ? "" : String(value);

/** 從下拉選項取回原始 value。 */
const getSelectValue = (options: EditGridSelectOption[], value: string): EditGridOptionValue | null => options.find(option => toSelectValue(option.value) === value)?.value ?? null;

/** 判斷是否為合法選項值。 */
const isOptionValue = (value: EditGridOptionValue | null): value is EditGridOptionValue => value !== null;

/** 將單一選項值顯示成 label。 */
const renderOptionLabel = (value: EditGridCellValue, options: EditGridSelectOption[]) =>
{
    if (value === null || value === undefined || Array.isArray(value) || toFileValue(value)) return "";
    return options.find(option => toSelectValue(option.value) === toSelectValue(value))?.label ?? String(value);
};

/** 將選項值陣列顯示成 label。 */
const renderOptionLabels = (values: EditGridOptionValue[], options: EditGridSelectOption[]) => values.map(value => renderOptionLabel(value, options)).join("、");

/** 判斷必填欄位是否空白。 */
const isEmptyValue = (value: EditGridCellValue) => value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0);

/** 移除 Set 中指定值。 */
const removeSetValue = (source: Set<string>, value: string) =>
{
    const next = new Set(source);
    next.delete(value);
    return next;
};

/** 移除 Record 中指定 key。 */
const removeRecordKey = <TValue,>(source: Record<string, TValue>, key: string) =>
{
    const next = { ...source };
    delete next[key];
    return next;
};
// #endregion

// #region Private
/** 取得檔案欄位唯讀文字，未選擇檔案時直接空白不顯示。 */
const getFileReadonlyContent = (file: EditGridFileValue): string =>
{
    return hasFileDisplayName(file) ? file.fileName.trim() : "";
};

/** 判斷檔案是否有可顯示檔名。 */
const hasFileDisplayName = (file: EditGridFileValue) =>
{
    return Boolean(file.fileName?.trim());
};

/** 將欄位值轉成檔案值。 */
const toFileValue = (value: EditGridCellValue): EditGridFileValue | null =>
{
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    return "fileName" in value ? value as EditGridFileValue : null;
};

/** 判斷檔案類型。 */
const getFileKind = (file: EditGridFileValue): "image" | "video" | "file" =>
{
    const mimeType = file.mimeType?.toLowerCase() ?? "";
    const fileName = file.fileName.toLowerCase();
    if (mimeType.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg|bmp|avif)$/.test(fileName)) return "image";
    if (mimeType.startsWith("video/") || /\.(mp4|webm|ogg|mov|m4v)$/.test(fileName)) return "video";
    return "file";
};
// #endregion

// #region Private
/** 建立目前資料列 key 簽章，用來判斷編輯狀態是否需要同步清理。 */
const buildRowKeySignature = (rows: GridRow[]): string =>
{
    return rows.map((row, index) => getRowKey(row, index)).join("|");
};

/** 建立目前仍存在的資料列 key 集合。 */
const buildRowKeySet = (rows: GridRow[]): Set<string> =>
{
    return new Set(rows.map((row, index) => getRowKey(row, index)));
};

/** 清掉已不存在資料列的編輯狀態，避免 Grid 被鎖住不能新增或修改。 */
const syncEditingKeys = (prev: Set<string>, rowKeySet: Set<string>): Set<string> =>
{
    const next = new Set(Array.from(prev).filter(key => rowKeySet.has(key)));
    return next.size === prev.size ? prev : next;
};

/** 清掉已不存在資料列的備份資料，避免取消編輯時吃到舊列。 */
const syncBackupMap = (prev: Record<string, GridRow>, rowKeySet: Set<string>): Record<string, GridRow> =>
{
    const next = Object.fromEntries(Object.entries(prev).filter(([key]) => rowKeySet.has(key)));
    return Object.keys(next).length === Object.keys(prev).length ? prev : next;
};
/** 取得表格外框 className，捲動中會補上紅框狀態 class。 */
const getEditGridTableWrapClassName = (isScrolling: boolean) =>
{
    const classList = ["edit-grid-table-wrap", isScrolling ? "table-scrolling-red" : ""];

    return classList.filter(Boolean).join(" ");
};

/** 取得資料列 className。 */
const getRowClassName = (rowIndex: number, style?: IEditGridView_Style, dragIndex?: number | null) =>
{
    const evenOdd = rowIndex % 2 === 1 ? style?.Odd ?? "" : style?.Even ?? "";
    const classList = [style?.RowStyle ?? "", evenOdd];
    if (dragIndex === rowIndex) classList.push("edit-grid-row-dragging");
    return classList.join(" ").trim();
};

/** EditGrid 局部 overflow 樣式，避免編輯模式下 A */

const getStickyHeaderBackdropStyle = (heightPx: number): CSSProperties => ({
    position: "sticky",
    top: 0,
    zIndex: 4,
    height: `${heightPx}px`,
    marginBottom: `-${heightPx}px`,
    pointerEvents: "none",
});

/** 取得 EditGrid 表頭樣式，垂直捲動時固定欄位標題避免使用者失去欄位對應。 */
const getEditGridHeaderCellStyle = (style: CSSProperties = {}): CSSProperties => ({
    position: "sticky",
    top: 0,
    zIndex: 6,
    background: "#ececec",
    backgroundClip: "border-box",
    borderColor: "#dee2e6",
    borderStyle: "solid",
    borderWidth: 0,
    boxShadow: "none",
    ...style,
});

/** 取得 EditGrid td 樣式。
 *  [Fix] 原版 maxWidth: 0 會把 td 壓成零寬度，導致所有 cell 內容消失。
 *        改為不設定 maxWidth，讓 colgroup 的 width 正常控制欄寬。 */
const getEditGridCellStyle = (): CSSProperties => ({ overflow: "hidden", minWidth: 0, boxSizing: "border-box" });

/** 取得 EditGrid cell 內容樣式，讓所有 input/select/file 區塊寬度收斂在 td 內。 */
const getEditGridCellContentStyle = (): CSSProperties => ({
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    overflowX: "hidden",
    overflowWrap: "anywhere",
    wordBreak: "break-word",
    boxSizing: "border-box",
});

/** 取得操作欄內容樣式。 */
const getEditGridActionContentStyle = (): CSSProperties => ({ maxWidth: "100%", minWidth: 0, overflowX: "hidden", boxSizing: "border-box" });

/** 確認目前可使用 document，避免 SSR render 階段碰到 browser API。 */
const isBrowserDocumentReady = () => typeof document !== "undefined" && typeof window !== "undefined";

/** 取得拖曳浮動提示樣式。 */
const getEditGridDragPreviewStyle = (pointer: EditGridDragPointer): CSSProperties => ({
    position: "fixed",
    left: `${pointer.x + 8}px`,
    top: `${pointer.y}px`,
    transform: "translateY(-50%)",
    zIndex: 100000,
    pointerEvents: "none",
});

/** 取得 EditGrid 根節點樣式，避免寬表格把整頁撐出水平捲軸。 */
const getEditGridRootStyle = (): CSSProperties => ({
    display: "flow-root",
    position: "relative",
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    overflowX: "clip",
    boxSizing: "border-box",
});

/** 取得表格包覆層樣式，取代 Bootstrap row，避免 row/flex 負責排版時被 table min-width 撐開。 */
const getEditGridTableWrapStyle = (): CSSProperties => ({
    display: "block",
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    overflowX: "clip",
    boxSizing: "border-box",
    position: "relative",
    contain: "layout paint inline-size",
    overscrollBehavior: "contain",
});

/** 正規化最多顯示列數，預設 5 列；傳入 0/null 時不限制高度。 */
const normalizeMaxVisibleRows = (value?: number | null) =>
{
    if (value === null || value === 0) return null;
    if (value === undefined) return DEFAULT_MAX_VISIBLE_ROWS;
    if (!Number.isFinite(value)) return DEFAULT_MAX_VISIBLE_ROWS;

    const rows = Math.floor(value);
    return rows > 0 ? rows : null;
};

/** 正規化像素數值，避免傳入異常值造成表格高度錯誤。 */
const normalizePositivePixel = (value: number | undefined, fallback: number) =>
{
    if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
    return value > 0 ? value : fallback;
};

/** 判斷是否需要啟用垂直捲軸；1024px 以上且超過限制列數時才固定表格高度。 */
const shouldUseVerticalScroll = (isDesktop: boolean, rowCount: number, maxVisibleRows: number | null) =>
{
    if (!isDesktop || maxVisibleRows === null) return false;
    return rowCount > maxVisibleRows;
};

/** 取得表頭背板高度，量不到時使用呼叫端傳入的預設高度。 */
const getMeasuredHeaderHeight = (scrollBox: HTMLElement, fallbackHeightPx: number) =>
{
    const thead = scrollBox.querySelector<HTMLElement>("thead");
    const height = thead?.getBoundingClientRect().height ?? 0;
    return height > 0 ? Math.ceil(height) : fallbackHeightPx;
};

/** 取得外層捲動樣式，固定寬度避免 Bootstrap row/flex item 被表格內容撐開而讓整頁出現水平拖拉 bar。 */
const getScrollBoxStyle = (
    _shouldScroll: boolean,
    isDragging: boolean,
    shouldUseYScroll: boolean,
    heightPx?: number,
): CSSProperties => ({
    display: "block",
    overflowX: "auto",
    overflowY: shouldUseYScroll ? "scroll" : "hidden",
    height: toScrollBoxHeightCss(shouldUseYScroll, heightPx),
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    boxSizing: "border-box",
    contain: "layout paint inline-size",
    overscrollBehavior: "contain",
    cursor: isDragging ? "grabbing" : "grab",
    userSelect: isDragging ? "none" : undefined,
    WebkitOverflowScrolling: "touch",
});

/** 計算垂直捲動區高度；1024px 以上且超過限制列數時才套用固定高度。 */
const toScrollBoxHeightCss = (shouldUseYScroll: boolean, heightPx?: number) =>
{
    if (!shouldUseYScroll) return undefined;

    return `${heightPx ?? DEFAULT_SCROLL_BOX_FIXED_HEIGHT_PX}px`;
};

/** 取得表格樣式，固定 table layout 可避免拖曳欄寬時 td 內容反向重排造成游標與欄線偏移。 */
const getTableStyle = (_shouldScroll: boolean, minWidth: number): CSSProperties => ({
    width: `${minWidth}px`,
    minWidth: "100%",
    maxWidth: "none",
    tableLayout: "fixed",
});

/** 將寬度轉成 CSS 可接受的值。 */
const toCssWidth = (width?: string | number): string | number | undefined => width === undefined ? undefined : typeof width === "number" ? `${width}px` : width;
// #endregion
