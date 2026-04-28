// src/SysCore/Library/DateRangeHelper.ts

/**
 * 嘗試把輸入轉成 Date（支援 Date / ISO string / timestamp）。
 * 解析失敗回傳 null，避免 new Date(invalid) 造成 NaN 比較。
 */
const toDateOrNull = (value?: string | number | Date | null): Date | null =>
{
    if (value == null) return null;

    if (value instanceof Date)
    {
        return Number.isNaN(value.getTime()) ? null : value;
    }

    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
};

/**
 * 判斷現在時間是否落在有效期間內（含邊界）。
 * - start/end 未提供 -> 視為不設限
 * - start/end 解析失敗 -> 視為不設限（避免因髒資料把內容全隱藏）
 */
export const isInValidTimeRange = (start?: string | number | Date | null, end?: string | number | Date | null, now: Date = new Date()): boolean =>
{
    const s = toDateOrNull(start);
    const e = toDateOrNull(end);
    const afterStart = !s || now.getTime() >= s.getTime();
    const beforeEnd = !e || now.getTime() <= e.getTime();
    return afterStart && beforeEnd;
};
