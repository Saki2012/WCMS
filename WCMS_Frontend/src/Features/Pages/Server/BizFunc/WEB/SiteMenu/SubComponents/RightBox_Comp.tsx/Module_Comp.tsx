// #region 模型配置
import type { IMaterialListOptions } from "@/Features/Pages/Client/BizFunc/MAT/Client_Material_List_Loader";
import type { ISurveyOptions } from "@/Features/Pages/Client/BizFunc/WEB/Survey/Client_Survey_Form_Loader";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { LibCheckBox, LibDropList, LibSelectCard } from "@/SysCore/Components/FormField/LibFormField";
import { useSetJsonField, useSetTableField } from "@/SysCore/Components/FormField/useSetTableField";
import { DefaultLang, type Lang } from "@/SysCore/i18n/lang";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import { resolveSpecFunc } from "@/SysCore/Utils/Library/SlotResolver";
import type { components } from "@/types/api";
import { PGID, SiteMenu_Item_ModuleFields, SiteMenuSetFields, TimelineFields } from "@/types/SchemaFields";
import { type ReactNode, useEffect, useMemo } from "react";
import type { SiteMenuItem } from "../../SiteMenu_Hook";
import type { ModelKey } from "../RenderRightBox_Comp";

type SiteMenuSet = components["schemas"]["SiteMenuSet_DTO"];
type SiteMenu_Item = components["schemas"]["SiteMenu_Item_DTO"];
type CategorySet = components["schemas"]["CategoryDataSet_DTO"];
type TagSet = components["schemas"]["TagSet_DTO"];
type SiteMenu_Item_Module = components["schemas"]["SiteMenu_Item_Module_DTO"];

const BaseModuleOpts: Record<string, string> = {
    Announcement: "公告",
    FileArchive: "檔案室",
    Gallery: "相簿",
    PageManagement: "頁面",
    WebResource: "網路資源",
    Timeline: "紀事表",
    Survey: "問卷調查",
    Material: "產品物件",
};

interface ModuleTimelineOptionsJson
{
    TimelineId: string;
    IsDesc: boolean;
}

interface ModuleOptionsJson
{
    PageId: string;
    Category: string;
    Tag: string;
    Style: number;
}

const moduleOptionsDefaults: ModuleOptionsJson = { PageId: "", Category: "", Tag: "", Style: 1 };

interface ModuleSettingTabExtensionContext
{
    theme: IBETheme;
    formData: UseFetchFormDataResult<SiteMenuSet>;
    selectedItemEdit: SiteMenuItem | null;
    setField: ReturnType<typeof useSetTableField<SiteMenuSet>>;
    modelKey: ModelKey;
    setModelKey: React.Dispatch<React.SetStateAction<ModelKey>>;
    moduleDisplayStyle: Record<string, string>;
    categorySets: CategorySet[];
    tagSets: TagSet[];
    pageMap: Record<string, string>;
    timelineMap: Map<string, string>;
    surveyMap: Map<string, string>;
}
export interface ModuleSettingTabExtension
{
    moduleOptions?: Partial<Record<ModelKey, string>>;
    moduleRenderers?: Partial<Record<ModelKey, ModuleRenderFactory>>;
    /**功能白名單 */
    moduleAllowKeys?: readonly string[];
}
type ModuleRenderFactory = (ctx: ModuleSettingTabExtensionContext) => ReactNode;
type UseModuleSettingTabExtensionSlot = () => ModuleSettingTabExtension;
/** 預設擴充：沒有 Spec 時不做任何額外 Module 擴充 */
const useModuleSettingTabExtensionBase: UseModuleSettingTabExtensionSlot = () =>
{
    // return
    return {};
};

