import './CalendarPageComp.css'
import { useCallback, useEffect, useMemo, useState, } from "react";
import type { components } from '@/types/api';
type CalendarSet = components["schemas"]["CalendarSet_DTO"]
type CalendarDetail = components["schemas"]["CalendarDetail_DTO"]



export type CalendarHolidayType = | "Normal" | "NationalHoliday" | "MakeupWork" | "WinterBreak" | "SummerBreak" | "SchoolClosed" | "Custom";

export interface CalendarDay {
    /** YYYY-MM-DD */
    date: string;
    /** 0（日）~ 6（六），主要給 UI 用，不一定要存 DB */
    weekDay: number;
    holidayType: CalendarHolidayType;
    isOpenLibrary: boolean;
    isSchoolDay: boolean;
    description: string;
    source: "GovAPI" | "School" | "Manual";
}

type CalendarYearMap = Record<string, CalendarDay>;
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

const formatDateString = (year: number, monthZeroBased: number, day: number): string => {
    const mm = String(monthZeroBased + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return `${year}-${mm}-${dd}`;
};

const getWeekdayNameZh = (weekDay: number): string => {
    const names = ["日", "一", "二", "三", "四", "五", "六"];
    return names[weekDay] ?? "";
};

const getMonthLabelZh = (monthZeroBased: number): string => {
    const names = ["1 月", "2 月", "3 月", "4 月", "5 月", "6 月", "7 月", "8 月", "9 月", "10 月", "11 月", "12 月",];
    return names[monthZeroBased] ?? "";
};

// TODO: 這兩個之後可以改成呼叫你專案裡的 APIClient / Hook
const fetchCalendarYear = async (year: number): Promise<CalendarYearMap> => {
    // 先給一個假資料，讓畫面可以動；之後你可以改成實際 API。
    const map: CalendarYearMap = {};
    for (let month = 0; month < 12; month += 1) {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let day = 1; day <= daysInMonth; day += 1) {
            const dateStr = formatDateString(year, month, day);
            const jsDate = new Date(year, month, day);
            map[dateStr] = {
                date: dateStr,
                weekDay: jsDate.getDay(),
                holidayType: "Normal",
                isOpenLibrary: true,
                isSchoolDay: true,
                description: "",
                source: "Manual",
            };
        }
    }
    return map;
};

