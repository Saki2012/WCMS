import {
    Server_ListGridTemplate_Comp,
    type ServerListGridSearchRenderProps,
} from "@/Features/Pages/Server/Scaffold/Content/ListGridTemplate/Server_ListGridTemplate_Comp";
import { Server_SearchBar_Comp } from "@/Features/Pages/Server/Scaffold/SearchBar/Server_SearchBar_Comp";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { Lang } from "@/SysCore/i18n/lang";
import { usePageManagementListGridTemplate } from "./Server_PageManagement_List_Hook";

// #region Public
/** 頁面清單 */
export const PageListComp = (prop: { title: string; theme: IBETheme; lang: Lang; }) =>
{
    const template = usePageManagementListGridTemplate({ lang: prop.lang });

    return <Server_ListGridTemplate_Comp Title={prop.title} Theme={prop.theme} template={template} buildSearchBarNode={PageManagementSearchBarSection} />;
};
// #endregion

// #region Section
/** 渲染頁面列表搜尋列 */
const PageManagementSearchBarSection = (props: ServerListGridSearchRenderProps) =>
{
    return (
        <Server_SearchBar_Comp
            fields={props.fields}
            submittedValues={props.submittedValues}
            onSubmit={props.onSubmit}
            onReset={props.onReset}
            ariaLabel="頁面列表搜尋"
        />
    );
};
// #endregion
