// #region Property
/** getValue 的函式型別 */
export type EnumGetValueFunc<T extends Record<string, string | number>> = (key: string | number, defaultValue?: T[keyof T]) => T[keyof T];


/** getKey 的函式型別 */
export type EnumGetKeyFunc<T extends Record<string, string | number>> = (val: string) => keyof T | null;
// #endregion

// #region Public
/** 動態根據輸入的內容取得 Enum 的值或 key */
export const EnumMap = <T extends Record<string, string | number>>(map: T) =>
{
    const reverseMap = Object.entries(map).reduce((acc, [key, value]) =>
    {
        acc[String(value)] = key as keyof T;
        return acc;
    }, {} as Record<string, keyof T>);

    return {
        getValue: (key: string | number, defaultValue?: T[keyof T]): T[keyof T] => map[key as keyof T] ?? defaultValue!,
        getKey: (val: string): keyof T | null => reverseMap[val] ?? null,
    };
};


/** 判斷資料是否為 null 或 undefined */
export const isNullOrUndefined = (value: unknown): value is null | undefined =>
{
    return value === null || value === undefined;
};


/** 將資料安全轉為字串 */
export const toSafeString = (value: unknown, defaultValue = ""): string =>
{
    return isNullOrUndefined(value) ? defaultValue : String(value);
};


/** 將資料安全轉為數字 */
export const toSafeNumber = (value: unknown, defaultValue = 0): number =>
{
    const result = Number(value);
    return Number.isFinite(result) ? result : defaultValue;
};


/** 將資料安全轉為布林值 */
export const toSafeBoolean = (value: unknown, defaultValue = false): boolean =>
{
    if (typeof value === "boolean") return value;
    if (typeof value === "string") return value.toLowerCase() === "true";
    if (typeof value === "number") return value !== 0;

    return defaultValue;
};


/** 將資料安全轉為陣列 */
export const toArray = <T>(value: T | T[] | null | undefined): T[] =>
{
    if (isNullOrUndefined(value)) return [];
    return Array.isArray(value) ? value : [value];
};


/** 判斷資料是否為一般物件 */
export const isRecord = (value: unknown): value is Record<string, unknown> =>
{
    return typeof value === "object" && value !== null && !Array.isArray(value);
};


/** null 或 undefined 時回傳預設值 */
export const getOrDefault = <T>(value: T | null | undefined, defaultValue: T): T =>
{
    return isNullOrUndefined(value) ? defaultValue : value;
};


/** 只接受陣列資料，非陣列時回傳空陣列 */
export const toArrayOrEmpty = <T>(value: T[] | null | undefined): T[] =>
{
    return Array.isArray(value) ? value : [];
};
// #endregion
