import type { IFETheme } from '../../Theme/ITheme';
import type { components } from '../../../../../types/api';
type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"]
type CategoryDataSet = components["schemas"]["CategoryDataSet_DTO"]
type TagSet = components["schemas"]["TagSet_DTO"]
import * as SchemaFields from "../../../../../types/SchemaFields";
import { useParams } from 'react-router-dom';
import { ContentComp } from '../../Scaffold/ContentViewMode/FormView/FormView_Comp';
import { FormatDate } from '../../../../../SysCore/Utils/Library/LibData';
import parse from 'html-react-parser';
import DOMPurify from 'isomorphic-dompurify'
import AnnouncementProvider from '../../../../Server/Layout/BizFunc/WebManagement/Announcement/Announcement_Api';
import { useFetchFormData } from '../../../../../SysCore/Utils/API/FetchFormData';
import { useResolveInternalIds } from '../../../../../SysCore/Components/File/useResolveInternalIds';
import { useMemo } from 'react';
import type { Lang } from '../../../../../SysCore/i18n/lang';
import { useFetchGridListData } from '../../../../../SysCore/Utils/API/FetchGridListData';
import CategoryProvider from '../../../../Server/Layout/BizFunc/WebManagement/Category/Category_Api';
import TagProvider from '../../../../Server/Layout/BizFunc/WebManagement/Tags/Tag_Api';


const buildInList = (csv?: string) =>
    (csv ?? "")
        .split(",")
        .map(s => s.trim())
        .filter(Boolean)
        .map(s => `${s}`)
        .join(",");

const useGetCategories = (lang: string, categoryIds: string) => {
    const inList = buildInList(categoryIds);
    var condition: string = `${SchemaFields.CategoryFields.CategoryId} In (${inList}) And ${SchemaFields.CategoryDetailFields.Lang} = ${lang}`;
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

const useGetTags = (lang: string, tagIds: string) => {
    const inList = buildInList(tagIds);
    var condition: string = `${SchemaFields.TagDataFields.TagId} In (${inList}) And ${SchemaFields.TagDetailFields.Lang} = ${lang}`;
    const provider = TagProvider();
    return useFetchGridListData<TagSet>({
        getModelDisplayName: () => provider.getModelDisplayName(),
        fetchList: (cond) => provider.fetchList(cond),
        fetchListCount: (cond) => provider.fetchListCount(cond),
        visibleKeys: [
            [SchemaFields.TagSetFields.TagData, SchemaFields.TagDataFields.TagId],
            [SchemaFields.TagSetFields.TagDetail, SchemaFields.TagDetailFields.Lang],
            [SchemaFields.TagSetFields.TagDetail, SchemaFields.TagDetailFields.TagName],
        ],
        buildQueryCondition: () => ({
            Fields: [
                SchemaFields.TagDataFields.TagId,
                `${SchemaFields.TagSetFields.TagDetail}.${SchemaFields.TagDetailFields.Lang}`,
                `${SchemaFields.TagSetFields.TagDetail}.${SchemaFields.TagDetailFields.TagName}`,
            ],
            Condition: condition,
            PageNumber: 0,
            PageSize: 0,
        }),
        enabled: !!tagIds.trim(),          // 沒 id 不查
        deps: [lang, tagIds],        // ids/lang 改變就 refetch
    });
};


const emptyData: AnnouncementSet = {
    Announcement: {},
    AnnouncementDetail: []
}

interface IAnnouncementFormProps { Theme: IFETheme; Lang: string | Lang }

export const AnnouncementFormComp = (props: IAnnouncementFormProps) => {
    const { internalId } = useParams()
    const useAnnouncementFormData = useFetchFormData<AnnouncementSet>(AnnouncementProvider(), internalId, emptyData)
    const title = useAnnouncementFormData.data?.AnnouncementDetail?.[0]?.Title ?? "";
    const href = useAnnouncementFormData.data?.AnnouncementDetail?.[0]?.Url as string
    const startDate = FormatDate(useAnnouncementFormData.data?.Announcement?.Validate_Start)
    const rawContent = useAnnouncementFormData.data?.AnnouncementDetail?.[0]?.Content ?? '';
    const parseContent = useResolveInternalIds(rawContent, { locale: props.Lang });
    const safeHtml = useMemo(() => DOMPurify.sanitize(parseContent.html ?? ''), [parseContent.html])
    const content = safeHtml ? parse(safeHtml) : null;
    const srcCategories = useAnnouncementFormData.data?.Announcement?.Categories ?? "";
    const srcTags = useAnnouncementFormData.data?.Announcement?.Tags ?? "";
    const useCategories = useGetCategories(props.Lang as string, srcCategories);
    const useTags = useGetTags(props.Lang as string, srcTags);
    const isLoading = [useAnnouncementFormData.isLoading, parseContent.loading, useCategories.isLoading, useTags.isLoading];
    const errors = [useAnnouncementFormData.error, useCategories.error, useTags.error];
    const categories = (useCategories.rawData ?? []).flatMap(item => (item.CategoryDetail ?? []).filter(detail => detail.Lang === props.Lang).map(detail => detail.CategoryName)) as string[];
    const tags = (useTags.rawData ?? []).flatMap(item => (item.TagDetail ?? []).filter(detail => detail.Lang === props.Lang).map(detail => detail.TagName)) as string[];
    return (
        <ContentComp Theme={props.Theme} LoadingList={isLoading} ErrorList={errors}
            Title={title} StartDate={startDate}
            Category={categories} Tag={tags}
            Content={content} Href={href}
        />
    );
}

