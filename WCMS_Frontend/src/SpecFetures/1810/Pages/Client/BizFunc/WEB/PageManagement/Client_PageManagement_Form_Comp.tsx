import type { PageManagementFormViewProps } from "@/Features/Pages/Client/BizFunc/WEB/PageManagement/Client_PageManagement_Form_Comp";
import { CmsHtml_Comp } from "@/SysCore/Components/CmsHtml/CmsHtml_Comp";
import { LoadingErrorHandler } from "@/SysCore/Components/LoadingErrorHandler";
import { LangLink } from "@/SysCore/i18n/LangLink";
import type { ReactNode } from "react";

// #region Property
interface ContentCompProp
{
    /** 是否載入中 */
    isLoading: boolean;

    /** 錯誤訊息 */
    errorList: string[];

    /** 標題文字 */
    title: string;

    /** 公告日期 */
    startDate?: string;

    /** 分類文字 */
    category?: string[];

    /** 標籤文字 */
    tag?: string[];

    /** 內文區塊 */
    content?: ReactNode;

    /** 外部連結 */
    href?: string;

    /** 檔案清單 */
    files?: FileLinkItem[];
}

interface FileLinkItem
{
    /** 檔案網址 */
    url?: string;

    /** 檔案名稱 */
    name?: string;
}
// #endregion

// #region Public
/** 1810 單頁內容 Form DOM，Feature Entry 會在最後透過 SlotResolver 解析到這裡。 */
export const Client_PageManagement_Form = (props: PageManagementFormViewProps) =>
{
    const content = <CmsHtml_Comp html={props.contentHtml} lang={props.lang} />;

    return <ContentComp isLoading={props.isLoading} errorList={props.errorList} title={props.title} content={content} />;
};
// #endregion

// #region Section
/** 包裝載入與錯誤處理，避免 View 主體混入狀態判斷。 */
const ContentComp = (prop: ContentCompProp) =>
{
    return (
        <LoadingErrorHandler isLoading={prop.isLoading} errorList={prop.errorList}>
            <Content {...prop} />
        </LoadingErrorHandler>
    );
};
// #endregion

// #region Private
/** 1810 單頁內容 DOM。 */
const Content = (prop: ContentCompProp) =>
{
    return (
        <>
            <div className="page-header mb-3">
                <h3>{prop.title}</h3>
                <MetaText iconClass="fa fa-calendar" text={prop.startDate} />
                <MetaList iconClass="fa fa-tags ml-3" items={prop.category} />
                <MetaList iconClass="fa fa-bookmark ml-3" items={prop.tag} />
            </div>
            <div className="dotted_line"></div>
            {prop.content}
            <hr />
            <LinkList href={prop.href} files={prop.files} />
        </>
    );
};

/** 顯示單一 meta 文字。 */
const MetaText = (prop: { iconClass: string; text?: string; }) =>
{
    if (!prop.text) return null;

    return (
        <>
            <i className={prop.iconClass}></i>
            {` ${prop.text}`}
        </>
    );
};

/** 顯示多筆 meta 文字。 */
const MetaList = (prop: { iconClass: string; items?: string[]; }) =>
{
    if (!prop.items || prop.items.length === 0) return null;

    return <MetaText iconClass={prop.iconClass} text={prop.items.join("、")} />;
};

/** 顯示外部連結與附件清單。 */
const LinkList = (prop: { href?: string; files?: FileLinkItem[]; }) =>
{
    if (!hasLinkContent(prop)) return null;

    return (
        <ul className="list-group">
            <ExternalLink href={prop.href} />
            {prop.files?.map((file, idx) => <FileLink key={`${file.url ?? ""}-${idx}`} file={file} />)}
        </ul>
    );
};

/** 顯示外部連結。 */
const ExternalLink = (prop: { href?: string; }) =>
{
    if (!prop.href) return null;

    return (
        <li>
            <LangLink to={prop.href} title={prop.href} target="_blank" className="btn btn-default">
                <i className="fa fa-link" aria-hidden="true"></i> {prop.href}
            </LangLink>
        </li>
    );
};

/** 顯示單一附件。 */
const FileLink = (prop: { file: FileLinkItem; }) =>
{
    return (
        <li>
            <a href={prop.file.url ?? ""} target="_blank" rel="noopener noreferrer" className="btn btn-default" title={`${prop.file.name ?? ""}(另開新視窗)`}>
                <i className="fa fa-paperclip" aria-hidden="true"></i> {prop.file.name}
            </a>
        </li>
    );
};

/** 判斷是否有連結或附件需要顯示。 */
const hasLinkContent = (prop: { href?: string; files?: FileLinkItem[]; }): boolean =>
{
    return Boolean(prop.href) || Boolean(prop.files && prop.files.length > 0);
};
// #endregion
