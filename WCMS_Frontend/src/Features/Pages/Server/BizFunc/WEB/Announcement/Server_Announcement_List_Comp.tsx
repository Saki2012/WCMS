import {
    Server_ListGridTemplate_Comp,
    type ServerListGridSearchRenderProps,
} from "@/Features/Pages/Server/Scaffold/Content/ListGridTemplate/Server_ListGridTemplate_Comp";
import { Server_SearchBar_Comp } from "@/Features/Pages/Server/Scaffold/SearchBar/Server_SearchBar_Comp";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ReactNode } from "react";
import { useAnnouncementListGridTemplate } from "./Server_Announcement_List_Hook";

// #region Public
/** 公告列表 */
export const Server_AnnouncementListComp = (prop: { title: string; theme: IBETheme; lang: Lang; }) =>
{
    const template = useAnnouncementListGridTemplate({ lang: prop.lang });

    return <Server_ListGridTemplate_Comp Title={prop.title} Theme={prop.theme} template={template} renderSearchBar={renderAnnouncementSearchBar} />;
};
// #endregion

// #region EntityComp
/** 渲染公告列表搜尋列 */
const renderAnnouncementSearchBar = (props: ServerListGridSearchRenderProps): ReactNode =>
{
    return (
        <Server_SearchBar_Comp
            fields={props.fields}
            submittedValues={props.submittedValues}
            onSubmit={props.onSubmit}
            onReset={props.onReset}
            ariaLabel="公告列表搜尋"
        />
    );
};
// #endregion
