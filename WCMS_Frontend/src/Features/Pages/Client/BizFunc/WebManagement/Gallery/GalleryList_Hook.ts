import type { Lang } from "@/SysCore/i18n/lang";
import { getSsrApi } from "@/SysCore/Utils/API/APIBase";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
import {CategoryDataSetFields,CategoryDetailFields,CategoryFields,GalleryFields,GalleryInfoFields,PGID,} from "@/types/SchemaFields";
import type { LoaderFunctionArgs } from "react-router-dom";

// ✅ 依你新架構：改用 Adapter（若你專案內名稱不同，改成對應的 XxxAdapter 即可）
import { CategoryAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Category/Category_Api";
import { GalleryAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Gallery/Gallery_Api";
import type { IGalleryListOptions } from "./GalleryList_Comp";

type QueryListParam = components["schemas"]["QueryListParam"];
type GallerySet = components["schemas"]["GallerySet_DTO"];
type CategorySet = components["schemas"]["CategoryDataSet_DTO"];

export interface GalleryListLoaderArgs
{
    baseParam: QueryListParam;
    cateParam: QueryListParam;

    // 用來在 CSR 判斷 initial 是否可用
    lang: Lang;
    categoryIds: string;
    tagIds: string;
}

export interface GalleryListLoaderRes
{
    countRes: number;
    listRes: GallerySet[];
    cateRes: CategorySet[];
}

export interface GalleryListLoaderData
{
    args: GalleryListLoaderArgs;
    res: GalleryListLoaderRes;
}

const buildCondition = (p: { lang: Lang; opts: IGalleryListOptions; }) =>
{
    // 宣告變數
    let condition = "";

    if (p.opts.Category)
    {
        condition = LibMerge(" And ", false, condition, `${GalleryFields.Categories} HasAny [${p.opts.Category}]`);
    }
    if (p.opts.Tag) condition = LibMerge(" And ", false, condition, `${GalleryFields.Tags} HasAny [${p.opts.Tag}]`);

    condition = LibMerge(" And ", false, condition, `${GalleryFields.ContentStatus} !& 4`); // 不包含隱藏資料
    condition = LibMerge(" And ", false, condition, `${GalleryFields._GalleryInfo}.${GalleryInfoFields.Lang} = ${p.lang}`,);
    condition = LibMerge(" And ", false, condition, `${GalleryFields._GalleryInfo}.${GalleryInfoFields.Title} != ''`);

    // return
    return condition;
};

const buildBaseParam = (p: { lang: Lang; opts: IGalleryListOptions; }): QueryListParam =>
{
    // 宣告變數
    const condition = buildCondition(p);

    // return
    return {
        Fields: [
            GalleryFields.InternalId,GalleryFields.Categories,GalleryFields.CoverPicSrcId,
            GalleryFields.CreateTime,GalleryFields.Validate_Start,GalleryFields.ContentStatus,
            `${GalleryFields._GalleryInfo}.${GalleryInfoFields.Lang}`,
            `${GalleryFields._GalleryInfo}.${GalleryInfoFields.Title}`,
        ],
        Condition: condition,
        RankGroups: [{ Condition: `${GalleryFields.ContentStatus} & 1` }],
        OrderBy: [
            { Col: GalleryFields.Validate_Start, Desc: true },
            { Col: GalleryFields.CreateTime, Desc: true },
        ],
        PageNumber: 1,
        PageSize: 12,
    };
};

const buildCateParam = (lang: Lang): QueryListParam =>
{
    // return：只抓 Gallery 用的分類（ProgId=Gallery）+ 指定語系
    return {
        Fields: [
            `${CategoryDataSetFields.Category}.${CategoryFields.CategoryId}`,
            `${CategoryDataSetFields.Category}.${CategoryFields.ProgId}`,

            `${CategoryDataSetFields.CategoryDetail}.${CategoryDetailFields.Lang}`,
            `${CategoryDataSetFields.CategoryDetail}.${CategoryDetailFields.CategoryName}`,
        ],
        Condition: `${CategoryFields.ProgId} = ${PGID.Gallery} And `
            + `${CategoryFields._CategoryDetail}.${CategoryDetailFields.Lang} = ${lang} And `
            + `${CategoryFields._CategoryDetail}.${CategoryDetailFields.CategoryName} != ''`,
        PageNumber: 0,
        PageSize: 0,
    };
};

/** ✅ loader factory：固定條件全部在這裡完成 */
export const GalleryList_Loader =
    (p: { lang: Lang; opts: IGalleryListOptions; }) =>
    async ({ request }: LoaderFunctionArgs): Promise<GalleryListLoaderData> =>
    {
        // 宣告變數
        const ssrApi = getSsrApi(request);
        const gallery = GalleryAdapter(ssrApi);
        const category = CategoryAdapter(ssrApi);

        const baseParam = buildBaseParam(p);
        const cateParam = buildCateParam(p.lang);

        // 執行 function：SSR 首屏撈 count + list + categories
        const countLoader = gallery.loader.createQueryCountLoader({
            getCondition: () => baseParam,
            getApiInstance: () => ssrApi,
        });

        const listLoader = gallery.loader.createQueryListLoader({
            getCondition: () => baseParam,
            getApiInstance: () => ssrApi,
        });

        const cateLoader = category.loader.createQueryListLoader({
            getCondition: () => cateParam,
            getApiInstance: () => ssrApi,
        });

        const [countLD, listLD, cateLD] = await Promise.all([
            countLoader({ request } as LoaderFunctionArgs),
            listLoader({ request } as LoaderFunctionArgs),
            cateLoader({ request } as LoaderFunctionArgs),
        ]);

        // return：只回純資料
        return {
            args: {
                baseParam,
                cateParam,
                lang: p.lang,
                categoryIds: p.opts.Category ?? "",
                tagIds: p.opts.Tag ?? "",
            },
            res: {
                countRes: countLD.apiRes.Data ?? 0,
                listRes: listLD.apiRes.Data ?? [],
                cateRes: cateLD.apiRes.Data ?? [],
            },
        };
    };
