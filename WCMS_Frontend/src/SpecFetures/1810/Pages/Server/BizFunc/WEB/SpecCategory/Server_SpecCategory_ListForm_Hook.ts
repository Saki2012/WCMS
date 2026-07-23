// Server_SpecCategory_ListForm_Hook.ts
import type { UseActionsResult } from "@/Features/Hooks/Common/useActions";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import { SpecCategoryAdapter } from "@/SpecFetures/1810/Hooks/WEB/SpecCategory_Api";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiAdapterError, ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import { type ApiResponse, MessageStatus } from "@/SysCore/Utils/API/APIBase";
import type { UseFetchDataResult } from "@/SysCore/Utils/API/FetchDataType";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import { LibCondition, Operator } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { AccountFields, PGID, SpecCategoryDetailFields, SpecCategoryFields } from "@/types/SchemaFields";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";

// #region Property
type QueryListParam = components["schemas"]["QueryListParam"];

type SpecCategoryFormModel = components["schemas"]["SpecCategory"];

type SpecCategoryListFormRawData = {
    editForm: UseFetchFormDataResult<SpecCategoryFormModel>;
    actions: UseActionsResult;
    list: SpecCategoryFormModel[];
    param: QueryListParam;
    showCols: Record<string, string>;
};

type SpecCategoryListFormAdapter = { SpecCategory: ReturnType<typeof SpecCategoryAdapter>; };
// #endregion

// #region Public
export const useSpecCategoryListFormFetchData = (
    opt: { dirUrl: string; internalId: string; emptyData: SpecCategoryFormModel; lang: Lang; pgId: PGID; },
): UseFetchDataResult<SpecCategoryListFormRawData, SpecCategoryListFormAdapter> =>
{
    // 宣告變數
    const { publish } = useToast();

    // 執行 function
    const onError = useCallback((e: ApiAdapterError) =>
    {
        publish({ level: MessageStatus.Error, title: e.messageText });
    }, [publish]);

    const adapter = useMemo<SpecCategoryListFormAdapter>(() =>
    {
        return { SpecCategory: SpecCategoryAdapter() };
    }, []);

    const formData = useSpecCategoryListFormDataByAdapter(adapter.SpecCategory, opt.internalId, opt.emptyData, onError);

    const baseParam = useSpecCategoryListQueryParam({ lang: opt.lang, pgId: opt.pgId });

    const grid = adapter.SpecCategory.hooks.useQueryGridData({
        baseParam,
        deps: [baseParam.Condition ?? "", baseParam.PageSize ?? 0],
        modelDeps: [opt.lang],
        onError,
    });

    // show column items（原本 comp 內的 useEffect + useState）
    const showColQuery = adapter.SpecCategory.hooks.useGetShowColItems({ progId: opt.pgId, deps: [opt.pgId], onError });

    const showCols = useMemo<Record<string, string>>(() =>
    {
        return showColQuery.data ?? {};
    }, [showColQuery.data]);

    const actions = useSpecCategoryListFormActionsFromAdapter(opt.dirUrl, adapter.SpecCategory, opt.internalId, formData, opt.emptyData, grid.refetchData);

    const isLoading = useMemo(() =>
    {
        return [grid.isLoading, formData.isLoading, showColQuery.isLoading].some(Boolean);
    }, [grid.isLoading, formData.isLoading, showColQuery.isLoading]);

    const errors = useMemo(() =>
    {
        const list = [...(grid.errors ?? []), formData.error, showColQuery.errorText];
        return list.filter((x): x is string => Boolean(x));
    }, [grid.errors, formData.error, showColQuery.errorText]);

    const rawData = useMemo<SpecCategoryListFormRawData>(() =>
    {
        return { editForm: formData, actions, list: grid.list ?? [], param: grid.param, showCols };
    }, [formData, actions, grid.list, grid.param, showCols]);

    const refetchData = useCallback(async () =>
    {
        await Promise.all([grid.refetchData(), showColQuery.refetch()]);
    }, [grid, showColQuery]);
    return { adapter, rawData, isLoading, errors, refetchData };
};
// #endregion

