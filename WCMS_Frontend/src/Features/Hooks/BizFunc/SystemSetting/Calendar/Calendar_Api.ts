import { ApiDataAdapter, type EffectDeps } from "@/SysCore/Utils/API/APIAdapter";
import { type ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import * as SchemaFields from "@/types/SchemaFields";
import { PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";

type QueryListParam = components["schemas"]["QueryListParam"];
type CalendarSet = components["schemas"]["CalendarSet_DTO"];
type CalendarDetail = components["schemas"]["CalendarDetail_DTO"];
type CurrentOpenTime = components["schemas"]["SpecCurrentOpenTime_DTO"];

class CalendarService extends ApiDataService<CalendarSet>
{
    constructor(apiInstance?: AxiosInstance)
    {
        // 宣告變數 + 執行 super
        super(PGID.Calendar, apiInstance);
    }

    async fetchCurrentOpenTime(): Promise<ApiResponse<CurrentOpenTime[]>>
    {
        // return：呼叫 Spec API
        return await this.CallApi<CurrentOpenTime[]>(() =>
            this.Api.get<ApiResponse<CurrentOpenTime[]>>(`${this.Module}/Spec_GetCurrentOpenTime`)
        );
    }

    async updateDayInfo(dayInfo: CalendarDetail): Promise<ApiResponse<CalendarDetail>>
    {
        // return：更新單日資訊
        return await this.CallApi<CalendarDetail>(() =>
            this.Api.put<ApiResponse<CalendarDetail>>(`${this.Module}/UpdateDayInfo`, dayInfo)
        );
    }
}

// #region private Func

const buildCalendarQueryByYearParam = (opt: { year: number; }): QueryListParam =>
{
    // 宣告變數：只需要拿 internalId（後續再 QueryData）
    const fields: string[] = [
        SchemaFields.CalendarFields.InternalId,
    ];

    // return
    return {
        Fields: fields,
        Condition: `${SchemaFields.CalendarFields.Year} = ${opt.year}`,
        PageNumber: 0,
        PageSize: 1,
    };
};

// #endregion

/**
 * ✅ 做法完全照 Category_Api.ts：
 * - 在 CalendarAdapter() 內定義 hooks
 * - cast + merge 回 adapter.hooks
 */
export const CalendarAdapter = (apiInstance?: AxiosInstance) =>
{
    // 宣告變數
    const adapter = new ApiDataAdapter<CalendarSet, CalendarService>(
        (api?: AxiosInstance) => new CalendarService(api ?? apiInstance),
    );

    const useFetchCalendarDetailsByYear = (opt: {
        year: number;
        apiInstance?: AxiosInstance;
        deps?: EffectDeps;
    }) =>
    {
        // 宣告變數
        const deps = opt.deps ?? [opt.year];

        const [data, setData] = useState<CalendarDetail[] | null>(null);
        const [isLoading, setIsLoading] = useState<boolean>(false);

        const svc = useMemo(
            () => new CalendarService(opt.apiInstance ?? apiInstance),
            [opt.apiInstance],
        );

        useEffect(() =>
        {
            let isActive = true;

            const run = async () =>
            {
                // 宣告變數
                setIsLoading(true);

                try
                {
                    // 1) 先 QueryList 找 internalId
                    const listEnv = await svc.queryList(
                        buildCalendarQueryByYearParam({ year: opt.year }),
                    );

                    if (!isActive) return;

                    if (!listEnv.IsSuccess)
                    {
                        setData([]);
                        return;
                    }

                    const internalId = listEnv.Data?.[0]?.Calendar?.InternalId ?? "";
                    if (!internalId.trim())
                    {
                        // 該年度沒資料 → 交給 component 自己補齊缺日
                        setData([]);
                        return;
                    }

                    // 2) 再 QueryData 拿明細
                    const dataEnv = await svc.queryData(internalId.trim());

                    if (!isActive) return;

                    if (!dataEnv.IsSuccess)
                    {
                        setData([]);
                        return;
                    }

                    setData((dataEnv.Data?.CalendarDetail ?? []) as CalendarDetail[]);
                } finally
                {
                    if (isActive) setIsLoading(false);
                }
            };

            run();

            return () =>
            {
                isActive = false;
            };
        }, deps);

        // return
        return { data, isLoading };
    };

    const useUpdateDayInfo = (opt?: {
        apiInstance?: AxiosInstance;
    }) =>
    {
        // 宣告變數
        const [isSaving, setIsSaving] = useState<boolean>(false);

        const svc = useMemo(
            () => new CalendarService(opt?.apiInstance ?? apiInstance),
            [opt?.apiInstance],
        );

        const updateDayInfoAsync = useCallback(async (dayInfo: CalendarDetail) =>
        {
            // 宣告變數
            setIsSaving(true);

            try
            {
                // return：呼叫更新
                return await svc.updateDayInfo(dayInfo);
            } finally
            {
                setIsSaving(false);
            }
        }, [svc]);

        // return
        return { isSaving, updateDayInfoAsync };
    };

    // ✅ 關鍵：照 Category 做法擴充 hooks（避免破壞 prototype methods）
    const extAdapter = adapter as ApiDataAdapter<CalendarSet, CalendarService> & {
        hooks: typeof adapter.hooks & {
            useFetchCalendarDetailsByYear: typeof useFetchCalendarDetailsByYear;
            useUpdateDayInfo: typeof useUpdateDayInfo;
        };
    };

    extAdapter.hooks = {
        ...adapter.hooks,
        useFetchCalendarDetailsByYear,
        useUpdateDayInfo,
    };

    // return
    return extAdapter;
};
