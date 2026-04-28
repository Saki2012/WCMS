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
import { CalendarFields, PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";
import { useCallback, useMemo, useState } from "react";
import type { LoaderFunctionArgs } from "react-router";
type QueryListParam = components["schemas"]["QueryListParam"];
type CalendarSet = components["schemas"]["CalendarSet_DTO"];
type CalendarDetail = components["schemas"]["CalendarDetail_DTO"];
type CalendarYearArgs = { year: number; };

export class CalendarService extends ApiDataService<CalendarSet>
{
    // #region Construct
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.Calendar, apiInstance);
    }
    // #endregion

    // #region API Func
    async updateDayInfo(dayInfo: CalendarDetail): Promise<ApiResponse<CalendarDetail>>
    {
        return await this.CallApi<CalendarDetail>(() => this.Api.put<ApiResponse<CalendarDetail>>(`${this.Module}/UpdateDayInfo`, dayInfo));
    }
    // #endregion
}

type ExtraLoaders = {
    /** 依年份抓 CalendarDetail（先 QueryList 找 internalId，再 QueryData 拿明細） */
    getCalendarDetailsByYearLoader: (
        opt: { getArgs: (args: LoaderFunctionArgs) => CalendarYearArgs; getApiInstance?: (args: LoaderFunctionArgs) => AxiosInstance | undefined; },
    ) => (args: LoaderFunctionArgs) => Promise<ApiLoaderData<CalendarYearArgs, CalendarDetail[]>>;
};

type ExtraHooks = {
    useFetchCalendarDetailsByYear: (
        opt: {
            year: number;
            initial?: ApiLoaderData<CalendarYearArgs, CalendarDetail[]> | null;
            deps?: EffectDeps;
            onError?: (err: ApiAdapterError) => void;
            apiInstance?: AxiosInstance;
        },
    ) => { data: CalendarDetail[]; apiRes: ApiResponse<CalendarDetail[]> | null; isLoading: boolean; errorText: string | null; refetch: () => Promise<void>; };
    useUpdateDayInfo: (
        opt?: { apiInstance?: AxiosInstance; },
    ) => { isSaving: boolean; updateDayInfoAsync: (dayInfo: CalendarDetail) => Promise<ApiResponse<CalendarDetail>>; };
};

export class CalendarAdapterImpl extends ApiDataAdapter<CalendarSet, CalendarService>
{
    // #region Property
    declare public loader: ApiDataLoaderGroup<CalendarSet> & ExtraLoaders;
    declare public hooks: ApiDataHookGroup<CalendarSet> & ExtraHooks;
    // #endregion

    // #region Protect Virtual Func
    protected override buildExtendedLoader(base: ApiDataLoaderGroup<CalendarSet>): ApiDataLoaderGroup<CalendarSet> & ExtraLoaders
    {
        const wrapGetCalendarDetailsByYearLoader: ExtraLoaders["getCalendarDetailsByYearLoader"] = (opt) =>
        {
            return this.getCalendarDetailsByYearLoader(opt);
        };
        const merged: ApiDataLoaderGroup<CalendarSet> & ExtraLoaders = { ...base, getCalendarDetailsByYearLoader: wrapGetCalendarDetailsByYearLoader };
        return merged;
    }

    protected override buildExtendedHooks(base: ApiDataHookGroup<CalendarSet>): ApiDataHookGroup<CalendarSet> & ExtraHooks
    {
        const wrapUseFetchCalendarDetailsByYear: ExtraHooks["useFetchCalendarDetailsByYear"] = (opt) =>
        {
            return this.useFetchCalendarDetailsByYear(opt);
        };
        const wrapUseUpdateDayInfo: ExtraHooks["useUpdateDayInfo"] = (opt) =>
        {
            return this.useUpdateDayInfo(opt);
        };
        const merged: ApiDataHookGroup<CalendarSet> & ExtraHooks = {
            ...base,
            useFetchCalendarDetailsByYear: wrapUseFetchCalendarDetailsByYear,
            useUpdateDayInfo: wrapUseUpdateDayInfo,
        };
        return merged;
    }
    // #endregion

