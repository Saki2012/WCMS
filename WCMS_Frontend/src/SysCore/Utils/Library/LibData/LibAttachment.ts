// #region Property
/** 檔案接受格式判斷參數 */
export interface AcceptFileOptions
{
    /** 允許的副檔名，例如 .jpg、png */
    extensions?: string[];
    /** 允許的 MIME type，例如 image/png */
    mimeTypes?: string[];
}
// #endregion

// #region Public
/** 取得檔案副檔名，回傳小寫且包含點號 */
export const getFileExtension = (file: File | string | null | undefined): string =>
{
    const fileName = resolveFileName(file);
    const index = fileName.lastIndexOf(".");
    if (index < 0) return "";
    return normalizeExtension(fileName.slice(index));
};


/** 移除檔名副檔名 */
export const removeFileExtension = (fileName: string | null | undefined): string =>
{
    const value = fileName ?? "";
    const index = value.lastIndexOf(".");

    return index < 0 ? value : value.slice(0, index);
};


/** 取得不含副檔名的檔案名稱 */
export const getFileNameWithoutExtension = (file: File | string | null | undefined): string =>
{
    return removeFileExtension(resolveFileName(file));
};


/** 取得附件顯示用檔名，避免點號開頭檔案被清空 */
export const getDisplayFileNameWithoutExtension = (file: File | string | null | undefined): string =>
{
    const fileName = resolveFileName(file).trim();
    const index = fileName.lastIndexOf(".");

    return index <= 0 ? fileName : fileName.slice(0, index);
};


/** 判斷檔案是否符合允許的副檔名或 MIME type */
export const isAcceptedFile = (file: File | string | null | undefined, options: AcceptFileOptions): boolean =>
{
    if (!file) return false;

    const extension = getFileExtension(file);
    const validExtensions = options.extensions?.map(normalizeExtension) ?? [];
    const extensionMatched = validExtensions.length === 0 || validExtensions.includes(extension);
    if (typeof file === "string") return extensionMatched;

    const validMimeTypes = options.mimeTypes ?? [];
    const mimeMatched = validMimeTypes.length === 0 || validMimeTypes.includes(file.type);

    return extensionMatched && mimeMatched;
};


/** 判斷檔案是否符合 input accept 字串白名單 */
export const isAcceptedByAcceptText = (file: File | string | null | undefined, accept: string | null | undefined): boolean =>
{
    if (!file) return false;

    const tokenList = parseAcceptText(accept);
    const fileName = resolveFileName(file).toLowerCase();
    const fileType = typeof file === "string" ? "" : file.type.toLowerCase();
    if (tokenList.length === 0) return true;

    return tokenList.some((token) => isAcceptedFileToken(token, fileName, fileType));
};


/** 建立附件顯示名稱，沒有附件名稱時使用檔名去副檔名 */
export const buildAttachmentDisplayName = (attachmentName: string | null | undefined, fileName: string | null | undefined): string =>
{
    const name = attachmentName?.trim();
    if (name) return name;

    return getFileNameWithoutExtension(fileName);
};
// #endregion

// #region Private
/** 正規化副檔名為小寫且包含點號 */
const normalizeExtension = (value: string): string =>
{
    const text = value.trim().toLowerCase();
    if (!text) return "";
    return text.startsWith(".") ? text : `.${text}`;
};

/** 解析 input accept 字串為白名單 token */
const parseAcceptText = (accept: string | null | undefined): string[] =>
{
    return (accept ?? "").split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
};

/** 判斷單一 accept token 是否允許目前檔案 */
const isAcceptedFileToken = (token: string, fileName: string, fileType: string): boolean =>
{
    if (token === "*" || token === "*/*") return true;
    if (token.startsWith(".")) return fileName.endsWith(token);
    if (token.endsWith("/*")) return fileType.startsWith(token.replace("/*", "/"));
    return fileType === token;
};

/** 取得 File 或檔名字串的名稱 */
const resolveFileName = (file: File | string | null | undefined): string =>
{
    if (!file) return "";
    return typeof file === "string" ? file : file.name;
};
// #endregion
