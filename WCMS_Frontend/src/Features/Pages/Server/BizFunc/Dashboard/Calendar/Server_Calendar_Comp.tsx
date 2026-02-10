import './CalendarPageComp.css';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { components } from '@/types/api';
import { CalendarFields } from '@/types/SchemaFields';
import { useToast } from '@/Features/Hooks/Common/useToastCenter';
import { CalendarAdapter } from '@/Features/Hooks/BizFunc/SystemSetting/Calendar/Calendar_Api';
import { MessageStatus } from '@/SysCore/Utils/API/APIBase';

type CalendarSet = components["schemas"]["CalendarSet_DTO"];
type Calendar = components["schemas"]["Calendar_DTO"];
type CalendarDetail = components["schemas"]["CalendarDetail_DTO"];

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

//#region private Func

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
        DayOfWeek: jsDate.getDay() as CalendarDetail["DayOfWeek"],
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
const getWeekdayNameZh = (weekDay: number | null | undefined) => {
    const w = Number(weekDay ?? 0);
    const map = ["日", "一", "二", "三", "四", "五", "六"];
    return map[w] ?? "";
};

/** 把後端 CalendarDetail[] 轉成年字典（並補齊該年每一天） */
const buildYearMapFromList = (year: number, list: CalendarDetail[]): CalendarYearMap => {
    const map: CalendarYearMap = {};

    // 1) 先塞回傳資料
    (list ?? []).forEach((d) => {
        const key = normalizeDateKey(d.Date);
        if (!key) return;
        map[key] = { ...d, Date: key };
    });

    // 2) 補齊缺日
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

/** number -> "HH:mm" */
const formatHHmm = (hh: number, mm: number): string => {
    const h = String(Math.max(0, Math.min(23, hh))).padStart(2, "0");
    const m = String(Math.max(0, Math.min(59, mm))).padStart(2, "0");

    return `${h}:${m}`;
};

//#endregion

/** ---------- Page ---------- */

export const CalendarPageComp: React.FC<CalendarPageCompProps> = ({ defaultYear }) => {
    const today = useMemo(() => new Date(), []);
    const { publish } = useToast();
    const [year, setYear] = useState<number>(defaultYear ?? today.getFullYear());
    const [month, setMonth] = useState<number>(today.getMonth()); // 0~11
    const [daysByDate, setDaysByDate] = useState<CalendarYearMap>({});
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
    const [dialogAnchor, setDialogAnchor] = useState<DialogAnchorRect | null>(null);
    const [refreshTick, setRefreshTick] = useState<number>(0);
    const adapter = useMemo(() => CalendarAdapter(), []);
    const yearDetailsRes = adapter.hooks.useFetchCalendarDetailsByYear({ year, deps: [year, refreshTick], });
    const { isSaving: isDaySaving, updateDayInfoAsync } = adapter.hooks.useUpdateDayInfo();
    useEffect(() => {
        // 宣告變數：將年度清單補齊缺日後 mapping 成字典
        const list = yearDetailsRes.data ?? [];
        const map = buildYearMapFromList(year, list);
        // 執行 function：更新畫面
        setDaysByDate(map);
    }, [year, yearDetailsRes.data]);

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

    /** 跳到今天 */
    const handleGoToday = useCallback(() => {
        const t = new Date();
        setYear(t.getFullYear());
        setMonth(t.getMonth());
        setSelectedDate(formatDateString(t.getFullYear(), t.getMonth(), t.getDate()));
    }, []);

    /** 點某一天：開啟編輯 dialog */
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
            const res = await updateDayInfoAsync(updated);

            if (res.IsSuccess) {
                (res.SysMessage ?? []).forEach(item =>
                    publish({ level: item.Status, code: item.MessageCode, title: item.Message })
                );

                // ✅ 1) 先關閉 dialog
                setIsDialogOpen(false);

                // ✅ 2) 強制重抓該年度，馬上刷新畫面
                setRefreshTick(v => v + 1);

                // ✅ 3) 選取日維持（避免因 Date 帶時間造成失焦）
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
    }, [updateDayInfoAsync, year]);

    /** 目前選到的日資料 */
    const selectedDay: CalendarDetail | null =
        selectedDate != null ? daysByDate[selectedDate] ?? null : null;

    const isLoading = yearDetailsRes.isLoading || isDaySaving;

    return (
        <main className="wcms-calendar-page" aria-labelledby="calendar-page-title">
            <header className="wcms-calendar-header">
                <div className="wcms-calendar-header-left">
                    <h1 id="calendar-page-title" className="page-title">
                        行事曆管理
                    </h1>
                    <p className="page-subtitle">（{year} 年）</p>
                </div>

                <div className="wcms-calendar-header-right" role="group" aria-label="月份切換">
                    <button type="button" className="btn btn-default" onClick={handlePrevMonth} aria-label="上一個月">
                        ‹
                    </button>

                    <div className="wcms-calendar-month-label" aria-live="polite">
                        {year} / {String(month + 1).padStart(2, "0")}
                    </div>

                    <button type="button" className="btn btn-default" onClick={handleNextMonth} aria-label="下一個月">
                        ›
                    </button>

                    <button type="button" className="btn btn-default" onClick={handleGoToday}>
                        今天
                    </button>
                </div>
            </header>


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
                <DayEditDialog
                    anchor={dialogAnchor}
                    dayInfo={selectedDay}
                    onCancel={handleDialogCancel}
                    onSave={handleDialogSave}
                />
            )}
        </main>
    );
};

