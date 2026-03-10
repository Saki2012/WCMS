import { useCallback, useMemo, useState } from "react";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import { CalendarAdapter } from "@/Features/Hooks/BizFunc/SystemSetting/Calendar_Api";
import type { ApiAdapterError } from "@/SysCore/Utils/API/APIAdapter";
import type { UseFetchDataResult } from "@/SysCore/Utils/API/FetchDataType";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import type { components } from "@/types/api";

type CalendarDetail = components["schemas"]["CalendarDetail_DTO"];

/** YYYY-MM-DD -> 單日 DTO */
export type CalendarYearMap = Record<string, CalendarDetail>;

export interface DialogAnchorRect {
    top: number;
    left: number;
    width: number;
    height: number;
    viewportWidth: number;
    viewportHeight: number;
}

export type CalendarPageAdapter = {
    Calendar: ReturnType<typeof CalendarAdapter>;
};

export type CalendarPageRawData = {
    yearDetails: CalendarDetail[];
    daysByDate: CalendarYearMap;
    selectedDay: CalendarDetail | null;
};

export type CalendarPageFetchDataResult =
    UseFetchDataResult<CalendarPageRawData, CalendarPageAdapter> & {
        isDaySaving: boolean;
        updateDayInfoAsync: (dayInfo: CalendarDetail) => Promise<ApiResponse<CalendarDetail>>;
    };

export type CalendarPageHookResult = CalendarPageFetchDataResult & {
    year: number;
    month: number;
    selectedDate: string | null;
    dialogAnchor: DialogAnchorRect | null;
    isDialogOpen: boolean;
    yearDetails: CalendarDetail[];
    daysByDate: CalendarYearMap;
    selectedDay: CalendarDetail | null;
    handlePrevMonth: () => void;
    handleNextMonth: () => void;
    handleGoToday: () => void;
    handleDayClick: (dateStr: string, anchor: DialogAnchorRect) => void;
    handleDialogCancel: () => void;
    handleDialogSave: (updated: CalendarDetail) => Promise<void>;
};

export interface UseCalendarPageOpt {
    defaultYear?: number;
}

export interface UseCalendarPageFetchDataOpt {
    year: number;
    selectedDate: string | null;
    refreshKey?: number;
}

//#region Public Helper

/** 將後端 Date 轉成 YYYY-MM-DD（避免帶時間造成 key 對不到） */
export const normalizeDateKey = (dateStr?: string | null): string => {
    // 宣告變數
    const s = (dateStr ?? "").trim();

    // return
    if (!s) return "";
    return s.length >= 10 ? s.slice(0, 10) : s;
};

