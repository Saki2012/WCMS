import { useMemo } from "react";
import parse from "html-react-parser";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import ModuleContent, {
    type ModuleViewCountConfig,
} from "@/Features/Pages/Client/Scaffold/SubPages/Section/ModuleContent";
import type { TryCountDetailViewRequest } from "@/Features/Hooks/BizFunc/SystemSetting/SiteInfo/SiteViewCount/SiteViewCount_Api";
import { PGID } from "@/types/SchemaFields";
import {
    usePageManagementFormFetchData,
    type IPageManagementOptions,
} from "./PageManagementForm_Loader";
import type { Lang } from "@/SysCore/i18n/lang";

interface IPageManagementProps
{
    site: INormSite;
    node: INormNode;
    lang: Lang;
    theme?: IFETheme;
    options?: IPageManagementOptions;
}

/** 建立瀏覽次數設定 */
const useViewCountConfig = (
    p: {
        siteIndex: string;
        pageId: string;
    },
): ModuleViewCountConfig =>
{
    return useMemo<ModuleViewCountConfig>(() =>
    {
        const request: TryCountDetailViewRequest = {
            SiteIndex: p.siteIndex,
            ProgId: PGID.PageManagement,
            InternalId: p.pageId,
        };

        return {
            mode: "form",
            contentKey: p.pageId,
            request,
        };
    }, [p.siteIndex, p.pageId]);
};

const PageManagementForm = (props: IPageManagementProps) =>
{
    const pageId = `${props.options?.PageId ?? ""}`.trim();

    // 讀取 feature loader/hooks 整理後的資料
    const data = usePageManagementFormFetchData({
        lang: props.lang,
        pageId,
    });

    // 建立瀏覽次數設定
    const viewCountConfig = useViewCountConfig({
        siteIndex: props.site.siteIndex,
        pageId,
    });

    // 轉成 ReactNode 顯示
    const content = useMemo(
        () => (data.contentHtml ? parse(data.contentHtml) : null),
        [data.contentHtml],
    );

    return (
        <ModuleContent
            nodeTitle={""}
            title={data.title}
            isLoading={data.isLoading}
            errorList={data.errorList}
            viewCountConfig={viewCountConfig}
        >
            {content}
        </ModuleContent>
    );
};

export default PageManagementForm;