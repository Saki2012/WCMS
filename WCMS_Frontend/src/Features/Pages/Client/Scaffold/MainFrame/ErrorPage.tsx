import React from "react";
import { useSearchParams } from "react-router-dom";
import { HeaderMetaComp } from "@/SysCore/Components/HeaderMeta/HeaderMeta_Comp";
import { LangLink } from "@/SysCore/i18n/LangLink";
import { useLang } from "@/SysCore/i18n/LangContext";
// ✅ 確保圖片會被 Vite bundle 進 dist（不要用硬編 /images/...）
// import errorSvgUrl from "SpecFeature/Assets/Client/images/svg_icon/error.svg?url";

/**
 * /401
 * - 目前用於「語系不支援」或「語系格式不合法」的導頁
 * - 視覺樣式沿用 404 prototype 的 error-area
 */
// ✅ /404
export const Error404Page: React.FC = () => {
    const { code } = useLang();
    const [sp] = useSearchParams();
    const from = (sp.get("from") ?? "").trim();

    const isEn = String(code ?? "zh-tw").toLowerCase() === "en";
    const metaTitle = isEn ? "Page not found" : "找不到頁面";
    const title = isEn ? "PAGE NOT FOUND" : "找不到頁面";
    const p1 = isEn
        ? "Sorry, the page you’re looking for doesn’t exist."
        : "抱歉，您要找的頁面不存在。";
    const goHomeTitle = isEn ? "Go back home" : "返回首頁";
    const goHomeText = isEn ? "GO BACK HOME" : "返回首頁";
    const fromLabel = isEn ? "Original URL:" : "原始網址：";
    const imgAlt = isEn ? "Page not found" : "找不到頁面";

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

                                        {from ? (
                                            <p>
                                                <strong>{fromLabel}</strong> {from}
                                            </p>
                                        ) : null}

                                        <LangLink to="/" title={goHomeTitle} className="default-btn">
                                            {goHomeText}
                                        </LangLink>
                                    </div>
                                </div>

                                <div className="col-lg-7 col-md-6">
                                    <div className="error-img">
                                        errorSvgUrl
                                        {/* <img src={errorSvgUrl} alt={imgAlt} /> */}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
