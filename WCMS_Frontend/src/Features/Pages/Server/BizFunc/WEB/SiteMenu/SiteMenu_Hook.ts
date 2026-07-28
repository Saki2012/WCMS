import { CategoryAdapter } from "@/Features/Hooks/BizFunc/COMM/Category_Api";
import { TagAdapter } from "@/Features/Hooks/BizFunc/COMM/Tag_Api";
import { BannerSliderAdapter } from "@/Features/Hooks/BizFunc/WEB/BannerSlider_Api";
import { PageManagementAdapter } from "@/Features/Hooks/BizFunc/WEB/PageManagement_Api";
import { SiteMenuAdapter } from "@/Features/Hooks/BizFunc/WEB/SiteMenu_Api";
import { SurveyAdapter } from "@/Features/Hooks/BizFunc/WEB/Survey_Api";
import { TimelineAdapter } from "@/Features/Hooks/BizFunc/WEB/Timeline_Api";
import type { UseActionsResult } from "@/Features/Hooks/Common/useActions";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import { type ProgPermissionResult, useProgPermission } from "@/SysCore/Components/Auth/useProgPermission";
import { DefaultLang, type Lang, LangLabelMap, SUPPORTED_LANGS, useEnsureLangDetails } from "@/SysCore/i18n/lang";
import { emitApiMessages, type ApiAdapterError } from "@/SysCore/Utils/API/APIAdapter";
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
    PGID,
    SiteMenu_IndexFields,
    SiteMenu_IndexInfoFields,
    SurveyFields,
    TagDataFields,
    TagDetailFields,
    TimelineFields,
} from "@/types/SchemaFields";
import { useCallback, useEffect, useMemo, useState } from "react";

// #region Property
type SiteMenuFormModel = components["schemas"]["SiteMenu_Index"];

type SiteMenu_Item = components["schemas"]["SiteMenu_Item"];

type SaveSiteInfoDTO = components["schemas"]["SaveSiteInfo_DTO"];

type SaveMenuStructureDTO = components["schemas"]["SaveMenuStructure_DTO"];

type SaveMenuItemDTO = components["schemas"]["SaveMenuItem_DTO"];

type CategoryFormModel = components["schemas"]["Category"];

type TagFormModel = components["schemas"]["TagData"];

type PageManagementFormModel = components["schemas"]["PageManagement"];

type BannerFormModel = components["schemas"]["Banner"];

type TimelineFormModel = components["schemas"]["Timeline"];

type SurveyFormModel = components["schemas"]["Survey"];


const emptyData: SiteMenuFormModel = {};


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
    onCancelStructure: () => Promise<void>;
};


