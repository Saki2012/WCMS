import type { TryCountDetailViewRequest } from "@/Features/Hooks/BizFunc/WEB/SiteViewCount_Api";
import { useFormDetailViewCount, type UseFormDetailViewCountOptions } from "@/Features/Hooks/BizFunc/WEB/SiteViewCount_Hooks";
import { getSiteHeaderMeta } from "@/Features/Pages/AppRoute";
import type { ClientDataQuerySearchBarModel } from "@/Features/Pages/Client/Scaffold/DataQueryTemplate/Client_DataQueryTemplate_Hook";
import { Client_SearchBar_Comp } from "@/Features/Pages/Client/Scaffold/SubPages/Module/SearchBar/Client_SearchBar_Comp";
import { HeaderMetaComp, type IHeaderMetaProps } from "@/SysCore/Components/HeaderMeta/HeaderMeta_Comp";
import LoadingErrorHandler from "@/SysCore/Components/LoadingErrorHandler";
import { NewPaginatorCanInputPage } from "@/SysCore/Components/Paginator/Paginator_Comp";
import type { PaginatorProps } from "@/SysCore/Components/Paginator/Paginator_Data";
import { type Lang, SUPPORTED_LANGS } from "@/SysCore/i18n/lang";
import { useLang } from "@/SysCore/i18n/LangContext";
import { LibText } from "@/SysCore/Utils/Library/LibData";
import { LibRouteLang } from "@/SysCore/Utils/Route/LibRoute";
import type { AxiosInstance } from "axios";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { useLocation } from "react-router";

// #region Property
/** 模組瀏覽次數設定 */
export type ModuleViewCountConfig = ModuleListViewCountConfig | ModuleFormViewCountConfig;

/** 模組清單瀏覽次數設定 */
export interface ModuleListViewCountConfig
{
    /** 瀏覽次數模式 */
    mode: "list";
}

/** 模組表單 / 明細瀏覽次數設定 */
export interface ModuleFormViewCountConfig
{
    /** 瀏覽次數模式 */
    mode: "form";

    /** 內容識別 key */
    contentKey: string;

    /** 瀏覽次數 API request */
    request: TryCountDetailViewRequest;

    /** 防重複計數時間 */
    cooldownMs?: number;

    /** API instance */
    apiInstance?: AxiosInstance;
}

/** 模組內容 Layout 參數 */
export interface ModuleContentProps
{
    /** 目前節點標題 */
    nodeTitle: string;

    /** 內容標題 */
    title?: string;

    /** 內容副標資訊 */
    subTitle?: SubTitleProps;

    /** 分頁參數 */
    paginatorProps?: PaginatorProps | null;

    /** 搜尋列參數 */
    searchBar?: ClientDataQuerySearchBarModel | null;

    /** 是否載入中 */
    isLoading: boolean;

    /** 錯誤清單 */
    errorList: (string | null | undefined)[];

    /** 瀏覽次數設定 */
    viewCountConfig: ModuleViewCountConfig;

    /** 模組內容 */
    children?: ReactNode;
}

/** 副標資訊 */
export interface SubTitleProps
{
    /** 類別文字 */
    cat?: string;

    /** 標籤文字 */
    tag?: string;

    /** 日期文字 */
    date?: string;
}

/** 模組內容狀態 */
interface ModuleContentState
{
    /** 頁面語系 */
    lang: Lang;

    /** 完整 SEO title */
    fullTitle: string;

    /** SEO description */
    description?: string;

    /** Canonical URL */
    canonicalUrl?: string;

    /** Alternate URL 清單 */
    alternates?: IHeaderMetaProps["alternates"];
}

/** 模組內容 Section 參數 */
interface ModuleContentSectionProps
{
    /** 模組內容參數 */
    contentProps: ModuleContentProps;

    /** 模組內容狀態 */
    state: ModuleContentState;
}

/** Header Meta Section 參數 */
interface ModuleHeaderMetaSectionProps
{
    /** 模組內容狀態 */
    state: ModuleContentState;
}

/** 標題 Entity 參數 */
interface ModuleContentTitleProps
{
    /** 內容標題 */
    title: string;

    /** 內容副標資訊 */
    subTitle?: SubTitleProps;
}
// #endregion

