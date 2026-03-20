import { HeaderMetaComp } from "@/SysCore/Components/HeaderMeta/HeaderMeta_Comp";
import LoadingErrorHandler from "@/SysCore/Components/LoadingErrorHandler";
import { NewPaginator } from "@/SysCore/Components/Paginator/Paginator_Comp";
import type { PaginatorProps } from "@/SysCore/Components/Paginator/Paginator_Data";
import { DefaultLang, SUPPORTED_LANGS, type Lang } from "@/SysCore/i18n/lang";
import { useLang } from "@/SysCore/i18n/LangContext";
import { useFormDetailViewCount } from "@/Features/Hooks/BizFunc/SystemSetting/SiteInfo/SiteViewCount/SiteViewCount_Hooks";
import type { TryCountDetailViewRequest } from "@/Features/Hooks/BizFunc/SystemSetting/SiteInfo/SiteViewCount/SiteViewCount_Api";
import type { AxiosInstance } from "axios";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { useLocation } from "react-router";
import { siteHeaderMeta } from "SpecFeature/SpecRouter";

export type ModuleViewCountConfig = | ModuleListViewCountConfig | ModuleFormViewCountConfig;

export interface ModuleListViewCountConfig {
    mode: "list";
}
export interface ModuleFormViewCountConfig {
    mode: "form";
    contentKey: string;
    request: TryCountDetailViewRequest;
    cooldownMs?: number;
    apiInstance?: AxiosInstance;
}

export interface ModuleContentProps {
    nodeTitle: string;
    title?: string;
    subTitle?: SubTitleProps;
    paginatorProps?: PaginatorProps;
    isLoading: boolean;
    errorList: (string | null | undefined)[];
    viewCountConfig: ModuleViewCountConfig;
    children?: ReactNode;
}

/** 建立 detail view count hook 所需參數 */
const buildDetailViewCountOptions = (config: ModuleViewCountConfig) => {
    if (config.mode === "list") {
        return { enabled: false, contentKey: "", request: null, cooldownMs: undefined, apiInstance: undefined,};
    }
    return { enabled: true, contentKey: config.contentKey, request: config.request, cooldownMs: config.cooldownMs, apiInstance: config.apiInstance,};
};

const ModuleContent = (props: ModuleContentProps) => {
    // 宣告變數
    const fullTitle = [siteHeaderMeta.title, props.nodeTitle, props.title].filter(Boolean).join("｜");
    const ctx = useLang();
    const lang = (ctx.code ?? DefaultLang) as Lang;
    const loc = useLocation();
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const canonicalUrl = origin ? `${origin}${loc.pathname}` : undefined;
    const alternates = origin ? SUPPORTED_LANGS.map((l) => { 
            const isDefault = l === DefaultLang;
            const href = isDefault ? `${origin}${loc.pathname.replace(/^\/[^/]+(?=\/|$)/, "")}` : `${origin}/${l}${loc.pathname.replace(/^\/[^/]+(?=\/|$)/, "")}`;
            return { hrefLang: l, href };
        }): undefined;
    const detailViewCountOptions = useMemo(() => { return buildDetailViewCountOptions(props.viewCountConfig); }, [props.viewCountConfig]);
    // 執行 function：由 ModuleContent 統一處理 subpage page view count
    useFormDetailViewCount(detailViewCountOptions);
    // return
    return (
        <>
            <HeaderMetaComp htmlLang={lang} title={fullTitle} description={siteHeaderMeta.description} canonicalUrl={canonicalUrl} alternates={alternates}/>
            <LoadingErrorHandler isLoading={props.isLoading} errorList={props.errorList}>
                {props.title && <Title title={props.title} subTitle={props.subTitle} />}
                <div className="ALL__Information__Display__Area">
                    {props.children}
                </div>
                <hr className="hr-my-4" />
                {props.paginatorProps && <NewPaginator {...props.paginatorProps} />}
            </LoadingErrorHandler>
        </>
    );
};

export default ModuleContent;

/** 標題 */
const Title = (props: { title: string; subTitle?: SubTitleProps }) => {
    // return
    return (
        <>
            <div className="page-header mb-3">
                <div className="Div_H3_Title">{props.title}</div>
            </div>
            {props.subTitle && <SubTitle {...props.subTitle} />}
            <hr className="hr-my-4" />
        </>
    );
};

export interface SubTitleProps {
    cat?: string;
    tag?: string;
    date?: string;
}

const SubTitle = (props: SubTitleProps) => {
    // return
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