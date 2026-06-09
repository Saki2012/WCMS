// src/SysCore/Utils/LangGuardRoute.tsx
import { ScrollToTop } from "@/SysCore/Components/ScollToTop";
import { DefaultLang, type Lang } from "@/SysCore/i18n/lang";
import { LangProvider } from "@/SysCore/i18n/LangContext";
import { LibRouteLang } from "@/SysCore/Utils/Route/LibRoute";
import { SeoLinks } from "@/SysCore/Utils/Route/SeoLinks";
import React, { useEffect } from "react";
import { Outlet, useLoaderData, useLocation } from "react-router-dom";

// #region Property
type LangGuardLoaderData = { resolvedLang?: Lang; pathname?: string; };
// #endregion

// #region Public
export const LangGuard: React.FC<{ ssrAcceptLang?: string; cookieLang?: string; }> = () =>
{
    const location = useLocation();
    const data = useLoaderData() as LangGuardLoaderData | undefined;
    // loader 已經做完 strict lang 判定/redirect，這裡只讀結果即可
    const resolved = (data?.resolvedLang ?? DefaultLang) as Lang;
    useEffect(() =>
    {
        LibRouteLang.writeRouteLangCookie(resolved);
    }, [resolved]);
    return (
        <LangProvider initial={resolved}>
            <SeoLinks resolvedLang={resolved} pathname={location.pathname} />
            <ScrollToTop />
            <Outlet />
        </LangProvider>
    );
};
// #endregion
