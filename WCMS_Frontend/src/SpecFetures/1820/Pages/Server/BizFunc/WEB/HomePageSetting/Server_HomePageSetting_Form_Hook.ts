import { CategoryAdapter } from "@/Features/Hooks/BizFunc/COMM/Category_Api";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import { SpecHomePage1820Adapter } from "@/SpecFetures/1820/Hooks/WEB/HomePage_Api";
import { DefaultLang, type Lang } from "@/SysCore/i18n/lang";
import type { ApiAdapterError, ApiLoaderData, ServerFormActions } from "@/SysCore/Utils/API/APIAdapter";
import { type ApiResponse, MessageStatus } from "@/SysCore/Utils/API/APIBase";
import type { UseFetchDataResult } from "@/SysCore/Utils/API/FetchDataType";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { PGID, SpecHomePage1820ModelFields } from "@/types/SchemaFields";
import { type SetStateAction, useCallback, useEffect, useMemo, useState } from "react";

type HomePageSet = components["schemas"]["SpecHomePage1820Set_DTO"];
type HomePageModel = components["schemas"]["SpecHomePage1820Model_DTO"];
type QueryListParam = components["schemas"]["QueryListParam"];

export type HomePage1820SummaryRow = { InternalId: string; HomePageId: string; Lang: string; };

export type HomePage1820SummaryRawData = {
    supportLangs: Lang[];
    langInternalIdMap: Record<string, string>;
    langSummaryMap: Record<string, HomePage1820SummaryRow>;
    savingMap: Record<string, boolean>;
    saveLang: (lang: string, formData: HomePageSet) => Promise<void>;
};
export type HomePage1820FormRawData = { formData: UseFetchFormDataResult<HomePageSet>; categoryMap: Record<string, string>; };

export type HomePage1820FormAdapter = { HomePage: ReturnType<typeof SpecHomePage1820Adapter>; Category: ReturnType<typeof CategoryAdapter>; };

export type HomePage1820SummaryAdapter = { HomePage: ReturnType<typeof SpecHomePage1820Adapter>; };

const emptyDisplayName: ModelDisplaySchema = { ModelId: "", ModelDisplayName: "", Tables: [] };

const normalizeLang = (lang?: string) =>
{
    // 統一語系 key
    return String(lang ?? "").trim().toLowerCase();
};

const resolveLangKey = (supportLangs: string[], lang?: string) =>
{
    // 依 supportLang 找實際語系 key
    const target = normalizeLang(lang);
    return supportLangs.find(a => normalizeLang(a) === target) ?? "";
};

const createEmptyModel = (lang: string): HomePageModel =>
{
    // 建立空主表
    return {
        Lang: lang,
        HomePageId: "",
        Section1Title_L: "",
        Section1Title_M: "",
        Section1Title_R: "",
        HeroText: "",
        HeroText_ViewMoreLink: "",
        AnnouncementTitle: "",
        AnnouncementSubTitle: "",
        AnnouncementCategoryIds: "",
        Announcement_ViewMoreLink: "",
        Resource_Title: "",
        Resource_SubTitle: "",
    };
};

export const createEmptyHomePage1820Set = (lang: string): HomePageSet =>
{
    // 建立空 set
    return {
        SpecHomePage1820: createEmptyModel(lang),
        SpecHomePage1820_BannerMedia: [],
        SpecHomePage1820_Detail: [],
        SpecHomePage1820_Marquee: [],
        SpecHomePage1820_Resource: [],
    };
};

const normalizeSet = (lang: string, data?: HomePageSet | null): HomePageSet =>
{
    // 正規化 set
    const base = data ?? createEmptyHomePage1820Set(lang);

    return {
        SpecHomePage1820: { ...createEmptyModel(lang), ...(base.SpecHomePage1820 ?? {}), Lang: base.SpecHomePage1820?.Lang || lang },
        SpecHomePage1820_BannerMedia: [...(base.SpecHomePage1820_BannerMedia ?? [])],
        SpecHomePage1820_Detail: [...(base.SpecHomePage1820_Detail ?? [])],
        SpecHomePage1820_Marquee: [...(base.SpecHomePage1820_Marquee ?? [])],
        SpecHomePage1820_Resource: [...(base.SpecHomePage1820_Resource ?? [])],
    };
};

const normalizeText = (value?: string | null) =>
{
    // 統一字串空值
    return String(value ?? "").trim();
};

const resolveChildHomePageId = (childHomePageId?: string | null, parentHomePageId?: string | null) =>
{
    // 子表沒有 HomePageId 時，回補主表 HomePageId
    const child = normalizeText(childHomePageId);
    if (child) return child;
    return normalizeText(parentHomePageId);
};

