import { useEffect, useState } from "react";
import CategoryProvider from "./Category_Api";
import type { GridProps,GridRow,ColumnConfig,RowCell } from "../../../../../../SysCore/Components/Grid/Grid_Data"
import  type { components } from "../../../../../../types/api";
import { record } from "zod";

type CategoryDetail = components["schemas"]["CategoryDetail"]


/** 獲取類別清單 */
export const useGetCategoryListByProgId = (progId:string, lang:string) => {
  const [data, setData] = useState<Record<string,string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);

        /**以下功能晚一點修 */

        // const res = await CategoryProvider().fetchList(progId);
        // console.log("res為:");
        // console.log(res);

        // const result: Record<string, string> = res.reduce((acc, p) => {
        //   const matchedDetail = (p.CategoryDetail).find((detail: CategoryDetail) => detail.Lang === lang);
        //   acc[p.Category.CategoryId] = matchedDetail?.CategoryName ?? '';
        //   return acc; }, {} as Record<string, string>);
        // setData(result); // or transform


      } catch (err: any) {
        setError(err.message ?? "資料錯誤");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [progId, lang]);

  return { data, loading, error };
};