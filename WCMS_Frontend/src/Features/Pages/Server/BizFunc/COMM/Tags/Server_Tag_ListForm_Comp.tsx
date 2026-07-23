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
import { type PGID, TagDataFields, TagDetailFields } from "@/types/SchemaFields";
import { useMemo } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useTagListFormFetchData } from "./Server_Tag_ListForm_Hook";

// #region Property
type TagFormModel = components["schemas"]["TagData"];
// #endregion

// #region Public
/** Tag 清單與表單。 */
export const Server_Tag_ListForm_Comp = (prop: { progId: PGID; title: string; theme: IBETheme; lang: Lang; }) =>
{
    const { internalId } = useParams();
    const { pathname } = useLocation();
    const dirUrl = resolveTagDirUrl(pathname);
    const emptyData = useMemo(() => buildEmptyTagForm(prop.progId), [prop.progId]);
    const getData = useTagListFormFetchData({ dirUrl, lang: prop.lang, internalId: internalId ?? "", emptyData, pgId: prop.progId });
    useEnsureLangDetails(getData.rawData.editForm, {
        detailName: TagDataFields._TagDetail,
        parentKeys: [TagDataFields.TagId],
        preferFirstLang: prop.lang,
    });
    return (
        <FormListComp
            Title={prop.title}
            SubTitle={prop.title}
            Theme={prop.theme}
            isLoading={getData.isLoading}
            ErrorList={getData.errors}
            InputControl={<TagEditComp theme={prop.theme} formData={getData.rawData.editForm} />}
            GridItems={<TagListComp tags={getData.rawData.list} lang={prop.lang} actions={getData.rawData.actions} />}
            Actions={getData.rawData.actions}
        />
    );
};
// #endregion

// #region Section
/** Tag 多語系編輯區。 */
const TagEditComp = (props: { theme: IBETheme; formData: UseFetchFormDataResult<TagFormModel>; }) =>
{
    const setField = useSetTableField<TagFormModel>(props.formData);
    const details = props.formData.data?._TagDetail ?? [];
    const tabInfo: LibTabsProp = { Style: props.theme.Tabs, item: buildTagTabItems(details) };
    const tabContent = buildTagTabContent(props.theme, details, setField);
    return <TabContentComp tabInfos={tabInfo} components={tabContent}></TabContentComp>;
};

/** Tag 清單區。 */
const TagListComp = (prop: { tags: TagFormModel[]; lang: Lang; actions: UseActionsResult; }) =>
{
    const dirPath = `${useLocation().pathname.split("/Tag")[0]}/Tag`;
    return (
        <ul className="list-group p-0">
            {prop.tags.map((item) => <TagListItem key={item.InternalId ?? item.TagId ?? ""} item={item} lang={prop.lang} dirPath={dirPath} actions={prop.actions} />)}
        </ul>
    );
};

/** Tag 清單單筆。 */
const TagListItem = (prop: { item: TagFormModel; lang: Lang; dirPath: string; actions: UseActionsResult; }) =>
{
    const internalId = prop.item.InternalId ?? "";
    const tagName = prop.item._TagDetail?.find(item => item.Lang === prop.lang)?.TagName ?? "";
    return (
        <li className="list-group-item">
            <div className="checkboxDIV my-2">
                <div className="custom-control form-check">
                    <LangLink to={`${prop.dirPath}/${internalId}`} className="form-check-label" aria-label={`前往 ${tagName} 詳細頁`}>
                        <span className="check-txt">{tagName}</span>
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
/** 解析 Tag 列表路徑。 */
const resolveTagDirUrl = (pathname: string): string =>
{
    const parts = pathname.split("/");
    if (parts[parts.length - 1] === "Tag") return pathname;
    return parts.slice(0, -1).join("/");
};

/** 建立新增 Tag FormModel。 */
const buildEmptyTagForm = (progId: string): TagFormModel =>
{
    return { ProgId: progId, _TagDetail: [] };
};

/** 建立 Tag 語系頁籤。 */
const buildTagTabItems = (details: NonNullable<TagFormModel["_TagDetail"]>): Record<string, string> =>
{
    return details.reduce<Record<string, string>>((items, detail) =>
    {
        const key = buildTagLangKey(detail);
        items[key] = LangLabelMap[detail.Lang as Lang] ?? detail.Lang ?? "Unknown";
        return items;
    }, {});
};

/** 建立 Tag 語系欄位內容。 */
const buildTagTabContent = (
    theme: IBETheme,
    details: NonNullable<TagFormModel["_TagDetail"]>,
    setField: ReturnType<typeof useSetTableField<TagFormModel>>,
): Record<string, React.ReactNode[]> =>
{
    return details.reduce<Record<string, React.ReactNode[]>>((items, detail) =>
    {
        const key = buildTagLangKey(detail);
        const rowKeys = { [TagDetailFields.RowId]: detail.RowId, [TagDetailFields.Lang]: detail.Lang };
        items[key] = [<LibTextBox key={`${key}_TagName`} Style={theme.TextBox} DefaultInputDisplay="請輸入" {...setField(TagDataFields._TagDetail, TagDetailFields.TagName, "string", rowKeys)} />];
        return items;
    }, {});
};

/** 建立 Tag 語系頁籤鍵值。 */
const buildTagLangKey = (detail: NonNullable<TagFormModel["_TagDetail"]>[number]): string =>
{
    return LibText.Merge("_", true, detail.TagId, detail.RowId, detail.Lang);
};
// #endregion
