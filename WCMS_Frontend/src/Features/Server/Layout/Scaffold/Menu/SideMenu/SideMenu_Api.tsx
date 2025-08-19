import type { MenuItemData } from '../../../../../../SysCore/Components/MenuList/MenuList_Data';
import { IApiProvider, IDataProvider } from '../../../../../../SysCore/Interface/IApiProvider'
import { BaseCssIcon1 } from "../../../../../../SysCore/Constants/icon/Base"
import { EnumMap } from "../../../../../../SysCore/Utils/LibData"
import type { EnumGetValueFunc } from "../../../../../../SysCore/Utils/LibData"
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { QueryListCondition, ApiResponse } from '../../../../../../SysCore/Interface/IApiProvider';
import type { ModelDisplaySchema } from '../../../../../../types/IApiSchema';

abstract class ISideMenuProvider extends IDataProvider<MenuItemData> {
  /** 獲取導覽資料 */
  //#region Public
  override async fetchList(condition?: QueryListCondition): Promise<ApiResponse<MenuItemData[]>> {
    const srcData = await super.fetchList(condition)
    const processedData = this.setDOMContent(srcData.Data as MenuItemData[])
    return { ...srcData, Data: processedData };
  }
  //#endregion
  //#region Logic Function
  protected setDOMContent = (data: MenuItemData[]): MenuItemData[] => {
    const { getValue } = EnumMap(BaseCssIcon1);
    data.forEach((item, idx) => {
      if (idx === 0) {
        item.DOMContent = this.setHeader(item.SrcData)
      }
      else {
        item.DOMContent = this.setDetail(item, getValue)
      }
      if (item.SubItem.length > 0) {
        item.SubItem.forEach((sub) => { sub.DOMContent = this.SetSubDetail(sub) })
      }
    }
    )
    return data;
  }
  protected setHeader = (title: string): ReactNode => {
    return (
      <>
        <label>{title}</label>
        <span className="pc-micon">
          <i className={`fas ${BaseCssIcon1.More}`}></i>
        </span>
      </>
    )
  }
  protected setDetail = (item: MenuItemData, getValue: EnumGetValueFunc<typeof BaseCssIcon1>): ReactNode => {
    return (
      <a href="#" className="pc-link" onClick={(e) => { e.preventDefault(); }}>
        <span className="pc-micon"> <i className={`fas ${getValue(item.Id, BaseCssIcon1.More)}`}></i> </span>
        <span className="pc-mtext"> {item.SrcData} </span>
        <span className="pc-arrow"> <i className="fas fa-chevron-right"></i> </span>
      </a>
    )
  }
  protected SetSubDetail = (subItem: MenuItemData): ReactNode => {
    return (
      <Link to={subItem.Url} className="pc-link">{subItem.SrcData}</Link>
    )
  }
  //#endregion
}
class MockProvider extends ISideMenuProvider {
  protected doCreateData(set?: MenuItemData | undefined): Promise<ApiResponse<MenuItemData>> {
    throw new Error('Method not implemented.');
  }
  protected doUpdateData(internaId: string, set: MenuItemData): Promise<ApiResponse<MenuItemData>> {
    throw new Error('Method not implemented.');
  }
  protected doDelete(internaId: string): Promise<ApiResponse<MenuItemData>> {
    throw new Error('Method not implemented.');
  }
  protected doInvalid(internaId: string, isInvalid: boolean): Promise<ApiResponse<MenuItemData>> {
    throw new Error('Method not implemented.');
  }
  protected doFetchData(internaId?: string): Promise<ApiResponse<MenuItemData>> {
    throw new Error('Method not implemented.');
  }
  protected doFetchList(condition?: QueryListCondition): Promise<ApiResponse<MenuItemData[]>> {
    throw new Error('Method not implemented.');
  }
  protected doFetchListCount(condition?: QueryListCondition): Promise<ApiResponse<number>> {
    throw new Error('Method not implemented.');
  }
  protected doGetModelDisplayName(): Promise<ModelDisplaySchema> {
    throw new Error('Method not implemented.');
  }

}
class APIProvider extends ISideMenuProvider {
  protected doCreateData(set?: MenuItemData | undefined): Promise<ApiResponse<MenuItemData>> {
    throw new Error('Method not implemented.');
  }
  protected doUpdateData(internaId: string, set: MenuItemData): Promise<ApiResponse<MenuItemData>> {
    throw new Error('Method not implemented.');
  }
  protected doDelete(internaId: string): Promise<ApiResponse<MenuItemData>> {
    throw new Error('Method not implemented.');
  }
  protected doInvalid(internaId: string, isInvalid: boolean): Promise<ApiResponse<MenuItemData>> {
    throw new Error('Method not implemented.');
  }
  protected doFetchData(internaId?: string): Promise<ApiResponse<MenuItemData>> {
    throw new Error('Method not implemented.');
  }
  protected doFetchListCount(condition?: QueryListCondition): Promise<ApiResponse<number>> {
    throw new Error('Method not implemented.');
  }
  protected doGetModelDisplayName(): Promise<ModelDisplaySchema> {
    throw new Error('Method not implemented.');
  }

