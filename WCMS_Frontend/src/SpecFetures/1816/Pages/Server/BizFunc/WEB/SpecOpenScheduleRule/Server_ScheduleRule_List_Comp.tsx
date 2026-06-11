import {
    Server_ListGridTemplate_Comp,
    type ServerListGridSearchRenderProps,
} from "@/Features/Pages/Server/Scaffold/Content/ListGridTemplate/Server_ListGridTemplate_Comp";
import { Server_SearchBar_Comp } from "@/Features/Pages/Server/Scaffold/SearchBar/Server_SearchBar_Comp";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { useScheduleRuleListGridTemplate } from "./Server_ScheduleRule_List_Hook";

// #region Public
/** 學年度開放規則列表 */
export const Server_ScheduleRule_List_Comp = (prop: { title: string; theme: IBETheme; }) =>
{
    const template = useScheduleRuleListGridTemplate();

    return <Server_ListGridTemplate_Comp Title={prop.title} Theme={prop.theme} template={template} buildSearchBarNode={ScheduleRuleSearchBarSection} />;
};
// #endregion

// #region Section
/** 渲染開放規則列表搜尋列 */
const ScheduleRuleSearchBarSection = (props: ServerListGridSearchRenderProps) =>
{
    return (
        <Server_SearchBar_Comp
            fields={props.fields}
            submittedValues={props.submittedValues}
            onSubmit={props.onSubmit}
            onReset={props.onReset}
            ariaLabel="開館時間規則設定"
        />
    );
};
// #endregion
