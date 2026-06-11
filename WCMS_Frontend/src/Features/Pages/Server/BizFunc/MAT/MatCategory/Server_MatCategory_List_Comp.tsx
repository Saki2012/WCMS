import {
    Server_ListGridTemplate_Comp,
    type ServerListGridSearchRenderProps,
} from "@/Features/Pages/Server/Scaffold/Content/ListGridTemplate/Server_ListGridTemplate_Comp";
import { Server_SearchBar_Comp } from "@/Features/Pages/Server/Scaffold/SearchBar/Server_SearchBar_Comp";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ReactNode } from "react";
import {
    type MatCategoryListRenderers,
    type MatCategorySet,
    useMatCategoryListGridTemplate,
} from "./Server_MatCategory_List_Hook";

// #region Public
/** 物件類別列表 */
export const Server_MatCategory_List_Comp = (prop: { title: string; theme: IBETheme; lang: Lang; }) =>
{
    const template = useMatCategoryListGridTemplate({ lang: prop.lang, renderers: matCategoryListRenderers });

    return <Server_ListGridTemplate_Comp Title={prop.title} Theme={prop.theme} template={template} buildSearchBarNode={MatCategorySearchBarSection} />;
};
// #endregion

// #region Section
/** 渲染物件類別列表搜尋列 */
const MatCategorySearchBarSection = (props: ServerListGridSearchRenderProps) =>
{
    return (
        <Server_SearchBar_Comp
            fields={props.fields}
            submittedValues={props.submittedValues}
            onSubmit={props.onSubmit}
            onReset={props.onReset}
            ariaLabel="物件類別列表搜尋"
        />
    );
};
// #endregion

// #region Protected
/** 渲染自定義欄位資訊 */
const buildMatCategoryInfoFieldContentNode = (set: MatCategorySet, lang: Lang): ReactNode =>
{
    const items = (set.MatCategoryInfoFieldDisplay ?? []).filter((item) => item?.Lang === lang && Boolean(item.FieldDisplayName));
    if (items.length <= 0) return "";

    return (
        <ul className="m-0 p-0" style={{ listStylePosition: "inside" }}>
            {items.map((item, index) => <li key={`${item.FieldDisplayName ?? "field"}-${index}`} className="m-0 p-0">{item.FieldDisplayName}</li>)}
        </ul>
    );
};
// #endregion

// #region Private
/** 建立列表自定義欄位節點產生器 */
const matCategoryListRenderers: MatCategoryListRenderers = {
    buildInfoFieldContentNode: buildMatCategoryInfoFieldContentNode,
};
// #endregion
