import type { NaviData } from '../../../../../../SysCore/Components/NaviBar/NaviBar_Data';
import {IApiProvider, IDataProvider} from '../../../../../../SysCore/Interface/IApiProvider'
import {BaseCssIcon2} from "../../../../../../SysCore/Constants/icon/Base"
import {EnumMap} from "../../../../../../SysCore/Utils/LibData"

//#region Construct
abstract class INaviProvider extends IDataProvider<NaviData> {
  /** 獲取導覽資料 */
  //#region Public
  async getNaviBarList(): Promise<NaviData[]> {
    const srcData = await this.fetchList();
    const processedData = this.setDOMContent(srcData)
    return processedData;
  }
  //#endregion

  //#region Logic Function
  protected setDOMContent = (data: NaviData[]): NaviData[] => {

    const { getValue } = EnumMap(BaseCssIcon2);
    data.forEach((item,idx)=>{
      if(idx===0){
      item.DOMContent=
        <>
          <div className="nav-link"><h2><i className={`far ${getValue(item.Id)}`}></i>目前使用者 : <span className="ml-1">{item.SrcData}</span></h2></div>
        </>
      }
      else{
      item.DOMContent=
        <>
          <a className="nav-link" href={item.Url}><h2><i className={`far ${getValue(item.Id)}`}></i>{item.SrcData}</h2></a>
        </>
      }
    })
    return data;
  }
  //#endregion
}
class MockProvider extends INaviProvider {

  protected doCreateData(): Promise<NaviData> {
    throw new Error('Method not implemented.');
  }
  protected doUpdateData(): Promise<NaviData> {
    throw new Error('Method not implemented.');
  }
  protected doDelete(): Promise<NaviData> {
    throw new Error('Method not implemented.');
  }
  protected doInvalid(): Promise<NaviData> {
    throw new Error('Method not implemented.');
  }
  protected doFetchData(): Promise<NaviData> {
    throw new Error('Method not implemented.');
  }
  protected doFetchList(): Promise<NaviData[]> {
    return Promise.resolve([
      { Id:"A", SrcData:"Admin", Url:"", },
      { Id:"B", SrcData:"排版板模", Url:"/WebManagement", },
      { Id:"C", SrcData:"教師管理", Url:"/PageManage", },
      { Id:"D", SrcData:"會員管理", Url:"/PageList", },
      { Id:"E", SrcData:"產品管理", Url:"/PageList", },
      { Id:"F", SrcData:"網站功能", Url:"/PageList", },
      { Id:"G", SrcData:"帳號管理", Url:"/PageList", },
      { Id:"H", SrcData:"系統設定", Url:"/PageList", },
      { Id:"I", SrcData:"登出系統", Url:"/PageList", },
    ]);
  }
  protected doGetModelDisplayName(): Promise<[]>{
    throw new Error('Method not implemented.');
  }
}
class APIProvider extends INaviProvider {
  protected doCreateData(): Promise<NaviData> {
    throw new Error('Method not implemented.');
  }
  protected doUpdateData(): Promise<NaviData> {
    throw new Error('Method not implemented.');
  }
  protected doDelete(): Promise<NaviData> {
    throw new Error('Method not implemented.');
  }
  protected doInvalid(): Promise<NaviData> {
    throw new Error('Method not implemented.');
  }
  protected doFetchData(): Promise<NaviData> {
    throw new Error('Method not implemented.');
  }
  protected doFetchList(): Promise<NaviData[]> {
    return Promise.resolve([
      { Id:"A", SrcData:"Admin", Url:"", },
      { Id:"B", SrcData:"排版板模", Url:"/WebManagement", },
      { Id:"C", SrcData:"教師管理", Url:"/PageManage", },
      { Id:"D", SrcData:"會員管理", Url:"/PageList", },
      { Id:"E", SrcData:"產品管理", Url:"/PageList", },
      { Id:"F", SrcData:"網站功能", Url:"/PageList", },
      { Id:"G", SrcData:"帳號管理", Url:"/PageList", },
      { Id:"H", SrcData:"系統設定", Url:"/PageList", },
      { Id:"I", SrcData:"登出系統", Url:"/PageList", },
    ]);
  }
  protected doGetModelDisplayName(): Promise<[]>{
    throw new Error('Method not implemented.');
  }
}
const NaviProvider = (): INaviProvider => IApiProvider<INaviProvider>(APIProvider, MockProvider);
export default NaviProvider
//#endregion

//#region Logic Function

//#endregion