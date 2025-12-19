import React from "react";
import { useSearchParams } from "react-router-dom";
import { HeaderMetaComp } from "@/SysCore/Components/HeaderMeta/HeaderMeta_Comp";
import { LangLink } from "@/SysCore/i18n/LangLink";
import { useLang } from "@/SysCore/i18n/LangContext";
import type { Lang } from "@/SysCore/i18n/lang";
// ✅ 確保圖片會被 Vite bundle 進 dist（不要用硬編 /images/...）
import errorSvgUrl from "SpecFeature/Assets/Client/images/svg_icon/error.svg?url";

type Copy = { metaTitle: string; twTitle: string; enTitle: string; twP1: string; enP1: string; goHomeTitle: string; goHomeText: string; fromLabel: string; imgAlt: string; };

const getCopy = (lang?: Lang): Copy => {
    const l = String(lang ?? "zh-tw").toLowerCase();
    switch (l) {
        case "en":
            return {
                metaTitle: "Language not supported",
                twTitle: "",
                enTitle: "LANGUAGE NOT SUPPORTED",
                twP1: "",
                enP1: "Sorry, the language code you entered is not supported.",
                goHomeTitle: "Go back home",
                goHomeText: "GO BACK HOME",
                fromLabel: "Original URL:",
                imgAlt: "Unsupported language",
            };
        case "zh-tw":
        default:
            return {
                metaTitle: "語系不支援",
                twTitle: "語系不支援",
                twP1: "抱歉，目前不支援您輸入的語系代碼。",
                enTitle: "",
                enP1: "",
                goHomeTitle: "返回首頁",
                goHomeText: "返回首頁",
                fromLabel: "原始網址：",
                imgAlt: "語系不支援",
            };
    }
};

/**
 * /401
 * - 目前用於「語系不支援」或「語系格式不合法」的導頁
 * - 視覺樣式沿用 404 prototype 的 error-area
 */
export const Error401Page: React.FC = () => {
    const { code } = useLang();
    const copy = getCopy(code as Lang);
    const [sp] = useSearchParams();
    const from = (sp.get("from") ?? "").trim();

    return (
        <>
            <HeaderMetaComp title={copy.metaTitle} htmlLang={String(code ?? "zh-tw")} />
            <div id="error401">
                <div className="ContentPlaceContent_Area">
                    <section className="Template content area">
                        <div className="container-customize2">
                            <div className="row">
                                <div className="col-md-12">
                                    <div className="error-area">
                                        <div className="space text-center">
                                            <div className="error-thumb">
                                                <img src={errorSvgUrl} alt={copy.imgAlt} />
                                            </div>
                                            <div className="title-area text-center mb-0">
                                                {copy.twTitle ? <h2 className="tw-title mb-0">{copy.twTitle}</h2> : null}
                                                {copy.enTitle ? <h3 className="en-title mb-0">{copy.enTitle}</h3> : null}
                                                {copy.twP1 ? <p className="mb-0 mt-3">{copy.twP1}</p> : null}
                                                {copy.enP1 ? <p className="mb-0 mt-3">{copy.enP1}</p> : null}
                                                {from ? (
                                                    <p className="mb-0 mt-3">
                                                        <span className="me-1">{copy.fromLabel}</span>
                                                        <span>{from}</span>
                                                    </p>
                                                ) : null}
                                                <LangLink to="/" className="btn btn-primary btn-error-color" role="button" title={copy.goHomeTitle}>
                                                    {copy.goHomeText}
                                                </LangLink>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
};
