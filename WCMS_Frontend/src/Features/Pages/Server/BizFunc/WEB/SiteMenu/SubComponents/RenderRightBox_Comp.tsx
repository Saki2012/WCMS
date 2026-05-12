import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { LibTabsProp } from "@/SysCore/Components/FormField/FieldComponets/LibTabs_Comp";
import { useSetTableField } from "@/SysCore/Components/FormField/useSetTableField";
import TabContentComp from "@/SysCore/Components/TabContent/TabContent";
import { DefaultLang } from "@/SysCore/i18n/lang";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import type { components } from "@/types/api";
import type { PGID } from "@/types/SchemaFields";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { SiteMenuActions, SiteMenuEditTarget, SiteMenuItem } from "../SiteMenu_Hook";
import { HyperlinkSettingTab } from "./RightBox_Comp.tsx/Hyperlink_Comp";
import { BasicSettingTab } from "./RightBox_Comp.tsx/MenuInfo_Comp";
import { ModuleSettingTab } from "./RightBox_Comp.tsx/Module_Comp";
import { SiteInfo_Comp } from "./RightBox_Comp.tsx/SiteInfo_Comp";

type SiteMenuSet = components["schemas"]["SiteMenuSet_DTO"];
type SiteMenu_Item_Url = components["schemas"]["SiteMenu_Item_Url_DTO"];
type SiteMenu_Item_Module = components["schemas"]["SiteMenu_Item_Module_DTO"];
type CategorySet = components["schemas"]["CategoryDataSet_DTO"];
type TagSet = components["schemas"]["TagSet_DTO"];
type MenuUrlType = components["schemas"]["MenuUrlType"];
type PageSet = components["schemas"]["PageManagementSet_DTO"];

export type ModelKey = string | PGID;

type RenderRightBoxProp = {
    theme: IBETheme;
    selectedItemEdit: SiteMenuEditTarget;
    formData: UseFetchFormDataResult<SiteMenuSet>;
    siteMenuItems: SiteMenuItem[];
    windowTarget: Record<string, string>;
    menuUrlType: Record<string, string>;
    modulePageType: Record<string, string>;
    bannerDict: Record<string, string>;
    moduleDisplayStyle: Record<string, string>;
    categorySets: CategorySet[];
    tagSets: TagSet[];
    pageSets: PageSet[];
    timelineMap: Map<string, string>;
    surveyMap: Map<string, string>;
    action: SiteMenuActions;
};

