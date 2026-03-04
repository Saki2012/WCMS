// src/SysCore/Utils/LangGuardRoute.tsx
import React, { useEffect } from "react";
import { Outlet, useLoaderData, useLocation } from "react-router-dom";
import { DefaultLang, type Lang } from "@/SysCore/i18n/lang";
import { LangProvider } from "@/SysCore/i18n/LangContext";
import { SeoLinks } from "@/SysCore/Utils/Route/SeoLinks";
import { ScrollToTop } from "@/SysCore/Components/ScollToTop";
import { LANG_COOKIE_KEY } from "@/SysCore/Utils/Library/SysParam";


//#region Cookies相關
const setLangCookie = (lang: Lang) => {
    if (typeof document === "undefined") return;
    const maxAge = 60 * 60 * 24 * 365; // 1 year
    const secure = (typeof location !== "undefined" && location.protocol === "https:") ? "; Secure" : "";
    document.cookie = `${LANG_COOKIE_KEY}=${encodeURIComponent(lang)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
};
//#endregion

type LangGuardLoaderData = { resolvedLang?: Lang; pathname?: string; };
export const LangGuard: React.FC<{ ssrAcceptLang?: string; cookieLang?: string }> = () => {
    const location = useLocation();
    const data = useLoaderData() as LangGuardLoaderData | undefined;
    // loader 已經做完 strict lang 判定/redirect，這裡只讀結果即可
    const resolved = (data?.resolvedLang ?? DefaultLang) as Lang;
    useEffect(() => { setLangCookie(resolved); }, [resolved]);
    return (
        <LangProvider initial={resolved}>
            <SeoLinks resolvedLang={resolved} pathname={location.pathname} />
            <ScrollToTop />
            <Outlet />
        </LangProvider>
    );
};