/** year + month(0-based) + day -> YYYY-MM-DD */
export const formatDateString = (
    year: number,
    monthZeroBased: number,
    day: number,
): string => {
    // 宣告變數
    const mm = String(monthZeroBased + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");

    // return
    return `${year}-${mm}-${dd}`;
};

/** 0~6 -> 日一二三四五六 */
export const getWeekdayNameZh = (
    weekDay: number | null | undefined,
): string => {
    // 宣告變數
    const w = Number(weekDay ?? 0);
    const map = ["日", "一", "二", "三", "四", "五", "六"] as const;

    // return
    return map[w] ?? "";
};

/** 24h "HH:mm" -> {hh, mm} */
export const parseHHmm = (
    v?: string | null,
): { hh: number; mm: number } | null => {
    // 宣告變數
    const raw = (v ?? "").trim();
    const s = raw.length >= 5 ? raw.slice(0, 5) : raw;

    // 執行 function
    if (!s) return null;
    if (!/^\d{2}:\d{2}$/.test(s)) return null;

    const hh = Number(s.slice(0, 2));
    const mm = Number(s.slice(3, 5));

    // return
    if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
    if (hh < 0 || hh > 23) return null;
    if (mm < 0 || mm > 59) return null;
    return { hh, mm };
};

/** 24h -> 12h parts */
export const to12hParts = (
    hh24: number,
): { meridiem: "AM" | "PM"; hh12: number } => {
    // 宣告變數
    const meridiem: "AM" | "PM" = hh24 >= 12 ? "PM" : "AM";
    const h = hh24 % 12;
    const hh12 = h === 0 ? 12 : h;

    // return
    return { meridiem, hh12 };
};

/** 12h parts -> 24h hour */
export const to24hHour = (
    meridiem: "AM" | "PM",
    hh12: number,
): number => {
    // 宣告變數
    const h = Math.max(1, Math.min(12, hh12));

    // return
    if (meridiem === "AM") return h === 12 ? 0 : h;
    return h === 12 ? 12 : h + 12;
};

/** number -> "HH:mm" */
export const formatHHmm = (hh: number, mm: number): string => {
    // 宣告變數
    const h = String(Math.max(0, Math.min(23, hh))).padStart(2, "0");
    const m = String(Math.max(0, Math.min(59, mm))).padStart(2, "0");

    // return
    return `${h}:${m}`;
};

/** Calendar 專用：聚合年度資料查詢 + daysByDate mapping + UpdateDayInfo */
export const useCalendarPageFetchData = (
    opt: UseCalendarPageFetchDataOpt,
): CalendarPageFetchDataResult => {
    // 宣告變數
    const adapter = useMemo<CalendarPageAdapter>(() => {
        return { Calendar: CalendarAdapter() };
    }, []);

    const onError = useCalendarQueryErrorHandler();

    const yearDetailsRes = adapter.Calendar.hooks.useFetchCalendarDetailsByYear({
        year: opt.year,
        deps: [opt.year, opt.refreshKey ?? 0],
        onError,
    });

    const dayActions = adapter.Calendar.hooks.useUpdateDayInfo();

    const daysByDate = useMemo<CalendarYearMap>(() => {
        return buildYearMapFromList(opt.year, yearDetailsRes.data ?? []);
    }, [opt.year, yearDetailsRes.data]);

    const selectedDay = useMemo<CalendarDetail | null>(() => {
        if (!opt.selectedDate) return null;
        return daysByDate[opt.selectedDate] ?? null;
    }, [opt.selectedDate, daysByDate]);

    const rawData = useMemo<CalendarPageRawData>(() => {
        return {
            yearDetails: yearDetailsRes.data ?? [],
            daysByDate,
            selectedDay,
        };
    }, [yearDetailsRes.data, daysByDate, selectedDay]);

    const errors = useMemo<(string | null)[]>(() => {
        return [yearDetailsRes.errorText];
    }, [yearDetailsRes.errorText]);

    const refetchData = useCallback(async () => {
        await yearDetailsRes.refetch();
    }, [yearDetailsRes]);

    const isLoading = Boolean(yearDetailsRes.isLoading || dayActions.isSaving);

    // return
    return {
        adapter,
        rawData,
        isLoading,
        errors,
        refetchData,
        isDaySaving: dayActions.isSaving,
        updateDayInfoAsync: dayActions.updateDayInfoAsync,
    };
};

/** Calendar 專用：頁面狀態、月份切換、dialog、保存流程 */
export const useCalendarPage = (
    opt: UseCalendarPageOpt,
): CalendarPageHookResult => {
    // 宣告變數
    const today = useMemo(() => new Date(), []);
    const { publish } = useToast();

    const [year, setYear] = useState<number>(
        opt.defaultYear ?? today.getFullYear(),
    );
    const [month, setMonth] = useState<number>(today.getMonth());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
    const [dialogAnchor, setDialogAnchor] = useState<DialogAnchorRect | null>(
        null,
    );
    const [refreshKey, setRefreshKey] = useState<number>(0);

    const fetchData = useCalendarPageFetchData({
        year,
        selectedDate,
        refreshKey,
    });

    const handlePrevMonth = useCallback(() => {
        // 執行 function
        setMonth((prev) => {
            if (prev === 0) {
                setYear((y) => y - 1);
                return 11;
            }
            return prev - 1;
        });
    }, []);

    const handleNextMonth = useCallback(() => {
        // 執行 function
        setMonth((prev) => {
            if (prev === 11) {
                setYear((y) => y + 1);
                return 0;
            }
            return prev + 1;
        });
    }, []);

    const handleGoToday = useCallback(() => {
        // 宣告變數
        const t = new Date();

        // 執行 function
        setYear(t.getFullYear());
        setMonth(t.getMonth());
        setSelectedDate(formatDateString(t.getFullYear(), t.getMonth(), t.getDate()));
    }, []);

    const handleDayClick = useCallback((
        dateStr: string,
        anchor: DialogAnchorRect,
    ) => {
        // 執行 function
        setSelectedDate(dateStr);
        setDialogAnchor(anchor);
        setIsDialogOpen(true);
    }, []);

    const handleDialogCancel = useCallback(() => {
        // 執行 function
        setIsDialogOpen(false);
        setDialogAnchor(null);
    }, []);

    const handleDialogSave = useCallback(async (updated: CalendarDetail) => {
        try {
            // 宣告變數
            const res = await fetchData.updateDayInfoAsync(updated);

            // 執行 function
            if (res.IsSuccess) {
                (res.SysMessage ?? []).forEach((item) => {
                    publish({
                        level: item.Status,
                        code: item.MessageCode,
                        title: item.Message,
                    });
                });

                setIsDialogOpen(false);
                setDialogAnchor(null);
                setRefreshKey((v) => v + 1);

                const key = normalizeDateKey(updated.Date);
                if (key) setSelectedDate(key);
                return;
            }

            (res.SysMessage ?? []).forEach((item) => {
                publish({
                    level: item.Status,
                    code: item.MessageCode,
                    title: "保存失敗",
                    text: item.Message,
                });
            });
        } catch {
            publish({ level: MessageStatus.Error, title: "儲存失敗" });
        }
    }, [fetchData.updateDayInfoAsync, publish]);

    // return
    return {
        ...fetchData,
        year,
        month,
        selectedDate,
        dialogAnchor,
        isDialogOpen,
        yearDetails: fetchData.rawData.yearDetails,
        daysByDate: fetchData.rawData.daysByDate,
        selectedDay: fetchData.rawData.selectedDay,
        handlePrevMonth,
        handleNextMonth,
        handleGoToday,
        handleDayClick,
        handleDialogCancel,
        handleDialogSave,
    };
};

//#endregion

//#region Private Helper

/** 建立 Query 錯誤 toast handler */
const useCalendarQueryErrorHandler = (): ((e: ApiAdapterError) => void) => {
    // 宣告變數
    const { publish } = useToast();

    // return
    return useCallback((e: ApiAdapterError) => {
        publish({ level: MessageStatus.Error, title: e.messageText });
    }, [publish]);
};

/** 建立一筆單日預設值 */
const createEmptyDayInfo = (
    year: number,
    dateStr: string,
): CalendarDetail => {
    // 宣告變數
    const jsDate = new Date(dateStr);

    // return
    return {
        Year: year,
        Date: dateStr,
        DayOfWeek: jsDate.getDay() as CalendarDetail["DayOfWeek"],
        IsHoliday: false,
        HolidayName: "",
        Description: "",
        Spec_OpenTime: null,
        Spec_CloseTime: null,
        Spec_ModifyMemo: "",
    };
};

/** 把後端 CalendarDetail[] 轉成年字典，並補齊該年每一天 */
const buildYearMapFromList = (
    year: number,
    list: CalendarDetail[],
): CalendarYearMap => {
    // 宣告變數
    const map: CalendarYearMap = {};

    // 執行 function：先塞回傳資料
    (list ?? []).forEach((d) => {
        const key = normalizeDateKey(d.Date);
        if (!key) return;

        map[key] = { ...d, Date: key };
    });

    // 執行 function：補齊缺日
    for (let m = 0; m < 12; m += 1) {
        const daysInMonth = new Date(year, m + 1, 0).getDate();

        for (let day = 1; day <= daysInMonth; day += 1) {
            const dateStr = formatDateString(year, m, day);
            if (map[dateStr]) continue;

            map[dateStr] = createEmptyDayInfo(year, dateStr);
        }
    }

    // return
    return map;
};

//#endregion