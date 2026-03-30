import { CategoryAdapter, type CategoryMapLoaderData } from "@/Features/Hooks/BizFunc/WebManagement/Category_Api";
import { FileArchiveAdapter } from "@/Features/Hooks/BizFunc/WebManagement/FileArchive_Api";
import { TagAdapter, type TagMapLoaderData } from "@/Features/Hooks/BizFunc/WebManagement/Tag_Api";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import type { ISearchQuery } from "@/SysCore/Components/SearchBar/SearchBar_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import { type ApiAdapterError, type ApiGridInitial, type ApiGridLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import { getSsrApi, MessageStatus } from "@/SysCore/Utils/API/APIBase";
import type { UseFetchDataResult } from "@/SysCore/Utils/API/FetchDataType";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import {
    FileArchiveDetailFields,
    FileArchiveFields,
    FileArchiveInfoFields,
    FileArchiveUrlDetailFields,
    FileManageModelFields,
    PGID,
} from "@/types/SchemaFields";
import { useCallback, useMemo } from "react";
import { type LoaderFunctionArgs, useLoaderData } from "react-router-dom";
import type { IFileArchiveOptions } from "./FileArchiveList";

type QueryListParam = components["schemas"]["QueryListParam"];
type FileArchiveSet = components["schemas"]["FileArchiveSet_DTO"];

export interface FileArchiveTagOption
{
    id: string;
    name: string;
}

export interface FileArchiveListLoaderArgs
{
    lang: Lang;
    baseParam: QueryListParam;
}

export interface FileArchiveListLoaderInitial
{
    grid: ApiGridLoaderData<FileArchiveSet>;
    category: CategoryMapLoaderData;
    tag: TagMapLoaderData;
}

export interface FileArchiveListLoaderData
{
    args: FileArchiveListLoaderArgs;
    initial: FileArchiveListLoaderInitial;
}

export type FileArchiveListRawData = {
    modelDisplayName: ModelDisplaySchema | null;
    count: number;
    list: FileArchiveSet[];
    pageNumber: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    param: QueryListParam;
    categoryMap: Record<string, string>;
    tagMap: Record<string, string>;
    tagOptions: FileArchiveTagOption[];
};

export type FileArchiveListAdapter = {
    FileArchive: ReturnType<typeof FileArchiveAdapter>;
    Category: ReturnType<typeof CategoryAdapter>;
    Tag: ReturnType<typeof TagAdapter>;
};

/** SSR / CSR 共用：組固定條件 */
const buildBaseCondition = (p: { lang: Lang; opts: IFileArchiveOptions; }): string =>
{
    // 宣告變數
    let condition = LibMerge(
        " And ",
        false,
        `${FileArchiveFields.ContentStatus} !& 4`,
        `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields.Lang} = ${p.lang}`,
        `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields.Title} != ''`,
    );

    // 執行 function：固定篩選條件
    if (p.opts.Category)
    {
        condition = LibMerge(
            " And ",
            false,
            condition,
            `${FileArchiveFields.CategoriesId} HasAny [${p.opts.Category}]`,
        );
    }
    if (p.opts.Tag)
    {
        condition = LibMerge(" And ", false, condition, `${FileArchiveFields.TagsId} HasAny [${p.opts.Tag}]`);
    }

    // return
    return condition;
};

/** CSR 搜尋：把 keyword / tag 併進固定條件 */
const appendSearchCondition = (baseCondition: string, query: ISearchQuery): string =>
{
    // 宣告變數
    let condition = baseCondition ?? "";

    // 執行 function：使用者互動搜尋條件
    if (query.keyword)
    {
        condition = LibMerge(
            " And ",
            false,
            condition,
            `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields.Title} Like ${query.keyword}`,
        );
    }
    if (query.tag)
    {
        condition = LibMerge(" And ", false, condition, `${FileArchiveFields.TagsId} HasAny [${query.tag}]`);
    }

    // return
    return condition;
};

