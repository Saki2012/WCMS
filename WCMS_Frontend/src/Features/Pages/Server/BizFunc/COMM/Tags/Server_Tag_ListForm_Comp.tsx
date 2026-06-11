import type { UseActionsResult } from "@/Features/Hooks/Common/useActions";
import { FormListComp } from "@/Features/Pages/Server/Scaffold/Content/FormList_Comp";
import { GridCol_Toolbar } from "@/Features/Pages/Server/Scaffold/Toolbar/Toolbar_Comp";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { LibTabsProp } from "@/SysCore/Components/FormField/FieldComponets/LibTabs_Comp";
import { LibTextBox } from "@/SysCore/Components/FormField/LibFormField";
import { useSetTableField } from "@/SysCore/Components/FormField/useSetTableField";
import { TabContentComp } from "@/SysCore/Components/TabContent/TabContent";
import { type Lang, LangLabelMap, useEnsureLangDetails } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import { LibText } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import { type PGID, TagDataFields, TagDetailFields, TagSetFields } from "@/types/SchemaFields";
import { useMemo } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useTagListFormFetchData } from "./Server_Tag_ListForm_Hook";

// #region Property
type TagSet = components["schemas"]["TagSet_DTO"];
// #endregion

// #region Public
/** Tag 清單 + 表單 */
export const Server_Tag_ListForm_Comp = (prop: { progId: PGID; title: string; theme: IBETheme; lang: Lang; }) =>
{
    const { internalId } = useParams();
    const { pathname } = useLocation();
    let dirUrl = pathname.replace(/\/Tag$/, `/Tag`);
    const pathParts = pathname.split("/");
    if (pathParts[pathParts.length - 1] !== "Tag") dirUrl = location.pathname.split("/").slice(0, -1).join("/");
    const emptyData = useMemo(() => buildEmptyTagSet(prop.progId), [prop.progId]);
    const getData = useTagListFormFetchData({ dirUrl: dirUrl, lang: prop.lang, internalId: internalId ?? "", emptyData, pgId: prop.progId });
    useEnsureLangDetails(getData.rawData.editForm, {
        headerName: TagSetFields.TagData,
        detailName: TagSetFields.TagDetail,
        parentKeys: [TagDataFields.TagId],
        preferFirstLang: prop.lang,
    });
    const tagEditNode = useMemo(() => (getData.rawData.editForm ? <TagEditComp theme={prop.theme} formData={getData.rawData.editForm} /> : null), [
        prop.theme,
        getData.rawData.editForm,
    ]);
    const tagListNode = useMemo(
        () => (getData.rawData.list
            ? <TagListComp theme={prop.theme} tagSets={getData.rawData.list} lang={prop.lang} actions={getData.rawData.actions} />
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
            InputControl={tagEditNode}
            GridItems={tagListNode}
            Actions={getData.rawData.actions}
        />
    );
};
// #endregion

// #region Section
const TagEditComp = (props: { theme: IBETheme; formData: UseFetchFormDataResult<TagSet>; }) =>
{
    const setField = useSetTableField<TagSet>(props.formData);
    const rawDetails = props.formData.data?.TagDetail ?? [];
    const tabInfo: LibTabsProp = {
        Style: props.theme.Tabs,
        item: rawDetails.reduce<Record<string, string>>((tabItems, info) =>
        {
            const langKey = LibText.Merge("_", true, info.TagId, info.RowId, info.Lang);
            tabItems[langKey] = LangLabelMap[info.Lang as Lang] ?? info.Lang ?? "Unknown";
            return tabItems;
        }, {}),
    };
    const tabContent: Record<string, React.ReactNode[]> = rawDetails.reduce<Record<string, React.ReactNode[]>>((compMap, info) =>
    {
        const langKey = LibText.Merge("_", true, info.TagId, info.RowId, info.Lang);
        const rowKeys = { [TagDetailFields.TagId]: info.TagId, [TagDetailFields.RowId]: info.RowId };
        compMap[langKey] = [
            <LibTextBox
                Style={props.theme.TextBox}
                DefaultInputDisplay="請輸入"
                {...setField(TagSetFields.TagDetail, TagDetailFields.TagName, "string", rowKeys)}
            />,
        ];
        return compMap;
    }, {});
    return <TabContentComp tabInfos={tabInfo} components={tabContent}></TabContentComp>;
};

const TagListComp = (prop: { theme: IBETheme; tagSets: TagSet[]; lang: Lang; actions: UseActionsResult; }) =>
{
    const basePath = useLocation().pathname.split("/Tag")[0];
    const dirPath = `${basePath}/Tag`;
    return (
        <ul className="list-group p-0">
            {prop.tagSets.map((item) =>
            {
                const internalId = item.TagData?.InternalId ?? "";
                return (
                    <li className="list-group-item" key={`${item.TagData?.InternalId}-${item.TagDetail?.find(p => p.Lang === prop.lang)?.RowId}`}>
                        <div className="checkboxDIV my-2">
                            <div className="custom-control form-check">
                                <LangLink
                                    to={`${dirPath}/${item.TagData?.InternalId}`}
                                    className="form-check-label"
                                    aria-label={`前往 ${item.TagDetail?.find(p => p.Lang === prop.lang)?.TagName} 詳細頁`}
                                >
                                    <span className="check-txt">{item.TagDetail?.find(p => p.Lang === prop.lang)?.TagName}</span>
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
const buildEmptyTagSet = (progId: string): TagSet => ({ TagData: { ProgId: progId }, TagDetail: [] });
// #endregion
