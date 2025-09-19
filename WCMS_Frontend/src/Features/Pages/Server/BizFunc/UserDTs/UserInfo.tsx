import { useEffect, useState, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { FormComp } from '../../Scaffold/Content/Form_Comp';
import type { FormCompProp } from '../../Scaffold/Content/Content_Data';
import type { IBETheme } from "../../Theme/ITheme";
import { LibCheckBox, LibTextBox, LibCalendar, LibTinyMCE, LibPicturePreview, LibPicture, LibModal, LibFile, LibCheckBoxSingle, LibSwitch, LibDropList, LibUserCard, type LibTabsProp, type ILibSwitchItemProp } from "../../../../../SysCore/Components/FormField/LibFormField"
import TabContentComp from '../../../../../SysCore/Components/TabContent/TabContent';


export const UserManage_Comp = ({ theme }: { theme: IBETheme }) => {
  // console.log("theme.Tabs:", theme.Tabs);
  const isLoading: boolean[] = []
  const errors: (string | null | undefined)[] = []
  const prop: FormCompProp = { Title: "管理者帳號資料修改", Theme: theme, LoadingList: isLoading, ErrorList: errors, }

  const c: ILibSwitchItemProp[] = [{ itemId: "1", itemDisplayName: "選擇封面" }];
  const str: string[] = ["value"];

  const LibTabsPropA: LibTabsProp = {
    Style: theme.Tabs,
    item: {
      "Data": "管理者資料",
    }
  }

  const componentsA: Record<string, React.ReactNode[]> = {
    Data: [
      <LibTextBox Style={theme.TextBox} ColumnDisplayName="管理者帳號" DefaultInputDisplay="請輸入" ></LibTextBox>,
      <LibTextBox Style={theme.TextBox} ColumnDisplayName="中文名稱" DefaultInputDisplay="請輸入" ></LibTextBox>,
      <LibTextBox Style={theme.TextBox} ColumnDisplayName="英文名稱" DefaultInputDisplay="請輸入" ></LibTextBox>,
      <LibDropList Style={theme.DropList} ColumnDisplayName="管理者性別" ></LibDropList>,
      <LibTextBox Style={theme.TextBox} ColumnDisplayName="電子信箱" DefaultInputDisplay="請輸入" disabled></LibTextBox>,
      <LibDropList Style={theme.DropList} ColumnDisplayName="使用者權限" ></LibDropList>,
      <LibSwitch colDisplayName="帳號啟用" checkboxStyle="checkbox" value={str} options={c}></LibSwitch>
    ],
  }

  return (
    <FormComp prop={prop}>
      <div className="row">
        <div className="col-xl-3 col-lg-4 col-md-4 col-sm-4 col-12">
          <LibUserCard DisplayNameEN="Emma" DisplayNameTW="系統管理者名稱" DisplayRole="Administrator" PicSrc="../../../../../../../public/Legacy/Server/images/avatar/avatar_W_480x480.jpg"></LibUserCard>
        </div>
        <div className="col-xl-9 col-lg-8 col-md-8 col-sm-8 col-12">
          <TabContentComp libTabsProp={LibTabsPropA} components={componentsA}></TabContentComp>
        </div>
      </div>
    </FormComp>

  )
}

