import type { BreadCrumbData } from '../../../../../../SysCore/Components/BreadCrumb/BreadCrumb_Data';
import {IApiProvider, IDataProvider} from '../../../../../../SysCore/Interface/IApiProvider'

abstract class IBaseBreadCrumbProvider extends IDataProvider<BreadCrumbData> {
  async getBreadCrumbList(): Promise<BreadCrumbData[]> {
    const srcData = await this.fetchData();
    const processedData = setDOMContent(srcData)
    return processedData;
  }
}

/** 假資料-路徑導覽 */
class MockBreadCrumbProvider extends IBaseBreadCrumbProvider {
  protected async fetchData(): Promise<BreadCrumbData[]> {
    return [
      { SrcData:"首頁", Url:"/index", },
      { SrcData:"網站功能", Url:"/WebManagement", },
      { SrcData:"頁面", Url:"/PageManage", },
      { SrcData:"頁面列表", Url:"/PageList", },
    ];
  }
}

/** api資料-路徑導覽 */
class ApiBreadCrumbProvider extends IBaseBreadCrumbProvider {
  protected async fetchData(): Promise<BreadCrumbData[]> {
    const res = await fetch('/api/menu');
    return await res.json();
  }
}

/** 賦予DOM資料 */
const setDOMContent = (data: BreadCrumbData[]): BreadCrumbData[] => {
  data.forEach((item,idx)=>{
    item.DOMContent=idx===data.length-1 ?<>{item.SrcData}</> :<a href={item.Url}>{item.SrcData}</a>
  })
  return data;
}

const getBreadCrumbProvider = (): IBaseBreadCrumbProvider => IApiProvider<IBaseBreadCrumbProvider>(ApiBreadCrumbProvider, MockBreadCrumbProvider);
export default getBreadCrumbProvider
