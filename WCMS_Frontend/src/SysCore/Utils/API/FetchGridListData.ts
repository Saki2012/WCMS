import { useCallback, useEffect, useMemo, useState } from "react";
import type { ModelDisplaySchema } from "../../../types/IApiSchema";
import type { ColumnConfig, GridProps, GridRow } from "../../Components/Grid/Grid_Data";

type QueryListParam = components["schemas"]["QueryListParam"];

import type { components } from "../../../types/api";
import type { ApiResponse } from "../../Interface/IApiProvider";
export interface UseGridListOptions<T>
{
    /** 取得 model display 名稱 */
    getModelDisplayName: () => Promise<ModelDisplaySchema>;
    /** 取得資料筆數 */
    fetchListCount: (condition: QueryListParam) => Promise<ApiResponse<number>>;
    /** 取得清單資料 */
    fetchList: (condition: QueryListParam) => Promise<ApiResponse<T[]>>;
    /** 欄位對應關係 */
    visibleKeys: [string, string][];
    /** 查詢條件 */
    buildQueryCondition: (page: number) => QueryListParam;
    /** 如何解析 row 資料 */
    parseRow?: (item: T, columns: ColumnConfig[]) => GridRow;
    initialData?: T[]; // ✅ SSR 預先帶進來的資料
    deps?: React.DependencyList; // ✅ 依賴，變化時會重新 fetch
    enabled?: boolean; // ✅ 控制是否要打 API
}
type RefetchOpt =
    | { mode?: "current"; } // 預設：重抓目前的 page（不動頁碼）
    | { mode: "first"; } // 回到第 1 頁再抓
    | { mode: "page"; page: number; }; // 指定頁碼
export const useFetchGridListData = <T>(props: UseGridListOptions<T>) =>
{
    const [rawData, setRawData] = useState<T[]>(props.initialData ?? []);
    const [rows, setRows] = useState<GridRow[]>([]);
    const [columns, setColumns] = useState<ColumnConfig[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(!props.initialData);
    const [error, setError] = useState<string | null>(null);
    const [bump, setBump] = useState(0);
    const fetchData = async (page: number) =>
    {
        setIsLoading(true);
        setError(null);
        try
        {
            // 取得欄位名稱與顯示設定
            const cols = await BuildVisibleColumns(props.getModelDisplayName, props.visibleKeys);
            setColumns(cols);
            const condition = props.buildQueryCondition(page);
            const countRes = await props.fetchListCount(condition);
            if (!countRes.IsSuccess)
            {
                const msg = countRes.SysMessage?.map(x => `${x.MessageCode}:${x.Message}`).join(";") ?? "查詢筆數失敗";
                throw new Error(msg);
            }
            const rawCount = countRes.Data;
            const count = Number(rawCount) || 0; // 確保是 number
            const pageSize = Number(condition.PageSize) || 1; // 避免除以 0/NaN
            const total = Math.ceil(count / pageSize);
            setTotalPages(total);

            const listRes = await props.fetchList(condition);
            if (!listRes.IsSuccess)
            {
                const msg = listRes.SysMessage?.map(x => `${x.MessageCode}:${x.Message}`).join(";") ?? "資料查詢失敗";
                throw new Error(msg);
            }
            const payload = listRes.Data ?? [];
            const fullData = (payload as T[][]).flat();
            setRawData(fullData);
            const parsedRows = fullData.map(item => props.parseRow ? props.parseRow(item, cols) : item) as GridRow[];
            setRows(parsedRows);
        } catch (err: any)
        {
            setError(err.message ?? "資料載入失敗");
        } finally
        {
            setIsLoading(false);
        }
    };
    const refetch = useCallback((o?: RefetchOpt) =>
    {
        if (!o || o.mode === "current")
        {
            // 不改 page，只重抓目前頁
            setBump(v => v + 1);
        } else if (o.mode === "first")
        {
            if (currentPage === 1)
            {
                setBump(v => v + 1);
            } else
            {
                setCurrentPage(1); // 改 page → 由 effect 觸發抓取
            }
        } else if (o.mode === "page")
        {
            setCurrentPage(o.page);
        }
    }, []);
    useEffect(() =>
    {
        if (!props.enabled || props.initialData)
        {
            setIsLoading(false);
            return;
        }
        fetchData(currentPage);
    }, [currentPage, props.enabled, ...props.deps ?? [], bump]);
    const gridProps: GridProps = useMemo(
        () => ({
            columns,
            rows,
            rawData,
            CurrentPage: currentPage,
            TotalPage: totalPages,
            onPageChange: (page: number) => setCurrentPage(page),
        }),
        [columns, rows, rawData, currentPage, totalPages, bump],
    );
    const refetchCurrent = useCallback(async () => refetch({ mode: "current" }), [refetch]);
    const refetchFirst = useCallback(async () => refetch({ mode: "first" }), [refetch]);
    return { rawData, gridProps, isLoading, error, refetchCurrent, refetchFirst };
};

/**
 * 根據 Provider 的 getModelDisplayName 回傳欄位定義與 visibleKeys 產生對應欄位設定
 * @param getModelDisplayFn - 傳入像 AnnouncementProvider().getModelDisplayName 的函式（要 return Promise<ApiResponse<ModelDisplaySchema>>）
 * @param visibleKeys - 陣列格式: [[TableId, ColumnId], ...]
 * @returns ColumnConfig[]
 */
const BuildVisibleColumns = async (
    getModelDisplayFn: () => Promise<ModelDisplaySchema>,
    visibleKeys: ReadonlyArray<readonly [string, string]>,
): Promise<ColumnConfig[]> =>
{
    const schema = await getModelDisplayFn();
    if (!schema?.Tables?.length) return [];

    const columns = visibleKeys
        .map(([tableId, columnId]) =>
        {
            const table = schema.Tables.find(t => t.TableId === tableId);
            const col = table?.Columns.find(c => c.ColumnId === columnId);
            if (!col) return null;
            return { key: col.ColumnId, title: col.ColumnDisplayName } as ColumnConfig;
        })
        .filter((x): x is ColumnConfig => !!x);

    return columns;
};
