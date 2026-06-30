import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import type { Lang } from "@/SysCore/i18n/lang";

// #region Property
export interface PreviewFrameText
{
    rootTitle: string;
    contentTitle: string;
    relatedTitle: string;
    frontendTitle: string;
    switchToFullTitle: string;
    switchToMenuTitle: string;
}

export interface PreviewShellData
{
    site: INormSite;
    node: INormNode;
}
// #endregion

// #region Public
/** 建立 Preview 專用 fake site / node，供 Feature 與 Spec 外框共用。 */
export const buildPreviewShellData = (lang: Lang, site: INormSite, sourceNode: INormNode): PreviewShellData =>
{
    const text = getPreviewFrameText(lang);
    const contentNode = buildPreviewNode(previewContentId, text.contentTitle, "content-preview", sourceNode.module, [previewRootId, previewContentId], 2);
    const relatedNode = buildPreviewNode(previewRelatedId, text.relatedTitle, "related-info", undefined, [previewRootId, previewRelatedId], 2);
    const frontendNode = buildPreviewNode(previewFrontendId, text.frontendTitle, "frontend-view", undefined, [previewRootId, previewFrontendId], 2);
    const rootNode = buildPreviewRootNode(text, [contentNode, relatedNode, frontendNode]);
    const previewSite: INormSite = { ...site, treeByLang: { ...site.treeByLang, [lang]: [rootNode] } };
    return { site: previewSite, node: contentNode };
};

/** 取得 Preview 假資料與切換按鈕文字。 */
export const getPreviewFrameText = (lang: Lang): PreviewFrameText =>
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

// #region Private
const previewRootId = -9001;
const previewContentId = -9002;
const previewRelatedId = -9003;
const previewFrontendId = -9004;
const previewSafeLink = "#";

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

/** 建立 Preview 子節點，連結固定為 # 避免 Preview 內誤導頁。 */
const buildPreviewNode = (id: number, title: string, path: string, module: INormNode["module"], absIds: number[], level: number): INormNode =>
{
    return {
        id,
        title,
        path,
        type: "module",
        redirectTo: previewSafeLink,
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
// #endregion
