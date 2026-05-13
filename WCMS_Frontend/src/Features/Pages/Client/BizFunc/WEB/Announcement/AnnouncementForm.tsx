import type { TryCountDetailViewRequest } from "@/Features/Hooks/BizFunc/WEB/SiteViewCount_Api";
import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import ModuleContent, { type ModuleViewCountConfig, type SubTitleProps } from "@/Features/Pages/Client/Scaffold/SubPages/Layouts/RightFrame/ModuleContent";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import { CmsHtml_Comp } from "@/SysCore/Components/CmsHtml/CmsHtml_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { FormatDate } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import { useMemo } from "react";
import { useParams } from "react-router";
import { useAnnouncementFormFetchData } from "./AnnouncementForm_Loader";

type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"];

const emptyData: AnnouncementSet = { Announcement: {}, AnnouncementDetail: [] };

export interface IAnnouncementFormProps
{
    site: INormSite;
    node: INormNode;
    theme: IFETheme;
    lang: Lang;
}

const AnnouncementForm = (props: IAnnouncementFormProps) =>
{
    // 宣告變數
    const { internalId } = useParams();
    const safeInternalId = `${internalId ?? ""}`.trim();

    // 執行 function：統一由 loader.ts 提供 form 需要的資料
    const getData = useAnnouncementFormFetchData({ lang: props.lang, internalId: safeInternalId, emptyData });
    const formData = getData.rawData.formData;
    const categoryNameText = getData.rawData.categoryNameText;
    const tagNameText = getData.rawData.tagNameText;
    const detail = useMemo(() => formData.AnnouncementDetail?.find(p => (p.Lang ?? "").toLowerCase() === props.lang), [
        formData.AnnouncementDetail,
        props.lang,
    ]);
    const startDate = useMemo(() =>
    {
        return FormatDate(formData.Announcement?.Validate_Start);
    }, [formData.Announcement?.Validate_Start]);

    const subTitle = useMemo<SubTitleProps>(() =>
    {
        return { cat: categoryNameText, tag: tagNameText, date: startDate };
    }, [categoryNameText, tagNameText, startDate]);

    const viewCountConfig = useMemo<ModuleViewCountConfig>(() =>
    {
        const request: TryCountDetailViewRequest = { SiteIndex: props.site.siteIndex, ProgId: PGID.Announcement, InternalId: safeInternalId };
        return { mode: "form", contentKey: safeInternalId, request };
    }, [props.site.siteIndex, safeInternalId]);

    // return
    return (
        <ModuleContent
            nodeTitle={props.node.title}
            title={detail?.Title ?? ""}
            subTitle={subTitle}
            isLoading={getData.isLoading}
            errorList={getData.errors}
            viewCountConfig={viewCountConfig}
        >
            <Content lang={props.lang} data={formData} />
        </ModuleContent>
    );
};

export default AnnouncementForm;

const Content = (props: { lang: Lang; data: AnnouncementSet; }) =>
{
    // 宣告變數
    const detail = props.data.AnnouncementDetail?.find(p => (p.Lang ?? "").toLowerCase() === props.lang);
    const fileDetail = props.data.AnnouncementDetailFile?.filter(p => p.AnnouncementId === detail?.AnnouncementId && p.ParentRowId === detail?.RowId);
    const url = detail?.Url;
    // return
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