const sanitizeSetBeforeSave = (lang: string, data: HomePageSet): HomePageSet =>
{
    // 儲存前補齊語系與主子表關聯鍵
    const set = normalizeSet(lang, data);
    const homePageId = normalizeText(set.SpecHomePage1820?.HomePageId);

    return {
        ...set,
        SpecHomePage1820: { ...set.SpecHomePage1820, Lang: set.SpecHomePage1820?.Lang || lang, HomePageId: homePageId },
        SpecHomePage1820_BannerMedia: (set.SpecHomePage1820_BannerMedia ?? []).map(a => ({
            ...a,
            HomePageId: resolveChildHomePageId(a.HomePageId, homePageId),
        })),
        SpecHomePage1820_Detail: (set.SpecHomePage1820_Detail ?? []).map(a => ({ ...a, HomePageId: resolveChildHomePageId(a.HomePageId, homePageId) })),
        SpecHomePage1820_Marquee: (set.SpecHomePage1820_Marquee ?? []).map(a => ({ ...a, HomePageId: resolveChildHomePageId(a.HomePageId, homePageId) })),
        SpecHomePage1820_Resource: (set.SpecHomePage1820_Resource ?? []).map(a => ({ ...a, HomePageId: resolveChildHomePageId(a.HomePageId, homePageId) })),
    };
};

const buildInitialSummaryMap = (supportLangs: string[]) =>
{
    // 建立空摘要 map
    return Object.fromEntries(supportLangs.map(lang => [lang, { InternalId: "", HomePageId: "", Lang: lang }])) as Record<string, HomePage1820SummaryRow>;
};

const buildSummaryMap = (supportLangs: string[], list?: HomePageSet[] | null) =>
{
    // 由 list 建立 lang -> summary
    const next = buildInitialSummaryMap(supportLangs);

    for (const item of list ?? [])
    {
        const model = item?.SpecHomePage1820;
        const key = resolveLangKey(supportLangs, model?.Lang ?? DefaultLang);
        if (!key) continue;

        next[key] = { InternalId: model?.InternalId ?? "", HomePageId: model?.HomePageId ?? "", Lang: model?.Lang ?? key };
    }

    return next;
};

const resolveNextFormData = (lang: string, prev: HomePageSet, next: SetStateAction<HomePageSet>) =>
{
    // 處理 setFormData 的 function / object 兩種寫法
    const current = normalizeSet(lang, prev);
    if (typeof next === "function") return (next as (prevState: HomePageSet) => HomePageSet)(current);
    return next;
};

/** 外層：只撈 lang + internalId */
export const useHomePage1820SummaryFetchData = (opt: { supportLangs: Lang[]; }): UseFetchDataResult<HomePage1820SummaryRawData, HomePage1820SummaryAdapter> =>
{
    const { publish } = useToast();

    /** 統一錯誤提示 */
    const onError = useCallback((e: ApiAdapterError) =>
    {
        publish({ level: MessageStatus.Error, title: e.messageText });
    }, [publish]);

    /** 建立 adapter */
    const adapter = useMemo<HomePage1820SummaryAdapter>(() =>
    {
        return { HomePage: SpecHomePage1820Adapter() };
    }, []);

    /** QueryList 只查摘要欄位 */
    const listCondition = useMemo<QueryListParam>(() =>
    {
        return {
            Fields: [SpecHomePage1820ModelFields.InternalId, SpecHomePage1820ModelFields.HomePageId, SpecHomePage1820ModelFields.Lang],
            Condition: "",
            PageNumber: 0,
            PageSize: 0,
        };
    }, []);

    /** 全搜摘要 */
    const list = adapter.HomePage.hooks.useQueryList({ condition: listCondition, deps: [], onError });

    /** 建立 actions */
    const actions = adapter.HomePage.useServerActions();

    /** 各語系儲存狀態 */
    const [savingMap, setSavingMap] = useState<Record<string, boolean>>({});

    /** 語系摘要 map */
    const langSummaryMap = useMemo(() =>
    {
        return buildSummaryMap(opt.supportLangs, list.data);
    }, [list.data, opt.supportLangs]);

    /** 語系 internalId map */
    const langInternalIdMap = useMemo<Record<string, string>>(() =>
    {
        return Object.fromEntries(opt.supportLangs.map(lang => [lang, langSummaryMap[lang]?.InternalId ?? ""]));
    }, [langSummaryMap, opt.supportLangs]);

    const saveLang = useCallback(async (lang: string, formData: HomePageSet) =>
    {
        // 儲存指定語系
        const key = resolveLangKey(opt.supportLangs, lang) || lang;
        const payload = sanitizeSetBeforeSave(key, formData);
        const internalId = payload.SpecHomePage1820?.InternalId ?? "";

        setSavingMap(prev => ({ ...prev, [key]: true }));

        try
        {
            if (internalId)
            {
                await actions.updateAsync(internalId, payload);
            } else
            {
                await actions.createAsync(payload);
            }

            await Promise.resolve(list.refetch());
        } catch (e)
        {
            const message = e instanceof Error ? e.message : "儲存失敗";
            publish({ level: MessageStatus.Error, title: message });
            throw e;
        } finally
        {
            setSavingMap(prev => ({ ...prev, [key]: false }));
        }
    }, [actions, list, opt.supportLangs, publish]);

    const rawData = useMemo<HomePage1820SummaryRawData>(() =>
    {
        return { supportLangs: opt.supportLangs, langInternalIdMap, langSummaryMap, savingMap, saveLang };
    }, [langInternalIdMap, langSummaryMap, opt.supportLangs, saveLang, savingMap]);

    const refetchData = useCallback(async () =>
    {
        // 重抓摘要
        await Promise.resolve(list.refetch());
    }, [list]);

    const refetchRefData = useCallback(async () =>
    {
        // 此 hook 無參考資料
    }, []);

    return { adapter, rawData, isLoading: list.isLoading, errors: [list.errorText].filter((x): x is string => Boolean(x)), refetchData, refetchRefData };
};

