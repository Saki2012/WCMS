import { SpecPGID } from "@/SpecFetures/1819/Hooks/Common/SpecProgId";
import { IApiProvider, IDataProvider } from "@/SysCore/Interface/IApiProvider";
import type { ApiResponse } from "@/SysCore/Interface/IApiProvider";
import { BaseApiService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";

type SpecJournalIndexSet = components["schemas"]["SpecJournalIndexSet_DTO"];
type QueryListParam = components["schemas"]["QueryListParam"];

abstract class ISpecJournalIndexProvider extends IDataProvider<SpecJournalIndexSet>
{}
class MockProvider extends ISpecJournalIndexProvider
{
    protected doFetchListCount(condition?: QueryListParam): Promise<ApiResponse<number>>
    {
        throw new Error("Method not implemented.");
    }
    protected async doCreateData(set: SpecJournalIndexSet): Promise<ApiResponse<SpecJournalIndexSet>>
    {
        throw new Error("Method not implemented.");
    }
    protected async doUpdateData(internaId: string, set: SpecJournalIndexSet): Promise<ApiResponse<SpecJournalIndexSet>>
    {
        throw new Error("Method not implemented.");
    }
    protected async doDelete(internaId: string): Promise<ApiResponse<SpecJournalIndexSet>>
    {
        throw new Error("Method not implemented.");
    }
    protected async doInvalid(internaId: string, isInvalid: boolean): Promise<ApiResponse<SpecJournalIndexSet>>
    {
        throw new Error("Method not implemented.");
    }
    protected async doFetchData(internaId?: string): Promise<ApiResponse<SpecJournalIndexSet>>
    {
        throw new Error("Method not implemented.");
    }
    protected async doFetchList(condition: QueryListParam): Promise<ApiResponse<SpecJournalIndexSet[]>>
    {
        throw new Error("Method not implemented.");
    }
    protected doGetModelDisplayName(): Promise<ModelDisplaySchema>
    {
        throw new Error("Method not implemented.");
    }
}
class APIProvider extends ISpecJournalIndexProvider
{
    private readonly API = new BaseApiService<SpecJournalIndexSet>(SpecPGID.SpecJournalIndex);
    protected async doCreateData(set: SpecJournalIndexSet): Promise<ApiResponse<SpecJournalIndexSet>>
    {
        const res = await this.API.create(set);
        return res.data;
    }
    protected async doUpdateData(internaId: string, set: SpecJournalIndexSet): Promise<ApiResponse<SpecJournalIndexSet>>
    {
        const res = await this.API.update(internaId, set);
        return res.data;
    }
    protected async doDelete(internaId: string): Promise<ApiResponse<SpecJournalIndexSet>>
    {
        const res = await this.API.delete(internaId);
        return res.data;
    }
    protected async doInvalid(internaId: string, isInvalid: boolean): Promise<ApiResponse<SpecJournalIndexSet>>
    {
        const res = await this.API.invalid(internaId, isInvalid);
        return res.data;
    }
    protected async doFetchData(internaId: string): Promise<ApiResponse<SpecJournalIndexSet>>
    {
        const res = await this.API.queryData(internaId);
        return res.data;
    }
    protected async doFetchList(condition: QueryListParam): Promise<ApiResponse<SpecJournalIndexSet[]>>
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
const SpecJournalIndexProvider = (): ISpecJournalIndexProvider =>
    IApiProvider<ISpecJournalIndexProvider>(APIProvider, MockProvider);
export default SpecJournalIndexProvider;
