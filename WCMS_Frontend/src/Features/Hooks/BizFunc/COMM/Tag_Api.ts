import type { Lang } from "@/SysCore/i18n/lang";
import {
    type ApiAdapterError,
    ApiDataAdapter,
    type ApiDataHookGroup,
    type ApiDataLoaderGroup,
    type ApiLoaderData,
    type EffectDeps,
} from "@/SysCore/Utils/API/APIAdapter";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import * as SchemaFields from "@/types/SchemaFields";
import { PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";
import { useMemo } from "react";
import type { LoaderFunctionArgs } from "react-router-dom";
type QueryListParam = components["schemas"]["QueryListParam"];
type TagSet = components["schemas"]["TagSet_DTO"];
type TagDetail = components["schemas"]["TagDetail_DTO"];

export type TagMapArgs = { progId: PGID | string; lang: Lang; pageSize?: number; };
export type TagMapLoaderData = ApiLoaderData<TagMapArgs, Record<string, string>>;
export class TagService extends ApiDataService<TagSet>
{
    // #region Construct
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.Tag, apiInstance);
    }
    // #endregion
}
interface IBuildTagQueryByProgIdParam
{
    progId: string;
    lang?: Lang;
    pageSize?: number;
}
interface IUseTagMapByProgId
{
    progId: PGID | string;
    lang: Lang;
    pageSize?: number;
    apiInstance?: AxiosInstance;
    deps?: EffectDeps;
    onError?: (err: ApiAdapterError) => void;
    initial?: TagMapLoaderData | null;
}
interface ICreateTagMapByProgIdLoader
{
    progId: PGID | string;
    lang: Lang;
    pageSize?: number;
    getApiInstance?: (args: LoaderFunctionArgs) => AxiosInstance | undefined;
}

type TagMapHookResult = {
    data: Record<string, string>;
    map: Record<string, string>;
    apiRes: ApiResponse<Record<string, string>> | null;
    isLoading: boolean;
    errorText: string | null;
    refetch: () => Promise<void>;
};

type ExtraLoaders = {
    /** 依 ProgId 取得 Tag map 的 SSR loader */
    createMapByProgIdLoader: (opt: ICreateTagMapByProgIdLoader) => (args: LoaderFunctionArgs) => Promise<TagMapLoaderData>;
};

type ExtraHooks = {
    /** 依 ProgId 取得 Tag map 的 CSR / Hydration hook */
    useMapByProgId: (opt: IUseTagMapByProgId) => TagMapHookResult;
};

