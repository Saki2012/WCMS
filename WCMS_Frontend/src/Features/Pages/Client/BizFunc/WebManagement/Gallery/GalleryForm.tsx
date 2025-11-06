import type { IFETheme } from '@/Features/Pages/Client/Theme/ITheme';
import type { components } from '@/types/api';
import { useParams } from 'react-router-dom';
import parse from 'html-react-parser';
import GalleryProvider from '@/Features/Hooks/BizFunc/WebManagement/Gallery/Gallery_Api';
import { useFetchFormData } from '@/SysCore/Utils/API/FetchFormData';
import { useResolveInternalIds } from '@/SysCore/Components/File/useResolveInternalIds';
import type { Lang } from '@/SysCore/i18n/lang';
import * as SchemaFields from "@/types/SchemaFields";
import CategoryProvider from '@/Features/Hooks/BizFunc/WebManagement/Category/Category_Api';
import { useFetchGridListData } from '@/SysCore/Utils/API/FetchGridListData';
import { useState, type ReactNode } from 'react';
import "yet-another-react-lightbox/plugins/captions.css";
import "yet-another-react-lightbox/plugins/counter.css";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import { FileManagementAPI } from '@/SysCore/Utils/API/APIClient';
import LoadingErrorHandler from '@/SysCore/Components/LoadingErrorHandler';
import Download from "yet-another-react-lightbox/plugins/download";
import Share from "yet-another-react-lightbox/plugins/share";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Counter from "yet-another-react-lightbox/plugins/counter";
import Lightbox from 'yet-another-react-lightbox';

type GallerySet = components["schemas"]["GallerySet_DTO"]
type GalleryPhotos = components["schemas"]["GalleryPhotos_DTO"]
type GalleryPhotoInfo = components["schemas"]["GalleryPhotosInfo_DTO"]
type CategoryDataSet = components["schemas"]["CategoryDataSet_DTO"]

const emptyData: GallerySet = {}
const buildInList = (csv?: string) =>
    (csv ?? "")
        .split(",")
        .map(s => s.trim())
        .filter(Boolean)
        .map(s => `${s}`)
        .join(",");
const useGetCategories = (lang: string, categoryIds: string) => {
    const inList = buildInList(categoryIds);
    var condition: string = `${SchemaFields.CategoryFields.CategoryId} HasAny [${inList}] And ${SchemaFields.CategoryDetailFields.Lang} = ${lang}`;
    const provider = CategoryProvider();
    return useFetchGridListData<CategoryDataSet>({
        getModelDisplayName: () => provider.getModelDisplayName(),
        fetchList: (cond) => provider.fetchList(cond),
        fetchListCount: (cond) => provider.fetchListCount(cond),
        visibleKeys: [
            [SchemaFields.CategoryDataSetFields.Category, SchemaFields.CategoryFields.CategoryId],
            [SchemaFields.CategoryDataSetFields.CategoryDetail, SchemaFields.CategoryDetailFields.Lang],
            [SchemaFields.CategoryDataSetFields.CategoryDetail, SchemaFields.CategoryDetailFields.CategoryName],
        ],
        buildQueryCondition: () => ({
            Fields: [
                SchemaFields.CategoryFields.CategoryId,
                `${SchemaFields.CategoryFields._CategoryDetail}.${SchemaFields.CategoryDetailFields.Lang}`,
                `${SchemaFields.CategoryFields._CategoryDetail}.${SchemaFields.CategoryDetailFields.CategoryName}`,
            ],
            Condition: condition,
            PageNumber: 0,
            PageSize: 0,
        }),
        enabled: !!categoryIds.trim(),          // 沒 id 不查
        deps: [lang, categoryIds],        // ids/lang 改變就 refetch
    });
};

