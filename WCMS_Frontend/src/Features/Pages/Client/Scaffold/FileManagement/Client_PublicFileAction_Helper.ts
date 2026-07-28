import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";

// #region Property
export type PublicFileActionType = "preview" | "download";
export type PublicFileActionTarget = "_blank" | undefined;
export type PublicFileActionRel = "noopener noreferrer" | undefined;

export interface IPublicFileActionSource
{
    /** FileManagement 對外使用的檔案識別碼。 */
    internalId: string | null | undefined;
    /** 對外顯示與下載使用的檔案名稱。 */
    fileName?: string | null;
    /** FileManagement 回傳的實際副檔名。 */
    fileExtension?: string | null;
}

export interface IPublicFileAction
{
    /** 前台附件應使用預覽或下載行為。 */
    actionType: PublicFileActionType;
    /** 對應 Public_Preview 或 Public_Download 的完整網址。 */
    url: string;
    /** Preview 另開新視窗；Download 維持原下載流程。 */
    target: PublicFileActionTarget;
    /** 另開新視窗時補上的安全關聯屬性。 */
    rel: PublicFileActionRel;
}

const PUBLIC_PREVIEW_EXTENSIONS = new Set<string>([
    "pdf",
    "jpg",
    "jpeg",
    "png",
    "gif",
    "bmp",
    "webp",
]);
// #endregion

// #region Public
/** 判斷 FileManagement 登記的副檔名是否列入前台預覽白名單。 */
export const canPublicPreviewFile = (
    fileExtension?: string | null,
): boolean =>
{
    const normalizedExtension = normalizeFileExtension(fileExtension);
    return PUBLIC_PREVIEW_EXTENSIONS.has(normalizedExtension);
};

/** 依照前台預覽白名單，解析附件應使用的 API 與開啟方式。 */
export const resolvePublicFileAction = (
    source: IPublicFileActionSource,
): IPublicFileAction =>
{
    const actionType = resolvePublicFileActionType(source.fileExtension);
    const url = buildPublicFileActionUrl(source, actionType);
    const isPreview = actionType === "preview";

    return {
        actionType,
        url,
        target: isPreview ? "_blank" : undefined,
        rel: isPreview ? "noopener noreferrer" : undefined,
    };
};
// #endregion

// #region Private
/** 清理副檔名的空白、前置句點與大小寫差異。 */
const normalizeFileExtension = (
    fileExtension?: string | null,
): string =>
{
    return fileExtension
        ?.trim()
        .replace(/^\./, "")
        .toLowerCase() ?? "";
};

/** 未列入預覽白名單的格式，一律安全退回 Download。 */
const resolvePublicFileActionType = (
    fileExtension?: string | null,
): PublicFileActionType =>
{
    return canPublicPreviewFile(fileExtension)
        ? "preview"
        : "download";
};

/** 依附件行為建立既有的公開預覽或下載網址。 */
const buildPublicFileActionUrl = (
    source: IPublicFileActionSource,
    actionType: PublicFileActionType,
): string =>
{
    if (actionType === "preview")
    {
        return FileManagementAPI.get_Public_Preview_Url(
            source.internalId,
            source.fileName,
        );
    }

    return FileManagementAPI.get_Public_Download_Url(
        source.internalId,
        source.fileName,
    );
};
// #endregion
