import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import { SpecUSR_Gallery_Comp, type ISpecUSRPhoto } from "@/SpecFetures/1810/Pages/Client/BizFunc/WEB/SpecUSR/SpecUSR_Gallery_Comp";
import type { ColumnConfig } from "@/SysCore/Components/Grid/Grid_Data";
import { LoadingErrorHandler } from "@/SysCore/Components/LoadingErrorHandler";
import type { Lang } from "@/SysCore/i18n/lang";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { SpecUSRDetailFields } from "@/types/SchemaFields";
import { type CSSProperties, useMemo, useState } from "react";
import { useLoaderData, useParams } from "react-router-dom";
import { type SpecUSRFormLoaderData, useSpecUSRFormFetchData } from "./SpecUSR_Form_Loader";

// #region Property
type SpecUSRFormModel = components["schemas"]["SpecUSR"];

type SpecUSRPhoto = components["schemas"]["SpecUSRPhoto"];

type SpecUSRDetail = components["schemas"]["SpecUSRDetail"];

type FieldValue = string | number | boolean | null | undefined;


const emptyData: SpecUSRFormModel = { _SpecUSRDetail: [], _SpecUSRPhoto: [] };

const supportedDetailColumns = [
    SpecUSRDetailFields.Year,
    SpecUSRDetailFields.AcademicYear,
    SpecUSRDetailFields.Courses,
    SpecUSRDetailFields.ProjectName,
    SpecUSRDetailFields.ProjectLeader,
    SpecUSRDetailFields.ProjectSubLeader,
    SpecUSRDetailFields.Cohost1,
    SpecUSRDetailFields.Cohost2,
    SpecUSRDetailFields.PracticeField,
    SpecUSRDetailFields.ExternalCooperationUnit,
    SpecUSRDetailFields.Department,
    SpecUSRDetailFields.AttendTeam,
    SpecUSRDetailFields.ProjectItem,
    SpecUSRDetailFields.PlanAmount,
    SpecUSRDetailFields.DuringExecution,
    SpecUSRDetailFields.ExecutionStrategy,
    SpecUSRDetailFields.ContentIntroduction,
    SpecUSRDetailFields.ProjectConcept,
    SpecUSRDetailFields.ProjectHighlights,
    SpecUSRDetailFields.Commissioned,
    SpecUSRDetailFields.Remark,
] as const;


interface ISpecUSRFormProps
{
    Theme: IFETheme;
    Lang: Lang;
}


interface GalleryOpenButtonProps
{
    count: number;
    onOpen: () => void;
}

export interface SpecUSRPreviewFormProps
{
    /** 目前語系。 */
    lang: string | Lang;

    /** SpecUSR 預覽資料。 */
    rawData: SpecUSRFormModel;

    /** 依類別設定可顯示的欄位。 */
    showColumns: string[];

    /** 前台欄位標題設定。 */
    showColTitle: ColumnConfig[];
}
// #endregion

// #region Public
export const SpecUSRFormComp = (props: ISpecUSRFormProps) =>
{
    // 宣告變數
    const { internalId } = useParams();
    const loaderData = useLoaderData() as SpecUSRFormLoaderData | null;
    const useFetchData = useSpecUSRFormFetchData({ internalId: `${internalId ?? ""}`.trim(), emptyData, loaderData });

    // return
    return (
        <LoadingErrorHandler isLoading={useFetchData.isLoading} errorList={useFetchData.errors}>
            <SpecUSRForm
                lang={props.Lang}
                rawData={useFetchData.rawData.formData}
                showColumns={useFetchData.rawData.showColumns}
                showColTitle={useFetchData.rawData.showColTitle}
            />
        </LoadingErrorHandler>
    );
};

/** SpecUSR 前台預覽內容，沿用正式頁 Detail DOM。 */
export const SpecUSRPreviewForm = (props: SpecUSRPreviewFormProps) =>
{
    // return
    return (
        <SpecUSRForm
            lang={props.lang}
            rawData={props.rawData}
            showColumns={props.showColumns}
            showColTitle={props.showColTitle}
        />
    );
};
// #endregion

