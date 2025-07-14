import type { BreadCrumbData } from '../../../../../../SysCore/Components/BreadCrumb/BreadCrumb_Data';
import {IApiProvider, IDataProvider} from '../../../../../../SysCore/Interface/IApiProvider'
import { Link } from 'react-router-dom';

abstract class IBreadCrumbProvider extends IDataProvider<BreadCrumbData> {
  //#region Public
  async getBreadCrumbList(): Promise<BreadCrumbData[]> {
    const srcData = await this.fetchList();
    const processedData = this.setDOMContent(srcData)
    return processedData;
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
  protected doCreateData(): Promise<BreadCrumbData> {
      throw new Error('Method not implemented.');
    }
    protected doUpdateData(): Promise<BreadCrumbData> {
      throw new Error('Method not implemented.');
    }
    protected doDelete(): Promise<BreadCrumbData> {
      throw new Error('Method not implemented.');
    }
    protected doInvalid(): Promise<BreadCrumbData> {
      throw new Error('Method not implemented.');
    }
    protected doFetchData(): Promise<BreadCrumbData> {
      throw new Error('Method not implemented.');
    }
    protected doFetchList(): Promise<BreadCrumbData[]> {
      return Promise.resolve([
      { SrcData:"首頁", Url:"/index", },
      { SrcData:"網站功能", Url:"/Server/WebManagement", },
      { SrcData:"頁面", Url:"/Server/WebManagement/PageManage/List", },
      { SrcData:"頁面列表", Url:"/Server/WebManagement/PageManage/List", },
    ]);
    }
}

/** api資料-路徑導覽 */
class APIProvider extends IBreadCrumbProvider {
  protected doCreateData(): Promise<BreadCrumbData> {
      throw new Error('Method not implemented.');
    }
    protected doUpdateData(): Promise<BreadCrumbData> {
      throw new Error('Method not implemented.');
    }
    protected doDelete(): Promise<BreadCrumbData> {
      throw new Error('Method not implemented.');
    }
    protected doInvalid(): Promise<BreadCrumbData> {
      throw new Error('Method not implemented.');
    }
    protected doFetchData(): Promise<BreadCrumbData> {
      throw new Error('Method not implemented.');
    }
    protected doFetchList(): Promise<BreadCrumbData[]> {
      return Promise.resolve([
      { SrcData:"首頁", Url:"/index", },
      { SrcData:"網站功能", Url:"/Server/WebManagement", },
      { SrcData:"頁面", Url:"/Server/WebManagement/PageManage/List", },
      { SrcData:"頁面列表", Url:"/Server/WebManagement/PageManage/List", },
    ]);
    }
}

const getBreadCrumbProvider = (): IBreadCrumbProvider => IApiProvider<IBreadCrumbProvider>(APIProvider, MockProvider);
export default getBreadCrumbProvider
