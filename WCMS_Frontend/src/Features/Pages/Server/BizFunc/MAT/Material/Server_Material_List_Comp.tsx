import {
    Server_ListGridTemplate_Comp,
    type ServerListGridSearchRenderProps,
} from "@/Features/Pages/Server/Scaffold/Content/ListGridTemplate/Server_ListGridTemplate_Comp";
import { Server_SearchBar_Comp } from "@/Features/Pages/Server/Scaffold/SearchBar/Server_SearchBar_Comp";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { Lang } from "@/SysCore/i18n/lang";
import { useMaterialListGridTemplate } from "./Server_Material_List_Hook";

// #region Public
/** 物件列表 */
export const Server_Material_List_Comp = (prop: { title: string; theme: IBETheme; lang: Lang; }) =>
{
    const template = useMaterialListGridTemplate({ lang: prop.lang });

    return <Server_ListGridTemplate_Comp Title={prop.title} Theme={prop.theme} template={template} buildSearchBarNode={MaterialSearchBarSection} />;
};
// #endregion

// #region Section
/** 渲染物件列表搜尋列 */
const MaterialSearchBarSection = (props: ServerListGridSearchRenderProps) =>
{
    return (
        <Server_SearchBar_Comp
            fields={props.fields}
            submittedValues={props.submittedValues}
            onSubmit={props.onSubmit}
            onReset={props.onReset}
            ariaLabel="物件列表搜尋"
        />
    );
};
// #endregion
