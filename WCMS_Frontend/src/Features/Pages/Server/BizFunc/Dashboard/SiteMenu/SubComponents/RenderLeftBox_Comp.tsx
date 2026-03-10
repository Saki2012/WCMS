import { useCallback, useEffect, useMemo, useState, type ComponentProps, type Dispatch} from "react";
import Nestable from "react-nestable";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import type { components } from "@/types/api";
import type { Lang } from "@/SysCore/i18n/lang";
import type { UseActionsResult } from "@/Features/Hooks/Common/useActions";
import type { SiteMenuEditTarget, SiteMenuItem } from "../SiteMenu_Hook";
type SiteMenuSet = components["schemas"]["SiteMenuSet_DTO"]
type SiteMenu_Item = components["schemas"]["SiteMenu_Item_DTO"]
type SiteMenu_IndexInfo = components["schemas"]["SiteMenu_IndexInfo_DTO"]
type SiteMenu_Item_Title = components["schemas"]["SiteMenu_Item_Title_DTO"]
type SiteMenu_Item_Module = components["schemas"]["SiteMenu_Item_Module_DTO"]
type SiteMenu_Item_Url = components["schemas"]["SiteMenu_Item_Url_DTO"]

type RenderLeftBoxProp = {
  setSelectedItemEdit: Dispatch<SiteMenuEditTarget>;
  siteMenuItems: SiteMenuItem[];
  lang: Lang;
  formData: UseFetchFormDataResult<SiteMenuSet>;
  action: UseActionsResult;
};
type NestableOnChange = NonNullable<ComponentProps<typeof Nestable>["onChange"]>;
type NestableRenderItem = NonNullable<ComponentProps<typeof Nestable>["renderItem"]>;

