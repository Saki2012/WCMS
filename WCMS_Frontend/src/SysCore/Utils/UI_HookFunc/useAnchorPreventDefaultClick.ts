import { useCallback } from "react";

export type AnchorClickHandler = React.MouseEventHandler<HTMLAnchorElement>;

/** 用來處理 href="javascript:void(0);" 的<a>，避免之後無法編譯*/
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