    // #region Loader Func
    private getCalendarDetailsByYearLoader: ExtraLoaders["getCalendarDetailsByYearLoader"] = (opt) =>
    {
        // return：SSR/loader 用，統一走 queryCalendarDetailsByYearAsync
        return this.createApiLoader<CalendarYearArgs, CalendarDetail[]>({
            action: "Calendar.Query.CalendarDetailsByYear",
            getArgs: opt.getArgs,
            call: (svc, a) => this.queryCalendarDetailsByYearAsync(svc, a),
            getApiInstance: opt.getApiInstance,
        });
    };
    // #endregion

    // #region Hook Func
    private useFetchCalendarDetailsByYear: ExtraHooks["useFetchCalendarDetailsByYear"] = (opt) =>
    {
        const deps = opt.deps ?? [opt.year];
        const args = useMemo<CalendarYearArgs>(() => ({ year: opt.year }), [opt.year]);
        const r = this.useApiQuery<CalendarYearArgs, CalendarDetail[]>({
            action: "Calendar.Query.CalendarDetailsByYear",
            args,
            initial: opt.initial ?? null,
            call: (svc, a) => this.queryCalendarDetailsByYearAsync(svc, a),
            fallbackError: "查詢行事曆明細失敗",
            deps,
            onError: opt.onError,
            apiInstance: opt.apiInstance,
        });
        const data = useMemo(() => r.data ?? [], [r.data]);
        return { ...r, data };
    };
    private useUpdateDayInfo: ExtraHooks["useUpdateDayInfo"] = (opt) =>
    {
        const [isSaving, setIsSaving] = useState<boolean>(false);
        const svc = useMemo(() => new CalendarService(opt?.apiInstance), [opt?.apiInstance]);
        const updateDayInfoAsync = useCallback(async (dayInfo: CalendarDetail) =>
        {
            setIsSaving(true);
            try
            {
                return await svc.updateDayInfo(dayInfo);
            } finally
            {
                setIsSaving(false);
            }
        }, [svc]);
        return { isSaving, updateDayInfoAsync };
    };
    // #endregion

    // #region Private Helper
    private buildCalendarQueryByYearParam(opt: { year: number; }): QueryListParam
    {
        const fields: string[] = [CalendarFields.InternalId];
        return { Fields: fields, Condition: `${CalendarFields.Year} = ${opt.year}`, PageNumber: 0, PageSize: 1 };
    }
    private async queryCalendarDetailsByYearAsync(svc: CalendarService, a: CalendarYearArgs): Promise<ApiResponse<CalendarDetail[]>>
    {
        const listEnv = await svc.queryList(this.buildCalendarQueryByYearParam({ year: a.year }));
        const listOk = Boolean(listEnv.IsSuccess);
        if (!listOk) return { IsSuccess: false, Data: null, SysMessage: listEnv.SysMessage ?? [] };
        const internalId = listEnv.Data?.[0]?.Calendar?.InternalId?.trim() ?? "";
        if (!internalId) return { IsSuccess: true, Data: [], SysMessage: listEnv.SysMessage ?? [] };
        const dataEnv = await svc.queryData(internalId) as ApiResponse<CalendarSet[]>;
        const dataOk = Boolean(dataEnv.IsSuccess);
        if (!dataOk) return { IsSuccess: false, Data: null, SysMessage: dataEnv.SysMessage ?? [] };
        return { IsSuccess: true, Data: dataEnv.Data?.[0]?.CalendarDetail ?? [], SysMessage: dataEnv.SysMessage ?? [] };
    }
}

export const CalendarAdapter = (apiInstance?: AxiosInstance) => new CalendarAdapterImpl((api?: AxiosInstance) => new CalendarService(api ?? apiInstance));
