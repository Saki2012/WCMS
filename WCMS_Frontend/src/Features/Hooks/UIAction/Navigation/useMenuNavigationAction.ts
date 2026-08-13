import { markPageStateMemoryEntry } from "@/SysCore/Utils/PageStateMemory/PageStateMemory_Navigation";
import { LibRoutePath } from "@/SysCore/Utils/Route/LibRoute";
import { type MouseEvent, useCallback } from "react";
import { useLocation } from "react-router-dom";

// #region Property
export interface UseMenuNavigationActionResult
{
    /** Menu 站內導頁事件，負責在進入新功能前重設目標清單狀態。 */
    onMenuNavigate: (event: MouseEvent<HTMLAnchorElement>) => void;
}
// #endregion

// #region Public
/** 提供不同 Header／SubMenu 共用的 Menu 導頁狀態重設行為。 */
export const useMenuNavigationAction = (): UseMenuNavigationActionResult =>
{
    const location = useLocation();

    const onMenuNavigate = useCallback((event: MouseEvent<HTMLAnchorElement>): void =>
    {
        if (!shouldResetMenuTarget(event)) return;

        const targetPath = LibRoutePath.normalizeInternalPath(event.currentTarget.pathname);
        if (isSameMenuPath(targetPath, location.pathname))
        {
            event.preventDefault();
            return;
        }

        markPageStateMemoryEntry(targetPath, "reset");
    }, [location.pathname]);

    return { onMenuNavigate };
};
// #endregion

// #region Private
/** 判斷本次點擊是否屬於目前分頁內的一般站內 Menu 導頁。 */
const shouldResetMenuTarget = (event: MouseEvent<HTMLAnchorElement>): boolean =>
{
    if (event.defaultPrevented || event.button !== 0) return false;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
    if (event.currentTarget.target === "_blank") return false;
    if (event.currentTarget.origin !== window.location.origin) return false;
    return !event.currentTarget.getAttribute("href")?.startsWith("#");
};

/** 判斷兩個 Menu pathname 是否代表同一個站內路徑。 */
const isSameMenuPath = (left: string, right: string): boolean =>
{
    return LibRoutePath.isPathSegmentPrefix(left, right) && LibRoutePath.isPathSegmentPrefix(right, left);
};
// #endregion
