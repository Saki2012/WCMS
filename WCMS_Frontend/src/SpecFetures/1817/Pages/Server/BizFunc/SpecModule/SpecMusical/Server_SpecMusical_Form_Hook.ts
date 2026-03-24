import { useCallback, useEffect, useMemo, useState } from "react";
import { CategoryAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Category_Api";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiAdapterError, ApiLoaderData, ServerFormActions } from "@/SysCore/Utils/API/APIAdapter";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import type { UseFetchDataResult } from "@/SysCore/Utils/API/FetchDataType";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import { PGID } from "@/types/SchemaFields";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { SpecMusicalAdapter } from "@/SpecFetures/1817/Hooks/BizFunc/SpecModule/SpecMusical/SpecMusical_Api";

type SpecMusicalSet = components["schemas"]["SpecMusicalSet_DTO"];

//#region Public
export type SpecMusicalFormRawData = {
    formData: UseFetchFormDataResult<SpecMusicalSet>;
    categoryMap: Record<string, string>;
    actions: ServerFormActions;
};

export type SpecMusicalFormActionsOpt = {
    /** 儲存成功後回列表 */
    onBackToList: () => void;
};

export type SpecMusicalFormAdapter = {
    SpecMusical: ReturnType<typeof SpecMusicalAdapter>;
    Category: ReturnType<typeof CategoryAdapter>;
};

/** SpecMusical Form 的所有讀取資料集中在這裡 */
export const useSpecMusicalFormFetchData = (
    opt: {
        lang: Lang;
        internalId: string;
        emptyData: SpecMusicalSet;
        actionsOpt: SpecMusicalFormActionsOpt;
    },
): UseFetchDataResult<SpecMusicalFormRawData, SpecMusicalFormAdapter> => {
    const { publish } = useToast();

    /** 統一處理 adapter 錯誤 */
    const onError = useCallback((e: ApiAdapterError) => {
        publish({ level: MessageStatus.Error, title: e.messageText });
    }, [publish]);

    /** 集中建立 adapter */
    const adapter = useMemo<SpecMusicalFormAdapter>(() => {
        return {
            SpecMusical: SpecMusicalAdapter(),
            Category: CategoryAdapter(),
        };
    }, []);

    /** 主表單資料 */
    const formData = useSpecMusicalFormDataByAdapter(
        adapter.SpecMusical,
        opt.internalId,
        opt.emptyData,
        onError,
    );

    /** Form actions */
    const actions = useSpecMusicalFormActionsByAdapter(
        adapter.SpecMusical,
        opt.internalId,
        formData.data,
        opt.actionsOpt,
    );

    /** 關聯資料：Category */
    const category = adapter.Category.hooks.useMapByProgId({
        progId: PGID.SpecMusical,
        lang: opt.lang,
    });

    /** 統一 loading */
    const isLoading = useMemo(() => {
        return Boolean(formData.isLoading || category.isLoading);
    }, [formData.isLoading, category.isLoading]);

    /** 統一 errors */
    const errors = useMemo(() => {
        const list = [formData.error, category.errorText];
        return list.filter((x): x is string => Boolean(x));
    }, [formData.error, category.errorText]);

    /** 統一 rawData 出口 */
    const rawData = useMemo<SpecMusicalFormRawData>(() => {
        return {
            formData,
            categoryMap: category.map ?? {},
            actions,
        };
    }, [formData, category.map, actions]);

    /** 重抓主資料 */
    const refetchData = useCallback(async () => {
        await Promise.resolve(formData.refetch());
    }, [formData]);

    /** 重抓參照資料 */
    const refetchRefData = useCallback(async () => {
        await Promise.resolve(category.refetch());
    }, [category]);

    return { adapter, rawData, isLoading, errors, refetchData, refetchRefData };
};
//#endregion

//#region Private
/** QueryData + ModelDisplayName + editable state */
const useSpecMusicalFormDataByAdapter = (
    adapter: ReturnType<typeof SpecMusicalAdapter>,
    internalId: string,
    empty: SpecMusicalSet,
    onError: (e: ApiAdapterError) => void,
): UseFetchFormDataResult<SpecMusicalSet> => {
    const internalKey = internalId || "__new__";
    const isNew = useMemo(() => !internalId, [internalId]);

    /** 新增模式時提供初始資料，避免 query "__new__" */
    const initial = useMemo<ApiLoaderData<string, SpecMusicalSet> | null>(() => {
        if (!isNew) return null;

        const apiRes: ApiResponse<SpecMusicalSet> = {
            IsSuccess: true,
            Data: empty,
            SysMessage: [],
        };

        return { args: internalKey, apiRes };
    }, [isNew, empty, internalKey]);

    /** 讀 model display name */
    const model = adapter.hooks.useModelDisplayName({
        deps: [],
        onError,
    });

    /** 讀 query data */
    const query = adapter.hooks.useQueryData({
        internalId: internalKey,
        initial,
        deps: [internalKey],
        onError,
    });

    /** 可編輯 form state */
    const [data, setData] = useState<SpecMusicalSet>(empty);

    useEffect(() => {
        if (query.data) {
            setData(query.data);
            return;
        }

        if (isNew) {
            setData(empty);
        }
    }, [query.data, isNew, empty]);

    /** 重抓資料 */
    const refetch = useCallback(() => {
        void query.refetch();
    }, [query]);

    /** 統一 loading */
    const isLoading = Boolean((!isNew && query.isLoading) || model.isLoading);

    /** 統一 error */
    const error = query.errorText ?? model.errorText ?? null;

    return {
        data,
        setFormData: setData,
        isLoading,
        error,
        refetch,
        displayName: (
            model.data ?? {
                ModelId: "",
                ModelDisplayName: "",
                Tables: [],
            } as ModelDisplaySchema
        ),
    };
};

/** Form actions 改用 adapter.useServerActions */
const useSpecMusicalFormActionsByAdapter = (
    adapter: ReturnType<typeof SpecMusicalAdapter>,
    internalId: string,
    formData: SpecMusicalSet,
    opt: SpecMusicalFormActionsOpt,
): ServerFormActions => {
    const isNew = useMemo(() => !internalId, [internalId]);

    /** 建立 server actions */
    const actions = adapter.useServerActions({
        onSuccessByMode: {
            create: () => opt.onBackToList(),
            update: () => opt.onBackToList(),
            delete: () => opt.onBackToList(),
        },
    });

    return {
        Save: async () => {
            if (isNew) {
                await actions.createAsync(formData);
                return;
            }

            await actions.updateAsync(internalId, formData);
        },
        Delete: async () => {
            if (!internalId) return;
            await actions.deleteAsync(internalId);
        },
        Back: opt.onBackToList,
        Preview: () => { /* 目前暫不提供 Preview */ },
        IsSaving: actions.isSaving,
    };
};
//#endregion