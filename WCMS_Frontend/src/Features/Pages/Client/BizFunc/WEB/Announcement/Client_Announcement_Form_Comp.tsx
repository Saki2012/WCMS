import type { TryCountDetailViewRequest } from "@/Features/Hooks/BizFunc/WEB/SiteViewCount_Api";
import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import ModuleContent, { type ModuleViewCountConfig, type SubTitleProps } from "@/Features/Pages/Client/Scaffold/SubPages/Layouts/RightFrame/ModuleContent";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import { CmsHtml_Comp } from "@/SysCore/Components/CmsHtml/CmsHtml_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { formatDate, LibText } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import { useMemo } from "react";
import { useParams } from "react-router";
import { useAnnouncementFormData } from "./Client_Announcement_Form_Loader";

// #region Property
type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"];
const emptyData: AnnouncementSet = { Announcement: {}, AnnouncementDetail: [], AnnouncementDetailFile: [] };
export interface IAnnouncementFormProps
{
    site: INormSite;
    node: INormNode;
    theme: IFETheme;
    lang: Lang;
}
// #endregion

// #region Public
export const Client_Announcement_Form = (props: IAnnouncementFormProps) =>
{
    const { internalId } = useParams();
    const safeInternalId = LibText.safeTrim(internalId);
    const vm = useAnnouncementFormData({ lang: props.lang, internalId: safeInternalId, emptyData });
    const formData = vm.formData;
    const categoryNameText = vm.categoryNameText;
    const tagNameText = vm.tagNameText;
    const detail = useMemo(() => formData.AnnouncementDetail?.find(p => (p.Lang ?? "").toLowerCase() === props.lang), [
        formData.AnnouncementDetail,
        props.lang,
    ]);
    const startDate = useMemo(() => formatDate(formData.Announcement?.Validate_Start), [formData.Announcement?.Validate_Start]);
    const subTitle = useMemo<SubTitleProps>(() => ({ cat: categoryNameText, tag: tagNameText, date: startDate }), [categoryNameText, tagNameText, startDate]);
    const viewCountConfig = useMemo<ModuleViewCountConfig>(() =>
    {
        const request: TryCountDetailViewRequest = { SiteIndex: props.site.siteIndex, ProgId: PGID.Announcement, InternalId: safeInternalId };
        return { mode: "form", contentKey: safeInternalId, request };
    }, [props.site.siteIndex, safeInternalId]);
    return (
        <ModuleContent
            nodeTitle={props.node.title}
            title={detail?.Title ?? ""}
            subTitle={subTitle}
            isLoading={vm.isLoading}
            errorList={vm.errorList}
            viewCountConfig={viewCountConfig}
        >
            <Content lang={props.lang} data={formData} />
        </ModuleContent>
    );
};
// #endregion

// #region Private
const Content = (props: { lang: Lang; data: AnnouncementSet; }) =>
{
    const detail = props.data.AnnouncementDetail?.find(p => (p.Lang ?? "").toLowerCase() === props.lang);
    const fileDetail = props.data.AnnouncementDetailFile?.filter(p => p.AnnouncementId === detail?.AnnouncementId && p.ParentRowId === detail?.RowId);
    const url = detail?.Url;
    return (
        <>
            <CmsHtml_Comp html={detail?.Content ?? ""} lang={props.lang} />
            {url && fileDetail && fileDetail.length > 0 && <hr className="hr-my-4" />}
            {url && (
                <>
                    <div className="row">
                        <div className="col-xl-6 col-lg-6 col-md-6 col-sm-12 col-12">
                            <div className="Standard_btnDiv">
                                <LangLink to={url} className="btn btn_NEWS bg_urllink_NEWS" role="button" title={detail?.UrlDescription ?? ""}>
                                    <span>
                                        <i className="fas fa-link + link + ml-0 mr-2"></i>
                                        <span className="sr-only">{detail?.UrlDescription ?? ""}</span>
                                    </span>
                                    <span className="URL_link_NEWS">{detail?.UrlDescription ?? ""}</span>
                                </LangLink>
                            </div>
                        </div>
                    </div>
                    <hr className="hr-my-4" />
                </>
            )}
            {fileDetail && fileDetail.length > 0 && (
                <>
                    <div className="row">
                        {fileDetail.map(item =>
                        {
                            const downloadUrl = FileManagementAPI.get_Public_Download_Url(item.FileId, item.FileName);
                            return (
                                <div key={`${item.FileId ?? ""}`} className="col-xl-6 col-lg-6 col-md-6 col-sm-12 col-12">
                                    <div className="Standard_btnDiv">
                                        <LangLink to={downloadUrl} className="btn btn_NEWS bg_urllink_NEWS" role="button" title={item.FileName ?? ""}>
                                            <span>
                                                <i className="fas fa-paperclip + link + ml-0 mr-2"></i>
                                                <span className="sr-only">{item.FileName}</span>
                                            </span>
                                            <span className="URL_link_NEWS">{item.FileName}</span>
                                        </LangLink>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <hr className="hr-my-4" />
                </>
            )}
        </>
    );
};
// #endregion
