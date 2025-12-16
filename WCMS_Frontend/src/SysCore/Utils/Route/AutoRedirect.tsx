import { LangLink } from "@/SysCore/i18n/LangLink";
import { Navigate } from "react-router-dom";

/** SSR 首渲染輸出 <Link> 後備；到瀏覽器再自動導向 */
export const AutoRedirect: React.FC<{ to: string; replace?: boolean; text?: string }> = ({ to, replace, text }) => {
    if (typeof window === "undefined") {
        return <LangLink to={to}>{text ?? "前往頁面"}</LangLink>;
    }
    return <Navigate to={to} replace={replace} />;
};