// #region Private
const getColumnTitle = (columns: ColumnConfig[], key: string): string =>
{
    // return
    return columns.find(p => p.key === key)?.title ?? "";
};


const getDetailValue = (detail: SpecUSRDetail | undefined, key: string): FieldValue =>
{
    // 宣告變數
    const data = detail as Partial<Record<string, FieldValue>> | undefined;

    // return
    return data?.[key];
};


const hasValue = (value: FieldValue): boolean =>
{
    // return
    return !(value === null || value === undefined || (typeof value === "string" && value.trim().length === 0));
};


const shouldRenderField = (showColumns: Set<string>, colId: string, value: FieldValue): boolean =>
{
    // return
    return showColumns.size > 0 && showColumns.has(colId) && hasValue(value);
};


const normalizePreviewColumnKey = (item: string): string =>
{
    // return
    return `${item ?? ""}`.split(".").pop()?.trim() ?? "";
};


const buildShowColumnSet = (items: string[]): Set<string> =>
{
    // 宣告變數
    const supported = new Set<string>(supportedDetailColumns);
    const list = items.map(normalizePreviewColumnKey).filter(item => supported.has(item));

    // return
    return new Set(list);
};


const isSameLang = (source: string | Lang | null | undefined, target: string | Lang): boolean =>
{
    // return
    return `${source ?? ""}`.trim().toLowerCase() === `${target ?? ""}`.trim().toLowerCase();
};


