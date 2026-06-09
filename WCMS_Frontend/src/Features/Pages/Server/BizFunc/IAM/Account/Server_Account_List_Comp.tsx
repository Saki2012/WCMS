import {
    Server_ListGridTemplate_Comp,
    type ServerListGridSearchRenderProps,
} from "@/Features/Pages/Server/Scaffold/Content/ListGridTemplate/Server_ListGridTemplate_Comp";
import { Server_SearchBar_Comp } from "@/Features/Pages/Server/Scaffold/SearchBar/Server_SearchBar_Comp";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { DefaultLang, type Lang } from "@/SysCore/i18n/lang";
import type { ReactNode } from "react";
import { useAccountListGridTemplate } from "./Server_Account_List_Hook";

// #region Public
/** 帳號列表 */
export const Server_Account_List_Comp = (prop: { title?: string; theme: IBETheme; lang?: Lang; }) =>
{
    const lang = prop.lang ?? DefaultLang;
    const template = useAccountListGridTemplate({ lang });

    return <Server_ListGridTemplate_Comp Title={prop.title ?? "帳號列表"} Theme={prop.theme} template={template} renderSearchBar={renderAccountSearchBar} />;
};
// #endregion

// #region EntityComp
/** 渲染帳號列表搜尋列 */
const renderAccountSearchBar = (props: ServerListGridSearchRenderProps): ReactNode =>
{
    return (
        <Server_SearchBar_Comp
            fields={props.fields}
            submittedValues={props.submittedValues}
            onSubmit={props.onSubmit}
            onReset={props.onReset}
            ariaLabel="帳號列表搜尋"
        />
    );
};
// #endregion