/** SSR / CSR 共用：主清單 Query 參數 */
const buildBaseParam = (p: { lang: Lang; opts: IFileArchiveOptions; query?: ISearchQuery; }): QueryListParam =>
{
    // 宣告變數
    const baseCondition = buildBaseCondition({ lang: p.lang, opts: p.opts });
    const condition = appendSearchCondition(baseCondition, p.query ?? {});

    // return
    return {
        Fields: [
            FileArchiveFields.InternalId,
            FileArchiveFields.FileArchiveId,
            FileArchiveFields.CategoriesId,
            FileArchiveFields.TagsId,
            FileArchiveFields.ContentStatus,
            `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields.FileArchiveId}`,
            `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields.RowId}`,
            `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields.Lang}`,
            `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields.Title}`,
            `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields._FileArchiveDetail}.${FileArchiveDetailFields.FileArchiveId}`,
            `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields._FileArchiveDetail}.${FileArchiveDetailFields.ParentRowId}`,
            `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields._FileArchiveDetail}.${FileArchiveDetailFields.FileSrcId}`,
            `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields._FileArchiveDetail}.${FileArchiveDetailFields.FileName}`,
            `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields._FileArchiveDetail}.${FileArchiveDetailFields.FileSrc}.${FileManageModelFields.InternalId}`,
            `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields._FileArchiveDetail}.${FileArchiveDetailFields.FileSrc}.${FileManageModelFields.FileExtension}`,
            `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields._FileArchiveDetail}.${FileArchiveDetailFields.FileSrc}.${FileManageModelFields.PublicDownloadCount}`,
            `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields._FileArchiveUrlDetail}.${FileArchiveUrlDetailFields.FileArchiveId}`,
            `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields._FileArchiveUrlDetail}.${FileArchiveUrlDetailFields.ParentRowId}`,
            `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields._FileArchiveUrlDetail}.${FileArchiveUrlDetailFields.Url}`,
            `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields._FileArchiveUrlDetail}.${FileArchiveUrlDetailFields.UrlDescription}`,
            `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields._FileArchiveUrlDetail}.${FileArchiveUrlDetailFields.WindowTarget}`,
        ],
        Condition: condition,
        RankGroups: [{ Condition: `${FileArchiveFields.ContentStatus} & 1` }],
        OrderBy: [{ Col: FileArchiveFields.CreateTime, Desc: true }],
        PageNumber: 1,
        PageSize: 10,
    };
};

/** 比對 SSR initial 與目前條件是否一致 */
const isSameQueryListParam = (
    left?: QueryListParam | null,
    right?: QueryListParam | null,
): boolean =>
{
    // return
    return JSON.stringify(left ?? null) === JSON.stringify(right ?? null);
};

/** 將 tag data 轉成 SearchBar 可直接使用的選單 */
const buildTagOptions = (tagMap: Record<string, string>): FileArchiveTagOption[] =>
{
    return Object.entries(tagMap ?? {})
        .map(([id, name]) => ({ id, name: name ?? "" }))
        .filter(item => Boolean(item.id) && Boolean(item.name));
};

/** SSR loader：主清單走 createQueryGridDataLoader，分類/標籤走 map loader */
export const FileArchiveList_Loader =
    (p: { lang: Lang; opts: IFileArchiveOptions; }) =>
    async (args: LoaderFunctionArgs): Promise<FileArchiveListLoaderData> =>
    {
        // 宣告變數
        const ssrApi = getSsrApi(args.request);
        const fileArchive = FileArchiveAdapter(ssrApi);
        const category = CategoryAdapter(ssrApi);
        const tag = TagAdapter(ssrApi);
        const baseParam = buildBaseParam({ lang: p.lang, opts: p.opts });

        // 執行 function：SSR 首屏資料
        const gridLoader = fileArchive.loader.createQueryGridDataLoader({
            getCondition: () => baseParam,
            getApiInstance: () => ssrApi,
        });
        const categoryLoader = category.loader.createMapByProgIdLoader({
            progId: PGID.FileArchive,
            lang: p.lang,
            getApiInstance: () => ssrApi,
        });
        const tagLoader = tag.loader.createMapByProgIdLoader({
            progId: PGID.FileArchive,
            lang: p.lang,
            getApiInstance: () => ssrApi,
        });

        const [grid, categoryData, tagData] = await Promise.all([
            gridLoader(args),
            categoryLoader(args),
            tagLoader(args),
        ]);

        // return
        return {
            args: {
                lang: p.lang,
                baseParam,
            },
            initial: {
                grid,
                category: categoryData,
                tag: tagData,
            },
        };
    };

