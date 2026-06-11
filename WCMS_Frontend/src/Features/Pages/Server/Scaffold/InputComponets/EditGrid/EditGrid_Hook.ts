import { useCallback, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type {
    ColumnConfig,
    EditGridCellValue,
    EditGridEditingStateArgs,
    EditGridFileValue,
    EditGridOptionValue,
    EditGridProps,
    EditGridSelectOption,
    GridProps,
    GridRow,
    RowCell,
} from "./EditGrid_Data";

// #region Property
export type EditGridRowIdValue = string | number;

export type EditGridMaybeRowIdValue = EditGridRowIdValue | null | undefined;

export type EditGridCollectionName<TData> = Extract<keyof TData, string>;

export type EditGridItemField<TItem> = Extract<keyof TItem, string>;


export interface EditGridFormBinding<TData>
{
    /** 目前 Form 的可編輯資料 */
    data?: TData;

    /** 更新 Form 資料，通常可直接銜接 useQueryFormData / ServerFormTemplate 的 setFormData */
    setFormData: (updater: (prev: TData | undefined) => TData) => void;
}


export interface EditGridParentBinding<TItem>
{
    /** 子資料對應父層 RowId 的欄位，例如 ParentRowId */
    field: EditGridItemField<TItem>;

    /** 目前父層 RowId */
    value: EditGridMaybeRowIdValue;

    /** 自訂 parent 比對規則，未提供時會用字串化後比對 */
    compare?: (itemValue: unknown, parentValue: EditGridMaybeRowIdValue) => boolean;
}


export interface EditGridBindingContext<TData, TItem>
{
    /** 目前完整 Form 資料 */
    data: TData;

    /** 目前 collection 全部資料 */
    sourceItems: TItem[];

    /** 已套用 parent / sort 後要顯示在 Grid 的資料 */
    visibleItems: TItem[];

    /** EditGrid 下一筆列號，通常從 1 開始 */
    nextRowNo: number;

    /** 從目前顯示資料推算出的下一個 RowId */
    nextRowId: number;
}


export interface EditGridRowsCommitContext<TData, TItem>
{
    /** 更新前完整 Form 資料 */
    data: TData;

    /** Grid 回傳的最新 rows */
    rows: GridRow[];

    /** 更新前 collection 全部資料 */
    sourceItems: TItem[];

    /** rows 轉回 DTO 後的目前可見資料 */
    nextVisibleItems: TItem[];

    /** 寫回 Form 前最後一次調整後的 collection 全部資料 */
    nextItems: TItem[];
}


export interface EditGridDeleteContext<TData, TItem>
{
    /** 目前完整 Form 資料 */
    data: TData;

    /** 被刪除的 Grid row */
    row: GridRow;

    /** 更新前 collection 全部資料 */
    sourceItems: TItem[];
}


export interface UseEditGridBindingOptions<TData, TItem, TRow extends GridRow = GridRow>
{
    /** Form binding，可接新版 Server_FormTemplate 的 vm.binding */
    binding: EditGridFormBinding<TData>;

    /** 新增模式或資料尚未載入時使用的預設資料 */
    emptyData: TData;

    /** collection 欄位名稱，例如 AnnouncementDetailFile；若提供 getItems/setItems 可不填 */
    collectionName?: EditGridCollectionName<TData>;

    /** EditGrid 欄位定義 */
    columns: ColumnConfig[] | (() => ColumnConfig[]);

    /** 將 DTO 轉成 GridRow */
    toRow: (item: TItem, index: number, ctx: EditGridBindingContext<TData, TItem>) => TRow;

    /** 將 GridRow 轉回 DTO */
    toItem: (row: GridRow, index: number, ctx: EditGridBindingContext<TData, TItem>) => TItem;

    /** 建立新增列 DTO；若未提供 createRow，EditGrid 新增時會先呼叫此方法 */
    createItem?: (ctx: EditGridBindingContext<TData, TItem>) => TItem;

    /** 自訂新增列 GridRow，適合特殊 insert row 需要直接控制 cells 時使用 */
    createRow?: (ctx: EditGridBindingContext<TData, TItem>) => GridRow;

    /** 自訂讀取 collection，適合資料不是單純 array 欄位時使用 */
    getItems?: (data: TData) => TItem[] | null | undefined;

    /** 自訂寫回 collection，適合資料不是單純 array 欄位時使用 */
    setItems?: (data: TData, items: TItem[]) => TData;

    /** 子明細 parent 綁定設定，會自動過濾與合併同 parent 資料 */
    parent?: EditGridParentBinding<TItem>;

    /** 取得 item 的 RowId，用於新增列自增 */
    getItemRowId?: (item: TItem, index: number) => EditGridMaybeRowIdValue;

    /** 顯示前排序規則，例如依 RowId / Sort 排序 */
    sortItems?: (items: TItem[]) => TItem[];

    /** rows 寫回前最後一次調整，可用於補齊子資料或清理孤兒資料 */
    beforeCommit?: (ctx: EditGridRowsCommitContext<TData, TItem>) => TItem[];

    /** 刪除列時的額外資料處理，例如刪父層時同步刪子層 */
    onDeleteRow?: (ctx: EditGridDeleteContext<TData, TItem>) => void;

    /** 額外 EditGrid props，Hook 會覆寫 GridData / createRow / onRowsChange / onDeleteRow */
    editGridProps?: Omit<EditGridProps, "GridData" | "gridData" | "createRow" | "onRowsChange" | "onDeleteRow">;
}


export interface UseEditGridBindingResult<TItem>
{
    /** 目前顯示在 Grid 的 DTO 資料 */
    items: TItem[];

    /** 給 EditGrid 使用的 GridData */
    gridData: GridProps;

    /** 給 EditGrid 直接展開使用的 props */
    editGridProps: EditGridProps;

    /** 手動建立新增列，特殊情境可直接傳給 EditGrid */
    createRow: (nextRowNo: number) => GridRow;

    /** 手動同步 rows，特殊情境可直接傳給 EditGrid */
    onRowsChange: (rows: GridRow[]) => void;

    /** 手動刪除列額外事件，特殊情境可直接傳給 EditGrid */
    onDeleteRow: (row: GridRow) => void;
}


export interface UseEditGridSubDetailStateOptions
{
    /** 編輯中是否禁止切換展開列 */
    preventToggleWhenEditing?: boolean;

    /** 自訂 row key 取得方式 */
    getRowKey?: (row: GridRow) => string;
}


export interface UseEditGridSubDetailStateResult
{
    /** 目前展開的 row key */
    expandedRowKey: string | null;

    /** 是否有子明細正在編輯 */
    isSubDetailEditing: boolean;

    /** 直接指定展開的 row key */
    setExpandedRowKey: (value: string | null) => void;

    /** 切換指定列的子明細展開狀態 */
    toggleSubDetail: (row: GridRow) => void;

    /** 關閉所有子明細 */
    closeSubDetail: () => void;

    /** 接給子層 EditGrid 的 editing state callback */
    onSubDetailEditingStateChange: (args: EditGridEditingStateArgs) => void;
}
// #endregion

// #region Public
/** 建立 EditGrid 與 Form collection 的標準資料綁定流程。 */
export const useEditGridBinding = <TData, TItem, TRow extends GridRow = GridRow>(
    opt: UseEditGridBindingOptions<TData, TItem, TRow>,
): UseEditGridBindingResult<TItem> =>
{
    const optRef = useLatestRef(opt);
    const data = opt.binding.data ?? opt.emptyData;
    const dataRef = useLatestRef(data);
    const collectionName = opt.collectionName;
    const parentSignature = buildParentBindingSignature(opt.parent);
    const dataSignature = buildStableSnapshot(data);
    const rawSourceItems = useMemo(() => readCollectionItems(dataRef.current, optRef.current), [collectionName, dataSignature]);
    const sourceItemsSignature = buildStableSnapshot(rawSourceItems);
    const sourceItems = useMemo(() => rawSourceItems, [sourceItemsSignature]);
    const sourceItemsRef = useLatestRef(sourceItems);
    const rawItems = useMemo(() => buildVisibleItems(sourceItems, optRef.current), [parentSignature, sourceItems]);
    const itemsSignature = buildStableSnapshot(rawItems);
    const items = useMemo(() => rawItems, [itemsSignature]);
    const itemsRef = useLatestRef(items);
    const rawColumns = resolveEditGridColumns(opt.columns);
    const columnsSignature = buildColumnListSignature(rawColumns);
    const columns = useMemo(() => rawColumns, [columnsSignature]);
    const ctx = useMemo(() => buildBindingContext(dataRef.current, sourceItems, items, optRef.current), [dataSignature, items, sourceItems]);
    const ctxRef = useLatestRef(ctx);
    const rawRows = useMemo(() => items.map((item, index) => optRef.current.toRow(item, index, ctxRef.current)), [ctx, items]);
    const rowsSignature = buildRowListSignature(rawRows);
    const rows = useMemo(() => rawRows, [rowsSignature]);
    const gridData = useMemo(() => buildEditGridData(columns, rows), [columns, rows]);
    const createRow = useCallback(
        (nextRowNo: number) => buildCreateRow(nextRowNo, optRef.current, dataRef.current, sourceItemsRef.current, itemsRef.current),
        [],
    );
    const onRowsChange = useCallback((rows: GridRow[]) => commitRowsToBinding(rows, optRef.current), []);
    const onDeleteRow = useCallback((row: GridRow) => handleBindingDeleteRow(row, optRef.current), []);
    const editGridPropsSignature = buildEditGridPropsSignature(opt.editGridProps);
    const editGridProps = useMemo(() => buildEditGridProps(optRef.current, gridData, createRow, onRowsChange, onDeleteRow), [
        createRow,
        editGridPropsSignature,
        gridData,
        onDeleteRow,
        onRowsChange,
    ]);

    return { items, gridData, editGridProps, createRow, onRowsChange, onDeleteRow };
};


/** 管理 EditGrid 子明細展開狀態與子明細編輯鎖定。 */
export const useEditGridSubDetailState = (opt?: UseEditGridSubDetailStateOptions): UseEditGridSubDetailStateResult =>
{
    const [expandedRowKey, setExpandedRowKey] = useState<string | null>(null);
    const [isSubDetailEditing, setIsSubDetailEditing] = useState(false);
    const getRowKeyRef = useLatestRef(opt?.getRowKey);
    const preventToggleWhenEditing = opt?.preventToggleWhenEditing !== false;

    /** 切換子明細展開列，編輯中預設不允許切換避免資料錯位。 */
    const toggleSubDetail = useCallback((row: GridRow) =>
    {
        if (preventToggleWhenEditing && isSubDetailEditing) return;
        const rowKey = getRowKeyRef.current?.(row) ?? getEditGridRowKey(row);
        setExpandedRowKey(prev => (prev === rowKey ? null : rowKey));
    }, [getRowKeyRef, isSubDetailEditing, preventToggleWhenEditing]);

    /** 關閉所有子明細。 */
    const closeSubDetail = useCallback(() => setExpandedRowKey(null), []);

    /** 更新子明細編輯狀態，讓父層可以鎖定展開列。 */
    const onSubDetailEditingStateChange = useCallback((args: EditGridEditingStateArgs) => setIsSubDetailEditing(args.hasEditingRow), []);

    return { expandedRowKey, isSubDetailEditing, setExpandedRowKey, toggleSubDetail, closeSubDetail, onSubDetailEditingStateChange };
};




/** 建立共用 Cell，避免每支 Form 重複組 RowCell 結構。 */
export const buildEditGridCell = (key: string, title: string, value: EditGridCellValue, opt?: Partial<RowCell>): RowCell =>
{
    return { col: { key, title }, content: value as ReactNode, value, ...opt };
};


/** 取得 GridRow 的 RowId，缺值時以 index + 1 補上。 */
export const getEditGridRowId = (row: GridRow, index: number = 0): number =>
{
    return Number(row.RowId ?? row.rowId ?? row.rowid ?? index + 1);
};


/** 取得 GridRow 的穩定 key，供 SubDetail 展開或外部狀態使用。 */
export const getEditGridRowKey = (row: GridRow): string =>
{
    return String(row.keyId || row.RowId || row.rowId || row.rowid || "");
};


/** 取得指定 Cell 值。 */
export const getEditGridCellValue = (row: GridRow, key: string): EditGridCellValue =>
{
    return row.cells.find(cell => cell.col.key === key)?.value;
};


/** 判斷 Cell 值是否為 EditGrid file value。 */
export const isEditGridFileValue = (value: EditGridCellValue): value is EditGridFileValue =>
{
    return typeof value === "object" && value !== null && !Array.isArray(value) && "fileName" in value;
};


/** 取得使用者選擇的 EditGrid file value，非檔案欄位則回傳 null。 */
export const getSelectedEditGridFile = (value: EditGridCellValue): EditGridFileValue | null =>
{
    if (isEditGridFileValue(value)) return value;
    return null;
};


/** 取得指定 Cell 的字串值，null / undefined 會轉為空字串。 */
export const getEditGridStringCellValue = (row: GridRow, key: string): string =>
{
    const value = getEditGridCellValue(row, key);
    return value === null || value === undefined ? "" : String(value);
};


/** 取得指定 Cell 的 nullable 字串值，空字串會轉為 null。 */
export const getEditGridNullableStringCellValue = (row: GridRow, key: string): string | null =>
{
    const value = getEditGridStringCellValue(row, key).trim();
    return value.length > 0 ? value : null;
};


/** 取得指定 Cell 的數字值，轉換失敗時回傳 fallback。 */
export const getEditGridNumberCellValue = (row: GridRow, key: string, fallback: number): number =>
{
    const value = getEditGridCellValue(row, key);
    const numberValue = typeof value === "number" ? value : Number(value);
    return Number.isFinite(numberValue) ? numberValue : fallback;
};


/** 將 enum map 轉為 EditGrid select options。 */
export const toEditGridOptions = (data: Record<string, string>, keepStringValue = false): EditGridSelectOption[] =>
{
    return Object.entries(data).map(([value, label]) => ({ label, value: keepStringValue ? value : toEditGridOptionValue(value) }));
};
// #endregion

// #region Private
/** 讀取目前 Form data 裡的 collection。 */
const readCollectionItems = <TData, TItem, TRow extends GridRow>(data: TData, opt: UseEditGridBindingOptions<TData, TItem, TRow>): TItem[] =>
{
    const items = opt.getItems?.(data) ?? readNamedCollectionItems(data, opt.collectionName);
    return Array.isArray(items) ? items : [];
};


/** 從指定 collectionName 讀取資料。 */
const readNamedCollectionItems = <TData, TItem>(data: TData, collectionName?: EditGridCollectionName<TData>): TItem[] =>
{
    if (!collectionName) return [];
    const items = (data as Record<string, unknown>)[collectionName];
    return Array.isArray(items) ? items as TItem[] : [];
};


/** 套用 parent 過濾與排序規則，取得目前 Grid 要顯示的資料。 */
const buildVisibleItems = <TData, TItem, TRow extends GridRow>(sourceItems: TItem[], opt: UseEditGridBindingOptions<TData, TItem, TRow>): TItem[] =>
{
    const filtered = opt.parent ? sourceItems.filter(item => isSameParentItem(item, opt.parent!)) : [...sourceItems];
    return opt.sortItems ? opt.sortItems(filtered) : filtered;
};


/** 建立 Hook 內部共用 context。 */
const buildBindingContext = <TData, TItem, TRow extends GridRow>(
    data: TData,
    sourceItems: TItem[],
    visibleItems: TItem[],
    opt: UseEditGridBindingOptions<TData, TItem, TRow>,
): EditGridBindingContext<TData, TItem> =>
{
    return { data, sourceItems, visibleItems, nextRowNo: visibleItems.length + 1, nextRowId: getNextItemRowId(visibleItems, opt.getItemRowId) };
};


/** 建立新增列 Row。 */
const buildCreateRow = <TData, TItem, TRow extends GridRow>(
    nextRowNo: number,
    opt: UseEditGridBindingOptions<TData, TItem, TRow>,
    data: TData,
    sourceItems: TItem[],
    visibleItems: TItem[],
): GridRow =>
{
    const ctx = { data, sourceItems, visibleItems, nextRowNo, nextRowId: getNextItemRowId(visibleItems, opt.getItemRowId) };
    if (opt.createRow) return opt.createRow(ctx);
    if (opt.createItem) return opt.toRow(opt.createItem(ctx), nextRowNo - 1, ctx);
    return buildEmptyEditGridRow(nextRowNo);
};


/** 將 EditGrid rows 同步回 Form binding。 */
const commitRowsToBinding = <TData, TItem, TRow extends GridRow>(rows: GridRow[], opt: UseEditGridBindingOptions<TData, TItem, TRow>): void =>
{
    opt.binding.setFormData(prev =>
    {
        const data = prev ?? opt.emptyData;
        const sourceItems = readCollectionItems(data, opt);
        const visibleItems = buildVisibleItems(sourceItems, opt);
        const ctx = buildBindingContext(data, sourceItems, visibleItems, opt);
        const nextVisibleItems = rows.map((row, index) => opt.toItem(row, index, ctx));
        const nextItems = mergeCollectionItems(sourceItems, nextVisibleItems, opt.parent);
        const finalItems = opt.beforeCommit?.({ data, rows, sourceItems, nextVisibleItems, nextItems }) ?? nextItems;

        return writeCollectionItems(data, finalItems, opt);
    });
};


/** 處理刪除列時的額外資料同步。 */
const handleBindingDeleteRow = <TData, TItem, TRow extends GridRow>(row: GridRow, opt: UseEditGridBindingOptions<TData, TItem, TRow>): void =>
{
    if (!opt.onDeleteRow) return;
    const data = opt.binding.data ?? opt.emptyData;
    const sourceItems = readCollectionItems(data, opt);
    opt.onDeleteRow({ data, row, sourceItems });
};


/** 寫回 collection 到 Form data。 */
const writeCollectionItems = <TData, TItem, TRow extends GridRow>(data: TData, items: TItem[], opt: UseEditGridBindingOptions<TData, TItem, TRow>): TData =>
{
    if (opt.setItems) return opt.setItems(data, items);
    if (!opt.collectionName) return data;
    return { ...(data as Record<string, unknown>), [opt.collectionName]: items } as TData;
};


/** 合併 parent collection，子明細只替換同 parent 資料。 */
const mergeCollectionItems = <TItem>(sourceItems: TItem[], nextVisibleItems: TItem[], parent?: EditGridParentBinding<TItem>): TItem[] =>
{
    if (!parent) return nextVisibleItems;
    const otherItems = sourceItems.filter(item => !isSameParentItem(item, parent));
    return [...otherItems, ...nextVisibleItems];
};


/** 判斷資料是否屬於目前 parent。 */
const isSameParentItem = <TItem>(item: TItem, parent: EditGridParentBinding<TItem>): boolean =>
{
    const itemValue = (item as Record<string, unknown>)[parent.field];
    if (parent.compare) return parent.compare(itemValue, parent.value);
    return normalizeCompareValue(itemValue) === normalizeCompareValue(parent.value);
};


/** 取得下一個 RowId。 */
const getNextItemRowId = <TItem>(items: TItem[], getItemRowId?: (item: TItem, index: number) => EditGridMaybeRowIdValue): number =>
{
    const maxRowId = items.reduce((max, item, index) => Math.max(max, Number(getItemRowId?.(item, index) ?? 0)), 0);
    return maxRowId + 1;
};


/** 建立空白新增列，避免未提供 createItem/createRow 時 EditGrid 爆掉。 */
const buildEmptyEditGridRow = (nextRowNo: number): GridRow =>
{
    return { keyId: `edit-grid-new-${Date.now()}-${nextRowNo}`, rowId: nextRowNo, RowId: nextRowNo, RowNo: nextRowNo, rowState: "insert", cells: [] };
};


/** 建立 GridData。 */
const buildEditGridData = (columns: ColumnConfig[], rows: GridRow[]): GridProps =>
{
    return { columns, rows, CurrentPage: 1, TotalPage: 1, onPageChange: () => undefined };
};


/** 建立可直接傳入 EditGrid 的 props。 */
const buildEditGridProps = <TData, TItem, TRow extends GridRow>(
    opt: UseEditGridBindingOptions<TData, TItem, TRow>,
    gridData: GridProps,
    createRow: (nextRowNo: number) => GridRow,
    onRowsChange: (rows: GridRow[]) => void,
    onDeleteRow: (row: GridRow) => void,
): EditGridProps =>
{
    return { ...opt.editGridProps, GridData: gridData, createRow, onRowsChange, onDeleteRow };
};




/** 保存最新值，但不把整包物件放入 dependency，避免 inline option 造成循環。 */
const useLatestRef = <TValue>(value: TValue) =>
{
    const ref = useRef(value);
    ref.current = value;
    return ref;
};


/** 建立 parent 設定簽章，避免 parent 每次 inline new object 造成重算。 */
const buildParentBindingSignature = <TItem>(parent?: EditGridParentBinding<TItem>): string =>
{
    if (!parent) return "";
    return [String(parent.field), normalizeCompareValue(parent.value), Boolean(parent.compare)].join("|");
};


/** 建立 EditGrid 額外 props 簽章，避免 inline props 物件造成每次重建。 */
const buildEditGridPropsSignature = (props?: UseEditGridBindingOptions<unknown, unknown>["editGridProps"]): string =>
{
    return buildStableSnapshot(props ?? {});
};


/** 建立欄位清單簽章，忽略 render callback reference。 */
const buildColumnListSignature = (columns: ColumnConfig[]): string =>
{
    return (Array.isArray(columns) ? columns : []).map(buildColumnSignature).join("§");
};


/** 建立單一欄位簽章，避免 function reference 影響穩定性。 */
const buildColumnSignature = (column: ColumnConfig): string =>
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
        column.placeholder,
        column.selectionMode,
        column.searchPlaceholder,
        column.accept,
        column.multiple,
        column.maxFileCount,
        column.maxFileSizeMB,
        column.aaLabel,
        column.helpText,
        column.maxLength,
        column.min,
        column.max,
        column.step,
        column.rows,
        column.searchable,
        column.maxSearchLength,
        buildStableSnapshot(column.options ?? []),
    ].join("|");
};


