import { useCallback, useEffect, useMemo, useState } from "react";

const CWA_BASE_URL = "https://opendata.cwa.gov.tw/api/v1/rest/datastore";
const CWA_DEFAULT_DATASET = "F-D0047-077";
const CWA_DEFAULT_ELEMENTS = "溫度,相對濕度,體感溫度,3小時降雨機率,天氣現象";
const CWA_DEFAULT_REFRESH_MS = 30 * 60 * 1000;

interface CwaElementValue
{
    Weather?: string;
    Temperature?: string;
    ApparentTemperature?: string;
    RelativeHumidity?: string;
    ProbabilityOfPrecipitation?: string;
}
interface CwaTime
{
    ElementValue?: CwaElementValue[];
}
interface CwaWeatherElement
{
    ElementName?: string;
    Time?: CwaTime[];
}
interface CwaLocation
{
    WeatherElement?: CwaWeatherElement[];
}
interface CwaLocations
{
    Location?: CwaLocation[];
}
interface CwaWeatherResponse
{
    records?: { Locations?: CwaLocations[]; };
}

export interface CwaTownWeatherData
{
    temperature: string;
    weather: string;
    apparentTemperature: string;
    relativeHumidity: string;
    probabilityOfPrecipitation: string;
}
export interface FetchCwaTownWeatherArgs
{
    locationName: string;
    apiKey?: string;
    datasetId?: string;
    signal?: AbortSignal;
}
export interface UseCwaTownWeatherArgs
{
    locationName: string;
    apiKey?: string;
    datasetId?: string;
    enabled?: boolean;
    refreshMs?: number;
}
export interface UseCwaTownWeatherResult
{
    data: CwaTownWeatherData | null;
    isLoading: boolean;
    errorText: string | null;
    refetch: () => Promise<void>;
}

/** 取得 CWA API Key */
const getCwaApiKey = (apiKey?: string): string =>
{
    const envKey = import.meta.env.VITE_CWA_API_KEY?.trim() ?? "";
    return apiKey?.trim() || envKey;
};

/** 建立 CWA 查詢網址 */
const buildCwaWeatherUrl = (opt: FetchCwaTownWeatherArgs): string =>
{
    const apiKey = getCwaApiKey(opt.apiKey);
    if (!apiKey) throw new Error("缺少 CWA API Key");

    const datasetId = opt.datasetId?.trim() || CWA_DEFAULT_DATASET;
    const params = new URLSearchParams({
        Authorization: apiKey,
        locationName: opt.locationName,
        elementName: CWA_DEFAULT_ELEMENTS,
    });

    return `${CWA_BASE_URL}/${datasetId}?${params.toString()}`;
};

/** 取得第一筆氣象元素清單 */
const getWeatherElements = (data: CwaWeatherResponse): CwaWeatherElement[] =>
{
    return data.records?.Locations?.[0]?.Location?.[0]?.WeatherElement ?? [];
};

/** 依名稱取得第一筆 ElementValue */
const getElementValue = (elements: CwaWeatherElement[], elementName: string): CwaElementValue | null =>
{
    const target = elements.find(a => a.ElementName === elementName);
    return target?.Time?.[0]?.ElementValue?.[0] ?? null;
};

/** 安全轉成顯示文字 */
const getText = (value?: string): string =>
{
    return value?.trim() || "--";
};

/** 將 CWA 回傳資料轉成前端可用格式 */
const mapCwaWeatherData = (data: CwaWeatherResponse): CwaTownWeatherData =>
{
    const elements = getWeatherElements(data);
    if (elements.length === 0) throw new Error("查無氣象資料");

    const wx = getElementValue(elements, "天氣現象");
    const temp = getElementValue(elements, "溫度");
    const apparentTemp = getElementValue(elements, "體感溫度");
    const hum = getElementValue(elements, "相對濕度");
    const pop = getElementValue(elements, "3小時降雨機率");

    return {
        temperature: getText(temp?.Temperature),
        weather: getText(wx?.Weather),
        apparentTemperature: getText(apparentTemp?.ApparentTemperature),
        relativeHumidity: getText(hum?.RelativeHumidity),
        probabilityOfPrecipitation: getText(pop?.ProbabilityOfPrecipitation),
    };
};

/** 呼叫 CWA API 並回傳整理後資料 */
export const fetchCwaTownWeather = async (opt: FetchCwaTownWeatherArgs): Promise<CwaTownWeatherData> =>
{
    const url = buildCwaWeatherUrl(opt);
    const response = await fetch(url, { method: "GET", signal: opt.signal });

    if (!response.ok) throw new Error(`氣象 API 呼叫失敗：${response.status}`);

    const data = await response.json() as CwaWeatherResponse;
    return mapCwaWeatherData(data);
};

/** React Hook：讀取鄉鎮天氣資料 */
export const useCwaTownWeather = (opt: UseCwaTownWeatherArgs): UseCwaTownWeatherResult =>
{
    const enabled = opt.enabled ?? true;
    const refreshMs = opt.refreshMs ?? CWA_DEFAULT_REFRESH_MS;
    const [data, setData] = useState<CwaTownWeatherData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(enabled);
    const [errorText, setErrorText] = useState<string | null>(null);

    const args = useMemo<FetchCwaTownWeatherArgs>(() =>
    {
        return { locationName: opt.locationName, apiKey: opt.apiKey, datasetId: opt.datasetId };
    }, [opt.locationName, opt.apiKey, opt.datasetId]);

    /** 重新抓取天氣資料 */
    const refetch = useCallback(async () =>
    {
        if (!enabled) return;

        setIsLoading(true);
        setErrorText(null);

        try
        {
            const nextData = await fetchCwaTownWeather(args);
            setData(nextData);
        } catch (error)
        {
            const message = error instanceof Error ? error.message : "取得氣象資料失敗";
            setErrorText(message);
        } finally
        {
            setIsLoading(false);
        }
    }, [args, enabled]);

    useEffect(() =>
    {
        void refetch();
    }, [refetch]);

    useEffect(() =>
    {
        if (!enabled || refreshMs <= 0) return;

        const timer = window.setInterval(() =>
        {
            void refetch();
        }, refreshMs);

        return () => window.clearInterval(timer);
    }, [enabled, refreshMs, refetch]);

    return { data, isLoading, errorText, refetch };
};
