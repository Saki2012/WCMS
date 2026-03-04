import { useCallback, useEffect, useMemo, useState } from "react";
import type { AxiosInstance } from "axios";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import { TagAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Tags/Tag_Api";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiAdapterError, ApiLoaderData, ServerFormActions } from "@/SysCore/Utils/API/APIAdapter";
import { ApiDataAdapter } from "@/SysCore/Utils/API/APIAdapter";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import { useFetchEnumOptions } from "@/SysCore/Utils/API/SystemAPI_Hook";
import type { UseFetchDataResult } from "@/SysCore/Utils/API/FetchDataType";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { PGID, SpecCategoryDetailModelFields, SpecCategoryModelFields } from "@/types/SchemaFields";

type SpecUSRSet = components["schemas"]["SpecUSRSet_DTO"];
type SpecCategorySet = components["schemas"]["SpecCategorySet_DTO"];
type SpecCategoryDetail = components["schemas"]["SpecCategoryDetailModel_DTO"];
type QueryListParam = components["schemas"]["QueryListParam"];

//#region Public Types
export type SpecUSRFormRawData = {
  formData: UseFetchFormDataResult<SpecUSRSet>;
  categoryMap: Record<string, string>;
  categoryCols: Record<string, string[]>;
  tagMap: Record<string, string>;
  statusOpts: Record<string, string>;
  actions: ServerFormActions;
};

export type SpecUSRFormActionsOpt = {
  /** 儲存成功後要回到列表（或其他導頁） */
  onBackToList: () => void;
};

export type SpecUSRFormAdapter = {
  SpecUSR: ReturnType<typeof createSpecUSRAdapter>;
  SpecCategory: ReturnType<typeof createSpecCategoryAdapter>;
  Tag: ReturnType<typeof TagAdapter>;
};
//#endregion

//#region Public Hook
/** ✅ 主入口：Server SpecUSR Form 的所有「讀取資料」集中在這裡（對標 AnnouncementFormFetchData） */
export const useSpecUSRFormFetchData = (opt: {lang: Lang; internalId: string; emptyData: SpecUSRSet; actionsOpt: SpecUSRFormActionsOpt;}): UseFetchDataResult<SpecUSRFormRawData, SpecUSRFormAdapter> => 
{
  const { publish } = useToast();
  const onError = useCallback(
    (e: ApiAdapterError) => {
      // 顯示錯誤 toast（對標 Announcement）
      publish({ level: MessageStatus.Error, title: e.messageText });
    },
    [publish],
  );

  const adapter = useMemo<SpecUSRFormAdapter>(() => {
    // 建立 adapter group（對標 Announcement/SpecResearch）
    return {
      SpecUSR: createSpecUSRAdapter(),
      SpecCategory: createSpecCategoryAdapter(),
      Tag: TagAdapter(),
    };
  }, []);

  // 執行 function：主資料（ModelDisplayName + QueryData + editable state）
  const formData = useSpecUSRFormDataByAdapter(adapter.SpecUSR, opt.internalId, opt.emptyData, onError);
  const actions = useSpecUSRFormActionsByAdapter(adapter.SpecUSR, opt.internalId, formData.data, opt.actionsOpt);

  // 執行 function：關聯資料（Category / Tag / ContentStatus）
  const category = useSpecCategoryMapAndCols(adapter.SpecCategory, { progId: PGID.SpecUSR, lang: opt.lang });
  const tag = adapter.Tag.hooks.useMapByProgId({ progId: PGID.SpecUSR, lang: opt.lang });
  const statusOpts = useContentStatusOptions();

  // 宣告變數：Loading / Error（給 LoadingErrorHandler）
  const loadingList = useMemo<boolean[]>(() => {
    return [Boolean(formData.isLoading), Boolean(category.isLoading), Boolean(tag.isLoading), Boolean(statusOpts.isLoading)];
  }, [formData.isLoading, category.isLoading, tag.isLoading, statusOpts.isLoading]);

  const errorList = useMemo<(string | null | undefined)[]>(() => {
    return [formData.error, category.errorText, tag.errorText, statusOpts.error];
  }, [formData.error, category.errorText, tag.errorText, statusOpts.error]);

  // 宣告變數：統一出口
  const isLoading = useMemo(() => loadingList.some(Boolean), [loadingList]);
  const errors = useMemo(() => errorList.filter((x): x is string => Boolean(x)), [errorList]);

  const rawData = useMemo<SpecUSRFormRawData>(() => {
    return {
      formData,
      categoryMap: category.map ?? {},
      categoryCols: category.cols ?? {},
      tagMap: tag.map ?? {},
      statusOpts: statusOpts.data,
      actions,
    };
  }, [formData, category.map, category.cols, tag.map, statusOpts.data, actions]);

  const refetchData = useCallback(async () => {
    // 只重抓主資料
    await Promise.resolve(formData.refetch());
  }, [formData]);

  const refetchRefData = useCallback(async () => {
    // 重抓參照資料
    await Promise.all([category.refetch(), tag.refetch()]);
  }, [category, tag]);

  // return
  return { adapter, rawData, isLoading, errors, refetchData, refetchRefData };
};
//#endregion

//#region Private - Common
/** ✅ ContentStatus enum options（去掉 key=0） */
const useContentStatusOptions = (): { data: Record<string, string>; isLoading: boolean; error: string | null } => {
  // 宣告變數
  const src = useFetchEnumOptions("ContentStatus");

  // return
  return useMemo(() => {
    const raw = src.data ?? {};
    const { ["0"]: _drop, ...rest } = raw;
    return { data: rest as Record<string, string>, isLoading: Boolean(src.isLoading), error: src.error };
  }, [src.data, src.isLoading, src.error]);
};

const emptyDisplaySchema: ModelDisplaySchema = {
  ModelId: "",
  ModelDisplayName: "",
  Tables: [],
};
//#endregion

//#region Private - SpecUSR (FormData / Actions)
class SpecUSRService extends ApiDataService<SpecUSRSet> {
  constructor(apiInstance?: AxiosInstance) {
    super(PGID.SpecUSR, apiInstance);
  }
}

const createSpecUSRAdapter = (apiInstance?: AxiosInstance) => {
  // 建立 adapter（與現有寫法一致，只是移到 hook 檔）
  const adapter = new ApiDataAdapter<SpecUSRSet, SpecUSRService>((api?: AxiosInstance) => new SpecUSRService(api ?? apiInstance));
  return adapter;
};

/** ✅ FormData：QueryData + ModelDisplayName（含 editable state） */
const useSpecUSRFormDataByAdapter = (
  adapter: ReturnType<typeof createSpecUSRAdapter>,
  internalId: string,
  empty: SpecUSRSet,
  onError: (e: ApiAdapterError) => void,
): UseFetchFormDataResult<SpecUSRSet> => {
  // 宣告變數
  const internalKey = internalId || "__new__";
  const isNew = useMemo(() => !internalId, [internalId]);

  const initial = useMemo<ApiLoaderData<string, SpecUSRSet> | null>(() => {
    // 新建才提供 initial，避免 query "__new__"
    if (!isNew) return null;

    const apiRes: ApiResponse<SpecUSRSet> = { IsSuccess: true, Data: empty, SysMessage: [] };
    return { args: internalKey, apiRes };
  }, [isNew, empty, internalKey]);

  // 執行 function
  const model = adapter.hooks.useModelDisplayName({ deps: [], onError });
  const query = adapter.hooks.useQueryData({ internalId: internalKey, initial, deps: [internalKey], onError });

  const [data, setData] = useState<SpecUSRSet>(empty);

  useEffect(() => {
    // QueryData 回來後同步到可編輯 state
    if (query.data) setData(query.data);
    else if (isNew) setData(empty);
  }, [query.data, isNew, empty]);

  const refetch = useCallback(() => {
    void query.refetch();
  }, [query]);

  const isLoading = Boolean((!isNew && query.isLoading) || model.isLoading);
  const error = query.errorText ?? model.errorText ?? null;

  // return（displayName 不可為 null）
  return {
    data,
    setFormData: setData,
    isLoading,
    error,
    refetch,
    displayName: model.data ?? emptyDisplaySchema,
  };
};

const useSpecUSRFormActionsByAdapter = (
  adapter: ReturnType<typeof createSpecUSRAdapter>,
  internalId: string,
  formData: SpecUSRSet,
  opt: SpecUSRFormActionsOpt,
): ServerFormActions => {
  // 宣告變數
  const isNew = useMemo(() => !internalId, [internalId]);

  const actions = adapter.useServerActions({
    onSuccessByMode: {
      create: () => opt.onBackToList(),
      update: () => opt.onBackToList(),
      delete: () => opt.onBackToList(),
    },
  });

  // return
  return {
    Save: async () => {
      if (isNew) await actions.createAsync(formData);
      else await actions.updateAsync(internalId, formData);
    },
    Delete: async () => {
      if (!internalId) return;
      await actions.deleteAsync(internalId);
    },
    Back: opt.onBackToList,
    IsSaving: actions.isSaving,
  };
};
//#endregion

//#region Private - SpecCategory (Map + Visible Cols)
class SpecCategoryService extends ApiDataService<SpecCategorySet> {
  constructor(apiInstance?: AxiosInstance) {
    super(PGID.SpecCategory, apiInstance);
  }
}

const createSpecCategoryAdapter = (apiInstance?: AxiosInstance) => {
  // 建立 adapter
  return new ApiDataAdapter<SpecCategorySet, SpecCategoryService>((api?: AxiosInstance) => new SpecCategoryService(api ?? apiInstance));
};

const escapeQueryString = (value: string): string => {
  // 避免 Condition 字串被破壞
  return value.replace(/"/g, `""`);
};

const buildSpecCategoryQueryByProgIdParam = (opt: { progId: string; lang?: Lang; pageSize?: number }): QueryListParam => {
  // 宣告變數
  const progId = escapeQueryString(opt.progId);
  const lang = opt.lang ? escapeQueryString(opt.lang) : null;

  const fields: string[] = [
    SpecCategoryModelFields.CategoryId,
    SpecCategoryModelFields.ShowColumnItems,
    `${SpecCategoryModelFields._SpecCategoryDetail}.${SpecCategoryDetailModelFields.Lang}`,
    `${SpecCategoryModelFields._SpecCategoryDetail}.${SpecCategoryDetailModelFields.CategoryName}`,
  ];

  const condLang = lang ? ` And ${SpecCategoryModelFields._SpecCategoryDetail}.${SpecCategoryDetailModelFields.Lang} = "${lang}"` : "";

  // return
  return {
    Fields: fields,
    Condition: `${SpecCategoryModelFields.ProgId} = "${progId}"${condLang}`,
    OrderBy: [{ Col: SpecCategoryModelFields.ModifyTime, Desc: true }],
    PageNumber: 0,
    PageSize: opt.pageSize ?? 0,
  };
};

const useSpecCategoryMapAndCols = (
  adapter: ReturnType<typeof createSpecCategoryAdapter>,
  opt: { progId: string; lang: Lang },
): {
  isLoading: boolean;
  errorText: string | null;
  refetch: () => Promise<void>;
  map: Record<string, string>;
  cols: Record<string, string[]>;
} => {
  // 執行 function
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

      const matched = (set.SpecCategoryDetail ?? []).find((d: SpecCategoryDetail) => d.Lang === opt.lang);
      acc[String(id)] = matched?.CategoryName ?? "";
      return acc;
    }, {} as Record<string, string>);
  }, [query.data, opt.lang]);

  // 宣告變數：CategoryId -> visible column keys
  const cols = useMemo<Record<string, string[]>>(() => {
    const rows = query.data ?? [];
    const next: Record<string, string[]> = {};

    rows.forEach((set) => {
      const cateId = set.SpecCategory?.CategoryId ?? "";
      if (!cateId) return;

      const raw = (set.SpecCategory?.ShowColumnItems ?? "").trim();
      next[cateId] = parseShowColumnItems(raw);
    });

    return next;
  }, [query.data]);

  const refetch = useCallback(async () => {
    await Promise.resolve(query.refetch());
  }, [query]);

  // return
  return {
    isLoading: Boolean(query.isLoading),
    errorText: query.errorText ?? null,
    refetch,
    map,
    cols,
  };
};

type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };

const parseShowColumnItems = (raw: string): string[] => {
  // 宣告變數
  if (!raw) return [];

  // 執行 function：支援 JSON array 或逗號分隔
  if (raw.startsWith("[") && raw.endsWith("]")) {
    const arr = safeParseJsonArray(raw);
    return arr ?? [];
  }

  // return
  return raw
    .split(/[,;|]/g)
    .map((x) => x.trim())
    .filter(Boolean);
};

const safeParseJsonArray = (raw: string): string[] | null => {
  try {
    const parsed = JSON.parse(raw) as JsonValue;
    if (!Array.isArray(parsed)) return null;

    return parsed
      .filter((x): x is string => typeof x === "string")
      .map((x) => x.trim())
      .filter(Boolean);
  } catch {
    return null;
  }
};
//#endregion