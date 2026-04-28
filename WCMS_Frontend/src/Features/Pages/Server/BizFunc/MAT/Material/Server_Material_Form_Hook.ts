import { CategoryAdapter } from "@/Features/Hooks/BizFunc/COMM/Category_Api";
import { TagAdapter } from "@/Features/Hooks/BizFunc/COMM/Tag_Api";
import { MatCategoryAdapter } from "@/Features/Hooks/BizFunc/MAT/MatCategory_Api";
import { MaterialAdapter } from "@/Features/Hooks/BizFunc/MAT/Material_Api";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiAdapterError, ServerFormActions } from "@/SysCore/Utils/API/APIAdapter";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import type { UseFetchDataResult } from "@/SysCore/Utils/API/FetchDataType";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { CategoryFields, MatCategoryInfoFieldDisplayFields, MatCategoryInfoFieldFields, PGID } from "@/types/SchemaFields";
import { useCallback, useEffect, useMemo, useState } from "react";

type QueryListParam = components["schemas"]["QueryListParam"];
type MaterialSet = components["schemas"]["MaterialSet_DTO"];
type MatCategorySet = components["schemas"]["MatCategoryDataSet_DTO"];
type InfoField = components["schemas"]["MatCategoryInfoField_DTO"];
type InfoFieldDisplay = components["schemas"]["MatCategoryInfoFieldDisplay_DTO"];

type InfoFieldWithDisplay = InfoField & { MatCategoryInfoFieldDisplay?: InfoFieldDisplay[] | null; };
type MatCategorySetLike = MatCategorySet & { MatCategoryInfoField?: InfoFieldWithDisplay[] | null; };

export type MaterialFormRawData = {
    formData: UseFetchFormDataResult<MaterialSet>;
    actions: ServerFormActions;
    categoryMap: Record<string, string>;
    tagMap: Record<string, string>;
    infoFields: InfoField[];
    infoFieldDisplays: InfoFieldDisplay[];
};

export type MaterialFormActionsOpt = {
    /** 儲存成功後返回列表 */
    onBackToList: () => void;
};

export type MaterialFormAdapter = {
    Material: ReturnType<typeof MaterialAdapter>;
    MatCategory: ReturnType<typeof MatCategoryAdapter>;
    Category: ReturnType<typeof CategoryAdapter>;
    Tag: ReturnType<typeof TagAdapter>;
};

/** 取得目前選定的類別 Id */
const useSelectedCategoryId = (formData: UseFetchFormDataResult<MaterialSet>): string =>
{
    const categoryId = formData.data?.Material?.CategoryId ?? "";
    return String(categoryId);
};

