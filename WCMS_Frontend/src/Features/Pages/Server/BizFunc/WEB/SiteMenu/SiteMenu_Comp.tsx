import type { FormCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data";
import { FormShellComp } from "@/Features/Pages/Server/Scaffold/Content/FormShell_Comp";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { type Lang } from "@/SysCore/i18n/lang";
import type { components } from "@/types/api";
import { useCallback, useEffect, useMemo, useState } from "react";
import "react-nestable/dist/styles/index.css";
import { type SiteMenuEditTarget, useSiteMenuFetchData } from "./SiteMenu_Hook";
import { RenderLeftBox } from "./SubComponents/RenderLeftBox_Comp";
import { RenderRightBox } from "./SubComponents/RenderRightBox_Comp";

// #region Property

type SiteMenuSet = components["schemas"]["SiteMenuSet_DTO"];

type SiteMenu_Item_Url = components["schemas"]["SiteMenu_Item_Url_DTO"];

type SiteMenu_Item_Module = components["schemas"]["SiteMenu_Item_Module_DTO"];

type UnsavedDialogProp = {
    title: string;
    isExecuting: boolean;
    onSave: () => void;
    onBack: () => void;
};
// #endregion


// #region Public

/** 網站選單維護：集中控管右側草稿、儲存、取消與切換攔截。 */
export const SiteMenu_Comp = (prop: { theme: IBETheme; lang: Lang; }) =>
{
    const getData = useSiteMenuFetchData({ lang: prop.lang });
    const formData = getData.rawData.formData;
    const [selectedItemEdit, setSelectedItemEdit] = useState<SiteMenuEditTarget>(null);
    const [editSnapshot, setEditSnapshot] = useState<SiteMenuSet | null>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [savedRevision, setSavedRevision] = useState(0);
    const [isSortMode, setIsSortMode] = useState(false);
    const canUpdate = getData.rawData.permission.canUpdate;

    const hasUnsavedChanges = useMemo(() =>
    {
        if (!selectedItemEdit || !editSnapshot) return false;
        return createSnapshot(formData.data) !== createSnapshot(editSnapshot);
    }, [editSnapshot, formData.data, selectedItemEdit]);

    const dialogTitle = useMemo(() =>
    {
        return resolveEditTitle(selectedItemEdit);
    }, [selectedItemEdit]);

    /** 關閉右側編輯狀態與草稿快照。 */
    const closeEditor = useCallback(() =>
    {
        setSelectedItemEdit(null);
        setEditSnapshot(null);
    }, []);

    /** 進入指定項目編輯，並保存進入當下的完整表單快照。 */
    const activateTarget = useCallback((target: SiteMenuEditTarget) =>
    {
        setSelectedItemEdit(target);
        setEditSnapshot(cloneFormData(formData.data));
    }, [formData.data]);

    /** 左側要求切換時，若目前有草稿則先阻擋並顯示確認視窗。 */
    const handleRequestSelect = useCallback((target: SiteMenuEditTarget) =>
    {
        if (!canUpdate || isSortMode) return;
        if (hasUnsavedChanges)
        {
            setConfirmOpen(true);
            return;
        }
        activateTarget(target);
    }, [activateTarget, canUpdate, hasUnsavedChanges, isSortMode]);

    /** 儲存目前草稿；後端成功後才更新左側並關閉右側表單。 */
    const handleSave = useCallback(async (): Promise<boolean> =>
    {
        if (!canUpdate || isSortMode || !selectedItemEdit) return false;
        const isSaved = selectedItemEdit.type === "site"
            ? await getData.rawData.actions.onSaveSiteInfo()
            : await getData.rawData.actions.onSaveMenuItem(selectedItemEdit.item);
        if (!isSaved) return false;
        setSavedRevision((prev) => prev + 1);
        closeEditor();
        return true;
    }, [canUpdate, closeEditor, getData.rawData.actions, isSortMode, selectedItemEdit]);

    /** 取消編輯：還原進入前快照並關閉右側，不送出後端。 */
    const handleCancelEdit = useCallback(() =>
    {
        formData.setFormData(cloneFormData(editSnapshot));
        closeEditor();
    }, [closeEditor, editSnapshot, formData]);

    /** Modal 儲存目前草稿，成功後關閉 Modal 與右側表單。 */
    const handleConfirmSave = useCallback(async () =>
    {
        const isSaved = await handleSave();
        if (isSaved) setConfirmOpen(false);
    }, [handleSave]);

    /** 切換排序模式；有右側未儲存內容時先阻擋。 */
    const handleSortModeChange = useCallback((active: boolean): boolean =>
    {
        if (!canUpdate) return false;
        if (active && hasUnsavedChanges)
        {
            setConfirmOpen(true);
            return false;
        }

        setIsSortMode(active);
        if (active) closeEditor();
        return true;
    }, [canUpdate, closeEditor, hasUnsavedChanges]);

    useEffect(() =>
    {
        if (canUpdate) return;
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
            {confirmOpen && (
                <UnsavedDialog
                    title={dialogTitle}
                    isExecuting={getData.rawData.actions.isExecuting}
                    onSave={() => void handleConfirmSave()}
                    onBack={() => setConfirmOpen(false)}
                />
            )}
        </FormShellComp>
    );
};
// #endregion


// #region Section

/** 未儲存草稿確認視窗，只允許儲存或返回原編輯畫面。 */
const UnsavedDialog = (prop: UnsavedDialogProp) =>
{
    return (
        <div role="dialog" aria-modal="true" aria-labelledby="unsaved-title" className="modal d-block" tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered" style={{zIndex: 1051}}>
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 id="unsaved-title" className="modal-title">內容尚未儲存</h5>
                    </div>
                    <div className="modal-body">
                        <p className="mb-0">「{prop.title}」已修改是否儲存？</p>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-custom btn-sm btn-rounded" disabled={prop.isExecuting} onClick={prop.onSave}>儲存</button>
                        <button type="button" className="btn btn-custom btn-sm btn-rounded" disabled={prop.isExecuting} onClick={prop.onBack}>返回</button>
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

/** 建立可比較的表單資料字串，排除右側掛載時自動建立的空白預設列。 */
const createSnapshot = (data: SiteMenuSet | null | undefined): string =>
{
    return JSON.stringify(normalizeCompareData(data));
};

/** 正規化 dirty 比較資料，避免系統初始化被判定為使用者修改。 */
const normalizeCompareData = (data: SiteMenuSet | null | undefined): SiteMenuSet | null =>
{
    if (!data) return null;
    const next = structuredClone(data);
    next.SiteMenu_Item_Url = normalizeUrlRows(next.SiteMenu_Item_Url ?? []);
    next.SiteMenu_Item_Module = normalizeModuleRows(next.SiteMenu_Item_Module ?? []);
    return next;
};

/** 移除未輸入內容的預設 URL row，並統一 RedirectType 預設值。 */
const normalizeUrlRows = (rows: SiteMenu_Item_Url[]): SiteMenu_Item_Url[] =>
{
    return rows
        .map((row) => ({ ...row, RedirectType: normalizeRedirectType(row.RedirectType) }))
        .filter((row) => !isEmptyDefaultUrlRow(row));
};

/** 判斷 URL row 是否只是右側掛載時建立的空白預設資料。 */
const isEmptyDefaultUrlRow = (row: SiteMenu_Item_Url): boolean =>
{
    const redirectUrl = String(row.RedirectUrl ?? "").trim();
    return normalizeRedirectType(row.RedirectType) === 1 && !redirectUrl;
};

/** 將未初始化或不合法的 RedirectType 視為預設外部連結。 */
const normalizeRedirectType = (value: unknown): number =>
{
    return Number(value) === 2 ? 2 : 1;
};

/** 移除未輸入內容的預設 Module row，保留真正有設定的模型資料。 */
const normalizeModuleRows = (rows: SiteMenu_Item_Module[]): SiteMenu_Item_Module[] =>
{
    return rows.filter((row) => hasModuleSetting(row));
};

/** 判斷 Module row 是否包含使用者可辨識的設定內容。 */
const hasModuleSetting = (row: SiteMenu_Item_Module): boolean =>
{
    const hasPageType = Number(row.PageType ?? 0) !== 0;
    const hasProgram = Boolean(String(row.ModuleProgId ?? "").trim());
    const hasOptions = Boolean(String(row.ModuleOptions ?? "").trim());
    const hasBanner = Boolean(String(row.BannerId ?? "").trim());
    return hasPageType || hasProgram || hasOptions || hasBanner;
};

/** 複製表單資料，避免草稿與進入編輯前資料共用參考。 */
const cloneFormData = (data: SiteMenuSet | null | undefined): SiteMenuSet | null =>
{
    if (!data) return null;
    return structuredClone(data);
};
// #endregion