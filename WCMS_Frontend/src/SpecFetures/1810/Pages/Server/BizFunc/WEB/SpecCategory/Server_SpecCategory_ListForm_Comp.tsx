import type { UseActionsResult } from "@/Features/Hooks/Common/useActions";
import { FormListComp } from "@/Features/Pages/Server/Scaffold/Content/FormList_Comp";
import type { LibTabsProp } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/FieldComponets/LibTabs_Comp";
import { LibCheckBox, LibTextBox } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/LibFormField";
import { useFormModelField, useSetTableField } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/useSetTableField";
import { GridCol_Toolbar } from "@/Features/Pages/Server/Scaffold/Toolbar/Toolbar_Comp";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { TabContentComp } from "@/SysCore/Components/TabContent/TabContent";
import { type Lang, LangLabelMap, useEnsureLangDetails } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import { LibText } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import { PGID, SpecCategoryDetailFields, SpecCategoryFields } from "@/types/SchemaFields";
import { useMemo } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useSpecCategoryListFormFetchData } from "./Server_SpecCategory_ListForm_Hook";

// #region Property
type SpecCategoryFormModel = components["schemas"]["SpecCategory"];
type SpecCategoryDetail = NonNullable<SpecCategoryFormModel["_SpecCategoryDetail"]>[number];
// #endregion

// #region Public
/** 顯示 SpecCategory 清單與 FormModel 編輯區。 */
export const Server_SpecCategoryListFormComp = (prop: { progId: PGID; title: string; theme: IBETheme; lang: Lang; }) =>
{
    const { internalId } = useParams();
    const { pathname } = useLocation();
    const dirUrl = resolveSpecCategoryDirUrl(pathname);
    const emptyData = useMemo(() => buildEmptySpecCategoryForm(prop.progId), [prop.progId]);
    const getData = useSpecCategoryListFormFetchData({ dirUrl, lang: prop.lang, internalId: internalId ?? "", emptyData, pgId: prop.progId });
    useEnsureLangDetails(getData.rawData.editForm, {
        detailName: SpecCategoryFields._SpecCategoryDetail,
        parentKeys: [SpecCategoryFields.CategoryId],
        preferFirstLang: prop.lang,
    });
    return (
        <FormListComp
            Title={prop.title}
            SubTitle={prop.title}
            Theme={prop.theme}
            isLoading={getData.isLoading}
            ErrorList={getData.errors}
            InputControl={<SpecCategoryEditSection theme={prop.theme} formData={getData.rawData.editForm} showCols={getData.rawData.showCols} />}
            GridItems={<SpecCategoryListSection items={getData.rawData.list} lang={prop.lang} actions={getData.rawData.actions} />}
            Actions={getData.rawData.actions}
        />
    );
};
// #endregion

// #region Section
/** 顯示 SpecCategory 多語系欄位與根層顯示欄位設定。 */
const SpecCategoryEditSection = (prop: { theme: IBETheme; formData: UseFetchFormDataResult<SpecCategoryFormModel>; showCols: Record<string, string>; }) =>
{
    const setRootField = useFormModelField(prop.formData);
    const setDetailField = useSetTableField<SpecCategoryFormModel>(prop.formData);
    const details = prop.formData.data?._SpecCategoryDetail ?? [];
    const tabInfo: LibTabsProp = { Style: prop.theme.Tabs, item: buildSpecCategoryTabItems(details) };
    const tabContent = buildSpecCategoryTabContent(prop, details, setRootField, setDetailField);
    return <TabContentComp tabInfos={tabInfo} components={tabContent} />;
};

/** 顯示 SpecCategory 清單。 */
const SpecCategoryListSection = (prop: { items: SpecCategoryFormModel[]; lang: Lang; actions: UseActionsResult; }) =>
{
    const dirPath = `${useLocation().pathname.split("/SpecCategory")[0]}/SpecCategory`;
    return (
        <ul className="list-group p-0">
            {prop.items.map(item => <SpecCategoryListItem key={item.InternalId ?? item.CategoryId ?? ""} item={item} lang={prop.lang} dirPath={dirPath} actions={prop.actions} />)}
        </ul>
    );
};

