import { ApiDataAdapter } from "@/SysCore/Utils/API/APIAdapter";
import type { ApiAdapterError } from "@/SysCore/Utils/API/APIAdapter";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";
import { useCallback, useMemo, useState } from "react";

type AccountSet = components["schemas"]["AccountSet_DTO"];
type ChangePassword = components["schemas"]["ChangePassword"];
type ResetPassword = components["schemas"]["ResetPassword"];

/** 將 ApiResponse 轉為 ApiAdapterError（避免 throw class；對標 APIAdapter.ts 的型別） */
const toAdapterError = (apiRes: ApiResponse<unknown>, fallback: string, action: string): ApiAdapterError =>
{
    // 宣告變數
    const sysMessages = apiRes?.SysMessage ?? [];
    const text = sysMessages
        .map(m => `${m?.MessageCode ?? ""}:${m?.Message ?? ""}`.trim())
        .filter(s => s.length > 0)
        .join("；");

    // return
    return {
        messageText: text || fallback,
        sysMessages,
        httpStatus: undefined,
        action,
    };
};

class AccountService extends ApiDataService<AccountSet>
{
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.Account, apiInstance);
    }

    async ChangePassword(pw: ChangePassword): Promise<ApiResponse<object>>
    {
        return await this.CallApi<object>(() => this.Api.put<ApiResponse<object>>(`${this.Module}/ChangePassword`, pw));
    }

    async ResetPassword(param: ResetPassword): Promise<ApiResponse<object>>
    {
        return await this.CallApi<object>(() =>
            this.Api.put<ApiResponse<object>>(`${this.Module}/ResetPassword`, param)
        );
    }
}

/**
 * ✅ 對標 Category_Api.ts 的擴充方式：
 * - 先 new ApiDataAdapter
 * - 外掛 hooks：useChangePassword / useResetPassword
 * - 最後 merge 回 adapter.hooks
 */
export const AccountAdapter = (apiInstance?: AxiosInstance) =>
{
    // 宣告變數
    const adapter = new ApiDataAdapter<AccountSet, AccountService>(
        (api?: AxiosInstance) => new AccountService(api ?? apiInstance),
    );

    const useChangePassword = (opt?: {
        apiInstance?: AxiosInstance;
        onSuccess?: () => void;
        onError?: (err: ApiAdapterError) => void;
    }) =>
    {
        // 宣告變數
        const [isLoading, setLoading] = useState(false);
        const [apiRes, setApiRes] = useState<ApiResponse<object> | null>(null);

        const apiOpt = opt?.apiInstance;
        const onSuccess = opt?.onSuccess;
        const onError = opt?.onError;

        const execute = useCallback(async (dto: ChangePassword) =>
        {
            // 執行 function：呼叫 ChangePassword
            setLoading(true);
            try
            {
                const svc = new AccountService(apiOpt ?? apiInstance);
                const res = await svc.ChangePassword(dto);
                setApiRes(res);

                if (!res.IsSuccess)
                {
                    onError?.(toAdapterError(res, "修改密碼失敗", "Account.ChangePassword"));
                } else
                {
                    onSuccess?.();
                }

                return res;
            } finally
            {
                setLoading(false);
            }
        }, [apiOpt, apiInstance, onSuccess, onError]);

        // return
        return { execute, isLoading, apiRes };
    };

    const useResetPassword = (opt?: {
        apiInstance?: AxiosInstance;
        onSuccess?: () => void;
        onError?: (err: ApiAdapterError) => void;
    }) =>
    {
        // 宣告變數
        const [isLoading, setLoading] = useState(false);
        const [apiRes, setApiRes] = useState<ApiResponse<object> | null>(null);

        const apiOpt = opt?.apiInstance;
        const onSuccess = opt?.onSuccess;
        const onError = opt?.onError;

        const execute = useCallback(async (dto: ResetPassword) =>
        {
            // 執行 function：呼叫 ResetPassword
            setLoading(true);
            try
            {
                const svc = new AccountService(apiOpt ?? apiInstance);
                const res = await svc.ResetPassword(dto);
                setApiRes(res);

                if (!res.IsSuccess)
                {
                    onError?.(toAdapterError(res, "重置密碼失敗", "Account.ResetPassword"));
                } else
                {
                    onSuccess?.();
                }

                return res;
            } finally
            {
                setLoading(false);
            }
        }, [apiOpt, apiInstance, onSuccess, onError]);

        // return
        return { execute, isLoading, apiRes };
    };

    // ✅ 關鍵：合併 hooks（對標 Category）
    const extAdapter = adapter as ApiDataAdapter<AccountSet, AccountService> & {
        hooks: typeof adapter.hooks & {
            useChangePassword: typeof useChangePassword;
            useResetPassword: typeof useResetPassword;
        };
    };

    extAdapter.hooks = useMemo(() =>
    {
        // return
        return {
            ...adapter.hooks,
            useChangePassword,
            useResetPassword,
        };
    }, [adapter.hooks]);

    // return
    return extAdapter;
};
