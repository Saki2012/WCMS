import { BaseApiService } from '../../../../../../SysCore/Utils/APIClient';
import {PageManagement_View} from "./PageManagement_Data"
import {IApiProvider, IDataProvider} from '../../../../../../SysCore/Interface/IApiProvider'


abstract class IPageManagementProvider extends IDataProvider<PageManagement_View> {
  /** 獲取導覽資料 */
    public async createData(): Promise<PageManagement_View> {
        const raw = await super.createData();
        console.log("處理新資料",raw);
        return raw;
    }
}
class MockProvider extends IPageManagementProvider {
    protected doCreateData(): Promise<PageManagement_View> {
        throw new Error('Method not implemented.');
    }
    protected doUpdateData(): Promise<PageManagement_View> {
        throw new Error('Method not implemented.');
    }
    protected doDelete(): Promise<PageManagement_View> {
        throw new Error('Method not implemented.');
    }
    protected doInvalid(): Promise<PageManagement_View> {
        throw new Error('Method not implemented.');
    }
    protected doFetchData(): Promise<PageManagement_View> {
        throw new Error('Method not implemented.');
    }
    protected doFetchList(): Promise<PageManagement_View[]> {
        throw new Error('Method not implemented.');
    }
}
class APIProvider extends IPageManagementProvider {
    private readonly ModuleName="PageManagement"
    private readonly API= new BaseApiService<PageManagement_View>(this.ModuleName);

    protected async doCreateData(): Promise<PageManagement_View> {
        throw new Error('Method not implemented.');
        // const res = await this.API.create({ PageId: "example" });
        // console.log(res);
        // return res.data;
    }
    protected async doUpdateData(): Promise<PageManagement_View> {
        throw new Error('Method not implemented.');
        // const res = await this.API.update({ pk: "example" });
        // console.log(res);
        // return res.data;
    }
    protected async doDelete(): Promise<PageManagement_View> {
        throw new Error('Method not implemented.');
        // const res = await this.API.delete({ pk: "example" });
        // console.log(res);
        // return res.data;
    }
    protected async doInvalid(): Promise<PageManagement_View> {
        throw new Error('Method not implemented.');
        // const res = await this.API.delete({ pk: "example" });
        // console.log(res);
        // return res.data;
    }
    protected async doFetchData(params:any): Promise<PageManagement_View> {
        const res = await this.API.queryData(params);
        return PageManagement_View.parse(res);
    }
    protected async doFetchList(params:any): Promise<PageManagement_View[]> {
        throw new Error('Method not implemented.');
    }
}
const PageManagementProvider = (): IPageManagementProvider => IApiProvider<IPageManagementProvider>(APIProvider, MockProvider);
export default PageManagementProvider