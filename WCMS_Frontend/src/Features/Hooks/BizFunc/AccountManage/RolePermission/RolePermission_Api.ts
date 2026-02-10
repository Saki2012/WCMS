import type { Lang } from "@/SysCore/i18n/lang";
import { type ApiAdapterError, ApiDataAdapter, type EffectDeps } from "@/SysCore/Utils/API/APIAdapter";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";

type RolePermissionSet = components["schemas"]["RolePermissionSet_DTO"];
type PermissionCatalog = components["schemas"]["PermissionCatalogModuleDTO"];

export class RolePermissionService extends ApiDataService<RolePermissionSet>
{
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.RolePermission, apiInstance);
    }

    /** 讀取權限目錄（custom endpoint） */
    async getPermissionCatalog(): Promise<ApiResponse<PermissionCatalog[]>>
    {
        return await this.CallApi<PermissionCatalog[]>(() =>
            this.Api.get<ApiResponse<PermissionCatalog[]>>(`${this.Module}/GetPermissionCatalog`)
        );
    }
}

export type UsePermissionCatalogOptions = {
    lang: Lang;
    apiInstance?: AxiosInstance;
    deps?: EffectDeps;
    onError?: (e: ApiAdapterError) => void;
};

export const RolePermissionAdapter = (apiInstance?: AxiosInstance) =>
{
    // 宣告變數
    const adapter = new ApiDataAdapter<RolePermissionSet, RolePermissionService>(
        (api?: AxiosInstance) => new RolePermissionService(api ?? apiInstance),
    );

    const usePermissionCatalog = (opt: UsePermissionCatalogOptions) =>
    {
        // 宣告變數
        const deps = opt.deps ?? [opt.lang];

        const [data, setData] = useState<PermissionCatalog[]>([]);
        const [isLoading, setIsLoading] = useState<boolean>(false);
        const [errorText, setErrorText] = useState<string | null>(null);

        const refetch = useCallback(async () =>
        {
            try
            {
                // 宣告變數
                setIsLoading(true);
                setErrorText(null);

                // 執行 function：支援 hook 端覆寫 apiInstance
                const svc = new RolePermissionService(opt.apiInstance ?? apiInstance);
                const res = await svc.getPermissionCatalog();

                if (!res.IsSuccess)
                {
                    const msg = (res.SysMessage ?? [])
                        .map(m => m?.Message)
                        .filter(Boolean)
                        .join("；");

                    setErrorText(msg || "讀取權限目錄失敗");
                    return;
                }

                setData(res.Data ?? []);
            } catch (e)
            {
                // 宣告變數：維持你們 adapter error 型別
                const err: ApiAdapterError = {
                    messageText: "讀取權限目錄失敗",
                    sysMessages: [],
                };

                setErrorText(err.messageText);
                opt.onError?.(err);
            } finally
            {
                setIsLoading(false);
            }
        }, [opt.apiInstance, apiInstance, opt.onError]);

        useEffect(() =>
        {
            // 執行 function
            void refetch();
        }, deps); // eslint-disable-line react-hooks/exhaustive-deps

        // return（維持 query hook 的回傳風格）
        return useMemo(() => ({
            data,
            isLoading,
            errorText,
            refetch,
        }), [data, isLoading, errorText, refetch]);
    };

    // ✅ 關鍵：擴充 hooks，但不把 adapter 展平成 plain object（保留 prototype：useServerActions）
    const extAdapter = adapter as ApiDataAdapter<RolePermissionSet, RolePermissionService> & {
        hooks: typeof adapter.hooks & { usePermissionCatalog: typeof usePermissionCatalog; };
    };

    extAdapter.hooks = {
        ...adapter.hooks,
        usePermissionCatalog,
    };

    // return：仍是 ApiDataAdapter instance
    return extAdapter;
};