/** 解析 ModuleSettingTab Spec 擴充 */
const useResolvedModuleSettingTabExtension = resolveSpecFunc<UseModuleSettingTabExtensionSlot>(
    "Pages/Server/BizFunc/WEB/SiteMenu/Module_Extension.tsx",
    useModuleSettingTabExtensionBase,
    ["useModuleSettingTabSpecExtension"],
);
/** 合併 Feature 與 Spec 模型功能選項 */
const mergeModuleOptions = (baseOptions: Record<string, string>, specOptions?: Partial<Record<ModelKey, string>>): Record<string, string> =>
{
    // 宣告變數
    const merged: Record<string, string> = { ...baseOptions };

    // 執行function
    Object.entries(specOptions ?? {}).forEach(([key, value]) =>
    {
        if (!value) return;
        merged[key] = value;
    });

    // return
    return merged;
};

/** 依 Spec 白名單過濾模型功能 */
const filterModuleOptions = (options: Record<string, string>, allowKeys?: readonly string[]): Record<string, string> =>
{
    // 宣告變數
    if (!allowKeys?.length) return options;
    const allowSet = new Set<string>(allowKeys);

    // return
    return Object.entries(options).reduce<Record<string, string>>((acc, [key, value]) =>
    {
        if (!allowSet.has(key)) return acc;
        acc[key] = value;
        return acc;
    }, {});
};

/** 依 Spec 白名單過濾模型功能渲染器 */
const filterModuleRenderers = (renderers: Record<string, ModuleRenderFactory>, allowKeys?: readonly string[]): Record<string, ModuleRenderFactory> =>
{
    // 宣告變數
    if (!allowKeys?.length) return renderers;
    const allowSet = new Set<string>(allowKeys);

    // return
    return Object.entries(renderers).reduce<Record<string, ModuleRenderFactory>>((acc, [key, value]) =>
    {
        if (!allowSet.has(key)) return acc;
        acc[key] = value;
        return acc;
    }, {});
};
interface ModuleSettingTabProps
{
    theme: IBETheme;
    selectedItemEdit: SiteMenuItem | null;
    modelKey: ModelKey;
    formData: UseFetchFormDataResult<SiteMenuSet>;
    setField: ReturnType<typeof useSetTableField<SiteMenuSet>>;
    setModelKey: React.Dispatch<React.SetStateAction<ModelKey>>;
    modulePageType: Record<string, string>;
    windowTarget: Record<string, string>;
    bannerDict: Record<string, string>;
    moduleDisplayStyle: Record<string, string>;
    categorySets: CategorySet[];
    tagSets: TagSet[];
    pageMap: Record<string, string>;
    timelineMap: Map<string, string>;
    surveyMap: Map<string, string>;
}

