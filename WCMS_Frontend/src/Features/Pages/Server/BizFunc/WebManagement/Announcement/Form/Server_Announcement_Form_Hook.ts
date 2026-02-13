import { useCallback, useEffect, useMemo, useState } from "react";

import { AnnouncementAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Announcement/Announcement_Api";
import { CategoryAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Category/Category_Api";
import { TagAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Tags/Tag_Api";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";

import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiAdapterError, ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import { useFetchEnumOptions } from "@/SysCore/Utils/API/SystemAPI_Hook";
import type { UseFetchDataResult } from "@/SysCore/Utils/API/FetchDataType";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";

import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { PGID } from "@/types/SchemaFields";

type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"];

//#region Public
export type AnnouncementFormRawData = {
    formData: UseFetchFormDataResult<AnnouncementSet>;
    categoryMap: Record<string, string>;
    tagMap: Record<string, string>;
    statusOpts: Record<string, string>;
    loadingList: boolean[];
    errorList: (string | null | undefined)[];
};

export type AnnouncementFormAdapter = {
    Announcement: ReturnType<typeof AnnouncementAdapter>;
    Category: ReturnType<typeof CategoryAdapter>;
    Tag: ReturnType<typeof TagAdapter>;
};

/** ✅ 主入口：Server Announcement Form 的所有「讀取資料」都集中在這裡 */
export const useAnnouncementFormFetchData = (opt: {
    lang: Lang;
    internalId: string;
    emptyData: AnnouncementSet;
}): UseFetchDataResult<AnnouncementFormRawData, AnnouncementFormAdapter> => {
    // 宣告變數
    const { publish } = useToast();
    const onError = useCallback((e: ApiAdapterError) => {
        publish({ level: MessageStatus.Error, title: e.messageText });
    }, [publish]);

    const adapter = useMemo<AnnouncementFormAdapter>(() => {
        return { Announcement: AnnouncementAdapter(), Category: CategoryAdapter(), Tag: TagAdapter() };
    }, []);

    // 執行 function：主資料（ModelDisplayName + QueryData + editable state）
    const formData = useAnnouncementFormDataByAdapter(adapter.Announcement, opt.internalId, opt.emptyData, onError);

    // 執行 function：關聯資料（Category / Tag / ContentStatus）
    const category = adapter.Category.hooks.useMapByProgId({ progId: PGID.Announcement, lang: opt.lang });
    const tag = adapter.Tag.hooks.useMapByProgId({ progId: PGID.Announcement, lang: opt.lang });
    const statusOpts = useContentStatusOptions();

    // 宣告變數：Loading / Error（給 LoadingErrorHandler）
    const loadingList = useMemo<boolean[]>(() => {
        return [Boolean(category.isLoading), Boolean(tag.isLoading), Boolean(formData.isLoading), Boolean(statusOpts.isLoading)];
    }, [category.isLoading, tag.isLoading, formData.isLoading, statusOpts.isLoading]);

    const errorList = useMemo<(string | null | undefined)[]>(() => {
        return [category.errorText, tag.errorText, formData.error, statusOpts.error];
    }, [category.errorText, tag.errorText, formData.error, statusOpts.error]);

    // 宣告變數：ListComp 風格統一出口
    const isLoading = useMemo(() => loadingList.some(Boolean), [loadingList]);
    const errors = useMemo(() => errorList.filter((x): x is string => Boolean(x)), [errorList]);

    const rawData = useMemo<AnnouncementFormRawData>(() => {
        return {
            formData,
            categoryMap: category.map ?? {},
            tagMap: tag.map ?? {},
            statusOpts: statusOpts.data,
            loadingList,
            errorList,
        };
    }, [formData, category.map, tag.map, statusOpts.data, loadingList, errorList]);

    const refetchData = useCallback(async () => {
        // 執行 function：refetch 主資料
        await Promise.resolve(formData.refetch());
    }, [formData]);

    const refetchRefData = useCallback(async () => {
        // 執行 function：refetch 關聯資料（Category / Tag）
        await Promise.all([category.refetch(), tag.refetch()]);
    }, [category, tag]);

    // return
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

/** ✅ FormData：QueryData + ModelDisplayName（含 editable state） */
const useAnnouncementFormDataByAdapter = (
    adapter: ReturnType<typeof AnnouncementAdapter>,
    internalId: string,
    empty: AnnouncementSet,
    onError: (e: ApiAdapterError) => void,
): UseFetchFormDataResult<AnnouncementSet> => {
    // 宣告變數
    const internalKey = internalId || "__new__";
    const isNew = useMemo(() => !internalId, [internalId]);

    const initial = useMemo<ApiLoaderData<string, AnnouncementSet> | null>(() => {
        if (!isNew) return null;
        const ok: ApiResponse<AnnouncementSet> = { IsSuccess: true, Data: empty, SysMessage: [] };
        // ✅ 注意：ApiLoaderData 欄位要用 env（不是 apiRes）
        return { args: internalKey, env: ok };
    }, [isNew, empty, internalKey]);

    const model = adapter.hooks.useModelDisplayName({ deps: [], onError });
    const query = adapter.hooks.useQueryData({ internalId: internalKey, initial, deps: [internalKey], onError });

    const [data, setData] = useState<AnnouncementSet>(empty);

    useEffect(() => {
        // 執行 function：QueryData 回來後同步到可編輯 state
        if (query.data) setData(query.data);
        else if (isNew) setData(empty);
    }, [query.data, isNew, empty]);

    const refetch = useCallback(() => {
        // 執行 function
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
//#endregion
