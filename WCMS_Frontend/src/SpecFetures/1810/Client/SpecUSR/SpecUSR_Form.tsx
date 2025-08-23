import type { IFETheme } from '../../../../Features/Client/Layout/Theme/ITheme';
import type { components } from '../../../../types/api';
type SpecUSRSet = components["schemas"]["SpecUSRSet_DTO"]
import { useParams } from 'react-router-dom';
import parse from 'html-react-parser';
import DOMPurify from 'isomorphic-dompurify'
import { useMemo } from 'react';
import type { Lang } from '../../../../SysCore/i18n/lang';
import SpecUSRProvider from '../../Server/BizFunc/SpecUSR/SpecUSR_Api';
import { useFetchFormData } from '../../../../SysCore/Utils/API/FetchFormData';


const emptyData: SpecUSRSet = {
}

interface ISpecUSRFormProps { Theme: IFETheme; Lang: string | Lang }

export const SpecUSRFormComp = (props: ISpecUSRFormProps) => {
    const { internalId } = useParams()
    const useAnnouncementFormData = useFetchFormData<SpecUSRSet>(SpecUSRProvider(), internalId, emptyData)
    // const adjustedGrid = useMemo(() => { return SetAdjustFunction(dirUrl, useAnnounceList.gridProps, useAnnounceList.rawData);}, [useAnnounceList.gridProps, useAnnounceList.rawData]);

    // const title = useAnnouncementFormData.data?.AnnouncementDetail?.[0]?.Title ?? "";
    // const href = useAnnouncementFormData.data?.AnnouncementDetail?.[0]?.Url as string
    // const startDate = FormatDate(useAnnouncementFormData.data?.Announcement?.Validate_Start)

    // const rawContent = useAnnouncementFormData.data?.AnnouncementDetail?.[0]?.Content ?? '';
    // const parseContent = useResolveInternalIds(rawContent, { locale: props.Lang });

    // const safeHtml = useMemo(() => DOMPurify.sanitize(parseContent.html ?? ''), [parseContent.html])
    // const content = safeHtml ? parse(safeHtml) : null;
    // // const categories = [useAnnouncementFormData.data.Announcement.Categories]
    // // const tags = [useAnnouncementFormData.data.Announcement?.Tags]

    // const isLoading = [useAnnouncementFormData.isLoading, parseContent.loading];
    // const errors = [useAnnouncementFormData.error];

    return (
        <></>
        // <ContentComp Theme={props.Theme} LoadingList={isLoading} ErrorList={errors}
        //     Title={title} StartDate={startDate}
        //     // Category={categories} Tag={tags}
        //     Content={content} Href={href}
        // />
    );
}

