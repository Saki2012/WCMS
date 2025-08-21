// src/SysCore/Utils/LangGuardRoute.tsx
import React from "react";
import { Outlet, useLocation, useParams } from "react-router-dom";
import { DefaultLang, isSupportedLang, normalizeLang } from "../../i18n/lang";
import { LangProvider } from "../../i18n/LangContext";
import { SeoLinks } from "./SeoLinks";
import { AutoRedirect } from "./AutoRedirect";

export const LangGuard: React.FC<{ ssrAcceptLang?: string; cookieLang?: string }> = (props) => {
    const { lang: langFromUrl } = useParams();          // 只有在 /:lang 分支才會有值
    const location = useLocation();

    // 挑一個最佳語言（用你的既有邏輯）
    const best = normalizeLang(langFromUrl ?? props.cookieLang ?? props.ssrAcceptLang ?? DefaultLang);

    // **只有真的有 URL lang 時才做「大小寫/別名」校正導頁**
    if (langFromUrl) {
        const normalized = normalizeLang(langFromUrl);
        if (!isSupportedLang(normalized) || normalized !== langFromUrl) {
            const rest = location.pathname.replace(/^\/[^/]+/, "");
            return <AutoRedirect to={`/${normalized}${rest}${location.search}${location.hash}`} replace />;
        }
    }

    // 沒有 :lang → 不導頁，只提供 Context + SEO
    return (
        <LangProvider initial={best}>
            <SeoLinks resolvedLang={best} pathname={location.pathname} />
            <Outlet />
        </LangProvider>
    );
};