/** 建立資料列清單簽章，讓 GridData 在內容沒變時維持穩定。 */
const buildRowListSignature = (rows: GridRow[]): string =>
{
    return (Array.isArray(rows) ? rows : []).map(buildRowSignature).join("§");
};


/** 建立單一資料列簽章，避免 ReactNode / callback reference 影響比對。 */
const buildRowSignature = (row: GridRow): string =>
{
    const cells = row.cells.map(cell => [cell.col.key, buildStableSnapshot(cell.value)].join(":")).join("|");
    return [row.keyId, row.RowId, row.rowId, row.rowid, row.RowNo, row.rowNo, row.rowno, row.rowState, cells].join("|");
};


/** 建立穩定快照文字，遇到 function / ReactNode / File 只保留可比對資訊。 */
const buildStableSnapshot = (value: unknown): string =>
{
    try
    {
        return JSON.stringify(value, stableSnapshotReplacer) ?? "";
    } catch
    {
        return String(value ?? "");
    }
};


/** JSON snapshot replacer，避免不可序列化物件造成比對失敗。 */
const stableSnapshotReplacer = (_key: string, value: unknown): unknown =>
{
    if (typeof value === "function") return "__function__";
    if (isFileValue(value)) return buildFileValueSnapshot(value);
    if (isReactElementLike(value)) return "__react_node__";
    return value;
};


