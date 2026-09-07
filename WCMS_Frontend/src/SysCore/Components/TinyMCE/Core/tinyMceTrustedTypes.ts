import { ensureWcmsDefaultTrustedTypesPolicy } from "@/SysCore/Security/Runtime/TrustedTypesPolicy";
import type { TinyMCEEditor } from "./tinyMceTypes";

// #region Property
type TinyMceTrustedTypesWindow = Window & {
    trustedTypes?: {
        defaultPolicy?: unknown | null;
    };
};
// #endregion

// #region Public
/** TinyMCE Classic iframe 在載入初始內容前，先替最終 Editor Window 建立 WCMS default Trusted Types policy。 */
export const registerTinyMceTrustedTypesBridge = (editor: TinyMCEEditor): void =>
{
    editor.on("PreInit", () =>
    {
        const editorWindow = editor.getWin();
        if (!editorWindow)
        {
            console.error("[WCMS][TinyMCE] Unable to resolve editor iframe window during PreInit for Trusted Types.");
            return;
        }

        ensureWcmsDefaultTrustedTypesPolicy(editorWindow);
    });

    // init 僅驗證 Security Contract；Policy Authority 仍在 PreInit，避免把建立時機退回過晚的 lifecycle。
    editor.on("init", () =>
    {
        const editorWindow = editor.getWin() as TinyMceTrustedTypesWindow | null;
        if (!editorWindow)
        {
            console.error("[WCMS][TinyMCE] Unable to resolve initialized editor iframe window for Trusted Types verification.");
            return;
        }

        if (editorWindow.trustedTypes && !editorWindow.trustedTypes.defaultPolicy)
        {
            console.error("[WCMS][TinyMCE] Trusted Types default policy is missing after editor initialization.");
        }
    });
};
// #endregion
