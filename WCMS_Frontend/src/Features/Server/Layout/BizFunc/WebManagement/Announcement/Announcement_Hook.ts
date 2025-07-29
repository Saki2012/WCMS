import { useEffect, useState } from "react";
import AnnouncementProvider from "./Announcement_Api";
import type { GridProps,GridRow,ColumnConfig,RowCell } from "../../../../../../SysCore/Components/Grid/Grid_Data"
import  type { components } from "../../../../../../types/api";
import type { QueryListCondition } from "../../../../../../SysCore/Interface/IApiProvider";
import * as SchemaFields from "../../../../../../types/SchemaFields";
import { BuildVisibleColumns } from "../../../../../../SysCore/Utils/buildVisibleColumns";
type AnnouncementSet = components["schemas"]["AnnouncementSet"]
import { emptyData } from "./Announcement_Data";

/** 讀取清單資料 */
export const useFetchAnnouncementListData = () => {
  const [rawData, setRawData] = useState<AnnouncementSet[]>([])
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
      const visibleKeys: [string, string][] = [
                            [SchemaFields.AnnouncementSetFields.Announcement, SchemaFields.AnnouncementFields.Categories],
                            [SchemaFields.AnnouncementSetFields.AnnouncementDetail, SchemaFields.AnnouncementDetailFields.Title],
                            [SchemaFields.AnnouncementSetFields.Announcement, SchemaFields.AnnouncementFields.DataStatus],
                            [SchemaFields.AnnouncementSetFields.Announcement, SchemaFields.AnnouncementFields.ModifyUserId],
                            [SchemaFields.AnnouncementSetFields.Announcement, SchemaFields.AnnouncementFields.ModifyTime]
                          ]
      // ✅ 轉換成 ColumnConfig[]
      const columns = await BuildVisibleColumns(() => AnnouncementProvider().getModelDisplayName(), visibleKeys);
      setColumns(columns);
      //#endregion
      
      //#region GetRows
      const queryCondition:QueryListCondition={
          Fields: [
                  SchemaFields.AnnouncementFields.AnnouncementId,
                  SchemaFields.AnnouncementFields.Categories,
                  // `Category.CategoryDetail.Lang`,
                  // `Category.CategoryDetail.CategoryName`,
                  //缺Name
                  `${SchemaFields.AnnouncementSetFields.AnnouncementDetail}.${SchemaFields.AnnouncementDetailFields.Lang}`,
                  `${SchemaFields.AnnouncementSetFields.AnnouncementDetail}.${SchemaFields.AnnouncementDetailFields.Title}`,
                  SchemaFields.PageManagementFields.ModifyUserId,
                  //缺Name
                  SchemaFields.PageManagementFields.ModifyTime,
                  SchemaFields.PageManagementFields.InternalId,
            ],
          Condition: ``,
          PageNumber: page,
          PageSize: 10,
        }
      
      const totalCountRes = await AnnouncementProvider().fetchListCount(queryCondition);
      if(!totalCountRes.IsSuccess){
        const errorMsg = totalCountRes.SysMessage?.map(msg =>`${msg.MessageCode}:${msg.Message}`).join(';') ?? "資料查詢失敗";
        throw new Error(errorMsg);
      }
      setTotalPages(totalCountRes.Data?.[0]??1);
      const res = await AnnouncementProvider().fetchList(queryCondition);
      if (!res.IsSuccess) {
        const errorMsg = res.SysMessage?.map(msg =>`${msg.MessageCode}:${msg.Message}`).join(';') ?? "資料查詢失敗";
        throw new Error(errorMsg);
      }
      const fullData = res.Data as AnnouncementSet[];
      setRawData(fullData);
      const mainTable = fullData.map(x => x.Announcement ?? {});
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
  const gridProps: GridProps = { columns, rows, CurrentPage: currentPage, TotalPage: totalPages, onPageChange:(page)=>{setCurrentPage(page);} };
  return { rawData, gridProps, isLoading, error };
};

/** 讀取表單資料 */
export const useGetAnnouncementFormData = (internalId:string) =>{
  const [data, setData] = useState<AnnouncementSet>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchData = async (internalId: string) => {
    setIsLoading(true);
    try {
      if(internalId){
        const res = await AnnouncementProvider().fetchData({internalId});
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
    const res = await AnnouncementProvider().deleteData(internalId);
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