import { LibDropList, LibTextBox, LibTinyMCE } from "@//SysCore/Components/FormField/LibFormField"
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { useGetCategoryListByProgId } from "../../../../../Hooks/BizFunc/WebManagement/Category/Category_Hook"
import PageManagementProvider from "@/Features/Hooks/BizFunc/WebManagement/Pagemanagement/PageManagement_Api"
import { FormComp } from "@/Features/Pages/Server/Scaffold/Content/Form_Comp";
import { useActions } from "@/Features/Hooks/Common/useActions";
import { useLocation, useParams } from "react-router-dom";
import type { FormCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data";
import { useFetchFormData, type UseFetchFormDataResult } from "@//SysCore/Utils/API/FetchFormData";
import type { components } from "@//types/api";
import TabContentComp from "@//SysCore/Components/TabContent/TabContent";
import { useSetTableField } from "@/SysCore/Components/FormField/useSetTableField";
import * as SchemaFields from "@/types/SchemaFields";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import { LangLabelMap, useEnsureLangDetails, type Lang } from "@/SysCore/i18n/lang";
import type { LibTabsProp } from "@/SysCore/Components/FormField/FieldComponets/LibTabs_Comp";
type PageManagementSet = components["schemas"]["PageManagementSet_DTO"]
const emptyData: PageManagementSet = { PageManagement: {}, PageManagementDetail: [] }

export const PageFormComp = (prop: { theme: IBETheme; lang: Lang }) => {
    const { internalId } = useParams()
    const dirUrl = useLocation().pathname.replace(/\/Form$/, `/Form`);
    const useCategory = useGetCategoryListByProgId("PageManagement", "zh-tw")
    const formData = useFetchFormData<PageManagementSet>(PageManagementProvider(), internalId, emptyData);
    const actions = useActions(dirUrl, PageManagementProvider(), formData.data as PageManagementSet, internalId as string)
    const isLoading = [useCategory.isLoading, formData.isLoading]
    const errors = [useCategory.error, formData.error]
    useEnsureLangDetails(formData, { headerName: SchemaFields.PageManagementSetFields.PageManagement, detailName: SchemaFields.PageManagementSetFields.PageManagementDetail, parentKeys: [SchemaFields.PageManagementDetailFields.PageId], preferFirstLang: prop.lang });
    const formProp: FormCompProp = { Title: "新增頁面", Theme: prop.theme, LoadingList: isLoading, ErrorList: errors, Actions: actions }
    return (
        <FormComp prop={formProp}>
            <HeaderComp theme={prop.theme} formData={formData} catData={useCategory.data} />
            <DetailComp theme={prop.theme} formData={formData} lang={prop.lang} />
        </FormComp>
    )
}
const HeaderComp = (prop: { theme: IBETheme; formData: UseFetchFormDataResult<PageManagementSet>; catData: Record<string, string> }) => {
    const setField = useSetTableField<PageManagementSet>(prop.formData);
    const tabInfo: LibTabsProp = { Style: prop.theme.Tabs, item: { "Basic": "基本", } }
    const components: Record<string, React.ReactNode[]> = {
        Basic: [
            <LibDropList Style={prop.theme.DropList} Options={prop.catData} {...setField(SchemaFields.PageManagementSetFields.PageManagement, SchemaFields.PageManagementFields.CategoryId, "string")} />,
        ],
    }
    return (<TabContentComp tabInfos={tabInfo} components={components}></TabContentComp>)
}
const DetailComp = (prop: { theme: IBETheme; formData: UseFetchFormDataResult<PageManagementSet>; lang: Lang }) => {
    const setField = useSetTableField<PageManagementSet>(prop.formData);
    const rawDetails = prop.formData.data?.PageManagementDetail ?? [];
    const tabInfo: LibTabsProp = {
        Style: prop.theme.Tabs,
        item: rawDetails.reduce<Record<string, string>>((tabItems, info) => {
            const langKey = LibMerge("_", true, info.PageId, info.RowId, info.Lang)
            tabItems[langKey] = LangLabelMap[info.Lang as Lang] ?? info.Lang ?? "Unknown";
            return tabItems;
        }, {})
    }
    const components: Record<string, React.ReactNode[]> = rawDetails.reduce<Record<string, React.ReactNode[]>>(
        (compMap, info) => {
            const langKey = LibMerge("_", true, info.PageId, info.RowId, info.Lang)
            const rowKeys = { [SchemaFields.PageManagementDetailFields.PageId]: info.PageId, [SchemaFields.PageManagementDetailFields.RowId]: info.RowId, }
            compMap[langKey] = [
                <LibTextBox Style={prop.theme.TextBox} DefaultInputDisplay="請輸入" {...setField(SchemaFields.PageManagementSetFields.PageManagementDetail, SchemaFields.PageManagementDetailFields.Title, "string", rowKeys)} />,
                <LibTinyMCE Style={prop.theme.TinyMCE} {...setField(SchemaFields.PageManagementSetFields.PageManagementDetail, SchemaFields.PageManagementDetailFields.Content, "string", rowKeys)} />,
            ]
            return compMap;
        },
        {} as Record<string, React.ReactNode[]>
    );
    return (<TabContentComp tabInfos={tabInfo} components={components}></TabContentComp>)
}
