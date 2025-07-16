import { useEffect, useState } from "react";
import PageManagementProvider from "./PageManagement_Api";
import type { GridProps,GridRow,ColumnConfig,RowCell } from "../../../../../../SysCore/Components/Grid/Grid_ForServer_Data"
import  type { components } from "../../../../../../types/api";

type PageManagementSet = components["schemas"]["PageManagement"]

export const usePageListData = () => {
  const [rows, setRows] = useState<GridRow[]>([]);
  const [columns, setColumns] = useState<ColumnConfig[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(2);
  const [isLoading, setIsLoading] = useState(false);
  
  const fetchData = async (page: number) => {
    setIsLoading(true);
    try {
      //#region GetColumn
      const resCol =await PageManagementProvider().getModelDisplayName();
      const visibleKeys = ["CategoryId",'Title', 'DataStatus', 'ModifyUserId',"ModifyTime"];
      // ✅ 取得 Columns 陣列（假設只取 Tables[0]）
      const columnsRaw = resCol?.Tables?.[0]?.Columns ?? [];
      // ✅ 轉換成 ColumnConfig[]
      const columns: ColumnConfig[] = columnsRaw.filter(col => visibleKeys.includes(col.ColumnId)) // ✅ 只取需要的欄位
        .map(col => ({ key: col.ColumnId, title: col.ColumnDisplayName}));
      columns.push({
        key:"__Adjust__",
        title:"調整"
      });
      console.log(columns);
      setColumns(columns);
      //#endregion
      
      //#region GetRows
      const res = await PageManagementProvider().fetchList();
      console.log(res);
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

    } catch (err) {
      console.error("資料載入失敗", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage]);
  const gridProps: GridProps = {
    columns,
    rows,
    CurrentPage: currentPage,
    TotalPage: totalPages,
  };
  return {
    gridProps,
    isLoading,
  };
};