export type SiteMenuFetchRawData = {
    internalId: string | null;
    formData: UseFetchFormDataResult<SiteMenuFormModel>;
    siteMenuItems: SiteMenuItem[];
    actions: SiteMenuActions;
    permission: ProgPermissionResult;
    windowTarget: Record<string, string>;
    menuUrlType: Record<string, string>;
    modulePageType: Record<string, string>;
    moduleDisplayStyle: Record<string, string>;
    bannerDict: Record<string, string>;
    categorySets: CategoryFormModel[];
    tagSets: TagFormModel[];
    pageSets: PageManagementFormModel[];
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


type SiteMenuMainDataResult = {
    internalId: string | null;
    formData: UseFetchFormDataResult<SiteMenuFormModel>;
    isLoading: boolean;
    errors: Array<string | null | undefined>;
    refetchData: () => Promise<void>;
};


type SiteMenuRefDataResult = {
    windowTarget: Record<string, string>;
    menuUrlType: Record<string, string>;
    modulePageType: Record<string, string>;
    moduleDisplayStyle: Record<string, string>;
    bannerDict: Record<string, string>;
    categorySets: CategoryFormModel[];
    tagSets: TagFormModel[];
    pageSets: PageManagementFormModel[];
    timelineMap: Map<string, string>;
    surveyMap: Map<string, string>;
    isLoading: boolean;
    errors: Array<string | null | undefined>;
    refetch: () => Promise<void>;
};


const GUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
// #endregion

// #region Public
/** SiteMenu 頁面資料總入口：主資料 / 參照資料 / actions 一次取回 */
export const useSiteMenuFetchData = (opt: { lang: Lang; }): UseFetchDataResult<SiteMenuFetchRawData, SiteMenuFetchAdapter> =>
{
    const { publish } = useToast();
    const permission = useProgPermission(PGID.SiteMenu);

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
    const actions = useSiteMenuActionsByAdapter(
        adapter.SiteMenu,
        main.internalId,
        main.formData,
        main.refetchData,
        permission.canUpdate,
    );

    useEnsureLangDetails(main.formData, {
        detailName: SiteMenu_IndexFields._SiteMenu_IndexInfo,
        parentKeys: [SiteMenu_IndexInfoFields.SiteIndex],
        preferFirstLang: opt.lang,
    });
    useEnsureSiteMenuItemTitles(main.formData, opt.lang);

    const isLoading = useMemo(() =>
    {
        return Boolean(main.isLoading || ref.isLoading || permission.isLoading);
    }, [main.isLoading, permission.isLoading, ref.isLoading]);

    const errors = useMemo(() =>
    {
        return [...main.errors, ...ref.errors, permission.error].filter((x): x is string => Boolean(x));
    }, [main.errors, permission.error, ref.errors]);

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
            permission,
            windowTarget: ref.windowTarget,
            menuUrlType: ref.menuUrlType,
            modulePageType: ref.modulePageType,
            moduleDisplayStyle: ref.moduleDisplayStyle,
            bannerDict: ref.bannerDict,
            categorySets: ref.categorySets,
            tagSets: ref.tagSets,
            pageSets: ref.pageSets,
            timelineMap: ref.timelineMap,
            surveyMap: ref.surveyMap,
            siteMenuItems,
        };
    }, [actions, main.formData, main.internalId, permission, ref, siteMenuItems]);

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

