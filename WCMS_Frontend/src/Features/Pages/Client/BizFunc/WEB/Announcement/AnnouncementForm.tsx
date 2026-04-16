import parse from "html-react-parser";
import { useMemo } from "react";
import { useParams } from "react-router";

import type { TryCountDetailViewRequest } from "@/Features/Hooks/BizFunc/WEB/SiteViewCount_Api";
import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import type { Lang } from "@/SysCore/i18n/lang";
import type { components } from "@/types/api";

import ModuleContent, {
    type ModuleViewCountConfig,
    type SubTitleProps,
} from "@/Features/Pages/Client/Scaffold/SubPages/Layouts/RightFrame/ModuleContent";
import { useResolveInternalIds } from "@/SysCore/Components/File/useResolveInternalIds";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { FormatDate } from "@/SysCore/Utils/Library/LibData";
import { PGID } from "@/types/SchemaFields";

import { useAnnouncementFormFetchData } from "./AnnouncementForm_Loader";

type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"];

const emptyData: AnnouncementSet = {
    Announcement: {},
    AnnouncementDetail: [],
};

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
    const getData = useAnnouncementFormFetchData({
        lang: props.lang,
        internalId: safeInternalId,
        emptyData,
    });

    const formData = getData.rawData.formData;
    const categoryNameText = getData.rawData.categoryNameText;
    const tagNameText = getData.rawData.tagNameText;

    const detail = useMemo(() =>
    {
        return formData.AnnouncementDetail?.find(
            p => (p.Lang ?? "").toLowerCase() === props.lang,
        );
    }, [formData.AnnouncementDetail, props.lang]);

    const startDate = useMemo(() =>
    {
        return FormatDate(formData.Announcement?.Validate_Start);
    }, [formData.Announcement?.Validate_Start]);

    const subTitle = useMemo<SubTitleProps>(() =>
    {
        return {
            cat: categoryNameText,
            tag: tagNameText,
            date: startDate,
        };
    }, [categoryNameText, tagNameText, startDate]);

    const viewCountConfig = useMemo<ModuleViewCountConfig>(() =>
    {
        // 宣告變數
        const request: TryCountDetailViewRequest = {
            SiteIndex: props.site.siteIndex,
            ProgId: PGID.Announcement,
            InternalId: safeInternalId,
        };

        // return
        return {
            mode: "form",
            contentKey: safeInternalId,
            request,
        };
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
    const detail = props.data.AnnouncementDetail?.find(
        p => (p.Lang ?? "").toLowerCase() === props.lang,
    );

    const fileDetail = props.data.AnnouncementDetailFile?.filter(
        p => p.AnnouncementId === detail?.AnnouncementId
            && p.ParentRowId === detail?.RowId,
    );

    const parseContent = useResolveInternalIds(detail?.Content ?? "", {
        locale: props.lang,
    });

    const content = parseContent.html ? parse(parseContent.html) : null;
    const url = detail?.Url;

    // return
    return (
        <>
            {content}

            {url && fileDetail && fileDetail.length > 0 && <hr className="hr-my-4" />}

            {url && (
                <>
                    <div className="row">
                        <div className="col-xl-6 col-lg-6 col-md-6 col-sm-12 col-12">
                            <div className="Standard_btnDiv">
                                <a
                                    href={url}
                                    className="btn btn_NEWS bg_urllink_NEWS"
                                    role="button"
                                    aria-label="分享"
                                    target="_blank"
                                    title="[ 另開新視窗 ]"
                                    tabIndex={0}
                                >
                                    <span>
                                        <i className="fas fa-link + link + ml-0 mr-2"></i>
                                        <span className="sr-only">
                                            {detail?.UrlDescription ?? ""}
                                        </span>
                                    </span>
                                    <span className="URL_link_NEWS">
                                        {detail?.UrlDescription ?? ""}
                                    </span>
                                </a>
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
                            // 宣告變數
                            const downloadUrl = FileManagementAPI.get_Public_Download_Url(
                                item.FileId,
                                item.FileName,
                            );

                            // return
                            return (
                                <div
                                    key={`${item.FileId ?? ""}`}
                                    className="col-xl-6 col-lg-6 col-md-6 col-sm-12 col-12"
                                >
                                    <div className="Standard_btnDiv">
                                        <a
                                            href={downloadUrl}
                                            className="btn btn_NEWS bg_urllink_NEWS"
                                            role="button"
                                            aria-label="分享"
                                            target="_blank"
                                            title="[ 另開新視窗 ]"
                                            tabIndex={0}
                                        >
                                            <span>
                                                <i className="fas fa-paperclip + link + ml-0 mr-2"></i>
                                                <span className="sr-only">
                                                    {item.FileName}
                                                </span>
                                            </span>
                                            <span className="URL_link_NEWS">
                                                {item.FileName}
                                            </span>
                                        </a>
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
