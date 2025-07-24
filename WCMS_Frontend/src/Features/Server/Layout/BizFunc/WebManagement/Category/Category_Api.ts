import { BaseApiService } from '../../../../../../SysCore/Utils/APIClient';
import  type { components } from "../../../../../../types/api";
import {IApiProvider, IDataProvider} from '../../../../../../SysCore/Interface/IApiProvider'
import type { ApiResponse, QueryListCondition } from '../../../../../../SysCore/Interface/IApiProvider';

type CategorySet = components["schemas"]["CategoryDataSet"]
type CategoryDetail = components["schemas"]["CategoryDetail"]


abstract class ICategoryProvider extends IDataProvider<CategorySet> {
    
}

class MockProvider extends ICategoryProvider {
    protected doCreateData(): Promise<CategorySet> {
        throw new Error('Method not implemented.');
    }
    protected doUpdateData(): Promise<CategorySet> {
        throw new Error('Method not implemented.');
    }
    protected doDelete(): Promise<CategorySet> {
        throw new Error('Method not implemented.');
    }
    protected doInvalid(): Promise<CategorySet> {
        throw new Error('Method not implemented.');
    }
    protected doFetchData(): Promise<CategorySet> {
        throw new Error('Method not implemented.');
    }
    protected doFetchList(): Promise<CategorySet[]> {
        throw new Error('Method not implemented.');
    }
    protected doGetModelDisplayName(): Promise<CategorySet[]> {
        throw new Error('Method not implemented.');
    }
}
class APIProvider extends ICategoryProvider {
    private readonly ModuleName="Category"
    private readonly API= new BaseApiService<CategorySet>(this.ModuleName);

    protected async doCreateData(): Promise<CategorySet> {
        throw new Error('Method not implemented.');
        // const res = await this.API.create({ PageId: "example" });
        // console.log(res);
        // return res.data;
    }
    protected async doUpdateData(): Promise<CategorySet> {
        throw new Error('Method not implemented.');
        // const res = await this.API.update({ pk: "example" });
        // console.log(res);
        // return res.data;
    }
    protected async doDelete(): Promise<CategorySet> {
        throw new Error('Method not implemented.');
        // const res = await this.API.delete({ pk: "example" });
        // console.log(res);
        // return res.data;
    }
    protected async doInvalid(): Promise<CategorySet> {
        throw new Error('Method not implemented.');
        // const res = await this.API.delete({ pk: "example" });
        // console.log(res);
        // return res.data;
    }
    protected async doFetchData(params:any): Promise<CategorySet> {
        const res = await this.API.queryData(params);
        return res;
    }
    protected async doFetchList(condition: QueryListCondition): Promise<ApiResponse<CategorySet>> {
        const res = await this.API.queryList(condition);
        return res.data
    }
    protected async doGetModelDisplayName(): Promise<CategorySet[]> {
        const res = await this.API.getModelDisplayName();
        return res
    }
}
const CategoryProvider = (): ICategoryProvider => IApiProvider<ICategoryProvider>(APIProvider, MockProvider);
export default CategoryProvider