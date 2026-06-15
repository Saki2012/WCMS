import { HeaderMetaComp } from "@/SysCore/Components/HeaderMeta/HeaderMeta_Comp";
import { useLang } from "@/SysCore/i18n/LangContext";
import { LangLink } from "@/SysCore/i18n/LangLink";
import { LibRouteLang } from "@/SysCore/Utils/Route/LibRoute";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

// #region Property
const AUTO_REDIRECT_SECONDS = 5;

interface UseNotFoundCountdownOptions
{
    /** 倒數初始秒數 */
    initialSeconds: number;

    /** 倒數結束後執行的動作 */
    onFinished: () => void;
}
// #endregion

// #region Public
/** 前台 404 頁面：顯示找不到頁面，CSR hydration 後倒數返回首頁 */
export const Error404Page: React.FC = () =>
{
    const { code } = useLang();
    const [sp] = useSearchParams();
    const navigate = useNavigate();
    const from = (sp.get("from") ?? "").trim();

    const isEn = String(code ?? "zh-tw").toLowerCase() === "en";
    const metaTitle = isEn ? "Page not found" : "找不到頁面";
    const title = isEn ? "PAGE NOT FOUND" : "找不到頁面";
    const p1 = isEn ? "Sorry, the page you’re looking for doesn’t exist." : "抱歉，您要找的頁面不存在。";
    const goHomeTitle = isEn ? "Go back home" : "返回首頁";
    const goHomeText = isEn ? "GO BACK HOME" : "返回首頁";
    const fromLabel = isEn ? "Original URL:" : "原始網址：";
    const countdownText = isEn ? "You will be redirected to the homepage in" : "秒後將自動返回首頁。";
    const isServerFrom = from.toLowerCase().startsWith("/server");
    const homePath = useMemo(() =>
    {
        if (isServerFrom) return "/Server";
        const lang = LibRouteLang.normalizeRouteLang(code);
        return LibRouteLang.buildLangPathname("/", lang);
    }, [isServerFrom, code]);

    const goHome = useCallback((): void =>
    {
        navigate(homePath, { replace: true });
    }, [navigate, homePath]);

    const seconds = useNotFoundCountdown({ initialSeconds: AUTO_REDIRECT_SECONDS, onFinished: goHome });

    return (
        <>
            <HeaderMetaComp title={metaTitle} htmlLang={String(code ?? "zh-tw")} />
            <div id="error404">
                <div className="ContentPlaceHolder1">
                    <div className="error-area pt-100 pb-100">
                        <div className="container">
                            <div className="row">
                                <div className="col-lg-5 col-md-6">
                                    <div className="error-content">
                                        <h1>{title}</h1>
                                        <p>{p1}</p>

                                        {from
                                            ? (
                                                <p>
                                                    <strong>{fromLabel}</strong> {from}
                                                </p>
                                            )
                                            : null}

                                        <p aria-live="polite">
                                            {isEn
                                                ? `${countdownText} ${seconds} seconds.`
                                                : `${seconds} ${countdownText}`}
                                        </p>

                                        <LangLink to="/" title={goHomeTitle} className="default-btn">
                                            {goHomeText}
                                        </LangLink>
                                    </div>
                                </div>

                                <div className="col-lg-7 col-md-6">
                                    <div className="error-img" aria-hidden="true" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
// #endregion

// #region Private
/** CSR 倒數計時，SSR 不會執行 useEffect，因此只會在瀏覽器端跳轉 */
const useNotFoundCountdown = (opt: UseNotFoundCountdownOptions): number =>
{
    const [seconds, setSeconds] = useState(opt.initialSeconds);

    useEffect(() =>
    {
        if (seconds <= 0)
        {
            opt.onFinished();
            return;
        }

        const timer = window.setTimeout(() =>
        {
            setSeconds(prev => prev - 1);
        }, 1000);

        return () => window.clearTimeout(timer);
    }, [seconds, opt.onFinished]);

    return seconds;
};
// #endregion
