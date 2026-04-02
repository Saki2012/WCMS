import type { TryCountDetailViewRequest } from "@/Features/Hooks/BizFunc/SystemSetting/SiteInfo/SiteViewCount/SiteViewCount_Api";
import { useFormDetailViewCount } from "@/Features/Hooks/BizFunc/SystemSetting/SiteInfo/SiteViewCount/SiteViewCount_Hooks";
import type { IAnnouncementFormProps } from "@/Features/Pages/Client/BizFunc/WebManagement/Announcement/AnnouncementForm";
import { useAnnouncementFormFetchData } from "@/Features/Pages/Client/BizFunc/WebManagement/Announcement/AnnouncementForm_Loader";
import type { ModuleViewCountConfig } from "@/Features/Pages/Client/Scaffold/SubPages/layouts/RightFrame/ModuleContent";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import { useResolveInternalIds } from "@/SysCore/Components/File/useResolveInternalIds";
import LoadingErrorHandler from "@/SysCore/Components/LoadingErrorHandler";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { FormatDate } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import parse from "html-react-parser";
import { useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"];
type AnnouncementDetailFile = components["schemas"]["AnnouncementDetailFile_DTO"];
const emptyData: AnnouncementSet = { Announcement: {}, AnnouncementDetail: [] };

const AnnouncementForm = (props: IAnnouncementFormProps) =>
{
    // 宣告變數
    const { internalId } = useParams();
    const safeInternalId = `${internalId ?? ""}`.trim();
    // 執行 function：1810 表單資料統一改由 feature 取得
    const getData = useAnnouncementFormFetchData({ lang: props.lang, internalId: safeInternalId, emptyData });
    const formData = getData.rawData.formData;
    const categoryNameText = getData.rawData.categoryNameText;
    const tagNameText = getData.rawData.tagNameText;
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
    const detailViewCountOptions = useMemo(() =>
    {
        return buildDetailViewCountOptions(viewCountConfig);
    }, [viewCountConfig]);
    useFormDetailViewCount(detailViewCountOptions);
    return (
        <>
            <LoadingErrorHandler isLoading={getData.isLoading} errorList={getData.errors}>
                <Content
                    lang={props.lang}
                    theme={props.theme}
                    data={formData}
                    categoryNameText={categoryNameText}
                    tagNameText={tagNameText}
                />
            </LoadingErrorHandler>
        </>
    );
};

export default AnnouncementForm;

const Content = (prop: {
    lang: string;
    theme: IFETheme;
    data: AnnouncementSet;
    categoryNameText: string;
    tagNameText: string;
}) =>
{
    // 宣告變數
    const langData = prop.data?.AnnouncementDetail?.find(
        p => (p.Lang ?? "").toLowerCase() === prop.lang,
    );

    const files = prop.data?.AnnouncementDetailFile?.filter(
        p => p.AnnouncementId === langData?.AnnouncementId
            && p.ParentRowId === langData?.RowId,
    ) ?? [];

    const title = langData?.Title;
    const startDate = FormatDate(prop.data?.Announcement?.Validate_Start);
    const href = langData?.Url ?? "";
    const hrefName = langData?.UrlDescription ?? "";
    const rawContent = langData?.Content ?? "";
    const parseContent = useResolveInternalIds(rawContent, { locale: prop.lang });
    const content = parseContent.html ? parse(parseContent.html) : null;

    const cats = `${prop.categoryNameText ?? ""}`.trim();
    const tags = `${prop.tagNameText ?? ""}`.trim();

    // return
    return (
        <>
            <div className="page-header mb-3">
                <h3>{title}</h3>
                {startDate && (
                    <>
                        <i className="fa fa-calendar"></i>
                        {` ${startDate}`}
                    </>
                )}
                {cats && (
                    <>
                        <i className="fa fa-tags ml-3"></i>
                        {` ${cats}`}
                    </>
                )}
                {tags && (
                    <>
                        <i className="fa fa-bookmark ml-3"></i>
                        {` ${tags}`}
                    </>
                )}
            </div>
            <div className="dotted_line"></div>
            {content}
            <hr />

            {(href || files.length > 0) && (
                <ul className="list-group">
                    {href && href.length > 0 && (
                        <li>
                            <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-default"
                            >
                                <i className="fa fa-link"></i> {hrefName !== "" ? hrefName : href}
                            </a>
                        </li>
                    )}

                    {files.length > 0 && (
                        <li>
                            {files.map((file: AnnouncementDetailFile, idx: number) =>
                            {
                                // 宣告變數
                                const downloadUrl = FileManagementAPI.get_Public_Download_Url(
                                    file.FileId,
                                    file.FileName,
                                );

                                // return
                                return (
                                    <a
                                        key={idx}
                                        href={downloadUrl}
                                        rel="noopener noreferrer"
                                        className="btn btn-default"
                                        tabIndex={1}
                                        title={`${file.FileName}(另開新視窗)`}
                                    >
                                        <i className="fa fa-paperclip"></i> {file.FileName}
                                    </a>
                                );
                            })}
                        </li>
                    )}
                </ul>
            )}

            <GoBackRow />
        </>
    );
};

const GoBackRow: React.FC = () =>
{
    // 宣告變數
    const navigate = useNavigate();
    const title = "回上一頁";

    const handleBack = useCallback(
        (e: React.MouseEvent<HTMLButtonElement>) =>
        {
            e.preventDefault();
            navigate(-1);
        },
        [navigate],
    );

    // return
    return (
        <div className="row">
            <div className="col-lg-8 col-md-8 col-sm-6 col-4" />
            <div className="col-lg-2 col-md-2 col-sm-3 col-4 text-right" />
            <div className="col-lg-2 col-md-2 col-sm-3 col-4 text-right">
                <button
                    type="button"
                    className="btn btn-primary btn-custom-color"
                    title={title}
                    aria-label={title}
                    onClick={handleBack}
                >
                    {title}
                </button>
            </div>
        </div>
    );
};

const buildDetailViewCountOptions = (config: ModuleViewCountConfig) =>
{
    if (config.mode === "list")
    {
        return { enabled: false, contentKey: "", request: null, cooldownMs: undefined, apiInstance: undefined };
    }
    return {
        enabled: true,
        contentKey: config.contentKey,
        request: config.request,
        cooldownMs: config.cooldownMs,
        apiInstance: config.apiInstance,
    };
};
