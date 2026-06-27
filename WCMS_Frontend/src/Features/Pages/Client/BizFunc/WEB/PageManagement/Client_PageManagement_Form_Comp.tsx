import type { TryCountDetailViewRequest } from "@/Features/Hooks/BizFunc/WEB/SiteViewCount_Api";
import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import { ModuleContent, type ModuleViewCountConfig } from "@/Features/Pages/Client/Scaffold/SubPages/layouts/RightFrame/ModuleContent";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import { CmsHtml_Comp } from "@/SysCore/Components/CmsHtml/CmsHtml_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import { LibText } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import { useMemo } from "react";
import { type IPageManagementOptions, usePageManagementFormData } from "./Client_PageManagement_Form_Loader";

// #region Property
export type PageManagementSet = components["schemas"]["PageManagementSet_DTO"];
type PageManagementDetail = NonNullable<PageManagementSet["PageManagementDetail"]>[number];

export interface IPageManagementProps
{
    site: INormSite;
    node: INormNode;
    lang: Lang;
    theme?: IFETheme;
    options?: IPageManagementOptions;
}

export interface PageManagementFormViewProps extends IPageManagementProps
{
    /** 畫面標題 */
    title: string;

    /** 頁面 HTML 內容 */
    contentHtml: string;

    /** 是否載入中 */
    isLoading: boolean;

    /** 錯誤訊息 */
    errorList: string[];

    /** 瀏覽次數設定，預覽模式不傳入 */
    viewCountConfig?: ModuleViewCountConfig;
}
// #endregion

// #region Public
/** 單頁內容前台 Form，資料流程統一走 Client_DataQueryTemplate。 */
export const Client_PageManagement_Form = (props: IPageManagementProps) =>
{
    const pageId = LibText.safeTrim(props.options?.PageId);
    const vm = usePageManagementFormData({ lang: props.lang, pageId });
    const viewCountConfig = useMemo<ModuleViewCountConfig>(() => buildPageManagementViewCountConfig(props.site.siteIndex, pageId), [props.site.siteIndex, pageId]);

    return (
        <PageManagementFormView
            {...props}
            title={vm.title}
            contentHtml={vm.contentHtml}
            isLoading={vm.isLoading}
            errorList={vm.errorList}
            viewCountConfig={viewCountConfig}
        />
    );
};

/** 單頁內容純渲染 View，正式前台與預覽共用。 */
export const PageManagementFormView = (props: PageManagementFormViewProps) =>
{
    return (
        <ModuleContent nodeTitle={props.node.title} title={props.title} isLoading={props.isLoading} errorList={props.errorList} viewCountConfig={props.viewCountConfig}>
            <CmsHtml_Comp html={props.contentHtml} lang={props.lang} />
        </ModuleContent>
    );
};

/** 依 PageManagement DTO 建立預覽 View 所需資料。 */
export const buildPageManagementPreviewViewData = (formData: PageManagementSet, lang: Lang): { title: string; contentHtml: string; } =>
{
    const detail = resolvePageManagementDetail(formData, lang);
    return { title: detail?.Title ?? "", contentHtml: detail?.Content ?? "" };
};
// #endregion

// #region Private
/** 建立正式頁面瀏覽次數設定，預覽模式不會呼叫。 */
const buildPageManagementViewCountConfig = (siteIndex: string, pageId: string): ModuleViewCountConfig =>
{
    const request: TryCountDetailViewRequest = { SiteIndex: siteIndex, ProgId: PGID.PageManagement, InternalId: pageId };
    return { mode: "form", contentKey: pageId, request };
};

/** 取得目前語系 PageManagement 明細。 */
const resolvePageManagementDetail = (formData: PageManagementSet, lang: Lang): PageManagementDetail | null =>
{
    const langKey = LibText.safeTrim(lang).toLowerCase();
    const detail = formData.PageManagementDetail?.find(item => LibText.safeTrim(item.Lang).toLowerCase() === langKey);
    return detail ?? formData.PageManagementDetail?.[0] ?? null;
};
// #endregion
