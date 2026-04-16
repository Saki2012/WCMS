import { CategoryAdapter } from "@/Features/Hooks/BizFunc/COMM/Category_Api";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import { SpecJournalAdapter } from "@/SpecFetures/1819/Hooks/BizFunc/WEB/SpecJournal_Api";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiAdapterError } from "@/SysCore/Utils/API/APIAdapter";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import type { UseFetchDataResult } from "@/SysCore/Utils/API/FetchDataType";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import {
    AccountFields,
    PGID,
    SpecJournalAuthorFields,
    SpecJournalIndexDetailFields,
    SpecJournalModelFields,
} from "@/types/SchemaFields";
import { useCallback, useMemo } from "react";
import type { SpecJournalMode } from "./Server_SpecJournal_Form_Hook";

type QueryListParam = components["schemas"]["QueryListParam"];
type SpecJournalSet = components["schemas"]["SpecJournalSet_DTO"];

// #region Public
export type SpecJournalListRawData = {
    modelDisplayName: ModelDisplaySchema | null;
    count: number;
    list: SpecJournalSet[];
    pageNumber: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    param: QueryListParam;
    categoryData: Record<string, string>;
    categoryMap: Record<string, string>;
};

export type SpecJournalListAdapter = {
    SpecJournal: ReturnType<typeof SpecJournalAdapter>;
    Category: ReturnType<typeof CategoryAdapter>;
};

/** ✅ 主入口：Server SpecJournal List 的 fetch 都集中在這裡 */
export const useSpecJournalListFetchData = (
    opt: { lang: Lang; kw: string; volume: string; author: string; mode: SpecJournalMode; },
): UseFetchDataResult<SpecJournalListRawData, SpecJournalListAdapter> =>
{
    const { publish } = useToast();
    const onError = useCallback((e: ApiAdapterError) =>
    {
        publish({ level: MessageStatus.Error, title: e.messageText });
    }, [publish]);
    const adapter = useMemo<SpecJournalListAdapter>(() =>
    {
        return { SpecJournal: SpecJournalAdapter(), Category: CategoryAdapter() };
    }, []);
    const baseParam = useSpecJournalListQueryParam({
        kw: opt.kw,
        volume: opt.volume,
        author: opt.author,
        mode: opt.mode,
    });
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
    const category = adapter.Category.hooks.useMapByProgId({ progId: PGID.SpecMusical, lang: opt.lang });
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
    }, [
        grid.modelDisplayName,
        grid.count,
        grid.list,
        grid.pageNumber,
        grid.totalPages,
        grid.onPageChange,
        grid.param,
        category.data,
        category.map,
    ]);

    const refetchData = useCallback(async () =>
    {
        await grid.refetchData();
    }, [grid]);
    const refetchRefData = useCallback(async () =>
    {
        await category.refetch();
    }, [category]);
    return { adapter, rawData, isLoading, errors, refetchData, refetchRefData };
};
// #endregion

// #region Private
/** List QueryListParam */
const useSpecJournalListQueryParam = (
    p: { kw: string; volume: string; author: string; mode: SpecJournalMode; },
): QueryListParam =>
{
    const fields = useMemo<string[]>(() =>
    {
        return [
            SpecJournalModelFields.JournalId,
            SpecJournalModelFields.Title,
            SpecJournalModelFields.Title_en,
            SpecJournalModelFields.ModifyUserId,
            `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.Volume}`,
            `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.Issue}`,
            `${SpecJournalModelFields._SpecJournalAuthor}.${SpecJournalAuthorFields.AuthorName}`,
            `${SpecJournalModelFields._SpecJournalAuthor}.${SpecJournalAuthorFields.AuthorName_en}`,
            `${SpecJournalModelFields.ModifyUser}.${AccountFields.AccountName}`,
            SpecJournalModelFields.CreateTime,
            SpecJournalModelFields.ModifyTime,
            SpecJournalModelFields.InternalId,
        ];
    }, []);

    const condition = useMemo(() =>
    {
        let cdt = ``;
        const isPreCdt = p.mode === "preprint" ? "Is Null" : "Is Not Null";
        cdt = LibMerge(
            " And ",
            false,
            cdt,
            `${SpecJournalModelFields.JournalIndexId} ${isPreCdt}`,
            `${SpecJournalModelFields.JournalIndexRowId} ${isPreCdt}`,
        );

        if (!!p.kw)
        {
            const orCdt = LibMerge(
                " Or ",
                false,
                `${SpecJournalModelFields.Title} Like '${p.kw}'`,
                `${SpecJournalModelFields.Title_en} Like '${p.kw}'`,
            );
            cdt = LibMerge(" And ", false, cdt, `(${orCdt})`);
        }
        if (p.mode === "journal" && !!p.volume)
        {
            cdt = LibMerge(
                " And ",
                false,
                cdt,
                `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.Volume} = ${p.volume}`,
            );
        }
        if (!!p.author)
        {
            const orCdt = LibMerge(
                " Or ",
                false,
                `${SpecJournalModelFields._SpecJournalAuthor}.${SpecJournalAuthorFields.AuthorName} Like '${p.author}'`,
                `${SpecJournalModelFields._SpecJournalAuthor}.${SpecJournalAuthorFields.AuthorName_en} Like '${p.author}'`,
            );
            cdt = LibMerge(" And ", false, cdt, `(${orCdt})`);
        }
        return cdt;
    }, [p]);

    const orderBy = useMemo(() =>
    {
        if (p.mode === "preprint")
        {
            return [{ Col: SpecJournalModelFields.ModifyTime, Desc: true }];
        }

        return [
            { Col: `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.Volume}`, Desc: true },
            { Col: `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.Issue}`, Desc: true },
        ];
    }, [p.mode]);
    return useMemo(() =>
    {
        return {
            Fields: fields,
            Condition: condition,
            OrderBy: orderBy,
            PageNumber: 1,
            PageSize: 10,
        };
    }, [fields, condition, orderBy]);
};
// #endregion
