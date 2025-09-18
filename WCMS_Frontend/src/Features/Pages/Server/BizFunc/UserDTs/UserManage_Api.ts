import { IApiProvider, IDataProvider } from "../../../../../SysCore/Interface/IApiProvider";
import type { ApiResponse } from "../../../../../SysCore/Interface/IApiProvider";
import { BaseApiService } from "../../../../../SysCore/Utils/API/APIClient";
import type { components } from "../../../../../types/api";
import type { ModelDisplaySchema } from "../../../../../types/IApiSchema";
type UserSet = components["schemas"]["UserSet_DTO"];
type QueryListParam = components["schemas"]["QueryListParam"];

abstract class IUserProvider extends IDataProvider<UserSet>
{}
class MockProvider extends IUserProvider
{
    protected doFetchListCount(condition?: QueryListParam): Promise<ApiResponse<number>>
    {
        throw new Error("Method not implemented.");
    }
    protected async doCreateData(set: UserSet): Promise<ApiResponse<UserSet>>
    {
        throw new Error("Method not implemented.");
    }
    protected async doUpdateData(internaId: string, set: UserSet): Promise<ApiResponse<UserSet>>
    {
        throw new Error("Method not implemented.");
    }
    protected async doDelete(internaId: string): Promise<ApiResponse<UserSet>>
    {
        throw new Error("Method not implemented.");
    }
    protected async doInvalid(internaId: string, isInvalid: boolean): Promise<ApiResponse<UserSet>>
    {
        throw new Error("Method not implemented.");
    }
    protected async doFetchData(internaId?: string): Promise<ApiResponse<UserSet>>
    {
        throw new Error("Method not implemented.");
    }
    protected async doFetchList(condition: QueryListParam): Promise<ApiResponse<UserSet[]>>
    {
        throw new Error("Method not implemented.");
    }
    protected doGetModelDisplayName(): Promise<ModelDisplaySchema>
    {
        throw new Error("Method not implemented.");
    }
}
class APIProvider extends IUserProvider
{
    private readonly ModuleName = "User";
    private readonly API = new BaseApiService<UserSet>(this.ModuleName);

    protected async doCreateData(set: UserSet): Promise<ApiResponse<UserSet>>
    {
        const res = await this.API.create(set);
        return res.data;
    }
    protected async doUpdateData(internaId: string, set: UserSet): Promise<ApiResponse<UserSet>>
    {
        const res = await this.API.update(internaId, set);
        return res.data;
    }
    protected async doDelete(internaId: string): Promise<ApiResponse<UserSet>>
    {
        const res = await this.API.delete(internaId);
        return res.data;
    }
    protected async doInvalid(internaId: string, isInvalid: boolean): Promise<ApiResponse<UserSet>>
    {
        const res = await this.API.invalid(internaId, isInvalid);
        return res.data;
    }
    protected async doFetchData(internaId: string): Promise<ApiResponse<UserSet>>
    {
        const res = await this.API.queryData(internaId);
        return res.data;
    }
    protected async doFetchList(condition: QueryListParam): Promise<ApiResponse<UserSet[]>>
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
const UserProvider = (): IUserProvider =>
    IApiProvider<IUserProvider>(APIProvider, MockProvider);
export default UserProvider;
