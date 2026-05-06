import { CategoryAdapter } from "@/Features/Hooks/BizFunc/COMM/Category_Api";
import { TagAdapter } from "@/Features/Hooks/BizFunc/COMM/Tag_Api";
import { BannerSliderAdapter } from "@/Features/Hooks/BizFunc/WEB/BannerSlider_Api";
import { PageManagementAdapter } from "@/Features/Hooks/BizFunc/WEB/PageManagement_Api";
import { SiteMenuAdapter } from "@/Features/Hooks/BizFunc/WEB/SiteMenu_Api";
import { SurveyAdapter } from "@/Features/Hooks/BizFunc/WEB/Survey_Api";
import { TimelineAdapter } from "@/Features/Hooks/BizFunc/WEB/Timeline_Api";
import type { UseActionsResult } from "@/Features/Hooks/Common/useActions";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import { DefaultLang, type Lang, LangLabelMap, useEnsureLangDetails } from "@/SysCore/i18n/lang";
import type { ApiAdapterError } from "@/SysCore/Utils/API/APIAdapter";
import { type ApiResponse, MessageStatus } from "@/SysCore/Utils/API/APIBase";
import type { UseFetchDataResult } from "@/SysCore/Utils/API/FetchDataType";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import { useFetchEnumOptions } from "@/SysCore/Utils/API/SystemAPI_Hook";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import {
    CategoryDetailFields,
    CategoryFields,
    PageManagementDetailFields,
    PageManagementFields,
    SiteMenu_IndexFields,
    SiteMenu_IndexInfoFields,
    SiteMenu_Item_TitleFields,
    SiteMenuSetFields,
    SurveyFields,
    TagDataFields,
    TagDetailFields,
    TimelineFields,
} from "@/types/SchemaFields";
import { useCallback, useEffect, useMemo, useState } from "react";

type SiteMenuSet = components["schemas"]["SiteMenuSet_DTO"];
type SiteMenu_Item = components["schemas"]["SiteMenu_Item_DTO"];
type SaveSiteInfoDTO = components["schemas"]["SaveSiteInfo_DTO"];
type SaveMenuStructureDTO = components["schemas"]["SaveMenuStructure_DTO"];
type SaveMenuItemDTO = components["schemas"]["SaveMenuItem_DTO"];
type CategorySet = components["schemas"]["CategoryDataSet_DTO"];
type TagSet = components["schemas"]["TagSet_DTO"];
type PageSet = components["schemas"]["PageManagementSet_DTO"];
type BannerSet = components["schemas"]["BannerSet_DTO"];
type TimelineSet = components["schemas"]["TimelineSet_DTO"];
type SurveySet = components["schemas"]["SurveySet_DTO"];

const emptyData: SiteMenuSet = {};

// #region Public Types
export interface SiteMenuItem
{
    id: number;
    name: string;
    menuItem: SiteMenu_Item;
    children?: SiteMenuItem[];
}

export type SiteMenuEditTarget = null | { type: "site"; title: string; } | { type: "menu"; item: SiteMenuItem; };

export type SiteMenuActions = UseActionsResult & {
    onSaveSiteInfo: () => Promise<boolean>;
    onSaveMenuItem: (item: SiteMenuItem) => Promise<boolean>;
    onSaveMenuStructure: (tree: SiteMenuItem[], deletedRowIds: number[]) => Promise<boolean>;
};

export type SiteMenuFetchRawData = {
    internalId: string | null;
    formData: UseFetchFormDataResult<SiteMenuSet>;
    siteMenuItems: SiteMenuItem[];
    actions: SiteMenuActions;
    windowTarget: Record<string, string>;
    menuUrlType: Record<string, string>;
    modulePageType: Record<string, string>;
    moduleDisplayStyle: Record<string, string>;
    bannerDict: Record<string, string>;
    categorySets: CategorySet[];
    tagSets: TagSet[];
    pageMap: Record<string, string>;
    timelineMap: Map<string, string>;
    surveyMap: Map<string, string>;
};

