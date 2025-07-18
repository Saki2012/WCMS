import { useEffect, useState } from "react";
import PageManagementProvider from "./PageManagement_Api";
import CategoryProvider from "../Category/Category_Api";
import type { GridProps,GridRow,ColumnConfig,RowCell } from "../../../../../../SysCore/Components/Grid/Grid_Data"
import  type { components } from "../../../../../../types/api";

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
      const visibleKeys = ["CategoryId",'Title', 'DataStatus', 'ModifyUserId',"ModifyTime"];
      // ✅ 取得 Columns 陣列（假設只取 Tables[0]）
      const columnsRaw = resCol?.Tables?.[0]?.Columns ?? [];
      // ✅ 轉換成 ColumnConfig[]
      const columns: ColumnConfig[] = columnsRaw.filter(col => visibleKeys.includes(col.ColumnId)).map(col => ({ key: col.ColumnId, title: col.ColumnDisplayName}));
      setColumns(columns);
      //#endregion
      
      //#region GetRows
      const res = await PageManagementProvider().fetchList();
      const rawData = (res as any[]).map(x => x.PageManagement ?? {});
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
export const useGetPageFormData = (uid:string) =>{
  const [data, setData] = useState<{}>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchData = async (uid: string) => {
    setIsLoading(true);
    try {
      const data = await PageManagementProvider().fetchData({uid});
      setData(data)
    } catch (err: any) {
      setError(err.message ?? "資料載入失敗");
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => { fetchData(uid) }, [uid]);
  return { data, isLoading, error };
}

/** 保存表單資料 */
export const useCreatePageFormData = () => {
  const [data, setData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createData = async (set: PageManagementSet) => {
    setIsLoading(true);
    try {
      const data = await PageManagementProvider().createData(set);
      setData(data);
    } catch (err: any) {
      setError(err.message ?? "資料載入失敗");
    } finally {
      setIsLoading(false);
    }
  };

  return { createData, data, isLoading, error,  };
};

export const useDeletePageForm = () => {
  const [isSuccess, setResult] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteData = async (uid: string) => {
    setIsLoading(true);
    try {
      await PageManagementProvider().deleteData({ uid });
      setResult(true);
    } catch (err: any) {
      setResult(false);
      setError(err.message ?? "資料載入失敗");
    } finally {
      setIsLoading(false);
    }
  };

  return { deleteData, isSuccess, isLoading, error };
};

