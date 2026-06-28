import type { TryCountDetailViewRequest } from "@/Features/Hooks/BizFunc/WEB/SiteViewCount_Api";
import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import { getClientSlotPath } from "@/Features/Pages/Client/Scaffold/Slot/Client_SlotPath";
import { ModuleContent, type ModuleViewCountConfig, type SubTitleProps } from "@/Features/Pages/Client/Scaffold/SubPages/layouts/RightFrame/ModuleContent";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import { CmsHtml_Comp } from "@/SysCore/Components/CmsHtml/CmsHtml_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { formatDate, LibText } from "@/SysCore/Utils/Library/LibData";
import { resolveSpecComponent } from "@/SysCore/Utils/Library/SlotResolver";
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
export interface AnnouncementFormViewProps extends IAnnouncementFormProps
{
    formData: AnnouncementSet;
    categoryNameText?: string;
    tagNameText?: string;
    internalId?: string;
    isLoading: boolean;
    errorList: string[];
    viewCountConfig?: ModuleViewCountConfig;
}
// #endregion

// #region Variable
/** Announcement FormView 快取，避免重複解析 Spec View。 */
let announcementFormViewCache: typeof Client_Announcement_Form_FeatureView | null = null;
// #endregion

// #region Public
export const Client_Announcement_Form_Comp = (props: IAnnouncementFormProps) =>
{
    const { internalId } = useParams();
    const safeInternalId = LibText.safeTrim(internalId);
    const vm = useAnnouncementFormData({ lang: props.lang, internalId: safeInternalId, emptyData });

    const viewCountConfig = useMemo<ModuleViewCountConfig>(() =>
    {
        const request: TryCountDetailViewRequest = { SiteIndex: props.site.siteIndex, ProgId: PGID.Announcement, InternalId: safeInternalId };
        return { mode: "form", contentKey: safeInternalId, request };
    }, [props.site.siteIndex, safeInternalId]);

    return (
        <Client_Announcement_Form
            {...props}
            formData={vm.formData}
            categoryNameText={vm.categoryNameText}
            tagNameText={vm.tagNameText}
            internalId={safeInternalId}
            isLoading={vm.isLoading}
            errorList={vm.errorList}
            viewCountConfig={viewCountConfig}
        />
    );
};

/** 公告明細 FormView Entry，正式前台與 Preview 都從這裡進入。 */
export const Client_Announcement_Form = (props: AnnouncementFormViewProps) =>
{
    const FormView = getAnnouncementFormView();
    return <FormView {...props} />;
};

/** 公告明細 Feature 預設 View，只負責輸出 DOM。 */
const Client_Announcement_Form_FeatureView = (props: AnnouncementFormViewProps) =>
{
    const detail = useMemo(() => props.formData.AnnouncementDetail?.find(p => (p.Lang ?? "").toLowerCase() === props.lang), [
        props.formData.AnnouncementDetail,
        props.lang,
    ]);

    const startDate = useMemo(() => formatDate(props.formData.Announcement?.Validate_Start), [props.formData.Announcement?.Validate_Start]);

    const subTitle = useMemo<SubTitleProps>(() => ({
        cat: props.categoryNameText ?? "",
        tag: props.tagNameText ?? "",
        date: startDate,
    }), [props.categoryNameText, props.tagNameText, startDate]);

    return (
        <ModuleContent
            nodeTitle={props.node.title}
            title={detail?.Title ?? ""}
            subTitle={subTitle}
            isLoading={props.isLoading}
            errorList={props.errorList}
            viewCountConfig={props.viewCountConfig}
        >
            <Content lang={props.lang} data={props.formData} />
        </ModuleContent>
    );
};
// #endregion

// #region Private

/** 取得 Announcement FormView，有 Spec View 時使用 Spec，否則使用 Feature View。 */
const getAnnouncementFormView = (): typeof Client_Announcement_Form_FeatureView =>
{
    if (announcementFormViewCache !== null)
    {
        return announcementFormViewCache;
    }

    announcementFormViewCache = resolveSpecComponent(
        getClientSlotPath("Slot_Announcement_Form_Comp"),
        Client_Announcement_Form_FeatureView,
        ["Client_Announcement_Form"],
    );

    return announcementFormViewCache;
};

/** 取得 Announcement FormView，有 Spec View 時使用 Spec，否則使用 Feature View。 */

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