export const ModuleSettingTab = (prop: ModuleSettingTabProps) =>
{
    const selectedMenuItem = useSelectedMenuItem(prop.formData.data, prop.selectedItemEdit);
    const selectedNode = useSelectedNode(prop.selectedItemEdit, selectedMenuItem);
    const siteIndex = selectedMenuItem?.SiteIndex;
    const rowId = selectedMenuItem?.RowId;
    const specExtension = useResolvedModuleSettingTabExtension();
    const curRowKeys = useMemo(() =>
    {
        return { [SiteMenu_Item_ModuleFields.SiteIndex]: siteIndex, [SiteMenu_Item_ModuleFields.ItemRowId]: rowId };
    }, [siteIndex, rowId]);

    useEffect(() =>
    {
        if (siteIndex == null || rowId == null) return;

        prop.formData.setFormData((prev) =>
        {
            const data = { ...(prev ?? {}) } as SiteMenuSet;
            const list = [...(data.SiteMenu_Item_Module ?? [])];
            const exists = list.some((r) => r.SiteIndex === siteIndex && Number(r.ItemRowId) === Number(rowId));
            if (exists) return prev;

            list.push({ SiteIndex: siteIndex, ItemRowId: Number(rowId), PageType: 0, ModuleProgId: "", ModuleOptions: "" } as SiteMenu_Item_Module);

            return { ...data, SiteMenu_Item_Module: list };
        });
    }, [siteIndex, rowId, prop.formData]);

    const moduleKeyBind = prop.setField(SiteMenuSetFields.SiteMenu_Item_Module, SiteMenu_Item_ModuleFields.ModuleProgId, "string", curRowKeys);

    const moduleOpts = useMemo(() =>
    {
        const merged = mergeModuleOptions(BaseModuleOpts, specExtension.moduleOptions);
        const filtered = filterModuleOptions(merged, specExtension.moduleAllowKeys);
        return new Map<string, string>(Object.entries(filtered));
    }, [specExtension.moduleOptions, specExtension.moduleAllowKeys]);

    const extensionContext = useMemo<ModuleSettingTabExtensionContext>(() =>
    {
        return {
            theme: prop.theme,
            formData: prop.formData,
            selectedItemEdit: selectedNode,
            setField: prop.setField,
            modelKey: prop.modelKey,
            setModelKey: prop.setModelKey,
            moduleDisplayStyle: prop.moduleDisplayStyle,
            categorySets: prop.categorySets,
            tagSets: prop.tagSets,
            pageMap: prop.pageMap,
            timelineMap: prop.timelineMap,
            surveyMap: prop.surveyMap,
        };
    }, [
        prop.theme,
        prop.formData,
        selectedNode,
        prop.setField,
        prop.modelKey,
        prop.setModelKey,
        prop.moduleDisplayStyle,
        prop.categorySets,
        prop.tagSets,
        prop.pageMap,
        prop.timelineMap,
    ]);

    const baseRendererMap = useMemo<Record<string, ModuleRenderFactory>>(() =>
    {
        return {
            // #region WEB
            Announcement: (ctx) => (
                <Module_Announcement_Comp
                    theme={ctx.theme}
                    formData={ctx.formData}
                    selectedItemEdit={ctx.selectedItemEdit}
                    styleDict={ctx.moduleDisplayStyle}
                    categorySets={ctx.categorySets}
                    tagSets={ctx.tagSets}
                    lang={DefaultLang}
                />
            ),
            PageManagement: (ctx) => (
                <Module_Pagemanagement_Comp
                    theme={ctx.theme}
                    formData={ctx.formData}
                    selectedItemEdit={ctx.selectedItemEdit}
                    pageMap={ctx.pageMap}
                    lang={DefaultLang}
                />
            ),
            Gallery: (ctx) => (
                <Module_Gallery_Comp
                    theme={ctx.theme}
                    formData={ctx.formData}
                    selectedItemEdit={ctx.selectedItemEdit}
                    styleDict={ctx.moduleDisplayStyle}
                    categorySets={ctx.categorySets}
                    tagSets={ctx.tagSets}
                    lang={DefaultLang}
                />
            ),
            FileArchive: (ctx) => (
                <Module_FileArchive_Comp
                    theme={ctx.theme}
                    formData={ctx.formData}
                    selectedItemEdit={ctx.selectedItemEdit}
                    styleDict={ctx.moduleDisplayStyle}
                    categorySets={ctx.categorySets}
                    tagSets={ctx.tagSets}
                    lang={DefaultLang}
                />
            ),
            WebResource: (ctx) => (
                <Module_WebResource_Comp
                    theme={ctx.theme}
                    formData={ctx.formData}
                    selectedItemEdit={ctx.selectedItemEdit}
                    styleDict={ctx.moduleDisplayStyle}
                    categorySets={ctx.categorySets}
                    tagSets={ctx.tagSets}
                    lang={DefaultLang}
                />
            ),
            Timeline: (ctx) => (
                <Module_Timeline_Comp
                    theme={ctx.theme}
                    formData={ctx.formData}
                    selectedItemEdit={ctx.selectedItemEdit}
                    timelineMap={ctx.timelineMap}
                    lang={DefaultLang}
                />
            ),
            Survey: (ctx) => <Module_Survey_Comp theme={ctx.theme} formData={ctx.formData} selectedItemEdit={ctx.selectedItemEdit} surveyMap={ctx.surveyMap} />,
            // #endregion
            // #region MAT
            Material: (ctx) => (
                <Module_Material_Comp
                    theme={ctx.theme}
                    formData={ctx.formData}
                    selectedItemEdit={ctx.selectedItemEdit}
                    categorySets={ctx.categorySets}
                    tagSets={ctx.tagSets}
                    lang={DefaultLang}
                />
            ),
            // #endregion
        };
    }, []);

    const moduleRendererMap = useMemo<Record<string, ModuleRenderFactory>>(() =>
    {
        const merged: Record<string, ModuleRenderFactory> = { ...baseRendererMap };
        Object.entries(specExtension.moduleRenderers ?? {}).forEach(([key, value]) =>
        {
            if (!value) return;
            merged[key] = value;
        });
        return filterModuleRenderers(merged, specExtension.moduleAllowKeys);
    }, [baseRendererMap, specExtension.moduleRenderers, specExtension.moduleAllowKeys]);

    const activeModelKey = useMemo<ModelKey>(() =>
    {
        const bindValue = String(moduleKeyBind.InputValue ?? "") as ModelKey;
        return bindValue || prop.modelKey;
    }, [moduleKeyBind.InputValue, prop.modelKey]);

    const activeModuleNode = useMemo(() =>
    {
        const renderer = moduleRendererMap[activeModelKey];
        if (!renderer) return null;
        return renderer(extensionContext);
    }, [activeModelKey, extensionContext, moduleRendererMap]);

    return (
        <>
            <LibSelectCard key="basic_Setting" ColDisplayName="基礎設定">
                <LibCheckBox
                    Style={prop.theme.RadioBox}
                    options={prop.modulePageType}
                    {...prop.setField(SiteMenuSetFields.SiteMenu_Item_Module, SiteMenu_Item_ModuleFields.PageType, "number", curRowKeys)}
                />
                <Module_Banner_Comp theme={prop.theme} formData={prop.formData} selectedItemEdit={selectedNode} bannerDict={prop.bannerDict} />
                <LibDropList
                    key="model"
                    Style={prop.theme.DropList}
                    Options={moduleOpts}
                    ColumnDisplayName={moduleKeyBind.ColumnDisplayName}
                    InputValue={moduleKeyBind.InputValue}
                    AutoDefaultFirst={false}
                    onChange={(v) =>
                    {
                        moduleKeyBind.onChange?.(v);
                        prop.setModelKey(v as ModelKey);
                    }}
                />
            </LibSelectCard>

            <LibSelectCard key="onlyOne" ColDisplayName="模型功能參數">{activeModuleNode}</LibSelectCard>
        </>
    );
};

