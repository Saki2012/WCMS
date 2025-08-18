// src/SysCore/i18n/lang.ts
export type Lang = "zh-tw" | "zh-cn" | "en";
export const DefaultLang: Lang = "zh-tw";

const alias: Record<string, Lang> = {
    "zh-tw": "zh-tw",
    "zh-hant": "zh-tw",
    "zh-cn": "zh-cn",
    "zh-hans": "zh-cn",
    "en": "en",
    "en-us": "en",
    "en-gb": "en",
};

export const normalizeLang = (x?: string | null): Lang => alias[(x ?? "").toLowerCase()] ?? DefaultLang;

export const isSupportedLang = (x?: string | null): x is Lang =>
    ["zh-tw", "zh-cn", "en"].includes((x ?? "").toLowerCase());
