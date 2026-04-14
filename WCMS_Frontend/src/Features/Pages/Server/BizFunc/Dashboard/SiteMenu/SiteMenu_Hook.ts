import { SiteMenuAdapter } from "@/Features/Hooks/BizFunc/SystemSetting/SiteMenu_Api";
import { BannerSliderAdapter } from "@/Features/Hooks/BizFunc/WebManagement/BannerSlider_Api";
import { CategoryAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Category_Api";
import { PageManagementAdapter } from "@/Features/Hooks/BizFunc/WebManagement/PageManagement_Api";
import { TagAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Tag_Api";
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
    TagDataFields,
    TagDetailFields,
} from "@/types/SchemaFields";
import { useCallback, useEffect, useMemo, useState } from "react";

type SiteMenuSet = components["schemas"]["SiteMenuSet_DTO"];
type SiteMenu_Item = components["schemas"]["SiteMenu_Item_DTO"];
type SiteMenu_Item_Title = components["schemas"]["SiteMenu_Item_Title_DTO"];
type CategorySet = components["schemas"]["CategoryDataSet_DTO"];
type TagSet = components["schemas"]["TagSet_DTO"];
type PageSet = components["schemas"]["PageManagementSet_DTO"];
type BannerSet = components["schemas"]["BannerSet_DTO"];

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
export type SiteMenuFetchRawData = {
    internalId: string | null;
    formData: UseFetchFormDataResult<SiteMenuSet>;
    siteMenuItems: SiteMenuItem[];
    actions: UseActionsResult;
    windowTarget: Record<string, string>;
    menuUrlType: Record<string, string>;
    modulePageType: Record<string, string>;
    moduleDisplayStyle: Record<string, string>;
    bannerDict: Record<string, string>;
    categorySets: CategorySet[];
    tagSets: TagSet[];
    pageMap: Record<string, string>;
};

export type SiteMenuFetchAdapter = {
    SiteMenu: ReturnType<typeof SiteMenuAdapter>;
    Category: ReturnType<typeof CategoryAdapter>;
    Tag: ReturnType<typeof TagAdapter>;
    Page: ReturnType<typeof PageManagementAdapter>;
    Banner: ReturnType<typeof BannerSliderAdapter>;
};
// #endregion

// #region Public Hook
/** SiteMenu 頁面資料總入口：主資料 / 參照資料 / actions 一次取回 */
export const useSiteMenuFetchData = (
    opt: { lang: Lang; },
): UseFetchDataResult<SiteMenuFetchRawData, SiteMenuFetchAdapter> =>
{
    // 宣告變數
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
        };
    }, []);
    // 執行 function：主資料
    const main = useSiteMenuMainDataByAdapter(adapter.SiteMenu, onError);
    // 執行 function：參照資料
    const ref = useSiteMenuRefDataByAdapter(adapter, opt.lang, onError);
    // 執行 function：表單 actions
    const actions = useSiteMenuActionsByAdapter(adapter.SiteMenu, main.internalId, main.formData, main.refetchData);
    // 執行 function：補齊多語系 detail
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
    // 宣告變數：統一出口
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
    // return
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

const useSiteMenuMainDataByAdapter = (
    adapter: ReturnType<typeof SiteMenuAdapter>,
    onError: (e: ApiAdapterError) => void,
): SiteMenuMainDataResult =>
{
    // 執行 function：先抓站台清單
    const siteList = adapter.hooks.useQueryList({
        condition: { Fields: [SiteMenu_IndexFields.InternalId], PageNumber: 0, PageSize: 50 },
        deps: [],
        onError,
    });
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

    const query = adapter.hooks.useQueryData({
        internalId: validInternalId ?? "__skip__",
        initial: skipQueryInitial,
        deps: [validInternalId ?? ""],
        onError,
    });
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
            displayName: model.data
                ?? ({
                    ModelId: "",
                    ModelDisplayName: "",
                    Tables: [],
                } as ModelDisplaySchema),
        };
    }, [
        data,
        model.data,
        model.errorText,
        model.isLoading,
        model.refetch,
        query.errorText,
        query.isLoading,
        query.refetch,
        siteList.errorText,
        siteList.isLoading,
        siteList.refetch,
    ]);
    const refetchQuery = useCallback(async () =>
    {
        if (!validInternalId) return;
        await query.refetch();
    }, [query, validInternalId]);
    const refetchData = useCallback(async () =>
    {
        await Promise.all([
            Promise.resolve(siteList.refetch()),
            Promise.resolve(refetchQuery),
            Promise.resolve(model.refetch()),
        ]);
    }, [model, refetchQuery, siteList]);
    const errors = useMemo(() =>
    {
        return [siteList.errorText, query.errorText, model.errorText];
    }, [model.errorText, query.errorText, siteList.errorText]);
    // return
    return { internalId, formData, isLoading: formData.isLoading, errors, refetchData };
};
// #endregion

