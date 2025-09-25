import React, { useEffect, useState } from "react";
import Nestable from "react-nestable";
import type { RenderItem } from "react-nestable";
import "react-nestable/dist/styles/index.css";
import { FormComp } from "@/Features/Pages/Server/Scaffold/Content/Form_Comp";
import type { FormCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import TabContentComp from "@/SysCore/Components/TabContent/TabContent";
import { LibCheckBox, LibDropList, LibSelectCard, LibTextBox } from "@/SysCore/Components/FormField/LibFormField";
import type { LibTabsProp } from "@/SysCore/Components/FormField/FieldComponets/LibTabs_Comp";
import { useFetchFormData } from "@/SysCore/Utils/API/FetchFormData";
import { DefaultLang, useEnsureLangDetails, type Lang } from "@/SysCore/i18n/lang";
import * as SchemaFields from "@/types/SchemaFields";
import type { components } from "@/types/api";
import { useFetchGridListData } from "@/SysCore/Utils/API/FetchGridListData";
import { GetSiteMenuListOpt } from "@/Features/Hooks/BizFunc/Dashboard/SiteMenu/SiteInfo_Hook";
import SiteMenuProvider from "@/Features/Hooks/BizFunc/Dashboard/SiteMenu/SiteInfo_Api";
import { useFetchEnumOptions } from "@/SysCore/Utils/API/SystemAPI_Hook";
type SiteMenuSet = components["schemas"]["SiteMenuSet_DTO"]
const emptyData: SiteMenuSet = {}


interface Item {
  id: number;
  text: string;
  children?: Item[];
}

// const initialItems: Item[] = [
//   {
//     id: 1, text: "第一層 A1",
//     children: [{
//       id: 2, text: "第二層 B1",
//       children: [{
//         id: 3, text: "第三層 C1",
//         children: [{
//           id: 4, text: "第四層 D1",
//           children: [
//             { id: 5, text: "第五層 E1 第五層 E1 第五層 E1" }
//           ]
//         },
//         { id: 6, text: "第四層 D2" }]
//       },
//       { id: 7, text: "第三層 C2" }]
//     },
//     { id: 8, text: "第二層 B2" }]
//   },
//   { id: 9, text: "第一層 A2" },
// ];

const siteMenuInfo = (data: SiteMenuSet, lang: Lang): Item[] => {
  const items = data?.SiteMenu_Item ?? [];
  const titles = data?.SiteMenu_Item_Title?.filter(p => p.Lang === lang) ?? [];
  // 建立：itemRowId -> (lang -> title) 對照
  const titleDict = new Map<number, Map<string, string>>();
  for (const t of titles) {
    const itemRowId = (t as any).ItemRowId as number | undefined;
    if (!itemRowId) continue;
    const l = String((t as any).Lang ?? "").toLowerCase();
    const title = String((t as any).Title ?? "");
    if (!titleDict.has(itemRowId)) titleDict.set(itemRowId, new Map());
    titleDict.get(itemRowId)!.set(l, title);
  }

  // 方便排序：RowId -> DisplayOrder
  const orderMap = new Map<number, number>();

  // 先為每個項目建立節點
  const nodeMap = new Map<number, Item>();
  for (const it of items) {
    const rowId = Number((it as any).RowId);
    const displayOrder = Number((it as any).DisplayOrder ?? 0);
    orderMap.set(rowId, displayOrder);

    // 取得對應語系標題（fallback: zh-tw -> zh-TW -> 第一個）
    const langMap = titleDict.get(rowId);
    const text = (langMap?.get(lang)) ?? "";

    nodeMap.set(rowId, { id: rowId, text, children: [] });
  }

  // 串接 parent/children
  const roots: Item[] = [];
  for (const it of items) {
    const rowId = Number((it as any).RowId);
    const parentRowId = (it as any).ParentRowId as number | null | undefined;

    const node = nodeMap.get(rowId)!;
    if (parentRowId == null) {
      roots.push(node);
    }
    else {
      const parent = nodeMap.get(Number(parentRowId));
      if (parent) {
        (parent.children ?? (parent.children = [])).push(node);
      }
      else {
        // 萬一找不到父節點，退化到 root，避免資料遺失
        roots.push(node);
      }
    }
  }
  // 依 DisplayOrder 排序（含遞迴子節點）
  const sortRec = (list: Item[]) => {
    list.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));
    for (const n of list) if (n.children && n.children.length) sortRec(n.children);
  };
  sortRec(roots);
  return roots;
};

