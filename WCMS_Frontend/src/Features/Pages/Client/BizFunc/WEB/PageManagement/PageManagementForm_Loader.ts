import { PageManagementAdapter } from "@/Features/Hooks/BizFunc/WEB/PageManagement_Api";
import { useResolveInternalIds } from "@/SysCore/Components/File/useResolveInternalIds";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import { getSsrApi } from "@/SysCore/Utils/API/APIBase";
import type { components } from "@/types/api";
import { useMemo } from "react";
import { type LoaderFunctionArgs, useLoaderData } from "react-router-dom";

type PageManagementSet = components["schemas"]["PageManagementSet_DTO"];
type PageManagementDetail = NonNullable<PageManagementSet["PageManagementDetail"]>[number];

export interface IPageManagementOptions
{
    PageId?: string;
}

export interface PageManagementFormLoaderArgs
{
    pageId: string;
}

export interface PageManagementFormLoaderRes
{
    dataRes: PageManagementSet | null;
}

export interface PageManagementFormLoaderData
{
    args: PageManagementFormLoaderArgs;
    res: PageManagementFormLoaderRes;
}

export interface PageManagementFormFetchDataResult
{
    data: PageManagementSet;
    detail: PageManagementDetail | null;
    title: string;
    contentHtml: string;
    isLoading: boolean;
    errorText: string | null;
    errorList: (string | null | undefined)[];
}

/** 預設空資料，避免 component 端一直判空 */
const emptyData: PageManagementSet = { PageManagement: {}, PageManagementDetail: [] };

/** 建立 SSR initial，讓 hydration 不重抓第一筆資料 */
const buildInitialData = (
    p: { loaderData: PageManagementFormLoaderData | null; pageId: string; fallbackData: PageManagementSet; },
): ApiLoaderData<string, PageManagementSet> | null =>
{
    if (!p.loaderData?.args?.pageId) return null;
    if (p.loaderData.args.pageId !== p.pageId) return null;

    return { args: p.pageId, apiRes: { IsSuccess: true, Data: p.loaderData.res.dataRes ?? p.fallbackData, SysMessage: [] } };
};

/** 依語系取目前 detail */
const findLangDetail = (p: { data: PageManagementSet; lang: Lang; }): PageManagementDetail | null =>
{
    const detail = p.data.PageManagementDetail?.find((item) => (item.Lang ?? "").toLowerCase() === p.lang.toLowerCase());

    return detail ?? null;
};

/** SSR loader：預載指定 PageId 的單筆資料 */
export const PageManagementForm_Loader =
    (p: { lang: Lang; opts: IPageManagementOptions; }) => async ({ request }: LoaderFunctionArgs): Promise<PageManagementFormLoaderData> =>
    {
        const pageId = `${p.opts.PageId ?? ""}`.trim();
        const ssrApi = getSsrApi(request);

        if (!pageId)
        {
            return { args: { pageId }, res: { dataRes: null } };
        }

        const adapter = PageManagementAdapter(ssrApi);
        const dataLoader = adapter.loader.createQueryDataLoader({ getInternalId: () => pageId, getApiInstance: () => ssrApi });

        const dataLD = await dataLoader({ request } as LoaderFunctionArgs);

        return { args: { pageId }, res: { dataRes: dataLD.apiRes.Data ?? null } };
    };

/** 單一入口：PageManagement form 所有 data 都從這裡出去 */
export const usePageManagementFormFetchData = (p: { lang: Lang; pageId: string; emptyData?: PageManagementSet; }): PageManagementFormFetchDataResult =>
{
    const loaderData = useLoaderData() as PageManagementFormLoaderData | null;
    const adapter = useMemo(() => PageManagementAdapter(), []);
    const fallbackData = p.emptyData ?? emptyData;

    const initialData = useMemo(() => buildInitialData({ loaderData, pageId: p.pageId, fallbackData }), [loaderData, p.pageId, fallbackData]);

    const pageData = adapter.hooks.useQueryData({ internalId: p.pageId, initial: initialData, deps: [p.pageId, p.lang] });

    const data = useMemo(() => pageData.data ?? fallbackData, [pageData.data, fallbackData]);

    const detail = useMemo(() => findLangDetail({ data, lang: p.lang }), [data, p.lang]);

    const parsed = useResolveInternalIds(detail?.Content ?? "", { locale: p.lang });

    const errorList = useMemo(() => [pageData.errorText], [pageData.errorText]);

    return {
        data,
        detail,
        title: detail?.Title ?? "",
        contentHtml: parsed.html ?? "",
        isLoading: Boolean(pageData.isLoading),
        errorText: pageData.errorText ?? null,
        errorList,
    };
};