const Module_Banner_Comp = (
    prop: { theme: IBETheme; formData: UseFetchFormDataResult<SiteMenuSet>; selectedItemEdit: SiteMenuItem | null; bannerDict: Record<string, string>; },
): React.ReactNode[] =>
{
    const curRowKeys = getModuleRowKeys(prop.selectedItemEdit);
    const setField = useSetTableField<SiteMenuSet>(prop.formData);
    const bannerOpts = useMemo(() =>
    {
        return new Map<string, string>(Object.entries(prop.bannerDict ?? {}));
    }, [prop.bannerDict]);
    return [
        <LibDropList
            key="banner"
            Style={prop.theme.DropList}
            Options={bannerOpts}
            AutoDefaultFirst={false}
            {...setField(SiteMenuSetFields.SiteMenu_Item_Module, SiteMenu_Item_ModuleFields.BannerId, "string", curRowKeys)}
        />,
    ];
};

const Module_Announcement_Comp = (
    prop: {
        theme: IBETheme;
        formData: UseFetchFormDataResult<SiteMenuSet>;
        selectedItemEdit: SiteMenuItem | null;
        styleDict: Record<string, string>;
        lang: Lang;
        categorySets: CategorySet[];
        tagSets: TagSet[];
    },
) =>
{
    const curRowKeys = getModuleRowKeys(prop.selectedItemEdit);
    const binder = useSetJsonField<SiteMenuSet, ModuleOptionsJson>(
        prop.formData,
        SiteMenuSetFields.SiteMenu_Item_Module,
        SiteMenu_Item_ModuleFields.ModuleOptions,
        curRowKeys,
        moduleOptionsDefaults,
    );
    const catBind = binder.bind("Category", "csv");
    const tagBind = binder.bind("Tag", "csv");
    const styleBind = binder.bind("Style", "number");
    const { cateDic, tagDic } = useGetCategoryTagDict(PGID.Announcement, prop.lang, prop.categorySets, prop.tagSets);
    const styleOpts = useMemo(() =>
    {
        return new Map<string, string>(Object.entries(prop.styleDict ?? {}));
    }, [prop.styleDict]);
    return (
        <>
            <LibCheckBox Style={prop.theme.CheckBox} ColumnDisplayName="類別" options={cateDic} InputValue={catBind.value} onChange={catBind.onChange} />
            <LibCheckBox Style={prop.theme.CheckBox} ColumnDisplayName="標籤" options={tagDic} InputValue={tagBind.value} onChange={tagBind.onChange} />
            <LibDropList
                Style={prop.theme.DropList}
                ColumnDisplayName="清單樣式"
                Options={styleOpts}
                InputValue={styleBind.value}
                onChange={styleBind.onChange}
                AutoDefaultFirst={false}
            />
        </>
    );
};

