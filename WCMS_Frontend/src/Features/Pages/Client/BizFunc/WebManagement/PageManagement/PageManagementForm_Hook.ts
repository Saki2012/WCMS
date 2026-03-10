import { PageManagementAdapter } from "@/Features/Hooks/BizFunc/WebManagement/PageManagement_Api";
import type { Lang } from "@/SysCore/i18n/lang";
import { getSsrApi } from "@/SysCore/Utils/API/APIBase";
import type { components } from "@/types/api";
import type { LoaderFunctionArgs } from "react-router-dom";
import type { IPageManagementOptions } from "./PageManagementForm_Comp";
type PageManagementSet = components["schemas"]["PageManagementSet_DTO"];

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

/**
 * ✅ SSR loader：用 PageId 預載 PageManagement
 * - 固定參數（PageId）由 route/loader 決定，component 不再直接打 provider
 */
export const PageManagementForm_Loader =
    (p: { lang: Lang; opts: IPageManagementOptions; }) =>
    async ({ request }: LoaderFunctionArgs): Promise<PageManagementFormLoaderData> =>
    {
        const pageId = `${p.opts.PageId ?? ""}`.trim();
        const ssrApi = getSsrApi(request);
        if (!pageId) return { args: { pageId }, res: { dataRes: null } };
        const adapter = PageManagementAdapter(ssrApi);

        // 執行 function：QueryData（PageManagement 以 pageId 當 internalId 使用）
        const dataLoader = adapter.loader.createQueryDataLoader({
            getInternalId: () => pageId,
            getApiInstance: () => ssrApi,
        });

        const ld = await dataLoader({ request } as LoaderFunctionArgs);

        // return
        return {
            args: { pageId },
            res: { dataRes: ld.apiRes.Data ?? null },
        };
    };
