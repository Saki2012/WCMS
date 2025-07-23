import { useEffect, useState } from "react";
import CategoryProvider from "./Category_Api";
import type { GridProps,GridRow,ColumnConfig,RowCell } from "../../../../../../SysCore/Components/Grid/Grid_Data"
import  type { components } from "../../../../../../types/api";
import type { QueryListCondition } from "../../../../../../SysCore/Interface/IApiProvider";
type CategoryDetail = components["schemas"]["CategoryDetail"]


/** 獲取類別清單 */
export const useGetCategoryListByProgId = (progId:string, lang:string) => {
  const [data, setData] = useState<Record<string,string>>({});
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async (progId:string,lang:string) => {
      try {
        setLoading(true);
        /**以下功能晚一點修 */
        const queryCondition:QueryListCondition={
          Fields: ["CategoryId","CategoryDetail.CategoryId","CategoryDetail.RowId","CategoryDetail.Lang","CategoryDetail.Title"],
          Condition: `ProgId = \"${progId}\" And CategoryDetail.Lang = \"zh-TW\"`,
          PageNumber: 0,
          PageSize: 0,
        }
        const res = await CategoryProvider().fetchList(queryCondition);

        const result: Record<string, string> = res.data.Data?.reduce((acc, p) => {
          const matchedDetail = (p.CategoryDetail).find((detail: CategoryDetail) => detail.Lang === lang);
          acc[p.Category.CategoryId] = matchedDetail?.CategoryName ?? '';
          return acc; }, {} as Record<string, string>);

        setData(result); // or transform

      } catch (err: any) {
        setError(err.message ?? "資料錯誤");
      } finally {
        setLoading(false);
      }
    };
    fetch(progId, lang);
  }, [progId, lang]);

  return { data, isLoading, error };
};