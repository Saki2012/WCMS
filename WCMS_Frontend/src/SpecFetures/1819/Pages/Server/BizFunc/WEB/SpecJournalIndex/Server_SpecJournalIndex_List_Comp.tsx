import {
    Server_ListGridTemplate_Comp,
    type ServerListGridSearchRenderProps,
} from "@/Features/Pages/Server/Scaffold/Content/ListGridTemplate/Server_ListGridTemplate_Comp";
import { Server_SearchBar_Comp } from "@/Features/Pages/Server/Scaffold/SearchBar/Server_SearchBar_Comp";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ReactNode } from "react";
import {
    type SpecJournalIndexListRenderers,
    type SpecJournalIndexSet,
    useSpecJournalIndexListGridTemplate,
} from "./Server_SpecJournalIndex_List_Hook";

// #region Property
const volumeIssueListStyle = { listStylePosition: "inside" } as const;
// #endregion

// #region Public
/** 後台期刊目次列表 */
export const Server_SpecJournalIndex_List_Comp = (prop: { title: string; theme: IBETheme; lang: Lang; }) =>
{
    const template = useSpecJournalIndexListGridTemplate({ lang: prop.lang, renderers: specJournalIndexListRenderers });

    return <Server_ListGridTemplate_Comp Title={prop.title} Theme={prop.theme} template={template} buildSearchBarNode={SpecJournalIndexSearchBarSection} />;
};
// #endregion

// #region Section
/** 渲染期刊目次搜尋列 */
const SpecJournalIndexSearchBarSection = (props: ServerListGridSearchRenderProps) =>
{
    return (
        <Server_SearchBar_Comp
            fields={props.fields}
            submittedValues={props.submittedValues}
            onSubmit={props.onSubmit}
            onReset={props.onReset}
            ariaLabel="期刊目次列表搜尋"
        />
    );
};
// #endregion

// #region Protected
/** 渲染卷期欄位內容 */
const buildSpecJournalIndexVolumeIssueContentNode = (set: SpecJournalIndexSet): ReactNode =>
{
    return (
        <ul className="m-0 p-0" style={volumeIssueListStyle}>
            {(set.SpecJournalIndexDetail ?? []).map((item, index) =>
            {
                return <li key={buildSpecJournalIndexDetailKey(item, index)} className="m-0 p-0">{formatSpecJournalIndexDetail(item)}</li>;
            })}
        </ul>
    );
};


/** 建立卷期列表 key */
const buildSpecJournalIndexDetailKey = (detail: NonNullable<SpecJournalIndexSet["SpecJournalIndexDetail"]>[number], index: number): string =>
{
    return `${detail.IndexId ?? ""}-${detail.RowId ?? ""}-${index}`;
};
// #endregion

// #region Private
/** 格式化卷期顯示文字 */
const formatSpecJournalIndexDetail = (detail: NonNullable<SpecJournalIndexSet["SpecJournalIndexDetail"]>[number]): string =>
{
    const volume = detail.Volume ?? "";
    const issue = detail.Issue ?? "";
    const hasValue = Boolean(volume) || Boolean(issue);
    return hasValue ? `${volume}卷${issue}期` : "";
};


/** 建立列表自定義欄位節點產生器 */
const specJournalIndexListRenderers: SpecJournalIndexListRenderers = {
    buildVolumeIssueContentNode: buildSpecJournalIndexVolumeIssueContentNode,
};
// #endregion