// #region Private - Actions
const useSiteMenuActionsByAdapter = (
    adapter: ReturnType<typeof SiteMenuAdapter>,
    internalId: string | null,
    formData: UseFetchFormDataResult<SiteMenuSet>,
    refetchData: () => Promise<void>,
): UseActionsResult =>
{
    const { publish } = useToast();
    const cud = adapter.hooks.useCudActions();
    const onCancelBack = useCallback(() =>
    {
        void refetchData();
    }, [refetchData]);
    const onSave = useCallback(async (): Promise<boolean> =>
    {
        // 宣告變數
        if (!internalId)
        {
            publish({ level: MessageStatus.Error, title: "保存失敗", text: "找不到站台 InternalId" });
            return false;
        }

        try
        {
            const res = await cud.updateAsync(internalId, formData.data) as ApiResponse<SiteMenuSet>;
            const ok = Boolean(res?.IsSuccess);
            if (!ok)
            {
                res.SysMessage.map((item) =>
                {
                    publish({ level: item.Status, title: "保存失敗", code: item.MessageCode, text: item.Message });
                });
                return false;
            }
            await refetchData();
            publish({ level: MessageStatus.Green, title: "保存成功" });
            return true;
        } catch (error)
        {
            const message = error instanceof Error ? error.message : "發生未預期錯誤";

            publish({
                level: MessageStatus.Error,
                title: "保存失敗",
                text: message,
            });

            return false;
        }
    }, [cud, formData.data, internalId, publish, refetchData]);
    return useMemo<UseActionsResult>(() =>
    {
        return {
            isExecuting: cud.isSaving,
            onSave,
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
    }, [cud.isSaving, onCancelBack, onSave]);
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
    isLoading: boolean;
    errors: Array<string | null | undefined>;
    refetch: () => Promise<void>;
};

const useSiteMenuRefDataByAdapter = (
    adapter: SiteMenuFetchAdapter,
    lang: Lang,
    onError: (e: ApiAdapterError) => void,
): SiteMenuRefDataResult =>
{
    // 執行 function：enum
    const windowTarget = useEnumOptions("WindowTarget");
    const menuUrlType = useEnumOptions("MenuUrlType");
    const modulePageType = useEnumOptions("ModulePageType");
    const moduleDisplayStyle = useEnumOptions("ModuleDisplayStyle");

    // 執行 function：關聯清單
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
    const isLoading = useMemo(() =>
    {
        return Boolean(
            windowTarget.isLoading || menuUrlType.isLoading || modulePageType.isLoading || moduleDisplayStyle.isLoading
                || category.isLoading || tag.isLoading || page.isLoading || banner.isLoading,
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
    ]);
    const refetch = useCallback(async () =>
    {
        await Promise.all([
            Promise.resolve(category.refetch()),
            Promise.resolve(tag.refetch()),
            Promise.resolve(page.refetch()),
            Promise.resolve(banner.refetch()),
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
        isLoading,
        errors,
        refetch,
    };
};

const useEnumOptions = (
    enumName: string,
): { data: Record<string, string>; isLoading: boolean; error: string | null; } =>
{
    const src = useFetchEnumOptions(enumName);
    return useMemo(() =>
    {
        return { data: src.data ?? {}, isLoading: Boolean(src.isLoading), error: src.error ?? null };
    }, [src.data, src.error, src.isLoading]);
};
// #endregion

/** 將SiteMenuSet轉換成SiteMenuItem(樹狀資料)，應該是SiteMenu做好下傳給左右側 */
const transSetToItem = (data: SiteMenuSet, lang: Lang): SiteMenuItem[] =>
{
    const items = data?.SiteMenu_Item ?? [];
    const titles = data?.SiteMenu_Item_Title ?? [];
    // ✅ 建立：itemRowId -> (lang -> title) 對照（收全部語系，後面再做 fallback）
    const titleDict = new Map<number, Map<string, string>>();
    for (const t of titles)
    {
        const itemRowId = Number((t as SiteMenu_Item_Title).ItemRowId ?? 0);
        if (!itemRowId) continue;
        const l = String((t as SiteMenu_Item_Title).Lang ?? "").toLowerCase();
        const title = String((t as any).Title ?? "");
        if (!titleDict.has(itemRowId)) titleDict.set(itemRowId, new Map());
        titleDict.get(itemRowId)!.set(l, title);
    }
    // ✅ 以「指定 lang」為優先語系；若沒有，就往其他語系找第一個有值的 title
    const resolveTitle = (itemRowId: number): string =>
    {
        const langMap = titleDict.get(itemRowId);
        if (!langMap) return "";
        const primary = String(lang ?? DefaultLang).toLowerCase();
        const candidates = [
            primary,
            ...Object.keys(LangLabelMap).map((x) => String(x).toLowerCase()).filter((x) => x !== primary),
        ];
        for (const l of candidates)
        {
            const t = String(langMap.get(l) ?? "").trim();
            if (t) return t;
        }
        return "(未命名)";
    };
    // 方便排序：RowId -> DisplayOrder
    const orderMap = new Map<number, number>();
    // 先為每個項目建立節點
    const nodeMap = new Map<number, SiteMenuItem>();
    for (const it of items)
    {
        const rowId = Number((it as any).RowId);
        const displayOrder = Number((it as any).DisplayOrder ?? 0);
        orderMap.set(rowId, displayOrder);
        const text = resolveTitle(rowId);
        nodeMap.set(rowId, {
            id: rowId,
            name: text,
            menuItem: it,
            children: [],
        });
    }
    // 串接 parent/children
    const roots: SiteMenuItem[] = [];
    for (const it of items)
    {
        const rowId = Number((it as any).RowId);
        const parentRowId = (it as any).ParentRowId as number | null | undefined;
        const node = nodeMap.get(rowId)!;
        if (parentRowId == null) roots.push(node);
        else
        {
            const parent = nodeMap.get(Number(parentRowId));
            if (parent) (parent.children ?? (parent.children = [])).push(node);
            else roots.push(node);
        }
    }
    // 依 DisplayOrder 排序（含遞迴子節點）
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
