import { useCallback, useMemo } from "react";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import { CategoryAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Category_Api";
import { SpecJournalAdapter } from "@/SpecFetures/1819/Hooks/BizFunc/SpecModule/SpecJournal/SpecJournal_Api";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiAdapterError } from "@/SysCore/Utils/API/APIAdapter";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { UseFetchDataResult } from "@/SysCore/Utils/API/FetchDataType";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import  {AccountFields, PGID, SpecJournalIndexDetailFields, SpecJournalModelFields, } from "@/types/SchemaFields";

type QueryListParam = components["schemas"]["QueryListParam"];
type SpecJournalSet = components["schemas"]["SpecJournalSet_DTO"];
type CategoryDataSet = components["schemas"]["CategoryDataSet_DTO"];

//#region Public
export type SpecJournalListRawData = {
    modelDisplayName: ModelDisplaySchema | null;
    count: number;
    list: SpecJournalSet[];
    pageNumber: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    param: QueryListParam;
    categoryData: CategoryDataSet[];
    categoryMap: Record<string, string>;
};

export type SpecJournalListAdapter = {
    SpecJournal: ReturnType<typeof SpecJournalAdapter>;
    Category: ReturnType<typeof CategoryAdapter>;
};

/** ✅ 主入口：Server SpecJournal List 的 fetch 都集中在這裡 */
export const useSpecJournalListFetchData = (
    opt: { lang: Lang; kw: string; },
): UseFetchDataResult<SpecJournalListRawData, SpecJournalListAdapter> =>
{
    const { publish } = useToast();
    const onError = useCallback((e: ApiAdapterError) => { publish({ level: MessageStatus.Error, title: e.messageText }); }, [publish]);
    const adapter = useMemo<SpecJournalListAdapter>(() => { return { SpecJournal: SpecJournalAdapter(), Category: CategoryAdapter(), }; }, []);
    const baseParam = useSpecJournalListQueryParam({ kw: opt.kw });
    const grid = adapter.SpecJournal.hooks.useQueryGridData({
        baseParam,
        deps: [baseParam.Condition ?? "", baseParam.PageSize ?? 0],
        modelDeps: [opt.lang],
        onError,
    });
    /** 
     * 先沿用舊版 comp 的行為：
     * - 雖然目前 List 沒直接用到 categoryMap
     * - 但先保留 loading / error 聚合，避免業務邏輯一起變動
     */
    const category = adapter.Category.hooks.useMapByProgId({ progId: PGID.SpecMusical, lang: opt.lang, });
    const isLoading = Boolean(grid.isLoading || category.isLoading);

    const errors = useMemo(() =>
    {
        const list = [...(grid.errors ?? []), category.errorText];
        return list.filter((x): x is string => Boolean(x));
    }, [grid.errors, category.errorText]);

    const rawData = useMemo<SpecJournalListRawData>(() =>
    {
        return {
            modelDisplayName: grid.modelDisplayName,
            count: grid.count ?? 0,
            list: grid.list ?? [],
            pageNumber: grid.pageNumber ?? 1,
            totalPages: grid.totalPages ?? 1,
            onPageChange: grid.onPageChange,
            param: grid.param,
            categoryData: category.data ?? [],
            categoryMap: category.map ?? {},
        };
    }, [grid.modelDisplayName, grid.count, grid.list, grid.pageNumber, grid.totalPages, grid.onPageChange, grid.param, category.data, category.map,]);

    const refetchData = useCallback(async () => { await grid.refetchData(); }, [grid]);
    const refetchRefData = useCallback(async () => { await category.refetch(); }, [category]);
    return { adapter, rawData, isLoading, errors, refetchData, refetchRefData };
};
//#endregion

//#region Private
/** List QueryListParam */
const useSpecJournalListQueryParam = (p: { kw: string; }): QueryListParam =>
{
    const fields = useMemo<string[]>(() =>
    {
        return [SpecJournalModelFields.JournalId, SpecJournalModelFields.Title, SpecJournalModelFields.Title_en, SpecJournalModelFields.ModifyUserId,
            `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.Volume}`,
            `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.Issue}`,
            `${SpecJournalModelFields.ModifyUser}.${AccountFields.AccountName}`,
            SpecJournalModelFields.CreateTime, SpecJournalModelFields.ModifyTime, SpecJournalModelFields.InternalId,
        ];
    }, []);

    const condition = useMemo(() =>
    {
        let cdt = ``;
        if (!!p.kw)
        {
            const orCdt = LibMerge(" Or ",false,
            `${SpecJournalModelFields.Title} Like '${p.kw}'`,
            `${SpecJournalModelFields.Title_en} Like '${p.kw}'`)
            cdt = LibMerge(" And ", false, cdt,`(${orCdt})` );
        }
        return cdt;
    }, [p.kw]);

    return useMemo(() =>
    {
        return {
            Fields: fields,
            Condition: condition,
            OrderBy: [
                {
                    Col: `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.Volume}`,
                    Desc: true,
                },
                {
                    Col: `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.Issue}`,
                    Desc: true,
                },
            ],
            PageNumber: 1,
            PageSize: 10,
        };
    }, [fields, condition]);
};
//#endregion