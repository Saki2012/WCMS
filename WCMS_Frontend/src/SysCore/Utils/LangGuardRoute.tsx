import React from "react";
import { Outlet, useLocation, useParams } from "react-router-dom";
import { DefaultLang, isSupportedLang, normalizeLang } from "../i18n/lang";
import { LangProvider } from "../i18n/LangContext";
import { SeoLinks } from "./SeoLinks";

interface ILangGuardProps
{
    ssrAcceptLang?: string;
    cookieLang?: string;
}

export const LangGuard: React.FC<ILangGuardProps> = ({ ssrAcceptLang, cookieLang }) =>
{
    const { lang: langFromUrl } = useParams(); // 只有在 /:lang/* 入口才會有
    const location = useLocation();

    const resolved = langFromUrl && isSupportedLang(langFromUrl)
        ? normalizeLang(langFromUrl)
        : (cookieLang && isSupportedLang(cookieLang)
            ? normalizeLang(cookieLang)
            : (ssrAcceptLang && isSupportedLang(ssrAcceptLang)
                ? normalizeLang(ssrAcceptLang)
                : DefaultLang));

    return (
        <LangProvider initial={resolved}>
            <SeoLinks resolvedLang={resolved} pathname={location.pathname} />
            <Outlet />
        </LangProvider>
    );
};
