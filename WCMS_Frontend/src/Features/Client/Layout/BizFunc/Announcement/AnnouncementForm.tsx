import type { IFETheme } from '../../Theme/ITheme';
import type { components } from '../../../../../types/api';
type AnnouncementSet = components["schemas"]["AnnouncementSet"]
import { data, useParams } from 'react-router';
import { ContentComp } from '../../Scaffold/ContentViewMode/FormView/FormView_Comp';
import { FormatDate } from '../../../../../SysCore/Utils/LibData';
import parse from 'html-react-parser';
import createDOMPurify from 'dompurify';
import AnnouncementProvider from '../../../../Server/Layout/BizFunc/WebManagement/Announcement/Announcement_Api';
import { useFetchFormData } from '../../../../../SysCore/Utils/FetchFormData';
import { useResolveInternalIds } from '../../../../../SysCore/Components/File/useResolveInternalIds';


const emptyData:AnnouncementSet={
    Announcement:{},
    AnnouncementDetail:[]
}
export const PageContentComp =({theme}:{theme:IFETheme}) => {
    const { internalId } = useParams()
    const useAnnouncementFormData = useFetchFormData<AnnouncementSet>(AnnouncementProvider(),internalId,emptyData)
    // const adjustedGrid = useMemo(() => { return SetAdjustFunction(dirUrl, useAnnounceList.gridProps, useAnnounceList.rawData);}, [useAnnounceList.gridProps, useAnnounceList.rawData]);


    const title = useAnnouncementFormData.data?.AnnouncementDetail?.[0]?.Title ?? "";
    const startDate =FormatDate(useAnnouncementFormData.data?.Announcement?.Validate_Start)

    const DOMPurify = createDOMPurify(window); // 綁定瀏覽器 DOM
    const rawContent = useAnnouncementFormData.data?.AnnouncementDetail?.[0]?.Content ?? '';
    const parseContent = useResolveInternalIds(typeof rawContent === "string" ? rawContent : "",{ locale: "zh-TW" });

    const safeHtml = typeof parseContent.html === 'string' ? DOMPurify.sanitize(parseContent.html) : '';
    const content = safeHtml ? parse(safeHtml) : null;
    const href=useAnnouncementFormData.data?.AnnouncementDetail?.[0]?.Url
    // const categories = [useAnnouncementFormData.data.Announcement.Categories]
    // const tags = [useAnnouncementFormData.data.Announcement?.Tags]

    const isLoading=[useAnnouncementFormData.isLoading,parseContent.loading];
    const errors=[useAnnouncementFormData.error];

  return (
        <ContentComp Theme={theme} LoadingList={isLoading} ErrorList={errors} 
                        Title={title} StartDate={startDate} 
                        // Category={categories} Tag={tags}
                        Content={content} Href={href} 
        />
    );
}

