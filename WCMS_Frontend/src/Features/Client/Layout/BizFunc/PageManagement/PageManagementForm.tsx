import { useFetchFormData } from "../../../../../SysCore/Utils/API/FetchFormData";
import type { components } from "../../../../../types/api";
import PageManagementProvider from "../../../../Server/Layout/BizFunc/WebManagement/PageManagement/PageManagement_Api";
type PageManagementSet = components["schemas"]["PageManagementSet"];
import React, { useMemo } from "react";
import { ContentComp } from "../../Scaffold/ContentViewMode/FormView/FormView_Comp";
import type { IFETheme } from "../../Theme/ITheme";
import { useResolveInternalIds } from "../../../../../SysCore/Components/File/useResolveInternalIds";
import DOMPurify from "dompurify";
import parse from 'html-react-parser';

export interface IPageManagementOptions { PageId?: string }
export interface IPageManagementProps {
    lang: string;
    theme?: IFETheme;
    options?: IPageManagementOptions;
}

export const PageManagementFormComp: React.FC<IPageManagementProps> = (props) => {
    const pageData = useFetchFormData(PageManagementProvider(), props.options?.PageId);
    const detail = pageData.data?.PageManagementDetail?.find(d => (d.Lang ?? "").toLowerCase() === 'zh-tw'.toLowerCase())
    // const detail = pageData.data?.PageManagementDetail?.find(d => (d.Lang ?? "").toLowerCase() === props.lang.toLowerCase())

    const parseContent = useResolveInternalIds(detail?.Content ?? "", { locale: props.lang });

    const safeHtml = useMemo(() => DOMPurify.sanitize(parseContent.html ?? ''), [parseContent.html])
    const content = safeHtml ? parse(safeHtml) : null;



    const isLoading = [pageData.isLoading];
    const errors = [pageData.error]

    return (
        <ContentComp Theme={props.theme} LoadingList={isLoading} ErrorList={errors}
            Title={detail?.Title ?? ""}
            Content={content}
        />
    );
};