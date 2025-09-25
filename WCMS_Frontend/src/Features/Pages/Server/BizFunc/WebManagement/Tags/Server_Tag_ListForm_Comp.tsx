import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme"
import { useLocation } from 'react-router-dom';
import { FormListComp } from "@/Features/Pages/Server/Scaffold/Content/FormList_Comp";
import { useFormListToolbarActions } from "@/SysCore/Components/Toolbar/Toolbar_Hook";
import { useParams } from "react-router-dom";
import { useTagListData } from "@/Features/Hooks/BizFunc/WebManagement/Tags/Tag_Hook";
import type { components } from "@/types/api";
import * as SchemaFields from "@/types/SchemaFields";
import { useFetchFormData, type UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import TagProvider from "@/Features/Hooks/BizFunc/WebManagement/Tags/Tag_Api";
import { LibTextBox } from "@/SysCore/Components/FormField/LibFormField";
import { Link } from "react-router-dom";
import { useSetTableField } from "@/SysCore/Components/FormField/useSetTableField";
import { LangLabelMap, useEnsureLangDetails, type Lang } from "@/SysCore/i18n/lang";
import TabContentComp from "@/SysCore/Components/TabContent/TabContent";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import { useMemo } from "react";
import type { LibTabsProp } from "@/SysCore/Components/FormField/FieldComponets/LibTabs_Comp";
type TagSet = components["schemas"]["TagSet_DTO"]
const buildEmptyTagSet = (progId: string): TagSet => ({ TagData: { ProgId: progId }, TagDetail: [] });
export const TagListFormComp = (prop: { progId: string; title: string; theme: IBETheme; lang: Lang }) => {
    const { internalId } = useParams();
    const { pathname } = useLocation();
    const emptyData = useMemo(() => buildEmptyTagSet(prop.progId), [prop.progId]);
    var dirUrl = pathname.replace(/\/Tag$/, `/Tag`);
    const pathParts = pathname.split('/');
    if (pathParts[pathParts.length - 1] !== 'Tag') dirUrl = location.pathname.split('/').slice(0, -1).join('/');
    const useTagList = useTagListData(prop.progId, prop.lang)
    const formData = useFetchFormData<TagSet>(TagProvider(), internalId, emptyData)
    const useToolbar = useFormListToolbarActions(dirUrl, TagProvider(), formData.data, internalId ?? "", () => { useTagList.refetch(); if (!internalId) formData.setFormData(buildEmptyTagSet(prop.progId)); })
    useEnsureLangDetails(formData, { headerName: SchemaFields.TagSetFields.TagData, detailName: SchemaFields.TagSetFields.TagDetail, parentKeys: [SchemaFields.TagDataFields.TagId], preferFirstLang: prop.lang });
    const isLoading = [useTagList.isLoading, formData.isLoading];
    const errors = [useTagList.error, formData.error];
    const tagEditNode = useMemo(() => formData.data ? (<TagEditComp theme={prop.theme} formData={formData} />) : null, [prop.theme, formData.data, prop.progId, prop.lang, pathname]);
    const tagListNode = useMemo(() => useTagList.rawData ? (<TagListComp theme={prop.theme} tagSets={useTagList.rawData} lang={prop.lang} />) : null, [prop.theme, useTagList.rawData, internalId, prop.lang, prop.progId, pathname]);
    return (
        <FormListComp Title={prop.title} SubTitle={prop.title} Theme={prop.theme}
            LoadingList={isLoading} ErrorList={errors}
            InputControl={tagEditNode} GridItems={tagListNode}
            FormToolbar={useToolbar.toolbarActions}
        ></FormListComp>
    );
}
const TagEditComp = (props: { theme: IBETheme; formData: UseFetchFormDataResult<TagSet>; }) => {
    const setField = useSetTableField<TagSet>(props.formData);
    const rawDetails = props.formData.data?.TagDetail ?? [];
    const tabInfo: LibTabsProp = {
        Style: props.theme.Tabs,
        item: rawDetails.reduce<Record<string, string>>((tabItems, info) => {
            const langKey = LibMerge("_", true, info.TagId, info.RowId, info.Lang)
            tabItems[langKey] = LangLabelMap[info.Lang as Lang] ?? info.Lang ?? "Unknown";
            return tabItems;
        }, {})
    };
    const tabContent: Record<string, React.ReactNode[]> = rawDetails.reduce<Record<string, React.ReactNode[]>>(
        (compMap, info) => {
            const langKey = LibMerge("_", true, info.TagId, info.RowId, info.Lang)
            const rowKeys = { [SchemaFields.TagDetailFields.TagId]: info.TagId, [SchemaFields.TagDetailFields.RowId]: info.RowId, }
            compMap[langKey] = [<LibTextBox Style={props.theme.TextBox} DefaultInputDisplay="請輸入" {...setField(SchemaFields.TagSetFields.TagDetail, SchemaFields.TagDetailFields.TagName, "string", rowKeys)} />,]
            return compMap;
        }, {}
    );
    return (<TabContentComp tabInfos={tabInfo} components={tabContent}></TabContentComp>)
}

const TagListComp = (prop: { theme: IBETheme; tagSets: TagSet[]; lang: Lang; }) => {
    const basePath = useLocation().pathname.split('/Tag')[0];
    const dirPath = `${basePath}/Tag`;
    return (
        <ul className="list-group p-0">
            {prop.tagSets.map((item) => (
                <li className="list-group-item" key={`${item.TagData?.InternalId}-${item.TagDetail?.find(p => p.Lang === prop.lang)?.RowId}`}>
                    <div className="checkboxDIV my-2">
                        <div className="custom-control form-check">
                            <Link to={`${dirPath}/${item.TagData?.InternalId}`} className="form-check-label" aria-label={`前往 ${item.TagDetail?.find(p => p.Lang === prop.lang)?.TagName} 詳細頁`}>
                                <span className="check-txt">{item.TagDetail?.find(p => p.Lang === prop.lang)?.TagName}</span>
                            </Link>
                        </div>
                    </div>
                </li>
            ))}
        </ul>
    )
}
