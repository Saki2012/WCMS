import {
    Server_ListGridTemplate_Comp,
    type ServerListGridSearchRenderProps,
} from "@/Features/Pages/Server/Scaffold/Content/ListGridTemplate/Server_ListGridTemplate_Comp";
import { Server_SearchBar_Comp } from "@/Features/Pages/Server/Scaffold/SearchBar/Server_SearchBar_Comp";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ReactNode } from "react";
import { type SpecResearchListRenderers, useSpecResearchListGridTemplate } from "./Server_SpecResearch_List_Hook";

// #region Property
const specResearchListRenderers: SpecResearchListRenderers = {
    renderTagContent: renderSpecResearchTagContent,
};
// #endregion

// #region Public
/** 研究計畫列表 */
export const Server_ResearchProjListComp = (prop: { title: string; theme: IBETheme; lang: Lang; }) =>
{
    const template = useSpecResearchListGridTemplate({ lang: prop.lang, renderers: specResearchListRenderers });

    return <Server_ListGridTemplate_Comp Title={prop.title} Theme={prop.theme} template={template} renderSearchBar={renderSpecResearchSearchBar} />;
};
// #endregion

// #region EntityComp
/** 渲染研究計畫列表搜尋列 */
const renderSpecResearchSearchBar = (props: ServerListGridSearchRenderProps): ReactNode =>
{
    return (
        <Server_SearchBar_Comp
            fields={props.fields}
            submittedValues={props.submittedValues}
            onSubmit={props.onSubmit}
            onReset={props.onReset}
            ariaLabel="研究計畫列表搜尋"
        />
    );
};


/** 渲染標籤欄位內容 */
const renderSpecResearchTagContent = (ids: string | null | undefined, map: Record<string, string>): ReactNode =>
{
    const names = buildSpecResearchTagNames(ids, map);
    if (names.length <= 0) return "";

    return (
        <ul className="m-0 p-0" style={{ listStylePosition: "inside" }}>
            {names.map((name, index) => <li key={`${name}-${index}`} className="m-0 p-0">{name}</li>)}
        </ul>
    );
};


/** 將標籤代碼字串轉成顯示名稱清單 */
const buildSpecResearchTagNames = (ids: string | null | undefined, map: Record<string, string>): string[] =>
{
    return (ids ?? "").split(",").map((item) => item.trim()).filter(Boolean).map((id) => map[id] ?? id);
};
// #endregion
