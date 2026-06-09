import {
    Server_ListGridTemplate_Comp,
    type ServerListGridSearchRenderProps,
} from "@/Features/Pages/Server/Scaffold/Content/ListGridTemplate/Server_ListGridTemplate_Comp";
import { Server_SearchBar_Comp } from "@/Features/Pages/Server/Scaffold/SearchBar/Server_SearchBar_Comp";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { DefaultLang, type Lang } from "@/SysCore/i18n/lang";
import type { ReactNode } from "react";
import { usePersonListGridTemplate } from "./Server_Person_List_Hook";

// #region Public
/** 人員列表 */
export const Server_Person_List_Comp = (prop: { title?: string; theme: IBETheme; lang?: Lang; }) =>
{
    const lang = prop.lang ?? DefaultLang;
    const template = usePersonListGridTemplate({ lang });

    return <Server_ListGridTemplate_Comp Title={prop.title ?? "人員列表"} Theme={prop.theme} template={template} renderSearchBar={renderPersonSearchBar} />;
};
// #endregion

// #region EntityComp
/** 渲染人員列表搜尋列 */
const renderPersonSearchBar = (props: ServerListGridSearchRenderProps): ReactNode =>
{
    return (
        <Server_SearchBar_Comp
            fields={props.fields}
            submittedValues={props.submittedValues}
            onSubmit={props.onSubmit}
            onReset={props.onReset}
            ariaLabel="人員列表搜尋"
        />
    );
};
// #endregion
