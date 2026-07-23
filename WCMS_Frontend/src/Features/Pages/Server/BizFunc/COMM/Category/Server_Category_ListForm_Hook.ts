import { CategoryAdapter } from "@/Features/Hooks/BizFunc/COMM/Category_Api";
import type { UseActionsResult } from "@/Features/Hooks/Common/useActions";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiAdapterError, ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import { type ApiResponse, MessageStatus } from "@/SysCore/Utils/API/APIBase";
import type { UseFetchDataResult } from "@/SysCore/Utils/API/FetchDataType";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import { LibCondition, Operator } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { AccountFields, CategoryDetailFields, CategoryFields, PGID } from "@/types/SchemaFields";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";

// #region Property
type QueryListParam = components["schemas"]["QueryListParam"];

type CategoryFormModel = components["schemas"]["Category"];

type CategoryListFormRawData = { editForm: UseFetchFormDataResult<CategoryFormModel>; actions: UseActionsResult; list: CategoryFormModel[]; param: QueryListParam; };

type CategoryListFormAdapter = { Category: ReturnType<typeof CategoryAdapter>; };
// #endregion

// #region Public
export const useCategoryListFormFetchData = (
    opt: { dirUrl: string; internalId: string; emptyData: CategoryFormModel; lang: Lang; pgId: PGID; },
): UseFetchDataResult<CategoryListFormRawData, CategoryListFormAdapter> =>
{
    const { publish } = useToast();
    const onError = useCallback((e: ApiAdapterError) =>
    {
        publish({ level: MessageStatus.Error, title: e.messageText });
    }, [publish]);
    const adapter = useMemo(() =>
    {
        return { Category: CategoryAdapter() };
    }, []);
    const formData = useCategoryListFormDataByAdapter(adapter.Category, opt.internalId, opt.emptyData, onError);
    const baseParam = useCategoryListQueryParam({ lang: opt.lang, pgId: opt.pgId });
    const grid = adapter.Category.hooks.useQueryGridData({
        baseParam,
        deps: [baseParam.Condition ?? "", baseParam.PageSize ?? 0],
        modelDeps: [opt.lang],
        onError,
    });
    const actions = useCategoryListFormActionsFromAdapter(opt.dirUrl, adapter.Category, opt.internalId, formData, opt.emptyData, grid.refetchData);
    const isLoading = useMemo(() =>
    {
        return [grid.isLoading, formData.isLoading].some(Boolean);
    }, [grid.isLoading, formData.isLoading]);
    const errors = useMemo(() =>
    {
        const list = [...(grid.errors ?? []), formData.error];
        return list.filter((x): x is string => Boolean(x));
    }, [grid.errors, formData.error]);
    const rawData = useMemo<CategoryListFormRawData>(() =>
    {
        return { editForm: formData, actions: actions, list: grid.list ?? [], param: grid.param };
    }, [grid.list, grid.param, formData, actions]);
    const refetchData = useCallback(async () =>
    {
        await grid.refetchData();
    }, [grid]);
    return { adapter, rawData, isLoading, errors, refetchData };
};
// #endregion

// #region Private
const useCategoryListFormDataByAdapter = (
    adapter: ReturnType<typeof CategoryAdapter>,
    internalId: string,
    empty: CategoryFormModel,
    onError: (e: ApiAdapterError) => void,
): UseFetchFormDataResult<CategoryFormModel> =>
{
    const internalKey = internalId || "__new__";
    const isNew = useMemo(() => !internalId, [internalId]);
    const initial = useMemo<ApiLoaderData<string, CategoryFormModel> | null>(() =>
    {
        if (!isNew) return null;
        const apiRes: ApiResponse<CategoryFormModel> = { IsSuccess: true, Data: empty, SysMessage: [] };
        return { args: internalKey, apiRes };
    }, [isNew, empty, internalKey]);
    const model = adapter.hooks.useModelDisplayName({ deps: [], onError });
    const query = adapter.hooks.useQueryData({ internalId: internalKey, initial, deps: [internalKey], onError });
    const [data, setData] = useState<CategoryFormModel>(empty);
    useEffect(() =>
    {
        if (query.data) setData(query.data);
        else if (isNew) setData(empty);
    }, [query.data, isNew, empty]);
    const refetch = useCallback(() =>
    {
        void query.refetch();
    }, [query]);
    const isLoading = Boolean((!isNew && query.isLoading) || model.isLoading);
    const error = query.errorText ?? model.errorText ?? null;
    return {
        data,
        setFormData: setData,
        isLoading,
        error,
        refetch,
        displayName: (model.data ?? ({ ModelId: "", ModelDisplayName: "", Tables: [] } as ModelDisplaySchema)),
    };
};

const useCategoryListFormActionsFromAdapter = (
    dirUrl: string,
    adapter: ReturnType<typeof CategoryAdapter>,
    internalId: string,
    formData: UseFetchFormDataResult<CategoryFormModel>,
    emptyData: CategoryFormModel,
    refetchList: () => Promise<void>,
): UseActionsResult =>
{
    const navigate = useNavigate();
    const isNew = useMemo(() => !internalId, [internalId]);
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
        const dto = formData.data;
        if (!dto) return false;
        const res = isNew ? await server.createAsync(dto) : await server.updateAsync(internalId, dto);
        return Boolean(res.IsSuccess);
    }, [formData.data, isNew, server, internalId]);

    const onDelete = useCallback(async (id: string) =>
    {
        await server.deleteAsync(id);
    }, [server]);

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

const useCategoryListQueryParam = (p: { lang: Lang; pgId: PGID; }): QueryListParam =>
{
    const fields = useMemo<string[]>(() =>
    {
        return [
            CategoryFields.InternalId,
            CategoryFields.CategoryId,
            CategoryFields.ModifyUserId,
            CategoryFields.ModifyTime,
            `${CategoryFields._CategoryDetail}.${CategoryDetailFields.Lang}`,
            `${CategoryFields._CategoryDetail}.${CategoryDetailFields.CategoryName}`,
            `${CategoryFields.ModifyUser}.${AccountFields.AccountName}`,
        ];
    }, []);
    const condition = useMemo(() =>
    {
        return LibCondition.joinConditions([
            LibCondition.createCondition(`${CategoryFields._CategoryDetail}.${CategoryDetailFields.Lang}`, Operator.Equal, p.lang),
            LibCondition.createCondition(CategoryFields.ProgId, Operator.Equal, p.pgId),
        ]);
    }, [p.lang, p.pgId]);
    return useMemo(() =>
    {
        return { Fields: fields, Condition: condition, OrderBy: [{ Col: CategoryFields.CreateTime, Desc: true }] };
    }, [fields, condition]);
};
// #endregion
