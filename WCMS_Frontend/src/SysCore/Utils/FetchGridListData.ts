import { useState, useEffect, useMemo } from "react";
import type { QueryListCondition } from "../Interface/IApiProvider";
import type { ApiResponse } from "../Interface/IApiProvider";
import type { GridProps,GridRow,ColumnConfig } from "../Components/Grid/Grid_Data";
import { BuildVisibleColumns } from "./BuildVisibleColumns";


interface UseGridListOptions<T> {
  /** 取得 model display 名稱 */
  getModelDisplayName: () => Promise<Record<string, string>>;
  /** 取得資料筆數 */
  fetchListCount: (condition: QueryListCondition) => Promise<ApiResponse<number[]>>;
  /** 取得清單資料 */
  fetchList: (condition: QueryListCondition) => Promise<ApiResponse<T[]>>;
  /** 欄位對應關係 */
  visibleKeys: [string, string][];
  /** 查詢條件 */
  buildQueryCondition: (page: number) => QueryListCondition;
  /** 如何解析 row 資料 */
  parseRow: (item: T, columns: ColumnConfig[]) => GridRow;
}

export const useFetchGridListData = <T>(
  options: UseGridListOptions<T>
) => {
  const [rawData, setRawData] = useState<T[]>([]);
  const [rows, setRows] = useState<GridRow[]>([]);
  const [columns, setColumns] = useState<ColumnConfig[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (page: number) => {
    setIsLoading(true);
    setError(null);
    try {
      // 取得欄位名稱與顯示設定
      const cols = await BuildVisibleColumns(options.getModelDisplayName, options.visibleKeys);
      setColumns(cols);

      const condition = options.buildQueryCondition(page);
      const countRes = await options.fetchListCount(condition);
      if (!countRes.IsSuccess) {
        const msg = countRes.SysMessage?.map(x => `${x.MessageCode}:${x.Message}`).join(";") ?? "查詢筆數失敗";
        throw new Error(msg);
      }
      const total = Math.ceil((countRes.Data?.[0] ?? 0) / condition.PageSize);
      setTotalPages(total);

      const listRes = await options.fetchList(condition);
      if (!listRes.IsSuccess) {
        const msg = listRes.SysMessage?.map(x => `${x.MessageCode}:${x.Message}`).join(";") ?? "資料查詢失敗";
        throw new Error(msg);
      }

      const fullData = listRes.Data ?? [];
      setRawData(fullData);
      const parsedRows = fullData.map(item => options.parseRow(item, cols));
      setRows(parsedRows);
    } catch (err: any) {
      setError(err.message ?? "資料載入失敗");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage]);

  const gridProps: GridProps = useMemo(() => ({
    columns,
    rows,
    CurrentPage: currentPage,
    TotalPage: totalPages,
    onPageChange: (page: number) => setCurrentPage(page),
  }), [columns, rows, currentPage, totalPages]);

  return { rawData, gridProps, isLoading, error };
};