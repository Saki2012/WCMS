import { Accesskey } from "@/Features/Pages/Client/Scaffold/MainFrame/Accesskey/Accesskey";
import type { Lang } from "@/SysCore/i18n/lang";
import clsx from "clsx";
import type React from "react";
import "./subpage-content.css";

// #region Property
export type SubPageShellMode = "withMenu" | "full";

interface SubPageShellProps
{
    lang: Lang;
    mode: SubPageShellMode;
    topSlot?: React.ReactNode;
    leftSlot?: React.ReactNode;
    rightTopSlot?: React.ReactNode;
    children: React.ReactNode;
}
// #endregion

// #region Public
/** 子頁共用外框，正式前台與 Preview 共用版型。 */
export const SubPageShell = (props: SubPageShellProps) =>
{
    return (
        <div className="ContentPlaceContent_Area">
            <section className="Template content area">
                {props.topSlot}
                <div className="container-content + Layout_Padding_0_top Layout_Padding_5_bottom">
                    <div className="row">
                        {props.mode === "withMenu" && props.leftSlot}
                        <SubPageShellContent lang={props.lang} mode={props.mode} rightTopSlot={props.rightTopSlot}>
                            {props.children}
                        </SubPageShellContent>
                    </div>
                </div>
            </section>
        </div>
    );
};
// #endregion

// #region Section
/** 子頁右側內容區塊，負責 Accesskey 與主要內容 slot。 */
const SubPageShellContent = (props: { lang: Lang; mode: SubPageShellMode; rightTopSlot?: React.ReactNode; children: React.ReactNode; }) =>
{
    return (
        <div className={resolveContentCss(props.mode)}>
            {props.rightTopSlot}
            <div className="row">
                <div id="ContentPlaceContent_ContentConentA" className="col-sm-12 col-12 + All_Standard_Content_CSS + mb-5 mt-1">
                    <Accesskey type="C" lang={props.lang} />
                    {props.children}
                </div>
            </div>
        </div>
    );
};
// #endregion

// #region Private
/** 依照是否有側欄決定右側內容寬度。 */
const resolveContentCss = (mode: SubPageShellMode): string =>
{
    return clsx(
        "col-md-12",
        "col-sm-12",
        "col-12",
        mode === "withMenu" ? "col-xl-10" : "col-xl-12",
        mode === "withMenu" ? "col-lg-9" : "col-lg-12",
    );
};
// #endregion
