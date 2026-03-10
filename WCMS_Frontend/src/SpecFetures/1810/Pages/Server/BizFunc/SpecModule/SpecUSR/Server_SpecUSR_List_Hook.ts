import { useCallback, useMemo } from "react";
import type { AxiosInstance } from "axios";

import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import { TagAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Tag_Api";

import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiAdapterError } from "@/SysCore/Utils/API/APIAdapter";
import { ApiDataAdapter } from "@/SysCore/Utils/API/APIAdapter";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";

import type { UseFetchDataResult } from "@/SysCore/Utils/API/FetchDataType";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import {
  AccountFields,
  PGID,
  SpecCategoryDetailModelFields,
  SpecCategoryModelFields,
  SpecUSRDetailFields,
  SpecUSRModelFields,
} from "@/types/SchemaFields";

type QueryListParam = components["schemas"]["QueryListParam"];
type SpecUSRSet = components["schemas"]["SpecUSRSet_DTO"];
type SpecCategorySet = components["schemas"]["SpecCategorySet_DTO"];
type TagSet = components["schemas"]["TagSet_DTO"];

//#region Public Types
export type SpecUSRListRawData = {
  modelDisplayName: ModelDisplaySchema | null;
  count: number;
  list: SpecUSRSet[];
  pageNumber: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  param: QueryListParam;

  categoryData: SpecCategorySet[];
  categoryMap: Record<string, string>;

  tagData: TagSet[];
  tagMap: Record<string, string>;
};

export type SpecUSRListAdapter = {
  SpecUSR: ReturnType<typeof createSpecUSRAdapter>;
  SpecCategory: ReturnType<typeof createSpecCategoryAdapter>;
  Tag: ReturnType<typeof TagAdapter>;
};
//#endregion

//#region Public Hook
/** ✅ 主入口：Server SpecUSR List 的所有 fetch 都集中在這裡（對標 AnnouncementListFetchData） */
export const useSpecUSRListFetchData = (opt: {
  lang: Lang;
  kw: string;
}): UseFetchDataResult<SpecUSRListRawData, SpecUSRListAdapter> => {
  // 宣告變數
  const { publish } = useToast();

  const onError = useCallback(
    (e: ApiAdapterError) => {
      // 顯示錯誤 toast
      publish({ level: MessageStatus.Error, title: e.messageText });
    },
    [publish],
  );

  const adapter = useMemo<SpecUSRListAdapter>(() => {
    // 建立 adapter group
    return {
      SpecUSR: createSpecUSRAdapter(),
      SpecCategory: createSpecCategoryAdapter(),
      Tag: TagAdapter(),
    };
  }, []);

  // 執行 function：Query param（穩定 reference，避免 deps 無限觸發）
  const baseParam = useSpecUSRListQueryParam({ lang: opt.lang, kw: opt.kw });

  // 執行 function：主資料（Grid）
  const grid = adapter.SpecUSR.hooks.useQueryGridData({
    baseParam,
    deps: [baseParam.Condition ?? "", baseParam.PageSize ?? 0],
    modelDeps: [opt.lang],
    onError,
  });

  // 執行 function：關聯資料（Category / Tag）
  const category = useSpecCategoryMapByProgId(adapter.SpecCategory, {
    progId: PGID.SpecUSR,
    lang: opt.lang,
  });

  const tag = adapter.Tag.hooks.useMapByProgId({
    progId: PGID.SpecUSR,
    lang: opt.lang,
  });

  // 宣告變數：loading / errors 統一出口
  const isLoading = Boolean(grid.isLoading || category.isLoading || tag.isLoading);

  const errors = useMemo(() => {
    const list = [...(grid.errors ?? []), category.errorText, tag.errorText];
    return list.filter((x): x is string => Boolean(x));
  }, [grid.errors, category.errorText, tag.errorText]);

  // 宣告變數：rawData（給 Comp 用）
  const rawData = useMemo<SpecUSRListRawData>(() => {
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
  }, [
    grid.modelDisplayName,
    grid.count,
    grid.list,
    grid.pageNumber,
    grid.totalPages,
    grid.onPageChange,
    grid.param,
    category.data,
    category.map,
    tag.data,
    tag.map,
  ]);

  const refetchData = useCallback(async () => {
    // 只重抓主資料
    await grid.refetchData();
  }, [grid]);

  const refetchRefData = useCallback(async () => {
    // 重抓參照資料
    await Promise.all([category.refetch(), tag.refetch()]);
  }, [category, tag]);

  // return
  return { adapter, rawData, isLoading, errors, refetchData, refetchRefData };
};
//#endregion

//#region Private - SpecUSR Adapter
class SpecUSRService extends ApiDataService<SpecUSRSet> {
  constructor(apiInstance?: AxiosInstance) {
    super(PGID.SpecUSR, apiInstance);
  }
}

const createSpecUSRAdapter = (apiInstance?: AxiosInstance) => {
  // 建立 adapter（不依賴外部 provider）
  return new ApiDataAdapter<SpecUSRSet, SpecUSRService>(
    (api?: AxiosInstance) => new SpecUSRService(api ?? apiInstance),
  );
};
//#endregion

//#region Private - SpecCategory Adapter + Map
class SpecCategoryService extends ApiDataService<SpecCategorySet> {
  constructor(apiInstance?: AxiosInstance) {
    super(PGID.SpecCategory, apiInstance);
  }
}

const createSpecCategoryAdapter = (apiInstance?: AxiosInstance) => {
  // 建立 adapter
  return new ApiDataAdapter<SpecCategorySet, SpecCategoryService>(
    (api?: AxiosInstance) => new SpecCategoryService(api ?? apiInstance),
  );
};

