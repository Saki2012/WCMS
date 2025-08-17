export const SupportedLangs = ["zh-tw", "zh-cn", "en"] as const;
export type Lang = typeof SupportedLangs[number];
export const DefaultLang: Lang = "zh-tw";

export const isSupportedLang = (s?: string): s is Lang => !!s && SupportedLangs.includes(s.toLowerCase() as Lang);

export const normalizeLang = (s: string,): Lang => (isSupportedLang(s.toLowerCase()) ? (s.toLowerCase() as Lang) : DefaultLang);
