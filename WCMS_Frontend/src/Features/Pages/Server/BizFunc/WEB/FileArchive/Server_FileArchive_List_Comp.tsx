import {
    Server_ListGridTemplate_Comp,
    type ServerListGridSearchRenderProps,
} from "@/Features/Pages/Server/Scaffold/Content/ListGridTemplate/Server_ListGridTemplate_Comp";
import { Server_SearchBar_Comp } from "@/Features/Pages/Server/Scaffold/SearchBar/Server_SearchBar_Comp";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ReactNode } from "react";
import { useFileArchiveListGridTemplate } from "./Server_FileArchive_List_Hook";

// #region Public
/** 檔案室列表 */
export const Server_FileArchiveListComp = (prop: { title: string; theme: IBETheme; lang: Lang; }) =>
{
    const template = useFileArchiveListGridTemplate({ lang: prop.lang });

    return <Server_ListGridTemplate_Comp Title={prop.title} Theme={prop.theme} template={template} renderSearchBar={renderFileArchiveSearchBar} />;
};
// #endregion

// #region EntityComp
/** 渲染檔案室列表搜尋列 */
const renderFileArchiveSearchBar = (props: ServerListGridSearchRenderProps): ReactNode =>
{
    return (
        <Server_SearchBar_Comp
            fields={props.fields}
            submittedValues={props.submittedValues}
            onSubmit={props.onSubmit}
            onReset={props.onReset}
            ariaLabel="檔案室列表搜尋"
        />
    );
};
// #endregion
