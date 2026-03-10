import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiAdapterError, ApiLoaderData, ServerFormActions } from "@/SysCore/Utils/API/APIAdapter";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import type { UseFetchDataResult } from "@/SysCore/Utils/API/FetchDataType";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { BannerSliderAdapter } from "@/Features/Hooks/BizFunc/WebManagement/BannerSlider_Api";

type BannerSet = components["schemas"]["BannerSet_DTO"];

//#region Public
export type BannerSliderFormRawData = {
  formData: UseFetchFormDataResult<BannerSet>;
  actions: ServerFormActions;
};

export type BannerSliderFormActionsOpt = {
  /** 儲存成功後要回到列表（或其他導頁） */
  onBackToList: () => void;
};


export type BannerSliderFormAdapter = {
    BannerSlider: ReturnType<typeof BannerSliderAdapter>;
};

/** ✅ 主入口：Server Announcement Form 的所有「讀取資料」都集中在這裡 */
export const useBannerSliderFormFetchData = (opt: {lang: Lang;internalId: string;emptyData: BannerSet;actionsOpt: BannerSliderFormActionsOpt;}): UseFetchDataResult<BannerSliderFormRawData, BannerSliderFormAdapter> => {
    const { publish } = useToast();
    const onError = useCallback((e: ApiAdapterError) => {publish({ level: MessageStatus.Error, title: e.messageText });}, [publish]);
    const adapter = useMemo<BannerSliderFormAdapter>(() => {return { BannerSlider: BannerSliderAdapter()}}, []);
    // 執行 function：主資料（ModelDisplayName + QueryData + editable state）
    const formData = useAnnouncementFormDataByAdapter(adapter.BannerSlider, opt.internalId, opt.emptyData, onError);
    const actions = useAnnouncementFormActionsByAdapter(adapter.BannerSlider,opt.internalId,formData.data,opt.actionsOpt,);
    // 執行 function：關聯資料（Category / Tag / ContentStatus）
    // 宣告變數：Loading / Error（給 LoadingErrorHandler）
    const loadingList = useMemo<boolean[]>(() => {return [Boolean(formData.isLoading)];}, [formData.isLoading]);
    const errorList = useMemo<(string | null | undefined)[]>(() => {return [formData.error];}, [formData.error]);
    // 宣告變數：ListComp 風格統一出口
    const isLoading = useMemo(() => loadingList.some(Boolean), [loadingList]);
    const errors = useMemo(() => errorList.filter((x): x is string => Boolean(x)), [errorList]);
    const rawData = useMemo<BannerSliderFormRawData>(() => {return {formData,actions};}, [formData,actions]);
    const refetchData = useCallback(async () => {await Promise.resolve(formData.refetch());}, [formData]);
    return { adapter, rawData, isLoading, errors, refetchData };
};
//#endregion

//#region Private

/** ✅ FormData：QueryData + ModelDisplayName（含 editable state） */
const useAnnouncementFormDataByAdapter = (adapter: ReturnType<typeof BannerSliderAdapter>,internalId: string,
    empty: BannerSet,onError: (e: ApiAdapterError) => void,): UseFetchFormDataResult<BannerSet> => {
    // 宣告變數
    const internalKey = internalId || "__new__";
    const isNew = useMemo(() => !internalId, [internalId]);
    const initial = useMemo<ApiLoaderData<string, BannerSet> | null>(() => {
    // 新建才提供 initial，避免 query "__new__"
    if (!isNew) return null;
    // 建立一個成功回應當作 loader 初始資料
    const apiRes: ApiResponse<BannerSet> = {IsSuccess: true,Data: empty,SysMessage: [],};
    // ✅ 注意：ApiLoaderData 目前要求 apiRes
    return { args: internalKey, apiRes };
    }, [isNew, empty, internalKey]);
    const model = adapter.hooks.useModelDisplayName({ deps: [], onError });
    const query = adapter.hooks.useQueryData({ internalId: internalKey, initial, deps: [internalKey], onError });
    const [data, setData] = useState<BannerSet>(empty);
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

const useAnnouncementFormActionsByAdapter = (
  adapter: ReturnType<typeof BannerSliderAdapter>,
  internalId: string,
  formData: BannerSet,
  opt: BannerSliderFormActionsOpt,
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
