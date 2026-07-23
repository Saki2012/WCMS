import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { LibTabsProp } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/FieldComponets/LibTabs_Comp";
import { LibTextBox } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/LibFormField";
import { useSetTableField } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/useSetTableField";
import { TabContentComp } from "@/SysCore/Components/TabContent/TabContent";
import { type Lang, LangLabelMap } from "@/SysCore/i18n/lang";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import { LibText } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import { CategoryDetailFields, CategoryFields } from "@/types/SchemaFields";
import { type Dispatch, type ReactNode, type SetStateAction, useCallback, useMemo } from "react";

// #region Property
type CategoryFormModel = components["schemas"]["Category"];
type MatCategoryFormModel = components["schemas"]["MatCategoryFormModel"];
type CategoryFormSource = CategoryFormModel | MatCategoryFormModel;
// #endregion

// #region Public
/** 共用 Category 基本編輯區，支援獨立 Category 與 MatCategory 內嵌 Category。 */
export const CategorySharedEditorComp = <TForm extends CategoryFormSource>(prop: { theme: IBETheme; formData: UseFetchFormDataResult<TForm>; }) =>
{
    const categoryBinding = useCategoryBinding(prop.formData);
    const setField = useSetTableField<CategoryFormModel>(categoryBinding);
    const details = categoryBinding.data?._CategoryDetail ?? [];
    const tabInfo: LibTabsProp = { Style: prop.theme.Tabs, item: buildCategoryTabItems(details) };
    const tabContent = buildCategoryTabContent(prop.theme, details, setField);
    return (
        <div className="row g-3">
            <TabContentComp tabInfos={tabInfo} components={tabContent} />
        </div>
    );
};
// #endregion

// #region Private
/** 將獨立或內嵌 Category 轉為共用表單 Binding。 */
const useCategoryBinding = <TForm extends CategoryFormSource>(formData: UseFetchFormDataResult<TForm>): UseFetchFormDataResult<CategoryFormModel> =>
{
    const data = getCategoryModel(formData.data);
    const setFormData = useCallback<Dispatch<SetStateAction<CategoryFormModel>>>((updater) =>
    {
        formData.setFormData((prev) => updateCategorySource(prev, updater));
    }, [formData.setFormData]);
    return useMemo(() => ({ ...formData, data, setFormData }), [data, formData, setFormData]);
};

/** 取得 Category Root Model。 */
const getCategoryModel = (source: CategoryFormSource): CategoryFormModel =>
{
    if (isMatCategoryForm(source)) return source.Category ?? {};
    return source;
};

/** 寫回獨立或內嵌 Category Root Model。 */
const updateCategorySource = <TForm extends CategoryFormSource>(
    source: TForm,
    updater: SetStateAction<CategoryFormModel>,
): TForm =>
{
    const current = getCategoryModel(source);
    const next = typeof updater === "function" ? updater(current) : updater;
    if (isMatCategoryForm(source)) return { ...source, Category: next } as TForm;
    return next as TForm;
};

/** 判斷是否為 MatCategory FormModel。 */
const isMatCategoryForm = (source: CategoryFormSource): source is MatCategoryFormModel =>
{
    return Object.prototype.hasOwnProperty.call(source ?? {}, "Category");
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

/** 建立 Category 語系欄位。 */
const buildCategoryTabContent = (
    theme: IBETheme,
    details: NonNullable<CategoryFormModel["_CategoryDetail"]>,
    setField: ReturnType<typeof useSetTableField<CategoryFormModel>>,
): Record<string, ReactNode[]> =>
{
    return details.reduce<Record<string, ReactNode[]>>((items, detail) =>
    {
        const key = buildCategoryLangKey(detail);
        const rowKeys = { [CategoryDetailFields.RowId]: detail.RowId, [CategoryDetailFields.Lang]: detail.Lang };
        items[key] = [
            <LibTextBox
                key={`${key}_CategoryName`}
                Style={theme.TextBox}
                DefaultInputDisplay="請輸入"
                {...setField(CategoryFields._CategoryDetail, CategoryDetailFields.CategoryName, "string", rowKeys)}
            />,
        ];
        return items;
    }, {});
};

/** 建立 Category 語系頁籤鍵值。 */
const buildCategoryLangKey = (detail: NonNullable<CategoryFormModel["_CategoryDetail"]>[number]): string =>
{
    return LibText.Merge("_", true, detail.CategoryId, detail.RowId, detail.Lang);
};
// #endregion
