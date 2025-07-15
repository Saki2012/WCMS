import { useEffect, useState } from "react";
import PageManagementProvider from "./PageManagement_Api";
import type { GridProps,GridRow,ColumnConfig } from "../../../../../../SysCore/Components/Grid/Grid_ForServer_Data"

export const usePageListData = () => {
  const [rows, setRows] = useState<GridRow[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const columns:ColumnConfig[]=[
          {
            key:"CategoryId",                                        
            title:"類別代碼",
          },
          // {
          //   key:"Title",                                        
          //   title:"類別代碼",
          // },
          {
            key:"DataStatus",                                        
            title:"狀態",
          },
          {
            key:"ModifyUserId",                                        
            title:"最後修改人",
          },
          {
            key:"ModifyTime",                                        
            title:"最後修改日期",
          },]


  const fetchData = async (page: number) => {
    setIsLoading(true);
    try {
      const res = await PageManagementProvider().fetchList({ page });
      const list = res ?? [];
      
      const columnMap = Object.fromEntries(
        columns.map((col) => [col.key, col])
      );

      const mapped: GridRow[] = list.map((item) => ({
        cells: [
          { col: columnMap['CategoryId'], content: item.PageManagement.CategoryId },
          { col: columnMap['DataStatus'], content: item.PageManagement.DataStatus },
          { col: columnMap['ModifyUserId'], content: item.PageManagement.ModifyUserId },
          { col: columnMap['ModifyTime'], content: item.PageManagement.ModifyTime },
        ],
      }));
      setRows(mapped);


      // setCurrentPage(res?.currentPage ?? 1);   // ✅ 更新 currentPage
      // setTotalPages(res?.totalPages ?? 1);     // ✅ 更新 totalPages

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