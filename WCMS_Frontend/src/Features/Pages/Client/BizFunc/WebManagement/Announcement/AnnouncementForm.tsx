import type { IFETheme } from '@/Features/Pages/Client/Theme/ITheme';
import type { components } from '@/types/api';
import { AnnouncementAdapter } from '@/Features/Hooks/BizFunc/WebManagement/Announcement/Announcement_Api';
import { TagAdapter } from '@/Features/Hooks/BizFunc/WebManagement/Tags/Tag_Api';
import { CategoryAdapter } from '@/Features/Hooks/BizFunc/WebManagement/Category/Category_Api';
import type { Lang } from '@/SysCore/i18n/lang';
import { useParams } from 'react-router';
import { useMemo } from 'react';
import parse from 'html-react-parser';
import ModuleContent, { type SubTitleProps } from '@/Features/Pages/Client/Scaffold/SubPages/Section/ModuleContent';
import { useResolveInternalIds } from '@/SysCore/Components/File/useResolveInternalIds';
import { FileManagementAPI } from '@/SysCore/Utils/API/APIClient';
import { FormatDate } from '@/SysCore/Utils/Library/LibData';
import type { INormNode } from '@/Features/Pages/Client/Route/Site-Routing';
import type { ApiLoaderData } from '@/SysCore/Utils/API/APIAdapter';
import { useLoaderData } from 'react-router-dom';
import type { AnnouncementFormLoaderData } from './AnnouncementForm_Loader';

type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"]
type CategoryDataSet = components["schemas"]["CategoryDataSet_DTO"]
type TagSet = components["schemas"]["TagSet_DTO"]

const emptyData: AnnouncementSet = { Announcement: {}, AnnouncementDetail: [] }

interface IAnnouncementFormProps { node: INormNode; theme: IFETheme; lang: Lang }

const AnnouncementForm = (props: IAnnouncementFormProps) => {
    // 宣告變數
    const { internalId } = useParams();
    const loaderData = useLoaderData() as AnnouncementFormLoaderData | null;

    const adapter = useMemo(() => ({
        announce: AnnouncementAdapter(),
        cate: CategoryAdapter(),
        tag: TagAdapter(),
    }), []);

    const safeInternalId = `${internalId ?? ""}`.trim();

    // 宣告變數：把 loaderData 的「純資料」包成 hooks 要吃的 initial（ApiLoaderData）
    const initialData = useMemo<ApiLoaderData<string, AnnouncementSet> | null>(() => {
        if (!loaderData?.args?.dataId) return null;
        if (loaderData.args.dataId !== safeInternalId) return null;

        return {
            args: safeInternalId,
            apiRes: {
                IsSuccess: true,
                Data: loaderData.res.dataRes ?? emptyData,
                SysMessage: [],
            },
        };
    }, [loaderData, safeInternalId]);

    const initialCate = useMemo<ApiLoaderData<components["schemas"]["QueryListParam"], CategoryDataSet[]> | null>(() => {
        if (!loaderData?.args?.cateParam) return null;
        return {
            args: loaderData.args.cateParam,
            apiRes: {
                IsSuccess: true,
                Data: loaderData.res.categoryRes ?? [],
                SysMessage: [],
            },
        };
    }, [loaderData]);

    const initialTag = useMemo<ApiLoaderData<components["schemas"]["QueryListParam"], TagSet[]> | null>(() => {
        if (!loaderData?.args?.tagParam) return null;
        return {
            args: loaderData.args.tagParam,
            apiRes: {
                IsSuccess: true,
                Data: loaderData.res.tagRes ?? [],
                SysMessage: [],
            },
        };
    }, [loaderData]);

    // 執行 function：查表單資料（SSR 有 initial → CSR hydration 不會重抓）
    const useAnnouncementFormData = adapter.announce.hooks.useQueryData({
        internalId: safeInternalId,
        initial: initialData,
        deps: [safeInternalId, props.lang],
    });

    // 執行 function：查分類/標籤（SSR 有 initial → CSR hydration 不會重抓）
    const useCategories = adapter.cate.hooks.useQueryList({
        condition: loaderData?.args?.cateParam ?? {
            Fields: [],
            Condition: "1=0",
            PageNumber: 0,
            PageSize: 0,
        },
        initial: initialCate,
        deps: [safeInternalId, props.lang],
    });

    const useTags = adapter.tag.hooks.useQueryList({
        condition: loaderData?.args?.tagParam ?? {
            Fields: [],
            Condition: "1=0",
            PageNumber: 0,
            PageSize: 0,
        },
        initial: initialTag,
        deps: [safeInternalId, props.lang],
    });

    const loadingList = [useAnnouncementFormData.isLoading, useCategories.isLoading, useTags.isLoading];
    const errorList = [useAnnouncementFormData.errorText, useCategories.errorText, useTags.errorText];

    const formData = useAnnouncementFormData.data ?? emptyData;
    const detail = formData.AnnouncementDetail?.find(d => (d.Lang ?? "").toLowerCase() === props.lang);

    const startDate = FormatDate(formData.Announcement?.Validate_Start);

    const cats = (useCategories.data ?? [])
        .flatMap(item => (item.CategoryDetail ?? [])
            .filter(d => d.Lang === props.lang)
            .map(d => d.CategoryName)
        ) as string[];

    const tags = (useTags.data ?? [])
        .flatMap(item => (item.TagDetail ?? [])
            .filter(d => d.Lang === props.lang)
            .map(d => d.TagName)
        ) as string[];

    const subTitle: SubTitleProps = { cat: cats.join('、'), tag: tags.join('、'), date: startDate };

    // return
    return (
        <ModuleContent nodeTitle={props.node.title} title={detail?.Title ?? ""} subTitle={subTitle} isLoading={loadingList.some(Boolean)} errorList={errorList}>
            <Content lang={props.lang} data={formData} />
        </ModuleContent>
    );
};