export type SiteMenuFetchAdapter = {
    SiteMenu: ReturnType<typeof SiteMenuAdapter>;
    Category: ReturnType<typeof CategoryAdapter>;
    Tag: ReturnType<typeof TagAdapter>;
    Page: ReturnType<typeof PageManagementAdapter>;
    Banner: ReturnType<typeof BannerSliderAdapter>;
    Timeline: ReturnType<typeof TimelineAdapter>;
    Survey: ReturnType<typeof SurveyAdapter>;
};
// #endregion

// #region Public Hook
/** SiteMenu 頁面資料總入口：主資料 / 參照資料 / actions 一次取回 */
export const useSiteMenuFetchData = (opt: { lang: Lang; }): UseFetchDataResult<SiteMenuFetchRawData, SiteMenuFetchAdapter> =>
{
    const { publish } = useToast();

    const onError = useCallback((e: ApiAdapterError) =>
    {
        publish({ level: MessageStatus.Error, title: e.messageText });
    }, [publish]);

    const adapter = useMemo<SiteMenuFetchAdapter>(() =>
    {
        return {
            SiteMenu: SiteMenuAdapter(),
            Category: CategoryAdapter(),
            Tag: TagAdapter(),
            Page: PageManagementAdapter(),
            Banner: BannerSliderAdapter(),
            Timeline: TimelineAdapter(),
            Survey: SurveyAdapter(),
        };
    }, []);

    const main = useSiteMenuMainDataByAdapter(adapter.SiteMenu, onError);
    const ref = useSiteMenuRefDataByAdapter(adapter, opt.lang, onError);
    const actions = useSiteMenuActionsByAdapter(adapter.SiteMenu, main.internalId, main.formData, main.refetchData);

    useEnsureLangDetails(main.formData, {
        headerName: SiteMenuSetFields.SiteMenu_Index,
        detailName: SiteMenuSetFields.SiteMenu_IndexInfo,
        parentKeys: [SiteMenu_IndexInfoFields.SiteIndex],
        preferFirstLang: opt.lang,
    });

    useEnsureLangDetails(main.formData, {
        headerName: SiteMenuSetFields.SiteMenu_Item,
        detailName: SiteMenuSetFields.SiteMenu_Item_Title,
        parentKeys: [SiteMenu_Item_TitleFields.SiteIndex, SiteMenu_Item_TitleFields.ItemRowId],
        preferFirstLang: opt.lang,
    });

    const isLoading = useMemo(() =>
    {
        return Boolean(main.isLoading || ref.isLoading);
    }, [main.isLoading, ref.isLoading]);

    const errors = useMemo(() =>
    {
        return [...main.errors, ...ref.errors].filter((x): x is string => Boolean(x));
    }, [main.errors, ref.errors]);

    const siteMenuItems = useMemo(() =>
    {
        return transSetToItem(main.formData.data, opt.lang);
    }, [main.formData.data, opt.lang]);

    const rawData = useMemo<SiteMenuFetchRawData>(() =>
    {
        return {
            internalId: main.internalId,
            formData: main.formData,
            actions,
            windowTarget: ref.windowTarget,
            menuUrlType: ref.menuUrlType,
            modulePageType: ref.modulePageType,
            moduleDisplayStyle: ref.moduleDisplayStyle,
            bannerDict: ref.bannerDict,
            categorySets: ref.categorySets,
            tagSets: ref.tagSets,
            pageMap: ref.pageMap,
            timelineMap: ref.timelineMap,
            surveyMap: ref.surveyMap,
            siteMenuItems,
        };
    }, [actions, main.formData, main.internalId, ref, siteMenuItems]);

    const refetchData = useCallback(async () =>
    {
        await Promise.resolve(main.refetchData());
    }, [main]);

    const refetchRefData = useCallback(async () =>
    {
        await Promise.resolve(ref.refetch());
    }, [ref]);

    return { adapter, rawData, isLoading, errors, refetchData, refetchRefData };
};
// #endregion

