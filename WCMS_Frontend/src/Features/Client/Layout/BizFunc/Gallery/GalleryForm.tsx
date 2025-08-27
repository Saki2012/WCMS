import type { IFETheme } from '../../Theme/ITheme';
import type { components } from '../../../../../types/api';
type GallerySet = components["schemas"]["GallerySet_DTO"]
type GalleryPhotos = components["schemas"]["GalleryPhotos_DTO"]
type GalleryPhotoInfo = components["schemas"]["GalleryPhotosInfo_DTO"]
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
import { GalleryFormViewComp, type GalleryFormViewProps, type PhotoInfos } from '../../Scaffold/ContentViewMode/GalleryView/GalleryFormView';

const emptyData: GallerySet = {}


interface IGalleryFormProps { Theme: IFETheme; Lang: string | Lang }

export const GalleryFormComp = (props: IGalleryFormProps) => {
    const { internalId } = useParams()
    const useGalleryFormData = useFetchFormData<GallerySet>(GalleryProvider(), internalId, emptyData)

    const isLoading = [useGalleryFormData.isLoading];
    const errors = [useGalleryFormData.error];

    const title = useGalleryFormData.data?.GalleryInfo?.find(p => p.Lang === props.Lang)?.Title ?? "";

    const rawContent = useGalleryFormData.data?.GalleryInfo?.find(p => p.Lang === props.Lang)?.Content ?? "";
    const parseContent = useResolveInternalIds(rawContent, { locale: props.Lang });
    const safeHtml = useMemo(() => DOMPurify.sanitize(parseContent.html ?? ''), [parseContent.html])
    const content = safeHtml ? parse(safeHtml) : null;
    const photoInfo = GetPhotoInfos(props.Lang, useGalleryFormData.data?.GalleryPhotos ?? [], useGalleryFormData.data?.GalleryPhotosInfo ?? [])
    return (<GalleryFormViewComp Title={title} CategoryName="" Content={content} photoInfoProps={photoInfo} LoadingList={isLoading} ErrorList={errors} />);
}

const GetPhotoInfos = (lang: string, photos: GalleryPhotos[], photoInfo: GalleryPhotoInfo[]): PhotoInfos[] => {
    const result: PhotoInfos[] = []
    photos.map((item) => {
        result.push({ pictureInternalId: item.PicSrcId ?? "" })
    })
    return result;
}