// src/Features/Pages/Server/Scaffold/Content/GridAdjustCellEnhance.tsx
import { useCallback, useMemo } from "react";
import { DefaultLang, type Lang } from "@/SysCore/i18n/lang";
import type { ColumnConfig, GridProps, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import clsx from "clsx";

/** 多語系文字型別（共用） */
export type LangText = Partial<Record<Lang, string>>;

/** 取得多語系文字（找不到就 fallback DefaultLang，再不行回 fallbackText） */
export const getLangText = (lang: Lang, map: LangText, fallbackText: string): string =>
{
    return map[lang] ?? map[DefaultLang] ?? fallbackText;
};

/** i18n：ActionCell 共用字串 */
const GRID_ACTIONCELL_I18N = {
    title: { "zh-tw": "動作", en: "Actions" } as LangText,
    noPermission: { "zh-tw": "無此權限", en: "No permission" } as LangText,
} as const;

/** i18n：CRUD 共用字串（後台所有 Grid 共用） */
export const GRID_CRUD_I18N = {
    edit: { "zh-tw": "修改", en: "Edit" } as LangText,
    delete: { "zh-tw": "刪除", en: "Delete" } as LangText,
    gotoEdit: { "zh-tw": "前往修改", en: "Go to edit" } as LangText,
    confirmDelete: { "zh-tw": "確定要刪除嗎？", en: "Are you sure you want to delete?" } as LangText,
} as const;

export type GridConfirmOptions = {
    /** 顯示文字（目前原生 confirm 只用得到 message） */
    message: string;
    /** 先保留：未來換成客製 UI 時可用 */
    title?: string;
};

export type GridConfirmFn = (opt: GridConfirmOptions) => boolean | Promise<boolean>;

/**
 * 預設確認 UI：原生 window.confirm
 * - 未來要改成客製 Dialog：改這支或用 enhance 的 opt.confirm 注入
 */
export const defaultGridConfirm: GridConfirmFn = (opt) =>
{
    if (typeof window === "undefined") return true;
    return window.confirm(opt.message);
};

export type GridAdjustActionCtx<TItem> = {
    lang: Lang;
    item: TItem;
    internalId: string;
    can: (mask: number) => boolean;
    notify: (msg: string) => void;
    /** 互動確認（目前預設用 window.confirm；未來可替換成客製 Modal） */
    confirm: (opt: GridConfirmOptions) => Promise<boolean>;
};

export type GridAdjustAction<TItem> = {
    id: string;
    label: LangText;
    ariaLabel: LangText;
    /** FontAwesome icon class（例：fa-edit / fa-trash-alt）。未提供就依 id 推導 */
    iconClassName?: string;
    /** 按鈕額外 class（例：Ipencil / Itrash）。未提供就依 id 推導 */
    buttonClassName?: string;
    /** 權限 bitmask（沒有就代表不用權限檢查） */
    requiredMask?: number;
    /** 額外禁用原因（回傳 string 表示 disabled；回 null 表示可用） */
    getDisabledReason?: (ctx: GridAdjustActionCtx<TItem>) => string | null;
    /** 點擊行為 */
    onClick: (ctx: GridAdjustActionCtx<TItem>) => void | Promise<void>;
};

/** 只要求 IsSuccess：避免把 API 型別綁死在 Grid 元件內（ApiResponse 也可直接相容） */
export type ApiResponseLike = { IsSuccess: boolean };

/** CRUD actions 依賴（可以直接塞 adapter hooks 的 deleteAsync） */
export type GridCrudDeps = {
    /** 點擊 edit 的行為（通常是 navigate 到 /Form/:id） */
    onEdit: (internalId: string) => void;
    /** 刪除 API（回傳只要有 IsSuccess 即可） */
    deleteAsync: (internalId: string) => Promise<ApiResponseLike>;
    /** 刪除成功後要做的事（通常是 refetch） */
    afterDelete?: () => Promise<void>;
    /** 權限 mask（沒有就不做權限檢查） */
    editMask?: number;
    deleteMask?: number;
    /** 覆寫 CRUD 的 i18n（不傳就走預設） */
    i18n?: Partial<typeof GRID_CRUD_I18N>;
};

/** 產生刪除確認文字（先不帶 title；未來擴充再加參數） */
export const buildDeleteConfirmMessage = (lang: Lang, i18n?: Partial<typeof GRID_CRUD_I18N>): string =>
{
    const map = i18n?.confirmDelete ?? GRID_CRUD_I18N.confirmDelete;
    return getLangText(lang, map, "確定要刪除嗎？");
};

/**
 * 建立 Grid 的共用 CRUD actions（Edit/Delete）
 * - 未來要加 Invalid/Publish… 建議也在這裡擴充
 */
export const createGridCrudActions = <TItem,>(deps: GridCrudDeps): GridAdjustAction<TItem>[] =>
{
    // 宣告變數
    const i18n = { ...GRID_CRUD_I18N, ...(deps.i18n ?? {}) };

    // 執行：Edit
    const editAction: GridAdjustAction<TItem> = {
        id: "edit",
        label: i18n.edit,
        ariaLabel: i18n.gotoEdit,
        requiredMask: deps.editMask,
        onClick: (ctx) => { deps.onEdit(ctx.internalId); },
    };

    // 執行：Delete
    const deleteAction: GridAdjustAction<TItem> = {
        id: "delete",
        label: i18n.delete,
        ariaLabel: i18n.delete,
        requiredMask: deps.deleteMask,
        onClick: async (ctx) =>
        {
            // 刪除前確認（目前預設 window.confirm；之後可替換成客製 Dialog）
            const message = buildDeleteConfirmMessage(ctx.lang, i18n);
            const ok = await ctx.confirm({ message });
            if (!ok) return;

            const env = await deps.deleteAsync(ctx.internalId);
            if (!env.IsSuccess) return;

            if (deps.afterDelete) await deps.afterDelete();
        },
    };

    return [editAction, deleteAction];
};

export type EnhanceAdjustOptions<TItem> = {
    lang: Lang;
    rawList: readonly TItem[];
    actions: readonly GridAdjustAction<TItem>[];
    /** 從 item 取得 internalId */
    getInternalId: (item: TItem) => string;
    /** 權限判斷入口（未提供就預設全允許） */
    can?: (mask: number) => boolean;
    /** 沒權限/disabled 時的提示（未提供就不提示） */
    notifyNoPermission?: (msg: string) => void;
    /** 點擊前確認（可替換成客製 UI） */
    confirm?: GridConfirmFn;
    /** 欄位設定 */
    colKey?: string;
    colTitle?: LangText;
    /** row → item 對應（預設用 rowIndex 對 rawList[index]） */
    getRowItem?: (rowIndex: number, row: GridRow, rawList: readonly TItem[]) => TItem | null;
};

type ActionViewItem<TItem> = {
    a: GridAdjustAction<TItem>;
    icon: string;
    buttonName: string;
    label: string;
    ariaLabel: string;
    isDisabled: boolean;
    reason: string;
};

/** 依 action id 推導 icon class */
const resolveIconName = (id: string): string =>
{
    if (id === "edit") return "fa-edit";
    if (id === "delete") return "fa-trash-alt";
    return "fa-cog";
};

/** 依 action id 推導 button class */
const resolveButtonName = (id: string): string =>
{
    if (id === "edit") return "Ipencil";
    if (id === "delete") return "Itrash";
    return "";
};

/** 解析 disabled 原因（權限/自訂 reason） */
const resolveDisabledReason = <TItem,>(lang: Lang, a: GridAdjustAction<TItem>, ctx: GridAdjustActionCtx<TItem>): string | null =>
{
    const byPerm = a.requiredMask ? ctx.can(a.requiredMask) : true;
    if (!byPerm) return getLangText(lang, GRID_ACTIONCELL_I18N.noPermission, "無此權限");
    return a.getDisabledReason ? a.getDisabledReason(ctx) : null;
};

/** 產生 ActionCell 的 view model */
const buildActionView = <TItem,>(lang: Lang, actions: readonly GridAdjustAction<TItem>[], ctx: GridAdjustActionCtx<TItem>): ActionViewItem<TItem>[] =>
{
    return actions.map((a) =>
    {
        const reason = resolveDisabledReason(lang, a, ctx);
        const isDisabled = Boolean(reason);
        const label = getLangText(lang, a.label, "");
        const ariaLabel = getLangText(lang, a.ariaLabel, label);

        const iconName = a.iconClassName ?? resolveIconName(a.id);
        const buttonName = a.buttonClassName ?? resolveButtonName(a.id);
        const icon = clsx("far", iconName);

        return { a, icon, buttonName, label, ariaLabel, isDisabled, reason: reason ?? "" };
    });
};

/** 建立 ActionCell context（把 can/notify/confirm 統一封裝） */
const useGridAdjustActionCtx = <TItem,>(props: {
    lang: Lang;
    item: TItem;
    internalId: string;
    can?: (mask: number) => boolean;
    notifyNoPermission?: (msg: string) => void;
    confirm?: GridConfirmFn;
}): GridAdjustActionCtx<TItem> =>
{
    // 宣告變數
    const can = useCallback((mask: number) => props.can?.(mask) ?? true, [props.can]);
    const notify = useCallback((msg: string) => props.notifyNoPermission?.(msg), [props.notifyNoPermission]);
    const confirm = useCallback(async (opt: GridConfirmOptions) =>
    {
        const fn = props.confirm ?? defaultGridConfirm;
        return await Promise.resolve(fn(opt));
    }, [props.confirm]);

    // return
    return useMemo(() => ({ lang: props.lang, item: props.item, internalId: props.internalId, can, notify, confirm }),
        [props.lang, props.item, props.internalId, can, notify, confirm]);
};

/** 建立 ActionCell view（把 action → 按鈕顯示資料） */
const useGridAdjustActionView = <TItem,>(lang: Lang, actions: readonly GridAdjustAction<TItem>[], ctx: GridAdjustActionCtx<TItem>): ActionViewItem<TItem>[] =>
{
    return useMemo(() => buildActionView(lang, actions, ctx), [lang, actions, ctx]);
};

const ActionCell = <TItem,>(props: {
    lang: Lang;
    item: TItem;
    internalId: string;
    actions: readonly GridAdjustAction<TItem>[];
    can?: (mask: number) => boolean;
    notifyNoPermission?: (msg: string) => void;
    confirm?: GridConfirmFn;
}) =>
{
    // 宣告變數
    const ctx = useGridAdjustActionCtx({
        lang: props.lang,
        item: props.item,
        internalId: props.internalId,
        can: props.can,
        notifyNoPermission: props.notifyNoPermission,
        confirm: props.confirm,
    });
    const view = useGridAdjustActionView(props.lang, props.actions, ctx);

    const onClickGuard = useCallback(async (item: ActionViewItem<TItem>) =>
    {
        if (!item.isDisabled) { await item.a.onClick(ctx); return; }
        if (item.reason) ctx.notify(item.reason);
    }, [ctx]);

    // return
    return (
        <div className={clsx("all-btn", "Edit", "Icon")}>
            {view.map((item) => (
                <a
                    key={item.a.id}
                    id={item.a.id}
                    className="icon"
                    href="#"
                    aria-disabled={item.isDisabled}
                    aria-label={item.ariaLabel}
                    onClick={(e) => { e.preventDefault(); void onClickGuard(item); }}
                >
                    <button
                        type="button"
                        className={clsx(item.buttonName, "btn", "btn-ctm", "btn-ctm-rounded", clsx(item.isDisabled ? "is-disabled" : ""))}
                        data-bs-toggle="tooltip"
                        title={item.isDisabled ? item.reason : item.label}
                    >
                        <i className={item.icon} aria-hidden="true" />
                    </button>
                </a>
            ))}
        </div>
    );
};

/** Enhance：附加 __adjust__ 欄位（只做注入，不做資料加工） */
export const enhanceGridWithAdjustCell = <TItem,>(gridProps: GridProps, opt: EnhanceAdjustOptions<TItem>): GridProps =>
{
    // 宣告變數
    const colKey = opt.colKey ?? "__adjust__";
    const title = getLangText(opt.lang, opt.colTitle ?? GRID_ACTIONCELL_I18N.title, "動作");
    const hasAdjust = gridProps.columns.some(c => c.key === colKey);

    // 執行 function：已存在 / 無 rows 就不處理
    if (hasAdjust) return gridProps;
    if (gridProps.rows.length === 0) return gridProps;

    const adjustCol: ColumnConfig = { key: colKey, title };
    const newColumns: ColumnConfig[] = [...gridProps.columns, adjustCol];
    const getRowItem = opt.getRowItem ?? ((idx) => opt.rawList[idx] ?? null);

    const newRows: GridRow[] = gridProps.rows.map((row, idx) =>
    {
        const item = getRowItem(idx, row, opt.rawList);
        const cell: RowCell = {
            col: adjustCol,
            content: item
                ? (
                    <ActionCell
                        lang={opt.lang}
                        item={item}
                        internalId={opt.getInternalId(item)}
                        actions={opt.actions}
                        can={opt.can}
                        notifyNoPermission={opt.notifyNoPermission}
                        confirm={opt.confirm}
                    />
                )
                : null,
        };
        return { ...row, cells: [...row.cells, cell] };
    });

    // return
    return { ...gridProps, columns: newColumns, rows: newRows };
};
