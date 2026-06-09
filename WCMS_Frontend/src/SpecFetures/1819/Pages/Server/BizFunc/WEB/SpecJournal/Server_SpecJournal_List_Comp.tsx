import {
    Server_ListGridTemplate_Comp,
    type ServerListGridSearchRenderProps,
} from "@/Features/Pages/Server/Scaffold/Content/ListGridTemplate/Server_ListGridTemplate_Comp";
import { Server_SearchBar_Comp } from "@/Features/Pages/Server/Scaffold/SearchBar/Server_SearchBar_Comp";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ReactNode } from "react";
import type { SpecJournalMode } from "./Server_SpecJournal_Form_Hook";
import { type SpecJournalListRenderers, type SpecJournalSet, useSpecJournalListGridTemplate } from "./Server_SpecJournal_List_Hooks";

// #region Property
const authorListStyle = { listStylePosition: "inside" } as const;

const specJournalListRenderers: SpecJournalListRenderers = {
    renderTitleContent: renderSpecJournalTitleContent,
    renderAuthorContent: renderSpecJournalAuthorContent,
};
// #endregion

// #region Public
/** 後台期刊列表 */
export const Server_SpecJournal_List_Comp = (prop: { title: string; theme: IBETheme; lang: Lang; mode: SpecJournalMode; }) =>
{
    const template = useSpecJournalListGridTemplate({ lang: prop.lang, mode: prop.mode, renderers: specJournalListRenderers });

    return <Server_ListGridTemplate_Comp Title={prop.title} Theme={prop.theme} template={template} renderSearchBar={renderSpecJournalSearchBar} />;
};
// #endregion

// #region EntityComp
/** 渲染中英文標題欄位內容 */
const renderSpecJournalTitleContent = (set: SpecJournalSet): ReactNode =>
{
    const title = set.SpecJournal?.Title ?? "";
    const titleEn = set.SpecJournal?.Title_en ?? "";

    return (
        <>
            <p className="mb-0">{title}</p>
            <p className="mb-0">{titleEn}</p>
        </>
    );
};


/** 渲染中英文作者欄位內容 */
const renderSpecJournalAuthorContent = (set: SpecJournalSet): ReactNode =>
{
    return (
        <ul className="m-0 p-0" style={authorListStyle}>
            {set.SpecJournalAuthor?.map((author, index) =>
            {
                return <li key={buildSpecJournalAuthorKey(author, index)} className="m-0 p-0">{formatSpecJournalAuthorName(author)}</li>;
            })}
        </ul>
    );
};


/** 渲染期刊列表搜尋列 */
const renderSpecJournalSearchBar = (props: ServerListGridSearchRenderProps): ReactNode =>
{
    return (
        <Server_SearchBar_Comp
            fields={props.fields}
            submittedValues={props.submittedValues}
            onSubmit={props.onSubmit}
            onReset={props.onReset}
            ariaLabel="期刊列表搜尋"
        />
    );
};


/** 建立作者列表 key */
const buildSpecJournalAuthorKey = (author: NonNullable<SpecJournalSet["SpecJournalAuthor"]>[number], index: number): string =>
{
    return `${author.AuthorName ?? ""}-${author.AuthorName_en ?? ""}-${index}`;
};
// #endregion

// #region Private
/** 格式化作者顯示名稱 */
const formatSpecJournalAuthorName = (author: NonNullable<SpecJournalSet["SpecJournalAuthor"]>[number]): string | undefined =>
{
    if (author.AuthorName && author.AuthorName_en) return `${author.AuthorName} (${author.AuthorName_en})`;
    return author.AuthorName || author.AuthorName_en || "";
};
// #endregion
