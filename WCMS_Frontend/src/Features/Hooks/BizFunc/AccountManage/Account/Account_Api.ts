import {
    ApiDataAdapter,
    type ApiAdapterError,
    type ApiDataHookGroup,
    type ApiDataLoaderGroup,
} from "@/SysCore/Utils/API/APIAdapter";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";
import { useCallback, useMemo, useState } from "react";

type AccountSet = components["schemas"]["AccountSet_DTO"];
type ChangePassword = components["schemas"]["ChangePassword"];
type ResetPassword = components["schemas"]["ResetPassword"];

type ExtraLoaders = {};

type ChangePasswordHookResult = {
    execute: (dto: ChangePassword) => Promise<ApiResponse<object>>;
    isLoading: boolean;
    apiRes: ApiResponse<object> | null;
};

type ResetPasswordHookResult = {
    execute: (dto: ResetPassword) => Promise<ApiResponse<object>>;
    isLoading: boolean;
    apiRes: ApiResponse<object> | null;
};

type ExtraHooks = {
    /** 修改密碼 hook */
    useChangePassword: (opt?: {
        apiInstance?: AxiosInstance;
        onSuccess?: () => void;
        onError?: (err: ApiAdapterError) => void;
    }) => ChangePasswordHookResult;

    /** 重置密碼 hook */
    useResetPassword: (opt?: {
        apiInstance?: AxiosInstance;
        onSuccess?: () => void;
        onError?: (err: ApiAdapterError) => void;
    }) => ResetPasswordHookResult;
};

/** 將 ApiResponse 轉成 adapter 錯誤格式 */
const toAdapterError = (
    apiRes: ApiResponse<object>,
    fallback: string,
    action: string,
): ApiAdapterError =>
{
    // 宣告變數
    const sysMessages = apiRes?.SysMessage ?? [];
    const messageText = sysMessages
        .map((m) => `${m?.MessageCode ?? ""}:${m?.Message ?? ""}`.trim())
        .filter((s) => s.length > 0)
        .join("；");

    // return
    return {
        messageText: messageText || fallback,
        sysMessages,
        httpStatus: undefined,
        action,
    };
};

export class AccountService extends ApiDataService<AccountSet>
{
    //#region Construct
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.Account, apiInstance);
    }
    //#endregion

    //#region API Func
    /** 呼叫後端修改密碼 */
    async changePassword(param: ChangePassword): Promise<ApiResponse<object>>
    {
        // return
        return await this.CallApi<object>(() =>
            this.Api.put<ApiResponse<object>>(`${this.Module}/ChangePassword`, param)
        );
    }

    /** 呼叫後端重置密碼 */
    async resetPassword(param: ResetPassword): Promise<ApiResponse<object>>
    {
        // return
        return await this.CallApi<object>(() =>
            this.Api.put<ApiResponse<object>>(`${this.Module}/ResetPassword`, param)
        );
    }
    //#endregion
}

export class AccountAdapterImpl extends ApiDataAdapter<AccountSet, AccountService>
{
    // #region Property
    public declare loader: ApiDataLoaderGroup<AccountSet> & ExtraLoaders;
    public declare hooks: ApiDataHookGroup<AccountSet> & ExtraHooks;
    // #endregion

    // #region Protect Virtual Func
    /** 擴充 loader 入口，目前 Account 暫無額外 loader */
    protected override buildExtendedLoader(
        base: ApiDataLoaderGroup<AccountSet>,
    ): ApiDataLoaderGroup<AccountSet> & ExtraLoaders
    {
        // 宣告變數
        const merged: ApiDataLoaderGroup<AccountSet> & ExtraLoaders = {
            ...base,
        };

        // return
        return merged;
    }

    /** 擴充 hooks 入口，掛入修改密碼與重置密碼 */
    protected override buildExtendedHooks(
        base: ApiDataHookGroup<AccountSet>,
    ): ApiDataHookGroup<AccountSet> & ExtraHooks
    {
        // 宣告變數
        const wrapUseChangePassword: ExtraHooks["useChangePassword"] = (opt) =>
        {
            return this.useChangePassword(opt);
        };
        const wrapUseResetPassword: ExtraHooks["useResetPassword"] = (opt) =>
        {
            return this.useResetPassword(opt);
        };
        const merged: ApiDataHookGroup<AccountSet> & ExtraHooks = {
            ...base,
            useChangePassword: wrapUseChangePassword,
            useResetPassword: wrapUseResetPassword,
        };

        // return
        return merged;
    }
    // #endregion

    // #region Hook Func
    /** 修改密碼 hook */
    private useChangePassword: ExtraHooks["useChangePassword"] = (opt) =>
    {
        // 宣告變數
        const [isLoading, setIsLoading] = useState<boolean>(false);
        const [apiRes, setApiRes] = useState<ApiResponse<object> | null>(null);

        const apiInstance = opt?.apiInstance;
        const onSuccess = opt?.onSuccess;
        const onError = opt?.onError;

        const svc = useMemo(() =>
        {
            return new AccountService(apiInstance);
        }, [apiInstance]);

        const execute = useCallback(async (dto: ChangePassword) =>
        {
            // 執行 function：呼叫修改密碼 API
            setIsLoading(true);
            try
            {
                const res = await svc.changePassword(dto);
                setApiRes(res);

                if (!res.IsSuccess)
                {
                    onError?.(toAdapterError(res, "修改密碼失敗", "Account.ChangePassword"));
                }
                else
                {
                    onSuccess?.();
                }

                return res;
            }
            finally
            {
                setIsLoading(false);
            }
        }, [svc, onSuccess, onError]);

        // return
        return {
            execute,
            isLoading,
            apiRes,
        };
    };

    /** 重置密碼 hook */
    private useResetPassword: ExtraHooks["useResetPassword"] = (opt) =>
    {
        // 宣告變數
        const [isLoading, setIsLoading] = useState<boolean>(false);
        const [apiRes, setApiRes] = useState<ApiResponse<object> | null>(null);

        const apiInstance = opt?.apiInstance;
        const onSuccess = opt?.onSuccess;
        const onError = opt?.onError;

        const svc = useMemo(() =>
        {
            return new AccountService(apiInstance);
        }, [apiInstance]);

        const execute = useCallback(async (dto: ResetPassword) =>
        {
            // 執行 function：呼叫重置密碼 API
            setIsLoading(true);
            try
            {
                const res = await svc.resetPassword(dto);
                setApiRes(res);

                if (!res.IsSuccess)
                {
                    onError?.(toAdapterError(res, "重置密碼失敗", "Account.ResetPassword"));
                }
                else
                {
                    onSuccess?.();
                }

                return res;
            }
            finally
            {
                setIsLoading(false);
            }
        }, [svc, onSuccess, onError]);

        // return
        return {
            execute,
            isLoading,
            apiRes,
        };
    };
    // #endregion
}

export const AccountAdapter = (apiInstance?: AxiosInstance) =>
{
    // return
    return new AccountAdapterImpl((api?: AxiosInstance) =>
    {
        return new AccountService(api ?? apiInstance);
    });
};