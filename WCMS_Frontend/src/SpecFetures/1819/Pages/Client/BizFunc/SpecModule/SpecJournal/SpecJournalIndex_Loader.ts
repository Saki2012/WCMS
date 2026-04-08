import { SpecJournalIndexAdapter } from "@/SpecFetures/1819/Hooks/BizFunc/SpecModule/SpecJournal/SpecJournalIndex_Api";
import { getSsrApi } from "@/SysCore/Utils/API/APIBase";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
import { SpecJournalIndexDetailFields, SpecJournalIndexModelFields } from "@/types/SchemaFields";
import type { LoaderFunctionArgs } from "react-router-dom";
type SpecJournalIndexSet = components["schemas"]["SpecJournalIndexSet_DTO"];
type QueryListParam = components["schemas"]["QueryListParam"];
export interface SpecJournalIndexLoaderArgs
{
    pageSize: number;
    baseParam: QueryListParam;
}
export interface SpecJournalIndexLoaderRes
{
    countRes: number;
    listRes: SpecJournalIndexSet[];
}
export interface SpecJournalIndexLoaderData
{
    args: SpecJournalIndexLoaderArgs;
    res: SpecJournalIndexLoaderRes;
}

const buildBaseParam = (pageSize: number): QueryListParam =>
{
    // 宣告變數
    const condition = LibMerge(" And ", false);
    // return
    return {
        Fields: [
            SpecJournalIndexModelFields.IndexId,
            SpecJournalIndexModelFields.IndexName,
            SpecJournalIndexModelFields.InternalId,
            `${SpecJournalIndexModelFields._SpecJournalIndexDetail}.${SpecJournalIndexDetailFields.RowId}`,
            `${SpecJournalIndexModelFields._SpecJournalIndexDetail}.${SpecJournalIndexDetailFields.Volume}`,
            `${SpecJournalIndexModelFields._SpecJournalIndexDetail}.${SpecJournalIndexDetailFields.Issue}`,
            `${SpecJournalIndexModelFields._SpecJournalIndexDetail}.${SpecJournalIndexDetailFields.SummaryFileId}`,
            `${SpecJournalIndexModelFields._SpecJournalIndexDetail}.${SpecJournalIndexDetailFields.SummaryFileName}`,
        ],
        Condition: condition,
        OrderBy: [{ Col: SpecJournalIndexModelFields.IndexName, Desc: true }],
        PageNumber: 1,
        PageSize: pageSize,
    };
};
/** ✅ SSR loader：Index 年度清單（含明細）首屏預載 */
export const SpecJournalIndex_Loader =
    (p?: { pageSize?: number; }) => async ({ request }: LoaderFunctionArgs): Promise<SpecJournalIndexLoaderData> =>
    {
        // 宣告變數
        const pageSize = p?.pageSize ?? 10;
        const baseParam = buildBaseParam(pageSize);
        const ssrApi = getSsrApi(request);
        const adapter = SpecJournalIndexAdapter(ssrApi);

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
            args: { pageSize, baseParam },
            res: {
                countRes: countLD.apiRes.Data ?? 0,
                listRes: listLD.apiRes.Data ?? [],
            },
        };
    };
