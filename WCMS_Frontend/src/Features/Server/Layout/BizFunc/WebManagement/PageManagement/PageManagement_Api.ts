import { BaseApiService } from '../../../../../../SysCore/Utils/APIClient';
import  type { components } from "../../../../../..//types/api";
import {IApiProvider, IDataProvider} from '../../../../../../SysCore/Interface/IApiProvider'
import { Component } from 'react';

type PageManagementSet = components["schemas"]["PageManagementSet"]
type PageManagement = components["schemas"]["PageManagement"]


abstract class IPageManagementProvider extends IDataProvider<PageManagementSet> {
    /** 獲取導覽資料 */
    public async createData(): Promise<PageManagementSet> {

        const raw = await super.createData();
        console.log("處理新資料",raw);
        return raw;
    }
}
class MockProvider extends IPageManagementProvider {
    protected doCreateData(): Promise<PageManagementSet> {
        throw new Error('Method not implemented.');
    }
    protected doUpdateData(): Promise<PageManagementSet> {
        throw new Error('Method not implemented.');
    }
    protected doDelete(): Promise<PageManagementSet> {
        throw new Error('Method not implemented.');
    }
    protected doInvalid(): Promise<PageManagementSet> {
        throw new Error('Method not implemented.');
    }
    protected doFetchData(): Promise<PageManagementSet> {
        throw new Error('Method not implemented.');
    }
    protected doFetchList(): Promise<PageManagementSet[]> {
        throw new Error('Method not implemented.');
    }
}
class APIProvider extends IPageManagementProvider {
    private readonly ModuleName="PageManagement"
    private readonly API= new BaseApiService<PageManagementSet>(this.ModuleName);

    protected async doCreateData(): Promise<PageManagementSet> {
        throw new Error('Method not implemented.');
        // const res = await this.API.create({ PageId: "example" });
        // console.log(res);
        // return res.data;
    }
    protected async doUpdateData(): Promise<PageManagementSet> {
        throw new Error('Method not implemented.');
        // const res = await this.API.update({ pk: "example" });
        // console.log(res);
        // return res.data;
    }
    protected async doDelete(): Promise<PageManagementSet> {
        throw new Error('Method not implemented.');
        // const res = await this.API.delete({ pk: "example" });
        // console.log(res);
        // return res.data;
    }
    protected async doInvalid(): Promise<PageManagementSet> {
        throw new Error('Method not implemented.');
        // const res = await this.API.delete({ pk: "example" });
        // console.log(res);
        // return res.data;
    }
    protected async doFetchData(params:any): Promise<PageManagementSet> {
        const res = await this.API.queryData(params);
        return res;
    }
    protected async doFetchList(params:any): Promise<PageManagementSet[]> {
        const res = await this.API.queryList(params);
        return res
    }
}
const PageManagementProvider = (): IPageManagementProvider => IApiProvider<IPageManagementProvider>(APIProvider, MockProvider);
export default PageManagementProvider