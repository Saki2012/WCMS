import { useCallback, useEffect, useMemo, useState } from "react";
import { CategoryAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Category/Category_Api";
import { TagAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Tags/Tag_Api";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiAdapterError, ApiLoaderData, ServerFormActions } from "@/SysCore/Utils/API/APIAdapter";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import type { UseFetchDataResult } from "@/SysCore/Utils/API/FetchDataType";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { PGID } from "@/types/SchemaFields";
import { WebResourceAdapter } from "@/Features/Hooks/BizFunc/WebManagement/WebResource/WebResource_Api";
import { useFetchEnumOptions } from "@/SysCore/Utils/API/SystemAPI_Hook";
type WebResourceSet = components["schemas"]["WebResourceSet_DTO"];

//#region Public
export type WebResourceFormRawData = {
  formData: UseFetchFormDataResult<WebResourceSet>;
  categoryMap: Record<string, string>;
  tagMap: Record<string, string>;
  statusOpts: Record<string, string>;
  windowsTarget: Record<string, string>;
  actions: ServerFormActions;
};
export type WebResourceFormActionsOpt = {
  /** 儲存成功後要回到列表（或其他導頁） */
  onBackToList: () => void;
};
export type WebResourceFormAdapter = {
    WebResource: ReturnType<typeof WebResourceAdapter>;
    Category: ReturnType<typeof CategoryAdapter>;
    Tag: ReturnType<typeof TagAdapter>;
};

/** ✅ 主入口：Server WebResource Form 的所有「讀取資料」都集中在這裡 */
export const useWebResourceFormFetchData = (opt: {lang: Lang;internalId: string;emptyData: WebResourceSet;actionsOpt: WebResourceFormActionsOpt;}): UseFetchDataResult<WebResourceFormRawData, WebResourceFormAdapter> => {
    const { publish } = useToast();
    const onError = useCallback((e: ApiAdapterError) => {publish({ level: MessageStatus.Error, title: e.messageText });}, [publish]);
    const adapter = useMemo(() => {return { WebResource: WebResourceAdapter(), Category: CategoryAdapter(), Tag: TagAdapter() };}, []);
    const formData = useWebResourceFormDataByAdapter(adapter.WebResource, opt.internalId, opt.emptyData, onError);
    const actions = useWebResourceFormActionsByAdapter(adapter.WebResource,opt.internalId,formData.data,opt.actionsOpt,);
    const category = adapter.Category.hooks.useMapByProgId({ progId: PGID.WebResource, lang: opt.lang });
    const tag = adapter.Tag.hooks.useMapByProgId({ progId: PGID.Announcement, lang: opt.lang });
    const statusOpts = useContentStatusOptions();
    const windowTarget = useWindowsTargetOptions()




    const loadingList = useMemo<boolean[]>(() => {return [Boolean(category.isLoading), Boolean(formData.isLoading),Boolean(tag.isLoading),
      Boolean(statusOpts.isLoading),Boolean(windowTarget.isLoading),
    ];}, [category.isLoading, formData.isLoading,tag.isLoading,statusOpts.isLoading,windowTarget.isLoading]);
    const errorList = useMemo<(string | null | undefined)[]>(() => {return [category.errorText, formData.error,
      tag.errorText,statusOpts.error,windowTarget.error
    ];}, [category.errorText, formData.error,tag.errorText,statusOpts.error,windowTarget.error]);
    const isLoading = useMemo(() => loadingList.some(Boolean), [loadingList]);
    const errors = useMemo(() => errorList.filter((x): x is string => Boolean(x)), [errorList]);
    const rawData = useMemo<WebResourceFormRawData>(() => {return {formData,categoryMap: category.map ?? {},tagMap:tag.map,statusOpts:statusOpts.data,windowsTarget:windowTarget.data,actions};}, [formData, actions, category.map,tag.map,statusOpts.data,windowTarget.data]);
    const refetchData = useCallback(async () => {await Promise.resolve(formData.refetch());}, [formData]);
    const refetchRefData = useCallback(async () => {await Promise.all([category.refetch()]);}, [category]);
    return { adapter, rawData, isLoading, errors, refetchData, refetchRefData };
};
//#endregion

//#region Private

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

/** ✅ ContentStatus enum options（去掉 key=0） */
const useWindowsTargetOptions = (): { data: Record<string, string>; isLoading: boolean; error: string | null } => {
    // 宣告變數
    const src = useFetchEnumOptions("WindowTarget");
    // return
    return useMemo(() => {
        const raw = src.data ?? {};
        const { ["0"]: _drop, ...rest } = raw;
        return { data: rest as Record<string, string>, isLoading: Boolean(src.isLoading), error: src.error };
    }, [src.data, src.isLoading, src.error]);
};

/** ✅ FormData：QueryData + ModelDisplayName（含 editable state） */
const useWebResourceFormDataByAdapter = (adapter: ReturnType<typeof WebResourceAdapter>,internalId: string,
    empty: WebResourceSet,onError: (e: ApiAdapterError) => void,): UseFetchFormDataResult<WebResourceSet> => {
    // 宣告變數
    const internalKey = internalId || "__new__";
    const isNew = useMemo(() => !internalId, [internalId]);
    const initial = useMemo<ApiLoaderData<string, WebResourceSet> | null>(() => {
    // 新建才提供 initial，避免 query "__new__"
    if (!isNew) return null;
    // 建立一個成功回應當作 loader 初始資料
    const apiRes: ApiResponse<WebResourceSet> = {IsSuccess: true,Data: empty,SysMessage: [],};
    // ✅ 注意：ApiLoaderData 目前要求 apiRes
    return { args: internalKey, apiRes };
    }, [isNew, empty, internalKey]);
    const model = adapter.hooks.useModelDisplayName({ deps: [], onError });
    const query = adapter.hooks.useQueryData({ internalId: internalKey, initial, deps: [internalKey], onError });
    const [data, setData] = useState<WebResourceSet>(empty);
    useEffect(() => {
        // 執行 function：QueryData 回來後同步到可編輯 state
        if (query.data) setData(query.data);
        else if (isNew) setData(empty);
    }, [query.data, isNew, empty]);
    const refetch = useCallback(() => {void query.refetch();}, [query]);
    const isLoading = Boolean((!isNew && query.isLoading) || model.isLoading);
    const error = query.errorText ?? model.errorText ?? null;
    // return（displayName 不可為 null）
    return {data,setFormData: setData,isLoading,error,refetch,displayName: (model.data ?? ({ ModelId: "", ModelDisplayName: "", Tables: [] } as ModelDisplaySchema)),};
};

const useWebResourceFormActionsByAdapter = (
  adapter: ReturnType<typeof WebResourceAdapter>,
  internalId: string,
  formData: WebResourceSet,
  opt: WebResourceFormActionsOpt,
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
