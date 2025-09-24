import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme"
import { useLocation } from 'react-router-dom';
import { FormListComp } from "@/Features/Pages/Server/Scaffold/Content/FormList_Comp";
import { useFormListToolbarActions } from "@/SysCore/Components/Toolbar/Toolbar_Hook";
import { useParams } from "react-router-dom";
import type { components } from "@/types/api";
import * as SchemaFields from "@/types/SchemaFields";
import { useFetchFormData, type UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import { LibTextBox, type LibTabsProp } from "@/SysCore/Components/FormField/LibFormField";
import { Link } from "react-router-dom";
import { useSetTableField } from "@/SysCore/Components/FormField/useSetTableField";
import { LangLabelMap, useEnsureLangDetails, type Lang } from "@/SysCore/i18n/lang";
import TabContentComp from "@/SysCore/Components/TabContent/TabContent";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import { useMemo } from "react";
import SpecCategoryProvider from "@/SpecFetures/1810/Hooks/SpecCategory/SpecCategory_Api";
import { useSpecCateListData } from "@/SpecFetures/1810/Hooks/SpecCategory/SpecCategory_Hook";
type SpecCategorySet = components["schemas"]["SpecCategorySet_DTO"]
const buildEmptySet = (progId: string): SpecCategorySet => ({ SpecCategory: { ProgId: progId }, SpecCategoryDetail: [] });



export const Server_SpecCategoryListFormComp = (prop: { progId: string; title: string; theme: IBETheme; lang: Lang }) => {
    const { internalId } = useParams();
    const { pathname } = useLocation();
    const emptyData = useMemo(() => buildEmptySet(prop.progId), [prop.progId]);
    var dirUrl = pathname.replace(/\/SpecCategory$/, `/SpecCategory`);
    const pathParts = pathname.split('/');
    if (pathParts[pathParts.length - 1] !== 'SpecCategory') dirUrl = location.pathname.split('/').slice(0, -1).join('/');

    const useSpecCateList = useSpecCateListData(prop.progId, prop.lang)

    const formData = useFetchFormData<SpecCategorySet>(SpecCategoryProvider(), internalId, emptyData)
    const useToolbar = useFormListToolbarActions(dirUrl, SpecCategoryProvider(), formData.data, internalId ?? "", () => {
        useSpecCateList.refetch();
        if (!internalId) formData.setFormData(buildEmptySet(prop.progId));
    })


    useEnsureLangDetails(formData, { headerName: SchemaFields.SpecCategorySetFields.SpecCategory, detailName: SchemaFields.SpecCategorySetFields.SpecCategoryDetail, parentKeys: [SchemaFields.SpecCategoryDetailModelFields.CategoryId], preferFirstLang: prop.lang });
    const isLoading = [useSpecCateList.isLoading, formData.isLoading];
    const errors = [useSpecCateList.error, formData.error];
    const tagEditNode = useMemo(() => formData.data ? (<SpecCateEditComp theme={prop.theme} formData={formData} />) : null, [prop.theme, formData.data, prop.progId, prop.lang, pathname]);
    const tagListNode = useMemo(() => useSpecCateList.rawData ? (<SpecCateListComp theme={prop.theme} SpecCateSets={useSpecCateList.rawData} lang={prop.lang} />) : null, [prop.theme, useSpecCateList.rawData, internalId, prop.lang, prop.progId, pathname]);
    return (
        <FormListComp Title={prop.title} SubTitle={prop.title} Theme={prop.theme}
            LoadingList={isLoading} ErrorList={errors}
            InputControl={tagEditNode} GridItems={tagListNode}
            FormToolbar={useToolbar.toolbarActions}
        ></FormListComp>
    );
}
const SpecCateEditComp = (props: { theme: IBETheme; formData: UseFetchFormDataResult<SpecCategorySet>; }) => {
    const setField = useSetTableField<SpecCategorySet>(props.formData);
    const rawDetails = props.formData.data?.SpecCategoryDetail ?? [];
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
            const rowKeys = { [SchemaFields.SpecCategoryDetailModelFields.CategoryId]: info.CategoryId, [SchemaFields.SpecCategoryDetailModelFields.RowId]: info.RowId, }
            compMap[langKey] = [<LibTextBox Style={props.theme.TextBox} DefaultInputDisplay="請輸入" {...setField(SchemaFields.SpecCategorySetFields.SpecCategoryDetail, SchemaFields.SpecCategoryDetailModelFields.CategoryName, "string", rowKeys)} />,]
            return compMap;
        }, {}
    );
    return (
        <TabContentComp tabInfos={tabInfo} components={tabContent}></TabContentComp>
    )
}

const SpecCateListComp = (prop: { theme: IBETheme; SpecCateSets: SpecCategorySet[]; lang: Lang; }) => {
    const basePath = useLocation().pathname.split('/SpecCategory')[0];
    const dirPath = `${basePath}/SpecCategory`;
    return (
        <ul className="list-group p-0">
            {prop.SpecCateSets.map((item) => (
                <li className="list-group-item" key={`${item.SpecCategory?.InternalId}-${item.SpecCategoryDetail?.find(p => p.Lang === prop.lang)?.RowId}`}>
                    <div className="checkboxDIV my-2">
                        <div className="custom-control form-check">
                            <Link to={`${dirPath}/${item.SpecCategory?.InternalId}`} className="form-check-label" aria-label={`前往 ${item.SpecCategoryDetail?.find(p => p.Lang === prop.lang)?.CategoryName} 詳細頁`}>
                                <span className="check-txt">{item.SpecCategoryDetail?.find(p => p.Lang === prop.lang)?.CategoryName}</span>
                            </Link>
                        </div>
                    </div>
                </li>
            ))}
        </ul>
    )
}
