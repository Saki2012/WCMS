import { CalendarAdapter } from "@/Features/Hooks/BizFunc/SystemSetting/Calendar/Calendar_Api";
import type { ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { LangLink } from "@/SysCore/i18n/LangLink";
import type { Lang } from "@/SysCore/i18n/lang";
import type { components } from "@/types/api";
import { useEffect, useMemo, useState } from "react";

import calendarSvg from "@/SpecFetures/1816/Assets/Client/images/svg_icon/icon-custom-calendar-B.svg";

type CurrentOpenTime = components["schemas"]["SpecCurrentOpenTime_DTO"];

export const NewsCalendarData = (props: { lang: Lang; initialOpenTime: CurrentOpenTime | null }) => {
  // 宣告變數：adapter（穩定引用）
  const adapter = useMemo(() => CalendarAdapter(), []);

  // 宣告變數：把 loader 的單筆資料包成 hook initial（list 型）
  const initial = useMemo(() => {
    return buildCurrentOpenTimeInitial(props.initialOpenTime);
  }, [props.initialOpenTime]);

  // 執行 function：CSR 用 adapter hook 接手（SSR 有 initial → hydration 不重抓）
  const q = adapter.hooks.useCurrentOpenTime({
    initial,
    deps: [props.lang],
  });

  // 宣告變數：本頁用第一筆
  const data = q.data;

  // 宣告變數：prototype 這段是「雙語固定顯示」，所以這裡不跟 lang 切換
  const uiText = useMemo(() => {
    return {
      title: props.lang === "zh-tw" ? "今日開館時間 OPENING HOURS" : "OPENING HOURS",
      closedTitle: props.lang === "zh-tw" ? "今日休館 CLOSED TODAY" : "CLOSED TODAY",
      openDetail: props.lang === "zh-tw" ? "詳細開館時間" : "Library Opening Hours",
      openDetailTitle: props.lang === "zh-tw" ? "詳細開館時間" : "Library Opening Hours",
    };
  }, [props.lang]);

  // 宣告變數：為了對標 prototype 的「每分鐘更新」日期/星期顯示
  const [nowTick, setNowTick] = useState<number>(() => Date.now());

  // 執行 function：每分鐘 tick 一次，更新顯示用的日期/星期（對標 prototype JS）
  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 60000);
    return () => window.clearInterval(id);
  }, []);

  // 宣告變數：若 API 有 Date 就用 API Date，否則 fallback 用現在時間
  const effectiveDate = useMemo(() => {
    const apiDate = data?.Date ? new Date(data.Date) : null;
    if (apiDate && !Number.isNaN(apiDate.getTime())) return apiDate;
    return new Date(nowTick);
  }, [data?.Date, nowTick]);

  // 宣告變數：組 prototype 需要的欄位（2 FEBRUARY / 4、星期三 Wednesday、8:00 ~ 17:00）
  const monthText = useMemo(() => formatMonthENWithIndex(effectiveDate), [effectiveDate]);
  const dayText = useMemo(() => String(effectiveDate.getDate()), [effectiveDate]);
  const weekdayText = useMemo(() => formatWeekdayBilingual(props.lang, effectiveDate), [props.lang, effectiveDate]);

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
                            <div className="MM">{monthText}</div>
                            <span className="mx-2">/</span>
                            <div className="DD">{dayText}</div>
                            <div className="date-week ps-3">
                              {weekdayText}
                              {holidayText}
                            </div>
                          </div>

                          <div className="Input date-time">{isOpenDay ? `${openTime} ~ ${closeTime}` : ""}</div>
                          {/* prototype 有 now-time，但目前註解掉；這裡維持不輸出 */}
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
                {/* // Opening_hours_DIV */}
              </div>
            </div>
          </div>
          {/* // container-customize4 */}
        </div>
        {/* // customizeBox */}
      </div>
      {/* // Mask-DivBox */}
    </section>
  );
};

// =========================
// helpers（保持小且可維護）
// =========================

const buildCurrentOpenTimeInitial = (openTime: CurrentOpenTime | null): ApiLoaderData<null, CurrentOpenTime[]> | null => {
  // 宣告變數：沒有 initial 就回 null
  if (!openTime) return null;

  // 宣告變數：組 env（list）
  const apiRes: ApiResponse<CurrentOpenTime[]> = { IsSuccess: true, Data: [openTime], SysMessage: [] };

  // return
  return { args: null, apiRes };
};

const monthEnLong = [
  "1 JANUARY",
  "2 FEBRUARY",
  "3 MARCH",
  "4 APRIL",
  "5 MAY",
  "6 JUNE",
  "7 JULY",
  "8 AUGUST",
  "9 SEPTEMBER",
  "10 OCTOBER",
  "11 NOVEMBER",
  "12 DECEMBER",
];

const weekdayMapZh = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
const weekdayMapEnFull = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

const formatMonthENWithIndex = (d: Date) => {
  // 宣告變數：月份索引（1-12）
  const idx = d.getMonth();
  if (idx < 0 || idx > 11) return "";
  // return：prototype 用的 "2 FEBRUARY"
  return monthEnLong[idx];
};

const formatWeekdayBilingual = (lang: Lang, d: Date) => {
  // 宣告變數：星期索引（0-6）
  const idx = d.getDay();
  if (idx < 0 || idx > 6) return "";
  // return：回傳 "星期三 Wednesday"
  if (lang === "zh-tw") return `${weekdayMapZh[idx]}　${weekdayMapEnFull[idx]}`;
  return `${weekdayMapEnFull[idx]}`;
};

const formatHolidayName = (holidayName?: string | null) => {
  // 宣告變數：空值直接不顯示
  if (!holidayName) return "";
  // return：prototype 這段放在 weekday 後面即可
  return `（${holidayName}）`;
};

const formatTimeHHmm = (timeStr?: string | null) => {
  // 宣告變數：空值直接不顯示
  if (!timeStr) return "";
  // return：從 "08:30:00" 變成 "08:30"
  return timeStr.substring(0, 5);
};