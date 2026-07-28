import type { Lang } from "@/SysCore/i18n/lang";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import type { components } from "@/types/api";
import { type CSSProperties, type ComponentProps, type Dispatch, type SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Nestable from "react-nestable";
import type { SiteMenuActions, SiteMenuEditTarget, SiteMenuItem } from "../SiteMenu_Hook";

// #region Property
type SiteMenuSet = components["schemas"]["SiteMenuSet_DTO"];

type SiteMenu_Item = components["schemas"]["SiteMenu_Item_DTO"];

type SiteMenu_IndexInfo = components["schemas"]["SiteMenu_IndexInfo_DTO"];

type SiteMenu_Item_Title = components["schemas"]["SiteMenu_Item_Title_DTO"];

type SiteMenu_Item_Module = components["schemas"]["SiteMenu_Item_Module_DTO"];

type SiteMenu_Item_Url = components["schemas"]["SiteMenu_Item_Url_DTO"];

type RenderLeftBoxProp = {
    selectedItemEdit: SiteMenuEditTarget;
    onRequestSelect: (target: SiteMenuEditTarget) => void;
    savedRevision: number;
    isLoading: boolean;
    siteMenuItems: SiteMenuItem[];
    lang: Lang;
    formData: UseFetchFormDataResult<SiteMenuSet>;
    action: SiteMenuActions;
    canUpdate: boolean;
    isSortMode: boolean;
    onSortModeChange: (active: boolean) => boolean;
};

type NestableOnChange = NonNullable<ComponentProps<typeof Nestable>["onChange"]>;

type NestableRenderItem = NonNullable<ComponentProps<typeof Nestable>["renderItem"]>;

type ComfirmDialogProp = {
    candidate: SiteMenuItem;
    onDeleteAll: () => void;
    onDeleteOne: () => void;
    onCancel: () => void;
};

type SyncIncomingOptions = {
    currentSnapshot: string;
    deletedRowCount: number;
    hasDraft: boolean;
    originalSnapshot: string;
    setItems: Dispatch<SetStateAction<SiteMenuItem[]>>;
    setOriginalSnapshot: Dispatch<SetStateAction<string>>;
    setDeletedRowIds: Dispatch<SetStateAction<number[]>>;
    data: SiteMenuSet | undefined;
    lang: Lang;
    setSiteInfoTitle: Dispatch<SetStateAction<string>>;
};

const STICKY_TOOLBAR_STYLE: CSSProperties = {
    position: "sticky",
    top: 132,
    zIndex: 30,
    background: "#fff",
    padding: "10px 0 6px",
    borderBottom: "1px solid #ddd",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.08)",
};
// #endregion

