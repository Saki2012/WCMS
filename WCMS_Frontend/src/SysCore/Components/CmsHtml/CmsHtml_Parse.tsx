import { LangLink } from "@/SysCore/i18n/LangLink";
import type { ChildNode, Element } from "domhandler";
import { parseDocument } from "htmlparser2";
import { type AnchorHTMLAttributes, createElement, type CSSProperties, Fragment, type IframeHTMLAttributes, type ReactElement, type ReactNode } from "react";
import { CMS_HTML_VIEWER_ATTR, CMS_HTML_VIEWER_PDF, type CmsHtmlParseOptions } from "./CmsHtml_Types";
import { CmsPdfViewerFrame } from "./CmsPdfViewerFrame";

// #region Property
const NATIVE_SCHEMES = /^(mailto|tel|sms|fax|blob):/i;

const VOID_ELEMENT_NAMES = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);

const BLOCKED_ELEMENT_NAMES = new Set(["script", "style"]);

const BLOCKED_ATTRIBUTE_NAMES = new Set(["srcdoc"]);

const BOOLEAN_ATTRIBUTE_NAMES = new Set([
    "allowfullscreen",
    "async",
    "autofocus",
    "autoplay",
    "checked",
    "controls",
    "default",
    "defer",
    "disabled",
    "formnovalidate",
    "hidden",
    "ismap",
    "loop",
    "multiple",
    "muted",
    "novalidate",
    "open",
    "playsinline",
    "readonly",
    "required",
    "reversed",
    "selected",
]);

const REACT_PROP_NAME_MAP: Record<string, string> = {
    class: "className",
    for: "htmlFor",
    tabindex: "tabIndex",
    readonly: "readOnly",
    maxlength: "maxLength",
    minlength: "minLength",
    colspan: "colSpan",
    rowspan: "rowSpan",
    srcset: "srcSet",
    crossorigin: "crossOrigin",
    referrerpolicy: "referrerPolicy",
    allowfullscreen: "allowFullScreen",
    autoplay: "autoPlay",
    playsinline: "playsInline",
    acceptcharset: "acceptCharset",
    autocomplete: "autoComplete",
    enctype: "encType",
    formaction: "formAction",
    formenctype: "formEncType",
    formmethod: "formMethod",
    formnovalidate: "formNoValidate",
    formtarget: "formTarget",
    httpEquiv: "httpEquiv",
};

type HtmlPropValue = string | boolean | CSSProperties;

type HtmlProps = Record<string, HtmlPropValue | undefined> & { key?: string; };
// #endregion

// #region Public
/** 將已正規化的 CMS HTML 解析成 ReactNode，避免 html-react-parser 在 CSR 觸發 Trusted Types innerHTML 錯誤。 */
export const parseCmsHtml = (html: string, options: CmsHtmlParseOptions): ReactNode =>
{
    if (!html) return null;

    const doc = parseDocument(html, { decodeEntities: true });
    const children = renderNodes(doc.children, options);

    if (children.length === 0) return null;
    if (children.length === 1) return children[0];

    return createElement(Fragment, null, ...children);
};
// #endregion

// #region Protected
/** 批次轉換 DOM nodes。 */
const renderNodes = (nodes: ChildNode[], options: CmsHtmlParseOptions): ReactNode[] =>
{
    return nodes.map((node, index) => renderNode(node, `${index}`, options)).filter((node): node is ReactNode => node !== null);
};

/** 轉換單一 DOM node。 */
const renderNode = (node: ChildNode, key: string, options: CmsHtmlParseOptions): ReactNode | null =>
{
    if (isTextNode(node)) return node.data ?? "";
    if (!isElementNode(node)) return null;

    const tagName = node.name.toLowerCase();
    if (BLOCKED_ELEMENT_NAMES.has(tagName)) return null;
    if (tagName === "a") return renderAnchor(node, key, options);
    if (tagName === "iframe") return renderIframe(node, key, options);

    return renderNativeElement(node, key, options);
};

/** 渲染一般 HTML element。 */
const renderNativeElement = (node: Element, key: string, options: CmsHtmlParseOptions): ReactElement =>
{
    const tagName = node.name.toLowerCase();
    const props = buildReactProps(node.attribs ?? {}, key);

    if (VOID_ELEMENT_NAMES.has(tagName)) return createElement(tagName, props);

    const children = renderNodes(node.children ?? [], options);
    return createElement(tagName, props, ...children);
};

