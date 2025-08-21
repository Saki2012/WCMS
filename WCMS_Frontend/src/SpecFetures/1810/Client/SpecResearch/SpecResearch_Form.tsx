import type { IFETheme } from '../../../../Features/Client/Layout/Theme/ITheme';
import type { components } from '../../../../types/api';
type SpecResearchSet = components["schemas"]["SpecResearchSet"]
import { useParams } from 'react-router-dom';
import type { Lang } from '../../../../SysCore/i18n/lang';
import { useFetchFormData } from '../../../../SysCore/Utils/API/FetchFormData';
import SpecResearchProvider from '../../Server/BizFunc/SpecResearch/SpecResearch_Api';

const emptyData: SpecResearchSet = {}

interface ISpecResearch_FormProps { Theme: IFETheme; Lang: string | Lang }

export const SpecResearch_Form_Comp = (props: ISpecResearch_FormProps) => {
    const { internalId } = useParams()
    const useAnnouncementFormData = useFetchFormData<SpecResearchSet>(SpecResearchProvider(), internalId, emptyData)
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

