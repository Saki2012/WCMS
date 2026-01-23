import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { useCategoryListData } from "@/Features/Hooks/BizFunc/WebManagement/Category/Category_Hook";
import { useTagListData } from "@/Features/Hooks/BizFunc/WebManagement/Tags/Tag_Hook";
import { usePageListData } from "@/Features/Hooks/BizFunc/WebManagement/Pagemanagement/PageManagement_Hook";
import { useSpecCateListData } from "@/SpecFetures/1810/Hooks/SpecCategory/SpecCategory_Hook";
import { useActions, useWrapAfter, type UseActionsResult } from "@/Features/Hooks/Common/useActions";
import { SpecPGID } from "@/SpecFetures/1817/Hooks/Common/SpecProgId";
import { SiteMenu_IndexInfoFields, SiteMenu_Item_ModuleFields, SiteMenu_Item_TitleFields, SiteMenu_Item_UrlFields, SiteMenu_ItemFields, SiteMenuSetFields } from "@/types/SchemaFields";
type SiteMenuSet = components["schemas"]["SiteMenuSet_DTO"]
type SiteMenu_Item = components["schemas"]["SiteMenu_Item_DTO"]
type SiteMenu_Item_Title = components["schemas"]["SiteMenu_Item_Title_DTO"]
type SiteMenu_Item_Module = components["schemas"]["SiteMenu_Item_Module_DTO"]
type SiteMenu_Item_Url = components["schemas"]["SiteMenu_Item_Url_DTO"]
type MenuUrlType = components["schemas"]["MenuUrlType"]
// type WindowTarget = components["schemas"]["WindowTarget"]
// type ModuleDisplayStyle = components["schemas"]["ModuleDisplayStyle"]
// type ModulePageType = components["schemas"]["ModulePageType"]
type BannerSet = components["schemas"]["BannerSet_DTO"]
type CategorySet = components["schemas"]["CategoryDataSet_DTO"]
type SpecCategorySet = components["schemas"]["SpecCategorySet_DTO"]
type TagSet = components["schemas"]["TagSet_DTO"]
type PageSet = components["schemas"]["PageManagementSet_DTO"]

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
type ModelKey = '' | 'Announcement' | 'FileArchive' | 'Gallery' | 'PageManagement' | 'WebResource' | 'SpecResearch' | 'SpecUSR' | 'SpecMusical'

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
  const titles = data?.SiteMenu_Item_Title ?? [];

  // ✅ 建立：itemRowId -> (lang -> title) 對照（收全部語系，後面再做 fallback）
  const titleDict = new Map<number, Map<string, string>>();
  for (const t of titles) {
    const itemRowId = Number((t as SiteMenu_Item_Title).ItemRowId ?? 0);
    if (!itemRowId) continue;

    const l = String((t as SiteMenu_Item_Title).Lang ?? "").toLowerCase();
    const title = String((t as any).Title ?? "");

    if (!titleDict.has(itemRowId)) titleDict.set(itemRowId, new Map());
    titleDict.get(itemRowId)!.set(l, title);
  }

  // ✅ 以「指定 lang」為優先語系；若沒有，就往其他語系找第一個有值的 title
  const resolveTitle = (itemRowId: number): string => {
    const langMap = titleDict.get(itemRowId);
    if (!langMap) return "";

    const primary = String(lang ?? DefaultLang).toLowerCase();
    const candidates = [
      primary,
      ...Object.keys(LangLabelMap)
        .map((x) => String(x).toLowerCase())
        .filter((x) => x !== primary),
    ];

    for (const l of candidates) {
      const t = String(langMap.get(l) ?? "").trim();
      if (t) return t;
    }
    return "(未命名)";
  };

  // 方便排序：RowId -> DisplayOrder
  const orderMap = new Map<number, number>();
  // 先為每個項目建立節點
  const nodeMap = new Map<number, Item>();
  for (const it of items) {
    const rowId = Number((it as any).RowId);
    const displayOrder = Number((it as any).DisplayOrder ?? 0);
    orderMap.set(rowId, displayOrder);
    const text = resolveTitle(rowId);
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
  const provider = React.useMemo(() => SiteMenuProvider(), []);
  const useSiteList = useFetchGridListData<SiteMenuSet>(GetSiteMenuListOpt());
  const internalId = React.useMemo<string | null>(() => {
    const first = (useSiteList.rawData ?? []).find(x => x?.SiteMenu_Index?.InternalId)?.SiteMenu_Index?.InternalId;
    return first ?? null;
  }, [useSiteList.rawData]);
  const useSiteInfo = useFetchFormData<SiteMenuSet>(provider, internalId, emptyData)
  const windowTarget = useFetchEnumOptions("WindowTarget")
  const menuUrlType = useFetchEnumOptions("MenuUrlType")
  const modulePageType = useFetchEnumOptions("ModulePageType")
  const moduleDisplayStyle = useFetchEnumOptions("ModuleDisplayStyle")
  const useCateList = useCategoryListData("", prop.lang)
  const usetagList = useTagListData("", prop.lang)
  const usePageList = usePageListData(prop.lang)
  const useSpecCateDatas = useSpecCateListData("", prop.lang)
  const actions = useActions("", provider, useSiteInfo.data as SiteMenuSet, internalId as string)
  // ✅ 先在頂層定義 hook
  const onCancelBack = useCallback(() => {
    void useSiteInfo.refetch();
    setSelectedItemEdit(null);
  }, [useSiteInfo.refetch, setSelectedItemEdit]);
  const actionsEx = React.useMemo(() => {
    return {
      ...actions,
      onSave: useWrapAfter(actions.onSave, async (ok) => {
        if (ok !== false) {
          useSiteInfo.refetch();
        }
      }),
      onCancelBack,   // 直接用上面那個 callback
    };
  }, [actions, onCancelBack, useSiteInfo.refetch]);
  const useBannerList = useFetchGridListData<BannerSet>(GetBannerListOpt());
  const bannerDict = useMemo<Record<string, string>>(() => {
    const src = useBannerList.rawData ?? [];
    return src.reduce<Record<string, string>>((acc, p) => {
      const key = p.Banner?.BannerId?.toString?.();
      if (!key) return acc;
      acc[key] = p.Banner?.BannerCategoryName ?? "";
      return acc;
    }, {}); // << 預設空白選項
  }, [useBannerList.rawData]);
  useEnsureLangDetails(useSiteInfo, { headerName: SiteMenuSetFields.SiteMenu_Index, detailName: SiteMenuSetFields.SiteMenu_IndexInfo, parentKeys: [SiteMenu_IndexInfoFields.SiteIndex], preferFirstLang: prop.lang });
  useEnsureLangDetails(useSiteInfo, { headerName: SiteMenuSetFields.SiteMenu_Item, detailName: SiteMenuSetFields.SiteMenu_Item_Title, parentKeys: [SiteMenu_Item_TitleFields.SiteIndex, SiteMenu_Item_TitleFields.ItemRowId], preferFirstLang: prop.lang });
  const isLoading: any[] = [useSiteList.isLoading, useSiteInfo.isLoading, windowTarget.isLoading, menuUrlType.isLoading, modulePageType.isLoading, useBannerList.isLoading, useCateList.isLoading, usetagList.isLoading, usePageList.isLoading, useSpecCateDatas.isLoading]
  const errors: any[] = [useSiteList.error, useSiteInfo.error, windowTarget.error, menuUrlType.error, modulePageType.error, useBannerList.error, useCateList.error, usetagList.error, usePageList.error, useSpecCateDatas.error]
  const formProp: FormCompProp = { Title: "網站功能", Theme: prop.theme, LoadingList: isLoading, ErrorList: errors, Actions: actionsEx }
  return (
    <FormComp prop={formProp}>
      <div className="row">
        <RenderLeftBox setSelectedItemEdit={setSelectedItemEdit} sitemenuSet={useSiteInfo.data} lang={prop.lang} formData={useSiteInfo} action={actionsEx} />
        <MenuSettingBox theme={prop.theme} selectedItemEdit={selectedItemEdit} formData={useSiteInfo} windowTarget={windowTarget.data} menuUrlType={menuUrlType.data} modulePageType={modulePageType.data}
          bannerDict={bannerDict} moduleDisplayStyle={moduleDisplayStyle.data} categoryDatas={useCateList.rawData} tagDatas={usetagList.rawData} pageList={usePageList.rawData} specCateDatas={useSpecCateDatas.rawData} action={actionsEx}
        />
      </div>
    </FormComp>
  );
};

