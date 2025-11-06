import type { IFETheme } from '@/Features/Pages/Client/Theme/ITheme';
import type { components } from '@/types/api';
type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"]
type AnnouncementDetailFile = components["schemas"]["AnnouncementDetailFile_DTO"]
type CategoryDataSet = components["schemas"]["CategoryDataSet_DTO"]
type TagSet = components["schemas"]["TagSet_DTO"]
import * as SchemaFields from "@/types/SchemaFields";
import { useNavigate, useParams } from 'react-router-dom';
import { FormatDate } from '@/SysCore/Utils/Library/LibData';
import parse from 'html-react-parser';
import AnnouncementProvider from '@/Features/Hooks/BizFunc/WebManagement/Announcement/Announcement_Api';
import { useFetchFormData } from '@/SysCore/Utils/API/FetchFormData';
import { useResolveInternalIds } from '@/SysCore/Components/File/useResolveInternalIds';
import type { Lang } from '@/SysCore/i18n/lang';
import { useFetchGridListData } from '@/SysCore/Utils/API/FetchGridListData';
import CategoryProvider from '@/Features/Hooks/BizFunc/WebManagement/Category/Category_Api';
import TagProvider from '@/Features/Hooks/BizFunc/WebManagement/Tags/Tag_Api';
import LoadingErrorHandler from '@/SysCore/Components/LoadingErrorHandler';
import { FileManagementAPI } from '@/SysCore/Utils/API/APIClient';
import { useCallback } from 'react';

const buildInList = (csv?: string) => (csv ?? "").split(",").map(s => s.trim()).filter(Boolean).map(s => `${s}`).join(",");
const useGetCategories = (lang: string, categoryIds: string) => {
    const inList = buildInList(categoryIds);
    var condition: string = `${SchemaFields.CategoryFields.CategoryId} HasAny [${inList}] And ${SchemaFields.CategoryFields._CategoryDetail}.${SchemaFields.CategoryDetailFields.Lang} = ${lang}`;
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
const useGetTags = (lang: string, tagIds: string) => {
    const inList = buildInList(tagIds);
    var condition: string = `${SchemaFields.TagDataFields.TagId} HasAny [${inList}] And ${SchemaFields.TagDataFields._TagDetail}.${SchemaFields.TagDetailFields.Lang} = ${lang}`;
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
                `${SchemaFields.TagDataFields._TagDetail}.${SchemaFields.TagDetailFields.Lang}`,
                `${SchemaFields.TagDataFields._TagDetail}.${SchemaFields.TagDetailFields.TagName}`,
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
    const srcCategories = useAnnouncementFormData.data?.Announcement?.Categories ?? "";
    const srcTags = useAnnouncementFormData.data?.Announcement?.Tags ?? "";
    const useCategories = useGetCategories(props.Lang as string, srcCategories);
    const useTags = useGetTags(props.Lang as string, srcTags);
    const isLoading = [useAnnouncementFormData.isLoading, useCategories.isLoading, useTags.isLoading];
    const errors = [useAnnouncementFormData.error, useCategories.error, useTags.error];
    return (
        <>
            <LoadingErrorHandler loadingList={isLoading} errorList={errors}>
                <Content lang={props.Lang} theme={props.Theme} data={useAnnouncementFormData.data} catData={useCategories.rawData} tagData={useTags.rawData}></Content>
            </LoadingErrorHandler>
        </>
    );
}

const Content = (prop: { lang: string; theme: IFETheme; data: AnnouncementSet; catData: CategoryDataSet[]; tagData: TagSet[] }) => {
    const langData = prop.data?.AnnouncementDetail?.find(p => p.Lang === prop.lang);
    const files = prop.data?.AnnouncementDetailFile?.filter(p => p.AnnouncementId === langData?.AnnouncementId && p.ParentRowId === langData?.RowId) ?? []
    const title = langData?.Title;
    const startDate = FormatDate(prop.data?.Announcement?.Validate_Start);
    const href = langData?.Url ?? ""
    const hrefName = langData?.UrlDescription ?? ""
    const rawContent = langData?.Content ?? "";
    const parseContent = useResolveInternalIds(rawContent, { locale: prop.lang });
    const content = parseContent.html ? parse(parseContent.html) : null;
    const cats = (prop.catData ?? []).flatMap(item => (item.CategoryDetail ?? []).filter(detail => detail.Lang === prop.lang).map(detail => detail.CategoryName)) as string[];
    const tags = (prop.tagData ?? []).flatMap(item => (item.TagDetail ?? []).filter(detail => detail.Lang === prop.lang).map(detail => detail.TagName)) as string[];
    return (<>
        <div className="page-header mb-3">
            <h3>{title}</h3>
            {startDate && (<><i className="fa fa-calendar"></i>{` ${startDate}`}</>)}
            {cats && cats.length > 0 && (<><i className="fa fa-tags ml-3"></i>{` ${cats.join('、')}`}</>)}
            {tags && tags.length > 0 && (<><i className="fa fa-bookmark ml-3"></i>{` ${tags.join('、')}`}</>)}
        </div>
        <div className="dotted_line"></div>
        {content}
        <hr />

        {(href || files) &&
            <ul className="list-group">
                {href && href.length > 0 && (
                    <li>
                        <a href={href} target="_blank" rel="noopener noreferrer" className="btn btn-default">
                            <i className="fa fa-link"></i> {hrefName !== "" ? hrefName : href}
                        </a>
                    </li>
                )}
                {files && (
                    <li >
                        {files.map((file: AnnouncementDetailFile, idx: number) => (
                            <a key={idx} href={`${FileManagementAPI.DOWNLOAD_URL}/${file.FileId}`} rel="noopener noreferrer" className="btn btn-default" tabIndex={1} title={`${file.FileName}(另開新視窗)`}>
                                <i className="fa fa-paperclip"></i> {file.FileName}
                            </a>
                        ))}
                    </li>
                )}
            </ul>
        }
        <GoBackRow />
    </>
    )
}

const GoBackRow: React.FC = () => {
    const navigate = useNavigate();
    const handleBack = useCallback(
        (e: React.MouseEvent<HTMLButtonElement>) => {
            e.preventDefault();       // 避免在表單中觸發提交
            navigate(-1);             // 等同 history.back()
        },
        [navigate]
    );
    const title = "回上一頁"
    return (
        <div className="row">
            <div className="col-lg-8 col-md-8 col-sm-6 col-4" />
            <div className="col-lg-2 col-md-2 col-sm-3 col-4 text-right" />
            <div className="col-lg-2 col-md-2 col-sm-3 col-4 text-right">
                <button type="button" className="btn btn-primary btn-custom-color"
                    title={title} aria-label={title} onClick={handleBack}>
                    {title}
                </button>
            </div>
        </div>
    );
};