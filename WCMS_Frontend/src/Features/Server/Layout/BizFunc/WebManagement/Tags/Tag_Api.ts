import { IApiProvider, IDataProvider } from "../../../../../../SysCore/Interface/IApiProvider";
import type { ApiResponse, QueryListCondition } from "../../../../../../SysCore/Interface/IApiProvider";
import { BaseApiService } from "../../../../../../SysCore/Utils/API/APIClient";
import type { components } from "../../../../../../types/api";
import type { ModelDisplaySchema } from "../../../../../../types/IApiSchema";
type TagSet = components["schemas"]["TagSet"];

abstract class ITagProvider extends IDataProvider<TagSet>
{
}
class MockProvider extends ITagProvider
{
    protected doCreateData(
        set?:
            | { TagData?: components["schemas"]["TagData"]; TagDetail?: components["schemas"]["TagDetail"][] | null; }
            | undefined,
    ): Promise<
        ApiResponse<
            { TagData?: components["schemas"]["TagData"]; TagDetail?: components["schemas"]["TagDetail"][] | null; }
        >
    >
    {
        throw new Error("Method not implemented.");
    }
    protected doUpdateData(
        internaId: string,
        set: { TagData?: components["schemas"]["TagData"]; TagDetail?: components["schemas"]["TagDetail"][] | null; },
    ): Promise<
        ApiResponse<
            { TagData?: components["schemas"]["TagData"]; TagDetail?: components["schemas"]["TagDetail"][] | null; }
        >
    >
    {
        throw new Error("Method not implemented.");
    }
    protected doDelete(
        internaId: string,
    ): Promise<
        ApiResponse<
            { TagData?: components["schemas"]["TagData"]; TagDetail?: components["schemas"]["TagDetail"][] | null; }
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
            { TagData?: components["schemas"]["TagData"]; TagDetail?: components["schemas"]["TagDetail"][] | null; }
        >
    >
    {
        throw new Error("Method not implemented.");
    }
    protected doFetchData(
        internaId?: string,
    ): Promise<
        ApiResponse<
            { TagData?: components["schemas"]["TagData"]; TagDetail?: components["schemas"]["TagDetail"][] | null; }
        >
    >
    {
        throw new Error("Method not implemented.");
    }
    protected doFetchList(
        condition?: QueryListCondition,
    ): Promise<
        ApiResponse<
            { TagData?: components["schemas"]["TagData"]; TagDetail?: components["schemas"]["TagDetail"][] | null; }[]
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
class APIProvider extends ITagProvider
{
    private readonly ModuleName = "Tag";
    private readonly API = new BaseApiService<TagSet>(this.ModuleName);

    protected async doCreateData(set: TagSet): Promise<ApiResponse<TagSet>>
    {
        const res = await this.API.create(set);
        return res.data;
    }
    protected async doUpdateData(internaId: string, set: TagSet): Promise<ApiResponse<TagSet>>
    {
        const res = await this.API.update(internaId, set);
        return res.data;
    }
    protected async doDelete(internaId: string): Promise<ApiResponse<TagSet>>
    {
        const res = await this.API.delete(internaId);
        return res.data;
    }
    protected async doInvalid(internaId: string, isInvalid: boolean): Promise<ApiResponse<TagSet>>
    {
        const res = await this.API.invalid(internaId, isInvalid);
        return res.data;
    }
    protected async doFetchData(internaId: string): Promise<ApiResponse<TagSet>>
    {
        const res = await this.API.queryData(internaId);
        return res.data;
    }
    protected async doFetchList(condition: QueryListCondition): Promise<ApiResponse<TagSet[]>>
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
const TagProvider = (): ITagProvider => IApiProvider<ITagProvider>(APIProvider, MockProvider);
export default TagProvider;
