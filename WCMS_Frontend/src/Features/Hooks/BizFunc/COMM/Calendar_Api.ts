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
import { LibCondition } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import { CalendarFields, PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";
import { useMemo } from "react";
import type { LoaderFunctionArgs } from "react-router";

// #region Property
type QueryListParam = components["schemas"]["QueryListParam"];
type CalendarFormModel = components["schemas"]["Calendar"];
type CalendarDetail = components["schemas"]["CalendarDetail"];
type CalendarYearArgs = { year: number; };
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
// #endregion

// #region Public
export class CalendarService extends ApiDataService<CalendarFormModel>
{
    // #region Public
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.Calendar, apiInstance);
    }
    /** 更新單日行事曆明細資料。 */
    public async updateDayInfo(dayInfo: CalendarDetail): Promise<ApiResponse<CalendarDetail>>
    {
        return await this.CallApi<CalendarDetail>(() => this.Api.put<ApiResponse<CalendarDetail>>(`${this.Module}/UpdateDayInfo`, dayInfo));
    }
    // #endregion
}
export class CalendarAdapterImpl extends ApiDataAdapter<CalendarFormModel, CalendarService>
{
    // #region Property
    declare public loader: ApiDataLoaderGroup<CalendarFormModel> & ExtraLoaders;
    declare public hooks: ApiDataHookGroup<CalendarFormModel> & ExtraHooks;
    // #endregion

    // #region Protected Virtual
    protected override buildExtendedLoader(base: ApiDataLoaderGroup<CalendarFormModel>): ApiDataLoaderGroup<CalendarFormModel> & ExtraLoaders
    {
        const wrapGetCalendarDetailsByYearLoader: ExtraLoaders["getCalendarDetailsByYearLoader"] = (opt) => this.getCalendarDetailsByYearLoader(opt);
        const merged: ApiDataLoaderGroup<CalendarFormModel> & ExtraLoaders = { ...base, getCalendarDetailsByYearLoader: wrapGetCalendarDetailsByYearLoader };
        return merged;
    }
    protected override buildExtendedHooks(base: ApiDataHookGroup<CalendarFormModel>): ApiDataHookGroup<CalendarFormModel> & ExtraHooks
    {
        const wrapUseFetchCalendarDetailsByYear: ExtraHooks["useFetchCalendarDetailsByYear"] = (opt) => this.useFetchCalendarDetailsByYear(opt);
        const wrapUseUpdateDayInfo: ExtraHooks["useUpdateDayInfo"] = (opt) => this.useUpdateDayInfo(opt);
        const merged: ApiDataHookGroup<CalendarFormModel> & ExtraHooks = {
            ...base,
            useFetchCalendarDetailsByYear: wrapUseFetchCalendarDetailsByYear,
            useUpdateDayInfo: wrapUseUpdateDayInfo,
        };
        return merged;
    }
    // #endregion

    // #region Protected
    protected getCalendarDetailsByYearLoader: ExtraLoaders["getCalendarDetailsByYearLoader"] = (opt) =>
    {
        return this.createApiLoader<CalendarYearArgs, CalendarDetail[]>({
            action: "Calendar.Query.CalendarDetailsByYear",
            getArgs: opt.getArgs,
            call: (svc, a) => this.queryCalendarDetailsByYearAsync(svc, a),
            getApiInstance: opt.getApiInstance,
        });
    };
    protected useFetchCalendarDetailsByYear: ExtraHooks["useFetchCalendarDetailsByYear"] = (opt) =>
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
    /** 提供更新單日行事曆明細的 action hook。 */
    protected useUpdateDayInfo: ExtraHooks["useUpdateDayInfo"] = (opt) =>
    {
        const action = this.useApiAction<CalendarDetail, CalendarDetail>({
            action: "Calendar.Action.UpdateDayInfo",
            fallbackError: "更新行事曆日期資訊失敗",
            apiInstance: opt?.apiInstance,
            call: (svc, dayInfo) => svc.updateDayInfo(dayInfo),
        });
        return { isSaving: action.isLoading, updateDayInfoAsync: action.execute };
    };
    // #endregion

    // #region Private
    private buildCalendarQueryByYearParam(opt: { year: number; }): QueryListParam
    {
        return {
            Fields: [CalendarFields.InternalId],
            Condition: LibCondition.joinConditions([LibCondition.createCondition(CalendarFields.Year, LibCondition.Operator.Equal, opt.year)]),
            PageNumber: 0,
            PageSize: 1,
        };
    }
    private async queryCalendarDetailsByYearAsync(svc: CalendarService, a: CalendarYearArgs): Promise<ApiResponse<CalendarDetail[]>>
    {
        const listEnv = await svc.queryList(this.buildCalendarQueryByYearParam({ year: a.year }));
        const listOk = Boolean(listEnv.IsSuccess);
        if (!listOk) return { IsSuccess: false, Data: null, SysMessage: listEnv.SysMessage ?? [] };
        const internalId = listEnv.Data?.[0]?.InternalId?.trim() ?? "";
        if (!internalId) return { IsSuccess: true, Data: [], SysMessage: listEnv.SysMessage ?? [] };
        const dataEnv = await svc.queryData(internalId) as ApiResponse<CalendarFormModel[]>;
        const dataOk = Boolean(dataEnv.IsSuccess);
        if (!dataOk) return { IsSuccess: false, Data: null, SysMessage: dataEnv.SysMessage ?? [] };
        return { IsSuccess: true, Data: dataEnv.Data?.[0]?._CalendarDetail ?? [], SysMessage: dataEnv.SysMessage ?? [] };
    }
    // #endregion
}
export const CalendarAdapter = (apiInstance?: AxiosInstance) => new CalendarAdapterImpl((api?: AxiosInstance) => new CalendarService(api ?? apiInstance));
// #endregion
