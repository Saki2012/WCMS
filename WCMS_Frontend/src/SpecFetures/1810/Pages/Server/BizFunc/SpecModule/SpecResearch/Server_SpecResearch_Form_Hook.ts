import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import { TagAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Tag_Api";
import { SpecResearchAdapter } from "@/SpecFetures/1810/Hooks/SpecResearch/SpecResearch_Api";
import { SpecCategoryAdapter } from "@/SpecFetures/1810/Hooks/SpecCategory/SpecCategory_Api";

import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiAdapterError, ApiLoaderData, ServerFormActions } from "@/SysCore/Utils/API/APIAdapter";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import { useFetchEnumOptions } from "@/SysCore/Utils/API/SystemAPI_Hook";
import type { UseFetchDataResult } from "@/SysCore/Utils/API/FetchDataType";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";

import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { PGID } from "@/types/SchemaFields";

type SpecResearchSet = components["schemas"]["SpecResearchSet_DTO"];
type SpecCategorySet = components["schemas"]["SpecCategorySet_DTO"];

//#region Public
export type SpecResearchFormRawData = {
  formData: UseFetchFormDataResult<SpecResearchSet>;
  categoryMap: Record<string, string>;
  categoryCols: Record<string, string[]>;
  tagMap: Record<string, string>;
  statusOpts: Record<string, string>;
  actions: ServerFormActions;
};

export type SpecResearchFormActionsOpt = {
  /** 儲存/刪除成功後要回到列表（或其他導頁） */
  onBackToList: () => void;
};

export type SpecResearchFormAdapter = {
  SpecResearch: ReturnType<typeof SpecResearchAdapter>;
  SpecCategory: ReturnType<typeof SpecCategoryAdapter>;
  Tag: ReturnType<typeof TagAdapter>;
};

/** ✅ 主入口：Server SpecResearch Form 的所有「讀取資料」都集中在這裡 */
export const useSpecResearchFormFetchData = (opt: {
  lang: Lang;
  internalId: string;
  emptyData: SpecResearchSet;
  actionsOpt: SpecResearchFormActionsOpt;
}): UseFetchDataResult<SpecResearchFormRawData, SpecResearchFormAdapter> => {
  const { publish } = useToast();

  // 宣告變數：統一錯誤出口（toast）
  const onError = useCallback(
    (e: ApiAdapterError) => {
      publish({ level: MessageStatus.Error, title: e.messageText });
    },
    [publish],
  );

  // 宣告變數：Adapters（固定 reference）
  const adapter = useMemo<SpecResearchFormAdapter>(() => {
    return {
      SpecResearch: SpecResearchAdapter(),
      SpecCategory: SpecCategoryAdapter(),
      Tag: TagAdapter(),
    };
  }, []);

  // 執行 function：主資料（ModelDisplayName + QueryData + editable state）
  const formData = useSpecResearchFormDataByAdapter(
    adapter.SpecResearch,
    opt.internalId,
    opt.emptyData,
    onError,
  );

  // 執行 function：Actions（create/update/delete/back）
  const actions = useSpecResearchFormActionsByAdapter(
    adapter.SpecResearch,
    opt.internalId,
    formData.data,
    opt.actionsOpt,
  );

  // 執行 function：關聯資料（Category / Tag / ContentStatus）
  const category = adapter.SpecCategory.hooks.useMapByProgId({ progId: PGID.SpecResearch, lang: opt.lang });
  const tag = adapter.Tag.hooks.useMapByProgId({ progId: PGID.SpecResearch, lang: opt.lang });
  const statusOpts = useContentStatusOptions();

  // 宣告變數：Category → 欄位顯示清單（ShowColumnItems）
  const categoryCols = useMemo(() => {
    return buildCategoryCols(category.data ?? []);
  }, [category.data]);

  // 宣告變數：Loading / Error（給 LoadingErrorHandler）
  const loadingList = useMemo<boolean[]>(() => {
    return [
      Boolean(formData.isLoading),
      Boolean(category.isLoading),
      Boolean(tag.isLoading),
      Boolean(statusOpts.isLoading),
    ];
  }, [formData.isLoading, category.isLoading, tag.isLoading, statusOpts.isLoading]);

  const errorList = useMemo<(string | null | undefined)[]>(() => {
    return [formData.error, category.errorText, tag.errorText, statusOpts.error];
  }, [formData.error, category.errorText, tag.errorText, statusOpts.error]);

  // 宣告變數：FormComp 風格統一出口
  const isLoading = useMemo(() => loadingList.some(Boolean), [loadingList]);
  const errors = useMemo(() => errorList.filter((x): x is string => Boolean(x)), [errorList]);

  const rawData = useMemo<SpecResearchFormRawData>(() => {
    return {
      formData,
      categoryMap: category.map ?? {},
      categoryCols,
      tagMap: tag.map ?? {},
      statusOpts: statusOpts.data,
      actions,
    };
  }, [formData, category.map, categoryCols, tag.map, statusOpts.data, actions]);

  const refetchData = useCallback(async () => {
    await Promise.resolve(formData.refetch());
  }, [formData]);

  const refetchRefData = useCallback(async () => {
    await Promise.all([category.refetch(), tag.refetch()]);
  }, [category, tag]);

  return { adapter, rawData, isLoading, errors, refetchData, refetchRefData };
};
//#endregion

