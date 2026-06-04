import type { TinyMCEEditor } from "../../Core/tinyMceTypes";
import { formatHtmlSource } from "./htmlSourceFormatter";

const setSourceEditorContent = (editor: TinyMCEEditor, html: string) =>
{
    editor.focus();
    editor.undoManager.transact(() =>
    {
        editor.setContent(html);
    });
    editor.selection.setCursorLocation();
    editor.nodeChanged();
};

export const openFormattedSourceCodeDialog = (editor: TinyMCEEditor) =>
{
    const originalContent = editor.getContent({ source_view: true });
    let formattedContent = originalContent;

    try
    {
        const nextFormatted = formatHtmlSource(originalContent);
        if (nextFormatted.trim().length > 0) formattedContent = nextFormatted;
    } catch
    {
        formattedContent = originalContent;
    }

    editor.windowManager.open({
        title: "Source Code",
        size: "large",
        body: { type: "panel", items: [{ type: "textarea", name: "code" }] },
        buttons: [{ type: "cancel", name: "cancel", text: "Cancel" }, { type: "submit", name: "save", text: "Save", primary: true }],
        initialData: { code: formattedContent },
        onSubmit: (api) =>
        {
            const editedContent = api.getData().code;
            const contentToSave = editedContent === formattedContent ? originalContent : editedContent;
            setSourceEditorContent(editor, contentToSave);
            api.close();
        },
    });
};
