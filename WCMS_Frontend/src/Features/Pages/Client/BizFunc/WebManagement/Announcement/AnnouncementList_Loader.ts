import { AnnouncementAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Announcement/Announcement_Api";
import { CategoryAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Category/Category_Api";
import { TagAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Tags/Tag_Api";
import type { IAnnouncementListOptions } from "@/Features/Pages/Client/BizFunc/WebManagement/Announcement/AnnouncementList";
import type { Lang } from "@/SysCore/i18n/lang";
import { getSsrApi } from "@/SysCore/Utils/API/APIBase";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import {
    AnnouncementDetailFields,
    AnnouncementFields,
    CategoryDetailFields,
    CategoryFields,
    PGID,
    TagDataFields,
    TagDetailFields,
} from "@/types/SchemaFields";
import type { LoaderFunctionArgs } from "react-router-dom";

type QueryListParam = components["schemas"]["QueryListParam"];
type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"];
type CategorySet = components["schemas"]["CategoryDataSet_DTO"];
type TagSet = components["schemas"]["TagSet_DTO"];

export interface AnnouncementListLoaderArgs
{
    pageSize: number;
    pageNumber: number;
    // SSR 基底條件/參數（CSR hydration 以此為準）
    condition: string;
    listParam: QueryListParam;
    countParam: QueryListParam;
    cateParam: QueryListParam;
    tagParam: QueryListParam;
}

export interface AnnouncementListLoaderRes
{
    colNameRes: ModelDisplaySchema | null;
    listRes: AnnouncementSet[];
    countRes: number;
    categoryRes: CategorySet[];
    tagRes: TagSet[];
}

export interface AnnouncementListLoaderData
{
    args: AnnouncementListLoaderArgs;
    res: AnnouncementListLoaderRes;
}

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const formatLocalIso = (d: Date): string =>
{
    // 宣告變數
    const y = d.getFullYear();
    const m = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const h = pad(d.getHours());
    const mi = pad(d.getMinutes());
    const s = pad(d.getSeconds());
    const ms = `${d.getMilliseconds()}`.padStart(3, "0");

    // return
    return `${y}-${m}-${day}T${h}:${mi}:${s}.${ms}`;
};

const calcPageSize = (style?: number): number =>
{
    // 宣告變數
    const s = style ?? 0;
    // 執行 function
    if (s === 2) return 12;
    if (s === 8) return 0; // timeline 一次全撈
    // return
    return 10;
};

const buildAnnouncementCondition = (
    p: { lang: Lang; nowIsoLocal: string; categoryIds: string; tagIds: string; keyword?: string; },
): string =>
{
    // 宣告變數
    let condition = "";
    // 執行 function
    condition = LibMerge(" And ", false, condition, `${AnnouncementFields.Validate_Start} <= ${p.nowIsoLocal}`);
    condition = LibMerge(
        " And ",
        false,
        condition,
        `(${AnnouncementFields.Validate_End} >= ${p.nowIsoLocal} Or ${AnnouncementFields.Validate_End} is null)`,
    );
    condition = LibMerge(" And ", false, condition, `${AnnouncementFields.ContentStatus} !& 4`);
    condition = LibMerge(
        " And ",
        false,
        condition,
        `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Lang} = ${p.lang}`,
    );
    condition = LibMerge(
        " And ",
        false,
        condition,
        `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Title} != ''`,
    );

    if (p.keyword)
    {
        condition = LibMerge(
            " And ",
            false,
            condition,
            `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Title} Like ${p.keyword}`,
        );
    }
    if (p.categoryIds)
    {
        condition = LibMerge(" And ", false, condition, `${AnnouncementFields.Categories} HasAny [${p.categoryIds}]`);
    }
    if (p.tagIds) condition = LibMerge(" And ", false, condition, `${AnnouncementFields.Tags} HasAny [${p.tagIds}]`);

    // return
    return condition;
};

const buildAnnouncementQuery = (p: { condition: string; pageNumber: number; pageSize: number; }): QueryListParam =>
{
    // 宣告變數
    const { condition, pageNumber, pageSize } = p;

    // return
    return {
        Fields: [
            AnnouncementFields.AnnouncementId,
            AnnouncementFields.InternalId,
            AnnouncementFields.ContentStatus,
            AnnouncementFields.PictureId,
            AnnouncementFields.PicDescription,
            AnnouncementFields.Categories,
            AnnouncementFields.Tags,
            AnnouncementFields.Validate_Start,
            `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Lang}`,
            `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Title}`,
            `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.SubTitle}`,
            `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Content}`,
            AnnouncementFields.ViewCount,
        ],
        Condition: condition,
        RankGroups: [{ Condition: `${AnnouncementFields.ContentStatus} & 1` }],
        OrderBy: [
            { Col: AnnouncementFields.Validate_Start, Desc: true },
            { Col: AnnouncementFields.CreateTime, Desc: true },
        ],
        PageNumber: pageNumber,
        PageSize: pageSize,
    };
};

const buildCategoryQuery = (progId: string): QueryListParam =>
{
    // return
    return {
        Fields: [
            CategoryFields.InternalId,
            CategoryFields.CategoryId,
            CategoryFields.ProgId,
            `${CategoryFields._CategoryDetail}.${CategoryDetailFields.Lang}`,
            `${CategoryFields._CategoryDetail}.${CategoryDetailFields.CategoryName}`,
        ],
        Condition: progId ? `${CategoryFields.ProgId} = ${progId}` : "",
        OrderBy: [{ Col: CategoryFields.CreateTime, Desc: false }],
        PageNumber: 0,
        PageSize: 0,
    };
};

const buildTagQuery = (progId: string): QueryListParam =>
{
    // return
    return {
        Fields: [
            TagDataFields.InternalId,
            TagDataFields.TagId,
            TagDataFields.ProgId,
            `${TagDataFields._TagDetail}.${TagDetailFields.Lang}`,
            `${TagDataFields._TagDetail}.${TagDetailFields.TagName}`,
        ],
        Condition: progId ? `${TagDataFields.ProgId} = ${progId}` : "",
        OrderBy: [{ Col: TagDataFields.ModifyTime, Desc: true }],
        PageNumber: 0,
        PageSize: 0,
    };
};

/**
 * ✅ loader factory：opts/外部 override 都可以塞進來
 */
export const AnnouncementListLoader = (
    p: {
        lang: Lang;
        opts?: IAnnouncementListOptions;
        overrides?: Partial<
            { pageNumber: number; pageSize: number; keyword: string; categoryIds: string; tagIds: string; }
        >;
    },
) =>
async ({ request }: LoaderFunctionArgs): Promise<AnnouncementListLoaderData> =>
{
    const ssrApi = getSsrApi(request);
    const announce = AnnouncementAdapter(ssrApi);
    const cate = CategoryAdapter(ssrApi);
    const tag = TagAdapter(ssrApi);
    const pageNumber = p.overrides?.pageNumber ?? 1;
    const pageSize = p.overrides?.pageSize ?? calcPageSize(p.opts?.Style);
    const nowIsoLocal = formatLocalIso(new Date());
    const categoryIds = p.overrides?.categoryIds ?? (p.opts?.Category ?? "");
    const tagIds = p.overrides?.tagIds ?? (p.opts?.Tag ?? "");
    // const keyword = p.overrides?.keyword; // 若你之後要支援 URL query 再接這個
    const condition = buildAnnouncementCondition({ lang: p.lang, nowIsoLocal, categoryIds, tagIds });
    const listParam = buildAnnouncementQuery({ condition, pageNumber, pageSize });
    const countParam = buildAnnouncementQuery({ condition, pageNumber: 0, pageSize: 0 });
    const cateParam = buildCategoryQuery(PGID.Announcement);
    const tagParam = buildTagQuery(PGID.Announcement);

    // ✅ 建立 loader 函式（用同一個 args 進去，這樣未來要用 params/query 也接得上）

    const colNameLoader = announce.loader.createModelDisplayNameLoader({
        getApiInstance: () => ssrApi,
    });

    const listLoader = announce.loader.createQueryListLoader({
        getCondition: () => listParam,
        getApiInstance: () => ssrApi,
    });

    const countLoader = announce.loader.createQueryCountLoader({
        getCondition: () => countParam,
        getApiInstance: () => ssrApi,
    });

    const cateLoader = cate.loader.createQueryListLoader({
        getCondition: () => cateParam,
        getApiInstance: () => ssrApi,
    });

    const tagLoader = tag.loader.createQueryListLoader({
        getCondition: () => tagParam,
        getApiInstance: () => ssrApi,
    });

    // ✅ 一次撈多包（回來的是 ApiLoaderData<{args}, {env}>）
    const [colLD, listLD, countLD, categoryLD, tagLD] = await Promise.all([
        colNameLoader({ request } as LoaderFunctionArgs),
        listLoader({ request } as LoaderFunctionArgs),
        countLoader({ request } as LoaderFunctionArgs),
        cateLoader({ request } as LoaderFunctionArgs),
        tagLoader({ request } as LoaderFunctionArgs),
    ]);

    // ✅ 你 AnnouncementListLoaderData 要的是「純資料」：把 env.Data 拿出來

    const colNameRes = colLD.apiRes.Data?.[0]??null;
    const listRes = listLD.apiRes.Data ?? [];
    const countRes = countLD.apiRes.Data ?? 0;
    const categoryRes = categoryLD.apiRes.Data ?? [];
    const tagRes = tagLD.apiRes.Data ?? [];

    // return
    return {
        args: { pageSize, pageNumber, condition, listParam, countParam, cateParam, tagParam },
        res: { colNameRes, listRes, countRes, categoryRes, tagRes },
    };
};
