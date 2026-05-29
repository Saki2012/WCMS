import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type {
    ColumnConfig,
    EditGridCellValue,
    EditGridEditingStateArgs,
    EditGridOptionValue,
    EditGridProps,
    EditGridSelectOption,
    GridProps,
    GridRow,
    RowCell,
} from "./EditGrid_Data";

// #region Public Types

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

// #region Public Hooks

/** 建立 EditGrid 與 Form collection 的標準資料綁定流程。 */
export const useEditGridBinding = <TData, TItem, TRow extends GridRow = GridRow>(
    opt: UseEditGridBindingOptions<TData, TItem, TRow>,
): UseEditGridBindingResult<TItem> =>
{
    const data = opt.binding.data ?? opt.emptyData;
    const sourceItems = useMemo(() => readCollectionItems(data, opt), [data, opt]);
    const items = useMemo(() => buildVisibleItems(sourceItems, opt), [sourceItems, opt]);
    const columns = useMemo(() => resolveEditGridColumns(opt.columns), [opt.columns]);
    const ctx = useMemo(() => buildBindingContext(data, sourceItems, items, opt), [data, sourceItems, items, opt]);
    const rows = useMemo(() => items.map((item, index) => opt.toRow(item, index, ctx)), [items, opt, ctx]);
    const gridData = useMemo(() => buildEditGridData(columns, rows), [columns, rows]);
    const createRow = useCallback((nextRowNo: number) => buildCreateRow(nextRowNo, opt, data, sourceItems, items), [opt, data, sourceItems, items]);
    const onRowsChange = useCallback((rows: GridRow[]) => commitRowsToBinding(rows, opt), [opt]);
    const onDeleteRow = useCallback((row: GridRow) => handleBindingDeleteRow(row, opt), [opt]);
    const editGridProps = useMemo(() => buildEditGridProps(opt, gridData, createRow, onRowsChange, onDeleteRow), [opt, gridData, createRow, onRowsChange, onDeleteRow]);

    return { items, gridData, editGridProps, createRow, onRowsChange, onDeleteRow };
};

/** 管理 EditGrid 子明細展開狀態與子明細編輯鎖定。 */
export const useEditGridSubDetailState = (opt?: UseEditGridSubDetailStateOptions): UseEditGridSubDetailStateResult =>
{
    const [expandedRowKey, setExpandedRowKey] = useState<string | null>(null);
    const [isSubDetailEditing, setIsSubDetailEditing] = useState(false);

    const toggleSubDetail = useCallback((row: GridRow) =>
    {
        if (opt?.preventToggleWhenEditing !== false && isSubDetailEditing) return;
        const rowKey = opt?.getRowKey?.(row) ?? getEditGridRowKey(row);
        setExpandedRowKey(prev => (prev === rowKey ? null : rowKey));
    }, [isSubDetailEditing, opt]);

    const closeSubDetail = useCallback(() => setExpandedRowKey(null), []);
    const onSubDetailEditingStateChange = useCallback((args: EditGridEditingStateArgs) => setIsSubDetailEditing(args.hasEditingRow), []);

    return { expandedRowKey, isSubDetailEditing, setExpandedRowKey, toggleSubDetail, closeSubDetail, onSubDetailEditingStateChange };
};

// #endregion

// #region Public Helpers

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

// #region Private Binding Helpers

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

// #endregion

// #region Private Value Helpers

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
