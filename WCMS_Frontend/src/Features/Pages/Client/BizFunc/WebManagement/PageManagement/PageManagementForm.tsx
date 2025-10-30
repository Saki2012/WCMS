import { useFetchFormData } from "@/SysCore/Utils/API/FetchFormData";
import PageManagementProvider from "@/Features/Hooks/BizFunc/WebManagement/Pagemanagement/PageManagement_Api";
import React, { type ReactNode } from "react";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import { useResolveInternalIds } from "@/SysCore/Components/File/useResolveInternalIds";
import parse from 'html-react-parser';
import LoadingErrorHandler from "@/SysCore/Components/LoadingErrorHandler";

export interface IPageManagementOptions { PageId?: string }
export interface IPageManagementProps {
    lang: string;
    theme?: IFETheme;
    options?: IPageManagementOptions;
}

export const PageManagementFormComp: React.FC<IPageManagementProps> = (props) => {
    const pageData = useFetchFormData(PageManagementProvider(), props.options?.PageId);
    const detail = pageData.data?.PageManagementDetail?.find(d => (d.Lang ?? "").toLowerCase() === 'zh-tw'.toLowerCase())
    const parseContent = useResolveInternalIds(detail?.Content ?? "", { locale: props.lang });
    const content = parseContent.html ? parse(parseContent.html) : null;
    const isLoading = [pageData.isLoading];
    const errors = [pageData.error]
    return (
        <ContentComp Theme={props.theme} LoadingList={isLoading} ErrorList={errors}
            Title={detail?.Title ?? ""}
            Content={content}
        />
    );
};

interface ContentCompProp {
    Theme?: IFETheme;
    LoadingList: boolean[];
    ErrorList: (string | null | undefined)[];
    Title: string;
    StartDate?: string;
    Category?: string[];
    Tag?: string[];
    Content?: ReactNode;
    Href?: string;
    Files?: any[];
}


const ContentComp = (prop: ContentCompProp) => {
    return (
        <>
            <LoadingErrorHandler loadingList={prop.LoadingList} errorList={prop.ErrorList} >
                <Content {...prop}></Content>
            </LoadingErrorHandler>
        </>
    );
}


const Content = (prop: ContentCompProp) => {
    return (<>
        <div className="page-header mb-3">
            <h3>{prop.Title}</h3>
            {prop.StartDate && (<><i className="fa fa-calendar"></i>{` ${prop.StartDate?.toString()}`}</>)}
            {prop.Category && prop.Category.length > 0 && (
                <><i className="fa fa-tags ml-3"></i>{` ${prop.Category.join('、')}`}</>
            )}
            {prop.Tag && prop.Tag.length > 0 && (
                <><i className="fa fa-bookmark ml-3"></i>{` ${prop.Tag.join('、')}`}</>
            )}
        </div>
        <div className="dotted_line"></div>
        {prop.Content}
        <hr />

        {((prop.Href && prop.Href.length > 0) || (prop.Files && prop.Files.length > 0)) &&
            <ul className="list-group">
                {prop.Href && prop.Href.length > 0 && (
                    <li>
                        <a href={prop.Href} target="_blank" rel="noopener noreferrer" className="btn btn-default">
                            <i className="fa fa-link"></i> {prop.Href}
                        </a>
                    </li>
                )}
                {prop.Files && prop.Files.length > 0 && (
                    <>
                        {prop.Files.map((file: any, idx: number) => (
                            <li key={idx}>
                                <a
                                    href={file.url ?? ""}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-default"
                                    tabIndex={1}
                                    title={`${file.name}(另開新視窗)`}
                                >
                                    <i className="fa fa-paperclip"></i> {file.name}
                                </a>
                            </li>
                        ))}
                    </>
                )}
            </ul>
        }
    </>
    )
}