/** 避免 Query 字串中的雙引號破壞條件 */
const escapeQueryString = (value: string): string =>
{
    return String(value ?? "").replace(/"/g, `""`);
};

/** 建立 MatCategory 物件資訊查詢參數 */
const buildMatCategoryInfoBaseParam = (categoryId: string): QueryListParam =>
{
    const safeCategoryId = escapeQueryString(categoryId.trim());
    const condition = safeCategoryId
        ? `${CategoryFields.ProgId} = "${PGID.Material}" And ${CategoryFields.CategoryId} = "${safeCategoryId}"`
        : `${CategoryFields.CategoryId} = "__NONE__"`;

    return {
        Fields: [
            CategoryFields.CategoryId,
            `${CategoryFields._MatCategoryInfoField}.${MatCategoryInfoFieldFields.RowId}`,
            `${CategoryFields._MatCategoryInfoField}.${MatCategoryInfoFieldFields.Field}`,
            `${CategoryFields._MatCategoryInfoField}.${MatCategoryInfoFieldFields._MatCategoryInfoFieldDisplay}.${MatCategoryInfoFieldDisplayFields.ParentRowId}`,
            `${CategoryFields._MatCategoryInfoField}.${MatCategoryInfoFieldFields._MatCategoryInfoFieldDisplay}.${MatCategoryInfoFieldDisplayFields.Lang}`,
            `${CategoryFields._MatCategoryInfoField}.${MatCategoryInfoFieldFields._MatCategoryInfoFieldDisplay}.${MatCategoryInfoFieldDisplayFields.FieldDisplayName}`,
        ],
        Condition: condition,
        OrderBy: [{ Col: CategoryFields.ModifyTime, Desc: true }],
        PageNumber: 1,
        PageSize: 1,
    };
};

/** 從 MatCategorySet 抽出欄位定義 */
const getInfoFields = (list: MatCategorySet[] | null | undefined): InfoField[] =>
{
    const first = (list?.[0] ?? null) as MatCategorySetLike | null;
    return first?.MatCategoryInfoField ?? [];
};

/** 從 MatCategorySet 抽出欄位顯示名稱 */
const getInfoFieldDisplays = (list: MatCategorySet[] | null | undefined): InfoFieldDisplay[] =>
{
    const rows = getInfoFields(list) as InfoFieldWithDisplay[];
    return rows.flatMap(row => row.MatCategoryInfoFieldDisplay ?? []);
};

/** Material Form 主入口 */
export const useMaterialFormFetchData = (
    opt: { lang: Lang; internalId: string; emptyData: MaterialSet; actionsOpt: MaterialFormActionsOpt; },
): UseFetchDataResult<MaterialFormRawData, MaterialFormAdapter> =>
{
    // 宣告變數
    const { publish } = useToast();

    const onError = useCallback((e: ApiAdapterError) =>
    {
        publish({ level: MessageStatus.Error, title: e.messageText });
    }, [publish]);

    const adapter = useMemo<MaterialFormAdapter>(() =>
    {
        return { Material: MaterialAdapter(), MatCategory: MatCategoryAdapter(), Category: CategoryAdapter(), Tag: TagAdapter() };
    }, []);

    const formData = useMaterialFormDataByAdapter(adapter.Material, opt.internalId, opt.emptyData, onError);

    const selectedCategoryId = useSelectedCategoryId(formData);

    const categoryMapQuery = adapter.Category.hooks.useMapByProgId({ progId: PGID.Material, lang: opt.lang, deps: [opt.lang], onError });

    const tagMapQuery = adapter.Tag.hooks.useMapByProgId({ progId: PGID.Material, lang: opt.lang, deps: [opt.lang], onError });

    const infoBaseParam = useMemo(() =>
    {
        return buildMatCategoryInfoBaseParam(selectedCategoryId);
    }, [selectedCategoryId]);

    const infoGrid = adapter.MatCategory.hooks.useQueryGridData({ baseParam: infoBaseParam, deps: [selectedCategoryId], modelDeps: [], onError });

    useEffect(() =>
    {
        infoGrid.onPageChange(1);
    }, [selectedCategoryId]);

    const infoFields = useMemo(() =>
    {
        return getInfoFields(infoGrid.list);
    }, [infoGrid.list]);

    const infoFieldDisplays = useMemo(() =>
    {
        return getInfoFieldDisplays(infoGrid.list);
    }, [infoGrid.list]);

    const actions = useMaterialFormActionsByAdapter(adapter.Material, opt.internalId, formData.data, opt.emptyData, opt.actionsOpt);

    const isLoading = useMemo(() =>
    {
        return Boolean(formData.isLoading || categoryMapQuery.isLoading || infoGrid.isLoading);
    }, [formData.isLoading, categoryMapQuery.isLoading, infoGrid.isLoading]);

    const errors = useMemo(() =>
    {
        return [formData.error, categoryMapQuery.errorText, ...(infoGrid.errors ?? [])].filter((x): x is string => Boolean(x));
    }, [formData.error, categoryMapQuery.errorText, infoGrid.errors]);

    const rawData = useMemo<MaterialFormRawData>(() =>
    {
        return { formData, actions, categoryMap: categoryMapQuery.map ?? {}, tagMap: tagMapQuery.map ?? {}, infoFields, infoFieldDisplays };
    }, [formData, actions, categoryMapQuery.map, tagMapQuery.map, infoFields, infoFieldDisplays]);

    const refetchData = useCallback(async () =>
    {
        await Promise.all([Promise.resolve(formData.refetch()), Promise.resolve(infoGrid.refetchData())]);
    }, [formData, infoGrid]);

    const refetchRefData = useCallback(async () =>
    {
        await Promise.all([Promise.resolve(categoryMapQuery.refetch()), Promise.resolve(infoGrid.refetchData())]);
    }, [categoryMapQuery, infoGrid]);

    return { adapter, rawData, isLoading, errors, refetchData, refetchRefData };
};

/** FormData：useQueryFormData + editable state */
const useMaterialFormDataByAdapter = (
    adapter: ReturnType<typeof MaterialAdapter>,
    internalId: string,
    empty: MaterialSet,
    onError: (e: ApiAdapterError) => void,
): UseFetchFormDataResult<MaterialSet> =>
{
    const isNew = useMemo(() => !internalId, [internalId]);

    const query = adapter.hooks.useQueryFormData({
        mode: isNew ? "new" : "edit",
        internalId: internalId || undefined,
        empty,
        deps: [internalId],
        modelDeps: [],
        onError,
    });

    const [data, setData] = useState<MaterialSet>(empty);

    useEffect(() =>
    {
        if (query.data) setData(query.data);
        else if (isNew) setData(empty);
    }, [query.data, isNew, empty]);

    const refetch = useCallback(() =>
    {
        void query.refetchData();
    }, [query]);

    return {
        data,
        setFormData: setData,
        isLoading: query.isLoading,
        error: query.errorText,
        refetch,
        displayName: query.modelDisplayName ?? ({ ModelId: "", ModelDisplayName: "", Tables: [] } as ModelDisplaySchema),
    };
};

/** Form Actions：Save / Delete / Back */
const useMaterialFormActionsByAdapter = (
    adapter: ReturnType<typeof MaterialAdapter>,
    internalId: string,
    formData: MaterialSet | null,
    empty: MaterialSet,
    opt: MaterialFormActionsOpt,
): ServerFormActions =>
{
    const isNew = useMemo(() => !internalId, [internalId]);

    const actions = adapter.useServerActions({
        onSuccessByMode: { create: () => opt.onBackToList(), update: () => opt.onBackToList(), delete: () => opt.onBackToList() },
    });

    return {
        Save: async () =>
        {
            const dto = formData ?? empty;
            if (isNew) await actions.createAsync(dto);
            else await actions.updateAsync(internalId, dto);
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
