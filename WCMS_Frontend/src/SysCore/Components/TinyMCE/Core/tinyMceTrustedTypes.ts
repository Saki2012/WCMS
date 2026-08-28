import { ensureWcmsDefaultTrustedTypesPolicy } from "@/SysCore/Security/Runtime/TrustedTypesPolicy";
import type { TinyMCEEditor } from "./tinyMceTypes";

// #region Public
/** TinyMCE Classic iframe 載入後，先替該 Window 建立 WCMS default Trusted Types policy。 */
export const registerTinyMceTrustedTypesBridge = (editor: TinyMCEEditor): void =>
{
    editor.on("load", () =>
    {
        const editorWindow = editor.getWin();
        if (!editorWindow)
        {
            console.error("[WCMS][TinyMCE] Unable to resolve editor iframe window for Trusted Types.");
            return;
        }

        ensureWcmsDefaultTrustedTypesPolicy(editorWindow);
    });
};
// #endregion
