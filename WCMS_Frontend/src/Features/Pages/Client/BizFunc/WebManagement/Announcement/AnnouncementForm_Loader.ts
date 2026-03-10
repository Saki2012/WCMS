import { AnnouncementAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Announcement_Api";
import { CategoryAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Category_Api";
import { TagAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Tag_Api";
import type { Lang } from "@/SysCore/i18n/lang";
import { getSsrApi } from "@/SysCore/Utils/API/APIBase";
import type { components } from "@/types/api";
import {CategoryDataSetFields,CategoryDetailFields,CategoryFields,TagDataFields,TagDetailFields,TagSetFields,} from "@/types/SchemaFields";
import type { LoaderFunctionArgs } from "react-router-dom";
type QueryListParam = components["schemas"]["QueryListParam"];
type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"];
type CategorySet = components["schemas"]["CategoryDataSet_DTO"];
type TagSet = components["schemas"]["TagSet_DTO"];

export interface AnnouncementFormLoaderArgs
{
    internalId: string;

    // SSR 查詢參數（CSR hydration 以此為準）
    dataId: string;
    cateParam: QueryListParam;
    tagParam: QueryListParam;
}

export interface AnnouncementFormLoaderRes
{
    dataRes: AnnouncementSet | null;
    categoryRes: CategorySet[];
    tagRes: TagSet[];
}

export interface AnnouncementFormLoaderData
{
    args: AnnouncementFormLoaderArgs;
    res: AnnouncementFormLoaderRes;
}

const buildInList = (csv?: string) =>
{
    // 宣告變數
    const list = (csv ?? "")
        .split(",")
        .map(s => s.trim())
        .filter(Boolean)
        .join(",");

    // return
    return list;
};

const buildEmptyCategoryQuery = (): QueryListParam =>
{
    // return：用 1=0 避免打回一堆資料（但仍是有效查詢）
    return {
        Fields: [
            CategoryFields.CategoryId,
            `${CategoryFields._CategoryDetail}.${CategoryDetailFields.Lang}`,
            `${CategoryFields._CategoryDetail}.${CategoryDetailFields.CategoryName}`,
        ],
        Condition: "1=0",
        PageNumber: 0,
        PageSize: 0,
    };
};

const buildEmptyTagQuery = (): QueryListParam =>
{
    // return：用 1=0 避免打回一堆資料（但仍是有效查詢）
    return {
        Fields: [
            TagDataFields.TagId,
            `${TagDataFields._TagDetail}.${TagDetailFields.Lang}`,
            `${TagDataFields._TagDetail}.${TagDetailFields.TagName}`,
        ],
        Condition: "1=0",
        PageNumber: 0,
        PageSize: 0,
    };
};

const buildCategoryQuery = (p: { lang: string; categoryIdsCsv: string; }): QueryListParam =>
{
    // 宣告變數
    const inList = buildInList(p.categoryIdsCsv);
    if (!inList) return buildEmptyCategoryQuery();

    const condition = `${CategoryFields.CategoryId} HasAny [${inList}] And `
        + `${CategoryFields._CategoryDetail}.${CategoryDetailFields.Lang} = ${p.lang}`;

    // return
    return {
        Fields: [
            `${CategoryDataSetFields.Category}.${CategoryFields.CategoryId}`,
            `${CategoryDataSetFields.CategoryDetail}.${CategoryDetailFields.Lang}`,
            `${CategoryDataSetFields.CategoryDetail}.${CategoryDetailFields.CategoryName}`,
        ],
        Condition: condition,
        PageNumber: 0,
        PageSize: 0,
    };
};

const buildTagQuery = (p: { lang: string; tagIdsCsv: string; }): QueryListParam =>
{
    // 宣告變數
    const inList = buildInList(p.tagIdsCsv);
    if (!inList) return buildEmptyTagQuery();

    const condition = `${TagDataFields.TagId} HasAny [${inList}] And `
        + `${TagDataFields._TagDetail}.${TagDetailFields.Lang} = ${p.lang}`;

    // return
    return {
        Fields: [
            `${TagSetFields.TagData}.${TagDataFields.TagId}`,
            `${TagSetFields.TagDetail}.${TagDetailFields.Lang}`,
            `${TagSetFields.TagDetail}.${TagDetailFields.TagName}`,
        ],
        Condition: condition,
        PageNumber: 0,
        PageSize: 0,
    };
};

/**
 * ✅ loader factory：比照 AnnouncementList_Loader
 */
export const AnnouncementFormLoader =
    (p: { lang: Lang; }) => async ({ request, params }: LoaderFunctionArgs): Promise<AnnouncementFormLoaderData> =>
    {
        // 宣告變數
        const internalId = `${params?.internalId ?? ""}`.trim();
        const ssrApi = getSsrApi(request);

        const announce = AnnouncementAdapter(ssrApi);
        const cate = CategoryAdapter(ssrApi);
        const tag = TagAdapter(ssrApi);

        // 沒 internalId：回空資料（避免 loader 爆炸）
        if (!internalId)
        {
            const emptyCate = buildEmptyCategoryQuery();
            const emptyTag = buildEmptyTagQuery();
            return {
                args: { internalId, dataId: "", cateParam: emptyCate, tagParam: emptyTag },
                res: { dataRes: null, categoryRes: [], tagRes: [] },
            };
        }

        // 執行 function：先抓表單資料（SSR 首屏）
        const dataLoader = announce.loader.createQueryDataLoader({
            getInternalId: () => internalId,
            getApiInstance: () => ssrApi,
        });
        const dataLD = await dataLoader({ request, params } as LoaderFunctionArgs);
        const dataRes = dataLD.apiRes.Data ?? null;

        // 執行 function：由表單資料推 category/tag ids（SSR 一次打完）
        const categoryIdsCsv = dataRes?.Announcement?.Categories ?? "";
        const tagIdsCsv = dataRes?.Announcement?.Tags ?? "";
        const cateParam = buildCategoryQuery({ lang: p.lang as string, categoryIdsCsv });
        const tagParam = buildTagQuery({ lang: p.lang as string, tagIdsCsv });

        const cateLoader = cate.loader.createQueryListLoader({
            getCondition: () => cateParam,
            getApiInstance: () => ssrApi,
        });
        const tagLoader = tag.loader.createQueryListLoader({
            getCondition: () => tagParam,
            getApiInstance: () => ssrApi,
        });

        const [cateLD, tagLD] = await Promise.all([
            cateLoader({ request, params } as LoaderFunctionArgs),
            tagLoader({ request, params } as LoaderFunctionArgs),
        ]);

        // return：只回「純資料」（跟 AnnouncementListLoaderData 對齊）
        return {
            args: { internalId, dataId: internalId, cateParam, tagParam },
            res: {
                dataRes,
                categoryRes: cateLD.apiRes.Data ?? [],
                tagRes: tagLD.apiRes.Data ?? [],
            },
        };
    };
