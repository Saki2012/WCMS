import { CategoryAdapter } from "@/Features/Hooks/BizFunc/COMM/Category_Api";
import { TagAdapter } from "@/Features/Hooks/BizFunc/COMM/Tag_Api";
import { PageManagementAdapter } from "@/Features/Hooks/BizFunc/WEB/PageManagement_Api";
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
import { useCallback, useEffect, useMemo, useState } from "react";
type PageManagementSet = components["schemas"]["PageManagementSet_DTO"];

// #region Public
export type PageManagementFormRawData = {
    formData: UseFetchFormDataResult<PageManagementSet>;
    categoryMap: Record<string, string>;
    actions: ServerFormActions;
};
export type PageManagementFormActionsOpt = {
    /** 儲存成功後要回到列表（或其他導頁） */
    onBackToList: () => void;
};
export type PageManagementFormAdapter = {
    PageManagement: ReturnType<typeof PageManagementAdapter>;
    Category: ReturnType<typeof CategoryAdapter>;
};
/** ✅ 主入口：Server PageManagement Form 的所有「讀取資料」都集中在這裡 */
export const usePageManagementFormFetchData = (
    opt: { lang: Lang; internalId: string; emptyData: PageManagementSet; actionsOpt: PageManagementFormActionsOpt; },
): UseFetchDataResult<PageManagementFormRawData, PageManagementFormAdapter> =>
{
    const { publish } = useToast();
    const onError = useCallback((e: ApiAdapterError) =>
    {
        publish({ level: MessageStatus.Error, title: e.messageText });
    }, [publish]);
    const adapter = useMemo<PageManagementFormAdapter>(() =>
    {
        return { PageManagement: PageManagementAdapter(), Category: CategoryAdapter(), Tag: TagAdapter() };
    }, []);
    const formData = usePageManagementFormDataByAdapter(adapter.PageManagement, opt.internalId, opt.emptyData, onError);
    const actions = usePageManagementFormActionsByAdapter(
        adapter.PageManagement,
        opt.internalId,
        formData.data,
        opt.actionsOpt,
    );
    const category = adapter.Category.hooks.useMapByProgId({ progId: PGID.PageManagement, lang: opt.lang });
    const loadingList = useMemo<boolean[]>(() =>
    {
        return [Boolean(category.isLoading), Boolean(formData.isLoading)];
    }, [category.isLoading, formData.isLoading]);
    const errorList = useMemo<(string | null | undefined)[]>(() =>
    {
        return [category.errorText, formData.error];
    }, [category.errorText, formData.error]);
    const isLoading = useMemo(() => loadingList.some(Boolean), [loadingList]);
    const errors = useMemo(() => errorList.filter((x): x is string => Boolean(x)), [errorList]);
    const rawData = useMemo<PageManagementFormRawData>(() =>
    {
        return { formData, categoryMap: category.map ?? {}, actions };
    }, [formData, actions, category.map]);
    const refetchData = useCallback(async () =>
    {
        await Promise.resolve(formData.refetch());
    }, [formData]);
    const refetchRefData = useCallback(async () =>
    {
        await Promise.all([category.refetch()]);
    }, [category]);
    return { adapter, rawData, isLoading, errors, refetchData, refetchRefData };
};
// #endregion

// #region Private
/** ✅ FormData：QueryData + ModelDisplayName（含 editable state） */
const usePageManagementFormDataByAdapter = (
    adapter: ReturnType<typeof PageManagementAdapter>,
    internalId: string,
    empty: PageManagementSet,
    onError: (e: ApiAdapterError) => void,
): UseFetchFormDataResult<PageManagementSet> =>
{
    // 宣告變數
    const internalKey = internalId || "__new__";
    const isNew = useMemo(() => !internalId, [internalId]);
    const initial = useMemo<ApiLoaderData<string, PageManagementSet> | null>(() =>
    {
        // 新建才提供 initial，避免 query "__new__"
        if (!isNew) return null;
        // 建立一個成功回應當作 loader 初始資料
        const apiRes: ApiResponse<PageManagementSet> = { IsSuccess: true, Data: empty, SysMessage: [] };
        // ✅ 注意：ApiLoaderData 目前要求 apiRes
        return { args: internalKey, apiRes };
    }, [isNew, empty, internalKey]);
    const model = adapter.hooks.useModelDisplayName({ deps: [], onError });
    const query = adapter.hooks.useQueryData({ internalId: internalKey, initial, deps: [internalKey], onError });
    const [data, setData] = useState<PageManagementSet>(empty);
    useEffect(() =>
    {
        // 執行 function：QueryData 回來後同步到可編輯 state
        if (query.data) setData(query.data);
        else if (isNew) setData(empty);
    }, [query.data, isNew, empty]);
    const refetch = useCallback(() =>
    {
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
        displayName: (model.data ?? ({ ModelId: "", ModelDisplayName: "", Tables: [] } as ModelDisplaySchema)),
    };
};

const usePageManagementFormActionsByAdapter = (
    adapter: ReturnType<typeof PageManagementAdapter>,
    internalId: string,
    formData: PageManagementSet,
    opt: PageManagementFormActionsOpt,
): ServerFormActions =>
{
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
        Save: async () =>
        {
            if (isNew) await actions.createAsync(formData);
            else await actions.updateAsync(internalId, formData);
        },
        Delete: async () =>
        {
            if (!internalId) return;
            await actions.deleteAsync(internalId);
        },
        Back: opt.onBackToList,
        IsSaving: actions.isSaving,
    };
};
// #endregion
