import { useCallback, useMemo } from "react";
import { useLoaderData } from "react-router-dom";
import type { LoaderFunctionArgs } from "react-router-dom";

import { CategoryAdapter, type CategoryMapLoaderData } from "@/Features/Hooks/BizFunc/COMM/Category_Api";
import { TagAdapter, type TagMapLoaderData } from "@/Features/Hooks/BizFunc/COMM/Tag_Api";
import { AnnouncementAdapter } from "@/Features/Hooks/BizFunc/WEB/Announcement_Api";

import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import { type ApiResponse, getSsrApi } from "@/SysCore/Utils/API/APIBase";
import type { UseFetchDataResult } from "@/SysCore/Utils/API/FetchDataType";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";

type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"];

// #region Public Types
export interface AnnouncementFormLoaderArgs
{
    internalId: string;
    progId: PGID;
    lang: Lang;
}

export interface AnnouncementFormLoaderRes
{
    dataRes: AnnouncementSet | null;
    categoryMap: Record<string, string>;
    tagMap: Record<string, string>;
}

export interface AnnouncementFormLoaderData
{
    args: AnnouncementFormLoaderArgs;
    res: AnnouncementFormLoaderRes;
}

export type AnnouncementFormRawData = {
    formData: AnnouncementSet;
    categoryMap: Record<string, string>;
    tagMap: Record<string, string>;
    categoryNameText: string;
    tagNameText: string;
    args: AnnouncementFormLoaderArgs;
};

export type AnnouncementFormAdapter = {
    Announcement: ReturnType<typeof AnnouncementAdapter>;
    Category: ReturnType<typeof CategoryAdapter>;
    Tag: ReturnType<typeof TagAdapter>;
};
// #endregion

// #region Shared Builder
/** 統一整理安全 internalId */
const getSafeInternalId = (value?: string): string =>
{
    return `${value ?? ""}`.trim();
};

/** 共用：依目前 feature 組出 loader / hook 共用參數 */
export const buildAnnouncementFormLoaderArgs = (p: { lang: Lang; internalId: string; }): AnnouncementFormLoaderArgs =>
{
    const safeInternalId = getSafeInternalId(p.internalId);

    return { internalId: safeInternalId, progId: PGID.Announcement, lang: p.lang };
};

/** 組出給 hydration 用的 initial 格式 */
const buildLoaderInitial = <TArgs, TData>(args: TArgs, data: TData): ApiLoaderData<TArgs, TData> =>
{
    const apiRes: ApiResponse<TData> = { IsSuccess: true, Data: data, SysMessage: [] };

    return { args, apiRes };
};

/** 比對目前參數與 loader 參數是否一致 */
const matchInitialArgs = <TArgs, TData>(currentArgs: TArgs, initialArgs: TArgs, initialData: TData): ApiLoaderData<TArgs, TData> | null =>
{
    const currentKey = JSON.stringify(currentArgs ?? null);
    const initialKey = JSON.stringify(initialArgs ?? null);

    if (currentKey !== initialKey) return null;
    return buildLoaderInitial(initialArgs, initialData);
};

/** 建立主資料 initial，避免 hydration 首次重抓 */
const buildDataInitial = (
    p: { loaderData: AnnouncementFormLoaderData | null; internalId: string; fallbackData: AnnouncementSet; },
): ApiLoaderData<string, AnnouncementSet> | null =>
{
    if (!p.loaderData?.args?.internalId) return null;
    if (p.loaderData.args.internalId !== p.internalId) return null;

    return buildLoaderInitial(p.internalId, p.loaderData.res.dataRes ?? p.fallbackData);
};

/** 建立 Category map initial，避免 hydration 首次重抓 */
const buildCategoryInitial = (p: { loaderData: AnnouncementFormLoaderData | null; args: AnnouncementFormLoaderArgs; }): CategoryMapLoaderData | null =>
{
    if (!p.loaderData) return null;

    return matchInitialArgs(
        { progId: p.args.progId, lang: p.args.lang },
        { progId: p.loaderData.args.progId, lang: p.loaderData.args.lang },
        p.loaderData.res.categoryMap ?? {},
    );
};

/** 建立 Tag map initial，避免 hydration 首次重抓 */
const buildTagInitial = (p: { loaderData: AnnouncementFormLoaderData | null; args: AnnouncementFormLoaderArgs; }): TagMapLoaderData | null =>
{
    if (!p.loaderData) return null;

    return matchInitialArgs(
        { progId: p.args.progId, lang: p.args.lang },
        { progId: p.loaderData.args.progId, lang: p.loaderData.args.lang },
        p.loaderData.res.tagMap ?? {},
    );
};

/** 將逗號字串依 map 轉成顯示文字 */
export const buildNameTextByMap = (csv: string | null | undefined, map: Record<string, string>): string =>
{
    const raw = `${csv ?? ""}`.trim();
    if (!raw) return "";

    return raw.split(",").map(p => p.trim()).filter(Boolean).map(id => map[id] ?? "").filter(Boolean).join("、");
};
// #endregion

