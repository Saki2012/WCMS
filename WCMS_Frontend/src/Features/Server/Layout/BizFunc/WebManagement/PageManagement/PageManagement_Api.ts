import { BaseApiService } from '../../../../../../SysCore/Utils/APIClient';
import  type { components } from "../../../../../../types/api";
import {IApiProvider, IDataProvider} from '../../../../../../SysCore/Interface/IApiProvider'
import type { ApiResponse, QueryListCondition } from '../../../../../../SysCore/Interface/IApiProvider';
type PageManagementSet = components["schemas"]["PageManagementSet"]


abstract class IPageManagementProvider extends IDataProvider<PageManagementSet> { }
class MockProvider extends IPageManagementProvider {
    protected async doCreateData(set: PageManagementSet): Promise<ApiResponse<PageManagementSet>> {
        throw new Error('Method not implemented.');
    }
    protected async doUpdateData(internaId:string,set:PageManagementSet): Promise<ApiResponse<PageManagementSet>> {
        throw new Error('Method not implemented.');
    }
    protected async doDelete(internaId:string): Promise<ApiResponse<PageManagementSet>> {
        throw new Error('Method not implemented.');
    }
    protected async doInvalid(internaId:string,isInvalid:boolean): Promise<ApiResponse<PageManagementSet>> {
        throw new Error('Method not implemented.');
    }
    protected async doFetchData(internaId?: string): Promise<ApiResponse<PageManagementSet>> {
        throw new Error('Method not implemented.');
    }
    protected async doFetchList(condition?: QueryListCondition): Promise<ApiResponse<PageManagementSet>> {
        throw new Error('Method not implemented.');
    }
    protected doGetModelDisplayName(): Promise<PageManagementSet[]> {
        throw new Error('Method not implemented.');
    }
}
class APIProvider extends IPageManagementProvider {
    private readonly ModuleName="PageManagement"
    private readonly API= new BaseApiService<PageManagementSet>(this.ModuleName);

    protected async doCreateData(set: PageManagementSet): Promise<ApiResponse<PageManagementSet>> {
        const res = await this.API.create(set);
        return res.data;
    }
    protected async doUpdateData(internaId:string,set:PageManagementSet): Promise<ApiResponse<PageManagementSet>> {
        const res = await this.API.update(internaId,set);
        return res.data;
    }
    protected async doDelete(internaId:string): Promise<ApiResponse<PageManagementSet>> {
        const res = await this.API.delete(internaId);
        return res.data;
    }
    protected async doInvalid(internaId:string,isInvalid:boolean): Promise<ApiResponse<PageManagementSet>> {
        const res = await this.API.invalid(internaId,isInvalid);
        return res.data;
    }
    protected async doFetchData(internaId: string): Promise<ApiResponse<PageManagementSet>> {
        const res = await this.API.queryData(internaId);
        return res.data;
    }
    protected async doFetchList(condition: QueryListCondition): Promise<ApiResponse<PageManagementSet>> {
        const res = await this.API.queryList(condition);
        return res.data
    }
    protected async doFetchListCount(condition: QueryListCondition): Promise<ApiResponse<number>> {
        const res = await this.API.queryCount(condition);
        return res.data
    }
    protected async doGetModelDisplayName(): Promise<PageManagementSet[]> {
        const res = await this.API.getModelDisplayName();
        return res
    }
}
const PageManagementProvider = (): IPageManagementProvider => IApiProvider<IPageManagementProvider>(APIProvider, MockProvider);
export default PageManagementProvider