import type { BreadCrumbData } from '../../../../../../SysCore/Components/BreadCrumb/BreadCrumb_Data';
import {IApiProvider, IDataProvider} from '../../../../../../SysCore/Interface/IApiProvider'
import { Link } from 'react-router-dom';
import type { QueryListCondition,ApiResponse } from '../../../../../../SysCore/Interface/IApiProvider';
import type { ModelDisplaySchema } from '../../../../../../types/IApiSchema';

abstract class IBreadCrumbProvider extends IDataProvider<BreadCrumbData> {
  //#region Public
  override async fetchList(condition?: QueryListCondition): Promise<ApiResponse<BreadCrumbData[]>> {
    const srcData = await super.fetchList(condition);
    const processedData = this.setDOMContent(srcData.Data as BreadCrumbData[])
    return { ...srcData, Data: processedData };
  }
  //#endregion

  //#region Private
  protected setDOMContent = (data: BreadCrumbData[]): BreadCrumbData[] => {
    data.forEach((item,idx)=>{
      item.DOMContent=idx===data.length-1 ?<>{item.SrcData}</> :<Link to={item.Url}>{item.SrcData}</Link>
    })
  return data;
}
  //#endregion
}

/** 假資料-路徑導覽 */
class MockProvider extends IBreadCrumbProvider {
  protected doCreateData(set?: BreadCrumbData | undefined): Promise<ApiResponse<BreadCrumbData>> {
    throw new Error('Method not implemented.');
  }
  protected doUpdateData(internaId: string, set: BreadCrumbData): Promise<ApiResponse<BreadCrumbData>> {
    throw new Error('Method not implemented.');
  }
  protected doDelete(internaId: string): Promise<ApiResponse<BreadCrumbData>> {
    throw new Error('Method not implemented.');
  }
  protected doInvalid(internaId: string, isInvalid: boolean): Promise<ApiResponse<BreadCrumbData>> {
    throw new Error('Method not implemented.');
  }
  protected doFetchData(internaId?: string): Promise<ApiResponse<BreadCrumbData>> {
    throw new Error('Method not implemented.');
  }
  protected doFetchList(condition?: QueryListCondition): Promise<ApiResponse<BreadCrumbData[]>> {
    throw new Error('Method not implemented.');
  }
  protected doFetchListCount(condition?: QueryListCondition): Promise<ApiResponse<number>> {
    throw new Error('Method not implemented.');
  }
  protected doGetModelDisplayName(): Promise<ModelDisplaySchema> {
    throw new Error('Method not implemented.');
  }
  
}

/** api資料-路徑導覽 */
class APIProvider extends IBreadCrumbProvider {
  protected doCreateData(set?: BreadCrumbData | undefined): Promise<ApiResponse<BreadCrumbData>> {
    throw new Error('Method not implemented.');
  }
  protected doUpdateData(internaId: string, set: BreadCrumbData): Promise<ApiResponse<BreadCrumbData>> {
    throw new Error('Method not implemented.');
  }
  protected doDelete(internaId: string): Promise<ApiResponse<BreadCrumbData>> {
    throw new Error('Method not implemented.');
  }
  protected doInvalid(internaId: string, isInvalid: boolean): Promise<ApiResponse<BreadCrumbData>> {
    throw new Error('Method not implemented.');
  }
  protected doFetchData(internaId?: string): Promise<ApiResponse<BreadCrumbData>> {
    throw new Error('Method not implemented.');
  }
  protected doFetchList(condition?: QueryListCondition): Promise<ApiResponse<BreadCrumbData[]>> {
    const data:BreadCrumbData[]=[
      { SrcData:"首頁", Url:"/index", },
      { SrcData:"網站功能", Url:"/Server/WebManagement", },
      { SrcData:"頁面", Url:"/Server/WebManagement/PageManage/List", },
      { SrcData:"頁面列表", Url:"/Server/WebManagement/PageManage/List", },
    ]
    return Promise.resolve({ IsSuccess: true, SysMessage: [], Data: data, });
  }
  protected doFetchListCount(condition?: QueryListCondition): Promise<ApiResponse<number>> {
    throw new Error('Method not implemented.');
  }
  protected doGetModelDisplayName(): Promise<ModelDisplaySchema> {
    throw new Error('Method not implemented.');
  }
  
}

const getBreadCrumbProvider = (): IBreadCrumbProvider => IApiProvider<IBreadCrumbProvider>(APIProvider, MockProvider);
export default getBreadCrumbProvider