// #region Private - Main Data
type SiteMenuMainDataResult = {
    internalId: string | null;
    formData: UseFetchFormDataResult<SiteMenuSet>;
    isLoading: boolean;
    errors: Array<string | null | undefined>;
    refetchData: () => Promise<void>;
};

const useSiteMenuMainDataByAdapter = (adapter: ReturnType<typeof SiteMenuAdapter>, onError: (e: ApiAdapterError) => void): SiteMenuMainDataResult =>
{
    const siteList = adapter.hooks.useQueryList({ condition: { Fields: [SiteMenu_IndexFields.InternalId], PageNumber: 0, PageSize: 50 }, deps: [], onError });

    const internalId = useMemo(() =>
    {
        const first = (siteList.data ?? []).find((x) => x?.SiteMenu_Index?.InternalId);
        return first?.SiteMenu_Index?.InternalId ?? null;
    }, [siteList.data]);

    const validInternalId = useMemo(() =>
    {
        const text = internalId?.trim() ?? "";
        return isGuid(text) ? text : null;
    }, [internalId]);

    const skipQueryInitial = useMemo(() =>
    {
        if (validInternalId) return null;
        return { args: "__skip__", apiRes: { IsSuccess: true, Data: emptyData, SysMessage: [] } };
    }, [validInternalId]);

    const query = adapter.hooks.useQueryData({ internalId: validInternalId ?? "__skip__", initial: skipQueryInitial, deps: [validInternalId ?? ""], onError });

    const model = adapter.hooks.useModelDisplayName({ deps: [], onError });
    const [data, setData] = useState<SiteMenuSet>(emptyData);

    useEffect(() =>
    {
        if (!validInternalId)
        {
            setData(emptyData);
            return;
        }

        setData(query.data ?? emptyData);
    }, [validInternalId, query.data]);

    const refetchQuery = useCallback(async () =>
    {
        if (!validInternalId) return;
        await query.refetch();
    }, [query, validInternalId]);

    const formData = useMemo<UseFetchFormDataResult<SiteMenuSet>>(() =>
    {
        return {
            data,
            setFormData: setData,
            isLoading: Boolean(siteList.isLoading || query.isLoading || model.isLoading),
            error: siteList.errorText ?? query.errorText ?? model.errorText ?? null,
            refetch: () =>
            {
                void siteList.refetch();
                void refetchQuery();
                void model.refetch();
            },
            displayName: model.data ?? ({ ModelId: "", ModelDisplayName: "", Tables: [] } as ModelDisplaySchema),
        };
    }, [
        data,
        model.data,
        model.errorText,
        model.isLoading,
        model.refetch,
        query.errorText,
        query.isLoading,
        refetchQuery,
        siteList.errorText,
        siteList.isLoading,
        siteList.refetch,
    ]);

    const refetchData = useCallback(async () =>
    {
        await Promise.all([Promise.resolve(siteList.refetch()), Promise.resolve(refetchQuery()), Promise.resolve(model.refetch())]);
    }, [model, refetchQuery, siteList]);

    const errors = useMemo(() =>
    {
        return [siteList.errorText, query.errorText, model.errorText];
    }, [model.errorText, query.errorText, siteList.errorText]);

    return { internalId, formData, isLoading: formData.isLoading, errors, refetchData };
};
// #endregion

