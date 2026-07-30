import type { AnnouncementFormViewProps } from "@/Features/Pages/Client/BizFunc/WEB/Announcement/Client_Announcement_Form_Comp";
import { CmsHtml_Comp } from "@/SysCore/Components/CmsHtml/CmsHtml_Comp";
import { LoadingErrorHandler } from "@/SysCore/Components/LoadingErrorHandler";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { formatDate } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import type { Lang } from "@/SysCore/i18n/lang";
import { type MouseEvent, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// #region Property
type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"];
type AnnouncementDetailFile = components["schemas"]["AnnouncementDetailFile_DTO"];
// #endregion

// #region Public
/** 1810 公告明細 Form DOM，Feature Entry 會在最後透過 SlotResolver 解析到這裡。 */
export const Client_Announcement_Form = (props: AnnouncementFormViewProps) =>
{
    return (
        <LoadingErrorHandler isLoading={props.isLoading} errorList={props.errorList}>
            <Content data={props.formData} lang={props.lang} categoryNameText={props.categoryNameText ?? ""} tagNameText={props.tagNameText ?? ""} />
        </LoadingErrorHandler>
    );
};
// #endregion

// #region Private
/** 1810 公告明細 DOM。 */
const Content = (prop: { data: AnnouncementSet; lang: Lang; categoryNameText: string; tagNameText: string; }) =>
{
    const langData = prop.data?.AnnouncementDetail?.find(p => (p.Lang ?? "").toLowerCase() === prop.lang);
    const files = prop.data?.AnnouncementDetailFile?.filter(p => p.AnnouncementId === langData?.AnnouncementId && p.ParentRowId === langData?.RowId) ?? [];
    const title = langData?.Title;
    const startDate = formatDate(prop.data?.Announcement?.Validate_Start);
    const href = langData?.Url ?? "";
    const hrefName = langData?.UrlDescription ?? "";
    const rawContent = langData?.Content ?? "";
    const content = <CmsHtml_Comp html={rawContent} lang={prop.lang} />;
    const cats = `${prop.categoryNameText ?? ""}`.trim();
    const tags = `${prop.tagNameText ?? ""}`.trim();

    return (
        <>
            <div className="page-header mb-3">
                <h3>{title}</h3>
                {startDate && <MetaText iconClass="fa fa-calendar" text={startDate} />}
                {cats && <MetaText iconClass="fa fa-tags ml-3" text={cats} />}
                {tags && <MetaText iconClass="fa fa-bookmark ml-3" text={tags} />}
            </div>
            <div className="dotted_line"></div>
            {content}
            <hr />
            {(href || files.length > 0) && (
                <ul className="list-group">
                    {href && <ExternalLink href={href} text={hrefName !== "" ? hrefName : href} />}
                    {files.length > 0 && <FileLinks files={files} />}
                </ul>
            )}
            <GoBackRow />
        </>
    );
};

/** 顯示 meta 文字。 */
const MetaText = (prop: { iconClass: string; text: string; }) =>
{
    return (
        <>
            <i className={prop.iconClass}></i>
            {` ${prop.text}`}
        </>
    );
};

/** 顯示外部連結。 */
const ExternalLink = (prop: { href: string; text: string; }) =>
{
    return (
        <li>
            <a href={prop.href} target="_blank" rel="noopener noreferrer" className="btn btn-default">
                <i className="fa fa-link"></i> {prop.text}
            </a>
        </li>
    );
};

/** 顯示附件連結。 */
const FileLinks = (prop: { files: AnnouncementDetailFile[]; }) =>
{
    return (
        <li>
            {prop.files.map((file, idx) =>
            {
                const downloadUrl = FileManagementAPI.get_Public_Download_Url(file.FileId, file.FileName);
                return (
                    <a key={`${file.FileId ?? ""}-${idx}`} href={downloadUrl} rel="noopener noreferrer" className="btn btn-default" title={`${file.FileName}(另開新視窗)`}>
                        <i className="fa fa-paperclip"></i> {file.FileName}
                    </a>
                );
            })}
        </li>
    );
};

/** 顯示回上一頁按鈕。 */
const GoBackRow = () =>
{
    const navigate = useNavigate();
    const title = "回上一頁";
    const handleBack = useCallback((e: MouseEvent<HTMLButtonElement>) =>
    {
        e.preventDefault();
        navigate(-1);
    }, [navigate]);

    return (
        <div className="row">
            <div className="col-lg-8 col-md-8 col-sm-6 col-4" />
            <div className="col-lg-2 col-md-2 col-sm-3 col-4 text-right" />
            <div className="col-lg-2 col-md-2 col-sm-3 col-4 text-right">
                <button type="button" className="btn btn-primary btn-custom-color" title={title} aria-label={title} onClick={handleBack}>{title}</button>
            </div>
        </div>
    );
};
// #endregion
