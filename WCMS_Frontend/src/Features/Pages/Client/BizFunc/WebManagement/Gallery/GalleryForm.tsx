import type { IFETheme } from '../../../Theme/ITheme';
import type { components } from '@/types/api';
import { useParams } from 'react-router-dom';
import parse from 'html-react-parser';
import GalleryProvider from '@/Features/Hooks/BizFunc/WebManagement/Gallery/Gallery_Api';
import { useFetchFormData } from '@/SysCore/Utils/API/FetchFormData';
import { useResolveInternalIds } from '@/SysCore/Components/File/useResolveInternalIds';
import type { Lang } from '@/SysCore/i18n/lang';
import { GalleryFormViewComp, type PhotoInfos } from '@/Features/Pages/Client/Scaffold/ContentViewMode/GalleryView/GalleryFormView';
import * as SchemaFields from "@/types/SchemaFields";
import CategoryProvider from '@/Features/Hooks/BizFunc/WebManagement/Category/Category_Api';
import { useFetchGridListData } from '@/SysCore/Utils/API/FetchGridListData';
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
    var condition: string = `${SchemaFields.CategoryFields.CategoryId} HasAny (${inList}) And ${SchemaFields.CategoryDetailFields.Lang} = ${lang}`;
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
                `${SchemaFields.CategoryDataSetFields.CategoryDetail}.${SchemaFields.CategoryDetailFields.Lang}`,
                `${SchemaFields.CategoryDataSetFields.CategoryDetail}.${SchemaFields.CategoryDetailFields.CategoryName}`,
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