const Module_Pagemanagement_Comp = (
    prop: {
        theme: IBETheme;
        formData: UseFetchFormDataResult<SiteMenuSet>;
        selectedItemEdit: SiteMenuItem | null;
        pageMap: Record<string, string>;
        lang: Lang;
    },
): React.ReactNode =>
{
    const curRowKeys = getModuleRowKeys(prop.selectedItemEdit);
    const binder = useSetJsonField<SiteMenuSet, ModuleOptionsJson>(
        prop.formData,
        SiteMenuSetFields.SiteMenu_Item_Module,
        SiteMenu_Item_ModuleFields.ModuleOptions,
        curRowKeys,
        moduleOptionsDefaults,
    );
    const pageBind = binder.bind("PageId", "string");
    const pageOpts = useMemo(() =>
    {
        return new Map<string, string>(Object.entries(prop.pageMap ?? {}));
    }, [prop.pageMap]);
    return (
        <LibDropList
            Style={prop.theme.DropList}
            ColumnDisplayName="選擇頁面"
            Options={pageOpts}
            AutoDefaultFirst={false}
            InputValue={pageBind.value}
            onChange={pageBind.onChange}
        />
    );
};

const Module_Gallery_Comp = (
    prop: {
        theme: IBETheme;
        formData: UseFetchFormDataResult<SiteMenuSet>;
        selectedItemEdit: SiteMenuItem | null;
        styleDict: Record<string, string>;
        lang: Lang;
        categorySets: CategorySet[];
        tagSets: TagSet[];
    },
): React.ReactNode =>
{
    const curRowKeys = getModuleRowKeys(prop.selectedItemEdit);
    const binder = useSetJsonField<SiteMenuSet, ModuleOptionsJson>(
        prop.formData,
        SiteMenuSetFields.SiteMenu_Item_Module,
        SiteMenu_Item_ModuleFields.ModuleOptions,
        curRowKeys,
        moduleOptionsDefaults,
    );
    const catBind = binder.bind("Category", "csv");
    const tagBind = binder.bind("Tag", "csv");
    const styleBind = binder.bind("Style", "number");
    const { cateDic, tagDic } = useGetCategoryTagDict(PGID.Gallery, prop.lang, prop.categorySets, prop.tagSets);
    const styleOpts = useMemo(() =>
    {
        return new Map<string, string>(Object.entries(prop.styleDict ?? {}));
    }, [prop.styleDict]);
    return (
        <>
            <LibCheckBox Style={prop.theme.CheckBox} ColumnDisplayName="類別" options={cateDic} InputValue={catBind.value} onChange={catBind.onChange} />
            <LibCheckBox Style={prop.theme.CheckBox} ColumnDisplayName="標籤" options={tagDic} InputValue={tagBind.value} onChange={tagBind.onChange} />
            <LibDropList
                Style={prop.theme.DropList}
                ColumnDisplayName="清單樣式"
                Options={styleOpts}
                InputValue={styleBind.value}
                onChange={styleBind.onChange}
                AutoDefaultFirst={false}
            />
        </>
    );
};

