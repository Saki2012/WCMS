import { isSupportedLang, type Lang } from "@/SysCore/i18n/lang";

// #region Property
export const previewLangChangeEventType = "wcms:preview-lang-change" as const;

export interface PreviewLangChangeEventDetail
{
    /** Preview 要切換的語系。 */
    lang: Lang;
}
// #endregion

// #region Public
/** 發送 Preview 語系切換事件。 */
export const dispatchPreviewLangChange = (lang: Lang): void =>
{
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent<PreviewLangChangeEventDetail>(previewLangChangeEventType, { detail: { lang } }));
};

/** 從 Preview 語系事件解析語系。 */
export const resolvePreviewLangChangeEvent = (event: Event): Lang | null =>
{
    const customEvent = event as CustomEvent<Partial<PreviewLangChangeEventDetail>>;
    const lang = customEvent.detail?.lang;
    return isSupportedLang(lang) ? lang : null;
};
// #endregion
