import dayjs from "dayjs";

// #region Property
/** 日期輸入格式 */
export type LibDateInput = string | number | Date | null | undefined;

/** 今日時間範圍 */
export interface TodayRange
{
    /** 今日開始 timestamp */
    dayStart: number;

    /** 今日結束 timestamp */
    dayEnd: number;
}

/** 日期時間拆解結果 */
export interface DateTimeParts
{
    /** 年 */
    year: string;

    /** 月 */
    month: string;

    /** 日 */
    day: string;

    /** 時 */
    hour: string;

    /** 分 */
    minute: string;

    /** 秒 */
    second: string;

    /** 毫秒 */
    millisecond: string;
}
// #endregion

// #region Public
/** 將日期字串格式化為 yyyy-MM-dd HH:mm:ss */
export const formatDateTime = (value: LibDateInput): string =>
{
    if (!value) return "";
    return dayjs(value).format("YYYY-MM-DD HH:mm:ss");
};
/** 將日期字串格式化為 yyyy-MM-dd */
export const formatDate = (value: LibDateInput): string =>
{
    if (!value) return "";
    return dayjs(value).format("YYYY-MM-DD");
};
/** 拆解日期時間為補零後的字串片段 */
export const formatDateParts = (value: Date): DateTimeParts =>
{
    return {
        year: `${value.getFullYear()}`,
        month: pad2(value.getMonth() + 1),
        day: pad2(value.getDate()),
        hour: pad2(value.getHours()),
        minute: pad2(value.getMinutes()),
        second: pad2(value.getSeconds()),
        millisecond: `${value.getMilliseconds()}`.padStart(3, "0"),
    };
};
/** 將 Date 轉成本地 ISO 格式字串 */
export const formatLocalIso = (value: Date): string =>
{
    const parts = formatDateParts(value);
    return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}.${parts.millisecond}`;
};
/** 將 Date 轉成本地 ISO 格式字串，固定到分鐘精度 */
export const formatLocalIsoByMinute = (value: Date): string =>
{
    const parts = formatDateParts(value);
    return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:00.000`;
};
/** 保留舊大駝峰名稱相容既有引用 */
export const FormatDateTime = formatDateTime;
/** 保留舊大駝峰名稱相容既有引用 */
export const FormatDate = formatDate;
/** 取今天的時間範圍，SSR 條件應以傳入 now 為基準避免水合差異 */
export const getTodayRange = (now?: Date): TodayRange =>
{
    const base = now ?? new Date();
    const dayStart = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 0, 0, 0, 0).getTime();
    const dayEnd = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 23, 59, 59, 999).getTime();

    return { dayStart, dayEnd };
};
/** 嘗試把輸入轉成 Date，解析失敗回傳 null */
export const toDateOrNull = (value?: LibDateInput): Date | null =>
{
    if (value == null) return null;

    if (value instanceof Date)
    {
        return Number.isNaN(value.getTime()) ? null : value;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};
/** 判斷現在時間是否落在有效期間內，start/end 未提供或解析失敗時視為不設限 */
export const isInValidTimeRange = (start?: LibDateInput, end?: LibDateInput, now: Date = new Date()): boolean =>
{
    const startDate = toDateOrNull(start);
    const endDate = toDateOrNull(end);
    const afterStart = !startDate || now.getTime() >= startDate.getTime();
    const beforeEnd = !endDate || now.getTime() <= endDate.getTime();

    return afterStart && beforeEnd;
};
/** 將日期輸入轉成 timestamp，支援 /Date(ms)/ 舊格式 */
export const toEpochMsOrNull = (input: LibDateInput, assumeOffsetMinutes: number = 0): number | null =>
{
    if (input == null) return null;

    if (input instanceof Date) return Number.isNaN(input.getTime()) ? null : input.getTime();
    if (typeof input === "number") return Number.isFinite(input) ? input : null;

    return parseDateTextToEpochMs(input, assumeOffsetMinutes);
};
/** 判斷日期是否在最近 N 天內 */
export const isWithinLastDays = (input: LibDateInput, days: number, now: Date = new Date(), assumeOffsetMinutes: number = 0): boolean =>
{
    const targetMs = toEpochMsOrNull(input, assumeOffsetMinutes);
    if (targetMs === null) return false;
    const diffMs = now.getTime() - targetMs;
    return diffMs >= 0 && diffMs <= days * 24 * 60 * 60 * 1000;
};
// #endregion

// #region Private
/** 將數字補成兩位數 */
const pad2 = (value: number): string =>
{
    return value < 10 ? `0${value}` : `${value}`;
};
/** 將日期字串轉成 timestamp */
const parseDateTextToEpochMs = (input: string, assumeOffsetMinutes: number): number | null =>
{
    const text = `${input ?? ""}`.trim();
    const msMatch = /\/Date\((\d+)\)\//.exec(text);
    if (!text) return null;
    if (msMatch) return Number(msMatch[1]);
    if (hasTimeZoneText(text)) return parseNativeDateText(text);
    return parseLocalDateTextAsOffset(text, assumeOffsetMinutes);
};
/** 判斷日期字串是否已有時區 */
const hasTimeZoneText = (value: string): boolean =>
{
    return /[zZ]|[+\-]\d{2}:\d{2}$/.test(value);
};
/** 使用原生 Date.parse 解析日期 */
const parseNativeDateText = (value: string): number | null =>
{
    const time = Date.parse(value);
    return Number.isNaN(time) ? null : time;
};
/** 將無時區日期依指定 offset 轉成 timestamp */
const parseLocalDateTextAsOffset = (value: string, assumeOffsetMinutes: number): number | null =>
{
    const match = /^(\d{4})[-/](\d{2})[-/](\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?)?$/.exec(value);
    if (!match) return parseNativeDateText(value);
    const [, year, month, day, hour = "0", minute = "0", second = "0", millisecond = "0"] = match;
    const utcMs = Date.UTC(+year, +month - 1, +day, +hour, +minute, +second, parseInt(millisecond.padEnd(3, "0"), 10));
    return utcMs - assumeOffsetMinutes * 60 * 1000;
};
// #endregion
