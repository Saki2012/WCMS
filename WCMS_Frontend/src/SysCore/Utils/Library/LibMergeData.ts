// stringTools.ts

/** 重新排序的模式 */
export const RemergeSortMode = {
    Auto: "Auto",
    Number: "Number",
    Natural: "Natural",
    String: "String",
    None: "None",
};
export type RemergeSortMode = typeof RemergeSortMode[keyof typeof RemergeSortMode];

export interface RemergeOptions
{
    /** 是否包含空字串（預設 false） */
    hasEmpty?: boolean;
    /** 是否倒敘排列（預設 false） */
    isDesc?: boolean;
    /** 是否去除重複資料（預設 false） */
    isRemoveDuplicates?: boolean;
    /** 排序模式（預設 Auto） */
    sortMode?: RemergeSortMode;
}

/** 將多個值以分隔字元合併為字串 */
export const LibMerge = (mergeStr: string, hasEmpty: boolean, ...strs: unknown[]): string =>
{
    if (!strs || strs.length === 0) return "";
    const parts: string[] = [];
    for (const item of strs)
    {
        const s = item == null ? "" : String(item);
        if (hasEmpty || s.length > 0) parts.push(s);
    }
    return parts.join(mergeStr);
};

/** 自動偵測排序模式（貼近原 C# DetectSortMode 的直覺） */
const detectSortMode = (arr: string[]): RemergeSortMode =>
{
    if (arr.length === 0) return RemergeSortMode.None;
    const allNumeric = arr.every((s) => /^\s*-?\d+\s*$/.test(s));
    if (allNumeric) return RemergeSortMode.Number;
    const anyHasDigit = arr.some((s) => /\d/.test(s));
    if (anyHasDigit) return RemergeSortMode.Natural;
    return RemergeSortMode.String;
};
/** Natural sort key：將數字片段補零，避免 "2" > "10" 的問題 */
const naturalKey = (s: string): string => s.replace(/\d+/g, (m) => m.padStart(10, "0"));
/**
 * 重新排序組合資料（TS 版）
 * @param val 源字串
 * @param mergeStr 合併連接字（例如：","）
 * @param options 參數設定（同原 C#）
 * @returns 重新排序合併後的字串
 */
export const Remerge = (val: string | null | undefined, mergeStr: string, options: RemergeOptions = {}): string =>
{
    if (!val || /^\s*$/.test(val)) return "";

    const { hasEmpty = false, isDesc = false, isRemoveDuplicates = false, sortMode = RemergeSortMode.Auto } = options;

    // JS 的 split 已支援字串分隔（非正則），行為與 C# StringSplitOptions.None 接近
    let data = val.split(mergeStr);

    // 過濾空白（與原本「hasEmpty || !IsNullOrWhiteSpace」一致）
    if (!hasEmpty) data = data.filter((p) => !/^\s*$/.test(p));

    // 去重
    if (isRemoveDuplicates)
    {
        const seen = new Set<string>();
        data = data.filter((x) => (seen.has(x) ? false : (seen.add(x), true)));
    }

    // 排序模式
    const finalMode = sortMode === RemergeSortMode.Auto ? detectSortMode(data) : sortMode;

    switch (finalMode)
    {
        case RemergeSortMode.Number:
            data = [...data].sort((a, b) =>
            {
                const na = /^\s*-?\d+\s*$/.test(a) ? parseInt(a, 10) : Number.MAX_SAFE_INTEGER;
                const nb = /^\s*-?\d+\s*$/.test(b) ? parseInt(b, 10) : Number.MAX_SAFE_INTEGER;
                return na - nb;
            });
            break;

        case RemergeSortMode.Natural:
            data = [...data].sort((a, b) =>
            {
                const ka = naturalKey(a);
                const kb = naturalKey(b);
                return ka < kb ? -1 : ka > kb ? 1 : 0;
            });
            break;

        case RemergeSortMode.String:
            data = [...data].sort(); // 預設字典序
            break;

        case RemergeSortMode.None:
        default:
            // 保持原順序
            break;
    }

    if (isDesc) data.reverse();

    return LibMerge(mergeStr, hasEmpty, ...data);
};

/* ===== 使用範例 =====
remerge("3,10,2,,1", ",", {
  hasEmpty: false,
  isDesc: false,
  isRemoveDuplicates: true,
  sortMode: RemergeSortMode.Auto,
}); // => "1,2,3,10"

merge(",", false, "a", "", "b", null, 0); // => "a,b,0"
*/