/** 單一入口：FileArchiveList 所有 hooks data 都集中在這裡 */
export const useFileArchiveListFetchData = (opt: {
    lang: Lang;
    opts: IFileArchiveOptions;
    query: ISearchQuery;
}): UseFetchDataResult<FileArchiveListRawData, FileArchiveListAdapter> =>
{
    // 宣告變數
    const loaderData = useLoaderData() as FileArchiveListLoaderData | null;
    const { publish } = useToast();

    const onError = useCallback((e: ApiAdapterError) =>
    {
        // 執行 function：統一錯誤出口
        publish({ level: MessageStatus.Error, title: e.messageText });
    }, [publish]);

    const adapter = useMemo(() =>
    {
        // return
        return {
            FileArchive: FileArchiveAdapter(),
            Category: CategoryAdapter(),
            Tag: TagAdapter(),
        };
    }, []);

    const baseParam = useMemo(() =>
    {
        // return
        return buildBaseParam({
            lang: opt.lang,
            opts: opt.opts,
            query: opt.query,
        });
    }, [
        opt.lang,
        opt.opts.Category,
        opt.opts.Tag,
        opt.query.keyword,
        opt.query.tag,
    ]);

    const gridInitial = useMemo<ApiGridInitial<FileArchiveSet> | null>(() =>
    {
        // 宣告變數
        const matched = isSameQueryListParam(loaderData?.args?.baseParam, baseParam);
        if (!loaderData?.initial?.grid) return null;

        // return：model 可沿用；count/list 只在條件一致時沿用 SSR initial
        return {
            model: loaderData.initial.grid.model ?? null,
            count: matched ? (loaderData.initial.grid.count ?? null) : null,
            list: matched ? (loaderData.initial.grid.list ?? null) : null,
        };
    }, [loaderData, baseParam]);

    const categoryInitial = useMemo(() =>
    {
        // return：語系一致才沿用 SSR initial
        if (loaderData?.args?.lang !== opt.lang) return null;
        return loaderData?.initial?.category ?? null;
    }, [loaderData, opt.lang]);

    const tagInitial = useMemo(() =>
    {
        // return：語系一致才沿用 SSR initial
        if (loaderData?.args?.lang !== opt.lang) return null;
        return loaderData?.initial?.tag ?? null;
    }, [loaderData, opt.lang]);

    const grid = adapter.FileArchive.hooks.useQueryGridData({
        baseParam,
        deps: [baseParam.Condition ?? "", baseParam.PageSize ?? 0],
        modelDeps: [opt.lang],
        initial: gridInitial ?? undefined,
        onError,
    });

    const category = adapter.Category.hooks.useMapByProgId({
        progId: PGID.FileArchive,
        lang: opt.lang,
        deps: [opt.lang],
        initial: categoryInitial,
    });

    const tag = adapter.Tag.hooks.useMapByProgId({
        progId: PGID.FileArchive,
        lang: opt.lang,
        deps: [opt.lang],
        initial: tagInitial,
    });

    const isLoading = Boolean(grid.isLoading || category.isLoading || tag.isLoading);

    const errors = useMemo(() =>
    {
        // return：統一錯誤出口
        return [
            ...(grid.errors ?? []),
            category.errorText,
            tag.errorText,
        ].filter((item): item is string => Boolean(item));
    }, [grid.errors, category.errorText, tag.errorText]);

    const rawData = useMemo<FileArchiveListRawData>(() =>
    {
        return {
            modelDisplayName: grid.modelDisplayName,
            count: grid.count ?? 0,
            list: grid.list ?? [],
            pageNumber: grid.pageNumber ?? 1,
            totalPages: grid.totalPages ?? 1,
            onPageChange: grid.onPageChange,
            param: grid.param,
            categoryMap: category.map ?? {},
            tagMap: tag.map ?? {},
            tagOptions: buildTagOptions(tag.map ?? {}),
        };
    }, [
        grid.modelDisplayName,
        grid.count,
        grid.list,
        grid.pageNumber,
        grid.totalPages,
        grid.onPageChange,
        grid.param,
        category.map,
        tag.map,
    ]);

    const refetchData = useCallback(async () =>
    {
        // 執行 function：只重抓主清單資料
        await grid.refetchData();
    }, [grid]);

    const refetchRefData = useCallback(async () =>
    {
        // 執行 function：重抓分類 / 標籤參考資料
        await Promise.all([category.refetch(), tag.refetch()]);
    }, [category, tag]);

    // return
    return {
        adapter,
        rawData,
        isLoading,
        errors,
        refetchData,
        refetchRefData,
    };
};
