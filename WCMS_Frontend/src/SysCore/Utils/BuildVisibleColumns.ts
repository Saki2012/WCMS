// utils/SchemaHelper.ts

import type { ApiResponse } from '../Interface/IApiProvider';
import type { ColumnConfig } from '../Components/Grid/Grid_Data';
import type { ModelDisplaySchema } from '../../types/IApiSchema';

/**
 * 根據 Provider 的 getModelDisplayName 回傳欄位定義與 visibleKeys 產生對應欄位設定
 * @param getModelDisplayFn - 傳入像 AnnouncementProvider().getModelDisplayName 的函式（要 return Promise<ApiResponse<ModelDisplaySchema>>）
 * @param visibleKeys - 陣列格式: [[TableId, ColumnId], ...]
 * @returns ColumnConfig[]
 */
export const BuildVisibleColumns = async (getModelDisplayFn: () => Promise<ApiResponse<ModelDisplaySchema>>,visibleKeys: [string, string][]): Promise<ColumnConfig[]> => {
  const resCol = await getModelDisplayFn();
  if (!resCol?.Tables) return [];
  const columns: ColumnConfig[] = visibleKeys
    .map(([tableId, columnId]) => {
      const table = resCol.Tables.find(t => t.TableId === tableId);
      const column = table?.Columns.find(col => col.ColumnId === columnId);
      if (!column) return null;
      return {
        key: column.ColumnId,
        title: column.ColumnDisplayName,
      };
    })
    .filter(Boolean) as ColumnConfig[];

  return columns;
}