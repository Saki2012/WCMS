import type { TryCountDetailViewRequest } from "@/Features/Hooks/BizFunc/WEB/SiteViewCount_Api";
import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import ModuleContent, { type ModuleViewCountConfig } from "@/Features/Pages/Client/Scaffold/SubPages/Layouts/RightFrame/ModuleContent";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import { CmsHtml_Comp } from "@/SysCore/Components/CmsHtml/CmsHtml_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import { PGID } from "@/types/SchemaFields";
import { useMemo } from "react";
import { type IPageManagementOptions, usePageManagementFormFetchData } from "./PageManagementForm_Loader";

interface IPageManagementProps
{
    site: INormSite;
    node: INormNode;
    lang: Lang;
    theme?: IFETheme;
    options?: IPageManagementOptions;
}

/** 建立瀏覽次數設定 */
const useViewCountConfig = (p: { siteIndex: string; pageId: string; }): ModuleViewCountConfig =>
{
    return useMemo<ModuleViewCountConfig>(() =>
    {
        const request: TryCountDetailViewRequest = { SiteIndex: p.siteIndex, ProgId: PGID.PageManagement, InternalId: p.pageId };
        return { mode: "form", contentKey: p.pageId, request };
    }, [p.siteIndex, p.pageId]);
};

const PageManagementForm = (props: IPageManagementProps) =>
{
    const pageId = `${props.options?.PageId ?? ""}`.trim();
    const data = usePageManagementFormFetchData({ lang: props.lang, pageId });
    const viewCountConfig = useViewCountConfig({ siteIndex: props.site.siteIndex, pageId });
    return (
        <ModuleContent nodeTitle={""} title={data.title} isLoading={data.isLoading} errorList={data.errorList} viewCountConfig={viewCountConfig}>
            <CmsHtml_Comp html={data.contentHtml} lang={props.lang} />
        </ModuleContent>
    );
};

export default PageManagementForm;