// #region Private - Actions
const useSiteMenuActionsByAdapter = (
    adapter: ReturnType<typeof SiteMenuAdapter>,
    internalId: string | null,
    formData: UseFetchFormDataResult<SiteMenuSet>,
    refetchData: () => Promise<void>,
): SiteMenuActions =>
{
    const { publish } = useToast();
    const saveSiteInfo = adapter.hooks.useSaveSiteInfo();
    const saveMenuItem = adapter.hooks.useSaveMenuItem();
    const saveMenuStructure = adapter.hooks.useSaveMenuStructure();

    const onCancelBack = useCallback(() =>
    {
        void refetchData();
    }, [refetchData]);

    const onSaveSiteInfo = useCallback(async (): Promise<boolean> =>
    {
        if (!internalId || !formData.data)
        {
            publish({ level: MessageStatus.Error, title: "保存失敗", text: "找不到站台資料" });
            return false;
        }

        const req = buildSaveSiteInfoRequest(internalId, formData.data);
        const res = await saveSiteInfo.saveAsync(req);
        return await handleSaveResult(res, refetchData);
    }, [formData.data, internalId, publish, refetchData, saveSiteInfo]);

    const onSaveMenuStructure = useCallback(async (tree: SiteMenuItem[], deletedRowIds: number[]): Promise<boolean> =>
    {
        if (!internalId)
        {
            publish({ level: MessageStatus.Error, title: "保存失敗", text: "找不到站台 InternalId" });
            return false;
        }

        const req = buildSaveMenuStructureRequest(internalId, tree, deletedRowIds);
        const res = await saveMenuStructure.saveAsync(req);
        return await handleSaveResult(res, refetchData);
    }, [internalId, publish, refetchData, saveMenuStructure]);

    const onSaveMenuItem = useCallback(async (item: SiteMenuItem): Promise<boolean> =>
    {
        if (!internalId || !formData.data)
        {
            publish({ level: MessageStatus.Error, title: "保存失敗", text: "找不到站台資料" });
            return false;
        }

        const req = buildSaveMenuItemRequest(internalId, formData.data, item);
        const res = await saveMenuItem.saveAsync(req);
        return await handleSaveResult(res, refetchData);
    }, [formData.data, internalId, publish, refetchData, saveMenuItem]);

    return useMemo<SiteMenuActions>(() =>
    {
        const isExecuting = Boolean(saveSiteInfo.isSaving || saveMenuItem.isSaving || saveMenuStructure.isSaving);

        return {
            isExecuting,
            onSave: onSaveSiteInfo,
            onSaveSiteInfo,
            onSaveMenuItem,
            onSaveMenuStructure,
            onCancelBack,
            onAddNew: () =>
            {},
            onEdit: (_id: string) =>
            {
                void _id;
            },
            onDelete: async (_id: string) =>
            {
                void _id;
            },
            onInvalid: (_reason?: unknown) =>
            {
                void _reason;
            },
            onPreview: () =>
            {},
        };
    }, [onCancelBack, onSaveMenuItem, onSaveMenuStructure, onSaveSiteInfo, saveMenuItem.isSaving, saveMenuStructure.isSaving, saveSiteInfo.isSaving]);
};

const buildSaveSiteInfoRequest = (internalId: string, data: SiteMenuSet): SaveSiteInfoDTO =>
{
    return { InternalId: internalId, SiteMenu_Index: data.SiteMenu_Index ?? {}, SiteMenu_IndexInfo: data.SiteMenu_IndexInfo ?? [] } as SaveSiteInfoDTO;
};

const buildSaveMenuStructureRequest = (internalId: string, tree: SiteMenuItem[], deletedRowIds: number[]): SaveMenuStructureDTO =>
{
    return { InternalId: internalId, Items: flattenStructureItems(tree), DeletedRowIds: deletedRowIds.filter(x => x > 0) } as SaveMenuStructureDTO;
};

const flattenStructureItems = (tree: SiteMenuItem[]): Array<{ RowId: number; ParentRowId: number | null; DisplayOrder: number; }> =>
{
    const result: Array<{ RowId: number; ParentRowId: number | null; DisplayOrder: number; }> = [];

    const walk = (nodes: SiteMenuItem[], parentRowId: number | null) =>
    {
        nodes.filter(x => x.id > 0).forEach((node, index) =>
        {
            result.push({ RowId: node.id, ParentRowId: parentRowId, DisplayOrder: index + 1 });
            walk(node.children ?? [], node.id);
        });
    };

    walk(tree, null);
    return result;
};

