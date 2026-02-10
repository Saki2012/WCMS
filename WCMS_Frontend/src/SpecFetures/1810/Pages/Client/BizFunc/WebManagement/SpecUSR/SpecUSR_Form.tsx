import type { IFETheme } from '@/Features/Pages/Client/Theme/ITheme';
import type { components } from '@/types/api';
import { useParams } from 'react-router-dom';
import type { Lang } from '@/SysCore/i18n/lang';
import SpecUSRProvider from '@/SpecFetures/1810/Hooks/SpecUSR/SpecUSR_Api';
import { useFetchFormData } from '@/SysCore/Utils/API/FetchFormData';
import { useGetShowColumnItems } from './SpecUSR_List';
import LoadingErrorHandler from '@/SysCore/Components/LoadingErrorHandler';
import { useFetchGridListData } from '@/SysCore/Utils/API/FetchGridListData';
import type { ColumnConfig } from '@/SysCore/Components/Grid/Grid_Data';
import { FileManagementAPI } from '@/SysCore/Utils/API/APIClient';
import { useMemo, useState } from 'react';
import { SpecUSRDetailFields, SpecUSRModelFields, SpecUSRSetFields } from '@/types/SchemaFields';
import SpecUSR_Gallery_Comp, { type ISpecUSRPhoto } from '@/SpecFetures/1810/Pages/Client/BizFunc/WebManagement/SpecUSR/SpecUSR_Gallery_Comp';
type SpecUSRSet = components["schemas"]["SpecUSRSet_DTO"]
type SpecUSRPhoto = components["schemas"]["SpecUSRPhoto_DTO"]
const emptyData: SpecUSRSet = {}

const useSpecUSRList = (internalId: string) => {
    const condition = `${SpecUSRModelFields.InternalId} = ${internalId}`;
    const provider = SpecUSRProvider();
    return useFetchGridListData<SpecUSRSet>({
        getModelDisplayName: () => provider.getModelDisplayName(),
        fetchList: (cond) => provider.fetchList(cond),
        fetchListCount: (cond) => provider.fetchListCount(cond),
        visibleKeys: [
            [SpecUSRSetFields.SpecUSR, SpecUSRModelFields.PictureId],
            [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.Year],
            [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.AcademicYear],
            [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.Courses],
            [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.PracticeField],
            [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.ProjectName],
            [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.ExternalCooperationUnit],
            [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.Department],
            [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.PlanAmount],
            [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.DuringExecution],
            [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.ExecutionStrategy],
            [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.ContentIntroduction],
            [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.ProjectConcept],
            [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.ProjectHighlights],
            [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.ProjectLeader],
            [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.ProjectSubLeader],
            [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.Cohost1],
            [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.Cohost2],
            [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.Commissioned],
            [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.AttendTeam],
            [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.Remark],
            [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.ProjectItem],
            [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.Url],
        ],
        buildQueryCondition: () => ({
            Fields: [
                SpecUSRModelFields.InternalId,
            ],
            Condition: condition,
            PageNumber: 0,
            PageSize: 0,
        }),
        enabled: true,
        deps: [],
    });
};


interface ISpecUSRFormProps { Theme: IFETheme; Lang: Lang; }

export const SpecUSRFormComp = (props: ISpecUSRFormProps) => {
    const { internalId } = useParams()
    const useFetchUsrData = useFetchFormData<SpecUSRSet>(SpecUSRProvider(), internalId, emptyData)
    const categoryId = useFetchUsrData.data?.SpecUSR?.CategoryId ?? "";
    const useGetShowCols = useGetShowColumnItems(categoryId)
    const useGetModuleDisplayName = useSpecUSRList(internalId as string);
    const isLoading = [useFetchUsrData.isLoading, useGetShowCols.isLoading, useGetModuleDisplayName.isLoading];
    const errors = [useFetchUsrData.error, useGetShowCols.error, useGetModuleDisplayName.error];
    const showColumns: string[] = useGetShowCols.rawData?.[0]?.SpecCategory?.ShowColumnItems?.split(",") ?? [];
    return (
        <LoadingErrorHandler loadingList={isLoading} errorList={errors} >
            <SpecUSRForm lang={props.Lang} rawData={useFetchUsrData.data as SpecUSRSet} showColumns={showColumns} showColTitle={useGetModuleDisplayName.gridProps.columns}></SpecUSRForm>
        </LoadingErrorHandler>
    );
}

