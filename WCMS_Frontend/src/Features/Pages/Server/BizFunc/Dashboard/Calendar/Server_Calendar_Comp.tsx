import './CalendarPageComp.css';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { MessageStatus, type ApiResponse } from "@/SysCore/Interface/IApiProvider";
import api from "@/SysCore/Utils/API/APIBase";
import type { components } from '@/types/api';
import { CalendarFields } from '@/types/SchemaFields';
import { useToast } from '@/Features/Hooks/Common/useToastCenter';

type CalendarSet = components["schemas"]["CalendarSet_DTO"];
type Calendar = components["schemas"]["Calendar_DTO"];
type CalendarDetail = components["schemas"]["CalendarDetail_DTO"];
type QueryListParam = components["schemas"]["QueryListParam"]
/** YYYY-MM-DD -> 單日 DTO */
type CalendarYearMap = Record<string, CalendarDetail>;

interface DialogAnchorRect {
    top: number;
    left: number;
    width: number;
    height: number;
    viewportWidth: number;
    viewportHeight: number;
}

export interface CalendarPageCompProps {
    defaultYear?: number;
}

/** 將後端 Date 轉成 YYYY-MM-DD（避免帶時間造成 key 對不到） */
const normalizeDateKey = (dateStr?: string | null): string => {
    const s = (dateStr ?? "").trim();
    if (!s) return "";
    return s.length >= 10 ? s.slice(0, 10) : s;
};
/**
 * 建立一筆「單日預設值」
 * 備註：Spec_* 欄位是本次 case 的額外擴充，之後會改成 Spec 插件繼承追加
 */
const createEmptyDayInfo = (year: number, dateStr: string): CalendarDetail => {
    const jsDate = new Date(dateStr);

    return {
        Year: year,
        Date: dateStr,
        DayOfWeek: jsDate.getDay() as any,
        IsHoliday: false,
        HolidayName: "",
        Description: "",
        Spec_OpenTime: null,
        Spec_CloseTime: null,
        Spec_ModifyMemo: "",
    };
};