const escapeQueryString = (value: string): string => {
  // 避免 Condition 字串被破壞
  return value.replace(/"/g, `""`);
};

const buildSpecCategoryQueryByProgIdParam = (opt: {
  progId: string;
  lang: Lang;
}): QueryListParam => {
  // 宣告變數
  const progId = escapeQueryString(opt.progId);
  const lang = escapeQueryString(opt.lang);

  // return
  return {
    Fields: [
      SpecCategoryModelFields.CategoryId,
      `${SpecCategoryModelFields._SpecCategoryDetail}.${SpecCategoryDetailModelFields.Lang}`,
      `${SpecCategoryModelFields._SpecCategoryDetail}.${SpecCategoryDetailModelFields.CategoryName}`,
    ],
    Condition:
      `${SpecCategoryModelFields.ProgId} = "${progId}"` +
      ` And ${SpecCategoryModelFields._SpecCategoryDetail}.${SpecCategoryDetailModelFields.Lang} = "${lang}"`,
    OrderBy: [{ Col: SpecCategoryModelFields.ModifyTime, Desc: true }],
    PageNumber: 0,
    PageSize: 0,
  };
};

const useSpecCategoryMapByProgId = (
  adapter: ReturnType<typeof createSpecCategoryAdapter>,
  opt: { progId: string; lang: Lang },
): {
  isLoading: boolean;
  errorText: string | null;
  refetch: () => Promise<void>;
  data: SpecCategorySet[] | null;
  map: Record<string, string> | null;
} => {
  // 執行 function：抓 category list（同 progId + lang）
  const query = adapter.hooks.useQueryList({
    condition: buildSpecCategoryQueryByProgIdParam({ progId: opt.progId, lang: opt.lang }),
    deps: [opt.progId, opt.lang],
  });

  // 宣告變數：CategoryId -> CategoryName
  const map = useMemo<Record<string, string>>(() => {
    const rows = query.data ?? [];
    return rows.reduce((acc, set) => {
      const id = set.SpecCategory?.CategoryId;
      if (!id) return acc;

      const name =
        (set.SpecCategoryDetail ?? []).find((d) => d.Lang === opt.lang)?.CategoryName ?? "";
      acc[String(id)] = name;
      return acc;
    }, {} as Record<string, string>);
  }, [query.data, opt.lang]);

  const refetch = useCallback(async () => {
    await Promise.resolve(query.refetch());
  }, [query]);

  // return
  return {
    isLoading: Boolean(query.isLoading),
    errorText: query.errorText ?? null,
    refetch,
    data: query.data ?? null,
    map,
  };
};
//#endregion

//#region Private - QueryParam
const useSpecUSRListQueryParam = (p: { lang: Lang; kw: string }): QueryListParam => {
  // 宣告變數：Fields
  const fields = useMemo<string[]>(() => {
    return [
      SpecUSRModelFields.CategoryId,
      SpecUSRModelFields.Tags,
      SpecUSRModelFields.ContentStatus,

      `${SpecUSRModelFields._SpecUSRDetail}.${SpecUSRDetailFields.RowId}`,
      `${SpecUSRModelFields._SpecUSRDetail}.${SpecUSRDetailFields.Lang}`,
      `${SpecUSRModelFields._SpecUSRDetail}.${SpecUSRDetailFields.Year}`,
      `${SpecUSRModelFields._SpecUSRDetail}.${SpecUSRDetailFields.AcademicYear}`,
      `${SpecUSRModelFields._SpecUSRDetail}.${SpecUSRDetailFields.ProjectName}`,
      `${SpecUSRModelFields._SpecUSRDetail}.${SpecUSRDetailFields.ProjectConcept}`,

      SpecUSRModelFields.CreateTime,
      SpecUSRModelFields.ModifyUserId,
      `${SpecUSRModelFields.ModifyUser}.${AccountFields.AccountName}`,
      SpecUSRModelFields.ModifyTime,
      SpecUSRModelFields.InternalId,
    ];
  }, []);

  // 執行 function：Condition（維持你舊版邏輯：數字→Year/AcademicYear；文字→ProjectName/Concept Like）
  const condition = useMemo(() => {
    let cdt = `${SpecUSRModelFields._SpecUSRDetail}.${SpecUSRDetailFields.Lang} = ${p.lang}`;

    const q = (p.kw ?? "").trim();
    if (!q) return cdt;

    let queryCdt = "";

    if (/^\d+$/.test(q)) {
      queryCdt = LibMerge(
        " Or ",
        false,
        queryCdt,
        `${SpecUSRModelFields._SpecUSRDetail}.${SpecUSRDetailFields.Year} = ${q}`,
      );
      queryCdt = LibMerge(
        " Or ",
        false,
        queryCdt,
        `${SpecUSRModelFields._SpecUSRDetail}.${SpecUSRDetailFields.AcademicYear} = ${q}`,
      );
    }

    queryCdt = LibMerge(
      " Or ",
      false,
      queryCdt,
      `${SpecUSRModelFields._SpecUSRDetail}.${SpecUSRDetailFields.ProjectName} Like ${q}`,
    );
    queryCdt = LibMerge(
      " Or ",
      false,
      queryCdt,
      `${SpecUSRModelFields._SpecUSRDetail}.${SpecUSRDetailFields.ProjectConcept} Like ${q}`,
    );

    return LibMerge(" And ", false, cdt, `(${queryCdt})`);
  }, [p.lang, p.kw]);

  // return
  return useMemo(() => {
    return {
      Fields: fields,
      Condition: condition,
      RankGroups: [{ Condition: `${SpecUSRModelFields.ContentStatus} & 1` }],
      OrderBy: [{ Col: SpecUSRModelFields.CreateTime, Desc: true }],
      PageNumber: 1,
      PageSize: 10,
    };
  }, [fields, condition]);
};
//#endregion