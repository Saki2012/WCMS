import { GalleryAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Gallery/Gallery_Api";
import type { Lang } from "@/SysCore/i18n/lang";
import { getSsrApi } from "@/SysCore/Utils/API/APIBase";
import type { components } from "@/types/api";
import type { LoaderFunctionArgs } from "react-router-dom";

type GallerySet = components["schemas"]["GallerySet_DTO"];

export interface GalleryFormLoaderArgs
{
    internalId: string;
    dataId: string;
}

export interface GalleryFormLoaderRes
{
    dataRes: GallerySet | null;
}

export interface GalleryFormLoaderData
{
    args: GalleryFormLoaderArgs;
    res: GalleryFormLoaderRes;
}

/** ✅ loader factory：SSR 預載 GalleryForm 資料 */
export const GalleryForm_Loader =
    (p: { lang: Lang; }) => async ({ request, params }: LoaderFunctionArgs): Promise<GalleryFormLoaderData> =>
    {
        // 宣告變數
        const internalId = `${params?.internalId ?? ""}`.trim();
        const ssrApi = getSsrApi(request);
        const gallery = GalleryAdapter(ssrApi);

        // 無 internalId：回空資料（避免 loader 爆炸）
        if (!internalId)
        {
            return {
                args: { internalId, dataId: "" },
                res: { dataRes: null },
            };
        }

        // 執行 function：QueryData（SSR）
        const dataLoader = gallery.loader.createQueryDataLoader({
            getInternalId: () => internalId,
            getApiInstance: () => ssrApi,
        });

        const ld = await dataLoader({ request, params } as LoaderFunctionArgs);

        // return
        return {
            args: { internalId, dataId: internalId },
            res: { dataRes: ld.apiRes.Data ?? null },
        };
    };