/** year + month(0-based) + day -> YYYY-MM-DD */
const formatDateString = (year: number, monthZeroBased: number, day: number): string => {
    const mm = String(monthZeroBased + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");

    return `${year}-${mm}-${dd}`;
};

/** 0~6 -> 日一二三四五六 */
const getWeekdayNameZh = (weekDay: number): string => {
    const names = ["日", "一", "二", "三", "四", "五", "六"];
    return names[weekDay] ?? "";
};

/** 0~11 -> 1 月 ~ 12 月 */
const getMonthLabelZh = (monthZeroBased: number): string => {
    const names = ["1 月", "2 月", "3 月", "4 月", "5 月", "6 月", "7 月", "8 月", "9 月", "10 月", "11 月", "12 月"];
    return names[monthZeroBased] ?? "";
};

// ✅ QueryList 回來的 list（單日 DTO list）轉成 map
const buildYearMapFromList = (year: number, list: CalendarDetail[] | null | undefined): CalendarYearMap => {
    const map: CalendarYearMap = {};

    // 1) 先把 API 回來的資料塞進 map（以 Date 當 key）
    (list ?? []).forEach((d) => {
        const k = (d?.Date ?? "").trim();
        if (!k) return;
        map[k] = d;
    });

    // 2) 再把整年度缺的日期補齊（避免 UI 某天點不到）
    for (let m = 0; m < 12; m += 1) {
        const daysInMonth = new Date(year, m + 1, 0).getDate();
        for (let day = 1; day <= daysInMonth; day += 1) {
            const dateStr = formatDateString(year, m, day);
            if (map[dateStr]) continue;
            map[dateStr] = createEmptyDayInfo(year, dateStr);
        }
    }

    return map;
};
/** 組裝 QueryList 的查詢條件（年度） */
const buildYearQueryParam = (year: number): QueryListParam => {
    return {
        Fields: [CalendarFields.InternalId],
        // ✅ 建議改用主表 Year（通常 Calendar_DTO 本身就有 Year）
        Condition: `${CalendarFields.Year} = ${year}`,
        PageSize: 1,
        PageNumber: 0,
    };
};

/** 從 QueryList 結果拿到 internalId（無資料就回 null） */
const pickFirstInternalId = (list: CalendarSet[] | null | undefined): string | null => {
    const id = list?.[0]?.Calendar?.InternalId ?? null;
    return id && id.trim() ? id.trim() : null;
};

/** GET /Calendar/QueryData?internalId=xxx */
const fetchCalendarSetByInternalId = async (internalId: string): Promise<CalendarSet[] | null> => {
    const res = await api.get<ApiResponse<CalendarSet[]>>("/Calendar/QueryData", {
        params: { internalId },
    });
    return res.data?.Data ?? null;
};
/** ✅ 呼叫後端：取得該年度清單（會回 CalendarDetail[]） */
const queryCalendarListByYear = async (year: number): Promise<CalendarDetail[]> => {
    // 1) 先 QueryList 找到該年度的主表 internalId
    const param = buildYearQueryParam(year);
    const res = await api.post<ApiResponse<CalendarSet[]>>("/Calendar/QueryList", param);
    const data = res.data;

    if (!data?.IsSuccess) {
        const msg = data?.SysMessage?.map((x) => x.Message).join("\n") ?? "載入行事曆資料失敗";
        throw new Error(msg);
    }

    const internalId = pickFirstInternalId(data.Data);
    if (!internalId) {
        // ✅ 沒有年度資料：回空陣列（外層 buildYearMapFromList 會補齊缺日）
        return [];
    }

    // 2) 再用 internalId 去 QueryData 拿 CalendarDetail
    const set = await fetchCalendarSetByInternalId(internalId);

    return (set?.[0]?.CalendarDetail ?? []) as CalendarDetail[];
};

/** 呼叫後端：更新單日資訊 (/Service/Calendar/UpdateDayInfo) */
const updateDayInfo = async (dayInfo: CalendarDetail): Promise<ApiResponse<CalendarDetail>> => {
    const res = await api.put<ApiResponse<CalendarDetail>>(`/Calendar/UpdateDayInfo`, dayInfo);
    return res.data;
};

/** ---------- Time helpers (12h UI + 24h value) ---------- */

/** 24h "HH:mm" -> {hh, mm} */
const parseHHmm = (v?: string | null): { hh: number; mm: number } | null => {
    if (!v) return null;

    const raw = v.trim();
    if (!raw) return null;

    // ✅ 允許 HH:mm 或 HH:mm:ss，統一取 HH:mm
    const s = raw.length >= 5 ? raw.slice(0, 5) : raw;

    if (!/^\d{2}:\d{2}$/.test(s)) return null;

    const hh = Number(s.slice(0, 2));
    const mm = Number(s.slice(3, 5));

    if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
    if (hh < 0 || hh > 23) return null;
    if (mm < 0 || mm > 59) return null;

    return { hh, mm };
};

/** 24h -> 12h parts */
const to12hParts = (hh24: number): { meridiem: "AM" | "PM"; hh12: number } => {
    const meridiem: "AM" | "PM" = hh24 >= 12 ? "PM" : "AM";
    const h = hh24 % 12;
    const hh12 = h === 0 ? 12 : h;

    return { meridiem, hh12 };
};

/** 12h parts -> 24h hour */
const to24hHour = (meridiem: "AM" | "PM", hh12: number): number => {
    const h = Math.max(1, Math.min(12, hh12));
    if (meridiem === "AM") return h === 12 ? 0 : h;
    return h === 12 ? 12 : h + 12;
};

/** 12h display string */
const format12hDisplay = (value24?: string | null): string => {
    const p = parseHHmm(value24);
    if (!p) return "";
    const { meridiem, hh12 } = to12hParts(p.hh);

    const zhMer = meridiem === "AM" ? "上午" : "下午";
    const mm = String(p.mm).padStart(2, "0");
    const hh = String(hh12).padStart(2, "0");

    return `${zhMer} ${hh}:${mm}`;
};

/** Create 24h "HH:mm" */
const makeHHmm = (hh24: number, mm: number): string => {
    const hh = String(Math.max(0, Math.min(23, hh24))).padStart(2, "0");
    const m = String(Math.max(0, Math.min(59, mm))).padStart(2, "0");

    return `${hh}:${m}`;
};

/** ---------- Page ---------- */

export const CalendarPageComp: React.FC<CalendarPageCompProps> = ({ defaultYear }) => {
    const today = useMemo(() => new Date(), []);
    const { publish } = useToast();
    const [year, setYear] = useState<number>(defaultYear ?? today.getFullYear());
    const [month, setMonth] = useState<number>(today.getMonth()); // 0~11
    const [daysByDate, setDaysByDate] = useState<CalendarYearMap>({});
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [dialogAnchor, setDialogAnchor] = useState<DialogAnchorRect | null>(null);
    const yearCacheRef = useRef<Record<number, CalendarYearMap>>({});

    /** 載入某年度（暫用 mock，之後替換成 API） */
    const loadYear = useCallback(async (targetYear: number, force?: boolean) => {
        // 1) 命中 cache 就直接用（除非 force）
        const cached = yearCacheRef.current[targetYear];
        if (cached && !force) {
            setDaysByDate(cached);
            return;
        }

        setIsLoading(true);

        try {
            const list = await queryCalendarListByYear(targetYear);
            const map = buildYearMapFromList(targetYear, list);

            yearCacheRef.current[targetYear] = map; // ✅ 更新 cache
            setDaysByDate(map);
        }
        catch {
            publish({ level: MessageStatus.Error, title: "載入年度清單時發生錯誤" });
        }
        finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadYear(year);
    }, [year, loadYear]);

    /** 上一個月 */
    const handlePrevMonth = useCallback(() => {
        setMonth((prev) => {
            if (prev === 0) {
                setYear((y) => y - 1);
                return 11;
            }
            return prev - 1;
        });
    }, []);

    /** 下一個月 */
    const handleNextMonth = useCallback(() => {
        setMonth((prev) => {
            if (prev === 11) {
                setYear((y) => y + 1);
                return 0;
            }
            return prev + 1;
        });
    }, []);

    /** 回到今天 */
    const handleGoToday = useCallback(() => {
        const now = new Date();
        setYear(now.getFullYear());
        setMonth(now.getMonth());
    }, []);

    /** 點某一天 -> 開啟編輯框 */
    const handleDayClick = useCallback((dateStr: string, anchor: DialogAnchorRect) => {
        setSelectedDate(dateStr);
        setDialogAnchor(anchor);
        setIsDialogOpen(true);
    }, []);

    /** 編輯框取消 */
    const handleDialogCancel = useCallback(() => {
        setIsDialogOpen(false);
    }, []);

    /** 編輯框保存 -> 呼叫 UpdateDayInfo */
    const handleDialogSave = useCallback(async (updated: CalendarDetail) => {

        try {
            const res = await updateDayInfo(updated);

            if (res.IsSuccess) {
                (res.SysMessage ?? []).forEach(item =>
                    publish({ level: item.Status, code: item.MessageCode, title: item.Message })
                );
                // ✅ 1) 先關閉 dialog
                setIsDialogOpen(false);

                // ✅ 2) 清掉該年的 cache，避免看到舊資料
                const y = Number(updated.Year ?? year);
                delete yearCacheRef.current[y];

                // ✅ 3) 強制重抓該年度，馬上刷新畫面
                await loadYear(y, true);

                // ✅ 4) 選取日維持（避免因 Date 帶時間造成失焦）
                const key = normalizeDateKey(updated.Date);
                if (key) setSelectedDate(key);

            } else {
                (res.SysMessage ?? []).forEach(item =>
                    publish({ level: item.Status, code: item.MessageCode, title: "保存失敗", text: item.Message })
                );
            }

        }
        catch {
            publish({ level: MessageStatus.Error, title: "儲存失敗" });
        }
    }, [loadYear, year]);

    /** 目前選到的日資料 */
    const selectedDay: CalendarDetail | null =
        selectedDate != null ? daysByDate[selectedDate] ?? null : null;

    return (
        <main className="wcms-calendar-page" aria-labelledby="calendar-page-title">
            <header className="wcms-calendar-header">
                <div className="wcms-calendar-header-left">
                    <h1 id="calendar-page-title" className="page-title">
                        萬年曆管理
                    </h1>
                    <span aria-live="polite" className="wcms-calendar-year-label">
                        {year} 年
                    </span>
                </div>

                <div className="wcms-calendar-header-right">
                    <label className="year-input-label">
                        <span className="sr-only">選擇年份</span>
                        <input
                            type="number"
                            aria-label="選擇年份"
                            value={year}
                            onChange={(e) => setYear(Number(e.target.value) || year)}
                            className="year-input"
                        />
                    </label>

                    {/*
                      已移除「儲存本年度異動」：此頁改為單日編輯後即呼叫 UpdateDayInfo 保存
                    */}
                </div>
            </header>

            <section className="wcms-calendar-toolbar" aria-label="月份切換與工具列">
                <div className="wcms-calendar-month-nav">
                    <button type="button" onClick={handlePrevMonth} className="btn btn-ghost" aria-label="上一個月">
                        ◀
                    </button>

                    <div aria-live="polite" aria-atomic="true" className="wcms-calendar-month-label">
                        {year} 年 {getMonthLabelZh(month)}
                    </div>

                    <button type="button" onClick={handleNextMonth} className="btn btn-ghost" aria-label="下一個月">
                        ▶
                    </button>

                    <button type="button" onClick={handleGoToday} className="btn btn-outline">
                        今天
                    </button>
                </div>
            </section>


            <section className="wcms-calendar-month-grid-section" aria-label="月曆檢視">
                {isLoading ? (
                    <div className="wcms-calendar-loading" aria-live="polite">
                        讀取中…
                    </div>
                ) : (
                    <CalendarMonthGrid year={year} month={month} daysByDate={daysByDate} onDayClick={handleDayClick} />
                )}
            </section>

            {isDialogOpen && selectedDay && dialogAnchor && (
                <CalendarDayDialog
                    key={selectedDay.Date}
                    day={selectedDay}
                    anchor={dialogAnchor}
                    onCancel={handleDialogCancel}
                    onSave={handleDialogSave}
                />
            )}
        </main>
    );
};

interface CalendarMonthGridProps {
    year: number;
    /** 0~11 */
    month: number;
    daysByDate: CalendarYearMap;
    onDayClick: (dateStr: string, anchor: DialogAnchorRect) => void;
}

const CalendarMonthGrid: React.FC<CalendarMonthGridProps> = ({ year, month, daysByDate, onDayClick }) => {
    const todayKey = useMemo(() => {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, "0");
        const d = String(now.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    }, []);
    const weeks = useMemo(() => {
        const firstDay = new Date(year, month, 1);
        const firstWeekday = firstDay.getDay(); // 0~6
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const totalCells = 6 * 7;

        const cells: (string | null)[] = [];
        let dayCounter = 1;

        for (let i = 0; i < totalCells; i += 1) {
            if (i < firstWeekday || dayCounter > daysInMonth) {
                cells.push(null);
            } else {
                const dateStr = formatDateString(year, month, dayCounter);
                cells.push(dateStr);
                dayCounter += 1;
            }
        }

        const result: (string | null)[][] = [];
        for (let row = 0; row < 6; row += 1) {
            result.push(cells.slice(row * 7, row * 7 + 7));
        }

        return result;
    }, [year, month]);

    const weekDayHeader = ["日", "一", "二", "三", "四", "五", "六"];

    return (
        <table className="wcms-calendar-month-grid">
            <thead>
                <tr>
                    {weekDayHeader.map((label) => (
                        <th key={label} scope="col">
                            {label}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {weeks.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                        {row.map((dateStr, colIndex) => {
                            if (!dateStr) {
                                return <td key={colIndex} className="empty-cell" />;
                            }

                            const day = daysByDate[dateStr];
                            const jsDate = new Date(dateStr);
                            const dayNum = jsDate.getDate();

                            const isWeekend = jsDate.getDay() === 0 || jsDate.getDay() === 6;
                            const holidayClass = day?.IsHoliday ? "is-holiday" : "";
                            const weekendClass = isWeekend ? "is-weekend" : "";

                            const isToday = dateStr === todayKey;

                            const cellClassName = ["calendar-cell", weekendClass, holidayClass, isToday ? "is-today" : "",].filter(Boolean).join(" ");
                            const ariaLabel = [`${dateStr}（星期${getWeekdayNameZh(jsDate.getDay())}）`, day?.IsHoliday ? `假日：${day?.HolidayName ?? ""}` : "", day?.Description ? `說明：${day.Description}` : "",].filter(Boolean).join("，");

                            const handleCellClick = (e: React.MouseEvent<HTMLButtonElement>, dateStrValue: string) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const anchor: DialogAnchorRect = {
                                    top: rect.top,
                                    left: rect.left,
                                    width: rect.width,
                                    height: rect.height,
                                    viewportWidth: typeof window !== "undefined" ? window.innerWidth : rect.right + 16,
                                    viewportHeight: typeof window !== "undefined" ? window.innerHeight : rect.bottom + 16,
                                };

                                onDayClick(dateStrValue, anchor);
                            };

                            return (
                                <td key={colIndex}>
                                    <button type="button" className={cellClassName} onClick={(e) => handleCellClick(e, dateStr)} aria-label={`編輯 ${ariaLabel}`}>
                                        <span className="calendar-day-number">{dayNum}</span>
                                        <span className="calendar-day-tag">{(day?.HolidayName ?? "").trim() || (day?.IsHoliday ? "假日" : "")}</span>
                                        <span className="calendar-day-tag">{renderOpenCloseText(day)}</span>
                                    </button>
                                </td>
                            );
                        })}
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

interface CalendarDayDialogProps {
    day: CalendarDetail;
    anchor: DialogAnchorRect;
    onCancel: () => void;
    onSave: (updated: CalendarDetail) => void;
}

const CalendarDayDialog: React.FC<CalendarDayDialogProps> = ({ day, anchor, onCancel, onSave }) => {
    const [local, setLocal] = useState<CalendarDetail>(day);

    const isHolidayId = useId();
    const holidayNameId = useId();
    const descId = useId();
    const openTimeId = useId();
    const closeTimeId = useId();
    const memoId = useId();

    useEffect(() => {
        setLocal(day);
    }, [day]);

    /** 更新 local form state */
    const handleChange = <K extends keyof CalendarDetail>(key: K, value: CalendarDetail[K]): void => {
        setLocal((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    /** 送出保存 */
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(local);
    };

    const dialogTitleId = "calendar-day-dialog-title";

    /** 點遮罩關閉 */
    const handleBackdropClick = () => {
        onCancel();
    };

    /** 避免點到 dialog 本體觸發遮罩關閉 */
    const handleDialogClick = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
    };

    /**
     * 版面修正重點：
     * 1) Dialog 固定置中（不貼格子），避免底部按鈕被切掉
     * 2) Dialog 最大高度以 viewport 為準；內容區可滾動，按鈕區永遠看得到
     */
    const dialogStyle: React.CSSProperties = {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        maxHeight: "calc(100vh - 32px)",
        width: "min(520px, calc(100vw - 24px))",
    };

    // anchor 先保留（未來如果要改回「貼格子」可用），目前不使用
    void anchor;

    return (
        <div className="wcms-dialog-backdrop" role="presentation" onClick={handleBackdropClick}>
            <div
                className="wcms-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby={dialogTitleId}
                style={dialogStyle}
                onClick={handleDialogClick}
            >
                <header className="wcms-dialog-header">
                    <h2 id={dialogTitleId}>
                        編輯 {local.Date ?? ""}（星期{getWeekdayNameZh((local.DayOfWeek as any) ?? 0)}）
                    </h2>
                    <button type="button" onClick={onCancel} className="btn-icon" aria-label="關閉編輯視窗">
                        ✕
                    </button>
                </header>

                {/* 這裡用 form 包住，footer 仍可 submit */}
                <form
                    className="wcms-dialog-body"
                    onSubmit={handleSubmit}
                    style={{
                        overflowY: "auto",
                        maxHeight: "calc(100vh - 32px - 56px - 56px)", // 預留 header/footer 高度
                        paddingBottom: 8,
                    }}
                >
                    <div className="form-group">
                        <div className="form-check">
                            <input
                                id={isHolidayId}
                                className="form-check-input"
                                type="checkbox"
                                checked={!!local.IsHoliday}
                                onChange={(e) => handleChange("IsHoliday", e.target.checked)}
                            />
                            <label className="form-check-label" htmlFor={isHolidayId}>
                                是否為假日
                            </label>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor={holidayNameId}>假日名稱</label>
                        <input
                            id={holidayNameId}
                            type="text"
                            className="form-control"
                            value={local.HolidayName ?? ""}
                            onChange={(e) => handleChange("HolidayName", e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor={descId}>說明</label>
                        <textarea
                            id={descId}
                            className="form-control"
                            rows={3}
                            value={local.Description ?? ""}
                            onChange={(e) => handleChange("Description", e.target.value)}
                        />
                    </div>

                    {/*
                      Spec_* 欄位為本次 case 額外擴充：
                      之後會做成 Spec 插件繼承追加（Feature 版不直接耦合 Spec 欄位）
                    */}
                    <div className="form-group">
                        <TimePicker12hWithConfirm
                            inputId={openTimeId}
                            label="開館時間"
                            value24={local.Spec_OpenTime ?? null}
                            onConfirm={(v24) => handleChange("Spec_OpenTime", v24 as any)}
                        />
                    </div>

                    <div className="form-group">
                        <TimePicker12hWithConfirm
                            inputId={closeTimeId}
                            label="閉館時間"
                            value24={local.Spec_CloseTime ?? null}
                            onConfirm={(v24) => handleChange("Spec_CloseTime", v24 as any)}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor={memoId}>修改備註</label>
                        <textarea
                            id={memoId}
                            className="form-control"
                            rows={3}
                            value={local.Spec_ModifyMemo ?? ""}
                            onChange={(e) => handleChange("Spec_ModifyMemo", e.target.value)}
                        />
                    </div>

                    {/* 讓 footer 跟著 form，方便 enter 提交 */}
                    <footer className="wcms-dialog-footer">
                        <button type="button" className="btn btn-outline" onClick={onCancel}>
                            取消
                        </button>
                        <button type="submit" className="btn btn-primary">
                            保存
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

/** ---------- 12h time picker (Confirm to close) ---------- */

interface TimePicker12hWithConfirmProps {
    inputId: string;
    label: string;
    value24: string | null;
    onConfirm: (value24: string | null) => void;
}

/**
 * 12 小時制時間選擇器（含確認/取消）
 * - 顯示：上午/下午 + hh:mm
 * - 儲存：24h HH:mm，送到後端安全
 */
const TimePicker12hWithConfirm: React.FC<TimePicker12hWithConfirmProps> = (props) => {
    const hostRef = useRef<HTMLDivElement | null>(null);
    const [isOpen, setIsOpen] = useState<boolean>(false);

    const [meridiem, setMeridiem] = useState<"AM" | "PM">("AM");
    const [hh12, setHh12] = useState<number>(9);
    const [mm, setMm] = useState<number>(0);

    /** 同步外部 value -> 面板初始值 */
    useEffect(() => {
        const p = parseHHmm(props.value24);
        if (!p) {
            setMeridiem("AM");
            setHh12(9);
            setMm(0);
            return;
        }

        const t12 = to12hParts(p.hh);
        setMeridiem(t12.meridiem);
        setHh12(t12.hh12);
        setMm(p.mm);
    }, [props.value24]);

    /** 開啟面板 */
    const handleOpen = () => {
        setIsOpen(true);
    };

    /** 關閉面板 */
    const handleClose = () => {
        setIsOpen(false);
    };

    /** 點外面關閉（不提交） */
    const handleDocumentClick = useCallback((e: MouseEvent) => {
        const host = hostRef.current;
        if (!host) return;

        if (host.contains(e.target as Node)) return;
        setIsOpen(false);
    }, []);

    useEffect(() => {
        if (!isOpen) return;

        document.addEventListener("mousedown", handleDocumentClick);
        return () => document.removeEventListener("mousedown", handleDocumentClick);
    }, [isOpen, handleDocumentClick]);

    /** 確認 -> 回寫 24h 值並關閉 */
    const handleConfirm = () => {
        const hour24 = to24hHour(meridiem, hh12);
        const v24 = makeHHmm(hour24, mm);

        props.onConfirm(v24);
        setIsOpen(false);
    };

    /** 取消 -> 不回寫，直接關閉 */
    const handleCancel = () => {
        handleClose();
    };

    /** 清空 */
    const handleClear = () => {
        props.onConfirm(null);
        setIsOpen(false);
    };

    const display = format12hDisplay(props.value24);

    return (
        <div ref={hostRef} style={{ position: "relative" }}>
            <label htmlFor={props.inputId}>{props.label}</label>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                    id={props.inputId}
                    type="text"
                    className="form-control"
                    value={display}
                    readOnly
                    onClick={handleOpen}
                    aria-label={`${props.label}（點擊選擇時間）`}
                    placeholder="請選擇時間"
                />
                <button
                    type="button"
                    className="btn btn-outline"
                    onClick={handleOpen}
                    aria-label={`開啟${props.label}時間選擇器`}
                    style={{ whiteSpace: "nowrap" }}
                >
                    選擇
                </button>
            </div>

            {isOpen && (
                <div
                    role="dialog"
                    aria-modal="false"
                    aria-label={`${props.label}時間選擇器`}
                    style={{
                        position: "absolute",
                        zIndex: 2000,
                        top: "calc(100% + 6px)",
                        left: 0,
                        width: "100%",
                        background: "#fff",
                        border: "1px solid rgba(0,0,0,.15)",
                        borderRadius: 8,
                        boxShadow: "0 10px 30px rgba(0,0,0,.2)",
                        padding: 10,
                    }}
                >
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <div style={{ flex: 1 }}>
                            <label className="sr-only">上午下午</label>
                            <select
                                className="form-control"
                                value={meridiem}
                                onChange={(e) => setMeridiem((e.target.value as "AM" | "PM") ?? "AM")}
                                aria-label="上午下午"
                            >
                                <option value="AM">上午</option>
                                <option value="PM">下午</option>
                            </select>
                        </div>

                        <div style={{ flex: 1 }}>
                            <label className="sr-only">時</label>
                            <select
                                className="form-control"
                                value={hh12}
                                onChange={(e) => setHh12(Number(e.target.value) || 1)}
                                aria-label="小時"
                            >
                                {Array.from({ length: 12 }).map((_, i) => {
                                    const v = i + 1;
                                    return (
                                        <option key={v} value={v}>
                                            {String(v).padStart(2, "0")}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        <div style={{ flex: 1 }}>
                            <label className="sr-only">分</label>
                            <select
                                className="form-control"
                                value={mm}
                                onChange={(e) => setMm(Number(e.target.value) || 0)}
                                aria-label="分鐘"
                            >
                                {Array.from({ length: 60 }).map((_, i) => (
                                    <option key={i} value={i}>
                                        {String(i).padStart(2, "0")}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 10 }}>
                        <button type="button" className="btn btn-outline" onClick={handleClear}>
                            清空
                        </button>
                        <button type="button" className="btn btn-outline" onClick={handleCancel}>
                            取消
                        </button>
                        <button type="button" className="btn btn-primary" onClick={handleConfirm}>
                            確認
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarPageComp;




//之後應放在Spec1816上
const renderOpenCloseText = (day: CalendarDetail): string => {
    if (!day) return "";
    const open = toHHmm(day.Spec_OpenTime);
    const close = toHHmm(day.Spec_CloseTime);

    // 都沒有 → 閉館
    if (!open && !close) {
        return "閉館";
    }

    // 只有其中一個，也照樣顯示
    return `開館時間：${open || "--"} ~ ${close || "--"}`;
};
const toHHmm = (v?: string | null): string => {
    const s = (v ?? "").trim();
    if (!s) return "";
    // 允許 HH:mm 或 HH:mm:ss，直接取前 5 碼
    return s.length >= 5 ? s.slice(0, 5) : s;
};

