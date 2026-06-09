import calendarSvg from "@/SpecFetures/1816/Assets/Client/images/svg_icon/icon-custom-calendar-B.svg";
import { SpecCalendarAdapter } from "@/SpecFetures/1816/Hooks/BizFunc/Calendar/SpecCalendar_Api";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";
import type { ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import type { components } from "@/types/api";
import { useEffect, useMemo, useState } from "react";

// #region Property
type CurrentOpenTime = components["schemas"]["SpecCurrentOpenTime_DTO"];

const monthEnLong = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];

const weekdayMapZh = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];

const weekdayMapEnFull = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
// #endregion

// #region Public
export const NewsCalendarData = (props: { lang: Lang; initialOpenTime: CurrentOpenTime | null; }) =>
{
    // 宣告變數：adapter（穩定引用）
    const adapter = useMemo(() => SpecCalendarAdapter(), []);
    // 宣告變數：把 SSR loader 的單筆資料包成 hook initial（list 型）
    const initial = useMemo(() =>
    {
        return buildCurrentOpenTimeInitial(props.initialOpenTime);
    }, [props.initialOpenTime]);
    // 執行 function：CSR 用 adapter hook 接手（SSR 有 initial → hydration 不重抓）
    const q = adapter.hooks.useFetchCurrentOpenTime({ initial, deps: [props.lang] });
    // 宣告變數：本頁只用第一筆
    const data = useMemo(() => q.data?.[0] ?? null, [q.data]);
    // 宣告變數：prototype 這段是「雙語固定顯示」的表現（但仍依 lang 切換標題/按鈕字）
    const uiText = useMemo(() =>
    {
        return {
            title: props.lang === "zh-tw" ? "今日開館時間" : "OPENING HOURS",
            closedTitle: props.lang === "zh-tw" ? "今日休館" : "CLOSED TODAY",
            openDetail: props.lang === "zh-tw" ? "詳細開館時間" : "Library Opening Hours",
            openDetailTitle: props.lang === "zh-tw" ? "詳細開館時間" : "Library Opening Hours",
        };
    }, [props.lang]);
    // 宣告變數：為了對標 prototype 的「每分鐘更新」日期/星期顯示
    const [nowTick, setNowTick] = useState<number>(() => Date.now());
    // 執行 function：每分鐘 tick 一次，更新顯示用的日期/星期（對標 prototype JS）
    useEffect(() =>
    {
        const id = window.setInterval(() => setNowTick(Date.now()), 60000);
        return () => window.clearInterval(id);
    }, []);
    // 宣告變數：若 API 有 Date 就用 API Date，否則 fallback 用現在時間
    const effectiveDate = useMemo(() =>
    {
        const apiDate = data?.Date ? new Date(data.Date) : null;
        const apiOk = Boolean(apiDate) && !Number.isNaN(apiDate!.getTime());
        return apiOk ? apiDate! : new Date(nowTick);
    }, [data?.Date, nowTick]);
    // 宣告變數：組 prototype 需要的欄位（2 FEBRUARY / 4、星期三 Wednesday、8:00 ~ 17:00）
    const monthText = useMemo(() => formatMonthWithIndex(props.lang, effectiveDate), [props.lang, effectiveDate]);
    const dayText = useMemo(() => String(effectiveDate.getDate()), [effectiveDate]);
    const weekdayText = useMemo(() => formatWeekdayBilingual(props.lang, effectiveDate), [props.lang, effectiveDate]);
    // 宣告變數：開閉館時間
    const openTime = formatTimeHHmm(data?.Spec_OpenTime);
    const closeTime = formatTimeHHmm(data?.Spec_CloseTime);
    const isOpenDay = Boolean(openTime && closeTime);
    // 宣告變數：節日名稱（若有就附加）
    const holidayText = useMemo(() => formatHolidayName(data?.HolidayName), [data?.HolidayName]);
    return (
        <section className="open_section" style={{}}>
            <div className="Mask-DivBox">
                <div className="customizeBox mb-3" style={{ backgroundColor: "#f2f2f2" }}>
                    <div className="container-customize4 image-layer">
                        <div className="row">
                            <div className="col-12">
                                <div className="Opening_hours_DIV">
                                    <div className="Date_wrapbox d-flex">
                                        <div className="DateTitleBox d-flex">
                                            <div className="text_black">
                                                <div className="date-Ptit">
                                                    <img src={calendarSvg} alt="" className="me-2 icon-custom-calendar-B" />
                                                    {isOpenDay ? uiText.title : uiText.closedTitle}
                                                </div>
                                                <div className="text-description-box d-flex flex-wrap">
                                                    <div className="today-date-box d-flex">
                                                        {props.lang === "zh-tw"
                                                            ? (
                                                                <>
                                                                    <div className="MM">{monthText}</div>
                                                                    <span className="mx-2">/</span>
                                                                    <div className="DD">{dayText}</div>
                                                                    <div className="date-week ps-3">{weekdayText}{holidayText}</div>
                                                                </>
                                                            )
                                                            : (
                                                                <>
                                                                    <div className="date-week ps-3">{weekdayText}{","}</div>
                                                                    <div className="MM mx-2">{monthText}</div>
                                                                    <div className="DD">{dayText}{holidayText}</div>
                                                                </>
                                                            )}
                                                    </div>
                                                    <div className="Input date-time">{isOpenDay ? `${openTime} ~ ${closeTime}` : ""}</div>
                                                </div>
                                            </div>
                                            <div className="open_btn_black">
                                                <LangLink
                                                    className="Open_btn"
                                                    to={"/services/services-loan/services-loan-01"}
                                                    tabIndex={0}
                                                    target="_self"
                                                    title={uiText.openDetailTitle}
                                                >
                                                    <span className="icon-custom-school-B me-2" />
                                                    {uiText.openDetail}
                                                </LangLink>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
// #endregion

// #region EntityComp
// =========================
// helpers（保持小且可維護）
// =========================

const buildCurrentOpenTimeInitial = (openTime: CurrentOpenTime | null): ApiLoaderData<null, CurrentOpenTime[]> | null =>
{
    if (!openTime) return null;
    const apiRes: ApiResponse<CurrentOpenTime[]> = { IsSuccess: true, Data: [openTime], SysMessage: [] };
    return { args: null, apiRes };
};
// #endregion

// #region Private
const formatMonthWithIndex = (lang: Lang, d: Date) =>
{
    const idx = d.getMonth();
    if (idx < 0 || idx > 11) return "";
    if (lang === "zh-tw") return idx + 1;
    return monthEnLong[idx];
};


const formatWeekdayBilingual = (lang: Lang, d: Date) =>
{
    const idx = d.getDay();
    if (idx < 0 || idx > 6) return "";
    if (lang === "zh-tw") return weekdayMapZh[idx];
    return weekdayMapEnFull[idx];
};


const formatHolidayName = (holidayName?: string | null) =>
{
    if (!holidayName) return "";
    return `（${holidayName}）`;
};


const formatTimeHHmm = (timeStr?: string | null) =>
{
    if (!timeStr) return "";
    return timeStr.substring(0, 5);
};
// #endregion