export const GalleryFormComp = (prop: { theme: IFETheme; lang: Lang }) => {
    const { internalId } = useParams()
    const useGalleryFormData = useFetchFormData<GallerySet>(GalleryProvider(), internalId, emptyData)
    const srcCategories = useGalleryFormData.data?.Gallery?.Categories ?? "";
    const useCategories = useGetCategories(prop.lang, srcCategories);
    const isLoading = [useGalleryFormData.isLoading, useCategories.isLoading];
    const errors = [useGalleryFormData.error, useCategories.error];
    const title = useGalleryFormData.data?.GalleryInfo?.find(p => p.Lang === prop.lang)?.Title ?? "";
    const rawContent = useGalleryFormData.data?.GalleryInfo?.find(p => p.Lang === prop.lang)?.Content ?? "";
    const parseContent = useResolveInternalIds(rawContent, { locale: prop.lang });
    const content = parseContent.html ? parse(parseContent.html) : null;
    const photoInfo = GetPhotoInfos(prop.lang, useGalleryFormData.data?.GalleryPhotos ?? [], useGalleryFormData.data?.GalleryPhotosInfo ?? [])
    const cats = (useCategories.rawData ?? []).flatMap(item => (item.CategoryDetail ?? []).filter(detail => detail.Lang === prop.lang).map(detail => detail.CategoryName)).join(", ");
    return (<GalleryFormViewComp Title={title} CategoryName={cats} Content={content} photoInfoProps={photoInfo} LoadingList={isLoading} ErrorList={errors} />);
}
const GetPhotoInfos = (lang: Lang, photos: GalleryPhotos[], photoInfo: GalleryPhotoInfo[]): PhotoInfos[] => {
    const result: PhotoInfos[] = []
    photos.map((item) => {
        result.push({
            pictureInternalId: item.PicSrcId ?? "",
            pictureDescription: photoInfo.find(p => p.ParentRowId === item.RowId && p.Lang === lang)?.Title ?? ""
        })
    })
    return result;
}






interface GalleryFormViewProps {
    Title: string;
    CategoryName: string;
    Content: ReactNode;
    photoInfoProps: PhotoInfos[];
    LoadingList: boolean[];
    ErrorList: (string | null | undefined)[];
}

interface PhotoInfos {
    pictureInternalId: string;
    pictureDescription: string;
}


const GalleryFormViewComp = (prop: GalleryFormViewProps) => {
    const [open, setOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    const images = prop.photoInfoProps.map((item) => ({ src: `${FileManagementAPI.PREVIEW_URL}/${item.pictureInternalId}`, description: item.pictureDescription, }));

    return (
        <LoadingErrorHandler loadingList={prop.LoadingList} errorList={prop.ErrorList}>
            <TitleContentBar title={prop.Title} categoryName={prop.CategoryName} content={prop.Content} />
            <div className="row mt-3">
                {images.map((img, idx) => (
                    <div className="col-xs-12 col-sm-6 col-md-6 col-lg-3 photo_one_pic_standardbox" key={img.src}>
                        <div className="lightbox">
                            <div className="img-box" style={{ cursor: "pointer" }} onClick={() => { setCurrentIndex(idx); setOpen(true); }} title={img.description}>
                                <img src={img.src} alt={img.description} className="img-fluid" />
                                <div className="zoom-plus">
                                    <i className="fa fa-zoom-plus" aria-hidden="true"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {open && (<Lightbox open={open} close={() => setOpen(false)} slides={images} index={currentIndex}
                plugins={[Download, Captions, Share, Counter, Fullscreen, Zoom, Thumbnails]} captions={{ descriptionTextAlign: "center" }} />
            )}
        </LoadingErrorHandler>
    );
};

const TitleContentBar = ({ title, categoryName, content, }: { title: string; categoryName: string; content: ReactNode; }) => (
    <>
        <div className="row">
            <div className="page-header">
                <h3>{title}</h3>
            </div>
            <div className="page_category_box">
                <div className="page_category">
                    <h4>
                        <i className="fa fa-bookmark" aria-hidden="true"></i> {categoryName}
                    </h4>
                </div>
            </div>
            {content}
        </div>
        <hr className="hr-Css" />
    </>
);