/** 內層：單一語系用 internalId 組一般 formData */
export const useHomePage1820FormDataByAdapter = (
    adapter: ReturnType<typeof SpecHomePage1820Adapter>,
    lang: Lang,
    internalId: string,
): UseFetchDataResult<HomePage1820FormRawData, HomePage1820FormAdapter> =>
{
    const { publish } = useToast();

    /** 統一錯誤提示 */
    const onError = useCallback((e: ApiAdapterError) =>
    {
        publish({ level: MessageStatus.Error, title: e.messageText });
    }, [publish]);

    /** 建立 adapter */
    const formAdapter = useMemo<HomePage1820FormAdapter>(() =>
    {
        return { HomePage: adapter, Category: CategoryAdapter() };
    }, [adapter]);

    const langKey = useMemo(() => normalizeLang(lang), [lang]);

    const internalKey = useMemo(() =>
    {
        // 新增模式時用假 key，避免真的拿空字串去 query
        const key = String(internalId ?? "").trim();
        return key || "__new__";
    }, [internalId]);

    const isNew = useMemo(() =>
    {
        // 判斷是否為新增模式
        return !String(internalId ?? "").trim();
    }, [internalId]);

    const empty = useMemo(() =>
    {
        // 建立空資料
        return createEmptyHomePage1820Set(lang);
    }, [lang]);

    const initial = useMemo<ApiLoaderData<string, HomePageSet> | null>(() =>
    {
        // 新增模式時提供初始資料，避免 query "__new__"
        if (!isNew) return null;

        const apiRes: ApiResponse<HomePageSet> = { IsSuccess: true, Data: empty, SysMessage: [] };

        return { args: internalKey, apiRes };
    }, [empty, internalKey, isNew]);

    const model = formAdapter.HomePage.hooks.useModelDisplayName({ deps: [], onError });

    const query = formAdapter.HomePage.hooks.useQueryData({ internalId: internalKey, initial, deps: [internalKey], onError });

    const category = formAdapter.Category.hooks.useMapByProgId({ progId: PGID.Announcement, lang });

    /** 可編輯 form state */
    const [data, setData] = useState<HomePageSet>(empty);

    useEffect(() =>
    {
        // QueryData 回來後同步到可編輯 state
        if (query.data)
        {
            setData(normalizeSet(langKey, query.data));
            return;
        }

        if (isNew)
        {
            setData(empty);
        }
    }, [empty, isNew, langKey, query.data]);

    const refetch = useCallback(() =>
    {
        void query.refetch();
    }, [query]);

    const formData = useMemo<UseFetchFormDataResult<HomePageSet>>(() =>
    {
        return {
            data,
            setFormData: next => setData(prev => resolveNextFormData(langKey, prev, next)),
            isLoading: Boolean((!isNew && query.isLoading) || model.isLoading),
            error: query.errorText ?? model.errorText ?? null,
            refetch,
            displayName: model.data ?? emptyDisplayName,
        };
    }, [data, isNew, langKey, model.data, model.errorText, model.isLoading, query.errorText, query.isLoading, refetch]);

    const rawData = useMemo<HomePage1820FormRawData>(() =>
    {
        return { formData, categoryMap: category.map ?? {} };
    }, [category.map, formData]);

    const isLoading = useMemo(() =>
    {
        return Boolean(formData.isLoading || category.isLoading);
    }, [category.isLoading, formData.isLoading]);

    const errors = useMemo(() =>
    {
        return [formData.error, category.errorText].filter((x): x is string => Boolean(x));
    }, [category.errorText, formData.error]);

    const refetchData = useCallback(async () =>
    {
        await Promise.resolve(formData.refetch());
    }, [formData]);

    const refetchRefData = useCallback(async () =>
    {
        await Promise.resolve(category.refetch());
    }, [category]);

    return { adapter: formAdapter, rawData, isLoading, errors, refetchData, refetchRefData };
};

/** 可選：若你要在這頁直接組當前語系 actions，可用這個 */
export const useHomePage1820LangFormActions = (
    summary: UseFetchDataResult<HomePage1820SummaryRawData, HomePage1820SummaryAdapter>,
    lang: string,
    formData: HomePageSet,
    onAfterSave?: () => void,
): ServerFormActions =>
{
    const key = useMemo(() => resolveLangKey(summary.rawData.supportLangs, lang) || lang, [summary.rawData.supportLangs, lang]);
    const isSaving = Boolean(summary.rawData.savingMap[key]);

    return {
        Save: async () =>
        {
            await summary.rawData.saveLang(key, formData);
            onAfterSave?.();
        },
        Back: () =>
        {},
        Delete: async () =>
        {},
        IsSaving: isSaving,
    };
};
