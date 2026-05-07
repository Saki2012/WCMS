import { CategoryAdapter, type CategoryMapLoaderData } from "@/Features/Hooks/BizFunc/COMM/Category_Api";
import { TagAdapter, type TagMapLoaderData } from "@/Features/Hooks/BizFunc/COMM/Tag_Api";
import { MaterialAdapter } from "@/Features/Hooks/BizFunc/MAT/Material_Api";
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

export interface IMaterialListOptions
{
    CategoryId: string;
    TagIds: string;
}

// #region Property
interface MaterialListLoaderArgs
{
    matParam: QueryListParam;
}
interface MaterialListLoaderRes
{
    gridRes: ApiGridLoaderData<MaterialSet>;
    categoryRes: CategoryMapLoaderData;
    tagRes: TagMapLoaderData;
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
/** SSR Loader：首屏撈 material + category + tag */
export const Client_Material_List_Loader = (props: QueryParam) => async ({ request }: LoaderFunctionArgs): Promise<MaterialListLoaderData> =>
{
    const ssrApi = getSsrApi(request);
    const material = MaterialAdapter(ssrApi);
    const category = CategoryAdapter(ssrApi);
    const tag = TagAdapter(ssrApi);
    const args = buildLoaderArgs(props);
    const gridLoader = material.loader.createQueryGridDataLoader({ getCondition: () => args.matParam, getApiInstance: () => ssrApi });
    const cateLoader = category.loader.createMapByProgIdLoader({ progId: PGID.Material, lang: props.lang, getApiInstance: () => ssrApi });
    const tagLoader = tag.loader.createMapByProgIdLoader({ progId: PGID.Material, lang: props.lang, getApiInstance: () => ssrApi });
    const [gridRes, categoryRes, tagRes] = await Promise.all([
        gridLoader({ request } as LoaderFunctionArgs),
        cateLoader({ request } as LoaderFunctionArgs),
        tagLoader({ request } as LoaderFunctionArgs),
    ]);
    const res: MaterialListLoaderRes = { gridRes, categoryRes, tagRes };
    return { args, res };
};
/** CSR Hook：Component 一行拿資料，切頁/條件變動時自動重撈 */
export const useMaterialListData = (props: QueryParam): UseMaterialListDataResult =>
{
    const initial = useLoaderData() as MaterialListLoaderData;

    const material = useMemo(() => MaterialAdapter(), []);
    const category = useMemo(() => CategoryAdapter(), []);
    const tag = useMemo(() => TagAdapter(), []);

    const currentArgs = useMemo(() => buildLoaderArgs(props), [
        props.lang,
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

    const grid = material.hooks.useQueryGridData({ baseParam: currentArgs.matParam, deps: [currentArgs.matParam], initial: gridInitial });

    const categoryMap = category.hooks.useMapByProgId({ progId: PGID.Material, lang: props.lang, initial: initial.res.categoryRes, deps: [props.lang] });

    const tagMap = tag.hooks.useMapByProgId({ progId: PGID.Material, lang: props.lang, initial: initial.res.tagRes, deps: [props.lang] });

    const resetKey = useMemo(() => buildResetKey(props), [
        props.lang,
        props.opts.CategoryId,
        props.opts.TagIds,
        props.viewState?.pageSize,
        props.viewState?.keyword,
    ]);
    useResetListPageOnKeyChange(resetKey, grid.onPageChange);
    const isLoading = useMemo(() => Boolean(grid.isLoading || categoryMap.isLoading || tagMap.isLoading), [
        grid.isLoading,
        categoryMap.isLoading,
        tagMap.isLoading,
    ]);
    const errorList = useMemo(() => [grid.errorText, categoryMap.errorText, tagMap.errorText].filter((x): x is string => Boolean(x)), [
        grid.errorText,
        categoryMap.errorText,
        tagMap.errorText,
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
        },
        isLoading,
        errorList,
        onPageChange: grid.onPageChange,
    };
};
// #endregion

// #region Private
/** 建物件 QueryListParam */
const buildMaterialQuery = (lang: Lang, pageNumber: number, pageSize: number, catIds: string, tagIds: string, kw?: string): QueryListParam =>
{
    // 宣告變數
    let condition = LibMerge(
        " And ",
        false,
        `${MaterialFields._MaterialLangInfo}.${MaterialLangInfoFields.Lang} = ${lang}`,
        `${MaterialFields._MaterialLangInfo}.${MaterialLangInfoFields.MaterialName} != ''`,
    );
    // 執行 function
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
    return { matParam: buildMaterialQuery(props.lang, pageNumber, pageSize, props.opts.CategoryId, props.opts.TagIds, keyword) };
};
/** 比對 SSR initial 是否可沿用 */
const matchQueryInitial = <TData>(
    currentParam: QueryListParam,
    initial: ApiLoaderData<QueryListParam, TData> | null | undefined,
): ApiLoaderData<QueryListParam, TData> | null =>
{
    // 宣告變數
    const currentKey = JSON.stringify(currentParam ?? null);
    const initialKey = JSON.stringify(initial?.args ?? null);
    // return
    return currentKey === initialKey ? (initial ?? null) : null;
};
/** 組合重置Key */
const buildResetKey = (p: { lang: Lang; opts: IMaterialListOptions; viewState?: Omit<IListViewState, "pageNumber" | "sortField" | "sortDesc">; }): string =>
{
    return JSON.stringify({
        lang: p.lang,
        categoryId: p.opts.CategoryId ?? "",
        tagIds: p.opts.TagIds ?? "",
        pageSize: p.viewState?.pageSize,
        keyword: p.viewState?.keyword ?? "",
    });
};
// #endregion
