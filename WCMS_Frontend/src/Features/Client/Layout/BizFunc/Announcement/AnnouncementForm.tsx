import type { IFETheme } from '../../Theme/ITheme';
import type { components } from '../../../../../types/api';
type AnnouncementSet = components["schemas"]["AnnouncementSet"]
import { useParams } from 'react-router-dom';
import { ContentComp } from '../../Scaffold/ContentViewMode/FormView/FormView_Comp';
import { FormatDate } from '../../../../../SysCore/Utils/Library/LibData';
import parse from 'html-react-parser';
import DOMPurify from 'isomorphic-dompurify'
import AnnouncementProvider from '../../../../Server/Layout/BizFunc/WebManagement/Announcement/Announcement_Api';
import { useFetchFormData } from '../../../../../SysCore/Utils/API/FetchFormData';
import { useResolveInternalIds } from '../../../../../SysCore/Components/File/useResolveInternalIds';
import { useMemo } from 'react';


const emptyData: AnnouncementSet = {
    Announcement: {},
    AnnouncementDetail: []
}
export const PageContentComp = ({ theme }: { theme: IFETheme }) => {
    const { internalId } = useParams()
    const useAnnouncementFormData = useFetchFormData<AnnouncementSet>(AnnouncementProvider(), internalId, emptyData)
    // const adjustedGrid = useMemo(() => { return SetAdjustFunction(dirUrl, useAnnounceList.gridProps, useAnnounceList.rawData);}, [useAnnounceList.gridProps, useAnnounceList.rawData]);

    const title = useAnnouncementFormData.data?.AnnouncementDetail?.[0]?.Title ?? "";
    const href = useAnnouncementFormData.data?.AnnouncementDetail?.[0]?.Url as string
    const startDate = FormatDate(useAnnouncementFormData.data?.Announcement?.Validate_Start)

    const rawContent = useAnnouncementFormData.data?.AnnouncementDetail?.[0]?.Content ?? '';
    const parseContent = useResolveInternalIds(rawContent, { locale: "zh-TW" });

    const safeHtml = useMemo(() => DOMPurify.sanitize(parseContent.html ?? ''), [parseContent.html])
    const content = safeHtml ? parse(safeHtml) : null;
    // const categories = [useAnnouncementFormData.data.Announcement.Categories]
    // const tags = [useAnnouncementFormData.data.Announcement?.Tags]

    const isLoading = [useAnnouncementFormData.isLoading, parseContent.loading];
    const errors = [useAnnouncementFormData.error];

    return (
        <ContentComp Theme={theme} LoadingList={isLoading} ErrorList={errors}
            Title={title} StartDate={startDate}
            // Category={categories} Tag={tags}
            Content={content} Href={href}
        />
    );
}

