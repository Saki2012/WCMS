import { BaseApiService } from '../../../../../../SysCore/Utils/APIClient';
import  type { components } from "../../../../../../types/api";
import {IApiProvider, IDataProvider} from '../../../../../../SysCore/Interface/IApiProvider'

type PageManagementSet = components["schemas"]["PageManagementSet"]
type PageManagement = components["schemas"]["PageManagement"]


abstract class IPageManagementProvider extends IDataProvider<PageManagementSet> {
    /** 獲取導覽資料 */
    public override async createData(set:PageManagementSet): Promise<PageManagementSet> {
        const raw = await super.createData(set);
        console.log("處理新資料",raw);
        return raw;
    }

    public override async fetchList(param?: any):Promise<PageManagementSet[]>{
        const raw = await super.fetchList(param);
        this.SetDataStatusDOM(raw);
        return raw;
    }
    //#region 
    /** 設置DataStatus的顯示狀況(DOM) */
    private SetDataStatusDOM(set: PageManagementSet[]) {
        set.map((p, idx) => {
            switch (p.PageManagement.DataStatus) { 
            // 假設 p.value 是你要判斷的欄位
            // case 0:
            //     return <div key={idx} className="icon-small top-bg">置頂</div>;
            // case 1:
            //     return <div key={idx} className="icon-small new-bg">最新</div>;
                /**
                    <div class="all-state">
                        <div class="CustomState">
                            <div class="icon-small top-bg">置頂</div>
                            <div class="icon-small hot-bg">熱門</div>
                            <div class="icon-small new-bg">最新</div>
                            <div class="icon-small hide-bg">隱藏</div>
                        </div>
                    </div>
                 */
            }
        });
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
    protected doGetModelDisplayName(): Promise<PageManagementSet[]> {
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
    protected async doGetModelDisplayName(): Promise<PageManagementSet[]> {


        
        const res = await this.API.getModelDisplayName();
        return res
    }
}
const PageManagementProvider = (): IPageManagementProvider => IApiProvider<IPageManagementProvider>(APIProvider, MockProvider);
export default PageManagementProvider