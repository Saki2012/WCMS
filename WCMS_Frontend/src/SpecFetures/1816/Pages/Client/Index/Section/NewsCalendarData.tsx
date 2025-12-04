import CalendarProvider from "@/Features/Hooks/BizFunc/SystemSetting/Calendar/Calendar_Api";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { components } from "@/types/api";
type CurrentOpenTime = components["schemas"]["SpecCurrentOpenTime_DTO"];

export const NewsCalendarData = () => {
	const { data, isLoading } = useCurrentOpenTime({ initialData: null, });
	if (!data) return
	const month = formatMonth(data.Date ?? "");
	const day = formatDay(data.Date ?? "");
	const weekday = formatWeekday(data.DayOfWeek ?? 0);
	const openTime = formatTimeHHmm(data.Spec_OpenTime);
	const closeTime = formatTimeHHmm(data.Spec_CloseTime);
	const holidayName = data.HolidayName
	const isOpenDay = openTime && closeTime
	return (
		<div className="col-xxl-4 col-xl-4 col-lg-5 col-md-12 col-sm-12 col-12 + offset-xxl-1 offset-xl-1 + order-xxl-2 order-xl-2 order-lg-2 order-md-1 order-sm-1  order-1">
			<div className="Opening_hours_DIV">
				<div className="Opening-content">
					<div className="Date_wrapbox">
						<div className="DateTitleBox">
							<div className="date_black">
								<div className="today-date-box">
									<div className="MM">{month}</div>
									<div className="DD">{day}</div>
								</div>
							</div>
							<div className="text_black">
								<div className="text-description-box">
									<div className="date-week">{weekday}{holidayName ? `（${holidayName}）` : ""}</div>
									<div className="date-Ptit">{isOpenDay ? "今日開館時間" : "今日休館"}</div>
									<div className="Input date-time">{isOpenDay ? `${openTime} ~ ${closeTime}` : ""}</div>
								</div>
							</div>
							<div className="open_btn_black mt-xl-3 mt-lg-3 mt-md-3 mt-sm-2 mt-2">
								<Link className="Open_btn" to={"/services/services-loan/services-loan-01"}
									tabIndex={0} target="_self" title="詳細開館時間">
									詳細開館時間
								</Link>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};


const weekdayMap = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
const formatMonth = (dateStr: string) => {
	const d = new Date(dateStr);
	return `${d.getMonth() + 1}月`;
}
const formatDay = (dateStr: string) => {
	const d = new Date(dateStr);
	return d.getDate();
}
const formatWeekday = (dayOfWeek: number) => {
	return weekdayMap[dayOfWeek];
}
const formatTimeHHmm = (timeStr?: string | null) => {
	if (!timeStr) return "";
	// 從 "08:30:00" 變成 "08:30"
	return timeStr.substring(0, 5);
}


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
 * - SSR：用 initialData，完全不依賴 window/document
 * - CSR：如果沒有 initialData，hydration 後會自動打 /Spec_GetCurrentOpenTime
 */
const useCurrentOpenTime = (options: UseCurrentOpenTimeOptions = {},): UseCurrentOpenTimeResult => {
	const { initialData = null, enabled = true } = options;
	// Provider 本身也是純邏輯，可在 SSR 執行
	const provider = useMemo(() => CalendarProvider(), []);
	const [data, setData] = useState<CurrentOpenTime | null>(initialData);
	const [isLoading, setIsLoading] = useState<boolean>(!initialData && enabled);
	const [isError, setIsError] = useState<boolean>(false);
	const [error, setError] = useState<unknown>(null);
	const fetchData = async () => {
		if (!enabled) return;
		try {
			setIsLoading(true);
			setIsError(false);
			setError(null);
			// 這裡用的是你在 Calendar_Api.ts 裡加的 fetchCurrentOpenTime()
			const res = await provider.fetchCurrentOpenTime(); // ApiResponse<CurrentOpenTimeDTO[]>
			if (res.IsSuccess && res.Data && res.Data.length > 0) {
				setData(res.Data[0]); // 目前 API Data 是陣列，就取第一筆
			} else {
				setData(null);
			}
		} catch (e) {
			setIsError(true);
			setError(e);
		} finally {
			setIsLoading(false);
		}
	};
	useEffect(() => {
		// SSR 不會跑這段；CSR hydration 完成後才會跑
		if (!enabled) return;
		if (initialData) return; // SSR 已有資料就不用再抓
		void fetchData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [enabled, initialData]); // provider 由 useMemo 保證穩定，可以不放進 deps
	return { data, isLoading, isError, error, refetch: fetchData, };
};