import { Server_FormTemplate_Comp } from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Comp";
import type { ServerFormBinding } from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Hook";
import { SystemInfoTabComp } from "@/Features/Pages/Server/Scaffold/SystemTab/SystemTab";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { LibTabsProp } from "@/SysCore/Components/FormField/FieldComponets/LibTabs_Comp";
import { LibDropList, LibTextBox, LibTinyMCE } from "@/SysCore/Components/FormField/LibFormField";
import { useSetTableField } from "@/SysCore/Components/FormField/useSetTableField";
import TabContentComp from "@/SysCore/Components/TabContent/TabContent";
import type { Lang } from "@/SysCore/i18n/lang";
import type { components } from "@/types/api";
import { PageManagementDetailFields, PageManagementFields, PageManagementSetFields } from "@/types/SchemaFields";
import type { ReactNode } from "react";
import { useCallback, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
    type PageManagementDetailRowKeys,
    type PageManagementDetailTabItem,
    pageManagementEmptyData,
    type PageManagementFormRefs,
    usePageManagementDetailTabs,
    usePageManagementFormTemplate,
} from "./Server_PageManagement_Form_Hook";

// #region Property
type PageManagementSet = components["schemas"]["PageManagementSet_DTO"];


interface PageManagementFormCompProps
{
    /** 後台主題設定 */
    theme: IBETheme;

    /** 目前語系 */
    lang: Lang;
}


interface HeaderSectionProps
{
    /** 後台主題設定 */
    theme: IBETheme;

    /** Form Template 提供的主資料 binding */
    binding: ServerFormBinding<PageManagementSet>;

    /** PageManagement Hook 整理後的參照資料 */
    refs: PageManagementFormRefs;
}


interface DetailSectionProps
{
    /** 後台主題設定 */
    theme: IBETheme;

    /** 目前語系 */
    lang: Lang;

    /** Form Template 提供的主資料 binding */
    binding: ServerFormBinding<PageManagementSet>;
}


interface HeaderTabContentOptions extends HeaderSectionProps
{
    /** 欄位 binding helper */
    setField: ReturnType<typeof useSetTableField<PageManagementSet>>;

    /** 頁面分類下拉選項 */
    categoryOptions: Map<string, string>;
}


interface DetailTabContentOptions
{
    /** 後台主題設定 */
    theme: IBETheme;

    /** Hook 整理後的 Detail tabs */
    tabItems: PageManagementDetailTabItem[];

    /** 欄位 binding helper */
    setField: ReturnType<typeof useSetTableField<PageManagementSet>>;
}


interface DetailFieldsOptions
{
    /** 後台主題設定 */
    theme: IBETheme;

    /** 欄位 binding helper */
    setField: ReturnType<typeof useSetTableField<PageManagementSet>>;

    /** Detail row keys，給 useSetTableField 綁定欄位 */
    rowKeys: PageManagementDetailRowKeys;
}
// #endregion

// #region Public
/** 後台頁面管理 Form，透過新版 Form Template 統一外框與資料流程。 */
export const Server_PageManagement_Form_Comp = (props: PageManagementFormCompProps) =>
{
    const { internalId } = useParams();
    const navigate = useNavigate();
    const pathname = useLocation().pathname;

    const onBackToList = useCallback(() =>
    {
        navigate(buildBackToListPath(pathname));
    }, [navigate, pathname]);

    const actionsOpt = useMemo(() =>
    {
        return { onBackToList };
    }, [onBackToList]);

    const template = usePageManagementFormTemplate({
        lang: props.lang,
        theme: props.theme,
        internalId: internalId ?? "",
        emptyData: pageManagementEmptyData,
        actionsOpt,
    });

    return (
        <Server_FormTemplate_Comp
            template={template}
            renderContent={({ vm }) => (
                <>
                    <HeaderComp theme={props.theme} binding={vm.binding} refs={vm.refs} />
                    <DetailComp theme={props.theme} lang={props.lang} binding={vm.binding} />
                </>
            )}
        />
    );
};
// #endregion

