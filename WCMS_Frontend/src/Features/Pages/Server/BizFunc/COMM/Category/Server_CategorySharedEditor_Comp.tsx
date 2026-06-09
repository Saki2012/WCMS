import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { LibTabsProp } from "@/SysCore/Components/FormField/FieldComponets/LibTabs_Comp";
import { LibTextBox } from "@/SysCore/Components/FormField/LibFormField";
import { useSetTableField } from "@/SysCore/Components/FormField/useSetTableField";
import TabContentComp from "@/SysCore/Components/TabContent/TabContent";
import { type Lang, LangLabelMap } from "@/SysCore/i18n/lang";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
import { CategoryDataSetFields, CategoryDetailFields } from "@/types/SchemaFields";
import { type ReactNode, useMemo } from "react";

// #region Property
type CategorySet = components["schemas"]["CategoryDataSet_DTO"];
// #endregion

// #region Public
/** 共用 Category 基本編輯區 */
export const CategorySharedEditorComp = <TSet extends CategorySet>(prop: { theme: IBETheme; formData: UseFetchFormDataResult<TSet>; }) =>
{
    const setField = useSetTableField<TSet>(prop.formData);
    const rawDetails = prop.formData.data?.CategoryDetail ?? [];
    const tabInfo: LibTabsProp = {
        Style: prop.theme.Tabs,
        item: rawDetails.reduce<Record<string, string>>((tabItems, info) =>
        {
            const langKey = LibMerge("_", true, info.CategoryId, info.RowId, info.Lang);
            tabItems[langKey] = LangLabelMap[info.Lang as Lang] ?? info.Lang ?? "Unknown";
            return tabItems;
        }, {}),
    };
    const tabContent = useMemo(() =>
    {
        return rawDetails.reduce<Record<string, ReactNode[]>>((map, item) =>
        {
            const key = LibMerge("_", true, item.CategoryId, item.RowId, item.Lang);
            const rowKeys = { [CategoryDetailFields.CategoryId]: item.CategoryId, [CategoryDetailFields.RowId]: item.RowId };
            map[key] = [
                <LibTextBox
                    key={`${key}_CategoryName`}
                    Style={prop.theme.TextBox}
                    DefaultInputDisplay="請輸入"
                    {...setField(CategoryDataSetFields.CategoryDetail, CategoryDetailFields.CategoryName, "string", rowKeys)}
                />,
            ];
            return map;
        }, {});
    }, [rawDetails, prop.theme.TextBox2, setField]);
    return (
        <div className="row g-3">
            <TabContentComp tabInfos={tabInfo} components={tabContent} />
        </div>
    );
};
// #endregion