const buildSaveMenuItemRequest = (internalId: string, data: SiteMenuSet, node: SiteMenuItem): SaveMenuItemDTO =>
{
    const rowId = Number(node.id);
    const isNew = rowId <= 0;
    const sourceItem = findMenuItem(data, rowId) ?? node.menuItem;
    const itemRowId = isNew ? rowId : Number(sourceItem.RowId ?? rowId);
    const titles = buildSaveMenuItemTitles(data, itemRowId);
    const url = buildSaveMenuItemUrl(data, itemRowId);
    const module = buildSaveMenuItemModule(data, itemRowId);

    return {
        InternalId: internalId,
        RowId: isNew ? null : itemRowId,
        ParentRowId: toNullableNumber(sourceItem.ParentRowId),
        DisplayOrder: Number(sourceItem.DisplayOrder ?? 1),
        ItemSiteUrl: sourceItem.ItemSiteUrl ?? "",
        ItemType: sourceItem.ItemType ?? 0,
        WindowTarget: sourceItem.WindowTarget ?? 0,
        Titles: titles,
        Url: url,
        Module: module,
    } as SaveMenuItemDTO;
};

const buildSaveMenuItemTitles = (data: SiteMenuSet, itemRowId: number) =>
{
    return (data.SiteMenu_Item_Title ?? []).filter(x => Number(x.ItemRowId) === itemRowId).map(x =>
    {
        return { RowId: x.RowId, Lang: x.Lang, Title: x.Title, IsShowOnMenu: x.IsShowOnMenu ?? false };
    });
};

const buildSaveMenuItemUrl = (data: SiteMenuSet, itemRowId: number) =>
{
    const src = (data.SiteMenu_Item_Url ?? []).find(x => Number(x.ItemRowId) === itemRowId);
    if (!src) return null;

    return { RedirectType: src.RedirectType, RedirectUrl: src.RedirectUrl };
};

const buildSaveMenuItemModule = (data: SiteMenuSet, itemRowId: number) =>
{
    const src = (data.SiteMenu_Item_Module ?? []).find(x => Number(x.ItemRowId) === itemRowId);
    if (!src) return null;

    return { BannerId: src.BannerId, PageType: src.PageType, ModuleProgId: src.ModuleProgId, ModuleOptions: src.ModuleOptions };
};

const findMenuItem = (data: SiteMenuSet, rowId: number): SiteMenu_Item | undefined =>
{
    return (data.SiteMenu_Item ?? []).find(x => Number(x.RowId) === rowId);
};

const toNullableNumber = (value: unknown): number | null =>
{
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : null;
};

const handleSaveResult = async <T>(res: ApiResponse<T>, refetchData: () => Promise<void>): Promise<boolean> =>
{
    const ok = Boolean(res?.IsSuccess);
    if (!ok) return false;

    await refetchData();
    return true;
};
// #endregion

// #region Private - Ref Data
type SiteMenuRefDataResult = {
    windowTarget: Record<string, string>;
    menuUrlType: Record<string, string>;
    modulePageType: Record<string, string>;
    moduleDisplayStyle: Record<string, string>;
    bannerDict: Record<string, string>;
    categorySets: CategorySet[];
    tagSets: TagSet[];
    pageMap: Record<string, string>;
    timelineMap: Map<string, string>;
    surveyMap: Map<string, string>;
    isLoading: boolean;
    errors: Array<string | null | undefined>;
    refetch: () => Promise<void>;
};

