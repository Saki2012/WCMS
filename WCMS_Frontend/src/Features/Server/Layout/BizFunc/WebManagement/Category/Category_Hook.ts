import { useEffect, useState } from "react";
import CategoryProvider from "./Category_Api";
import  type { components } from "../../../../../../types/api";
import type { QueryListCondition } from "../../../../../../SysCore/Interface/IApiProvider";
type CategoryDataSet = components["schemas"]["CategoryDataSet"]
type CategoryDetail = components["schemas"]["CategoryDetail"]
import * as SchemaFields from "../../../../../../types/SchemaFields";

/** 獲取類別清單 */
export const useGetCategoryListByProgId = (progId:string, lang:string, pageSize:number=0) => {
  const [data, setData] = useState<Record<string,string>>({});
  const [srcData, setsrcData] = useState<CategoryDataSet[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const fetch = async (progId:string,lang:string,page:number) => {
    try {
      setLoading(true);
      setError(null);
      const queryCondition:QueryListCondition={
        Fields: [SchemaFields.CategoryFields.CategoryId,
                `${SchemaFields.CategoryDataSetFields.CategoryDetail}.${SchemaFields.CategoryDetailFields.Lang}`,
                `${SchemaFields.CategoryDataSetFields.CategoryDetail}.${SchemaFields.CategoryDetailFields.CategoryName}`
              ],
        Condition: `${SchemaFields.CategoryFields.ProgId} = \"${progId}\" And ${SchemaFields.CategoryDataSetFields.CategoryDetail}.${SchemaFields.CategoryDetailFields.Lang} = \"zh-TW\"`,
        PageNumber: page,
        PageSize: pageSize,
      }
      const res = await CategoryProvider().fetchList(queryCondition);
      if (!res.IsSuccess) {
        const errorMsg = res.SysMessage?.map(msg =>`${msg.MessageCode}:${msg.Message}`).join(';') ?? "資料查詢失敗";
        throw new Error(errorMsg);
      }
      const result: Record<string, string> =
        (res.Data as CategoryDataSet[] ?? []).reduce((acc, p) => {
          const categoryId = p.Category?.CategoryId;
          if (!categoryId) return acc;
          const matchedDetail = p.Category?.CategoryDetail?.find((detail: CategoryDetail) => detail.Lang === lang);
          acc[categoryId] = matchedDetail?.CategoryName ?? '';
          return acc;
        }, {} as Record<string, string>);
      setData(result);

    } catch (err: any) {
      setError(err.message ?? "資料錯誤");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetch(progId, lang,currentPage) }, [currentPage, progId, lang]);

  return { data, isLoading, error };
};



