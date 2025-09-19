import { IApiProvider, IDataProvider } from "../../../../../../SysCore/Interface/IApiProvider";
import type { ApiResponse } from "../../../../../../SysCore/Interface/IApiProvider";
import { BaseApiService } from "../../../../../../SysCore/Utils/API/APIClient";
import type { components } from "../../../../../../types/api";
import type { ModelDisplaySchema } from "../../../../../../types/IApiSchema";
type CategorySet = components["schemas"]["CategoryDataSet_DTO"];
type QueryListParam = components["schemas"]["QueryListParam"];

abstract class ICategoryProvider extends IDataProvider<CategorySet>
{
}
class MockProvider extends ICategoryProvider
{
    protected doCreateData(
        set?: {
            Category?: components["schemas"]["Category_DTO"];
            CategoryDetail?: components["schemas"]["CategoryDetail_DTO"][] | null;
        } | undefined,
    ): Promise<
        ApiResponse<
            {
                Category?: components["schemas"]["Category_DTO"];
                CategoryDetail?: components["schemas"]["CategoryDetail_DTO"][] | null;
            }
        >
    >
    {
        throw new Error("Method not implemented.");
    }
    protected doUpdateData(
        internaId: string,
        set: {
            Category?: components["schemas"]["Category_DTO"];
            CategoryDetail?: components["schemas"]["CategoryDetail_DTO"][] | null;
        },
    ): Promise<
        ApiResponse<
            {
                Category?: components["schemas"]["Category_DTO"];
                CategoryDetail?: components["schemas"]["CategoryDetail_DTO"][] | null;
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
                Category?: components["schemas"]["Category_DTO"];
                CategoryDetail?: components["schemas"]["CategoryDetail_DTO"][] | null;
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
                Category?: components["schemas"]["Category_DTO"];
                CategoryDetail?: components["schemas"]["CategoryDetail_DTO"][] | null;
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
                Category?: components["schemas"]["Category_DTO"];
                CategoryDetail?: components["schemas"]["CategoryDetail_DTO"][] | null;
            }
        >
    >
    {
        throw new Error("Method not implemented.");
    }
    protected doFetchList(
        condition?: QueryListParam,
    ): Promise<
        ApiResponse<
            {
                Category?: components["schemas"]["Category_DTO"];
                CategoryDetail?: components["schemas"]["CategoryDetail_DTO"][] | null;
            }[]
        >
    >
    {
        throw new Error("Method not implemented.");
    }
    protected doFetchListCount(condition?: QueryListParam): Promise<ApiResponse<number>>
    {
        throw new Error("Method not implemented.");
    }
    protected doGetModelDisplayName(): Promise<ModelDisplaySchema>
    {
        throw new Error("Method not implemented.");
    }
}
class APIProvider extends ICategoryProvider
{
    private readonly ModuleName = "Category";
    private readonly API = new BaseApiService<CategorySet>(this.ModuleName);

    protected async doCreateData(set: CategorySet): Promise<ApiResponse<CategorySet>>
    {
        const res = await this.API.create(set);
        return res.data;
    }
    protected async doUpdateData(internaId: string, set: CategorySet): Promise<ApiResponse<CategorySet>>
    {
        const res = await this.API.update(internaId, set);
        return res.data;
    }
    protected async doDelete(internaId: string): Promise<ApiResponse<CategorySet>>
    {
        const res = await this.API.delete(internaId);
        return res.data;
    }
    protected async doInvalid(internaId: string, isInvalid: boolean): Promise<ApiResponse<CategorySet>>
    {
        const res = await this.API.invalid(internaId, isInvalid);
        return res.data;
    }
    protected async doFetchData(internaId: string): Promise<ApiResponse<CategorySet>>
    {
        const res = await this.API.queryData(internaId);
        return res.data;
    }
    protected async doFetchList(condition: QueryListParam): Promise<ApiResponse<CategorySet[]>>
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
const CategoryProvider = (): ICategoryProvider => IApiProvider<ICategoryProvider>(APIProvider, MockProvider);
export default CategoryProvider;