const useSiteMenuRefDataByAdapter = (adapter: SiteMenuFetchAdapter, lang: Lang, onError: (e: ApiAdapterError) => void): SiteMenuRefDataResult =>
{
    const windowTarget = useEnumOptions("WindowTarget");
    const menuUrlType = useEnumOptions("MenuUrlType");
    const modulePageType = useEnumOptions("ModulePageType");
    const moduleDisplayStyle = useEnumOptions("ModuleDisplayStyle");

    const category = adapter.Category.hooks.useQueryList({
        condition: {
            Fields: [
                CategoryFields.CategoryId,
                CategoryFields.ProgId,
                `${CategoryFields._CategoryDetail}.${CategoryDetailFields.Lang}`,
                `${CategoryFields._CategoryDetail}.${CategoryDetailFields.CategoryName}`,
            ],
            PageNumber: 0,
            PageSize: 5000,
        },
        deps: [lang],
        onError,
    });

    const tag = adapter.Tag.hooks.useQueryList({
        condition: {
            Fields: [
                TagDataFields.TagId,
                TagDataFields.ProgId,
                `${TagDataFields._TagDetail}.${TagDetailFields.Lang}`,
                `${TagDataFields._TagDetail}.${TagDetailFields.TagName}`,
            ],
            PageNumber: 0,
            PageSize: 5000,
        },
        deps: [lang],
        onError,
    });

    const page = adapter.Page.hooks.useQueryList({
        condition: {
            Fields: [
                PageManagementFields.InternalId,
                `${PageManagementFields._PageManagementDetail}.${PageManagementDetailFields.Lang}`,
                `${PageManagementFields._PageManagementDetail}.${PageManagementDetailFields.Title}`,
            ],
            PageNumber: 0,
            PageSize: 5000,
        },
        deps: [lang],
        onError,
    });

    const banner = adapter.Banner.hooks.useQueryList({ condition: { PageNumber: 0, PageSize: 0 }, deps: [], onError });

    const bannerDict = useMemo<Record<string, string>>(() =>
    {
        const src = banner.data ?? [];
        return src.reduce<Record<string, string>>((acc, item: BannerSet) =>
        {
            const key = item.Banner?.BannerId?.toString?.();
            if (!key) return acc;
            acc[key] = item.Banner?.BannerCategoryName ?? "";
            return acc;
        }, {});
    }, [banner.data]);

    const pageMap = useMemo<Record<string, string>>(() =>
    {
        const src = page.data ?? [];
        return src.reduce<Record<string, string>>((acc, item: PageSet) =>
        {
            const key = item.PageManagement?.InternalId?.toString?.();
            if (!key) return acc;
            acc[key] = item.PageManagementDetail?.find(p => p.Lang === lang)?.Title ?? "";
            return acc;
        }, {});
    }, [page.data, lang]);

    const timeline = adapter.Timeline.hooks.useQueryList({
        condition: { Fields: [TimelineFields.TimelineId, TimelineFields.TimelineName, TimelineFields.InternalId] },
        deps: [lang],
        onError,
    });

    const survey = adapter.Survey.hooks.useQueryList({
        condition: { Fields: [SurveyFields.InternalId, SurveyFields.SurveyId, SurveyFields.SurveyName] },
        deps: [lang],
        onError,
    });

    const timelineMap = useMemo<Map<string, string>>(() =>
    {
        const src = timeline.data ?? [];
        return src.reduce<Map<string, string>>((acc, item: TimelineSet) =>
        {
            const key = item.Timeline?.TimelineId?.toString?.();
            if (!key) return acc;
            acc.set(key, item.Timeline?.TimelineName ?? "");
            return acc;
        }, new Map<string, string>());
    }, [timeline.data, lang]);

    const surveyMap = useMemo<Map<string, string>>(() =>
    {
        const src = survey.data ?? [];
        return src.reduce<Map<string, string>>((acc, item: SurveySet) =>
        {
            const key = item.Survey?.InternalId?.toString?.();
            if (!key) return acc;
            acc.set(key, item.Survey?.SurveyName ?? "");
            return acc;
        }, new Map<string, string>());
    }, [survey.data, lang]);

    const isLoading = useMemo(() =>
    {
        return Boolean(
            windowTarget.isLoading || menuUrlType.isLoading || modulePageType.isLoading || moduleDisplayStyle.isLoading
                || category.isLoading || tag.isLoading || page.isLoading || banner.isLoading || timeline.isLoading || survey.isLoading,
        );
    }, [
        banner.isLoading,
        category.isLoading,
        menuUrlType.isLoading,
        moduleDisplayStyle.isLoading,
        modulePageType.isLoading,
        page.isLoading,
        tag.isLoading,
        windowTarget.isLoading,
        timeline.isLoading,
        survey.isLoading,
    ]);

    const errors = useMemo(() =>
    {
        return [
            windowTarget.error,
            menuUrlType.error,
            modulePageType.error,
            moduleDisplayStyle.error,
            category.errorText,
            tag.errorText,
            page.errorText,
            banner.errorText,
            timeline.errorText,
            survey.errorText,
        ];
    }, [
        banner.errorText,
        category.errorText,
        menuUrlType.error,
        moduleDisplayStyle.error,
        modulePageType.error,
        page.errorText,
        tag.errorText,
        windowTarget.error,
        timeline.errorText,
        survey.errorText,
    ]);

    const refetch = useCallback(async () =>
    {
        await Promise.all([
            Promise.resolve(category.refetch()),
            Promise.resolve(tag.refetch()),
            Promise.resolve(page.refetch()),
            Promise.resolve(banner.refetch()),
            Promise.resolve(timeline.refetch()),
        ]);
    }, [banner, category, page, tag]);

    return {
        windowTarget: windowTarget.data,
        menuUrlType: menuUrlType.data,
        modulePageType: modulePageType.data,
        moduleDisplayStyle: moduleDisplayStyle.data,
        bannerDict,
        categorySets: category.data,
        tagSets: tag.data,
        pageMap,
        timelineMap,
        surveyMap,
        isLoading,
        errors,
        refetch,
    };
};

