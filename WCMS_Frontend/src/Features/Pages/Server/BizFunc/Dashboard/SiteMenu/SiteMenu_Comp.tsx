import React, { useEffect, useState } from "react";
import Nestable from "react-nestable";
import type { RenderItem } from "react-nestable";
import { FormComp } from "@/Features/Pages/Server/Scaffold/Content/Form_Comp";
import type { FormCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import TabContentComp from "@/SysCore/Components/TabContent/TabContent";
import { LibCheckBox, LibDropList, LibSelectCard, LibTextBox } from "@/SysCore/Components/FormField/LibFormField";
import type { LibTabsProp } from "@/SysCore/Components/FormField/FieldComponets/LibTabs_Comp";
import { useFetchFormData, type UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import { DefaultLang, LangLabelMap, useEnsureLangDetails, type Lang } from "@/SysCore/i18n/lang";
import * as SchemaFields from "@/types/SchemaFields";
import type { components } from "@/types/api";
import { useFetchGridListData } from "@/SysCore/Utils/API/FetchGridListData";
import { GetBannerListOpt, GetSiteMenuListOpt } from "@/Features/Hooks/BizFunc/Dashboard/SiteMenu/SiteInfo_Hook";
import SiteMenuProvider from "@/Features/Hooks/BizFunc/Dashboard/SiteMenu/SiteInfo_Api";
import { useFetchEnumOptions } from "@/SysCore/Utils/API/SystemAPI_Hook";
import { useSetJsonField, useSetTableField } from "@/SysCore/Components/FormField/useSetTableField";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import "react-nestable/dist/styles/index.css";
import { useCategoryListData, useGetCategoryListByProgId } from "@/Features/Hooks/BizFunc/WebManagement/Category/Category_Hook";
import { useGetTagListByProgId, useTagListData } from "@/Features/Hooks/BizFunc/WebManagement/Tags/Tag_Hook";
type SiteMenuSet = components["schemas"]["SiteMenuSet_DTO"]
type SiteMenu_Item = components["schemas"]["SiteMenu_Item_DTO"]
type SiteMenu_Item_Title = components["schemas"]["SiteMenu_Item_Title_DTO"]
type SiteMenu_Item_Module = components["schemas"]["SiteMenu_Item_Module_DTO"]
type SiteMenu_Item_Url = components["schemas"]["SiteMenu_Item_Url_DTO"]
type MenuUrlType = components["schemas"]["MenuUrlType"]
type WindowTarget = components["schemas"]["WindowTarget"]
type ModulePageType = components["schemas"]["ModulePageType"]
type BannerSet = components["schemas"]["BannerSet_DTO"]

const emptyData: SiteMenuSet = {}

interface ModuleOptionsJson {
  PageId: string;
  Category: string; // "3,4,5"
  Tag: string;      // "10,12"
  Style: number;    // 1
}

const moduleOptionsDefaults: ModuleOptionsJson = {
  PageId: "",
  Category: "",
  Tag: "",
  Style: 1
};
type ModelKey = '' | 'Announcement' | 'FileArchive' | 'Gallery' | 'PageManagement' | 'SpecResearch' | 'SpecUSR' | 'WebResource'


interface Item {
  id: number;
  text: string;
  MenuItem: {
    Item: SiteMenu_Item,
    Title: SiteMenu_Item_Title[],
    Module: SiteMenu_Item_Module,
    Url: SiteMenu_Item_Url,
  }
  children?: Item[];
}

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
    nodeMap.set(rowId, {
      id: rowId, text: text,
      MenuItem: {
        Item: it,
        Title: data?.SiteMenu_Item_Title?.filter(p => p.SiteIndex === it.SiteIndex && p.ItemRowId === it.RowId) ?? [],
        Module: data?.SiteMenu_Item_Module?.find(p => p.SiteIndex === it.SiteIndex && p.ItemRowId === it.RowId) ?? {},
        Url: data?.SiteMenu_Item_Url?.find(p => p.SiteIndex === it.SiteIndex && p.ItemRowId === it.RowId) ?? {},
      },
      children: []
    });
  }
  // 串接 parent/children
  const roots: Item[] = [];
  for (const it of items) {
    const rowId = Number((it as any).RowId);
    const parentRowId = (it as any).ParentRowId as number | null | undefined;
    const node = nodeMap.get(rowId)!;
    if (parentRowId == null) { roots.push(node); }
    else {
      const parent = nodeMap.get(Number(parentRowId));
      if (parent) (parent.children ?? (parent.children = [])).push(node);
      else roots.push(node);
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
  const [selectedItemEdit, setSelectedItemEdit] = useState<Item | null>(null);
  const useSiteList = useFetchGridListData<SiteMenuSet>(GetSiteMenuListOpt());
  const internalId = useSiteList.rawData?.[0]?.SiteMenu_Index?.InternalId ?? "dda133d3-0932-4ee6-a745-9611dd0bcbb9"
  const useSiteInfo = useFetchFormData<SiteMenuSet>(SiteMenuProvider(), internalId, emptyData)
  const windowTarget = useFetchEnumOptions("WindowTarget")
  const menuUrlType = useFetchEnumOptions("MenuUrlType")
  const modulePageType = useFetchEnumOptions("ModulePageType")
  const moduleDisplayStyle = useFetchEnumOptions("ModuleDisplayStyle")
  const categoryList = useCategoryListData("", prop.lang)
  const tagList = useTagListData("", prop.lang)


  const useBannerList = useFetchGridListData<BannerSet>(GetBannerListOpt());
  const bannerDict = React.useMemo<Record<string, string>>(() => {
    const src = useBannerList.rawData ?? [];
    return src.reduce<Record<string, string>>((acc, p) => {
      const key = p.Banner?.InternalId?.toString?.();
      if (!key) return acc;
      acc[key] = p.Banner?.BannerCategoryName ?? "";
      return acc;
    }, { "": "請選擇" }); // << 預設空白選項
  }, [useBannerList.rawData]);

  useEnsureLangDetails(useSiteInfo, { headerName: SchemaFields.SiteMenuSetFields.SiteMenu_Index, detailName: SchemaFields.SiteMenuSetFields.SiteMenu_IndexInfo, parentKeys: [SchemaFields.SiteMenu_IndexInfoFields.SiteIndex], preferFirstLang: prop.lang });
  useEnsureLangDetails(useSiteInfo, { headerName: SchemaFields.SiteMenuSetFields.SiteMenu_Item, detailName: SchemaFields.SiteMenuSetFields.SiteMenu_Item_Title, parentKeys: [SchemaFields.SiteMenu_Item_TitleFields.SiteIndex, SchemaFields.SiteMenu_Item_TitleFields.ItemRowId], preferFirstLang: prop.lang });

  const isLoading: any[] = [useSiteList.isLoading, useSiteInfo.isLoading, windowTarget.isLoading, menuUrlType.isLoading, modulePageType.isLoading, useBannerList.isLoading]
  const errors: any[] = [useSiteList.error, useSiteInfo.error, windowTarget.error, menuUrlType.error, modulePageType.error, useBannerList.error]
  const formProp: FormCompProp = { Title: "網站功能", Theme: prop.theme, LoadingList: isLoading, ErrorList: errors, }
  return (
    <FormComp prop={formProp}>
      <div className="row">
        <RenderLeftBox setSelectedItemEdit={setSelectedItemEdit} sitemenuSet={useSiteInfo.data} lang={prop.lang} />
        <MenuSettingBox theme={prop.theme} selectedItemEdit={selectedItemEdit} formData={useSiteInfo} windowTarget={windowTarget.data} menuUrlType={menuUrlType.data} modulePageType={modulePageType.data}
          bannerDict={bannerDict} moduleDisplayStyle={moduleDisplayStyle.data}
        />
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
              <button title="新增子層" className="Icogs btn btn-ctm btn-ctm-rounded" key={typedItem.id} onClick={() => { prop.setSelectedItemEdit(typedItem); }}>
                <i className="far fa-plus"></i></button>
            </div>
            <div className="icon" title="">
              <button title="編輯" className="Ipencil btn btn-ctm btn-ctm-rounded" key={typedItem.id} onClick={() => { prop.setSelectedItemEdit(typedItem); }}><i className="far fa-edit"></i></button>
            </div>
            <div className="icon" title="">
              <button title="刪除" className="Itrash btn btn-ctm btn-ctm-rounded"
                onClick={() => {
                  const deleteItem = (arr: Item[], id: number): Item[] => arr.filter((i) => i.id !== id).map((i) => ({ ...i, children: i.children ? deleteItem(i.children, id) : undefined, }));
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
const RenderRightBox = (prop: {
  theme: IBETheme; selectedItemEdit: Item | null; formData: UseFetchFormDataResult<SiteMenuSet>;
  windowTarget: Record<string, string>; menuUrlType: Record<string, string>; modulePageType: Record<string, string>;
}) => {
  //分成是SiteInfoSetting or MenuSettingBox
}

const SiteInfoSettingBox = (prop: {
  theme: IBETheme; selectedItemEdit: Item | null; formData: UseFetchFormDataResult<SiteMenuSet>;
  curLinkType: MenuUrlType; modelKey: ModelKey; navType: MenuUrlType
  windowTarget: Record<string, string>; menuUrlType: Record<string, string>; modulePageType: Record<string, string>;
}) => { }

const MenuSettingBox = (prop: {
  theme: IBETheme; selectedItemEdit: Item | null; formData: UseFetchFormDataResult<SiteMenuSet>;
  windowTarget: Record<string, string>; menuUrlType: Record<string, string>; modulePageType: Record<string, string>;
  bannerDict: Record<string, string>; moduleDisplayStyle: Record<string, string>;
}) => {

  React.useEffect(() => {
    const it = prop.selectedItemEdit?.MenuItem?.Item as any;
    const url = prop.selectedItemEdit?.MenuItem?.Url as any;
    if (it && typeof it.ItemType !== 'undefined') setLinkType(it.ItemType as MenuUrlType);
    if (url && typeof url.RedirectType !== 'undefined') setNavType(url.RedirectType as MenuUrlType);
  }, [prop.selectedItemEdit]);


  const [linkType, setLinkType] = React.useState<MenuUrlType>(0);
  const [modelKey, setModelKey] = React.useState<ModelKey>('');
  const [navType, setNavType] = React.useState<MenuUrlType>(1);

  // ---- 1) 依「功能 / 連結」決定主 Tabs ----
  const LibTabsPropA: LibTabsProp = React.useMemo(() => {
    const base = { basic: '基本' } as const;
    const module = { module: '模型配置' } as const;
    const url = { url: '超連結設定' } as const;
    return {
      Style: prop.theme.Tabs,
      item: linkType === 2 ? { ...base, ...module } : linkType === 1 ? { ...base, ...url } : { ...base }
    };
  }, [prop.theme, prop.formData, linkType, prop.selectedItemEdit]);
  // ---- 組合給 TabContentComp ----
  // const componentsA = React.useMemo(() => ({ basic: basicNodes, module: moduleNodes, url: urlNodes, }), [basicNodes, moduleNodes, urlNodes]);
  const componentsA = {
    basic: [<BasicSettingTab key="basic" theme={prop.theme} selectedItemEdit={prop.selectedItemEdit} formData={prop.formData} itemType={prop.menuUrlType} windowTarget={prop.windowTarget} setLinkType={setLinkType} />],
    module: [<ModuleSettingTab key="module" theme={prop.theme} selectedItemEdit={prop.selectedItemEdit} formData={prop.formData} modulePageType={prop.modulePageType} windowTarget={prop.windowTarget} modelKey={modelKey} setModelKey={setModelKey} bannerDict={prop.bannerDict} moduleDisplayStyle={prop.moduleDisplayStyle} />],
    url: [<HyperlinkSettingTab key="url" theme={prop.theme} selectedItemEdit={prop.selectedItemEdit} formData={prop.formData} menuUrlType={prop.menuUrlType} navType={navType} setNavType={setNavType} lang={DefaultLang} />],
  };

  if (!prop.selectedItemEdit) {
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
                <span className="fw-bold text-primary">{prop.selectedItemEdit.text}</span> - 編輯
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
const BasicSettingTab = (prop: {
  theme: IBETheme; selectedItemEdit: Item | null;
  formData: UseFetchFormDataResult<SiteMenuSet>;
  itemType: Record<string, string>; windowTarget: Record<string, string>;
  setLinkType: React.Dispatch<React.SetStateAction<MenuUrlType>>
}) => {
  const setField = useSetTableField<SiteMenuSet>(prop.formData);
  const rawDetails = prop.formData.data?.SiteMenu_Item_Title?.filter(p => p.SiteIndex === prop.selectedItemEdit?.MenuItem.Item.SiteIndex && p.ItemRowId === prop.selectedItemEdit?.MenuItem.Item.RowId) ?? [];
  const curRowKeys = { [SchemaFields.SiteMenu_ItemFields.SiteIndex]: prop.selectedItemEdit?.MenuItem.Item.SiteIndex, [SchemaFields.SiteMenu_ItemFields.RowId]: prop.selectedItemEdit?.MenuItem.Item.RowId }
  const itemTypeBind = setField(SchemaFields.SiteMenuSetFields.SiteMenu_Item, SchemaFields.SiteMenu_ItemFields.ItemType, "number", curRowKeys);
  const tabInfo: LibTabsProp = {
    Style: prop.theme.Tabs,
    item: rawDetails.reduce<Record<string, string>>((tabItems, info) => {
      const langKey = LibMerge("_", true, info.SiteIndex, info.ItemRowId, info.RowId, info.Lang)
      tabItems[langKey] = LangLabelMap[info.Lang as Lang] ?? info.Lang ?? "Unknown";
      return tabItems;
    }, {})
  }
  const tabContent: Record<string, React.ReactNode[]> = rawDetails.reduce<Record<string, React.ReactNode[]>>(
    (compMap, info) => {
      const langKey = LibMerge("_", true, info.SiteIndex, info.ItemRowId, info.RowId, info.Lang)
      const rowKeys = { [SchemaFields.SiteMenu_Item_TitleFields.SiteIndex]: info.SiteIndex, [SchemaFields.SiteMenu_Item_TitleFields.ItemRowId]: info.ItemRowId, [SchemaFields.SiteMenu_Item_TitleFields.RowId]: info.RowId, }
      compMap[langKey] = [
        <LibTextBox Style={prop.theme.TextBox} DefaultInputDisplay="請輸入" {...setField(SchemaFields.SiteMenuSetFields.SiteMenu_Item_Title, SchemaFields.SiteMenu_Item_TitleFields.Title, "string", rowKeys)} />,
      ]
      return compMap;
    }, {}
  );
  // ---- 基本分頁：把「功能連結」做成 radio，切換時會改變主 Tabs ----
  const basicNodes: React.ReactNode[] = React.useMemo(() => ([
    <LibTextBox Style={prop.theme.TextBox} DefaultInputDisplay="請輸入數字或英文，不可使用空白的"  {...setField(SchemaFields.SiteMenuSetFields.SiteMenu_Item, SchemaFields.SiteMenu_ItemFields.ItemSiteUrl, "string", curRowKeys)} />,
    <LibTextBox disabled={true} Style={prop.theme.TextBox} DefaultInputDisplay="" {...setField(SchemaFields.SiteMenuSetFields.SiteMenu_Item, SchemaFields.SiteMenu_ItemFields.FullUrl, "string", curRowKeys)} />,
    <LibCheckBox Style={prop.theme.RadioBox} options={prop.itemType}
      ColumnDisplayName={itemTypeBind.ColumnDisplayName}
      InputValue={itemTypeBind.InputValue}
      onChange={(v) => { itemTypeBind.onChange?.(v); prop.setLinkType(Number(v) as MenuUrlType); }}
    />,
    <LibCheckBox Style={prop.theme.RadioBox} options={prop.windowTarget} {...setField(SchemaFields.SiteMenuSetFields.SiteMenu_Item, SchemaFields.SiteMenu_ItemFields.WindowTarget, "number", curRowKeys)} />,
    <LibCheckBox Style={prop.theme.CheckBox} options={{ [SchemaFields.SiteMenu_ItemFields.IsShowOnMenu]: "" }}{...setField(SchemaFields.SiteMenuSetFields.SiteMenu_Item, SchemaFields.SiteMenu_ItemFields.IsShowOnMenu, "boolean", curRowKeys)} />,
    <TabContentComp tabInfos={tabInfo} components={tabContent} />,
  ]), [prop.theme, prop.formData, prop.selectedItemEdit]);
  return basicNodes
}
//#endregion


//#region 模型配置
const ModuleOpts: Record<string, string> = { '': '請選擇', Announcement: "公告", FileArchive: "FileArchive", Gallery: "Gallery", PageManagement: "PageManagement", WebResource: "WebResource", SpecResearch: "SpecResearch", SpecUSR: "SpecUSR", };

const ModuleSettingTab = (prop: {
  theme: IBETheme; selectedItemEdit: Item | null; modelKey: ModelKey;
  formData: UseFetchFormDataResult<SiteMenuSet>;
  setModelKey: React.Dispatch<React.SetStateAction<ModelKey>>;
  modulePageType: Record<string, string>; windowTarget: Record<string, string>;
  bannerDict: Record<string, string>; moduleDisplayStyle: Record<string, string>;
}) => {
  const setField = useSetTableField<SiteMenuSet>(prop.formData);
  const siteIndex = prop.selectedItemEdit?.MenuItem.Item.SiteIndex;
  const rowId = prop.selectedItemEdit?.MenuItem.Item.RowId;
  const allowMap: Record<ModelKey, string[]> = {
    Announcement: ["List", "PictureList", "QAList"],
    Gallery: ["List", "Waterfall"],
    FileArchive: ["List", "Expand_Category", "Expand_Tag"],
    WebResource: ["List", "PictureList", "Youtube"],
    PageManagement: [], SpecResearch: [], SpecUSR: [], "": []
  };
  const styleAlias: Record<string, string[]> = {
    None: ["None", "無", "不顯示"],
    List: ["List", "列表"],
    PictureList: ["PictureList", "圖文列表", "圖片列表"],
    QAList: ["QAList", "問答列表", "Q&A"],
    Waterfall: ["Waterfall", "瀑布流"],
    Expand_Category: ["Expand_Category", "展開(分類)", "展開分類", "分類展開"],
    Expand_Tag: ["Expand_Tag", "展開(標籤)", "展開標籤", "標籤展開"],
    Youtube: ["Youtube", "YouTube", "影片"]
  };
  const getStyleOptionsByModule = (
    moduleKey: ModelKey,
    fullDict: Record<string, string>
  ): Record<string, string> => {
    const allow = new Set((allowMap[moduleKey] ?? []).map(s => s.toLowerCase()));
    if (allow.size === 0) return {}; // 該模組無 Style

    const entries = Object.entries(fullDict ?? {});
    const hit = entries.filter(([k, v]) => {
      const keyHit = allow.has(String(k).toLowerCase()) || allow.has(String(v).toLowerCase());
      if (keyHit) return true;
      // 再用 alias 比對顯示文字（處理本地化）
      return (Array.from(allow)).some(a =>
        (styleAlias[a] ?? []).some(alias =>
          String(v).toLowerCase().includes(alias.toLowerCase())
        )
      );
    });

    // 如果完全沒命中，為避免使用者看不到選項，回傳 fullDict（你可改成回傳空物件）
    return hit.length ? Object.fromEntries(hit) : fullDict;
  };
  const filteredStyleDict = React.useMemo(
    () => getStyleOptionsByModule(prop.modelKey, prop.moduleDisplayStyle),
    [prop.modelKey, prop.moduleDisplayStyle]
  );




  const curRowKeys = React.useMemo(() => ({
    [SchemaFields.SiteMenu_Item_ModuleFields.SiteIndex]: siteIndex,
    [SchemaFields.SiteMenu_Item_ModuleFields.ItemRowId]: rowId
  }), [siteIndex, rowId]);

  React.useEffect(() => {
    if (!prop.selectedItemEdit?.MenuItem.Module) return;
    prop.formData.setFormData(prev => {
      const data = { ...(prev ?? {}) } as SiteMenuSet;
      const list = [...(data.SiteMenu_Item_Module ?? [])];
      const exists = list.some(r => r.SiteIndex === siteIndex && r.ItemRowId === rowId);
      if (exists) return prev;
      // 🟢 新增預設行（先只填 key，其他欄位讓使用者選）
      list.push({
        SiteIndex: siteIndex,
        ItemRowId: rowId,
        PageType: 0,
        ModuleProgId: ""
      } as any);
      return { ...data, SiteMenu_Item_Module: list };
    });
  }, [siteIndex, rowId, prop.formData]);


  const moduleKeyBind = setField(SchemaFields.SiteMenuSetFields.SiteMenu_Item_Module, SchemaFields.SiteMenu_Item_ModuleFields.ModuleProgId, "string", curRowKeys);
  const moduleNodes: React.ReactNode[] = React.useMemo(() => {
    const nodes: React.ReactNode[] = [
      <LibCheckBox Style={prop.theme.RadioBox} options={prop.modulePageType} {...setField(SchemaFields.SiteMenuSetFields.SiteMenu_Item_Module, SchemaFields.SiteMenu_Item_ModuleFields.PageType, "string", curRowKeys)} />,
      <LibDropList key="model" Style={prop.theme.DropList} Options={ModuleOpts}
        ColumnDisplayName={moduleKeyBind.ColumnDisplayName}
        InputValue={moduleKeyBind.InputValue}
        onChange={(v) => { moduleKeyBind.onChange?.(v); prop.setModelKey(v as ModelKey); }} />,
      <LibSelectCard key="banner" ColDisplayName="輪播設定" components={[<Module_Banner_Comp theme={prop.theme} formData={prop.formData} selectedItemEdit={prop.selectedItemEdit} bannerDict={prop.bannerDict} />]} />,
    ];

    const map: Record<Exclude<ModelKey, null>, React.ReactNode> = {
      Announcement: <Module_Announcement_Comp theme={prop.theme} formData={prop.formData} selectedItemEdit={prop.selectedItemEdit} styleDict={filteredStyleDict} />,
      PageManagement: <Module_Pagemanagement_Comp theme={prop.theme} formData={prop.formData} selectedItemEdit={prop.selectedItemEdit} />,
      Gallery: <Module_Gallery_Comp theme={prop.theme} formData={prop.formData} selectedItemEdit={prop.selectedItemEdit} styleDict={filteredStyleDict} />,
      FileArchive: <Module_FileArchive_Comp theme={prop.theme} formData={prop.formData} selectedItemEdit={prop.selectedItemEdit} styleDict={filteredStyleDict} />,
      WebResource: <Module_WebResource_Comp theme={prop.theme} formData={prop.formData} selectedItemEdit={prop.selectedItemEdit} styleDict={filteredStyleDict} />,
      SpecResearch: [], SpecUSR: [], "": []
    };


    if (prop.modelKey) {
      const label = {
        Banner: '輪播設定', Announcement: '公告設定', PageManagement: '頁面設定', Gallery: '相簿設定', FileArchive: '檔案室設定', WebResource: '網路資源設定', SpecUSR: 'USR計劃', SpecResearch: '研究計劃',
      }[prop.modelKey];
      nodes.push(<LibSelectCard key="onlyOne" ColDisplayName={label ?? ""} components={map[prop.modelKey]} />);
    }
    return nodes;
  }, [prop.theme, prop.formData, prop.modelKey, prop.selectedItemEdit, filteredStyleDict]);
  return moduleNodes;
}
const Module_Banner_Comp = (prop: { theme: IBETheme; formData: UseFetchFormDataResult<SiteMenuSet>; selectedItemEdit: Item | null; bannerDict: Record<string, string> }): React.ReactNode[] => {
  const curRowKeys = { [SchemaFields.SiteMenu_Item_ModuleFields.SiteIndex]: prop.selectedItemEdit?.MenuItem.Item.SiteIndex, [SchemaFields.SiteMenu_Item_ModuleFields.ItemRowId]: prop.selectedItemEdit?.MenuItem.Item.RowId }
  const setField = useSetTableField<SiteMenuSet>(prop.formData);
  return ([<LibDropList Style={prop.theme.DropList} Options={prop.bannerDict} {...setField(SchemaFields.SiteMenuSetFields.SiteMenu_Item_Module, SchemaFields.SiteMenu_Item_ModuleFields.BannerId, "string", curRowKeys)} />])
}
const Module_Announcement_Comp = (prop: { theme: IBETheme; formData: UseFetchFormDataResult<SiteMenuSet>; selectedItemEdit: Item | null; styleDict: Record<string, string>; }) => {
  const curRowKeys = { [SchemaFields.SiteMenu_Item_ModuleFields.SiteIndex]: prop.selectedItemEdit?.MenuItem.Item.SiteIndex, [SchemaFields.SiteMenu_Item_ModuleFields.ItemRowId]: prop.selectedItemEdit?.MenuItem.Item.RowId }
  const binder = useSetJsonField<SiteMenuSet, ModuleOptionsJson>(prop.formData, SchemaFields.SiteMenuSetFields.SiteMenu_Item_Module, SchemaFields.SiteMenu_Item_ModuleFields.ModuleOptions, curRowKeys, moduleOptionsDefaults);
  const catBind = binder.bind("Category", "csv");
  const tagBind = binder.bind("Tag", "csv");
  const styleBind = binder.bind("Style", "number");
  return (
    <>
      <LibCheckBox Style={prop.theme.CheckBox} ColumnDisplayName="類別" options={{}} InputValue={catBind.value} onChange={catBind.onChange} />
      <LibCheckBox Style={prop.theme.CheckBox} ColumnDisplayName="標籤" options={{}} InputValue={tagBind.value} onChange={tagBind.onChange} />
      <LibDropList Style={prop.theme.DropList} ColumnDisplayName="清單樣式" Options={prop.styleDict} InputValue={styleBind.value} onChange={styleBind.onChange} />
    </>
  )
}
const Module_Pagemanagement_Comp = (prop: { theme: IBETheme; formData: UseFetchFormDataResult<SiteMenuSet>; selectedItemEdit: Item | null; }): React.ReactNode[] => {
  const curRowKeys = { [SchemaFields.SiteMenu_Item_ModuleFields.SiteIndex]: prop.selectedItemEdit?.MenuItem.Item.SiteIndex, [SchemaFields.SiteMenu_Item_ModuleFields.ItemRowId]: prop.selectedItemEdit?.MenuItem.Item.RowId }
  const binder = useSetJsonField<SiteMenuSet, ModuleOptionsJson>(
    prop.formData,
    SchemaFields.SiteMenuSetFields.SiteMenu_Item_Module,
    SchemaFields.SiteMenu_Item_ModuleFields.ModuleOptions,
    curRowKeys,
    moduleOptionsDefaults
  );
  const pageBind = binder.bind("PageId", "string");
  return ([
    <LibDropList Style={prop.theme.DropList} ColumnDisplayName="頁面選擇" Options={{}} InputValue={pageBind.value} onChange={pageBind.onChange} />,
  ])
}
const Module_Gallery_Comp = (prop: { theme: IBETheme; formData: UseFetchFormDataResult<SiteMenuSet>; selectedItemEdit: Item | null; styleDict: Record<string, string>; }): React.ReactNode[] => {
  const curRowKeys = { [SchemaFields.SiteMenu_Item_ModuleFields.SiteIndex]: prop.selectedItemEdit?.MenuItem.Item.SiteIndex, [SchemaFields.SiteMenu_Item_ModuleFields.ItemRowId]: prop.selectedItemEdit?.MenuItem.Item.RowId }
  const binder = useSetJsonField<SiteMenuSet, ModuleOptionsJson>(
    prop.formData,
    SchemaFields.SiteMenuSetFields.SiteMenu_Item_Module,
    SchemaFields.SiteMenu_Item_ModuleFields.ModuleOptions,
    curRowKeys,
    moduleOptionsDefaults
  );
  const catBind = binder.bind("Category", "csv");
  const tagBind = binder.bind("Tag", "csv");
  const styleBind = binder.bind("Style", "number");
  return ([
    <LibCheckBox Style={prop.theme.CheckBox} ColumnDisplayName="類別" options={{}} InputValue={catBind.value} onChange={catBind.onChange} />,
    <LibCheckBox Style={prop.theme.CheckBox} ColumnDisplayName="標籤" options={{}} InputValue={tagBind.value} onChange={tagBind.onChange} />,
    <LibDropList Style={prop.theme.DropList} ColumnDisplayName="清單樣式" Options={prop.styleDict} InputValue={styleBind.value} onChange={styleBind.onChange} />,
  ])
}
const Module_FileArchive_Comp = (prop: { theme: IBETheme; formData: UseFetchFormDataResult<SiteMenuSet>; selectedItemEdit: Item | null; styleDict: Record<string, string>; }): React.ReactNode[] => {
  const curRowKeys = { [SchemaFields.SiteMenu_Item_ModuleFields.SiteIndex]: prop.selectedItemEdit?.MenuItem.Item.SiteIndex, [SchemaFields.SiteMenu_Item_ModuleFields.ItemRowId]: prop.selectedItemEdit?.MenuItem.Item.RowId }
  const binder = useSetJsonField<SiteMenuSet, ModuleOptionsJson>(
    prop.formData,
    SchemaFields.SiteMenuSetFields.SiteMenu_Item_Module,
    SchemaFields.SiteMenu_Item_ModuleFields.ModuleOptions,
    curRowKeys,
    moduleOptionsDefaults
  );
  const catBind = binder.bind("Category", "csv");
  const tagBind = binder.bind("Tag", "csv");
  const styleBind = binder.bind("Style", "number");
  return ([
    <LibCheckBox Style={prop.theme.CheckBox} ColumnDisplayName="類別" options={{}} InputValue={catBind.value} onChange={catBind.onChange} />,
    <LibCheckBox Style={prop.theme.CheckBox} ColumnDisplayName="標籤" options={{}} InputValue={tagBind.value} onChange={tagBind.onChange} />,
    <LibDropList Style={prop.theme.DropList} ColumnDisplayName="清單樣式" Options={prop.styleDict} InputValue={styleBind.value} onChange={styleBind.onChange} />,
  ])
}
const Module_WebResource_Comp = (prop: { theme: IBETheme; formData: UseFetchFormDataResult<SiteMenuSet>; selectedItemEdit: Item | null; styleDict: Record<string, string>; }): React.ReactNode[] => {
  const curRowKeys = { [SchemaFields.SiteMenu_Item_ModuleFields.SiteIndex]: prop.selectedItemEdit?.MenuItem.Item.SiteIndex, [SchemaFields.SiteMenu_Item_ModuleFields.ItemRowId]: prop.selectedItemEdit?.MenuItem.Item.RowId }
  const binder = useSetJsonField<SiteMenuSet, ModuleOptionsJson>(
    prop.formData,
    SchemaFields.SiteMenuSetFields.SiteMenu_Item_Module,
    SchemaFields.SiteMenu_Item_ModuleFields.ModuleOptions,
    curRowKeys,
    moduleOptionsDefaults
  );
  const catBind = binder.bind("Category", "csv");
  const tagBind = binder.bind("Tag", "csv");
  const styleBind = binder.bind("Style", "number");
  return ([
    <LibCheckBox Style={prop.theme.CheckBox} ColumnDisplayName="類別" options={{}} InputValue={catBind.value} onChange={catBind.onChange} />,
    <LibCheckBox Style={prop.theme.CheckBox} ColumnDisplayName="標籤" options={{}} InputValue={tagBind.value} onChange={tagBind.onChange} />,
    <LibDropList Style={prop.theme.DropList} ColumnDisplayName="清單樣式" Options={prop.styleDict} InputValue={styleBind.value} onChange={styleBind.onChange} />,
  ])
}
//#endregion

//#region  超連結設定
const HyperlinkSettingTab = (prop: {
  theme: IBETheme; selectedItemEdit: Item | null; navType: MenuUrlType
  formData: UseFetchFormDataResult<SiteMenuSet>;
  menuUrlType: Record<string, string>; lang: Lang
  setNavType: React.Dispatch<React.SetStateAction<MenuUrlType>>
}) => {
  const setField = useSetTableField<SiteMenuSet>(prop.formData);
  const siteIndex = prop.selectedItemEdit?.MenuItem.Item.SiteIndex;
  const rowId = prop.selectedItemEdit?.MenuItem.Item.RowId;
  const curRowKeys = React.useMemo(() => ({
    [SchemaFields.SiteMenu_Item_UrlFields.SiteIndex]: siteIndex,
    [SchemaFields.SiteMenu_Item_UrlFields.ItemRowId]: rowId
  }), [siteIndex, rowId]);

  const { options: internalUrlOptions, disabledKeys } = React.useMemo(
    () => buildInternalUrlOptions(prop.formData.data ?? {} as SiteMenuSet, prop.lang ?? DefaultLang),
    [prop.formData.data, prop.lang]
  );

  React.useEffect(() => {
    if (!prop.selectedItemEdit?.MenuItem.Url) return;
    prop.formData.setFormData(prev => {
      const data = { ...(prev ?? {}) } as SiteMenuSet;
      const list = [...(data.SiteMenu_Item_Url ?? [])];
      const exists = list.some(r => r.SiteIndex === siteIndex && r.ItemRowId === rowId);
      if (exists) return prev;
      // 🟢 新增預設行（先只填 key，其他欄位讓使用者選）
      list.push({
        SiteIndex: siteIndex,
        ItemRowId: rowId,
        RedirectType: 1,
        RedirectUrl: ""
      } as any);
      return { ...data, SiteMenu_Item_Url: list };
    });
  }, [siteIndex, rowId, prop.formData]);
  const redirectBind = setField(SchemaFields.SiteMenuSetFields.SiteMenu_Item_Url, SchemaFields.SiteMenu_Item_UrlFields.RedirectType, "number", curRowKeys);
  const urlNodes: React.ReactNode[] = React.useMemo(() => {
    const nodes: React.ReactNode[] = [
      <LibCheckBox options={prop.menuUrlType} Style={prop.theme.RadioBox}
        ColumnDisplayName={redirectBind.ColumnDisplayName}
        InputValue={redirectBind.InputValue}
        onChange={(v) => { redirectBind.onChange?.(v); prop.setNavType(Number(v) as MenuUrlType); }}
      />,
    ];
    switch (prop.navType) {
      case 1:
        nodes.push(<LibTextBox Style={prop.theme.TextBox} DefaultInputDisplay="請輸入數字或英文，不可使用空白的" {...setField(SchemaFields.SiteMenuSetFields.SiteMenu_Item_Url, SchemaFields.SiteMenu_Item_UrlFields.RedirectUrl, "string", curRowKeys)} />);
        break;
      case 2:
        nodes.push(<LibDropList Style={prop.theme.DropList} Options={internalUrlOptions} {...setField(SchemaFields.SiteMenuSetFields.SiteMenu_Item_Url, SchemaFields.SiteMenu_Item_UrlFields.RedirectUrl, "string", curRowKeys)} />



        );
        break;
    }
    return nodes;
  }, [prop.theme, prop.navType, prop.selectedItemEdit, prop.formData]);
  return urlNodes
}

const buildInternalUrlOptions = (data: SiteMenuSet, lang: Lang) => {
  const roots = siteMenuInfo(data, lang); // 你已有的樹狀資料
  const options: Record<string, string> = {};
  const disabledKeys = new Set<string>();
  const crumbMap: Record<string, string> = {};

  const THIN = "\u2009";           // 窄空白 (thin space)
  const indent = (d: number) => (d > 0 ? THIN.repeat(d * 2) + "" : ""); // 例："  › "

  const stack: string[] = [];
  const walk = (nodes: Item[] | undefined, depth: number) => {
    if (!nodes) return;
    for (const n of nodes) {
      const fullUrl = String(n?.MenuItem?.Item?.FullUrl ?? "");
      if (!fullUrl) { if (n.children?.length) { stack.push(n.text); walk(n.children, depth + 1); stack.pop(); } continue; }

      const redirectType = Number(n?.MenuItem?.Url?.RedirectType ?? 0); // 1=超連結
      const isExternal = redirectType === 1;

      stack.push(n.text);
      const cleanTitle = n.text;
      const label = indent(depth) + (isExternal ? `--${cleanTitle}--` : cleanTitle);
      const crumbs = stack.join(" / ");

      options[fullUrl] = label;
      crumbMap[fullUrl] = crumbs;
      if (isExternal) disabledKeys.add(fullUrl);

      if (n.children?.length) walk(n.children, depth + 1);
      stack.pop();
    }
  };

  walk(roots, 0);
  return { options, disabledKeys, crumbMap };
};

//#endregion