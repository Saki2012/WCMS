import {
    type ApiAdapterError,
    ApiDataAdapter,
    type ApiDataHookGroup,
    type ApiDataLoaderGroup,
    type ApiLoaderData,
    type EffectDeps,
} from "@/SysCore/Utils/API/APIAdapter";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";
import { useMemo } from "react";
import type { LoaderFunctionArgs } from "react-router-dom";
type SpecHomePage1820Set = components["schemas"]["SpecHomePage1820Set_DTO"];
type SpecHomePageWeather = components["schemas"]["SpecHomePageWeather_DTO"];
export type WeatherArgs = Record<string, never>;
export type WeatherLoaderData = ApiLoaderData<WeatherArgs, SpecHomePageWeather[]>;
interface IUseWeatherData
{
    apiInstance?: AxiosInstance;
    deps?: EffectDeps;
    onError?: (err: ApiAdapterError) => void;
    initial?: WeatherLoaderData | null;
}

interface ICreateWeatherLoader
{
    getApiInstance?: (args: LoaderFunctionArgs) => AxiosInstance | undefined;
}

type WeatherHookResult = {
    data: SpecHomePageWeather | null;
    weather: SpecHomePageWeather | null;
    list: SpecHomePageWeather[];
    apiRes: ApiResponse<SpecHomePageWeather[]> | null;
    isLoading: boolean;
    errorText: string | null;
    refetch: () => Promise<void>;
};

type ExtraLoaders = {
    /** SSR loader：取得首頁天氣資料 */
    createWeatherLoader: (opt?: ICreateWeatherLoader) => (args: LoaderFunctionArgs) => Promise<WeatherLoaderData>;
};

type ExtraHooks = {
    /** CSR / Hydration hook：取得首頁天氣資料 */
    useWeatherData: (opt?: IUseWeatherData) => WeatherHookResult;
};

/** 取第一筆 weather 資料 */
const pickWeather = (data?: SpecHomePageWeather[] | null): SpecHomePageWeather | null =>
{
    // return
    return data?.[0] ?? null;
};

export class SpecHomePage1820Service extends ApiDataService<SpecHomePage1820Set>
{
    // #region Construct
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.SpecHomePageApi, apiInstance);
    }
    // #endregion

    // #region Public
    /** 呼叫首頁天氣 API */
    public async getWeatherDataAsync(): Promise<ApiResponse<SpecHomePageWeather[]>>
    {
        // return
        return await this.CallApi<SpecHomePageWeather[]>(() => this.Api.get<ApiResponse<SpecHomePageWeather[]>>(`${this.Module}/GetWeatherData`));
    }
    // #endregion
}

export class SpecHomePage1820AdapterImpl extends ApiDataAdapter<SpecHomePage1820Set, SpecHomePage1820Service>
{
    // #region Property
    declare public loader: ApiDataLoaderGroup<SpecHomePage1820Set> & ExtraLoaders;
    declare public hooks: ApiDataHookGroup<SpecHomePage1820Set> & ExtraHooks;
    // #endregion

    // #region Protect Virtual Func
    protected override buildExtendedLoader(base: ApiDataLoaderGroup<SpecHomePage1820Set>): ApiDataLoaderGroup<SpecHomePage1820Set> & ExtraLoaders
    {
        const wrapCreateWeatherLoader: ExtraLoaders["createWeatherLoader"] = (opt) =>
        {
            return this.createWeatherLoader(opt);
        };
        return { ...base, createWeatherLoader: wrapCreateWeatherLoader };
    }

    protected override buildExtendedHooks(base: ApiDataHookGroup<SpecHomePage1820Set>): ApiDataHookGroup<SpecHomePage1820Set> & ExtraHooks
    {
        const wrapUseWeatherData: ExtraHooks["useWeatherData"] = (opt) =>
        {
            return this.useWeatherData(opt);
        };
        return { ...base, useWeatherData: wrapUseWeatherData };
    }
    // #endregion

    // #region Loader Func
    /** loader：建立首頁 weather loader */
    private createWeatherLoader: ExtraLoaders["createWeatherLoader"] = (opt) =>
    {
        return this.createApiLoader<WeatherArgs, SpecHomePageWeather[]>({
            action: "SpecHomePage.GetWeatherData",
            getArgs: () => this.buildWeatherArgs(),
            call: (svc, _args) => svc.getWeatherDataAsync(),
            getApiInstance: opt?.getApiInstance,
        });
    };
    // #endregion

    // #region Hook Func
    /** hook：取得首頁 weather */
    private useWeatherData: ExtraHooks["useWeatherData"] = (opt) =>
    {
        // 宣告變數
        const deps = opt?.deps ?? [];
        const args = useMemo<WeatherArgs>(() =>
        {
            return this.buildWeatherArgs();
        }, []);

        // 執行 function：CSR / Hydration 共用查詢
        const query = this.useApiQuery<WeatherArgs, SpecHomePageWeather[]>({
            action: "SpecHomePage.GetWeatherData",
            args,
            initial: opt?.initial ?? null,
            call: (svc, _args) => svc.getWeatherDataAsync(),
            fallbackError: "查詢首頁天氣失敗",
            deps,
            onError: opt?.onError,
            apiInstance: opt?.apiInstance,
        });
        const list = useMemo<SpecHomePageWeather[]>(() =>
        {
            return query.data ?? [];
        }, [query.data]);
        const weather = useMemo<SpecHomePageWeather | null>(() =>
        {
            return pickWeather(list);
        }, [list]);

        return { ...query, data: weather, weather, list };
    };
    // #endregion

    // #region Private Helper
    /** 建立共用 weather 查詢參數 */
    private buildWeatherArgs(): WeatherArgs
    {
        // return
        return {};
    }
    // #endregion
}

export const SpecHomePage1820Adapter = (apiInstance?: AxiosInstance) =>
{
    return new SpecHomePage1820AdapterImpl((api?: AxiosInstance) => new SpecHomePage1820Service(api ?? apiInstance));
};
