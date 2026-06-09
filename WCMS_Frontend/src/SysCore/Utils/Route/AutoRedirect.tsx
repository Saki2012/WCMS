import { DefaultLang } from "@/SysCore/i18n/lang";
import { useLang } from "@/SysCore/i18n/LangContext";
import { LangLink } from "@/SysCore/i18n/LangLink";
import { LibRouteLang } from "@/SysCore/Utils/Route/LibRoute";
import { useMemo } from "react";
import { Navigate } from "react-router-dom";

// #region Public
/** SSR 首渲染輸出 <Link> 後備；到瀏覽器再自動導向 */
export const AutoRedirect: React.FC<{ to: string; replace?: boolean; text?: string; noLangPrefix?: boolean; }> = ({ to, replace, text, noLangPrefix }) =>
{
    const { code } = useLang();
    const lang = code ?? DefaultLang;
    const finalTo = useMemo(() => noLangPrefix ? to : LibRouteLang.buildLangPathname(to, lang), [to, lang, noLangPrefix]);
    if (typeof window === "undefined")
    {
        return <LangLink to={to} noLangPrefix={noLangPrefix} title={text ?? "前往頁面"}>{text ?? "前往頁面"}</LangLink>;
    }
    return <Navigate to={finalTo} replace={replace} />;
};
// #endregion
