import { useFetchFormData } from "../../../../../SysCore/Utils/API/FetchFormData";
import type { components } from "../../../../../types/api";
import PageManagementProvider from "../../../../Server/Layout/BizFunc/WebManagement/PageManagement/PageManagement_Api";
type PageManagementSet = components["schemas"]["PageManagementSet"];
import type { INormNode } from "../../../Site-Routing";
import React from "react";
import { ContentComp } from "../../Scaffold/ContentViewMode/FormView/FormView_Comp";
import type { IFETheme } from "../../Theme/ITheme";

export interface IPageManagementOptions { pageId?: string }
export interface IPageManagementProps {
    lang: string;
    theme?: IFETheme;
    node: INormNode;
    siteIndex: string;
    options?: IPageManagementOptions;
}

export const PageManagementComp: React.FC<IPageManagementProps> = (props) => {
    const pageData = useFetchFormData(PageManagementProvider(), props.options?.pageId);
    const detail = pageData.data?.PageManagementDetail?.find(d => (d.Lang ?? "").toLowerCase() === props.lang.toLowerCase())
    const isLoading = [pageData.isLoading];
    const errors = [pageData.error]

    return (
        <ContentComp Theme={props.theme} LoadingList={isLoading} ErrorList={errors}
            Title={detail?.Title ?? ""}
            Content={detail?.Content}
        />
    );
};