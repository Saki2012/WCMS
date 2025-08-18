import React from "react";
import { Navigate, Outlet, useLocation, useParams } from "react-router-dom";
import { DefaultLang, isSupportedLang, normalizeLang } from "../i18n/lang";
import { LangProvider } from "../i18n/LangContext";
import { SeoLinks } from "./SeoLinks";

interface ILangGuardProps {
    ssrAcceptLang?: string;
    cookieLang?: string;
}

const pickBest = (
    langFromUrl?: string,
    cookieLang?: string,
    ssrAcceptLang?: string
) => {
    const candidates = [
        langFromUrl,
        cookieLang,
        ssrAcceptLang,
        DefaultLang,
    ].filter(Boolean) as string[];

    for (const c of candidates) {
        const n = normalizeLang(c);
        if (isSupportedLang(n)) return n;
    }
    return DefaultLang;
};

export const LangGuard: React.FC<ILangGuardProps> = ({ ssrAcceptLang, cookieLang }) => {
    const { lang: langFromUrl } = useParams();
    const location = useLocation();

    const best = pickBest(langFromUrl, cookieLang, ssrAcceptLang);

    // 1) 沒有 :lang（例如 / 或 /News）→ 補上語系並保留子路徑與 query/hash
    if (!langFromUrl) {
        const rest = location.pathname === "/" ? "" : location.pathname;
        return <Navigate to={`/${best}${rest}${location.search}${location.hash}`} replace />;
    }

    // 2) 有 :lang 但不支援，或與正規化後不同（大小寫/別名）→ 以正規化語系重導
    const normalizedInUrl = normalizeLang(langFromUrl);
    if (!isSupportedLang(normalizedInUrl) || normalizedInUrl !== best) {
        const rest = location.pathname.replace(/^\/[^/]+/, ""); // 去掉原本的 :lang 片段
        return <Navigate to={`/${best}${rest}${location.search}${location.hash}`} replace />;
    }

    // 3) 語系 OK → 提供 Context + SEO Link 標籤並放行
    return (
        <LangProvider initial={best}>
            <SeoLinks resolvedLang={best} pathname={location.pathname} />
            <Outlet />
        </LangProvider>
    );
};
