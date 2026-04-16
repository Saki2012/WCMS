import { CalendarAdapterImpl, CalendarService } from "@/Features/Hooks/BizFunc/COMM/Calendar_Api";
import type {
    ApiAdapterError,
    ApiDataHookGroup,
    ApiDataLoaderGroup,
    ApiLoaderData,
    EffectDeps,
} from "@/SysCore/Utils/API/APIAdapter";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import type { components } from "@/types/api";
import type { AxiosInstance } from "axios";
import { useMemo } from "react";
import type { LoaderFunctionArgs } from "react-router";
type CalendarSet = components["schemas"]["CalendarSet_DTO"];
type CurrentOpenTime = components["schemas"]["SpecCurrentOpenTime_DTO"];

class SpecCalendarService extends CalendarService
{
    // #region API Func
    async fetchCurrentOpenTime(): Promise<ApiResponse<CurrentOpenTime[]>>
    {
        return await this.CallApi<CurrentOpenTime[]>(() =>
            this.Api.get<ApiResponse<CurrentOpenTime[]>>(`${this.Module}/Spec_GetCurrentOpenTime`)
        );
    }
    // #endregion
}

type SpecExtraLoaders = {
    getCurrentOpenTimeLoader: (
        opt?: { getApiInstance?: (args: LoaderFunctionArgs) => AxiosInstance | undefined; },
    ) => (args: LoaderFunctionArgs) => Promise<ApiLoaderData<null, CurrentOpenTime[]>>;
};

type SpecExtraHooks = {
    useFetchCurrentOpenTime: (
        opt?: {
            initial?: ApiLoaderData<null, CurrentOpenTime[]> | null;
            deps?: EffectDeps;
            onError?: (err: ApiAdapterError) => void;
            apiInstance?: AxiosInstance;
        },
    ) => {
        data: CurrentOpenTime[];
        apiRes: ApiResponse<CurrentOpenTime[]> | null;
        isLoading: boolean;
        errorText: string | null;
        refetch: () => Promise<void>;
    };
};

class SpecCalendarAdapterImpl extends CalendarAdapterImpl
{
    // #region Property
    declare public loader: CalendarAdapterImpl["loader"] & SpecExtraLoaders;
    declare public hooks: CalendarAdapterImpl["hooks"] & SpecExtraHooks;
    // #endregion

    // #region Protect Virtual Func
    protected override buildExtendedLoader(base: ApiDataLoaderGroup<CalendarSet>)
    {
        const merged = super.buildExtendedLoader(base);
        const wrapGetCurrentOpenTimeLoader: SpecExtraLoaders["getCurrentOpenTimeLoader"] = (opt) =>
        {
            return this.getCurrentOpenTimeLoader(opt);
        };
        return { ...merged, getCurrentOpenTimeLoader: wrapGetCurrentOpenTimeLoader };
    }
    protected override buildExtendedHooks(base: ApiDataHookGroup<CalendarSet>)
    {
        const merged = super.buildExtendedHooks(base);
        const wrapUseFetchCurrentOpenTime: SpecExtraHooks["useFetchCurrentOpenTime"] = (opt) =>
        {
            return this.useFetchCurrentOpenTime(opt);
        };
        return { ...merged, useFetchCurrentOpenTime: wrapUseFetchCurrentOpenTime };
    }

    // #endregion

    // #region Loader Func
    private getCurrentOpenTimeLoader(
        opt?: { getApiInstance?: (args: LoaderFunctionArgs) => AxiosInstance | undefined; },
    )
    {
        return this.createApiLoader<null, CurrentOpenTime[]>({
            action: "Calendar.Query.CurrentOpenTime",
            getArgs: () => null,
            call: (svc) => (svc as SpecCalendarService).fetchCurrentOpenTime(),
            getApiInstance: opt?.getApiInstance,
        });
    }
    // #endregion

    // #region Hook Func
    private useFetchCurrentOpenTime(
        opt?: {
            initial?: ApiLoaderData<null, CurrentOpenTime[]> | null;
            deps?: EffectDeps;
            onError?: (err: ApiAdapterError) => void;
            apiInstance?: AxiosInstance;
        },
    )
    {
        const deps = opt?.deps ?? [];
        const args = useMemo(() => null, []);
        const r = this.useApiQuery<null, CurrentOpenTime[]>({
            action: "Calendar.Query.CurrentOpenTime",
            args,
            initial: opt?.initial ?? null,
            call: (svc) => (svc as SpecCalendarService).fetchCurrentOpenTime(),
            fallbackError: "查詢開放時間失敗",
            deps,
            onError: opt?.onError,
            apiInstance: opt?.apiInstance,
        });
        const data = useMemo(() => r.data ?? [], [r.data]);
        return { ...r, data };
    }
    // #endregion
}

export const SpecCalendarAdapter = (apiInstance?: AxiosInstance) =>
    new SpecCalendarAdapterImpl((api?: AxiosInstance) => new SpecCalendarService(api ?? apiInstance));
