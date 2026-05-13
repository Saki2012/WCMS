import { type IPageManagementOptions, usePageManagementFormFetchData } from "@/Features/Pages/Client/BizFunc/WEB/PageManagement/PageManagementForm_Loader";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import { CmsHtml_Comp } from "@/SysCore/Components/CmsHtml/CmsHtml_Comp";
import LoadingErrorHandler from "@/SysCore/Components/LoadingErrorHandler";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";
import type { ReactNode } from "react";

export interface IPageManagementProps
{
    lang: Lang;
    theme?: IFETheme;
    options?: IPageManagementOptions;
}

const PageManagementFormComp = (props: IPageManagementProps) =>
{
    const pageId = `${props.options?.PageId ?? ""}`.trim();
    const formData = usePageManagementFormFetchData({ lang: props.lang, pageId });
    const content = <CmsHtml_Comp html={formData.contentHtml} lang={props.lang} />;

    return <ContentComp Theme={props.theme} isLoading={formData.isLoading} ErrorList={formData.errorList} Title={formData.title} Content={content} />;
};

export default PageManagementFormComp;

interface ContentCompProp
{
    Theme?: IFETheme;
    isLoading: boolean;
    ErrorList: (string | null | undefined)[];
    Title: string;
    StartDate?: string;
    Category?: string[];
    Tag?: string[];
    Content?: ReactNode;
    Href?: string;
    Files?: FileLinkItem[];
}

interface FileLinkItem
{
    url?: string;
    name?: string;
}

const ContentComp = (prop: ContentCompProp) =>
{
    return (
        <>
            <LoadingErrorHandler isLoading={prop.isLoading} errorList={prop.ErrorList}>
                <Content {...prop}></Content>
            </LoadingErrorHandler>
        </>
    );
};

const Content = (prop: ContentCompProp) =>
{
    return (
        <>
            <div className="page-header mb-3">
                <h3>{prop.Title}</h3>
                {prop.StartDate && (
                    <>
                        <i className="fa fa-calendar"></i>
                        {` ${prop.StartDate?.toString()}`}
                    </>
                )}
                {prop.Category && prop.Category.length > 0 && (
                    <>
                        <i className="fa fa-tags ml-3"></i>
                        {` ${prop.Category.join("、")}`}
                    </>
                )}
                {prop.Tag && prop.Tag.length > 0 && (
                    <>
                        <i className="fa fa-bookmark ml-3"></i>
                        {` ${prop.Tag.join("、")}`}
                    </>
                )}
            </div>
            <div className="dotted_line"></div>
            {prop.Content}
            <hr />

            {((prop.Href && prop.Href.length > 0) || (prop.Files && prop.Files.length > 0)) && (
                <ul className="list-group">
                    {prop.Href && prop.Href.length > 0 && (
                        <li>
                            <LangLink to={prop.Href} title={prop.Href} target="_blank" className="btn btn-default">
                                <i className="fa fa-link" aria-hidden="true"></i> {prop.Href}
                            </LangLink>
                        </li>
                    )}
                    {prop.Files && prop.Files.length > 0 && (
                        <>
                            {prop.Files.map((file, idx) => (
                                <li key={idx}>
                                    <a
                                        href={file.url ?? ""}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-default"
                                        tabIndex={1}
                                        title={`${file.name ?? ""}(另開新視窗)`}
                                    >
                                        <i className="fa fa-paperclip" aria-hidden="true"></i> {file.name}
                                    </a>
                                </li>
                            ))}
                        </>
                    )}
                </ul>
            )}
        </>
    );
};
