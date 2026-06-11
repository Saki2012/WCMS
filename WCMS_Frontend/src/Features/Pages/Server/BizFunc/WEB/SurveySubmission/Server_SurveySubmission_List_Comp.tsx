import {
    Server_ListGridTemplate_Comp,
    type ServerListGridSearchRenderProps,
} from "@/Features/Pages/Server/Scaffold/Content/ListGridTemplate/Server_ListGridTemplate_Comp";
import { Server_SearchBar_Comp } from "@/Features/Pages/Server/Scaffold/SearchBar/Server_SearchBar_Comp";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { Lang } from "@/SysCore/i18n/lang";
import { useSurveySubmissionListGridTemplate } from "./Server_SurveySubmission_List_Hook";

// #region Public
/** 問卷回應列表 */
export const Server_SurveySubmission_List_Comp = (prop: { title: string; theme: IBETheme; lang: Lang; }) =>
{
    const template = useSurveySubmissionListGridTemplate({ lang: prop.lang });

    return <Server_ListGridTemplate_Comp Title={prop.title} Theme={prop.theme} template={template} buildSearchBarNode={SurveySubmissionSearchBarSection} />;
};
// #endregion

// #region Section
/** 渲染問卷回應列表搜尋列 */
const SurveySubmissionSearchBarSection = (props: ServerListGridSearchRenderProps) =>
{
    return (
        <Server_SearchBar_Comp
            fields={props.fields}
            submittedValues={props.submittedValues}
            onSubmit={props.onSubmit}
            onReset={props.onReset}
            ariaLabel="問卷回應列表搜尋"
        />
    );
};
// #endregion
