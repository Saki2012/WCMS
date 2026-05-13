import { LangLink } from "@/SysCore/i18n/LangLink";
import parse, { attributesToProps, domToReact, Element, type DOMNode, type HTMLReactParserOptions } from "html-react-parser";
import { createElement, type AnchorHTMLAttributes, type ReactElement, type ReactNode } from "react";
import type { CmsHtmlParseOptions } from "./CmsHtml_Types";

const NATIVE_SCHEMES = /^(mailto|tel|sms|fax|blob):/i;

/** 將已正規化的 CMS HTML 解析成 ReactNode，並把內站 a 轉為 LangLink。 */
export const parseCmsHtml = (html: string, options: CmsHtmlParseOptions): ReactNode =>
{
    if (!html) return null;

    const parserOptions: HTMLReactParserOptions = {};
    parserOptions.replace = (node): ReactElement | undefined =>
    {
        if (!isAnchorNode(node)) return undefined;
        return renderAnchor(node, parserOptions, options);
    };

    return parse(html, parserOptions);
};

/** 渲染 a，讓可 SPA 化的內站連結走 LangLink。 */
const renderAnchor = (node: Element, parserOptions: HTMLReactParserOptions, options: CmsHtmlParseOptions): ReactElement =>
{
    const props = attributesToProps(node.attribs ?? {}) as AnchorHTMLAttributes<HTMLAnchorElement>;
    const href = `${props.href ?? ""}`.trim();
    const children = domToReact(node.children as DOMNode[], parserOptions);

    if (shouldKeepNativeAnchor(href, props))
    {
        return createElement("a", { ...props, href }, children);
    }

    const { href: _href, ...linkProps } = props;
    return <LangLink {...linkProps} to={href} lang={options.lang}>{children}</LangLink>;
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

/** 判斷 html-react-parser node 是否為 a。 */
const isAnchorNode = (node: DOMNode): node is Element =>
{
    return node instanceof Element && node.name.toLowerCase() === "a";
};