  protected doFetchList(): Promise<ApiResponse<MenuItemData[]>> {
    const data: MenuItemData[] = [
      { Id: "1", SrcData: "網站功能", Url: "WebManagement", SubItem: [] },
      {
        Id: "Carousel", SrcData: "廣告輪播", Url: "WebManagement/BannerSlider", SubItem: [
          { Id: "2-1", SrcData: "列表", Url: "WebManagement/BannerSlider/List", SubItem: [] },
          { Id: "2-2", SrcData: "廣告設定", Url: "WebManagement/BannerSlider/Form", SubItem: [] }
        ]
      },
      {
        Id: "Bullhorn", SrcData: "公告", Url: "WebManagement/Announcement", SubItem: [
          { Id: "3-1", SrcData: "新增", Url: "WebManagement/Announcement/Form", SubItem: [] },
          { Id: "3-2", SrcData: "列表", Url: "WebManagement/Announcement/List", SubItem: [] },
          { Id: "3-3", SrcData: "類別", Url: "WebManagement/Announcement/Category", SubItem: [] },
          { Id: "3-4", SrcData: "標籤", Url: "WebManagement/Announcement/Tag", SubItem: [] }
        ]
      },
      {
        Id: "Page", SrcData: "頁面", Url: "WebManagement/PageManage", SubItem: [
          { Id: "4-1", SrcData: "新增", Url: "WebManagement/PageManage/Form", SubItem: [] },
          { Id: "4-2", SrcData: "頁面列表", Url: "WebManagement/PageManage/List", SubItem: [] },
          { Id: "4-3", SrcData: "類別", Url: "WebManagement/PageManage/Category", SubItem: [] },
        ]
      },
      {
        Id: "Image", SrcData: "相簿", Url: "WebManagement/Gallery", SubItem: [
          { Id: "5-1", SrcData: "新增", Url: "WebManagement/Gallery/Form", SubItem: [] },
          { Id: "5-2", SrcData: "列表", Url: "WebManagement/Gallery/List", SubItem: [] },
          { Id: "5-3", SrcData: "類別", Url: "WebManagement/Gallery/Category", SubItem: [] },
          { Id: "5-4", SrcData: "標籤", Url: "WebManagement/Gallery/Tag", SubItem: [] }
        ]
      },
      {
        Id: "File", SrcData: "檔案室", Url: "WebManagement/FileManage", SubItem: [
          { Id: "6-1", SrcData: "新增", Url: "WebManagement/FileManage/Form", SubItem: [] },
          { Id: "6-2", SrcData: "列表", Url: "WebManagement/FileManage/List", SubItem: [] },
          { Id: "6-3", SrcData: "類別", Url: "WebManagement/FileManage/Category", SubItem: [] },
          { Id: "6-4", SrcData: "標籤", Url: "WebManagement/FileManage/Tag", SubItem: [] }
        ]
      },
      {
        Id: "Link", SrcData: "網路資源", Url: "WebManagement/WebResource", SubItem: [
          { Id: "7-1", SrcData: "新增", Url: "WebManagement/WebResource/Form", SubItem: [] },
          { Id: "7-2", SrcData: "列表", Url: "WebManagement/WebResource/List", SubItem: [] },
          { Id: "7-3", SrcData: "類別", Url: "WebManagement/WebResource/Category", SubItem: [] },
          { Id: "7-4", SrcData: "標籤", Url: "WebManagement/WebResource/Tag", SubItem: [] }
        ]
      },
      {
        Id: "ResearchProj", SrcData: "研究計畫", Url: "WebManagement/ResearchProj", SubItem: [
          { Id: "10-1", SrcData: "新增", Url: "WebManagement/ResearchProj/Form", SubItem: [] },
          { Id: "10-2", SrcData: "列表", Url: "WebManagement/ResearchProj/List", SubItem: [] },
          { Id: "10-3", SrcData: "類別", Url: "WebManagement/ResearchProj/Category", SubItem: [] },
          { Id: "10-4", SrcData: "標籤", Url: "WebManagement/ResearchProj/Tag", SubItem: [] },
        ]
      },
      {
        Id: "USR", SrcData: "USR計畫", Url: "WebManagement/USR", SubItem: [
          { Id: "11-1", SrcData: "新增", Url: "WebManagement/USR/Form", SubItem: [] },
          { Id: "11-2", SrcData: "列表", Url: "WebManagement/USR/List", SubItem: [] },
          { Id: "11-3", SrcData: "類別", Url: "WebManagement/USR/Category", SubItem: [] },
          { Id: "11-4", SrcData: "標籤", Url: "WebManagement/USR/Tag", SubItem: [] },
        ]
      }
    ];
    return Promise.resolve({ IsSuccess: true, SysMessage: [], Data: data, });
  }

}
const SideMenuProvider = (): ISideMenuProvider => IApiProvider<ISideMenuProvider>(APIProvider, MockProvider);
export default SideMenuProvider


