import { SpecCategoryAdapter } from "@/SpecFetures/1810/Hooks/WEB/SpecCategory_Api";
import { SpecUSRAdapter } from "@/SpecFetures/1810/Hooks/WEB/SpecUSR_Api";
import type { ColumnConfig } from "@/SysCore/Components/Grid/Grid_Data";
import type { ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import { getSsrApi } from "@/SysCore/Utils/API/APIBase";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { SpecCategoryFields, SpecUSRDetailFields, SpecUSRFields } from "@/types/SchemaFields";
import { useMemo } from "react";
import type { LoaderFunctionArgs } from "react-router-dom";

// #region Property
type QueryListParam = components["schemas"]["QueryListParam"];

type SpecUSRFormModel = components["schemas"]["SpecUSR"];

type SpecCategoryFormModel = components["schemas"]["SpecCategory"];


const formVisibleKeys: ReadonlyArray<readonly [string, string]> = [
    ["", SpecUSRFields.PictureId],
    [SpecUSRFields._SpecUSRDetail, SpecUSRDetailFields.Year],
    [SpecUSRFields._SpecUSRDetail, SpecUSRDetailFields.AcademicYear],
    [SpecUSRFields._SpecUSRDetail, SpecUSRDetailFields.Courses],
    [SpecUSRFields._SpecUSRDetail, SpecUSRDetailFields.PracticeField],
    [SpecUSRFields._SpecUSRDetail, SpecUSRDetailFields.ProjectName],
    [SpecUSRFields._SpecUSRDetail, SpecUSRDetailFields.ExternalCooperationUnit],
    [SpecUSRFields._SpecUSRDetail, SpecUSRDetailFields.Department],
    [SpecUSRFields._SpecUSRDetail, SpecUSRDetailFields.PlanAmount],
    [SpecUSRFields._SpecUSRDetail, SpecUSRDetailFields.DuringExecution],
    [SpecUSRFields._SpecUSRDetail, SpecUSRDetailFields.ExecutionStrategy],
    [SpecUSRFields._SpecUSRDetail, SpecUSRDetailFields.ContentIntroduction],
    [SpecUSRFields._SpecUSRDetail, SpecUSRDetailFields.ProjectConcept],
    [SpecUSRFields._SpecUSRDetail, SpecUSRDetailFields.ProjectHighlights],
    [SpecUSRFields._SpecUSRDetail, SpecUSRDetailFields.ProjectLeader],
    [SpecUSRFields._SpecUSRDetail, SpecUSRDetailFields.ProjectSubLeader],
    [SpecUSRFields._SpecUSRDetail, SpecUSRDetailFields.Cohost1],
    [SpecUSRFields._SpecUSRDetail, SpecUSRDetailFields.Cohost2],
    [SpecUSRFields._SpecUSRDetail, SpecUSRDetailFields.Commissioned],
    [SpecUSRFields._SpecUSRDetail, SpecUSRDetailFields.AttendTeam],
    [SpecUSRFields._SpecUSRDetail, SpecUSRDetailFields.Remark],
    [SpecUSRFields._SpecUSRDetail, SpecUSRDetailFields.ProjectItem],
];


/** loader args */
export interface SpecUSRFormLoaderArgs
{
    internalId: string;
    categoryParam: QueryListParam;
}


/** loader res */
export interface SpecUSRFormLoaderRes
{
    dataRes: SpecUSRFormModel | null;
    categoryRes: SpecCategoryFormModel[];
    displayNameRes: ModelDisplaySchema[] | null;
}


export interface SpecUSRFormLoaderData
{
    args: SpecUSRFormLoaderArgs;
    res: SpecUSRFormLoaderRes;
}


export interface UseSpecUSRFormFetchDataArgs
{
    internalId: string;
    emptyData: SpecUSRFormModel;
    loaderData?: SpecUSRFormLoaderData | null;
}


export interface SpecUSRFormFetchData
{
    formData: SpecUSRFormModel;
    showColumns: string[];
    showColTitle: ColumnConfig[];
}
// #endregion

// #region Public
/** ✅ SSR loader：預載 SpecUSR_Form 所需主資料 / 顯示欄位 / 欄位標題 */
export const SpecUSRForm_Loader = () => async ({ request, params }: LoaderFunctionArgs): Promise<SpecUSRFormLoaderData> =>
{
    // 宣告變數
    const internalId = `${params?.internalId ?? ""}`.trim();
    const ssrApi = getSsrApi(request);
    const usr = SpecUSRAdapter(ssrApi);
    const cate = SpecCategoryAdapter(ssrApi);

    if (!internalId)
    {
        return { args: { internalId, categoryParam: buildEmptySpecCategoryQuery() }, res: { dataRes: null, categoryRes: [], displayNameRes: null } };
    }

    // 執行 function：先抓主資料與欄位標題 schema
    const dataLoader = usr.loader.createQueryDataLoader({ getInternalId: () => internalId, getApiInstance: () => ssrApi });
    const displayNameLoader = usr.loader.createModelDisplayNameLoader({ getApiInstance: () => ssrApi });

    const [dataLD, displayNameLD] = await Promise.all([
        dataLoader({ request, params } as LoaderFunctionArgs),
        displayNameLoader({ request, params } as LoaderFunctionArgs),
    ]);

    const dataRes = dataLD.apiRes.Data ?? null;
    const categoryId = `${dataRes?.CategoryId ?? ""}`.trim();
    const categoryParam = buildSpecCategoryQuery(categoryId);

    // 執行 function：依主資料的 categoryId 再抓顯示欄位
    const categoryLoader = cate.loader.createQueryListLoader({ getCondition: () => categoryParam, getApiInstance: () => ssrApi });
    const categoryLD = await categoryLoader({ request, params } as LoaderFunctionArgs);

    // return
    return {
        args: { internalId, categoryParam },
        res: { dataRes, categoryRes: categoryLD.apiRes.Data ?? [], displayNameRes: displayNameLD.apiRes.Data ?? null },
    };
};


/** ✅ CSR 主入口：集中 SpecUSR_Form 所需 hooks / hydration initial */
export const useSpecUSRFormFetchData = (opt: UseSpecUSRFormFetchDataArgs) =>
{
    // 宣告變數
    const adapter = useMemo(() => ({ usr: SpecUSRAdapter(), cate: SpecCategoryAdapter() }), []);
    const safeInternalId = `${opt.internalId ?? ""}`.trim();
    const internalKey = safeInternalId || "__empty__";

    const initialData = useMemo(() => buildDataInitial({ internalId: safeInternalId, emptyData: opt.emptyData, loaderData: opt.loaderData }), [
        safeInternalId,
        opt.emptyData,
        opt.loaderData,
    ]);
    const initialDisplayName = useMemo(() => buildDisplayNameInitial(opt.loaderData), [opt.loaderData]);

    // 執行 function：主資料 / 顯示 schema
    const useData = adapter.usr.hooks.useQueryData({ internalId: internalKey, initial: initialData, deps: [internalKey] });
    const useDisplayName = adapter.usr.hooks.useModelDisplayName({ initial: initialDisplayName, deps: [] });

    const categoryId = `${useData.data?.CategoryId ?? opt.loaderData?.res?.dataRes?.CategoryId ?? ""}`.trim();
    const categoryParam = useMemo(() => buildSpecCategoryQuery(categoryId), [categoryId]);
    const initialCategory = useMemo(() => buildCategoryInitial({ categoryParam, loaderData: opt.loaderData }), [categoryParam, opt.loaderData]);

    // 執行 function：顯示欄位設定
    const useCategory = adapter.cate.hooks.useQueryList({ condition: categoryParam, initial: initialCategory, deps: [categoryId] });

    const showColumns = useMemo(() =>
    {
        return buildShowColumnItems(useCategory.data?.[0]?.ShowColumnItems ?? "");
    }, [useCategory.data]);

    const showColTitle = useMemo(() =>
    {
        return buildVisibleColumns(useDisplayName.data, formVisibleKeys);
    }, [useDisplayName.data]);

    const rawData = useMemo<SpecUSRFormFetchData>(() =>
    {
        return { formData: useData.data ?? opt.emptyData, showColumns, showColTitle };
    }, [useData.data, opt.emptyData, showColumns, showColTitle]);

    const isLoading = useMemo(() =>
    {
        return Boolean(useData.isLoading || useCategory.isLoading || useDisplayName.isLoading);
    }, [useData.isLoading, useCategory.isLoading, useDisplayName.isLoading]);

    const errors = useMemo(() =>
    {
        return [useData.errorText, useCategory.errorText, useDisplayName.errorText].filter((p): p is string => Boolean(p));
    }, [useData.errorText, useCategory.errorText, useDisplayName.errorText]);

    // return
    return { rawData, isLoading, errors, refetchData: useData.refetch, refetchRefData: useCategory.refetch };
};
// #endregion

// #region Private
const buildEmptySpecCategoryQuery = (): QueryListParam =>
{
    // return：避免沒 categoryId 時打出整包資料
    return {
        Fields: [
            SpecCategoryFields.InternalId,
            SpecCategoryFields.CategoryId,
            SpecCategoryFields.ProgId,
            SpecCategoryFields.ShowColumnItems,
        ],
        Condition: "1=0",
        PageNumber: 0,
        PageSize: 0,
    };
};


const buildSpecCategoryQuery = (categoryId: string): QueryListParam =>
{
    // 宣告變數
    const safeCategoryId = `${categoryId ?? ""}`.trim();
    if (!safeCategoryId) return buildEmptySpecCategoryQuery();

    // return
    return {
        Fields: [
            SpecCategoryFields.InternalId,
            SpecCategoryFields.CategoryId,
            SpecCategoryFields.ProgId,
            SpecCategoryFields.ShowColumnItems,
        ],
        Condition: `${SpecCategoryFields.CategoryId} = ${safeCategoryId}`,
        PageNumber: 0,
        PageSize: 0,
    };
};



const buildShowColumnItems = (raw?: string | null): string[] =>
{
    // 宣告變數
    const supported = new Set(formVisibleKeys.map(([, columnId]) => columnId));
    const seen = new Set<string>();
    const items = parseShowColumnItems(raw ?? "");

    // return
    return items.map(item => `${item}`.split(".").pop()?.trim() ?? "").filter(item => item && supported.has(item) && !seen.has(item)).map(item => (seen.add(item), item));
};


const parseShowColumnItems = (raw: string): string[] =>
{
    // 執行 function
    if (!raw) return [];
    if (raw.startsWith("[") && raw.endsWith("]")) return safeParseJsonArray(raw) ?? [];

    // return
    return raw.split(/[,;|]/g).map(item => item.trim()).filter(Boolean);
};


const safeParseJsonArray = (raw: string): string[] | null =>
{
    try
    {
        const parsed = JSON.parse(raw) as unknown;
        if (!Array.isArray(parsed)) return null;
        return parsed.filter((item): item is string => typeof item === "string").map(item => item.trim()).filter(Boolean);
    } catch
    {
        return null;
    }
};

const buildVisibleColumns = (schema: ModelDisplaySchema | null | undefined, visibleKeys: ReadonlyArray<readonly [string, string]>): ColumnConfig[] =>
{
    // 宣告變數
    if (!schema?.Tables?.length || visibleKeys.length === 0) return [];

    // return
    return visibleKeys.map(([tableId, columnId]) =>
    {
        const table = schema.Tables.find(p => p.TableId === tableId);
        const column = table?.Columns.find(p => p.ColumnId === columnId);
        if (!column) return null;
        return { key: column.ColumnId, title: column.ColumnDisplayName } as ColumnConfig;
    }).filter((p): p is ColumnConfig => p !== null);
};


const buildDataInitial = (
    p: { internalId: string; emptyData: SpecUSRFormModel; loaderData?: SpecUSRFormLoaderData | null; },
): ApiLoaderData<string, SpecUSRFormModel> | null =>
{
    // 宣告變數
    const safeInternalId = `${p.internalId ?? ""}`.trim();
    const internalKey = safeInternalId || "__empty__";

    if (!safeInternalId)
    {
        return { args: internalKey, apiRes: { IsSuccess: true, Data: p.emptyData, SysMessage: [] } };
    }

    if (!p.loaderData?.args?.internalId || p.loaderData.args.internalId !== safeInternalId) return null;

    // return
    return { args: internalKey, apiRes: { IsSuccess: true, Data: p.loaderData.res.dataRes ?? p.emptyData, SysMessage: [] } };
};


const buildCategoryInitial = (
    p: { categoryParam: QueryListParam; loaderData?: SpecUSRFormLoaderData | null; },
): ApiLoaderData<QueryListParam, SpecCategoryFormModel[]> | null =>
{
    // 宣告變數
    if (!p.loaderData?.args?.categoryParam) return null;

    const currentKey = JSON.stringify(p.categoryParam ?? null);
    const initialKey = JSON.stringify(p.loaderData.args.categoryParam ?? null);
    if (currentKey !== initialKey) return null;

    // return
    return { args: p.loaderData.args.categoryParam, apiRes: { IsSuccess: true, Data: p.loaderData.res.categoryRes ?? [], SysMessage: [] } };
};


const buildDisplayNameInitial = (loaderData?: SpecUSRFormLoaderData | null): ApiLoaderData<null, ModelDisplaySchema[]> | null =>
{
    // 宣告變數
    if (!loaderData?.res?.displayNameRes) return null;

    // return
    return { args: null, apiRes: { IsSuccess: true, Data: loaderData.res.displayNameRes, SysMessage: [] } };
};
// #endregion