const Module_FileArchive_Comp = (
    prop: {
        theme: IBETheme;
        formData: UseFetchFormDataResult<SiteMenuSet>;
        selectedItemEdit: SiteMenuItem | null;
        styleDict: Record<string, string>;
        lang: Lang;
        categorySets: CategorySet[];
        tagSets: TagSet[];
    },
): React.ReactNode =>
{
    const curRowKeys = getModuleRowKeys(prop.selectedItemEdit);
    const binder = useSetJsonField<SiteMenuSet, ModuleOptionsJson>(
        prop.formData,
        SiteMenuSetFields.SiteMenu_Item_Module,
        SiteMenu_Item_ModuleFields.ModuleOptions,
        curRowKeys,
        moduleOptionsDefaults,
    );
    const catBind = binder.bind("Category", "csv");
    const tagBind = binder.bind("Tag", "csv");
    const styleBind = binder.bind("Style", "number");
    const { cateDic, tagDic } = useGetCategoryTagDict(PGID.FileArchive, prop.lang, prop.categorySets, prop.tagSets);
    const styleOpts = useMemo(() =>
    {
        return new Map<string, string>(Object.entries(prop.styleDict ?? {}));
    }, [prop.styleDict]);
    return (
        <>
            <LibCheckBox Style={prop.theme.CheckBox} ColumnDisplayName="類別" options={cateDic} InputValue={catBind.value} onChange={catBind.onChange} />
            <LibCheckBox Style={prop.theme.CheckBox} ColumnDisplayName="標籤" options={tagDic} InputValue={tagBind.value} onChange={tagBind.onChange} />
            <LibDropList
                Style={prop.theme.DropList}
                ColumnDisplayName="清單樣式"
                Options={styleOpts}
                InputValue={styleBind.value}
                onChange={styleBind.onChange}
                AutoDefaultFirst={false}
            />
        </>
    );
};

