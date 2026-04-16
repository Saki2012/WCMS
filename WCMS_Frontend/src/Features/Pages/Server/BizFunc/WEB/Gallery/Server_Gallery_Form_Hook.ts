import { CategoryAdapter } from "@/Features/Hooks/BizFunc/COMM/Category_Api";
import { TagAdapter } from "@/Features/Hooks/BizFunc/COMM/Tag_Api";
import { GalleryAdapter } from "@/Features/Hooks/BizFunc/WEB/Gallery_Api";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiAdapterError, ApiLoaderData, ServerFormActions } from "@/SysCore/Utils/API/APIAdapter";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import type { UseFetchDataResult } from "@/SysCore/Utils/API/FetchDataType";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import { useFetchEnumOptions } from "@/SysCore/Utils/API/SystemAPI_Hook";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { PGID } from "@/types/SchemaFields";
import { useCallback, useEffect, useMemo, useState } from "react";

type GallerySet = components["schemas"]["GallerySet_DTO"];

// #region Public
export type GalleryFormRawData = {
    formData: UseFetchFormDataResult<GallerySet>;
    categoryMap: Record<string, string>;
    tagMap: Record<string, string>;
    statusOpts: Record<string, string>;
    actions: ServerFormActions;
};

export type GalleryFormActionsOpt = {
    /** 儲存成功後要回到列表（或其他導頁） */
    onBackToList: () => void;
};

export type GalleryFormAdapter = {
    Gallery: ReturnType<typeof GalleryAdapter>;
    Category: ReturnType<typeof CategoryAdapter>;
    Tag: ReturnType<typeof TagAdapter>;
};

/** ✅ 主入口：Server Gallery Form 的所有「讀取資料」都集中在這裡 */
export const useGalleryFormFetchData = (
    opt: { lang: Lang; internalId: string; emptyData: GallerySet; actionsOpt: GalleryFormActionsOpt; },
): UseFetchDataResult<GalleryFormRawData, GalleryFormAdapter> =>
{
    const { publish } = useToast();
    const onError = useCallback((e: ApiAdapterError) =>
    {
        publish({ level: MessageStatus.Error, title: e.messageText });
    }, [publish]);
    const adapter = useMemo<GalleryFormAdapter>(() =>
    {
        return { Gallery: GalleryAdapter(), Category: CategoryAdapter(), Tag: TagAdapter() };
    }, []);
    // 執行 function：主資料（ModelDisplayName + QueryData + editable state）
    const formData = useGalleryFormDataByAdapter(adapter.Gallery, opt.internalId, opt.emptyData, onError);
    const actions = useGalleryFormActionsByAdapter(adapter.Gallery, opt.internalId, formData.data, opt.actionsOpt);
    // 執行 function：關聯資料（Category / Tag / ContentStatus）
    const category = adapter.Category.hooks.useMapByProgId({ progId: PGID.Gallery, lang: opt.lang });
    const tag = adapter.Tag.hooks.useMapByProgId({ progId: PGID.Gallery, lang: opt.lang });
    const statusOpts = useContentStatusOptions();
    // 宣告變數：Loading / Error（給 LoadingErrorHandler）
    const loadingList = useMemo<boolean[]>(() =>
    {
        return [
            Boolean(category.isLoading),
            Boolean(tag.isLoading),
            Boolean(formData.isLoading),
            Boolean(statusOpts.isLoading),
        ];
    }, [category.isLoading, tag.isLoading, formData.isLoading, statusOpts.isLoading]);
    const errorList = useMemo<(string | null | undefined)[]>(() =>
    {
        return [category.errorText, tag.errorText, formData.error, statusOpts.error];
    }, [category.errorText, tag.errorText, formData.error, statusOpts.error]);
    // 宣告變數：ListComp 風格統一出口
    const isLoading = useMemo(() => loadingList.some(Boolean), [loadingList]);
    const errors = useMemo(() => errorList.filter((x): x is string => Boolean(x)), [errorList]);
    const rawData = useMemo<GalleryFormRawData>(() =>
    {
        return {
            formData,
            categoryMap: category.map ?? {},
            tagMap: tag.map ?? {},
            statusOpts: statusOpts.data,
            actions,
        };
    }, [formData, actions, category.map, tag.map, statusOpts.data]);
    const refetchData = useCallback(async () =>
    {
        await Promise.resolve(formData.refetch());
    }, [formData]);
    const refetchRefData = useCallback(async () =>
    {
        await Promise.all([category.refetch(), tag.refetch()]);
    }, [category, tag]);
    return { adapter, rawData, isLoading, errors, refetchData, refetchRefData };
};
// #endregion

// #region Private
/** ✅ ContentStatus enum options（去掉 key=0） */
const useContentStatusOptions = (): { data: Record<string, string>; isLoading: boolean; error: string | null; } =>
{
    // 宣告變數
    const src = useFetchEnumOptions("ContentStatus");
    // return
    return useMemo(() =>
    {
        const raw = src.data ?? {};
        const { ["0"]: _drop, ...rest } = raw;
        return { data: rest as Record<string, string>, isLoading: Boolean(src.isLoading), error: src.error };
    }, [src.data, src.isLoading, src.error]);
};
/** ✅ FormData：QueryData + ModelDisplayName（含 editable state） */
const useGalleryFormDataByAdapter = (
    adapter: ReturnType<typeof GalleryAdapter>,
    internalId: string,
    empty: GallerySet,
    onError: (e: ApiAdapterError) => void,
): UseFetchFormDataResult<GallerySet> =>
{
    // 宣告變數
    const internalKey = internalId || "__new__";
    const isNew = useMemo(() => !internalId, [internalId]);
    const initial = useMemo<ApiLoaderData<string, GallerySet> | null>(() =>
    {
        // 新建才提供 initial，避免 query "__new__"
        if (!isNew) return null;
        // 建立一個成功回應當作 loader 初始資料
        const apiRes: ApiResponse<GallerySet> = { IsSuccess: true, Data: empty, SysMessage: [] };
        // ✅ 注意：ApiLoaderData 目前要求 apiRes
        return { args: internalKey, apiRes };
    }, [isNew, empty, internalKey]);
    const model = adapter.hooks.useModelDisplayName({ deps: [], onError });
    const query = adapter.hooks.useQueryData({ internalId: internalKey, initial, deps: [internalKey], onError });
    const [data, setData] = useState<GallerySet>(empty);
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

const useGalleryFormActionsByAdapter = (
    adapter: ReturnType<typeof GalleryAdapter>,
    internalId: string,
    formData: GallerySet,
    opt: GalleryFormActionsOpt,
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
