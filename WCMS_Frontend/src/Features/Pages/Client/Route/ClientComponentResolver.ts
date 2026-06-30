// src/Features/Pages/Client/Route/ClientComponentResolver.ts
// 規則：
// 1. ClientComponentResolver 只保留非 Module 型 Slot。
// 2. Module Route 一律先走 Feature Module Comp。
// 3. Spec 客製優先放在 Hook / VM Extension 與 FormView/ListView Entry。
// 4. Header / HomePage / SubPage 這類外層 Scaffold 可在這裡 resolve。
// 5. SubPage 以 lazy getter + cache 解析，讓 1810 這類 Scaffold 特規可覆寫外框。

import { HomePage as HomePageBase } from "@/Features/Pages/Client/Index/HomePage";
import { HomePageLoader as HomePageLoaderBase } from "@/Features/Pages/Client/Index/HomePage_Loader";
import { Header as HeaderBase } from "@/Features/Pages/Client/Scaffold/MainFrame/Header";
import { getClientSlotPath } from "@/Features/Pages/Client/Scaffold/Slot/Client_SlotPath";
import { SubPage as SubPageBase } from "@/Features/Pages/Client/Scaffold/SubPages/SubPage";
import { resolveSpecComponent, resolveSpecFunc } from "@/SysCore/Utils/Library/SlotResolver";
import { createElement } from "react";

// #region Initialization
/** SubPage 外層 Slot 快取，避免 render 期間重複解析 Spec Scaffold。 */
let subPageCompCache: typeof SubPageBase | null = null;

/** Header 外層 Slot，有 Spec 時使用 Spec Header。 */
export const Header: typeof HeaderBase = resolveSpecComponent(getClientSlotPath("Header"), HeaderBase, ["Header", "default"]);

/** HomePage 外層 Slot，有 Spec 時使用 Spec HomePage。 */
export const HomePage: typeof HomePageBase = resolveSpecComponent(getClientSlotPath("HomePage"), HomePageBase, ["HomePage", "default"]);

/** HomePage Loader Slot，有 Spec 時使用 Spec HomePageLoader。 */
export const HomePageLoader: typeof HomePageLoaderBase = resolveSpecFunc(getClientSlotPath("HomePageLoader"), HomePageLoaderBase, ["HomePageLoader", "default"]);
// #endregion

// #region Public
/** 子頁外框 Entry，允許 Spec 覆寫整體 Scaffold，但 Module 內容仍走 Feature 主流程。 */
export const SubPage: typeof SubPageBase = (props) =>
{
    // 宣告變數
    const SubPageComp = getSubPageComp();

    // return
    return createElement(SubPageComp, props);
};
// #endregion

// #region Private
/** 延後解析 SubPage slot，避免 top-level resolve 造成 circular import。 */
const getSubPageComp = () =>
{
    // 執行 function
    subPageCompCache ??= resolveSpecComponent<typeof SubPageBase>(getClientSlotPath("SubPage"), SubPageBase, ["SubPage", "default"]);

    // return
    return subPageCompCache;
};
// #endregion
