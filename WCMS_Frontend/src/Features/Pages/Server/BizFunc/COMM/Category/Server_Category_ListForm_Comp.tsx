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
import { CategoryDetailFields, CategoryFields, type PGID } from "@/types/SchemaFields";
import { useMemo } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useCategoryListFormFetchData } from "./Server_Category_ListForm_Hook";

// #region Property
type CategoryFormModel = components["schemas"]["Category"];
// #endregion

// #region Public
/** Category 清單與表單。 */
export const Server_CategoryListFormComp = (prop: { progId: PGID; title: string; theme: IBETheme; lang: Lang; }) =>
{
    const { internalId } = useParams();
    const { pathname } = useLocation();
    const dirUrl = resolveCategoryDirUrl(pathname);
    const emptyData = useMemo(() => buildEmptyCategoryForm(prop.progId), [prop.progId]);
    const getData = useCategoryListFormFetchData({ dirUrl, lang: prop.lang, internalId: internalId ?? "", emptyData, pgId: prop.progId });
    useEnsureLangDetails(getData.rawData.editForm, {
        detailName: CategoryFields._CategoryDetail,
        parentKeys: [CategoryFields.CategoryId],
        preferFirstLang: prop.lang,
    });
    return (
        <FormListComp
            Title={prop.title}
            SubTitle={prop.title}
            Theme={prop.theme}
            isLoading={getData.isLoading}
            ErrorList={getData.errors}
            InputControl={<CateEditComp theme={prop.theme} formData={getData.rawData.editForm} />}
            GridItems={<CateListComp categories={getData.rawData.list} lang={prop.lang} actions={getData.rawData.actions} />}
            Actions={getData.rawData.actions}
        />
    );
};
// #endregion

// #region Section
/** Category 多語系編輯區。 */
const CateEditComp = (props: { theme: IBETheme; formData: UseFetchFormDataResult<CategoryFormModel>; }) =>
{
    const setField = useSetTableField<CategoryFormModel>(props.formData);
    const rawDetails = props.formData.data?._CategoryDetail ?? [];
    const tabInfo: LibTabsProp = { Style: props.theme.Tabs, item: buildCategoryTabItems(rawDetails) };
    const tabContent = buildCategoryTabContent(props.theme, rawDetails, setField);
    return <TabContentComp tabInfos={tabInfo} components={tabContent}></TabContentComp>;
};

/** Category 清單區。 */
const CateListComp = (prop: { categories: CategoryFormModel[]; lang: Lang; actions: UseActionsResult; }) =>
{
    const dirPath = `${useLocation().pathname.split("/Category")[0]}/Category`;
    return (
        <ul className="list-group p-0">
            {prop.categories.map((item) => <CategoryListItem key={item.InternalId ?? item.CategoryId ?? ""} item={item} lang={prop.lang} dirPath={dirPath} actions={prop.actions} />)}
        </ul>
    );
};

/** Category 清單單筆。 */
const CategoryListItem = (prop: { item: CategoryFormModel; lang: Lang; dirPath: string; actions: UseActionsResult; }) =>
{
    const internalId = prop.item.InternalId ?? "";
    const categoryName = prop.item._CategoryDetail?.find(item => item.Lang === prop.lang)?.CategoryName ?? "";
    return (
        <li className="list-group-item">
            <div className="checkboxDIV my-2">
                <div className="custom-control form-check ps-0 pe-3">
                    <LangLink to={`${prop.dirPath}/${internalId}`} className="form-check-label" aria-label={`前往 ${categoryName} 詳細頁`}>
                        <span className="check-txt align-items-center">{categoryName}</span>
                    </LangLink>
                </div>
            </div>
            <div className="form-check form-switch my-2 ps-0">
                <GridCol_Toolbar action={prop.actions} internalId={internalId} />
            </div>
        </li>
    );
};
// #endregion

// #region Private
/** 解析 Category 列表路徑。 */
const resolveCategoryDirUrl = (pathname: string): string =>
{
    const parts = pathname.split("/");
    if (parts[parts.length - 1] === "Category") return pathname;
    return parts.slice(0, -1).join("/");
};

/** 建立新增 Category FormModel。 */
const buildEmptyCategoryForm = (progId: string): CategoryFormModel =>
{
    return { ProgId: progId, _CategoryDetail: [] };
};

/** 建立 Category 語系頁籤。 */
const buildCategoryTabItems = (details: NonNullable<CategoryFormModel["_CategoryDetail"]>): Record<string, string> =>
{
    return details.reduce<Record<string, string>>((items, detail) =>
    {
        const key = buildCategoryLangKey(detail);
        items[key] = LangLabelMap[detail.Lang as Lang] ?? detail.Lang ?? "Unknown";
        return items;
    }, {});
};

/** 建立 Category 語系欄位內容。 */
const buildCategoryTabContent = (
    theme: IBETheme,
    details: NonNullable<CategoryFormModel["_CategoryDetail"]>,
    setField: ReturnType<typeof useSetTableField<CategoryFormModel>>,
): Record<string, React.ReactNode[]> =>
{
    return details.reduce<Record<string, React.ReactNode[]>>((items, detail) =>
    {
        const key = buildCategoryLangKey(detail);
        const rowKeys = { [CategoryDetailFields.RowId]: detail.RowId, [CategoryDetailFields.Lang]: detail.Lang };
        items[key] = [<LibTextBox key={`${key}_CategoryName`} Style={theme.TextBox} DefaultInputDisplay="請輸入" {...setField(CategoryFields._CategoryDetail, CategoryDetailFields.CategoryName, "string", rowKeys)} />];
        return items;
    }, {});
};

/** 建立 Category 語系頁籤鍵值。 */
const buildCategoryLangKey = (detail: NonNullable<CategoryFormModel["_CategoryDetail"]>[number]): string =>
{
    return LibText.Merge("_", true, detail.CategoryId, detail.RowId, detail.Lang);
};
// #endregion
