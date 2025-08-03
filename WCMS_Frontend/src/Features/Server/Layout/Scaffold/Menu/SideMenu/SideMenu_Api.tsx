import type { MenuItemData } from '../../../../../../SysCore/Components/MenuList/MenuList_Data';
import {IApiProvider, IDataProvider} from '../../../../../../SysCore/Interface/IApiProvider'
import {BaseCssIcon1} from "../../../../../../SysCore/Constants/icon/Base"
import {EnumMap} from "../../../../../../SysCore/Utils/LibData"
import type {EnumGetValueFunc} from "../../../../../../SysCore/Utils/LibData"
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

abstract class ISideMenuProvider extends IDataProvider<MenuItemData> {
  /** 獲取導覽資料 */
  //#region Public
  async fetchList(): Promise<MenuItemData[]> {
    const srcData = await super.fetchList()
    const processedData = this.setDOMContent(srcData)
    return processedData;
  }
  //#endregion
  //#region Logic Function
  protected setDOMContent = (data: MenuItemData[]): MenuItemData[] => {
    const { getValue } = EnumMap(BaseCssIcon1);
    data.forEach((item,idx)=>{
      if(idx===0) {
        item.DOMContent=this.setHeader(item.SrcData)
      }
      else {
        item.DOMContent=this.setDetail(item,getValue)
      }
      if(item.SubItem.length>0) {
        item.SubItem.forEach((sub)=>{sub.DOMContent=this.SetSubDetail(sub)})}
      }
  )
    return data;
  }
  protected setHeader=(title:string):ReactNode=>{
    return (
      <>
        <label>{title}</label>
        <span className="pc-micon">
          <i className={`fas ${BaseCssIcon1.More}`}></i>
        </span>
      </>
    )
  }
  protected setDetail=(item:MenuItemData, getValue: EnumGetValueFunc<typeof BaseCssIcon1>):ReactNode=>{
    return(
        <a href="#" className="pc-link" onClick={(e)=>{ e.preventDefault(); }}>
            <span className="pc-micon"> <i className={`fas ${getValue(item.Id,BaseCssIcon1.More)}`}></i> </span>                            
            <span className="pc-mtext"> {item.SrcData} </span>
            <span className="pc-arrow"> <i className="fas fa-chevron-right"></i> </span>
        </a>
    )
  }
  protected SetSubDetail=(subItem:MenuItemData):ReactNode=>{
    return(
        <Link to={subItem.Url} className="pc-link">{subItem.SrcData}</Link>
    )
  }
  //#endregion
}
class MockProvider extends ISideMenuProvider {
  protected doCreateData(): Promise<MenuItemData> {
    throw new Error('Method not implemented.');
  }
  protected doUpdateData(): Promise<MenuItemData> {
    throw new Error('Method not implemented.');
  }
  protected doDelete(): Promise<MenuItemData> {
    throw new Error('Method not implemented.');
  }
  protected doInvalid(): Promise<MenuItemData> {
    throw new Error('Method not implemented.');
  }
  protected doFetchData(): Promise<MenuItemData> {
    throw new Error('Method not implemented.');
  }
  protected doFetchList(): Promise<MenuItemData[]> {
    return Promise.resolve([
              { Id: "1", SrcData: "網站功能", Url: "WebManagement", SubItem: [] },
              { Id: "Carousel", SrcData: "廣告輪播", Url: "/Server", SubItem: [
                { Id: "2-1", SrcData: "列表", Url: "/Server", SubItem: [] },
                { Id: "2-2", SrcData: "廣告設定", Url: "/Server", SubItem: [] }
              ]},
              { Id: "Bullhorn", SrcData: "公告", Url: "Announcement", SubItem: [
                { Id: "3-1", SrcData: "新增", Url: "Announcement/New", SubItem: [] },
                { Id: "3-2", SrcData: "列表", Url: "Announcement/List", SubItem: [] },
                { Id: "3-3", SrcData: "類別", Url: "Announcement/Category", SubItem: [] },
                { Id: "3-4", SrcData: "標籤", Url: "Announcement/Tag", SubItem: [] }
              ]},
              { Id: "Page", SrcData: "頁面", Url: "PageManage", SubItem: [
                { Id: "4-1", SrcData: "新增", Url: "WebManagement/PageManage/AddNew", SubItem: [] },
                { Id: "4-2", SrcData: "頁面列表", Url: "WebManagement/PageManage/List", SubItem: [] },
                { Id: "4-3", SrcData: "類別", Url: "PageManage/Category", SubItem: [] },
                { Id: "4-4", SrcData: "標籤", Url: "PageManage/Tag", SubItem: [] }
              ]},
              { Id: "Image", SrcData: "相簿", Url: "Gallery", SubItem: [
                { Id: "5-1", SrcData: "新增", Url: "Gallery/New", SubItem: [] },
                { Id: "5-2", SrcData: "列表", Url: "Gallery/List", SubItem: [] },
                { Id: "5-3", SrcData: "類別", Url: "Gallery/Category", SubItem: [] },
                { Id: "5-4", SrcData: "標籤", Url: "Gallery/Tag", SubItem: [] }
              ]},
              { Id: "File", SrcData: "檔案室", Url: "FileManage", SubItem: [
                { Id: "6-1", SrcData: "新增", Url: "FileManage/New", SubItem: [] },
                { Id: "6-2", SrcData: "列表", Url: "FileManage/List", SubItem: [] },
                { Id: "6-3", SrcData: "類別", Url: "FileManage/Category", SubItem: [] },
                { Id: "6-4", SrcData: "標籤", Url: "FileManage/Tag", SubItem: [] }
              ]},
              { Id: "Link", SrcData: "網路資源", Url: "WebResource", SubItem: [
                { Id: "7-1", SrcData: "新增", Url: "WebResource/New", SubItem: [] },
                { Id: "7-2", SrcData: "列表", Url: "WebResource/List", SubItem: [] },
                { Id: "7-3", SrcData: "類別", Url: "WebResource/Category", SubItem: [] },
                { Id: "7-4", SrcData: "標籤", Url: "WebResource/Tag", SubItem: [] }
              ]},
              { Id: "Survey", SrcData: "問卷留言", Url: "Survey", SubItem: [] },
              { Id: "9", SrcData: "研討會", Url: "Conference", SubItem: [] },
              { Id: "10", SrcData: "研究計畫", Url: "Project", SubItem: [] },
              { Id: "11", SrcData: "USR計畫", Url: "USR", SubItem: [] }
            ]);
  }
  protected doGetModelDisplayName(): Promise<MenuItemData[]>{
    throw new Error('Method not implemented.');
  }
}
class APIProvider extends ISideMenuProvider {
  protected doCreateData(): Promise<MenuItemData> {
    throw new Error('Method not implemented.');
  }
  protected doUpdateData(): Promise<MenuItemData> {
    throw new Error('Method not implemented.');
  }
  protected doDelete(): Promise<MenuItemData> {
    throw new Error('Method not implemented.');
  }
  protected doInvalid(): Promise<MenuItemData> {
    throw new Error('Method not implemented.');
  }
  protected doFetchData(): Promise<MenuItemData> {
    throw new Error('Method not implemented.');
  }
  protected doFetchList(): Promise<MenuItemData[]> {
    return Promise.resolve([
              { Id: "1", SrcData: "網站功能", Url: "WebManagement", SubItem: [] },
              { Id: "Carousel", SrcData: "廣告輪播", Url: "WebManagement/BannerSlider", SubItem: [
                { Id: "2-1", SrcData: "列表", Url: "WebManagement/BannerSlider/List", SubItem: [] },
                { Id: "2-2", SrcData: "廣告設定", Url: "WebManagement/BannerSlider/Form", SubItem: [] }
              ]},
              { Id: "Bullhorn", SrcData: "公告", Url: "WebManagement/Announcement", SubItem: [
                { Id: "3-1", SrcData: "新增", Url: "WebManagement/Announcement/Form", SubItem: [] },
                { Id: "3-2", SrcData: "列表", Url: "WebManagement/Announcement/List", SubItem: [] },
                { Id: "3-3", SrcData: "類別", Url: "WebManagement/Announcement/Category", SubItem: [] },
                { Id: "3-4", SrcData: "標籤", Url: "WebManagement/Announcement/Tag", SubItem: [] }
              ]},
              { Id: "Page", SrcData: "頁面", Url: "WebManagement/PageManage", SubItem: [
                { Id: "4-1", SrcData: "新增", Url: "WebManagement/PageManage/Form", SubItem: [] },
                { Id: "4-2", SrcData: "頁面列表", Url: "WebManagement/PageManage/List", SubItem: [] },
                { Id: "4-3", SrcData: "類別", Url: "WebManagement/PageManage/Category", SubItem: [] },
              ]},
              { Id: "Image", SrcData: "相簿", Url: "WebManagement/Gallery", SubItem: [
                { Id: "5-1", SrcData: "新增", Url: "WebManagement/Gallery/Form", SubItem: [] },
                { Id: "5-2", SrcData: "列表", Url: "WebManagement/Gallery/List", SubItem: [] },
                { Id: "5-3", SrcData: "類別", Url: "WebManagement/Gallery/Category", SubItem: [] },
                { Id: "5-4", SrcData: "標籤", Url: "WebManagement/Gallery/Tag", SubItem: [] }
              ]},
              { Id: "File", SrcData: "檔案室", Url: "WebManagement/FileManage", SubItem: [
                { Id: "6-1", SrcData: "新增", Url: "WebManagement/FileManage/Form", SubItem: [] },
                { Id: "6-2", SrcData: "列表", Url: "WebManagement/FileManage/List", SubItem: [] },
                { Id: "6-3", SrcData: "類別", Url: "WebManagement/FileManage/Category", SubItem: [] },
                { Id: "6-4", SrcData: "標籤", Url: "WebManagement/FileManage/Tag", SubItem: [] }
              ]},
              { Id: "Link", SrcData: "網路資源", Url: "WebManagement/WebResource", SubItem: [
                { Id: "7-1", SrcData: "新增", Url: "WebManagement/WebResource/Form", SubItem: [] },
                { Id: "7-2", SrcData: "列表", Url: "WebManagement/WebResource/List", SubItem: [] },
                { Id: "7-3", SrcData: "類別", Url: "WebManagement/WebResource/Category", SubItem: [] },
                { Id: "7-4", SrcData: "標籤", Url: "WebManagement/WebResource/Tag", SubItem: [] }
              ]},
              { Id: "ResearchProj", SrcData: "研究計畫", Url: "ResearchProj", SubItem: [
                { Id: "10-1", SrcData: "新增", Url: "ResearchProj/Form", SubItem: [] },
                { Id: "10-2", SrcData: "列表", Url: "ResearchProj/List", SubItem: [] },
                { Id: "10-3", SrcData: "類別", Url: "ResearchProj/Category", SubItem: [] },
                { Id: "10-4", SrcData: "標籤", Url: "ResearchProj/Tag", SubItem: [] },
              ] },
              { Id: "USR", SrcData: "USR計畫", Url: "USR", SubItem: [
                  { Id: "11-1", SrcData: "新增", Url: "USR/Form", SubItem: [] },
                  { Id: "11-2", SrcData: "列表", Url: "USR/List", SubItem: [] },
                  { Id: "11-3", SrcData: "類別", Url: "USR/Category", SubItem: [] },
                  { Id: "11-4", SrcData: "標籤", Url: "USR/Tag", SubItem: [] },
              ] }
            ]);
  }
  protected doGetModelDisplayName(): Promise<MenuItemData[]>{
    throw new Error('Method not implemented.');
  }
}
const SideMenuProvider = (): ISideMenuProvider => IApiProvider<ISideMenuProvider>(APIProvider, MockProvider);
export default SideMenuProvider


