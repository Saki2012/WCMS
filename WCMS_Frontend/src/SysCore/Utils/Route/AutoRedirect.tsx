import { Link, Navigate } from "react-router-dom";

/** SSR 首渲染輸出 <Link> 後備；到瀏覽器再自動導向 */
export const AutoRedirect: React.FC<{ to: string; replace?: boolean; text?: string }> = ({ to, replace, text }) => {
    if (typeof window === "undefined") {
        return <Link to={to}>{text ?? "前往頁面"}</Link>;
    }
    return <Navigate to={to} replace={replace} />;
};