// #region Private
const useSpecCategoryListFormDataByAdapter = (
    adapter: ReturnType<typeof SpecCategoryAdapter>,
    internalId: string,
    empty: SpecCategoryFormModel,
    onError: (e: ApiAdapterError) => void,
): UseFetchFormDataResult<SpecCategoryFormModel> =>
{
    // 宣告變數
    const internalKey = internalId || "__new__";
    const isNew = useMemo(() => !internalId, [internalId]);

    const initial = useMemo<ApiLoaderData<string, SpecCategoryFormModel> | null>(() =>
    {
        // 宣告變數
        if (!isNew) return null;

        const apiRes: ApiResponse<SpecCategoryFormModel> = { IsSuccess: true, Data: empty, SysMessage: [] };

        // return
        return { args: internalKey, apiRes };
    }, [isNew, empty, internalKey]);

    // 執行 function
    const model = adapter.hooks.useModelDisplayName({ deps: [], onError });
    const query = adapter.hooks.useQueryData({ internalId: internalKey, initial, deps: [internalKey], onError });

    const [data, setData] = useState<SpecCategoryFormModel>(empty);

    useEffect(() =>
    {
        // 宣告變數
        if (query.data) setData(query.data);
        else if (isNew) setData(empty);
    }, [query.data, isNew, empty]);

    const refetch = useCallback(() =>
    {
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
        displayName: (model.data ?? ({ ModelId: "", ModelDisplayName: "", Tables: [] } as ModelDisplaySchema)),
    };
};

const useSpecCategoryListFormActionsFromAdapter = (
    dirUrl: string,
    adapter: ReturnType<typeof SpecCategoryAdapter>,
    internalId: string,
    formData: UseFetchFormDataResult<SpecCategoryFormModel>,
    emptyData: SpecCategoryFormModel,
    refetchList: () => Promise<void>,
): UseActionsResult =>
{
    // 宣告變數
    const navigate = useNavigate();
    const isNew = useMemo(() => !internalId, [internalId]);

    // 執行 function
    const server = adapter.useServerActions({
        onSuccessByMode: {
            create: async () =>
            {
                navigate(dirUrl);
                await refetchList();
                formData.setFormData(emptyData);
            },
            update: async () =>
            {
                navigate(dirUrl);
                await refetchList();
            },
            delete: async () =>
            {
                navigate(dirUrl);
                await refetchList();
                formData.setFormData(emptyData);
            },
        },
    });

    const onAddNew = useCallback(() =>
    {
        navigate(dirUrl);
    }, [navigate, dirUrl]);

    const onEdit = useCallback((id: string) =>
    {
        navigate(`${dirUrl}/${id}`);
    }, [navigate, dirUrl]);

    const onCancelBack = useCallback(() =>
    {
        navigate(dirUrl);
    }, [navigate, dirUrl]);

    const onSave = useCallback(async () =>
    {
        // 宣告變數
        const dto = formData.data;
        if (!dto) return false;

        // 執行 function
        const res = isNew ? await server.createAsync(dto) : await server.updateAsync(internalId, dto);

        // return
        return Boolean(res.IsSuccess);
    }, [formData.data, isNew, server, internalId]);

    const onDelete = useCallback(async (id: string) =>
    {
        await server.deleteAsync(id);
    }, [server]);

    // return
    return useMemo(() => ({
        isExecuting: server.isSaving,
        onSave,
        onDelete,
        onInvalid: () =>
        {},
        onCancelBack,
        onAddNew,
        onEdit,
        onPreview: () =>
        {},
    }), [server.isSaving, onSave, onDelete, onCancelBack, onAddNew, onEdit]);
};

const useSpecCategoryListQueryParam = (p: { lang: Lang; pgId: PGID; }): QueryListParam =>
{
    // 宣告變數
    const fields = useMemo<string[]>(() => [
        SpecCategoryFields.InternalId,
        SpecCategoryFields.CategoryId,
        SpecCategoryFields.ModifyUserId,
        SpecCategoryFields.ModifyTime,
        `${SpecCategoryFields._SpecCategoryDetail}.${SpecCategoryDetailFields.Lang}`,
        `${SpecCategoryFields._SpecCategoryDetail}.${SpecCategoryDetailFields.CategoryName}`,
        `${SpecCategoryFields.ModifyUser}.${AccountFields.AccountName}`,
    ], []);

    const condition = useMemo(() =>
        LibCondition.joinConditions([
            LibCondition.createCondition(`${SpecCategoryFields._SpecCategoryDetail}.${SpecCategoryDetailFields.Lang}`, Operator.Equal, p.lang),
            LibCondition.createCondition(SpecCategoryFields.ProgId, Operator.Equal, p.pgId),
        ]), [p.lang, p.pgId]);

    return useMemo(() => ({ Fields: fields, Condition: condition, OrderBy: [{ Col: SpecCategoryFields.ModifyTime, Desc: true }] }), [fields, condition]);
};
// #endregion