const SpecUSRForm = (
    { lang, rawData, showColumns, showColTitle }: { lang: string | Lang; rawData: SpecUSRFormModel; showColumns: string[]; showColTitle: ColumnConfig[]; },
) =>
{
    // 宣告變數
    const allCols = supportedDetailColumns;
    const showColumnSet = useMemo(() => buildShowColumnSet(showColumns), [showColumns]);

    const header = rawData;
    const detail = rawData._SpecUSRDetail?.find(p => isSameLang(p.Lang, lang));
    const urlDetail = detail?._SpecUSRUrl ?? [];
    const fileDetail = detail?._SpecUSRFile ?? [];
    const [open, setOpen] = useState(false);

    const images = header?.PictureId ? [{ src: FileManagementAPI.get_Public_Preview_Url(header.PictureId), title: `${header.PicDescription ?? ""}` }] : [];

    const photos = useMemo<ISpecUSRPhoto[]>(() =>
    {
        // 宣告變數
        const list = rawData._SpecUSRPhoto ?? [];
        const getSort = (item: SpecUSRPhoto) => Number(item?.Sort ?? 0);

        // return
        return list.slice().sort((a, b) => getSort(a) - getSort(b)).map(item =>
        {
            const id = `${item?.PicSrcId ?? ""}`.trim();
            if (!id) return null;

            const info = item._SpecUSRPhotoInfo?.find(p => isSameLang(p.Lang, lang));
            return { id, alt: info?.Title ?? "" } as ISpecUSRPhoto;
        }).filter((p): p is ISpecUSRPhoto => p !== null);
    }, [rawData._SpecUSRPhoto, lang]);

    // return
    return (
        <div className="articles_contentBoxs_1 mb-5">
            <div className="articles_item col-12">
                <article className="cardbox">
                    <div className="card_content_2">
                        {allCols.map(colId =>
                        {
                            const title = getColumnTitle(showColTitle, colId);
                            const data = getDetailValue(detail, colId);
                            if (!shouldRenderField(showColumnSet, colId, data)) return null;

                            return (
                                <div className="tr__Box" key={colId}>
                                    <div className="td__ col-sm-2 col-12 before_line d-flex justify-content-end align-content-center p-0">
                                        <div className="ttBox_L">{title}</div>
                                    </div>
                                    <div className="td__ col-sm-10 col-12 d-flex justify-content-start align-content-center p-0">
                                        <div className="ttBox_R">{data}</div>
                                    </div>
                                </div>
                            );
                        })}

                        <div className="tr__Box">
                            <div className="td__ col-sm-2 col-12 before_line d-flex justify-content-end align-content-center p-0">
                                <div className="ttBox_L">{getColumnTitle(showColTitle, "PictureId")}</div>
                            </div>
                            <div className="td__ col-sm-10 col-12 d-flex justify-content-start align-content-center p-0">
                                <div className="ttBox_R">
                                    {images.map((img, idx) => (
                                        <div className="col-xs-12 col-sm-10 col-md-7 col-lg-6 photo_one_pic_standardbox mb-0" key={idx}>
                                            <div className="lightbox">
                                                <div
                                                    className="img-box"
                                                    style={{ cursor: "pointer" }}
                                                    onClick={() =>
                                                    {
                                                        setOpen(true);
                                                    }}
                                                    title={img.title}
                                                >
                                                    <img src={img.src} alt={img.title} className="img-fluid" />
                                                    <div className="zoom-plus">
                                                        <i className="fa fa-zoom-plus" aria-hidden="true"></i>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {photos.length > 0 && (
                                        <>
                                            <GalleryOpenButton count={photos.length} onOpen={() => setOpen(true)} />
                                            <SpecUSR_Gallery_Comp
                                                open={open}
                                                title={detail?.ProjectName ?? ""}
                                                photos={photos}
                                                onClose={() => setOpen(false)}
                                            />
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {urlDetail && urlDetail.length > 0 && (
                            <div className="tr__Box">
                                <div className="td__ col-sm-2 col-12 before_line d-flex justify-content-end align-content-center p-0">
                                    <div className="ttBox_L">{"相關連結"}</div>
                                </div>
                                <div className="td__ col-sm-10 col-12 d-flex justify-content-start align-content-center p-0">
                                    <div className="ttBox_R">
                                        <ul className="list-group">
                                            {urlDetail.map(item =>
                                            {
                                                const target = item.WindowTarget === 0 ? "_self" : "_blank";
                                                return (
                                                    <li key={`${item.USRId ?? ""}-${item.ParentRowId ?? ""}-${item.RowId ?? ""}`}>
                                                        <a href={item.Url ?? ""} target={target} rel="noopener noreferrer" className="btn btn-default">
                                                            <i className="fa fa-link"></i> {item.UrlDescription}
                                                        </a>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        {fileDetail && fileDetail.length > 0 && (
                            <div className="tr__Box">
                                <div className="td__ col-sm-2 col-12 before_line d-flex justify-content-end align-content-center p-0">
                                    <div className="ttBox_L">{"相關檔案"}</div>
                                </div>
                                <div className="td__ col-sm-10 col-12 d-flex justify-content-start align-content-center p-0">
                                    <div className="ttBox_R">
                                        <ul className="list-group">
                                            {fileDetail.map(item =>
                                            {
                                                const fileUrl = FileManagementAPI.get_Public_Download_Url(item.FileSrcId, item.FileName);
                                                return (
                                                    <li key={`${item.USRId ?? ""}-${item.ParentRowId ?? ""}-${item.RowId ?? ""}`}>
                                                        <a
                                                            href={fileUrl}
                                                            rel="noopener noreferrer"
                                                            className="btn btn-default"
                                                            tabIndex={1}
                                                            title={`${item.FileName}(另開新視窗)`}
                                                        >
                                                            <i className="fa fa-paperclip"></i> {item.FileName}
                                                        </a>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}
                        <hr />
                    </div>
                </article>
            </div>
        </div>
    );
};


const GalleryOpenButton = ({ count, onOpen }: GalleryOpenButtonProps) =>
{
    // 宣告變數
    const wrapStyle: CSSProperties = { width: "100%", flexBasis: "100%", alignSelf: "stretch", marginTop: 8, marginRight: "auto", textAlign: "left" };

    // return
    return (
        <div style={wrapStyle}>
            <div className="customize_btn my-3">
                <button
                    type="button"
                    className="Btn_s1"
                    onClick={onOpen}
                    aria-haspopup="dialog"
                    aria-label={`瀏覽全部相片（${count} 張）`}
                    title={`瀏覽全部相片（${count} 張）`}
                >
                    VIEW ALL<span className="ml-2">+</span>
                </button>
            </div>
        </div>
    );
};
// #endregion
