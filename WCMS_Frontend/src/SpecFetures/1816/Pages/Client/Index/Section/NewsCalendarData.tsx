import CalendarProvider from "@/Features/Hooks/BizFunc/SystemSetting/Calendar/Calendar_Api";
import { LangLink } from "@/SysCore/i18n/LangLink";
import type { Lang } from "@/SysCore/i18n/lang";
import type { components } from "@/types/api";
import { useEffect, useMemo, useState } from "react";

import calendarSvg from '@/SpecFetures/1816/Assets/Client/images/svg_icon/icon-custom-calendar-B.svg'

type CurrentOpenTime = components["schemas"]["SpecCurrentOpenTime_DTO"];

export const NewsCalendarData = (props: { lang: Lang }) => {
	// 宣告變數：SSR/CSR 皆可用的取數 hook
	const { data } = useCurrentOpenTime({ initialData: null });

	// 宣告變數：prototype 這段是「雙語固定顯示」，所以這裡不跟 lang 切換
	const uiText = useMemo(() => {
		return {
			title: props.lang === 'zh-tw' ? "今日開館時間" : "OPENING HOURS",
			closedTitle: props.lang === 'zh-tw' ? "今日休館" : "CLOSED TODAY",
			openDetail: props.lang === 'zh-tw' ? "詳細開館時間" : "Library Opening Hours",
			openDetailTitle: props.lang === 'zh-tw' ? "詳細開館時間" : "Library Opening Hours",
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
	const monthText = useMemo(() => formatMonthENWithIndex(props.lang, effectiveDate), [props.lang, effectiveDate]);
	const dayText = useMemo(() => String(effectiveDate.getDate()), [effectiveDate]);
	const weekdayText = useMemo(() => formatWeekdayBilingual(props.lang, effectiveDate), [props.lang, effectiveDate]);
	const openTime = formatTimeHHmm(data?.Spec_OpenTime);
	const closeTime = formatTimeHHmm(data?.Spec_CloseTime);
	const isOpenDay = Boolean(openTime && closeTime);
	// 宣告變數：節日名稱（若有就附加）
	const holidayText = useMemo(() => formatHolidayName(data?.HolidayName), [data?.HolidayName]);
	// 若還沒資料也要回傳 null，避免 React render undefined
	if (!data) return null;

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
													<img
														src={calendarSvg}
														alt=""
														className="me-2 icon-custom-calendar-B"
													/>
													{isOpenDay ? uiText.title : uiText.closedTitle}
												</div>

												<div className="text-description-box d-flex flex-wrap">
													{props.lang === "zh-tw" ?
														<div className="today-date-box d-flex">
															<div className="MM">{monthText}</div>
															<span className="mx-2">/</span>
															<div className="DD">{dayText}</div>
															<div className="date-week ps-3">{weekdayText}　{holidayText}</div>
														</div>
														:
														<div className="today-date-box d-flex">
															<div className="date-week ps-3">{weekdayText},　</div>
															<div className="MM">{monthText}</div>
															<span className="mx-2">　</span>
															<div className="DD">{dayText}</div>
															<div className="date-week ps-3">{holidayText}</div>
														</div>
													}
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

const monthEnLong = [
	"JANUARY",
	"FEBRUARY",
	"MARCH",
	"APRIL",
	"MAY",
	"JUNE",
	"JULY",
	"AUGUST",
	"SEPTEMBER",
	"OCTOBER",
	"NOVEMBER",
	"DECEMBER",
];

const weekdayMapZh = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
const weekdayMapEnFull = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

const formatMonthENWithIndex = (lang: Lang, d: Date) => {
	// 宣告變數：月份索引（1-12）
	const idx = d.getMonth();
	if (idx < 0 || idx > 11) return "";
	if (lang === 'zh-tw') return idx + 1
	// 執行 function：回傳 prototype 用的 "2 FEBRUARY"
	return monthEnLong[idx];
};

const formatWeekdayBilingual = (lang: Lang, d: Date) => {
	// 宣告變數：星期索引（0-6）
	const idx = d.getDay();
	if (idx < 0 || idx > 6) return "";
	// 執行 function：回傳 "星期三 Wednesday"
	if (lang === 'zh-tw') return weekdayMapZh[idx]
	return weekdayMapEnFull[idx]
};

const formatHolidayName = (holidayName?: string | null) => {
	// 宣告變數：空值直接不顯示
	if (!holidayName) return "";
	// 執行 function：prototype 這段放在 weekday 後面即可
	return `（${holidayName}）`;
};

const formatTimeHHmm = (timeStr?: string | null) => {
	// 宣告變數：空值直接不顯示
	if (!timeStr) return "";
	// 執行 function：從 "08:30:00" 變成 "08:30"
	return timeStr.substring(0, 5);
};

// =========================
// hook：沿用你現有邏輯（SSR/CSR）
// =========================

interface UseCurrentOpenTimeOptions {
	/** SSR 時由伺服器塞進來的資料；CSR 沒有就會自行打 API */
	initialData?: CurrentOpenTime | null;
	/** 可關掉自動抓資料（預設 true） */
	enabled?: boolean;
}

interface UseCurrentOpenTimeResult {
	data: CurrentOpenTime | null;
	isLoading: boolean;
	isError: boolean;
	error: unknown;
	/** 讓畫面手動重抓一次 */
	refetch: () => Promise<void>;
}

/**
 * 取得「今天開館時間」的 hook
 * - SSR：用 initialData
 * - CSR：hydration 後自動抓 /Spec_GetCurrentOpenTime
 */
const useCurrentOpenTime = (options: UseCurrentOpenTimeOptions = {}): UseCurrentOpenTimeResult => {
	const { initialData = null, enabled = true } = options;

	// 宣告變數：Provider（穩定引用）
	const provider = useMemo(() => CalendarProvider(), []);

	// 宣告變數：狀態
	const [data, setData] = useState<CurrentOpenTime | null>(initialData);
	const [isLoading, setIsLoading] = useState<boolean>(!initialData && enabled);
	const [isError, setIsError] = useState<boolean>(false);
	const [error, setError] = useState<unknown>(null);

	// 執行 function：抓資料
	const fetchData = async () => {
		if (!enabled) return;

		try {
			setIsLoading(true);
			setIsError(false);
			setError(null);

			const res = await provider.fetchCurrentOpenTime();
			if (res.IsSuccess && res.Data && res.Data.length > 0) {
				setData(res.Data[0]);
				return;
			}

			setData(null);
		} catch (e) {
			setIsError(true);
			setError(e);
		} finally {
			setIsLoading(false);
		}
	};

	// 執行 function：CSR 自動抓（SSR 不會跑 useEffect）
	useEffect(() => {
		if (!enabled) return;
		if (initialData) return;
		void fetchData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [enabled, initialData]);

	return { data, isLoading, isError, error, refetch: fetchData };
};