//#region Private
/** ✅ ContentStatus enum options（去掉 key=0） */
const useContentStatusOptions = (): {
  data: Record<string, string>;
  isLoading: boolean;
  error: string | null;
} => {
  // 宣告變數
  const src = useFetchEnumOptions("ContentStatus");

  // return
  return useMemo(() => {
    const raw = src.data ?? {};
    const { ["0"]: _drop, ...rest } = raw;
    return {
      data: rest as Record<string, string>,
      isLoading: Boolean(src.isLoading),
      error: src.error,
    };
  }, [src.data, src.isLoading, src.error]);
};

/** ✅ FormData：QueryData + ModelDisplayName（含 editable state） */
const useSpecResearchFormDataByAdapter = (
  adapter: ReturnType<typeof SpecResearchAdapter>,
  internalId: string,
  empty: SpecResearchSet,
  onError: (e: ApiAdapterError) => void,
): UseFetchFormDataResult<SpecResearchSet> => {
  // 宣告變數
  const internalKey = internalId || "__new__";
  const isNew = useMemo(() => !internalId, [internalId]);

  const initial = useMemo<ApiLoaderData<string, SpecResearchSet> | null>(() => {
    // 新建才提供 initial，避免 query "__new__"
    if (!isNew) return null;

    const apiRes: ApiResponse<SpecResearchSet> = {
      IsSuccess: true,
      Data: empty,
      SysMessage: [],
    };

    return { args: internalKey, apiRes };
  }, [isNew, empty, internalKey]);

  // 執行 function
  const model = adapter.hooks.useModelDisplayName({ deps: [], onError });
  const query = adapter.hooks.useQueryData({
    internalId: internalKey,
    initial,
    deps: [internalKey],
    onError,
  });

  // 宣告變數：可編輯 state（避免直接改 query.data）
  const [data, setData] = useState<SpecResearchSet>(empty);

  useEffect(() => {
    // 執行 function：QueryData 回來後同步到可編輯 state
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
    displayName: model.data ?? ({ ModelId: "", ModelDisplayName: "", Tables: [] } as ModelDisplaySchema),
  };
};

const useSpecResearchFormActionsByAdapter = (
  adapter: ReturnType<typeof SpecResearchAdapter>,
  internalId: string,
  formData: SpecResearchSet,
  opt: SpecResearchFormActionsOpt,
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

/** ✅ SpecCategory.ShowColumnItems → Record<CategoryId, string[]> */
const buildCategoryCols = (rows: SpecCategorySet[]): Record<string, string[]> => {
  // 宣告變數
  const map: Record<string, string[]> = {};

  // 執行 function
  rows.forEach((set) => {
    const cateId = set.SpecCategory?.CategoryId ?? "";
    if (!cateId) return;

    const raw = (set.SpecCategory?.ShowColumnItems ?? "").trim();
    map[cateId] = parseShowColumnItems(raw);
  });

  // return
  return map;
};

const parseShowColumnItems = (raw: string): string[] => {
  // 宣告變數
  if (!raw) return [];

  // 執行 function：支援 JSON array / CSV / pipe / semicolon
  if (raw.startsWith("[") && raw.endsWith("]")) {
    const arr = safeParseJsonArray(raw);
    return arr ?? [];
  }

  const parts = raw
    .split(/[,;|]/g)
    .map((x) => x.trim())
    .filter(Boolean);

  // return
  return parts;
};

const safeParseJsonArray = (raw: string): string[] | null => {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;

    const list = parsed.filter((x): x is string => typeof x === "string").map((x) => x.trim()).filter(Boolean);
    return list;
  } catch {
    return null;
  }
};
//#endregion