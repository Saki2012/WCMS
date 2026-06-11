import type { TinyMCEEditor } from "../Core/tinyMceTypes";
import { normalizePastedTableElement } from "./tinyMceTableUtils";

// #region Public
const hasCellSelection = (editor: TinyMCEEditor): boolean =>
{
    const doc = editor.getDoc();
    if (!doc) return false;

    const selected = editor.dom.select("td.mce-selected,th.mce-selected", doc);
    if (selected.length > 0) return true;

    const start = editor.selection.getStart(true);
    return !!(editor.dom.is(start, "td,th") || editor.dom.getParent(start, "td,th"));
};

export const syncEditorTables = (editor: TinyMCEEditor) =>
{
    const body = editor.getBody();
    if (body instanceof HTMLElement) normalizePastedTableElement(body);
};

export const registerTinyMceTableFeature = (editor: TinyMCEEditor) =>
{
    editor.on("init SetContent", () => syncEditorTables(editor));

    editor.ui.registry.addButton("smarttableprops", {
        tooltip: "表格/儲存格屬性",
        icon: "table",
        onAction: () =>
        {
            if (hasCellSelection(editor))
            {
                editor.execCommand("mceTableCellProps");
            } else
            {
                editor.execCommand("mceTableProps");
            }
        },
    });

    editor.ui.registry.addMenuItem?.("cellbg", { text: "設定儲存格背景色…", onAction: () => editor.execCommand("mceTableCellProps"), context: "table" });
};
// #endregion
