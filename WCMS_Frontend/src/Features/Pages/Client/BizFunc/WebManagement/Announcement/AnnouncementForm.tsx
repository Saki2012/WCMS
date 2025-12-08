import type { IFETheme } from '@/Features/Pages/Client/Theme/ITheme';
import type { components } from '@/types/api';
import AnnouncementProvider from '@/Features/Hooks/BizFunc/WebManagement/Announcement/Announcement_Api';
import { useFetchFormData } from '@/SysCore/Utils/API/FetchFormData';
import type { Lang } from '@/SysCore/i18n/lang';
import { useParams } from 'react-router';
import { CategoryDataSetFields, CategoryDetailFields, CategoryFields, TagDataFields, TagDetailFields, TagSetFields } from '@/types/SchemaFields';
import type { IDataProvider } from '@/SysCore/Interface/IApiProvider';
import { useFetchGridListData } from '@/SysCore/Utils/API/FetchGridListData';
import { useMemo } from 'react';
import parse from 'html-react-parser';
import TagProvider from '@/Features/Hooks/BizFunc/WebManagement/Tags/Tag_Api';
import CategoryProvider from '@/Features/Hooks/BizFunc/WebManagement/Category/Category_Api';
import ModuleContent, { type SubTitleProps } from '@/Features/Pages/Client/Scaffold/SubPages/Section/ModuleContent';
import { useResolveInternalIds } from '@/SysCore/Components/File/useResolveInternalIds';
import { FileManagementAPI } from '@/SysCore/Utils/API/APIClient';
import { FormatDate } from '@/SysCore/Utils/Library/LibData';
import type { INormNode } from '@/Features/Pages/Client/Route/Site-Routing';
type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"]
type CategoryDataSet = components["schemas"]["CategoryDataSet_DTO"]
type TagSet = components["schemas"]["TagSet_DTO"]
const emptyData: AnnouncementSet = { Announcement: {}, AnnouncementDetail: [] }
interface IAnnouncementFormProps { node: INormNode; theme: IFETheme; lang: Lang }
const AnnouncementForm = (props: IAnnouncementFormProps) => {
    const { internalId } = useParams()
    const provider = useMemo(() => { return { announceProvider: AnnouncementProvider(), tagProvider: TagProvider(), categoryProvider: CategoryProvider() } }, []);
    const useAnnouncementFormData = useFetchFormData<AnnouncementSet>(provider.announceProvider, internalId, emptyData)
    const srcCategories = useAnnouncementFormData.data?.Announcement?.Categories ?? "";
    const srcTags = useAnnouncementFormData.data?.Announcement?.Tags ?? "";
    const useCategories = useGetCategories(provider.categoryProvider, props.lang as string, srcCategories);
    const useTags = useGetTags(provider.tagProvider, props.lang as string, srcTags);
    const loadingList = [useAnnouncementFormData.isLoading, useCategories.isLoading, useTags.isLoading];
    const errorList = [useAnnouncementFormData.error, useCategories.error, useTags.error];
    const detail = useAnnouncementFormData.data?.AnnouncementDetail?.find(d => (d.Lang ?? "").toLowerCase() === props.lang)
    const startDate = FormatDate(useAnnouncementFormData.data?.Announcement?.Validate_Start);
    const cats = (useCategories.rawData ?? []).flatMap(item => (item.CategoryDetail ?? []).filter(detail => detail.Lang === props.lang).map(detail => detail.CategoryName)) as string[];
    const tags = (useTags.rawData ?? []).flatMap(item => (item.TagDetail ?? []).filter(detail => detail.Lang === props.lang).map(detail => detail.TagName)) as string[];
    const subTitle: SubTitleProps = { cat: cats.join('、'), tag: tags.join('、'), date: startDate }
    return (
        <ModuleContent nodeTitle={props.node.title} title={detail?.Title ?? ""} subTitle={subTitle} loadingList={loadingList} errorList={errorList}>
            <Content lang={props.lang} data={useAnnouncementFormData.data} />
        </ModuleContent>
    )
}
export default AnnouncementForm
const Content = (props: { lang: Lang; data: AnnouncementSet }) => {
    const detail = props.data.AnnouncementDetail?.find(d => (d.Lang ?? "").toLowerCase() === props.lang)
    const fileDetail = props.data.AnnouncementDetailFile?.filter(p => p.AnnouncementId === detail?.AnnouncementId && p.ParentRowId === detail?.RowId);
    const parseContent = useResolveInternalIds(detail?.Content ?? "", { locale: props.lang });
    const content = parseContent.html ? parse(parseContent.html) : null;
    const url = detail?.Url
    return (
        <>
            {content}
            {url && fileDetail && fileDetail.length > 0 && <hr className="hr-my-4" />}
            {url && <>
                <div className="row">
                    <div className="col-xl-6 col-lg-6 col-md-6 col-sm-12 col-12">
                        <div className="Standard_btnDiv">
                            <a href={url} className="btn btn_NEWS bg_urllink_NEWS" role="button" aria-label="分享" target="_blank" title="[ 另開新視窗 ]" tabIndex={0}>
                                <span><i className="fas fa-link + link + ml-0 mr-2"></i><span className="sr-only">{detail.UrlDescription ?? ""}</span></span>
                                <span className="URL_link_NEWS">{detail.UrlDescription ?? ""}</span>
                            </a>
                        </div>
                    </div>
                </div>
                <hr className="hr-my-4" />
            </>}
            {fileDetail && fileDetail.length > 0 && <>
                < div className="row">
                    {
                        fileDetail.map((itme) => {
                            return (
                                <div className="col-xl-6 col-lg-6 col-md-6 col-sm-12 col-12">
                                    <div className="Standard_btnDiv">
                                        <a href={`${FileManagementAPI.DOWNLOAD_URL}/${itme.FileId}`} className="btn btn_NEWS bg_urllink_NEWS" role="button" aria-label="分享" target="_blank" title="[ 另開新視窗 ]" tabIndex={0}>
                                            <span><i className="fas fa-paperclip + link + ml-0 mr-2"></i><span className="sr-only">{itme.FileName}</span></span>
                                            <span className="URL_link_NEWS">{itme.FileName}</span>
                                        </a>
                                    </div>
                                </div>
                            )
                        })

                    }
                </div >
                < hr className="hr-my-4" />
            </>}
        </>
    )
}
const buildInList = (csv?: string) => (csv ?? "").split(",").map(s => s.trim()).filter(Boolean).map(s => `${s}`).join(",");
const useGetCategories = (provider: IDataProvider<CategoryDataSet>, lang: string, categoryIds: string) => {
    const inList = buildInList(categoryIds);
    var condition: string = `${CategoryFields.CategoryId} HasAny [${inList}] And ${CategoryFields._CategoryDetail}.${CategoryDetailFields.Lang} = ${lang}`;
    return useFetchGridListData<CategoryDataSet>({
        getModelDisplayName: () => provider.getModelDisplayName(),
        fetchList: (cond) => provider.fetchList(cond),
        fetchListCount: (cond) => provider.fetchListCount(cond),
        visibleKeys: [
            [CategoryDataSetFields.Category, CategoryFields.CategoryId],
            [CategoryDataSetFields.CategoryDetail, CategoryDetailFields.Lang],
            [CategoryDataSetFields.CategoryDetail, CategoryDetailFields.CategoryName],
        ],
        buildQueryCondition: () => ({
            Fields: [
                CategoryFields.CategoryId,
                `${CategoryFields._CategoryDetail}.${CategoryDetailFields.Lang}`,
                `${CategoryFields._CategoryDetail}.${CategoryDetailFields.CategoryName}`,
            ],
            Condition: condition,
            PageNumber: 0,
            PageSize: 0,
        }),
        enabled: !!categoryIds.trim(),          // 沒 id 不查
        deps: [lang, categoryIds],        // ids/lang 改變就 refetch
    });
};
const useGetTags = (provider: IDataProvider<TagSet>, lang: string, tagIds: string) => {
    const inList = buildInList(tagIds);
    var condition: string = `${TagDataFields.TagId} HasAny [${inList}] And ${TagDataFields._TagDetail}.${TagDetailFields.Lang} = ${lang}`;
    return useFetchGridListData<TagSet>({
        getModelDisplayName: () => provider.getModelDisplayName(),
        fetchList: (cond) => provider.fetchList(cond),
        fetchListCount: (cond) => provider.fetchListCount(cond),
        visibleKeys: [
            [TagSetFields.TagData, TagDataFields.TagId],
            [TagSetFields.TagDetail, TagDetailFields.Lang],
            [TagSetFields.TagDetail, TagDetailFields.TagName],
        ],
        buildQueryCondition: () => ({
            Fields: [
                TagDataFields.TagId,
                `${TagDataFields._TagDetail}.${TagDetailFields.Lang}`,
                `${TagDataFields._TagDetail}.${TagDetailFields.TagName}`,
            ],
            Condition: condition,
            PageNumber: 0,
            PageSize: 0,
        }),
        enabled: !!tagIds.trim(),          // 沒 id 不查
        deps: [lang, tagIds],        // ids/lang 改變就 refetch
    });
};