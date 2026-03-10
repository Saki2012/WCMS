// Server_SpecCategory_ListForm_Hook.ts
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiAdapterError, ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import { MessageStatus, type ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { UseFetchDataResult } from "@/SysCore/Utils/API/FetchDataType";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import type { UseActionsResult } from "@/Features/Hooks/Common/useActions";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import type { components } from "@/types/api";
import { AccountFields, PGID, SpecCategoryDetailModelFields, SpecCategoryModelFields, } from "@/types/SchemaFields";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { SpecCategoryAdapter } from "@/SpecFetures/1810/Hooks/SpecCategory/SpecCategory_Api";
type QueryListParam = components["schemas"]["QueryListParam"];
type SpecCategorySet = components["schemas"]["SpecCategorySet_DTO"];

type SpecCategoryListFormRawData = {
  editForm: UseFetchFormDataResult<SpecCategorySet>;
  actions: UseActionsResult;
  list: SpecCategorySet[];
  param: QueryListParam;
  showCols: Record<string, string>;
};

type SpecCategoryListFormAdapter = {
  SpecCategory: ReturnType<typeof SpecCategoryAdapter>;
};

//#region Public
export const useSpecCategoryListFormFetchData = (opt: {
  dirUrl: string;
  internalId: string;
  emptyData: SpecCategorySet;
  lang: Lang;
  pgId: PGID;
}): UseFetchDataResult<SpecCategoryListFormRawData, SpecCategoryListFormAdapter> =>
{
  // 宣告變數
  const { publish } = useToast();

  // 執行 function
  const onError = useCallback(
    (e: ApiAdapterError) =>
    {
      publish({ level: MessageStatus.Error, title: e.messageText });
    },
    [publish],
  );

  const adapter = useMemo<SpecCategoryListFormAdapter>(() =>
  {
    return { SpecCategory: SpecCategoryAdapter() };
  }, []);

  const formData = useSpecCategoryListFormDataByAdapter(
    adapter.SpecCategory,
    opt.internalId,
    opt.emptyData,
    onError,
  );

  const baseParam = useSpecCategoryListQueryParam({ lang: opt.lang, pgId: opt.pgId });

  const grid = adapter.SpecCategory.hooks.useQueryGridData({
    baseParam,
    deps: [baseParam.Condition ?? "", baseParam.PageSize ?? 0],
    modelDeps: [opt.lang],
    onError,
  });

  // show column items（原本 comp 內的 useEffect + useState）
  const showColQuery = adapter.SpecCategory.hooks.useGetShowColItems({
    progId: opt.pgId,
    deps: [opt.pgId],
    onError,
  });

  const showCols = useMemo<Record<string, string>>(() =>
  {
    const first = (showColQuery.data ?? [])[0];
    return first ?? {};
  }, [showColQuery.data]);

  const actions = useSpecCategoryListFormActionsFromAdapter(
    opt.dirUrl,
    adapter.SpecCategory,
    opt.internalId,
    formData,
    opt.emptyData,
    grid.refetchData,
  );

  const isLoading = useMemo(() =>
  {
    return [grid.isLoading, formData.isLoading, showColQuery.isLoading].some(Boolean);
  }, [grid.isLoading, formData.isLoading, showColQuery.isLoading]);

  const errors = useMemo(() =>
  {
    const list = [
      ...(grid.errors ?? []),
      formData.error,
      showColQuery.errorText,
    ];
    return list.filter((x): x is string => Boolean(x));
  }, [grid.errors, formData.error, showColQuery.errorText]);

  const rawData = useMemo<SpecCategoryListFormRawData>(() =>
  {
    return {
      editForm: formData,
      actions,
      list: grid.list ?? [],
      param: grid.param,
      showCols,
    };
  }, [formData, actions, grid.list, grid.param, showCols]);

  const refetchData = useCallback(async () =>
  {
    await Promise.all([grid.refetchData(), showColQuery.refetch()]);
  }, [grid, showColQuery]);
  return { adapter, rawData, isLoading, errors, refetchData };
};
//#endregion

//#region Private
const useSpecCategoryListFormDataByAdapter = (
  adapter: ReturnType<typeof SpecCategoryAdapter>,
  internalId: string,
  empty: SpecCategorySet,
  onError: (e: ApiAdapterError) => void,
): UseFetchFormDataResult<SpecCategorySet> =>
{
  // 宣告變數
  const internalKey = internalId || "__new__";
  const isNew = useMemo(() => !internalId, [internalId]);

  const initial = useMemo<ApiLoaderData<string, SpecCategorySet> | null>(() =>
  {
    // 宣告變數
    if (!isNew) return null;

    const apiRes: ApiResponse<SpecCategorySet> = {
      IsSuccess: true,
      Data: empty,
      SysMessage: [],
    };

    // return
    return { args: internalKey, apiRes };
  }, [isNew, empty, internalKey]);

  // 執行 function
  const model = adapter.hooks.useModelDisplayName({ deps: [], onError });
  const query = adapter.hooks.useQueryData({
    internalId: internalKey,
    initial,
    deps: [internalKey],
    onError,
  });

  const [data, setData] = useState<SpecCategorySet>(empty);

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
    displayName: (model.data ??
      ({
        ModelId: "",
        ModelDisplayName: "",
        Tables: [],
      } as ModelDisplaySchema)),
  };
};

