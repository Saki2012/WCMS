import type { NaviData } from '../../../../../../SysCore/Components/NaviBar/NaviBar_Data';
import {IApiProvider, IDataProvider} from '../../../../../../SysCore/Interface/IApiProvider'
import {BaseCssIcon2} from "../../../../../../SysCore/Constants/icon/Base"
import {EnumMap} from "../../../../../../SysCore/Utils/LibData"

//#region Construct
abstract class IBaseNaviProvider extends IDataProvider<NaviData> {
  /** 獲取導覽資料 */
  async getNaviBarList(): Promise<NaviData[]> {
    const srcData = await this.fetchData();
    const processedData = setDOMContent(srcData)
    return processedData;
  }
}
/** 假資料 */
class MockNaviProvider extends IBaseNaviProvider {
  protected async fetchData(): Promise<NaviData[]> {
    return [
      { Id:"A", SrcData:"Admin", Url:"", },
      { Id:"B", SrcData:"排版板模", Url:"/WebManagement", },
      { Id:"C", SrcData:"教師管理", Url:"/PageManage", },
      { Id:"D", SrcData:"會員管理", Url:"/PageList", },
      { Id:"E", SrcData:"產品管理", Url:"/PageList", },
      { Id:"F", SrcData:"網站功能", Url:"/PageList", },
      { Id:"G", SrcData:"帳號管理", Url:"/PageList", },
      { Id:"H", SrcData:"系統設定", Url:"/PageList", },
      { Id:"I", SrcData:"登出系統", Url:"/PageList", },
    ];
  }
}
class ApiNaviProvider extends IBaseNaviProvider {
  protected async fetchData(): Promise<NaviData[]> {
    const res = await fetch('/api/menu');
    return await res.json();
  }
}
const getNaviProvider = (): IBaseNaviProvider => IApiProvider<IBaseNaviProvider>(ApiNaviProvider, MockNaviProvider);
export default getNaviProvider
//#endregion

//#region Logic Function
/** 賦予DOM資料 */
const setDOMContent = (data: NaviData[]): NaviData[] => {

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