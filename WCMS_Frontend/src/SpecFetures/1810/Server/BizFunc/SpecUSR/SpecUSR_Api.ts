import { IApiProvider, IDataProvider } from "../../../../../SysCore/Interface/IApiProvider";
import type { ApiResponse, QueryListCondition } from "../../../../../SysCore/Interface/IApiProvider";
import { BaseApiService } from "../../../../../SysCore/Utils/API/APIClient";
import type { components } from "../../../../../types/api";
import type { ModelDisplaySchema } from "../../../../../types/IApiSchema";
type SpecUSRSet = components["schemas"]["SpecUSRSet"];

abstract class ISpecUSRProvider extends IDataProvider<SpecUSRSet>
{}
class MockProvider extends ISpecUSRProvider
{
    protected doFetchListCount(condition?: QueryListCondition): Promise<ApiResponse<number>>
    {
        throw new Error("Method not implemented.");
    }
    protected async doCreateData(set: SpecUSRSet): Promise<ApiResponse<SpecUSRSet>>
    {
        throw new Error("Method not implemented.");
    }
    protected async doUpdateData(internaId: string, set: SpecUSRSet): Promise<ApiResponse<SpecUSRSet>>
    {
        throw new Error("Method not implemented.");
    }
    protected async doDelete(internaId: string): Promise<ApiResponse<SpecUSRSet>>
    {
        throw new Error("Method not implemented.");
    }
    protected async doInvalid(internaId: string, isInvalid: boolean): Promise<ApiResponse<SpecUSRSet>>
    {
        throw new Error("Method not implemented.");
    }
    protected async doFetchData(internaId?: string): Promise<ApiResponse<SpecUSRSet>>
    {
        throw new Error("Method not implemented.");
    }
    protected async doFetchList(condition: QueryListCondition): Promise<ApiResponse<SpecUSRSet[]>>
    {
        throw new Error("Method not implemented.");
    }
    protected doGetModelDisplayName(): Promise<ModelDisplaySchema>
    {
        throw new Error("Method not implemented.");
    }
}
class APIProvider extends ISpecUSRProvider
{
    private readonly ModuleName = "Announcement";
    private readonly API = new BaseApiService<SpecUSRSet>(this.ModuleName);

    protected async doCreateData(set: SpecUSRSet): Promise<ApiResponse<SpecUSRSet>>
    {
        const res = await this.API.create(set);
        return res.data;
    }
    protected async doUpdateData(internaId: string, set: SpecUSRSet): Promise<ApiResponse<SpecUSRSet>>
    {
        const res = await this.API.update(internaId, set);
        return res.data;
    }
    protected async doDelete(internaId: string): Promise<ApiResponse<SpecUSRSet>>
    {
        const res = await this.API.delete(internaId);
        return res.data;
    }
    protected async doInvalid(internaId: string, isInvalid: boolean): Promise<ApiResponse<SpecUSRSet>>
    {
        const res = await this.API.invalid(internaId, isInvalid);
        return res.data;
    }
    protected async doFetchData(internaId: string): Promise<ApiResponse<SpecUSRSet>>
    {
        const res = await this.API.queryData(internaId);
        return res.data;
    }
    protected async doFetchList(condition: QueryListCondition): Promise<ApiResponse<SpecUSRSet[]>>
    {
        const res = await this.API.queryList(condition);
        return res.data;
    }
    protected async doFetchListCount(condition: QueryListCondition): Promise<ApiResponse<number>>
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
const SpecUSRProvider = (): ISpecUSRProvider => IApiProvider<ISpecUSRProvider>(APIProvider, MockProvider);
export default SpecUSRProvider;
