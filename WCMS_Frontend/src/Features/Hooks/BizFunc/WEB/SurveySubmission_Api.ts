import { ApiDataAdapter, type ApiDataHookGroup } from "@/SysCore/Utils/API/APIAdapter";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";

// #region Property
type SurveySubmissionModel = components["schemas"]["SurveySubmissions"];
type SurveySubmissionRequest = components["schemas"]["SurveySubmissionRequest_DTO"];
type ExtraHooks = {
    /** CSR action：前台匿名提交問卷 */
    useSubmitActions: (
        opt?: { apiInstance?: AxiosInstance; },
    ) => { isSubmitting: boolean; publicSubmitAsync: (request: SurveySubmissionRequest) => Promise<ApiResponse<string | null>>; };
};
// #endregion

// #region Public
export class SurveySubmissionService extends ApiDataService<SurveySubmissionModel>
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

export class SurveySubmissionAdapterImpl extends ApiDataAdapter<SurveySubmissionModel, SurveySubmissionService>
{
    // #region Property
    declare public hooks: ApiDataHookGroup<SurveySubmissionModel> & ExtraHooks;
    // #endregion

    // #region Public
    protected override buildExtendedHooks(base: ApiDataHookGroup<SurveySubmissionModel>): ApiDataHookGroup<SurveySubmissionModel> & ExtraHooks
    {
        return { ...base, useSubmitActions: (opt) => this.useSubmitActions(opt) };
    }
    // #endregion

    // #region Protected
    /** 提供 CSR 使用的問卷提交 actions */
    protected useSubmitActions: ExtraHooks["useSubmitActions"] = (opt) =>
    {
        const submitAction = this.useApiAction<SurveySubmissionRequest, string | null>({
            action: "SurveySubmission.PublicSubmit",
            fallbackError: "問卷提交失敗",
            apiInstance: opt?.apiInstance,
            call: async (svc, request) =>
            {
                const apiRes = await svc.publicSubmit(request);
                return this.normalizeSubmitResult(apiRes);
            },
        });
        return { isSubmitting: submitAction.isLoading, publicSubmitAsync: submitAction.execute };
    };
    // #endregion

    // #region Private
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
// #endregion
