import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme"
import { useLocation } from 'react-router-dom';
import { FormListComp } from "@/Features/Pages/Server/Scaffold/Content/FormList_Comp";
import { useParams } from "react-router-dom";
import type { components } from "@/types/api";
import * as SchemaFields from "@/types/SchemaFields";
import { useFetchFormData, type UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import { LibCheckBox, LibTextBox } from "@/SysCore/Components/FormField/LibFormField";
import { Link } from "react-router-dom";
import { useSetTableField } from "@/SysCore/Components/FormField/useSetTableField";
import { LangLabelMap, useEnsureLangDetails, type Lang } from "@/SysCore/i18n/lang";
import TabContentComp from "@/SysCore/Components/TabContent/TabContent";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import { useEffect, useMemo, useState } from "react";
import SpecCategoryProvider from "@/SpecFetures/1810/Hooks/SpecCategory/SpecCategory_Api";
import { useSpecCateListData } from "@/SpecFetures/1810/Hooks/SpecCategory/SpecCategory_Hook";
import type { LibTabsProp } from "@/SysCore/Components/FormField/FieldComponets/LibTabs_Comp";
import { useActions, type UseActionsResult } from "@/Features/Hooks/Common/useActions";
import { GridCol_Toolbar } from "@/Features/Pages/Server/Scaffold/Toolbar/Toolbar_Comp";
import { LangLink } from "@/SysCore/i18n/LangLink";
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


    //後續在優化以下作法，牽扯到自定義api設計流程
    const [showCols, setShowCols] = useState<Record<string, string>>({});
    const [colsLoading, setColsLoading] = useState(false);
    const [colsError, setColsError] = useState<unknown>(null);
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                setColsLoading(true);
                setColsError(null);
                const res = await SpecCategoryProvider().getShowColumnItems(prop.progId);
                if (!alive || res.Data === null) return;
                setShowCols((res.Data[0] as unknown as Record<string, string>) ?? {});   // 依你的 ApiResponse 結構
            } catch (err) {
                if (!alive) return;
                setColsError(err);
            } finally {
                if (alive) setColsLoading(false);
            }
        })();
        return () => { alive = false; };
    }, [prop.progId]);

    const actions = useActions(dirUrl, SpecCategoryProvider(), formData.data, internalId ?? "", useSpecCateList.refetchFirst)
    useEnsureLangDetails(formData, { headerName: SchemaFields.SpecCategorySetFields.SpecCategory, detailName: SchemaFields.SpecCategorySetFields.SpecCategoryDetail, parentKeys: [SchemaFields.SpecCategoryDetailModelFields.CategoryId], preferFirstLang: prop.lang });
    const isLoading = [useSpecCateList.isLoading, formData.isLoading];
    const errors = [useSpecCateList.error, formData.error];
    const tagEditNode = useMemo(() => formData.data ? (<SpecCateEditComp theme={prop.theme} formData={formData} showCols={showCols} />) : null, [prop.theme, formData.data, prop.progId, prop.lang, pathname]);
    const tagListNode = useMemo(() => useSpecCateList.rawData ? (<SpecCateListComp theme={prop.theme} SpecCateSets={useSpecCateList.rawData} lang={prop.lang} actions={actions} />) : null, [prop.theme, useSpecCateList.rawData, internalId, prop.lang, prop.progId, pathname, actions]);
    return (
        <FormListComp Title={prop.title} SubTitle={prop.title} Theme={prop.theme}
            LoadingList={isLoading} ErrorList={errors}
            InputControl={tagEditNode} GridItems={tagListNode}
            Actions={actions}
        ></FormListComp>
    );
}
const SpecCateEditComp = (props: { theme: IBETheme; formData: UseFetchFormDataResult<SpecCategorySet>; showCols: Record<string, string> }) => {
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
            compMap[langKey] = [
                <LibTextBox Style={props.theme.TextBox} DefaultInputDisplay="請輸入" {...setField(SchemaFields.SpecCategorySetFields.SpecCategoryDetail, SchemaFields.SpecCategoryDetailModelFields.CategoryName, "string", rowKeys)} />,
                <LibCheckBox Style={props.theme.CheckBox} options={props.showCols} {...setField(SchemaFields.SpecCategorySetFields.SpecCategory, SchemaFields.SpecCategoryModelFields.ShowColumnItems, "string", undefined, 'csv')}></LibCheckBox>
            ]
            return compMap;
        }, {}
    );
    return (<TabContentComp tabInfos={tabInfo} components={tabContent}></TabContentComp>)
}

const SpecCateListComp = (prop: { theme: IBETheme; SpecCateSets: SpecCategorySet[]; lang: Lang; actions: UseActionsResult }) => {
    const basePath = useLocation().pathname.split('/SpecCategory')[0];
    const dirPath = `${basePath}/SpecCategory`;
    return (
        <ul className="list-group p-0">
            {prop.SpecCateSets.map((item) => {
                const internalId = item.SpecCategory?.InternalId ?? "";
                return (
                    <li className="list-group-item" key={`${item.SpecCategory?.InternalId}-${item.SpecCategoryDetail?.find(p => p.Lang === prop.lang)?.RowId}`}>
                        <div className="checkboxDIV my-2">
                            <div className="custom-control form-check">
                                <LangLink to={`${dirPath}/${item.SpecCategory?.InternalId}`} className="form-check-label" aria-label={`前往 ${item.SpecCategoryDetail?.find(p => p.Lang === prop.lang)?.CategoryName} 詳細頁`}>
                                    <span className="check-txt">{item.SpecCategoryDetail?.find(p => p.Lang === prop.lang)?.CategoryName}</span>
                                </LangLink>
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
