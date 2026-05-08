import { ApiDataAdapter, type ApiDataHookGroup } from "@/SysCore/Utils/API/APIAdapter";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";
import { useCallback, useMemo, useState } from "react";

type SurveySubmissionSet = components["schemas"]["SurveySubmissionsSet_DTO"];
type SurveySubmissionRequest = components["schemas"]["SurveySubmissionRequest_DTO"];
type ExtraHooks = {
    /** CSR action：前台匿名提交問卷 */
    useSubmitActions: (
        opt?: { apiInstance?: AxiosInstance; },
    ) => { isSubmitting: boolean; publicSubmitAsync: (request: SurveySubmissionRequest) => Promise<ApiResponse<string | null>>; };
};

export class SurveySubmissionService extends ApiDataService<SurveySubmissionSet>
{
    // #region Public
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.SurveySubmission, apiInstance);
    }
    /** 前台匿名提交問卷 */
    async publicSubmit(request: SurveySubmissionRequest): Promise<ApiResponse<string[]>>
    {
        return await this.CallApi<string[]>(() => this.Api.post<ApiResponse<string[]>>(`${this.Module}/Public_Submit`, request));
    }
    // #endregion
}

export class SurveySubmissionAdapterImpl extends ApiDataAdapter<SurveySubmissionSet, SurveySubmissionService>
{
    // #region Public
    declare public hooks: ApiDataHookGroup<SurveySubmissionSet> & ExtraHooks;
    // #endregion

    // #region Protected
    protected override buildExtendedHooks(base: ApiDataHookGroup<SurveySubmissionSet>): ApiDataHookGroup<SurveySubmissionSet> & ExtraHooks
    {
        return { ...base, useSubmitActions: (opt) => this.useSubmitActions(opt) };
    }
    // #endregion

    // #region Private
    /** 提供 CSR 使用的問卷提交 actions */
    private useSubmitActions: ExtraHooks["useSubmitActions"] = (opt) =>
    {
        const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
        const svc = useMemo(() => new SurveySubmissionService(opt?.apiInstance), [opt?.apiInstance]);
        const publicSubmitAsync = useCallback(async (request: SurveySubmissionRequest): Promise<ApiResponse<string | null>> =>
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
        return { isSubmitting, publicSubmitAsync };
    };
    /** 將後端陣列結果轉成單筆提交代碼 */
    private normalizeSubmitResult(apiRes: ApiResponse<string[]>): ApiResponse<string | null>
    {
        const first = Array.isArray(apiRes.Data) ? apiRes.Data[0] ?? null : null;
        return { ...apiRes, Data: first };
    }
    // #endregion
}

export const SurveySubmissionAdapter = (apiInstance?: AxiosInstance) =>
    new SurveySubmissionAdapterImpl((api?: AxiosInstance) => new SurveySubmissionService(api ?? apiInstance));