export const SiteMenu_Comp = (prop: { theme: IBETheme; lang: Lang }) => {
  const useSiteList = useFetchGridListData<SiteMenuSet>(GetSiteMenuListOpt());
  const internalId = useSiteList.rawData?.[0]?.SiteMenu_Index?.InternalId ?? ""
  // const useSiteInfo = useFetchFormData<SiteMenuSet>(SiteMenuProvider(), internalId, emptyData)
  const useSiteInfo = useFetchFormData<SiteMenuSet>(SiteMenuProvider(), "dda133d3-0932-4ee6-a745-9611dd0bcbb9", emptyData)

  const windowTarget = useFetchEnumOptions("WindowTarget")
  const menuUrlType = useFetchEnumOptions("MenuUrlType")
  const modulePageType = useFetchEnumOptions("ModulePageType")





  useEnsureLangDetails(useSiteInfo, { headerName: SchemaFields.SiteMenuSetFields.SiteMenu_Index, detailName: SchemaFields.SiteMenuSetFields.SiteMenu_IndexInfo, parentKeys: [SchemaFields.SiteMenu_IndexInfoFields.SiteIndex], preferFirstLang: prop.lang });
  useEnsureLangDetails(useSiteInfo, { headerName: SchemaFields.SiteMenuSetFields.SiteMenu_Item, detailName: SchemaFields.SiteMenuSetFields.SiteMenu_Item_Title, parentKeys: [SchemaFields.SiteMenu_Item_TitleFields.SiteIndex, SchemaFields.SiteMenu_Item_TitleFields.ItemRowId], preferFirstLang: prop.lang });
  const isLoading: any[] = []//[useSiteList.isLoading, useSiteInfo.isLoading]
  const errors: any[] = []//[useSiteList.error, useSiteInfo.error]
  const [selectedItemEdit, setSelectedItemEdit] = useState<Item | null>(null);
  const formProp: FormCompProp = { Title: "網站功能", Theme: prop.theme, LoadingList: isLoading, ErrorList: errors, }
  return (
    <FormComp prop={formProp}>
      <div className="row">
        <RenderLeftBox setSelectedItemEdit={setSelectedItemEdit} sitemenuSet={useSiteInfo.data} lang={prop.lang} />
        <RenderRightBox theme={prop.theme} selectedItemEdit={selectedItemEdit} />
      </div>
    </FormComp>
  );
};

//LeftBox
const RenderLeftBox = (prop: { setSelectedItemEdit: React.Dispatch<React.SetStateAction<Item | null>>; sitemenuSet: SiteMenuSet; lang: Lang }) => {
  const [collapseAll, setCollapseAll] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  useEffect(() => { setItems(siteMenuInfo(prop.sitemenuSet, prop.lang ?? DefaultLang)); }, [prop.sitemenuSet, prop.lang]);
  const renderItem: RenderItem = ({ item, handler, collapseIcon }) => {
    const typedItem = item as Item;
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
                prop.setSelectedItemEdit(typedItem);
              }}>
                <i className="far fa-plus"></i></button>
            </div>
            <div className="icon" title="">
              <button title="編輯" className="Ipencil btn btn-ctm btn-ctm-rounded" key={typedItem.id} onClick={() => {
                prop.setSelectedItemEdit(typedItem);
              }}><i className="far fa-edit"></i></button>
            </div>
            <div className="icon" title="">
              <button title="刪除" className="Itrash btn btn-ctm btn-ctm-rounded"
                onClick={() => {
                  const deleteItem = (arr: Item[], id: number): Item[] =>
                    arr
                      .filter((i) => i.id !== id)
                      .map((i) => ({
                        ...i,
                        children: i.children ? deleteItem(i.children, id) : undefined,
                      }));
                  setItems(deleteItem(items, item.id));
                  prop.setSelectedItemEdit(null);
                }}
                key={typedItem.id}>
                <i className="far fa-trash-alt"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  const handleChange = ({ items }: any) => {
    if (!items) return;
    setItems(items);
  };
  return (
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
  )
}

