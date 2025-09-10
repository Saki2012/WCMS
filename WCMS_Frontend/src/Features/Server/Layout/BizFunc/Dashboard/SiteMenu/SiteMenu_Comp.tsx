import React, { useRef, useState } from "react";
import Nestable from "react-nestable";
import type { RenderItem } from "react-nestable";
import "react-nestable/dist/styles/index.css";
import { FormComp } from "../../../Scaffold/Content/Form_Comp";
import type { FormCompProp } from "../../../Scaffold/Content/Content_Data";
import type { IBETheme } from "../../../Theme/ITheme";
import TabContentComp from "../../../../../../SysCore/Components/TabContent/TabContent";
import { LibCheckBox, LibDropList, LibSelectCard, LibTextBox, type ILibCheckItemProp, type LibTabsProp } from "../../../../../../SysCore/Components/FormField/LibFormField";
import { DividerComp } from "../../../../../../SysCore/Components/Divider/Divider_Comp";
import { Form_Toolbar } from "../../../../../../SysCore/Components/Toolbar/Toolbar_Comp";

export interface Item {
  id: number;
  text: string;
  children?: Item[];
}

const initialItems: Item[] = [
  {
    id: 1, text: "第一層 A1",
    children: [{
      id: 2, text: "第二層 B1",
      children: [{
        id: 3, text: "第三層 C1",
        children: [{
          id: 4, text: "第四層 D1",
          children: [
            { id: 5, text: "第五層 E1 第五層 E1 第五層 E1" }
          ]
        },
        { id: 6, text: "第四層 D2" }]
      },
      { id: 7, text: "第三層 C2" }]
    },
    { id: 8, text: "第二層 B2" }]
  },
  { id: 9, text: "第一層 A2" },
];

