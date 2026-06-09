// #region Property
/** 重新排序的模式型別 */
export type RemergeSortMode = typeof RemergeSortMode[keyof typeof RemergeSortMode];

/** 合併文字參數 */
export interface MergeTextOptions
{
    /** 是否包含空字串，預設 false */
    hasEmpty?: boolean;
}

/** 重新排序組合資料的參數 */
export interface RemergeOptions
{
    /** 是否包含空字串，預設 false */
    hasEmpty?: boolean;

    /** 是否倒敘排列，預設 false */
    isDesc?: boolean;

    /** 是否去除重複資料，預設 false */
    isRemoveDuplicates?: boolean;

    /** 排序模式，預設 Auto */
    sortMode?: RemergeSortMode;
}
// #endregion

// #region Public
/** 重新排序的模式 */
export const RemergeSortMode = { Auto: "Auto", Number: "Number", Natural: "Natural", String: "String", None: "None" } as const;

/** 判斷文字是否為 null、undefined 或空白 */
export const isNullOrWhiteSpace = (value?: string | null): boolean =>
{
    return value === null || value === undefined || value.trim().length === 0;
};

/** 判斷資料是否為非空白文字 */
export const isNonEmptyString = (value: unknown): value is string =>
{
    return typeof value === "string" && value.trim().length > 0;
};

/** 將輸入值安全轉為 trim 後字串 */
export const safeTrim = (value?: unknown): string =>
{
    return value === null || value === undefined ? "" : String(value).trim();
};

/** 空字串時回傳預設文字 */
export const emptyToDefault = (value: unknown, defaultText: string): string =>
{
    const text = safeTrim(value);
    return text.length > 0 ? text : defaultText;
};

export const splitTrimToArray = (value: string | null | undefined, separator = ",", isRemoveDuplicates: boolean = false): string[] =>
{
    const list = (value ?? "").split(separator).map(item => item.trim()).filter(item => item.length > 0);
    return isRemoveDuplicates ? Array.from(new Set(list)) : list;
};

/** 將陣列內容安全轉為 trim 後的非空白文字陣列 */
export const toTrimmedStringArray = (values: unknown[] | null | undefined): string[] =>
{
    return (values ?? []).map((item) => safeTrim(item)).filter((item) => item.length > 0);
};

/** 從多個候選值中取得第一個非空白文字 */
export const getFirstNonEmptyText = (...values: unknown[]): string =>
{
    return toTrimmedStringArray(values)[0] ?? "";
};

/** 依 key 尋找資料並取出文字欄位 */
export const findTextByKey = <T, TKey>(items: T[] | null | undefined, keySelector: (item: T) => TKey, key: TKey, textSelector: (item: T) => unknown): string =>
{
    const item = (items ?? []).find((data) => keySelector(data) === key);
    return safeTrim(item ? textSelector(item) : "");
};

/** 依 key 清單轉換成顯示文字陣列 */
export const mapKeysToDisplayArray = <TKey extends string | number>(keys: TKey[] | null | undefined, displayMap: Partial<Record<TKey, string>>): string[] =>
{
    return (keys ?? []).map((key) => safeTrim(displayMap[key])).filter((item) => item.length > 0);
};

/** 依 key 清單轉換成合併後的顯示文字 */
export const mapKeysToDisplayText = <TKey extends string | number>(
    keys: TKey[] | null | undefined,
    displayMap: Partial<Record<TKey, string>>,
    separator = "、",
): string =>
{
    return mapKeysToDisplayArray(keys, displayMap).join(separator);
};

/** 將文字包成單引號，並處理單引號跳脫 */
export const wrapSingleQuote = (value: string | number | boolean | null | undefined): string =>
{
    const text = String(value ?? "").replaceAll("'", "''");
    return `'${text}'`;
};

/** 合併字串，並正規化交界處的分隔符號 */
export const mergeText = (mergeStr: string, options: MergeTextOptions = {}, ...strs: unknown[]): string =>
{
    const { hasEmpty = false } = options;
    if (!strs || strs.length === 0) return "";
    const parts = strs.map((item) => item == null ? "" : String(item)).filter((item) => hasEmpty || item.length > 0);
    if (parts.length === 0) return "";
    if (!mergeStr) return parts.join("");

    return parts.reduce((result, item) => `${trimMergeEnd(result, mergeStr)}${mergeStr}${trimMergeStart(item, mergeStr)}`);
};

/** 合併字串，保留舊版 Merge 呼叫方式 */
export const Merge = (mergeStr: string, hasEmpty: boolean, ...strs: unknown[]): string =>
{
    return mergeText(mergeStr, { hasEmpty }, ...strs);
};

/** 重新排序組合資料 */
export const Remerge = (val: string | null | undefined, mergeStr: string, options: RemergeOptions = {}): string =>
{
    if (!val || /^\s*$/.test(val)) return "";

    const { hasEmpty = false, isDesc = false, isRemoveDuplicates = false, sortMode = RemergeSortMode.Auto } = options;
    let data = val.split(mergeStr);
    if (!hasEmpty) data = data.filter((item) => !/^\s*$/.test(item));
    if (isRemoveDuplicates) data = [...new Set(data)];

    const finalMode = sortMode === RemergeSortMode.Auto ? detectSortMode(data) : sortMode;
    data = sortMergeData(data, finalMode);
    if (isDesc) data.reverse();

    return Merge(mergeStr, hasEmpty, ...data);
};
// #endregion

// #region Private
/** 移除開頭重複的分隔字串 */
const trimMergeStart = (value: string, mergeStr: string): string =>
{
    if (!mergeStr) return value;

    let result = value;
    while (result.startsWith(mergeStr)) result = result.slice(mergeStr.length);

    return result;
};

/** 移除結尾重複的分隔字串 */
const trimMergeEnd = (value: string, mergeStr: string): string =>
{
    if (!mergeStr) return value;

    let result = value;
    while (result.endsWith(mergeStr)) result = result.slice(0, -mergeStr.length);

    return result;
};

/** 自動偵測排序模式 */
const detectSortMode = (arr: string[]): RemergeSortMode =>
{
    if (arr.length === 0) return RemergeSortMode.None;

    const allNumeric = arr.every((s) => /^\s*-?\d+\s*$/.test(s));
    if (allNumeric) return RemergeSortMode.Number;

    const anyHasDigit = arr.some((s) => /\d/.test(s));
    return anyHasDigit ? RemergeSortMode.Natural : RemergeSortMode.String;
};

/** 建立自然排序 key，避免 "2" 排在 "10" 後面 */
const naturalKey = (value: string): string =>
{
    return value.replace(/\d+/g, (match) => match.padStart(10, "0"));
};

/** 依數字排序模式排序文字陣列 */
const sortByNumberMode = (data: string[]): string[] =>
{
    return [...data].sort((a, b) =>
    {
        const na = /^\s*-?\d+\s*$/.test(a) ? parseInt(a, 10) : Number.MAX_SAFE_INTEGER;
        const nb = /^\s*-?\d+\s*$/.test(b) ? parseInt(b, 10) : Number.MAX_SAFE_INTEGER;
        return na - nb;
    });
};

/** 依排序模式排序文字陣列 */
const sortMergeData = (data: string[], sortMode: RemergeSortMode): string[] =>
{
    if (sortMode === RemergeSortMode.Number) return sortByNumberMode(data);
    if (sortMode === RemergeSortMode.Natural) return [...data].sort((a, b) => naturalKey(a).localeCompare(naturalKey(b)));
    if (sortMode === RemergeSortMode.String) return [...data].sort();

    return data;
};
// #endregion
