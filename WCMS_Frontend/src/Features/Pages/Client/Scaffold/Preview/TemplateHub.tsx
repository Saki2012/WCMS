import type { INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import { previewLangChangeEventType, resolvePreviewLangChangeEvent } from "@/Features/Pages/Client/Scaffold/Preview/PreviewLangEvent";
import { clientPreviewEntries } from "@/Features/Pages/Client/Scaffold/Preview/Registry/ClientPreviewEntries";
import { type ClientPreviewMessage, findClientPreviewEntry } from "@/Features/Pages/Client/Scaffold/Preview/Registry/ClientPreviewRegistry";
import { isSupportedLang, type Lang } from "@/SysCore/i18n/lang";
import { useEffect, useState } from "react";

// #region Property
interface TemplateHubProps
{
    site: INormSite;
    defaultLang: Lang;
}

interface TemplateHubState
{
    message: ClientPreviewMessage;
    lang: Lang;
}
// #endregion

// #region Public
/** 前台預覽路由入口，接收後台 PreviewFrame 訊息並交由 PreviewRegistry 渲染。 */
export const TemplateHub = (props: TemplateHubProps) =>
{
    const [state, setState] = useState<TemplateHubState | null>(null);

    useEffect(() =>
    {
        const handler = (ev: MessageEvent) =>
        {
            if (ev.origin !== window.location.origin) return;
            const message = ev.data as ClientPreviewMessage;
            if (!isClientPreviewMessage(message)) return;
            setState({ message, lang: resolvePreviewLang(message.payload, props.defaultLang) });
        };

        const langHandler = (event: Event) =>
        {
            const lang = resolvePreviewLangChangeEvent(event);
            if (!lang) return;
            setState(prev => prev ? { ...prev, lang } : prev);
        };

        window.addEventListener("message", handler);
        window.addEventListener(previewLangChangeEventType, langHandler);
        notifyPreviewReady();

        return () =>
        {
            window.removeEventListener("message", handler);
            window.removeEventListener(previewLangChangeEventType, langHandler);
        };
    }, [props.defaultLang]);

    if (!state) return <div role="status">等待預覽資料…（請從後台按預覽）</div>;

    const entry = findClientPreviewEntry(clientPreviewEntries, state.message);
    if (!entry) return <div role="alert">找不到預覽模組：{state.message.ProgId}</div>;

    return entry.render({ site: props.site, lang: state.lang, message: state.message, payload: state.message.payload });
};
// #endregion

// #region Private
const previewMessageType = "wcms:preview";
const previewReadyMessageType = "wcms:preview-ready";

/** 判斷訊息是否為 WCMS Preview message。 */
const isClientPreviewMessage = (message: unknown): message is ClientPreviewMessage =>
{
    if (!message || typeof message !== "object") return false;
    const previewMessage = message as Partial<ClientPreviewMessage>;
    return previewMessage.type === previewMessageType && typeof previewMessage.ProgId === "string";
};

/** 通知 PreviewFrame 目前 TemplateHub 已完成監聽，可以送入預覽資料。 */
const notifyPreviewReady = (): void =>
{
    if (typeof window === "undefined") return;
    if (window.parent === window) return;
    window.parent.postMessage({ type: previewReadyMessageType }, window.location.origin);
};

/** 從 payload 解析語系，沒有帶入時使用預設語系。 */
const resolvePreviewLang = (payload: unknown, defaultLang: Lang): Lang =>
{
    const lang = resolvePayloadLang(payload);
    return isSupportedLang(lang) ? lang : defaultLang;
};

/** 從 payload 取出 lang / Lang 欄位。 */
const resolvePayloadLang = (payload: unknown): string | undefined =>
{
    if (!payload || typeof payload !== "object") return undefined;
    const data = payload as { lang?: unknown; Lang?: unknown; };
    if (typeof data.lang === "string") return data.lang;
    return typeof data.Lang === "string" ? data.Lang : undefined;
};
// #endregion