const Module_WebResource_Comp = (
    prop: {
        theme: IBETheme;
        formData: UseFetchFormDataResult<SiteMenuSet>;
        selectedItemEdit: SiteMenuItem | null;
        styleDict: Record<string, string>;
        lang: Lang;
        categorySets: CategorySet[];
        tagSets: TagSet[];
    },
): React.ReactNode =>
{
    const curRowKeys = getModuleRowKeys(prop.selectedItemEdit);
    const binder = useSetJsonField<SiteMenuSet, ModuleOptionsJson>(
        prop.formData,
        SiteMenuSetFields.SiteMenu_Item_Module,
        SiteMenu_Item_ModuleFields.ModuleOptions,
        curRowKeys,
        moduleOptionsDefaults,
    );
    const catBind = binder.bind("Category", "csv");
    const tagBind = binder.bind("Tag", "csv");
    const styleBind = binder.bind("Style", "number");
    const { cateDic, tagDic } = useGetCategoryTagDict(PGID.WebResource, prop.lang, prop.categorySets, prop.tagSets);
    const styleOpts = useMemo(() =>
    {
        return new Map<string, string>(Object.entries(prop.styleDict ?? {}));
    }, [prop.styleDict]);
    return (
        <>
            <LibCheckBox Style={prop.theme.CheckBox} ColumnDisplayName="類別" options={cateDic} InputValue={catBind.value} onChange={catBind.onChange} />
            <LibCheckBox Style={prop.theme.CheckBox} ColumnDisplayName="標籤" options={tagDic} InputValue={tagBind.value} onChange={tagBind.onChange} />
            <LibDropList
                Style={prop.theme.DropList}
                ColumnDisplayName="清單樣式"
                Options={styleOpts}
                InputValue={styleBind.value}
                onChange={styleBind.onChange}
                AutoDefaultFirst={false}
            />
        </>
    );
};
const Module_Timeline_Comp = (
    prop: {
        theme: IBETheme;
        formData: UseFetchFormDataResult<SiteMenuSet>;
        selectedItemEdit: SiteMenuItem | null;
        timelineMap: Map<string, string>;
        lang: Lang;
    },
): React.ReactNode =>
{
    const curRowKeys = getModuleRowKeys(prop.selectedItemEdit);
    const binder = useSetJsonField<SiteMenuSet, ModuleTimelineOptionsJson>(
        prop.formData,
        SiteMenuSetFields.SiteMenu_Item_Module,
        SiteMenu_Item_ModuleFields.ModuleOptions,
        curRowKeys,
        { TimelineId: "", IsDesc: false },
    );

    const timelineBind = binder.bind(TimelineFields.TimelineId, "string");
    const isDescBind = binder.bind("IsDesc", "boolean");

    const orderOpts = useMemo<Record<string, string>>(() =>
    {
        return { 1: "由新到舊" };
    }, []);

    const isDescChecked = useMemo(() =>
    {
        return normalizeBool(isDescBind.value);
    }, [isDescBind.value]);

    return (
        <>
            <LibDropList
                Style={prop.theme.DropList}
                ColumnDisplayName="選擇紀事表"
                Options={prop.timelineMap}
                AutoDefaultFirst={false}
                InputValue={timelineBind.value}
                onChange={timelineBind.onChange}
            />
            <LibCheckBox
                Style={prop.theme.CheckBox}
                ColumnDisplayName="時間順序"
                options={orderOpts}
                InputValue={isDescChecked ? "1" : ""}
                onChange={(v) =>
                {
                    const checked = toCheckboxBool(v);
                    isDescBind.onChange?.(checked);
                }}
            />
        </>
    );
};
const Module_Survey_Comp = (
    prop: { theme: IBETheme; formData: UseFetchFormDataResult<SiteMenuSet>; selectedItemEdit: SiteMenuItem | null; surveyMap: Map<string, string>; },
): React.ReactNode =>
{
    const curRowKeys = getModuleRowKeys(prop.selectedItemEdit);
    const binder = useSetJsonField<SiteMenuSet, ISurveyOptions>(
        prop.formData,
        SiteMenuSetFields.SiteMenu_Item_Module,
        SiteMenu_Item_ModuleFields.ModuleOptions,
        curRowKeys,
        { SurveyId: "" },
    );
    const pageBind = binder.bind("SurveyId", "string");
    return (
        <LibDropList
            Style={prop.theme.DropList}
            ColumnDisplayName="選擇問卷"
            Options={prop.surveyMap}
            AutoDefaultFirst={false}
            InputValue={pageBind.value}
            onChange={pageBind.onChange}
        />
    );
};

