import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import { LeftFrame } from "@/Features/Pages/Client/Scaffold/SubPages/layouts/LeftFrame/LeftFrame";
import { TopFrame } from "@/Features/Pages/Client/Scaffold/SubPages/layouts/TopFrame/TopFrame";
import { BreadcrumbContext, type BreadcrumbItem } from "@/Features/Pages/Client/Scaffold/SubPages/Module/BreadCrumb/BreadCrumb_Comp";
import { SubPageShell, type SubPageShellMode } from "@/Features/Pages/Client/Scaffold/SubPages/SubPageShell";
import type { Lang } from "@/SysCore/i18n/lang";
import { type ReactNode, useMemo, useState } from "react";

// #region Property
interface PreviewSubPageFrameProps
{
    lang: Lang;
    site: INormSite;
    node: INormNode;
    children: ReactNode;
    /** Breadcrumb 右側工具列插槽，供模組追加自訂功能。 */
    toolbarRightSlot?: ReactNode;
}

interface PreviewFrameText
{
    rootTitle: string;
    contentTitle: string;
    relatedTitle: string;
    frontendTitle: string;
    switchToFullTitle: string;
    switchToMenuTitle: string;
}

interface PreviewShellData
{
    site: INormSite;
    node: INormNode;
}
// #endregion

// #region Public
/** 預覽專用子頁外框，沿用正式 TopFrame / LeftFrame，並提供滿版與側欄寬度切換。 */
export const PreviewSubPageFrame = (props: PreviewSubPageFrameProps) =>
{
    const [mode, setMode] = useState<SubPageShellMode>("withMenu");
    const [items, setItems] = useState<BreadcrumbItem[]>([]);
    const shellData = useMemo(() => buildPreviewShellData(props.lang, props.site, props.node), [props.lang, props.site, props.node]);

    return (
        <BreadcrumbContext.Provider value={{ items, setItems }}>
            <SubPageShell
                lang={props.lang}
                mode={mode}
                topSlot={
                    <TopFrame
                        lang={props.lang}
                        site={shellData.site}
                        node={shellData.node}
                        initialBanner={null}
                        toolbarRightSlot={<PreviewModeButton lang={props.lang} mode={mode} setMode={setMode} rightSlot={props.toolbarRightSlot} />}
                    />
                }
                leftSlot={<LeftFrame lang={props.lang} site={shellData.site} node={shellData.node} />}
            >
                {props.children}
            </SubPageShell>
        </BreadcrumbContext.Provider>
    );
};
// #endregion

// #region Section
/** Preview 右側工具列按鈕，負責切換滿版與側欄寬度。 */
const PreviewModeButton = (props: { lang: Lang; mode: SubPageShellMode; setMode: (mode: SubPageShellMode) => void; rightSlot?: ReactNode; }) =>
{
    const text = getPreviewFrameText(props.lang);
    const isFull = props.mode === "full";
    const title = isFull ? text.switchToMenuTitle : text.switchToFullTitle;

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
const previewRootId = -9001;
const previewContentId = -9002;
const previewRelatedId = -9003;
const previewFrontendId = -9004;

/** 建立 Preview 專用 fake site / node，讓正式 Breadcrumb 與 Menu 元件可以直接使用。 */
const buildPreviewShellData = (lang: Lang, site: INormSite, sourceNode: INormNode): PreviewShellData =>
{
    const text = getPreviewFrameText(lang);
    const contentNode = buildPreviewNode(previewContentId, text.contentTitle, "content-preview", "/Template", sourceNode.module, [previewRootId, previewContentId], 2);
    const relatedNode = buildPreviewNode(previewRelatedId, text.relatedTitle, "related-info", "#", undefined, [previewRootId, previewRelatedId], 2);
    const frontendNode = buildPreviewNode(previewFrontendId, text.frontendTitle, "frontend-view", "#", undefined, [previewRootId, previewFrontendId], 2);
    const rootNode = buildPreviewRootNode(text, [contentNode, relatedNode, frontendNode]);
    const previewSite: INormSite = { ...site, treeByLang: { ...site.treeByLang, [lang]: [rootNode] } };

    return { site: previewSite, node: contentNode };
};

/** 建立 Preview 根節點。 */
const buildPreviewRootNode = (text: PreviewFrameText, children: INormNode[]): INormNode =>
{
    return {
        id: previewRootId,
        title: text.rootTitle,
        path: "preview",
        type: "module",
        children,
        windowTarget: 0,
        isShowOnMenu: true,
        pageType: 0,
        level: 1,
        rootId: previewRootId,
        absIds: [previewRootId],
        absSegments: ["preview"],
    };
};

/** 建立 Preview 子節點。 */
const buildPreviewNode = (id: number, title: string, path: string, redirectTo: string, module: INormNode["module"], absIds: number[], level: number): INormNode =>
{
    return {
        id,
        title,
        path,
        type: "module",
        redirectTo,
        module,
        children: [],
        windowTarget: 0,
        isShowOnMenu: true,
        pageType: 0,
        level,
        rootId: previewRootId,
        absIds,
        absSegments: absIds.map((_, index) => index === 0 ? "preview" : path),
    };
};

/** 取得 Preview 假資料與切換按鈕文字。 */
const getPreviewFrameText = (lang: Lang): PreviewFrameText =>
{
    const isZh = lang === "zh-tw";

    return {
        rootTitle: isZh ? "預覽分類" : "Preview Category",
        contentTitle: isZh ? "預覽模式" : "Preview Mode",
        relatedTitle: isZh ? "相關資訊" : "Related Info",
        frontendTitle: isZh ? "前台呈現" : "Frontend View",
        switchToFullTitle: isZh ? "切換成滿版寬度" : "Switch to full width",
        switchToMenuTitle: isZh ? "切換成側欄寬度" : "Switch to sidebar width",
    };
};
// #endregion
