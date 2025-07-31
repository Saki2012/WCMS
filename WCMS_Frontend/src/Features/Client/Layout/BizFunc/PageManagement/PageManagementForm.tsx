import type { IFETheme } from '../../Theme/ITheme';
import type { components } from '../../../../../types/api';
type AnnouncementSet = components["schemas"]["AnnouncementSet"]
import { data, useParams } from 'react-router';
import { ContentComp } from '../../Scaffold/ContentViewMode/FormView/FormView_Comp';
import { useGetAnnouncementFormData } from '../../../../Server/Layout/BizFunc/WebManagement/Announcement/Announcement_Hook';


export const PageContentComp =({theme}:{theme:IFETheme}) => {
    const { internalId } = useParams()
    const useAnnouncementFormData = useGetAnnouncementFormData(internalId as string);
    // const adjustedGrid = useMemo(() => { return SetAdjustFunction(dirUrl, useAnnounceList.gridProps, useAnnounceList.rawData);}, [useAnnounceList.gridProps, useAnnounceList.rawData]);
    const isLoading=[useAnnouncementFormData.isLoading];
    const errors=[useAnnouncementFormData.error];
    const title = useAnnouncementFormData.data?.AnnouncementDetail[0]?.Title
  return (
        <ContentComp Title={title} StartDate={"123/456/789"} Theme={theme} LoadingList={isLoading} ErrorList={errors} />
    );
}