const Module_Material_Comp = (
    prop: {
        theme: IBETheme;
        formData: UseFetchFormDataResult<SiteMenuSet>;
        selectedItemEdit: SiteMenuItem | null;
        lang: Lang;
        categorySets: CategorySet[];
        tagSets: TagSet[];
    },
) =>
{
    const curRowKeys = getModuleRowKeys(prop.selectedItemEdit);
    const binder = useSetJsonField<SiteMenuSet, IMaterialListOptions>(
        prop.formData,
        SiteMenuSetFields.SiteMenu_Item_Module,
        SiteMenu_Item_ModuleFields.ModuleOptions,
        curRowKeys,
        { CategoryId: "", TagIds: "" },
    );
    const catBind = binder.bind("CategoryId", "csv");
    const tagBind = binder.bind("TagIds", "csv");
    const { cateDic, tagDic } = useGetCategoryTagDict(PGID.Material, prop.lang, prop.categorySets, prop.tagSets);
    return (
        <>
            <LibCheckBox Style={prop.theme.CheckBox} ColumnDisplayName="類別" options={cateDic} InputValue={catBind.value} onChange={catBind.onChange} />
            <LibCheckBox Style={prop.theme.CheckBox} ColumnDisplayName="標籤" options={tagDic} InputValue={tagBind.value} onChange={tagBind.onChange} />
        </>
    );
};

const normalizeBool = (value: unknown): boolean =>
{
    if (value === true) return true;
    if (value === false) return false;

    const raw = `${value ?? ""}`.trim().toLowerCase();
    return raw === "true" || raw === "1";
};

const toCheckboxBool = (value: unknown): boolean =>
{
    const raw = Array.isArray(value) ? value : `${value ?? ""}`.split(",");
    return raw.map(s => `${s}`.trim()).includes("1");
};

const useSelectedMenuItem = (data: SiteMenuSet, selected?: SiteMenuItem | null): SiteMenu_Item | null =>
{
    return useMemo(() =>
    {
        const selectedRowId = Number(selected?.id ?? selected?.menuItem?.RowId ?? 0);
        if (!selectedRowId) return null;

        const current = (data.SiteMenu_Item ?? []).find(x => Number(x.RowId) === selectedRowId);
        return current ?? selected?.menuItem ?? null;
    }, [data.SiteMenu_Item, selected]);
};

const useSelectedNode = (selected: SiteMenuItem | null, menuItem: SiteMenu_Item | null): SiteMenuItem | null =>
{
    return useMemo(() =>
    {
        if (!selected || !menuItem) return selected;
        return { ...selected, menuItem };
    }, [selected, menuItem]);
};

const getModuleRowKeys = (selectedItemEdit: SiteMenuItem | null) =>
{
    return {
        [SiteMenu_Item_ModuleFields.SiteIndex]: selectedItemEdit?.menuItem.SiteIndex,
        [SiteMenu_Item_ModuleFields.ItemRowId]: selectedItemEdit?.menuItem.RowId,
    };
};

const useGetCategoryTagDict = (progId: PGID, lang: Lang, categorySets: CategorySet[], tagSets: TagSet[]) =>
{
    const cateDic = useMemo<Record<string, string>>(() =>
    {
        const src = categorySets.filter(p => p.Category?.ProgId === progId) ?? [];

        return src.reduce<Record<string, string>>((acc, item: CategorySet) =>
        {
            const key = item.Category?.CategoryId?.toString?.();
            if (!key) return acc;
            acc[key] = item.CategoryDetail?.find(p => p.Lang === lang)?.CategoryName ?? "";
            return acc;
        }, {});
    }, [progId, lang, categorySets]);

    const tagDic = useMemo<Record<string, string>>(() =>
    {
        const src = tagSets.filter(p => p.TagData?.ProgId === progId) ?? [];

        return src.reduce<Record<string, string>>((acc, item: TagSet) =>
        {
            const key = item.TagData?.TagId?.toString?.();
            if (!key) return acc;
            acc[key] = item.TagDetail?.find(p => p.Lang === lang)?.TagName ?? "";
            return acc;
        }, {});
    }, [progId, lang, tagSets]);

    return { cateDic, tagDic };
};
// #endregion