export const SiteMenu_Comp = ({ theme }: { theme: IBETheme }) => {
  const isLoading: boolean[] = []
  const errors: (string | null | undefined)[] = []
  const prop: FormCompProp = { Title: "網站功能", Theme: theme, LoadingList: isLoading, ErrorList: errors, }
  const c: ILibCheckItemProp[] = [{ itemId: "1", itemDisplayName: "版型 01" }, { itemId: "2", itemDisplayName: "版型 02" }, { itemId: "3", itemDisplayName: "版型 03" }, { itemId: "4", itemDisplayName: "版型 04" }];
  const str: string[] = ["value"];

  const [items, setItems] = useState<Item[]>(initialItems);
  const [collapseAll, setCollapseAll] = useState(false);
  const [selectedItemAdd, setSelectedItemAdd] = useState<Item | null>(null);
  const [selectedItemEdit, setSelectedItemEdit] = useState<Item | null>(null);

  const renderItem: RenderItem = ({ item, handler, collapseIcon }) => {
    const typedItem = item as Item; // 明確告訴 TS item 是 Item
    return (
      <div className="dd-item dd3-item">
        <div className="dd-handle dd3-handle"></div>
        <div className="dd3-content content_bar">
          {handler}
          {collapseIcon}
          <span style={{ flex: 1, padding: "0 10px 0 3px" }}>
            <i className="far fa-cogs mr-2"></i>
            {typedItem.text}
          </span>
          <div className="all-btn Edit Icon">
            <div className="icon" title="">
              <button title="查看前台" className="Ieye btn btn-ctm btn-ctm-rounded"><i className="far fa-eye"></i></button>
            </div>
            <div className="icon" title="">
              <button title="新增子層" className="Icogs btn btn-ctm btn-ctm-rounded" key={typedItem.id} onClick={() => {
                setSelectedItemAdd(typedItem);
                setSelectedItemEdit(null);
              }}>
                <i className="far fa-plus"></i></button>
            </div>
            {/* <div className="icon" title="">
              <button title="新增連結" className="Ilink btn btn-ctm btn-ctm-rounded"><i className="far fa-link"></i></button>
            </div> */}
            <div className="icon" title="">
              <button title="編輯" className="Ipencil btn btn-ctm btn-ctm-rounded" key={typedItem.id} onClick={() => {
                setSelectedItemEdit(typedItem);
                setSelectedItemAdd(null);
              }}><i className="far fa-edit"></i></button>
            </div>
            {/* <div className="icon" title="">
              <button title="版面配置" className="Iwindow btn btn-ctm btn-ctm-rounded"><i className="far fa-window-restore"></i></button>
            </div> */}
            <div className="icon" title="">
              <button
                title="刪除"
                className="Itrash btn btn-ctm btn-ctm-rounded"
                onClick={() => {
                  const deleteItem = (arr: Item[], id: number): Item[] =>
                    arr
                      .filter((i) => i.id !== id)
                      .map((i) => ({
                        ...i,
                        children: i.children ? deleteItem(i.children, id) : undefined,
                      }));
                  setItems(deleteItem(items, item.id));
                  setSelectedItemAdd(null);
                  setSelectedItemEdit(null);
                }}
                key={typedItem.id}
              >
                <i className="far fa-trash-alt"></i>
              </button>
            </div>

          </div>
        </div>
      </div>
    );
  };

  const renderRightBox = () => {
    if (selectedItemAdd && !selectedItemEdit) {
      return (
        <div className="addchild-box">
          <div className="panel">
            <div className="panel-body">
              <div className="card-header pt-1">
                <h3>
                  <i className="fas fa-align-left me-2"></i>
                  <span className="fw-bold text-primary">{selectedItemAdd.text}</span> - 新增子層
                </h3>
              </div>
              <div className="mt-4">
                <TabContentComp libTabsProp={LibTabsPropA} components={componentsA} />
                <TabContentComp libTabsProp={LibTabsPropB} components={componentsB} />
              </div>
              <div className="d-flex justify-content-center">
                <button type="button" className="btn btn-custom btn-rounded btn-sm mr-2 mb-2">儲存</button>
                <button type="button" className="btn btn-custom btn-rounded btn-sm mr-2 mb-2">取消</button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (selectedItemEdit && !selectedItemAdd) {
      return (
        <div className="edit-box">
          <div className="panel">
            <div className="panel-body">
              <div className="card-header pt-1">
                <h3>
                  <i className="fas fa-align-left me-2"></i>
                  <span className="fw-bold text-primary">{selectedItemEdit.text}</span> - 編輯
                </h3>
              </div>
              <div className="mt-4">
                <TabContentComp libTabsProp={LibTabsPropW} components={componentsW} />
              </div>
              <div className="d-flex justify-content-center">
                <button type="button" className="btn btn-custom btn-rounded btn-sm mr-2 mb-2">儲存</button>
                <button type="button" className="btn btn-custom btn-rounded btn-sm mr-2 mb-2">取消</button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 預設畫面
    return <div className="default-box"></div>;
  };

  const handleChange = ({ items }: any) => {
    if (!items) return;
    setItems(items);
  };

  const LibTabsPropB: LibTabsProp = {
    Style: theme.Tabs,
    item: { "zh-tw": "繁體中文", "en": "English", }
  }
  const componentsB: Record<string, React.ReactNode[]> = Object.entries(LibTabsPropB.item).reduce(
    (acc, [lang, label]) => {
      acc[lang] = generateLangFields(lang, label, theme);
      return acc;
    },
    {} as Record<string, React.ReactNode[]>
  );

  const LibTabsPropA: LibTabsProp = {
    Style: theme.Tabs,
    item: { "basic": "基本" }
  }
  const componentsA: Record<string, React.ReactNode[]> = {
    basic: [
      <LibTextBox Style={theme.TextBox} ColumnDisplayName="選單ID" DefaultInputDisplay="請輸入數字或英文，不可使用空白的"></LibTextBox>,
      <LibDropList Style={theme.DropList} ColumnDisplayName="新增方式"></LibDropList>, //選項：功能、連結
      <LibDropList Style={theme.DropList} ColumnDisplayName="頁面樣式"></LibDropList>, //選項：雙欄式、直瀑式 - 新增方式為 "功能" 會用到
    ]
  };

  const LibTabsPropW: LibTabsProp = {
    Style: theme.Tabs,
    item: { "basicSet": "基本設定", "layout": "版面配置" }
  }

  const componentsC: React.ReactNode[] = [
    <LibCheckBox value={str} options={c} checkboxStyle="radio" colDisplayName="版型選擇" />
  ];
  const componentsD: React.ReactNode[] = [
    <LibDropList Style={theme.DropList} ColumnDisplayName="輪播橫幅"></LibDropList>,
    <LibDropList Style={theme.DropList} ColumnDisplayName="廣告輪播"></LibDropList>
  ];
  const componentsE: React.ReactNode[] = [
    <LibDropList Style={theme.DropList} ColumnDisplayName="輪播橫幅"></LibDropList>,
    <LibDropList Style={theme.DropList} ColumnDisplayName="廣告輪播"></LibDropList>
  ];
  const componentsF: React.ReactNode[] = [
    <LibDropList Style={theme.DropList} ColumnDisplayName="頁面選擇"></LibDropList>,
  ];
  const componentsG: React.ReactNode[] = [
    <LibDropList Style={theme.DropList} ColumnDisplayName="相簿類別"></LibDropList>,
    <LibDropList Style={theme.DropList} ColumnDisplayName="相簿標籤"></LibDropList>,
    <LibDropList Style={theme.DropList} ColumnDisplayName="相簿數量"></LibDropList>,
  ];
  const componentsH: React.ReactNode[] = [
    <LibDropList Style={theme.DropList} ColumnDisplayName="檔案室類別"></LibDropList>,
    <LibDropList Style={theme.DropList} ColumnDisplayName="檔案室標籤"></LibDropList>,
    <LibDropList Style={theme.DropList} ColumnDisplayName="檔案室數量"></LibDropList>,
  ];
  const componentsI: React.ReactNode[] = [
    <LibDropList Style={theme.DropList} ColumnDisplayName="網路資源類別"></LibDropList>,
    <LibDropList Style={theme.DropList} ColumnDisplayName="網路資源標籤"></LibDropList>,
    <LibDropList Style={theme.DropList} ColumnDisplayName="網路資源數量"></LibDropList>,
  ];
  const componentsJ: React.ReactNode[] = [
    <LibDropList Style={theme.DropList} ColumnDisplayName="問卷留言類別"></LibDropList>,
    <LibDropList Style={theme.DropList} ColumnDisplayName="問卷留言數量"></LibDropList>,
  ];

  const componentsW: Record<string, React.ReactNode[]> = {
    basicSet: [
      <TabContentComp libTabsProp={LibTabsPropA} components={componentsA}></TabContentComp>,
      <TabContentComp libTabsProp={LibTabsPropB} components={componentsB}></TabContentComp>
    ],
    layout: [
      <LibSelectCard colDisplayName="前台版型" components={componentsC}></LibSelectCard>,
      <LibSelectCard colDisplayName="輪播設定" components={componentsD}></LibSelectCard>,
      <LibSelectCard colDisplayName="公告設定" components={componentsE}></LibSelectCard>,
      <LibSelectCard colDisplayName="頁面設定" components={componentsF}></LibSelectCard>,
      <LibSelectCard colDisplayName="相簿設定" components={componentsG}></LibSelectCard>,
      <LibSelectCard colDisplayName="檔案室設定" components={componentsH}></LibSelectCard>,
      <LibSelectCard colDisplayName="網路資源設定" components={componentsI}></LibSelectCard>,
      <LibSelectCard colDisplayName="問卷留言設定" components={componentsJ}></LibSelectCard>,
    ]
  };

  return (
    <FormComp prop={prop}>
      <div className="row">
        <div className="col-xxl-5 col-12 left-box">
          <div className="panel">
            <div className="panel-body">
              <div className="mb-2">
                <button onClick={() => setCollapseAll(!collapseAll)} className="btn btn-custom btn-rounded btn-sm mr-2 mb-2">
                  {collapseAll ? "展開" : "收合"}
                </button>
                <button type="button" className="btn btn-custom btn-rounded btn-sm mr-2 mb-2">儲存</button>
              </div>
              <div className="cf nestable-lists">
                <Nestable items={items || []} renderItem={renderItem} onChange={handleChange} className="dd-list" collapsed={collapseAll} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-xxl-7 col-12 right-box">
          {renderRightBox()}
        </div>

      </div>
    </FormComp>
  );
};

const generateLangFields = (lang: string, label: string, theme: IBETheme): React.ReactNode[] => {
  return [
    <LibTextBox key={`${lang}-Title`} Style={theme.TextBox} ColumnDisplayName={`網站標題（${label}）`} DefaultInputDisplay="請輸入" />,
    <LibTextBox key={`${lang}-Title`} Style={theme.TextBox} ColumnDisplayName={`連結網址（${label}）`} DefaultInputDisplay="請輸入" />, //新增方式為 "連結" 會用到
    <LibDropList Style={theme.DropList} ColumnDisplayName="開啟方式"></LibDropList>, //選項：當前視窗開啟、新視窗開啟
    <LibCheckBox colDisplayName="是否顯示於選單"></LibCheckBox>,
    <LibCheckBox colDisplayName="是否顯示於網站導覽"></LibCheckBox>,
  ];
};
