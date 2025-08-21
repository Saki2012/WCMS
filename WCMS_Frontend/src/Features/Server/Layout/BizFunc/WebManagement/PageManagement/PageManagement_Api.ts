import { IApiProvider, IDataProvider } from "../../../../../../SysCore/Interface/IApiProvider";
import type { ApiResponse, QueryListCondition } from "../../../../../../SysCore/Interface/IApiProvider";
import { BaseApiService } from "../../../../../../SysCore/Utils/API/APIClient";
import type { components } from "../../../../../../types/api";
import type { ModelDisplaySchema } from "../../../../../../types/IApiSchema";
type PageManagementSet = components["schemas"]["PageManagementSet"];

abstract class IPageManagementProvider extends IDataProvider<PageManagementSet>
{}
class MockProvider extends IPageManagementProvider
{
    protected doCreateData(
        set?: {
            PageManagement?: components["schemas"]["PageManagement"];
            PageManagementDetail?: components["schemas"]["PageManagementDetail"][] | null;
        } | undefined,
    ): Promise<
        ApiResponse<
            {
                PageManagement?: components["schemas"]["PageManagement"];
                PageManagementDetail?: components["schemas"]["PageManagementDetail"][] | null;
            }
        >
    >
    {
        throw new Error("Method not implemented.");
    }
    protected doUpdateData(
        internaId: string,
        set: {
            PageManagement?: components["schemas"]["PageManagement"];
            PageManagementDetail?: components["schemas"]["PageManagementDetail"][] | null;
        },
    ): Promise<
        ApiResponse<
            {
                PageManagement?: components["schemas"]["PageManagement"];
                PageManagementDetail?: components["schemas"]["PageManagementDetail"][] | null;
            }
        >
    >
    {
        throw new Error("Method not implemented.");
    }
    protected doDelete(
        internaId: string,
    ): Promise<
        ApiResponse<
            {
                PageManagement?: components["schemas"]["PageManagement"];
                PageManagementDetail?: components["schemas"]["PageManagementDetail"][] | null;
            }
        >
    >
    {
        throw new Error("Method not implemented.");
    }
    protected doInvalid(
        internaId: string,
        isInvalid: boolean,
    ): Promise<
        ApiResponse<
            {
                PageManagement?: components["schemas"]["PageManagement"];
                PageManagementDetail?: components["schemas"]["PageManagementDetail"][] | null;
            }
        >
    >
    {
        throw new Error("Method not implemented.");
    }
    protected doFetchData(
        internaId?: string,
    ): Promise<
        ApiResponse<
            {
                PageManagement?: components["schemas"]["PageManagement"];
                PageManagementDetail?: components["schemas"]["PageManagementDetail"][] | null;
            }
        >
    >
    {
        throw new Error("Method not implemented.");
    }
    protected doFetchList(
        condition?: QueryListCondition,
    ): Promise<
        ApiResponse<
            {
                PageManagement?: components["schemas"]["PageManagement"];
                PageManagementDetail?: components["schemas"]["PageManagementDetail"][] | null;
            }[]
        >
    >
    {
        throw new Error("Method not implemented.");
    }
    protected doFetchListCount(condition?: QueryListCondition): Promise<ApiResponse<number>>
    {
        throw new Error("Method not implemented.");
    }
    protected doGetModelDisplayName(): Promise<ModelDisplaySchema>
    {
        throw new Error("Method not implemented.");
    }
}
class APIProvider extends IPageManagementProvider
{
    private readonly ModuleName = "PageManagement";
    private readonly API = new BaseApiService<PageManagementSet>(this.ModuleName);

    protected async doCreateData(set: PageManagementSet): Promise<ApiResponse<PageManagementSet>>
    {
        const res = await this.API.create(set);
        return res.data;
    }
    protected async doUpdateData(internaId: string, set: PageManagementSet): Promise<ApiResponse<PageManagementSet>>
    {
        const res = await this.API.update(internaId, set);
        return res.data;
    }
    protected async doDelete(internaId: string): Promise<ApiResponse<PageManagementSet>>
    {
        const res = await this.API.delete(internaId);
        return res.data;
    }
    protected async doInvalid(internaId: string, isInvalid: boolean): Promise<ApiResponse<PageManagementSet>>
    {
        const res = await this.API.invalid(internaId, isInvalid);
        return res.data;
    }
    protected async doFetchData(internaId: string): Promise<ApiResponse<PageManagementSet>>
    {
        const res = await this.API.queryData(internaId);
        return res.data;
    }
    protected async doFetchList(condition: QueryListCondition): Promise<ApiResponse<PageManagementSet[]>>
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
const PageManagementProvider = (): IPageManagementProvider =>
    IApiProvider<IPageManagementProvider>(APIProvider, MockProvider);
export default PageManagementProvider;
