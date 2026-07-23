import type { TryCountDetailViewRequest } from "@/Features/Hooks/BizFunc/WEB/SiteViewCount_Api";
import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import { getClientSlotPath } from "@/Features/Pages/Client/Scaffold/Slot/Client_SlotPath";
import { ModuleContent, type ModuleViewCountConfig } from "@/Features/Pages/Client/Scaffold/SubPages/layouts/RightFrame/ModuleContent";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import { CmsHtml_Comp } from "@/SysCore/Components/CmsHtml/CmsHtml_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import { LibText } from "@/SysCore/Utils/Library/LibData";
import { resolveSpecComponent } from "@/SysCore/Utils/Library/SlotResolver";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import { useMemo } from "react";
import { type IPageManagementOptions, usePageManagementFormData } from "./Client_PageManagement_Form_Loader";

// #region Property
export type PageManagementFormModel = components["schemas"]["PageManagement"];
type PageManagementDetail = NonNullable<PageManagementFormModel["_PageManagementDetail"]>[number];

export interface IPageManagementProps
{
    site: INormSite;
    node: INormNode;
    lang: Lang;
    theme?: IFETheme;
    options?: IPageManagementOptions;
}

export interface PageManagementFormData
{
    /** 畫面標題 */
    title: string;

    /** 頁面 HTML 內容 */
    contentHtml: string;

    /** 是否載入中 */
    isLoading: boolean;

    /** 錯誤訊息 */
    errorList: string[];

    /** 瀏覽次數設定，Preview 不傳入 */
    viewCountConfig?: ModuleViewCountConfig;
}

export interface PageManagementFormViewProps extends IPageManagementProps, PageManagementFormData
{}
// #endregion

// #region Variable
/** PageManagement FormView 快取，避免每次 render 重複解析 Spec View。 */
let pageManagementFormViewCache: typeof Client_PageManagement_Form_FeatureView | null = null;
// #endregion

// #region Public
/** 單頁內容前台完整 Comp，負責資料 Hook，再交給 FormView Entry。 */
export const Client_PageManagement_Form_Comp = (props: IPageManagementProps) =>
{
    const pageId = LibText.safeTrim(props.options?.PageId);
    const vm = usePageManagementFormData({ lang: props.lang, pageId });
    const viewCountConfig = useMemo<ModuleViewCountConfig>(() => buildPageManagementViewCountConfig(props.site.siteIndex, pageId), [props.site.siteIndex, pageId]);

    return (
        <Client_PageManagement_Form
            {...props}
            title={vm.title}
            contentHtml={vm.contentHtml}
            isLoading={vm.isLoading}
            errorList={vm.errorList}
            viewCountConfig={viewCountConfig}
        />
    );
};

/** 單頁內容 FormView Entry，正式前台與 Preview 都從這裡進入。 */
export const Client_PageManagement_Form = (props: PageManagementFormViewProps) =>
{
    const FormView = getPageManagementFormView();
    return <FormView {...props} />;
};

/** 單頁內容 Feature 預設 View，只負責輸出 DOM。 */
const Client_PageManagement_Form_FeatureView = (props: PageManagementFormViewProps) =>
{
    return (
        <ModuleContent nodeTitle={props.node.title} title={props.title} isLoading={props.isLoading} errorList={props.errorList} viewCountConfig={props.viewCountConfig}>
            <CmsHtml_Comp html={props.contentHtml} lang={props.lang} />
        </ModuleContent>
    );
};

/** 依 PageManagement DTO 建立 Preview / Entry 所需資料。 */
export const buildPageManagementPreviewViewData = (formData: PageManagementFormModel, lang: Lang): PageManagementFormData =>
{
    const detail = resolvePageManagementDetail(formData, lang);
    return { title: detail?.Title ?? "", contentHtml: detail?.Content ?? "", isLoading: false, errorList: [] };
};
// #endregion

// #region Private

/** 取得 PageManagement FormView，有 Spec View 時使用 Spec，否則使用 Feature View。 */
const getPageManagementFormView = (): typeof Client_PageManagement_Form_FeatureView =>
{
    if (pageManagementFormViewCache !== null)
    {
        return pageManagementFormViewCache;
    }

    pageManagementFormViewCache = resolveSpecComponent(
        getClientSlotPath("Slot_PageManagement_Form_Comp"),
        Client_PageManagement_Form_FeatureView,
        ["Client_PageManagement_Form"],
    );

    return pageManagementFormViewCache;
};

/** 取得 PageManagement FormView，有 Spec View 時使用 Spec，否則使用 Feature View。 */

/** 建立正式頁面瀏覽次數設定，Preview 不會呼叫。 */
const buildPageManagementViewCountConfig = (siteIndex: string, pageId: string): ModuleViewCountConfig =>
{
    const request: TryCountDetailViewRequest = { SiteIndex: siteIndex, ProgId: PGID.PageManagement, InternalId: pageId };
    return { mode: "form", contentKey: pageId, request };
};

/** 取得目前語系 PageManagement 明細。 */
const resolvePageManagementDetail = (formData: PageManagementFormModel, lang: Lang): PageManagementDetail | null =>
{
    const langKey = LibText.safeTrim(lang).toLowerCase();
    const detail = formData._PageManagementDetail?.find(item => LibText.safeTrim(item.Lang).toLowerCase() === langKey);
    return detail ?? formData._PageManagementDetail?.[0] ?? null;
};
// #endregion