export default AnnouncementForm;

const Content = (props: { lang: Lang; data: AnnouncementSet }) => {
    const detail = props.data.AnnouncementDetail?.find(d => (d.Lang ?? "").toLowerCase() === props.lang);
    const fileDetail = props.data.AnnouncementDetailFile?.filter(p => p.AnnouncementId === detail?.AnnouncementId && p.ParentRowId === detail?.RowId);
    const parseContent = useResolveInternalIds(detail?.Content ?? "", { locale: props.lang });
    const content = parseContent.html ? parse(parseContent.html) : null;
    const url = detail?.Url;
    return (
        <>
            {content}
            {url && fileDetail && fileDetail.length > 0 && <hr className="hr-my-4" />}
            {url && <>
                <div className="row">
                    <div className="col-xl-6 col-lg-6 col-md-6 col-sm-12 col-12">
                        <div className="Standard_btnDiv">
                            <a href={url} className="btn btn_NEWS bg_urllink_NEWS" role="button" aria-label="分享" target="_blank" title="[ 另開新視窗 ]" tabIndex={0}>
                                <span>
                                    <i className="fas fa-link + link + ml-0 mr-2"></i>
                                    <span className="sr-only">{detail?.UrlDescription ?? ""}</span>
                                </span>
                                <span className="URL_link_NEWS">{detail?.UrlDescription ?? ""}</span>
                            </a>
                        </div>
                    </div>
                </div>
                <hr className="hr-my-4" />
            </>}

            {fileDetail && fileDetail.length > 0 && <>
                <div className="row">
                    {fileDetail.map((itme) => {
                        return (
                            <div key={`${itme.FileId ?? ""}`} className="col-xl-6 col-lg-6 col-md-6 col-sm-12 col-12">
                                <div className="Standard_btnDiv">
                                    <a href={`${FileManagementAPI.DOWNLOAD_URL}/${itme.FileId}`} className="btn btn_NEWS bg_urllink_NEWS"
                                        role="button" aria-label="分享" target="_blank" title="[ 另開新視窗 ]" tabIndex={0}>
                                        <span>
                                            <i className="fas fa-paperclip + link + ml-0 mr-2"></i>
                                            <span className="sr-only">{itme.FileName}</span>
                                        </span>
                                        <span className="URL_link_NEWS">{itme.FileName}</span>
                                    </a>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <hr className="hr-my-4" />
            </>}
        </>
    );
};