/** 渲染 a，讓可 SPA 化的內站連結走 LangLink。 */
const renderAnchor = (node: Element, key: string, options: CmsHtmlParseOptions): ReactElement =>
{
    const props = buildReactProps(node.attribs ?? {}, key) as AnchorHTMLAttributes<HTMLAnchorElement> & { key?: string; };
    const href = `${props.href ?? ""}`.trim();
    const children = renderNodes(node.children ?? [], options);

    if (shouldKeepNativeAnchor(href, props))
    {
        return createElement("a", { ...props, href }, ...children);
    }

    const { href: _href, ...linkProps } = props;
    return <LangLink {...linkProps} to={href} lang={options.lang}>{children}</LangLink>;
};

/** 渲染 iframe，PDF 來源改走前台 PDF Viewer。 */
const renderIframe = (node: Element, key: string, options: CmsHtmlParseOptions): ReactElement =>
{
    const props = buildReactProps(node.attribs ?? {}, key) as IframeHTMLAttributes<HTMLIFrameElement> & { key?: string; [CMS_HTML_VIEWER_ATTR]?: string; };
    const src = `${props.src ?? ""}`.trim();
    const title = `${props.title ?? ""}`.trim();

    if (shouldRenderPdfViewer(props, src))
    {
        return <CmsPdfViewerFrame key={key} fileUrl={src} title={title} lang={options.lang} />;
    }

    return createElement("iframe", props);
};

/** 將 HTML attributes 轉成 React props。 */
const buildReactProps = (attribs: Record<string, string>, key: string): HtmlProps =>
{
    const props: HtmlProps = { key };

    Object.entries(attribs).forEach(([rawName, rawValue]) =>
    {
        const name = rawName.trim();
        const lowerName = name.toLowerCase();

        if (!name) return;
        if (/^on/i.test(name)) return;
        if (BLOCKED_ATTRIBUTE_NAMES.has(lowerName)) return;

        const propName = toReactPropName(lowerName);
        const propValue = toReactPropValue(lowerName, rawValue);

        if (propValue !== undefined) props[propName] = propValue;
    });

    return props;
};
// #endregion

// #region Private
/** 判斷 iframe 是否應轉成 PDF Viewer。 */
const shouldRenderPdfViewer = (props: IframeHTMLAttributes<HTMLIFrameElement> & { [CMS_HTML_VIEWER_ATTR]?: string; }, src: string): boolean =>
{
    if (!src) return false;
    if (`${props[CMS_HTML_VIEWER_ATTR] ?? ""}`.toLowerCase() === CMS_HTML_VIEWER_PDF) return true;
    return src.toLowerCase().includes(".pdf");
};

/** 轉換 React prop 名稱。 */
const toReactPropName = (lowerName: string): string =>
{
    if (lowerName.startsWith("aria-")) return lowerName;
    if (lowerName.startsWith("data-")) return lowerName;
    return REACT_PROP_NAME_MAP[lowerName] ?? lowerName;
};

/** 轉換 React prop 值。 */
const toReactPropValue = (lowerName: string, value: string): HtmlPropValue | undefined =>
{
    if (lowerName === "style") return parseStyleAttribute(value);
    if (!BOOLEAN_ATTRIBUTE_NAMES.has(lowerName)) return value;

    const text = `${value ?? ""}`.trim();
    if (!text || text.toLowerCase() === lowerName) return true;

    return text;
};

/** 將 style 字串轉為 React CSSProperties。 */
const parseStyleAttribute = (styleText: string): CSSProperties =>
{
    const result: Record<string, string> = {};

    styleText.split(";").forEach(item =>
    {
        const separatorIndex = item.indexOf(":");
        if (separatorIndex <= 0) return;

        const name = item.slice(0, separatorIndex).trim();
        const value = item.slice(separatorIndex + 1).trim();

        if (!name || !value) return;
        if (/expression\s*\(|javascript:/i.test(value)) return;

        result[toCamelCase(name)] = value;
    });

    return result as CSSProperties;
};

/** 將 CSS kebab-case 轉 camelCase。 */
const toCamelCase = (value: string): string =>
{
    return value.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase());
};

/** 判斷 a 是否必須保留原生瀏覽器行為。 */
const shouldKeepNativeAnchor = (href: string, props: AnchorHTMLAttributes<HTMLAnchorElement>): boolean =>
{
    const lowerHref = href.toLowerCase();

    if (!href) return true;
    if (href.startsWith("#")) return true;
    if (lowerHref === "#") return true;
    if (lowerHref.startsWith("/service/")) return true;
    if (props.download !== undefined) return true;
    if (NATIVE_SCHEMES.test(href)) return true;
    if (!href.startsWith("/") && !/^(https?:)?\/\//i.test(href)) return true;

    return false;
};

/** 判斷是否為文字節點。 */
const isTextNode = (node: ChildNode) =>
{
    return node.type === "text";
};

/** 判斷是否為 HTML element。 */
const isElementNode = (node: ChildNode): node is Element =>
{
    return "name" in node && typeof node.name === "string";
};
// #endregion
