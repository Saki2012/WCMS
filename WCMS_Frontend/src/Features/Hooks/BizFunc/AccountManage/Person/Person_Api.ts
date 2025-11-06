import { IApiProvider, IDataProvider } from "@/SysCore/Interface/IApiProvider";
import type { ApiResponse } from "@/SysCore/Interface/IApiProvider";
import { BaseApiService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
type PersonSet = components["schemas"]["PersonSet_DTO"];
type QueryListParam = components["schemas"]["QueryListParam"];

abstract class IPersonProvider extends IDataProvider<PersonSet>
{}
class MockProvider extends IPersonProvider
{
    protected doFetchListCount(condition?: QueryListParam): Promise<ApiResponse<number>>
    {
        throw new Error("Method not implemented.");
    }
    protected async doCreateData(set: PersonSet): Promise<ApiResponse<PersonSet>>
    {
        throw new Error("Method not implemented.");
    }
    protected async doUpdateData(internaId: string, set: PersonSet): Promise<ApiResponse<PersonSet>>
    {
        throw new Error("Method not implemented.");
    }
    protected async doDelete(internaId: string): Promise<ApiResponse<PersonSet>>
    {
        throw new Error("Method not implemented.");
    }
    protected async doInvalid(internaId: string, isInvalid: boolean): Promise<ApiResponse<PersonSet>>
    {
        throw new Error("Method not implemented.");
    }
    protected async doFetchData(internaId?: string): Promise<ApiResponse<PersonSet>>
    {
        throw new Error("Method not implemented.");
    }
    protected async doFetchList(condition: QueryListParam): Promise<ApiResponse<PersonSet[]>>
    {
        throw new Error("Method not implemented.");
    }
    protected doGetModelDisplayName(): Promise<ModelDisplaySchema>
    {
        throw new Error("Method not implemented.");
    }
}
class APIProvider extends IPersonProvider
{
    private readonly ModuleName = "Person";
    private readonly API = new BaseApiService<PersonSet>(this.ModuleName);

    protected async doCreateData(set: PersonSet): Promise<ApiResponse<PersonSet>>
    {
        const res = await this.API.create(set);
        return res.data;
    }
    protected async doUpdateData(internaId: string, set: PersonSet): Promise<ApiResponse<PersonSet>>
    {
        const res = await this.API.update(internaId, set);
        return res.data;
    }
    protected async doDelete(internaId: string): Promise<ApiResponse<PersonSet>>
    {
        const res = await this.API.delete(internaId);
        return res.data;
    }
    protected async doInvalid(internaId: string, isInvalid: boolean): Promise<ApiResponse<PersonSet>>
    {
        const res = await this.API.invalid(internaId, isInvalid);
        return res.data;
    }
    protected async doFetchData(internaId: string): Promise<ApiResponse<PersonSet>>
    {
        const res = await this.API.queryData(internaId);
        return res.data;
    }
    protected async doFetchList(condition: QueryListParam): Promise<ApiResponse<PersonSet[]>>
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
const PersonProvider = (): IPersonProvider => IApiProvider<IPersonProvider>(APIProvider, MockProvider);
export default PersonProvider;
