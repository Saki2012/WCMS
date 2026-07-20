import type { TinyMCEEditor } from "../../Core/tinyMceTypes";

// #region Property
const FIRST_LINE_INDENT_CLASS = "wcms-first-line-indent";
const HANGING_INDENT_CLASS = "wcms-hanging-indent";
const FIRST_LINE_INDENT_BUTTON = "firstlineindent";
const HANGING_INDENT_BUTTON = "hangingindent";
const EXCLUDED_PARENT_SELECTOR = "li,td,th";

interface TinyMceIndentButtonConfig
{
    name: string;
    tooltip: string;
    icon: string;
    className: string;
}

interface TinyMceToggleButtonApi
{
    setActive: (state: boolean) => void;
}
// #endregion

// #region Public
/** 註冊 TinyMCE 首行縮排、凸排按鈕與鍵盤快捷操作。 */
export const registerTinyMceParagraphIndentFeature = (editor: TinyMCEEditor): void =>
{
    registerIndentButton(editor, {
        name: FIRST_LINE_INDENT_BUTTON,
        tooltip: "首行縮排",
        icon: "indent",
        className: FIRST_LINE_INDENT_CLASS,
    });
    registerIndentButton(editor, {
        name: HANGING_INDENT_BUTTON,
        tooltip: "凸排",
        icon: "outdent",
        className: HANGING_INDENT_CLASS,
    });
    registerIndentKeyboard(editor);
};
// #endregion

// #region Protected
/** 註冊指定段落格式的工具列切換按鈕。 */
const registerIndentButton = (
    editor: TinyMCEEditor,
    config: TinyMceIndentButtonConfig,
): void =>
{
    editor.ui.registry.addToggleButton(config.name, {
        icon: config.icon,
        tooltip: config.tooltip,
        onAction: () => toggleSelectedParagraphs(editor, config.className),
        onSetup: (api) => bindButtonActiveState(editor, api, config.className),
    });
};

/** 註冊 Tab 首行縮排與 Shift + Tab 凸排。 */
const registerIndentKeyboard = (editor: TinyMCEEditor): void =>
{
    editor.on("keydown", (event: KeyboardEvent) =>
    {
        if (event.key !== "Tab") return;
        const paragraphs = resolveSelectedParagraphs(editor);
        if (paragraphs.length === 0) return;
        event.preventDefault();
        const className = event.shiftKey ? HANGING_INDENT_CLASS : FIRST_LINE_INDENT_CLASS;
        toggleParagraphFormat(editor, paragraphs, className);
    });
};
// #endregion

// #region Private
/** 切換目前選取段落的指定縮排格式。 */
const toggleSelectedParagraphs = (editor: TinyMCEEditor, className: string): void =>
{
    const paragraphs = resolveSelectedParagraphs(editor);
    if (paragraphs.length === 0) return;
    toggleParagraphFormat(editor, paragraphs, className);
};

/** 依目前狀態套用或取消指定縮排格式。 */
const toggleParagraphFormat = (
    editor: TinyMCEEditor,
    paragraphs: HTMLParagraphElement[],
    className: string,
): void =>
{
    const shouldApply = paragraphs.some((item) => !item.classList.contains(className));
    editor.undoManager.transact(() => updateParagraphClasses(paragraphs, className, shouldApply));
    editor.nodeChanged();
};

/** 套用指定格式並移除互斥的另一種縮排格式。 */
const updateParagraphClasses = (
    paragraphs: HTMLParagraphElement[],
    className: string,
    shouldApply: boolean,
): void =>
{
    paragraphs.forEach((paragraph) =>
    {
        paragraph.classList.remove(FIRST_LINE_INDENT_CLASS, HANGING_INDENT_CLASS);
        if (shouldApply) paragraph.classList.add(className);
    });
};

/** 取得目前選取範圍內可處理的一般段落。 */
const resolveSelectedParagraphs = (editor: TinyMCEEditor): HTMLParagraphElement[] =>
{
    const range = editor.selection.getRng();
    const paragraphs = editor.dom.select("p") as HTMLParagraphElement[];
    return paragraphs.filter((paragraph) =>
    {
        return range.intersectsNode(paragraph) && !editor.dom.getParent(paragraph, EXCLUDED_PARENT_SELECTOR);
    });
};

/** 同步工具列按鈕的啟用狀態。 */
const bindButtonActiveState = (
    editor: TinyMCEEditor,
    api: TinyMceToggleButtonApi,
    className: string,
): (() => void) =>
{
    const refresh = () =>
    {
        const paragraph = editor.dom.getParent(editor.selection.getNode(), "p") as HTMLParagraphElement | null;
        api.setActive(!!paragraph?.classList.contains(className));
    };
    editor.on("NodeChange", refresh);
    return () => editor.off("NodeChange", refresh);
};
// #endregion
