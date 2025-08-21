import { useFetchFormData } from "../../../../../SysCore/Utils/API/FetchFormData";
import type { components } from "../../../../../types/api";
import PageManagementProvider from "../../../../Server/Layout/BizFunc/WebManagement/PageManagement/PageManagement_Api";
type PageManagementSet = components["schemas"]["PageManagementSet"];
import React from "react";
import { ContentComp } from "../../Scaffold/ContentViewMode/FormView/FormView_Comp";
import type { IFETheme } from "../../Theme/ITheme";

export interface IPageManagementOptions { PageId?: string }
export interface IPageManagementProps {
    lang: string;
    theme?: IFETheme;
    options?: IPageManagementOptions;
}

export const PageManagementFormComp: React.FC<IPageManagementProps> = (props) => {
    const pageData = useFetchFormData(PageManagementProvider(), props.options?.PageId);
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