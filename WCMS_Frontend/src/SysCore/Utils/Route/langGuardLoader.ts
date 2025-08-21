// src/SysCore/Utils/langGuardLoader.ts
import { type LoaderFunctionArgs, redirect } from "react-router-dom";
import { DefaultLang, isSupportedLang, type Lang, normalizeLang } from "../../i18n/lang";

const pickFromCookie = (cookie?: string | null) => cookie?.match(/(?:^|;\s*)lang=([^;]+)/)?.[1];

const pickFromAccept = (h?: string | null) => h?.split(",")?.[0]?.split(";")?.[0];

export const langGuardLoader = async ({ request, params }: LoaderFunctionArgs) =>
{
    const url = new URL(request.url);
    const seg1 = url.pathname.split("/").filter(Boolean)[0]; // 第一段
    const hasUrlLang = isSupportedLang(seg1);

    // A) 命中 /:lang 家族 ⇒ 做大小寫/別名正規化；必要時才 redirect
    if (hasUrlLang)
    {
        const normalized = normalizeLang(seg1);
        if (seg1 !== normalized)
        {
            const rest = url.pathname.replace(/^\/[^/]+/, "");
            throw redirect(`/${normalized}${rest}${url.search}${url.hash}`, 302);
        }
        return { resolvedLang: normalized as Lang, pathname: url.pathname };
    }

    // B) 根 "/"（或第一段不是語系）⇒ **不要 redirect**，只決定語系供 Context 使用
    const cookie = pickFromCookie(request.headers.get("cookie"));
    const accept = pickFromAccept(request.headers.get("accept-language"));
    const best = normalizeLang(cookie ?? accept ?? DefaultLang);
    return { resolvedLang: best as Lang, pathname: url.pathname };
};
