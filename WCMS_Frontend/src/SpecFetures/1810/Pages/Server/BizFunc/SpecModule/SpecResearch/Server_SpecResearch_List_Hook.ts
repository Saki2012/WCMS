import { TagAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Tag_Api";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiAdapterError } from "@/SysCore/Utils/API/APIAdapter";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import type { UseFetchDataResult } from "@/SysCore/Utils/API/FetchDataType";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
import {AccountFields, PGID,SpecResearchDetailModelFields, SpecResearchModelFields, } from "@/types/SchemaFields";
import { useCallback, useMemo } from "react";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { SpecResearchAdapter } from "@/SpecFetures/1810/Hooks/SpecResearch/SpecResearch_Api";
import { SpecCategoryAdapter } from "@/SpecFetures/1810/Hooks/SpecCategory/SpecCategory_Api";
type QueryListParam = components["schemas"]["QueryListParam"];
type SpecResearchSet = components["schemas"]["SpecResearchSet_DTO"];
type SpecCategorySet = components["schemas"]["SpecCategorySet_DTO"];
type TagSet = components["schemas"]["TagSet_DTO"];

//#region Public
type SpecResearchListRawData = {
  modelDisplayName: ModelDisplaySchema | null;
  count: number;
  list: SpecResearchSet[];
  pageNumber: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  param: QueryListParam;
  categoryData: SpecCategorySet[];
  categoryMap: Record<string, string>;
  tagData: TagSet[];
  tagMap: Record<string, string>;
};

type SpecResearchListAdapter = {
  SpecResearch: ReturnType<typeof SpecResearchAdapter>;
  SpecCategory: ReturnType<typeof SpecCategoryAdapter>;
  Tag: ReturnType<typeof TagAdapter>;
};

/** ✅ 主入口：Server SpecResearch List 的所有 fetch 都集中在這裡 */
export const useSpecResearchListFetchData = (opt: {lang: Lang; kw: string;}): UseFetchDataResult<SpecResearchListRawData, SpecResearchListAdapter> => {
  const { publish } = useToast();
  // 宣告變數：統一錯誤出口（toast）
  const onError = useCallback(
    (e: ApiAdapterError) => {
      publish({ level: MessageStatus.Error, title: e.messageText });
    },
    [publish],
  );

  // 宣告變數：Adapters（固定 reference）
  const adapter = useMemo(() => { return { SpecResearch: SpecResearchAdapter(), SpecCategory: SpecCategoryAdapter(), Tag: TagAdapter(), };}, []);
  // 執行 function：Query param（穩定 reference）
  const baseParam = useSpecResearchListQueryParam({ lang: opt.lang, kw: opt.kw });
  // 執行 function：主資料（Grid）
  const grid = adapter.SpecResearch.hooks.useQueryGridData({baseParam,deps: [baseParam.Condition ?? "", baseParam.PageSize ?? 0],modelDeps: [opt.lang],onError,});
  // 執行 function：關聯資料（Category / Tag）
  const category = adapter.SpecCategory.hooks.useMapByProgId({progId: PGID.SpecResearch,lang: opt.lang,});
  const tag = adapter.Tag.hooks.useMapByProgId({progId: PGID.SpecResearch,lang: opt.lang,});
  // 宣告變數：loading / errors 聚合
  const isLoading = Boolean(grid.isLoading || category.isLoading || tag.isLoading);
  const errors = useMemo(() => {
    const list = [...(grid.errors ?? []), category.errorText, tag.errorText];
    return list.filter((x): x is string => Boolean(x));
  }, [grid.errors, category.errorText, tag.errorText]);
  // 宣告變數：rawData 統一出口
  const rawData = useMemo<SpecResearchListRawData>(() => {
    return {
      modelDisplayName: grid.modelDisplayName,
      count: grid.count ?? 0,
      list: grid.list ?? [],
      pageNumber: grid.pageNumber ?? 1,
      totalPages: grid.totalPages ?? 1,
      onPageChange: grid.onPageChange,
      param: grid.param,
      categoryData: category.data ?? [],
      categoryMap: category.map ?? {},
      tagData: tag.data ?? [],
      tagMap: tag.map ?? {},
    };
  }, [grid.modelDisplayName,grid.count,grid.list,grid.pageNumber,grid.totalPages,grid.onPageChange,
    grid.param,category.data,category.map,tag.data,tag.map,]
  );
  // 執行 function：refetch（主資料 / 參考資料）
  const refetchData = useCallback(async () => { await grid.refetchData(); }, [grid]);
  const refetchRefData = useCallback(async () => { await Promise.all([category.refetch(), tag.refetch()]); }, [category, tag]);
  return { adapter, rawData, isLoading, errors, refetchData, refetchRefData };
};
//#endregion

//#region Private - Query Param
const useSpecResearchListQueryParam = (p: { lang: Lang; kw: string }): QueryListParam => {
  // 宣告變數：Fields（固定）
  const fields = useMemo<string[]>(() => {
    return [
      SpecResearchModelFields.ResearchId, SpecResearchModelFields.InternalId, SpecResearchModelFields.CategoryId,
      SpecResearchModelFields.Tags, SpecResearchModelFields.ContentStatus,
      `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.Lang}`,
      `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.Year}`,
      `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.AcademicYear}`,
      `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.Semester}`,
      `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.ProjectName}`,
      `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.PaperTitle}`,
      `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.CooperationProject}`,
      `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.Courses}`,
      SpecResearchModelFields.CreateTime, SpecResearchModelFields.ModifyUserId,
      `${SpecResearchModelFields.ModifyUser}.${AccountFields.AccountName}`,
      SpecResearchModelFields.ModifyTime,
    ];
  }, []);

  // 執行 function：Condition（會跟 lang/kw 變動）
  const condition = useMemo(() => {
    let cdt = `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.Lang} = ${p.lang}`;
    const q = (p.kw ?? "").trim();
    if (!q) return cdt;
    let queryCdt = "";
    if (/^\d+$/.test(q)) {
      queryCdt = LibMerge(" Or ", false, queryCdt, 
        `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.Year} = ${q}`,
        `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.AcademicYear} = ${q}`
      );
    }
    queryCdt = LibMerge(" Or ", false, queryCdt, 
      `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.ProjectName} Like ${q}`,
      `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.PaperTitle} Like ${q}`,
      `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.CooperationProject} Like ${q}`,
      `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.Courses} Like ${q}`,
    );
    cdt = LibMerge(" And ", false, cdt, `(${queryCdt})`);
    return cdt;
  }, [p.lang, p.kw]);

  return useMemo(() => {
    return {Fields: fields, Condition: condition, RankGroups: [{ Condition: `${SpecResearchModelFields.ContentStatus} & 1` }], 
      OrderBy: [{ Col: SpecResearchModelFields.CreateTime, Desc: true }], PageNumber: 1, PageSize: 10,
    };
  }, [fields, condition]);
};
//#endregion
