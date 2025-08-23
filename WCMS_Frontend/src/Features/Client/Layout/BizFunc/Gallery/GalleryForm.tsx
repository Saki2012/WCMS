import type { IFETheme } from '../../Theme/ITheme';
import type { components } from '../../../../../types/api';
type GallerySet = components["schemas"]["GallerySet_DTO"]
import { useParams } from 'react-router-dom';
import { ContentComp } from '../../Scaffold/ContentViewMode/FormView/FormView_Comp';
import { FormatDate } from '../../../../../SysCore/Utils/Library/LibData';
import parse from 'html-react-parser';
import DOMPurify from 'isomorphic-dompurify'
import GalleryProvider from '../../../../Server/Layout/BizFunc/WebManagement/Gallery/Gallery_Api';
import { useFetchFormData } from '../../../../../SysCore/Utils/API/FetchFormData';
import { useResolveInternalIds } from '../../../../../SysCore/Components/File/useResolveInternalIds';
import { useMemo } from 'react';
import type { Lang } from '../../../../../SysCore/i18n/lang';

const emptyData: GallerySet = {
    // Gallery: {},
    GalleryInfo: []
}


interface IGalleryFormProps { Theme: IFETheme; Lang: string | Lang }

export const GalleryFormComp = (props: IGalleryFormProps) => {
    const { internalId } = useParams()
    const useGalleryFormData = useFetchFormData<GallerySet>(GalleryProvider(), internalId, emptyData)
    // const adjustedGrid = useMemo(() => { return SetAdjustFunction(dirUrl, useAnnounceList.gridProps, useAnnounceList.rawData);}, [useAnnounceList.gridProps, useAnnounceList.rawData]);

    // const title = useGalleryFormData.data?.GalleryDetail?.[0]?.Title ?? "";
    // const href = useGalleryFormData.data?.GalleryDetail?.[0]?.Url as string
    // const startDate = FormatDate(useGalleryFormData.data?.Gallery?.Validate_Start)

    // const rawContent = useGalleryFormData.data?.GalleryDetail?.[0]?.Content ?? '';
    // const parseContent = useResolveInternalIds(rawContent, { locale: props.Lang });

    // const safeHtml = useMemo(() => DOMPurify.sanitize(parseContent.html ?? ''), [parseContent.html])
    // const content = safeHtml ? parse(safeHtml) : null;
    // // const categories = [useGalleryFormData.data.Gallery.Categories]
    // // const tags = [useGalleryFormData.data.Gallery?.Tags]

    // const isLoading = [useGalleryFormData.isLoading, parseContent.loading];
    // const errors = [useGalleryFormData.error];

    return (
        <></>
        // <ContentComp Theme={props.Theme} LoadingList={isLoading} ErrorList={errors}
        //     Title={title} StartDate={startDate}
        //     // Category={categories} Tag={tags}
        //     Content={content} Href={href}
        // />
    );
}

