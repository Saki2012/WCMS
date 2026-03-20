import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import ModuleContent, { type ModuleViewCountConfig } from "@/Features/Pages/Client/Scaffold/SubPages/Section/ModuleContent";
import parse from "html-react-parser";
import { useResolveInternalIds } from "@/SysCore/Components/File/useResolveInternalIds";
import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";

// ✅ 新架構：Adapter + LoaderData initial
import { useMemo } from "react";
import { useLoaderData } from "react-router-dom";
import type { ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import { PageManagementAdapter } from "@/Features/Hooks/BizFunc/WebManagement/PageManagement_Api";
import type { components } from "@/types/api";
import type { Lang } from "@/SysCore/i18n/lang";
import type { PageManagementFormLoaderData } from "./PageManagementForm_Hook";
import type { TryCountDetailViewRequest } from "@/Features/Hooks/BizFunc/SystemSetting/SiteInfo/SiteViewCount/SiteViewCount_Api";
import { PGID } from "@/types/SchemaFields";

export interface IPageManagementOptions { PageId?: string }
interface IPageManagementProps { site:INormSite; node: INormNode; lang: string; theme?: IFETheme; options?: IPageManagementOptions; }

type PageManagementSet = components["schemas"]["PageManagementSet_DTO"];
const emptyData: PageManagementSet = {};

const PageManagementFormComp = (props: IPageManagementProps) => {
    const loaderData = useLoaderData() as PageManagementFormLoaderData | null;
    const adapter = useMemo(() => PageManagementAdapter(), []);
    const lang = props.lang as Lang;
    const pageId = `${props.options?.PageId ?? ""}`.trim();
    // 宣告變數：SSR loaderData → hooks initial
    const initialData = useMemo<ApiLoaderData<string, PageManagementSet> | null>(() => {
        if (!loaderData?.args?.pageId) return null;
        if (loaderData.args.pageId !== pageId) return null;
        return {
            args: pageId,
            apiRes: {
                IsSuccess: true,
                Data: loaderData.res.dataRes ?? emptyData,
                SysMessage: [],
            },
        };
    }, [loaderData, pageId]);

    // 執行 function：QueryData（SSR initial → CSR 接手）
    const pageData = adapter.hooks.useQueryData({
        internalId: pageId,
        initial: initialData,
        deps: [pageId, lang],
    });

    const detail = pageData.data?.PageManagementDetail?.find(d => (d.Lang ?? "").toLowerCase() === props.lang);
    const parseContent = useResolveInternalIds(detail?.Content ?? "", { locale: props.lang });
    const content = parseContent.html ? parse(parseContent.html) : null;

    const errorList: (string | null | undefined)[] = [pageData.errorText];
    const viewCountConfig = useMemo<ModuleViewCountConfig>(() => {
        const request: TryCountDetailViewRequest = {
            SiteIndex:props.site.siteIndex,
            ProgId:PGID.PageManagement,
            InternalId:pageId,
        };
        return { mode: "form", contentKey: pageId, request,};}, [pageId]);
    return (
        <ModuleContent nodeTitle={""} title={detail?.Title ?? ""} isLoading={pageData.isLoading} errorList={errorList} viewCountConfig={viewCountConfig}>
            {content}
        </ModuleContent>
    );
};

export default PageManagementFormComp;
