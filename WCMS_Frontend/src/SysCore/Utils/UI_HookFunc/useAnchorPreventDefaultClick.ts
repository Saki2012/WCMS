import { type KeyboardEvent, type KeyboardEventHandler, type MouseEvent, type MouseEventHandler, useCallback } from "react";

// #region Property
export type AnchorClickHandler = MouseEventHandler<HTMLAnchorElement>;
export type AnchorKeyDownHandler = KeyboardEventHandler<HTMLAnchorElement>;
export type AnchorActionEvent = MouseEvent<HTMLAnchorElement> | KeyboardEvent<HTMLAnchorElement>;
export type AnchorActionHandler = (event: AnchorActionEvent) => void;
export interface AnchorButtonActionHandlers
{
    /** 滑鼠點擊 Anchor Button 時執行的事件。 */
    onClick: AnchorClickHandler;
    /** 鍵盤 Enter / Space 啟用 Anchor Button 時執行的事件。 */
    onKeyDown: AnchorKeyDownHandler;
}
// #endregion

// #region Public
/** 用來處理 href="javascript:void(0);" 的<a>，避免之後無法編譯 */
export const useAnchorPreventDefaultClick = (onClick?: AnchorClickHandler) =>
{
    const handler = useCallback<AnchorClickHandler>((e) =>
    {
        const hasHandler = typeof onClick === "function";
        e.preventDefault();
        if (hasHandler) onClick(e);
    }, [onClick]);
    return handler;
};

/** 處理 <a> 模擬 button 時的 click / Enter / Space 啟用行為。 */
export const useAnchorButtonAction = (onAction?: AnchorActionHandler): AnchorButtonActionHandlers =>
{
    const onClick = useCallback<AnchorClickHandler>((event) =>
    {
        event.preventDefault();
        onAction?.(event);
    }, [onAction]);

    const onKeyDown = useCallback<AnchorKeyDownHandler>((event) =>
    {
        if (!isAnchorActivationKey(event.key)) return;
        event.preventDefault();
        onAction?.(event);
    }, [onAction]);

    return { onClick, onKeyDown };
};
// #endregion

// #region Private
/** 判斷目前按鍵是否為 Anchor Button 的啟用鍵。 */
const isAnchorActivationKey = (key: string): boolean =>
{
    return key === "Enter" || key === " " || key === "Spacebar";
};
// #endregion
