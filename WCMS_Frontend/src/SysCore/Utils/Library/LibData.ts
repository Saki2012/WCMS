import dayjs from "dayjs";

/** 動態根據輸入的內容得到是Enum的值或是Value*/
export function EnumMap<T extends Record<string, string | number>>(map: T)
{
    const reverseMap = Object.entries(map).reduce((acc, [key, value]) =>
    {
        acc[value] = key as keyof T;
        return acc;
    }, {} as Record<string, keyof T>);

    return {
        getValue: (key: string | number, defaultValue?: T[keyof T]): T[keyof T] =>
        {
            return map[key as keyof T] ?? defaultValue!;
        },
        getKey: (val: string): keyof T | null => reverseMap[val] ?? null,
    };
}
// getValue 的函式型別
export type EnumGetValueFunc<T extends Record<string, string | number>> = (
    key: string | number,
    defaultValue?: T[keyof T],
) => T[keyof T];
// getKey 的函式型別
export type EnumGetKeyFunc<T extends Record<string, string | number>> = (val: string) => keyof T | null;

export const FormatDateTime = (value: string | null | undefined): string =>
{
    if (!value) return "";
    return dayjs(value).format("YYYY-MM-DD  HH:mm:ss");
};

export const FormatDate = (value: string | null | undefined): string =>
{
    if (!value) return "";
    return dayjs(value).format("YYYY-MM-DD");
};

/**
 * 將位元遮罩(bitmask)轉換為 checkbox 可用的 string 陣列
 *
 * @param bitmask - 整數值，代表目前狀態的加總（例如：7 代表 1+2+4）
 * @param allKeys - 所有可能的位元值清單（例如：[1, 2, 4, 8]）
 * @returns string[] - 適用於 checkbox 的選取值（如 ["1", "2", "4"]）
 */
export const parseBitmaskToStringArray = (bitmask: number, allKeys: number[]) =>
    allKeys.filter(k => (bitmask & k) === k).map(String);

/**
 * 將 checkbox 傳回的 string 陣列轉換為加總後的 bitmask 整數
 *
 * @param selected - 被選取的 checkbox 值（例如 ["1", "4"]）
 * @returns number - 對應的位元總和（例如：1 + 4 = 5）
 */
export const sumStringArrayToBitmask = (selected: string[]) => selected.map(Number).reduce((acc, v) => acc | v, 0);

/** 取今天的時間範圍
 * 很重要注意:以後有關時間的條件邏輯，一定要放在ssr的時候當條件作為基準，後續的CSR拿此作為條件，避免CSR/SSR會有水合錯誤的情形
 */
export const getTodayRange = (): { dayStart: number; dayEnd: number; } =>
{
    const today = new Date();
    const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0).getTime();
    const dayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).getTime();
    return { dayStart, dayEnd };
};