/** 月曆格子（不帶邏輯，只負責 render） */
const CalendarMonthGrid: React.FC<{
    year: number;
    month: number;
    daysByDate: CalendarYearMap;
    onDayClick: (dateStr: string, anchor: DialogAnchorRect) => void;
}> = (props) => {
    const weekdayLabels = ["日", "一", "二", "三", "四", "五", "六"];
    const monthStart = new Date(props.year, props.month, 1);
    const monthStartDay = monthStart.getDay(); // 0=Sun
    const daysInMonth = new Date(props.year, props.month + 1, 0).getDate();

    const cells: Array<{ dateStr: string | null; dayNumber: number | null }> = [];

    // leading blanks
    for (let i = 0; i < monthStartDay; i += 1) {
        cells.push({ dateStr: null, dayNumber: null });
    }

    // actual days
    for (let d = 1; d <= daysInMonth; d += 1) {
        const dateStr = formatDateString(props.year, props.month, d);
        cells.push({ dateStr, dayNumber: d });
    }

    // trailing blanks to fill complete weeks (optional)
    while (cells.length % 7 !== 0) {
        cells.push({ dateStr: null, dayNumber: null });
    }

    const hostId = useId();

    return (
        <div className="wcms-calendar-grid" role="grid" aria-label={`${props.year} 年 ${props.month + 1} 月 月曆`} id={hostId}>
            {/* weekday header */}
            <div className="wcms-calendar-grid-header" role="row">
                {weekdayLabels.map((w) => (
                    <div key={w} className="wcms-calendar-grid-cell header" role="columnheader">
                        {w}
                    </div>
                ))}
            </div>

            {/* weeks */}
            <div className="wcms-calendar-grid-body" role="rowgroup">
                {cells.map((c, idx) => {
                    if (!c.dateStr) {
                        return <div key={`empty-${idx}`} className="wcms-calendar-grid-cell empty" role="gridcell" />;
                    }

                    const dayInfo = props.daysByDate[c.dateStr];
                    const isHoliday = Boolean(dayInfo?.IsHoliday);
                    const holidayName = (dayInfo?.HolidayName ?? "").trim();
                    const desc = (dayInfo?.Description ?? "").trim();

                    return (
                        <button
                            key={c.dateStr}
                            type="button"
                            className={`wcms-calendar-grid-cell day ${isHoliday ? "holiday" : ""}`}
                            role="gridcell"
                            onClick={(e) => {
                                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                props.onDayClick(c.dateStr!, {
                                    top: rect.top,
                                    left: rect.left,
                                    width: rect.width,
                                    height: rect.height,
                                    viewportWidth: window.innerWidth,
                                    viewportHeight: window.innerHeight,
                                });
                            }}
                            aria-label={`${c.dateStr}（星期${getWeekdayNameZh(dayInfo?.DayOfWeek ?? 0)}）`}
                        >
                            <div className="wcms-calendar-day-number">{c.dayNumber}</div>

                            {(holidayName || desc) && (
                                <div className="wcms-calendar-day-meta">
                                    {holidayName && <div className="holiday-name">{holidayName}</div>}
                                    {desc && <div className="day-desc">{desc}</div>}
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

interface TimePicker12hWithConfirmProps {
    inputId: string;
    label: string;
    value24: string | null;
    onConfirm: (value24: string | null) => void;
}

/**
 * 12 小時制時間選擇器
 * - AA：label + sr-only、button 可 focus
 * - 不依賴外部套件
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
        const parts = to12hParts(p.hh);
        setMeridiem(parts.meridiem);
        setHh12(parts.hh12);
        setMm(p.mm);
    }, [props.value24]);

    /** click outside -> close */
    useEffect(() => {
        const onDoc = (ev: MouseEvent) => {
            if (!isOpen) return;
            const el = hostRef.current;
            if (!el) return;
            if (ev.target instanceof Node && el.contains(ev.target)) return;
            setIsOpen(false);
        };
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, [isOpen]);

    /** 確認 */
    const handleConfirm = useCallback(() => {
        const hh24 = to24hHour(meridiem, hh12);
        const value24 = formatHHmm(hh24, mm);
        props.onConfirm(value24);
        setIsOpen(false);
    }, [meridiem, hh12, mm, props]);

    return (
        <div className="wcms-timepicker" ref={hostRef}>
            <label htmlFor={props.inputId} className="sr-only">
                {props.label}
            </label>

            <div className="wcms-timepicker-input-row">
                <input
                    id={props.inputId}
                    className="form-control"
                    value={props.value24 ?? ""}
                    readOnly
                    onClick={() => setIsOpen((v) => !v)}
                    aria-haspopup="dialog"
                    aria-expanded={isOpen}
                />

                <button type="button" className="btn btn-default" onClick={() => setIsOpen((v) => !v)}>
                    選擇
                </button>
            </div>

            {isOpen && (
                <div className="wcms-timepicker-panel" role="dialog" aria-label={`${props.label} 選擇器`}>
                    <div className="wcms-timepicker-row">
                        <div style={{ width: 88 }}>
                            <label className="sr-only">AM/PM</label>
                            <select
                                className="form-control"
                                value={meridiem}
                                onChange={(e) => setMeridiem(e.target.value as "AM" | "PM")}
                            >
                                <option value="AM">AM</option>
                                <option value="PM">PM</option>
                            </select>
                        </div>

                        <div style={{ flex: 1 }}>
                            <label className="sr-only">時</label>
                            <select className="form-control" value={hh12} onChange={(e) => setHh12(Number(e.target.value))}>
                                {Array.from({ length: 12 }, (_, i) => i + 1).map((v) => (
                                    <option key={v} value={v}>
                                        {String(v).padStart(2, "0")}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ flex: 1 }}>
                            <label className="sr-only">分</label>
                            <select className="form-control" value={mm} onChange={(e) => setMm(Number(e.target.value))}>
                                {Array.from({ length: 60 }, (_, i) => i).map((v) => (
                                    <option key={v} value={v}>
                                        {String(v).padStart(2, "0")}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: "flex", gap: 8 }}>
                            <button type="button" className="btn btn-default" onClick={() => setIsOpen(false)}>
                                取消
                            </button>
                            <button type="button" className="btn btn-primary" onClick={handleConfirm}>
                                確認
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const DayEditDialog: React.FC<{
    anchor: DialogAnchorRect;
    dayInfo: CalendarDetail;
    onCancel: () => void;
    onSave: (updated: CalendarDetail) => void;
}> = (props) => {
    const dialogId = useId();
    const openTimeId = useId();
    const closeTimeId = useId();
    const [local, setLocal] = useState<CalendarDetail>({ ...props.dayInfo });

    useEffect(() => {
        setLocal({ ...props.dayInfo });
    }, [props.dayInfo]);

    /** 更新 local */
    const handleChange = <K extends keyof CalendarDetail>(key: K, value: CalendarDetail[K]): void => {
        setLocal((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    /** 送出保存 */
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // ✅ Date key normalize
        const key = normalizeDateKey(local.Date);
        const updated: CalendarDetail = { ...local, Date: key };

        props.onSave(updated);
    };

    /** dialog 位置 */
    const style = useMemo(() => {
        const padding = 12;
        const w = 420;
        const h = 520;

        // default: below
        let top = props.anchor.top + props.anchor.height + 8;
        let left = props.anchor.left;

        // keep inside viewport
        if (left + w + padding > props.anchor.viewportWidth) {
            left = Math.max(padding, props.anchor.viewportWidth - w - padding);
        }
        if (top + h + padding > props.anchor.viewportHeight) {
            top = Math.max(padding, props.anchor.top - h - 8);
        }

        return { top, left, width: w };
    }, [props.anchor]);

    return (
        <div className="wcms-calendar-dialog-overlay" role="presentation">
            <div
                id={dialogId}
                className="wcms-calendar-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby={`${dialogId}-title`}
                style={{ top: style.top, left: style.left, width: style.width }}
            >
                <div className="wcms-calendar-dialog-header">
                    <h2 id={`${dialogId}-title`} className="dialog-title">
                        {local.Date}（星期{getWeekdayNameZh(local.DayOfWeek ?? 0)}）
                    </h2>

                    <button type="button" className="btn btn-default" onClick={props.onCancel} aria-label="關閉">
                        ×
                    </button>
                </div>

                <form className="wcms-calendar-dialog-body" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>
                            <input
                                type="checkbox"
                                checked={Boolean(local.IsHoliday)}
                                onChange={(e) => handleChange("IsHoliday", e.target.checked as CalendarDetail["IsHoliday"])}
                            />
                            {" "}假日
                        </label>
                    </div>

                    <div className="form-group">
                        <label htmlFor={`${dialogId}-holiday-name`}>假日名稱</label>
                        <input
                            id={`${dialogId}-holiday-name`}
                            className="form-control"
                            value={local.HolidayName ?? ""}
                            onChange={(e) => handleChange("HolidayName", e.target.value as CalendarDetail["HolidayName"])}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor={`${dialogId}-desc`}>描述</label>
                        <textarea
                            id={`${dialogId}-desc`}
                            className="form-control"
                            value={local.Description ?? ""}
                            onChange={(e) => handleChange("Description", e.target.value as CalendarDetail["Description"])}
                        />
                    </div>

                    <div className="form-group">
                        <TimePicker12hWithConfirm
                            inputId={openTimeId}
                            label="開館時間"
                            value24={local.Spec_OpenTime ?? null}
                            onConfirm={(v24) => handleChange("Spec_OpenTime", v24)}
                        />
                    </div>

                    <div className="form-group">
                        <TimePicker12hWithConfirm
                            inputId={closeTimeId}
                            label="閉館時間"
                            value24={local.Spec_CloseTime ?? null}
                            onConfirm={(v24) => handleChange("Spec_CloseTime", v24)}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor={`${dialogId}-memo`}>修改備註</label>
                        <textarea
                            id={`${dialogId}-memo`}
                            className="form-control"
                            value={local.Spec_ModifyMemo ?? ""}
                            onChange={(e) => handleChange("Spec_ModifyMemo", e.target.value as CalendarDetail["Spec_ModifyMemo"])}
                        />
                    </div>

                    <div className="wcms-calendar-dialog-footer">
                        <button type="button" className="btn btn-default" onClick={props.onCancel}>
                            取消
                        </button>
                        <button type="submit" className="btn btn-primary">
                            保存
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CalendarPageComp;
