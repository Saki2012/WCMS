import { ImgListComp } from '../../Scaffold/Content/ImgList_Comp';
import type { ListCompProp } from '../../Scaffold/Content/Content_Data';
import type { IBETheme } from "../../Theme/ITheme";
import { LibCheckBox, LibTextBox, LibCalendar, LibTinyMCE, LibPicturePreview, LibPicture, LibModal, LibFile, LibCheckBoxSingle, LibSwitch, LibDropList, LibUserCard, type LibTabsProp, type ILibSwitchItemProp } from "../../../../../SysCore/Components/FormField/LibFormField"
import TabContentComp from '../../../../../SysCore/Components/TabContent/TabContent';
import { SearchComp, type SearchBarProps } from '../../../../../SysCore/Components/SearchBar/Searchbar_ForServer_Comp';
import { DividerComp } from '../../../../../SysCore/Components/Divider/Divider_Comp';
import { List_Toolbar } from '../../../../../SysCore/Components/Toolbar/Toolbar_Comp';
import { useLocation, Link } from 'react-router-dom';
import { useListToolbarActions } from '../../../../../SysCore/Components/Toolbar/Toolbar_Hook';
import { Paginator } from '../../../../../SysCore/Components/Paginator/Paginator_Comp';
import { useState } from 'react';


export const UserManageList_Comp = ({ theme }: { theme: IBETheme }) => {

  const dirUrl = useLocation().pathname.replace(/\/List$/, `/Form`);
  const useToolbar = useListToolbarActions(dirUrl)
  const isLoading: boolean[] = []
  const errors: (string | null | undefined)[] = []
  const searchProp: SearchBarProps = { title: "會員搜尋", subTitle: "搜尋會員... ", settingTitle: "搜尋設定" }
  const prop: ListCompProp = { Title: "會員管理", Theme: theme, LoadingList: isLoading, ErrorList: errors, Toolbar: useToolbar.toolbarActions, SearchBar: searchProp }

  const fake = [
    {
      name: "Emma",
      displayName: "系統管理者名稱",
      role: "Administrator",
      src: "../../../../../../../public/Legacy/Server/images/avatar/avatar_W_480x480.jpg",
    },
    {
      name: "Ann",
      displayName: "系統管理者名稱",
      role: "Administrator",
      src: "../../../../../../../public/Legacy/Server/images/avatar/avatar_W_480x480.jpg"
    },
    {
      name: "Cindy",
      displayName: "系統管理者名稱",
      role: "Administrator",
      src: "../../../../../../../public/Legacy/Server/images/avatar/avatar_W_480x480.jpg",
    },
    {
      name: "Harry",
      displayName: "系統管理者名稱",
      role: "Administrator",
      src: "../../../../../../../public/Legacy/Server/images/avatar/avatar_W_480x480.jpg"
    },
    {
      name: "Marry",
      displayName: "系統管理者名稱",
      role: "Administrator",
      src: "../../../../../../../public/Legacy/Server/images/avatar/avatar_W_480x480.jpg"
    }
  ];

  const [_, setCurrentPage] = useState(1);
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  }

  return (
    <ImgListComp prop={prop}>
      <div className="row">
        {fake.map((item, index) => (
          (index % 2 === 0) ?
            <div className="col-xl-3 col-lg-4 col-md-4 col-sm-4 col-12" key={index}>
              <LibUserCard DisplayNameEN={item.name} DisplayNameTW={item.displayName} DisplayRole={item.role} PicSrc={item.src} Style={theme.UserCard}
              />
            </div>
            :
            <div className="col-xl-3 col-lg-4 col-md-4 col-sm-4 col-12" key={index}>
              <LibUserCard DisplayNameEN={item.name} DisplayNameTW={item.displayName} DisplayRole={item.role} PicSrc={item.src} />
            </div>
        ))}
      </div>
      <Paginator currentPage={1} totalPages={10} onPageChange={handlePageChange} style={theme.Paginator}></Paginator>
    </ImgListComp>

  )
}

