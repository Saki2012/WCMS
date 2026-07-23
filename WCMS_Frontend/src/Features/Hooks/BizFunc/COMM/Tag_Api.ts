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
import { LibCondition } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import { PGID, TagDataFields, TagDetailFields } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";
import { useMemo } from "react";
import type { LoaderFunctionArgs } from "react-router-dom";

// #region Property
type QueryListParam = components["schemas"]["QueryListParam"];
type TagFormModel = components["schemas"]["TagData"];
type TagDetail = components["schemas"]["TagDetail"];
export type TagMapArgs = { progId: PGID | string; lang: Lang; pageSize?: number; };
export type TagMapLoaderData = ApiLoaderData<TagMapArgs, Record<string, string>>;
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
// #endregion

// #region Public
export class TagService extends ApiDataService<TagFormModel>
{
    // #region Public
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.Tag, apiInstance);
    }
    // #endregion
}

export class TagAdapterImpl extends ApiDataAdapter<TagFormModel, TagService>
{
    // #region Property
    declare public loader: ApiDataLoaderGroup<TagFormModel> & ExtraLoaders;
    declare public hooks: ApiDataHookGroup<TagFormModel> & ExtraHooks;
    // #endregion

    // #region Protected Virtual
    protected override buildExtendedLoader(base: ApiDataLoaderGroup<TagFormModel>): ApiDataLoaderGroup<TagFormModel> & ExtraLoaders
    {
        const wrapCreateMapByProgIdLoader: ExtraLoaders["createMapByProgIdLoader"] = (opt) => this.createMapByProgIdLoader(opt);
        return { ...base, createMapByProgIdLoader: wrapCreateMapByProgIdLoader };
    }
    protected override buildExtendedHooks(base: ApiDataHookGroup<TagFormModel>): ApiDataHookGroup<TagFormModel> & ExtraHooks
    {
        const wrapUseMapByProgId: ExtraHooks["useMapByProgId"] = (opt) => this.useMapByProgId(opt);
        return { ...base, useMapByProgId: wrapUseMapByProgId };
    }
    // #endregion

    // #region Protected
    /** loader：依 ProgId 建立 Tag map loader */
    protected createMapByProgIdLoader: ExtraLoaders["createMapByProgIdLoader"] = (opt) =>
    {
        return this.createApiLoader<TagMapArgs, Record<string, string>>({
            action: "Tag.Query.MapByProgId",
            getArgs: () => this.buildTagMapArgs({ progId: opt.progId, lang: opt.lang, pageSize: opt.pageSize }),
            call: (svc, args) => this.queryTagMapByProgIdAsync(svc, args),
            getApiInstance: opt.getApiInstance,
        });
    };
    /** hook：依 ProgId 取得 Tag map */
    protected useMapByProgId: ExtraHooks["useMapByProgId"] = (opt) =>
    {
        // 宣告變數
        const deps = opt.deps ?? [opt.progId, opt.lang, opt.pageSize ?? 0];
        const args = useMemo<TagMapArgs>(() => this.buildTagMapArgs({ progId: opt.progId, lang: opt.lang, pageSize: opt.pageSize }), [
            opt.progId,
            opt.lang,
            opt.pageSize,
        ]);
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
        const map = useMemo<Record<string, string>>(() => query.data ?? {}, [query.data]);
        return { ...query, data: map, map };
    };
    // #endregion

    // #region Private
    /** 建立共用 map 查詢參數 */
    private buildTagMapArgs(opt: { progId: PGID | string; lang: Lang; pageSize?: number; }): TagMapArgs
    {
        return { progId: opt.progId, lang: opt.lang, pageSize: opt.pageSize };
    }
    /** 依 ProgId 查詢並轉成 Tag map */
    private async queryTagMapByProgIdAsync(svc: TagService, args: TagMapArgs): Promise<ApiResponse<Record<string, string>>>
    {
        const query = this.buildTagQueryByProgIdParam({ progId: String(args.progId), lang: args.lang, pageSize: args.pageSize });
        const env = await svc.queryList(query);
        if (!env.IsSuccess) return { IsSuccess: false, Data: null, SysMessage: env.SysMessage ?? [] };
        return { IsSuccess: true, Data: this.buildTagMap(env.Data ?? [], args.lang), SysMessage: env.SysMessage ?? [] };
    }
    /** 建立依 ProgId 查 Tag 的共用條件 */
    private buildTagQueryByProgIdParam = (opt: IBuildTagQueryByProgIdParam): QueryListParam =>
    {
        return {
            Fields: [
                TagDataFields.TagId,
                TagDataFields.InternalId,
                `${TagDataFields._TagDetail}.${TagDetailFields.Lang}`,
                `${TagDataFields._TagDetail}.${TagDetailFields.TagName}`,
            ],
            Condition: LibCondition.joinConditions([
                LibCondition.createCondition(TagDataFields.ProgId, LibCondition.Operator.Equal, opt.progId),
                opt.lang ? LibCondition.createCondition(`${TagDataFields._TagDetail}.${TagDetailFields.Lang}`, LibCondition.Operator.Equal, opt.lang) : null,
            ], LibCondition.JoinMode.And),
            OrderBy: [{ Col: TagDataFields.CreateTime, Desc: false }],
            PageNumber: 0,
            PageSize: opt.pageSize ?? 0,
        };
    };
    /** 依語系把 Tag 清單轉成 id-name map */
    private buildTagMap = (data: TagFormModel[], lang: Lang): Record<string, string> =>
    {
        return data.reduce<Record<string, string>>((acc, item) =>
        {
            const id = item.TagId;
            if (!id) return acc;
            const matched = (item._TagDetail ?? []).find((detail: TagDetail) => detail.Lang === lang);
            acc[String(id)] = matched?.TagName ?? "";
            return acc;
        }, {});
    };
    // #endregion
}
export const TagAdapter = (apiInstance?: AxiosInstance) => new TagAdapterImpl((api?: AxiosInstance) => new TagService(api ?? apiInstance));
// #endregion

/** 純格式化：把 "1,2,3" 轉成 "標籤A、標籤B" */
// TODO:這一支看是如何移除掉好
export const formatTagsName = (content: string, tagData: TagFormModel[], lang: Lang): string =>
{
    const raw = (content?.toString?.() ?? "").trim();
    if (!raw) return "";
    return raw.split(",").map(s => s.trim()).filter(Boolean).map(tagId =>
        tagData?.find(s => String(s.TagId) === tagId)?._TagDetail?.find(d => d.Lang === lang)?.TagName
    ).filter((x): x is string => Boolean(x)).join("、");
};
