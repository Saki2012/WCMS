import { SpecCategoryAdapter } from "@/SpecFetures/1810/Hooks/SpecCategory/SpecCategory_Api";
import { SpecUSRAdapter } from "@/SpecFetures/1810/Hooks/SpecUSR/SpecUSR_Api";
import type { ColumnConfig } from "@/SysCore/Components/Grid/Grid_Data";
import type { ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import { getSsrApi } from "@/SysCore/Utils/API/APIBase";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import {
    SpecCategoryModelFields,
    SpecUSRDetailFields,
    SpecUSRModelFields,
    SpecUSRSetFields,
} from "@/types/SchemaFields";
import { useMemo } from "react";
import type { LoaderFunctionArgs } from "react-router-dom";

type QueryListParam = components["schemas"]["QueryListParam"];
type SpecUSRSet = components["schemas"]["SpecUSRSet_DTO"];
type SpecCategorySet = components["schemas"]["SpecCategorySet_DTO"];

const formVisibleKeys: ReadonlyArray<readonly [string, string]> = [
    [SpecUSRSetFields.SpecUSR, SpecUSRModelFields.PictureId],
    [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.Year],
    [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.AcademicYear],
    [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.Courses],
    [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.PracticeField],
    [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.ProjectName],
    [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.ExternalCooperationUnit],
    [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.Department],
    [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.PlanAmount],
    [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.DuringExecution],
    [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.ExecutionStrategy],
    [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.ContentIntroduction],
    [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.ProjectConcept],
    [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.ProjectHighlights],
    [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.ProjectLeader],
    [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.ProjectSubLeader],
    [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.Cohost1],
    [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.Cohost2],
    [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.Commissioned],
    [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.AttendTeam],
    [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.Remark],
    [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.ProjectItem],
    [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.Url],
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
    dataRes: SpecUSRSet | null;
    categoryRes: SpecCategorySet[];
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
    emptyData: SpecUSRSet;
    loaderData?: SpecUSRFormLoaderData | null;
}

export interface SpecUSRFormFetchData
{
    formData: SpecUSRSet;
    showColumns: string[];
    showColTitle: ColumnConfig[];
}

const buildEmptySpecCategoryQuery = (): QueryListParam =>
{
    // return：避免沒 categoryId 時打出整包資料
    return {
        Fields: [
            SpecCategoryModelFields.InternalId,
            SpecCategoryModelFields.CategoryId,
            SpecCategoryModelFields.ProgId,
            SpecCategoryModelFields.ShowColumnItems,
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
            SpecCategoryModelFields.InternalId,
            SpecCategoryModelFields.CategoryId,
            SpecCategoryModelFields.ProgId,
            SpecCategoryModelFields.ShowColumnItems,
        ],
        Condition: `${SpecCategoryModelFields.CategoryId} = ${safeCategoryId}`,
        PageNumber: 0,
        PageSize: 0,
    };
};

const buildVisibleColumns = (
    schema: ModelDisplaySchema | null | undefined,
    visibleKeys: ReadonlyArray<readonly [string, string]>,
): ColumnConfig[] =>
{
    // 宣告變數
    if (!schema?.Tables?.length || visibleKeys.length === 0) return [];

    // return
    return visibleKeys
        .map(([tableId, columnId]) =>
        {
            const table = schema.Tables.find(p => p.TableId === tableId);
            const column = table?.Columns.find(p => p.ColumnId === columnId);
            if (!column) return null;
            return { key: column.ColumnId, title: column.ColumnDisplayName } as ColumnConfig;
        })
        .filter((p): p is ColumnConfig => p !== null);
};

const buildDataInitial = (
    p: { internalId: string; emptyData: SpecUSRSet; loaderData?: SpecUSRFormLoaderData | null; },
): ApiLoaderData<string, SpecUSRSet> | null =>
{
    // 宣告變數
    const safeInternalId = `${p.internalId ?? ""}`.trim();
    const internalKey = safeInternalId || "__empty__";

    if (!safeInternalId)
    {
        return {
            args: internalKey,
            apiRes: { IsSuccess: true, Data: p.emptyData, SysMessage: [] },
        };
    }

    if (!p.loaderData?.args?.internalId || p.loaderData.args.internalId !== safeInternalId) return null;

    // return
    return {
        args: internalKey,
        apiRes: { IsSuccess: true, Data: p.loaderData.res.dataRes ?? p.emptyData, SysMessage: [] },
    };
};

const buildCategoryInitial = (
    p: { categoryParam: QueryListParam; loaderData?: SpecUSRFormLoaderData | null; },
): ApiLoaderData<QueryListParam, SpecCategorySet[]> | null =>
{
    // 宣告變數
    if (!p.loaderData?.args?.categoryParam) return null;

    const currentKey = JSON.stringify(p.categoryParam ?? null);
    const initialKey = JSON.stringify(p.loaderData.args.categoryParam ?? null);
    if (currentKey !== initialKey) return null;

    // return
    return {
        args: p.loaderData.args.categoryParam,
        apiRes: { IsSuccess: true, Data: p.loaderData.res.categoryRes ?? [], SysMessage: [] },
    };
};

const buildDisplayNameInitial = (
    loaderData?: SpecUSRFormLoaderData | null,
): ApiLoaderData<null, ModelDisplaySchema[]> | null =>
{
    // 宣告變數
    if (!loaderData?.res?.displayNameRes) return null;

    // return
    return {
        args: null,
        apiRes: { IsSuccess: true, Data: loaderData.res.displayNameRes, SysMessage: [] },
    };
};

/** ✅ SSR loader：預載 SpecUSR_Form 所需主資料 / 顯示欄位 / 欄位標題 */
export const SpecUSRForm_Loader =
    () => async ({ request, params }: LoaderFunctionArgs): Promise<SpecUSRFormLoaderData> =>
    {
        // 宣告變數
        const internalId = `${params?.internalId ?? ""}`.trim();
        const ssrApi = getSsrApi(request);
        const usr = SpecUSRAdapter(ssrApi);
        const cate = SpecCategoryAdapter(ssrApi);

        if (!internalId)
        {
            return {
                args: { internalId, categoryParam: buildEmptySpecCategoryQuery() },
                res: { dataRes: null, categoryRes: [], displayNameRes: null },
            };
        }

        // 執行 function：先抓主資料與欄位標題 schema
        const dataLoader = usr.loader.createQueryDataLoader({
            getInternalId: () => internalId,
            getApiInstance: () => ssrApi,
        });
        const displayNameLoader = usr.loader.createModelDisplayNameLoader({ getApiInstance: () => ssrApi });

        const [dataLD, displayNameLD] = await Promise.all([
            dataLoader({ request, params } as LoaderFunctionArgs),
            displayNameLoader({ request, params } as LoaderFunctionArgs),
        ]);

        const dataRes = dataLD.apiRes.Data ?? null;
        const categoryId = `${dataRes?.SpecUSR?.CategoryId ?? ""}`.trim();
        const categoryParam = buildSpecCategoryQuery(categoryId);

        // 執行 function：依主資料的 categoryId 再抓顯示欄位
        const categoryLoader = cate.loader.createQueryListLoader({
            getCondition: () => categoryParam,
            getApiInstance: () => ssrApi,
        });
        const categoryLD = await categoryLoader({ request, params } as LoaderFunctionArgs);

        // return
        return {
            args: { internalId, categoryParam },
            res: {
                dataRes,
                categoryRes: categoryLD.apiRes.Data ?? [],
                displayNameRes: displayNameLD.apiRes.Data ?? null,
            },
        };
    };

/** ✅ CSR 主入口：集中 SpecUSR_Form 所需 hooks / hydration initial */
export const useSpecUSRFormFetchData = (opt: UseSpecUSRFormFetchDataArgs) =>
{
    // 宣告變數
    const adapter = useMemo(() => ({ usr: SpecUSRAdapter(), cate: SpecCategoryAdapter() }), []);
    const safeInternalId = `${opt.internalId ?? ""}`.trim();
    const internalKey = safeInternalId || "__empty__";

    const initialData = useMemo(
        () => buildDataInitial({ internalId: safeInternalId, emptyData: opt.emptyData, loaderData: opt.loaderData }),
        [safeInternalId, opt.emptyData, opt.loaderData],
    );
    const initialDisplayName = useMemo(() => buildDisplayNameInitial(opt.loaderData), [opt.loaderData]);

    // 執行 function：主資料 / 顯示 schema
    const useData = adapter.usr.hooks.useQueryData({
        internalId: internalKey,
        initial: initialData,
        deps: [internalKey],
    });
    const useDisplayName = adapter.usr.hooks.useModelDisplayName({ initial: initialDisplayName, deps: [] });

    const categoryId = `${useData.data?.SpecUSR?.CategoryId ?? opt.loaderData?.res?.dataRes?.SpecUSR?.CategoryId ?? ""}`
        .trim();
    const categoryParam = useMemo(() => buildSpecCategoryQuery(categoryId), [categoryId]);
    const initialCategory = useMemo(() => buildCategoryInitial({ categoryParam, loaderData: opt.loaderData }), [
        categoryParam,
        opt.loaderData,
    ]);

    // 執行 function：顯示欄位設定
    const useCategory = adapter.cate.hooks.useQueryList({
        condition: categoryParam,
        initial: initialCategory,
        deps: [categoryId],
    });

    const showColumns = useMemo(() =>
    {
        const raw = `${useCategory.data?.[0]?.SpecCategory?.ShowColumnItems ?? ""}`;
        return raw.split(",").map(p => p.trim()).filter(Boolean);
    }, [useCategory.data]);

    const showColTitle = useMemo(() =>
    {
        return buildVisibleColumns(useDisplayName.data, formVisibleKeys);
    }, [useDisplayName.data]);

    const rawData = useMemo<SpecUSRFormFetchData>(() =>
    {
        return {
            formData: useData.data ?? opt.emptyData,
            showColumns,
            showColTitle,
        };
    }, [useData.data, opt.emptyData, showColumns, showColTitle]);

    const isLoading = useMemo(() =>
    {
        return Boolean(useData.isLoading || useCategory.isLoading || useDisplayName.isLoading);
    }, [useData.isLoading, useCategory.isLoading, useDisplayName.isLoading]);

    const errors = useMemo(() =>
    {
        return [useData.errorText, useCategory.errorText, useDisplayName.errorText].filter((p): p is string =>
            Boolean(p)
        );
    }, [useData.errorText, useCategory.errorText, useDisplayName.errorText]);

    // return
    return { rawData, isLoading, errors, refetchData: useData.refetch, refetchRefData: useCategory.refetch };
};
