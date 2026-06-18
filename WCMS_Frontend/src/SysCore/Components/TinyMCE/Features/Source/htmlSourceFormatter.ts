// #region Property
const ELEMENT_NODE = 1;

const TEXT_NODE = 3;

const COMMENT_NODE = 8;

const INDENT_UNIT = "  ";

const ATTRIBUTE_WRAP_WIDTH = 120;

const VOID_ELEMENTS = new Set([
    "area",
    "base",
    "br",
    "col",
    "embed",
    "hr",
    "img",
    "input",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr",
]);

const PRESERVE_OUTER_HTML = new Set(["pre", "script", "style", "textarea"]);
// #endregion

// #region Public
export const formatHtmlSource = (html: string) =>
{
    if (typeof DOMParser === "undefined") return html;
    if (html.trim().length === 0) return html;

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const blocks = Array.from(doc.body.childNodes)
        .map((node) => serializeBlockNode(node, 0))
        .filter((block) => block.length > 0);

    return blocks.join("\n");
};
// #endregion

// #region Private
const repeatIndent = (depth: number) => INDENT_UNIT.repeat(depth);

const escapeText = (value: string) =>
{
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\u00a0/g, "&nbsp;");
};

const escapeAttribute = (value: string) =>
{
    return escapeText(value).replace(/"/g, "&quot;");
};

const isMeaningfulTextNode = (node: ChildNode) =>
{
    return node.nodeType === TEXT_NODE && (node.textContent ?? "").trim().length > 0;
};

const isIgnorableWhitespaceNode = (node: ChildNode) =>
{
    return node.nodeType === TEXT_NODE && (node.textContent ?? "").trim().length === 0;
};

const createStartTag = (element: Element, depth: number) =>
{
    const tagName = element.tagName.toLowerCase();
    const attrs = Array.from(element.attributes);

    if (attrs.length === 0) return `<${tagName}>`;

    const serializedAttrs = attrs.map((attr) => `${attr.name}="${escapeAttribute(attr.value)}"`);
    const singleLineTag = `<${tagName} ${serializedAttrs.join(" ")}>`;
    const shouldWrapAttributes = attrs.length >= 3
        || singleLineTag.length > ATTRIBUTE_WRAP_WIDTH
        || attrs.some((attr) => attr.value.length > 80);

    if (!shouldWrapAttributes) return singleLineTag;

    const closingIndent = repeatIndent(depth);
    const attributeIndent = repeatIndent(depth + 1);
    return [
        `<${tagName}`,
        ...serializedAttrs.map((attr) => `${attributeIndent}${attr}`),
        `${closingIndent}>`,
    ].join("\n");
};

const createEndTag = (element: Element) =>
{
    return VOID_ELEMENTS.has(element.tagName.toLowerCase()) ? "" : `</${element.tagName.toLowerCase()}>`;
};

const indentMultiline = (value: string, depth: number) =>
{
    const indent = repeatIndent(depth);
    return value
        .split(/\r?\n/)
        .map((line) => line.length > 0 ? `${indent}${line}` : line)
        .join("\n");
};

const serializeInlineNode = (node: ChildNode, depth: number): string =>
{
    if (node.nodeType === TEXT_NODE) return escapeText(node.textContent ?? "");
    if (node.nodeType === COMMENT_NODE) return `<!--${(node.textContent ?? "")}-->`;
    if (node.nodeType !== ELEMENT_NODE) return "";

    const element = node as Element;
    const tagName = element.tagName.toLowerCase();

    if (PRESERVE_OUTER_HTML.has(tagName)) return element.outerHTML;

    const startTag = createStartTag(element, depth);
    if (VOID_ELEMENTS.has(tagName)) return startTag;

    const innerHtml = Array.from(element.childNodes)
        .map((child) => serializeInlineNode(child, depth + 1))
        .join("");

    return `${startTag}${innerHtml}${createEndTag(element)}`;
};

const serializeBlockNode = (node: ChildNode, depth: number): string =>
{
    const indent = repeatIndent(depth);

    if (node.nodeType === TEXT_NODE)
    {
        return isMeaningfulTextNode(node) ? `${indent}${escapeText(node.textContent ?? "")}` : "";
    }

    if (node.nodeType === COMMENT_NODE) return `${indent}<!--${(node.textContent ?? "")}-->`;
    if (node.nodeType !== ELEMENT_NODE) return "";

    const element = node as Element;
    const tagName = element.tagName.toLowerCase();

    if (PRESERVE_OUTER_HTML.has(tagName)) return indentMultiline(element.outerHTML, depth);

    const startTag = createStartTag(element, depth);
    const endTag = createEndTag(element);

    if (VOID_ELEMENTS.has(tagName)) return `${indent}${startTag}`;

    const children = Array.from(element.childNodes).filter((child) => !isIgnorableWhitespaceNode(child));
    if (children.length === 0) return `${indent}${startTag}${endTag}`;

    if (children.some((child) => isMeaningfulTextNode(child)))
    {
        const inlineHtml = children.map((child) => serializeInlineNode(child, depth + 1)).join("");
        return `${indent}${startTag}${inlineHtml}${endTag}`;
    }

    const childBlocks = children
        .map((child) => serializeBlockNode(child, depth + 1))
        .filter((block) => block.length > 0);

    if (childBlocks.length === 0) return `${indent}${startTag}${endTag}`;

    return `${indent}${startTag}\n${childBlocks.join("\n")}\n${indent}${endTag}`;
};
// #endregion
