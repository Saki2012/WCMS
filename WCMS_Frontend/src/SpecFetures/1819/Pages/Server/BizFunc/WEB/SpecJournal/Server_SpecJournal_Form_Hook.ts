import { TagAdapter } from "@/Features/Hooks/BizFunc/COMM/Tag_Api";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import { SpecJournalAdapter } from "@/SpecFetures/1819/Hooks/BizFunc/WEB/SpecJournal_Api";
import { SpecJournalIndexAdapter } from "@/SpecFetures/1819/Hooks/BizFunc/WEB/SpecJournalIndex_Api";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiAdapterError, ApiLoaderData, ServerFormActions } from "@/SysCore/Utils/API/APIAdapter";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import type { UseFetchDataResult } from "@/SysCore/Utils/API/FetchDataType";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import { useFetchEnumOptions } from "@/SysCore/Utils/API/SystemAPI_Hook";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import {
    PGID,
    SpecJournalIndexDetailFields,
    SpecJournalIndexModelFields,
    SpecJournalKeywordsFields,
    SpecJournalModelFields,
} from "@/types/SchemaFields";
import { useCallback, useEffect, useMemo, useState } from "react";

type SpecJournalSet = components["schemas"]["SpecJournalSet_DTO"];
type SpecJournalIndexSet = components["schemas"]["SpecJournalIndexSet_DTO"];
export type SpecJournalMode = "preprint" | "journal";
// #region Public
export type SpecJournalFormRawData = {
    formData: UseFetchFormDataResult<SpecJournalSet>;
    indexRawData: SpecJournalIndexSet[];
    tagOptionsRaw: Record<string, string>;
    specDocumentTypeOptionsRaw: Map<string, string>;
    keywords: SpecJournalSet[];
    actions: ServerFormActions;
};

export type SpecJournalFormActionsOpt = {
    /** 儲存成功後回到列表 */
    onBackToList: () => void;
};

export type SpecJournalFormAdapter = {
    SpecJournal: ReturnType<typeof SpecJournalAdapter>;
    SpecJournalIndex: ReturnType<typeof SpecJournalIndexAdapter>;
    Tag: ReturnType<typeof TagAdapter>;
};

/** ✅ 主入口：Server SpecJournal Form 的資料讀取都集中在這裡 */
export const useSpecJournalFormFetchData = (
    opt: {
        lang: Lang;
        internalId: string;
        emptyData: SpecJournalSet;
        actionsOpt: SpecJournalFormActionsOpt;
    },
): UseFetchDataResult<SpecJournalFormRawData, SpecJournalFormAdapter> =>
{
    const { publish } = useToast();
    const onError = useCallback((e: ApiAdapterError) =>
    {
        publish({ level: MessageStatus.Error, title: e.messageText });
    }, [publish]);
    const adapter = useMemo<SpecJournalFormAdapter>(() =>
    {
        return { SpecJournal: SpecJournalAdapter(), SpecJournalIndex: SpecJournalIndexAdapter(), Tag: TagAdapter() };
    }, []);
    const formData = useSpecJournalFormDataByAdapter(adapter.SpecJournal, opt.internalId, opt.emptyData, onError);
    const actions = useSpecJournalFormActionsByAdapter(
        adapter.SpecJournal,
        opt.internalId,
        formData.data,
        opt.actionsOpt,
    );
    const tag = adapter.Tag.hooks.useMapByProgId({ progId: PGID.SpecJournal, lang: opt.lang });
    const indexList = useSpecJournalIndexListByAdapter(adapter.SpecJournalIndex);
    const keywords = useSpecJournalKeywordsByAdapter(adapter.SpecJournal);
    const specDocumentType = useFetchEnumOptions("SpecDocumentType");
    const isLoading = useMemo<boolean>(() =>
    {
        return formData.isLoading || tag.isLoading || indexList.isLoading || keywords.isLoading
            || specDocumentType.isLoading;
    }, [formData.isLoading, tag.isLoading, indexList.isLoading, keywords.isLoading, specDocumentType.isLoading]);
    const errorList = useMemo<(string | null | undefined)[]>(() =>
    {
        return [formData.error, tag.errorText, indexList.error, keywords.error, specDocumentType.error];
    }, [formData.error, tag.errorText, indexList.error, keywords.error, specDocumentType.error]);
    const errors = useMemo(() => errorList.filter((x): x is string => Boolean(x)), [errorList]);
    const rawData = useMemo<SpecJournalFormRawData>(() =>
    {
        return {
            formData,
            indexRawData: indexList.rawData ?? [],
            tagOptionsRaw: tag.map ?? {},
            specDocumentTypeOptionsRaw: new Map<string, string>(Object.entries(specDocumentType.data ?? {})),
            keywords: keywords.rawData ?? [],
            actions,
        };
    }, [formData, indexList.rawData, tag.map, keywords.rawData, actions]);
    const refetchData = useCallback(async () =>
    {
        await Promise.resolve(formData.refetch());
    }, [formData]);
    const refetchRefData = useCallback(async () =>
    {
        await Promise.all([tag.refetch(), indexList.refetch(), keywords.refetch()]);
    }, [tag, indexList, keywords]);
    return { adapter, rawData, isLoading, errors, refetchData, refetchRefData };
};
// #endregion

