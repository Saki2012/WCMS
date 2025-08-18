import type { components } from "../../../../../types/api";
import type { IFETheme } from "../../Theme/ITheme";
type AnnouncementSet = components["schemas"]["AnnouncementSet"];
import { useParams } from "react-router-dom";
import { useFetchFormData } from "../../../../../SysCore/Utils/FetchFormData";
import { ContentComp } from "../../Scaffold/ContentViewMode/FormView/FormView_Comp";

interface PageContentProps
{
    lang: string;
    pageId: string;
    theme: IFETheme;
}
export const PageContentComp = ({ lang, pageId, theme }: PageContentProps) =>
{
    const { internalId } = useParams();
    const formData = useFetchFormData(lang, pageId);
    // const useAnnouncementFormData = useGetAnnouncementFormData(internalId as string);
    // const adjustedGrid = useMemo(() => { return SetAdjustFunction(dirUrl, useAnnounceList.gridProps, useAnnounceList.rawData);}, [useAnnounceList.gridProps, useAnnounceList.rawData]);
    // const isLoading=[useAnnouncementFormData.isLoading];
    // const errors=[useAnnouncementFormData.error];
    // const title = useAnnouncementFormData.data?.AnnouncementDetail[0]?.Title
    return (
        <>
            <div className="page-header mb-3">
                <h3>{title}</h3>
                <div className="dotted_line"></div>
            </div>
            <Content />
            <br />
            <br />
        </>
    );
};
