import type { Lang } from "@/SysCore/i18n/lang";
import { getSsrApi } from "@/SysCore/Utils/API/APIBase";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
import type { LoaderFunctionArgs } from "react-router-dom";

import {
    CategoryDataSetFields,
    CategoryDetailFields,
    CategoryFields,
    PGID,
    WebResourceFields,
    WebResourceInfoFields,
} from "@/types/SchemaFields";

import { CategoryAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Category/Category_Api";
import { WebResourceAdapter } from "@/Features/Hooks/BizFunc/WebManagement/WebResource/WebResource_Api";
import type { IWebResourceListOptions } from "./WebResourceList";

type QueryListParam = components["schemas"]["QueryListParam"];
type WebResourceSet = components["schemas"]["WebResourceSet_DTO"];
type CategorySet = components["schemas"]["CategoryDataSet_DTO"];

export interface WebResourceListLoaderArgs
{
    baseParam: QueryListParam;
    cateParam: QueryListParam;

    lang: Lang;
    categoryIds: string;
    tagIds: string;
    style: number;
}

export interface WebResourceListLoaderRes
{
    countRes: number;
    listRes: WebResourceSet[];
    cateRes: CategorySet[];
}

export interface WebResourceListLoaderData
{
    args: WebResourceListLoaderArgs;
    res: WebResourceListLoaderRes;
}

const buildCondition = (p: { lang: Lang; opts: IWebResourceListOptions; }) =>
{
    // 宣告變數
    let condition = "";

    if (p.opts.Category)
    {
        condition = LibMerge(" And ", false, condition, `${WebResourceFields.Categories} HasAny [${p.opts.Category}]`);
    }
    if (p.opts.Tag) condition = LibMerge(" And ", false, condition, `${WebResourceFields.Tags} HasAny [${p.opts.Tag}]`);

    condition = LibMerge(" And ", false, condition, `${WebResourceFields.ContentStatus} !& 4`);
    condition = LibMerge(
        " And ",
        false,
        condition,
        `${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.Lang} = ${p.lang}`,
    );
    condition = LibMerge(
        " And ",
        false,
        condition,
        `${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.Title} != ''`,
    );

    // return
    return condition;
};

const buildBaseParam = (p: { lang: Lang; opts: IWebResourceListOptions; }): QueryListParam =>
{
    // 宣告變數
    const condition = buildCondition(p);

    // return
    return {
        Fields: [
            WebResourceFields.InternalId,
            WebResourceFields.WebResourceId,
            WebResourceFields.PicId,
            WebResourceFields.PicDescription,
            WebResourceFields.Categories,
            WebResourceFields.ContentStatus,
            WebResourceFields.CreateTime,

            `${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.Lang}`,
            `${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.Title}`,
            `${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.Content}`,
            `${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.ResUrl}`,
            `${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.Url_OpenType}`,
        ],
        Condition: condition,
        RankGroups: [{ Condition: `${WebResourceFields.ContentStatus} & 1` }],
        OrderBy: [{ Col: WebResourceFields.CreateTime, Desc: true }],
        PageNumber: 1,
        PageSize: 10,
    };
};

const buildCateParam = (lang: Lang): QueryListParam =>
{
    // return：只抓 WebResource 的分類（ProgId=WebResource）+ 指定語系
    return {
        Fields: [
            `${CategoryDataSetFields.Category}.${CategoryFields.CategoryId}`,
            `${CategoryDataSetFields.Category}.${CategoryFields.ProgId}`,

            `${CategoryDataSetFields.CategoryDetail}.${CategoryDetailFields.Lang}`,
            `${CategoryDataSetFields.CategoryDetail}.${CategoryDetailFields.CategoryName}`,
        ],
        Condition: `${CategoryFields.ProgId} = ${PGID.WebResource} And `
            + `${CategoryFields._CategoryDetail}.${CategoryDetailFields.Lang} = ${lang} And `
            + `${CategoryFields._CategoryDetail}.${CategoryDetailFields.CategoryName} != ''`,
        PageNumber: 0,
        PageSize: 0,
    };
};

/** ✅ Loader：固定條件全部在這裡完成 */
export const WebResourceList_Loader =
    (p: { lang: Lang; opts: IWebResourceListOptions; }) =>
    async ({ request }: LoaderFunctionArgs): Promise<WebResourceListLoaderData> =>
    {
        // 宣告變數
        const ssrApi = getSsrApi(request);

        const webRes = WebResourceAdapter(ssrApi);
        const cate = CategoryAdapter(ssrApi);

        const baseParam = buildBaseParam(p);
        const cateParam = buildCateParam(p.lang);

        // 執行 function：SSR 首屏撈 count + list + categories
        const countLoader = webRes.loader.createQueryCountLoader({
            getCondition: () => baseParam,
            getApiInstance: () => ssrApi,
        });

        const listLoader = webRes.loader.createQueryListLoader({
            getCondition: () => baseParam,
            getApiInstance: () => ssrApi,
        });

        const cateLoader = cate.loader.createQueryListLoader({
            getCondition: () => cateParam,
            getApiInstance: () => ssrApi,
        });

        const [countLD, listLD, cateLD] = await Promise.all([
            countLoader({ request } as LoaderFunctionArgs),
            listLoader({ request } as LoaderFunctionArgs),
            cateLoader({ request } as LoaderFunctionArgs),
        ]);

        // return
        return {
            args: {
                baseParam,
                cateParam,
                lang: p.lang,
                categoryIds: p.opts.Category ?? "",
                tagIds: p.opts.Tag ?? "",
                style: p.opts.Style,
            },
            res: {
                countRes: countLD.apiRes.Data ?? 0,
                listRes: listLD.apiRes.Data ?? [],
                cateRes: cateLD.apiRes.Data ?? [],
            },
        };
    };
