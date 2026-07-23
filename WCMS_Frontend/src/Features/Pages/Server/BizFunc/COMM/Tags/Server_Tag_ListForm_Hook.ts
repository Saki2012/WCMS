import { TagAdapter } from "@/Features/Hooks/BizFunc/COMM/Tag_Api";
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
import { AccountFields, PGID, TagDataFields, TagDetailFields } from "@/types/SchemaFields";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";

// #region Property
type QueryListParam = components["schemas"]["QueryListParam"];

type TagFormModel = components["schemas"]["TagData"];

type TagListFormRawData = { editForm: UseFetchFormDataResult<TagFormModel>; actions: UseActionsResult; list: TagFormModel[]; param: QueryListParam; };

type TagListFormAdapter = { Tag: ReturnType<typeof TagAdapter>; };
// #endregion

// #region Public
export const useTagListFormFetchData = (
    opt: { dirUrl: string; internalId: string; emptyData: TagFormModel; lang: Lang; pgId: PGID; },
): UseFetchDataResult<TagListFormRawData, TagListFormAdapter> =>
{
    const { publish } = useToast();
    const onError = useCallback((e: ApiAdapterError) =>
    {
        publish({ level: MessageStatus.Error, title: e.messageText });
    }, [publish]);
    const adapter = useMemo(() =>
    {
        return { Tag: TagAdapter() };
    }, []);
    const formData = useTagListFormDataByAdapter(adapter.Tag, opt.internalId, opt.emptyData, onError);
    const baseParam = useTagListQueryParam({ lang: opt.lang, pgId: opt.pgId });
    const grid = adapter.Tag.hooks.useQueryGridData({ baseParam, deps: [baseParam.Condition ?? "", baseParam.PageSize ?? 0], modelDeps: [opt.lang], onError });
    const actions = useTagListFormActionsFromAdapter(opt.dirUrl, adapter.Tag, opt.internalId, formData, opt.emptyData, grid.refetchData);
    const isLoading = useMemo(() =>
    {
        return [grid.isLoading, formData.isLoading].some(Boolean);
    }, [grid.isLoading, formData.isLoading]);
    const errors = useMemo(() =>
    {
        const list = [...(grid.errors ?? []), formData.error];
        return list.filter((x): x is string => Boolean(x));
    }, [grid.errors, formData.error]);
    const rawData = useMemo<TagListFormRawData>(() =>
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
const useTagListFormDataByAdapter = (
    adapter: ReturnType<typeof TagAdapter>,
    internalId: string,
    empty: TagFormModel,
    onError: (e: ApiAdapterError) => void,
): UseFetchFormDataResult<TagFormModel> =>
{
    const internalKey = internalId || "__new__";
    const isNew = useMemo(() => !internalId, [internalId]);
    const initial = useMemo<ApiLoaderData<string, TagFormModel> | null>(() =>
    {
        if (!isNew) return null;
        const apiRes: ApiResponse<TagFormModel> = { IsSuccess: true, Data: empty, SysMessage: [] };
        return { args: internalKey, apiRes };
    }, [isNew, empty, internalKey]);
    const model = adapter.hooks.useModelDisplayName({ deps: [], onError });
    const query = adapter.hooks.useQueryData({ internalId: internalKey, initial, deps: [internalKey], onError });
    const [data, setData] = useState<TagFormModel>(empty);
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

const useTagListFormActionsFromAdapter = (
    dirUrl: string,
    adapter: ReturnType<typeof TagAdapter>,
    internalId: string,
    formData: UseFetchFormDataResult<TagFormModel>,
    emptyData: TagFormModel,
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

const useTagListQueryParam = (p: { lang: Lang; pgId: PGID; }): QueryListParam =>
{
    const fields = useMemo<string[]>(() => [
        TagDataFields.InternalId,
        TagDataFields.TagId,
        TagDataFields.ModifyUserId,
        TagDataFields.ModifyTime,
        `${TagDataFields._TagDetail}.${TagDetailFields.Lang}`,
        `${TagDataFields._TagDetail}.${TagDetailFields.TagName}`,
        `${TagDataFields.ModifyUser}.${AccountFields.AccountName}`,
    ], []);
    const condition = useMemo(() =>
        LibCondition.joinConditions([
            LibCondition.createCondition(`${TagDataFields._TagDetail}.${TagDetailFields.Lang}`, Operator.Equal, p.lang),
            LibCondition.createCondition(TagDataFields.ProgId, Operator.Equal, p.pgId),
        ]), [p.lang, p.pgId]);
    return useMemo(() => ({ Fields: fields, Condition: condition, OrderBy: [{ Col: TagDataFields.CreateTime, Desc: true }] }), [fields, condition]);
};
// #endregion
