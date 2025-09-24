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

import DefaultPic from "@/Assets/1810/images_960x960.jpg"
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
import type { PhotoInfos } from '@/Features/Pages/Client/Scaffold/ContentViewMode/GalleryView/GalleryFormView';


const emptyData: SpecUSRSet = {}

const useSpecUSRList = (internalId: string) => {
    const condition = `${SchemaFields.SpecUSRModelFields.InternalId} = ${internalId}`;
    const provider = SpecUSRProvider();
    return useFetchGridListData<SpecUSRSet>({
        getModelDisplayName: () => provider.getModelDisplayName(),
        fetchList: (cond) => provider.fetchList(cond),
        fetchListCount: (cond) => provider.fetchListCount(cond),
        visibleKeys: [
            [SchemaFields.SpecUSRSetFields.SpecUSR, SchemaFields.SpecUSRModelFields.PictureId],
            [SchemaFields.SpecUSRSetFields.SpecUSRDetail, SchemaFields.SpecUSRDetailFields.Year],
            [SchemaFields.SpecUSRSetFields.SpecUSRDetail, SchemaFields.SpecUSRDetailFields.AcademicYear],
            [SchemaFields.SpecUSRSetFields.SpecUSRDetail, SchemaFields.SpecUSRDetailFields.Courses],
            [SchemaFields.SpecUSRSetFields.SpecUSRDetail, SchemaFields.SpecUSRDetailFields.PracticeField],
            [SchemaFields.SpecUSRSetFields.SpecUSRDetail, SchemaFields.SpecUSRDetailFields.ProjectName],
            [SchemaFields.SpecUSRSetFields.SpecUSRDetail, SchemaFields.SpecUSRDetailFields.ExternalCooperationUnit],
            [SchemaFields.SpecUSRSetFields.SpecUSRDetail, SchemaFields.SpecUSRDetailFields.Department],
            [SchemaFields.SpecUSRSetFields.SpecUSRDetail, SchemaFields.SpecUSRDetailFields.PlanAmount],
            [SchemaFields.SpecUSRSetFields.SpecUSRDetail, SchemaFields.SpecUSRDetailFields.DuringExecution],
            [SchemaFields.SpecUSRSetFields.SpecUSRDetail, SchemaFields.SpecUSRDetailFields.ExecutionStrategy],
            [SchemaFields.SpecUSRSetFields.SpecUSRDetail, SchemaFields.SpecUSRDetailFields.ContentIntroduction],
            [SchemaFields.SpecUSRSetFields.SpecUSRDetail, SchemaFields.SpecUSRDetailFields.ProjectConcept],
            [SchemaFields.SpecUSRSetFields.SpecUSRDetail, SchemaFields.SpecUSRDetailFields.ProjectHighlights],
            [SchemaFields.SpecUSRSetFields.SpecUSRDetail, SchemaFields.SpecUSRDetailFields.ProjectLeader],
            [SchemaFields.SpecUSRSetFields.SpecUSRDetail, SchemaFields.SpecUSRDetailFields.Cohost1],
            [SchemaFields.SpecUSRSetFields.SpecUSRDetail, SchemaFields.SpecUSRDetailFields.Cohost2],
            [SchemaFields.SpecUSRSetFields.SpecUSRDetail, SchemaFields.SpecUSRDetailFields.Commissioned],
            [SchemaFields.SpecUSRSetFields.SpecUSRDetail, SchemaFields.SpecUSRDetailFields.Remark],
        ],
        buildQueryCondition: () => ({
            Fields: [
                SchemaFields.SpecUSRModelFields.InternalId,
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

    const allCols = ["Year", "AcademicYear", "Courses", "PracticeField", "ProjectName",
        "ExternalCooperationUnit", "Department", "PlanAmount", "DuringExecution", "ExecutionStrategy",
        "ContentIntroduction", "ProjectConcept", "ProjectHighlights", "ProjectLeader", "Cohost1",
        "Cohost2", "Commissioned", "Remark"]
    const header = rawData.SpecUSR;
    const detail = rawData.SpecUSRDetail?.find(p => p.Lang === lang);

    const [open, setOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const images = (header?.PictureId
        ? [{
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
                            if (!showColumns || showColumns.length === 0 || !showColumns.includes(colId)) return (<></>)
                            const title = showColTitle.find(p => p.key === colId)?.title ?? ""
                            const data = detail ? (detail as Record<string, any>)[colId] ?? "" : "";
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
                    </div>
                </article>
            </div>
            {open && (
                <Lightbox
                    open={open}
                    close={() => setOpen(false)}
                    slides={images}
                    index={currentIndex}
                    plugins={[Download, Share, Fullscreen, Zoom, Thumbnails]}
                // plugins={[Download, Share, Captions, Counter, Fullscreen, Inline, Slideshow, Thumbnails, Video, Zoom]}
                />
            )}
        </div>
    )
}