/** 右側編輯區：依目前選取項目切換對應設定頁籤 */
export const RenderRightBox = (prop: RenderRightBoxProp) =>
{
    const setField = useSetTableField<SiteMenuSet>(prop.formData);
    const [tabResetSeed, setTabResetSeed] = useState(0);
    const [linkType, setLinkType] = useState<MenuUrlType>(1);
    const [modelKey, setModelKey] = useState<ModelKey>("");
    const [navType, setNavType] = useState<MenuUrlType>(1);

    const selectedMenuNode = useMemo(() =>
    {
        return prop.selectedItemEdit?.type === "menu" ? prop.selectedItemEdit.item : null;
    }, [prop.selectedItemEdit]);

    const selectedMenuItem = useMemo(() =>
    {
        if (!selectedMenuNode) return null;
        const rowId = Number(selectedMenuNode.id ?? selectedMenuNode.menuItem?.RowId ?? 0);
        if (!rowId) return selectedMenuNode.menuItem ?? null;
        return (prop.formData.data?.SiteMenu_Item ?? []).find(x => Number(x.RowId) === rowId) ?? selectedMenuNode.menuItem ?? null;
    }, [prop.formData.data?.SiteMenu_Item, selectedMenuNode]);

    const headerTitle = useMemo(() =>
    {
        if (!prop.selectedItemEdit) return "";
        if (prop.selectedItemEdit.type === "site") return prop.selectedItemEdit.title;
        return prop.selectedItemEdit.item.name;
    }, [prop.selectedItemEdit]);

    const selectedSiteIndex = selectedMenuItem?.SiteIndex;
    const selectedRowId = selectedMenuItem?.RowId ?? selectedMenuNode?.id;

    const selectedUrlRow = useMemo(() =>
    {
        return findSelectedUrlRow(prop.formData.data?.SiteMenu_Item_Url ?? [], selectedSiteIndex, selectedRowId);
    }, [prop.formData.data?.SiteMenu_Item_Url, selectedSiteIndex, selectedRowId]);

    const selectedModuleRow = useMemo(() =>
    {
        return findSelectedModuleRow(prop.formData.data?.SiteMenu_Item_Module ?? [], selectedSiteIndex, selectedRowId);
    }, [prop.formData.data?.SiteMenu_Item_Module, selectedSiteIndex, selectedRowId]);

    /** 右側保存：網站資訊走 SaveSiteInfo；選單項目走 SaveMenuItem */
    const handleSave = useCallback(async () =>
    {
        if (!prop.selectedItemEdit) return;

        if (prop.selectedItemEdit.type === "site")
        {
            await prop.action.onSaveSiteInfo();
            return;
        }

        await prop.action.onSaveMenuItem(prop.selectedItemEdit.item);
    }, [prop.action, prop.selectedItemEdit]);

    /** 同步目前選取項目的功能類型 / 連結類型 / 模型代碼 */
    useEffect(() =>
    {
        if (!selectedMenuItem)
        {
            setLinkType(1);
            setNavType(1);
            setModelKey("");
            return;
        }

        setLinkType(Number(selectedMenuItem.ItemType ?? 1) as MenuUrlType);
        setNavType(Number(selectedUrlRow?.RedirectType ?? 1) as MenuUrlType);
        setModelKey(String(selectedModuleRow?.ModuleProgId ?? "") as ModelKey);
    }, [selectedMenuItem, selectedModuleRow, selectedUrlRow]);

    /** 切換項目或頁籤主類型時，重置 tabs key */
    useEffect(() =>
    {
        setTabResetSeed((prev) => prev + 1);
    }, [selectedRowId, linkType]);

    if (!prop.selectedItemEdit)
    {
        return (
            <div className="col-xxl-7 col-12 right-box">
                <div className="default-box"></div>
            </div>
        );
    }

    return (
        <div className="col-xxl-7 col-12 right-box">
            <div className="edit-box">
                <div className="panel">
                    <div className="panel-body">
                        <div className="card-header pt-1">
                            <h3>
                                <i className="fas fa-align-left me-2"></i>
                                <span className="fw-bold text-primary">{headerTitle}</span>{"  "}- 編輯
                            </h3>
                        </div>

                        <div className="mt-4 overflow-scroll-customize">
                            {selectedMenuNode
                                ? (
                                    <MenuInfoComp
                                        theme={prop.theme}
                                        selectedItemEdit={selectedMenuNode}
                                        formData={prop.formData}
                                        setField={setField}
                                        siteMenuItems={prop.siteMenuItems}
                                        menuUrlType={prop.menuUrlType}
                                        windowTarget={prop.windowTarget}
                                        modulePageType={prop.modulePageType}
                                        bannerDict={prop.bannerDict}
                                        moduleDisplayStyle={prop.moduleDisplayStyle}
                                        categorySets={prop.categorySets}
                                        tagSets={prop.tagSets}
                                        pageSets={prop.pageSets}
                                        timelineMap={prop.timelineMap}
                                        surveyMap={prop.surveyMap}
                                        tabResetSeed={tabResetSeed}
                                        linkType={linkType}
                                        modelKey={modelKey}
                                        navType={navType}
                                        setLinkType={setLinkType}
                                        setModelKey={setModelKey}
                                        setNavType={setNavType}
                                    />
                                )
                                : <SiteInfo_Comp theme={prop.theme} formData={prop.formData} setField={setField} />}
                        </div>

                        <div className="d-flex justify-content-center">
                            <button
                                type="button"
                                className="btn btn-custom btn-rounded btn-sm mr-2 mb-2"
                                disabled={prop.action.isExecuting}
                                onClick={() => void handleSave()}
                            >
                                儲存
                            </button>
                            <button
                                type="button"
                                className="btn btn-custom btn-rounded btn-sm mr-2 mb-2"
                                disabled={prop.action.isExecuting}
                                onClick={prop.action.onCancelBack}
                            >
                                取消
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

type MenuInfoCompProps = {
    theme: IBETheme;
    selectedItemEdit: SiteMenuItem;
    formData: UseFetchFormDataResult<SiteMenuSet>;
    setField: ReturnType<typeof useSetTableField<SiteMenuSet>>;
    siteMenuItems: SiteMenuItem[];
    menuUrlType: Record<string, string>;
    windowTarget: Record<string, string>;
    modulePageType: Record<string, string>;
    bannerDict: Record<string, string>;
    moduleDisplayStyle: Record<string, string>;
    categorySets: CategorySet[];
    tagSets: TagSet[];
    pageSets: PageSet[];
    timelineMap: Map<string, string>;
    surveyMap: Map<string, string>;
    tabResetSeed: number;
    linkType: MenuUrlType;
    modelKey: ModelKey;
    navType: MenuUrlType;
    setLinkType: React.Dispatch<React.SetStateAction<MenuUrlType>>;
    setModelKey: React.Dispatch<React.SetStateAction<ModelKey>>;
    setNavType: React.Dispatch<React.SetStateAction<MenuUrlType>>;
};

/** 一般選單的右側內容：基本 / 模型 / 超連結 tabs */
const MenuInfoComp = (prop: MenuInfoCompProps) =>
{
    const tabInfos = useMemo<LibTabsProp>(() =>
    {
        const baseTabs = { basic: "基本" };

        if (prop.linkType === 2) return { Style: prop.theme.Tabs, item: { ...baseTabs, module: "模型配置" } };
        if (prop.linkType === 1) return { Style: prop.theme.Tabs, item: { ...baseTabs, url: "超連結設定" } };

        return { Style: prop.theme.Tabs, item: baseTabs };
    }, [prop.linkType, prop.theme.Tabs]);

    const components = useMemo<Record<string, React.ReactNode[]>>(() =>
    {
        const map: Record<string, React.ReactNode[]> = {
            basic: [
                <BasicSettingTab
                    key="basic"
                    theme={prop.theme}
                    selectedItemEdit={prop.selectedItemEdit}
                    formData={prop.formData}
                    setField={prop.setField}
                    itemType={prop.menuUrlType}
                    windowTarget={prop.windowTarget}
                    setLinkType={prop.setLinkType}
                />,
            ],
        };

        if (prop.linkType === 2)
        {
            map.module = [
                <ModuleSettingTab
                    key="module"
                    theme={prop.theme}
                    selectedItemEdit={prop.selectedItemEdit}
                    formData={prop.formData}
                    setField={prop.setField}
                    modelKey={prop.modelKey}
                    setModelKey={prop.setModelKey}
                    modulePageType={prop.modulePageType}
                    windowTarget={prop.windowTarget}
                    bannerDict={prop.bannerDict}
                    moduleDisplayStyle={prop.moduleDisplayStyle}
                    categorySets={prop.categorySets}
                    tagSets={prop.tagSets}
                    pageSets={prop.pageSets}
                    timelineMap={prop.timelineMap}
                    surveyMap={prop.surveyMap}
                />,
            ];
        }

        if (prop.linkType === 1)
        {
            map.url = [
                <HyperlinkSettingTab
                    key="url"
                    theme={prop.theme}
                    selectedItemEdit={prop.selectedItemEdit}
                    formData={prop.formData}
                    setField={prop.setField}
                    siteMenuItems={prop.siteMenuItems}
                    menuUrlType={prop.menuUrlType}
                    navType={prop.navType}
                    setNavType={prop.setNavType}
                    lang={DefaultLang}
                />,
            ];
        }

        return map;
    }, [prop]);

    return <TabContentComp key={`tabs-${prop.tabResetSeed}`} tabInfos={tabInfos} components={components} />;
};

/** 依目前選取項目取得對應的 Url 設定列 */
const findSelectedUrlRow = (list: SiteMenu_Item_Url[], siteIndex?: string | null, itemRowId?: number | null): SiteMenu_Item_Url | undefined =>
{
    return list.find((row) => row.SiteIndex === siteIndex && row.ItemRowId === itemRowId);
};

/** 依目前選取項目取得對應的 Module 設定列 */
const findSelectedModuleRow = (list: SiteMenu_Item_Module[], siteIndex?: string | null, itemRowId?: number | null): SiteMenu_Item_Module | undefined =>
{
    return list.find((row) => row.SiteIndex === siteIndex && row.ItemRowId === itemRowId);
};
