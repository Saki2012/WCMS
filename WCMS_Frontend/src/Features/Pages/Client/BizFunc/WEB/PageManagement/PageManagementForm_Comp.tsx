import type { TryCountDetailViewRequest } from "@/Features/Hooks/BizFunc/WEB/SiteViewCount_Api";
import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import ModuleContent, { type ModuleViewCountConfig } from "@/Features/Pages/Client/Scaffold/SubPages/Layouts/RightFrame/ModuleContent";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import { CmsHtml_Comp } from "@/SysCore/Components/CmsHtml/CmsHtml_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import { PGID } from "@/types/SchemaFields";
import { useMemo } from "react";
import { type IPageManagementOptions, usePageManagementFormData } from "./PageManagementForm_Loader";

interface IPageManagementProps
{
    site: INormSite;
    node: INormNode;
    lang: Lang;
    theme?: IFETheme;
    options?: IPageManagementOptions;
}

/** 取得 SiteMenu 設定的 PageId；目前實際值為 PageManagement.InternalId */
const getSafePageId = (value?: string): string =>
{
    // return
    return `${value ?? ""}`.trim();
};

/** 建立瀏覽次數設定 */
const useViewCountConfig = (p: { siteIndex: string; pageId: string; }): ModuleViewCountConfig =>
{
    // return
    return useMemo<ModuleViewCountConfig>(() =>
    {
        const request: TryCountDetailViewRequest = { SiteIndex: p.siteIndex, ProgId: PGID.PageManagement, InternalId: p.pageId };
        return { mode: "form", contentKey: p.pageId, request };
    }, [p.siteIndex, p.pageId]);
};

/** 單頁內容前台 Form，資料流程統一走 Client_DataQueryTemplate */
const PageManagementForm = (props: IPageManagementProps) =>
{
    // 宣告變數
    const pageId = getSafePageId(props.options?.PageId);
    const vm = usePageManagementFormData({ lang: props.lang, pageId });
    const viewCountConfig = useViewCountConfig({ siteIndex: props.site.siteIndex, pageId });

    // return
    return (
        <ModuleContent nodeTitle={""} title={vm.title} isLoading={vm.isLoading} errorList={vm.errorList} viewCountConfig={viewCountConfig}>
            <CmsHtml_Comp html={vm.contentHtml} lang={props.lang} />
        </ModuleContent>
    );
};

export default PageManagementForm;
