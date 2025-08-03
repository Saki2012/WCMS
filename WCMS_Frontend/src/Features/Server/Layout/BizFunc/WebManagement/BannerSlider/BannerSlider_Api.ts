import { BaseApiService } from '../../../../../../SysCore/Utils/APIClient';
import  type { components } from "../../../../../../types/api";
import {IApiProvider, IDataProvider} from '../../../../../../SysCore/Interface/IApiProvider'
import type { ApiResponse, QueryListCondition } from '../../../../../../SysCore/Interface/IApiProvider';
type BannerSliderSet = components["schemas"]["BannerSet"]


abstract class IBannerSliderProvider extends IDataProvider<BannerSliderSet> { }
class MockProvider extends IBannerSliderProvider {
    protected async doCreateData(set: BannerSliderSet): Promise<ApiResponse<BannerSliderSet>> {
        throw new Error('Method not implemented.');
    }
    protected async doUpdateData(internaId:string,set:BannerSliderSet): Promise<ApiResponse<BannerSliderSet>> {
        throw new Error('Method not implemented.');
    }
    protected async doDelete(internaId:string): Promise<ApiResponse<BannerSliderSet>> {
        throw new Error('Method not implemented.');
    }
    protected async doInvalid(internaId:string,isInvalid:boolean): Promise<ApiResponse<BannerSliderSet>> {
        throw new Error('Method not implemented.');
    }
    protected async doFetchData(internaId?: string): Promise<ApiResponse<BannerSliderSet>> {
        throw new Error('Method not implemented.');
    }
    protected async doFetchList(condition?: QueryListCondition): Promise<ApiResponse<BannerSliderSet>> {
        throw new Error('Method not implemented.');
    }
    protected doGetModelDisplayName(): Promise<BannerSliderSet[]> {
        throw new Error('Method not implemented.');
    }
}
class APIProvider extends IBannerSliderProvider {
    private readonly ModuleName="Announcement"
    private readonly API= new BaseApiService<BannerSliderSet>(this.ModuleName);

    protected async doCreateData(set: BannerSliderSet): Promise<ApiResponse<BannerSliderSet>> {
        const res = await this.API.create(set);
        return res.data;
    }
    protected async doUpdateData(internaId:string,set:BannerSliderSet): Promise<ApiResponse<BannerSliderSet>> {
        const res = await this.API.update(internaId,set);
        return res.data;
    }
    protected async doDelete(internaId:string): Promise<ApiResponse<BannerSliderSet>> {
        const res = await this.API.delete(internaId);
        return res.data;
    }
    protected async doInvalid(internaId:string,isInvalid:boolean): Promise<ApiResponse<BannerSliderSet>> {
        const res = await this.API.invalid(internaId,isInvalid);
        return res.data;
    }
    protected async doFetchData(internaId: string): Promise<ApiResponse<BannerSliderSet>> {
        const res = await this.API.queryData(internaId);
        return res.data;
    }
    protected async doFetchList(condition: QueryListCondition): Promise<ApiResponse<BannerSliderSet>> {
        const res = await this.API.queryList(condition);
        return res.data
    }
    protected async doFetchListCount(condition: QueryListCondition): Promise<ApiResponse<number>> {
        const res = await this.API.queryCount(condition);
        return res.data
    }
    protected async doGetModelDisplayName(): Promise<BannerSliderSet[]> {
        const res = await this.API.getModelDisplayName();
        return res
    }
}
const BannerSliderProvider = (): IBannerSliderProvider => IApiProvider<IBannerSliderProvider>(APIProvider, MockProvider);
export default BannerSliderProvider