export const RenderLeftBox = (prop: RenderLeftBoxProp) => {
  const [collapseAll, setCollapseAll] = useState(false);
  const [items, setItems] = useState<SiteMenuItem[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [candidate, setCandidate] = useState<SiteMenuItem | null>(null);
  useEffect(() => { setItems(prop.siteMenuItems); }, [prop.siteMenuItems]);
  const siteInfoTitle = useMemo(() => {return resolveSiteInfoTitle(prop.formData.data, prop.lang);}, [prop.formData.data, prop.lang]);
  const handleSelectSiteInfo = useCallback(() => {prop.setSelectedItemEdit({type: "site",title: siteInfoTitle,});}, [prop, siteInfoTitle]);
  /** 選取左側項目，供右側編輯 */
  const handleSelectItem = useCallback((item: SiteMenuItem) => {prop.setSelectedItemEdit({type: "menu",item,});}, [prop]);
  /** 開啟刪除確認視窗 */
  const handleDeleteItem = useCallback((item: SiteMenuItem) => {setCandidate(item);setConfirmOpen(true);}, []);
  /** 關閉刪除確認視窗 */
  const handleCloseConfirm = useCallback(() => {setConfirmOpen(false);setCandidate(null);}, []);
  /** 新增一筆主層/子層選單 */
  const handleAddMenuItem = useCallback((parent: SiteMenuItem | null) => {
    const nextRowId = (() => {
      const all = prop.formData.data?.SiteMenu_Item ?? [];
      const max = all.reduce((m, x) => Math.max(m, Number(x?.RowId ?? 0)), 0);
      return max + 1;
    })();
    const nextTitleRowId = (() => {
      const all = prop.formData.data?.SiteMenu_Item_Title ?? [];
      const max = all.reduce((m, x) => Math.max(m, Number(x?.RowId ?? 0)), 0);
      return max + 1;
    })();
    const sampleSiteIndex = prop.formData.data?.SiteMenu_Item?.[0]?.SiteIndex ?? prop.formData.data?.SiteMenu_Index?.SiteIndex ?? "";
    const level = parent ? Number(parent.menuItem?.Level ?? 1) + 1 : 1;
    prop.formData.setFormData((prev) => {
      const next = { ...(prev ?? {}) } as SiteMenuSet;
      next.SiteMenu_Item = [
        ...(next.SiteMenu_Item ?? []),
        {
          SiteIndex: sampleSiteIndex,
          RowId: nextRowId,
          ParentRowId: parent ? parent.id : null,
          Level: level,
          DisplayOrder: 9999,
          ItemSiteUrl: "",
          FullUrl: "",
          ItemType: 1,
          WindowTarget: 0,
        } as SiteMenu_Item,
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
        } as SiteMenu_Item_Title,
      ];
      return next;
    });
    const newNode: SiteMenuItem = {
      id: nextRowId,
      name: "",
      menuItem: {
        SiteIndex: sampleSiteIndex,
        RowId: nextRowId,
        ParentRowId: parent ? parent.id : null,
        Level: level,
        DisplayOrder: 9999,
        ItemSiteUrl: "",
        FullUrl: "",
        ItemType: 1,
        WindowTarget: 0,
      } as SiteMenu_Item,
      children: [],
    };
    setItems((prev) => {
      const nextTree = !parent
        ? [...prev, newNode]
        : appendChildNode(prev, parent.id, newNode);
      syncTreeToForm(nextTree, prop.formData);
      setTimeout(() => {prop.setSelectedItemEdit({type: "menu",item: newNode,});}, 0);
      return nextTree;
    });
  }, [prop]);
  /** 新增子層 */
  const handleAddChildItem = useCallback((item: SiteMenuItem) => {handleAddMenuItem(item);}, [handleAddMenuItem]);
  /** 刪除此項目與全部子層 */
  const handleDeleteAll = useCallback(() => {
    if (!candidate) return;
    const ids = new Set<number>(collectRowIds(candidate));
    const newTree = removeNodeAndSubtree(items, candidate.id);
    setItems(newTree);
    applyRemovalToForm(prop.formData, ids);
    syncTreeToForm(newTree, prop.formData);
    handleCloseConfirm();
    prop.setSelectedItemEdit(null);
  }, [candidate, handleCloseConfirm, items, prop]);
  /** 僅刪除此層，子層往上提升 */
  const handleDeleteOne = useCallback(() => {
    if (!candidate) return;
    const newTree = promoteChildrenToParent(items, candidate.id);
    const idOnly = new Set<number>([Number(candidate.menuItem?.RowId ?? candidate.id)]);
        setItems(newTree);
        applyRemovalToForm(prop.formData, idOnly);
        syncTreeToForm(newTree, prop.formData);
        handleCloseConfirm();
        prop.setSelectedItemEdit(null);
    }, [candidate, handleCloseConfirm, items, prop]);
    /** 拖拉排序後同步回 formData */
    const handleChange: NestableOnChange = useCallback((arg) => {
    const nextItems = (arg.items ?? []) as SiteMenuItem[];
    setItems(nextItems);
    syncTreeToForm(nextItems, prop.formData);
    }, [prop.formData]);
    const renderItem: NestableRenderItem = useCallback(({ item, handler, collapseIcon }) => {
        return (<Item_Comp item={item as SiteMenuItem} handler={handler} collapseIcon={collapseIcon} onSelect={handleSelectItem} onAddChild={handleAddChildItem} onDelete={handleDeleteItem}/>);
    }, [handleAddChildItem, handleDeleteItem, handleSelectItem]);
    return (
        <>
            <div className="col-xxl-5 col-12 left-box">
                <div className="panel">
                <div className="panel-body">
                    <div className="mb-2">
                        <button onClick={() => setCollapseAll(!collapseAll)} className="btn btn-custom btn-rounded btn-sm mr-2 mb-2">{collapseAll ? "展開" : "收合"}</button>
                        <button type="button" className="btn btn-custom btn-rounded btn-sm mr-2 mb-2" onClick={prop.action.onSave}>儲存</button>
                        <button type="button" className="btn btn-custom btn-rounded btn-sm mr-2 mb-2" onClick={() => handleAddMenuItem(null)}>新增</button>
                    </div>
                    <div className="cf nestable-lists">
                        <ol className="dd-list">
                          <SiteInfoItem_Comp title={siteInfoTitle} onSelect={handleSelectSiteInfo} />
                        </ol>
                    </div>
                    <div className="cf nestable-lists">
                        <Nestable items={items || []} renderItem={renderItem} onChange={handleChange} className="dd-list" collapsed={collapseAll} />
                    </div>
                </div>
                </div>
            </div>
            {confirmOpen && candidate && (<ComfirmDialog_Comp candidate={candidate} onDeleteAll={handleDeleteAll} onDeleteOne={handleDeleteOne} onCancel={handleCloseConfirm}/>)}
        </>
    )
}