// #region Section
/** 頁面管理 Header 區塊，直接使用新版 Template Binding 與 Refs。 */
const HeaderComp = (props: HeaderSectionProps) =>
{
    const setField = useSetTableField<PageManagementSet>(props.binding);
    const categoryOptions = useMemo(() => buildCategoryOptions(props.refs.categoryMap), [props.refs.categoryMap]);
    const tabInfo: LibTabsProp = { Style: props.theme.Tabs, item: { Basic: "基本", System: "系統資訊" } };
    const tabContent = buildHeaderTabContent({ ...props, setField, categoryOptions });

    return <TabContentComp tabInfos={tabInfo} components={tabContent}></TabContentComp>;
};


/** 頁面管理多語 Detail 區塊，語系資料由 Hook 統一整理。 */
const DetailComp = (props: DetailSectionProps) =>
{
    const setField = useSetTableField<PageManagementSet>(props.binding);
    const detailTabs = usePageManagementDetailTabs({ binding: props.binding, lang: props.lang });
    const tabInfo: LibTabsProp = { Style: props.theme.Tabs, item: detailTabs.tabItems };
    const tabContent = buildDetailTabContent({ theme: props.theme, tabItems: detailTabs.items, setField });

    return <TabContentComp tabInfos={tabInfo} components={tabContent}></TabContentComp>;
};
// #endregion

// #region EntityComp
/** 建立頁面管理 Header 的各分頁欄位。 */
const buildHeaderTabContent = (opt: HeaderTabContentOptions): Record<string, ReactNode[]> =>
{
    return {
        Basic: buildBasicFields(opt),
        System: [<SystemInfoTabComp theme={opt.theme} formData={opt.binding} setKey={PageManagementSetFields.PageManagement} />],
    };
};


/** 建立基本資料欄位。 */
const buildBasicFields = (opt: HeaderTabContentOptions): ReactNode[] =>
{
    return [
        <LibDropList
            Style={opt.theme.DropList}
            Options={opt.categoryOptions}
            {...opt.setField(PageManagementSetFields.PageManagement, PageManagementFields.CategoryId, "string")}
        />,
        <LibDropList
            Style={opt.theme.DropList}
            Options={opt.refs.usedProgMap}
            ShowPlaceholder={false}
            {...opt.setField(PageManagementSetFields.PageManagement, PageManagementFields.ProgId, "string")}
        />,
    ];
};


/** 建立 Detail 語系分頁內容，畫面只依 Hook 整理後的 Tab 項目渲染。 */
const buildDetailTabContent = (opt: DetailTabContentOptions): Record<string, ReactNode[]> =>
{
    return opt.tabItems.reduce<Record<string, ReactNode[]>>((compMap, tabItem) =>
    {
        compMap[tabItem.key] = buildDetailFields({ theme: opt.theme, setField: opt.setField, rowKeys: tabItem.rowKeys });
        return compMap;
    }, {});
};


/** 建立單一語系 Detail 欄位。 */
const buildDetailFields = (opt: DetailFieldsOptions): ReactNode[] =>
{
    return [
        <LibTextBox
            Style={opt.theme.TextBox}
            DefaultInputDisplay="請輸入"
            {...opt.setField(PageManagementSetFields.PageManagementDetail, PageManagementDetailFields.Title, "string", opt.rowKeys)}
        />,
        <LibTinyMCE
            Style={opt.theme.TinyMCE}
            {...opt.setField(PageManagementSetFields.PageManagementDetail, PageManagementDetailFields.Content, "string", opt.rowKeys)}
        />,
    ];
};


/** 建立回列表路徑，避免 Back 行為散在 JSX 中。 */
const buildBackToListPath = (pathname: string): string =>
{
    return pathname.replace(/\/Form(\/[^\/]*)?$/, "/List");
};


/** 將 category object 轉成 LibDropList 使用的 Map。 */
const buildCategoryOptions = (categoryMap: Record<string, string>): Map<string, string> =>
{
    return new Map<string, string>(Object.entries(categoryMap ?? {}));
};
// #endregion
