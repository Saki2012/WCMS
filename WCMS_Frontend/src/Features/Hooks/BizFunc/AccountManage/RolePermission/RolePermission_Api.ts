import type { Lang } from "@/SysCore/i18n/lang";
import { IApiProvider, IDataProvider } from "@/SysCore/Interface/IApiProvider";
import type { ApiResponse } from "@/SysCore/Interface/IApiProvider";
import api from "@/SysCore/Utils/API/APIBase";
import { BaseApiService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { RoleDataModelFields } from "@/types/SchemaFields";
import { useEffect, useState } from "react";

type PermissionCatalog = components["schemas"]["PermissionCatalogModuleDTO"];

type RolePermissionSet = components["schemas"]["RolePermissionSet_DTO"];
type QueryListParam = components["schemas"]["QueryListParam"];

abstract class IRolePermissionProvider extends IDataProvider<RolePermissionSet>
{
    public async GetPermissionCatalog(): Promise<ApiResponse<PermissionCatalog>>
    {
        const res = await api.get<ApiResponse<PermissionCatalog>>(`${"RolePermission"}/GetPermissionCatalog`);
        return res.data;
    }
}
class MockProvider extends IRolePermissionProvider
{
    protected doFetchListCount(condition?: QueryListParam): Promise<ApiResponse<number>>
    {
        throw new Error("Method not implemented.");
    }
    protected async doCreateData(set: RolePermissionSet): Promise<ApiResponse<RolePermissionSet>>
    {
        throw new Error("Method not implemented.");
    }
    protected async doUpdateData(internaId: string, set: RolePermissionSet): Promise<ApiResponse<RolePermissionSet>>
    {
        throw new Error("Method not implemented.");
    }
    protected async doDelete(internaId: string): Promise<ApiResponse<RolePermissionSet>>
    {
        throw new Error("Method not implemented.");
    }
    protected async doInvalid(internaId: string, isInvalid: boolean): Promise<ApiResponse<RolePermissionSet>>
    {
        throw new Error("Method not implemented.");
    }
    protected async doFetchData(internaId?: string): Promise<ApiResponse<RolePermissionSet>>
    {
        throw new Error("Method not implemented.");
    }
    protected async doFetchList(condition: QueryListParam): Promise<ApiResponse<RolePermissionSet[]>>
    {
        throw new Error("Method not implemented.");
    }
    protected doGetModelDisplayName(): Promise<ModelDisplaySchema>
    {
        throw new Error("Method not implemented.");
    }
}
class APIProvider extends IRolePermissionProvider
{
    private readonly ModuleName = "RolePermission";
    private readonly API = new BaseApiService<RolePermissionSet>(this.ModuleName);

    protected async doCreateData(set: RolePermissionSet): Promise<ApiResponse<RolePermissionSet>>
    {
        const res = await this.API.create(set);
        return res.data;
    }
    protected async doUpdateData(internaId: string, set: RolePermissionSet): Promise<ApiResponse<RolePermissionSet>>
    {
        const res = await this.API.update(internaId, set);
        return res.data;
    }
    protected async doDelete(internaId: string): Promise<ApiResponse<RolePermissionSet>>
    {
        const res = await this.API.delete(internaId);
        return res.data;
    }
    protected async doInvalid(internaId: string, isInvalid: boolean): Promise<ApiResponse<RolePermissionSet>>
    {
        const res = await this.API.invalid(internaId, isInvalid);
        return res.data;
    }
    protected async doFetchData(internaId: string): Promise<ApiResponse<RolePermissionSet>>
    {
        const res = await this.API.queryData(internaId);
        return res.data;
    }
    protected async doFetchList(condition: QueryListParam): Promise<ApiResponse<RolePermissionSet[]>>
    {
        const res = await this.API.queryList(condition);
        return res.data;
    }
    protected async doFetchListCount(condition: QueryListParam): Promise<ApiResponse<number>>
    {
        const res = await this.API.queryCount(condition);
        return res.data;
    }
    protected async doGetModelDisplayName(): Promise<ModelDisplaySchema>
    {
        const res = await this.API.getModelDisplayName();
        return res;
    }
}
const RolePermissionProvider = (): IRolePermissionProvider =>
    IApiProvider<IRolePermissionProvider>(APIProvider, MockProvider);
export default RolePermissionProvider;

/** hooks暫時寫在這邊 */
export const usePermissionCatalog = (provider: any, lang: Lang) =>
{
    const [data, setData] = useState<PermissionCatalog[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<unknown>(null);

    useEffect(() =>
    {
        let alive = true;

        const load = async () =>
        {
            try
            {
                // 開始載入
                setIsLoading(true);
                setError(null);
                // 呼叫 API
                const res = await provider.GetPermissionCatalog();
                // 寫回 state
                if (alive) setData(res.Data);
            } catch (e)
            {
                // 記錄錯誤
                if (alive) setError(e);
            } finally
            {
                // 結束載入
                if (alive) setIsLoading(false);
            }
        };

        void load();
        return () =>
        {
            alive = false;
        };
    }, [provider, lang]);

    return { data, isLoading, error };
};