// #region Private
/** ✅ FormData：QueryData + ModelDisplayName（含 editable state） */
const useSpecJournalFormDataByAdapter = (
    adapter: ReturnType<typeof SpecJournalAdapter>,
    internalId: string,
    empty: SpecJournalSet,
    onError: (e: ApiAdapterError) => void,
): UseFetchFormDataResult<SpecJournalSet> =>
{
    // 宣告變數
    const internalKey = internalId || "__new__";
    const isNew = useMemo(() => !internalId, [internalId]);

    const initial = useMemo<ApiLoaderData<string, SpecJournalSet> | null>(() =>
    {
        // 新建才提供 initial，避免 query "__new__"
        if (!isNew) return null;

        const apiRes: ApiResponse<SpecJournalSet> = {
            IsSuccess: true,
            Data: empty,
            SysMessage: [],
        };

        // return
        return { args: internalKey, apiRes };
    }, [isNew, empty, internalKey]);

    const model = adapter.hooks.useModelDisplayName({
        deps: [],
        onError,
    });

    const query = adapter.hooks.useQueryData({
        internalId: internalKey,
        initial,
        deps: [internalKey],
        onError,
    });

    const [data, setData] = useState<SpecJournalSet>(empty);

    useEffect(() =>
    {
        // 執行 function：QueryData 回來後同步到可編輯 state
        if (query.data) setData(query.data);
        else if (isNew) setData(empty);
    }, [query.data, isNew, empty]);

    const refetch = useCallback(() =>
    {
        // 執行 function
        void query.refetch();
    }, [query]);

    const isLoading = Boolean((!isNew && query.isLoading) || model.isLoading);
    const error = query.errorText ?? model.errorText ?? null;

    // return
    return {
        data,
        setFormData: setData,
        isLoading,
        error,
        refetch,
        displayName: (model.data ?? {
            ModelId: "",
            ModelDisplayName: "",
            Tables: [],
        } as ModelDisplaySchema),
    };
};

/** ✅ Actions：改用 Adapter.useServerActions */
const useSpecJournalFormActionsByAdapter = (
    adapter: ReturnType<typeof SpecJournalAdapter>,
    internalId: string,
    formData: SpecJournalSet,
    opt: SpecJournalFormActionsOpt,
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

/** ✅ Index 下拉資料 */
const useSpecJournalIndexListByAdapter = (
    adapter: ReturnType<typeof SpecJournalIndexAdapter>,
): {
    rawData: SpecJournalIndexSet[];
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
} =>
{
    // 宣告變數
    const q = adapter.hooks.useQueryList({
        condition: {
            Fields: [
                SpecJournalIndexModelFields.IndexId,
                SpecJournalIndexModelFields.IndexName,
                `${SpecJournalIndexModelFields._SpecJournalIndexDetail}.${SpecJournalIndexDetailFields.RowId}`,
                `${SpecJournalIndexModelFields._SpecJournalIndexDetail}.${SpecJournalIndexDetailFields.Volume}`,
                `${SpecJournalIndexModelFields._SpecJournalIndexDetail}.${SpecJournalIndexDetailFields.Issue}`,
            ],
            Condition: "",
            OrderBy: [{ Col: SpecJournalIndexModelFields.IndexName, Desc: true }],
            PageNumber: 0,
            PageSize: 0,
        },
        deps: [],
    });

    const refetch = useCallback(async () =>
    {
        // 執行 function
        await q.refetch();
    }, [q]);

    // return
    return {
        rawData: q.data ?? [],
        isLoading: q.isLoading,
        error: q.errorText,
        refetch,
    };
};

/** ✅ 關鍵字建議來源資料 */
const useSpecJournalKeywordsByAdapter = (
    adapter: ReturnType<typeof SpecJournalAdapter>,
): { rawData: SpecJournalSet[]; isLoading: boolean; error: string | null; refetch: () => Promise<void>; } =>
{
    // 宣告變數
    const q = adapter.hooks.useQueryList({
        condition: {
            Fields: [
                `${SpecJournalModelFields._SpecJournalKeywords}.${SpecJournalKeywordsFields.LangCode}`,
                `${SpecJournalModelFields._SpecJournalKeywords}.${SpecJournalKeywordsFields.Keyword}`,
            ],
            Condition: "",
            OrderBy: [{ Col: SpecJournalIndexModelFields.CreateTime, Desc: true }],
            PageNumber: 0,
            PageSize: 0,
        },
        deps: [],
    });

    const refetch = useCallback(async () =>
    {
        await q.refetch();
    }, [q]);

    // return
    return {
        rawData: q.data ?? [],
        isLoading: q.isLoading,
        error: q.errorText,
        refetch,
    };
};
// #endregion
