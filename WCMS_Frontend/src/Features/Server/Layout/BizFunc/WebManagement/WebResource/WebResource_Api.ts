import { IApiProvider, IDataProvider } from "../../../../../../SysCore/Interface/IApiProvider";
import type { ApiResponse, QueryListCondition } from "../../../../../../SysCore/Interface/IApiProvider";
import { BaseApiService } from "../../../../../../SysCore/Utils/API/APIClient";
import type { components } from "../../../../../../types/api";
import type { ModelDisplaySchema } from "../../../../../../types/IApiSchema";
type WebResourceSet = components["schemas"]["WebResourceSet"];

abstract class IWebResourceProvider extends IDataProvider<WebResourceSet>
{}
class MockProvider extends IWebResourceProvider
{
    protected doFetchListCount(condition?: QueryListCondition): Promise<ApiResponse<number>>
    {
        throw new Error("Method not implemented.");
    }
    protected async doCreateData(set: WebResourceSet): Promise<ApiResponse<WebResourceSet>>
    {
        throw new Error("Method not implemented.");
    }
    protected async doUpdateData(internaId: string, set: WebResourceSet): Promise<ApiResponse<WebResourceSet>>
    {
        throw new Error("Method not implemented.");
    }
    protected async doDelete(internaId: string): Promise<ApiResponse<WebResourceSet>>
    {
        throw new Error("Method not implemented.");
    }
    protected async doInvalid(internaId: string, isInvalid: boolean): Promise<ApiResponse<WebResourceSet>>
    {
        throw new Error("Method not implemented.");
    }
    protected async doFetchData(internaId?: string): Promise<ApiResponse<WebResourceSet>>
    {
        throw new Error("Method not implemented.");
    }
    protected async doFetchList(condition: QueryListCondition): Promise<ApiResponse<WebResourceSet[]>>
    {
        throw new Error("Method not implemented.");
    }
    protected doGetModelDisplayName(): Promise<ModelDisplaySchema>
    {
        throw new Error("Method not implemented.");
    }
}
class APIProvider extends IWebResourceProvider
{
    private readonly ModuleName = "WebResource";
    private readonly API = new BaseApiService<WebResourceSet>(this.ModuleName);

    protected async doCreateData(set: WebResourceSet): Promise<ApiResponse<WebResourceSet>>
    {
        const res = await this.API.create(set);
        return res.data;
    }
    protected async doUpdateData(internaId: string, set: WebResourceSet): Promise<ApiResponse<WebResourceSet>>
    {
        const res = await this.API.update(internaId, set);
        return res.data;
    }
    protected async doDelete(internaId: string): Promise<ApiResponse<WebResourceSet>>
    {
        const res = await this.API.delete(internaId);
        return res.data;
    }
    protected async doInvalid(internaId: string, isInvalid: boolean): Promise<ApiResponse<WebResourceSet>>
    {
        const res = await this.API.invalid(internaId, isInvalid);
        return res.data;
    }
    protected async doFetchData(internaId: string): Promise<ApiResponse<WebResourceSet>>
    {
        const res = await this.API.queryData(internaId);
        return res.data;
    }
    protected async doFetchList(condition: QueryListCondition): Promise<ApiResponse<WebResourceSet[]>>
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
const WebResourceProvider = (): IWebResourceProvider => IApiProvider<IWebResourceProvider>(APIProvider, MockProvider);
export default WebResourceProvider;
