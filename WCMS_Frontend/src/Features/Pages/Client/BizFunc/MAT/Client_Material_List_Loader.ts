import { CategoryAdapter, type CategoryMapLoaderData } from "@/Features/Hooks/BizFunc/COMM/Category_Api";
import { TagAdapter, type TagMapLoaderData } from "@/Features/Hooks/BizFunc/COMM/Tag_Api";
import { MaterialAdapter } from "@/Features/Hooks/BizFunc/MAT/Material_Api";
import { PageManagementAdapter } from "@/Features/Hooks/BizFunc/WEB/PageManagement_Api";
import type { Lang } from "@/SysCore/i18n/lang";
import type { IListViewState } from "@/SysCore/Interface/IListViewState";
import type { ApiGridInitial, ApiGridLoaderData, ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import { getSsrApi } from "@/SysCore/Utils/API/APIBase";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import { useResetListPageOnKeyChange } from "@/SysCore/Utils/UI_HookFunc/useResetListPageOnKeyChange";
import type { components } from "@/types/api";
import { MaterialFields, MaterialLangInfoFields, MaterialPictureFields, MaterialTagsFields, PGID } from "@/types/SchemaFields";
import { useMemo } from "react";
import type { LoaderFunctionArgs } from "react-router-dom";
import { useLoaderData } from "react-router-dom";

type QueryListParam = components["schemas"]["QueryListParam"];
type MaterialSet = components["schemas"]["MaterialSet_DTO"];
type PageManagementSet = components["schemas"]["PageManagementSet_DTO"];
type PageManagementDetail = NonNullable<PageManagementSet["PageManagementDetail"]>[number];

export interface IMaterialListOptions
{
    PageId: string;
    CategoryId: string;
    TagIds: string;
}

// #region Property
interface MaterialListLoaderArgs
{
    matParam: QueryListParam;
    pageId: string;
}
interface MaterialListLoaderRes
{
    gridRes: ApiGridLoaderData<MaterialSet>;
    categoryRes: CategoryMapLoaderData;
    tagRes: TagMapLoaderData;
    pageRes: ApiLoaderData<string, PageManagementSet>;
}
interface MaterialListLoaderData
{
    args: MaterialListLoaderArgs;
    res: MaterialListLoaderRes;
}
interface QueryParam
{
    lang: Lang;
    opts: IMaterialListOptions;
    viewState?: IListViewState;
}
interface RawData
{
    pageSize: number;
    pageNumber: number;
    totalPages: number;
    totalCount: number;
    listData: MaterialSet[];
    categoryMap: Record<string, string>;
    tagMap: Record<string, string>;
    pageData: PageManagementSet;
    pageDetail: PageManagementDetail | null;
    pageTitle: string;
}
interface UseMaterialListDataResult
{
    rawData: RawData;
    isLoading: boolean;
    errorList: string[];
    onPageChange: (page: number) => void;
}
// #endregion

// #region Public
/** SSR Loader：首屏撈 material + category + tag + page content */
export const Client_Material_List_Loader = (props: QueryParam) => async ({ request }: LoaderFunctionArgs): Promise<MaterialListLoaderData> =>
{
    const ssrApi = getSsrApi(request);
    const material = MaterialAdapter(ssrApi);
    const category = CategoryAdapter(ssrApi);
    const tag = TagAdapter(ssrApi);
    const page = PageManagementAdapter(ssrApi);
    const args = buildLoaderArgs(props);

    const gridLoader = material.loader.createQueryGridDataLoader({ getCondition: () => args.matParam, getApiInstance: () => ssrApi });
    const cateLoader = category.loader.createMapByProgIdLoader({ progId: PGID.Material, lang: props.lang, getApiInstance: () => ssrApi });
    const tagLoader = tag.loader.createMapByProgIdLoader({ progId: PGID.Material, lang: props.lang, getApiInstance: () => ssrApi });
    const pageLoader = page.loader.createQueryDataLoader({ getInternalId: () => args.pageId, getApiInstance: () => ssrApi });

    const [gridRes, categoryRes, tagRes, pageRes] = await Promise.all([
        gridLoader({ request } as LoaderFunctionArgs),
        cateLoader({ request } as LoaderFunctionArgs),
        tagLoader({ request } as LoaderFunctionArgs),
        args.pageId ? pageLoader({ request } as LoaderFunctionArgs) : Promise.resolve(buildEmptyPageLoaderData(args.pageId)),
    ]);

    const res: MaterialListLoaderRes = { gridRes, categoryRes, tagRes, pageRes };
    return { args, res };
};

/** CSR Hook：Component 一行拿資料，切頁/條件變動時自動重撈 */
export const useMaterialListData = (props: QueryParam): UseMaterialListDataResult =>
{
    const initial = useLoaderData() as MaterialListLoaderData;

    const material = useMemo(() => MaterialAdapter(), []);
    const category = useMemo(() => CategoryAdapter(), []);
    const tag = useMemo(() => TagAdapter(), []);
    const page = useMemo(() => PageManagementAdapter(), []);

    const currentArgs = useMemo(() => buildLoaderArgs(props), [
        props.lang,
        props.opts.PageId,
        props.opts.CategoryId,
        props.opts.TagIds,
        props.viewState?.pageNumber,
        props.viewState?.pageSize,
        props.viewState?.keyword,
    ]);

    const gridInitial = useMemo<ApiGridInitial<MaterialSet>>(() =>
    {
        return {
            model: initial.res.gridRes.model,
            count: matchQueryInitial(currentArgs.matParam, initial.res.gridRes.count),
            list: matchQueryInitial(currentArgs.matParam, initial.res.gridRes.list),
        };
    }, [currentArgs.matParam, initial.res.gridRes]);

    const pageInitial = useMemo(() => matchDataInitial(currentArgs.pageId, initial.res.pageRes), [currentArgs.pageId, initial.res.pageRes]);
    const grid = material.hooks.useQueryGridData({ baseParam: currentArgs.matParam, deps: [currentArgs.matParam], initial: gridInitial });
    const pageData = page.hooks.useQueryData({ internalId: currentArgs.pageId, initial: pageInitial, deps: [currentArgs.pageId, props.lang] });
    const categoryMap = category.hooks.useMapByProgId({ progId: PGID.Material, lang: props.lang, initial: initial.res.categoryRes, deps: [props.lang] });
    const tagMap = tag.hooks.useMapByProgId({ progId: PGID.Material, lang: props.lang, initial: initial.res.tagRes, deps: [props.lang] });

    const pageSet = useMemo(() => pageData.data ?? emptyPageData, [pageData.data]);
    const pageDetail = useMemo(() => findPageDetail(pageSet, props.lang), [pageSet, props.lang]);

    const resetKey = useMemo(() => buildResetKey(props), [
        props.lang,
        props.opts.PageId,
        props.opts.CategoryId,
        props.opts.TagIds,
        props.viewState?.pageSize,
        props.viewState?.keyword,
    ]);

    useResetListPageOnKeyChange(resetKey, grid.onPageChange);

    const isLoading = useMemo(() => Boolean(grid.isLoading || categoryMap.isLoading || tagMap.isLoading || pageData.isLoading), [
        grid.isLoading,
        categoryMap.isLoading,
        tagMap.isLoading,
        pageData.isLoading,
    ]);

    const errorList = useMemo(() => [grid.errorText, categoryMap.errorText, tagMap.errorText, pageData.errorText].filter((x): x is string => Boolean(x)), [
        grid.errorText,
        categoryMap.errorText,
        tagMap.errorText,
        pageData.errorText,
    ]);

    return {
        rawData: {
            pageSize: currentArgs.matParam.PageSize ?? 12,
            pageNumber: grid.pageNumber,
            totalPages: grid.totalPages,
            totalCount: grid.count,
            listData: grid.list ?? [],
            categoryMap: categoryMap.data ?? initial.res.categoryRes,
            tagMap: tagMap.data ?? initial.res.tagRes,
            pageData: pageSet,
            pageDetail,
            pageTitle: pageDetail?.Title ?? "",
        },
        isLoading,
        errorList,
        onPageChange: grid.onPageChange,
    };
};
// #endregion

// #region Private
const emptyPageData: PageManagementSet = { PageManagement: {}, PageManagementDetail: [] };

/** 建物件 QueryListParam */
const buildMaterialQuery = (lang: Lang, pageNumber: number, pageSize: number, catIds: string, tagIds: string, kw?: string): QueryListParam =>
{
    let condition = LibMerge(
        " And ",
        false,
        `${MaterialFields._MaterialLangInfo}.${MaterialLangInfoFields.Lang} = ${lang}`,
        `${MaterialFields._MaterialLangInfo}.${MaterialLangInfoFields.MaterialName} != ''`,
    );

    if (kw)
    {
        condition = LibMerge(" And ", false, condition, `${MaterialFields._MaterialLangInfo}.${MaterialLangInfoFields.MaterialName} Like ${kw}`);
    }
    if (catIds)
    {
        condition = LibMerge(" And ", false, condition, `${MaterialFields.CategoryId} In ${catIds}`);
    }
    if (tagIds)
    {
        condition = LibMerge(" And ", false, condition, `${MaterialFields._MaterialTags}.${MaterialTagsFields.TagId} In ${tagIds}`);
    }

    return {
        Fields: [
            MaterialFields.MaterialId,
            MaterialFields.InternalId,
            MaterialFields.CategoryId,
            MaterialFields.Price,
            `${MaterialFields._MaterialLangInfo}.${MaterialLangInfoFields.Lang}`,
            `${MaterialFields._MaterialLangInfo}.${MaterialLangInfoFields.MaterialName}`,
            `${MaterialFields._MaterialLangInfo}.${MaterialLangInfoFields.MaterialInfoJson}`,
            `${MaterialFields._MaterialPicture}.${MaterialPictureFields.PictureId}`,
            `${MaterialFields._MaterialPicture}.${MaterialPictureFields.PictureName}`,
        ],
        Condition: condition,
        OrderBy: [{ Col: MaterialFields.CreateTime, Desc: true }],
        PageNumber: pageNumber,
        PageSize: pageSize,
    };
};

/** 組 loader / hook 共用參數 */
const buildLoaderArgs = (props: QueryParam): MaterialListLoaderArgs =>
{
    const keyword = props.viewState?.keyword?.trim();
    const pageNumber = props.viewState?.pageNumber ?? 1;
    const pageSize = props.viewState?.pageSize ?? 12;
    const pageId = `${props.opts.PageId ?? ""}`.trim();
    return { pageId, matParam: buildMaterialQuery(props.lang, pageNumber, pageSize, props.opts.CategoryId, props.opts.TagIds, keyword) };
};

/** 建立空的 PageManagement loader data，避免未設定 PageId 時仍打 API */
const buildEmptyPageLoaderData = (pageId: string): ApiLoaderData<string, PageManagementSet> =>
{
    return { args: pageId, apiRes: { IsSuccess: true, Data: emptyPageData, SysMessage: [] } };
};

/** 依語系取得頁面內容明細 */
const findPageDetail = (data: PageManagementSet, lang: Lang): PageManagementDetail | null =>
{
    const detail = data.PageManagementDetail?.find(p => (p.Lang ?? "").toLowerCase() === lang.toLowerCase());
    return detail ?? data.PageManagementDetail?.[0] ?? null;
};

/** 比對 SSR initial 是否可沿用 */
const matchQueryInitial = <TData>(
    currentParam: QueryListParam,
    initial: ApiLoaderData<QueryListParam, TData> | null | undefined,
): ApiLoaderData<QueryListParam, TData> | null =>
{
    const currentKey = JSON.stringify(currentParam ?? null);
    const initialKey = JSON.stringify(initial?.args ?? null);
    return currentKey === initialKey ? (initial ?? null) : null;
};

/** 比對單筆資料 SSR initial 是否可沿用 */
const matchDataInitial = <TData>(currentArg: string, initial: ApiLoaderData<string, TData> | null | undefined): ApiLoaderData<string, TData> | null =>
{
    return currentArg === (initial?.args ?? "") ? (initial ?? null) : null;
};

/** 組合重置Key */
const buildResetKey = (p: { lang: Lang; opts: IMaterialListOptions; viewState?: Omit<IListViewState, "pageNumber" | "sortField" | "sortDesc">; }): string =>
{
    return JSON.stringify({
        lang: p.lang,
        pageId: p.opts.PageId ?? "",
        categoryId: p.opts.CategoryId ?? "",
        tagIds: p.opts.TagIds ?? "",
        pageSize: p.viewState?.pageSize,
        keyword: p.viewState?.keyword ?? "",
    });
};
// #endregion