/** Escape Query 字串中的雙引號 */
const escapeQueryString = (value: string): string =>
{
    // 宣告變數
    const escaped = value.replace(/"/g, `""`);

    // return
    return escaped;
};

/** 建立依 ProgId 查 Tag 的共用條件 */
export const buildTagQueryByProgIdParam = (opt: IBuildTagQueryByProgIdParam): QueryListParam =>
{
    // 宣告變數
    const progId = escapeQueryString(opt.progId);
    const lang = opt.lang ? escapeQueryString(opt.lang) : null;

    const fields: string[] = [
        SchemaFields.TagDataFields.TagId,
        SchemaFields.TagDataFields.InternalId,
        `${SchemaFields.TagDataFields._TagDetail}.${SchemaFields.TagDetailFields.Lang}`,
        `${SchemaFields.TagDataFields._TagDetail}.${SchemaFields.TagDetailFields.TagName}`,
    ];

    const condLang = lang ? ` And ${SchemaFields.TagDataFields._TagDetail}.${SchemaFields.TagDetailFields.Lang} = "${lang}"` : "";

    // return
    return {
        Fields: fields,
        Condition: `${SchemaFields.TagDataFields.ProgId} = "${progId}"${condLang}`,
        OrderBy: [{ Col: SchemaFields.TagDataFields.CreateTime, Desc: false }],
        PageNumber: 0,
        PageSize: opt.pageSize ?? 0,
    };
};

/** 依語系把 Tag 清單轉成 id-name map */
export const buildTagMap = (data: TagSet[], lang: Lang): Record<string, string> =>
{
    return data.reduce<Record<string, string>>((acc, item) =>
    {
        const id = item.TagData?.TagId;
        if (!id) return acc;
        const matched = (item.TagDetail ?? []).find((detail: TagDetail) => detail.Lang === lang);
        acc[String(id)] = matched?.TagName ?? "";
        return acc;
    }, {});
};

/** 純格式化：把 "1,2,3" 轉成 "標籤A、標籤B" */
export const formatTagsName = (content: string, tagData: TagSet[], lang: Lang): string =>
{
    const raw = (content?.toString?.() ?? "").trim();
    if (!raw) return "";
    return raw.split(",").map(s => s.trim()).filter(Boolean).map(tagId =>
        tagData?.find(s => String(s.TagData?.TagId) === tagId)?.TagDetail?.find(d => d.Lang === lang)?.TagName
    ).filter((x): x is string => Boolean(x)).join("、");
};

export class TagAdapterImpl extends ApiDataAdapter<TagSet, TagService>
{
    // #region Property
    declare public loader: ApiDataLoaderGroup<TagSet> & ExtraLoaders;
    declare public hooks: ApiDataHookGroup<TagSet> & ExtraHooks;
    // #endregion

    // #region Protect Virtual Func
    protected override buildExtendedLoader(base: ApiDataLoaderGroup<TagSet>): ApiDataLoaderGroup<TagSet> & ExtraLoaders
    {
        const wrapCreateMapByProgIdLoader: ExtraLoaders["createMapByProgIdLoader"] = (opt) =>
        {
            return this.createMapByProgIdLoader(opt);
        };
        return { ...base, createMapByProgIdLoader: wrapCreateMapByProgIdLoader };
    }

    protected override buildExtendedHooks(base: ApiDataHookGroup<TagSet>): ApiDataHookGroup<TagSet> & ExtraHooks
    {
        const wrapUseMapByProgId: ExtraHooks["useMapByProgId"] = (opt) =>
        {
            return this.useMapByProgId(opt);
        };
        return { ...base, useMapByProgId: wrapUseMapByProgId };
    }
    // #endregion

    // #region Loader Func
    /** loader：依 ProgId 建立 Tag map loader */
    private createMapByProgIdLoader: ExtraLoaders["createMapByProgIdLoader"] = (opt) =>
    {
        return this.createApiLoader<TagMapArgs, Record<string, string>>({
            action: "Tag.Query.MapByProgId",
            getArgs: () => this.buildTagMapArgs({ progId: opt.progId, lang: opt.lang, pageSize: opt.pageSize }),
            call: (svc, args) => this.queryTagMapByProgIdAsync(svc, args),
            getApiInstance: opt.getApiInstance,
        });
    };
    // #endregion

    // #region Hook Func
    /** hook：依 ProgId 取得 Tag map */
    private useMapByProgId: ExtraHooks["useMapByProgId"] = (opt) =>
    {
        // 宣告變數
        const deps = opt.deps ?? [opt.progId, opt.lang, opt.pageSize ?? 0];
        const args = useMemo<TagMapArgs>(() =>
        {
            return this.buildTagMapArgs({ progId: opt.progId, lang: opt.lang, pageSize: opt.pageSize });
        }, [opt.progId, opt.lang, opt.pageSize]);
        // 執行 function：CSR / Hydration 共用查詢
        const query = this.useApiQuery<TagMapArgs, Record<string, string>>({
            action: "Tag.Query.MapByProgId",
            args,
            initial: opt.initial ?? null,
            call: (svc, queryArgs) => this.queryTagMapByProgIdAsync(svc, queryArgs),
            fallbackError: "查詢標籤對照失敗",
            deps,
            onError: opt.onError,
            apiInstance: opt.apiInstance,
        });
        const map = useMemo<Record<string, string>>(() =>
        {
            return query.data ?? {};
        }, [query.data]);
        return { ...query, data: map, map };
    };
    // #endregion

    // #region Private Helper
    /** 建立共用 map 查詢參數 */
    private buildTagMapArgs(opt: { progId: PGID | string; lang: Lang; pageSize?: number; }): TagMapArgs
    {
        return { progId: opt.progId, lang: opt.lang, pageSize: opt.pageSize };
    }

    /** 依 ProgId 查詢並轉成 Tag map */
    private async queryTagMapByProgIdAsync(svc: TagService, args: TagMapArgs): Promise<ApiResponse<Record<string, string>>>
    {
        const query = buildTagQueryByProgIdParam({ progId: String(args.progId), lang: args.lang, pageSize: args.pageSize });
        const env = await svc.queryList(query);
        if (!env.IsSuccess) return { IsSuccess: false, Data: null, SysMessage: env.SysMessage ?? [] };
        return { IsSuccess: true, Data: buildTagMap(env.Data ?? [], args.lang), SysMessage: env.SysMessage ?? [] };
    }
    // #endregion
}

export const TagAdapter = (apiInstance?: AxiosInstance) =>
{
    return new TagAdapterImpl((api?: AxiosInstance) => new TagService(api ?? apiInstance));
};