const SiteInfoItem_Comp = (prop: { title: string; onSelect: () => void }) => {
  const handleEditClick = (e: React.MouseEvent<HTMLButtonElement>) => {e.stopPropagation(); prop.onSelect();};
  return (
    <div className="dd-item dd3-item">
      <div className="dd-handle dd3-handle" />
      <div className="dd3-content content_bar" onClick={prop.onSelect} style={{ cursor: "pointer" }}>
        <span style={{ flex: 1, padding: "0 10px 0 3px" }}>
          <i className="fa fa-globe mr-2" title="網站整體資訊" />
          {prop.title}
        </span>
        <div className="all-btn Edit Icon">
          <ActionPlaceholder_Comp iconClass="far fa-eye" title="查看前台" />
          <ActionPlaceholder_Comp iconClass="far fa-plus" title="新增子層" />
          <ActionPlaceholder_Comp iconClass="far fa-edit" title="編輯網站資訊" />
          <div className="icon">
            <button type="button" title="編輯網站資訊" className="Ipencil btn btn-ctm btn-ctm-rounded" onClick={handleEditClick}>
              <i className="far fa-edit" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ActionPlaceholder_Comp = (prop: { iconClass: string; title: string }) => {
  return (
    <div className="icon" style={{ visibility: "hidden", pointerEvents: "none" }} aria-hidden="true">
      <button type="button" title={prop.title} className="btn btn-ctm btn-ctm-rounded" tabIndex={-1}>
        <i className={prop.iconClass} />
      </button>
    </div>
  );
};

const Item_Comp = (prop: {item: SiteMenuItem; handler?: React.ReactNode; collapseIcon?: React.ReactNode; 
  onSelect: (item: SiteMenuItem) => void; onAddChild: (item: SiteMenuItem) => void; onDelete: (item: SiteMenuItem) => void;}) =>
{
    const { item, handler, collapseIcon, onSelect, onAddChild, onDelete } = prop;
    const iconClass = item.menuItem.ItemType === 1 ? "fa fa-link mr-2" : "far fa-cogs mr-2";
    const handleRootClick = () => { onSelect(item); };
    const handleAddChildClick = (e: React.MouseEvent<HTMLButtonElement>) =>
    {
        e.stopPropagation();
        onAddChild(item);
    };
    const handleEditClick = (e: React.MouseEvent<HTMLButtonElement>) =>
    {
        e.stopPropagation();
        onSelect(item);
    };
    const handleDeleteClick = (e: React.MouseEvent<HTMLButtonElement>) =>
    {
        e.stopPropagation();
        onDelete(item);
    };
    return (
        <div className="dd-item dd3-item">
            <div className="dd-handle dd3-handle"></div>
            <div className="dd3-content content_bar" onClick={handleRootClick} style={{ cursor: "pointer" }}>
                {handler}{collapseIcon}
                <span style={{ flex: 1, padding: "0 10px 0 3px" }}>
                    <i className={iconClass}/>
                    {item.name}
                </span>
                <div className="all-btn Edit Icon">
                    <CheckFrontBtn fullPath={item.menuItem?.FullUrl ?? ""} />
                    <div className="icon">
                        <button type="button" title="新增子層" className="Icogs btn btn-ctm btn-ctm-rounded" onClick={handleAddChildClick}>
                            <i className="far fa-plus" />
                        </button>
                    </div>
                    <div className="icon">
                        <button type="button" title="編輯" className="Ipencil btn btn-ctm btn-ctm-rounded" onClick={handleEditClick}>
                            <i className="far fa-edit" />
                        </button>
                    </div>
                    <div className="icon">
                        <button type="button" title="刪除" className="Itrash btn btn-ctm btn-ctm-rounded" onClick={handleDeleteClick}>
                            <i className="far fa-trash-alt" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CheckFrontBtn = (prop: { fullPath: string }) => {
    const toAbsolute = useCallback((path: string) => {
        if (!path) return "/";
        if (/^https?:\/\//i.test(path)) return path;               
        const normalized = path.startsWith("/") ? path : `/${path}`; 
        return `${window.location.origin}${normalized}`;            
    }, []);
    const openInNewTab = useCallback((fullPath: string) => {
        const href = toAbsolute(fullPath);
        window.open(href, "_blank", "noopener,noreferrer");         
    }, [toAbsolute]);
    return (
        <div className="icon">
            <button title="查看前台" className="Ieye btn btn-ctm btn-ctm-rounded" onClick={(e) => { e.stopPropagation(); openInNewTab(prop.fullPath); }}>
                <i className="far fa-eye"/>
            </button>
        </div>
    )
}

type ComfirmDialogProp = {
  candidate: SiteMenuItem;
  onDeleteAll: () => void;
  onDeleteOne: () => void;
  onCancel: () => void;
};
const ComfirmDialog_Comp = (prop: ComfirmDialogProp) => {
  const hasChildren = (prop.candidate.children?.length ?? 0) > 0;
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="del-title" className="" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1050, }}>
      <div className="card" style={{ minWidth: 420 }}>
        <div className="card-header">
          <h5 id="del-title" className="m-0">刪除確認</h5>
        </div>
        <div className="card-body">
            <p className="mb-2">
                要刪除「<b>{prop.candidate.name || prop.candidate.id}</b>」嗎？
            </p>
            <ul className="mb-3">
                <li><b>全部刪除</b>：此項目與其所有子項目都會移除。</li>
                {hasChildren && (<li><b>保留明細</b>：刪除此項目，但子項目將掛到此項目的父層。</li>)}
                <li><b>取消</b>：不進行刪除。</li>
            </ul>
            <div className="d-flex justify-content-end gap-2">
                <button type="button" className="btn btn-danger btn-sm" onClick={prop.onDeleteAll}>全部刪除</button>
                {hasChildren && (<button type="button" className="btn btn-warning btn-sm" onClick={prop.onDeleteOne}>保留明細</button>)}
                <button type="button" className="btn btn-light btn-sm" onClick={prop.onCancel}>取消</button>
            </div>
        </div>
      </div>
    </div>
  );
};

const collectRowIds = (node: SiteMenuItem): number[] => {
  const self = Number(node.menuItem?.RowId ?? node.id);
  const children = (node.children ?? []).flatMap(collectRowIds);
  return [self, ...children];
};

const findWithParent = (arr: SiteMenuItem[], id: number): { node: SiteMenuItem | null; parent: SiteMenuItem | null } => {
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
const removeNodeAndSubtree = (arr: SiteMenuItem[], id: number): SiteMenuItem[] => {return arr.filter((n) => n.id !== id).map((n) => ({...n, children: n.children ? removeNodeAndSubtree(n.children, id) : undefined,}));};
const promoteChildrenToParent = (arr: SiteMenuItem[], id: number): SiteMenuItem[] => {
  const clone = (nodes: SiteMenuItem[]): SiteMenuItem[] => nodes.map((n) => ({...n, children: n.children ? clone(n.children) : undefined,}));
  const next = clone(arr);
  const walk = (nodes: SiteMenuItem[], parent: SiteMenuItem | null): boolean => {
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      if (n.id === id) {
        if (parent) {
          const siblings = parent.children ?? [];
          const before = siblings.slice(0, i);
          const after = siblings.slice(i + 1);
          const kids = n.children ?? [];
          parent.children = [...before, ...kids, ...after];
        } else {
          const idx = next.findIndex((r) => r.id === id);
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
const appendChildNode = (nodes: SiteMenuItem[], parentId: number, newNode: SiteMenuItem,): SiteMenuItem[] => {
  return nodes.map((node) => {
    if (node.id === parentId) return { ...node, children: [...(node.children ?? []), newNode],};
    return {...node, children: node.children ? appendChildNode(node.children, parentId, newNode) : undefined,};
  });
};

const applyRemovalToForm = (formData: UseFetchFormDataResult<SiteMenuSet>, idsToRemove: Set<number>,) => {
  formData.setFormData((prev) => {
    if (!prev) return prev;
    const next = { ...(prev ?? {}) } as SiteMenuSet;
    next.SiteMenu_Item = (next.SiteMenu_Item ?? []).filter((x) => !idsToRemove.has(Number((x as SiteMenu_Item).RowId)),);
    next.SiteMenu_Item_Title = (next.SiteMenu_Item_Title ?? []).filter((t) => !idsToRemove.has(Number((t as SiteMenu_Item_Title).ItemRowId)),);
    next.SiteMenu_Item_Module = (next.SiteMenu_Item_Module ?? []).filter((m) => !idsToRemove.has(Number((m as SiteMenu_Item_Module).ItemRowId)),);
    next.SiteMenu_Item_Url = (next.SiteMenu_Item_Url ?? []).filter((u) => !idsToRemove.has(Number((u as SiteMenu_Item_Url).ItemRowId)),);
    return next;
  });
};

/** 將樹的資料同步更新回form Data */
const syncTreeToForm = (tree: SiteMenuItem[], formData: UseFetchFormDataResult<SiteMenuSet>) => {
    // 把樹攤平成「RowId → 更新值」對照表
    const updates = new Map<number, { ParentRowId: number | null; Level: number; DisplayOrder: number }>();
    const walk = (nodes: SiteMenuItem[] | undefined, parentId: number | null, level: number) => {
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
            const rowId = Number(it.RowId);
            const u = updates.get(rowId);
            if (!u) return it; // 可能是資料中有但左側未呈現的項目
            return {...it, ParentRowId: u.ParentRowId, Level: u.Level, DisplayOrder: u.DisplayOrder, } as SiteMenu_Item;}
        );
        return next;
    });
};

const resolveSiteInfoTitle = (data: SiteMenuSet, lang: Lang): string => {
  // 宣告變數
  const siteIndex = data?.SiteMenu_Index?.SiteIndex ?? "";
  const details = (data?.SiteMenu_IndexInfo ?? []).filter((item: SiteMenu_IndexInfo) => {
    return item.SiteIndex === siteIndex;
  });

  const langKey = String(lang ?? "").toLowerCase();
  const exact = details.find((item: SiteMenu_IndexInfo) => {
    const itemLang = String(item.Lang ?? "").toLowerCase();
    const hasTitle = String(item.Title ?? "").trim() !== "";
    return itemLang === langKey && hasTitle;
  });

  const fallback = details.find((item: SiteMenu_IndexInfo) => {
    return String(item.Title ?? "").trim() !== "";
  });

  // return
  return String(exact?.Title ?? fallback?.Title ?? "網站整體資訊");
};


