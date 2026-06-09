import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import ModuleContent, { type ModuleViewCountConfig } from "@/Features/Pages/Client/Scaffold/SubPages/Layouts/RightFrame/ModuleContent";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import { CmsHtml_Comp } from "@/SysCore/Components/CmsHtml/CmsHtml_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import { LibText } from "@/SysCore/Utils/Library/LibData";
import { PGID } from "@/types/SchemaFields";
import { useMemo } from "react";
import { type IPageManagementOptions, usePageManagementFormData } from "./Client_PageManagement_Form_Loader";

// #region Property
interface IPageManagementProps
{
    site: INormSite;
    node: INormNode;
    lang: Lang;
    theme?: IFETheme;
    options?: IPageManagementOptions;
}
// #endregion

// #region Public
/** 單頁內容前台 Form，資料流程統一走 Client_DataQueryTemplate */
export const Client_PageManagement_Form = (props: IPageManagementProps) =>
{
    const pageId = LibText.safeTrim(props.options?.PageId);
    const vm = usePageManagementFormData({ lang: props.lang, pageId });
    const viewCountConfig = useMemo<ModuleViewCountConfig>(() => ({ mode: "form", contentKey: pageId, request: { SiteIndex: props.site.siteIndex, ProgId: PGID.PageManagement, InternalId: pageId } }), [props.site.siteIndex, pageId]);
    return (
        <ModuleContent nodeTitle={""} title={vm.title} isLoading={vm.isLoading} errorList={vm.errorList} viewCountConfig={viewCountConfig}>
            <CmsHtml_Comp html={vm.contentHtml} lang={props.lang} />
        </ModuleContent>
    );
};
// #endregion
