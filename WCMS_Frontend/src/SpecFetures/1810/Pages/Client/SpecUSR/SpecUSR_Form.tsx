import type { IFETheme } from '@/Features/Pages/Client/Theme/ITheme';
import type { components } from '@/types/api';
type SpecUSRSet = components["schemas"]["SpecUSRSet_DTO"]
import { useParams } from 'react-router-dom';
import type { Lang } from '@/SysCore/i18n/lang';
import SpecUSRProvider from '@/SpecFetures/1810/Hooks/SpecUSR/SpecUSR_Api';
import { useFetchFormData } from '@/SysCore/Utils/API/FetchFormData';
import { useGetShowColumnItems } from './SpecUSR_List';
import LoadingErrorHandler from '@/SysCore/Components/LoadingErrorHandler';
import * as SchemaFields from "@/types/SchemaFields"
import { useFetchGridListData } from '@/SysCore/Utils/API/FetchGridListData';
import type { ColumnConfig } from '@/SysCore/Components/Grid/Grid_Data';
import { FileManagementAPI } from '@/SysCore/Utils/API/APIClient';
import "yet-another-react-lightbox/styles.css";
import Lightbox from "yet-another-react-lightbox";
import Download from "yet-another-react-lightbox/plugins/download";
import Share from "yet-another-react-lightbox/plugins/share";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import { useState } from 'react';
import { SpecUSRDetailFields, SpecUSRModelFields, SpecUSRSetFields } from '@/types/SchemaFields';


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
            [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.Cohost1],
            [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.Cohost2],
            [SpecUSRSetFields.SpecUSRDetail, SpecUSRDetailFields.Commissioned],
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


interface ISpecUSRFormProps { Theme: IFETheme; Lang: string | Lang; }

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

    const allCols = [SpecUSRDetailFields.Year, SpecUSRDetailFields.AcademicYear, SpecUSRDetailFields.Courses, SpecUSRDetailFields.ProjectLeader,
    SpecUSRDetailFields.PracticeField, SpecUSRDetailFields.ProjectName, SpecUSRDetailFields.ExternalCooperationUnit,
    SpecUSRDetailFields.Department, SpecUSRDetailFields.ProjectItem, SpecUSRDetailFields.PlanAmount, SpecUSRDetailFields.DuringExecution,
    SpecUSRDetailFields.ExecutionStrategy, SpecUSRDetailFields.ContentIntroduction, SpecUSRDetailFields.ProjectConcept, SpecUSRDetailFields.ProjectHighlights,
    SpecUSRDetailFields.Cohost1, SpecUSRDetailFields.Cohost2, SpecUSRDetailFields.Commissioned, SpecUSRDetailFields.Remark]
    const header = rawData.SpecUSR;
    const detail = rawData.SpecUSRDetail?.find(p => p.Lang === lang);
    const [open, setOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const images = (header?.PictureId ? [{
        src: `${FileManagementAPI.PREVIEW_URL}/${header.PictureId}`,
        title: `${header.PicDescription ?? ""}`
    }]
        : []
    );


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
                                                <div className="img-box" style={{ cursor: "pointer" }} onClick={() => { setCurrentIndex(idx); setOpen(true); }} title={img.title}>
                                                    <img src={img.src} alt={img.title} className="img-fluid" />
                                                    <div className="zoom-plus">
                                                        <i className="fa fa-zoom-plus" aria-hidden="true"></i>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {detail?.Url?.trim() && (
                            <div className="tr__Box">
                                <div className="td__ col-sm-2 col-12 before_line d-flex justify-content-end align-content-center p-0">
                                    <div className="ttBox_L">{showColTitle.find(p => p.key === "Url")?.title}</div>
                                </div>
                                <div className="td__ col-sm-10 col-12 d-flex justify-content-start align-content-center p-0">
                                    <div className="ttBox_R">
                                        <a href={detail?.Url ?? ""} target="_blank" rel="noopener noreferrer" className="btn btn-default">
                                            <i className="fa fa-link"></i> {detail?.UrlDescription}</a>
                                    </div>
                                </div>
                            </div>)}

                    </div>
                </article>
            </div>
            {open && (
                <Lightbox open={open} close={() => setOpen(false)} slides={images}
                    index={currentIndex} plugins={[Download, Share, Fullscreen, Zoom, Thumbnails]}
                // plugins={[Download, Share, Captions, Counter, Fullscreen, Inline, Slideshow, Thumbnails, Video, Zoom]}
                />
            )}
        </div>
    )
}