// #region SSR Loader
export const AnnouncementFormLoader = (p: { lang: Lang; }) => async ({ request, params }: LoaderFunctionArgs): Promise<AnnouncementFormLoaderData> =>
{
    const internalId = getSafeInternalId(params?.internalId);
    const ssrApi = getSsrApi(request);

    const adapter = { Announcement: AnnouncementAdapter(ssrApi), Category: CategoryAdapter(ssrApi), Tag: TagAdapter(ssrApi) };

    const args = buildAnnouncementFormLoaderArgs({ lang: p.lang, internalId });

    if (!internalId)
    {
        return { args, res: { dataRes: null, categoryMap: {}, tagMap: {} } };
    }

    const dataLoader = adapter.Announcement.loader.createQueryDataLoader({ getInternalId: () => internalId, getApiInstance: () => ssrApi });

    const cateLoader = adapter.Category.loader.createMapByProgIdLoader({ progId: args.progId, lang: args.lang, getApiInstance: () => ssrApi });

    const tagLoader = adapter.Tag.loader.createMapByProgIdLoader({ progId: args.progId, lang: args.lang, getApiInstance: () => ssrApi });

    const [dataLD, cateLD, tagLD] = await Promise.all([
        dataLoader({ request, params } as LoaderFunctionArgs),
        cateLoader({ request, params } as LoaderFunctionArgs),
        tagLoader({ request, params } as LoaderFunctionArgs),
    ]);

    return { args, res: { dataRes: dataLD.apiRes.Data ?? null, categoryMap: cateLD.apiRes.Data ?? {}, tagMap: tagLD.apiRes.Data ?? {} } };
};
// #endregion

// #region CSR Hook
export const useAnnouncementFormFetchData = (
    opt: { lang: Lang; internalId: string; emptyData: AnnouncementSet; },
): UseFetchDataResult<AnnouncementFormRawData, AnnouncementFormAdapter> =>
{
    const loaderData = useLoaderData() as AnnouncementFormLoaderData | null;
    const safeInternalId = getSafeInternalId(opt.internalId);

    const adapter = useMemo<AnnouncementFormAdapter>(() =>
    {
        return { Announcement: AnnouncementAdapter(), Category: CategoryAdapter(), Tag: TagAdapter() };
    }, []);

    const currentArgs = useMemo(() =>
    {
        return buildAnnouncementFormLoaderArgs({ lang: opt.lang, internalId: safeInternalId });
    }, [opt.lang, safeInternalId]);

    const dataInitial = useMemo(() =>
    {
        return buildDataInitial({ loaderData, internalId: safeInternalId, fallbackData: opt.emptyData });
    }, [loaderData, safeInternalId, opt.emptyData]);

    const cateInitial = useMemo(() =>
    {
        return buildCategoryInitial({ loaderData, args: currentArgs });
    }, [loaderData, currentArgs]);

    const tagInitial = useMemo(() =>
    {
        return buildTagInitial({ loaderData, args: currentArgs });
    }, [loaderData, currentArgs]);

    /** 主資料 */
    const useData = adapter.Announcement.hooks.useQueryData({ internalId: safeInternalId, initial: dataInitial, deps: [safeInternalId] });

    /** 分類 map */
    const useCategory = adapter.Category.hooks.useMapByProgId({
        progId: currentArgs.progId,
        lang: currentArgs.lang,
        initial: cateInitial,
        deps: [currentArgs.progId, currentArgs.lang],
    });

    /** 標籤 map */
    const useTag = adapter.Tag.hooks.useMapByProgId({
        progId: currentArgs.progId,
        lang: currentArgs.lang,
        initial: tagInitial,
        deps: [currentArgs.progId, currentArgs.lang],
    });

    const formData = useMemo<AnnouncementSet>(() =>
    {
        return useData.data ?? opt.emptyData;
    }, [useData.data, opt.emptyData]);

    const categoryNameText = useMemo(() =>
    {
        return buildNameTextByMap(formData.Announcement?.Categories, useCategory.map ?? {});
    }, [formData.Announcement?.Categories, useCategory.map]);

    const tagNameText = useMemo(() =>
    {
        return buildNameTextByMap(formData.Announcement?.Tags, useTag.map ?? {});
    }, [formData.Announcement?.Tags, useTag.map]);

    const isLoading = Boolean(useData.isLoading || useCategory.isLoading || useTag.isLoading);

    const errors = useMemo(() =>
    {
        const list = [useData.errorText, useCategory.errorText, useTag.errorText];

        return list.filter((p): p is string => Boolean(p));
    }, [useData.errorText, useCategory.errorText, useTag.errorText]);

    const rawData = useMemo<AnnouncementFormRawData>(() =>
    {
        return { formData, categoryMap: useCategory.map ?? {}, tagMap: useTag.map ?? {}, categoryNameText, tagNameText, args: currentArgs };
    }, [formData, useCategory.map, useTag.map, categoryNameText, tagNameText, currentArgs]);

    const refetchData = useCallback(async () =>
    {
        await Promise.resolve(useData.refetch());
    }, [useData]);

    const refetchRefData = useCallback(async () =>
    {
        await Promise.all([Promise.resolve(useCategory.refetch()), Promise.resolve(useTag.refetch())]);
    }, [useCategory, useTag]);

    return { adapter, rawData, isLoading, errors, refetchData, refetchRefData };
};
// #endregion
