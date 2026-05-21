import {
    Server_ListGridTemplate_Comp,
    type ServerListGridSearchRenderProps,
} from "@/Features/Pages/Server/Scaffold/Content/ListGridTemplate/Server_ListGridTemplate_Comp";
import { Server_SearchBar_Comp } from "@/Features/Pages/Server/Scaffold/SearchBar/Server_SearchBar_Comp";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ReactNode } from "react";
import { useGalleryListGridTemplate } from "./Server_Gallery_List_Hook";

/** 相簿列表 */
export const Server_GalleryListComp = (prop: { title: string; theme: IBETheme; lang: Lang; }) =>
{
    const template = useGalleryListGridTemplate({ lang: prop.lang });

    return <Server_ListGridTemplate_Comp Title={prop.title} Theme={prop.theme} template={template} renderSearchBar={renderGallerySearchBar} />;
};

/** 渲染相簿列表搜尋列 */
const renderGallerySearchBar = (props: ServerListGridSearchRenderProps): ReactNode =>
{
    return (
        <Server_SearchBar_Comp
            fields={props.fields}
            submittedValues={props.submittedValues}
            onSubmit={props.onSubmit}
            onReset={props.onReset}
            ariaLabel="相簿列表搜尋"
        />
    );
};
