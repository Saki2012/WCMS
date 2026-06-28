// src/Features/Pages/Client/Route/ClientComponentResolver.ts
// 規則：
// 1. ClientComponentResolver 只保留非 Module 型 Slot。
// 2. Module Route 一律先走 Feature Module Comp。
// 3. Spec 客製優先放在 Hook / VM Extension 與 FormView/ListView Entry。
// 4. 只有 Header / HomePage 這類外層 Scaffold 才在這裡 resolve。
// 5. SubPage 固定走 Feature 主線，Spec 差異改由 BreadCrumb / SubMenu / ThirdMenu slot 處理。

import { HomePage as HomePageBase } from "@/Features/Pages/Client/Index/HomePage";
import { HomePageLoader as HomePageLoaderBase } from "@/Features/Pages/Client/Index/HomePage_Loader";
import { Header as HeaderBase } from "@/Features/Pages/Client/Scaffold/MainFrame/Header";
import { getClientSlotPath } from "@/Features/Pages/Client/Scaffold/Slot/Client_SlotPath";
import { SubPage as SubPageBase } from "@/Features/Pages/Client/Scaffold/SubPages/SubPage";
import { resolveSpecComponent, resolveSpecFunc } from "@/SysCore/Utils/Library/SlotResolver";

// #region Initialization
/** Header 外層 Slot，有 Spec 時使用 Spec Header。 */
export const Header: typeof HeaderBase = resolveSpecComponent(getClientSlotPath("Header"), HeaderBase, ["Header", "default"]);

/** SubPage 固定使用 Feature 主線，Spec 請改覆寫 BreadCrumb / SubMenu / ThirdMenu slot。 */
export const SubPage: typeof SubPageBase = SubPageBase;

/** HomePage 外層 Slot，有 Spec 時使用 Spec HomePage。 */
export const HomePage: typeof HomePageBase = resolveSpecComponent(getClientSlotPath("HomePage"), HomePageBase, ["HomePage", "default"]);

/** HomePage Loader Slot，有 Spec 時使用 Spec HomePageLoader。 */
export const HomePageLoader: typeof HomePageLoaderBase = resolveSpecFunc(getClientSlotPath("HomePageLoader"), HomePageLoaderBase, ["HomePageLoader", "default"]);
// #endregion