const SpecUSRForm = ({ lang, rawData, showColumns, showColTitle }: { lang: string | Lang; rawData: SpecUSRSet; showColumns: string[]; showColTitle: ColumnConfig[]; }) => {
    const allCols = [SpecUSRDetailFields.Year, SpecUSRDetailFields.AcademicYear, SpecUSRDetailFields.Courses, SpecUSRDetailFields.ProjectName, SpecUSRDetailFields.ProjectLeader,
    SpecUSRDetailFields.ProjectSubLeader, SpecUSRDetailFields.Cohost1, SpecUSRDetailFields.Cohost2,
    SpecUSRDetailFields.PracticeField, SpecUSRDetailFields.ExternalCooperationUnit,
    SpecUSRDetailFields.Department, SpecUSRDetailFields.AttendTeam, SpecUSRDetailFields.ProjectItem, SpecUSRDetailFields.PlanAmount, SpecUSRDetailFields.DuringExecution,
    SpecUSRDetailFields.ExecutionStrategy, SpecUSRDetailFields.ContentIntroduction, SpecUSRDetailFields.ProjectConcept, SpecUSRDetailFields.ProjectHighlights,
    SpecUSRDetailFields.Commissioned, SpecUSRDetailFields.Remark]
    const header = rawData.SpecUSR;
    const detail = rawData.SpecUSRDetail?.find(p => p.Lang === lang);
    const urlDetail = rawData.SpecUSRUrl?.filter(p => p.USRId === detail?.USRId && p.ParentRowId === detail?.RowId);
    const fileDetail = rawData.SpecUSRFile?.filter(p => p.USRId === detail?.USRId && p.ParentRowId === detail?.RowId);
    const [open, setOpen] = useState(false);
    const images = (header?.PictureId ? [{ src: `${FileManagementAPI.PREVIEW_URL}/${header.PictureId}`, title: `${header.PicDescription ?? ""}` }] : []);

    const photos = useMemo<ISpecUSRPhoto[]>(() => {
        const list = rawData.SpecUSRPhoto ?? [];
        const infos = rawData.SpecUSRPhotoInfo ?? [];
        const getSort = (x: SpecUSRPhoto) => (x?.Sort ?? x?.Sort ?? 0) as number;
        return list.slice().sort((a, b) => getSort(a) - getSort(b)).map((item) => {
            const id = (item?.PicSrcId ?? "").trim();
            if (!id) return null;
            const info = infos.find(p => p.USRId === item.USRId && p.ParentRowId === item.RowId && p.Lang === lang);
            const alt = info?.Title ?? "";
            return { id, alt } as ISpecUSRPhoto;
        }).filter((x): x is ISpecUSRPhoto => x !== null); // 型別守衛，確保回傳 ISpecUSRPhoto[]
    }, [rawData.SpecUSRPhoto, rawData.SpecUSRPhotoInfo, lang]);

    return (
        <div className="articles_contentBoxs_1 mb-5">
            <div className="articles_item col-12">
                <article className="cardbox">
                    <div className="card_content_2">

                        {allCols.map((colId) => {
                            const title = showColTitle.find(p => p.key === colId)?.title ?? ""
                            const data = detail ? (detail as Record<string, any>)[colId] ?? "" : "";
                            if (!showColumns || showColumns.length === 0 || !showColumns.includes(colId) || !data) return (<></>)
                            return (
                                <div className="tr__Box">
                                    <div className="td__ col-sm-2 col-12 before_line d-flex justify-content-end align-content-center p-0">
                                        <div className="ttBox_L">{title}</div>
                                    </div>
                                    <div className="td__ col-sm-10 col-12 d-flex justify-content-start align-content-center p-0">
                                        <div className="ttBox_R">{data}</div>
                                    </div>
                                </div>)
                        })}

                        <div className="tr__Box">
                            <div className="td__ col-sm-2 col-12 before_line d-flex justify-content-end align-content-center p-0">
                                <div className="ttBox_L">{showColTitle.find(p => p.key === "PictureId")?.title}</div>
                            </div>
                            <div className="td__ col-sm-10 col-12 d-flex justify-content-start align-content-center p-0">
                                <div className="ttBox_R">
                                    {images.map((img, idx) => (
                                        <div className="col-xs-12 col-sm-10 col-md-7 col-lg-6 photo_one_pic_standardbox mb-0" key={idx}>
                                            <div className="lightbox">
                                                <div className="img-box" style={{ cursor: "pointer" }} onClick={() => { setOpen(true); }} title={img.title}>
                                                    <img src={img.src} alt={img.title} className="img-fluid" />
                                                    <div className="zoom-plus">
                                                        <i className="fa fa-zoom-plus" aria-hidden="true"></i>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {photos && photos.length > 0 && (<>
                                        <GalleryOpenButton count={photos.length} onOpen={() => setOpen(true)} />
                                        <SpecUSR_Gallery_Comp open={open} title={detail?.ProjectName ?? ""} photos={photos} onClose={() => setOpen(false)} />
                                    </>)}
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
                                            {urlDetail.map((item) => {
                                                const target = item.WindowTarget === 0 ? "_self" : "_blank"
                                                return (
                                                    <li>
                                                        <a href={item.Url ?? ""} target={target} rel="noopener noreferrer" className="btn btn-default">
                                                            <i className="fa fa-link"></i> {item.UrlDescription}
                                                        </a>
                                                    </li>
                                                )
                                            }
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            </div>)}

                        {fileDetail && fileDetail.length > 0 && (
                            <div className="tr__Box">
                                <div className="td__ col-sm-2 col-12 before_line d-flex justify-content-end align-content-center p-0">
                                    <div className="ttBox_L">{"相關檔案"}</div>
                                </div>
                                <div className="td__ col-sm-10 col-12 d-flex justify-content-start align-content-center p-0">
                                    <div className="ttBox_R">
                                        <ul className="list-group">
                                            {fileDetail.map((item) => {
                                                return (
                                                    <li >
                                                        <a href={`${FileManagementAPI.DOWNLOAD_URL}/${item.FileSrcId}`} rel="noopener noreferrer" className="btn btn-default" tabIndex={1} title={`${item.FileName}(另開新視窗)`}>
                                                            <i className="fa fa-paperclip"></i> {item.FileName}
                                                        </a>
                                                    </li>
                                                )
                                            })}
                                        </ul>
                                    </div>
                                </div>
                            </div>)}
                        <hr />
                    </div>
                </article>
            </div>
        </div>
    )
}


// -- 在 SpecUSR_Form.tsx 內（可放在檔案頂部 imports 之後） --
interface GalleryOpenButtonProps {
    count: number;
    onOpen: () => void;
}

const GalleryOpenButton: React.FC<GalleryOpenButtonProps> = ({ count, onOpen }) => {
    const wrapStyle: React.CSSProperties = {
        width: "100%",           // 佔滿一列
        flexBasis: "100%",       // 在 flex 容器裡強制換行到下一列
        alignSelf: "stretch",    // 撐滿交叉軸
        marginTop: 8,
        marginRight: "auto",
        textAlign: "left"
    };
    return (
        <div style={wrapStyle}>
            <div className="customize_btn my-3">
                <button type="button" className="Btn_s1" onClick={onOpen} aria-haspopup="dialog" aria-label={`瀏覽全部相片（${count} 張）`} title={`瀏覽全部相片（${count} 張）`}>
                    VIEW ALL<span className="ml-2">+</span>
                </button>
            </div >
        </div>
    );
};
