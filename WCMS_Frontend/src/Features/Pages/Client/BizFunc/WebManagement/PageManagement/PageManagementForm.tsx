import { useFetchFormData } from "@/SysCore/Utils/API/FetchFormData";
import PageManagementProvider from "@/Features/Hooks/BizFunc/WebManagement/Pagemanagement/PageManagement_Api";
import React from "react";
import { ContentComp } from "@/Features/Pages/Client/Scaffold/ContentViewMode/FormView/FormView_Comp";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import { useResolveInternalIds } from "@/SysCore/Components/File/useResolveInternalIds";
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