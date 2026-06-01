//#region Property
import {
    buildClientDataQueryState,
    useClientDataQueryTemplate,
    type ClientDataQueryDataSourceResult,
    type ClientDataQueryTemplate,
} from "@/Features/Pages/Client/Scaffold/DataQueryTemplate/Client_DataQueryTemplate_Hook";
import { SpecMusicalAdapter } from "@/SpecFetures/1817/Hooks/BizFunc/WEB/SpecMusical_Api";
import type { SearchValues } from "@/SysCore/Components/SearchBar/SearchBar_Data";
import type { IListViewState } from "@/SysCore/Interface/IListViewState";
import type { ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import { getSsrApi } from "@/SysCore/Utils/API/APIBase";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { useMemo } from "react";
import type { LoaderFunctionArgs } from "react-router-dom";

type SpecMusicalSet = components["schemas"]["SpecMusicalSet_DTO"];
type SpecMusicalAdapterType = ReturnType<typeof SpecMusicalAdapter>;

/** loader args */
export interface SpecMusicalFormLoaderArgs
{
    internalId: string;
}

/** loader res */
export interface SpecMusicalFormLoaderRes
{
    dataRes: SpecMusicalSet | null;
    displayNameRes: ModelDisplaySchema[] | null;
}

export interface SpecMusicalFormLoaderData
{
    args: SpecMusicalFormLoaderArgs;
    res: SpecMusicalFormLoaderRes;
}

export interface SpecMusicalFormRawData
{
    data: SpecMusicalSet | null;
    displaySchema: ModelDisplaySchema | null;
}

export interface UseSpecMusicalFormDataResult
{
    data: SpecMusicalSet | null;
    displaySchema: ModelDisplaySchema | null;
    title: string;
    isLoading: boolean;
    errorList: string[];
}

type SpecMusicalFormTemplate = ClientDataQueryTemplate<
    { internalId: string; },
    SpecMusicalFormRawData,
    UseSpecMusicalFormDataResult,
    SpecMusicalAdapterType,
    string,
    SpecMusicalFormLoaderData
>;
type SpecMusicalFormDataSourceContext = Parameters<NonNullable<NonNullable<SpecMusicalFormTemplate["spec"]>["useDataSource"]>>[0];

/** 取得安全 InternalId */
//#endregion

//#region Private - Query Helpers
const getSafeInternalId = (value?: string | null): string =>
{
    // return
    return `${value ?? ""}`.trim();
};

/** 建立 loader / hook 共用查詢狀態 */
const buildSpecMusicalFormQueryState = (internalId: string) =>
{
    // 宣告變數
    const template = createSpecMusicalFormDataQueryTemplate({ internalId });
    const searchValues: SearchValues = {};
    const viewState: IListViewState = { pageNumber: 1, pageSize: 1 };

    // return
    return buildClientDataQueryState(template, searchValues, viewState);
};

/** 建立 SSR initial */
const buildInitial = <TData>(p: { loaderData: SpecMusicalFormLoaderData | null; internalId: string; data: TData; args: string | null; }): ApiLoaderData<string | null, TData> | null =>
{
    // 執行 function
    if (!p.loaderData) return null;
    if (p.loaderData.args.internalId !== p.internalId) return null;

    // return
    return { args: p.args, apiRes: { IsSuccess: true, Data: p.data, SysMessage: [] } };
};

/** 建立 SpecMusical Form DataQuery Template */
//#endregion

//#region Template - Client DataQuery
const createSpecMusicalFormDataQueryTemplate = (p: { internalId: string; }): SpecMusicalFormTemplate =>
{
    // return
    return {
        featureKey: "Spec1817.SpecMusical.Form",
        dataMode: "single",
        initialViewState: { pageNumber: 1, pageSize: 1 },
        pagination: null,
        searchBar: null,
        spec: {
            toSearchParams: () => ({ internalId: getSafeInternalId(p.internalId) }),
            buildQueryParam: ({ searchParams }) => searchParams.internalId,
            useDataSource: (ctx) => useSpecMusicalFormDataSource(ctx),
            buildViewModel: ({ rawData }) => ({
                data: rawData.data,
                displaySchema: rawData.displaySchema,
                title: rawData.data?.SpecMusical?.MusicalName ?? "",
                isLoading: false,
                errorList: [],
            }),
        },
    };
};

/** DataSource：用 Template 統一接 SSR initial、QueryData 與 DisplayName */
const useSpecMusicalFormDataSource = (
    ctx: SpecMusicalFormDataSourceContext,
): ClientDataQueryDataSourceResult<SpecMusicalFormRawData, SpecMusicalAdapterType> =>
{
    // 宣告變數
    const adapter = useMemo(() => SpecMusicalAdapter(), []);
    const internalId = getSafeInternalId(ctx.queryParam);
    const loaderData = ctx.loaderData ?? null;

    const dataInitial = useMemo(() =>
    {
        return buildInitial({ loaderData, internalId, data: loaderData?.res.dataRes ?? ({} as SpecMusicalSet), args: internalId });
    }, [loaderData, internalId]);

    const displayNameInitial = useMemo(() =>
    {
        return buildInitial({ loaderData, internalId, data: loaderData?.res.displayNameRes ?? [], args: null });
    }, [loaderData, internalId]);

    // 執行 function
    const useData = adapter.hooks.useQueryData({ internalId, initial: dataInitial as ApiLoaderData<string, SpecMusicalSet> | null, deps: [internalId] });
    const useDisplayName = adapter.hooks.useModelDisplayName({ initial: displayNameInitial as ApiLoaderData<null, ModelDisplaySchema[]> | null, deps: [] });

    const displaySchema = useMemo<ModelDisplaySchema | null>(() =>
    {
        return Array.isArray(useDisplayName.data) ? (useDisplayName.data[0] ?? null) : null;
    }, [useDisplayName.data]);

    const rawData = useMemo<SpecMusicalFormRawData>(() =>
    {
        return { data: useData.data ?? null, displaySchema };
    }, [useData.data, displaySchema]);

    // return
    return {
        adapter,
        rawData,
        isLoading: Boolean(useData.isLoading || useDisplayName.isLoading),
        errors: [useData.errorText, useDisplayName.errorText],
        paginator: null,
    };
};

/** SSR loader：預載 SpecMusicalForm 所需資料 */
//#endregion

//#region Public - SSR Loader / CSR Hook
export const SpecMusicalForm_Loader = () => async ({ request, params }: LoaderFunctionArgs): Promise<SpecMusicalFormLoaderData> =>
{
    // 宣告變數
    const internalId = getSafeInternalId(params?.internalId);
    const ssrApi = getSsrApi(request);
    const adapter = SpecMusicalAdapter(ssrApi);
    const queryState = buildSpecMusicalFormQueryState(internalId);

    // 無 internalId：回空資料避免爆炸
    if (!queryState.queryParam)
    {
        return { args: { internalId }, res: { dataRes: null, displayNameRes: null } };
    }

    // 執行 function：QueryData / GetModelDisplayName
    const dataLoader = adapter.loader.createQueryDataLoader({ getInternalId: () => queryState.queryParam, getApiInstance: () => ssrApi });
    const displayNameLoader = adapter.loader.createModelDisplayNameLoader({ getApiInstance: () => ssrApi });
    const [dataLD, nameLD] = await Promise.all([dataLoader({ request, params } as LoaderFunctionArgs), displayNameLoader({ request } as LoaderFunctionArgs)]);

    // return
    return { args: { internalId }, res: { dataRes: dataLD.apiRes.Data ?? null, displayNameRes: nameLD.apiRes.Data ?? null } };
};

/** CSR Hook：前台樂器 Detail 走 Client_DataQueryTemplate */
export const useSpecMusicalFormData = (p: { internalId?: string | null; }): UseSpecMusicalFormDataResult =>
{
    // 宣告變數
    const safeInternalId = getSafeInternalId(p.internalId);
    const template = useMemo(() =>
    {
        return createSpecMusicalFormDataQueryTemplate({ internalId: safeInternalId });
    }, [safeInternalId]);

    const templateVm = useClientDataQueryTemplate(template);

    // return
    return { ...templateVm.viewModel, isLoading: templateVm.isLoading, errorList: templateVm.errorList };
};
//#endregion
