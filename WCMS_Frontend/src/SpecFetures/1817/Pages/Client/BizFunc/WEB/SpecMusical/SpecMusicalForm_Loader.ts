import { SpecMusicalAdapter } from "@/SpecFetures/1817/Hooks/BizFunc/WEB/SpecMusical_Api";
import { getSsrApi } from "@/SysCore/Utils/API/APIBase";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import type { LoaderFunctionArgs } from "react-router-dom";

type SpecMusicalSet = components["schemas"]["SpecMusicalSet_DTO"];

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

/** ✅ SSR loader：預載 SpecMusicalForm 所需資料 */
export const SpecMusicalForm_Loader = () => async ({ request, params }: LoaderFunctionArgs): Promise<SpecMusicalFormLoaderData> =>
{
    // 宣告變數
    const internalId = `${params?.internalId ?? ""}`.trim();
    const ssrApi = getSsrApi(request);
    const adapter = SpecMusicalAdapter(ssrApi);

    // 無 internalId：回空資料避免爆炸
    if (!internalId)
    {
        return { args: { internalId }, res: { dataRes: null, displayNameRes: null } };
    }

    // 執行 function：QueryData / GetModelDisplayName
    const dataLoader = adapter.loader.createQueryDataLoader({ getInternalId: () => internalId, getApiInstance: () => ssrApi });

    const displayNameLoader = adapter.loader.createModelDisplayNameLoader({ getApiInstance: () => ssrApi });

    const [dataLD, nameLD] = await Promise.all([dataLoader({ request, params } as LoaderFunctionArgs), displayNameLoader({ request } as LoaderFunctionArgs)]);

    // return
    return { args: { internalId }, res: { dataRes: dataLD.apiRes.Data ?? null, displayNameRes: nameLD.apiRes.Data ?? null } };
};