//RightBox
const RenderRightBox: React.FC<{ theme: IBETheme; selectedItemEdit: Item | null }> = ({ theme, selectedItemEdit }) => {
  // 1) 基本：功能連結（radio）→ 決定要顯示哪些分頁
  type LinkType = '功能' | '連結' | null;
  const [linkType, setLinkType] = React.useState<LinkType>(null);

  // 2) 模型配置：只顯示一種設定框
  type ModelKey = 'announce' | 'page' | 'gallery' | 'file' | 'webres' | null;
  const [modelKey, setModelKey] = React.useState<ModelKey>(null);

  // 3) 超連結設定：導向方式（0 外部連結 / 1 內部網站功能）→ 只顯示一個輸入框
  type NavType = 0 | 1 | null;
  const [navType, setNavType] = React.useState<NavType>(null);

  // ---- 語系分頁（維持原邏輯，包成 memo）----
  const LibTabsPropB: LibTabsProp = React.useMemo(() => ({ Style: theme.Tabs, item: { 'zh-tw': '繁體中文', en: 'English' } }), [theme]);

  const generateLangFields = React.useCallback(
    (lang: string, label: string): React.ReactNode[] => ([
      <LibTextBox key={`${lang}-Title`} Style={theme.TextBox} ColumnDisplayName={`網站標題（${label}）`} DefaultInputDisplay="請輸入" />
    ]),
    [theme],
  );

  const componentsB = React.useMemo(() => {
    return Object.entries(LibTabsPropB.item).reduce((acc, [lang, label]) => {
      acc[lang] = generateLangFields(lang, label as string);
      return acc;
    }, {} as Record<string, React.ReactNode[]>);
  }, [LibTabsPropB.item, generateLangFields]);

  // ---- 1) 依「功能 / 連結」決定主 Tabs ----
  const LibTabsPropA: LibTabsProp = React.useMemo(() => {
    const base = { basic: '基本' } as const;
    const module = { module: '模型配置' } as const;
    const url = { url: '超連結設定' } as const;

    return {
      Style: theme.Tabs,
      item:
        linkType === '功能' ? { ...base, ...module } :
          linkType === '連結' ? { ...base, ...url } :
            { ...base, ...module, ...url } // 未選時先顯示全部
    };
  }, [theme, linkType]);

  // ---- 2) 模型配置：只顯示一種設定卡 ----
  const moduleNodes: React.ReactNode[] = React.useMemo(() => {
    const nodes: React.ReactNode[] = [
      <LibCheckBox key="layout" ColumnDisplayName="頁面樣式" checkboxStyle="radio" />,
      <LibDropList key="model" Style={theme.DropList} ColumnDisplayName="功能模型"
      // 你的 LibDropList 事件名稱若不同，把 onChangeValue 換成你實際的
      // onChangeValue={(v: ModelKey) => setModelKey(v)}
      // value={modelKey ?? undefined}
      // options={[
      //   { value: 'banner', label: '輪播設定' },
      //   { value: 'announce', label: '公告設定' },
      //   { value: 'page', label: '頁面設定' },
      //   { value: 'gallery', label: '相簿設定' },
      //   { value: 'file', label: '檔案室設定' },
      //   { value: 'webres', label: '網路資源設定' },
      // ]}
      />,
      <LibSelectCard key="banner" colDisplayName="輪播設定" components={comp_banner(theme)} />,
    ];

    const map: Record<Exclude<ModelKey, null>, React.ReactNode[]> = {
      announce: comp_announce(theme),
      page: comp_page(theme),
      gallery: comp_gallery(theme),
      file: comp_fileArchive(theme),
      webres: comp_webRes(theme),
    };

    if (modelKey) {
      const label = { banner: '輪播設定', announce: '公告設定', page: '頁面設定', gallery: '相簿設定', file: '檔案室設定', webres: '網路資源設定', }[modelKey];
      nodes.push(<LibSelectCard key="onlyOne" colDisplayName={label} components={map[modelKey]} />);
    }
    return nodes;
  }, [theme, modelKey]);

  // ---- 3) 超連結設定：只顯示二擇一輸入 ----
  const urlNodes: React.ReactNode[] = React.useMemo(() => {
    const nodes: React.ReactNode[] = [
      <LibCheckBox key="nav" colDisplayName="導向方式" checkboxStyle="radio"
      // onChangeValue={(v: NavType) => setNavType(v)}
      // value={navType ?? undefined}
      // options={[
      //   { value: 0, label: '外部連結' },
      //   { value: 1, label: '網站內功能' },
      // ]}
      />,
    ];

    if (navType === 0)
      nodes.push(<LibTextBox key="ext" Style={theme.TextBox} ColumnDisplayName="外部連結" DefaultInputDisplay="請輸入數字或英文，不可使用空白的" />,);
    else if (navType === 1)
      nodes.push(<LibDropList key="int" Style={theme.DropList} ColumnDisplayName="網站內功能" />,);
    return nodes;
  }, [theme, navType]);

  // ---- 基本分頁：把「功能連結」做成 radio，切換時會改變主 Tabs ----
  const basicNodes: React.ReactNode[] = React.useMemo(() => ([
    <LibTextBox key="id" Style={theme.TextBox} ColumnDisplayName="選單ID" DefaultInputDisplay="請輸入數字或英文，不可使用空白的" />,
    <LibTextBox key="fullurl" Style={theme.TextBox} ColumnDisplayName="完整Url" DefaultInputDisplay="請輸入數字或英文，不可使用空白的" />,
    <LibCheckBox key="linktype" ColumnDisplayName="功能連結" checkboxStyle="radio"
    // onChangeValue={(v: LinkType) => setLinkType(v)}
    // value={linkType ?? undefined}
    // options={[
    //   { value: '功能', label: '功能' },
    //   { value: '連結', label: '連結' },
    // ]}
    />,
    <LibCheckBox key="open" ColumnDisplayName="開啟方式" checkboxStyle="radio" />,
    <LibCheckBox key="show" ColumnDisplayName="是否顯示於選單" />,
    <TabContentComp key="lang" tabInfos={LibTabsPropB} components={componentsB} />,
  ]), [theme, linkType, LibTabsPropB, componentsB]);

  // ---- 組合給 TabContentComp ----
  const componentsA = React.useMemo(() => ({
    basic: basicNodes,
    module: moduleNodes,
    url: urlNodes,
  }), [basicNodes, moduleNodes, urlNodes]);

  if (!selectedItemEdit) {
    return (
      <div className="col-xxl-7 col-12 right-box">
        <div className="default-box"></div>
      </div>
    );
  }

  return (
    <div className="col-xxl-7 col-12 right-box">
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
              <TabContentComp tabInfos={LibTabsPropA} components={componentsA} />
            </div>
            <div className="d-flex justify-content-center">
              <button type="button" className="btn btn-custom btn-rounded btn-sm mr-2 mb-2">儲存</button>
              <button type="button" className="btn btn-custom btn-rounded btn-sm mr-2 mb-2">取消</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


//#region 基本設定
const BasicSettingTab = () => {
  return <></>
}
//#endregion


//#region 模型配置

const ModuleSettingTab = () => {

}

const comp_banner = (theme: IBETheme): React.ReactNode[] => [
  <LibDropList Style={theme.DropList} ColumnDisplayName="輪播橫幅"></LibDropList>,
];
const comp_announce = (theme: IBETheme): React.ReactNode[] => [
  <LibCheckBox ColumnDisplayName="類別"></LibCheckBox>,
  <LibCheckBox ColumnDisplayName="標籤"></LibCheckBox>,
  <LibDropList Style={theme.DropList} ColumnDisplayName="清單樣式"></LibDropList>
];
const comp_page = (theme: IBETheme): React.ReactNode[] => [
  <LibDropList Style={theme.DropList} ColumnDisplayName="頁面選擇"></LibDropList>,
];
const comp_gallery = (theme: IBETheme): React.ReactNode[] => [
  <LibCheckBox ColumnDisplayName="類別"></LibCheckBox>,
  <LibCheckBox ColumnDisplayName="標籤"></LibCheckBox>,
  <LibDropList Style={theme.DropList} ColumnDisplayName="清單樣式"></LibDropList>
];
const comp_fileArchive = (theme: IBETheme): React.ReactNode[] => [
  <LibCheckBox ColumnDisplayName="類別"></LibCheckBox>,
  <LibCheckBox ColumnDisplayName="標籤"></LibCheckBox>,
  <LibDropList Style={theme.DropList} ColumnDisplayName="清單樣式"></LibDropList>
];
const comp_webRes = (theme: IBETheme): React.ReactNode[] => [
  <LibCheckBox ColumnDisplayName="類別"></LibCheckBox>,
  <LibCheckBox ColumnDisplayName="標籤"></LibCheckBox>,
  <LibDropList Style={theme.DropList} ColumnDisplayName="清單樣式"></LibDropList>
];
//#endregion

//#region  超連結設定
const HyperlinkSettingTab = () => {

}
//#endregion