// #region Public
/** 前台模組內容 Layout。 */
export const ModuleContent = (props: ModuleContentProps) =>
{
    const state = useModuleContentState(props);
    return (
        <>
            <ModuleHeaderMetaSection state={state} />
            <ModuleContentSection contentProps={props} state={state} />
        </>
    );
};
// #endregion

// #region Protected
/** 建立模組內容所需狀態與瀏覽次數行為。 */
const useModuleContentState = (props: ModuleContentProps): ModuleContentState =>
{
    const siteHeaderMeta = getSiteHeaderMeta();
    const ctx = useLang();
    const lang = LibRouteLang.normalizeRouteLang(ctx.code);
    const loc = useLocation();
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const fullTitle = LibText.mergeText("｜", {}, siteHeaderMeta.title, props.nodeTitle, props.title);
    const canonicalUrl = origin ? `${origin}${loc.pathname}` : undefined;
    const alternates = buildModuleAlternates(origin, loc.pathname);
    const detailViewCountOptions = useMemo(() => buildDetailViewCountOptions(props.viewCountConfig), [props.viewCountConfig]);
    useFormDetailViewCount(detailViewCountOptions);
    return { lang, fullTitle, description: siteHeaderMeta.description, canonicalUrl, alternates };
};
// #endregion

// #region Section
/** 建立模組 Header Meta。
 */
const ModuleHeaderMetaSection = ({ state }: ModuleHeaderMetaSectionProps) =>
{
    return <HeaderMetaComp htmlLang={state.lang} title={state.fullTitle} description={state.description} canonicalUrl={state.canonicalUrl} alternates={state.alternates} />;
};

/** 建立模組主內容區塊。
 */
const ModuleContentSection = ({ contentProps, state }: ModuleContentSectionProps) =>
{
    return (
        <LoadingErrorHandler isLoading={contentProps.isLoading} errorList={contentProps.errorList}>
            {contentProps.title && <ModuleContentTitle title={contentProps.title} subTitle={contentProps.subTitle} />}
            {contentProps.searchBar && <Client_SearchBar_Comp {...contentProps.searchBar} />}
            <div className="ALL__Information__Display__Area">{contentProps.children}</div>
            <hr className="hr-my-4" />
            {contentProps.paginatorProps && <NewPaginatorCanInputPage {...contentProps.paginatorProps} lang={state.lang} />}
        </LoadingErrorHandler>
    );
};
// #endregion

// #region EntityComp
/** 建立模組內容標題。 */
const ModuleContentTitle = ({ title, subTitle }: ModuleContentTitleProps) =>
{
    return (
        <>
            <div className="page-header mb-3">
                <div className="Div_H3_Title">{title}</div>
            </div>
            {subTitle && <ModuleContentSubTitle {...subTitle} />}
            <hr className="hr-my-4" />
        </>
    );
};

/** 建立模組內容副標。 */
const ModuleContentSubTitle = (props: SubTitleProps) =>
{
    return (
        <div className="NEWS_catDiv">
            <div className="news_cat">
                <i className="fas fa-tags mr-2"></i>
                <span className="sr-only">公告類別</span>
                {props.cat}
            </div>

            <div className="news_calendar">
                <i className="fas fa-calendar-alt mr-2"></i>
                <span className="sr-only">日期</span>
                {props.date}
            </div>
        </div>
    );
};
// #endregion

// #region Private
/** 建立多語系 alternate URL。 */
const buildModuleAlternates = (origin: string, pathname: string): IHeaderMetaProps["alternates"] | undefined =>
{
    if (!origin) return undefined;

    const basePath = LibRouteLang.stripLeadingRouteLang(pathname);
    const alternates = SUPPORTED_LANGS.map((lang) =>
    {
        const langPath = LibRouteLang.buildLangPathname(basePath, lang);
        return { hrefLang: lang, href: `${origin}${langPath}` };
    });

    return alternates;
};
/** 建立 detail view count hook 所需參數。 */
const buildDetailViewCountOptions = (config: ModuleViewCountConfig): UseFormDetailViewCountOptions =>
{
    if (config.mode === "list")
    {
        return { enabled: false, contentKey: "", request: null, cooldownMs: undefined, apiInstance: undefined };
    }

    return { enabled: true, contentKey: config.contentKey, request: config.request, cooldownMs: config.cooldownMs, apiInstance: config.apiInstance };
};
// #endregion
