import { type ApiAdapterError, ApiDataAdapter, type ApiDataHookGroup, type ApiDataLoaderGroup } from "@/SysCore/Utils/API/APIAdapter";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";

// #region Property
type AccountSet = components["schemas"]["AccountSet_DTO"];
type ChangePassword = components["schemas"]["ChangePassword"];
type ResetPassword = components["schemas"]["ResetPassword"];
type ExtraLoaders = {};
type ChangePasswordHookResult = { execute: (dto: ChangePassword) => Promise<ApiResponse<object>>; isLoading: boolean; apiRes: ApiResponse<object> | null; };
type ResetPasswordHookResult = { execute: (dto: ResetPassword) => Promise<ApiResponse<object>>; isLoading: boolean; apiRes: ApiResponse<object> | null; };
type ExtraHooks = {
    /** 修改密碼 hook */
    useChangePassword: (opt?: { apiInstance?: AxiosInstance; onSuccess?: () => void; onError?: (err: ApiAdapterError) => void; }) => ChangePasswordHookResult;
    /** 重置密碼 hook */
    useResetPassword: (opt?: { apiInstance?: AxiosInstance; onSuccess?: () => void; onError?: (err: ApiAdapterError) => void; }) => ResetPasswordHookResult;
};
// #endregion

// #region Public
export class AccountService extends ApiDataService<AccountSet>
{
    // #region Public
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.Account, apiInstance);
    }
    /** 呼叫後端修改密碼 */
    public async changePassword(param: ChangePassword): Promise<ApiResponse<object>>
    {
        return await this.CallApi<object>(() => this.Api.put<ApiResponse<object>>(`${this.Module}/ChangePassword`, param));
    }
    /** 呼叫後端重置密碼 */
    public async resetPassword(param: ResetPassword): Promise<ApiResponse<object>>
    {
        return await this.CallApi<object>(() => this.Api.put<ApiResponse<object>>(`${this.Module}/ResetPassword`, param));
    }
    // #endregion
}
export class AccountAdapterImpl extends ApiDataAdapter<AccountSet, AccountService>
{
    // #region Property
    declare public loader: ApiDataLoaderGroup<AccountSet> & ExtraLoaders;
    declare public hooks: ApiDataHookGroup<AccountSet> & ExtraHooks;
    // #endregion

    // #region Protected Virtual
    /** 擴充 loader 入口，目前 Account 暫無額外 loader */
    protected override buildExtendedLoader(base: ApiDataLoaderGroup<AccountSet>): ApiDataLoaderGroup<AccountSet> & ExtraLoaders
    {
        const merged: ApiDataLoaderGroup<AccountSet> & ExtraLoaders = { ...base };
        return merged;
    }
    /** 擴充 hooks 入口，掛入修改密碼與重置密碼 */
    protected override buildExtendedHooks(base: ApiDataHookGroup<AccountSet>): ApiDataHookGroup<AccountSet> & ExtraHooks
    {
        const wrapUseChangePassword: ExtraHooks["useChangePassword"] = (opt) => this.useChangePassword(opt);
        const wrapUseResetPassword: ExtraHooks["useResetPassword"] = (opt) => this.useResetPassword(opt);
        const merged: ApiDataHookGroup<AccountSet> & ExtraHooks = { ...base, useChangePassword: wrapUseChangePassword, useResetPassword: wrapUseResetPassword };
        return merged;
    }
    // #endregion

    // #region Protected
    /** 修改密碼 hook */
    private useChangePassword: ExtraHooks["useChangePassword"] = (opt) =>
    {
        // return
        return this.useApiAction<ChangePassword, object>({
            action: "Account.ChangePassword",
            fallbackError: "修改密碼失敗",
            call: (svc, dto) => svc.changePassword(dto),
            apiInstance: opt?.apiInstance,
            onSuccess: opt?.onSuccess,
            onError: opt?.onError,
        });
    };
    /** 重置密碼 hook */
    private useResetPassword: ExtraHooks["useResetPassword"] = (opt) =>
    {
        // return
        return this.useApiAction<ResetPassword, object>({
            action: "Account.ResetPassword",
            fallbackError: "重置密碼失敗",
            call: (svc, dto) => svc.resetPassword(dto),
            apiInstance: opt?.apiInstance,
            onSuccess: opt?.onSuccess,
            onError: opt?.onError,
        });
    };
    // #endregion
}
export const AccountAdapter = (apiInstance?: AxiosInstance) => new AccountAdapterImpl((api?: AxiosInstance) => new AccountService(api ?? apiInstance));
// #endregion
