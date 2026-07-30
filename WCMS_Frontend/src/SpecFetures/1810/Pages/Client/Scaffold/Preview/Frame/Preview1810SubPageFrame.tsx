import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import { buildPreviewShellData, getPreviewFrameText } from "@/Features/Pages/Client/Scaffold/Preview/Frame/PreviewFakeShellData";
import { Accesskey } from "@/Features/Pages/Client/Scaffold/MainFrame/Accesskey/Accesskey";
import { BreadcrumbContext, type BreadcrumbItem } from "@/Features/Pages/Client/Scaffold/SubPages/Module/BreadCrumb/BreadCrumb_Comp";
import { BreadCrumb_Comp } from "@/SpecFetures/1810/Pages/Client/Scaffold/SubPages/Module/BreadCrumb/BreadCrumb_Comp";
import { SubMenu_Comp } from "@/SpecFetures/1810/Pages/Client/Scaffold/SubPages/Module/SubMenu/SubMenu_Comp";
import { ThirdMenu_Comp } from "@/SpecFetures/1810/Pages/Client/Scaffold/SubPages/Module/ThirdMenu/ThirdMenu_Comp";
import { SubBanner_Comp } from "@/SpecFetures/1810/Pages/Client/Scaffold/SubPages/Section/SubBanner_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import clsx from "clsx";
import { type ReactNode, useMemo, useState } from "react";

// #region Property
interface Preview1810SubPageFrameProps
{
    lang: Lang;
    site: INormSite;
    node: INormNode;
    children: ReactNode;
    /** Breadcrumb 右側工具列插槽，供模組追加自訂功能。 */
    toolbarRightSlot?: ReactNode;
}

type Preview1810FrameMode = "withMenu" | "full";

// #endregion

// #region Public
/** 1810 預覽專用外框，保留 fake node，但使用 Spec1810 子頁 DOM 與寬度。 */
export const Preview1810SubPageFrame = (props: Preview1810SubPageFrameProps) =>
{
    // 宣告變數
    const [mode, setMode] = useState<Preview1810FrameMode>("withMenu");
    const [items, setItems] = useState<BreadcrumbItem[]>([]);
    const shellData = useMemo(() => buildPreviewShellData(props.lang, props.site, props.node), [props.lang, props.site, props.node]);
    const toolbarSlot = <PreviewModeButton lang={props.lang} mode={mode} setMode={setMode} rightSlot={props.toolbarRightSlot} />;

    // return
    return (
        <BreadcrumbContext.Provider value={{ items, setItems }}>
            <div className="ContentPlaceContent_Area">
                <section className="Template content area">
                    <SubBanner_Comp lang={props.lang} node={shellData.node} initialBanner={null} />
                    <PreviewBreadcrumbSection lang={props.lang} site={shellData.site} node={shellData.node} toolbarRightSlot={toolbarSlot} />
                    <PreviewBodySection lang={props.lang} site={shellData.site} node={shellData.node} mode={mode}>
                        {props.children}
                    </PreviewBodySection>
                </section>
            </div>
        </BreadcrumbContext.Provider>
    );
};
// #endregion

// #region Section
/** 1810 Preview 麵包屑區塊，使用 Spec1810 container 寬度。 */
const PreviewBreadcrumbSection = (props: { lang: Lang; site: INormSite; node: INormNode; toolbarRightSlot: ReactNode; }) =>
{
    // return
    return (
        <div className="container-customize1">
            <div className="row">
                <BreadCrumb_Comp lang={props.lang} site={props.site} node={props.node} toolbarRightSlot={props.toolbarRightSlot} />
            </div>
        </div>
    );
};

/** 1810 Preview 主要內容容器。 */
const PreviewBodySection = (props: { lang: Lang; site: INormSite; node: INormNode; mode: Preview1810FrameMode; children: ReactNode; }) =>
{
    // 宣告變數
    const hasSubMenu = props.mode === "withMenu" && resolveHasSubMenu(props.node);

    // return
    return (
        <div className="container-customize1 Layout_Padding_3_bottom">
            <div className="row">
                {hasSubMenu && <SubMenu_Comp lang={props.lang} site={props.site} node={props.node} />}
                <PreviewRightContentSection lang={props.lang} site={props.site} node={props.node} hasSubMenu={hasSubMenu}>
                    {props.children}
                </PreviewRightContentSection>
            </div>
        </div>
    );
};

/** 1810 Preview 右側內容區塊。 */
const PreviewRightContentSection = (props: { lang: Lang; site: INormSite; node: INormNode; hasSubMenu: boolean; children: ReactNode; }) =>
{
    // 宣告變數
    const contentCss = clsx("col-md-12", "col-sm-12", "col-12", props.hasSubMenu ? "col-lg-10" : "col-lg-12");

    // return
    return (
        <div className={contentCss}>
            <ThirdMenu_Comp lang={props.lang} site={props.site} node={props.node} />
            <div className="row">
                <div id="ContentPlaceContent_ContentConentA" className="col-sm-12 col-12 + All_Standard_Content_CSS + mb-5 mt-1">
                    <Accesskey type="C" lang={props.lang} />
                    {props.children}
                </div>
            </div>
        </div>
    );
};

/** Preview 右側工具列按鈕，負責切換滿版與側欄寬度。 */
const PreviewModeButton = (props: { lang: Lang; mode: Preview1810FrameMode; setMode: (mode: Preview1810FrameMode) => void; rightSlot?: ReactNode; }) =>
{
    // 宣告變數
    const text = getPreviewFrameText(props.lang);
    const isFull = props.mode === "full";
    const title = isFull ? text.switchToMenuTitle : text.switchToFullTitle;

    // return
    return (
        <>
            {props.rightSlot}
            <button type="button" className="btn btn-sm btn-outline-secondary" aria-pressed={!isFull} title={title} onClick={() => props.setMode(isFull ? "withMenu" : "full")}>
                {title}
            </button>
        </>
    );
};
// #endregion

// #region Private
/** 判斷 1810 Preview 是否需要左側選單。 */
const resolveHasSubMenu = (node: INormNode): boolean =>
{
    // return
    return node.pageType === 0 && ((node.level ?? 0) > 0 || (node.children?.length ?? 0) > 0);
};

// #endregion