// #region Private
const useSiteMenuMainDataByAdapter = (adapter: ReturnType<typeof SiteMenuAdapter>, onError: (e: ApiAdapterError) => void): SiteMenuMainDataResult =>
{
    const siteList = adapter.hooks.useQueryList({ condition: { Fields: [SiteMenu_IndexFields.InternalId], PageNumber: 0, PageSize: 50 }, deps: [], onError });

    const internalId = useMemo(() =>
    {
        const first = (siteList.data ?? []).find((x) => x?.InternalId);
        return first?.InternalId ?? null;
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
    const [data, setData] = useState<SiteMenuFormModel>(emptyData);

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

    const formData = useMemo<UseFetchFormDataResult<SiteMenuFormModel>>(() =>
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


const useSiteMenuActionsByAdapter = (
    adapter: ReturnType<typeof SiteMenuAdapter>,
    internalId: string | null,
    formData: UseFetchFormDataResult<SiteMenuFormModel>,
    refetchData: () => Promise<void>,
    canUpdate: boolean,
): SiteMenuActions =>
{
    const { publish } = useToast();
    const saveSiteInfo = adapter.hooks.useSaveSiteInfo();
    const saveMenuItem = adapter.hooks.useSaveMenuItem();
    const saveMenuStructure = adapter.hooks.useSaveMenuStructure();

    /** 確認目前使用者可執行 SiteMenu 寫入操作。 */
    const ensureCanUpdate = useCallback((): boolean =>
    {
        if (canUpdate) return true;

        publish({ level: MessageStatus.Error, title: "無修改權限", text: "您沒有網站導覽的修改權限。" });
        return false;
    }, [canUpdate, publish]);

    const onCancelBack = useCallback(() =>
    {
        void refetchData();
    }, [refetchData]);

    /** 取消結構異動並重新取得伺服器資料。 */
    const onCancelStructure = useCallback(async (): Promise<void> =>
    {
        await refetchData();
    }, [refetchData]);

    const onSaveSiteInfo = useCallback(async (): Promise<boolean> =>
    {
        if (!ensureCanUpdate()) return false;
        if (!internalId || !formData.data)
        {
            publish({ level: MessageStatus.Error, title: "保存失敗", text: "找不到站台資料" });
            return false;
        }

        const req = buildSaveSiteInfoRequest(internalId, formData.data);
        const res = await saveSiteInfo.saveAsync(req);
        return await handleSaveResult(res, refetchData, publish, "網站資訊儲存成功");
    }, [ensureCanUpdate, formData.data, internalId, publish, refetchData, saveSiteInfo]);

    const onSaveMenuStructure = useCallback(async (tree: SiteMenuItem[], deletedRowIds: number[]): Promise<boolean> =>
    {
        if (!ensureCanUpdate()) return false;
        if (!internalId)
        {
            publish({ level: MessageStatus.Error, title: "保存失敗", text: "找不到站台 InternalId" });
            return false;
        }

        const req = buildSaveMenuStructureRequest(internalId, tree, deletedRowIds);
        const res = await saveMenuStructure.saveAsync(req);
        return await handleSaveResult(res, refetchData, publish, "網站導覽排序儲存成功");
    }, [ensureCanUpdate, internalId, publish, refetchData, saveMenuStructure]);

    const onSaveMenuItem = useCallback(async (item: SiteMenuItem): Promise<boolean> =>
    {
        if (!ensureCanUpdate()) return false;
        if (!internalId || !formData.data)
        {
            publish({ level: MessageStatus.Error, title: "保存失敗", text: "找不到站台資料" });
            return false;
        }

        const req = buildSaveMenuItemRequest(internalId, formData.data, item);
        const res = await saveMenuItem.saveAsync(req);
        return await handleSaveResult(res, refetchData, publish, "網站導覽項目儲存成功");
    }, [ensureCanUpdate, formData.data, internalId, publish, refetchData, saveMenuItem]);

    return useMemo<SiteMenuActions>(() =>
    {
        const isExecuting = Boolean(saveSiteInfo.isSaving || saveMenuItem.isSaving || saveMenuStructure.isSaving);

        return {
            isExecuting,
            onSave: onSaveSiteInfo,
            onSaveSiteInfo,
            onSaveMenuItem,
            onSaveMenuStructure,
            onCancelStructure,
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
    }, [
        onCancelBack,
        onCancelStructure,
        onSaveMenuItem,
        onSaveMenuStructure,
        onSaveSiteInfo,
        saveMenuItem.isSaving,
        saveMenuStructure.isSaving,
        saveSiteInfo.isSaving,
    ]);
};


/** 建立網站資訊專用 Payload，避免重複傳送整棵選單 Graph。 */
const buildSaveSiteInfoRequest = (internalId: string, data: SiteMenuFormModel): SaveSiteInfoDTO =>
{
    const siteInfo = stripSiteMenuGraph(data);
    return { InternalId: internalId, SiteMenu_Index: siteInfo, SiteMenu_IndexInfo: data._SiteMenu_IndexInfo ?? [] } as SaveSiteInfoDTO;
};

/** 移除網站資訊儲存不需要的選單 Graph。 */
const stripSiteMenuGraph = (data: SiteMenuFormModel): SiteMenuFormModel =>
{
    const siteInfo = { ...data };
    delete siteInfo._SiteMenu_IndexInfo;
    delete siteInfo._SiteMenu_Item;
    return siteInfo;
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


const buildSaveMenuItemRequest = (internalId: string, data: SiteMenuFormModel, node: SiteMenuItem): SaveMenuItemDTO =>
{
    const rowId = Number(node.id);
    const isNew = rowId <= 0;
    const sourceItem = findMenuItem(data, rowId) ?? node.menuItem;
    const itemRowId = isNew ? rowId : Number(sourceItem.RowId ?? rowId);
    const titles = buildSaveMenuItemTitles(sourceItem);
    const itemType = Number(sourceItem.ItemType ?? 0);
    const url = itemType === 1 ? buildSaveMenuItemUrl(sourceItem) : null;
    const module = itemType === 0 ? buildSaveMenuItemModule(sourceItem) : null;

    return {
        InternalId: internalId,
        RowId: isNew ? null : itemRowId,
        ParentRowId: toNullableNumber(sourceItem.ParentRowId),
        DisplayOrder: Number(sourceItem.DisplayOrder ?? 1),
        ItemSiteUrl: sourceItem.ItemSiteUrl ?? "",
        ItemType: itemType,
        WindowTarget: sourceItem.WindowTarget ?? 0,
        Titles: titles,
        Url: url,
        Module: module,
    } as SaveMenuItemDTO;
};


const buildSaveMenuItemTitles = (item: SiteMenu_Item) =>
{
    return (item._SiteMenu_Item_Title ?? []).map(title =>
    {
        return { RowId: title.RowId, Lang: title.Lang, Title: title.Title, IsShowOnMenu: title.IsShowOnMenu ?? false };
    });
};


const buildSaveMenuItemUrl = (item: SiteMenu_Item) =>
{
    const src = item._SiteMenu_Item_Url;
    if (!src) return null;
    return { RedirectType: src.RedirectType, RedirectUrl: src.RedirectUrl };
};


const buildSaveMenuItemModule = (item: SiteMenu_Item) =>
{
    const src = item._SiteMenu_Item_Module;
    if (!src) return null;
    return { BannerId: src.BannerId, PageType: src.PageType, ModuleProgId: src.ModuleProgId, ModuleOptions: src.ModuleOptions };
};

const findMenuItem = (data: SiteMenuFormModel, rowId: number): SiteMenu_Item | undefined =>
{
    return (data._SiteMenu_Item ?? []).find(x => Number(x.RowId) === rowId);
};


const toNullableNumber = (value: unknown): number | null =>
{
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : null;
};


const handleSaveResult = async <T>(
    res: ApiResponse<T>,
    refetchData: () => Promise<void>,
    publish: ReturnType<typeof useToast>["publish"],
    fallbackTitle: string,
): Promise<boolean> =>
{
    emitApiMessages(publish, res, fallbackTitle, "儲存失敗");
    if (!res?.IsSuccess) return false;

    await refetchData();
    return true;
};


/** 確保每一筆 SiteMenu Item 都具備系統支援語系標題。 */
const useEnsureSiteMenuItemTitles = (formData: UseFetchFormDataResult<SiteMenuFormModel>, preferLang: Lang): void =>
{
    useEffect(() =>
    {
        const items = formData.data?._SiteMenu_Item ?? [];
        if (items.length === 0) return;
        const langs = resolveSiteMenuLangs(formData.data, preferLang);
        const nextItems = items.map(item => ensureItemTitles(item, langs, preferLang));
        const changed = nextItems.some((item, index) => item !== items[index]);
        if (!changed) return;
        formData.setFormData(prev => ({ ...prev, _SiteMenu_Item: nextItems }));
    }, [formData.data?._SiteMenu_Item, formData.setFormData, preferLang]);
};


/** 依網站設定解析選單可維護語系，無設定時使用系統預設語系。 */
const resolveSiteMenuLangs = (data: SiteMenuFormModel | null | undefined, preferLang: Lang): Lang[] =>
{
    const configured = parseSupportLangs(data?.SupportLangs);
    const source = configured.length > 0 ? configured : SUPPORTED_LANGS;
    return Array.from(new Set<Lang>([preferLang, ...source]));
};

/** 解析網站支援語系設定，兼容 JSON 陣列與逗號分隔字串。 */
const parseSupportLangs = (value: unknown): Lang[] =>
{
    const text = String(value ?? "").trim();
    if (!text) return [];
    try
    {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) return normalizeLangCodes(parsed);
    } catch
    {
        return normalizeLangCodes(text.split(","));
    }
    return [];
};

/** 正規化語系代碼並排除未支援值。 */
const normalizeLangCodes = (values: unknown[]): Lang[] =>
{
    return values.map(value => String(value ?? "").trim().toLowerCase()).filter(isLangCode);
};

/** 判斷字串是否為系統已知語系代碼。 */
const isLangCode = (value: unknown): value is Lang =>
{
    return Object.prototype.hasOwnProperty.call(LangLabelMap, String(value ?? "").toLowerCase());
};


/** 補齊單一選單項目的語系標題並依目前語系排序。 */
const ensureItemTitles = (item: SiteMenu_Item, langs: Lang[], preferLang: Lang): SiteMenu_Item =>
{
    const current = item._SiteMenu_Item_Title ?? [];
    const existing = new Set(current.map(title => String(title.Lang ?? "").toLowerCase()));
    const maxRowId = current.reduce((max, title) => Math.max(max, Number(title.RowId ?? 0)), 0);
    const maxRowNo = current.reduce((max, title) => Math.max(max, Number(title.RowNo ?? 0)), 0);
    const missing = langs.filter(lang => !existing.has(String(lang).toLowerCase())).map((lang, index) => ({
        SiteIndex: item.SiteIndex,
        ItemRowId: item.RowId,
        RowId: maxRowId + index + 1,
        RowNo: maxRowNo + index + 1,
        Lang: lang,
        Title: "",
        IsShowOnMenu: true,
    }));
    const merged = [...current, ...missing].sort((left, right) => compareItemTitleLang(left.Lang, right.Lang, preferLang));
    const changed = missing.length > 0 || merged.some((title, index) => title !== current[index]);
    return changed ? { ...item, _SiteMenu_Item_Title: merged } as SiteMenu_Item : item;
};


/** 將目前語系標題排在同一選單項目的第一筆。 */
const compareItemTitleLang = (left: unknown, right: unknown, preferLang: Lang): number =>
{
    const prefer = String(preferLang).toLowerCase();
    const leftRank = String(left ?? "").toLowerCase() === prefer ? 0 : 1;
    const rightRank = String(right ?? "").toLowerCase() === prefer ? 0 : 1;
    return leftRank - rightRank;
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
                PageManagementFields.ProgId,
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
        return src.reduce<Record<string, string>>((acc, item: BannerFormModel) =>
        {
            const key = item.BannerId?.toString?.();
            if (!key) return acc;
            acc[key] = item.BannerCategoryName ?? "";
            return acc;
        }, {});
    }, [banner.data]);
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
        return src.reduce<Map<string, string>>((acc, item: TimelineFormModel) =>
        {
            const key = item.TimelineId?.toString?.();
            if (!key) return acc;
            acc.set(key, item.TimelineName ?? "");
            return acc;
        }, new Map<string, string>());
    }, [timeline.data, lang]);

    const surveyMap = useMemo<Map<string, string>>(() =>
    {
        const src = survey.data ?? [];
        return src.reduce<Map<string, string>>((acc, item: SurveyFormModel) =>
        {
            const key = item.InternalId?.toString?.();
            if (!key) return acc;
            acc.set(key, item.SurveyName ?? "");
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
            Promise.resolve(survey.refetch()),
        ]);
    }, [banner, category, page, survey, tag, timeline]);

    return {
        windowTarget: windowTarget.data,
        menuUrlType: menuUrlType.data,
        modulePageType: modulePageType.data,
        moduleDisplayStyle: moduleDisplayStyle.data,
        bannerDict,
        categorySets: category.data,
        tagSets: tag.data,
        pageSets: page.data ?? [],
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


/** 將 SiteMenuFormModel 轉換成 SiteMenuItem 樹狀資料 */
const transSetToItem = (data: SiteMenuFormModel, lang: Lang): SiteMenuItem[] =>
{
    const items = data?._SiteMenu_Item ?? [];
    const titleDict = new Map<number, Map<string, string>>();
    for (const item of items)
    {
        const itemRowId = Number(item.RowId ?? 0);
        if (!itemRowId) continue;
        const langMap = new Map<string, string>();
        for (const title of item._SiteMenu_Item_Title ?? [])
        {
            langMap.set(String(title.Lang ?? "").toLowerCase(), String(title.Title ?? ""));
        }
        titleDict.set(itemRowId, langMap);
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


/** 檢查字串是否為 GUID 格式 */
const isGuid = (value: string | null | undefined): value is string =>
{
    const text = value?.trim() ?? "";
    return GUID_REGEX.test(text);
};
// #endregion
