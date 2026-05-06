import { ApiDataAdapter, type ApiDataHookGroup } from "@/SysCore/Utils/API/APIAdapter";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";
import { useCallback, useMemo, useState } from "react";

type SurveySet = components["schemas"]["SurveySet_DTO"];

export type SurveySubmissionSubmitDto = components["schemas"]["SurveySubmissionSubmit_DTO"];

type ExtraHooks = {
    /** CSR action：前台匿名提交問卷 */
    useSubmitActions: (
        opt?: { apiInstance?: AxiosInstance; },
    ) => { isSubmitting: boolean; publicSubmitAsync: (request: SurveySubmissionSubmitDto) => Promise<ApiResponse<string | null>>; };
};

export class SurveyService extends ApiDataService<SurveySet>
{
    // #region Construct
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.Survey, apiInstance);
    }
    // #endregion

    // #region API Func
    /** 前台匿名提交問卷 */
    async publicSubmit(request: SurveySubmissionSubmitDto): Promise<ApiResponse<string[]>>
    {
        return await this.CallApi<string[]>(() => this.Api.post<ApiResponse<string[]>>(`${this.Module}/Public_Submit`, request));
    }
    // #endregion
}

export class SurveyAdapterImpl extends ApiDataAdapter<SurveySet, SurveyService>
{
    // #region Property
    declare public hooks: ApiDataHookGroup<SurveySet> & ExtraHooks;
    // #endregion

    // #region Protect Virtual Func
    protected override buildExtendedHooks(base: ApiDataHookGroup<SurveySet>): ApiDataHookGroup<SurveySet> & ExtraHooks
    {
        const wrapUseSubmitActions: ExtraHooks["useSubmitActions"] = (opt) =>
        {
            return this.useSubmitActions(opt);
        };

        return { ...base, useSubmitActions: wrapUseSubmitActions };
    }
    // #endregion

    // #region Hook Func
    /** 提供 CSR 使用的問卷提交 actions */
    private useSubmitActions: ExtraHooks["useSubmitActions"] = (opt) =>
    {
        // 宣告變數
        const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
        const svc = useMemo(() => new SurveyService(opt?.apiInstance), [opt?.apiInstance]);

        /** 執行前台問卷提交 */
        const publicSubmitAsync = useCallback(async (request: SurveySubmissionSubmitDto): Promise<ApiResponse<string | null>> =>
        {
            setIsSubmitting(true);

            try
            {
                const apiRes = await svc.publicSubmit(request);
                return this.normalizeSubmitResult(apiRes);
            } finally
            {
                setIsSubmitting(false);
            }
        }, [svc]);

        // return
        return { isSubmitting, publicSubmitAsync };
    };
    // #endregion

    // #region Private Helper
    /** 將後端陣列結果轉成單筆提交代碼 */
    private normalizeSubmitResult(apiRes: ApiResponse<string[]>): ApiResponse<string | null>
    {
        const first = this.getFirstResult(apiRes.Data);
        return { ...apiRes, Data: first };
    }

    /** 取得第一筆 API 結果 */
    private getFirstResult<T>(data: T[] | null | undefined): T | null
    {
        if (!Array.isArray(data) || data.length === 0) return null;
        return data[0] ?? null;
    }
    // #endregion
}

export const SurveyAdapter = (apiInstance?: AxiosInstance) => new SurveyAdapterImpl((api?: AxiosInstance) => new SurveyService(api ?? apiInstance));
