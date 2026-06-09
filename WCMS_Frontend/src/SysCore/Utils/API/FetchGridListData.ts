import type { ColumnConfig, GridProps, GridRow } from "@/SysCore/Components/Grid/Grid_Data";
import type { ApiResponse } from "@/SysCore/Interface/IApiProvider";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// #region Property
type QueryListParam = components["schemas"]["QueryListParam"];


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
    | { mode: "page"; page: number; };
// #endregion

// #region Public
 // 指定頁碼

export const useFetchGridListData = <T>(props: UseGridListOptions<T>) =>
{
    // 宣告變數
    const lastFetchKeyRef = useRef<string>("");
    const skipFetchOnceRef = useRef(false); // ✅ deps 變動先回第一頁，跳過舊頁碼那次 fetch
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
        // 執行 function
        setIsLoading(true);
        setError(null);
        try
        {
            // 取得欄位名稱與顯示設定
            const cols = await BuildVisibleColumns(props.getModelDisplayName, props.visibleKeys);
            setColumns(cols);
            // 組查詢條件
            const condition = props.buildQueryCondition(page);
            // 先查筆數
            const countRes = await props.fetchListCount(condition);
            if (!countRes.IsSuccess)
            {
                const msg = countRes.SysMessage?.map(x => `${x.MessageCode}:${x.Message}`).join(";") ?? "查詢筆數失敗";
                throw new Error(msg);
            }
            const rawCount = countRes.Data;
            const count = Number(rawCount) || 0;
            const pageSize = Number(condition.PageSize) || 1;
            const total = Math.ceil(count / pageSize);
            setTotalPages(Math.max(1, total)); // ✅ 避免 0 頁
            // 再查清單
            const listRes = await props.fetchList(condition);
            if (!listRes.IsSuccess)
            {
                const msg = listRes.SysMessage?.map(x => `${x.MessageCode}:${x.Message}`).join(";") ?? "資料查詢失敗";
                throw new Error(msg);
            }
            const payload = listRes.Data ?? [];
            const fullData = (payload as T[][]).flat();
            setRawData(fullData);
            // 解析成 Grid rows（若沒給 parseRow，就當 item 本身就是 GridRow）
            const parsedRows = fullData.map(item => props.parseRow ? props.parseRow(item, cols) : item) as GridRow[];
            setRows(parsedRows);
        } catch (err: any)
        {
            setError(err?.message ?? "資料載入失敗");
        } finally
        {
            setIsLoading(false);
        }
    };

    const refetch = useCallback((o?: RefetchOpt) =>
    {
        // 執行 function
        if (!o || o.mode === "current")
        {
            // 不改 page，只重抓目前頁
            setBump(v => v + 1);
            return;
        }

        if (o.mode === "first")
        {
            // ✅ 回第一頁：若已在第一頁就 bump 重抓，否則改 page 由 effect 觸發
            if (currentPage === 1 || currentPage === 0)
            {
                setBump(v => v + 1);
            } else
            {
                setCurrentPage(1);
            }
            return;
        }

        if (o.mode === "page")
        {
            setCurrentPage(o.page);
        }
    }, [currentPage]);

    // ✅ deps 變動 → 回到第一頁（避免最後一頁套新條件變空）
    // ⚠️ 這個 effect 必須放在抓資料的 effect 上面
    useEffect(() =>
    {
        if (!props.enabled || props.initialData) return;

        if (currentPage !== 1)
        {
            skipFetchOnceRef.current = true; // 跳過舊頁碼那次 fetch
            setCurrentPage(1);
        }
    }, [...props.deps ?? []]);

    useEffect(() =>
    {
        // 執行 function
        if (!props.enabled || props.initialData)
        {
            setIsLoading(false);
            return;
        }

        // ✅ deps 變動回第一頁時，先跳過舊頁碼那次 fetch（避免空一下/多打一次）
        if (skipFetchOnceRef.current)
        {
            skipFetchOnceRef.current = false;
            return;
        }

        const cond = props.buildQueryCondition(currentPage);
        const key = `${currentPage}|${buildStableQueryKey(cond)}|${JSON.stringify(props.deps ?? [])}`;
        if (lastFetchKeyRef.current === key) return;

        lastFetchKeyRef.current = key;
        fetchData(currentPage);
    }, [currentPage, props.enabled, ...props.deps ?? [], bump]);

    const gridProps: GridProps = useMemo(() =>
    {
        // return xxx
        return { columns, rows, rawData, CurrentPage: currentPage, TotalPage: totalPages, onPageChange: (page: number) => setCurrentPage(page) };
    }, [columns, rows, rawData, currentPage, totalPages]);

    const refetchCurrent = useCallback(async () => refetch({ mode: "current" }), [refetch]);
    const refetchFirst = useCallback(async () => refetch({ mode: "first" }), [refetch]);

    // return xxx
    return { rawData, gridProps, isLoading, error, refetchCurrent, refetchFirst };
};
// #endregion

// #region Private
/**
 * 根據 Provider 的 getModelDisplayName 回傳欄位定義與 visibleKeys 產生對應欄位設定
 * @param getModelDisplayFn - 傳入像 AnnouncementProvider().getModelDisplayName 的函式
 * @param visibleKeys - 陣列格式: [[TableId, ColumnId], ...]
 * @returns ColumnConfig[]
 */
const BuildVisibleColumns = async (
    getModelDisplayFn: () => Promise<ModelDisplaySchema>,
    visibleKeys: ReadonlyArray<readonly [string, string]>,
): Promise<ColumnConfig[]> =>
{
    // 宣告變數
    if (!visibleKeys || visibleKeys.length === 0) return [];

    const schema = await getModelDisplayFn();
    if (!schema?.Tables?.length) return [];

    const columns = visibleKeys.map(([tableId, columnId]) =>
    {
        const table = schema.Tables.find(t => t.TableId === tableId);
        const col = table?.Columns.find(c => c.ColumnId === columnId);
        if (!col) return null;

        return { key: col.ColumnId, title: col.ColumnDisplayName } as ColumnConfig;
    }).filter((x): x is ColumnConfig => !!x);

    // return xxx
    return columns;
};


const buildStableQueryKey = (cond: QueryListParam) =>
{
    const { Fields, Condition, OrderBy, RankGroups, PageNumber, PageSize } = cond as QueryListParam;
    return JSON.stringify({ Fields, Condition, OrderBy, RankGroups, PageNumber, PageSize });
};
// #endregion