//LeftBox
const RenderLeftBox = (prop: { setSelectedItemEdit: React.Dispatch<React.SetStateAction<Item | null>>; sitemenuSet: SiteMenuSet; lang: Lang; formData: UseFetchFormDataResult<SiteMenuSet>; action: UseActionsResult }) => {
  const [collapseAll, setCollapseAll] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [candidate, setCandidate] = useState<Item | null>(null);
  const collectRowIds = (node: Item): number[] => {
    const self = Number(node?.MenuItem?.Item?.RowId ?? node.id);
    const children = (node.children ?? []).flatMap(collectRowIds);
    return [self, ...children];
  };
  const findWithParent = (arr: Item[], id: number): { node: Item | null; parent: Item | null } => {
    for (const n of arr) {
      if (n.id === id) return { node: n, parent: null };
      if (n.children?.length) {
        if (n.children.some(c => c.id === id)) {
          const node = n.children.find(c => c.id === id) ?? null;
          return { node, parent: n };
        }
        const deep = findWithParent(n.children, id);
        if (deep.node) return deep;
      }
    }
    return { node: null, parent: null };
  };
  const removeNodeAndSubtree = (arr: Item[], id: number): Item[] => arr.filter(n => n.id !== id).map(n => ({ ...n, children: n.children ? removeNodeAndSubtree(n.children, id) : undefined }));
  const promoteChildrenToParent = (arr: Item[], id: number): Item[] => {
    const clone = (nodes: Item[]): Item[] => nodes.map(n => ({ ...n, children: n.children ? clone(n.children) : undefined }));
    const next = clone(arr);

    const walk = (nodes: Item[], parent: Item | null): boolean => {
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (n.id === id) {
          // 把 n 的 children 接到 parent 底下（插入 n 原本位置）
          if (parent) {
            const siblings = parent.children ?? [];
            const before = siblings.slice(0, i);
            const after = siblings.slice(i + 1);
            const kids = n.children ?? [];
            parent.children = [...before, ...kids, ...after];
          } else {
            // n 是 root，則把 children 直接提升為新的 root
            const idx = next.findIndex(r => r.id === id);
            const kids = n.children ?? [];
            next.splice(idx, 1, ...kids);
          }
          return true;
        }
        if (n.children?.length && walk(n.children, n)) return true;
      }
      return false;
    };

    walk(next, null);
    return next;
  };
  const applyRemovalToForm = (idsToRemove: Set<number>) => {
    prop.formData.setFormData(prev => {
      if (!prev) return prev;
      const next = { ...(prev ?? {}) } as SiteMenuSet;

      next.SiteMenu_Item = (next.SiteMenu_Item ?? []).filter(x => !idsToRemove.has(Number((x as SiteMenu_Item).RowId)));
      next.SiteMenu_Item_Title = (next.SiteMenu_Item_Title ?? []).filter(t => !idsToRemove.has(Number((t as SiteMenu_Item_Title).ItemRowId)));
      next.SiteMenu_Item_Module = (next.SiteMenu_Item_Module ?? []).filter(m => !idsToRemove.has(Number((m as SiteMenu_Item_Module).ItemRowId)));
      next.SiteMenu_Item_Url = (next.SiteMenu_Item_Url ?? []).filter(u => !idsToRemove.has(Number((u as SiteMenu_Item_Url).ItemRowId)));

      return next;
    });
  };
  // 放在 RenderLeftBox 內其他 const 之後
  const addMenuItem = (parent: Item | null) => {
    // 1) 計算新的 RowId / Title RowId
    const nextRowId = (() => {
      const all = prop.formData.data?.SiteMenu_Item ?? [];
      const max = all.reduce((m, x) => Math.max(m, Number(x?.RowId ?? 0)), 0);
      return (max || 0) + 1;
    })();
    const nextTitleRowId = (() => {
      const all = prop.formData.data?.SiteMenu_Item_Title ?? [];
      const max = all.reduce((m, x) => Math.max(m, Number((x as any)?.RowId ?? 0)), 0);
      return (max || 0) + 1;
    })();

    // 2) 取得 SiteIndex（沿用現有資料的 SiteIndex）
    const sampleSiteIndex =
      prop.formData.data?.SiteMenu_Item?.[0]?.SiteIndex ??
      prop.formData.data?.SiteMenu_Index?.SiteIndex ??
      "";

    // 3) 先把 formData 寫入 SiteMenu_Item 與一筆 Title（顯示用）
    prop.formData.setFormData(prev => {
      const next = { ...(prev ?? {}) } as SiteMenuSet;

      next.SiteMenu_Item = [
        ...(next.SiteMenu_Item ?? []),
        {
          SiteIndex: sampleSiteIndex,
          RowId: nextRowId,
          ParentRowId: parent ? parent.id : null,
          Level: parent ? (Number((parent)?.MenuItem?.Item?.Level ?? 1) + 1) : 1,
          DisplayOrder: 9999,             // 先給暫值，待會 syncTreeToForm 會重算
          ItemSiteUrl: "",
          FullUrl: "",
          ItemType: 1,
          WindowTarget: 0,
        } as any
      ];

      next.SiteMenu_Item_Title = [
        ...(next.SiteMenu_Item_Title ?? []),
        {
          SiteIndex: sampleSiteIndex,
          ItemRowId: nextRowId,
          RowId: nextTitleRowId,
          Lang: prop.lang,
          Title: "",
          IsShowOnMenu: true,
        } as any
      ];

      return next;
    });

    // 4) 把新節點加到左側樹狀（主層或對應父層的最後）
    const newNode: Item = {
      id: nextRowId,
      text: "",
      MenuItem: {
        Item: {
          SiteIndex: sampleSiteIndex,
          RowId: nextRowId,
          ParentRowId: parent ? parent.id : null,
          Level: parent ? (Number((parent)?.MenuItem?.Item?.Level ?? 1) + 1) : 1,
          DisplayOrder: 9999,
          ItemSiteUrl: "",
          FullUrl: "",
          ItemType: 1,
          WindowTarget: 0,
        } as any,
        Title: [{
          SiteIndex: sampleSiteIndex,
          ItemRowId: nextRowId,
          RowId: nextTitleRowId,
          Lang: prop.lang,
          Title: "",
          IsShowOnMenu: true,
        } as any],
        Module: {} as any,
        Url: {} as any,
      },
      children: []
    };

    setItems(prev => {
      let nextTree: Item[];
      if (!parent) {
        // 新增主層：接到最後
        nextTree = [...prev, newNode];
      } else {
        // 新增子層：找到 parent，接到該層最後
        const clone = (ns: Item[]): Item[] =>
          ns.map(n => ({
            ...n,
            children: n.children ? clone(n.children) : undefined
          }));

        const tree = clone(prev);
        const attach = (ns: Item[]): boolean => {
          for (const n of ns) {
            if (n.id === parent.id) {
              n.children = [...(n.children ?? []), newNode];
              return true;
            }
            if (n.children && n.children.length && attach(n.children)) return true;
          }
          return false;
        };
        attach(tree);
        nextTree = tree;
      }

      // 5) 依新樹同步回 formData（重算 ParentRowId/Level/DisplayOrder）
      syncTreeToForm(nextTree, prop.formData);

      // 6) 選取新節點，右側直接開編輯
      const pick = newNode;
      setTimeout(() => prop.setSelectedItemEdit(pick), 0);

      return nextTree;
    });
  };

  const getIconClass = (it: Item) => Number(it?.MenuItem?.Item?.ItemType ?? 1) === 1 ? "fa fa-link mr-2" : "far fa-cogs mr-2";

  useEffect(() => { setItems(siteMenuInfo(prop.sitemenuSet, DefaultLang)); }, [prop.sitemenuSet]);
  const renderItem: RenderItem = ({ item, handler, collapseIcon }) => {
    const typedItem = item as Item;
    return (
      <div className="dd-item dd3-item">
        <div className="dd-handle dd3-handle"></div>
        <div className="dd3-content content_bar" onClick={() => { prop.setSelectedItemEdit(typedItem); }} style={{ cursor: "pointer" }}>
          {handler}
          {collapseIcon}
          <span style={{ flex: 1, padding: "0 10px 0 3px" }}>
            <i className={getIconClass(typedItem)}></i>
            {typedItem.text}
          </span>
          <div className="all-btn Edit Icon">
            <CheckFrontBtn fullPath={typedItem.MenuItem.Item.FullUrl ?? ""}></CheckFrontBtn>
            <div className="icon" title="">
              <button title="新增子層" className="Icogs btn btn-ctm btn-ctm-rounded" key={typedItem.id} onClick={(e) => { e.stopPropagation(); addMenuItem(typedItem); }}>
                <i className="far fa-plus"></i></button>
            </div>
            <div className="icon" title="">
              <button title="編輯" className="Ipencil btn btn-ctm btn-ctm-rounded" key={typedItem.id} onClick={(e) => { e.stopPropagation(); prop.setSelectedItemEdit(typedItem); }}><i className="far fa-edit"></i></button>
            </div>
            <div className="icon" title="">
              <button title="刪除" className="Itrash btn btn-ctm btn-ctm-rounded"
                onClick={(e) => {
                  e.stopPropagation();
                  setCandidate(typedItem);     // 🟢 指定待刪除對象
                  setConfirmOpen(true);        // 🟢 開啟確認對話框
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
    syncTreeToForm(items as Item[], prop.formData);
  };
  return (
    <>
      <div className="col-xxl-5 col-12 left-box">
        <div className="panel">
          <div className="panel-body">
            <div className="mb-2">
              <button onClick={() => setCollapseAll(!collapseAll)} className="btn btn-custom btn-rounded btn-sm mr-2 mb-2">{collapseAll ? "展開" : "收合"}</button>
              <button type="button" className="btn btn-custom btn-rounded btn-sm mr-2 mb-2" onClick={prop.action.onSave}>儲存</button>
              <button type="button" className="btn btn-custom btn-rounded btn-sm mr-2 mb-2" onClick={() => addMenuItem(null)}>新增</button>
            </div>
            <div className="cf nestable-lists">
              <Nestable items={items || []} renderItem={renderItem} onChange={handleChange} className="dd-list" collapsed={collapseAll} />
            </div>
          </div>
        </div>
      </div>
      {confirmOpen && candidate && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="del-title"
          className=""
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1050
          }}
        >
          <div className="card" style={{ minWidth: 420 }}>
            <div className="card-header">
              <h5 id="del-title" className="m-0">刪除確認</h5>
            </div>
            <div className="card-body">
              <p className="mb-2">
                要刪除「<b>{candidate.text || candidate.id}</b>」嗎？
              </p>
              <ul className="mb-3">
                <li><b>全部刪除</b>：此項目與其所有子項目都會移除。</li>
                {(candidate.children?.length ?? 0) > 0 && (
                  <li><b>保留明細</b>：刪除此項目，但子項目將掛到此項目的父層。</li>
                )}
                <li><b>取消</b>：不進行刪除。</li>
              </ul>

              <div className="d-flex justify-content-end gap-2">
                {/* A. 全部刪除 */}
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => {
                    // 1) 先收集要刪掉的 RowId（包含子孫）
                    const ids = new Set<number>(collectRowIds(candidate));

                    // 2) 從樹狀資料移除整個子樹
                    const newTree = removeNodeAndSubtree(items, candidate.id);
                    setItems(newTree);

                    // 3) 從 formData 移除對應資料（Item/Title/Module/Url）
                    applyRemovalToForm(ids);

                    // 4) 把新的樹寫回 formData（ParentRowId / Level / DisplayOrder）
                    syncTreeToForm(newTree, prop.formData);

                    // 5) 關閉對話框 & 取消右側編輯
                    setConfirmOpen(false);
                    setCandidate(null);
                    prop.setSelectedItemEdit(null);
                  }}
                >
                  全部刪除
                </button>

                {/* B. 保留明細（只有有子節點時顯示） */}
                {(candidate.children?.length ?? 0) > 0 && (
                  <button
                    type="button"
                    className="btn btn-warning btn-sm"
                    onClick={() => {
                      // 1) 先把 children 提升到父層並移除自己
                      const newTree = promoteChildrenToParent(items, candidate.id);
                      setItems(newTree);

                      // 2) formData：只刪掉自己(不含子孫)
                      const idOnly = new Set<number>([Number(candidate.MenuItem?.Item?.RowId ?? candidate.id)]);
                      applyRemovalToForm(idOnly);

                      // 3) 把新的樹寫回 formData（ParentRowId / Level / DisplayOrder）
                      syncTreeToForm(newTree, prop.formData);

                      // 4) 關閉對話框 & 取消右側編輯
                      setConfirmOpen(false);
                      setCandidate(null);
                      prop.setSelectedItemEdit(null);
                    }}
                  >
                    保留明細
                  </button>
                )}
                {/* C. 取消 */}
                <button
                  type="button"
                  className="btn btn-light btn-sm"
                  onClick={() => { setConfirmOpen(false); setCandidate(null); }}
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const CheckFrontBtn = (prop: { fullPath: string }) => {
  const toAbsolute = React.useCallback((path: string) => {
    if (!path) return "/";
    if (/^https?:\/\//i.test(path)) return path;                // 已是完整網址
    const normalized = path.startsWith("/") ? path : `/${path}`; // 轉成 /xxx
    return `${window.location.origin}${normalized}`;             // 補上目前站台
  }, []);

  const openInNewTab = React.useCallback((fullPath: string) => {
    const href = toAbsolute(fullPath);
    window.open(href, "_blank", "noopener,noreferrer");          // 另開分頁（安全參數）
  }, [toAbsolute]);
  return (
    <div className="icon" title="">
      <button title="查看前台" className="Ieye btn btn-ctm btn-ctm-rounded" onClick={(e) => { e.stopPropagation(); openInNewTab(prop.fullPath); }}><i className="far fa-eye"></i></button>
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
  categoryDatas: CategorySet[]; tagDatas: TagSet[]; pageList: PageSet[]; specCateDatas: SpecCategorySet[];
  action: UseActionsResult;
}) => {
  const [tabResetSeed, setTabResetSeed] = React.useState(0);


  React.useEffect(() => {
    const it = prop.selectedItemEdit?.MenuItem?.Item as any;
    const url = prop.selectedItemEdit?.MenuItem?.Url as any;
    const mod = prop.selectedItemEdit?.MenuItem?.Module as any;
    if (it && typeof it.ItemType !== 'undefined') setLinkType(it.ItemType as MenuUrlType);
    if (url && typeof url.RedirectType !== 'undefined') setNavType(url.RedirectType as MenuUrlType);
    if (mod && typeof mod.ModuleProgId !== 'undefined') setModelKey((mod.ModuleProgId ?? '') as ModelKey);
  }, [prop.selectedItemEdit]);


  const [linkType, setLinkType] = React.useState<MenuUrlType>(1);
  const [modelKey, setModelKey] = React.useState<ModelKey>('');
  const [navType, setNavType] = React.useState<MenuUrlType>(1);
  React.useEffect(() => {
    setTabResetSeed(s => s + 1);
  }, [prop.selectedItemEdit?.MenuItem?.Item?.RowId, linkType]);
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
  const componentsA = {
    basic: [<BasicSettingTab key="basic" theme={prop.theme} selectedItemEdit={prop.selectedItemEdit} formData={prop.formData} itemType={prop.menuUrlType} windowTarget={prop.windowTarget} setLinkType={setLinkType} />],
    module: [<ModuleSettingTab key="module" theme={prop.theme} selectedItemEdit={prop.selectedItemEdit} formData={prop.formData} modulePageType={prop.modulePageType} windowTarget={prop.windowTarget} modelKey={modelKey} setModelKey={setModelKey} bannerDict={prop.bannerDict} moduleDisplayStyle={prop.moduleDisplayStyle} categoryDatas={prop.categoryDatas} tagDatas={prop.tagDatas} pageList={prop.pageList} specCateDatas={prop.specCateDatas} />],
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
            <div className="mt-4 overflow-scroll-customize">
              <TabContentComp key={`tabs-${tabResetSeed}`} tabInfos={LibTabsPropA} components={componentsA} />
            </div>
            <div className="d-flex justify-content-center">
              <button type="button" className="btn btn-custom btn-rounded btn-sm mr-2 mb-2" onClick={prop.action.onSave}>儲存</button>
              <button type="button" className="btn btn-custom btn-rounded btn-sm mr-2 mb-2" onClick={prop.action.onCancelBack}>取消</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
const syncTreeToForm = (
  tree: Item[],
  formData: UseFetchFormDataResult<SiteMenuSet>
) => {
  // 把樹攤平成「RowId → 更新值」對照表
  const updates = new Map<number, { ParentRowId: number | null; Level: number; DisplayOrder: number }>();

  const walk = (nodes: Item[] | undefined, parentId: number | null, level: number) => {
    if (!nodes) return;
    nodes.forEach((n, idx) => {
      updates.set(Number(n.id), {
        ParentRowId: parentId,
        Level: level,                 // 根層從 1 開始
        DisplayOrder: idx + 1,        // 同層從 1 起連號
      });
      if (n.children && n.children.length) walk(n.children, Number(n.id), level + 1);
    });
  };

  walk(tree, null, 1);

  // 把對照結果回寫到 formData
  formData.setFormData(prev => {
    if (!prev) return prev;
    const next: SiteMenuSet = { ...prev };
    const list = [...(next.SiteMenu_Item ?? [])];

    next.SiteMenu_Item = list.map(it => {
      const rowId = Number((it as any).RowId);
      const u = updates.get(rowId);
      if (!u) return it; // 可能是資料中有但左側未呈現的項目
      return {
        ...it,
        ParentRowId: u.ParentRowId,
        Level: u.Level,
        DisplayOrder: u.DisplayOrder,
      } as SiteMenu_Item;
    });

    return next;
  });
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
  const dedupDetails = React.useMemo(() => {
    const seen = new Set<string>();
    const out: typeof rawDetails = [];
    for (const d of rawDetails) {
      const k = String((d as any).Lang ?? '').toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(d);
    }
    return out;
  }, [rawDetails]);
  const curRowKeys = { [SiteMenu_ItemFields.SiteIndex]: prop.selectedItemEdit?.MenuItem.Item.SiteIndex, [SiteMenu_ItemFields.RowId]: prop.selectedItemEdit?.MenuItem.Item.RowId }
  const itemTypeBind = setField(SiteMenuSetFields.SiteMenu_Item, SiteMenu_ItemFields.ItemType, "number", curRowKeys);
  const tabInfo: LibTabsProp = {
    Style: prop.theme.Tabs,
    item: dedupDetails.reduce<Record<string, string>>((tabItems, info) => {
      const langKey = LibMerge("_", true, info.SiteIndex, info.ItemRowId, info.RowId, info.Lang)
      tabItems[langKey] = LangLabelMap[info.Lang as Lang] ?? info.Lang ?? "Unknown";
      return tabItems;
    }, {})
  }
  const tabContent: Record<string, React.ReactNode[]> = dedupDetails.reduce<Record<string, React.ReactNode[]>>(
    (compMap, info) => {
      const langKey = LibMerge("_", true, info.SiteIndex, info.ItemRowId, info.RowId, info.Lang)
      const rowKeys = { [SiteMenu_Item_TitleFields.SiteIndex]: info.SiteIndex, [SiteMenu_Item_TitleFields.ItemRowId]: info.ItemRowId, [SiteMenu_Item_TitleFields.RowId]: info.RowId, }
      compMap[langKey] = [
        <LibTextBox Style={prop.theme.TextBox} DefaultInputDisplay="請輸入" {...setField(SiteMenuSetFields.SiteMenu_Item_Title, SiteMenu_Item_TitleFields.Title, "string", rowKeys)} />,
        <LibCheckBox Style={prop.theme.CheckBox} options={{ [SiteMenu_Item_TitleFields.IsShowOnMenu]: "" }}{...setField(SiteMenuSetFields.SiteMenu_Item_Title, SiteMenu_Item_TitleFields.IsShowOnMenu, "boolean", rowKeys)} />
      ]
      return compMap;
    }, {}
  );
  // ---- 基本分頁：把「功能連結」做成 radio，切換時會改變主 Tabs ----
  const basicNodes: React.ReactNode = React.useMemo(() => (<>
    <LibTextBox Style={prop.theme.TextBox} DefaultInputDisplay="請輸入數字或英文，不可使用空白的"  {...setField(SiteMenuSetFields.SiteMenu_Item, SiteMenu_ItemFields.ItemSiteUrl, "string", curRowKeys)} />
    <LibTextBox disabled={true} Style={prop.theme.TextBox} DefaultInputDisplay="" {...setField(SiteMenuSetFields.SiteMenu_Item, SiteMenu_ItemFields.FullUrl, "string", curRowKeys)} />
    <LibCheckBox Style={prop.theme.RadioBox} options={prop.itemType} ColumnDisplayName={itemTypeBind.ColumnDisplayName} InputValue={itemTypeBind.InputValue} onChange={(v) => { itemTypeBind.onChange?.(v); prop.setLinkType(Number(v) as MenuUrlType); }} />
    <LibCheckBox Style={prop.theme.RadioBox} options={prop.windowTarget} {...setField(SiteMenuSetFields.SiteMenu_Item, SiteMenu_ItemFields.WindowTarget, "number", curRowKeys)} />
    <TabContentComp tabInfos={tabInfo} components={tabContent} />
  </>), [prop.theme, prop.formData, prop.selectedItemEdit]);
  return basicNodes
}
//#endregion


//#region 模型配置
const ModuleOpts: Record<string, string> = {
  Announcement: "公告", FileArchive: "檔案室", Gallery: "相簿",
  PageManagement: "頁面", WebResource: "網路資源", SpecResearch: "研究計劃", SpecUSR: "USR計劃",
  SpecMusical: "琵琶介紹", SpecJournal: "期刊"
};

const ModuleSettingTab = (prop: {
  theme: IBETheme; selectedItemEdit: Item | null; modelKey: ModelKey;
  formData: UseFetchFormDataResult<SiteMenuSet>;
  setModelKey: React.Dispatch<React.SetStateAction<ModelKey>>;
  modulePageType: Record<string, string>; windowTarget: Record<string, string>;
  bannerDict: Record<string, string>; moduleDisplayStyle: Record<string, string>;
  categoryDatas: CategorySet[]; tagDatas: TagSet[]; pageList: PageSet[]; specCateDatas: SpecCategorySet[];
}) => {
  const setField = useSetTableField<SiteMenuSet>(prop.formData);
  const siteIndex = prop.selectedItemEdit?.MenuItem.Item.SiteIndex;
  const rowId = prop.selectedItemEdit?.MenuItem.Item.RowId;

  const allowMap: Record<ModelKey, number[]> = {
    "": [],
    Announcement: [1, 2, 3, 8],
    Gallery: [1, 4],
    FileArchive: [1, 5, 6],
    WebResource: [1, 2, 7],
    PageManagement: [],
    SpecResearch: [], SpecUSR: [], SpecMusical: []
  };
  const getStyleOptionsByModule = (
    moduleKey: ModelKey,
    fullDict: Record<number, string>
  ): Record<string, string> => {
    const ids = allowMap[moduleKey] ?? [];
    if (ids.length === 0) return {};            // 該模組無可選樣式
    const dict: Record<string, string> = {};
    // 依 ids 的順序建立 options
    for (const id of ids) {
      const k = String(id);
      // fullDict 可能用 number key，也可能已被序列化成字串 key，兩者都試一次
      const name = (fullDict as any)[id] ?? (fullDict as any)[k] ?? `樣式 #${id}`;
      dict[k] = name;
    }
    return dict;
  };
  const filteredStyleDict = React.useMemo(() => getStyleOptionsByModule(prop.modelKey, prop.moduleDisplayStyle), [prop.modelKey, prop.moduleDisplayStyle]);
  const curRowKeys = React.useMemo(() => ({
    [SiteMenu_Item_ModuleFields.SiteIndex]: siteIndex,
    [SiteMenu_Item_ModuleFields.ItemRowId]: rowId
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
  const moduleKeyBind = setField(SiteMenuSetFields.SiteMenu_Item_Module, SiteMenu_Item_ModuleFields.ModuleProgId, "string", curRowKeys);
  const moduleNodes: React.ReactNode[] = React.useMemo(() => {
    const nodes: React.ReactNode[] = [
      <LibSelectCard key="basic_Setting" ColDisplayName="基礎設定" components={[<LibCheckBox Style={prop.theme.RadioBox} options={prop.modulePageType} {...setField(SiteMenuSetFields.SiteMenu_Item_Module, SiteMenu_Item_ModuleFields.PageType, "number", curRowKeys)} />,
      <Module_Banner_Comp theme={prop.theme} formData={prop.formData} selectedItemEdit={prop.selectedItemEdit} bannerDict={prop.bannerDict} />,
      <LibDropList key="model" Style={prop.theme.DropList} Options={ModuleOpts}
        ColumnDisplayName={moduleKeyBind.ColumnDisplayName}
        InputValue={moduleKeyBind.InputValue} AutoDefaultFirst={false}
        onChange={(v) => { moduleKeyBind.onChange?.(v); prop.setModelKey(v as ModelKey); }} />,]} />,
    ];
    const map: Record<Exclude<ModelKey, null>, React.ReactNode> = {
      Announcement: <Module_Announcement_Comp theme={prop.theme} formData={prop.formData} selectedItemEdit={prop.selectedItemEdit} styleDict={filteredStyleDict} categoryDatas={prop.categoryDatas} tagDatas={prop.tagDatas} lang={DefaultLang} />,
      PageManagement: <Module_Pagemanagement_Comp theme={prop.theme} formData={prop.formData} selectedItemEdit={prop.selectedItemEdit} pageList={prop.pageList} lang={DefaultLang} />,
      Gallery: <Module_Gallery_Comp theme={prop.theme} formData={prop.formData} selectedItemEdit={prop.selectedItemEdit} styleDict={filteredStyleDict} categoryDatas={prop.categoryDatas} tagDatas={prop.tagDatas} lang={DefaultLang} />,
      FileArchive: <Module_FileArchive_Comp theme={prop.theme} formData={prop.formData} selectedItemEdit={prop.selectedItemEdit} styleDict={filteredStyleDict} categoryDatas={prop.categoryDatas} tagDatas={prop.tagDatas} lang={DefaultLang} />,
      WebResource: <Module_WebResource_Comp theme={prop.theme} formData={prop.formData} selectedItemEdit={prop.selectedItemEdit} styleDict={filteredStyleDict} categoryDatas={prop.categoryDatas} tagDatas={prop.tagDatas} lang={DefaultLang} />,
      SpecResearch: <Module_SpecResearch_Comp theme={prop.theme} formData={prop.formData} selectedItemEdit={prop.selectedItemEdit} styleDict={filteredStyleDict} categoryDatas={prop.specCateDatas} tagDatas={prop.tagDatas} lang={DefaultLang} />,
      SpecUSR: <Module_SpecUSR_Comp theme={prop.theme} formData={prop.formData} selectedItemEdit={prop.selectedItemEdit} styleDict={filteredStyleDict} categoryDatas={prop.specCateDatas} tagDatas={prop.tagDatas} lang={DefaultLang} />,
      SpecMusical: <Module_SpecMusical_Comp theme={prop.theme} formData={prop.formData} selectedItemEdit={prop.selectedItemEdit} styleDict={filteredStyleDict} categoryDatas={prop.categoryDatas} tagDatas={prop.tagDatas} lang={DefaultLang} />,

      "": []
    };
    if (prop.modelKey) {
      const label = {
        Banner: '輪播設定', Announcement: '公告設定', PageManagement: '頁面設定', Gallery: '相簿設定', FileArchive: '檔案室設定', WebResource: '網路資源設定',
        SpecUSR: 'USR計劃', SpecResearch: '研究計劃', SpecMusical: '琵琶介紹'
      }[prop.modelKey];
      nodes.push(<LibSelectCard key="onlyOne" ColDisplayName={label ?? ""} components={map[prop.modelKey]} />);
    }
    return nodes;
  }, [prop.theme, prop.formData, prop.modelKey, prop.selectedItemEdit, filteredStyleDict]);
  return moduleNodes;
}
const Module_Banner_Comp = (prop: { theme: IBETheme; formData: UseFetchFormDataResult<SiteMenuSet>; selectedItemEdit: Item | null; bannerDict: Record<string, string> }): React.ReactNode[] => {
  const curRowKeys = { [SiteMenu_Item_ModuleFields.SiteIndex]: prop.selectedItemEdit?.MenuItem.Item.SiteIndex, [SiteMenu_Item_ModuleFields.ItemRowId]: prop.selectedItemEdit?.MenuItem.Item.RowId }
  const setField = useSetTableField<SiteMenuSet>(prop.formData);
  return ([<LibDropList Style={prop.theme.DropList} Options={prop.bannerDict} AutoDefaultFirst={false} {...setField(SiteMenuSetFields.SiteMenu_Item_Module, SiteMenu_Item_ModuleFields.BannerId, "string", curRowKeys)} />])
}
const Module_Announcement_Comp = (prop: {
  theme: IBETheme; formData: UseFetchFormDataResult<SiteMenuSet>; selectedItemEdit: Item | null; styleDict: Record<string, string>;
  lang: Lang; categoryDatas: CategorySet[]; tagDatas: TagSet[];
}) => {
  const curRowKeys = { [SiteMenu_Item_ModuleFields.SiteIndex]: prop.selectedItemEdit?.MenuItem.Item.SiteIndex, [SiteMenu_Item_ModuleFields.ItemRowId]: prop.selectedItemEdit?.MenuItem.Item.RowId }
  const binder = useSetJsonField<SiteMenuSet, ModuleOptionsJson>(prop.formData, SiteMenuSetFields.SiteMenu_Item_Module, SiteMenu_Item_ModuleFields.ModuleOptions, curRowKeys, moduleOptionsDefaults);
  const catBind = binder.bind("Category", "csv");
  const tagBind = binder.bind("Tag", "csv");
  const styleBind = binder.bind("Style", "number");
  const cateDic = useCategoryDict(prop.categoryDatas, prop.lang, "Announcement")
  const tagDic = useTagDict(prop.tagDatas, prop.lang, "Announcement")
  return (
    <>
      <LibCheckBox Style={prop.theme.CheckBox} ColumnDisplayName="類別" options={cateDic} InputValue={catBind.value} onChange={catBind.onChange} />
      <LibCheckBox Style={prop.theme.CheckBox} ColumnDisplayName="標籤" options={tagDic} InputValue={tagBind.value} onChange={tagBind.onChange} />
      <LibDropList Style={prop.theme.DropList} ColumnDisplayName="清單樣式" Options={prop.styleDict} InputValue={styleBind.value} onChange={styleBind.onChange} AutoDefaultFirst={false} />
    </>
  )
}
const Module_Pagemanagement_Comp = (prop: { theme: IBETheme; formData: UseFetchFormDataResult<SiteMenuSet>; selectedItemEdit: Item | null; pageList: PageSet[]; lang: Lang }): React.ReactNode[] => {
  const curRowKeys = { [SiteMenu_Item_ModuleFields.SiteIndex]: prop.selectedItemEdit?.MenuItem.Item.SiteIndex, [SiteMenu_Item_ModuleFields.ItemRowId]: prop.selectedItemEdit?.MenuItem.Item.RowId }
  const binder = useSetJsonField<SiteMenuSet, ModuleOptionsJson>(
    prop.formData,
    SiteMenuSetFields.SiteMenu_Item_Module,
    SiteMenu_Item_ModuleFields.ModuleOptions,
    curRowKeys,
    moduleOptionsDefaults
  );
  const pageBind = binder.bind("PageId", "string");
  const usePageDict = React.useMemo<Record<string, string>>(() => {
    const src = prop.pageList ?? [];
    return src.reduce<Record<string, string>>((acc, p) => {
      if (!p?.PageManagement) return acc;
      // 以 CategoryId 為主，沒有就退回 RowId
      const key = String(p.PageManagement.InternalId);
      if (!key) return acc;
      const detail = (p.PageManagementDetail ?? []).find(d => d?.Lang === prop.lang);
      const name = detail?.Title?.trim();
      if (!name) return acc;
      acc[key] = name;
      return acc;
    }, {});
  }, [prop.lang, prop.pageList]);

  return ([
    <LibDropList Style={prop.theme.DropList} ColumnDisplayName="頁面選擇" Options={usePageDict} AutoDefaultFirst={false} InputValue={pageBind.value} onChange={pageBind.onChange} />,
  ])
}
const Module_Gallery_Comp = (prop: {
  theme: IBETheme; formData: UseFetchFormDataResult<SiteMenuSet>; selectedItemEdit: Item | null; styleDict: Record<string, string>;
  lang: Lang; categoryDatas: CategorySet[]; tagDatas: TagSet[];
}): React.ReactNode[] => {
  const curRowKeys = { [SiteMenu_Item_ModuleFields.SiteIndex]: prop.selectedItemEdit?.MenuItem.Item.SiteIndex, [SiteMenu_Item_ModuleFields.ItemRowId]: prop.selectedItemEdit?.MenuItem.Item.RowId }
  const binder = useSetJsonField<SiteMenuSet, ModuleOptionsJson>(
    prop.formData,
    SiteMenuSetFields.SiteMenu_Item_Module,
    SiteMenu_Item_ModuleFields.ModuleOptions,
    curRowKeys,
    moduleOptionsDefaults
  );
  const catBind = binder.bind("Category", "csv");
  const tagBind = binder.bind("Tag", "csv");
  const styleBind = binder.bind("Style", "number");
  const cateDic = useCategoryDict(prop.categoryDatas, prop.lang, "Gallery")
  const tagDic = useTagDict(prop.tagDatas, prop.lang, "Gallery")
  return ([
    <LibCheckBox Style={prop.theme.CheckBox} ColumnDisplayName="類別" options={cateDic} InputValue={catBind.value} onChange={catBind.onChange} />,
    <LibCheckBox Style={prop.theme.CheckBox} ColumnDisplayName="標籤" options={tagDic} InputValue={tagBind.value} onChange={tagBind.onChange} />,
    <LibDropList Style={prop.theme.DropList} ColumnDisplayName="清單樣式" Options={prop.styleDict} InputValue={styleBind.value} onChange={styleBind.onChange} AutoDefaultFirst={false} />,
  ])
}
const Module_FileArchive_Comp = (prop: {
  theme: IBETheme; formData: UseFetchFormDataResult<SiteMenuSet>; selectedItemEdit: Item | null; styleDict: Record<string, string>;
  lang: Lang; categoryDatas: CategorySet[]; tagDatas: TagSet[];
}): React.ReactNode[] => {
  const curRowKeys = { [SiteMenu_Item_ModuleFields.SiteIndex]: prop.selectedItemEdit?.MenuItem.Item.SiteIndex, [SiteMenu_Item_ModuleFields.ItemRowId]: prop.selectedItemEdit?.MenuItem.Item.RowId }
  const binder = useSetJsonField<SiteMenuSet, ModuleOptionsJson>(
    prop.formData,
    SiteMenuSetFields.SiteMenu_Item_Module,
    SiteMenu_Item_ModuleFields.ModuleOptions,
    curRowKeys,
    moduleOptionsDefaults
  );
  const catBind = binder.bind("Category", "csv");
  const tagBind = binder.bind("Tag", "csv");
  const styleBind = binder.bind("Style", "number");
  const cateDic = useCategoryDict(prop.categoryDatas, prop.lang, "FileArchive")
  const tagDic = useTagDict(prop.tagDatas, prop.lang, "FileArchive")
  return ([
    <LibCheckBox Style={prop.theme.CheckBox} ColumnDisplayName="類別" options={cateDic} InputValue={catBind.value} onChange={catBind.onChange} />,
    <LibCheckBox Style={prop.theme.CheckBox} ColumnDisplayName="標籤" options={tagDic} InputValue={tagBind.value} onChange={tagBind.onChange} />,
    <LibDropList Style={prop.theme.DropList} ColumnDisplayName="清單樣式" Options={prop.styleDict} InputValue={styleBind.value} onChange={styleBind.onChange} AutoDefaultFirst={false} />,
  ])
}
const Module_WebResource_Comp = (prop: {
  theme: IBETheme; formData: UseFetchFormDataResult<SiteMenuSet>; selectedItemEdit: Item | null; styleDict: Record<string, string>;
  lang: Lang; categoryDatas: CategorySet[]; tagDatas: TagSet[];
}): React.ReactNode[] => {
  const curRowKeys = { [SiteMenu_Item_ModuleFields.SiteIndex]: prop.selectedItemEdit?.MenuItem.Item.SiteIndex, [SiteMenu_Item_ModuleFields.ItemRowId]: prop.selectedItemEdit?.MenuItem.Item.RowId }
  const binder = useSetJsonField<SiteMenuSet, ModuleOptionsJson>(
    prop.formData,
    SiteMenuSetFields.SiteMenu_Item_Module,
    SiteMenu_Item_ModuleFields.ModuleOptions,
    curRowKeys,
    moduleOptionsDefaults
  );
  const catBind = binder.bind("Category", "csv");
  const tagBind = binder.bind("Tag", "csv");
  const styleBind = binder.bind("Style", "number");
  const cateDic = useCategoryDict(prop.categoryDatas, prop.lang, "WebResource")
  const tagDic = useTagDict(prop.tagDatas, prop.lang, "WebResource")
  return ([
    <LibCheckBox Style={prop.theme.CheckBox} ColumnDisplayName="類別" options={cateDic} InputValue={catBind.value} onChange={catBind.onChange} />,
    <LibCheckBox Style={prop.theme.CheckBox} ColumnDisplayName="標籤" options={tagDic} InputValue={tagBind.value} onChange={tagBind.onChange} />,
    <LibDropList Style={prop.theme.DropList} ColumnDisplayName="清單樣式" Options={prop.styleDict} InputValue={styleBind.value} onChange={styleBind.onChange} AutoDefaultFirst={false} />,
  ])
}
const Module_SpecResearch_Comp = (prop: {
  theme: IBETheme; formData: UseFetchFormDataResult<SiteMenuSet>; selectedItemEdit: Item | null; styleDict: Record<string, string>;
  lang: Lang; categoryDatas: SpecCategorySet[]; tagDatas: TagSet[];
}): React.ReactNode[] => {
  const curRowKeys = { [SiteMenu_Item_ModuleFields.SiteIndex]: prop.selectedItemEdit?.MenuItem.Item.SiteIndex, [SiteMenu_Item_ModuleFields.ItemRowId]: prop.selectedItemEdit?.MenuItem.Item.RowId }
  const binder = useSetJsonField<SiteMenuSet, ModuleOptionsJson>(
    prop.formData,
    SiteMenuSetFields.SiteMenu_Item_Module,
    SiteMenu_Item_ModuleFields.ModuleOptions,
    curRowKeys,
    moduleOptionsDefaults
  );
  const catBind = binder.bind("Category", "string");
  const tagBind = binder.bind("Tag", "csv");
  const cateDic = useSpecCategoryDict(prop.categoryDatas, prop.lang, "SpecResearch")
  const tagDic = useTagDict(prop.tagDatas, prop.lang, "SpecResearch")
  return ([
    <LibDropList Style={prop.theme.DropList} ColumnDisplayName="類別" Options={cateDic} InputValue={catBind.value} onChange={catBind.onChange} AutoDefaultFirst={false} />,
    <LibCheckBox Style={prop.theme.CheckBox} ColumnDisplayName="標籤" options={tagDic} InputValue={tagBind.value} onChange={tagBind.onChange} />,
  ])
}
const Module_SpecUSR_Comp = (prop: {
  theme: IBETheme; formData: UseFetchFormDataResult<SiteMenuSet>; selectedItemEdit: Item | null; styleDict: Record<string, string>;
  lang: Lang; categoryDatas: SpecCategorySet[]; tagDatas: TagSet[];
}): React.ReactNode[] => {
  const curRowKeys = { [SiteMenu_Item_ModuleFields.SiteIndex]: prop.selectedItemEdit?.MenuItem.Item.SiteIndex, [SiteMenu_Item_ModuleFields.ItemRowId]: prop.selectedItemEdit?.MenuItem.Item.RowId }
  const binder = useSetJsonField<SiteMenuSet, ModuleOptionsJson>(
    prop.formData,
    SiteMenuSetFields.SiteMenu_Item_Module,
    SiteMenu_Item_ModuleFields.ModuleOptions,
    curRowKeys,
    moduleOptionsDefaults
  );
  const catBind = binder.bind("Category", "string");
  const tagBind = binder.bind("Tag", "csv");
  const cateDic = useSpecCategoryDict(prop.categoryDatas, prop.lang, "SpecUSR")
  const tagDic = useTagDict(prop.tagDatas, prop.lang, "SpecUSR")
  return ([
    <LibDropList Style={prop.theme.DropList} ColumnDisplayName="類別" Options={cateDic} InputValue={catBind.value} onChange={catBind.onChange} AutoDefaultFirst={false} />,
    <LibCheckBox Style={prop.theme.CheckBox} ColumnDisplayName="標籤" options={tagDic} InputValue={tagBind.value} onChange={tagBind.onChange} />,
  ])
}
const Module_SpecMusical_Comp = (prop: {
  theme: IBETheme; formData: UseFetchFormDataResult<SiteMenuSet>; selectedItemEdit: Item | null; styleDict: Record<string, string>;
  lang: Lang; categoryDatas: CategorySet[]; tagDatas: TagSet[];
}): React.ReactNode[] => {
  const curRowKeys = { [SiteMenu_Item_ModuleFields.SiteIndex]: prop.selectedItemEdit?.MenuItem.Item.SiteIndex, [SiteMenu_Item_ModuleFields.ItemRowId]: prop.selectedItemEdit?.MenuItem.Item.RowId }
  const binder = useSetJsonField<SiteMenuSet, ModuleOptionsJson>(
    prop.formData,
    SiteMenuSetFields.SiteMenu_Item_Module,
    SiteMenu_Item_ModuleFields.ModuleOptions,
    curRowKeys,
    moduleOptionsDefaults
  );
  const catBind = binder.bind("Category", "string");
  const cateDic = useCategoryDict(prop.categoryDatas, prop.lang, SpecPGID.SpecMusical)
  return ([
    <LibDropList Style={prop.theme.DropList} ColumnDisplayName="類別" Options={cateDic} InputValue={catBind.value} onChange={catBind.onChange} AutoDefaultFirst={false} />,
  ])
}


const useCategoryDict = (data: CategorySet[], lang: string, progId: string | number) =>
  React.useMemo<Record<string, string>>(() => {
    const src = data ?? [];
    const progKey = String(progId);
    return src.reduce<Record<string, string>>((acc, p) => {
      if (!p?.Category) return acc;
      if (String(p.Category.ProgId ?? "") !== progKey) return acc;
      // 以 CategoryId 為主，沒有就退回 RowId
      const key = String(p.Category.CategoryId);
      if (!key) return acc;
      const detail = (p.CategoryDetail ?? []).find(d => d?.Lang === lang);
      const name = detail?.CategoryName?.trim();
      if (!name) return acc;
      acc[key] = name;
      return acc;
    }, {});
  }, [data, lang, progId]);
const useTagDict = (data: TagSet[], lang: string, progId: string | number) =>
  React.useMemo<Record<string, string>>(() => {
    const src = data ?? [];
    const progKey = String(progId);
    return src.reduce<Record<string, string>>((acc, p) => {
      if (!p?.TagData) return acc;
      if (String(p.TagData.ProgId ?? "") !== progKey) return acc;
      // 以 CategoryId 為主，沒有就退回 RowId
      const key = String(p.TagData.TagId);
      if (!key) return acc;
      const detail = (p.TagDetail ?? []).find(d => d?.Lang === lang);
      const name = detail?.TagName?.trim();
      if (!name) return acc;
      acc[key] = name;
      return acc;
    }, {});
  }, [data, lang, progId]);
const useSpecCategoryDict = (data: SpecCategorySet[], lang: string, progId: string | number) =>
  React.useMemo<Record<string, string>>(() => {
    const src = data ?? [];
    const progKey = String(progId);
    return src.reduce<Record<string, string>>((acc, p) => {
      if (!p?.SpecCategory) return acc;
      if (String(p.SpecCategory.ProgId ?? "") !== progKey) return acc;
      // 以 CategoryId 為主，沒有就退回 RowId
      const key = String(p.SpecCategory.CategoryId);
      if (!key) return acc;
      const detail = (p.SpecCategoryDetail ?? []).find(d => d?.Lang === lang);
      const name = detail?.CategoryName?.trim();
      if (!name) return acc;
      acc[key] = name;
      return acc;
    }, {});
  }, [data, lang, progId]);
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
    [SiteMenu_Item_UrlFields.SiteIndex]: siteIndex,
    [SiteMenu_Item_UrlFields.ItemRowId]: rowId
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
  const redirectBind = setField(SiteMenuSetFields.SiteMenu_Item_Url, SiteMenu_Item_UrlFields.RedirectType, "number", curRowKeys);
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
        nodes.push(<LibTextBox Style={prop.theme.TextBox} DefaultInputDisplay="請輸入數字或英文，不可使用空白的" {...setField(SiteMenuSetFields.SiteMenu_Item_Url, SiteMenu_Item_UrlFields.RedirectUrl, "string", curRowKeys)} />);
        break;
      case 2:
        nodes.push(<LibDropList Style={prop.theme.DropList} Options={internalUrlOptions} AutoDefaultFirst={false} {...setField(SiteMenuSetFields.SiteMenu_Item_Url, SiteMenu_Item_UrlFields.RedirectUrl, "string", curRowKeys)} />);
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