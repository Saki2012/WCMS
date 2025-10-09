import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme"
import { useLocation } from 'react-router-dom';
import { FormListComp } from "@/Features/Pages/Server/Scaffold/Content/FormList_Comp";
import { useCategoryListData } from "@/Features/Hooks/BizFunc/WebManagement/Category/Category_Hook";
import { useParams } from "react-router-dom";
import type { components } from "@/types/api";
import CategoryProvider from "@/Features/Hooks/BizFunc/WebManagement/Category/Category_Api";
import { useFetchFormData, type UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import { LibTextBox } from "@/SysCore/Components/FormField/LibFormField";
import { Link } from "react-router-dom";
import { LangLabelMap, useEnsureLangDetails, type Lang } from "@/SysCore/i18n/lang";
import * as SchemaFields from "@/types/SchemaFields";
import { useMemo } from "react";
import { useSetTableField } from "@/SysCore/Components/FormField/useSetTableField";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import TabContentComp from "@/SysCore/Components/TabContent/TabContent";
import type { LibTabsProp } from "@/SysCore/Components/FormField/FieldComponets/LibTabs_Comp";
import { useActions, type UseActionsResult } from "@/Features/Hooks/Common/useActions";
import { GridCol_Toolbar } from "../../../Scaffold/Toolbar/Toolbar_Comp";

type CategoryDataSet = components["schemas"]["CategoryDataSet_DTO"]

const buildEmptyTagSet = (progId: string): CategoryDataSet => ({ Category: { ProgId: progId }, CategoryDetail: [] });
/** 頁面清單
 * @returns 
 */
export const Server_CategoryListFormComp = (prop: { progId: string; title: string; theme: IBETheme; lang: Lang }) => {
    const { internalId } = useParams();
    const { pathname } = useLocation();
    const emptyData = useMemo(() => buildEmptyTagSet(prop.progId), [prop.progId]);
    var dirUrl = pathname.replace(/\/Category$/, `/Category`);
    const pathParts = pathname.split('/');
    if (pathParts[pathParts.length - 1] !== 'Category') dirUrl = location.pathname.split('/').slice(0, -1).join('/');
    const useCateList = useCategoryListData(prop.progId, prop.lang)
    const formData = useFetchFormData<CategoryDataSet>(CategoryProvider(), internalId, emptyData)
    // const useToolbar = useActions(dirUrl, CategoryProvider(), formData.data, internalId ?? "", () => { useCateList.refetch(); if (!internalId) formData.setFormData(buildEmptyTagSet(prop.progId)); })
    const actions = useActions(dirUrl, CategoryProvider(), formData.data, internalId ?? "", useCateList.refetchFirst)
    useEnsureLangDetails(formData, { headerName: SchemaFields.CategoryDataSetFields.Category, detailName: SchemaFields.CategoryDataSetFields.CategoryDetail, parentKeys: [SchemaFields.CategoryFields.CategoryId], preferFirstLang: prop.lang });
    const isLoading = [useCateList.isLoading, formData.isLoading];
    const errors = [useCateList.error, formData.error];
    const cateEditNode = useMemo(() => formData.data ? (<CateEditComp theme={prop.theme} formData={formData} />) : null, [prop.theme, formData.data, prop.progId, prop.lang, pathname]);
    const cateListNode = useMemo(() => useCateList.rawData ? (<CateListComp theme={prop.theme} cateSets={useCateList.rawData} lang={prop.lang} actions={actions} />) : null, [prop.theme, useCateList.rawData, internalId, prop.lang, prop.progId, pathname]);
    return (
        <FormListComp Title={prop.title} SubTitle={prop.title} Theme={prop.theme}
            LoadingList={isLoading} ErrorList={errors}
            InputControl={cateEditNode} GridItems={cateListNode}
            Actions={actions}
        ></FormListComp>
    );
}


const CateEditComp = (props: { theme: IBETheme; formData: UseFetchFormDataResult<CategoryDataSet>; }) => {
    const setField = useSetTableField<CategoryDataSet>(props.formData);
    const rawDetails = props.formData.data?.CategoryDetail ?? [];
    const tabInfo: LibTabsProp = {
        Style: props.theme.Tabs,
        item: rawDetails.reduce<Record<string, string>>((tabItems, info) => {
            const langKey = LibMerge("_", true, info.CategoryId, info.RowId, info.Lang)
            tabItems[langKey] = LangLabelMap[info.Lang as Lang] ?? info.Lang ?? "Unknown";
            return tabItems;
        }, {})
    };
    const tabContent: Record<string, React.ReactNode[]> = rawDetails.reduce<Record<string, React.ReactNode[]>>(
        (compMap, info) => {
            const langKey = LibMerge("_", true, info.CategoryId, info.RowId, info.Lang)
            const rowKeys = { [SchemaFields.CategoryDetailFields.CategoryId]: info.CategoryId, [SchemaFields.CategoryDetailFields.RowId]: info.RowId, }
            compMap[langKey] = [<LibTextBox Style={props.theme.TextBox} DefaultInputDisplay="請輸入" {...setField(SchemaFields.CategoryDataSetFields.CategoryDetail, SchemaFields.CategoryDetailFields.CategoryName, "string", rowKeys)} />,]
            return compMap;
        }, {}
    );
    return (
        <TabContentComp tabInfos={tabInfo} components={tabContent}></TabContentComp>
    )
}

const CateListComp = (prop: { theme: IBETheme; cateSets: CategoryDataSet[]; lang: Lang; actions: UseActionsResult }) => {
    const basePath = useLocation().pathname.split('/Category')[0];
    const dirPath = `${basePath}/Category`;
    return (
        <ul className="list-group p-0">
            {prop.cateSets.map((item) => {
                const internalId = item.Category?.InternalId ?? "";
                return (
                    <li className="list-group-item" key={`${item.Category?.InternalId}-${item.CategoryDetail?.find(p => p.Lang === prop.lang)?.RowId}`}>
                        <div className="checkboxDIV my-2">
                            <div className="custom-control form-check">
                                <Link to={`${dirPath}/${item.Category?.InternalId}`} className="form-check-label" aria-label={`前往 ${item.CategoryDetail?.find(p => p.Lang === prop.lang)?.CategoryName} 詳細頁`}>
                                    <span className="check-txt">{item.CategoryDetail?.find(p => p.Lang === prop.lang)?.CategoryName}</span>
                                </Link>
                            </div>
                        </div>
                        <div className="form-check form-switch my-2">
                            <GridCol_Toolbar key={internalId} action={prop.actions} internalId={internalId} />
                        </div>
                    </li>
                )
            })}
        </ul>
    )
}
