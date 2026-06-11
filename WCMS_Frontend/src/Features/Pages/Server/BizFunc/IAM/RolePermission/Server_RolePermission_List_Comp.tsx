import {
    Server_ListGridTemplate_Comp,
    type ServerListGridSearchRenderProps,
} from "@/Features/Pages/Server/Scaffold/Content/ListGridTemplate/Server_ListGridTemplate_Comp";
import { Server_SearchBar_Comp } from "@/Features/Pages/Server/Scaffold/SearchBar/Server_SearchBar_Comp";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { DefaultLang, type Lang } from "@/SysCore/i18n/lang";
import { useRolePermissionListGridTemplate } from "./Server_RolePermission_List_Hook";

// #region Public
/** 角色權限列表 */
export const Server_RolePermission_Comp = (prop: { title?: string; theme: IBETheme; lang?: Lang; }) =>
{
    const lang = prop.lang ?? DefaultLang;
    const template = useRolePermissionListGridTemplate({ lang });

    return <Server_ListGridTemplate_Comp Title={prop.title ?? "角色列表"} Theme={prop.theme} template={template} buildSearchBarNode={RolePermissionSearchBarSection} />;
};
// #endregion

// #region Section
/** 渲染角色權限列表搜尋列 */
const RolePermissionSearchBarSection = (props: ServerListGridSearchRenderProps) =>
{
    return (
        <Server_SearchBar_Comp
            fields={props.fields}
            submittedValues={props.submittedValues}
            onSubmit={props.onSubmit}
            onReset={props.onReset}
            ariaLabel="角色權限列表搜尋"
        />
    );
};
// #endregion
