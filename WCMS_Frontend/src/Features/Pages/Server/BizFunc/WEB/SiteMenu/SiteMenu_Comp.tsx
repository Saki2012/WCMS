import type { FormCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data";
import { FormShellComp } from "@/Features/Pages/Server/Scaffold/Content/FormShell_Comp";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { type Lang } from "@/SysCore/i18n/lang";
import { useCallback, useEffect, useMemo, useState } from "react";
import "react-nestable/dist/styles/index.css";
import { type SiteMenuEditTarget, useSiteMenuFetchData } from "./SiteMenu_Hook";
import {
    type SiteMenuFormModel,
    type SiteMenuItemModule,
    type SiteMenuItemTitle,
    type SiteMenuItemUrl,
} from "./SiteMenu_FormModel_Hook";
import { RenderLeftBox } from "./SubComponents/RenderLeftBox_Comp";
import { RenderRightBox } from "./SubComponents/RenderRightBox_Comp";

// #region Property
type SiteMenuPendingAction =
    | { type: "select"; target: SiteMenuEditTarget; }
    | { type: "sort"; active: boolean; };

interface SiteMenuEditBaseline
{
    data: SiteMenuFormModel;
    snapshot: string;
}

interface UnsavedDialogProp
{
    title: string;
    isExecuting: boolean;
    onSave: () => void;
    onDiscard: () => void;
    onCancel: () => void;
}
// #endregion

// #region Public
/** 網站選單維護：集中控管右側草稿、儲存、取消與切換攔截。 */
export const SiteMenu_Comp = (prop: { theme: IBETheme; lang: Lang; }) =>
{
    const getData = useSiteMenuFetchData({ lang: prop.lang });
    const formData = getData.rawData.formData;
    const [selectedItemEdit, setSelectedItemEdit] = useState<SiteMenuEditTarget>(null);
    const [editBaseline, setEditBaseline] = useState<SiteMenuEditBaseline | null>(null);
    const [pendingAction, setPendingAction] = useState<SiteMenuPendingAction | null>(null);
    const [savedRevision, setSavedRevision] = useState(0);
    const [isSortMode, setIsSortMode] = useState(false);
    const canUpdate = getData.rawData.permission.canUpdate;

    const hasUnsavedChanges = useMemo(() =>
    {
        if (!selectedItemEdit || !editBaseline) return false;
        return createTargetSnapshot(formData.data, selectedItemEdit) !== editBaseline.snapshot;
    }, [editBaseline, formData.data, selectedItemEdit]);

    const dialogTitle = useMemo(() => resolveEditTitle(selectedItemEdit), [selectedItemEdit]);

    /** 關閉右側編輯狀態與草稿快照。 */
    const closeEditor = useCallback(() =>
    {
        setSelectedItemEdit(null);
        setEditBaseline(null);
    }, []);

    /** 進入指定項目編輯，基準快照由下一次 Effect 建立。 */
    const activateTarget = useCallback((target: SiteMenuEditTarget) =>
    {
        setSelectedItemEdit(target);
        setEditBaseline(null);
    }, []);

    /** 執行已確認的選取或排序切換。 */
    const executePendingAction = useCallback((action: SiteMenuPendingAction) =>
    {
        if (action.type === "select")
        {
            activateTarget(action.target);
            return;
        }
        setIsSortMode(action.active);
        if (action.active) closeEditor();
    }, [activateTarget, closeEditor]);

    /** 有草稿時保留待執行動作，否則立即切換。 */
    const requestTransition = useCallback((action: SiteMenuPendingAction): boolean =>
    {
        if (hasUnsavedChanges)
        {
            setPendingAction(action);
            return false;
        }
        executePendingAction(action);
        return true;
    }, [executePendingAction, hasUnsavedChanges]);

    /** 左側要求切換時忽略目前已選取的同一項目。 */
    const handleRequestSelect = useCallback((target: SiteMenuEditTarget) =>
    {
        if (!canUpdate || isSortMode || isSameEditTarget(selectedItemEdit, target)) return;
        requestTransition({ type: "select", target });
    }, [canUpdate, isSortMode, requestTransition, selectedItemEdit]);

    /** 儲存目前編輯資料，不主動改變使用者下一個操作目標。 */
    const saveCurrentTarget = useCallback(async (): Promise<boolean> =>
    {
        if (!canUpdate || isSortMode || !selectedItemEdit) return false;
        const isSaved = selectedItemEdit.type === "site"
            ? await getData.rawData.actions.onSaveSiteInfo()
            : await getData.rawData.actions.onSaveMenuItem(selectedItemEdit.item);
        if (isSaved) setSavedRevision((prev) => prev + 1);
        return isSaved;
    }, [canUpdate, getData.rawData.actions, isSortMode, selectedItemEdit]);

    /** 右側儲存成功後關閉目前編輯區。 */
    const handleSave = useCallback(async (): Promise<boolean> =>
    {
        const isSaved = await saveCurrentTarget();
        if (isSaved) closeEditor();
        return isSaved;
    }, [closeEditor, saveCurrentTarget]);

    /** 右側取消編輯時還原進入前資料。 */
    const handleCancelEdit = useCallback(() =>
    {
        if (editBaseline) formData.setFormData(cloneFormData(editBaseline.data));
        closeEditor();
    }, [closeEditor, editBaseline, formData]);

    /** Dialog 儲存成功後繼續執行原本要求的切換動作。 */
    const handleConfirmSave = useCallback(async () =>
    {
        if (!pendingAction) return;
        const nextAction = pendingAction;
        const isSaved = await saveCurrentTarget();
        if (!isSaved) return;
        setPendingAction(null);
        executePendingAction(nextAction);
    }, [executePendingAction, pendingAction, saveCurrentTarget]);

    /** Dialog 不儲存時還原 Snapshot，再執行原本要求的切換動作。 */
    const handleDiscard = useCallback(() =>
    {
        if (!pendingAction || !editBaseline) return;
        const nextAction = pendingAction;
        formData.setFormData(cloneFormData(editBaseline.data));
        setPendingAction(null);
        executePendingAction(nextAction);
    }, [editBaseline, executePendingAction, formData, pendingAction]);

    /** Dialog 取消只關閉視窗並保留目前編輯狀態。 */
    const handleCancelDialog = useCallback(() =>
    {
        setPendingAction(null);
    }, []);

    /** 切換排序模式；右側有草稿時交由共同 Dialog 處理。 */
    const handleSortModeChange = useCallback((active: boolean): boolean =>
    {
        if (!canUpdate) return false;
        if (active === isSortMode) return true;
        return requestTransition({ type: "sort", active });
    }, [canUpdate, isSortMode, requestTransition]);

    /** 選取目標穩定後建立 Snapshot，避免掛載初始化被誤判為修改。 */
    useEffect(() =>
    {
        if (!selectedItemEdit || editBaseline) return;
        const data = cloneFormData(formData.data);
        setEditBaseline({ data, snapshot: createTargetSnapshot(data, selectedItemEdit) });
    }, [editBaseline, formData.data, selectedItemEdit]);

    /** 權限失效時退出所有編輯與排序狀態。 */
    useEffect(() =>
    {
        if (canUpdate) return;
        setPendingAction(null);
        setIsSortMode(false);
        closeEditor();
    }, [canUpdate, closeEditor]);

    const formProp: FormCompProp = {
        Title: "網站功能",
        Theme: prop.theme,
        IsLoading: getData.isLoading,
        ErrorList: getData.errors,
        Actions: getData.rawData.actions,
    };

    return (
        <FormShellComp prop={formProp}>
            <div className="row">
                <RenderLeftBox
                    selectedItemEdit={selectedItemEdit}
                    hasUnsavedChanges={hasUnsavedChanges}
                    onRequestSelect={handleRequestSelect}
                    savedRevision={savedRevision}
                    isLoading={getData.isLoading}
                    siteMenuItems={getData.rawData.siteMenuItems}
                    lang={prop.lang}
                    formData={formData}
                    action={getData.rawData.actions}
                    canUpdate={canUpdate}
                    isSortMode={isSortMode}
                    onSortModeChange={handleSortModeChange}
                />
                <RenderRightBox
                    theme={prop.theme}
                    selectedItemEdit={selectedItemEdit}
                    formData={formData}
                    siteMenuItems={getData.rawData.siteMenuItems}
                    windowTarget={getData.rawData.windowTarget}
                    menuUrlType={getData.rawData.menuUrlType}
                    modulePageType={getData.rawData.modulePageType}
                    bannerDict={getData.rawData.bannerDict}
                    moduleDisplayStyle={getData.rawData.moduleDisplayStyle}
                    categorySets={getData.rawData.categorySets}
                    timelineMap={getData.rawData.timelineMap}
                    surveyMap={getData.rawData.surveyMap}
                    tagSets={getData.rawData.tagSets}
                    pageSets={getData.rawData.pageSets}
                    action={getData.rawData.actions}
                    onSave={handleSave}
                    onCancel={handleCancelEdit}
                    canUpdate={canUpdate}
                    isSortMode={isSortMode}
                />
            </div>
            {pendingAction && (
                <UnsavedDialog
                    title={dialogTitle}
                    isExecuting={getData.rawData.actions.isExecuting}
                    onSave={() => void handleConfirmSave()}
                    onDiscard={handleDiscard}
                    onCancel={handleCancelDialog}
                />
            )}
        </FormShellComp>
    );
};
// #endregion

// #region Section
/** 未儲存草稿確認視窗，提供儲存、不儲存與取消。 */
const UnsavedDialog = (prop: UnsavedDialogProp) =>
{
    return (
        <div role="dialog" aria-modal="true" aria-labelledby="unsaved-title" className="modal d-block" tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered" style={{ zIndex: 1051 }}>
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 id="unsaved-title" className="modal-title">內容尚未儲存</h5>
                    </div>
                    <div className="modal-body">
                        <p className="mb-0">「{prop.title}」已修改，請選擇後續操作。</p>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-custom btn-sm btn-rounded" disabled={prop.isExecuting} onClick={prop.onSave}>儲存</button>
                        <button type="button" className="btn btn-custom btn-sm btn-rounded" disabled={prop.isExecuting} onClick={prop.onDiscard}>不儲存</button>
                        <button type="button" className="btn btn-custom btn-sm btn-rounded" disabled={prop.isExecuting} onClick={prop.onCancel}>取消</button>
                    </div>
                </div>
            </div>
            <div className="modal-backdrop show"></div>
        </div>
    );
};
// #endregion

// #region Private
/** 取得目前編輯項目的顯示名稱。 */
const resolveEditTitle = (target: SiteMenuEditTarget): string =>
{
    if (!target) return "目前";
    return target.type === "site" ? target.title : target.item.name;
};

/** 判斷兩個編輯目標是否代表同一筆資料。 */
const isSameEditTarget = (current: SiteMenuEditTarget, next: SiteMenuEditTarget): boolean =>
{
    if (!current || !next) return current === next;
    if (current.type !== next.type) return false;
    if (current.type === "site") return true;
    return current.item.id === (next.type === "menu" ? next.item.id : 0);
};

/** 建立目前目標範圍的穩定 Dirty 比較字串。 */
const createTargetSnapshot = (data: SiteMenuFormModel, target: SiteMenuEditTarget): string =>
{
    if (!target) return "";
    const value = target.type === "site" ? createSiteInfoSnapshot(data) : createMenuItemSnapshot(data, target.item.id);
    return JSON.stringify(value ?? null);
};

/** 建立網站整體資訊可編輯範圍的 Snapshot。 */
const createSiteInfoSnapshot = (data: SiteMenuFormModel): object =>
{
    return {
        SiteIndex: data.SiteIndex,
        GoogleAnalytics: data.GoogleAnalytics,
        Enable: data.Enable,
        DefaultLang: data.DefaultLang,
        SupportLangs: data.SupportLangs,
        SiteMenuIndexInfo: createSiteInfoRowsSnapshot(data),
    };
};

/** 建立單一選單可編輯欄位與 SubDetail 的 Snapshot。 */
const createMenuItemSnapshot = (data: SiteMenuFormModel, rowId: number): object | null =>
{
    const item = findTargetItem(data, rowId);
    if (!item) return null;
    return {
        RowId: item.RowId,
        ParentRowId: item.ParentRowId,
        DisplayOrder: item.DisplayOrder,
        ItemSiteUrl: item.ItemSiteUrl,
        ItemType: item.ItemType,
        WindowTarget: item.WindowTarget,
        Titles: createTitleRowsSnapshot(getRelatedTitleRows(data, item.RowId)),
        Url: createUrlSnapshot(item._SiteMenu_Item_Url),
        Module: createModuleSnapshot(item._SiteMenu_Item_Module),
    };
};

/** 建立網站多語資訊的穩定比較資料。 */
const createSiteInfoRowsSnapshot = (data: SiteMenuFormModel): object[] =>
{
    const rows = (data._SiteMenu_IndexInfo ?? []).filter(row => row.SiteIndex === data.SiteIndex);
    return rows.map(row => ({
        Lang: String(row.Lang ?? "").toLowerCase(),
        Title: row.Title ?? "",
        Description: row.Description ?? "",
        SiteHeader: row.SiteHeader ?? "",
        SiteFooter: row.SiteFooter ?? "",
        Keyword: row.Keyword ?? "",
        BannerId: row.BannerId ?? "",
    })).filter(hasSnapshotContent).sort(compareSnapshotLang);
};

/** 依 ItemRowId 從完整 Graph 取得選單標題，避免巢狀位置修正造成 Dirty。 */
const getRelatedTitleRows = (data: SiteMenuFormModel, itemRowId: unknown): SiteMenuItemTitle[] =>
{
    return (data._SiteMenu_Item ?? []).flatMap(item => item._SiteMenu_Item_Title ?? [])
        .filter(row => Number(row.ItemRowId ?? 0) === Number(itemRowId ?? 0));
};

/** 建立選單標題的穩定比較資料，忽略系統補齊的空白預設列。 */
const createTitleRowsSnapshot = (rows: SiteMenuItemTitle[]): object[] =>
{
    const rowMap = new Map<string, { Lang: string; Title: string; IsShowOnMenu: boolean; }>();
    for (const row of rows)
    {
        const lang = String(row.Lang ?? "").toLowerCase();
        const next = { Lang: lang, Title: String(row.Title ?? ""), IsShowOnMenu: row.IsShowOnMenu ?? true };
        const current = rowMap.get(lang);
        if (!current || (!current.Title.trim() && next.Title.trim())) rowMap.set(lang, next);
    }
    return Array.from(rowMap.values()).filter(row => row.Title.trim() || !row.IsShowOnMenu).sort(compareSnapshotLang);
};

/** 建立超連結 SubDetail 的穩定比較資料。 */
const createUrlSnapshot = (row?: SiteMenuItemUrl | null): object =>
{
    return { RedirectType: Number(row?.RedirectType) === 2 ? 2 : 1, RedirectUrl: String(row?.RedirectUrl ?? "") };
};

/** 建立模型 SubDetail 的穩定比較資料。 */
const createModuleSnapshot = (row?: SiteMenuItemModule | null): object =>
{
    return {
        BannerId: row?.BannerId ?? "",
        PageType: Number(row?.PageType ?? 0),
        ModuleProgId: String(row?.ModuleProgId ?? ""),
        ModuleOptions: String(row?.ModuleOptions ?? ""),
    };
};

/** 判斷網站語系資料是否包含使用者可編輯內容。 */
const hasSnapshotContent = (row: Record<string, unknown>): boolean =>
{
    return Object.entries(row).some(([key, value]) => key !== "Lang" && Boolean(String(value ?? "").trim()));
};

/** 依語系代碼固定 Snapshot 陣列順序。 */
const compareSnapshotLang = (left: { Lang?: string; }, right: { Lang?: string; }): number =>
{
    return String(left.Lang ?? "").localeCompare(String(right.Lang ?? ""));
};

/** 依 RowId 取得目前 FormModel 中的選單項目。 */
const findTargetItem = (data: SiteMenuFormModel, rowId: number) =>
{
    return (data._SiteMenu_Item ?? []).find(item => Number(item.RowId) === Number(rowId)) ?? null;
};

/** 複製表單資料，避免 Snapshot 與編輯資料共用參考。 */
const cloneFormData = (data: SiteMenuFormModel | null | undefined): SiteMenuFormModel =>
{
    return data ? structuredClone(data) : {};
};
// #endregion
