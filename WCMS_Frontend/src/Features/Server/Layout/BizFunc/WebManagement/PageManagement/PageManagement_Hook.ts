import { useEffect, useState } from "react";
import PageManagementProvider from "./PageManagement_Api";
import CategoryProvider from "../Category/Category_Api";
import type { GridProps,GridRow,ColumnConfig,RowCell } from "../../../../../../SysCore/Components/Grid/Grid_Data"
import  type { components } from "../../../../../../types/api";
import { emptyData } from "./PageManagement_Data";

type PageManagementSet = components["schemas"]["PageManagement"]

/** 讀取清單資料 */
export const useFetchPageListData = () => {
  const [rows, setRows] = useState<GridRow[]>([]);
  const [columns, setColumns] = useState<ColumnConfig[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(2);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchData = async (page: number) => {
    setIsLoading(true);
    try {
      //#region GetColumn
      const resCol =await PageManagementProvider().getModelDisplayName();
      const visibleKeys = ["CategoryId", 'Title', 'DataStatus', 'ModifyUserId',"ModifyTime","InternalId"];
      // ✅ 取得 Columns 陣列（假設只取 Tables[0]）
      const columnsRaw = resCol?.Tables?.[0]?.Columns ?? [];
      // ✅ 轉換成 ColumnConfig[]
      const columns: ColumnConfig[] = columnsRaw.filter(col => visibleKeys.includes(col.ColumnId)).map(col => ({ key: col.ColumnId, title: col.ColumnDisplayName}));
      setColumns(columns);
      //#endregion
      
      //#region GetRows
      const res = await PageManagementProvider().fetchList();
      const rawData = (res.Data as any[]).map(x => x.PageManagement ?? {});
      // 轉為 GridRow[]
      const rows: GridRow[] = rawData.map(item => {
        const cells: RowCell[] = columns.map(col => ({
          col,
          content: item[col.key] ?? ''
        }));
        return { cells };
      });
      setRows(rows);
      //#endregion

    } catch (err: any) {
      setError(err.message ?? "資料載入失敗");
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => { fetchData(currentPage) }, [currentPage]);
  const gridProps: GridProps = { columns, rows, CurrentPage: currentPage, TotalPage: totalPages };
  return { gridProps, isLoading, error };
};

/** 讀取表單資料 */
export const useGetPageFormData = (internalId:string) =>{
  const [data, setData] = useState<PageManagementSet>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchData = async (internalId: string) => {
    setIsLoading(true);
    try {
      if(internalId){
        const data = await PageManagementProvider().fetchData({internalId});
        setData(data.Data[0])
      }
      else{
        setData(emptyData)
      }
    } catch (err: any) {
      setError(err.message ?? "資料載入失敗");
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => { fetchData(internalId) }, [internalId]);
  return { data, isLoading, error };
}