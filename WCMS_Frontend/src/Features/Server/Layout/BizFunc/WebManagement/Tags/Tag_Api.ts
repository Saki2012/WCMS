import { BaseApiService } from '../../../../../../SysCore/Utils/APIClient';
import  type { components } from "../../../../../../types/api";
import {IApiProvider, IDataProvider} from '../../../../../../SysCore/Interface/IApiProvider'
import type { ApiResponse, QueryListCondition } from '../../../../../../SysCore/Interface/IApiProvider';
type TagSet = components["schemas"]["TagSet"]

abstract class ICategoryProvider extends IDataProvider<TagSet> {
    
}
class MockProvider extends ICategoryProvider {
    protected doCreateData(): Promise<TagSet> {
        throw new Error('Method not implemented.');
    }
    protected doUpdateData(): Promise<TagSet> {
        throw new Error('Method not implemented.');
    }
    protected doDelete(): Promise<TagSet> {
        throw new Error('Method not implemented.');
    }
    protected doInvalid(): Promise<TagSet> {
        throw new Error('Method not implemented.');
    }
    protected doFetchData(): Promise<TagSet> {
        throw new Error('Method not implemented.');
    }
    protected doFetchList(): Promise<TagSet[]> {
        throw new Error('Method not implemented.');
    }
    protected doGetModelDisplayName(): Promise<TagSet[]> {
        throw new Error('Method not implemented.');
    }
}
class APIProvider extends ICategoryProvider {
    private readonly ModuleName="Tag"
    private readonly API= new BaseApiService<TagSet>(this.ModuleName);

    protected async doCreateData(set:TagSet): Promise<ApiResponse<TagSet>> {
        const res = await this.API.create(set);
        return res.data;
    }
    protected async doUpdateData(internaId:string,set:TagSet): Promise<ApiResponse<TagSet>> {
        const res = await this.API.update(internaId,set);
        return res.data;
    }
    protected async doDelete(internaId:string): Promise<ApiResponse<TagSet>> {
        const res = await this.API.delete(internaId);
        return res.data;
    }
    protected async doInvalid(internaId:string,isInvalid:boolean): Promise<ApiResponse<TagSet>> {
        const res = await this.API.invalid(internaId,isInvalid);
        return res.data;
    }
    protected async doFetchData(internaId: string): Promise<ApiResponse<TagSet>> {
        const res = await this.API.queryData(internaId);
        return res.data;
    }
    protected async doFetchList(condition: QueryListCondition): Promise<ApiResponse<TagSet>> {
        const res = await this.API.queryList(condition);
        return res.data
    }
    protected async doFetchListCount(condition: QueryListCondition): Promise<ApiResponse<number>> {
        const res = await this.API.queryCount(condition)
        return res.data
    }
    protected async doGetModelDisplayName(): Promise<TagSet[]> {
        const res = await this.API.getModelDisplayName();
        return res
    }
}
const TagProvider = (): ICategoryProvider => IApiProvider<ICategoryProvider>(APIProvider, MockProvider);
export default TagProvider