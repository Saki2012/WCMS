import {
    Server_ListGridTemplate_Comp,
    type ServerListGridSearchRenderProps,
} from "@/Features/Pages/Server/Scaffold/Content/ListGridTemplate/Server_ListGridTemplate_Comp";
import { Server_SearchBar_Comp } from "@/Features/Pages/Server/Scaffold/SearchBar/Server_SearchBar_Comp";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ReactNode } from "react";
import { useTimelineListGridTemplate } from "./Server_Timeline_List_Hook";

/** 紀事表列表 */
export const Server_Timeline_List_Comp = (prop: { title: string; theme: IBETheme; lang: Lang; }) =>
{
    const template = useTimelineListGridTemplate({ lang: prop.lang });

    return <Server_ListGridTemplate_Comp Title={prop.title} Theme={prop.theme} template={template} renderSearchBar={renderTimelineSearchBar} />;
};

/** 渲染紀事表列表搜尋列 */
const renderTimelineSearchBar = (props: ServerListGridSearchRenderProps): ReactNode =>
{
    return (
        <Server_SearchBar_Comp
            fields={props.fields}
            submittedValues={props.submittedValues}
            onSubmit={props.onSubmit}
            onReset={props.onReset}
            ariaLabel="紀事表列表搜尋"
        />
    );
};