/** 判斷是否為瀏覽器 File 物件。 */
const isFileValue = (value: unknown): value is File =>
{
    return typeof File !== "undefined" && value instanceof File;
};


/** 建立 File 快照內容，避免整個 File 物件進入 dependency。 */
const buildFileValueSnapshot = (file: File): EditGridFileValue =>
{
    return { fileName: file.name, size: file.size, mimeType: file.type };
};


/** 判斷是否像 React Element，避免 snapshot 讀入整包 React internals。 */
const isReactElementLike = (value: unknown): boolean =>
{
    return typeof value === "object" && value !== null && "$$typeof" in value;
};




/** 解析欄位設定，支援固定陣列或工廠方法。 */
const resolveEditGridColumns = (columns: ColumnConfig[] | (() => ColumnConfig[])): ColumnConfig[] =>
{
    return typeof columns === "function" ? columns() : columns;
};


/** 轉換 enum key 成 EditGrid option value。 */
const toEditGridOptionValue = (value: string): EditGridOptionValue =>
{
    const numberValue = Number(value);
    return Number.isFinite(numberValue) && value.trim() !== "" ? numberValue : value;
};


/** 將值正規化為可比對文字。 */
const normalizeCompareValue = (value: unknown): string =>
{
    return String(value ?? "");
};
// #endregion
