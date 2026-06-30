import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import { buildPreviewShellData, getPreviewFrameText } from "@/Features/Pages/Client/Scaffold/Preview/Frame/PreviewFakeShellData";
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

