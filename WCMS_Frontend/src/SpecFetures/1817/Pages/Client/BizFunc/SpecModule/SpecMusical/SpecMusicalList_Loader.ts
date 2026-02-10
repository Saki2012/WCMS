import { getSsrApi } from "@/SysCore/Utils/API/APIBase";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
import { SpecMusicalModelFields } from "@/types/SchemaFields";
import type { LoaderFunctionArgs } from "react-router-dom";

// ✅ 新架構：Adapter（取代 1817 的 SpecMusicalProvider）
import { SpecMusicalAdapter } from "@/SpecFetures/1817/Hooks/BizFunc/SpecModule/SpecMusical/SpecMusical_Api";

type QueryListParam = components["schemas"]["QueryListParam"];
type SpecMusicalSet = components["schemas"]["SpecMusicalSet_DTO"];

export interface SpecMusicalListLoaderArgs
{
    baseParam: QueryListParam;
    categoryIds: string;
    pageSize: number;
}

export interface SpecMusicalListLoaderRes
{
    countRes: number;
    listRes: SpecMusicalSet[];
}

export interface SpecMusicalListLoaderData
{
    args: SpecMusicalListLoaderArgs;
    res: SpecMusicalListLoaderRes;
}

const buildCondition = (categoryIds: string) =>
{
    // 宣告變數
    let condition = "";

    // 執行 function：固定條件（搬到 loader）
    if (categoryIds)
    {
        condition = LibMerge(" And ", false, condition, `${SpecMusicalModelFields.CategoryId} HasAny [${categoryIds}]`);
    }

    // return
    return condition;
};

const buildBaseParam = (categoryIds: string, pageSize: number): QueryListParam =>
{
    // 宣告變數
    const condition = buildCondition(categoryIds);

    // return
    return {
        Fields: [
            SpecMusicalModelFields.MusicalName,
            SpecMusicalModelFields.CoverPicId,
            SpecMusicalModelFields.InternalId,
        ],
        Condition: condition,
        OrderBy: [{ Col: SpecMusicalModelFields.CreateTime, Desc: true }],
        PageNumber: 1,
        PageSize: pageSize,
    };
};

/** ✅ loader factory：SSR 先撈清單/筆數 */
export const SpecMusicalList_Loader =
    (p: { categoryIds: string; pageSize?: number; }) =>
    async ({ request }: LoaderFunctionArgs): Promise<SpecMusicalListLoaderData> =>
    {
        // 宣告變數
        const pageSize = p.pageSize ?? 9;
        const categoryIds = `${p.categoryIds ?? ""}`.trim();

        const ssrApi = getSsrApi(request);
        const adapter = SpecMusicalAdapter(ssrApi);

        const baseParam = buildBaseParam(categoryIds, pageSize);

        // 執行 function：count/list
        const countLoader = adapter.loader.createQueryCountLoader({
            getCondition: () => baseParam,
            getApiInstance: () => ssrApi,
        });

        const listLoader = adapter.loader.createQueryListLoader({
            getCondition: () => baseParam,
            getApiInstance: () => ssrApi,
        });

        const [countLD, listLD] = await Promise.all([
            countLoader({ request } as LoaderFunctionArgs),
            listLoader({ request } as LoaderFunctionArgs),
        ]);

        // return
        return {
            args: { baseParam, categoryIds, pageSize },
            res: {
                countRes: countLD.apiRes.Data ?? 0,
                listRes: listLD.apiRes.Data ?? [],
            },
        };
    };
