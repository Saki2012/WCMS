import { useEffect, useState } from "react";
import PageManagementProvider from "./PageManagement_Api";
import type { GridProps,GridRow,ColumnConfig,RowCell } from "../../../../../../SysCore/Components/Grid/Grid_Data"
import  type { components } from "../../../../../../types/api";
import { emptyData } from "./PageManagement_Data";
import type { QueryListCondition } from "../../../../../../SysCore/Interface/IApiProvider";
import * as SchemaFields from "../../../../../../types/SchemaFields";
type PageManagementSet = components["schemas"]["PageManagementSet"]
/** 讀取清單資料 */
export const useFetchPageListData = () => {
  const [rawData, setRawData] = useState<PageManagementSet[]>([])
  const [rows, setRows] = useState<GridRow[]>([]);
  const [columns, setColumns] = useState<ColumnConfig[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(2);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (page: number) => {
    setIsLoading(true);
    setError(null);
    try {
      //#region GetColumn
      const resCol =await PageManagementProvider().getModelDisplayName();
      const visibleKeys = [SchemaFields.PageManagementFields.CategoryId,
                            SchemaFields.PageManagementDetailFields.Title,
                            SchemaFields.PageManagementFields.ModifyUserId,
                            SchemaFields.PageManagementFields.ModifyTime,];
      // ✅ 取得 Columns 陣列（假設只取 Tables[0]）
      const columnsRaw = resCol?.Tables?.[0]?.Columns ?? [];
      // ✅ 轉換成 ColumnConfig[]
      const columns: ColumnConfig[] = columnsRaw.filter(col => visibleKeys.includes(col.ColumnId)).map(col => ({ key: col.ColumnId, title: col.ColumnDisplayName}));
      setColumns(columns);
      //#endregion
      
      //#region GetRows
      const queryCondition:QueryListCondition={
          Fields: [SchemaFields.PageManagementFields.CategoryId,
                  //缺Name
                  `${SchemaFields.PageManagementSetFields.PageManagementDetail}.${SchemaFields.PageManagementDetailFields.Lang}`,
                  `${SchemaFields.PageManagementSetFields.PageManagementDetail}.${SchemaFields.PageManagementDetailFields.Title}`,
                  SchemaFields.PageManagementFields.ModifyUserId,
                  //缺Name
                  SchemaFields.PageManagementFields.ModifyTime,
                  SchemaFields.PageManagementFields.InternalId,
            ],
          Condition: ``,
          PageNumber: page,
          PageSize: 10,
        }
      const res = await PageManagementProvider().fetchList(queryCondition);
      if (!res.IsSuccess) {
        const errorMsg = res.SysMessage?.map(msg =>`${msg.MessageCode}:${msg.Message}`).join(';') ?? "資料查詢失敗";
        throw new Error(errorMsg);
      }

      const fullData = res.Data as PageManagementSet[];
      setRawData(fullData);
      const mainTable = fullData.map(x => x.PageManagement ?? {});
      const gridRows: GridRow[] = mainTable.map(item => {
        const cells: RowCell[] = columns.map(col => ({
          col,
          content: (item as any)[col.key] ?? ''
        }));
        return { cells };
      });
      setRows(gridRows);
      //#endregion
    } catch (err: any) {
      setError(err.message ?? "資料載入失敗");
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => { fetchData(currentPage) }, [currentPage]);
  const gridProps: GridProps = { columns, rows, CurrentPage: currentPage, TotalPage: totalPages };
  return { rawData, gridProps, isLoading, error };
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
        const res = await PageManagementProvider().fetchData({internalId});
        if (!res.IsSuccess) {
          const errorMsg = res.SysMessage?.map(msg =>`${msg.MessageCode}:${msg.Message}`).join(';') ?? "資料查詢失敗";
          throw new Error(errorMsg);
        }
        setData(res.Data?.[0])
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

export const handleDelete = async (internalId: string) => {
  if (!internalId) {
    alert("無效的資料");
    return;
  }

  const confirmDelete = window.confirm("確定要刪除嗎？");
  if (!confirmDelete) return;
  try {
    const res = await PageManagementProvider().deleteData(internalId);
    if (res.IsSuccess) {
      alert("刪除成功");
      window.location.reload(); // 或觸發重新 fetchData
    } else {
      alert(res.SysMessage?.map(m => `${m.MessageCode}:${m.Message}`)?.join("\n") ?? "刪除失敗");
    }
  } catch (err) {
    alert(`刪除發生錯誤: ${(err as any)?.message}`);
  }
};