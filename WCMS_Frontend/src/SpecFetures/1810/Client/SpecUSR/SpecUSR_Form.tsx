import type { IFETheme } from '../../../../Features/Pages/Client/Theme/ITheme';
import type { components } from '../../../../types/api';
type SpecUSRSet = components["schemas"]["SpecUSRSet_DTO"]
import { useParams } from 'react-router-dom';
import type { Lang } from '../../../../SysCore/i18n/lang';
import SpecUSRProvider from '../../Server/BizFunc/SpecUSR/SpecUSR_Api';
import { useFetchFormData } from '../../../../SysCore/Utils/API/FetchFormData';
import { useGetShowColumnItems } from './SpecUSR_List';
import LoadingErrorHandler from '../../../../SysCore/Components/LoadingErrorHandler';
import * as SchemaFields from "../../../../types/SchemaFields"
import { useFetchGridListData } from '../../../../SysCore/Utils/API/FetchGridListData';
import type { ColumnConfig } from '../../../../SysCore/Components/Grid/Grid_Data';
import DefaultPic from "@/Assets/1810/images_960x960.jpg"

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


interface ISpecUSRFormProps { Theme: IFETheme; Lang: string | Lang }

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

const SpecUSRForm = ({ lang, rawData, showColumns, showColTitle }: { lang: string | Lang; rawData: SpecUSRSet; showColumns: string[]; showColTitle: ColumnConfig[] }) => {

    const allCols = ["Year", "AcademicYear", "Courses", "PracticeField", "ProjectName",
        "ExternalCooperationUnit", "Department", "PlanAmount", "DuringExecution", "ExecutionStrategy",
        "ContentIntroduction", "ProjectConcept", "ProjectHighlights", "ProjectLeader", "Cohost1",
        "Cohost2", "Commissioned", "Remark"]
    const header = rawData.SpecUSR;
    const detail = rawData.SpecUSRDetail?.find(p => p.Lang === lang);

    const picUrl = header?.PictureId ? `/Service/FileManagement/Preview/${header?.PictureId}` : DefaultPic
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
                                    <div className="card_image_link">
                                        <a className="venobox vbox-item" data-vbtype="img" href={picUrl} tabIndex={1} title={header?.PicDescription ?? ""} target="_blank">
                                            <picture><img className="card_image" src={picUrl} alt={header?.PicDescription ?? ""} /></picture>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </article>
            </div>
        </div>
    )
}