/** 顯示單筆 SpecCategory 清單資料。 */
const SpecCategoryListItem = (prop: { item: SpecCategoryFormModel; lang: Lang; dirPath: string; actions: UseActionsResult; }) =>
{
    const internalId = prop.item.InternalId ?? "";
    const categoryName = prop.item._SpecCategoryDetail?.find(item => item.Lang === prop.lang)?.CategoryName ?? "";
    return (
        <li className="list-group-item">
            <div className="checkboxDIV my-2">
                <div className="custom-control form-check">
                    <LangLink to={`${prop.dirPath}/${internalId}`} className="form-check-label" aria-label={`前往 ${categoryName} 詳細頁`}>
                        <span className="check-txt">{categoryName}</span>
                    </LangLink>
                </div>
            </div>
            <div className="form-check form-switch my-2">
                <GridCol_Toolbar action={prop.actions} internalId={internalId} />
            </div>
        </li>
    );
};
// #endregion

// #region Private
/** 解析 SpecCategory 清單路徑。 */
const resolveSpecCategoryDirUrl = (pathname: string): string =>
{
    const parts = pathname.split("/");
    return parts[parts.length - 1] === "SpecCategory" ? pathname : parts.slice(0, -1).join("/");
};

/** 建立新增用 SpecCategory FormModel。 */
const buildEmptySpecCategoryForm = (progId: PGID): SpecCategoryFormModel =>
{
    return { ProgId: progId, _SpecCategoryDetail: [] };
};

/** 建立 SpecCategory 多語系頁籤。 */
const buildSpecCategoryTabItems = (details: SpecCategoryDetail[]): Record<string, string> =>
{
    return details.reduce<Record<string, string>>((items, detail) =>
    {
        items[buildSpecCategoryLangKey(detail)] = LangLabelMap[detail.Lang as Lang] ?? detail.Lang ?? "Unknown";
        return items;
    }, {});
};

/** 建立 SpecCategory 多語系欄位內容。 */
const buildSpecCategoryTabContent = (
    prop: { theme: IBETheme; showCols: Record<string, string>; },
    details: SpecCategoryDetail[],
    setRootField: ReturnType<typeof useFormModelField<SpecCategoryFormModel>>,
    setDetailField: ReturnType<typeof useSetTableField<SpecCategoryFormModel>>,
): Record<string, React.ReactNode[]> =>
{
    return details.reduce<Record<string, React.ReactNode[]>>((items, detail) =>
    {
        const key = buildSpecCategoryLangKey(detail);
        const rowKeys = { [SpecCategoryDetailFields.RowId]: detail.RowId, [SpecCategoryDetailFields.Lang]: detail.Lang };
        items[key] = buildSpecCategoryFields(prop, key, rowKeys, setRootField, setDetailField);
        return items;
    }, {});
};

/** 建立單一語系的 SpecCategory 欄位。 */
const buildSpecCategoryFields = (
    prop: { theme: IBETheme; showCols: Record<string, string>; },
    key: string,
    rowKeys: Record<string, unknown>,
    setRootField: ReturnType<typeof useFormModelField<SpecCategoryFormModel>>,
    setDetailField: ReturnType<typeof useSetTableField<SpecCategoryFormModel>>,
): React.ReactNode[] =>
{
    return [
        <LibTextBox key={`${key}_CategoryName`} Style={prop.theme.TextBox} DefaultInputDisplay="請輸入" {...setDetailField(SpecCategoryFields._SpecCategoryDetail, SpecCategoryDetailFields.CategoryName, "string", rowKeys)} />,
        <LibCheckBox key={`${key}_ShowColumnItems`} Style={prop.theme.CheckBox} options={prop.showCols} {...setRootField(SpecCategoryFields.ShowColumnItems, "string", "csv")} />,
    ];
};

/** 建立 SpecCategory 語系頁籤識別值。 */
const buildSpecCategoryLangKey = (detail: SpecCategoryDetail): string =>
{
    return LibText.Merge("_", true, detail.CategoryId, detail.RowId, detail.Lang);
};
// #endregion
