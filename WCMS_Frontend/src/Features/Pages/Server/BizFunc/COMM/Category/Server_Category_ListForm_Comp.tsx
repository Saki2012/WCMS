import type { UseActionsResult } from "@/Features/Hooks/Common/useActions";
import { FormListComp } from "@/Features/Pages/Server/Scaffold/Content/FormList_Comp";
import { GridCol_Toolbar } from "@/Features/Pages/Server/Scaffold/Toolbar/Toolbar_Comp";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { LibTabsProp } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/FieldComponets/LibTabs_Comp";
import { LibTextBox } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/LibFormField";
import { useSetTableField } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/useSetTableField";
import { TabContentComp } from "@/SysCore/Components/TabContent/TabContent";
import { type Lang, LangLabelMap, useEnsureLangDetails } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import { LibText } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import { CategoryDataSetFields, CategoryDetailFields, CategoryFields, type PGID } from "@/types/SchemaFields";
import { useMemo } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useCategoryListFormFetchData } from "./Server_Category_ListForm_Hook";

// #region Property
type CategoryDataSet = components["schemas"]["CategoryDataSet_DTO"];
// #endregion

// #region Public
export const Server_CategoryListFormComp = (prop: { progId: PGID; title: string; theme: IBETheme; lang: Lang; }) =>
{
    const { internalId } = useParams();
    const { pathname } = useLocation();
    let dirUrl = pathname.replace(/\/Category$/, `/Category`);
    const pathParts = pathname.split("/");
    if (pathParts[pathParts.length - 1] !== "Category") dirUrl = location.pathname.split("/").slice(0, -1).join("/");
    const emptyData = useMemo(() => buildEmptyCategorySet(prop.progId), [prop.progId]);
    const getData = useCategoryListFormFetchData({ dirUrl: dirUrl, lang: prop.lang, internalId: internalId ?? "", emptyData, pgId: prop.progId });
    useEnsureLangDetails(getData.rawData.editForm, {
        headerName: CategoryDataSetFields.Category,
        detailName: CategoryDataSetFields.CategoryDetail,
        parentKeys: [CategoryFields.CategoryId],
        preferFirstLang: prop.lang,
    });
    const cateEditNode = useMemo(() => (getData.rawData.editForm ? <CateEditComp theme={prop.theme} formData={getData.rawData.editForm} /> : null), [
        prop.theme,
        getData.rawData.editForm,
    ]);
    const cateListNode = useMemo(
        () => (getData.rawData.list
            ? <CateListComp theme={prop.theme} cateSets={getData.rawData.list} lang={prop.lang} actions={getData.rawData.actions} />
            : null),
        [prop.theme, getData.rawData.list, prop.lang, getData.rawData.actions],
    );
    return (
        <FormListComp
            Title={prop.title}
            SubTitle={prop.title}
            Theme={prop.theme}
            isLoading={getData.isLoading}
            ErrorList={getData.errors}
            InputControl={cateEditNode}
            GridItems={cateListNode}
            Actions={getData.rawData.actions}
        />
    );
};
// #endregion

// #region Section
const CateEditComp = (props: { theme: IBETheme; formData: UseFetchFormDataResult<CategoryDataSet>; }) =>
{
    const setField = useSetTableField<CategoryDataSet>(props.formData);
    const rawDetails = props.formData.data?.CategoryDetail ?? [];
    const tabInfo: LibTabsProp = {
        Style: props.theme.Tabs,
        item: rawDetails.reduce<Record<string, string>>((tabItems, info) =>
        {
            const langKey = LibText.Merge("_", true, info.CategoryId, info.RowId, info.Lang);
            tabItems[langKey] = LangLabelMap[info.Lang as Lang] ?? info.Lang ?? "Unknown";
            return tabItems;
        }, {}),
    };
    const tabContent: Record<string, React.ReactNode[]> = rawDetails.reduce<Record<string, React.ReactNode[]>>((compMap, info) =>
    {
        const langKey = LibText.Merge("_", true, info.CategoryId, info.RowId, info.Lang);
        const rowKeys = { [CategoryDetailFields.CategoryId]: info.CategoryId, [CategoryDetailFields.RowId]: info.RowId };
        compMap[langKey] = [
            <LibTextBox
                Style={props.theme.TextBox}
                DefaultInputDisplay="請輸入"
                {...setField(CategoryDataSetFields.CategoryDetail, CategoryDetailFields.CategoryName, "string", rowKeys)}
            />,
        ];
        return compMap;
    }, {});
    return <TabContentComp tabInfos={tabInfo} components={tabContent}></TabContentComp>;
};

const CateListComp = (prop: { theme: IBETheme; cateSets: CategoryDataSet[]; lang: Lang; actions: UseActionsResult; }) =>
{
    const basePath = useLocation().pathname.split("/Category")[0];
    const dirPath = `${basePath}/Category`;
    return (
        <ul className="list-group p-0">
            {prop.cateSets.map((item) =>
            {
                const internalId = item.Category?.InternalId ?? "";
                return (
                    <li className="list-group-item" key={`${item.Category?.InternalId}-${item.CategoryDetail?.find(p => p.Lang === prop.lang)?.RowId}`}>
                        <div className="checkboxDIV my-2">
                            <div className="custom-control form-check">
                                <LangLink
                                    to={`${dirPath}/${item.Category?.InternalId}`}
                                    className="form-check-label"
                                    aria-label={`前往 ${
                                        item.CategoryDetail?.find(p => p.Lang === prop.lang)?.CategoryName
                                    } 詳細頁`}
                                >
                                    <span className="check-txt">{item.CategoryDetail?.find(p => p.Lang === prop.lang)?.CategoryName}</span>
                                </LangLink>
                            </div>
                        </div>
                        <div className="form-check form-switch my-2">
                            <GridCol_Toolbar key={internalId} action={prop.actions} internalId={internalId} />
                        </div>
                    </li>
                );
            })}
        </ul>
    );
};
// #endregion

// #region Protected
const buildEmptyCategorySet = (progId: string): CategoryDataSet => ({ Category: { ProgId: progId }, CategoryDetail: [] });
// #endregion
