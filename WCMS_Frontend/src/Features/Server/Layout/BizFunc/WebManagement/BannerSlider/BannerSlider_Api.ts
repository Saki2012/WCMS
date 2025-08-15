import { BaseApiService } from '../../../../../../SysCore/Utils/APIClient';
import  type { components } from "../../../../../../types/api";
import {IApiProvider, IDataProvider} from '../../../../../../SysCore/Interface/IApiProvider'
import type { ApiResponse, QueryListCondition } from '../../../../../../SysCore/Interface/IApiProvider';
import type { ModelDisplaySchema } from '../../../../../../types/IApiSchema';
type BannerSliderSet = components["schemas"]["BannerSet"]


abstract class IBannerSliderProvider extends IDataProvider<BannerSliderSet> { }
class MockProvider extends IBannerSliderProvider {
    protected doCreateData(set?: { Banner?: components['schemas']['Banner']; BannerDetail?: components['schemas']['BannerDetail'][] | null; BannerDetailInfo?: components['schemas']['BannerDetailInfo'][] | null; } | undefined): Promise<ApiResponse<{ Banner?: components['schemas']['Banner']; BannerDetail?: components['schemas']['BannerDetail'][] | null; BannerDetailInfo?: components['schemas']['BannerDetailInfo'][] | null; }>> {
        throw new Error('Method not implemented.');
    }
    protected doUpdateData(internaId: string, set: { Banner?: components['schemas']['Banner']; BannerDetail?: components['schemas']['BannerDetail'][] | null; BannerDetailInfo?: components['schemas']['BannerDetailInfo'][] | null; }): Promise<ApiResponse<{ Banner?: components['schemas']['Banner']; BannerDetail?: components['schemas']['BannerDetail'][] | null; BannerDetailInfo?: components['schemas']['BannerDetailInfo'][] | null; }>> {
        throw new Error('Method not implemented.');
    }
    protected doDelete(internaId: string): Promise<ApiResponse<{ Banner?: components['schemas']['Banner']; BannerDetail?: components['schemas']['BannerDetail'][] | null; BannerDetailInfo?: components['schemas']['BannerDetailInfo'][] | null; }>> {
        throw new Error('Method not implemented.');
    }
    protected doInvalid(internaId: string, isInvalid: boolean): Promise<ApiResponse<{ Banner?: components['schemas']['Banner']; BannerDetail?: components['schemas']['BannerDetail'][] | null; BannerDetailInfo?: components['schemas']['BannerDetailInfo'][] | null; }>> {
        throw new Error('Method not implemented.');
    }
    protected doFetchData(internaId?: string): Promise<ApiResponse<{ Banner?: components['schemas']['Banner']; BannerDetail?: components['schemas']['BannerDetail'][] | null; BannerDetailInfo?: components['schemas']['BannerDetailInfo'][] | null; }>> {
        throw new Error('Method not implemented.');
    }
    protected doFetchList(condition?: QueryListCondition): Promise<ApiResponse<{ Banner?: components['schemas']['Banner']; BannerDetail?: components['schemas']['BannerDetail'][] | null; BannerDetailInfo?: components['schemas']['BannerDetailInfo'][] | null; }[]>> {
        throw new Error('Method not implemented.');
    }
    protected doFetchListCount(condition?: QueryListCondition): Promise<ApiResponse<number>> {
        throw new Error('Method not implemented.');
    }
    protected doGetModelDisplayName(): Promise<ModelDisplaySchema> {
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
    protected async doFetchList(condition: QueryListCondition): Promise<ApiResponse<BannerSliderSet[]>> {
        const res = await this.API.queryList(condition);
        return res.data
    }
    protected async doFetchListCount(condition: QueryListCondition): Promise<ApiResponse<number>> {
        const res = await this.API.queryCount(condition);
        return res.data
    }
    protected async doGetModelDisplayName(): Promise<ModelDisplaySchema> {
        const res = await this.API.getModelDisplayName();
        return res
    }
}
const BannerSliderProvider = (): IBannerSliderProvider => IApiProvider<IBannerSliderProvider>(APIProvider, MockProvider);
export default BannerSliderProvider