const useSpecCategoryListFormActionsFromAdapter = (
  dirUrl: string,
  adapter: ReturnType<typeof SpecCategoryAdapter>,
  internalId: string,
  formData: UseFetchFormDataResult<SpecCategorySet>,
  emptyData: SpecCategorySet,
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

  const onEdit = useCallback(
    (id: string) =>
    {
      navigate(`${dirUrl}/${id}`);
    },
    [navigate, dirUrl],
  );

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
    const res = isNew
      ? await server.createAsync(dto)
      : await server.updateAsync(internalId, dto);

    // return
    return Boolean(res.IsSuccess);
  }, [formData.data, isNew, server, internalId]);

  const onDelete = useCallback(async (id: string) =>
  {
    await server.deleteAsync(id);
  }, [server]);

  // return
  return useMemo(
    () =>
    ({
      isExecuting: server.isSaving,
      onSave,
      onDelete,
      onInvalid: () => {},
      onCancelBack,
      onAddNew,
      onEdit,
      onPreview: () => {},
    }),
    [server.isSaving, onSave, onDelete, onCancelBack, onAddNew, onEdit],
  );
};

const useSpecCategoryListQueryParam = (p: { lang: Lang; pgId: PGID }): QueryListParam =>
{
  // 宣告變數
  const fields = useMemo<string[]>(() =>
  {
    return [SpecCategoryModelFields.InternalId,SpecCategoryModelFields.CategoryId,SpecCategoryModelFields.ModifyUserId,SpecCategoryModelFields.ModifyTime,
      `${SpecCategoryModelFields._SpecCategoryDetail}.${SpecCategoryDetailModelFields.Lang}`,
      `${SpecCategoryModelFields._SpecCategoryDetail}.${SpecCategoryDetailModelFields.CategoryName}`,
      `${SpecCategoryModelFields.ModifyUser}.${AccountFields.AccountName}`,
    ];
  }, []);

  const condition = useMemo(() =>
  {
    let cdt = `${SpecCategoryModelFields._SpecCategoryDetail}.${SpecCategoryDetailModelFields.Lang} = "${p.lang}"`;
    cdt = LibMerge(" And ", false, cdt, `${SpecCategoryModelFields.ProgId} = "${p.pgId}"`);
    return cdt;
  }, [p.lang, p.pgId]);

  // return
  return useMemo(() =>
  {
    return {
      Fields: fields,
      Condition: condition,
      OrderBy: [{ Col: SpecCategoryModelFields.ModifyTime, Desc: true }],
    };
  }, [fields, condition]);
};
//#endregion