const useEnumOptions = (enumName: string): { data: Record<string, string>; isLoading: boolean; error: string | null; } =>
{
    const src = useFetchEnumOptions(enumName);
    return useMemo(() =>
    {
        return { data: src.data ?? {}, isLoading: Boolean(src.isLoading), error: src.error ?? null };
    }, [src.data, src.error, src.isLoading]);
};
// #endregion

/** 將 SiteMenuSet 轉換成 SiteMenuItem 樹狀資料 */
const transSetToItem = (data: SiteMenuSet, lang: Lang): SiteMenuItem[] =>
{
    const items = data?.SiteMenu_Item ?? [];
    const titles = data?.SiteMenu_Item_Title ?? [];
    const titleDict = new Map<number, Map<string, string>>();

    for (const t of titles)
    {
        const itemRowId = Number(t.ItemRowId ?? 0);
        if (!itemRowId) continue;

        const l = String(t.Lang ?? "").toLowerCase();
        const title = String(t.Title ?? "");

        if (!titleDict.has(itemRowId)) titleDict.set(itemRowId, new Map());
        titleDict.get(itemRowId)?.set(l, title);
    }

    const resolveTitle = (itemRowId: number): string =>
    {
        const langMap = titleDict.get(itemRowId);
        if (!langMap) return "";

        const primary = String(lang ?? DefaultLang).toLowerCase();
        const candidates = [primary, ...Object.keys(LangLabelMap).map((x) => String(x).toLowerCase()).filter((x) => x !== primary)];

        for (const l of candidates)
        {
            const t = String(langMap.get(l) ?? "").trim();
            if (t) return t;
        }

        return "(未命名)";
    };

    const orderMap = new Map<number, number>();
    const nodeMap = new Map<number, SiteMenuItem>();

    for (const it of items)
    {
        const rowId = Number(it.RowId);
        const displayOrder = Number(it.DisplayOrder ?? 0);
        orderMap.set(rowId, displayOrder);

        nodeMap.set(rowId, { id: rowId, name: resolveTitle(rowId), menuItem: it, children: [] });
    }

    const roots: SiteMenuItem[] = [];

    for (const it of items)
    {
        const rowId = Number(it.RowId);
        const parentRowId = it.ParentRowId;
        const node = nodeMap.get(rowId);
        if (!node) continue;

        if (parentRowId == null) roots.push(node);
        else
        {
            const parent = nodeMap.get(Number(parentRowId));
            if (parent) (parent.children ?? (parent.children = [])).push(node);
            else roots.push(node);
        }
    }

    const sortRec = (list: SiteMenuItem[]) =>
    {
        list.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));
        for (const n of list) if (n.children && n.children.length) sortRec(n.children);
    };

    sortRec(roots);
    return roots;
};

const GUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** 檢查字串是否為 GUID 格式 */
const isGuid = (value: string | null | undefined): value is string =>
{
    const text = value?.trim() ?? "";
    return GUID_REGEX.test(text);
};