// #region Public
export const RenderLeftBox = (prop: RenderLeftBoxProp) =>
{
    const [collapseAll, setCollapseAll] = useState(false);
    const [items, setItems] = useState<SiteMenuItem[]>([]);
    const [deletedRowIds, setDeletedRowIds] = useState<number[]>([]);
    const [originalSnapshot, setOriginalSnapshot] = useState("");
    const [sortBaseline, setSortBaseline] = useState<SiteMenuItem[] | null>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [candidate, setCandidate] = useState<SiteMenuItem | null>(null);
    const [siteInfoTitle, setSiteInfoTitle] = useState("網站整體資訊");
    const appliedRevisionRef = useRef(0);

    const currentSnapshot = useMemo(() => buildStructureSnapshot(items), [items]);
    const hasDraft = useMemo(() => hasDraftItem(items), [items]);
    const structureDirty = useMemo(() =>
    {
        return originalSnapshot !== "" && (currentSnapshot !== originalSnapshot || deletedRowIds.length > 0);
    }, [currentSnapshot, deletedRowIds.length, originalSnapshot]);

    useEffect(() =>
    {
        syncIncomingItems(prop.siteMenuItems, {
            currentSnapshot,
            deletedRowCount: deletedRowIds.length,
            hasDraft,
            originalSnapshot,
            setItems,
            setOriginalSnapshot,
            setDeletedRowIds,
            data: prop.formData.data,
            lang: prop.lang,
            setSiteInfoTitle,
        });
    }, [currentSnapshot, deletedRowIds.length, hasDraft, originalSnapshot, prop.formData.data, prop.lang, prop.siteMenuItems]);

    /** 後端儲存成功後，才將最新標題同步到左側。 */
    useEffect(() =>
    {
        if (prop.savedRevision === 0 || appliedRevisionRef.current === prop.savedRevision) return;
        setItems((prev) => applySavedTitles(prev, prop.formData.data, prop.lang));
        setSiteInfoTitle(resolveSiteInfoTitle(prop.formData.data, prop.lang));
        appliedRevisionRef.current = prop.savedRevision;
    }, [prop.formData.data, prop.lang, prop.savedRevision]);

    const selectedMenuRowId = useMemo(() =>
    {
        return prop.selectedItemEdit?.type === "menu" ? prop.selectedItemEdit.item.id : null;
    }, [prop.selectedItemEdit]);

    const canModify = prop.canUpdate && !prop.isSortMode && !prop.action.isExecuting;
    const canSort = prop.canUpdate && prop.isSortMode && !prop.action.isExecuting;
    const canSaveStructure = prop.canUpdate && structureDirty && !hasDraft && !prop.action.isExecuting;
    const canCancelStructure = canSaveStructure;
    const canToggleSort = prop.canUpdate
        && !hasDraft
        && deletedRowIds.length === 0
        && !prop.action.isExecuting
        && (!prop.isSortMode || !structureDirty);

    /** 選取網站資訊供右側編輯。 */
    const handleSelectSiteInfo = useCallback(() =>
    {
        if (!canModify) return;
        prop.onRequestSelect({ type: "site", title: siteInfoTitle });
    }, [canModify, prop.onRequestSelect, siteInfoTitle]);

    /** 選取左側項目供右側編輯。 */
    const handleSelectItem = useCallback((item: SiteMenuItem) =>
    {
        if (!canModify) return;
        prop.onRequestSelect({ type: "menu", item });
    }, [canModify, prop.onRequestSelect]);

    /** 切換排序模式；有未儲存結構異動時不可直接離開。 */
    const handleToggleSortMode = useCallback(() =>
    {
        if (!canToggleSort) return;

        if (prop.isSortMode)
        {
            const isChanged = prop.onSortModeChange(false);
            if (isChanged) setSortBaseline(null);
            return;
        }

        const isChanged = prop.onSortModeChange(true);
        if (isChanged) setSortBaseline(cloneSiteMenuTree(items));
    }, [canToggleSort, items, prop.isSortMode, prop.onSortModeChange]);

    /** 開啟刪除確認視窗。 */
    const handleDeleteItem = useCallback((item: SiteMenuItem) =>
    {
        if (!canModify) return;
        setCandidate(item);
        setConfirmOpen(true);
    }, [canModify]);

    /** 關閉刪除確認視窗。 */
    const handleCloseConfirm = useCallback(() =>
    {
        setConfirmOpen(false);
        setCandidate(null);
    }, []);

    /** 新增一筆主層或子層選單。 */
    const handleAddMenuItem = useCallback((parent: SiteMenuItem | null) =>
    {
        if (!canModify) return;

        const nextRowId = createTempRowId();
        const newMenuItem = buildDraftMenuItem(prop.formData.data, parent, items.length, nextRowId);
        appendDraftToForm(prop.formData, prop.lang, newMenuItem, nextRowId);

        const newNode: SiteMenuItem = { id: nextRowId, name: "", menuItem: newMenuItem, children: [] };
        setItems((prev) =>
        {
            const nextTree = parent ? appendChildNode(prev, parent.id, newNode) : [...prev, newNode];
            syncTreeToForm(nextTree, prop.formData);
            selectDraftAfterRender(prop.onRequestSelect, newNode);
            return nextTree;
        });
    }, [canModify, items.length, prop.formData, prop.lang, prop.onRequestSelect]);

    /** 新增目前項目的子層。 */
    const handleAddChildItem = useCallback((item: SiteMenuItem) =>
    {
        handleAddMenuItem(item);
    }, [handleAddMenuItem]);

    /** 保存目前排序或刪除造成的結構異動。 */
    const handleSaveStructure = useCallback(async () =>
    {
        if (!canSaveStructure) return;

        const ok = await prop.action.onSaveMenuStructure(items, deletedRowIds);
        if (!ok) return;

        setOriginalSnapshot(buildStructureSnapshot(items));
        setDeletedRowIds([]);
        setSortBaseline(null);
        if (prop.isSortMode) prop.onSortModeChange(false);
    }, [canSaveStructure, deletedRowIds, items, prop.action, prop.isSortMode, prop.onSortModeChange]);

    /** 取消結構異動並重新載入伺服器資料。 */
    const handleCancelStructure = useCallback(async () =>
    {
        if (!canCancelStructure) return;

        restoreStructureDraft(sortBaseline, prop.formData, setItems, setOriginalSnapshot);
        setDeletedRowIds([]);
        setSortBaseline(null);
        prop.onRequestSelect(null);
        prop.onSortModeChange(false);
        await prop.action.onCancelStructure();
    }, [canCancelStructure, prop, sortBaseline]);

    /** 刪除此項目與全部子層。 */
    const handleDeleteAll = useCallback(() =>
    {
        if (!candidate || !canModify) return;

        const ids = new Set<number>(collectRowIds(candidate));
        const realIds = Array.from(ids).filter(x => x > 0);
        const newTree = removeNodeAndSubtree(items, candidate.id);

        applyDeletedTree(newTree, ids, realIds, prop.formData, setItems, setDeletedRowIds);
        handleCloseConfirm();
        prop.onRequestSelect(null);
    }, [candidate, canModify, handleCloseConfirm, items, prop.formData, prop.onRequestSelect]);

    /** 僅刪除此層，並將子層提升到目前父層。 */
    const handleDeleteOne = useCallback(() =>
    {
        if (!candidate || !canModify) return;

        const rowId = Number(candidate.menuItem?.RowId ?? candidate.id);
        const newTree = promoteChildrenToParent(items, candidate.id);
        const ids = new Set<number>([rowId]);
        const realIds = rowId > 0 ? [rowId] : [];

        applyDeletedTree(newTree, ids, realIds, prop.formData, setItems, setDeletedRowIds);
        handleCloseConfirm();
        prop.onRequestSelect(null);
    }, [candidate, canModify, handleCloseConfirm, items, prop.formData, prop.onRequestSelect]);

    /** 拖拉排序後同步回表單資料。 */
    const handleChange: NestableOnChange = useCallback((arg) =>
    {
        if (!canSort) return;

        const nextItems = (arg.items ?? []) as SiteMenuItem[];
        setItems(nextItems);
        syncTreeToForm(nextItems, prop.formData);
    }, [canSort, prop.formData]);

    const renderItem: NestableRenderItem = useCallback(({ item, handler, collapseIcon }) =>
    {
        return (
            <Item_Comp
                item={item as SiteMenuItem}
                handler={handler}
                collapseIcon={collapseIcon}
                canModify={canModify}
                canSort={canSort}
                onSelect={handleSelectItem}
                onAddChild={handleAddChildItem}
                onDelete={handleDeleteItem}
                selectedRowId={selectedMenuRowId}
            />
        );
    }, [canModify, canSort, handleAddChildItem, handleDeleteItem, handleSelectItem, selectedMenuRowId]);

    return (
        <>
            <div className="col-xxl-5 col-12 left-box">
                <div className="panel">
                    <div className="panel-body">
                        <div className="mb-2" style={STICKY_TOOLBAR_STYLE}>
                            <button type="button" onClick={() => setCollapseAll(!collapseAll)} className="btn btn-custom btn-rounded btn-sm mr-2 mb-2">
                                {collapseAll ? "展開" : "收合"}
                            </button>
                            <button
                                type="button"
                                className={`btn btn-custom btn-rounded btn-sm mr-2 mb-2${prop.isSortMode ? " active" : ""}`}
                                aria-pressed={prop.isSortMode}
                                disabled={!canToggleSort}
                                title={buildSortModeTitle(prop.isSortMode, structureDirty, prop.canUpdate)}
                                onClick={handleToggleSortMode}
                            >
                                <i className={`far ${prop.isSortMode ? "fa-check-square" : "fa-square"} me-1`} />
                                變更排序
                            </button>
                            <button
                                type="button"
                                className="btn btn-custom btn-rounded btn-sm mr-2 mb-2"
                                disabled={!canSaveStructure}
                                onClick={() => void handleSaveStructure()}
                            >
                                儲存
                            </button>
                            <button
                                type="button"
                                className="btn btn-custom btn-rounded btn-sm mr-2 mb-2"
                                disabled={!canCancelStructure}
                                onClick={() => void handleCancelStructure()}
                            >
                                取消
                            </button>
                            <button
                                type="button"
                                className="btn btn-custom btn-rounded btn-sm mr-2 mb-2"
                                disabled={!canModify}
                                title={!prop.canUpdate ? "無修改權限" : prop.isSortMode ? "排序模式下不可新增" : "新增主層"}
                                onClick={() => handleAddMenuItem(null)}
                            >
                                新增
                            </button>
                        </div>

                        <div className="cf nestable-lists">
                            <ol className="dd-list">
                                <SiteInfoItem_Comp
                                    title={siteInfoTitle}
                                    canModify={canModify}
                                    isActive={prop.selectedItemEdit?.type === "site"}
                                    onSelect={handleSelectSiteInfo}
                                />
                            </ol>
                        </div>

                        <div className="cf nestable-lists">
                            <Nestable
                                items={items || []}
                                renderItem={renderItem}
                                onChange={handleChange}
                                disableDrag={!canSort}
                                className="dd-list"
                                collapsed={collapseAll}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {confirmOpen && candidate && (
                <ComfirmDialog_Comp
                    candidate={candidate}
                    onDeleteAll={handleDeleteAll}
                    onDeleteOne={handleDeleteOne}
                    onCancel={handleCloseConfirm}
                />
            )}
        </>
    );
};
// #endregion

