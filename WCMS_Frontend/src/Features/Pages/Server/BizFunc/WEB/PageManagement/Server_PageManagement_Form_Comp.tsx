import type { FormCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data";
import { FormComp } from "@/Features/Pages/Server/Scaffold/Content/Form_Comp";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { LibTabsProp } from "@/SysCore/Components/FormField/FieldComponets/LibTabs_Comp";
import { LibDropList, LibTextBox, LibTinyMCE } from "@/SysCore/Components/FormField/LibFormField";
import { useSetTableField } from "@/SysCore/Components/FormField/useSetTableField";
import TabContentComp from "@/SysCore/Components/TabContent/TabContent";
import { type Lang, LangLabelMap, useEnsureLangDetails } from "@/SysCore/i18n/lang";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
import { PageManagementDetailFields, PageManagementFields, PageManagementSetFields } from "@/types/SchemaFields";
import { useCallback, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { SystemInfoTabComp } from "../../../Scaffold/SystemTab/SystemTab";
import { usePageManagementFormFetchData } from "./Server_PageManagement_Form_Hook";
type PageManagementSet = components["schemas"]["PageManagementSet_DTO"];
const emptyData: PageManagementSet = { PageManagement: {}, PageManagementDetail: [] };
export const Server_PageManagement_Form_Comp = (prop: { theme: IBETheme; lang: Lang; }) =>
{
    const { internalId } = useParams();
    const navigate = useNavigate();
    const pathname = useLocation().pathname;
    const onBackToList = useCallback(() =>
    {
        navigate(pathname.replace(/\/Form(\/[^\/]*)?$/, "/List"));
    }, [navigate, pathname]);
    const actionsOpt = useMemo(() =>
    {
        return { onBackToList };
    }, [onBackToList]);
    const getData = usePageManagementFormFetchData({ lang: prop.lang, internalId: internalId ?? "", emptyData, actionsOpt });
    const catData = useMemo(() =>
    {
        return new Map<string, string>(Object.entries(getData.rawData.categoryMap ?? {}));
    }, [getData.rawData.categoryMap]);
    useEnsureLangDetails(getData.rawData.formData, {
        headerName: PageManagementSetFields.PageManagement,
        detailName: PageManagementSetFields.PageManagementDetail,
        parentKeys: [PageManagementDetailFields.PageId],
        preferFirstLang: prop.lang,
    });
    const formProp: FormCompProp = {
        Title: internalId ? "修改頁面" : "新增頁面",
        Theme: prop.theme,
        IsLoading: getData.isLoading,
        ErrorList: getData.errors,
        Actions: getData.rawData.actions,
    };
    return (
        <FormComp prop={formProp}>
            <HeaderComp theme={prop.theme} formData={getData.rawData.formData} catData={catData} usedProgMap={getData.rawData.usedProgMap} />
            <DetailComp theme={prop.theme} formData={getData.rawData.formData} lang={prop.lang} />
        </FormComp>
    );
};
const HeaderComp = (
    prop: { theme: IBETheme; formData: UseFetchFormDataResult<PageManagementSet>; catData: Map<string, string>; usedProgMap: Map<string, string>; },
) =>
{
    const setField = useSetTableField<PageManagementSet>(prop.formData);
    const tabInfo: LibTabsProp = { Style: prop.theme.Tabs, item: { Basic: "基本", System: "系統資訊" } };
    const components: Record<string, React.ReactNode[]> = {
        Basic: [
            <LibDropList
                Style={prop.theme.DropList}
                Options={prop.catData}
                {...setField(PageManagementSetFields.PageManagement, PageManagementFields.CategoryId, "string")}
            />,
            <LibDropList
                Style={prop.theme.DropList}
                Options={prop.usedProgMap}
                ShowPlaceholder={false}
                {...setField(PageManagementSetFields.PageManagement, PageManagementFields.ProgId, "string")}
            />,
        ],
        System: [<SystemInfoTabComp theme={prop.theme} formData={prop.formData} setKey={PageManagementSetFields.PageManagement} />],
    };
    return <TabContentComp tabInfos={tabInfo} components={components}></TabContentComp>;
};

const DetailComp = (prop: { theme: IBETheme; formData: UseFetchFormDataResult<PageManagementSet>; lang: Lang; }) =>
{
    const setField = useSetTableField<PageManagementSet>(prop.formData);
    const rawDetails = prop.formData.data?.PageManagementDetail ?? [];
    const tabInfo: LibTabsProp = {
        Style: prop.theme.Tabs,
        item: rawDetails.reduce<Record<string, string>>((tabItems, info) =>
        {
            const langKey = LibMerge("_", true, info.PageId, info.RowId, info.Lang);
            tabItems[langKey] = LangLabelMap[info.Lang as Lang] ?? info.Lang ?? "Unknown";
            return tabItems;
        }, {}),
    };
    const components: Record<string, React.ReactNode[]> = rawDetails.reduce<Record<string, React.ReactNode[]>>((compMap, info) =>
    {
        const langKey = LibMerge("_", true, info.PageId, info.RowId, info.Lang);
        const rowKeys = { [PageManagementDetailFields.PageId]: info.PageId, [PageManagementDetailFields.RowId]: info.RowId };
        compMap[langKey] = [
            <LibTextBox
                Style={prop.theme.TextBox}
                DefaultInputDisplay="請輸入"
                {...setField(PageManagementSetFields.PageManagementDetail, PageManagementDetailFields.Title, "string", rowKeys)}
            />,
            <LibTinyMCE
                Style={prop.theme.TinyMCE}
                {...setField(PageManagementSetFields.PageManagementDetail, PageManagementDetailFields.Content, "string", rowKeys)}
            />,
        ];
        return compMap;
    }, {} as Record<string, React.ReactNode[]>);
    return <TabContentComp tabInfos={tabInfo} components={components}></TabContentComp>;
};