const saveCalendarYear = async (year: number, changedDays: CalendarDay[]): Promise<void> => {
    // TODO: 這裡用 fetch 只是範例，你之後改成 APIClient 即可。
    await fetch(`/Service/Calendar/SaveYear?year=${year}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(changedDays),
    });
};

export const CalendarPageComp: React.FC<CalendarPageCompProps> = ({ defaultYear, }) => {
    const today = useMemo(() => new Date(), []);
    const [year, setYear] = useState<number>(defaultYear ?? today.getFullYear());
    const [month, setMonth] = useState<number>(today.getMonth()); // 0~11
    const [daysByDate, setDaysByDate] = useState<CalendarYearMap>({});
    const [dirtyDates, setDirtyDates] = useState<Set<string>>(new Set());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [dialogAnchor, setDialogAnchor] = useState<DialogAnchorRect | null>(null);

    const loadYear = useCallback(
        async (targetYear: number) => {
            setIsLoading(true);
            setError(null);
            try {
                const map = await fetchCalendarYear(targetYear);
                setDaysByDate(map);
                setDirtyDates(new Set());
            } catch (err) {
                setError("載入行事曆資料時發生錯誤");
            } finally {
                setIsLoading(false);
            }
        },
        []
    );

    useEffect(() => {
        void loadYear(year);
    }, [year, loadYear]);

    const handlePrevMonth = useCallback(() => {
        setMonth((prev) => {
            if (prev === 0) {
                setYear((y) => y - 1);
                return 11;
            }
            return prev - 1;
        });
    }, []);

    const handleNextMonth = useCallback(() => {
        setMonth((prev) => {
            if (prev === 11) {
                setYear((y) => y + 1);
                return 0;
            }
            return prev + 1;
        });
    }, []);

    const handleGoToday = useCallback(() => {
        const now = new Date();
        setYear(now.getFullYear());
        setMonth(now.getMonth());
    }, []);

    const handleDayClick = useCallback(
        (dateStr: string, anchor: DialogAnchorRect) => {
            setSelectedDate(dateStr);
            setDialogAnchor(anchor);
            setIsDialogOpen(true);
        }, []);

    const handleDialogCancel = useCallback(() => {
        setIsDialogOpen(false);
    }, []);

    const handleDialogSave = useCallback(
        (updated: CalendarDay) => {
            setDaysByDate((prev) => ({
                ...prev,
                [updated.date]: updated,
            }));

            setDirtyDates((prev) => {
                const next = new Set(prev);
                next.add(updated.date);
                return next;
            });

            setIsDialogOpen(false);
        }, []);

    const handleSaveChanges = useCallback(async () => {
        if (dirtyDates.size === 0) {
            return;
        }
        setIsSaving(true);
        setError(null);
        try {
            const changedDays: CalendarDay[] = Array.from(dirtyDates).map(
                (dateStr) => daysByDate[dateStr]
            );
            await saveCalendarYear(year, changedDays);
            setDirtyDates(new Set());
        } catch (err) {
            setError("儲存本年度異動時發生錯誤");
        } finally {
            setIsSaving(false);
        }
    }, [dirtyDates, daysByDate, year]);

    const selectedDay: CalendarDay | null =
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
                        <input type="number" aria-label="選擇年份" value={year} onChange={(e) => setYear(Number(e.target.value) || year)} className="year-input" />
                    </label>

                    <button type="button" onClick={handleSaveChanges} disabled={isSaving || dirtyDates.size === 0} className="btn btn-primary" aria-disabled={isSaving || dirtyDates.size === 0}>
                        {isSaving ? "儲存中…" : "儲存本年度異動"}
                    </button>
                </div>
            </header>

            <section className="wcms-calendar-toolbar" aria-label="月份切換與工具列">
                <div className="wcms-calendar-month-nav">
                    <button type="button" onClick={handlePrevMonth} className="btn btn-ghost" aria-label="上一個月">
                        ◀
                    </button>

                    <div aria-live="polite" aria-atomic="true" className="wcms-calendar-month-label" >
                        {year} 年 {getMonthLabelZh(month)}
                    </div>

                    <button type="button" onClick={handleNextMonth} className="btn btn-ghost" aria-label="下一個月">
                        ▶
                    </button>

                    <button type="button" onClick={handleGoToday} className="btn btn-outline">
                        今天
                    </button>
                </div>

                {dirtyDates.size > 0 && (
                    <div className="wcms-calendar-dirty-indicator" aria-live="polite">
                        尚未儲存的日期：{dirtyDates.size} 筆
                    </div>)}
            </section>

            {error && (
                <div className="wcms-calendar-error" role="alert">
                    {error}
                </div>)}

            <section className="wcms-calendar-month-grid-section" aria-label="月曆檢視">
                {isLoading ? (
                    <div className="wcms-calendar-loading" aria-live="polite">
                        讀取中…
                    </div>
                ) : (<CalendarMonthGrid year={year} month={month} daysByDate={daysByDate} onDayClick={handleDayClick} />)}
            </section>

            {isDialogOpen && selectedDay && dialogAnchor && (
                <CalendarDayDialog key={selectedDay.date} day={selectedDay} anchor={dialogAnchor} onCancel={handleDialogCancel} onSave={handleDialogSave} />)}
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

const CalendarMonthGrid: React.FC<CalendarMonthGridProps> = ({ year, month, daysByDate, onDayClick, }) => {
    const weeks = useMemo(() => {
        const firstDay = new Date(year, month, 1);
        const firstWeekday = firstDay.getDay(); // 0~6
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const totalCells = 6 * 7;
        const cells: (string | null)[] = [];
        let dayCounter = 1;
        for (let i = 0; i < totalCells; i += 1) {
            if (i < firstWeekday || dayCounter > daysInMonth) {
                cells.push(null); // 空白格
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
                            const isWeekend =
                                jsDate.getDay() === 0 || jsDate.getDay() === 6;

                            const holidayClass =
                                day?.holidayType && day.holidayType !== "Normal"
                                    ? `holiday-${day.holidayType}`
                                    : "";
                            const weekendClass = isWeekend ? "is-weekend" : "";

                            const cellClassName = [
                                "calendar-cell",
                                weekendClass,
                                holidayClass,
                            ]
                                .filter(Boolean)
                                .join(" ");

                            const ariaLabel = [
                                `${dateStr}（星期${getWeekdayNameZh(jsDate.getDay())}）`,
                                day?.holidayType && day.holidayType !== "Normal"
                                    ? `類型：${day.holidayType}`
                                    : "",
                                day?.description ? `備註：${day.description}` : "",
                            ]
                                .filter(Boolean)
                                .join("，");
                            const handleCellClick = (
                                e: React.MouseEvent<HTMLButtonElement>,
                                dateStrValue: string
                            ) => {
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
                                    <button
                                        type="button"
                                        className={cellClassName}
                                        onClick={(e) => handleCellClick(e, dateStr)}
                                        aria-label={`編輯 ${ariaLabel}`}
                                    >
                                        <span className="calendar-day-number">{dayNum}</span>
                                        {day?.holidayType && day.holidayType !== "Normal" && (
                                            <span className="calendar-day-tag">
                                                {renderHolidayLabel(day.holidayType)}
                                            </span>
                                        )}
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

const renderHolidayLabel = (type: CalendarHolidayType): string => {
    switch (type) {
        case "NationalHoliday":
            return "國定假日";
        case "MakeupWork":
            return "補班日";
        case "WinterBreak":
            return "寒假";
        case "SummerBreak":
            return "暑假";
        case "SchoolClosed":
            return "停課";
        case "Custom":
            return "自訂";
        default:
            return "";
    }
};

interface CalendarDayDialogProps {
    day: CalendarDay;
    anchor: DialogAnchorRect;
    onCancel: () => void;
    onSave: (updated: CalendarDay) => void;
}

const CalendarDayDialog: React.FC<CalendarDayDialogProps> = ({ day, anchor, onCancel, onSave, }) => {
    const [local, setLocal] = useState<CalendarDay>(day);

    useEffect(() => {
        setLocal(day);
    }, [day]);

    const handleChange = <K extends keyof CalendarDay>(
        key: K,
        value: CalendarDay[K]
    ): void => {
        setLocal((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(local);
    };

    const dialogTitleId = "calendar-day-dialog-title";

    // 計算要貼在哪裡
    const margin = 8;
    const dialogWidth = 420;
    const dialogHeight = 280;

    let left = anchor.left;
    let top = anchor.top + anchor.height + margin;

    const maxLeft = anchor.viewportWidth - dialogWidth - margin;
    const maxTop = anchor.viewportHeight - dialogHeight - margin;

    // 若靠右邊太近就往左縮，至少保留 margin
    if (left > maxLeft) {
        left = Math.max(margin, maxLeft);
    }

    // 若往下會超出畫面，就改成貼在格子上方
    if (top > maxTop) {
        top = Math.max(margin, anchor.top - dialogHeight - margin);
    }

    const handleBackdropClick = () => {
        onCancel();
    };

    const handleDialogClick = (e: React.MouseEvent<HTMLDivElement>) => {
        // 避免點在 dialog 本體也關閉
        e.stopPropagation();
    };

    return (
        <div
            className="wcms-dialog-backdrop"
            role="presentation"
            onClick={handleBackdropClick}
        >
            <div
                className="wcms-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby={dialogTitleId}
                style={{ position: "fixed", top, left }}
                onClick={handleDialogClick}
            >
                <header className="wcms-dialog-header">
                    <h2 id={dialogTitleId}>
                        編輯 {local.date}（星期{getWeekdayNameZh(local.weekDay)}）
                    </h2>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="btn-icon"
                        aria-label="關閉編輯視窗"
                    >
                        ✕
                    </button>
                </header>

                {/* 下面 form 內容不用動 */}
                <form className="wcms-dialog-body" onSubmit={handleSubmit}>
                    {/* ...原本欄位... */}
                </form>
            </div>
        </div>
    );
};

export default CalendarPageComp;