// #region Section
const SiteInfoItem_Comp = (prop: { title: string; canModify: boolean; isActive: boolean; onSelect: () => void; }) =>
{
    const handleEditClick = (e: React.MouseEvent<HTMLButtonElement>) =>
    {
        e.stopPropagation();
        if (prop.canModify) prop.onSelect();
    };

    return (
        <div className="dd-item dd3-item">
            <div className="dd-handle dd3-handle" style={{ visibility: "hidden" }} aria-hidden="true" />
            <div
                className={`dd3-content content_bar${prop.isActive ? " active-edit" : ""}`}
                onClick={prop.canModify ? prop.onSelect : undefined}
                style={{ cursor: prop.canModify ? "pointer" : "default" }}
            >
                <span style={{ flex: 1, padding: "0 10px 0 3px" }}>
                    <i className="fa fa-globe mr-2" title="網站整體資訊" />
                    {prop.title}
                </span>
                <div className="all-btn Edit Icon">
                    <ActionPlaceholder_Comp iconClass="far fa-eye" title="查看前台" />
                    <ActionPlaceholder_Comp iconClass="far fa-plus" title="新增子層" />
                    <ActionPlaceholder_Comp iconClass="far fa-edit" title="編輯網站資訊" />
                    <div className="icon">
                        <button
                            type="button"
                            title={prop.canModify ? "編輯網站資訊" : "目前不可編輯"}
                            className="Ipencil btn btn-ctm btn-ctm-rounded"
                            disabled={!prop.canModify}
                            onClick={handleEditClick}
                        >
                            <i className="far fa-edit" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


const ActionPlaceholder_Comp = (prop: { iconClass: string; title: string; }) =>
{
    return (
        <div className="icon" style={{ visibility: "hidden", pointerEvents: "none" }} aria-hidden="true">
            <button type="button" title={prop.title} className="btn btn-ctm btn-ctm-rounded" tabIndex={-1}>
                <i className={prop.iconClass} />
            </button>
        </div>
    );
};


const Item_Comp = (
    prop: {
        item: SiteMenuItem;
        handler?: React.ReactNode;
        collapseIcon?: React.ReactNode;
        canModify: boolean;
        canSort: boolean;
        onSelect: (item: SiteMenuItem) => void;
        onAddChild: (item: SiteMenuItem) => void;
        onDelete: (item: SiteMenuItem) => void;
        selectedRowId: number | null;
    },
) =>
{
    const { item, handler, collapseIcon, canModify, canSort, onSelect, onAddChild, onDelete, selectedRowId } = prop;
    const isDraft = item.id <= 0;
    const isActive = selectedRowId === item.id;
    const iconClass = item.menuItem.ItemType === 1 ? "fa fa-link mr-2" : "far fa-cogs mr-2";

    const handleRootClick = () =>
    {
        if (canModify) onSelect(item);
    };

    const handleAddChildClick = (e: React.MouseEvent<HTMLButtonElement>) =>
    {
        e.stopPropagation();
        if (canModify) onAddChild(item);
    };

    const handleEditClick = (e: React.MouseEvent<HTMLButtonElement>) =>
    {
        e.stopPropagation();
        if (canModify) onSelect(item);
    };

    const handleDeleteClick = (e: React.MouseEvent<HTMLButtonElement>) =>
    {
        e.stopPropagation();
        if (canModify) onDelete(item);
    };

    return (
        <div className="dd-item dd3-item">
            <div
                className="dd-handle dd3-handle"
                style={{ cursor: canSort ? "grab" : "default", opacity: canSort ? 1 : 0.35 }}
                aria-label={canSort ? "拖曳調整順序" : undefined}
            />
            <div
                className={`dd3-content content_bar${isActive ? " active-edit" : ""}`}
                onClick={handleRootClick}
                style={{ cursor: canSort ? "grab" : canModify ? "pointer" : "default", opacity: isDraft ? 0.45 : 1 }}
            >
                {canSort ? handler : null}
                {collapseIcon}
                <span style={{ flex: 1, padding: "0 10px 0 3px" }}>
                    <i className={iconClass} />
                    {item.name || "(新增項目未保存)"}
                    {isDraft && <span className="text-muted ms-2">暫存</span>}
                </span>
                <div className="all-btn Edit Icon">
                    <CheckFrontBtn fullPath={item.menuItem?.FullUrl ?? ""} disabled={isDraft} />
                    <div className="icon">
                        <button
                            type="button"
                            title={canModify ? "新增子層" : "目前不可新增"}
                            className="Icogs btn btn-ctm btn-ctm-rounded"
                            disabled={!canModify}
                            onClick={handleAddChildClick}
                        >
                            <i className="far fa-plus" />
                        </button>
                    </div>
                    <div className="icon">
                        <button
                            type="button"
                            title={canModify ? "編輯" : "目前不可編輯"}
                            className="Ipencil btn btn-ctm btn-ctm-rounded"
                            disabled={!canModify}
                            onClick={handleEditClick}
                        >
                            <i className="far fa-edit" />
                        </button>
                    </div>
                    <div className="icon">
                        <button
                            type="button"
                            title={canModify ? "刪除" : "目前不可刪除"}
                            className="Itrash btn btn-ctm btn-ctm-rounded"
                            disabled={!canModify}
                            onClick={handleDeleteClick}
                        >
                            <i className="far fa-trash-alt" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


const ComfirmDialog_Comp = (prop: ComfirmDialogProp) =>
{
    const hasChildren = (prop.candidate.children?.length ?? 0) > 0;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="del-title"
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1050,
            }}
        >
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
                        {hasChildren && <li><b>保留明細</b>：刪除此項目，但子項目將掛到此項目的父層。</li>}
                        <li><b>取消</b>：不進行刪除。</li>
                    </ul>
                    <div className="d-flex justify-content-end gap-2">
                        <button type="button" className="btn btn-danger btn-sm" onClick={prop.onDeleteAll}>全部刪除</button>
                        {hasChildren && <button type="button" className="btn btn-warning btn-sm" onClick={prop.onDeleteOne}>保留明細</button>}
                        <button type="button" className="btn btn-light btn-sm" onClick={prop.onCancel}>取消</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
// #endregion

// #region Protected
const buildStructureSnapshot = (nodes: SiteMenuItem[]): string =>
{
    const rows: Array<{ RowId: number; ParentRowId: number | null; DisplayOrder: number; }> = [];

    const walk = (list: SiteMenuItem[], parentRowId: number | null) =>
    {
        list.filter((x) => x.id > 0).forEach((x, i) =>
        {
            rows.push({ RowId: x.id, ParentRowId: parentRowId, DisplayOrder: i + 1 });
            walk(x.children ?? [], x.id);
        });
    };

    walk(nodes, null);
    return JSON.stringify(rows);
};
// #endregion

// #region Private
/** 複製左側樹狀資料，避免與右側草稿共用物件參考。 */
const cloneMenuItems = (nodes: SiteMenuItem[]): SiteMenuItem[] =>
{
    return nodes.map((node) => ({
        ...node,
        menuItem: { ...node.menuItem },
        children: cloneMenuItems(node.children ?? []),
    }));
};


/** 依已成功儲存的表單資料更新左側選單標題。 */
const applySavedTitles = (nodes: SiteMenuItem[], data: SiteMenuSet | undefined, lang: Lang): SiteMenuItem[] =>
{
    const titles = data?.SiteMenu_Item_Title ?? [];
    return nodes.map((node) =>
    {
        const title = titles.find((x) => Number(x.ItemRowId) === node.id && x.Lang === lang)?.Title;
        const children = applySavedTitles(node.children ?? [], data, lang);
        return { ...node, name: title ?? node.name, children };
    });
};


const CheckFrontBtn = (prop: { fullPath: string; disabled?: boolean; }) =>
{
    const toAbsolute = useCallback((path: string) =>
    {
        if (!path) return "/";
        if (/^https?:\/\//i.test(path)) return path;
        const normalized = path.startsWith("/") ? path : `/${path}`;
        return `${window.location.origin}${normalized}`;
    }, []);

    const openInNewTab = useCallback((fullPath: string) =>
    {
        if (prop.disabled) return;
        const href = toAbsolute(fullPath);
        window.open(href, "_blank", "noopener,noreferrer");
    }, [prop.disabled, toAbsolute]);

    return (
        <div className="icon">
            <button
                type="button"
                title={prop.disabled ? "暫存項目尚未建立前台網址" : "查看前台"}
                className="Ieye btn btn-ctm btn-ctm-rounded"
                disabled={prop.disabled}
                onClick={(e) =>
                {
                    e.stopPropagation();
                    openInNewTab(prop.fullPath);
                }}
            >
                <i className="far fa-eye" />
            </button>
        </div>
    );
};


/** 同步伺服器回傳的 SiteMenu 樹，保留尚未儲存的本地異動。 */
const syncIncomingItems = (incoming: SiteMenuItem[], opt: SyncIncomingOptions): void =>
{
    const hasMenuData = Array.isArray(opt.data?.SiteMenu_Item) || incoming.length > 0;
    if (!hasMenuData) return;

    const incomingItems = cloneMenuItems(incoming);
    const incomingSnapshot = buildStructureSnapshot(incomingItems);
    const incomingHasDraft = hasDraftItem(incomingItems);
    const isFirstLoad = opt.originalSnapshot === "";
    const shouldAcceptServer = opt.hasDraft && !incomingHasDraft;
    const isDirty = !isFirstLoad
        && (opt.currentSnapshot !== opt.originalSnapshot || opt.deletedRowCount > 0 || opt.hasDraft);

    if (!shouldAcceptServer && isDirty) return;
    if (!isFirstLoad && incomingSnapshot === opt.originalSnapshot) return;

    opt.setItems(incomingItems);
    opt.setOriginalSnapshot(incomingSnapshot);
    opt.setDeletedRowIds([]);
    opt.setSiteInfoTitle(resolveSiteInfoTitle(opt.data, opt.lang));
};


/** 建立尚未儲存的選單項目。 */
const buildDraftMenuItem = (
    data: SiteMenuSet,
    parent: SiteMenuItem | null,
    rootCount: number,
    rowId: number,
): SiteMenu_Item =>
{
    const siteIndex = data?.SiteMenu_Item?.[0]?.SiteIndex ?? data?.SiteMenu_Index?.SiteIndex ?? "";
    const level = parent ? Number(parent.menuItem?.Level ?? 1) + 1 : 1;
    const displayOrder = parent ? (parent.children?.length ?? 0) + 1 : rootCount + 1;

    return {
        SiteIndex: siteIndex,
        RowId: rowId,
        ParentRowId: parent ? parent.id : null,
        Level: level,
        DisplayOrder: displayOrder,
        ItemSiteUrl: "",
        FullUrl: "",
        ItemType: 1,
        WindowTarget: 0,
    } as SiteMenu_Item;
};


/** 將新增暫存項目寫入表單資料。 */
const appendDraftToForm = (
    formData: UseFetchFormDataResult<SiteMenuSet>,
    lang: Lang,
    newMenuItem: SiteMenu_Item,
    rowId: number,
): void =>
{
    formData.setFormData((prev) =>
    {
        const next = { ...(prev ?? {}) } as SiteMenuSet;
        next.SiteMenu_Item = [...(next.SiteMenu_Item ?? []), newMenuItem];
        next.SiteMenu_Item_Title = [
            ...(next.SiteMenu_Item_Title ?? []),
            {
                SiteIndex: newMenuItem.SiteIndex,
                ItemRowId: rowId,
                RowId: 1,
                Lang: lang,
                Title: "",
                IsShowOnMenu: true,
            } as SiteMenu_Item_Title,
        ];
        return next;
    });
};


/** 下一個 render 再開啟新增項目編輯區。 */
const selectDraftAfterRender = (
    onRequestSelect: (target: SiteMenuEditTarget) => void,
    node: SiteMenuItem,
): void =>
{
    setTimeout(() =>
    {
        onRequestSelect({ type: "menu", item: node });
    }, 0);
};


/** 套用刪除後的樹與表單資料。 */
const applyDeletedTree = (
    tree: SiteMenuItem[],
    ids: Set<number>,
    realIds: number[],
    formData: UseFetchFormDataResult<SiteMenuSet>,
    setItems: Dispatch<SetStateAction<SiteMenuItem[]>>,
    setDeletedRowIds: Dispatch<SetStateAction<number[]>>,
): void =>
{
    setDeletedRowIds(prev => mergeIds(prev, realIds));
    setItems(tree);
    applyRemovalToForm(formData, ids);
    syncTreeToForm(tree, formData);
};


/** 取消結構異動時先還原排序基準，再重新向後端取資料。 */
const restoreStructureDraft = (
    baseline: SiteMenuItem[] | null,
    formData: UseFetchFormDataResult<SiteMenuSet>,
    setItems: Dispatch<SetStateAction<SiteMenuItem[]>>,
    setOriginalSnapshot: Dispatch<SetStateAction<string>>,
): void =>
{
    if (!baseline)
    {
        setOriginalSnapshot("");
        return;
    }

    const restored = cloneSiteMenuTree(baseline);
    setItems(restored);
    setOriginalSnapshot(buildStructureSnapshot(restored));
    syncTreeToForm(restored, formData);
};


/** 建立變更排序按鈕提示文字。 */
const buildSortModeTitle = (isSortMode: boolean, isDirty: boolean, canUpdate: boolean): string =>
{
    if (!canUpdate) return "無修改權限";
    if (isSortMode && isDirty) return "請先儲存或取消排序異動";
    return isSortMode ? "結束排序模式" : "進入排序模式";
};


/** 深層複製選單樹，保留排序前基準。 */
const cloneSiteMenuTree = (nodes: SiteMenuItem[]): SiteMenuItem[] =>
{
    return nodes.map(node => ({
        ...node,
        menuItem: { ...node.menuItem },
        children: node.children ? cloneSiteMenuTree(node.children) : undefined,
    }));
};


const collectRowIds = (node: SiteMenuItem): number[] =>
{
    const self = Number(node.menuItem?.RowId ?? node.id);
    const children = (node.children ?? []).flatMap(collectRowIds);
    return [self, ...children];
};


const removeNodeAndSubtree = (arr: SiteMenuItem[], id: number): SiteMenuItem[] =>
{
    return arr.filter((n) => n.id !== id).map((n) => ({ ...n, children: n.children ? removeNodeAndSubtree(n.children, id) : undefined }));
};


const promoteChildrenToParent = (arr: SiteMenuItem[], id: number): SiteMenuItem[] =>
{
    const clone = (nodes: SiteMenuItem[]): SiteMenuItem[] =>
    {
        return nodes.map((n) => ({ ...n, children: n.children ? clone(n.children) : undefined }));
    };

    const next = clone(arr);

    const walk = (nodes: SiteMenuItem[], parent: SiteMenuItem | null): boolean =>
    {
        for (let i = 0; i < nodes.length; i++)
        {
            const n = nodes[i];

            if (n.id === id)
            {
                if (parent)
                {
                    const siblings = parent.children ?? [];
                    const before = siblings.slice(0, i);
                    const after = siblings.slice(i + 1);
                    const kids = n.children ?? [];
                    parent.children = [...before, ...kids, ...after];
                } else
                {
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


const appendChildNode = (nodes: SiteMenuItem[], parentId: number, newNode: SiteMenuItem): SiteMenuItem[] =>
{
    return nodes.map((node) =>
    {
        if (node.id === parentId) return { ...node, children: [...(node.children ?? []), newNode] };
        return { ...node, children: node.children ? appendChildNode(node.children, parentId, newNode) : undefined };
    });
};


const applyRemovalToForm = (formData: UseFetchFormDataResult<SiteMenuSet>, idsToRemove: Set<number>) =>
{
    formData.setFormData((prev) =>
    {
        if (!prev) return prev;

        const next = { ...(prev ?? {}) } as SiteMenuSet;

        next.SiteMenu_Item = (next.SiteMenu_Item ?? []).filter((x) => !idsToRemove.has(Number((x as SiteMenu_Item).RowId)));
        next.SiteMenu_Item_Title = (next.SiteMenu_Item_Title ?? []).filter((t) => !idsToRemove.has(Number((t as SiteMenu_Item_Title).ItemRowId)));
        next.SiteMenu_Item_Module = (next.SiteMenu_Item_Module ?? []).filter((m) => !idsToRemove.has(Number((m as SiteMenu_Item_Module).ItemRowId)));
        next.SiteMenu_Item_Url = (next.SiteMenu_Item_Url ?? []).filter((u) => !idsToRemove.has(Number((u as SiteMenu_Item_Url).ItemRowId)));

        return next;
    });
};


/** 將樹的資料同步更新回 formData */
const syncTreeToForm = (tree: SiteMenuItem[], formData: UseFetchFormDataResult<SiteMenuSet>) =>
{
    const updates = new Map<number, { ParentRowId: number | null; Level: number; DisplayOrder: number; }>();

    const walk = (nodes: SiteMenuItem[] | undefined, parentId: number | null, level: number) =>
    {
        if (!nodes) return;

        nodes.forEach((n, idx) =>
        {
            updates.set(Number(n.id), { ParentRowId: parentId, Level: level, DisplayOrder: idx + 1 });

            if (n.children && n.children.length) walk(n.children, Number(n.id), level + 1);
        });
    };

    walk(tree, null, 1);

    formData.setFormData((prev) =>
    {
        if (!prev) return prev;

        const next: SiteMenuSet = { ...prev };
        const list = [...(next.SiteMenu_Item ?? [])];

        next.SiteMenu_Item = list.map((it) =>
        {
            const rowId = Number(it.RowId);
            const u = updates.get(rowId);
            if (!u) return it;

            return { ...it, ParentRowId: u.ParentRowId, Level: u.Level, DisplayOrder: u.DisplayOrder } as SiteMenu_Item;
        });

        return next;
    });
};


const resolveSiteInfoTitle = (data: SiteMenuSet, lang: Lang): string =>
{
    const siteIndex = data?.SiteMenu_Index?.SiteIndex ?? "";
    const details = (data?.SiteMenu_IndexInfo ?? []).filter((item: SiteMenu_IndexInfo) =>
    {
        return item.SiteIndex === siteIndex;
    });

    const langKey = String(lang ?? "").toLowerCase();

    const exact = details.find((item: SiteMenu_IndexInfo) =>
    {
        const itemLang = String(item.Lang ?? "").toLowerCase();
        const hasTitle = String(item.Title ?? "").trim() !== "";
        return itemLang === langKey && hasTitle;
    });

    const fallback = details.find((item: SiteMenu_IndexInfo) =>
    {
        return String(item.Title ?? "").trim() !== "";
    });

    return String(exact?.Title ?? fallback?.Title ?? "網站整體資訊");
};


const createTempRowId = (): number =>
{
    return -(Date.now() + Math.floor(Math.random() * 1000));
};


const mergeIds = (prev: number[], next: number[]): number[] =>
{
    return Array.from(new Set([...prev, ...next].filter((x) => x > 0)));
};


const hasDraftItem = (nodes: SiteMenuItem[]): boolean =>
{
    return nodes.some((x) => x.id <= 0 || hasDraftItem(x.children ?? []));
};
// #endregion
