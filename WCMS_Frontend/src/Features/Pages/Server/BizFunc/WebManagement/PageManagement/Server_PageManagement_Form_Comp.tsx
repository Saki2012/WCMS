import { LibDropList, LibTextBox, LibTinyMCE } from "@//SysCore/Components/FormField/LibFormField"
import type { LibTabsProp } from "@//SysCore/Components/FormField/LibFormField"
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { useGetCategoryListByProgId } from "../../../../../Hooks/BizFunc/WebManagement/Category/Category_Hook"
import PageManagementProvider from "@/Features/Hooks/BizFunc/WebManagement/Pagemanagement/PageManagement_Api"
import { FormComp } from "@/Features/Pages/Server/Scaffold/Content/Form_Comp";
import { useFormToolbarActions } from "@//SysCore/Components/Toolbar/Toolbar_Hook";
import { useParams } from "react-router-dom";
import type { FormCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data";
import { useFetchFormData, type UseFetchFormDataResult } from "@//SysCore/Utils/API/FetchFormData";
import type { components } from "@//types/api";
import TabContentComp from "@//SysCore/Components/TabContent/TabContent";
import { useSetTableField } from "@/SysCore/Components/FormField/useSetTableField";
import * as SchemaFields from "@/types/SchemaFields";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import { LangLabelMap, useEnsureLangDetails, type Lang } from "@/SysCore/i18n/lang";

type PageManagementSet = components["schemas"]["PageManagementSet_DTO"]
type PageManagementDetail = components["schemas"]["PageManagementDetail_DTO"]
const emptyData: PageManagementSet = {
    PageManagement: {},
    PageManagementDetail: []
}

/** 頁面表單
 * @returns 
 */
export const PageFormComp = ({ theme }: { theme: IBETheme }) => {
    const { internalId } = useParams()
    const useCategory = useGetCategoryListByProgId("PageManagement", "zh-tw")
    const formData = useFetchFormData<PageManagementSet>(PageManagementProvider(), internalId, emptyData);
    const useToolbar = useFormToolbarActions(PageManagementProvider(), formData.data as PageManagementSet, internalId as string, () => formData.refetch())
    const isLoading = [useCategory.isLoading, formData.isLoading]
    const errors = [useCategory.error, formData.error]
    useEnsureLangDetails(formData, { headerName: SchemaFields.PageManagementSetFields.PageManagement, detailName: SchemaFields.PageManagementSetFields.PageManagementDetail, parentKeys: [SchemaFields.PageManagementDetailFields.PageId] });
    const prop: FormCompProp = { Title: "新增頁面", Theme: theme, LoadingList: isLoading, ErrorList: errors, Toolbar: useToolbar.action }
    return (
        <FormComp prop={prop}>
            <HeaderComp theme={prop.Theme} formData={formData} catData={useCategory.data} />
            <DetailComp theme={prop.Theme} formData={formData} />
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

const DetailComp = (prop: { theme: IBETheme; formData: UseFetchFormDataResult<PageManagementSet>; }) => {
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
